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

    const allCredits: any[] = [];

    // Push Mainnet items tagged
    if (mainnetRes.status === 'fulfilled') {
        const data = mainnetRes.value.data?.pods_credits || mainnetRes.value.data || [];
        if(Array.isArray(data)) {
            data.forEach((c: any) => allCredits.push({ ...c, network: 'MAINNET' }));
        }
    }

    // Push Devnet items tagged (NO merging/overwriting)
    if (devnetRes.status === 'fulfilled') {
        const data = devnetRes.value.data?.pods_credits || devnetRes.value.data || [];
        if(Array.isArray(data)) {
            data.forEach((c: any) => allCredits.push({ ...c, network: 'DEVNET' }));
        }
    }

    res.status(200).json({ pods_credits: allCredits });

  } catch (error: any) {
    res.status(503).json({ error: 'Credits System Offline' });
  }
}
