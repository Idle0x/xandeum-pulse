'use server'

import { createClient } from '@supabase/supabase-js';

// --- 1. SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SERVER ERROR: Supabase keys are missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. CUSTOM IN-MEMORY CACHE (The Fix) ---
// This replaces unstable_cache. It lives in the server's RAM.
// It is 100% stable and cannot throw "incrementalCache missing".

type CacheEntry = {
  timestamp: number;
  data: any[];
};

// The global storage container
const globalCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 Minutes

// Helper to check/set cache
async function fetchWithCache(
  key: string, 
  fetcher: () => Promise<any[]>
) {
  const now = Date.now();
  const cached = globalCache.get(key);

  // A. Cache Hit
  if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
    console.log(`\x1b[32m[CACHE HIT] Serving ${key} from RAM (${cached.data.length} items)\x1b[0m`);
    return cached.data;
  }

  // B. Cache Miss (Fetch Fresh)
  console.log(`\x1b[33m[CACHE MISS] Fetching ${key} from Supabase...\x1b[0m`);
  
  try {
    const data = await fetcher();
    
    // Save to cache
    globalCache.set(key, {
      timestamp: now,
      data: data
    });
    
    return data;
  } catch (error: any) {
    console.error(`\x1b[31m[FETCH ERROR] Could not refresh ${key}:\x1b[0m`, error.message);
    // If fetch fails, try to return stale cache if we have it, otherwise throw
    if (cached) return cached.data;
    throw error;
  }
}

// --- 3. FETCHERS ---

const fetchRawNetworkHistory = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchRawNodeHistory = async (stableId: string, network: string, days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('node_snapshots')
    .select('*') 
    .eq('node_id', stableId)
    .eq('network', network)
    .gte('created_at', startDate.toISOString()) 
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

// --- 4. EXPORTED ACTIONS ---

export async function getNetworkHistoryAction(days: number) {
  const cacheKey = `network-history-${days}d`;
  
  // Use our custom wrapper instead of unstable_cache
  return await fetchWithCache(cacheKey, async () => {
    return await fetchRawNetworkHistory(days);
  });
}

export async function getNodeHistoryAction(stableId: string, network: string, days: number) {
  const cacheKey = `node-history-${stableId}-${network}-${days}d`;

  return await fetchWithCache(cacheKey, async () => {
    return await fetchRawNodeHistory(stableId, network, days);
  });
}
m