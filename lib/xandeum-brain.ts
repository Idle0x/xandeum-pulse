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
const TIMEOUT_CREDITS = 2000; 

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

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
  healthBreakdown: {
      uptime: number;
      version: number;
      reputation: number;
      capacity: number;
  };
  location: {
    lat: number;
    lon: number;
    countryName: string;
    countryCode: string;
    city: string;
  };
  rank?: number;
}

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

// --- LOGIC V1.5: Smoothed & Relative Scoring ---
const calculateVitalityScore = (
  storageCommitted: number, 
  uptime: number, 
  version: string, 
  consensusVersion: string, 
  medianCredits: number, 
  credits: number,
  medianStorage: number // NEW: We now pass the network median storage
) => {
  
  // 1. GATEKEEPER RULE: No storage = No Health
  if (storageCommitted <= 0) {
      return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, capacity: 0 } };
  }

  // 2. UPTIME (Smoothed Curve)
  // Logic: Linear ramp up to 30 days. No more cliffs.
  // 30 days * 24 hours * 60 mins * 60 seconds = 2,592,000 seconds
  const MAX_UPTIME_CAP = 2592000; 
  let uptimeScore = (uptime / MAX_UPTIME_CAP) * 100;
  // Penalty: New nodes (<24h) get a slight dampener to prove stability
  if (uptime < 86400) uptimeScore = uptimeScore * 0.5; 
  uptimeScore = Math.min(100, Math.max(0, uptimeScore));

  // 3. VERSION (Risk Aware)
  // Logic: Latest = 100. Older = 50.
  let versionScore = 100;
  if (consensusVersion !== '0.0.0' && compareVersions(version || '0.0.0', consensusVersion) < 0) {
      versionScore = 50; 
  }

  // 4. REPUTATION (Relative to Network Wealth)
  // Logic: If you have 2x the median credits, you get 100 points.
  let reputationScore = 0;
  const safeMedianCredits = medianCredits || 1; // Prevent divide by zero
  if (credits > 0) {
      // Formula: (YourCredits / (Median * 2)) * 100
      reputationScore = (credits / (safeMedianCredits * 2)) * 100;
      reputationScore = Math.min(100, reputationScore);
  }

  // 5. CAPACITY (Relative to Network Size)
  // Logic: If you commit 2x the median storage, you get 100 points.
  // This auto-adjusts if the network average grows from 100GB to 10TB.
  let capacityScore = 0;
  const safeMedianStorage = medianStorage || (10 * 1024 * 1024 * 1024); // Fallback to 10GB if network is empty
  
  // Formula: (YourStorage / (Median * 2)) * 100
  capacityScore = (storageCommitted / (safeMedianStorage * 2)) * 100;
  capacityScore = Math.min(100, capacityScore);

  // WEIGHTING
  const total = Math.round(
      (uptimeScore * 0.30) + 
      (versionScore * 0.20) + 
      (reputationScore * 0.25) + 
      (capacityScore * 0.25)
  );
  
  return {
      total: Math.max(0, Math.min(100, total)),
      breakdown: {
          uptime: Math.round(uptimeScore),
          version: Math.round(versionScore),
          reputation: Math.round(reputationScore),
          capacity: Math.round(capacityScore)
      }
  };
};

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

async function fetchCredits() {
    try {
        const res = await axios.get('https://podcredits.xandeum.network/api/pods-credits', { timeout: TIMEOUT_CREDITS });
        return res.data;
    } catch (error) { return []; }
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

export async function getNetworkPulse(): Promise<{ nodes: EnrichedNode[], stats: any }> {
  const [rawPods, creditsData] = await Promise.all([ fetchRawData(), fetchCredits() ]);
  if (!rawPods || rawPods.length === 0) throw new Error("Network Unreachable");

  // 1. Process Credits (Existing logic)
  const creditsMap = new Map<string, number>();
  const creditsArray: number[] = [];
  const rawCredits = Array.isArray(creditsData) ? creditsData : (creditsData?.pods_credits || []);
  if (Array.isArray(rawCredits)) {
      rawCredits.forEach((c: any) => {
        const val = parseFloat(c.credits || c.amount || '0');
        const key = c.pod_id || c.pubkey || c.node;
        if (key && !isNaN(val)) { creditsMap.set(key, val); creditsArray.push(val); }
      });
  }
  creditsArray.sort((a, b) => a - b);
  const medianCredits = creditsArray.length ? creditsArray[Math.floor(creditsArray.length / 2)] : 0;

  // 2. Process Storage (NEW: Calculate Median Storage)
  const storageArray: number[] = rawPods
    .map((p: any) => Number(p.storage_committed) || 0)
    .sort((a: number, b: number) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 0;

  // 3. Process Version
  const versionCounts: Record<string, number> = {};
  rawPods.forEach((p: any) => { const v = p.version || '0.0.0'; versionCounts[v] = (versionCounts[v] || 0) + 1; });
  const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';

  // 4. Resolve Locations
  const uniqueIps = [...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[];
  await resolveLocations(uniqueIps);

  // 5. Build Nodes & Calculate Scores
  let sumUptimeScore = 0;
  let sumVersionScore = 0;
  let sumReputationScore = 0;
  let sumCapacityScore = 0;
  let sumHealthTotal = 0;

  const enrichedNodes: EnrichedNode[] = rawPods.map((pod: any) => {
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
    
    const storageCommitted = Number(pod.storage_committed) || 0;
    const storageUsed = Number(pod.storage_used) || 0;
    const credits = creditsMap.get(pod.pubkey) || 0;
    const uptime = Number(pod.uptime) || 0;
    
    // PASS MEDIAN STORAGE HERE
    const vitality = calculateVitalityScore(
        storageCommitted, 
        uptime, 
        pod.version, 
        consensusVersion, 
        medianCredits, 
        credits,
        medianStorage // <--- Injected
    );

    // Add to sums for network averages
    sumUptimeScore += vitality.breakdown.uptime;
    sumVersionScore += vitality.breakdown.version;
    sumReputationScore += vitality.breakdown.reputation;
    sumCapacityScore += vitality.breakdown.capacity;
    sumHealthTotal += vitality.total;

    return {
      ...pod,
      storage_committed: storageCommitted, 
      storage_used: storageUsed,           
      credits,
      health: vitality.total,
      healthBreakdown: vitality.breakdown, 
      location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city }
    };
  });

  enrichedNodes.sort((a, b) => b.credits - a.credits);
  let currentRank = 1;
  enrichedNodes.forEach((node, i) => { if (i > 0 && node.credits < enrichedNodes[i - 1].credits) currentRank = i + 1; node.rank = currentRank; });

  const total = enrichedNodes.length;

  return { 
    nodes: enrichedNodes, 
    stats: { 
        consensusVersion, 
        medianCredits, 
        totalNodes: total,
        avgBreakdown: {
            uptime: Math.round(sumUptimeScore / total),
            version: Math.round(sumVersionScore / total),
            reputation: Math.round(sumReputationScore / total),
            capacity: Math.round(sumCapacityScore / total),
            total: Math.round(sumHealthTotal / total)
        }
    } 
  };
}
