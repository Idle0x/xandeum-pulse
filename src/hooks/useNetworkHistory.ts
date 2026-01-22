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
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // SCHEMA MATCH: 
      // Table 'network_snapshots' has NO 'created_at'.
      // Column 'id' is defined as 'timestamp with time zone'.
      // Therefore, we MUST filter and sort by 'id'.
      const { data, error } = await supabase
        .from('network_snapshots')
        .select('*')
        .gte('id', startDate.toISOString()) 
        .order('id', { ascending: true });

      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const points = data.map((d: any) => ({
          date: d.id, // 'id' is the timestamp here
          
          avg_health: Number(d.avg_health || 0),
          total_nodes: Number(d.total_nodes || 0),
          total_capacity: Number(d.total_capacity || 0),
          total_used: Number(d.total_used || 0),
          consensus_score: Number(d.consensus_score || 0),
          
          // Schema matches exactly:
          total_credits: Number(d.total_credits || 0),
          avg_credits: Number(d.avg_credits || 0),
          top10_dominance: Number(d.top10_dominance || 0)
        }));

        setHistory(points);

        // Growth Calculation (based on total_credits)
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
