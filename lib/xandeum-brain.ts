import axios from 'axios';
import geoip from 'geoip-lite';

// --- CONFIGURATION ---

const PRIVATE_MAINNET_RPC = 'https://persian-starts-sounds-colon.trycloudflare.com/rpc';
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
  isUntracked: boolean; // Strictly true if credits are null
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
  clusterStats?: {
    totalGlobal: number;
    mainnetCount: number;
    devnetCount: number;
  };
}

// --- MATH & SCORING HELPERS ---

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

const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) => 
  100 / (1 + Math.exp(-steepness * (value - midpoint)));

const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
    if (median <= 0) return value > 0 ? maxScore : 0;
    return Math.min(maxScore, (maxScore / 2) * Math.log2((value / median) + 1));
};

const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedCleanVersions: string[]) => {
    const cleanNode = cleanSemver(nodeVersion);
    const cleanConsensus = cleanSemver(consensusVersion);
    if (compareVersions(cleanNode, cleanConsensus) >= 0) return 100;

    const nodeIndex = sortedCleanVersions.indexOf(cleanNode);
    const consensusIndex = sortedCleanVersions.indexOf(cleanConsensus);
    if (nodeIndex === -1) return 0;

    const distance = nodeIndex - consensusIndex;
    if (distance <= 0) return 100; 
    const drops = [100, 90, 70, 50, 30, 10];
    return drops[distance] || Math.max(0, 10 - (distance - 5));
};

export const calculateVitalityScore = (
    storageCommitted: number, storageUsed: number, uptimeSeconds: number, 
    version: string, consensusVersion: string, sortedCleanVersions: string[], 
    medianCredits: number, credits: number | null, medianStorage: number
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

  // Use strict null check for reputation weight
  if (credits !== null) {
      reputationScore = medianCredits > 0 ? Math.min(100, (credits / (medianCredits * 2)) * 100) : 50;
      total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15));
  } else {
      // Untracked nodes get different weighting
      total = Math.round((uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20));
      reputationScore = null; 
  }

  return {
      total: Math.max(0, Math.min(100, total)),
      breakdown: { uptime: Math.round(uptimeScore), version: Math.round(versionScore), reputation: reputationScore, storage: Math.round(totalStorageScore) }
  };
};

// --- DATA FETCHING ---

async function fetchPrivateMainnetNodes() {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    try {
        const res = await axios.post(PRIVATE_MAINNET_RPC, payload, { timeout: TIMEOUT_RPC });
        return res.data?.result?.pods || [];
    } catch (e) { return []; }
}

async function fetchPublicSwarmNodes() {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    const requests = PUBLIC_RPC_NODES.map(ip => 
        axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC })
             .then(r => r.data?.result?.pods || [])
             .catch(() => { throw new Error(ip); })
    );
    try { return await Promise.any(requests); } catch (e) { return []; }
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
        return d?.pods_credits || d || [];
    };
    return { mainnet: parseData(mainnetRes), devnet: parseData(devnetRes) };
}

async function resolveLocations(ips: string[]) {
    const missing = ips.filter(ip => !geoCache.has(ip));
    if (missing.length === 0) return;
    try {
        const res = await axios.post('http://ip-api.com/batch', missing.slice(0, 100).map(ip => ({ query: ip })), { timeout: 3000 });
        res.data.forEach((d: any) => {
            if (d.lat) geoCache.set(d.query, { lat: d.lat, lon: d.lon, country: d.country, countryCode: d.countryCode, city: d.city });
        });
    } catch (e) {}
    missing.forEach(ip => {
        if (!geoCache.has(ip)) {
            const geo = geoip.lookup(ip);
            if (geo) geoCache.set(ip, { lat: geo.ll[0], lon: geo.ll[1], country: geo.country, countryCode: geo.country, city: geo.city || 'Unknown' });
            else geoCache.set(ip, { lat: 0, lon: 0, country: 'Private', countryCode: 'XX', city: 'Hidden' });
        }
    });
}

// --- MAIN BRAIN EXPORT ---

