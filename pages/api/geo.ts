import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- CONFIGURATION (Copied from your working Homepage API) ---
const PRIMARY_NODE = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41',
  '192.190.136.36',
  '192.190.136.38',
  '207.244.255.1',
  '192.190.136.28',
  '192.190.136.29'
];
const TIMEOUT_PRIMARY = 4000;
const TIMEOUT_BACKUP = 6000;

// Geo Cache
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

// --- HELPER: ROBUST PARSING ---
const parseMetric = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = value.toString().toLowerCase().replace(/,/g, ''); // Remove commas
  const clean = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  
  // Normalize units
  if (str.includes('tb')) return clean * 1024;
  if (str.includes('mb')) return clean / 1024;
  return clean;
};

// --- HELPER: GEO BATCHING ---
async function fetchGeoBatch(ips: string[]) {
  if (ips.length === 0) return [];
  try {
    const response = await axios.post('http://ip-api.com/batch', 
      ips.map(ip => ({ query: ip, fields: "lat,lon,country,city,query" }))
    );
    return response.data;
  } catch (error) {
    console.error("Geo-API Batch Error:", error);
    return [];
  }
}

// --- HELPER: FETCH PODS (The "Homepage" Logic) ---
async function getPodsFromRPC() {
  // Attempt 1: Hero Node
  try {
    const response = await axios.post(
      `http://${PRIMARY_NODE}:6000/rpc`,
      { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 },
      { timeout: TIMEOUT_PRIMARY } 
    );
    if (response.data?.result?.pods) return response.data.result.pods;
  } catch (error) {
    console.warn(`Primary node failed. Switching to backups...`);
  }

  // Attempt 2: Backup Race
  const shuffled = BACKUP_NODES.sort(() => 0.5 - Math.random()).slice(0, 3);
  try {
    const winner = await Promise.any(shuffled.map(ip => 
      axios.post(
        `http://${ip}:6000/rpc`,
        { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 },
        { timeout: TIMEOUT_BACKUP } 
      ).then(res => {
        if (res.data?.result?.pods) return res.data.result.pods;
        throw new Error('Invalid Data');
      })
    ));
    return winner;
  } catch (error) {
    console.error("All RPC nodes failed.");
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. PARALLEL FETCH (Direct RPC + Direct Credits API)
    const [pods, creditsRes] = await Promise.all([
      getPodsFromRPC(),
      axios.get('https://podcredits.xandeum.network/api/pods-credits').catch(e => ({ data: [] }))
    ]);

    // 2. CREATE CREDITS LOOKUP MAP
    // We map Pubkey -> Amount for O(1) lookup
    const creditsMap = new Map<string, number>();
    const creditsData = Array.isArray(creditsRes.data) ? creditsRes.data : [];
    
    creditsData.forEach((c: any) => {
      // Try 'pubkey' (standard) or 'account' or 'id'
      const key = c.pubkey || c.account || c.node_id;
      const amount = parseMetric(c.amount || c.balance || c.credits || 0);
      if (key) creditsMap.set(key, amount);
    });

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

    // 4. DATA MERGE & AGGREGATION
    const cityMap = new Map<string, { 
        lat: number; lon: number; name: string; country: string; 
        count: number; totalStorage: number; totalCredits: number; healthSum: number;
    }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // --- THE METRIC EXTRACTION ---
        // We use the exact keys that likely come from 'get-pods-with-stats'
        const storage = parseMetric(node.total_storage || node.storage || 0);
        
        // Health usually comes as 'health_score' or just 'score'
        // If missing, we don't assume 100 anymore to avoid fake data, we check carefully
        let health = 0;
        if (node.health_score !== undefined) health = parseMetric(node.health_score);
        else if (node.score !== undefined) health = parseMetric(node.score);
        else if (node.health !== undefined) health = parseMetric(node.health);
        
        // Credits Merge
        const credits = creditsMap.get(node.pubkey) || 0;

        if (cityMap.has(key)) {
            const existing = cityMap.get(key)!;
            existing.count += 1;
            existing.totalStorage += storage;
            existing.totalCredits += credits;
            existing.healthSum += health;
        } else {
            cityMap.set(key, {
                lat: geo.lat,
                lon: geo.lon,
                name: geo.city,
                country: geo.country,
                count: 1,
                totalStorage: storage,
                totalCredits: credits,
                healthSum: health
            });
        }
      }
    });

    const mapData = Array.from(cityMap.values()).map(city => ({
        ...city,
        // Avoid division by zero
        avgHealth: city.count > 0 ? Math.round(city.healthSum / city.count) : 0
    }));

    // Stats for the HUD
    const totalNodes = pods.length;
    const countries = new Set(mapData.map(d => d.country)).size;
    const topRegionData = [...mapData].sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations: mapData,
      stats: {
        totalNodes,
        countries,
        topRegion: topRegionData ? topRegionData.name : 'Global',
        topRegionMetric: topRegionData ? topRegionData.totalStorage : 0
      }
    });

  } catch (error) {
    console.error("Geo Handler Critical Error:", error);
    res.status(500).json({ error: "Satellite link failed" });
  }
}
