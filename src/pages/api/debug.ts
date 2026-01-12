import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Force dynamic to prevent caching during debug
export const dynamic = 'force-dynamic';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const debugLog: any = {};

  try {
    // 1. Fetch Credits Raw
    debugLog.step1 = "Fetching Credits...";
    const creditRes = await axios.get('https://podcredits.xandeum.network/api/pods-credits', { timeout: 5000 });
    debugLog.creditsStatus = creditRes.status;
    
    // Check structure
    const rawCredits = creditRes.data?.pods_credits || creditRes.data || [];
    debugLog.creditsType = Array.isArray(rawCredits) ? "Array" : typeof rawCredits;
    debugLog.creditsCount = Array.isArray(rawCredits) ? rawCredits.length : 0;
    
    // Sample a credit item
    if (Array.isArray(rawCredits) && rawCredits.length > 0) {
        debugLog.sampleCredit = rawCredits[0]; // See what keys exist (pod_id? pubkey?)
    }

    // 2. Fetch Nodes Raw (Primary Only for speed)
    debugLog.step2 = "Fetching Nodes...";
    const nodeRes = await axios.post('http://173.212.203.145:6000/rpc', { 
        jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 
    }, { timeout: 5000 });
    
    const rawNodes = nodeRes.data?.result?.pods || [];
    debugLog.nodesCount = rawNodes.length;

    // Sample a node item
    if (rawNodes.length > 0) {
        debugLog.sampleNode = rawNodes[0]; // See what keys exist (pubkey? public_key?)
    }

    // 3. Attempt a Match (The Smoke Test)
    if (debugLog.sampleCredit && debugLog.sampleNode) {
        // Test matching the first credit ID against all nodes
        const creditKey = debugLog.sampleCredit.pod_id || debugLog.sampleCredit.pubkey;
        const matchingNode = rawNodes.find((n: any) => n.pubkey === creditKey);
        
        debugLog.matchTest = {
            targetKey: creditKey,
            foundMatch: !!matchingNode,
            matchedNodePubkey: matchingNode?.pubkey
        };
    }

    res.status(200).json(debugLog);

  } catch (error: any) {
    res.status(500).json({ 
        error: 'Debug Failed', 
        message: error.message, 
        step: debugLog 
    });
  }
}
