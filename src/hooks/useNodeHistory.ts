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
  reputation: number;
  rank: number;
  network: string; // <--- 1. ADD THIS so frontend filtering works
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    // Safety check for required node data
    if (!node || !node.pubkey || !node.network) return;

    async function fetchNodeHistory() {
      setLoading(true);

      // Legacy ID generation (Kept for compatibility, but the network filter below is the real fix)
      const versionSafe = node?.version || '0.0.0'; 
      const stableId = `${node?.pubkey}-${node?.address}-${versionSafe}-${node?.is_public}`;

      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 2. QUERY UPDATE
      const { data, error } = await supabase
        .from('node_snapshots')
        .select('*') 
        .eq('node_id', stableId)
        .eq('network', node.network) // <--- CRITICAL FIX: Enforce Network Separation in DB
        .gte('created_at', startDate.toISOString()) 
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Node History Error:", error);
        setLoading(false);
        return;
      }

      const points = (data || []).map((row: any) => ({
        date: row.created_at, 
        health: Number(row.health || 0),
        uptime: Number(row.uptime || 0),
        storage_committed: Number(row.storage_committed || 0),
        storage_used: Number(row.storage_used || 0),
        credits: Number(row.credits || 0), 
        reputation: Number(row.credits || 0), 
        rank: Number(row.rank || 0),
        
        // 3. MAPPING UPDATE
        network: row.network || node.network // Ensure network is passed to UI
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
  }, [node, timeRange]);

  return { history, reliabilityScore, loading };
};
