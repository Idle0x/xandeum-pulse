import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Node } from '../types'; // Ensure you import your Node type

export interface NodeHistoryPoint {
  date: string;
  health: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  credits: number;
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

// UPDATED: Accepts the full Node object to generate the Stable ID
export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    if (!node || !node.pubkey) return;

    async function fetchNodeHistory() {
      setLoading(true);

      // --- GENERATE STABLE ID (Must match backend logic exactly) ---
      // Format: {PUBKEY}-{ADDRESS}-{IS_PUBLIC}-{COMMITTED}
      const stableId = `${node.pubkey}-${node.address}-${node.is_public}-${node.storage_committed}`;

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
        const response = await supabase.rpc('get_node_history_bucketed', {
          p_node_id: stableId, // Pass Stable ID
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
            credits: r.avg_credits
          }));
        }
        error = response.error;
      } else {
        // STRATEGY B: Raw Table Fetch
        const response = await supabase
          .from('node_snapshots')
          .select('created_at, health, uptime, storage_committed, storage_used, credits')
          .eq('node_id', stableId) // Filter by Stable ID
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        
        data = response.data;
        error = response.error;
      }

      // Fallback: If no data found with stable ID (old data), try falling back to pubkey just in case
      // (Optional: Remove this block if you want to enforce strict separation immediately)
      if ((!data || data.length === 0) && !error) {
         // console.log("Stable ID empty, trying Pubkey fallback...");
         // You could add logic here to fetch by pubkey if stableId returns nothing, 
         // but that risks merging data again. Better to start clean.
      }

      if (error) {
        console.error("History Fetch Error:", error);
        setLoading(false);
        return;
      }

      const points = (data || []).map((row: any) => ({
        date: row.created_at,
        health: Number(row.health),
        uptime: Number(row.uptime),
        storage_committed: Number(row.storage_committed),
        storage_used: Number(row.storage_used),
        credits: Number(row.credits)
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
  }, [node, timeRange]); // Re-run if node identity or time range changes

  return { history, reliabilityScore, loading };
};
