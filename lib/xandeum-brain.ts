import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---

// SHARED RPC NODES (Serve both Mainnet & Devnet gossip)
const RPC_NODES = [
  '173.212.203.145', // Primary
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29'
];

const TIMEOUT_RPC = 4000;
const TIMEOUT_CREDITS = 5000; 

// SEPARATE CREDIT APIS
const API_CREDITS_MAINNET = 'https://podcredits.xandeum.network/api/pods-credits';
const API_CREDITS_DEVNET  = 'https://podcredits.xandeum.network/devnet/api/pods-credits';

const geoCache = new Map<string, { lat: number; lon: number; country: string; countryCode: string; city: string }>();

export interface EnrichedNode {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  isUntracked?: boolean;
  network: 'MAINNET' | 'DEVNET' | 'UNKNOWN'; // Tag
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
}

// --- MATH HELPERS (Standard) ---
const cleanSemver = (v: string) => (v || '0.0.0').replace(/[^0-9.]/g, '');
const compareVersions = (v1: string, v2: string) => {
  const p1 = cleanSemver(v1).split('.').map(Number);
  const p2 = cleanSemver(v2).split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    if ((p1[i]||0) > (p2[i]||0)) return 1;
    if ((p1[i]||0) < (p2[i]||0)) return -1;
  }
  return 0;
};
const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) => 100 / (1 + Math.exp(-steepness * (value - midpoint)));
const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
    if (median === 0) return value > 0 ? maxScore : 0;
    return Math.min(maxScore, (maxScore / 2) * Math.log2((value / median) + 1));
};
const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedUniqueVersions: string[]) => {
    if (compareVersions(nodeVersion, consensusVersion) >= 0) return 100;
    const distance = sortedUniqueVersions.indexOf(nodeVersion) - sortedUniqueVersions.indexOf(consensusVersion);
    return distance <= 0 ? 100 : Math.max(0, 10 - (distance - 5)); 
};

// --- VITALITY SCORING ---
const calculateVitalityScore = (
    storageCommitted: number, 
    storageUsed: number,
    uptimeSeconds: number, 
    version: string, 
    consensusVersion: string, 
    sortedUniqueVersions: string[], 
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

  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedUniqueVersions);

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

// --- DATA FETCHING ---

async function fetchRawData() {
  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  
  // Try Primary First
  try {
      const res = await axios.post(`http://${RPC_NODES[0]}:6000/rpc`, payload, { timeout: TIMEOUT_RPC });
      if (res.data?.result?.pods) return res.data.result.pods;
  } catch (e) { /* fallthrough */ }

  // Shuffle Backups
  const shuffled = RPC_NODES.slice(1).sort(() => 0.5 - Math.random()).slice(0, 3);
  try {
      const winner = await Promise.any(shuffled.map(ip => 
          axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC })
               .then(r => r.data?.result?.pods || [])
      ));
      return winner;
  } catch (e) { return []; }
}

async function fetchCredits() {
    // Parallel Fetch from both environments
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_CREDITS_MAINNET, { timeout: TIMEOUT_CREDITS }),
        axios.get(API_CREDITS_DEVNET, { timeout: TIMEOUT_CREDITS })
    ]);

    return {
        mainnet: mainnetRes.status === 'fulfilled' ? (mainnetRes.value.data?.pods_credits || mainnetRes.value.data || []) : [],
        devnet: devnetRes.status === 'fulfilled' ? (devnetRes.value.data?.pods_credits || devnetRes.value.data || []) : []
    };
}

