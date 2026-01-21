import axios from 'axios';
import { getServiceSupabase } from '../src/lib/supabase'; // Import our new helper

// --- TYPES (Matching your project types) ---
interface Node {
  pubkey: string;
  network: 'MAINNET' | 'DEVNET';
  health?: number;
  credits?: number;
  storage_committed?: number;
  storage_used?: number;
  uptime?: number;
  rank?: number;
}

// --- CONSTANTS ---
// We use the production URL for the API to ensure we are snapshotting the live state
// If you want to test locally, you can change this to http://localhost:3000/api/stats temporarily
const API_URL = 'https://xandeum-pulse.vercel.app/api/stats'; 
const TIMEOUT = 10000;

async function runHealthCheck() {
  console.log('🏥 Starting Pulse Health Check & Snapshot...');
  
  try {
    // 1. Fetch Real-Time Data (Simulating what the frontend does)
    const { data } = await axios.get(API_URL, { timeout: TIMEOUT });
    
    if (!data || !data.nodes) {
      throw new Error('Invalid API response: Missing nodes data');
    }

    const nodes: Node[] = data.nodes;
    const totalNodes = nodes.length;
    
    // 2. Validate Critical Metrics (Your existing health checks)
    const totalCapacity = nodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const totalUsed = nodes.reduce((acc, n) => acc + (n.storage_used || 0), 0);
    const avgHealth = nodes.reduce((acc, n) => acc + (n.health || 0), 0) / (totalNodes || 1);
    
    // Consensus calc placeholder
    const consensusScore = 0; 

    console.log(`✅ Fetched ${totalNodes} nodes.`);
    console.log(`📊 Network Capacity: ${(totalCapacity / 1e12).toFixed(2)} TB`);

    // --- 3. THE SHADOW LAYER INGESTION ---
    console.log('💾 Taking Database Snapshot...');
    
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      // This might happen during "next build" if the key isn't present, 
      // but strictly speaking we only need this when the script RUNS, not builds.
      console.log('⚠️ Skipping DB Snapshot: No Service Role Key found (Check Vercel Env Vars).');
    } else {
      // A. Insert Network Snapshot
      const { error: netError } = await supabase
        .from('network_snapshots')
        .insert({
          total_capacity: totalCapacity,
          total_used: totalUsed,
          total_nodes: totalNodes,
          avg_health: avgHealth,
          consensus_score: consensusScore 
        });

      if (netError) console.error('❌ Network Snapshot Failed:', netError.message);
      else console.log('✅ Network Snapshot Saved.');

      // B. Insert Node Snapshots (Batch Insert)
      const nodeRows = nodes.map(n => ({
        pubkey: n.pubkey,
        network: n.network || 'MAINNET',
        health: n.health || 0,
        credits: n.credits || 0,
        storage_committed: n.storage_committed || 0,
        storage_used: n.storage_used || 0,
        uptime: n.uptime || 0,
        rank: n.rank || 0
      }));

      // Basic batch insert
      const { error: nodeError } = await supabase
        .from('node_snapshots')
        .insert(nodeRows);

      if (nodeError) console.error('❌ Node Snapshots Failed:', nodeError.message);
      else console.log(`✅ Saved ${nodeRows.length} Node Snapshots.`);
    }

    // 4. Success Exit
    process.exit(0);

  } catch (error: any) {
    console.error('🚨 Health Check Failed:', error.message);
    // If it fails, we want GitHub Actions/Vercel Cron to know
    process.exit(1);
  }
}

runHealthCheck();
