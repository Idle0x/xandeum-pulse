import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// URLS
const API_MAINNET = 'https://podcredits.xandeum.network';
const API_DEVNET  = 'https://podcredits.xandeum.network/devnet';

// CONFIG (Browser Mimic)
const AXIOS_CONFIG = {
    timeout: 8000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [mainnetRes, devnetRes] = await Promise.allSettled([
        axios.get(API_MAINNET, AXIOS_CONFIG),
        axios.get(API_DEVNET, AXIOS_CONFIG)
    ]);

    const allCredits: any[] = [];
    
    // Robust Parsing Helper
    const extractCredits = (result: PromiseSettledResult<any>) => {
        if (result.status !== 'fulfilled') return [];
        const d = result.value.data;
        if (d?.pods_credits && Array.isArray(d.pods_credits)) return d.pods_credits;
        if (Array.isArray(d)) return d;
        return [];
    };

    const mainnetData = extractCredits(mainnetRes);
    const devnetData = extractCredits(devnetRes);

    mainnetData.forEach((c: any) => allCredits.push({ ...c, network: 'MAINNET' }));
    devnetData.forEach((c: any) => allCredits.push({ ...c, network: 'DEVNET' }));

    res.status(200).json({ pods_credits: allCredits });

  } catch (error: any) {
    console.error('Credits Proxy Error:', error.message);
    res.status(503).json({ error: 'Credits System Offline' });
  }
}
