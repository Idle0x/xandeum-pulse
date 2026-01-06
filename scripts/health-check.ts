// scripts/health-check.ts
import axios from 'axios';

const ENDPOINTS = [
  { name: 'MAINNET', url: 'https://podcredits.xandeum.network/api/mainnet-pod-credits' },
  { name: 'DEVNET',  url: 'https://podcredits.xandeum.network/api/pods-credits' }
];

async function checkNetworkHealth() {
  console.log("🏥 Starting Pulse Deep Health Check...");

  try {
    // 1. Fetch Both APIs
    const responses = await Promise.all(
      ENDPOINTS.map(ep => axios.get(ep.url, { timeout: 8000 }).then(res => ({ ...ep, res })))
    );

    for (const { name, res } of responses) {
        // A. Check Status
        if (res.status !== 200) {
            throw new Error(`🔥 ${name} API is down! Status: ${res.status}`);
        }

        // B. Normalize Data (Handle array or { pods_credits: [...] })
        const data = res.data.pods_credits || res.data;

        // C. Check Structure
        if (!Array.isArray(data)) {
            throw new Error(`⚠️ ${name} Critical: Data is not an array.`);
        }
        if (data.length === 0) {
            throw new Error(`⚠️ ${name} Warning: API returned 0 nodes (Empty List).`);
        }

        // D. Scan ALL Nodes for Schema Vitality
        // We check every single node to ensure 'credits' exists and is a number
        const corruptedNodes = data.filter(node => 
            typeof node.credits === 'undefined' || 
            node.credits === null
        );

        if (corruptedNodes.length > 0) {
            throw new Error(`⚠️ ${name} Schema Violation: ${corruptedNodes.length} nodes have missing/null credits.`);
        }

        console.log(`✅ ${name} Healthy: ${data.length} nodes verified.`);
    }

    console.log("🚀 ALL SYSTEMS HEALTHY");
    process.exit(0);

  } catch (error: any) {
    console.error("🔥 SYSTEM FAILURE DETECTED");
    console.error(error.message);
    process.exit(1);
  }
}

checkNetworkHealth();
