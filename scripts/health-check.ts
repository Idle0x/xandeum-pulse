import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase';

// --- CONFIG ---
const UPSTREAM_ENDPOINTS = [
  'https://podcredits.xandeum.network/api/mainnet-pod-credits',
  'https://podcredits.xandeum.network/api/pods-credits'
];
// We fetch from YOUR app to get the calculated "Health", "Rank", and "Location" data
const PULSE_API_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stats` 
  : 'https://xandeum-pulse.vercel.app/api/stats';

// --- TYPES ---
interface SnapshotNode {
  pubkey: string;
  network: string;
  health: number;
  credits: number;
  storage_committed: number;
  storage_used: number;
  uptime: number;
  rank: number;
}

async function runMonitor() {
  console.log("🏥 Starting Pulse Monitor...");

  try {
    // --- STEP 1: YOUR ORIGINAL HEALTH CHECK (The Gatekeeper) ---
    // We check the raw upstream first. If this fails, we don't want to snapshot bad data.
    console.log("1️⃣ Checking Upstream Health...");
    const [mainnet, devnet] = await Promise.all(
      UPSTREAM_ENDPOINTS.map(url => axios.get(url, { timeout: 5000 }))
    );

    if (mainnet.status !== 200 || devnet.status !== 200) {
      throw new Error(`API Status Error: Mainnet ${mainnet.status} / Devnet ${devnet.status}`);
    }

    // Schema Validation (Your original logic)
    const data = mainnet.data.pods_credits || mainnet.data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("⚠️ Critical: Mainnet API returned empty/invalid data.");
    }
    const sampleNode = data[0];
    if (typeof sampleNode.credits === 'undefined') {
       throw new Error("⚠️ Critical: API schema change detected. 'credits' missing.");
    }
    console.log("✅ Upstream APIs Healthy.");


    // --- STEP 2: THE SHADOW LAYER INGESTION (The Database) ---
    console.log("2️⃣ Taking Database Snapshot...");
    
    // We fetch from YOUR /api/stats because it already calculates Health, Rank, and Location
    // This ensures the database matches exactly what users see on the dashboard.
    const pulseResponse = await axios.get(PULSE_API_URL, { timeout: 10000 });
    const nodes = pulseResponse.data.nodes;

    if (!nodes || !Array.isArray(nodes)) {
      throw new Error("Failed to fetch enriched nodes from Pulse API");
    }

    const supabase = getServiceSupabase();

    if (!supabase) {
      console.warn("⚠️ Skipping DB Write: SUPABASE_SERVICE_ROLE_KEY missing.");
    } else {
      // A. Network Snapshot
      const totalCapacity = nodes.reduce((acc: number, n: any) => acc + (n.storage_committed || 0), 0);
      const totalUsed = nodes.reduce((acc: number, n: any) => acc + (n.storage_used || 0), 0);
      const avgHealth = nodes.reduce((acc: number, n: any) => acc + (n.health || 0), 0) / nodes.length;

      const { error: netError } = await supabase
        .from('network_snapshots')
        .insert({
          total_capacity: totalCapacity,
          total_used: totalUsed,
          total_nodes: nodes.length,
          avg_health: avgHealth,
          // Simple consensus calc: % of nodes matching the most common version
          consensus_score: 0 // You can calculate this if needed, or default to 0 for now
        });

      if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
      else console.log('✅ Network Snapshot Saved.');

      // B. Node Snapshots
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

      // Upsert or Insert
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
    console.error(error.message);
    process.exit(1);
  }
}

runMonitor();
