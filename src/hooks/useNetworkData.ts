import { useState, useEffect } from 'react';
import axios from 'axios';
import { Node } from '../types';

interface NetworkDataState {
  nodes: Node[];
  loading: boolean;
  isBackgroundSyncing: boolean;
  error: string;
  lastSync: string;
  networkStats: {
    avgBreakdown: any;
    totalNodes: number;
    systemStatus: { credits: boolean; rpc: boolean };
    consensusVersion: '0.0.0' | string;
    medianStorage: number;

    // --- NEW: Vitals & Financials ---
    totalCredits: number;
    avgStability: number; // Global Uptime Average

    mainnet: {
        nodes: number;
        credits: number;
        avgStability: number;
        capacity: number;
    };
    devnet: {
        nodes: number;
        credits: number;
        avgStability: number;
        capacity: number;
    };
  };
  mostCommonVersion: string;
  totalStorageCommitted: number;
  totalStorageUsed: number;
  medianCommitted: number;
  networkHealth: string;     
  avgNetworkHealth: number;  
  networkConsensus: number;
}

export const useNetworkData = (onNewNodes?: (count: number) => void) => {
  const [data, setData] = useState<NetworkDataState>({
    nodes: [],
    loading: true,
    isBackgroundSyncing: false,
    error: '',
    lastSync: 'Syncing...',
    networkStats: {
      avgBreakdown: {},
      totalNodes: 0,
      systemStatus: { credits: true, rpc: true },
      consensusVersion: '0.0.0',
      medianStorage: 0,
      totalCredits: 0,
      avgStability: 0,
      mainnet: { nodes: 0, credits: 0, avgStability: 0, capacity: 0 },
      devnet: { nodes: 0, credits: 0, avgStability: 0, capacity: 0 },
    },
    mostCommonVersion: 'N/A',
    totalStorageCommitted: 0,
    totalStorageUsed: 0,
    medianCommitted: 0,
    networkHealth: '0.00',
    avgNetworkHealth: 0,
    networkConsensus: 0,
  });

  const fetchData = async (mode: 'fast' | 'swarm' = 'fast') => {
    if (mode === 'fast') setData(prev => ({ ...prev, loading: true }));
    else setData(prev => ({ ...prev, isBackgroundSyncing: true }));

    try {
      // 1. PARALLEL FETCH
      const [res, creditsRes] = await Promise.all([
        axios.get(`/api/stats?mode=${mode}&t=${Date.now()}`),
        axios.get('/api/credits').catch(() => ({ data: { mainnet: [], devnet: [] } }))
      ]);

      if (res.data.result && res.data.result.pods) {
        let rawPods = res.data.result.pods as Node[];
        const stats = res.data.stats;

        // 2. RAW CREDIT EXTRACTION (The Fix)
        // We calculate total credits from the Raw API, not the filtered Pod list.
        const rawMainnetCredits = (creditsRes.data.mainnet || []) as any[];
        const rawDevnetCredits = (creditsRes.data.devnet || []) as any[];
        
        // Calculate TRUE totals (Public + Ghosts)
        const trueMainnetTotal = rawMainnetCredits.reduce((sum, c) => sum + Number(c.credits || 0), 0);
        const trueDevnetTotal = rawDevnetCredits.reduce((sum, c) => sum + Number(c.credits || 0), 0);
        const trueGlobalTotal = trueMainnetTotal + trueDevnetTotal;

        // 3. MERGE CREDITS FOR VISUAL LIST
        const creditMap = new Map<string, number>();
        [...rawMainnetCredits, ...rawDevnetCredits].forEach((c: any) => {
            const key = c.pod_id || c.pubkey;
            if (key) creditMap.set(key, Number(c.credits || 0));
        });

        const isCreditsApiOffline = rawMainnetCredits.length === 0 && rawDevnetCredits.length === 0;

        const podList = rawPods.map(node => {
            const creditValue = creditMap.get(node.pubkey || '');
            return {
                ...node,
                credits: creditValue !== undefined ? creditValue : (isCreditsApiOffline ? null : 0)
            };
        });

        // --- Logic: Rank & Cluster Calculations ---
        const sortFn = (a: Node, b: Node) => {
          if ((b.credits || 0) !== (a.credits || 0))
            return (b.credits || 0) - (a.credits || 0);
          if ((b.health || 0) !== (a.health || 0)) return (b.health || 0) - (a.health || 0);
          return (a.pubkey || '').localeCompare(b.pubkey || '');
        };

        const clusterMap = new Map<string, { mainnet: number; devnet: number }>();
        podList.forEach(node => {
          if (!node.pubkey) return;
          const current = clusterMap.get(node.pubkey) || { mainnet: 0, devnet: 0 };
          if (node.network === 'MAINNET') current.mainnet++;
          if (node.network === 'DEVNET') current.devnet++;
          clusterMap.set(node.pubkey, current);
        });

        const mainnetNodes = podList.filter(n => n.network === 'MAINNET').sort(sortFn);
        const devnetNodes = podList.filter(n => n.network === 'DEVNET').sort(sortFn);
        const rankMap = new Map<string, number>();

        mainnetNodes.forEach((node, idx) => { if (node.pubkey) rankMap.set(`${node.pubkey}-MAINNET`, idx + 1); });
        devnetNodes.forEach((node, idx) => { if (node.pubkey) rankMap.set(`${node.pubkey}-DEVNET`, idx + 1); });

        const processedNodes = podList.map(node => {
          const used = node.storage_used || 0;
          const cap = node.storage_committed || 0;
          let percentStr = '0%';
          let rawPercent = 0;
          if (cap > 0 && used > 0) {
            rawPercent = (used / cap) * 100;
            percentStr = rawPercent < 0.01 ? '< 0.01%' : `${rawPercent.toFixed(2)}%`;
          }
          const compositeKey = `${node.pubkey}-${node.network}`;
          const cluster = clusterMap.get(node.pubkey || '') || { mainnet: 0, devnet: 0 };
          return {
            ...node,
            rank: node.pubkey ? rankMap.get(compositeKey) || 0 : 0,
            storage_usage_percentage: percentStr,
            storage_usage_raw: rawPercent,
            clusterStats: {
              totalGlobal: cluster.mainnet + cluster.devnet,
              mainnetCount: cluster.mainnet,
              devnetCount: cluster.devnet,
            },
          };
        });

        if (mode === 'swarm' && processedNodes.length > data.nodes.length && data.nodes.length > 0) {
          if (onNewNodes) onNewNodes(processedNodes.length - data.nodes.length);
        }

        const stableNodes = processedNodes.filter(n => (n.uptime || 0) > 86400).length;
        const consensusCount = processedNodes.filter(n => (n.version || 'Unknown') === (stats?.consensusVersion || '0.0.0')).length;

        // --- CALC STATS (Capacity & Stability from RPC list, Credits from RAW list) ---
        const calcStats = (nodes: Node[], trueCredits: number) => ({
            nodes: nodes.length,
            credits: trueCredits, // <--- USE TRUE CREDITS
            capacity: nodes.reduce((a, b) => a + (b.storage_committed || 0), 0),
            avgStability: nodes.length > 0 ? nodes.reduce((a, b) => a + (b.uptime || 0), 0) / nodes.length : 0
        });

        const mainStats = calcStats(mainnetNodes, trueMainnetTotal);
        const devStats = calcStats(devnetNodes, trueDevnetTotal);
        const globalStability = processedNodes.length > 0 
            ? processedNodes.reduce((a, b) => a + (b.uptime || 0), 0) / processedNodes.length 
            : 0;

        setData({
          nodes: processedNodes,
          loading: false,
          isBackgroundSyncing: false,
          error: '',
          lastSync: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),

          networkStats: {
              ...(stats || data.networkStats),
              // Inject TRUE Vitals
              totalCredits: trueGlobalTotal, // <--- USE TRUE GLOBAL TOTAL
              avgStability: globalStability,
              mainnet: mainStats,
              devnet: devStats
          },

          mostCommonVersion: stats?.consensusVersion || 'N/A',
          totalStorageCommitted: processedNodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0),
          totalStorageUsed: processedNodes.reduce((sum, n) => sum + (n.storage_used || 0), 0),
          medianCommitted: stats?.medianStorage || 0,
          networkHealth: (processedNodes.length > 0 ? (stableNodes / processedNodes.length) * 100 : 0).toFixed(2),
          avgNetworkHealth: stats?.avgBreakdown?.total || 0,
          networkConsensus: (consensusCount / processedNodes.length) * 100,
        });

        if (mode === 'fast') fetchData('swarm');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        isBackgroundSyncing: false,
        error: mode === 'fast' ? 'Syncing latest network data...' : ''
      }));
    }
  };

  useEffect(() => {
    fetchData('fast');
    const interval = setInterval(() => fetchData('swarm'), 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...data, refetch: () => fetchData('fast') };
};
