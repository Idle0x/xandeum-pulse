'use server'

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 1. NETWORK HISTORY CACHER ---
const fetchRawNetworkHistory = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const getCachedNetworkHistory = async (days: number) => {
  const getData = unstable_cache(
    async () => fetchRawNetworkHistory(days),
    [`network-history-${days}`], 
    { revalidate: 1800 } // 30 Minutes
  );
  return await getData();
};

// --- 2. NODE HISTORY CACHER ---
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
  return data;
};

export const getCachedNodeHistory = async (stableId: string, network: string, days: number) => {
  // Composite cache key to ensure uniqueness per node
  const cacheKey = `node-history-${stableId}-${network}-${days}`;
  
  const getData = unstable_cache(
    async () => fetchRawNodeHistory(stableId, network, days),
    [cacheKey], 
    { revalidate: 1800 } // 30 Minutes
  );
  return await getData();
};
