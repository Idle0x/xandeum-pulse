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
  const [growth, setGrowth] = useState(0); // Added growth state

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

      if (rpcMode) {
        const { data: rpcData, error } = await supabase.rpc('get_network_history_bucketed', {
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });
        if (!error) data = rpcData;
      } else {
        const { data: rawData, error } = await supabase
          .from('network_snapshots')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        
        if (!error && rawData) {
            // Map raw DB columns to our interface
            data = rawData.map(d => ({
                bucket: d.created_at,
                avg_health: d.avg_health,
                total_nodes: d.total_nodes,
                total_capacity: d.total_capacity,
                total_used: d.total_used,
                consensus_score: d.consensus_score
            }));
        }
      }

      if (data && data.length > 0) {
        const points = data.map((d: any) => ({
          date: d.bucket,
          avg_health: Number(d.avg_health),
          total_nodes: Number(d.total_nodes),
          total_capacity: Number(d.total_capacity),
          total_used: Number(d.total_used),
          consensus_score: Number(d.consensus_score)
        }));
        setHistory(points);

        // CALCULATE GROWTH (Based on Total Capacity by default)
        const first = points[0];
        const last = points[points.length - 1];
        if (first.total_capacity > 0) {
            const diff = last.total_capacity - first.total_capacity;
            const percent = (diff / first.total_capacity) * 100;
            setGrowth(percent);
        } else {
            setGrowth(0);
        }
      } else {
        setHistory([]);
        setGrowth(0);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [timeRange]);

  // Return growth included
  return { history, loading, growth };
};
