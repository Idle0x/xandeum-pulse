import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---

// 1. MAINNET SOURCE (Your Private Node)
const PRIVATE_MAINNET_RPC = 'https://persian-starts-sounds-colon.trycloudflare.com/rpc';

// 2. DEVNET SOURCE (Public Swarm)
// We will try ALL of these until one responds with the full list
const PUBLIC_RPC_NODES = [
  '173.212.203.145', '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 8000;
const TIMEOUT_CREDITS = 8000;

const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_CREDITS_DEVNET  = 'https://podcredits.xandeum.network/api/pods-credits';

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

// --- INTERFACES ---
export interface EnrichedNode {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  isUntracked?: boolean;
  network: 'MAINNET' | 'DEVNET';
  storage_used: number;      
  storage_committed: number; 
  credits: number | null; 
  health: number;
  healthBreakdown: {
      uptime: number;
      version: number;
      reputation: number | null;
      storage: number;
  };
  location: {
    lat: number;
    lon: number;
    countryName: string;
    countryCode: string;
    city: string;
  };
  rank?: number;        
  health_rank?: number; 
}

// --- HELPERS (Standard) ---
export const cleanSemver = (v: string) => {
  if (!v) return '0.0.0';
  const mainVer = v.split('-')[0]; 
  return mainVer.replace(/[^0-9.]/g, '');
};

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
    storageCommitted: number, 
    storageUsed: number,
    uptimeSeconds: number, 
    version: string, 
    consensusVersion: string, 
    sortedCleanVersions: string[], 
    medianCredits: number, 
    credits: number | null, 
    medianStorage: number
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
      breakdown: {
          uptime: Math.round(uptimeScore),
          version: Math.round(versionScore),
          reputation: reputationScore,
          storage: Math.round(totalStorageScore)
      }
  };
};

// --- ROBUST FETCHING ---

// 1. Fetch MAINNET from your Private RPC
async function fetchPrivateMainnetNodes() {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    try {
        const res = await axios.post(PRIVATE_MAINNET_RPC, payload, { timeout: TIMEOUT_RPC });
        if (res.data?.result?.pods && Array.isArray(res.data.result.pods)) {
            return res.data.result.pods;
        }
    } catch (e) {
        console.warn("Private Mainnet RPC Failed:", (e as any).message);
    }
    return [];
}

// 2. Fetch DEVNET from Public Swarm (Aggressive Strategy)
async function fetchPublicSwarmNodes() {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    
    // Create a promise for every single IP in the list
    const promises = PUBLIC_RPC_NODES.map(ip => 
        axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC })
             .then(r => r.data?.result?.pods || [])
             .catch(() => { throw new Error(ip); }) // Throw on error so Promise.any keeps going
    );

    try {
        // Promise.any will return the FIRST successful response from ANY node
        // This fixes the "28 nodes" issue by ensuring we actually find a working public node
        const winner = await Promise.any(promises);
        return winner;
    } catch (e) {
        console.error("All Public Swarm nodes failed.");
        return [];
    }
}

