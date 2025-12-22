import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkPulse } from '../../lib/xandeum-brain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // getNetworkPulse now returns { nodes, stats }
    // 'stats' includes: consensusVersion, medianCredits, totalNodes, AND avgBreakdown
    const { nodes, stats } = await getNetworkPulse();

    res.status(200).json({
      result: {
        pods: nodes // The enriched list of nodes
      },
      stats: stats // Passing the calculated network averages to the frontend
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    res.status(500).json({ error: 'Pulse System Offline', details: String(error) });
  }
}