export async function getNetworkPulse(mode: 'fast' | 'swarm' = 'fast'): Promise<{ nodes: EnrichedNode[], stats: any }> {
  const [rawPrivate, rawPublic, creditsData] = await Promise.all([ 
      fetchPrivateMainnetNodes(), fetchPublicSwarmNodes(), fetchCredits() 
  ]);

  // Build Credit Maps - We don't use fallbacks here to keep "null" as missing
  const mainnetCreditMap = new Map<string, number>();
  const devnetCreditMap = new Map<string, number>();
  const mainnetValues: number[] = [];
  const devnetValues: number[] = [];

  creditsData.mainnet.forEach((c: any) => {
      const val = parseFloat(c.credits || c.amount);
      const key = c.pod_id || c.pubkey || c.node;
      if (key && !isNaN(val)) { mainnetCreditMap.set(key, val); mainnetValues.push(val); }
  });

  creditsData.devnet.forEach((c: any) => {
      const val = parseFloat(c.credits || c.amount);
      const key = c.pod_id || c.pubkey || c.node;
      if (key && !isNaN(val)) { devnetCreditMap.set(key, val); devnetValues.push(val); }
  });

  const medianMainnet = mainnetValues.length ? mainnetValues.sort((a,b)=>a-b)[Math.floor(mainnetValues.length/2)] : 0;
  const medianDevnet = devnetValues.length ? devnetValues.sort((a,b)=>a-b)[Math.floor(devnetValues.length/2)] : 0;

  const processedNodes: EnrichedNode[] = [];
  const mainnetFingerprints = new Set<string>();

  // Use this helper to get credits: Returns NULL if key doesn't exist in map
  const fetchSafeCredits = (pk: string, network: 'MAINNET' | 'DEVNET') => {
      const map = network === 'MAINNET' ? mainnetCreditMap : devnetCreditMap;
      const val = map.get(pk);
      return val !== undefined ? val : null;
  };

  // 1. ANCHOR: Private RPC Mainnet
  rawPrivate.forEach((pod: any) => {
      const pubkey = pod.pubkey || pod.public_key;
      const credits = fetchSafeCredits(pubkey, 'MAINNET');
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      processedNodes.push({
          ...pod, pubkey, network: 'MAINNET', credits, isUntracked: credits === null,
          storage_committed: Number(pod.storage_committed) || 0,
          storage_used: Number(pod.storage_used) || 0,
          uptime: Number(pod.uptime) || 0,
          location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city }
      } as EnrichedNode);
      mainnetFingerprints.add(`${pubkey}|${pod.address}`);
  });

  // 2. DISCOVERY: Public RPC
  rawPublic.forEach((pod: any) => {
      const pubkey = pod.pubkey || pod.public_key;
      if (mainnetFingerprints.has(`${pubkey}|${pod.address}`)) return;

      const mCredits = fetchSafeCredits(pubkey, 'MAINNET');
      const dCredits = fetchSafeCredits(pubkey, 'DEVNET');
      
      // Determine Network
      let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
      let finalCredits: number | null = null;
      if (mCredits !== null) { network = 'MAINNET'; finalCredits = mCredits; }
      else { network = 'DEVNET'; finalCredits = dCredits; }

      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      processedNodes.push({
          ...pod, pubkey, network, credits: finalCredits, isUntracked: finalCredits === null,
          storage_committed: Number(pod.storage_committed) || 0,
          storage_used: Number(pod.storage_used) || 0,
          uptime: Number(pod.uptime) || 0,
          location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city }
      } as EnrichedNode);
  });

  // 3. GHOST PROTOCOL (Sync Mainnet Hardware to Devnet Rewards)
  devnetCreditMap.forEach((val, pubkey) => {
      const hasDevNode = processedNodes.some(n => n.pubkey === pubkey && n.network === 'DEVNET');
      if (!hasDevNode) {
          const mainNode = processedNodes.find(n => n.pubkey === pubkey && n.network === 'MAINNET');
          if (mainNode) {
              processedNodes.push({ ...mainNode, network: 'DEVNET', credits: val, isUntracked: false });
          }
      }
  });

  // 4. STATS & SCORING
  const versionCounts: Record<string, number> = {};
  const cleanVersionsSet = new Set<string>();
  processedNodes.forEach(p => {
      versionCounts[p.version] = (versionCounts[p.version] || 0) + 1;
      cleanVersionsSet.add(cleanSemver(p.version));
  });

  const consensusVersion = Object.keys(versionCounts).sort((a,b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(cleanVersionsSet).sort((a,b) => compareVersions(b, a));
  const storageArray = processedNodes.map(p => p.storage_committed).sort((a,b) => a-b);
  const medianStorage = storageArray[Math.floor(storageArray.length/2)] || 1;

  await resolveLocations([...new Set(processedNodes.map(p => p.address.split(':')[0]))]);

  const finalNodes = processedNodes.map(node => {
      const vitality = calculateVitalityScore(
          node.storage_committed, node.storage_used, node.uptime, 
          node.version, consensusVersion, sortedCleanVersions, 
          node.network === 'MAINNET' ? medianMainnet : medianDevnet, 
          node.credits, medianStorage
      );
      const ip = node.address.split(':')[0];
      const loc = geoCache.get(ip) || node.location;
      
      return {
          ...node,
          location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city },
          health: vitality.total,
          healthBreakdown: vitality.breakdown
      };
  });

  // Ranking
  const sortByCredits = (list: EnrichedNode[]) => {
      list.sort((a,b) => (b.credits || 0) - (a.credits || 0));
      let r = 1;
      list.forEach((n, i) => {
          if (i > 0 && (n.credits || 0) < (list[i-1].credits || 0)) r = i + 1;
          n.rank = r;
      });
  };
  sortByCredits(finalNodes.filter(n => n.network === 'MAINNET'));
  sortByCredits(finalNodes.filter(n => n.network === 'DEVNET'));

  return { 
      nodes: finalNodes, 
      stats: { consensusVersion, totalNodes: finalNodes.length, medianStorage, avgHealth: Math.round(finalNodes.reduce((a,b)=>a+b.health, 0)/finalNodes.length) } 
  };
}
