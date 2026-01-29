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

// --- HELPER: STABLE IDENTITY ---

/**
 * Generates a stable unique ID for a node instance.
 * Logic: Pubkey + IP Address (Port stripped).
 * This ensures that if a node runs on port 9001 in public and 6000 in private,
 * it is still recognized as the SAME machine.
 */
function getStableId(pubkey: string, address: string): string {
  if (!pubkey) return 'unknown';
  // Strip port from address (e.g., "1.2.3.4:9001" -> "1.2.3.4")
  const ip = address.includes(':') ? address.split(':')[0] : address;
  return `${pubkey}-${ip}`;
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
        is_public: false, // Operator is usually hidden
        version: "1.2.0", // Manual override or fetch if available
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

  // 1. COLLECTION
  const [rawPrivateNodes, operatorNode, rawPublicNodes, creditsData, historyReport] = await Promise.all([
    fetchPrivateMainnetNodes(),
    fetchOperatorNode(),
    publicOrchestrator.fetchNodes(),
    fetchCredits(),
    fetchNodeHistoryReport()
  ]);

  // Inject Operator into Private List
  if (operatorNode) {
    const exists = rawPrivateNodes.find((p: any) => p.pubkey === operatorNode.pubkey);
    if (!exists) rawPrivateNodes.unshift(operatorNode);
  }

  if (rawPrivateNodes.length === 0 && rawPublicNodes.length === 0) {
    return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  const isCreditsApiOnline = creditsData.mainnet.length > 0 || creditsData.devnet.length > 0;

  // Process Credits Maps
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
  // PHASE 2: AUTHORITY-BASED DEDUPLICATION
  // ---------------------------------------------------------

  const processedNodes: EnrichedNode[] = [];
  const knownMainnetIds = new Set<string>();

  // A. PROCESS PRIVATE RPC (ANCHOR - THE AUTHORITY)
  // We strictly assume EVERYTHING in Private RPC is Mainnet.
  rawPrivateNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const stableId = getStableId(pubkey, pod.address);
    
    // Log this ID as "Known on Mainnet"
    knownMainnetIds.add(stableId);

    const ip = pod.address.includes(':') ? pod.address.split(':')[0] : pod.address;
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    const rawCreds = mainnetCreditMap.get(pubkey);
    let credits: number | null = null;
    let isUntracked = false;
    if (rawCreds !== undefined) { credits = rawCreds; }
    else if (isCreditsApiOnline) { isUntracked = true; }

    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: 'MAINNET', credits: credits, isUntracked: isUntracked,
      is_operator: pod.is_operator || false,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: Number(pod.uptime) || 0,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    processedNodes.push(node);
  });

  // B. PROCESS PUBLIC SWARM (FILTER)
  rawPublicNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const stableId = getStableId(pubkey, pod.address);

    // --- THE FIX ---
    // If this specific machine (Pubkey + IP) was already seen in Private RPC,
    // we DROP IT entirely. We trust the Private RPC stats over Public stats.
    if (knownMainnetIds.has(stableId)) {
      return; 
    }

    // If we are here, it's a NEW node (Cluster node or Devnet node).
    const ip = pod.address.includes(':') ? pod.address.split(':')[0] : pod.address;
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
    let credits: number | null = null;
    let isUntracked = false;

    // Determine Network for this "Wild" node
    const mainnetVal = mainnetCreditMap.get(pubkey);
    const devnetVal = devnetCreditMap.get(pubkey);

    if (mainnetVal !== undefined) {
      // It has Mainnet credits -> Likely a second node in a cluster on Mainnet
      network = 'MAINNET';
      credits = mainnetVal;
    } else if (devnetVal !== undefined) {
      network = 'DEVNET';
      credits = devnetVal;
    } else {
      network = 'DEVNET';
      if (isCreditsApiOnline) { isUntracked = true; }
    }

    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: network, credits: credits, isUntracked: isUntracked,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: Number(pod.uptime) || 0,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    processedNodes.push(node);
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

  await resolveLocations([...new Set(processedNodes.map(p => p.address.includes(':') ? p.address.split(':')[0] : p.address))]);

  const finalNodes = processedNodes.map(node => {
    const ip = node.address.includes(':') ? node.address.split(':')[0] : node.address;
    const loc = geoCache.get(ip) || node.location;
    const medianCreditsForScore = node.network === 'MAINNET' ? medianMainnet : medianDevnet;

    // Stable ID for History Lookup (Forensics)
    const stableId = getStableId(node.pubkey
