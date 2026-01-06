import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const { nodes, stats } = await getNetworkPulse();

    const cityMap = new Map<string, any>();

    nodes.forEach(node => {
      const { city, countryName, countryCode, lat, lon } = node.location;
      
      // Skip nodes without valid coordinates
      if (lat === 0 && lon === 0) return; 

      const key = `${city}-${countryName}`;
      const storageGB = (node.storage_committed || 0) / (1024 ** 3);
      const network = node.network || 'UNKNOWN';
      const hasCredits = node.credits !== null; // Check if this specific node has data

      if (cityMap.has(key)) {
        const existing = cityMap.get(key);
        existing.count++;
        existing.totalStorage += storageGB;

        if (hasCredits) {
            existing.totalCredits += node.credits;
            existing.hasValidCreditData = true;
        }

        existing.healthSum += node.health;
        existing.totalUptime += (node.uptime || 0);
        if (node.is_public) existing.publicCount++;

        existing.ips.push(node.address.split(':')[0]);

        // --- TRACKING KINGS (UPDATED WITH ADDRESS PRECISION) ---
        
        // 1. Storage King
        if (storageGB > existing.bestNodes.storageVal) {
            existing.bestNodes.storageVal = storageGB;
            existing.bestNodes.storagePk = node.pubkey;
            existing.bestNodes.storageNet = network;
            existing.bestNodes.storageAddr = node.address; // <--- PRECISION FIX
        }

        // 2. Credits King
        // Only update Credit King if this node actually has credits
        if (hasCredits && (node.credits || 0) >= existing.bestNodes.creditsVal) {
            existing.bestNodes.creditsVal = node.credits;
            existing.bestNodes.creditsPk = node.pubkey;
            existing.bestNodes.creditsNet = network;
            existing.bestNodes.creditsAddr = node.address; // <--- PRECISION FIX
            existing.bestNodes.creditsUntracked = false; // Mark as tracked
        }

        // 3. Health King
        if (node.health > existing.bestNodes.healthVal) {
            existing.bestNodes.healthVal = node.health;
            existing.bestNodes.healthPk = node.pubkey;
            existing.bestNodes.healthUptime = node.uptime || 0;
            existing.bestNodes.healthNet = network;
            existing.bestNodes.healthAddr = node.address; // <--- PRECISION FIX
        }

      } else {
        // INITIALIZE NEW REGION
        cityMap.set(key, {
          name: city,
          country: countryName,
          countryCode: countryCode,
          lat, lon,
          count: 1,
          totalStorage: storageGB,
          totalCredits: node.credits || 0, 
          hasValidCreditData: hasCredits, 
          healthSum: node.health,
          totalUptime: node.uptime || 0,
          publicCount: node.is_public ? 1 : 0,
          ips: [node.address.split(':')[0]],

          // Initial Best Nodes
          bestNodes: {
              // Storage
              storageVal: storageGB, 
              storagePk: node.pubkey, 
              storageNet: network,
              storageAddr: node.address, // <--- INIT

              // Credits
              creditsVal: node.credits || 0, 
              creditsPk: node.pubkey, 
              creditsNet: network,
              creditsAddr: node.address, // <--- INIT
              creditsUntracked: !hasCredits, // Mark untracked if initial node is null

              // Health
              healthVal: node.health, 
              healthPk: node.pubkey, 
              healthUptime: node.uptime || 0, 
              healthNet: network,
              healthAddr: node.address // <--- INIT
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

          topPerformers: {
              STORAGE: { 
                  pk: l.bestNodes.storagePk, 
                  val: l.bestNodes.storageVal, 
                  network: l.bestNodes.storageNet,
                  address: l.bestNodes.storageAddr // <--- PASS TO FRONTEND
              },
              CREDITS: { 
                  pk: l.bestNodes.creditsPk, 
                  val: l.bestNodes.creditsVal, 
                  network: l.bestNodes.creditsNet,
                  address: l.bestNodes.creditsAddr, // <--- PASS TO FRONTEND
                  isUntracked: l.bestNodes.creditsUntracked 
              },
              HEALTH: { 
                  pk: l.bestNodes.healthPk, 
                  val: l.bestNodes.healthVal, 
                  subVal: l.bestNodes.healthUptime, 
                  network: l.bestNodes.healthNet,
                  address: l.bestNodes.healthAddr // <--- PASS TO FRONTEND
              }
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
