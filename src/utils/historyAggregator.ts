import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Node } from '../types'; 
// Import the new utility
import { consolidateHistory } from '../utils/historyAggregator'; 

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

      // Create Stable ID: [PublicKey]-[IP]-[Network]
      const ipOnly = targetAddress.includes(':') ? targetAddress.split(':')[0] : targetAddress;
      const stableId = `${targetPubkey}-${ipOnly}-${targetNetwork}`;

      // 1. DETERMINE FETCH WINDOW
      // We always fetch the raw amount of days needed
      let days = 1;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '7D') days = 7;
      if (timeRange === '30D') days = 30;
      if (timeRange === 'ALL') days = 365; // Max retention

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 2. FETCH RAW DATA FROM SUPABASE
      const { data, error } = await supabase
        .from('node_snapshots')
        .select('*') 
        .eq('node_id', stableId)
        .eq('network', targetNetwork)
        .gte('created_at', startDate.toISOString()) 
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Node History Error:", error);
        setLoading(false);
        return;
      }

      // 3. NORMALIZE DATA
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

      // 4. AGGREGATE (The Fix)
      // This automatically groups hourly data into daily averages if timeRange is 30D or ALL
      const processedHistory = consolidateHistory(rawPoints, timeRange);

      // Calculate Reliability Score based on processed data
      if (processedHistory.length > 0) {
        const activeCount = processedHistory.filter((p: any) => p.health > 0).length;
        setReliabilityScore(Math.floor((activeCount / processedHistory.length) * 100));
      } else {
        setReliabilityScore(0);
      }

      setHistory(processedHistory);
      setLoading(false);
    }

    fetchNodeHistory();

    return () => { isMounted = false; };
  }, [node?.pubkey, node?.network, node?.address, timeRange]);

  return { history, reliabilityScore, loading };
};
