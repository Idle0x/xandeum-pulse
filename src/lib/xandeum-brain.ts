import axios from 'axios';
import geoip from 'geoip-lite';
import { publicOrchestrator } from './rpc-orchestrator'; 
import { RawNodeSchema, CreditsResponseSchema, extractPubkey } from './schemas';
import { LRUCache } from './lru-cache'; 

// --- CONFIGURATION ---

const TIMEOUT_RPC = 8000;
const TIMEOUT_CREDITS = 8000;
const WORKER_INTERVAL_MS = 15000;

const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_CREDITS_DEVNET = 'https://podcredits.xandeum.network/api/pods-credits';

const geoCache = new LRUCache<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>(5000);

let privateMainnetCache: { data: any[], timestamp: number } = { data: [], timestamp: 0 };

let systemState = {
  ready: false,
  lastUpdated: 0,
  data: {
    nodes: [] as any[],
    stats: {
      consensusVersion: '0.0.0',
      totalNodes: 0,
      medianCredits: 0,
      medianStorage: 0,
      systemStatus: { rpc: false, credits: false },
      avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: null as number | null, storage: 0 }
    }
  }
};

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

// --- HELPERS (UNCHANGED) ---

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
  storageCommitted: number, storageUsed: number, uptimeSeconds: number,
  version: string, consensusVersion: string, sortedCleanVersions: string[],
  medianCredits: number, credits: number | null, medianStorage: number,
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
    breakdown: { uptime: Math.round(uptimeScore), version: Math.round(versionScore), reputation: reputationScore, storage: Math.round(totalStorageScore) }
  };
};

// --- FETCHING ---

async function fetchPrivateMainnetNodes() {
  const privateUrl = process.env.XANDEUM_PRIVATE_RPC_URL;
  if (!privateUrl) { console.warn("XANDEUM_PRIVATE_RPC_URL missing"); return []; }

  if (Date.now() - privateMainnetCache.timestamp < 15000 && privateMainnetCache.data.length > 0) {
      return privateMainnetCache.data;
  }

  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  try {
    const res = await axios.post(privateUrl, payload, { timeout: TIMEOUT_RPC });
    const rawPods = res.data?.result?.pods;
    
    if (Array.isArray(rawPods)) {
      const validPods = rawPods.map((p: any) => {
        const result = RawNodeSchema.safeParse(p);
        if (!result.success) {
           // FIXED: Use .format() for typesafe error logging
           console.error("[Zod Error - Private]", result.error.format()); 
           return null;
        }
        return result.data;
      }).filter((p: any) => p !== null);

      if (validPods.length > 0) {
          privateMainnetCache = { data: validPods, timestamp: Date.now() };
          return validPods;
      }
    }
  } catch (e) {
    if (privateMainnetCache.data.length > 0) return privateMainnetCache.data;
  }
  return [];
}

async function fetchOperatorNode() {
  const privateUrl = process.env.XANDEUM_PRIVATE_RPC_URL;
  const operatorPubkey = process.env.XANDEUM_OPERATOR_PUBKEY;
  const operatorIp = process.env.XANDEUM_OPERATOR_IP;
  if (!privateUrl || !operatorPubkey || !operatorIp) return null;
  try {
    const res = await axios.post(privateUrl, { jsonrpc: '2.0', method: 'get-stats', params: [], id: 1 }, { timeout: TIMEOUT_RPC });
    const stats = res.data?.result;
    if (stats) {
      return {
        address: `${operatorIp}:9001`,
        pubkey: operatorPubkey,
        is_public: false,
        version: "1.2.0",
        uptime: stats.uptime,
        storage_committed: stats.file_size,
        storage_used: 0,
        last_seen_timestamp: Math.floor(Date.now() / 1000),
        is_operator: true
      };
    }
  } catch (e) { /* silent */ }
  return null;
}

