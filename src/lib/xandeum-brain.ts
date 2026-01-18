import axios from 'axios';
import geoip from 'geoip-lite';
import { publicSwarm } from './xandeum-brain/rpc-orchestrator'; // Import the new manager

// --- CONFIGURATION ---

const TIMEOUT_RPC = 8000;
const TIMEOUT_CREDITS = 8000;

// Env vars for Private Hero
const PRIVATE_RPC_URL = process.env.XANDEUM_PRIVATE_RPC_URL;
const OPERATOR_PUBKEY = process.env.XANDEUM_OPERATOR_PUBKEY;
const OPERATOR_IP = process.env.XANDEUM_OPERATOR_IP;

const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_CREDITS_DEVNET = 'https://podcredits.xandeum.network/api/pods-credits';

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

// Cache for Private Hero Resilience
let lastKnownPrivateNodes: any[] = [];
let lastPrivateFetchTime = 0;
const CACHE_RETENTION_MS = 1000 * 60 * 10; // 10 minutes retention for Private RPC

// --- INTERFACES (UNCHANGED) ---

export interface EnrichedNode {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  isUntracked?: boolean;
  is_operator?: boolean; 
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

// --- HELPERS (Scoring & Versioning - STRICTLY PRESERVED) ---

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
  medianStorage: number,
  isCreditsApiOnline: boolean
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
  } else if (isCreditsApiOnline) {
    reputationScore = 0;
    total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (0 * 0.20) + (versionScore * 0.15));
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

// 1. Private Hero Fetch (With Caching Resilience)
async function fetchPrivateMainnetNodes() {
  if (!PRIVATE_RPC_URL) {
    console.warn("XANDEUM_PRIVATE_RPC_URL is not set.");
    return [];
  }
  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  try {
    const res = await axios.post(PRIVATE_RPC_URL, payload, { timeout: TIMEOUT_RPC });
    if (res.data?.result?.pods && Array.isArray(res.data.result.pods)) {
      lastKnownPrivateNodes = res.data.result.pods;
      lastPrivateFetchTime = Date.now();
      return res.data.result.pods;
    }
  } catch (e) {
    const errMsg = (e as any).message;
    console.warn("Private Mainnet RPC Failed:", errMsg);
    
    // Resilience: Return last known good data if recent
    if (Date.now() - lastPrivateFetchTime < CACHE_RETENTION_MS) {
      console.log("Serving cached Private Mainnet nodes due to connection failure.");
      return lastKnownPrivateNodes;
    }
  }
  return [];
}

// 2. Operator Node Fetch (Unchanged)
async function fetchOperatorNode() {
  if (!PRIVATE_RPC_URL || !OPERATOR_PUBKEY || !OPERATOR_IP) return null;
  const payload = { jsonrpc: '2.0', method: 'get-stats', params: [], id: 1 };
  try {
    const res = await axios.post(PRIVATE_RPC_URL, payload, { timeout: TIMEOUT_RPC });
    const stats = res.data?.result;
    if (stats) {
      return {
        address: `${OPERATOR_IP}:9001`,
        rpc_port: 6000,
        pubkey: OPERATOR_PUBKEY,
        is_public: false,
        version: "1.2.0", // Manual mapping
        uptime: stats.uptime,
        storage_committed: stats.file_size,
        storage_used: 0,
        last_seen_timestamp: Math.floor(Date.now() / 1000),
        is_operator: true
      };
    }
  } catch (e) {
    console.warn("Operator Node Fetch Failed:", (e as any).message);
  }
  return null;
}

