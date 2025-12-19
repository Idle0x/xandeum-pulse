import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Cache to prevent API rate limits
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

// Helper: robustly parse numbers from mixed strings (e.g., "500 GB" -> 500)
const parseMetric = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove non-numeric chars except dots (for decimals)
  const clean = value.toString().replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
};

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
    
    // Fetch live stats safely
    let pods = [];
    try {
        // Fallback to localhost if host is missing (dev environment)
        const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
        const statsRes = await axios.get(`${baseUrl}/api/stats`); 
        pods = statsRes.data?.result?.pods || [];
    } catch (e) {
        console.error("Internal Stats Fetch Error:", e);
        pods = []; 
    }

    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];
    const missingIps = uniqueIps.filter(ip => !geoCache.has(ip));
    
    // Batch Geo Fetch
    if (missingIps.length > 0) {
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

    // Aggregate Data
    const cityMap = new Map<string, { 
        lat: number; lon: number; name: string; country: string; 
        count: number; totalStorage: number; totalCredits: number; healthSum: number;
    }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // AGGRESSIVE PARSING FIX
        const storage = parseMetric(node.total_storage);
        const credits = parseMetric(node.credits);
        // If health is missing, assume 100 (online)
        const health = node.health_score !== undefined ? parseMetric(node.health_score) : 100; 

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
    // Sort by storage to find top region
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
