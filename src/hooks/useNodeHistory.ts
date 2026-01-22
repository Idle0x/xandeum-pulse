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
  rank: number; // Added Rank
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    if (!node || !node.pubkey) return;

    async function fetchNodeHistory() {
      setLoading(true);

      let days = 7;
      
      switch (timeRange) {
        case '24H': days = 1; break;
        case '3D': days = 3; break;
        case '7D': days = 7; break;
        case '30D': days = 30; break;
        case 'ALL': days = 365; break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // --- FETCH STRATEGY: RAW TABLE ---
      // We query by 'node_pubkey' and filter time using 'id' (your DB timestamp column)
      const { data, error } = await supabase
          .from('node_snapshots')
          .select('*')
          .eq('node_pubkey', node.pubkey) 
          .gte('id', startDate.toISOString()) 
          .order('id', { ascending: true });

      if (error) {
        console.error("Node History Fetch Error:", error);
        setLoading(false);
        return;
      }

      const points = (data || []).map((row: any) => ({
        date: row.id, // Corrected timestamp column
        health: Number(row.health || 0),
        uptime: Number(row.uptime || 0),
        storage_committed: Number(row.storage_committed || 0),
        storage_used: Number(row.storage_used || 0),
        credits: Number(row.credits || 0),
        rank: Number(row.rank || 0)
      }));

      // Calculate Reliability (Percentage of snapshots where health > 0)
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
  }, [node?.pubkey, timeRange]); // Depend on pubkey, not the whole node object

  return { history, reliabilityScore, loading };
};
