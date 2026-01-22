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
      
      let days = 7;
      let timeGrain = 'hour'; // Only used if you implement RPC later
      
      switch (timeRange) {
        case '24H': days = 1; break;
        case '3D': days = 3; break;
        case '7D': days = 7; break;
        case '30D': days = 30; timeGrain = 'day'; break;
        case 'ALL': days = 365; timeGrain = 'day'; break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // --- CRITICAL FIX: Query 'id' instead of 'created_at' ---
      // Your DB debugger shows 'id' is the timestamp column.
      const { data: rawData, error } = await supabase
        .from('network_snapshots')
        .select('*')
        .gte('id', startDate.toISOString()) // Filter by ID
        .order('id', { ascending: true });  // Sort by ID
      
      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      if (rawData && rawData.length > 0) {
        const points = rawData.map((d: any) => ({
          // Map 'id' to our internal 'date' property
          date: d.id, 
          
          avg_health: Number(d.avg_health || 0),
          total_nodes: Number(d.total_nodes || 0),
          consensus_score: Number(d.consensus_score || 0),
          total_capacity: Number(d.total_capacity || 0),
          total_used: Number(d.total_used || 0)
        }));

        setHistory(points);

        // Calculate Growth (Total Capacity)
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
