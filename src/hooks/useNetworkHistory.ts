import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { consolidateNetworkHistory } from '../utils/historyAggregator';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export interface NetworkHistoryPoint {
  date: string;
  // Global
  avg_health: number;
  avg_stability: number; // <--- NEW
  total_nodes: number;
  total_capacity: number;
  total_used: number;
  consensus_score: number;

  // Mainnet
  mainnet_nodes: number;
  mainnet_capacity: number;
  mainnet_used: number;
  mainnet_avg_health: number;
  mainnet_avg_stability: number; // <--- NEW
  mainnet_consensus_score: number;

  // Devnet
  devnet_nodes: number;
  devnet_capacity: number;
  devnet_used: number;
  devnet_avg_health: number;
  devnet_avg_stability: number; // <--- NEW
  devnet_consensus_score: number;

  total_credits: number;
  avg_credits: number;
  top10_dominance: number;
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30; 
      if (timeRange === 'ALL') days = 365; 

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('network_snapshots')
        .select('*')
        .gte('id', startDate.toISOString()) 
        .order('id', { ascending: true });

      if (error) {
        console.error("Network History Error:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const rawPoints = data.map((d: any) => ({
          date: d.id,

          // Global
          avg_health: Number(d.avg_health || 0),
          avg_stability: Number(d.avg_stability || 0), // <--- NEW
          total_nodes: Number(d.total_nodes || 0),
          total_capacity: Number(d.total_capacity || 0),
          total_used: Number(d.total_used || 0),
          consensus_score: Number(d.consensus_score || 0),

          // Mainnet
          mainnet_nodes: Number(d.mainnet_nodes || 0),
          mainnet_capacity: Number(d.mainnet_capacity || 0),
          mainnet_used: Number(d.mainnet_used || 0),
          mainnet_avg_health: Number(d.mainnet_avg_health || 0),
          mainnet_avg_stability: Number(d.mainnet_avg_stability || 0), // <--- NEW
          mainnet_consensus_score: Number(d.mainnet_consensus_score || 0),

          // Devnet
          devnet_nodes: Number(d.devnet_nodes || 0),
          devnet_capacity: Number(d.devnet_capacity || 0),
          devnet_used: Number(d.devnet_used || 0),
          devnet_avg_health: Number(d.devnet_avg_health || 0),
          devnet_avg_stability: Number(d.devnet_avg_stability || 0), // <--- NEW
          devnet_consensus_score: Number(d.devnet_consensus_score || 0),

          // Financials
          total_credits: Number(d.total_credits || 0),
          avg_credits: Number(d.avg_credits || 0),
          top10_dominance: Number(d.top10_dominance || 0)
        }));

        const processedHistory = consolidateNetworkHistory(rawPoints, timeRange);

        setHistory(processedHistory);

        // Growth calculation (unchanged)
        if (processedHistory.length > 1) {
            const first = processedHistory[0].total_capacity;
            const last = processedHistory[processedHistory.length - 1].total_capacity;
            if (first > 0) {
                setGrowth(((last - first) / first) * 100);
            } else {
                setGrowth(last > 0 ? 100 : 0);
            }
        }
      } else {
        setHistory([]);
        setGrowth(0);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [timeRange]);

  return { history, loading, growth };
};
