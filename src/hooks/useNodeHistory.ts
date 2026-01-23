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
  network: string; 
}

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useNodeHistory = (node: Node | undefined, timeRange: HistoryTimeRange = '7D') => {
  const [history, setHistory] = useState<NodeHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(100);

  useEffect(() => {
    // 1. Cleanup Flag
    let isMounted = true;

    // 2. Safety Check
    if (!node || !node.pubkey || !node.network) return;

    // 3. Capture Variables
    const targetNetwork = node.network;
    const targetPubkey = node.pubkey;
    const targetAddress = node.address || '0.0.0.0'; 
    
    // Note: We intentionally ignore node.version and node.is_public for the ID

    async function fetchNodeHistory() {
      setLoading(true);

      // --- STABLE ID V2 ---
      // Logic: [PublicKey]-[IP]-[Network]
      
      const ipOnly = targetAddress.includes(':') ? targetAddress.split(':')[0] : targetAddress;
      const stableId = `${targetPubkey}-${ipOnly}-${targetNetwork}`;

      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

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

      const points = (data || []).map((row: any) => ({
        date: row.created_at, 
        health: Number(row.health || 0),
        uptime: Number(row.uptime || 0),
        storage_committed: Number(row.storage_committed || 0),
        storage_used: Number(row.storage_used || 0),
        credits: Number(row.credits || 0), 
        reputation: Number(row.credits || 0), 
        rank: Number(row.rank || 0),
        network: row.network || targetNetwork
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

    return () => { isMounted = false; };
  }, [node?.pubkey, node?.network, node?.address, timeRange]);

  return { history, reliabilityScore, loading };
};
