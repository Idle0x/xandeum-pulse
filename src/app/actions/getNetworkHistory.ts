'use server'

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Initialize a clean Supabase client for the server
// We use process.env directly here to ensure it works in the server context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Or Service Role if you prefer
const supabase = createClient(supabaseUrl, supabaseKey);

// The actual fetcher function (uncached)
const fetchRawNetworkHistory = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('network_snapshots')
    .select('*')
    .gte('id', startDate.toISOString())
    .order('id', { ascending: true });

  if (error) {
    console.error('Server Fetch Error:', error);
    throw new Error(error.message);
  }

  return data;
};

// The Cached Version
// revalidate: 1800 seconds = 30 minutes
export const getCachedNetworkHistory = async (days: number) => {
  const getCachedData = unstable_cache(
    async () => fetchRawNetworkHistory(days),
    [`network-history-${days}`], // Unique cache key per duration
    { revalidate: 1800 } 
  );

  return await getCachedData();
};
