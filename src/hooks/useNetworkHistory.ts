import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export interface NetworkHistoryPoint {
  date: string;
  avg_health: number;
  total_nodes: number;
  total_capacity: number;
  total_used: number;
  consensus_score: number;
  total_credits: number;
  avg_credits: number;
  top10_dominance: number;
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      let days = 7;
      let timeGrain = 'hour';
      let rpcMode = false;

      // 1. Determine Time Range
      switch (timeRange) {
        case '24H': days = 1; break;
        case '3D': days = 3; break;
        case '7D': days = 7; break;
        case '30D': days = 30; rpcMode = true; timeGrain = 'day'; break;
        case 'ALL': days = 365; rpcMode = true; timeGrain = 'day'; break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let data: any[] | null = null;
      let error = null;

      // 2. Fetch Data
      if (rpcMode) {
        // RPC Path (only for long ranges)
        const response = await supabase.rpc('get_network_history_bucketed', {
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });
        data = response.data;
        error = response.error;
      } else {
        // TABLE Path (Standard)
        // FIX: We use 'created_at' instead of 'id'. 
        // This fixes the crash where 'id' is a number but we treated it as a date.
        const response = await supabase
          .from('network_snapshots')
          .select('*')
          .gte('created_at', startDate.toISOString()) // <--- CHANGED FROM 'id'
          .order('created_at', { ascending: true });  // <--- CHANGED FROM 'id'

        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      // 3. Map Data
      if (data && data.length > 0) {
        const points = data.map((d: any) => ({
          // FIX: Prefer created_at or bucket. Only use id if it's strictly a string backup.
          date: d.bucket || d.created_at || new Date().toISOString(),

          avg_health: Number(d.avg_health || 0),
          total_nodes: Number(d.total_nodes || 0),
          
          // Fallback for Capacity (handles both old and new schema names if they differ)
          total_capacity: Number(d.total_capacity ?? d.storage_committed ?? 0),
          total_used: Number(d.total_used ?? d.storage_used ?? 0),
          consensus_score: Number(d.consensus_score || 0),

          // Leaderboard / Credits Metrics
          // Ensure your DB column is named 'total_credits' (from the script I gave you)
          total_credits: Number(d.total_credits || 0),
          avg_credits: Number(d.avg_credits || 0),
          top10_dominance: Number(d.top10_dominance || 0)
        }));

        setHistory(points);

        // 4. Calculate Growth (Based on Credits)
        if (points.length > 1) {
            const first = points[0].total_credits;
            const last = points[points.length - 1].total_credits;
            if (first > 0) {
                setGrowth(((last - first) / first) * 100);
            } else {
                setGrowth(last > 0 ? 100 : 0);
            }
        }
      } else {
        setHistory([]);
        setGrowth(0);
      }

      setLoading(false);
    }

    fetchHistory();
  }, [timeRange]);

  return { history, loading, growth };
};
