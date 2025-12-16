import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch the raw credits data
    const response = await axios.get('https://podcredits.xandeum.network/api/pods-credits');
    
    // Send it to our frontend
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Credits API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
}

