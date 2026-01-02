import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_MAINNET = 'https://podcredits.xandeum.network/api/pods-credits';
const API_DEVNET  = 'https://podcredits.xandeum.network/api/devnet-pod-credits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_MAINNET, { timeout: 8000 }),
        axios.get(API_DEVNET, { timeout: 8000 })
    ]);

    const allCredits: any[] = [];

    // Helper to push tagged data
    const pushData = (res: PromiseSettledResult<any>, net: string) => {
        if (res.status === 'fulfilled') {
            const data = res.value.data?.pods_credits || res.value.data;
            if (Array.isArray(data)) {
                data.forEach((c: any) => allCredits.push({ ...c, network: net }));
            }
        }
    };

    pushData(mainnetRes, 'MAINNET');
    pushData(devnetRes, 'DEVNET');

    res.status(200).json({ pods_credits: allCredits });
  } catch (error) {
    res.status(503).json({ error: 'Credits System Offline' });
  }
}
