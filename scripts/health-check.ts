import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase';

// --- CONFIGURATION ---
const PULSE_API_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stats` 
  : 'https://xandeum-pulse.vercel.app/api/stats';

const CREDITS_API_MAINNET = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const CREDITS_API_DEVNET  = 'https://podcredits.xandeum.network/api/pods-credits';

// --- TYPES ---
interface RpcNode {
  pubkey: string;
  network?: string;
  address?: string;
  health?: number;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  credits?: number;
}

interface CreditNode {
  pod_id?: string;
  pubkey?: string; 
  id?: string;     
  credits: number;
}

// --- HELPERS ---

/**
 * Filters rows to ensure one entry per pubkey for financial accuracy.
 */
function getUniqueFinancialRows(nodeRows: any[]) {
  const seen = new Set<string>();
  return nodeRows.filter(n => {
    if (!n.pubkey || seen.has(n.pubkey)) return false;
    seen.add(n.pubkey);
    return true;
  });
}

function getConsensusMetrics(nodeList: any[]) {
  if (!nodeList || nodeList.length === 0) return { version: '0.0.0', score: 0 };
  const activeNodes = nodeList.filter(n => (n.uptime || 0) > 0);
  if (activeNodes.length === 0) return { version: '0.0.0', score: 0 };

  const versionCounts: Record<string, number> = {};
  for (const n of activeNodes) {
    const v = n.version || 'Unknown';
    versionCounts[v] = (versionCounts[v] || 0) + 1;
  }

  let topVersion = 'Unknown';
  let topCount = 0;
  for (const [ver, count] of Object.entries(versionCounts)) {
    if (count > topCount) {
      topCount = count;
      topVersion = ver;
    }
  }

  const score = (topCount / activeNodes.length) * 100;
  return { version: topVersion, score: parseFloat(score.toFixed(2)) };
}

function getFinancialMetrics(nodeRows: any[]) {
  // DEDUPLICATION: Ensure we only count credits once per unique pubkey
  const uniqueRows = getUniqueFinancialRows(nodeRows);
  
  if (uniqueRows.length === 0) return { total: 0, avg: 0, dominance: 0, count: 0 };

  const total = uniqueRows.reduce((acc, n) => acc + (n.credits || 0), 0);
  const avg = total / uniqueRows.length;

  const sorted = [...uniqueRows].sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const top10Sum = sorted.slice(0, 10).reduce((acc, n) => acc + (n.credits || 0), 0);
  const dominance = total > 0 ? (top10Sum / total) * 100 : 0;

  return { 
    total, 
    avg, 
    dominance: parseFloat(dominance.toFixed(2)),
    count: uniqueRows.length // This is the "Actual Leaderboard Nodes"
  };
}

const getSafeKey = (c: CreditNode) => c.pod_id || c.pubkey || c.id || 'unknown';

async function runMonitor() {
  console.log("xx 🏥 Starting Pulse Monitor (Hybrid Physical/Financial Mode)...");

  try {
    const [pulseRes, mainnetCreditsRes, devnetCreditsRes] = await Promise.allSettled([
      axios.get(PULSE_API_URL, { timeout: 30000 }),
      axios.get(CREDITS_API_MAINNET, { timeout: 10000 }),
      axios.get(CREDITS_API_DEVNET, { timeout: 10000 })
    ]);

    const rpcNodes: RpcNode[] = pulseRes.status === 'fulfilled' 
      ? (pulseRes.value.data.result?.pods || pulseRes.value.data || [])
      : [];

    const parseCredits = (res: PromiseSettledResult<any>) => {
      if (res.status === 'fulfilled' && res.value.data) {
        return (res.value.data.pods_credits || res.value.data || []) as CreditNode[];
      }
      return [];
    };

    const rawMainnetCredits = parseCredits(mainnetCreditsRes);
    const rawDevnetCredits = parseCredits(devnetCreditsRes);

    const mainnetCreditMap = new Map<string, number>();
    rawMainnetCredits.forEach(c => {
        const key = getSafeKey(c);
        if (key !== 'unknown') mainnetCreditMap.set(key, c.credits);
    });

    const devnetCreditMap = new Map<string, number>();
    rawDevnetCredits.forEach(c => {
        const key = getSafeKey(c);
        if (key !== 'unknown') devnetCreditMap.set(key, c.credits);
    });

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn("⚠️ No DB Key. Exiting.");
      process.exit(0);
    }

    const uniqueNodeRows: any[] = [];
    const finalAllNodes: any[] = [];
    const finalMainnet: any[] = [];
    const finalDevnet: any[] = [];

    // --- PHASE A: PROCESS PUBLIC NODES (RPC) ---
    for (const rpcNode of rpcNodes) {
      const pubkey = rpcNode.pubkey;
      const net = rpcNode.network || 'MAINNET';

      let creditVal = 0;
      if (net === 'MAINNET') {
        creditVal = mainnetCreditMap.get(pubkey) || 0;
        // Don't delete yet, as multiple physical nodes share this key
      } else {
        creditVal = devnetCreditMap.get(pubkey) || 0;
      }

      const finalCredits = creditVal > 0 ? creditVal : (rpcNode.credits || 0);
      const processedNode = { ...rpcNode, credits: finalCredits, is_ghost: false };
      
      finalAllNodes.push(processedNode);
      if (net === 'MAINNET') finalMainnet.push(processedNode);
      else finalDevnet.push(processedNode);

      let ipOnly = rpcNode.address && rpcNode.address !== 'null' ? rpcNode.address.split(':')[0] : 'private';
      const stableId = `${pubkey}-${ipOnly}-${net}`; 

      uniqueNodeRows.push({
        node_id: stableId,
        pubkey: pubkey,
        network: net,
        health: Number(rpcNode.health || 0),
        credits: finalCredits,
        storage_committed: Number(rpcNode.storage_committed || 0),
        storage_used: Number(rpcNode.storage_used || 0),
        uptime: Number(rpcNode.uptime || 0),
        rank: 0,
        version: rpcNode.version || '0.0.0',
        created_at: new Date().toISOString()
      });
    }

    // --- PHASE B: PROCESS GHOST NODES (Remaining in Maps) ---
    // Filter out keys already seen in RPC nodes to get true ghosts
    const rpcPubkeys = new Set(rpcNodes.map(n => n.pubkey));

    const processGhosts = (map: Map<string, number>, network: string) => {
      for (const [pubkey, credits] of map.entries()) {
        if (rpcPubkeys.has(pubkey)) continue; // Not a ghost, just a shared key
        
        const ghostNode = { pubkey, network, address: 'private', health: 0, uptime: 0, credits, is_ghost: true };
        finalAllNodes.push(ghostNode);
        if (network === 'MAINNET') finalMainnet.push(ghostNode);
        else finalDevnet.push(ghostNode);

        uniqueNodeRows.push({
          node_id: `${pubkey}-private-${network}`,
          pubkey, network, health: 0, credits, storage_committed: 0, storage_used: 0, uptime: 0, rank: 0, version: '0.0.0',
          created_at: new Date().toISOString()
        });
      }
    };

    processGhosts(mainnetCreditMap, 'MAINNET');
    processGhosts(devnetCreditMap, 'DEVNET');

    // --- 4. AGGREGATES ---
    const calcStats = (nodes: any[]) => {
      let cap = 0, used = 0, healthSum = 0, healthCount = 0, stabSum = 0, stabCount = 0;
      for (const n of nodes) {
        cap += Number(n.storage_committed || 0);
        used += Number(n.storage_used || 0);
        if (!n.is_ghost && (n.health || 0) > 0) {
          healthSum += Number(n.health);
          healthCount++;
          stabSum += Number(n.uptime);
          stabCount++;
        }
      }
      return {
        cap, used,
        avgHealth: healthCount > 0 ? Math.round(healthSum / healthCount) : 0,
        avgStab: stabCount > 0 ? parseFloat((stabSum / stabCount).toFixed(2)) : 0
      };
    };

    const globalStats = calcStats(finalAllNodes);
    const mainnetStats = calcStats(finalMainnet);
    const devnetStats = calcStats(finalDevnet);

    const globalConsensus = getConsensusMetrics(finalAllNodes);
    const mainnetConsensus = getConsensusMetrics(finalMainnet);
    const devnetConsensus = getConsensusMetrics(finalDevnet);

    // FINANCIALS (Deduplicated)
    const globalFin = getFinancialMetrics(uniqueNodeRows);
    const mainnetFin = getFinancialMetrics(uniqueNodeRows.filter(n => n.network === 'MAINNET'));
    const devnetFin = getFinancialMetrics(uniqueNodeRows.filter(n => n.network === 'DEVNET'));

    // --- 5. INSERT ---
    const { error: netError } = await supabase.from('network_snapshots').insert({
      // Dashboard (Physical)
      total_nodes: finalAllNodes.length,
      total_capacity: globalStats.cap,
      total_used: globalStats.used,
      avg_health: globalStats.avgHealth,
      avg_stability: globalStats.avgStab,
      consensus_score: globalConsensus.score,    
      consensus_version: globalConsensus.version,

      // Leaderboard (Unique)
      total_unique_providers: globalFin.count,
      total_credits: globalFin.total,
      avg_credits: globalFin.avg,
      top10_dominance: globalFin.dominance,

      // Mainnet
      mainnet_nodes: finalMainnet.length,
      mainnet_unique_providers: mainnetFin.count,
      mainnet_capacity: mainnetStats.cap,
      mainnet_used: mainnetStats.used,
      mainnet_avg_health: mainnetStats.avgHealth,
      mainnet_avg_stability: mainnetStats.avgStab,
      mainnet_consensus_score: mainnetConsensus.score, 
      mainnet_credits: mainnetFin.total,
      mainnet_avg_credits: mainnetFin.avg,
      mainnet_dominance: mainnetFin.dominance,

      // Devnet
      devnet_nodes: finalDevnet.length,
      devnet_unique_providers: devnetFin.count,
      devnet_capacity: devnetStats.cap,
      devnet_used: devnetStats.used,
      devnet_avg_health: devnetStats.avgHealth,
      devnet_avg_stability: devnetStats.avgStab,
      devnet_consensus_score: devnetConsensus.score,
      devnet_credits: devnetFin.total,
      devnet_avg_credits: devnetFin.avg,
      devnet_dominance: devnetFin.dominance
    });

    if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
    else console.log(`✅ Saved: Physical(${finalAllNodes.length}) vs Unique(${globalFin.count})`);

    const { error: nodeError } = await supabase.from('node_snapshots').insert(uniqueNodeRows);
    if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);

    process.exit(0);
  } catch (error: any) {
    console.error("🔥 FATAL ERROR:", error.message);
    process.exit(1);
  }
}

runMonitor();
