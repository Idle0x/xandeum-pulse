import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// The "Gold List" - Includes the Discord seeds + known working nodes from your screenshots
const KNOWN_NODES = [
  '161.97.97.41', // Known stable
  '173.212.220.65',
  '192.190.136.36',
  '192.190.136.38',
  '207.244.255.1',
  '192.190.136.28',
  '192.190.136.29',
  '173.212.203.145'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Shuffle the array to distribute load, but keep the Gold Node likely to be picked
  const shuffled = KNOWN_NODES.sort(() => 0.5 - Math.random());
  
  // 2. Pick the top 3 nodes to race
  const selectedNodes = shuffled.slice(0, 3);

  // 3. Create a promise for each node
  const requests = selectedNodes.map(ip => 
    axios.post(
      `http://${ip}:6000/rpc`,
      {
        jsonrpc: '2.0',
        method: 'xand_getPods',
        params: [],
        id: 1,
      },
      { timeout: 5000 } // Increased timeout to 5s to be safe
    ).then(response => {
      if (response.data && response.data.result) {
        return response.data;
      }
      throw new Error('Invalid Data');
    })
  );

  try {
    // 4. THE RACE: The first node to answer wins!
    const winner = await Promise.any(requests);
    return res.status(200).json(winner);
  } catch (error) {
    console.error("All selected nodes failed.");
    // Fallback: If the race fails, try the Golden Node specifically as a last resort
    try {
        const backup = await axios.post(
            `http://161.97.97.41:6000/rpc`,
            { jsonrpc: '2.0', method: 'xand_getPods', params: [], id: 1 },
            { timeout: 8000 }
        );
        return res.status(200).json(backup.data);
    } catch (finalError) {
        return res.status(503).json({ error: 'Network Unreachable' });
    }
  }
}
