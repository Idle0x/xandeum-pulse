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

      // NOTE: Ensure your RPC function 'get_node_history_bucketed' also accepts 'p_node_pubkey'
      // If RPC is not updated yet, we fallback to raw table query which is safer for now.
      if (rpcMode) {
         // Placeholder for RPC logic if you implement it later
         // For now, let's use the Raw Query even for 30D to ensure it works immediately
      }
      
      // RAW QUERY (Safe & Direct)
      // Query by Pubkey (Persistent Identity) instead of ID string
      const response = await supabase
        .from('node_snapshots')
        .select('*') 
        .eq('node_pubkey', node.pubkey) // Query by Pubkey
        .gte('id', startDate.toISOString()) // Filter by ID (Timestamp)
        .order('id', { ascending: true });  // Sort by ID

      data = response.data;
      error = response.error;

      if (error) {
        console.error("Node History Fetch Error:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const points = data.map((row: any) => ({
          date: row.id, // Use ID as date
          health: Number(row.health || 0),
          uptime: Number(row.uptime || 0),
          storage_committed: Number(row.storage_committed || 0),
          storage_used: Number(row.storage_used || 0),
          credits: Number(row.credits || 0),
          rank: Number(row.rank || 0)
        }));

        setHistory(points);

        // Simple reliability calculation based on health history
        const activeCount = points.filter(p => p.health > 0).length;
        setReliabilityScore(Math.floor((activeCount / points.length) * 100));
      } else {
        setHistory([]);
        setReliabilityScore(0);
      }

      setLoading(false);
    }

    fetchNodeHistory();
  }, [node?.pubkey, timeRange]); // Depend on pubkey, not the whole node object

  return { history, reliabilityScore, loading };
};
