import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NodeHistoryPoint {
  date: string; // ISO string
  health: number;
  uptime: number;
  storage_committed: number;
  credits: number;
}

export const useNodeHistory = (pubkey: string | undefined, days = 30) => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100); // Default to 100 until proven otherwise

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

      // Map to clean structure
      const points = data.map((row: any) => ({
        date: row.created_at,
        health: row.health,
        uptime: row.uptime,
        storage_committed: row.storage_committed,
        credits: row.credits
      }));

      // Calculate Reliability (Simple heuristic: % of snapshots where health > 0)
      if (points.length > 0) {
        const activeCount = points.filter(p => p.health > 0).length;
        setReliabilityScore(Math.round((activeCount / points.length) * 100));
      }

      setHistory(points);
      setLoading(false);
    }

    fetchNodeHistory();
  }, [pubkey, days]);

  return { history, reliabilityScore, loading };
};
