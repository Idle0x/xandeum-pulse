import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Node } from '../types'; 

export interface NodeHistoryPoint {
  date: string;
  health: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  credits: number; // <--- The UI likely looks for 'credits' or 'reputation'
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

      // --- STABLE ID GENERATION ---
      // Must match backend script exactly
      const versionSafe = node.version || '0.0.0'; 
      const stableId = `${node.pubkey}-${node.address}-${versionSafe}-${node.is_public}`;

      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // --- FETCH STRATEGY: DIRECT TABLE READ ---
      // We skip RPC for now to eliminate complexity variables
      const { data, error } = await supabase
        .from('node_snapshots')
        .select('*') 
        .eq('node_id', stableId) 
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error("History Fetch Error:", error);
        setLoading(false);
        return;
      }

      const points = (data || []).map((row: any) => ({
        date: row.created_at, 
        health: Number(row.health || 0),
        uptime: Number(row.uptime || 0),
        storage_committed: Number(row.storage_committed || 0),
        storage_used: Number(row.storage_used || 0),
        
        // CRITICAL FIX: Ensure 'credits' is mapped. 
        // If your DB column is named 'reputation', change 'row.credits' to 'row.reputation'
        credits: Number(row.credits || 0), 
        rank: Number(row.rank || 0)
      }));

      // Calculate Reliability (Simple Percentage of Healthy Snapshots)
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
  }, [node, timeRange]);

  return { history, reliabilityScore, loading };
};
