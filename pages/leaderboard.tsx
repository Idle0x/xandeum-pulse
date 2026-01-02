import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_MAINNET = 'https://podcredits.xandeum.network/api/pods-credits';
const API_DEVNET = 'https://podcredits.xandeum.network/devnet/api/pods-credits';
const TIMEOUT_LIMIT = 8000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parallel Fetch
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_MAINNET, { timeout: TIMEOUT_LIMIT }),
        axios.get(API_DEVNET, { timeout: TIMEOUT_LIMIT })
    ]);

    const mainnetData = mainnetRes.status === 'fulfilled' ? (mainnetRes.value.data?.pods_credits || mainnetRes.value.data || []) : [];
    const devnetData = devnetRes.status === 'fulfilled' ? (devnetRes.value.data?.pods_credits || devnetRes.value.data || []) : [];

    // Combine them. If a node is in Mainnet, we use that. 
    // If only in Devnet, we use that.
    
    // 1. Create Map from Devnet (Base)
    const combinedMap = new Map();
    if(Array.isArray(devnetData)) {
        devnetData.forEach((item: any) => {
            const key = item.pod_id || item.pubkey || item.node;
            if(key) combinedMap.set(key, { ...item, network: 'DEVNET' });
        });
    }

    // 2. Overwrite with Mainnet (Priority)
    if(Array.isArray(mainnetData)) {
        mainnetData.forEach((item: any) => {
            const key = item.pod_id || item.pubkey || item.node;
            if(key) combinedMap.set(key, { ...item, network: 'MAINNET' });
        });
    }

    // Convert back to array
    const combinedArray = Array.from(combinedMap.values());

    res.status(200).json({ pods_credits: combinedArray });

  } catch (error: any) {
    console.error('Credits API Aggregation Error:', error.message);
    res.status(503).json({ 
        error: 'Upstream Credits API Unavailable',
        details: error.message 
    });
  }
}
