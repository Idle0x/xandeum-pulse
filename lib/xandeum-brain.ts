import axios from 'axios';
import geoip from 'geoip-lite'; 

// --- CONFIGURATION ---

const PRIVATE_MAINNET_RPC = 'https://persian-starts-sounds-colon.trycloudflare.com/rpc';
// Public Swarm IPs
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
  isUntracked?: boolean; // <--- The Fix: New Optional Flag
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

// --- HELPERS (Scoring & Versioning) ---

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
    medianStorage: number
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

  // SCORING LOGIC UPDATE:
  // If credits !== null, we calculate reputation.
  // If credits === null, we SKIP reputation and re-weight the other metrics.
  if (credits !== null && medianCredits > 0) {
      reputationScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
      total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15));
  } else {
      // Re-weight if reputation is missing (API Down)
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

async function fetchPrivateMainnetNodes() {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    try {
        const res = await axios.post(PRIVATE_MAINNET_RPC, payload, { timeout: TIMEOUT_RPC });
        if (res.data?.result?.pods && Array.isArray(res.data.result.pods)) {
            return res.data.result.pods;
        }
    } catch (e) {
        console.warn("Private Mainnet RPC Failed:", (e as any).message);
    }
    return [];
}

async function fetchPublicSwarmNodes(mode: 'fast' | 'swarm') {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };

    // We strictly use Promise.any for speed and uniqueness
    const requests = PUBLIC_RPC_NODES.map(ip => 
        axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC })
             .then(r => r.data?.result?.pods || [])
             .catch(() => {
                 throw new Error(ip); 
             })
    );

    try {
        // Hero Mode: Return the first valid list we get.
        const winner = await Promise.any(requests);
        return winner;
    } catch (e) {
        console.error("Public Swarm fetch failed.");
        return [];
    }
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

  const [rawPrivateNodes, rawPublicNodes, creditsData] = await Promise.all([ 
      fetchPrivateMainnetNodes(), 
      fetchPublicSwarmNodes(mode), 
      fetchCredits() 
  ]);

  if (rawPrivateNodes.length === 0 && rawPublicNodes.length === 0) {
      return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  // Check if Credits API is actually Online
  const isCreditsApiOnline = creditsData.mainnet.length > 0 || creditsData.devnet.length > 0;

  // Build the Bank (Credits Maps)
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
  // PHASE 2 & 3: THE STRICT 7-FILTER SYSTEM
  // ---------------------------------------------------------

  const processedNodes: EnrichedNode[] = [];

  // Fingerprint Generator
  const getFingerprint = (p: any, assumedNetwork: 'MAINNET' | 'DEVNET') => {
      const key = p.pubkey || p.public_key;
      const rawCredVal = assumedNetwork === 'MAINNET' ? mainnetCreditMap.get(key) : devnetCreditMap.get(key);
      const credits = rawCredVal !== undefined ? rawCredVal : 'NULL'; 
      return `${key}|${p.address}|${p.storage_committed}|${p.storage_used}|${p.version}|${p.is_public}|${credits}`;
  };

  const mainnetFingerprints = new Set<string>();

  // A. PROCESS PRIVATE RPC (ANCHOR) -> ALWAYS MAINNET
  rawPrivateNodes.forEach((pod: any) => {
      const pubkey = pod.pubkey || pod.public_key;
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      const rawCreds = mainnetCreditMap.get(pubkey);
      
      // LOGIC FIX: 
      // If found in map -> credits = value, isUntracked = false
      // If NOT found AND API Online -> credits = null, isUntracked = true
      // If NOT found AND API Offline -> credits = null, isUntracked = false
      let credits: number | null = null;
      let isUntracked = false;

      if (rawCreds !== undefined) {
          credits = rawCreds;
      } else if (isCreditsApiOnline) {
          isUntracked = true;
      }

      const node: EnrichedNode = {
          ...pod,
          pubkey: pubkey,
          network: 'MAINNET',
          credits: credits,
          isUntracked: isUntracked,
          storage_committed: Number(pod.storage_committed) || 0,
          storage_used: Number(pod.storage_used) || 0,
          uptime: Number(pod.uptime) || 0,
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
      mainnetFingerprints.add(getFingerprint(pod, 'MAINNET'));
  });

  // B. PROCESS PUBLIC SWARM (SUBTRACTION)
  rawPublicNodes.forEach((pod: any) => {
      const potentialMainnetFingerprint = getFingerprint(pod, 'MAINNET');

      if (mainnetFingerprints.has(potentialMainnetFingerprint)) {
          return;
      }

      const pubkey = pod.pubkey || pod.public_key;
      const ip = pod.address.split(':')[0];
      const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

      let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
      let credits: number | null = null; 
      let isUntracked = false;

      const mainnetVal = mainnetCreditMap.get(pubkey);
      const devnetVal = devnetCreditMap.get(pubkey);

      // Network detection and Credit Assignment
      if (mainnetVal !== undefined && devnetVal === undefined) {
          network = 'MAINNET';
          credits = mainnetVal;
      } else if (devnetVal !== undefined) {
          network = 'DEVNET';
          credits = devnetVal;
      } else {
          // No credits found in either map
          // Default to DEVNET unless stronger evidence exists
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
          uptime: Number(pod.uptime) || 0,
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
  // PHASE 5: THE "GHOST PROTOCOL" (REWRITE / CLONE)
  // ---------------------------------------------------------

  const devnetPubkeys = new Set(devnetCreditMap.keys());

  devnetPubkeys.forEach(pubkey => {
      const hasDevnetNode = processedNodes.some(n => n.pubkey === pubkey && n.network === 'DEVNET');

      if (!hasDevnetNode) {
          const mainnetNode = processedNodes.find(n => n.pubkey === pubkey && n.network === 'MAINNET');

          if (mainnetNode) {
              // We found a node on Mainnet that also has credits on Devnet. 
              // Clone it as a Devnet node.
              const clonedNode: EnrichedNode = {
                  ...mainnetNode,
                  network: 'DEVNET',
                  credits: devnetCreditMap.get(pubkey) ?? null,
                  isUntracked: false // It has credits, so it is tracked
              };
              processedNodes.push(clonedNode);
          }
      }
  });

  // ---------------------------------------------------------
  // PHASE 6: SCORING & STATS
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

      // FIX: Determining what to pass to scoring algo
      // If Untracked: Pass 0 (Penalize reputation score)
      // If API Offline: Pass null (Trigger re-weighting protection)
      const creditsForScore = node.isUntracked ? 0 : node.credits;

      const vitality = calculateVitalityScore(
          node.storage_committed, node.storage_used, node.uptime, 
          node.version, consensusVersion, sortedCleanVersions, 
          medianCreditsForScore, 
          creditsForScore, 
          medianStorage
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

  // Ranking & Sorting
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

  // Health Rank
  allSorted.sort((a, b) => b.health - a.health);
  let hr = 1;
  allSorted.forEach((n, i) => {
      if (i > 0 && n.health < allSorted[i-1].health) hr = i + 1;
      n.health_rank = hr;
  });

  // Global Stats
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
