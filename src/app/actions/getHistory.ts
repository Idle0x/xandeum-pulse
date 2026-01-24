'use server'

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Safety check to ensure env vars are loaded on the server
if (!supabaseUrl || !supabaseKey) {
  console.error('SERVER ERROR: Supabase keys are missing in the server environment.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- INTERNAL HELPERS (Not Exported) ---

const fetchRawNetworkHistory = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase Network Error:', error);
    throw new Error(error.message);
  }
  return data;
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

  if (error) {
    console.error('Supabase Node Error:', error);
    throw new Error(error.message);
  }
  return data;
};

// --- INTERNAL CACHED FUNCTIONS ---

const getCachedNetworkHistoryInternal = unstable_cache(
  async (days: number) => fetchRawNetworkHistory(days),
  ['network-history-v1'], // Cache Key
  { revalidate: 1800 }     // 30 Minutes
);

const getCachedNodeHistoryInternal = unstable_cache(
  async (stableId: string, network: string, days: number) => fetchRawNodeHistory(stableId, network, days),
  ['node-history-v1'],    // Cache Key
  { revalidate: 1800 }    // 30 Minutes
);

// --- EXPORTED SERVER ACTIONS ---
// These are the actual functions your client components will call.

export async function getNetworkHistoryAction(days: number) {
  try {
    const data = await getCachedNetworkHistoryInternal(days);
    return data; // success
  } catch (error) {
    console.error('Server Action Error (Network):', error);
    return []; // Return empty array on failure to prevent crash
  }
}

export async function getNodeHistoryAction(stableId: string, network: string, days: number) {
  try {
    const data = await getCachedNodeHistoryInternal(stableId, network, days);
    return data; // success
  } catch (error) {
    console.error('Server Action Error (Node):', error);
    return []; // Return empty array on failure
  }
}
