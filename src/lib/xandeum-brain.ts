import axios from 'axios';
import geoip from 'geoip-lite';
import { publicOrchestrator } from './rpc-orchestrator';
import { 
  cleanSemver, 
  compareVersions, 
  calculateVitalityScore 
} from './xandeum-math';
import { fetchNodeHistoryReport, HistoryContext } from '../utils/historyAggregator';

// --- CONFIGURATION ---

const TIMEOUT_RPC = 8000;
const TIMEOUT_CREDITS = 8000;

const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_CREDITS_DEVNET = 'https://podcredits.xandeum.network/api/pods-credits';

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

// Simple in-memory cache for Private RPC to prevent "0 nodes" on blips
let privateMainnetCache: { data: any[], timestamp: number } = { data: [], timestamp: 0 };

// --- INTERFACES ---

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
    // NEW: Penalty Object
    penalties?: {
      restarts: number;
      consistency: number;
      restarts_7d_count: number;
    };
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

// robustly strip port to get raw IP for deduplication
function getIp(addressStr: string): string {
  if (!addressStr) return '';
  return addressStr.split(':')[0];
}

// --- FETCHING (Hero A: Private) ---

async function fetchPrivateMainnetNodes() {
  const privateUrl = process.env.XANDEUM_PRIVATE_RPC_URL;
  if (!privateUrl) { console.warn("XANDEUM_PRIVATE_RPC_URL is not set."); return []; }

  // Serve cache if within 15 seconds (Robustness for Private Blips)
  if (Date.now() - privateMainnetCache.timestamp < 15000 && privateMainnetCache.data.length > 0) {
      return privateMainnetCache.data;
  }

  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  try {
    const res = await axios.post(privateUrl, payload, { timeout: TIMEOUT_RPC });
    if (res.data?.result?.pods && Array.isArray(res.data.result.pods)) {
      // Update Cache
      privateMainnetCache = { data: res.data.result.pods, timestamp: Date.now() };
      return res.data.result.pods;
    }
  } catch (e) {
    const errMsg = (e as any).message;
    console.warn("Private Mainnet RPC Failed:", errMsg);
    // On failure, return stale cache if available
    if (privateMainnetCache.data.length > 0) return privateMainnetCache.data;
  }
  return [];
}

// --- FETCHING (Operator Injection) ---

async function fetchOperatorNode() {
  const privateUrl = process.env.XANDEUM_PRIVATE_RPC_URL;
  const operatorPubkey = process.env.XANDEUM_OPERATOR_PUBKEY;
  const operatorIp = process.env.XANDEUM_OPERATOR_IP;

  if (!privateUrl || !operatorPubkey || !operatorIp) return null;

  const payload = { jsonrpc: '2.0', method: 'get-stats', params: [], id: 1 };
  try {
    const res = await axios.post(privateUrl, payload, { timeout: TIMEOUT_RPC });
    const stats = res.data?.result;
    if (stats) {
      return {
        address: `${operatorIp}:9001`,
        rpc_port: 6000,
        pubkey: operatorPubkey,
        is_public: false,
        version: "1.2.0", // Manual override
        uptime: stats.uptime,
        storage_committed: stats.file_size,
        storage_used: 0,
        last_seen_timestamp: Math.floor(Date.now() / 1000),
        is_operator: true
      };
    }
  } catch (e) { console.warn("Operator Node Fetch Failed:", (e as any).message); }
  return null;
}

// --- FETCHING (Credits) ---

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

