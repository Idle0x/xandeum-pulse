import { useState, useEffect } from 'react';
import axios from 'axios';
import { Node } from '../types';

// Define the shape of the aggregated stats
export interface NetworkStats {
  total_nodes: number;
  total_capacity: number;
  total_used: number;
  avg_health: number;
  avg_stability: number; // Global Stability

  total_credits: number;
  avg_credits: number;
  top10_dominance: number;

  // Mainnet
  mainnet_nodes: number;
  mainnet_credits: number;
  mainnet_avg_stability: number;
  mainnet_capacity: number;

  // Devnet
  devnet_nodes: number;
  devnet_credits: number;
  devnet_avg_stability: number;
  devnet_capacity: number;

  consensus_version: string;
  consensus_score: number;
}

export const useNetworkData = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null); // New Stats Object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Parallel Fetch: Real-time Stats + Real-time Credits
        const [statsRes, creditsRes] = await Promise.all([
          axios.get('/api/stats').catch(() => ({ data: { result: { pods: [] } } })),
          axios.get('/api/credits').catch(() => ({ data: { mainnet: [], devnet: [] } }))
        ]);

        if (!isMounted) return;

        const rawNodes = statsRes.data?.result?.pods || [];
        const rawCreditsMain = creditsRes.data?.mainnet || [];
        const rawCreditsDev = creditsRes.data?.devnet || [];

        // 1. Create Credit Map
        const creditMap = new Map<string, number>();
        [...rawCreditsMain, ...rawCreditsDev].forEach((c: any) => {
            const key = c.pod_id || c.pubkey;
            if (key) creditMap.set(key, Number(c.credits || 0));
        });

        // 2. Merge Data into Node List
        const mergedNodes: Node[] = rawNodes.map((n: any) => ({
          pubkey: n.pubkey,
          address: n.address,
          network: n.network || 'MAINNET',
          health: Number(n.health || 0),
          storage_committed: Number(n.storage_committed || 0),
          storage_used: Number(n.storage_used || 0),
          uptime: Number(n.uptime || 0), // Stability
          version: n.version || '0.0.0',
          is_public: n.is_public,
          credits: creditMap.get(n.pubkey) || 0
        }));

        setNodes(mergedNodes);

        // 3. Calculate Aggregated Stats (Live Client-Side Calculation)
        if (mergedNodes.length > 0) {
            // Helpers
            const sum = (arr: Node[], key: keyof Node) => arr.reduce((acc, n) => acc + (Number(n[key]) || 0), 0);
            const avg = (arr: Node[], key: keyof Node) => arr.length > 0 ? sum(arr, key) / arr.length : 0;
            
            const mainnetNodes = mergedNodes.filter(n => n.network === 'MAINNET');
            const devnetNodes = mergedNodes.filter(n => n.network === 'DEVNET');

            // Dominance Calc - SAFELY SORTING WITH || 0
            const sortedByCredits = [...mergedNodes].sort((a, b) => (b.credits || 0) - (a.credits || 0));
            
            const totalCredits = sum(mergedNodes, 'credits');
            const top10 = sortedByCredits.slice(0, 10).reduce((acc, n) => acc + (n.credits || 0), 0);

            // Version Consensus
            const versions: Record<string, number> = {};
            mergedNodes.forEach(n => { versions[n.version!] = (versions[n.version!] || 0) + 1; });
            const topVersion = Object.keys(versions).reduce((a, b) => versions[a] > versions[b] ? a : b, '0.0.0');
            const consensusScore = (versions[topVersion] / mergedNodes.length) * 100;

            setStats({
                total_nodes: mergedNodes.length,
                total_capacity: sum(mergedNodes, 'storage_committed'),
                total_used: sum(mergedNodes, 'storage_used'),
                avg_health: avg(mergedNodes, 'health'),
                avg_stability: avg(mergedNodes, 'uptime'),

                total_credits: totalCredits,
                avg_credits: avg(mergedNodes, 'credits'),
                top10_dominance: totalCredits > 0 ? (top10 / totalCredits) * 100 : 0,

                // Mainnet
                mainnet_nodes: mainnetNodes.length,
                mainnet_credits: sum(mainnetNodes, 'credits'),
                mainnet_avg_stability: avg(mainnetNodes, 'uptime'),
                mainnet_capacity: sum(mainnetNodes, 'storage_committed'),

                // Devnet
                devnet_nodes: devnetNodes.length,
                devnet_credits: sum(devnetNodes, 'credits'),
                devnet_avg_stability: avg(devnetNodes, 'uptime'),
                devnet_capacity: sum(devnetNodes, 'storage_committed'),

                consensus_version: topVersion,
                consensus_score: consensusScore
            });
        }

      } catch (err) {
        console.error("Failed to load network data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  // Return BOTH the list (for Compare) AND the stats (for Dashboard)
  // We map 'data' to 'stats' for backward compatibility if any component used 'data'
  return { nodes, stats, data: stats, loading };
};
