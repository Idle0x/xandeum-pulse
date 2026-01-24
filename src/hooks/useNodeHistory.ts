import { useState, useEffect } from 'react';
import { Node } from '../types'; 
import { consolidateHistory } from '../utils/historyAggregator'; 
// UPDATE IMPORT HERE
import { getNodeHistoryAction } from '../app/actions/getHistory';

export interface NodeHistoryPoint {
  date: string;
  health: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  credits: number;
  reputation: number;
  rank: number;
  network: string; 
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '24H') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    let isMounted = true;
    if (!node || !node.pubkey || !node.network) return;

    const targetNetwork = node.network;
    const targetAddress = node.address || '0.0.0.0'; 
    const targetPubkey = node.pubkey;

    async function fetchNodeHistory() {
      setLoading(true);

      const ipOnly = targetAddress.includes(':') ? targetAddress.split(':')[0] : targetAddress;
      const stableId = `${targetPubkey}-${ipOnly}-${targetNetwork}`;

      // 1. Determine Days
      let days = 1;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '7D') days = 7;
      if (timeRange === '30D') days = 30;
      if (timeRange === 'ALL') days = 365;

      try {
        // CALL NEW ACTION NAME
        const data = await getNodeHistoryAction(stableId, targetNetwork, days);

        if (!isMounted) return;

        // 3. Map Data
        const rawPoints = (data || []).map((row: any) => ({
          date: row.created_at, 
          health: Number(row.health || 0),
          uptime: Number(row.uptime || 0),
          storage_committed: Number(row.storage_committed || 0),
          storage_used: Number(row.storage_used || 0),
          credits: Number(row.credits || 0), 
          rank: Number(row.rank || 0),
          network: row.network || targetNetwork
        }));

        // 4. Aggregate
        const processedHistory = consolidateHistory(rawPoints, timeRange);

        if (processedHistory.length > 0) {
          const activeCount = processedHistory.filter((p: any) => p.health > 0).length;
          setReliabilityScore(Math.floor((activeCount / processedHistory.length) * 100));
        } else {
          setReliabilityScore(0);
        }

        setHistory(processedHistory);
      } catch (err) {
        console.error("Failed to fetch node history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchNodeHistory();

    return () => { isMounted = false; };
  }, [node?.pubkey, node?.network, node?.address, timeRange]);

  return { history, reliabilityScore, loading };
};
