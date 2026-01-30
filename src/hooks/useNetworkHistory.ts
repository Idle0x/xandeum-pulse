import { useState, useEffect } from 'react';
import { consolidateNetworkHistory } from '../utils/historyAggregator';
import { getNetworkHistoryAction } from '../app/actions/getHistory';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export interface NetworkHistoryPoint {
  date: string;
  avg_health: number;
  avg_stability: number;
  total_nodes: number;
  total_unique_providers: number; // <--- NEW
  total_capacity: number;
  total_used: number;
  consensus_score: number;
  total_credits: number;
  avg_credits: number;
  top10_dominance: number;
  mainnet_nodes: number;
  mainnet_unique_providers: number; // <--- NEW
  mainnet_credits: number;
  mainnet_avg_credits: number;
  mainnet_dominance: number;
  devnet_nodes: number;
  devnet_unique_providers: number; // <--- NEW
  devnet_credits: number;
  devnet_avg_credits: number;
  devnet_dominance: number;
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      let days = timeRange === '24H' ? 1 : timeRange === '3D' ? 3 : timeRange === '30D' ? 30 : timeRange === 'ALL' ? 365 : 7;
      try {
        const data = await getNetworkHistoryAction(days);
        if (data && data.length > 0) {
          const raw = data.map((d: any) => ({
            date: d.id,
            avg_health: Number(d.avg_health || 0),
            total_nodes: Number(d.total_nodes || 0),
            total_unique_providers: Number(d.total_unique_providers || 0), // <--- MAPPED
            total_credits: Number(d.total_credits || 0),
            avg_credits: Number(d.avg_credits || 0),
            top10_dominance: Number(d.top10_dominance || 0),
            mainnet_nodes: Number(d.mainnet_nodes || 0),
            mainnet_unique_providers: Number(d.mainnet_unique_providers || 0), // <--- MAPPED
            mainnet_credits: Number(d.mainnet_credits || 0),
            mainnet_avg_credits: Number(d.mainnet_avg_credits || 0),
            mainnet_dominance: Number(d.mainnet_dominance || 0),
            devnet_nodes: Number(d.devnet_nodes || 0),
            devnet_unique_providers: Number(d.devnet_unique_providers || 0), // <--- MAPPED
            devnet_credits: Number(d.devnet_credits || 0),
            devnet_avg_credits: Number(d.devnet_avg_credits || 0),
            devnet_dominance: Number(d.devnet_dominance || 0),
          }));
          setHistory(consolidateNetworkHistory(raw, timeRange));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchHistory();
  }, [timeRange]);

  return { history, loading };
};
