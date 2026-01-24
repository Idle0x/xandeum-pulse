'use server'

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// --- 1. ENVIRONMENT CHECK ---
// We check this immediately. If these are missing on the server, 
// the action will throw an error that the Debugger will catch.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SERVER ERROR: NEXT_PUBLIC_SUPABASE_URL or ANON_KEY is undefined on the server.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. RAW FETCHERS (Throw Errors on Failure) ---

const fetchRawNetworkHistory = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) throw new Error(`Supabase Network Error: ${error.message}`);
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

  if (error) throw new Error(`Supabase Node Error: ${error.message}`);
  return data || [];
};

// --- 3. CACHED WRAPPERS ---
// keys include 'v3' to force a fresh start and 'days' to prevent mixing timeframes

const getCachedNetworkHistoryInternal = unstable_cache(
  async (days: number) => fetchRawNetworkHistory(days),
  ['network-history-v3'], 
  { revalidate: 1800 } 
);

const getCachedNodeHistoryInternal = unstable_cache(
  async (stableId: string, network: string, days: number) => fetchRawNodeHistory(stableId, network, days),
  ['node-history-v3'],
  { revalidate: 1800 } 
);

// --- 4. EXPORTED ACTIONS (No Try/Catch) ---
// We intentionally let errors bubble up so the UI Debugger receives them.

export async function getNetworkHistoryAction(days: number) {
  return await getCachedNetworkHistoryInternal(days);
}

export async function getNodeHistoryAction(stableId: string, network: string, days: number) {
  return await getCachedNodeHistoryInternal(stableId, network, days);
}
