'use server'

import { createClient } from '@supabase/supabase-js';

// --- 1. SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isTest = process.env.NODE_ENV === 'test';

if (!isTest && (!supabaseUrl || !supabaseKey)) {
  throw new Error("SERVER ERROR: Supabase keys are missing.");
}

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : { from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }), gte: () => Promise.resolve({ data: [], error: null }) }) }) }) }) }) } as any;

// --- 2. CUSTOM IN-MEMORY CACHE ---
type CacheEntry = {
  timestamp: number;
  data: any; 
};

const globalCache = new Map<string, CacheEntry>();

// UPDATE: Lowered from 30 mins to 5 mins
// This prevents "Stale Data" when you are actively monitoring the network.
const CACHE_DURATION_MS = 5 * 60 * 1000; 
const GENESIS_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; 

async function fetchWithCache(
  key: string, 
  fetcher: () => Promise<any>,
  customDuration?: number
) {
  const now = Date.now();
  const cached = globalCache.get(key);
  const duration = customDuration || CACHE_DURATION_MS;

  if (cached && (now - cached.timestamp < duration)) {
    return cached.data;
  }

  try {
    const data = await fetcher();
    globalCache.set(key, { timestamp: now, data: data });
    return data;
  } catch (error: any) {
    console.error(`Cache Refresh Failed for ${key}:`, error.message);
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

const fetchForensicSnapshots = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // We explicitly select the fields we need to keep the payload light
  const { data, error } = await supabase
    .from('node_snapshots')
    .select('node_id, uptime, credits, created_at') 
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchNodeGenesis = async (stableId: string) => {
  const { data, error } = await supabase
    .from('node_snapshots')
    .select('created_at')
    .eq('node_id', stableId)
    .order('created_at', { ascending: true })
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

export async function getForensicHistoryAction(days: number) {
  const cacheKey = `forensic-history-${days}d`;
  return await fetchWithCache(cacheKey, async () => {
    return await fetchForensicSnapshots(days);
  });
}

export async function getNodeGenesisAction(stableId: string) {
  const cacheKey = `node-genesis-${stableId}`;
  return await fetchWithCache(
    cacheKey, 
    async () => { return await fetchNodeGenesis(stableId); },
    GENESIS_CACHE_DURATION_MS
  );
}
