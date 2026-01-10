import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRASHPROOF: Prevent Vercel/Edge caching of stale node data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 1. Capture the mode from query string (default to 'fast')
  const mode = req.query.mode === 'swarm' ? 'swarm' : 'fast';

  try {
    // 2. Pass mode to the brain
    const { nodes, stats } = await getNetworkPulse(mode);

    res.status(200).json({
      result: {
        pods: nodes 
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