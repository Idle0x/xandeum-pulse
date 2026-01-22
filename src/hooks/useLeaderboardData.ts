// src/hooks/useLeaderboardData.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { RankedNode } from '../types/leaderboard';

export const useLeaderboardData = () => {
  const [allNodes, setAllNodes] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsOffline, setCreditsOffline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel data fetching
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits').catch(() => ({ data: [] })), 
          axios.get('/api/stats').catch(() => ({ data: { result: { pods: [] } } }))
        ]);

        // 1. UPDATED: Map now stores Version and Is_Public too
        const metaMap = new Map<string, { 
            address: string, 
            location?: any, 
            health: number,
            version: string,    // <--- NEW
            is_public: boolean  // <--- NEW
        }>();

        if (statsRes.data?.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                // We use the first instance we find for this pubkey
                if (!metaMap.has(node.pubkey)) {
                    metaMap.set(node.pubkey, { 
                        address: node.address, 
                        location: node.location,
                        health: node.health || 0,
                        version: node.version || '0.0.0', // <--- CAPTURE VERSION
                        is_public: node.is_public ?? false // <--- CAPTURE IS_PUBLIC
                    });
                }
            });
        }

        // 2. Process Raw Credits Data
        const rawData = creditsRes.data.pods_credits || creditsRes.data;

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
             setCreditsOffline(true);
             setAllNodes([]); 
        } else {
            setCreditsOffline(false);

            // 3. Handle Historical Trends
            let history: Record<string, number> = {};
            try {
                const h = localStorage.getItem('xandeum_rank_history');
                if (h) history = JSON.parse(h);
            } catch (e) {
                console.warn("Failed to parse rank history", e);
            }
            const newHistory: Record<string, number> = {};

            // 4. UPDATED: Merge Data with Version/IsPublic
            const parsedList: RankedNode[] = rawData.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = metaMap.get(pKey);

                return {
                    pubkey: pKey,
                    credits: Number(item.credits || 0),
                    health: meta?.health || 0,
                    network: item.network || 'MAINNET',
                    rank: 0, 
                    address: meta?.address,
                    location: meta?.location,
                    
                    // 👇 CRITICAL FIX FOR HISTORY HOOK 👇
                    version: meta?.version || '0.0.0', 
                    is_public: meta?.is_public ?? false, 

                    trend: 0 
                };
            });

            // 5. Sort
            parsedList.sort((a, b) => b.credits - a.credits || b.health - a.health);

            // 6. Assign Ranks
            parsedList.forEach((n, i) => {
                const currentRank = i + 1;
                n.rank = currentRank;

                const prevRank = history[n.pubkey];
                if (prevRank) {
                    n.trend = prevRank - currentRank;
                }
                newHistory[n.pubkey] = currentRank;
            });

            localStorage.setItem('xandeum_rank_history', JSON.stringify(newHistory));
            setAllNodes(parsedList);
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
