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
    if (!node || !node.pubkey) return;

    async function fetchNodeHistory() {
      if (!node) return;
      setLoading(true);

      // --- CRITICAL CHECK ---
      // Ensure 'version' exists. If your old DB rows used 'storage_committed', 
      // you might not see old data until new snapshots accumulate.
      // If node.version is undefined, this string becomes "undefined", breaking the ID.
      const versionSafe = node.version || '0.0.0'; 
      
      // Matches your NEW backend script format:
      const stableId = `${node.pubkey}-${node.address}-${versionSafe}-${node.is_public}`;

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

      try {
        if (rpcMode) {
          // RPC Strategy
          const response = await supabase.rpc('get_node_history_bucketed', {
            p_node_id: stableId, 
            p_time_grain: timeGrain,
            p_start_date: startDate.toISOString()
          });
          
          if (response.data) {
             // Map RPC result explicitly
             data = response.data;
          }
          error = response.error;
        } else {
          // TABLE Strategy
          // FIX 1: Filter by 'created_at', NOT 'id'. 'id' is likely an Integer/UUID.
          const response = await supabase
            .from('node_snapshots')
            .select('*') 
            .eq('node_id', stableId) 
            .gte('created_at', startDate.toISOString()) // <--- CHANGED BACK TO created_at
            .order('created_at', { ascending: true });  // <--- CHANGED BACK TO created_at

          data = response.data;
          error = response.error;
        }

        if (error) throw error;

        // Map data safely
        const points = (data || []).map((row: any) => ({
          // Handle both RPC 'bucket' and Table 'created_at'
          date: row.bucket || row.created_at || new Date().toISOString(), 
          health: Number(row.health || row.avg_health || 0),
          uptime: Number(row.uptime || row.avg_uptime || 0),
          storage_committed: Number(row.storage_committed || row.avg_committed || 0),
          storage_used: Number(row.storage_used || row.avg_used || 0),
          credits: Number(row.credits || row.avg_credits || 0),
          rank: Number(row.rank || row.avg_rank || 0)
        }));

        if (points.length > 0) {
          const activeCount = points.filter(p => p.health > 0).length;
          setReliabilityScore(Math.floor((activeCount / points.length) * 100));
        } else {
          setReliabilityScore(0);
        }

        setHistory(points);

      } catch (err) {
        console.error("History Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNodeHistory();
  }, [node, timeRange]);

  return { history, reliabilityScore, loading };
};
