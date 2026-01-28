'use server'

import { createClient } from '@supabase/supabase-js';

// --- 1. SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SERVER ERROR: Supabase keys are missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. CUSTOM IN-MEMORY CACHE ---
// A robust RAM-based cache that avoids Next.js file-system errors.

type CacheEntry = {
  timestamp: number;
  data: any; // Updated from any[] to any to support single objects (Genesis)
};

const globalCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 Minutes
const GENESIS_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours (Genesis doesn't change)

async function fetchWithCache(
  key: string, 
  fetcher: () => Promise<any>,
  customDuration?: number
) {
  const now = Date.now();
  const cached = globalCache.get(key);
  const duration = customDuration || CACHE_DURATION_MS;

  // A. Cache Hit
  if (cached && (now - cached.timestamp < duration)) {
    return cached.data;
  }

  // B. Cache Miss
  try {
    const data = await fetcher();

    globalCache.set(key, {
      timestamp: now,
      data: data
    });

    return data;
  } catch (error: any) {
    console.error(`Cache Refresh Failed for ${key}:`, error.message);
    // Fallback: Return stale data if available, otherwise throw
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

// NEW: Optimized Bulk Fetch for Vitality Forensics (Lightweight)
const fetchForensicSnapshots = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('node_snapshots')
    .select('node_id, uptime, credits, created_at') 
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

// NEW: Finds the absolute first time we saw this node (Genesis)
const fetchNodeGenesis = async (stableId: string) => {
  const { data, error } = await supabase
    .from('node_snapshots')
    .select('created_at')
    .eq('node_id', stableId)
    .order('created_at', { ascending: true }) // Oldest first
    .limit(1)
    .single();

  if (error) return null;
  return data;
};

// --- 4. EXPORTED ACTIONS ---

export async function getNetworkHistoryAction(days: number) {
  const cacheKey = `network-history-${days}d`;
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

// Used by historyAggregator.ts
export async function getForensicHistoryAction(days: number) {
  const cacheKey = `forensic-history-${days}d`;
  return await fetchWithCache(cacheKey, async () => {
    return await fetchForensicSnapshots(days);
  });
}

// Used by IdentityView for "Tracking Since"
export async function getNodeGenesisAction(stableId: string) {
  const cacheKey = `node-genesis-${stableId}`;
  return await fetchWithCache(
    cacheKey, 
    async () => { return await fetchNodeGenesis(stableId); },
    GENESIS_CACHE_DURATION_MS // Cache for 24h
  );
}
