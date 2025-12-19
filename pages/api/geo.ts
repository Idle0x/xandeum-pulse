import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- IN-MEMORY CACHE (Prevents API Bans) ---
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

// Helper: Batch fetch from ip-api.com
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
    // 1. Dynamic URL Detection (Works on Localhost & Vercel)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    
    // Fetch live node stats
    // We try/catch this specific call so the map doesn't crash if the stats API is momentarily down
    let pods = [];
    try {
        const statsRes = await axios.get(`${protocol}://${host}/api/stats`); 
        pods = statsRes.data?.result?.pods || [];
    } catch (e) {
        console.error("Failed to fetch internal stats:", e);
        // Fallback or empty array so map doesn't crash
        pods = []; 
    }

    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];

    // 2. Identify missing IPs in Cache
    const missingIps = uniqueIps.filter(ip => !geoCache.has(ip));
    
    // 3. Batch Fetch Geo Data (If needed)
    if (missingIps.length > 0) {
      console.log(`Triangulating ${missingIps.length} new nodes...`);
      const chunkSize = 100;
      for (let i = 0; i < missingIps.length; i += chunkSize) {
        const chunk = missingIps.slice(i, i + chunkSize);
        const results = await fetchGeoBatch(chunk);
        
        results.forEach((data: any) => {
          if (data && data.lat && data.lon) {
            geoCache.set(data.query, {
              lat: data.lat,
              lon: data.lon,
              country: data.country,
              city: data.city
            });
          }
        });
      }
    }

    // 4. AGGREGATE DATA (The "Command Center" Logic)
    // We group by City to sum up Storage/Credits and Average Health
    const cityMap = new Map<string, { 
        lat: number; 
        lon: number; 
        name: string; 
        country: string; 
        count: number;
        // New Metrics
        totalStorage: number;
        totalCredits: number;
        healthSum: number;
    }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // Extract metrics safely (default to 0 if missing)
        const storage = parseInt(node.total_storage || '0', 10);
        const credits = parseInt(node.credits || '0', 10);
        // Assuming health is a score 0-100. If missing, assume 100 for now.
        const health = typeof node.health_score === 'number' ? node.health_score : 100; 

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

    // 5. Finalize Averages & Stats
    const mapData = Array.from(cityMap.values()).map(city => ({
        ...city,
        // Calculate average health for the city
        avgHealth: Math.round(city.healthSum / city.count)
    }));

    // Global Stats for the HUD
    const totalNodes = pods.length;
    const countries = new Set(mapData.map(d => d.country)).size;
    // Find biggest storage hub
    const storageHub = [...mapData].sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations: mapData,
      stats: {
        totalNodes,
        countries,
        topRegion: storageHub ? `${storageHub.name}` : 'Global',
        topRegionMetric: storageHub ? storageHub.totalStorage : 0
      }
    });

  } catch (error) {
    console.error("Geo Handler Critical Error:", error);
    res.status(500).json({ error: "Satellite link failed" });
  }
}
