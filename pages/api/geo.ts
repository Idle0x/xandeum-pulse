import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Cache to prevent API rate limits (Geo Data Only)
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

// Helper: Parse metric with unit detection
const parseMetric = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = value.toString().toLowerCase();
  // Remove non-numeric chars except dots
  const clean = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  
  // Normalization to GB
  if (str.includes('tb')) return clean * 1024;
  if (str.includes('mb')) return clean / 1024;
  return clean; // Assume GB if no unit or just number
};

// Batch Geo Fetcher
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

    // --- STEP 1: PARALLEL FETCHING (The "Blender") ---
    // We fetch both the Stats (Nodes) and the Credits (Ledger) at the same time
    const [statsRes, creditsRes] = await Promise.allSettled([
        axios.get(`${baseUrl}/api/stats`),
        axios.get('https://podcredits.xandeum.network/api/pods-credits')
    ]);

    // Extract Stats Nodes
    let pods = [];
    if (statsRes.status === 'fulfilled' && statsRes.value.data?.result?.pods) {
        pods = statsRes.value.data.result.pods;
    } else {
        console.error("Failed to load Stats for Map");
    }

    // Extract Credits Map (Key: Pubkey -> Value: Amount)
    const creditsMap = new Map<string, number>();
    if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value.data)) {
        creditsRes.value.data.forEach((c: any) => {
            // Assuming the credit object has 'pubkey' and 'amount' or similar
            // Adjust 'pubkey' and 'amount' if the API uses different names (e.g. 'node_id', 'balance')
            if (c.pubkey) creditsMap.set(c.pubkey, parseMetric(c.amount || c.balance || 0));
        });
    }

    // --- STEP 2: GEOCODING ---
    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];
    const missingIps = uniqueIps.filter(ip => !geoCache.has(ip));
    
    if (missingIps.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < missingIps.length; i += chunkSize) {
        const chunk = missingIps.slice(i, i + chunkSize);
        const results = await fetchGeoBatch(chunk);
        results.forEach((data: any) => {
          if (data && data.lat && data.lon) {
            geoCache.set(data.query, {
              lat: data.lat, lon: data.lon, country: data.country, city: data.city 
            });
          }
        });
      }
    }

    // --- STEP 3: AGGREGATION & MERGE ---
    const cityMap = new Map<string, { 
        lat: number; lon: number; name: string; country: string; 
        count: number; totalStorage: number; totalCredits: number; healthSum: number;
    }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // MERGE LOGIC:
        // 1. Get Storage from Node
        const storage = parseMetric(node.total_storage);
        // 2. Get Health from Node
        const health = node.health_score !== undefined ? parseMetric(node.health_score) : 100;
        // 3. Get Credits from the MAP we created earlier (Using Pubkey)
        // We look up using node.pubkey. If missing, we default to 0.
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
        avgHealth: Math.round(city.healthSum / city.count)
    }));

    // Calculate Global Stats
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
