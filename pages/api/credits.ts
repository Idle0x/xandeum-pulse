import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Set a strict timeout to prevent the UI from hanging while waiting for a dead API
const TIMEOUT_LIMIT = 8000; // 8 Seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch the raw credits data with a timeout
    const response = await axios.get('https://podcredits.xandeum.network/api/pods-credits', {
        timeout: TIMEOUT_LIMIT
    });
    
    // Pass the data through directly
    res.status(200).json(response.data);

  } catch (error: any) {
    console.error('Credits API Error:', error.message);
    
    // CRASHPROOF RESPONSE:
    // Return a 503 Service Unavailable. 
    // The frontend catches this error and switches the UI to "Credits API Offline" mode.
    res.status(503).json({ 
        error: 'Upstream Credits API Unavailable',
        details: error.message 
    });
  }
}
