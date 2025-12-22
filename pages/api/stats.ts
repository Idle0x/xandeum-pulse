import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { nodes, stats } = await getNetworkPulse();

    res.status(200).json({
      result: {
        pods: nodes 
      },
      stats: stats 
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    res.status(500).json({ error: 'Pulse System Offline', details: String(error) });
  }
}
