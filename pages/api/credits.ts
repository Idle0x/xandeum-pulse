import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_MAINNET = 'https://podcredits.xandeum.network/api/pods-credits';
const API_DEVNET  = 'https://podcredits.xandeum.network/devnet/api/pods-credits';
const TIMEOUT_LIMIT = 8000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_MAINNET, { timeout: TIMEOUT_LIMIT }),
        axios.get(API_DEVNET, { timeout: TIMEOUT_LIMIT })
    ]);

    // Create a Map to handle the merge (Priority: Mainnet overwrites Devnet)
    const combinedMap = new Map();

    // 1. Load Devnet (Base)
    if (devnetRes.status === 'fulfilled') {
        const data = devnetRes.value.data?.pods_credits || devnetRes.value.data || [];
        if(Array.isArray(data)) {
            data.forEach((item: any) => {
                const key = item.pod_id || item.pubkey || item.node;
                if(key) combinedMap.set(key, { ...item, network: 'DEVNET' });
            });
        }
    }

    // 2. Load Mainnet (Priority)
    if (mainnetRes.status === 'fulfilled') {
        const data = mainnetRes.value.data?.pods_credits || mainnetRes.value.data || [];
        if(Array.isArray(data)) {
            data.forEach((item: any) => {
                const key = item.pod_id || item.pubkey || item.node;
                if(key) combinedMap.set(key, { ...item, network: 'MAINNET' });
            });
        }
    }

    // Convert to Array
    const combinedArray = Array.from(combinedMap.values());

    res.status(200).json({ pods_credits: combinedArray });

  } catch (error: any) {
    console.error('Credits Proxy Error:', error.message);
    res.status(503).json({ error: 'Credits System Offline' });
  }
}
