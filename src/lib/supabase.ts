import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1. The Public Client (Used in your UI Components)
// Uses the ANON key. Can only READ data based on RLS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. The Admin Client (Used ONLY in scripts/health-check.ts)
// We export a function to create it so it's not initialized in the browser bundle
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Database writes will fail.");
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
