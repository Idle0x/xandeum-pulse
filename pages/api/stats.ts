import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// The "Gold List" from Discord
const SEED_NODES = [
  '173.212.220.65',
  '161.97.97.41',
  '192.190.136.36',
  '192.190.136.38',
  '207.244.255.1',
  '192.190.136.28',
  '192.190.136.29',
  '173.212.203.145'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We will try nodes one by one until we get a response
  for (const ip of SEED_NODES) {
    try {
      // 2-second timeout per node (fail fast so user doesn't wait long)
      const response = await axios.post(
        `http://${ip}:6000/rpc`,
        {
          jsonrpc: '2.0',
          method: 'xand_getPods', // This is the v0.7.0+ method
          params: [],
          id: 1,
        },
        { timeout: 2500 } 
      );

      if (response.data && response.data.result) {
        // Success! Return data and stop the loop
        return res.status(200).json(response.data);
      }
    } catch (error) {
      // If this node fails, we just continue to the next one in the loop
      console.warn(`Node ${ip} failed, trying next...`);
      continue;
    }
  }

  // If we loop through ALL nodes and none work:
  return res.status(503).json({ error: 'All Seed Nodes Unreachable' });
}
