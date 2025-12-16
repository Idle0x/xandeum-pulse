import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const RPC_URL = 'http://173.212.203.145:6000/rpc';

  try {
    // Axios automatically handles the HTTP connection better
    const response = await axios.post(RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'get-pods-with-stats'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    // Send the successful data back to the browser
    res.status(200).json(response.data);

  } catch (error: any) {
    console.error('API Error:', error.message);
    // Send a clear error message
    res.status(500).json({ 
      error: 'Connection failed', 
      details: error.message,
      // If the node sent a response (like 405 or 500), show it
      response: error.response?.data 
    });
  }
}
