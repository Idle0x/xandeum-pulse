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

        // 1. Create a Map for quick metadata lookup (Address, IP, Location)
        const metaMap = new Map<string, { address: string, location?: any, health: number }>();
        if (statsRes.data?.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                metaMap.set(node.pubkey, { 
                    address: node.address, 
                    location: node.location,
                    health: node.health || 0 
                });
            });
        }

        // 2. Process Raw Credits Data
        const rawData = creditsRes.data.pods_credits || creditsRes.data;

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
             setCreditsOffline(true);
             setAllNodes([]); 
        } else {
            setCreditsOffline(false);
            
            // 3. Handle Historical Trends (Rank Changes)
            let history: Record<string, number> = {};
            try {
                const h = localStorage.getItem('xandeum_rank_history');
                if (h) history = JSON.parse(h);
            } catch (e) {
                console.warn("Failed to parse rank history", e);
            }
            const newHistory: Record<string, number> = {};

            // 4. Merge Data
            const parsedList: RankedNode[] = rawData.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = metaMap.get(pKey);
                
                return {
                    pubkey: pKey,
                    credits: Number(item.credits || 0),
                    health: meta?.health || 0,
                    network: item.network || 'MAINNET',
                    rank: 0, // Will be assigned after sort
                    address: meta?.address,
                    location: meta?.location,
                    trend: 0 // Will be calculated below
                };
            });

            // 5. Sort (Credits High -> Low, then Health High -> Low)
            parsedList.sort((a, b) => b.credits - a.credits || b.health - a.health);

            // 6. Assign Ranks and Calculate Trends
            parsedList.forEach((n, i) => {
                const currentRank = i + 1;
                n.rank = currentRank;
                
                const prevRank = history[n.pubkey];
                if (prevRank) {
                    n.trend = prevRank - currentRank; // Positive = moved up, Negative = moved down
                }
                newHistory[n.pubkey] = currentRank;
            });

            // Save new history for next visit
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
