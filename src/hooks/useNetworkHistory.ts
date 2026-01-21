import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NetworkHistoryPoint {
  date: string;
  value: number;
}

export const useNetworkHistory = (
  metric: 'total_capacity' | 'avg_health' | 'consensus_score', 
  days = 30
) => {
  const [data, setData] = useState<NetworkHistoryPoint[]>([]);
  const [growth, setGrowth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      // 1. Calculate date range (Past 30 Days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 2. Query Supabase
      const { data: rows, error } = await supabase
        .from('network_snapshots')
        .select(`id, ${metric}`)
        .gte('id', startDate.toISOString())
        .order('id', { ascending: true });

      if (error || !rows || rows.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Process Data
      const processed = rows.map((r: any) => ({
        date: new Date(r.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: Number(r[metric] || 0)
      }));

      // 4. Calculate Growth
      if (processed.length > 1) {
        const first = processed[0].value;
        const last = processed[processed.length - 1].value;
        const percentChange = first === 0 ? 0 : ((last - first) / first) * 100;
        setGrowth(percentChange);
      }

      setData(processed);
      setLoading(false);
    }

    fetchHistory();
  }, [metric, days]);

  return { history: data, growth, loading };
};
