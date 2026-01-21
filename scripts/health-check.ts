import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase';

// --- CONFIG ---
const UPSTREAM_ENDPOINTS = [
  'https://podcredits.xandeum.network/api/mainnet-pod-credits',
  'https://podcredits.xandeum.network/api/pods-credits'
];

// Defaults to production, but allows local override
const PULSE_API_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stats` 
  : 'https://xandeum-pulse.vercel.app/api/stats';

async function runMonitor() {
  console.log("🏥 Starting Pulse Monitor...");

  try {
    // --- STEP 1: CHECK UPSTREAM (The Source) ---
    console.log("1️⃣ Checking Upstream Health...");
    const [mainnet, devnet] = await Promise.all(
      UPSTREAM_ENDPOINTS.map(url => axios.get(url, { timeout: 5000 }))
    );

    if (mainnet.status !== 200 || devnet.status !== 200) {
      throw new Error(`API Status Error: Mainnet ${mainnet.status} / Devnet ${devnet.status}`);
    }
    console.log("✅ Upstream APIs Healthy.");

    // --- STEP 2: TAKE SNAPSHOT (The Database) ---
    console.log(`2️⃣ Connecting to Pulse API: ${PULSE_API_URL}`);
    
    // Fetch data
    const pulseResponse = await axios.get(PULSE_API_URL, { timeout: 15000 });
    const rawData = pulseResponse.data;

    // --- FIX: HANDLE NESTED "result.pods" STRUCTURE ---
    let nodes = [];
    if (Array.isArray(rawData)) {
        nodes = rawData;
    } else if (rawData.nodes) {
        nodes = rawData.nodes;
    } else if (rawData.data) {
        nodes = rawData.data;
    } else if (rawData.result && rawData.result.pods) {
        // This is the specific case your logs revealed
        nodes = rawData.result.pods;
    }

    // Validation
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      console.error("❌ INVALID DATA STRUCTURE RECEIVED:");
      console.error(JSON.stringify(rawData).slice(0, 200) + "..."); 
      throw new Error("Failed to extract node array from API response");
    }

    console.log(`📊 Retrieved ${nodes.length} nodes from API.`);

    const supabase = getServiceSupabase();

    if (!supabase) {
      console.warn("⚠️ Skipping DB Write: SUPABASE_SERVICE_ROLE_KEY missing.");
    } else {
      // Calculate Network Aggregates
      const totalCapacity = nodes.reduce((acc: number, n: any) => acc + (n.storage_committed || 0), 0);
      const totalUsed = nodes.reduce((acc: number, n: any) => acc + (n.storage_used || 0), 0);
      
      // Safety: Ensure health is a number before averaging
      const validHealthNodes = nodes.filter((n: any) => typeof n.health === 'number');
      const avgHealth = validHealthNodes.length > 0 
        ? validHealthNodes.reduce((acc: number, n: any) => acc + n.health, 0) / validHealthNodes.length 
        : 0;

      // A. Insert Network Snapshot
      const { error: netError } = await supabase
        .from('network_snapshots')
        .insert({
          total_capacity: totalCapacity,
          total_used: totalUsed,
          total_nodes: nodes.length,
          avg_health: Math.round(avgHealth),
          consensus_score: 0 
        });

      if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
      else console.log('✅ Network Snapshot Saved.');

      // B. Insert Node Snapshots
      const nodeRows = nodes.map((n: any) => ({
        pubkey: n.pubkey,
        network: n.network || 'MAINNET',
        health: n.health || 0,
        credits: n.credits || 0,
        storage_committed: n.storage_committed || 0,
        storage_used: n.storage_used || 0,
        uptime: n.uptime || 0,
        rank: n.rank || 0
      }));

      const { error: nodeError } = await supabase
        .from('node_snapshots')
        .insert(nodeRows);

      if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);
      else console.log(`✅ Saved ${nodeRows.length} Node Snapshots.`);
    }

    console.log("🚀 MONITORING COMPLETE: SYSTEM HEALTHY");
    process.exit(0);

  } catch (error: any) {
    console.error("🔥 SYSTEM FAILURE DETECTED");
    if (error.response) {
       console.error(`Status: ${error.response.status}`);
    } else {
       console.error(error.message);
    }
    process.exit(1);
  }
}

runMonitor();
