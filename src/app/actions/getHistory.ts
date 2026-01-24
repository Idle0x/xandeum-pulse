'use server'

import { createClient } from '@supabase/supabase-js';

// --- 1. SETUP & DEBUGGING ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if keys exist on the server
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ FATAL: Supabase Environment Variables are missing on the server!");
} else {
  console.log("✅ Server: Supabase Variables loaded successfully.");
}

// Create client directly (No unstable_cache for this test)
const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- 2. DIRECT FETCHERS (No Cache) ---

export async function getNetworkHistoryAction(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const { data, error } = await supabase
      .from('network_snapshots')
      .select('*')
      .gte('id', startDate.toISOString())
      .order('id', { ascending: true });

    if (error) {
      console.error("Server Network Fetch Error:", error);
      throw new Error(error.message);
    }
    return data || [];
  } catch (err) {
    console.error("Server Network Exception:", err);
    return [];
  }
}

export async function getNodeHistoryAction(stableId: string, network: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log(`Server Fetching Node: ${stableId} (Days: ${days})`);

  try {
    const { data, error } = await supabase
      .from('node_snapshots')
      .select('*') 
      .eq('node_id', stableId)
      .eq('network', network)
      .gte('created_at', startDate.toISOString()) 
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Server Node Fetch Error:", error.message);
      // We return the error so the UI might see it (optional, but good for debugging)
      return []; 
    }

    console.log(`Server Found: ${data?.length} rows`);
    return data || [];
  } catch (err) {
    console.error("Server Node Exception:", err);
    return [];
  }
}
