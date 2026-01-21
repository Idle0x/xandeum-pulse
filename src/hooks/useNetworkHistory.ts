import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NodeHistoryPoint {
  date: string; // ISO string for strict ordering
  health: number;
  uptime: number;
  storage_committed: number;
  credits: number;
}

export const useNodeHistory = (pubkey: string | undefined, days = 30) => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Metrics calculated from the history
  const [reliabilityScore, setReliabilityScore] = useState(100); 
  const [growth, setGrowth] = useState(0); // Specifically for Credits Velocity

  useEffect(() => {
    if (!pubkey) return;

    async function fetchNodeHistory() {
      setLoading(true);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('node_snapshots')
        .select('created_at, health, uptime, storage_committed, credits')
        .eq('pubkey', pubkey)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Map raw DB rows to clean interface
      const points = data.map((row: any) => ({
        date: row.created_at,
        health: row.health,
        uptime: row.uptime,
        storage_committed: row.storage_committed,
        credits: row.credits
      }));

      // A. Calculate Reliability Score
      // Heuristic: Percentage of snapshots where the node reported valid health (>0)
      if (points.length > 0) {
        const activeCount = points.filter(p => p.health > 0).length;
        // We floor it so 99.9 becomes 99, keeping it conservative
        setReliabilityScore(Math.floor((activeCount / points.length) * 100));
      }

      // B. Calculate Credits Growth (Velocity)
      if (points.length > 1) {
        const first = points[0].credits;
        const last = points[points.length - 1].credits;
        const percentChange = first === 0 ? 0 : ((last - first) / first) * 100;
        setGrowth(percentChange);
      }

      setHistory(points);
      setLoading(false);
    }

    fetchNodeHistory();
  }, [pubkey, days]);

  return { history, reliabilityScore, growth, loading };
};
