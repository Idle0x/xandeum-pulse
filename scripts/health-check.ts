// scripts/health-check.ts
import axios from 'axios';

const ENDPOINTS = [
  'https://podcredits.xandeum.network/api/mainnet-pod-credits',
  'https://podcredits.xandeum.network/api/pods-credits'
];

async function checkNetworkHealth() {
  console.log("🏥 Starting Pulse Network Health Check...");

  try {
    // 1. Check API Availability
    const [mainnet, devnet] = await Promise.all(
      ENDPOINTS.map(url => axios.get(url, { timeout: 5000 }))
    );

    if (mainnet.status !== 200 || devnet.status !== 200) {
      throw new Error(`API Status Error: Mainnet ${mainnet.status} / Devnet ${devnet.status}`);
    }

    console.log("✅ APIs are responding (200 OK)");

    // 2. Check Data Integrity (Schema Validation)
    // We expect an array or an object with 'pods_credits'
    const data = mainnet.data.pods_credits || mainnet.data;
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("⚠️ Critical: Mainnet API returned empty or invalid data format.");
    }

    // 3. Check "Vitality" Prerequisites
    // Ensure we are getting the fields our math relies on
    const sampleNode = data[0];
    if (typeof sampleNode.credits === 'undefined') {
       throw new Error("⚠️ Critical: API schema change detected. 'credits' field missing.");
    }

    console.log(`✅ Data Schema valid. Sample Node Credits: ${sampleNode.credits}`);
    console.log("🚀 SYSTEM HEALTHY");
    process.exit(0);

  } catch (error: any) {
    console.error("🔥 SYSTEM FAILURE DETECTED");
    console.error(error.message);
    // Exit with error code 1 to trigger GitHub Action failure email
    process.exit(1);
  }
}

checkNetworkHealth();
