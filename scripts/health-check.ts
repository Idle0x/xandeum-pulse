import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase';

// --- CONFIG ---
const PULSE_API_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stats` 
  : 'https://xandeum-pulse.vercel.app/api/stats';

async function runMonitor() {
  console.log("🏥 Starting Pulse Monitor...");

  try {
    console.log(`2️⃣ Connecting to Pulse API: ${PULSE_API_URL}`);
    const pulseResponse = await axios.get(PULSE_API_URL, { timeout: 30000 });
    const rawData = pulseResponse.data;

    let nodes = [];
    if (rawData.result && rawData.result.pods) {
        nodes = rawData.result.pods;
    } else if (Array.isArray(rawData)) {
        nodes = rawData;
    }

    if (!nodes || nodes.length === 0) {
      throw new Error("No nodes found in API response");
    }

    console.log(`📊 Retrieved ${nodes.length} nodes from API.`);

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn("⚠️ Skipping DB Write: Key missing.");
      process.exit(0);
    }

    // --- AGGREGATION & FILTERING ---
    const seenFingerprints = new Set<string>();
    const uniqueNodeRows: any[] = [];

    // Calculate Network Totals first (using raw nodes)
    const totalCapacity = nodes.reduce((acc: number, n: any) => acc + (n.storage_committed || 0), 0);
    const totalUsed = nodes.reduce((acc: number, n: any) => acc + (n.storage_used || 0), 0);
    const validHealthNodes = nodes.filter((n: any) => typeof n.health === 'number');
    const avgHealth = validHealthNodes.length > 0 
      ? validHealthNodes.reduce((acc: number, n: any) => acc + n.health, 0) / validHealthNodes.length 
      : 0;

    // --- NODE PROCESSING LOOP ---
    for (const n of nodes) {
      // 1. Generate Deduplication Fingerprint (7-Point Strict)
      // If two nodes match this exactly, they are duplicates.
      const dedupKey = `${n.pubkey}|${n.address}|${n.is_public}|${n.storage_committed}|${n.storage_used}|${n.version}|${n.credits}`;

      if (seenFingerprints.has(dedupKey)) {
        continue; // Skip exact duplicate
      }
      seenFingerprints.add(dedupKey);

      // 2. Generate Stable History ID (4-Point Stable)
      // This ID persists across reboots/updates but separates distinct instances
      // Format: {PUBKEY}-{ADDRESS}-{IS_PUBLIC}-{COMMITTED}
      const stableId = `${n.pubkey}-${n.address}-${n.is_public}-${n.storage_committed}`;

      uniqueNodeRows.push({
        node_id: stableId, // NEW COLUMN
        pubkey: n.pubkey,
        network: n.network || 'MAINNET',
        health: n.health || 0,
        credits: n.credits || 0,
        storage_committed: n.storage_committed || 0,
        storage_used: n.storage_used || 0,
        uptime: n.uptime || 0,
        rank: n.rank || 0
      });
    }

    // A. Insert Network Snapshot
    const { error: netError } = await supabase.from('network_snapshots').insert({
      total_capacity: totalCapacity,
      total_used: totalUsed,
      total_nodes: uniqueNodeRows.length,
      avg_health: Math.round(avgHealth),
      consensus_score: 0 
    });
    if (netError) console.error('❌ Network Snapshot Failed:', netError.message);

    // B. Insert Node Snapshots (Batched)
    const { error: nodeError } = await supabase.from('node_snapshots').insert(uniqueNodeRows);

    if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);
    else console.log(`✅ Saved ${uniqueNodeRows.length} Unique Node Snapshots (Filtered from ${nodes.length}).`);

    console.log("🚀 MONITORING COMPLETE");
    process.exit(0);

  } catch (error: any) {
    console.error("🔥 FATAL ERROR:", error.message);
    process.exit(1);
  }
}

runMonitor();
