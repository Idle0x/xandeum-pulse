import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---

// 1. MAINNET SOURCE (Your Private Node - Source of Truth)
const PRIVATE_MAINNET_RPC = 'https://persian-starts-sounds-colon.trycloudflare.com/rpc';

// 2. DEVNET SOURCE (Public Swarm)
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

// --- HELPERS ---
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

// --- FETCHING ---

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

async function fetchPublicSwarmNodes(mode: 'fast' | 'swarm') {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };

    // Prepare all requests
    const requests = PUBLIC_RPC_NODES.map(ip => 
        axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC })
             .then(r => r.data?.result?.pods || [])
             .catch(() => {
                 if (mode === 'swarm') return []; 
                 throw new Error(ip); 
             })
    );

    try {
        if (mode === 'fast') {
            const winner = await Promise.any(requests);
            return winner;
        } else {
            const results = await Promise.all(requests);
            const aggregatedPods: any[] = [];
            results.forEach(pods => aggregatedPods.push(...pods));
            // IMPORTANT: We do NOT deduplicate public swarm results here anymore.
            // We pass everything to the main function to handle "Same User, Different Node" logic.
            return aggregatedPods;
        }
    } catch (e) {
        console.error("Public Swarm fetch failed.");
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

export async function getNetworkPulse(mode: 'fast' | 'swarm' = 'fast'): Promise<{ nodes: EnrichedNode[], stats: any }> {
  // 1. Fetch RAW data from all sources in parallel
  const [rawPrivateNodes, rawPublicNodes, creditsData] = await Promise.all([ 
      fetchPrivateMainnetNodes(), 
      fetchPublicSwarmNodes(mode), 
      fetchCredits() 
  ]);

  if (rawPrivateNodes.length === 0 && rawPublicNodes.length === 0) {
      return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  // 2. Prepare Credit Maps (The "Bank" - Source of Truth)
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

  // ---------------------------------------------------------
  // 3. UNIFIED PROCESSING
  // ---------------------------------------------------------
  
  // We use a Map keyed by "PUBKEY|ADDRESS" to allow same Pubkey on different IPs
  const finalNodesMap = new Map<string, EnrichedNode>();
  const getUniqueKey = (p: any) => `${p.pubkey || p.public_key}|${p.address}`;

  // Helper to create and format a node object
  const createNode = (pod: any, network: 'MAINNET' | 'DEVNET'): EnrichedNode => {
      const pubkey = pod.pubkey || pod.public_key;
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
      
      // Assign credits based on the strict network assignment
      let credits = 0;
      if (network === 'MAINNET') credits = mainnetCreditMap.get(pubkey) || 0;
      else credits = devnetCreditMap.get(pubkey) || 0;

      return {
          ...pod,
          pubkey: pubkey,
          network: network,
          credits: credits,
          storage_committed: Number(pod.storage_committed) || 0,
          storage_used: Number(pod.storage_used) || 0,
          uptime: Number(pod.uptime) || 0,
          // Placeholders (calculated in next pass)
          health: 0, 
          healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
          location: { 
              lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city 
          }
      };
  };

  // A. PROCESS PRIVATE RPC (Strictly Mainnet)
  // Logic: Anything coming from here is Mainnet. No debate.
  rawPrivateNodes.forEach((pod: any) => {
      const key = getUniqueKey(pod);
      // Even if public swarm finds this later, this is the 'authoritative' version of this specific node instance
      finalNodesMap.set(key, createNode(pod, 'MAINNET'));
  });

  // B. PROCESS PUBLIC SWARM (Fill in the gaps)
  rawPublicNodes.forEach((pod: any) => {
      const key = getUniqueKey(pod);
      const pubkey = pod.pubkey || pod.public_key;

      // 1. Do we already have this EXACT node (Pubkey+IP) from the Private RPC?
      if (finalNodesMap.has(key)) {
          return; // Skip. We prefer the Private RPC data for stability.
      }

      // 2. It's a new node instance found in the wild. Let's classify it.
      // CHECK: Does this Pubkey exist in the Mainnet Bank?
      const isMainnetIdentity = mainnetCreditMap.has(pubkey);
      
      if (isMainnetIdentity) {
          // It is a Mainnet node that our Private RPC missed. Tag it MAINNET.
          finalNodesMap.set(key, createNode(pod, 'MAINNET'));
      } else {
          // It is not in the Mainnet Bank. Tag it DEVNET.
          finalNodesMap.set(key, createNode(pod, 'DEVNET'));
      }
  });

  // ---------------------------------------------------------
  // 4. SCORING & STATS
  // ---------------------------------------------------------

  let allNodes = Array.from(finalNodesMap.values());

  // A. Calculate Consensus Version
  const rawVersionCounts: Record<string, number> = {}; 
  const uniqueCleanVersionsSet = new Set<string>();
  
  allNodes.forEach(p => { 
      const rawV = (p.version || '0.0.0'); 
      const cleanV = cleanSemver(rawV);
      rawVersionCounts[rawV] = (rawVersionCounts[rawV] || 0) + 1;
      uniqueCleanVersionsSet.add(cleanV);
  });
  
  const consensusVersion = Object.keys(rawVersionCounts)
    .sort((a, b) => rawVersionCounts[b] - rawVersionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(uniqueCleanVersionsSet)
    .sort((a, b) => compareVersions(b, a));

  // B. Calculate Median Storage
  const storageArray = allNodes.map(p => p.storage_committed).sort((a, b) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  // C. Batch Resolve Locations for new IPs
  await resolveLocations([...new Set(allNodes.map(p => p.address.split(':')[0]))]);

  // D. Final Scoring Pass
  allNodes = allNodes.map(node => {
      // Refresh location from cache (it might have just been resolved)
      const ip = node.address.split(':')[0];
      const loc = geoCache.get(ip) || node.location;

      const medianCreditsForScore = node.network === 'MAINNET' ? medianMainnet : medianDevnet;

      const vitality = calculateVitalityScore(
          node.storage_committed, 
          node.storage_used, 
          node.uptime, 
          node.version, 
          consensusVersion, 
          sortedCleanVersions, 
          medianCreditsForScore, 
          node.credits, 
          medianStorage
      );

      return {
          ...node,
          location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city },
          health: vitality.total,
          healthBreakdown: vitality.breakdown
      };
  });

  // ---------------------------------------------------------
  // 5. RANKING & FORMATTING
  // ---------------------------------------------------------

  // Separate for ranking (credits based)
  const mainnetNodes = allNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const devnetNodes = allNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));

  // Assign Rank (Network Specific)
  const assignRank = (list: EnrichedNode[]) => {
      let r = 1;
      list.forEach((n, i) => { 
          if (i > 0 && (n.credits || 0) < (list[i-1].credits || 0)) r = i + 1; 
          n.rank = r; 
      });
  };
  assignRank(mainnetNodes);
  assignRank(devnetNodes);

  // Combine back
  const finalNodes = [...mainnetNodes, ...devnetNodes];

  // Assign Global Health Rank
  finalNodes.sort((a, b) => b.health - a.health);
  let hr = 1;
  finalNodes.forEach((n, i) => {
      if (i > 0 && n.health < finalNodes[i-1].health) hr = i + 1;
      n.health_rank = hr;
  });

  // Global Stats Aggregation
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
