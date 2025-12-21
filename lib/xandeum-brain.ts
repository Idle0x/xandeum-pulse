// lib/xandeum-brain.ts
import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---
const PRIMARY_NODE = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29'
];
const TIMEOUT_PRIMARY = 4000;
const TIMEOUT_BACKUP = 6000;
const TIMEOUT_CREDITS = 2000; // NEW: Strict timeout for credits

// --- IN-MEMORY CACHE ---
const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

// --- TYPES ---
export interface EnrichedNode {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  storage_used: number;      
  storage_committed: number; 
  credits: number;
  health: number;
  location: {
    lat: number;
    lon: number;
    countryName: string;
    countryCode: string;
    city: string;
  };
  rank?: number;
}

// --- HELPER: Version Compare ---
const compareVersions = (v1: string, v2: string) => {
  const s1 = v1 || '0.0.0';
  const s2 = v2 || '0.0.0';
  const p1 = s1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = s2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// --- HELPER: Vitality Score ---
const calculateVitalityScore = (storageBytes: number, uptime: number, version: string, consensusVersion: string, medianCredits: number, credits: number) => {
  const storageGB = storageBytes / (1024 ** 3);
  
  // 1. Uptime
  let uptimeScore = 0;
  const days = uptime / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  // 2. Version
  let versionScore = 100;
  if (consensusVersion !== '0.0.0' && compareVersions(version || '0.0.0', consensusVersion) < 0) {
      versionScore = 50;
  }

  // 3. Reputation
  let reputationScore = 50; 
  if (medianCredits > 0 && credits > 0) {
      const ratio = credits / medianCredits;
      reputationScore = Math.min(100, ratio * 75);
  } else if (credits === 0) reputationScore = 0;

  // 4. Capacity
  let capacityScore = Math.min(100, (storageGB / 1000) * 100); 

  return Math.round((uptimeScore * 0.3) + (versionScore * 0.2) + (reputationScore * 0.25) + (capacityScore * 0.25));
};

// --- CORE: Fetch RPC ---
async function fetchRawData() {
  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  
  try {
    const res = await axios.post(`http://${PRIMARY_NODE}:6000/rpc`, payload, { timeout: TIMEOUT_PRIMARY });
    if (res.data?.result?.pods) return res.data.result.pods;
  } catch (e) { /* failover */ }

  const shuffled = BACKUP_NODES.sort(() => 0.5 - Math.random()).slice(0, 3);
  try {
    const winner = await Promise.any(shuffled.map(ip => 
      axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_BACKUP }).then(r => r.data?.result?.pods || [])
    ));
    return winner;
  } catch (e) { return []; }
}

// --- CORE: Fetch Credits (Non-Blocking) ---
async function fetchCredits() {
    try {
        const res = await axios.get('https://podcredits.xandeum.network/api/pods-credits', { timeout: TIMEOUT_CREDITS });
        return res.data;
    } catch (error) {
        console.warn("Credits API slow/down, skipping...");
        return [];
    }
}

// --- CORE: Geo Resolver ---
async function resolveLocations(ips: string[]) {
  const missing = ips.filter(ip => !geoCache.has(ip));
  
  if (missing.length > 0) {
    // A. Batch API
    try {
      for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);
        const res = await axios.post('http://ip-api.com/batch', chunk.map(ip => ({ query: ip, fields: "lat,lon,country,countryCode,city,query" })), { timeout: 3000 });
        res.data.forEach((d: any) => {
          if (d.lat && d.lon) {
            geoCache.set(d.query, { 
              lat: d.lat, lon: d.lon, 
              country: d.country, countryCode: d.countryCode, city: d.city 
            });
          }
        });
      }
    } catch (e) { /* API Fail */ }

    // B. Fallback Local DB
    missing.forEach(ip => {
      if (!geoCache.has(ip)) {
        const geo = geoip.lookup(ip);
        if (geo) {
          geoCache.set(ip, {
            lat: geo.ll[0],
            lon: geo.ll[1],
            country: new Intl.DisplayNames(['en'], { type: 'region' }).of(geo.country) || geo.country,
            countryCode: geo.country,
            city: geo.city || 'Unknown Node'
          });
        } else {
          geoCache.set(ip, { lat: 0, lon: 0, country: 'Private Network', countryCode: 'XX', city: 'Hidden' });
        }
      }
    });
  }
}

// --- MAIN EXPORT ---
export async function getNetworkPulse(): Promise<{ nodes: EnrichedNode[], stats: any }> {
  // 1. Parallel Fetch (With Fail-Safes)
  const [rawPods, creditsData] = await Promise.all([
    fetchRawData(),
    fetchCredits()
  ]);

  if (!rawPods || rawPods.length === 0) throw new Error("Network Unreachable");

  // 2. ROBUST CREDITS PARSING
  const creditsMap = new Map<string, number>();
  const creditsArray: number[] = [];
  
  const rawCredits = Array.isArray(creditsData) ? creditsData : (creditsData?.pods_credits || []);
  
  if (Array.isArray(rawCredits)) {
      rawCredits.forEach((c: any) => {
        // Force parse, default to 0 if NaN
        const val = parseFloat(c.credits || c.amount || '0');
        const key = c.pod_id || c.pubkey || c.node;
        if (key && !isNaN(val)) {
            creditsMap.set(key, val);
            creditsArray.push(val);
        }
      });
  }
  
  creditsArray.sort((a, b) => a - b);
  const medianCredits = creditsArray.length ? creditsArray[Math.floor(creditsArray.length / 2)] : 0;

  // 3. Version Stats
  const versionCounts: Record<string, number> = {};
  rawPods.forEach((p: any) => {
      const v = p.version || '0.0.0';
      versionCounts[v] = (versionCounts[v] || 0) + 1;
  });
  const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';

  // 4. Resolve Locations
  const uniqueIps = [...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[];
  await resolveLocations(uniqueIps);

  // 5. Enrich & Merge
  const enrichedNodes: EnrichedNode[] = rawPods.map((pod: any) => {
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
    
    // SAFETY FORCE CASTING - Prevents "0" strings from breaking math
    const storageCommitted = Number(pod.storage_committed) || 0;
    const storageUsed = Number(pod.storage_used) || 0;
    const credits = creditsMap.get(pod.pubkey) || 0;
    const uptime = Number(pod.uptime) || 0;
    
    const health = calculateVitalityScore(storageCommitted, uptime, pod.version, consensusVersion, medianCredits, credits);

    return {
      ...pod,
      storage_committed: storageCommitted, 
      storage_used: storageUsed,           
      credits,
      health,
      location: {
        lat: loc.lat,
        lon: loc.lon,
        countryName: loc.country,
        countryCode: loc.countryCode,
        city: loc.city
      }
    };
  });

  // 6. Ranking
  enrichedNodes.sort((a, b) => b.credits - a.credits);
  let currentRank = 1;
  enrichedNodes.forEach((node, i) => {
      if (i > 0 && node.credits < enrichedNodes[i - 1].credits) currentRank = i + 1;
      node.rank = currentRank;
  });

  return {
    nodes: enrichedNodes,
    stats: {
      consensusVersion,
      medianCredits,
      totalNodes: enrichedNodes.length
    }
  };
}