async function fetchCredits() {
  const AXIOS_CONFIG = { timeout: TIMEOUT_CREDITS };
  const [mainnetRes, devnetRes] = await Promise.allSettled([
    axios.get(API_CREDITS_MAINNET, AXIOS_CONFIG),
    axios.get(API_CREDITS_DEVNET, AXIOS_CONFIG)
  ]);
  const parseData = (res: PromiseSettledResult<any>) => {
    if (res.status !== 'fulfilled') return [];
    const parsed = CreditsResponseSchema.safeParse(res.value.data);
    if (!parsed.success) return [];
    const data = parsed.data;
    if ('pods_credits' in data && Array.isArray(data.pods_credits)) return data.pods_credits;
    if (Array.isArray(data)) return data;
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
        if (chunk.length === 0) continue; 
        const res = await axios.post('http://ip-api.com/batch', chunk.map(ip => ({ query: ip, fields: "lat,lon,country,countryCode,city,query" })), { timeout: 3000 });
        if (Array.isArray(res.data)) {
            res.data.forEach((d: any) => {
                if (d.query && d.lat && d.lon) {
                    geoCache.set(d.query, { lat: d.lat, lon: d.lon, country: d.country, countryCode: d.countryCode, city: d.city });
                }
            });
        }
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

// --- WORKER LOOP ---

async function refreshNetworkPulse() {
  try {
    const [rawPrivateNodes, operatorNode, rawPublicNodes, creditsData] = await Promise.all([
      fetchPrivateMainnetNodes(),
      fetchOperatorNode(),
      publicOrchestrator.fetchNodes(), 
      fetchCredits()
    ]);

    // DEBUG LOGGING ADDED HERE
    const validPublicNodes = rawPublicNodes.map((p: any) => {
        const result = RawNodeSchema.safeParse(p);
        if (!result.success) {
            // FIXED: Use .format() for typesafe error logging
            console.error("[Zod Error - Public]", result.error.format());
            return null;
        }
        return result.data;
    }).filter((p: any) => p !== null);

    if (operatorNode) {
      const exists = rawPrivateNodes.find((p: any) => extractPubkey(p) === operatorNode.pubkey);
      if (!exists) rawPrivateNodes.unshift(operatorNode);
    }

    if (rawPrivateNodes.length === 0 && validPublicNodes.length === 0) {
       console.warn(`[Worker] Safety Lock Triggered: 0 nodes found. Serving STALE data from: ${new Date(systemState.lastUpdated).toISOString()}`);
       return;
    }

    const isCreditsApiOnline = creditsData.mainnet.length > 0 || creditsData.devnet.length > 0;
    const mainnetCreditMap = new Map<string, number>();
    const devnetCreditMap = new Map<string, number>();
    const mainnetValues: number[] = [];
    const devnetValues: number[] = [];

    const processCredit = (c: any, map: Map<string, number>, list: number[]) => {
        const val = parseFloat(c.credits || c.amount || '0');
        const key = c.pod_id || c.pubkey || c.node;
        if (key && !isNaN(val)) { map.set(key, val); list.push(val); }
    };
    creditsData.mainnet.forEach((c: any) => processCredit(c, mainnetCreditMap, mainnetValues));
    creditsData.devnet.forEach((c: any) => processCredit(c, devnetCreditMap, devnetValues));

    const medianMainnet = mainnetValues.sort((a, b) => a - b)[Math.floor(mainnetValues.length / 2)] || 0;
    const medianDevnet = devnetValues.sort((a, b) => a - b)[Math.floor(devnetValues.length / 2)] || 0;

    const processedNodes: EnrichedNode[] = [];
    const mainnetFingerprints = new Map<string, number>();

    const getFingerprint = (p: any, assumedNetwork: 'MAINNET' | 'DEVNET') => {
      const key = extractPubkey(p);
      const rawCredVal = assumedNetwork === 'MAINNET' ? mainnetCreditMap.get(key) : devnetCreditMap.get(key);
      const credits = rawCredVal !== undefined ? rawCredVal : 'NULL';
      return `${key}|${p.address}|${p.storage_committed}|${p.storage_used}|${p.version}|${p.is_public}|${credits}`;
    };

    rawPrivateNodes.forEach((pod: any) => {
      const pubkey = extractPubkey(pod);
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      const rawCreds = mainnetCreditMap.get(pubkey);
      let credits: number | null = null;
      let isUntracked = false;
      if (rawCreds !== undefined) { credits = rawCreds; }
      else if (isCreditsApiOnline) { isUntracked = true; }

      const uptimeVal = Number(pod.uptime) || 0;
      const node: EnrichedNode = {
        ...pod, pubkey: pubkey, network: 'MAINNET', credits: credits, isUntracked: isUntracked,
        is_operator: pod.is_operator || false,
        storage_committed: pod.storage_committed,
        storage_used: pod.storage_used,
        uptime: uptimeVal,
        health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
        location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
      };
      processedNodes.push(node);
      const fingerprint = getFingerprint(pod, 'MAINNET');
      mainnetFingerprints.set(fingerprint, uptimeVal);
    });

    validPublicNodes.forEach((pod: any) => {
      const potentialMainnetFingerprint = getFingerprint(pod, 'MAINNET');
      const publicUptime = Number(pod.uptime) || 0;
      if (mainnetFingerprints.has(potentialMainnetFingerprint)) {
        const privateUptime = mainnetFingerprints.get(potentialMainnetFingerprint) || 0;
        if (Math.abs(privateUptime - publicUptime) <= 3600) return; 
      }

      const pubkey = extractPubkey(pod);
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
      let credits: number | null = null;
      let isUntracked = false;
      const mainnetVal = mainnetCreditMap.get(pubkey);
      const devnetVal = devnetCreditMap.get(pubkey);
      if (mainnetVal !== undefined && devnetVal === undefined) { network = 'MAINNET'; credits = mainnetVal; }
      else if (devnetVal !== undefined) { network = 'DEVNET'; credits = devnetVal; }
      else { network = 'DEVNET'; if (isCreditsApiOnline) { isUntracked = true; } }

      const node: EnrichedNode = {
        ...pod, pubkey: pubkey, network: network, credits: credits, isUntracked: isUntracked,
        storage_committed: pod.storage_committed,
        storage_used: pod.storage_used,
        uptime: publicUptime,
        health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
        location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
      };
      processedNodes.push(node);
    });

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
        medianCreditsForScore, node.credits, medianStorage, isCreditsApiOnline
      );
      return {
        ...node,
        location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city },
        health: vitality.total,
        healthBreakdown: vitality.breakdown
      };
    });

    const mainnetList = finalNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
    const devnetList = finalNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
    const assignRank = (list: EnrichedNode[]) => {
      let r = 1;
      list.forEach((n, i) => { if (i > 0 && (n.credits || 0) < (list[i-1].credits || 0)) r = i + 1; n.rank = r; });
    };
    assignRank(mainnetList);
    assignRank(devnetList);

    const allSorted = [...mainnetList, ...devnetList];
    allSorted.sort((a, b) => b.health - a.health);
    let hr = 1;
    allSorted.forEach((n, i) => { if (i > 0 && n.health < allSorted[i-1].health) hr = i + 1; n.health_rank = hr; });

    let totalUptime = 0, totalVersion = 0, totalReputation = 0, reputationCount = 0, totalStorage = 0;
    allSorted.forEach(node => {
      totalUptime += node.healthBreakdown.uptime;
      totalVersion += node.healthBreakdown.version;
      totalStorage += node.healthBreakdown.storage;
      if (node.healthBreakdown.reputation !== null) { totalReputation += node.healthBreakdown.reputation; reputationCount++; }
    });
    const nodeCount = allSorted.length || 1;
    const avgHealth = Math.round(allSorted.reduce((a, b) => a + b.health, 0) / nodeCount);

    systemState = {
      ready: true,
      lastUpdated: Date.now(),
      data: {
        nodes: allSorted,
        stats: {
          consensusVersion,
          medianCredits: medianMainnet,
          medianStorage,
          totalNodes: allSorted.length,
          medianCredits: medianMainnet,
          medianStorage: medianStorage,
          systemStatus: { credits: isCreditsApiOnline, rpc: true },
          avgBreakdown: {
            total: avgHealth,
            uptime: Math.round(totalUptime / nodeCount),
            version: Math.round(totalVersion / nodeCount),
            reputation: reputationCount > 0 ? Math.round(totalReputation / reputationCount) : null,
            storage: Math.round(totalStorage / nodeCount)
          }
        }
      }
    };
    console.log(`[Worker] Snapshot Updated. ${allSorted.length} Nodes. Time: ${new Date().toISOString()}`);

  } catch (error) { console.error(`[Worker] Critical Failure in Loop:`, error); }
}

if (typeof window === 'undefined') {
    refreshNetworkPulse();
    setInterval(refreshNetworkPulse, WORKER_INTERVAL_MS);
}

export async function getNetworkPulse(mode: 'fast' | 'swarm' = 'fast'): Promise<{ nodes: EnrichedNode[], stats: any }> {
    if (!systemState.ready && systemState.lastUpdated === 0) {
         console.log("[API] Warmup... triggering initial fetch.");
         await refreshNetworkPulse();
    }
    return systemState.data;
}