async function resolveLocations(ips: string[]) {
  // [Exact same geo logic as before]
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

export async function getNetworkPulse(): Promise<{ nodes: EnrichedNode[], stats: any }> {
  const [rawPods, creditsData] = await Promise.all([ fetchRawData(), fetchCredits() ]);
  if (!rawPods || rawPods.length === 0) throw new Error("Network Unreachable");

  // 1. Build the Unified Credit Map (The "Merge")
  const creditsMap = new Map<string, { val: number, net: 'MAINNET' | 'DEVNET' }>();
  const allCreditsValues: number[] = [];

  // Parse Devnet First (Base Layer)
  if (Array.isArray(creditsData.devnet)) {
      creditsData.devnet.forEach((c: any) => {
          const val = parseFloat(c.credits || c.amount || '0');
          const key = c.pod_id || c.pubkey || c.node;
          if (key && !isNaN(val)) {
             creditsMap.set(key, { val, net: 'DEVNET' });
             allCreditsValues.push(val);
          }
      });
  }

  // Parse Mainnet Second (Overwrite Layer - Priority)
  if (Array.isArray(creditsData.mainnet)) {
      creditsData.mainnet.forEach((c: any) => {
          const val = parseFloat(c.credits || c.amount || '0');
          const key = c.pod_id || c.pubkey || c.node;
          if (key && !isNaN(val)) {
             creditsMap.set(key, { val, net: 'MAINNET' }); // Overwrites if exists
             allCreditsValues.push(val);
          }
      });
  }

  allCreditsValues.sort((a, b) => a - b);
  const medianCredits = allCreditsValues.length ? allCreditsValues[Math.floor(allCreditsValues.length / 2)] : 0;

  // Stats Calcs
  const storageArray: number[] = rawPods.map((p: any) => Number(p.storage_committed) || 0).sort((a: number, b: number) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  const versionCounts: Record<string, number> = {};
  const uniqueVersionsSet = new Set<string>();
  rawPods.forEach((p: any) => { 
      const v = (p.version || '0.0.0'); 
      const cleanV = cleanSemver(v);
      versionCounts[cleanV] = (versionCounts[cleanV] || 0) + 1;
      uniqueVersionsSet.add(v);
  });
  const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';
  const sortedUniqueVersions = Array.from(uniqueVersionsSet).sort((a, b) => compareVersions(b, a));

  await resolveLocations([...new Set(rawPods.map((p: any) => p.address.split(':')[0]))] as string[]);

  let sumUptimeScore = 0;
  let sumVersionScore = 0;
  let sumReputationScore = 0;
  let sumStorageScore = 0;
  let sumHealthTotal = 0;

  // 2. Enrich the Nodes
  const enrichedNodes: EnrichedNode[] = rawPods.map((pod: any) => {
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    const storageCommitted = Number(pod.storage_committed) || 0;
    const storageUsed = Number(pod.storage_used) || 0;
    const uptime = Number(pod.uptime) || 0;
    const nodeKey = pod.pubkey || pod.public_key;

    // LOOKUP IN MERGED MAP
    const creditData = creditsMap.get(nodeKey);
    
    // Determine Status
    const credits = creditData ? creditData.val : null;
    const network = creditData ? creditData.net : 'UNKNOWN'; // Unknown usually implies Mainnet but untracked
    const isUntracked = !creditData && (creditsData.mainnet.length > 0 || creditsData.devnet.length > 0);

    const vitality = calculateVitalityScore(
        storageCommitted, storageUsed, uptime, 
        pod.version || '0.0.0', consensusVersion, sortedUniqueVersions,
        medianCredits, credits, medianStorage
    );

    sumUptimeScore += vitality.breakdown.uptime;
    sumVersionScore += vitality.breakdown.version;
    if (vitality.breakdown.reputation !== null) sumReputationScore += vitality.breakdown.reputation;
    sumStorageScore += vitality.breakdown.storage;
    sumHealthTotal += vitality.total;

    return {
      ...pod,
      pubkey: nodeKey,
      network, // Pass the tag to UI
      storage_committed: storageCommitted, 
      storage_used: storageUsed,           
      credits, 
      isUntracked,
      health: vitality.total,
      healthBreakdown: vitality.breakdown, 
      location: { 
          lat: loc.lat, 
          lon: loc.lon, 
          countryName: loc.country, 
          countryCode: loc.countryCode, 
          city: loc.city 
      }
    };
  });

  enrichedNodes.sort((a, b) => (b.credits || 0) - (a.credits || 0));
  let currentRank = 1;
  enrichedNodes.forEach((node, i) => { if (i > 0 && (node.credits || 0) < (enrichedNodes[i - 1].credits || 0)) currentRank = i + 1; node.rank = currentRank; });

  const total = enrichedNodes.length;

  return { 
    nodes: enrichedNodes, 
    stats: { 
        consensusVersion, 
        medianCredits, 
        medianStorage,
        totalNodes: total,
        systemStatus: {
            credits: creditsData.mainnet.length > 0 || creditsData.devnet.length > 0, 
            rpc: true 
        },
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
