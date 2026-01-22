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
  // NEW METRICS
  total_credits: number;
  avg_credits: number;
  top10_dominance: number;
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Return separate growth stats so Capacity Modal and Leaderboard can both use this hook
  const [capacityGrowth, setCapacityGrowth] = useState(0); 
  const [creditGrowth, setCreditGrowth] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

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

      if (rpcMode) {
        const response = await supabase.rpc('get_network_history_bucketed', {
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });
        data = response.data;
        error = response.error;
      } else {
        // Fallback: Raw Query
        // We use 'id' as timestamp based on previous debugging
        const response = await supabase
          .from('network_snapshots')
          .select('*')
          .gte('id', startDate.toISOString()) 
          .order('id', { ascending: true });

        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const points = data.map((d: any) => ({
          date: d.bucket || d.id || d.created_at,
          avg_health: Number(d.avg_health || 0),
          total_nodes: Number(d.total_nodes || 0),
          total_capacity: Number(d.total_capacity ?? d.storage_committed ?? 0),
          total_used: Number(d.total_used ?? d.storage_used ?? 0),
          consensus_score: Number(d.consensus_score || 0),
          total_credits: Number(d.total_credits || 0),
          avg_credits: Number(d.avg_credits || 0),
          top10_dominance: Number(d.top10_dominance || 0)
        }));

        setHistory(points);

        // CALCULATE GROWTH FOR BOTH METRICS
        if (points.length > 1) {
            const first = points[0];
            const last = points[points.length - 1];
            
            // Capacity Growth
            if (first.total_capacity > 0) {
                setCapacityGrowth(((last.total_capacity - first.total_capacity) / first.total_capacity) * 100);
            }
            
            // Credit Growth
            if (first.total_credits > 0) {
                setCreditGrowth(((last.total_credits - first.total_credits) / first.total_credits) * 100);
            }
        }
      } else {
        setHistory([]);
      }

      setLoading(false);
    }

    fetchHistory();
  }, [timeRange]);

  // Return generic 'growth' as creditGrowth by default, but expose specific ones
  return { history, loading, growth: creditGrowth, capacityGrowth, creditGrowth };
};
