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

// Helper: Standard Semver Comparison to sort the list correctly
const compareVersions = (v1: string, v2: string) => {
  const s1 = (v1 || '0.0.0').replace(/[^0-9.]/g, ''); 
  const s2 = (v2 || '0.0.0').replace(/[^0-9.]/g, '');
  
  const p1 = s1.split('.').map(Number);
  const p2 = s2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// --- MATH HELPERS V2.2 ---

const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) => {
    return 100 / (1 + Math.exp(-steepness * (value - midpoint)));
};

const calculateLogScore = (value: number, median: number) => {
    if (median === 0) return value > 0 ? 100 : 0;
    const ratio = value / median;
    return Math.min(100, 50 * Math.log2(ratio + 1));
};

// --- YOUR CUSTOM VERSION LOGIC ---
const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedUniqueVersions: string[]) => {
    // 1. If exact match or better
    if (nodeVersion === consensusVersion) return 100;

    // 2. Find indices in the sorted list (High to Low)
    const consensusIndex = sortedUniqueVersions.indexOf(consensusVersion);
    const nodeIndex = sortedUniqueVersions.indexOf(nodeVersion);

    // If version not found in the list (rare edge case), default to 0
    if (nodeIndex === -1) return 0;

    // "Distance" = How many active network versions separate you from consensus
    const distance = nodeIndex - consensusIndex;

    // If negative distance (you are on a newer version than consensus), you get 100
    if (distance < 0) return 100;

    // --- YOUR SPECIFIC PENALTY LADDER ---
    if (distance === 0) return 100;       // Same as consensus
    if (distance === 1) return 90;        // 1 version behind: -10
    if (distance === 2) return 70;        // 2 versions behind: -20
    if (distance === 3) return 50;        // 3 versions behind: -20
    if (distance === 4) return 30;        // 4 versions behind: -20
    if (distance === 5) return 10;        // 5 versions behind: -20
    
    // For ranks > 5, subtract 1 for each additional step
    // Rank 6 = 9, Rank 7 = 8, ... Rank 15 = 0
    const extraSteps = distance - 5;
    return Math.max(0, 10 - extraSteps); 
};

// --- MAIN SCORING LOGIC ---
const calculateVitalityScore = (
    storageCommitted: number, 
    uptimeSeconds: number, 
    version: string, 
    consensusVersion: string, 
    sortedUniqueVersions: string[], 
    medianCredits: number, 
    credits: number,
    medianStorage: number
) => {
  // 1. GATEKEEPER RULE
  if (storageCommitted <= 0) {
      return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, capacity: 0 } };
  }

  // 2. UPTIME SCORE (Weight: 35%) -> Sigmoid
  const uptimeDays = uptimeSeconds / 86400;
  let uptimeScore = calculateSigmoidScore(uptimeDays, 7, 0.2);
  if (uptimeDays < 1) uptimeScore = Math.min(uptimeScore, 20); 

  // 3. CAPACITY SCORE (Weight: 30%) -> Logarithmic Relative
  const capacityScore = calculateLogScore(storageCommitted, medianStorage);

  // 4. REPUTATION SCORE (Weight: 20%) -> Linear Relative
  let reputationScore = 0;
  if (medianCredits > 0) {
      reputationScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
  }

  // 5. VERSION SCORE (Weight: 15%) -> Your Custom Rank Logic
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedUniqueVersions);

  // WEIGHTED TOTAL
  const total = Math.round(
      (uptimeScore * 0.35) + 
      (capacityScore * 0.30) + 
      (reputationScore * 0.20) + 
      (versionScore * 0.15)
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

  // 1. Process Credits
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

  // 2. Calculate Median Storage (for V2)
  const storageArray: number[] = rawPods.map((p: any) => Number(p.storage_committed) || 0).sort((a: number, b: number) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  // 3. Version Ranking (Consensus & List)
  const versionCounts: Record<string, number> = {};
  const uniqueVersionsSet = new Set<string>();
  
  rawPods.forEach((p: any) => { 
      // Normalize version string (remove suffix) for fair comparison
      const v = p.version || '0.0.0'; 
      versionCounts[v] = (versionCounts[v] || 0) + 1;
      uniqueVersionsSet.add(v);
  });
  
  // Consensus is simply the version with the highest count
  const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';
  
  // Sorted unique versions (High -> Low)
  const sortedUniqueVersions = Array.from(uniqueVersionsSet).sort((a, b) => compareVersions(b, a));

  // 4. Locations
  const uniqueIps = [...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[];
  await resolveLocations(uniqueIps);

  // 5. Enrichment Loop
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
    
    const vitality = calculateVitalityScore(
        storageCommitted, 
        uptime, 
        pod.version || '0.0.0', 
        consensusVersion, 
        sortedUniqueVersions, // Passing the full network context
        medianCredits, 
        credits,
        medianStorage
    );

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

  // 6. Final Sort
  enrichedNodes.sort((a, b) => b.credits - a.credits);
  let currentRank = 1;
  enrichedNodes.forEach((node, i) => { if (i > 0 && node.credits < enrichedNodes[i - 1].credits) currentRank = i + 1; node.rank = currentRank; });

  const total = enrichedNodes.length;

  return { 
    nodes: enrichedNodes, 
    stats: { 
        consensusVersion, 
        medianCredits, 
        medianStorage,
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
