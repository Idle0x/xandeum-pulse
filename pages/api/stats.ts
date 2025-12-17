import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// --- CONFIGURATION ---
const PRIMARY_NODE = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41',
  '192.190.136.36',
  '192.190.136.38',
  '207.244.255.1',
  '192.190.136.28',
  '192.190.136.29'
];

const TIMEOUT_PRIMARY = 4000; // 4s for Hero
const TIMEOUT_BACKUP = 6000;  // 6s for Backup Race

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- ATTEMPT 1: THE HERO NODE ---
  try {
    const response = await axios.post(
      `http://${PRIMARY_NODE}:6000/rpc`,
      {
        jsonrpc: '2.0',
        method: 'get-pods-with-stats',
        params: [],
        id: 1,
      },
      { timeout: TIMEOUT_PRIMARY } 
    );

    if (response.data && response.data.result) {
      return res.status(200).json(response.data);
    }
  } catch (error) {
    console.warn(`Primary node ${PRIMARY_NODE} failed. Switching to backups...`);
  }

  // --- ATTEMPT 2: THE BACKUP SQUAD (Race Mode) ---
  const shuffled = BACKUP_NODES.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const requests = shuffled.map(ip => 
    axios.post(
      `http://${ip}:6000/rpc`,
      {
        jsonrpc: '2.0',
        method: 'get-pods-with-stats',
        params: [],
        id: 1,
      },
      { timeout: TIMEOUT_BACKUP } 
    ).then(res => {
      if (res.data && res.data.result) return res.data;
      throw new Error('Invalid Data');
    })
  );

  try {
    const winner = await Promise.any(requests);
    return res.status(200).json(winner);
  } catch (error) {
    console.error("All backups failed.");
    return res.status(503).json({ error: 'Network Unreachable' });
  }
}
