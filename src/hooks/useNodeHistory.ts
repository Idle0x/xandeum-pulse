import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Node } from '../types'; 

export interface NodeHistoryPoint {
  date: string;
  health: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  credits: number;
  rank: number;
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    // 1. Safety Check
    if (!node || !node.pubkey) return;

    async function fetchNodeHistory() {
      if (!node) return;
      setLoading(true);

      // --- STABLE ID STRATEGY (STRICT) ---
      // Format: {PUBKEY}-{ADDRESS}-{VERSION}-{IS_PUBLIC}
      // This matches your backend snapshot script perfectly.
      const stableId = `${node.pubkey}-${node.address}-${node.version}-${node.is_public}`;

      let rpcMode = false;
      let days = 7;
      let timeGrain = 'hour';

      switch (timeRange) {
        case '24H': days = 1; break;
        case '3D': days = 3; break;
        case '7D': days = 7; break;
        case '30D': days = 30; rpcMode = true; timeGrain = 'day'; break;
        case 'ALL': days = 3650; rpcMode = true; timeGrain = 'day'; break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let data: any[] | null = null;
      let error = null;

      if (rpcMode) {
        // STRATEGY A: RPC (Aggregated)
        // Ensure your RPC function 'get_node_history_bucketed' expects 'p_node_id'
        const response = await supabase.rpc('get_node_history_bucketed', {
          p_node_id: stableId, 
          p_time_grain: timeGrain,
          p_start_date: startDate.toISOString()
        });

        if (response.data) {
          data = response.data.map((r: any) => ({
            created_at: r.bucket,
            health: r.avg_health,
            uptime: r.avg_uptime,
            storage_committed: r.avg_committed,
            storage_used: r.avg_used,
            credits: r.avg_credits,
            rank: r.avg_rank || 0
          }));
        }
        error = response.error;
      } else {
        // STRATEGY B: Raw Table Fetch
        // Strictly filter by 'node_id' to prevent data mixing
        const response = await supabase
          .from('node_snapshots')
          .select('*') 
          .eq('node_id', stableId) 
          .gte('id', startDate.toISOString()) // Filter time by ID
          .order('id', { ascending: true });

        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("History Fetch Error:", error);
        setLoading(false);
        return;
      }

      const points = (data || []).map((row: any) => ({
        // Map 'id' (timestamp) to date
        date: row.bucket || row.id || row.created_at, 
        health: Number(row.health || 0),
        uptime: Number(row.uptime || 0),
        storage_committed: Number(row.storage_committed || 0),
        storage_used: Number(row.storage_used || 0),
        credits: Number(row.credits || 0),
        rank: Number(row.rank || 0)
      }));

      if (points.length > 0) {
        const activeCount = points.filter(p => p.health > 0).length;
        setReliabilityScore(Math.floor((activeCount / points.length) * 100));
      } else {
        setReliabilityScore(0);
      }

      setHistory(points);
      setLoading(false);
    }

    fetchNodeHistory();
  }, [node, timeRange]); // Dependency on full node ensures updates if version/address changes

  return { history, reliabilityScore, loading };
};
