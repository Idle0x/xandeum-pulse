'use server'

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// --- INIT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 1. INTERNAL FETCHERS (Run ONLY on Cache Miss) ---

const fetchRawNetworkHistory = async (days: number) => {
  const start = Date.now();
  console.log(`\x1b[33m[CACHE MISS] NetworkHistory(${days}d): Hitting Supabase...\x1b[0m`);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) {
    console.error(`\x1b[31m[DB ERROR] NetworkHistory:\x1b[0m`, error.message);
    throw new Error(error.message);
  }

  const duration = Date.now() - start;
  console.log(`\x1b[32m[DB SUCCESS] Fetched ${data?.length} records in ${duration}ms\x1b[0m`);
  return data || [];
};

const fetchRawNodeHistory = async (stableId: string, network: string, days: number) => {
  const start = Date.now();
  console.log(`\x1b[33m[CACHE MISS] NodeHistory(${stableId}): Hitting Supabase...\x1b[0m`);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('node_snapshots')
    .select('*') 
    .eq('node_id', stableId)
    .eq('network', network)
    .gte('created_at', startDate.toISOString()) 
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`\x1b[31m[DB ERROR] NodeHistory:\x1b[0m`, error.message);
    throw new Error(error.message);
  }

  const duration = Date.now() - start;
  console.log(`\x1b[32m[DB SUCCESS] Fetched ${data?.length} records in ${duration}ms\x1b[0m`);
  return data || [];
};

// --- 2. CACHED WRAPPERS ---

const getCachedNetworkHistoryInternal = unstable_cache(
  async (days: number) => fetchRawNetworkHistory(days),
  ['network-history-debug-v1'], // Unique key for this debug session
  { revalidate: 1800 } 
);

const getCachedNodeHistoryInternal = unstable_cache(
  async (stableId: string, network: string, days: number) => fetchRawNodeHistory(stableId, network, days),
  ['node-history-debug-v1'],    // Unique key for this debug session
  { revalidate: 1800 } 
);

// --- 3. EXPORTED ACTIONS (With Result Tracing) ---

export async function getNetworkHistoryAction(days: number) {
  console.log(`\x1b[36m[ACTION START] getNetworkHistoryAction(${days}d)\x1b[0m`);
  
  try {
    const data = await getCachedNetworkHistoryInternal(days);
    
    // Log what we are sending back to the UI
    if (!data || data.length === 0) {
      console.warn(`\x1b[31m[CACHE WARNING] Action returning EMPTY ARRAY for ${days}d\x1b[0m`);
    } else {
      console.log(`\x1b[36m[ACTION END] Returning ${data.length} cached records\x1b[0m`);
    }
    
    return data;
  } catch (err: any) {
    console.error(`\x1b[31m[CACHE FATAL] Error inside unstable_cache:\x1b[0m`, err);
    return [];
  }
}

export async function getNodeHistoryAction(stableId: string, network: string, days: number) {
  // Composite key logging to verify inputs
  const cacheKey = `${stableId}-${network}-${days}`;
  console.log(`\x1b[36m[ACTION START] getNodeHistoryAction(${cacheKey})\x1b[0m`);

  try {
    const data = await getCachedNodeHistoryInternal(stableId, network, days);

    if (!data || data.length === 0) {
      console.warn(`\x1b[31m[CACHE WARNING] Action returning EMPTY ARRAY for ${stableId}\x1b[0m`);
    } else {
      console.log(`\x1b[36m[ACTION END] Returning ${data.length} cached records\x1b[0m`);
    }

    return data;
  } catch (err: any) {
    console.error(`\x1b[31m[CACHE FATAL] Error inside unstable_cache:\x1b[0m`, err);
    return [];
  }
}
