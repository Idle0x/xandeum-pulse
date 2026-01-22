import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NodeHistoryPoint {
  date: string;
  health: number;
  uptime: number;
  storage_committed: number;
  storage_used: number; // Added this field
  credits: number;
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (pubkey: string | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    if (!pubkey) return;

    async function fetchNodeHistory() {
      setLoading(true);

      // 1. Determine Fetch Strategy
      let rpcMode = false;
      let days = 7;
      let timeGrain = 'hour';

      switch (timeRange) {
        case '24H': days = 1; break;
        case '3D': days = 3; break;
        case '7D': days = 7; break;
        case '30D': days = 30; rpcMode = true; timeGrain = 'day'; break; // Switch to daily buckets
        case 'ALL': days = 3650; rpcMode = true; timeGrain = 'day'; break; // Max 10 years
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let data: any[] | null = null;
      let error = null;

      if (rpcMode) {
        // STRATEGY A: Use Backend Aggregation
        const response = await supabase.rpc('get_node_history_bucketed', {
          p_pubkey: pubkey,
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });
        
        // Map RPC result keys to standard keys
        if (response.data) {
          data = response.data.map((r: any) => ({
            created_at: r.bucket,
            health: r.avg_health,
            uptime: r.avg_uptime,
            storage_committed: r.avg_committed,
            storage_used: r.avg_used,
            credits: r.avg_credits
          }));
        }
        error = response.error;
      } else {
        // STRATEGY B: Raw Fetch (High Resolution)
        const response = await supabase
          .from('node_snapshots')
          .select('created_at, health, uptime, storage_committed, storage_used, credits')
          .eq('pubkey', pubkey)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        
        data = response.data;
        error = response.error;
      }

      if (error || !data) {
        console.error("History Fetch Error:", error);
        setLoading(false);
        return;
      }

      // Standardize Output
      const points = data.map((row: any) => ({
        date: row.created_at,
        health: Number(row.health),
        uptime: Number(row.uptime),
        storage_committed: Number(row.storage_committed),
        storage_used: Number(row.storage_used),
        credits: Number(row.credits)
      }));

      // Calculate Reliability (Simple heuristic on the loaded dataset)
      if (points.length > 0) {
        const activeCount = points.filter(p => p.health > 0).length;
        setReliabilityScore(Math.floor((activeCount / points.length) * 100));
      }

      setHistory(points);
      setLoading(false);
    }

    fetchNodeHistory();
  }, [pubkey, timeRange]);

  return { history, reliabilityScore, loading };
};
