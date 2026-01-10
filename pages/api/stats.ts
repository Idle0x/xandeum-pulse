// pages/api/stats.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. CRASHPROOF HEADERS: Prevent Vercel/Edge caching of stale node data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 2. Capture mode
  const mode = req.query.mode === 'swarm' ? 'swarm' : 'fast';

  try {
    // 3. FETCH DATA
    const { nodes, stats } = await getNetworkPulse(mode);

    // 4. CRITICAL: SEND RAW ARRAY
    // Do NOT loop through 'nodes' and convert to a Map/Object here.
    // That would cause the "Last-Write-Wins" bug and delete the Devnet ghost node.
    
    res.status(200).json({
      result: {
        pods: nodes // <--- Send the array directly. It contains both Mainnet & Devnet versions.
      },
      stats: stats 
    });

  } catch (error) {
    console.error(`Stats API Fatal Error (${mode} mode):`, error);

    res.status(503).json({ 
        error: 'Pulse System Offline', 
        details: String(error),
        stats: {
            totalNodes: 0,
            systemStatus: { rpc: false, credits: false }
        }
    });
  }
}
