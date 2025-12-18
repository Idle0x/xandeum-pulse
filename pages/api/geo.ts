import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- IN-MEMORY CACHE ---
// Note: In serverless (Vercel), this cache persists only while the container is "warm".
// For a production app, you'd use Redis/Vercel KV. For a hackathon/portfolio, this is perfect.
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

// Helper: Batch fetch from ip-api.com (Supports up to 100 IPs per request)
async function fetchGeoBatch(ips: string[]) {
  if (ips.length === 0) return [];
  
  try {
    // ip-api.com/batch endpoint documentation
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
    // 1. Fetch Live Nodes from your existing source
    // (Simulating the fetch you do in index.tsx - usually you'd extract this to a shared helper)
    const statsRes = await axios.get('https://xandeum-pulse.vercel.app/api/stats'); 
    // ^ IMPORTANT: In local dev, use http://localhost:3000/api/stats. 
    // For now, I'll assume we can fetch from your live URL or you can replace this with your direct logic.
    
    const pods = statsRes.data?.result?.pods || [];
    const uniqueIps = [...new Set(pods.map((p: any) => p.address.split(':')[0]))] as string[];

    // 2. Identify which IPs are missing from Cache
    const missingIps = uniqueIps.filter(ip => !geoCache.has(ip));
    
    // 3. Fetch missing IPs in batches (Rate limit protection)
    if (missingIps.length > 0) {
      console.log(`Fetching Geo data for ${missingIps.length} new IPs...`);
      
      // Chunk into batches of 100 (API limit)
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

    // 4. Construct the Final "Map-Ready" Data
    // We aggregate stats by CITY to prevent dot-overlap
    const cityMap = new Map<string, { lat: number; lon: number; name: string; country: string; count: number }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        if (cityMap.has(key)) {
            const existing = cityMap.get(key)!;
            existing.count += 1;
        } else {
            cityMap.set(key, {
                lat: geo.lat,
                lon: geo.lon,
                name: geo.city,
                country: geo.country,
                count: 1
            });
        }
      }
    });

    const mapData = Array.from(cityMap.values());

    // 5. Calculate Quick Stats
    const totalNodes = pods.length;
    const countries = new Set(mapData.map(d => d.country)).size;
    // Find most dense region
    const mostDense = mapData.sort((a, b) => b.count - a.count)[0];

    res.status(200).json({
      locations: mapData,
      stats: {
        totalNodes,
        countries,
        topRegion: mostDense ? `${mostDense.name}, ${mostDense.country}` : 'Global'
      }
    });

  } catch (error) {
    console.error("Geo Handler Error:", error);
    res.status(500).json({ error: "Failed to generate map data" });
  }
}
