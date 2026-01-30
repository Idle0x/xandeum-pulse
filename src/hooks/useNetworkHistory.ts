import { useState, useEffect } from 'react';
import { consolidateNetworkHistory } from '../utils/historyAggregator';
import { getNetworkHistoryAction } from '../app/actions/getHistory';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export interface NetworkHistoryPoint {
  date: string;
  // Global
  avg_health: number;
  avg_stability: number;
  total_nodes: number;
  total_unique_providers: number; // <--- NEW: Unique Identity Count
  total_capacity: number;
  total_used: number;
  consensus_score: number;
  total_credits: number;
  avg_credits: number;
  top10_dominance: number;

  // Mainnet
  mainnet_nodes: number;
  mainnet_unique_providers: number; // <--- NEW
  mainnet_capacity: number;
  mainnet_used: number;
  mainnet_avg_health: number;
  mainnet_avg_stability: number;
  mainnet_consensus_score: number;
  mainnet_credits: number;       
  mainnet_avg_credits: number;   
  mainnet_dominance: number;     

  // Devnet
  devnet_nodes: number;
  devnet_unique_providers: number; // <--- NEW
  devnet_capacity: number;
  devnet_used: number;
  devnet_avg_health: number;
  devnet_avg_stability: number;
  devnet_consensus_score: number;
  devnet_credits: number;        
  devnet_avg_credits: number;    
  devnet_dominance: number;      
}

export const useNetworkHistory = (timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      setLoading(true);

      // Determine Days
      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30; 
      if (timeRange === 'ALL') days = 365; 

      try {
        // Fetch from RAM Cache
        const data = await getNetworkHistoryAction(days);

        if (!isMounted) return;

        if (data && data.length > 0) {
          const rawPoints = data.map((d: any) => ({
            date: d.id,

            // Global
            avg_health: Number(d.avg_health || 0),
            avg_stability: Number(d.avg_stability || 0),
            total_nodes: Number(d.total_nodes || 0),
            total_unique_providers: Number(d.total_unique_providers || 0), // <--- MAP THIS
            total_capacity: Number(d.total_capacity || 0),
            total_used: Number(d.total_used || 0),
            consensus_score: Number(d.consensus_score || 0),
            total_credits: Number(d.total_credits || 0),
            avg_credits: Number(d.avg_credits || 0),
            top10_dominance: Number(d.top10_dominance || 0),

            // Mainnet
            mainnet_nodes: Number(d.mainnet_nodes || 0),
            mainnet_unique_providers: Number(d.mainnet_unique_providers || 0), // <--- MAP THIS
            mainnet_capacity: Number(d.mainnet_capacity || 0),
            mainnet_used: Number(d.mainnet_used || 0),
            mainnet_avg_health: Number(d.mainnet_avg_health || 0),
            mainnet_avg_stability: Number(d.mainnet_avg_stability || 0),
            mainnet_consensus_score: Number(d.mainnet_consensus_score || 0),
            mainnet_credits: Number(d.mainnet_credits || 0),         
            mainnet_avg_credits: Number(d.mainnet_avg_credits || 0), 
            mainnet_dominance: Number(d.mainnet_dominance || 0),     

            // Devnet
            devnet_nodes: Number(d.devnet_nodes || 0),
            devnet_unique_providers: Number(d.devnet_unique_providers || 0), // <--- MAP THIS
            devnet_capacity: Number(d.devnet_capacity || 0),
            devnet_used: Number(d.devnet_used || 0),
            devnet_avg_health: Number(d.devnet_avg_health || 0),
            devnet_avg_stability: Number(d.devnet_avg_stability || 0),
            devnet_consensus_score: Number(d.devnet_consensus_score || 0),
            devnet_credits: Number(d.devnet_credits || 0),           
            devnet_avg_credits: Number(d.devnet_avg_credits || 0),   
            devnet_dominance: Number(d.devnet_dominance || 0),       
          }));

          const processedHistory = consolidateNetworkHistory(rawPoints, timeRange);
          setHistory(processedHistory);

          // Growth calc (Capacity based)
          if (processedHistory.length > 1) {
              const first = processedHistory[0].total_capacity;
              const last = processedHistory[processedHistory.length - 1].total_capacity;
              setGrowth(first > 0 ? ((last - first) / first) * 100 : (last > 0 ? 100 : 0));
          }
        } else {
          setHistory([]);
          setGrowth(0);
        }
      } catch (err) {
        console.error("Failed to fetch network history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();
    return () => { isMounted = false; };
  }, [timeRange]);

  return { history, loading, growth };
};
