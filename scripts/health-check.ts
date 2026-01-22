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

    // Calculate Raw Totals (Pre-Dedup)
    const rawCapacity = nodes.reduce((acc: number, n: any) => acc + (n.storage_committed || 0), 0);
    const rawUsed = nodes.reduce((acc: number, n: any) => acc + (n.storage_used || 0), 0);
    
    // --- NODE PROCESSING LOOP ---
    for (const n of nodes) {
      // 1. Generate Deduplication Fingerprint (7-Point Strict)
      // If two nodes match this exactly, they are duplicates.
      const dedupKey = `${n.pubkey}|${n.address}|${n.is_public}|${n.storage_committed}|${n.storage_used}|${n.version}|${n.credits}`;

      if (seenFingerprints.has(dedupKey)) {
        continue; // Skip exact duplicate
      }
      seenFingerprints.add(dedupKey);

      // 2. Generate Stable History ID (MATCHING FRONTEND)
      // OLD: {PUBKEY}-{ADDRESS}-{IS_PUBLIC}-{COMMITTED}
      // NEW: {PUBKEY}-{ADDRESS}-{VERSION}-{IS_PUBLIC}
      
      const versionSafe = n.version || '0.0.0'; // Safety Fallback
      const stableId = `${n.pubkey}-${n.address}-${versionSafe}-${n.is_public}`;

      uniqueNodeRows.push({
        node_id: stableId,
        pubkey: n.pubkey,
        network: n.network || 'MAINNET',
        health: n.health || 0,
        credits: n.credits || 0,
        storage_committed: n.storage_committed || 0,
        storage_used: n.storage_used || 0,
        uptime: n.uptime || 0,
        rank: n.rank || 0,
        // Ensure created_at is explicit if DB defaults fail
        created_at: new Date().toISOString() 
      });
    }

    // --- NEW METRIC CALCULATIONS ---
    
    // 1. Basic Health/Storage
    const validHealthNodes = uniqueNodeRows.filter((n: any) => n.health > 0);
    const avgHealth = validHealthNodes.length > 0 
      ? validHealthNodes.reduce((acc, n) => acc + n.health, 0) / validHealthNodes.length 
      : 0;

    // 2. Financial / Leaderboard Metrics
    const totalCredits = uniqueNodeRows.reduce((acc, n) => acc + (n.credits || 0), 0);
    const avgCredits = uniqueNodeRows.length > 0 ? totalCredits / uniqueNodeRows.length : 0;

    // 3. Dominance (Top 10 Nodes share of total credits)
    const sortedByCredits = [...uniqueNodeRows].sort((a, b) => b.credits - a.credits);
    const top10Sum = sortedByCredits.slice(0, 10).reduce((acc, n) => acc + n.credits, 0);
    const dominance = totalCredits > 0 ? (top10Sum / totalCredits) * 100 : 0;

    // A. Insert Network Snapshot (Expanded)
    const { error: netError } = await supabase.from('network_snapshots').insert({
      total_capacity: rawCapacity, // Use raw or deduplicated depending on preference
      total_used: rawUsed,
      total_nodes: uniqueNodeRows.length,
      avg_health: Math.round(avgHealth),
      consensus_score: 0,
      
      // NEW FIELDS
      total_credits: totalCredits,
      avg_credits: avgCredits,
      top10_dominance: parseFloat(dominance.toFixed(2))
    });
    
    if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
    else console.log('✅ Network Snapshot Saved (with new metrics).');

    // B. Insert Node Snapshots (Batched)
    const { error: nodeError } = await supabase.from('node_snapshots').insert(uniqueNodeRows);

    if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);
    else console.log(`✅ Saved ${uniqueNodeRows.length} Unique Node Snapshots.`);

    console.log("🚀 MONITORING COMPLETE");
    process.exit(0);

  } catch (error: any) {
    console.error("🔥 FATAL ERROR:", error.message);
    process.exit(1);
  }
}

runMonitor();
