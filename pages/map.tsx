import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- IN-MEMORY CACHE ---
let geoCache = new Map<string, { lat: number; lon: number; country: string; city: string }>();

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

// HELPER: Aggressive Parser for mixed data types
const parseMetric = (value: any, type: 'STORAGE' | 'INT'): number => {
    if (!value) return 0;
    
    // If it's already a number, return it
    if (typeof value === 'number') return value;

    // Convert to string to handle "100 GB", "2 TB", "1,000"
    const str = String(value).toUpperCase().replace(/,/g, ''); // Remove commas

    if (type === 'STORAGE') {
        let num = parseFloat(str);
        if (isNaN(num)) return 0;
        
        // Normalize everything to GB
        if (str.includes('TB')) return num * 1024;
        if (str.includes('MB')) return num / 1024;
        if (str.includes('PB')) return num * 1024 * 1024;
        // If just a number (bytes), usually divide by 10^9, but assuming input is GB-ish if string has no unit? 
        // Safer to assume raw bytes if no unit:
        if (!str.includes('GB')) return num / (1024 * 1024 * 1024); 
        
        return num; // Default is GB
    }

    // Integer parsing (Credits/Health)
    return parseInt(str.replace(/[^0-9.]/g, ''), 10) || 0;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    
    let pods = [];
    try {
        const statsRes = await axios.get(`${protocol}://${host}/api/stats`); 
        pods = statsRes.data?.result?.pods || [];
    } catch (e) {
        console.error("Stats fetch fail:", e);
        pods = []; 
    }

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

    const cityMap = new Map<string, { 
        lat: number; lon: number; name: string; country: string; count: number;
        totalStorage: number; totalCredits: number; healthSum: number;
    }>();

    pods.forEach((node: any) => {
      const ip = node.address.split(':')[0];
      const geo = geoCache.get(ip);

      if (geo) {
        const key = `${geo.city}-${geo.country}`;
        
        // ROBUST PARSING HERE
        // Inspect your real API response to confirm these key names match!
        const storage = parseMetric(node.total_storage, 'STORAGE');
        const credits = parseMetric(node.credits, 'INT');
        const health = node.health_score !== undefined ? parseMetric(node.health_score, 'INT') : 100;

        if (cityMap.has(key)) {
            const existing = cityMap.get(key)!;
            existing.count += 1;
            existing.totalStorage += storage;
            existing.totalCredits += credits;
            existing.healthSum += health;
        } else {
            cityMap.set(key, {
                lat: geo.lat, lon: geo.lon, name: geo.city, country: geo.country,
                count: 1, totalStorage: storage, totalCredits: credits, healthSum: health
            });
        }
      }
    });

    const mapData = Array.from(cityMap.values()).map(city => ({
        ...city,
        avgHealth: Math.round(city.healthSum / city.count)
    }));

    const totalNodes = pods.length;
    const countries = new Set(mapData.map(d => d.country)).size;
    const topRegion = mapData.sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations: mapData,
      stats: {
        totalNodes,
        countries,
        topRegion: topRegion ? topRegion.name : 'Global',
        topRegionMetric: topRegion ? topRegion.totalStorage : 0
      }
    });

  } catch (error) {
    res.status(500).json({ error: "Geo Calculation Failed" });
  }
}
