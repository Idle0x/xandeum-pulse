// pages/api/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getNetworkPulse();
    
    // Structure MUST match what frontend expects: res.data.result.pods
    res.status(200).json({
      result: { pods: data.nodes }, 
      stats: data.stats
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    res.status(503).json({ error: 'Pulse System Offline' });
  }
}