export async function getNetworkPulse(mode: 'fast' | 'swarm' = 'fast'): Promise<{ nodes: EnrichedNode[], stats: any }> {

  // ---------------------------------------------------------
  // PHASE 1: COLLECTION
  // ---------------------------------------------------------

  const [rawPrivateNodes, operatorNode, rawPublicNodes, creditsData, historyReport] = await Promise.all([
    fetchPrivateMainnetNodes(),      // Hero A (Private)
    fetchOperatorNode(),             // Operator Injection
    publicOrchestrator.fetchNodes(), // Hero B + Passive Discovery (Public)
    fetchCredits(),
    fetchNodeHistoryReport()         // Historical Forensics (7-Day Report Card)
  ]);

  // Inject Operator
  if (operatorNode) {
    const exists = rawPrivateNodes.find((p: any) => p.pubkey === operatorNode.pubkey);
    if (!exists) rawPrivateNodes.unshift(operatorNode);
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
  // PHASE 2: INSTANCE-BASED DEDUPLICATION (The Fix)
  // ---------------------------------------------------------

  const processedNodes: EnrichedNode[] = [];
  
  // This Set tracks "Instances" we have officially accepted.
  // Format: "pubkey-ip" (Raw IP, no port)
  const knownInstances = new Set<string>();

  // A. PROCESS PRIVATE RPC (The Authority) -> ALWAYS MAINNET
  // We trust these blindly. They are the Anchor.
  rawPrivateNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const rawIp = getIp(pod.address);
    const loc = geoCache.get(rawIp) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    const rawCreds = mainnetCreditMap.get(pubkey);
    let credits: number | null = null;
    let isUntracked = false;
    
    // Mainnet nodes usually have mainnet credits, but if missing, they are still Mainnet (just untracked/new)
    if (rawCreds !== undefined) { credits = rawCreds; }
    else if (isCreditsApiOnline) { isUntracked = true; }

    const uptimeVal = Number(pod.uptime) || 0;
    
    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: 'MAINNET', credits: credits, isUntracked: isUntracked,
      is_operator: pod.is_operator || false,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: uptimeVal,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    
    processedNodes.push(node);
    
    // Register this instance as "Known"
    const instanceId = `${pubkey}-${rawIp}`;
    knownInstances.add(instanceId);
  });

  // B. PROCESS PUBLIC SWARM (The Filler)
  // We only accept nodes here if they are NOT in the 'knownInstances' set.
  rawPublicNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const rawIp = getIp(pod.address);
    const instanceId = `${pubkey}-${rawIp}`;

    // STRICT CHECK: If this exact Pubkey+IP combo exists in Private, DROP IT.
    // It is a ghost/duplicate. We trust the Private RPC data, not this one.
    if (knownInstances.has(instanceId)) {
      return; 
    }

    // If we are here, it is a NEW instance (either Devnet, or a Mainnet node missed by Private RPC).
    const loc = geoCache.get(rawIp) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
    const publicUptime = Number(pod.uptime) || 0;

    // Determine Network based on Credits
    let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
    let credits: number | null = null;
    let isUntracked = false;

    const mainnetVal = mainnetCreditMap.get(pubkey);
    const devnetVal = devnetCreditMap.get(pubkey);

    if (mainnetVal !== undefined && devnetVal === undefined) {
      // It has Mainnet credits only -> Likely a Mainnet node that Private RPC missed
      network = 'MAINNET';
      credits = mainnetVal;
    } else if (devnetVal !== undefined) {
      // It has Devnet credits -> Definitely Devnet
      network = 'DEVNET';
      credits = devnetVal;
    } else {
      // No credits found -> Default to Devnet (Safe assumption for wild nodes)
      network = 'DEVNET';
      if (isCreditsApiOnline) { isUntracked = true; }
    }

    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: network, credits: credits, isUntracked: isUntracked,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: publicUptime,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    
    processedNodes.push(node);
    // Add to set (to prevent duplicates within the public array itself, though rare)
    knownInstances.add(instanceId);
  });

  // ---------------------------------------------------------
  // PHASE 3: SCORING & STATS
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
  const p95Index = Math.floor(storageArray.length * 0.95);
  const p95Storage = storageArray.length ? storageArray[p95Index] : 1;

  // Batch Resolve IPs
  await resolveLocations([...new Set(processedNodes.map(p => getIp(p.address)))]);

  const finalNodes = processedNodes.map(node => {
    const rawIp = getIp(node.address);
    const loc = geoCache.get(rawIp) || node.location;
    const medianCreditsForScore = node.network === 'MAINNET' ? medianMainnet : medianDevnet;

    // LOOK UP HISTORICAL CONTEXT (Report Card)
    // We use the same ID logic: Pubkey + IP + Network (optional, but good for uniqueness)
    // Note: HistoryAggregator likely uses "pubkey-ip" as well.
    let nodeHistory: HistoryContext = { 
        restarts_7d: 0, 
        restarts_24h: 0, 
        yield_velocity_24h: 0, 
        consistency_score: 1,
        frozen_duration_hours: 0
    };

    const stableId = `${node.pubkey}-${rawIp}-${node.network}`;

    if (historyReport.has(stableId)) {
        nodeHistory = historyReport.get(stableId)!;
    }

    const vitality = calculateVitalityScore(
      node.storage_committed, node.storage_used, node.uptime,
      node.version, consensusVersion, sortedCleanVersions,
      medianCreditsForScore, node.credits, medianStorage, 
      p95Storage, 
      isCreditsApiOnline,
      nodeHistory 
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
      systemStatus: { credits: isCreditsApiOnline, rpc: true },
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
