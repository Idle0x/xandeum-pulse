// src/hooks/useLeaderboardData.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { RankedNode } from '../types/leaderboard';

interface NodeMeta {
    address: string;
    location?: any;
    health: number;
    version: string;
    is_public: boolean;
}

export const useLeaderboardData = () => {
  const [allNodes, setAllNodes] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsOffline, setCreditsOffline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel data fetching
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits').catch(() => ({ data: { mainnet: [], devnet: [] } })), 
          axios.get('/api/stats').catch(() => ({ data: { result: { pods: [] } } }))
        ]);

        // ---------------------------------------------------------
        // 1. STRICT SEGREGATION: Two Separate Maps
        // ---------------------------------------------------------
        const mainnetMeta = new Map<string, NodeMeta>();
        const devnetMeta = new Map<string, NodeMeta>();

        if (statsRes.data?.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                // Create the metadata object
                const metaEntry: NodeMeta = {
                    address: node.address, 
                    location: node.location,
                    health: node.health || 0,
                    version: node.version || '0.0.0',
                    is_public: node.is_public ?? false
                };

                // STRICT SORTING: Only put Mainnet metadata in Mainnet Map
                if (node.network === 'MAINNET') {
                    if (!mainnetMeta.has(node.pubkey)) {
                        mainnetMeta.set(node.pubkey, metaEntry);
                    }
                } else {
                    // Default to Devnet map for DEVNET or others
                    if (!devnetMeta.has(node.pubkey)) {
                        devnetMeta.set(node.pubkey, metaEntry);
                    }
                }
            });
        }

        // ---------------------------------------------------------
        // 2. PROCESS CREDITS (Strict Lookup)
        // ---------------------------------------------------------
        
        // Handle API response structure safely
        const rawMainnet = creditsRes.data.mainnet || [];
        const rawDevnet = creditsRes.data.devnet || [];

        if (rawMainnet.length === 0 && rawDevnet.length === 0) {
             setCreditsOffline(true);
             setAllNodes([]); 
        } else {
            setCreditsOffline(false);

            // A. Hydrate Mainnet Nodes (Look ONLY in mainnetMeta)
            const mainnetNodes: RankedNode[] = rawMainnet.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = mainnetMeta.get(pKey); // <--- STRICT LOOKUP

                return {
                    pubkey: pKey,
                    credits: Number(item.credits || 0),
                    health: meta?.health || 0,
                    network: 'MAINNET', // Explicitly Mainnet
                    rank: 0, 
                    address: meta?.address,
                    location: meta?.location,
                    version: meta?.version || '0.0.0', 
                    is_public: meta?.is_public ?? false, 
                    trend: 0 
                };
            });

            // B. Hydrate Devnet Nodes (Look ONLY in devnetMeta)
            const devnetNodes: RankedNode[] = rawDevnet.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = devnetMeta.get(pKey); // <--- STRICT LOOKUP

                return {
                    pubkey: pKey,
                    credits: Number(item.credits || 0),
                    health: meta?.health || 0,
                    network: 'DEVNET', // Explicitly Devnet
                    rank: 0, 
                    address: meta?.address,
                    location: meta?.location,
                    version: meta?.version || '0.0.0', 
                    is_public: meta?.is_public ?? false, 
                    trend: 0 
                };
            });

            // ---------------------------------------------------------
            // 3. MERGE & RANK
            // ---------------------------------------------------------
            
            // Combine strictly scoped lists
            const combinedList = [...mainnetNodes, ...devnetNodes];

            // Load History
            let history: Record<string, number> = {};
            try {
                const h = localStorage.getItem('xandeum_rank_history');
                if (h) history = JSON.parse(h);
            } catch (e) {
                console.warn("Failed to parse rank history", e);
            }
            const newHistory: Record<string, number> = {};

            // Sort Global List (High Credits -> High Health)
            combinedList.sort((a, b) => b.credits - a.credits || b.health - a.health);

            // Assign Ranks & Calc Trends
            combinedList.forEach((n, i) => {
                const currentRank = i + 1;
                n.rank = currentRank;

                // Composite key for history tracking to avoid collision there too
                // (Optional: if you want history to be strictly network specific, use pubkey+network)
                // For now, we keep pubkey to match existing logic, but be aware of collision risk in history if not composite.
                const prevRank = history[n.pubkey]; 
                if (prevRank) {
                    n.trend = prevRank - currentRank;
                }
                newHistory[n.pubkey] = currentRank;
            });

            localStorage.setItem('xandeum_rank_history', JSON.stringify(newHistory));
            setAllNodes(combinedList);
        }
      } catch (err) {
        console.error("Leaderboard Fatal:", err);
        setCreditsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { allNodes, loading, creditsOffline };
};
