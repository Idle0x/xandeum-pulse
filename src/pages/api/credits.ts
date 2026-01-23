// pages/api/credits.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const API_DEVNET  = 'https://podcredits.xandeum.network/api/pods-credits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_MAINNET, { timeout: 8000 }),
        axios.get(API_DEVNET, { timeout: 8000 })
    ]);

    // Helper to extract data safely
    const extractData = (res: PromiseSettledResult<any>) => {
        if (res.status === 'fulfilled') {
            const data = res.value.data?.pods_credits || res.value.data;
            if (Array.isArray(data)) return data;
        }
        return [];
    };

    const mainnetData = extractData(mainnetRes);
    const devnetData = extractData(devnetRes);

    // Return segregated data structure
    res.status(200).json({ 
        mainnet: mainnetData, 
        devnet: devnetData 
    });

  } catch (error) {
    console.error("Credits API Error:", error);
    res.status(503).json({ error: 'Credits System Offline' });
  }
}
