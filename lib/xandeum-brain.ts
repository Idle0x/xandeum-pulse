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
const TIMEOUT_CREDITS = 5000; 

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
}

// --- HELPERS ---

const cleanSemver = (v: string) => (v || '0.0.0').replace(/[^0-9.]/g, '');

const compareVersions = (v1: string, v2: string) => {
  const s1 = cleanSemver(v1);
  const s2 = cleanSemver(v2);
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

// --- MATH HELPERS V2.3 ---

const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) => {
    return 100 / (1 + Math.exp(-steepness * (value - midpoint)));
};

const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
    if (median === 0) return value > 0 ? maxScore : 0;
    const ratio = value / median;
    return Math.min(maxScore, (maxScore / 2) * Math.log2(ratio + 1));
};

// --- VERSION LOGIC (Urgency Curve + Semantic Safety) ---
const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedUniqueVersions: string[]) => {
    // 1. Semantic Check (Fixes 0.8.0-trynet vs 0.8.0 issue)
    if (compareVersions(nodeVersion, consensusVersion) >= 0) return 100;

    // 2. Rank Check
    const consensusIndex = sortedUniqueVersions.indexOf(consensusVersion);
    const nodeIndex = sortedUniqueVersions.indexOf(nodeVersion);

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

// --- MAIN SCORING LOGIC ---
const calculateVitalityScore = (
    storageCommitted: number, 
    storageUsed: number,
    uptimeSeconds: number, 
    version: string, 
    consensusVersion: string, 
    sortedUniqueVersions: string[], 
    medianCredits: number, 
    credits: number,
    medianStorage: number
) => {
  if (storageCommitted <= 0) {
      return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 } };
  }

  // Uptime
  const uptimeDays = uptimeSeconds / 86400;
  let uptimeScore = calculateSigmoidScore(uptimeDays, 7, 0.2);
  if (uptimeDays < 1) uptimeScore = Math.min(uptimeScore, 20); 

  // Storage (Base + Bonus)
  const baseStorageScore = calculateLogScore(storageCommitted, medianStorage, 80);
  let utilizationBonus = 0;
  if (storageUsed > 0) {
      const usedGB = storageUsed / (1024 ** 3);
      utilizationBonus = Math.min(20, 5 * Math.log2(usedGB + 2)); 
  }
  const totalStorageScore = Math.min(100, baseStorageScore + utilizationBonus);

  // Reputation
  let reputationScore = 0;
  if (medianCredits > 0) {
      reputationScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
  }

  // Version
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedUniqueVersions);

  const total = Math.round(
      (uptimeScore * 0.35) + 
      (totalStorageScore * 0.30) + 
      (reputationScore * 0.20) + 
      (versionScore * 0.15)
  );
  
  return {
      total: Math.max(0, Math.min(100, total)),
      breakdown: {
          uptime: Math.round(uptimeScore),
          version: Math.round(versionScore),
          reputation: Math.round(reputationScore),
          storage: Math.round(totalStorageScore) 
      }
  };
};

// --- DATA FETCHING ---

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
    } catch (error) { 
        console.error("Brain: Credits Fetch Failed", error);
        return []; 
    }
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

// --- EXPORTED FUNCTION ---

export async function getNetworkPulse(): Promise<{ nodes: EnrichedNode[], stats: any }> {
  const [rawPods, creditsData] = await Promise.all([ fetchRawData(), fetchCredits() ]);
  if (!rawPods || rawPods.length === 0) throw new Error("Network Unreachable");

  // 1. Process Credits (Robust Logic)
  const creditsMap = new Map<string, number>();
  const creditsArray: number[] = [];
  
  // Find the actual array of credits
  let rawCreditsList: any[] = [];
  if (Array.isArray(creditsData)) rawCreditsList = creditsData;
  else if (creditsData && Array.isArray(creditsData.pods_credits)) rawCreditsList = creditsData.pods_credits;
  else if (creditsData && typeof creditsData === 'object') {
     // Last ditch effort: find any array property
     const possibleKey = Object.keys(creditsData).find(k => Array.isArray(creditsData[k]));
     if (possibleKey) rawCreditsList = creditsData[possibleKey];
  }

  if (rawCreditsList.length > 0) {
      rawCreditsList.forEach((c: any) => {
        const val = parseFloat(c.credits || c.amount || '0');
        // Match ANY of these keys
        const key = c.pod_id || c.pubkey || c.node || c.public_key;
        
        if (key && !isNaN(val)) { 
            const cleanKey = String(key).trim(); // Normalize key
            creditsMap.set(cleanKey, val); 
            creditsArray.push(val); 
        }
      });
  }
  
  creditsArray.sort((a, b) => a - b);
  const medianCredits = creditsArray.length ? creditsArray[Math.floor(creditsArray.length / 2)] : 0;

  // 2. Median Storage
  const storageArray: number[] = rawPods.map((p: any) => Number(p.storage_committed) || 0).sort((a: number, b: number) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  // 3. Consensus Version
  const versionCounts: Record<string, number> = {};
  const uniqueVersionsSet = new Set<string>();
  
  rawPods.forEach((p: any) => { 
      const v = (p.version || '0.0.0');
      const clean = cleanSemver(v);
      versionCounts[clean] = (versionCounts[clean] || 0) + 1;
      uniqueVersionsSet.add(v);
  });
  
  const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';
  const sortedUniqueVersions = Array.from(uniqueVersionsSet).sort((a, b) => compareVersions(b, a));

  // 4. Locations
  const uniqueIps = [...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[];
  await resolveLocations(uniqueIps);

  // 5. Build Enriched Nodes
  let sumUptimeScore = 0;
  let sumVersionScore = 0;
  let sumReputationScore = 0;
  let sumStorageScore = 0;
  let sumHealthTotal = 0;

  const enrichedNodes: EnrichedNode[] = rawPods.map((pod: any) => {
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
    
    const storageCommitted = Number(pod.storage_committed) || 0;
    const storageUsed = Number(pod.storage_used) || 0;
    const uptime = Number(pod.uptime) || 0;
    
    // Normalize node key for matching
    const nodeKeyRaw = pod.pubkey || pod.public_key;
    const nodeKey = String(nodeKeyRaw).trim();
    
    const credits = creditsMap.get(nodeKey) || 0;
    
    const vitality = calculateVitalityScore(
        storageCommitted,
        storageUsed, 
        uptime, 
        pod.version || '0.0.0', 
        consensusVersion, 
        sortedUniqueVersions,
        medianCredits, 
        credits,
        medianStorage
    );

    sumUptimeScore += vitality.breakdown.uptime;
    sumVersionScore += vitality.breakdown.version;
    sumReputationScore += vitality.breakdown.reputation;
    sumStorageScore += vitality.breakdown.storage;
    sumHealthTotal += vitality.total;

    return {
      ...pod,
      pubkey: nodeKeyRaw, 
      storage_committed: storageCommitted, 
      storage_used: storageUsed,           
      credits, 
      health: vitality.total,
      healthBreakdown: vitality.breakdown, 
      location: { lat: loc.lat, lon: loc.lon, countryName: loc.country, countryCode: loc.countryCode, city: loc.city }
    };
  });

  // 6. Sort
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
            storage: Math.round(sumStorageScore / total), 
            total: Math.round(sumHealthTotal / total)
        }
    } 
  };
}