// 3. Public Swarm Fetch (Delegated to Orchestrator)
async function fetchPublicSwarmNodes() {
    return await publicSwarm.fetchPublicNodes();
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

  // ---------------------------------------------------------
  // PHASE 1: COLLECTION
  // ---------------------------------------------------------

  // Dual Hero Collection: Private via Direct, Public via Orchestrator
  const [rawPrivateNodes, operatorNode, rawPublicNodes, creditsData] = await Promise.all([
    fetchPrivateMainnetNodes(),
    fetchOperatorNode(),
    fetchPublicSwarmNodes(),
    fetchCredits()
  ]);

  // Inject Operator Node into Private List (Hero A Anchor)
  if (operatorNode) {
    const exists = rawPrivateNodes.find((p: any) => p.pubkey === operatorNode.pubkey);
    if (!exists) {
      rawPrivateNodes.unshift(operatorNode);
    }
  }

  if (rawPrivateNodes.length === 0 && rawPublicNodes.length === 0) {
    return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  const isCreditsApiOnline = creditsData.mainnet.length > 0 || creditsData.devnet.length > 0;

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
  // PHASE 2 & 3: THE STRICT FINGERPRINTING & DEDUPLICATION SYSTEM
  // ---------------------------------------------------------
  // IMPORTANT: This logic is preserved exactly to handle the 
  // conflict between Hero A (Private) and Hero B (Public) data.
  
  const processedNodes: EnrichedNode[] = [];

  const getFingerprint = (p: any, assumedNetwork: 'MAINNET' | 'DEVNET') => {
    const key = p.pubkey || p.public_key;
    const rawCredVal = assumedNetwork === 'MAINNET' ? mainnetCreditMap.get(key) : devnetCreditMap.get(key);
    const credits = rawCredVal !== undefined ? rawCredVal : 'NULL';
    return `${key}|${p.address}|${p.storage_committed}|${p.storage_used}|${p.version}|${p.is_public}|${credits}`;
  };

  const mainnetFingerprints = new Map<string, number>();

  // A. PROCESS PRIVATE RPC (ANCHOR) -> ALWAYS MAINNET
  rawPrivateNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    const rawCreds = mainnetCreditMap.get(pubkey);
    let credits: number | null = null;
    let isUntracked = false;
    
    if (rawCreds !== undefined) {
      credits = rawCreds;
    } else if (isCreditsApiOnline) {
      isUntracked = true;
    }

    const uptimeVal = Number(pod.uptime) || 0;
    const node: EnrichedNode = {
      ...pod,
      pubkey: pubkey,
      network: 'MAINNET',
      credits: credits,
      isUntracked: isUntracked,
      is_operator: pod.is_operator || false,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: uptimeVal,
      health: 0,
      healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: {
        lat: loc.lat,
        lon: loc.lon,
        countryName: (loc as any).country || (loc as any).countryName || 'Unknown',
        countryCode: loc.countryCode,
        city: loc.city
      }
    };
    processedNodes.push(node);
    const fingerprint = getFingerprint(pod, 'MAINNET');
    mainnetFingerprints.set(fingerprint, uptimeVal);
  });

  // B. PROCESS PUBLIC SWARM (SUBTRACTION WITH TIME DELTA)
  // This uses the data from the Orchestrator (Hero B + Discovery)
  rawPublicNodes.forEach((pod: any) => {
    const potentialMainnetFingerprint = getFingerprint(pod, 'MAINNET');
    const publicUptime = Number(pod.uptime) || 0;

    // THE VITAL DEDUPLICATION CHECK
    if (mainnetFingerprints.has(potentialMainnetFingerprint)) {
      const privateUptime = mainnetFingerprints.get(potentialMainnetFingerprint) || 0;
      const diff = Math.abs(privateUptime - publicUptime);
      if (diff <= 100) {
        return; // DUPLICATE DETECTED -> Skip this Public version, use Private version
      }
    }

    const pubkey = pod.pubkey || pod.public_key;
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
    let credits: number | null = null;
    let isUntracked = false;

    const mainnetVal = mainnetCreditMap.get(pubkey);
    const devnetVal = devnetCreditMap.get(pubkey);

    if (mainnetVal !== undefined && devnetVal === undefined) {
      network = 'MAINNET';
      credits = mainnetVal;
    } else if (devnetVal !== undefined) {
      network = 'DEVNET';
      credits = devnetVal;
    } else {
      network = 'DEVNET';
      if (isCreditsApiOnline) {
        isUntracked = true;
      }
    }

    const node: EnrichedNode = {
      ...pod,
      pubkey: pubkey,
      network: network,
      credits: credits,
      isUntracked: isUntracked,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: publicUptime,
      health: 0,
      healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: {
        lat: loc.lat,
        lon: loc.lon,
        countryName: (loc as any).country || (loc as any).countryName || 'Unknown',
        countryCode: loc.countryCode,
        city: loc.city
      }
    };
    processedNodes.push(node);
  });

  // ---------------------------------------------------------
  // PHASE 6: SCORING & STATS (UNCHANGED)
  // ---------------------------------------------------------

  const rawVersionCounts: Record<string, number> = {};
  const uniqueCleanVersionsSet = new Set<string>();

  processedNodes.forEach(p => {
    const rawV = (p.version || '0.0.0');
    const cleanV = cleanSemver(rawV);
    rawVersionCounts[rawV] = (rawVersionCounts[rawV] || 0) + 1;
    uniqueCleanVersionsSet.add(cleanV);
  });

  const consensusVersion = Object.keys(rawVersionCounts).sort((a, b) => rawVersionCounts[b] - rawVersionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(uniqueCleanVersionsSet).sort((a, b) => compareVersions(b, a));

  const storageArray = processedNodes.map(p => p.storage_committed).sort((a, b) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  await resolveLocations([...new Set(processedNodes.map(p => p.address.split(':')[0]))]);

  const finalNodes = processedNodes.map(node => {
    const ip = node.address.split(':')[0];
    const loc = geoCache.get(ip) || node.location;
    const medianCreditsForScore = node.network === 'MAINNET' ? medianMainnet : medianDevnet;

    const vitality = calculateVitalityScore(
      node.storage_committed, node.storage_used, node.uptime,
      node.version, consensusVersion, sortedCleanVersions,
      medianCreditsForScore, node.credits,
      medianStorage, isCreditsApiOnline
    );

    return {
      ...node,
      location: {
        lat: loc.lat,
        lon: loc.lon,
        countryName: (loc as any).country || (loc as any).countryName || 'Unknown',
        countryCode: loc.countryCode,
        city: loc.city
      },
      health: vitality.total,
      healthBreakdown: vitality.breakdown
    };
  });

  const mainnetList = finalNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const devnetList = finalNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));

  const assignRank = (list: EnrichedNode[]) => {
    let r = 1;
    list.forEach((n, i) => {
      if (i > 0 && (n.credits || 0) < (list[i-1].credits || 0)) r = i + 1;
      n.rank = r;
    });
  };
  assignRank(mainnetList);
  assignRank(devnetList);

  const allSorted = [...mainnetList, ...devnetList];

  allSorted.sort((a, b) => b.health - a.health);
  let hr = 1;
  allSorted.forEach((n, i) => {
    if (i > 0 && n.health < allSorted[i-1].health) hr = i + 1;
    n.health_rank = hr;
  });

  let totalUptime = 0, totalVersion = 0, totalReputation = 0, reputationCount = 0, totalStorage = 0;
  allSorted.forEach(node => {
    totalUptime += node.healthBreakdown.uptime;
    totalVersion += node.healthBreakdown.version;
    totalStorage += node.healthBreakdown.storage;
    if (node.healthBreakdown.reputation !== null) { totalReputation += node.healthBreakdown.reputation; reputationCount++; }
  });

  const nodeCount = allSorted.length || 1;
  const avgHealth = Math.round(allSorted.reduce((a, b) => a + b.health, 0) / nodeCount);

  return {
    nodes: allSorted,
    stats: {
      consensusVersion,
      medianCredits: medianMainnet,
      medianStorage,
      totalNodes: allSorted.length,
      systemStatus: {
        credits: isCreditsApiOnline,
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
