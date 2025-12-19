import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- CONFIGURATION ---
const PRIMARY_NODE = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29'
];
const TIMEOUT_PRIMARY = 4000;
const TIMEOUT_BACKUP = 6000;

// --- CACHE SYSTEM (Fixes Memory Leaks & Race Conditions) ---
const MAX_CACHE_SIZE = 500;
const geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();
let cacheAccessOrder: string[] = []; // LRU Tracker
const pendingGeoRequests = new Map<string, Promise<any>>(); // In-flight deduping

// Helper: Add to cache with LRU eviction
function addToCache(ip: string, data: any) {
  if (!data || !data.lat || !data.lon) return;
  
  if (geoCache.has(ip)) {
    // Refresh position in LRU
    cacheAccessOrder = cacheAccessOrder.filter(k => k !== ip);
  } else if (geoCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest
    const oldest = cacheAccessOrder.shift();
    if (oldest) geoCache.delete(oldest);
  }
  
  geoCache.set(ip, data);
  cacheAccessOrder.push(ip);
}

// --- HELPER: VERSION COMPARISON ---
const compareVersions = (v1: string, v2: string) => {
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// --- HELPER: THE "VITALITY SCORE" ALGORITHM ---
const calculateVitalityScore = (
  storageGB: number, 
  uptimeSeconds: number, 
  version: string, 
  consensusVersion: string, 
  credits: number, 
  medianCredits: number
): number => {
  // GATE: 0 Storage = 0 Health (Useless Node)
  if (storageGB <= 0) return 0;

  // 1. UPTIME SCORE (30% Weight)
  let uptimeScore = 0;
  const days = uptimeSeconds / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  // 2. VERSION SCORE (20% Weight)
  let versionScore = 100;
  const comparison = compareVersions(version, consensusVersion);
  if (comparison < 0) {
    const parts1 = version.split('.').map(Number);
    const parts2 = consensusVersion.split('.').map(Number);
    if ((parts2[0] || 0) > (parts1[0] || 0)) versionScore = 30;
    else if (((parts2[1] || 0) - (parts1[1] || 0)) > 2) versionScore = 60;
    else versionScore = 80;
  }

  // 3. REPUTATION SCORE (25% Weight)
  let reputationScore = 50; 
  if (medianCredits > 0 && credits > 0) {
    const ratio = credits / medianCredits;
    if (ratio >= 2) reputationScore = 100;
    else if (ratio >= 1) reputationScore = 75 + (ratio - 1) * 25;
    else if (ratio >= 0.5) reputationScore = 50 + (ratio - 0.5) * 50;
    else if (ratio >= 0.1) reputationScore = 25 + (ratio - 0.1) * 62.5;
    else reputationScore = ratio * 250;
  } else if (credits === 0) {
    reputationScore = 0;
  } else if (medianCredits === 0 && credits > 0) {
    reputationScore = 100;
  }

  // 4. CAPACITY SCORE (25% Weight)
  let capacityScore = 0;
  if (storageGB >= 1000) capacityScore = 100;
  else if (storageGB >= 100) capacityScore = 70 + (storageGB - 100) * (30 / 900);
  else if (storageGB >= 10) capacityScore = 40 + (storageGB - 10) * (30 / 90);
  else capacityScore = storageGB * 4;

  const finalScore = 
    (uptimeScore * 0.30) +
    (versionScore * 0.20) +
    (reputationScore * 0.25) +
    (capacityScore * 0.25);

  return Math.round(Math.max(0, Math.min(100, finalScore)));
};

// --- HELPER: FETCH PODS (RPC) ---
async function getPodsFromRPC() {
  const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
  try {
    const response = await axios.post(`http://${PRIMARY_NODE}:6000/rpc`, payload, { timeout: TIMEOUT_PRIMARY });
    if (response.data?.result?.pods) return response.data.result.pods;
  } catch (error) { /* Fail silently */ }

  const shuffled = BACKUP_NODES.sort(() => 0.5 - Math.random()).slice(0, 3);
  try {
    const winner = await Promise.any(shuffled.map(ip => 
      axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_BACKUP })
        .then(res => res.data?.result?.pods || [])
    ));
    return winner;
  } catch (error) { return []; }
}

