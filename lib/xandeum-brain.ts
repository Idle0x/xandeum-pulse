import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---
// 1. FRESH PUBLIC SWARM (User Provided List - Version 1.2.0)
const PUBLIC_NODES = [
  "http://77.53.105.9:6000",
  "http://66.94.98.124:6000",
  "http://147.93.179.46:6000",
  "http://157.173.101.57:6000",
  "http://23.227.189.30:6000",
  "http://62.171.138.27:6000",
  "http://45.84.138.15:6000",
  "http://89.123.115.79:6000",
  "http://216.234.134.5:23048",
  "http://152.53.236.91:6000",
  "http://77.53.105.5:6000",
  "http://173.249.42.124:6000",
  "http://217.76.50.220:3261",
  "http://89.123.115.81:6000",
  "http://161.97.185.116:6000",
  "http://77.53.105.6:6000",
  "http://62.171.135.107:6000",
  "http://77.53.105.7:6000",
  "http://77.53.105.8:6000",
  "http://45.151.122.71:6000",
  "http://45.151.122.60:6000",
  "http://84.21.171.129:6000",
  "http://100.79.135.83:6000",
  "http://152.53.155.15:6000",
  "http://94.255.130.90:12833"
];

const TIMEOUT_RPC = 6000;
const TIMEOUT_CREDITS = 8000;

const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_CREDITS_DEVNET  = 'https://podcredits.xandeum.network/api/pods-credits';

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

// --- INTERFACES & HELPERS ---
export interface EnrichedNode {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  isUntracked?: boolean;
  network: 'MAINNET' | 'DEVNET' | 'UNKNOWN';
  storage_used: number;      
  storage_committed: number; 
  credits: number | null; 
  health: number;
  healthBreakdown: { uptime: number; version: number; reputation: number | null; storage: number; };
  location: { lat: number; lon: number; countryName: string; countryCode: string; city: string; };
  rank?: number;        
  health_rank?: number;
  rpc_source?: string;
}

export const cleanSemver = (v: string) => v ? v.split('-')[0].replace(/[^0-9.]/g, '') : '0.0.0';

export const compareVersions = (v1: string, v2: string) => {
  const p1 = cleanSemver(v1).split('.').map(Number);
  const p2 = cleanSemver(v2).split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

export const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) => 
  100 / (1 + Math.exp(-steepness * (value - midpoint)));

export const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
    if (median === 0) return value > 0 ? maxScore : 0;
    return Math.min(maxScore, (maxScore / 2) * Math.log2((value / median) + 1));
};

export const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedCleanVersions: string[]) => {
    const cleanNode = cleanSemver(nodeVersion);
    const cleanConsensus = cleanSemver(consensusVersion);
    if (compareVersions(cleanNode, cleanConsensus) >= 0) return 100;
    const consensusIndex = sortedCleanVersions.indexOf(cleanConsensus);
    const nodeIndex = sortedCleanVersions.indexOf(cleanNode);
    if (nodeIndex === -1) return 0;
    const distance = nodeIndex - consensusIndex;
    if (distance <= 0) return 100; 
    if (distance === 1) return 90;
    if (distance === 2) return 70;
    if (distance === 3) return 50;
    if (distance === 4) return 30;
    if (distance === 5) return 10;
    return Math.max(0, 10 - (distance - 5));
};

export const calculateVitalityScore = (
    storageCommitted: number, storageUsed: number, uptimeSeconds: number, version: string, 
    consensusVersion: string, sortedCleanVersions: string[], medianCredits: number, 
    credits: number | null, medianStorage: number
) => {
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 } };
  
  const uptimeDays = uptimeSeconds / 86400;
  let uptimeScore = calculateSigmoidScore(uptimeDays, 7, 0.2);
  if (uptimeDays < 1) uptimeScore = Math.min(uptimeScore, 20); 

  const baseStorageScore = calculateLogScore(storageCommitted, medianStorage, 100);
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  const totalStorageScore = baseStorageScore + utilizationBonus;

  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  let total = 0;
  let reputationScore: number | null = null;

  if (credits !== null && medianCredits > 0) {
      reputationScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
      total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15));
  } else {
      total = Math.round((uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20));
      reputationScore = null; 
  }

  return {
      total: Math.max(0, Math.min(100, total)),
      breakdown: { uptime: Math.round(uptimeScore), version: Math.round(versionScore), reputation: reputationScore, storage: Math.round(totalStorageScore) }
  };
};

const AXIOS_CONFIG_CREDITS = {
    timeout: TIMEOUT_CREDITS,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'application/json, text/plain, */*' }
};

