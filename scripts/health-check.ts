import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase';

const PULSE_API_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stats` 
  : 'https://xandeum-pulse.vercel.app/api/stats';

// --- HELPER: Calculate Consensus ---
// Returns the dominant version and the percentage (score)
function getConsensusMetrics(nodeList: any[]) {
  if (!nodeList || nodeList.length === 0) {
    return { version: '0.0.0', score: 0 };
  }

  const versionCounts: Record<string, number> = {};
  
  // 1. Count versions
  for (const n of nodeList) {
    const v = n.version || 'Unknown';
    versionCounts[v] = (versionCounts[v] || 0) + 1;
  }

  // 2. Find winner
  let topVersion = 'Unknown';
  let topCount = 0;

  for (const [ver, count] of Object.entries(versionCounts)) {
    if (count > topCount) {
      topCount = count;
      topVersion = ver;
    }
  }

  // 3. Calculate Percentage
  const score = (topCount / nodeList.length) * 100;
  
  return { 
    version: topVersion, 
    score: parseFloat(score.toFixed(2)) // Round to 2 decimals
  };
}

async function runMonitor() {
  console.log("🏥 Starting Pulse Monitor (Professional Mode)...");

  try {
    const pulseResponse = await axios.get(PULSE_API_URL, { timeout: 30000 });
    let nodes = pulseResponse.data.result?.pods || pulseResponse.data;

    if (!nodes || nodes.length === 0) throw new Error("No nodes found");

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn("⚠️ No DB Key. Exiting.");
      process.exit(0);
    }

    // --- 1. SEGMENT DATA ---
    const uniqueNodeRows: any[] = [];
    const seenFingerprints = new Set<string>();

    // Buckets for Raw Nodes (to calculate consensus later)
    const globalNodes: any[] = [];
    const mainnetNodes: any[] = [];
    const devnetNodes: any[] = [];

    // Accumulators
    let globalStats = { cap: 0, used: 0, healthSum: 0, healthCount: 0 };
    let mainnetStats = { cap: 0, used: 0, healthSum: 0, healthCount: 0 };
    let devnetStats = { cap: 0, used: 0, healthSum: 0, healthCount: 0 };

    for (const n of nodes) {
      // Dedup Logic
      const dedupKey = `${n.pubkey}|${n.address}|${n.is_public}|${n.storage_committed}|${n.storage_used}|${n.version}|${n.credits}`;
      if (seenFingerprints.has(dedupKey)) continue;
      seenFingerprints.add(dedupKey);

      // Normalize Data
      const net = n.network || 'MAINNET';
      const cap = Number(n.storage_committed || 0);
      const used = Number(n.storage_used || 0);
      const health = Number(n.health || 0);

      // Push to Buckets
      globalNodes.push(n);
      if (net === 'MAINNET') mainnetNodes.push(n);
      if (net === 'DEVNET') devnetNodes.push(n);

      // Update Sums (Global)
      globalStats.cap += cap;
      globalStats.used += used;
      if (health > 0) { globalStats.healthSum += health; globalStats.healthCount++; }

      // Update Sums (Network Specific)
      if (net === 'MAINNET') {
        mainnetStats.cap += cap;
        mainnetStats.used += used;
        if (health > 0) { mainnetStats.healthSum += health; mainnetStats.healthCount++; }
      } else if (net === 'DEVNET') {
        devnetStats.cap += cap;
        devnetStats.used += used;
        if (health > 0) { devnetStats.healthSum += health; devnetStats.healthCount++; }
      }

      // Prepare Node Row
      const ipOnly = n.address ? n.address.split(':')[0] : '0.0.0.0';
      const stableId = `${n.pubkey}-${ipOnly}-${net}`;

      uniqueNodeRows.push({
        node_id: stableId,
        pubkey: n.pubkey,
        network: net,
        health: health,
        credits: n.credits || 0,
        storage_committed: cap,
        storage_used: used,
        uptime: n.uptime || 0,
        rank: n.rank || 0,
        version: n.version, // Ensure version is saved
        created_at: new Date().toISOString() 
      });
    }

    // --- 2. CALCULATE METRICS ---
    const calcAvg = (sum: number, count: number) => count > 0 ? sum / count : 0;

    // Consensus
    const globalConsensus = getConsensusMetrics(globalNodes);
    const mainnetConsensus = getConsensusMetrics(mainnetNodes);
    const devnetConsensus = getConsensusMetrics(devnetNodes);

    // Financials
    const totalCredits = uniqueNodeRows.reduce((acc, n) => acc + (n.credits || 0), 0);
    const avgCredits = uniqueNodeRows.length > 0 ? totalCredits / uniqueNodeRows.length : 0;
    const sortedByCredits = [...uniqueNodeRows].sort((a, b) => b.credits - a.credits);
    const top10Sum = sortedByCredits.slice(0, 10).reduce((acc, n) => acc + n.credits, 0);
    const dominance = totalCredits > 0 ? (top10Sum / totalCredits) * 100 : 0;

    // --- 3. INSERT SNAPSHOT ---
    const { error: netError } = await supabase.from('network_snapshots').insert({
      // Global
      total_nodes: globalNodes.length,
      total_capacity: globalStats.cap,
      total_used: globalStats.used,
      avg_health: Math.round(calcAvg(globalStats.healthSum, globalStats.healthCount)),
      consensus_score: globalConsensus.score,    // <--- FIXED: No longer 0
      consensus_version: globalConsensus.version,

      // Mainnet
      mainnet_nodes: mainnetNodes.length,
      mainnet_capacity: mainnetStats.cap,
      mainnet_used: mainnetStats.used,
      mainnet_avg_health: Math.round(calcAvg(mainnetStats.healthSum, mainnetStats.healthCount)),
      mainnet_consensus_score: mainnetConsensus.score, // <--- NEW

      // Devnet
      devnet_nodes: devnetNodes.length,
      devnet_capacity: devnetStats.cap,
      devnet_used: devnetStats.used,
      devnet_avg_health: Math.round(calcAvg(devnetStats.healthSum, devnetStats.healthCount)),
      devnet_consensus_score: devnetConsensus.score,   // <--- NEW

      // Financials
      total_credits: totalCredits,
      avg_credits: avgCredits,
      top10_dominance: parseFloat(dominance.toFixed(2))
    });

    if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
    else console.log(`✅ Saved Snapshot. Global Consensus: ${globalConsensus.score}% (${globalConsensus.version})`);

    // Save Nodes
    const { error: nodeError } = await supabase.from('node_snapshots').insert(uniqueNodeRows);
    if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);

    process.exit(0);
  } catch (error: any) {
    console.error("🔥 FATAL ERROR:", error.message);
    process.exit(1);
  }
}

runMonitor();
