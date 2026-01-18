import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Prevent caching so the network switch feels instant/fresh
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const { nodes: allNodes, stats: globalStats } = await getNetworkPulse();

    // 1. GET NETWORK FILTER FROM QUERY
    const targetNetwork = (req.query.network as string || 'ALL').toUpperCase();

    // 2. FILTER NODES BEFORE AGGREGATION
    // If 'ALL', keep everything. If 'MAINNET'/'DEVNET', filter by node.network
    const nodesToProcess = allNodes.filter(node => {
        if (targetNetwork === 'MAINNET') return node.network === 'MAINNET';
        if (targetNetwork === 'DEVNET') return node.network === 'DEVNET';
        return true; // 'ALL'
    });

    const cityMap = new Map<string, any>();

    // 3. ITERATE OVER THE FILTERED LIST
    nodesToProcess.forEach(node => {
      const { city, countryName, countryCode, lat, lon } = node.location;

      // Skip nodes without valid coordinates
      if (lat === 0 && lon === 0) return; 

      const key = `${city}-${countryName}`;
      const storageGB = (node.storage_committed || 0) / (1024 ** 3);
      const network = node.network || 'UNKNOWN';

      const isUntracked = node.isUntracked || false;
      const hasCredits = node.credits !== null; 

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

        // --- TRACKING KINGS (Within the filtered dataset) ---

        // 1. Storage King
        if (storageGB > existing.bestNodes.storageVal) {
            existing.bestNodes.storageVal = storageGB;
            existing.bestNodes.storagePk = node.pubkey;
            existing.bestNodes.storageNet = network;
            existing.bestNodes.storageAddr = node.address;
        }

        // 2. Credits King
        const currentKingUntracked = existing.bestNodes.creditsUntracked;

        // If the new node is "better" (has credits while king doesn't, or has more credits)
        const isBetter = (!isUntracked && currentKingUntracked) || 
                         ((node.credits || 0) >= existing.bestNodes.creditsVal);

        if (isBetter) {
            existing.bestNodes.creditsVal = node.credits || 0;
            existing.bestNodes.creditsPk = node.pubkey;
            existing.bestNodes.creditsNet = network;
            existing.bestNodes.creditsAddr = node.address;
            existing.bestNodes.creditsUntracked = isUntracked; 
        }

        // 3. Health King
        if (node.health > existing.bestNodes.healthVal) {
            existing.bestNodes.healthVal = node.health;
            existing.bestNodes.healthPk = node.pubkey;
            existing.bestNodes.healthUptime = node.uptime || 0;
            existing.bestNodes.healthNet = network;
            existing.bestNodes.healthAddr = node.address;
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

          bestNodes: {
              // Storage
              storageVal: storageGB, 
              storagePk: node.pubkey, 
              storageNet: network,
              storageAddr: node.address,

              // Credits
              creditsVal: node.credits || 0, 
              creditsPk: node.pubkey, 
              creditsNet: network,
              creditsAddr: node.address,
              creditsUntracked: isUntracked, 

              // Health
              healthVal: node.health, 
              healthPk: node.pubkey, 
              healthUptime: node.uptime || 0, 
              healthNet: network,
              healthAddr: node.address
          }
        });
      }
    });

    const locations = Array.from(cityMap.values()).map(l => {
        // If NO node in this city had valid credits, set total to null
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
                  address: l.bestNodes.storageAddr
              },
              CREDITS: { 
                  pk: l.bestNodes.creditsPk, 
                  val: l.bestNodes.creditsVal, 
                  network: l.bestNodes.creditsNet,
                  address: l.bestNodes.creditsAddr,
                  isUntracked: l.bestNodes.creditsUntracked 
              },
              HEALTH: { 
                  pk: l.bestNodes.healthPk, 
                  val: l.bestNodes.healthVal, 
                  subVal: l.bestNodes.healthUptime, 
                  network: l.bestNodes.healthNet,
                  address: l.bestNodes.healthAddr
              }
          }
        };
    });

    const topRegion = [...locations].sort((a, b) => b.totalStorage - a.totalStorage)[0];

    res.status(200).json({
      locations,
      stats: {
        // 4. UPDATE STATS TO REFLECT FILTERED COUNT
        // If filtering by Mainnet, this will show only Mainnet node count
        totalNodes: nodesToProcess.length, 
        countries: new Set(locations.map(l => l.country)).size,
        topRegion: topRegion ? topRegion.name : 'Global',
        topRegionMetric: topRegion ? topRegion.totalStorage : 0
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Geo System Offline' });
  }
}