// --- HELPER: BATCH GEO (With De-duping) ---
async function getGeoDataForIps(ips: string[]) {
  const missing = ips.filter(ip => !geoCache.has(ip));
  const toFetch: string[] = [];

  const promises: Promise<any>[] = [];
  missing.forEach(ip => {
    if (pendingGeoRequests.has(ip)) {
      // FIX: Added '!' non-null assertion because we verified it exists with .has()
      promises.push(pendingGeoRequests.get(ip)!);
    } else {
      toFetch.push(ip);
    }
  });

  if (toFetch.length > 0) {
    for (let i = 0; i < toFetch.length; i += 100) {
      const chunk = toFetch.slice(i, i + 100);
      const promise = axios.post('http://ip-api.com/batch', 
        chunk.map(ip => ({ query: ip, fields: "lat,lon,country,city,query" }))
      ).then(res => {
        res.data.forEach((data: any) => {
          if (data?.lat && data?.lon) {
            addToCache(data.query, { lat: data.lat, lon: data.lon, country: data.country, city: data.city });
          }
        });
        return res.data;
      }).catch(err => {
        console.error("Geo Batch Error:", err);
        return [];
      }).finally(() => {
        chunk.forEach(ip => pendingGeoRequests.delete(ip));
      });

      chunk.forEach(ip => pendingGeoRequests.set(ip, promise));
      promises.push(promise);
    }
  }

  await Promise.allSettled(promises);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. FETCH DATA
    const [pods, creditsRes] = await Promise.all([
      getPodsFromRPC(),
      axios.get('https://podcredits.xandeum.network/api/pods-credits').catch(() => ({ data: {} }))
    ]);

    // 2. CALCULATE NETWORK METRICS
    const versionCounts: Record<string, number> = {};
    pods.forEach((p: any) => {
        const v = p.version || '0.0.0';
        versionCounts[v] = (versionCounts[v] || 0) + 1;
    });
    const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';

    const allCredits: number[] = [];
    const creditsMap = new Map<string, number>();
    const creditsArray = creditsRes.data?.pods_credits || [];
    if (Array.isArray(creditsArray)) {
        creditsArray.forEach((c: any) => {
            if (c.pod_id && c.credits !== undefined) {
                const val = parseFloat(c.credits);
                creditsMap.set(c.pod_id, val);
                allCredits.push(val);
            }
        });
    }
    allCredits.sort((a, b) => a - b);
    const mid = Math.floor(allCredits.length / 2);
    const medianCredits = allCredits.length > 0 ? allCredits[mid] : 0;

    // 3. GEOCODING
    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];
    await getGeoDataForIps(uniqueIps);

    // 4. DATA MERGE
    const cityMap = new Map<string, any>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        const rawStorage = parseFloat(node.storage_committed || '0');
        const storageGB = rawStorage / (1024 * 1024 * 1024);
        const credits = creditsMap.get(node.pubkey) || 0;
        const uptime = node.uptime || 0;
        const version = node.version || '0.0.0';

        const health = calculateVitalityScore(storageGB, uptime, version, consensusVersion, credits, medianCredits);

        if (cityMap.has(key)) {
            const existing = cityMap.get(key)!;
            existing.count += 1;
            existing.totalStorage += storageGB;
            existing.totalCredits += credits;
            existing.healthSum += health;
        } else {
            cityMap.set(key, {
                lat: geo.lat,
                lon: geo.lon,
                name: geo.city,
                country: geo.country,
                count: 1,
                totalStorage: storageGB,
                totalCredits: credits,
                healthSum: health
            });
        }
      }
    });

    const mapData = Array.from(cityMap.values()).map(city => ({
        ...city,
        avgHealth: city.count > 0 ? Math.round(city.healthSum / city.count) : 0
    }));

    const topRegionData = [...mapData].sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations: mapData,
      stats: {
        totalNodes: pods.length,
        countries: new Set(mapData.map(d => d.country)).size,
        topRegion: topRegionData ? topRegionData.name : 'Global',
        topRegionMetric: topRegionData ? topRegionData.totalStorage : 0
      }
    });

  } catch (error) {
    console.error("Geo Handler Critical Error:", error);
    res.status(500).json({ error: "Satellite link failed" });
  }
}
