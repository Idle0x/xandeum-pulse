// pages/api/geo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { nodes, stats } = await getNetworkPulse();

    // Aggregation Logic for Map Page
    const cityMap = new Map<string, any>();

    nodes.forEach(node => {
      const { city, countryName, lat, lon } = node.location;
      if (lat === 0 && lon === 0) return; // Skip private IPs for map

      const key = `${city}-${countryName}`;
      const storageGB = (node.storage_committed || 0) / (1024 ** 3);

      if (cityMap.has(key)) {
        const existing = cityMap.get(key);
        existing.count++;
        existing.totalStorage += storageGB;
        existing.totalCredits += node.credits;
        existing.healthSum += node.health;
        existing.ips.push(node.address.split(':')[0]);
        if (node.health >= 75) existing.stableCount++;
        if (node.health < 50) existing.criticalCount++;
      } else {
        cityMap.set(key, {
          name: city,
          country: countryName,
          lat, lon,
          count: 1,
          totalStorage: storageGB,
          totalCredits: node.credits,
          healthSum: node.health,
          stableCount: node.health >= 75 ? 1 : 0,
          criticalCount: node.health < 50 ? 1 : 0,
          ips: [node.address.split(':')[0]]
        });
      }
    });

    const locations = Array.from(cityMap.values()).map(l => ({
      ...l,
      avgHealth: Math.round(l.healthSum / l.count)
    }));

    const topRegion = [...locations].sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations,
      stats: {
        totalNodes: stats.totalNodes,
        countries: new Set(locations.map(l => l.country)).size,
        topRegion: topRegion ? topRegion.name : 'Global',
        topRegionMetric: topRegion ? topRegion.totalStorage : 0
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Geo System Offline' });
  }
}
