import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRASHPROOF: Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  try {
    const { nodes, stats } = await getNetworkPulse();

    const cityMap = new Map<string, any>();

    nodes.forEach(node => {
      const { city, countryName, countryCode, lat, lon } = node.location;
      if (lat === 0 && lon === 0) return; // Skip private IPs

      const key = `${city}-${countryName}`;
      const storageGB = (node.storage_committed || 0) / (1024 ** 3);

      if (cityMap.has(key)) {
        const existing = cityMap.get(key);
        existing.count++;
        existing.totalStorage += storageGB;
        
        if (node.credits !== null) {
            existing.totalCredits += node.credits;
            existing.hasValidCreditData = true;
        }

        existing.healthSum += node.health;
        existing.totalUptime += (node.uptime || 0);
        if (node.is_public) existing.publicCount++;
        
        existing.ips.push(node.address.split(':')[0]);

        // --- TRACKING KINGS (Updated to track Values) ---
        if (storageGB > existing.bestNodes.storageVal) {
            existing.bestNodes.storageVal = storageGB;
            existing.bestNodes.storagePk = node.pubkey;
        }
        
        if (node.credits !== null && node.credits > existing.bestNodes.creditsVal) {
            existing.bestNodes.creditsVal = node.credits;
            existing.bestNodes.creditsPk = node.pubkey;
        }
        
        // For Health, we also grab the Uptime of the healthiest node for display
        if (node.health > existing.bestNodes.healthVal) {
            existing.bestNodes.healthVal = node.health;
            existing.bestNodes.healthPk = node.pubkey;
            existing.bestNodes.healthUptime = node.uptime || 0; // Capture specific uptime
        }

      } else {
        cityMap.set(key, {
          name: city,
          country: countryName,
          countryCode: countryCode,
          lat, lon,
          count: 1,
          totalStorage: storageGB,
          totalCredits: node.credits || 0, 
          hasValidCreditData: node.credits !== null, 
          healthSum: node.health,
          totalUptime: node.uptime || 0,
          publicCount: node.is_public ? 1 : 0,
          ips: [node.address.split(':')[0]],
          
          // Initial Best Nodes
          bestNodes: {
              storageVal: storageGB, storagePk: node.pubkey,
              creditsVal: node.credits || 0, creditsPk: node.pubkey,
              healthVal: node.health, healthPk: node.pubkey, healthUptime: node.uptime || 0
          }
        });
      }
    });

    const locations = Array.from(cityMap.values()).map(l => {
        const finalCredits = l.hasValidCreditData ? l.totalCredits : null;

        return {
          name: l.name,
          country: l.country,
          countryCode: l.countryCode,
          lat: l.lat,
          lon: l.lon,
          count: l.count,
          totalStorage: l.totalStorage,
          totalCredits: finalCredits,
          avgHealth: Math.round(l.healthSum / l.count),
          avgUptime: l.totalUptime / l.count,
          publicRatio: (l.publicCount / l.count) * 100,
          ips: l.ips,
          
          // UPDATED STRUCTURE: Sending Objects instead of just Strings
          topPerformers: {
              STORAGE: { pk: l.bestNodes.storagePk, val: l.bestNodes.storageVal },
              CREDITS: { pk: l.bestNodes.creditsPk, val: l.bestNodes.creditsVal },
              // Health includes the uptime sub-value
              HEALTH: { pk: l.bestNodes.healthPk, val: l.bestNodes.healthVal, subVal: l.bestNodes.healthUptime }
          }
        };
    });

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
