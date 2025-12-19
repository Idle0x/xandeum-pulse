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

let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

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

// --- HELPER: BATCH GEO ---
async function fetchGeoBatch(ips: string[]) {
  if (ips.length === 0) return [];
  try {
    const response = await axios.post('http://ip-api.com/batch', 
      ips.map(ip => ({ query: ip, fields: "lat,lon,country,city,query" }))
    );
    return response.data;
  } catch (error) { return []; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. FETCH DATA
    const [pods, creditsRes] = await Promise.all([
      getPodsFromRPC(),
      axios.get('https://podcredits.xandeum.network/api/pods-credits').catch(() => ({ data: {} }))
    ]);

    // 2. CALCULATE NETWORK METRICS (Consensus & Median)
    const versionCounts: Record<string, number> = {};
    const allCredits: number[] = [];
    
    // Parse Credits & Versions
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

    // Determine Consensus Version
    pods.forEach((p: any) => {
        const v = p.version || '0.0.0';
        versionCounts[v] = (versionCounts[v] || 0) + 1;
    });
    const consensusVersion = Object.keys(versionCounts).sort((a, b) => versionCounts[b] - versionCounts[a])[0] || '0.0.0';

    // Determine Median Credits (Middle Value of Network)
    allCredits.sort((a, b) => a - b);
    const mid = Math.floor(allCredits.length / 2);
    const medianCredits = allCredits.length > 0 ? allCredits[mid] : 0;

    // 3. GEOCODING
    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];
    const missingIps = uniqueIps.filter(ip => !geoCache.has(ip));
    
    if (missingIps.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < missingIps.length; i += chunkSize) {
        const chunk = missingIps.slice(i, i + chunkSize);
        const results = await fetchGeoBatch(chunk);
        results.forEach((data: any) => {
          if (data?.lat && data?.lon) {
            geoCache.set(data.query, {
              lat: data.lat, lon: data.lon, country: data.country, city: data.city 
            });
          }
        });
      }
    }

    // 4. DATA MERGE
    const cityMap = new Map<string, any>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // --- STORAGE FIX ---
        const rawStorage = parseFloat(node.storage_committed || '0');
        const storageGB = rawStorage / (1024 * 1024 * 1024);

        // --- CREDITS ---
        const credits = creditsMap.get(node.pubkey) || 0;

        // --- HEALTH CALCULATION (The "Vitality Score") ---
        let health = 100;
        const nodeVersion = node.version || '0.0.0';
        const uptimeSeconds = node.uptime || 0;

        // A. The "Useless Node" Check (0 Storage = 0 Health)
        if (storageGB <= 0) {
            health = 0;
        } else {
            // B. Stability Check (Uptime < 24h)
            if (uptimeSeconds < 86400) health -= 20;

            // C. Consensus Check (Outdated Version)
            if (compareVersions(nodeVersion, consensusVersion) < 0) health -= 15;

            // D. Reputation Check (Relative to Network Median)
            // If median is 50k, and you have < 5k (10%), you are penalized
            if (medianCredits > 0) {
                if (credits < (medianCredits * 0.01)) health -= 20; // Very low reputation
                else if (credits < (medianCredits * 0.1)) health -= 10; // Low reputation
            }
        }

        // Clamp Health (0 - 100)
        health = Math.max(0, Math.min(100, health));

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