async function fetchCredits() {
    const AXIOS_CONFIG = { timeout: TIMEOUT_CREDITS };
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_CREDITS_MAINNET, AXIOS_CONFIG),
        axios.get(API_CREDITS_DEVNET, AXIOS_CONFIG)
    ]);
    const parseData = (res: PromiseSettledResult<any>) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data;
        if (d?.pods_credits && Array.isArray(d.pods_credits)) return d.pods_credits;
        if (Array.isArray(d)) return d;
        return [];
    };
    return {
        mainnet: parseData(mainnetRes),
        devnet: parseData(devnetRes)
    };
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
  // Fetch everything in parallel
  const [rawMainnet, rawDevnet, creditsData] = await Promise.all([ 
      fetchPrivateMainnetNodes(), 
      fetchPublicSwarmNodes(), 
      fetchCredits() 
  ]);

  if (rawMainnet.length === 0 && rawDevnet.length === 0) {
      // Return empty safely if everything fails
      return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  // --- PREPARE DATA ---

  const mainnetCreditMap = new Map<string, number>();
  const devnetCreditMap = new Map<string, number>();
  const mainnetValues: number[] = [];
  const devnetValues: number[] = [];

  creditsData.mainnet.forEach((c: any) => {
      const val = parseFloat(c.credits || c.amount || '0');
      const key = c.pod_id || c.pubkey || c.node;
      if (key && !isNaN(val)) { mainnetCreditMap.set(key, val); mainnetValues.push(val); }
  });

  creditsData.devnet.forEach((c: any) => {
      const val = parseFloat(c.credits || c.amount || '0');
      const key = c.pod_id || c.pubkey || c.node;
      if (key && !isNaN(val)) { devnetCreditMap.set(key, val); devnetValues.push(val); }
  });

  const medianMainnet = mainnetValues.sort((a, b) => a - b)[Math.floor(mainnetValues.length / 2)] || 0;
  const medianDevnet = devnetValues.sort((a, b) => a - b)[Math.floor(devnetValues.length / 2)] || 0;

  // Combine raw lists just for stats (consensus/storage/geo)
  const allRawPods = [...rawMainnet, ...rawDevnet];

  const storageArray: number[] = allRawPods.map((p: any) => Number(p.storage_committed) || 0).sort((a: number, b: number) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  const rawVersionCounts: Record<string, number> = {}; 
  const uniqueCleanVersionsSet = new Set<string>();

  allRawPods.forEach((p: any) => { 
      const rawV = (p.version || '0.0.0'); 
      const cleanV = cleanSemver(rawV);
      rawVersionCounts[rawV] = (rawVersionCounts[rawV] || 0) + 1;
      uniqueCleanVersionsSet.add(cleanV);
  });

  const consensusVersion = Object.keys(rawVersionCounts).sort((a, b) => rawVersionCounts[b] - rawVersionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(uniqueCleanVersionsSet).sort((a, b) => compareVersions(b, a));

  await resolveLocations([...new Set(allRawPods.map((p: any) => p.address.split(':')[0]))] as string[]);

  const expandedNodes: EnrichedNode[] = [];

  // --- NODE SCORING FUNCTION ---
  
  const scoreNode = (pod: any, network: 'MAINNET' | 'DEVNET') => {
      const key = pod.pubkey || pod.public_key;
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
      const storageCommitted = Number(pod.storage_committed) || 0;
      const storageUsed = Number(pod.storage_used) || 0;
      const uptime = Number(pod.uptime) || 0;

      let credits = 0;
      let medianForScore = 1;

      if (network === 'MAINNET') {
          credits = mainnetCreditMap.get(key) || 0;
          medianForScore = medianMainnet;
      } else {
          credits = devnetCreditMap.get(key) || 0;
          medianForScore = medianDevnet;
      }

      const vitality = calculateVitalityScore(
          storageCommitted, storageUsed, uptime, 
          pod.version || '0.0.0', consensusVersion, sortedCleanVersions, 
          medianForScore, credits, medianStorage
      );

      return {
          ...pod,
          pubkey: key,
          network, 
          storage_committed: storageCommitted, 
          storage_used: storageUsed,           
          credits: credits, 
          isUntracked: false,
          health: vitality.total,
          healthBreakdown: vitality.breakdown, 
          location: { 
              lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city 
          }
      };
  };

  // --- ADDITIVE LOGIC (No Filtering) ---

  // 1. Add ALL Mainnet Nodes (from Private RPC)
  rawMainnet.forEach((pod: any) => {
      expandedNodes.push(scoreNode(pod, 'MAINNET'));
  });

  // 2. Add ALL Devnet Nodes (from Public RPC)
  // If a node is here, it gets added as DEVNET, even if it was already added above as MAINNET.
  // This ensures both entries appear.
  rawDevnet.forEach((pod: any) => {
      expandedNodes.push(scoreNode(pod, 'DEVNET'));
  });

  // --- RANKING ---

  const mainnetNodes = expandedNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const devnetNodes = expandedNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));

  let r = 1;
  mainnetNodes.forEach((n, i) => { if (i > 0 && (n.credits || 0) < (mainnetNodes[i-1].credits || 0)) r = i + 1; n.rank = r; });

  r = 1;
  devnetNodes.forEach((n, i) => { if (i > 0 && (n.credits || 0) < (devnetNodes[i-1].credits || 0)) r = i + 1; n.rank = r; });

  const finalNodes = [...mainnetNodes, ...devnetNodes];

  // Global Health Rank
  const healthSorted = [...finalNodes].sort((a, b) => b.health - a.health);
  let hr = 1;
  healthSorted.forEach((n, i) => {
      if (i > 0 && n.health < healthSorted[i-1].health) hr = i + 1;
      n.health_rank = hr;
  });

  // Averages
  let totalUptime = 0;
  let totalVersion = 0;
  let totalReputation = 0;
  let reputationCount = 0;
  let totalStorage = 0;

  finalNodes.forEach(node => {
    totalUptime += node.healthBreakdown.uptime;
    totalVersion += node.healthBreakdown.version;
    totalStorage += node.healthBreakdown.storage;
    if (node.healthBreakdown.reputation !== null) {
      totalReputation += node.healthBreakdown.reputation;
      reputationCount++;
    }
  });

  const nodeCount = finalNodes.length || 1;
  const avgHealth = Math.round(finalNodes.reduce((a, b) => a + b.health, 0) / nodeCount);

  return { 
    nodes: finalNodes, 
    stats: { 
        consensusVersion, 
        medianCredits: medianMainnet, 
        medianStorage,
        totalNodes: finalNodes.length,
        systemStatus: {
            credits: creditsData.mainnet.length > 0 || creditsData.devnet.length > 0, 
            rpc: true 
        },
        avgBreakdown: {
            total: avgHealth,
            uptime: Math.round(totalUptime / nodeCount),
            version: Math.round(totalVersion / nodeCount),
            reputation: reputationCount > 0 ? Math.round(totalReputation / reputationCount) : null,
            storage: Math.round(totalStorage / nodeCount)
        }
    } 
  };
}
