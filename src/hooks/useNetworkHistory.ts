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
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      
      // 1. Determine Timeframe
      let days = 7;
      let timeGrain = 'hour';
      let rpcMode = false;

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

      // 2. Fetch Data (Try RPC first, then Raw Table)
      if (rpcMode) {
        const response = await supabase.rpc('get_network_history_bucketed', {
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });
        data = response.data;
        error = response.error;
      } else {
        // Fallback: Fetch raw rows if short timeframe
        const response = await supabase
          .from('network_snapshots')
          .select('*') // Select all columns to be safe
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      // 3. ROBUST MAPPING (The Fix)
      // We map whatever columns exist in DB to our standard interface
      if (data && data.length > 0) {
        const points = data.map((d: any) => ({
          // Handle 'bucket' (RPC) vs 'created_at' (Raw) vs 'id' (Legacy)
          date: d.bucket || d.created_at || d.id, 
          
          // Ensure numbers, handle potential nulls
          avg_health: Number(d.avg_health || 0),
          total_nodes: Number(d.total_nodes || 0),
          consensus_score: Number(d.consensus_score || 0),

          // HANDLE COLUMN MISMATCH: Check 'total_capacity' OR 'storage_committed'
          total_capacity: Number(d.total_capacity ?? d.storage_committed ?? 0),
          
          // HANDLE COLUMN MISMATCH: Check 'total_used' OR 'storage_used'
          total_used: Number(d.total_used ?? d.storage_used ?? 0)
        }));

        setHistory(points);

        // 4. Calculate Growth (based on Capacity)
        if (points.length > 1) {
            const first = points[0].total_capacity;
            const last = points[points.length - 1].total_capacity;
            if (first > 0) {
                setGrowth(((last - first) / first) * 100);
            }
        }
      } else {
        setHistory([]);
      }
      
      setLoading(false);
    }

    fetchHistory();
  }, [timeRange]);

  return { history, loading, growth };
};
