import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRASHPROOF: Prevent Vercel/Edge caching of stale node data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { nodes, stats } = await getNetworkPulse();

    res.status(200).json({
      result: {
        pods: nodes 
      },
      stats: stats 
    });

  } catch (error) {
    console.error("Stats API Fatal Error:", error);
    
    // Return 503 (Service Unavailable) so frontend knows to keep retrying or show 'Offline'
    res.status(503).json({ 
        error: 'Pulse System Offline', 
        details: String(error),
        // Fallback stats so UI doesn't completely break if it tries to read stats
        stats: {
            totalNodes: 0,
            systemStatus: { rpc: false, credits: false }
        }
    });
  }
}