// --- AGGRESSIVE PUBLIC FETCHING (NO DEDUPLICATION) ---
async function fetchRawData() {
  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  
  // Helper to ensure correct URL format
  const formatUrl = (node: string) => {
      // If it already has a port but no /rpc, add it. 
      // NOTE: Your list has mixed ports (6000, 23048, etc), so we just append /rpc
      return node.endsWith('/rpc') ? node : `${node}/rpc`;
  };

  console.log(`[PULSE] Broadcasting to ${PUBLIC_NODES.length} Public Nodes...`);

  // 1. Launch requests to EVERYONE
  const requests = PUBLIC_NODES.map(url => 
    axios.post(formatUrl(url), payload, { timeout: TIMEOUT_RPC })
      .then(res => ({
        status: 'fulfilled' as const,
        url,
        pods: res.data?.result?.pods || []
      }))
      .catch(err => ({
        status: 'rejected' as const,
        url,
        error: err.message
      }))
  );

  // 2. Wait for all results
  const results = await Promise.all(requests);

  // 3. AGGREGATE EVERYTHING (Pushing duplicates intentionally)
  const allPods: any[] = [];
  const successfulRPCs: string[] = [];

  results.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.pods)) {
      if (r.pods.length > 0) {
        successfulRPCs.push(r.url);
        // Tag the pod with its source so you can distinguish duplicates in UI
        const labeledPods = r.pods.map((p: any) => ({ ...p, rpc_source: r.url }));
        
        // PUSH ALL OF THEM
        allPods.push(...labeledPods);
      }
    } else {
        // Silent fail to keep logs clean, or uncomment to debug specific IPs
        // console.warn(`[PULSE] Failed ${r.url}`);
    }
  });

  console.log(`[PULSE] Connected to: ${successfulRPCs.length}/${PUBLIC_NODES.length} RPCs`);
  console.log(`[PULSE] Total RAW Nodes (Includes Duplicates): ${allPods.length}`);

  let sourceLabel = 'No Connection';
  if (successfulRPCs.length > 0) {
    sourceLabel = `Swarm (${successfulRPCs.length} Active)`;
  }

  return { pods: allPods, source: sourceLabel };
}

async function fetchCredits() {
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_CREDITS_MAINNET, AXIOS_CONFIG_CREDITS),
        axios.get(API_CREDITS_DEVNET, AXIOS_CONFIG_CREDITS)
    ]);
    const parseData = (res: PromiseSettledResult<any>) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data;
        if (d?.pods_credits && Array.isArray(d.pods_credits)) return d.pods_credits;
        if (Array.isArray(d)) return d;
        return [];
    };
    return { mainnet: parseData(mainnetRes), devnet: parseData(devnetRes) };
}

async function resolveLocations(ips: string[]) {
  const missing = ips.filter(ip => !geoCache.has(ip));
  if (missing.length > 0) {
    try {
      for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);
        const res = await axios.post('http://ip-api.com/batch', chunk.map(ip => ({ query: ip, fields: "lat,lon,country,countryCode,city,query" })), { timeout: 3000 });
        res.data.forEach((d: any) => {
          if (d.lat && d.lon) geoCache.set(d.query, { lat: d.lat, lon: d.lon, country: d.country, countryCode: d.countryCode, city: d.city });
        });
      }
    } catch (e) { /* API Fail */ }
    missing.forEach(ip => {
      if (!geoCache.has(ip)) {
        const geo = geoip.lookup(ip);
        if (geo) geoCache.set(ip, { lat: geo.ll[0], lon: geo.ll[1], country: new Intl.DisplayNames(['en'], { type: 'region' }).of(geo.country) || geo.country, countryCode: geo.country, city: geo.city || 'Unknown Node' });
        else geoCache.set(ip, { lat: 0, lon: 0, country: 'Private Network', countryCode: 'XX', city: 'Hidden' });
      }
    });
  }
}

