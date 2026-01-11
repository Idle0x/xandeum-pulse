import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Security Check: Only allow POST requests (like the real RPC)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Load the Secret URL
  const privateUrl = process.env.XANDEUM_PRIVATE_RPC_URL;

  if (!privateUrl) {
    console.error('❌ Missing XANDEUM_PRIVATE_RPC_URL in .env.local');
    return res.status(500).json({ error: 'Server Configuration Error' });
  }

  try {
    // 3. Forward the request from the browser to your Private VPS
    // We pass along the "body" (the JSON-RPC command) exactly as we received it.
    const response = await axios.post(privateUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 6000, // Fail fast if tunnel is down
    });

    // 4. Send the VPS response back to the browser
    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error('❌ Proxy Error:', error.message);
    // Return a generic error so we don't leak details to the user
    return res.status(502).json({ error: 'Bad Gateway: Could not reach private node' });
  }
}