// --- MAIN EXPORT ---
export async function getNetworkPulse(): Promise<{ nodes: EnrichedNode[], stats: any }> {
  const [{ pods: rawPods, source }, creditsData] = await Promise.all([ fetchRawData(), fetchCredits() ]);
  
  // Note: We return empty if 0, but don't crash unless strictly necessary
  if (!rawPods) throw new Error("Network Unreachable");

  const mainnetMap = new Map<string, number>();
  const devnetMap = new Map<string, number>();
  
  if (Array.isArray(creditsData.mainnet)) {
      creditsData.mainnet.forEach((c: any) => {
          const val = parseFloat(c.credits || c.amount || '0');
          const key = c.pod_id || c.pubkey || c.node;
          if (key && !isNaN(val)) mainnetMap.set(key, val);
      });
  }
  if (Array.isArray(creditsData.devnet)) {
      creditsData.devnet.forEach((c: any) => {
          const val = parseFloat(c.credits || c.amount || '0');
          const key = c.pod_id || c.pubkey || c.node;
          if (key && !isNaN(val)) devnetMap.set(key, val);
      });
  }

  const mainnetValues = Array.from(mainnetMap.values()).sort((a, b) => a - b);
  const devnetValues = Array.from(devnetMap.values()).sort((a, b) => a - b);
  const medianMainnet = mainnetValues.length ? mainnetValues[Math.floor(mainnetValues.length / 2)] : 0;
  // Use rawPods for median calculation even with duplicates to get a "weighted" median
  const medianStorage = rawPods.length ? rawPods.map((p: any) => Number(p.storage_committed) || 0).sort((a: number, b: number) => a - b)[Math.floor(rawPods.length / 2)] : 1;

  // Consensus
  const rawVersionCounts: Record<string, number> = {}; 
  const uniqueCleanVersionsSet = new Set<string>();
  rawPods.forEach((p: any) => { 
      const rawV = (p.version || '0.0.0'); 
      const cleanV = cleanSemver(rawV);
      rawVersionCounts[rawV] = (rawVersionCounts[rawV] || 0) + 1;
      uniqueCleanVersionsSet.add(cleanV);
  });
  const consensusVersion = Object.keys(rawVersionCounts).sort((a, b) => rawVersionCounts[b] - rawVersionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(uniqueCleanVersionsSet).sort((a, b) => compareVersions(b, a));

  await resolveLocations([...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[]);

  const expandedNodes: EnrichedNode[] = [];

  const scoreNode = (pod: any, network: 'MAINNET' | 'DEVNET' | 'UNKNOWN', credits: number | null, medianCredits: number, isUntracked: boolean) => {
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
      const storageCommitted = Number(pod.storage_committed) || 0;
      const storageUsed = Number(pod.storage_used) || 0;
      const uptime = Number(pod.uptime) || 0;

      const vitality = calculateVitalityScore(
          storageCommitted, storageUsed, uptime, 
          pod.version || '0.0.0', consensusVersion, sortedCleanVersions, 
          medianCredits, credits, medianStorage
      );

      return {
          ...pod,
          pubkey: pod.pubkey || pod.public_key,
          network, 
          storage_committed: storageCommitted, 
          storage_used: storageUsed,           
          credits, 
          isUntracked,
          health: vitality.total,
          healthBreakdown: vitality.breakdown, 
          location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city },
          rpc_source: pod.rpc_source 
      };
  };

  rawPods.forEach((pod: any) => {
      const key = pod.pubkey || pod.public_key;
      const inMainnet = mainnetMap.has(key);
      const inDevnet = devnetMap.has(key);

      if (inMainnet) {
          const credits = mainnetMap.get(key) || 0;
          expandedNodes.push(scoreNode(pod, 'MAINNET', credits, medianMainnet, false));
      }
      if (inDevnet) {
          const credits = devnetMap.get(key) || 0;
          expandedNodes.push(scoreNode(pod, 'DEVNET', credits, medianMainnet, false)); 
      }
      if (!inMainnet && !inDevnet) {
          const isUntracked = creditsData.mainnet.length > 0;
          expandedNodes.push(scoreNode(pod, 'UNKNOWN', null, medianMainnet, isUntracked));
      }
  });

  const mainnetNodes = expandedNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const devnetNodes = expandedNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const unknownNodes = expandedNodes.filter(n => n.network === 'UNKNOWN');

  // Ranking Logic
  let r = 1; mainnetNodes.forEach((n, i) => { if (i > 0 && (n.credits || 0) < (mainnetNodes[i-1].credits || 0)) r = i + 1; n.rank = r; });
  r = 1; devnetNodes.forEach((n, i) => { if (i > 0 && (n.credits || 0) < (devnetNodes[i-1].credits || 0)) r = i + 1; n.rank = r; });

  const finalNodes = [...mainnetNodes, ...devnetNodes, ...unknownNodes];

  // Health Rank
  const healthSorted = [...finalNodes].sort((a, b) => b.health - a.health);
  let hr = 1;
  healthSorted.forEach((n, i) => { if (i > 0 && n.health < healthSorted[i-1].health) hr = i + 1; n.health_rank = hr; });

  // Averages
  let totalUptime = 0, totalVersion = 0, totalReputation = 0, reputationCount = 0, totalStorage = 0;
  finalNodes.forEach(node => {
    totalUptime += node.healthBreakdown.uptime;
    totalVersion += node.healthBreakdown.version;
    totalStorage += node.healthBreakdown.storage;
    if (node.healthBreakdown.reputation !== null) { totalReputation += node.healthBreakdown.reputation; reputationCount++; }
  });

  const nodeCount = finalNodes.length || 1;
  const avgHealth = Math.round(finalNodes.reduce((a, b) => a + b.health, 0) / nodeCount);

  return { 
    nodes: finalNodes, 
    stats: { 
        consensusVersion, medianCredits: medianMainnet, medianStorage, totalNodes: finalNodes.length, connectedNode: source,
        systemStatus: { credits: creditsData.mainnet.length > 0 || creditsData.devnet.length > 0, rpc: true },
        avgBreakdown: { total: avgHealth, uptime: Math.round(totalUptime / nodeCount), version: Math.round(totalVersion / nodeCount), reputation: reputationCount > 0 ? Math.round(totalReputation / reputationCount) : null, storage: Math.round(totalStorage / nodeCount) }
    } 
  };
}
