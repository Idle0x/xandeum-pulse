import { useMemo } from 'react';
import { Node } from '../types';

export const useDashboardStats = (
  nodes: Node[], 
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET',
  totalStorageCommitted: number,
  totalStorageUsed: number
) => {
  
  // 1. Capacity Logic (Split Calculation)
  const splitStats = useMemo(() => {
    let mainnetC = 0, mainnetU = 0;
    let devnetC = 0, devnetU = 0;

    nodes.forEach(n => {
        if (n.network === 'MAINNET') {
            mainnetC += (n.storage_committed || 0);
            mainnetU += (n.storage_used || 0);
        } else if (n.network === 'DEVNET') {
            devnetC += (n.storage_committed || 0);
            devnetU += (n.storage_used || 0);
        }
    });

    return { mainnetC, mainnetU, devnetC, devnetU };
  }, [nodes]);

  // 2. Vitals Logic (Context Aware)
  const vitalsStats = useMemo(() => {
    const targetNodes = networkFilter === 'ALL' 
      ? nodes 
      : nodes.filter(n => n.network === networkFilter);
    const count = targetNodes.length || 1;

    const totalHealth = targetNodes.reduce((acc, n) => acc + (n.health || 0), 0);
    const avg = Math.round(totalHealth / count);

    const stable = targetNodes.filter(n => (n.uptime || 0) > 86400).length;
    const stability = ((stable / count) * 100).toFixed(2);

    return { avg, stability };
  }, [nodes, networkFilter]);

  // 3. Consensus Logic (Context Aware)
  const consensusStats = useMemo(() => {
    const targetNodes = networkFilter === 'ALL' 
      ? nodes 
      : nodes.filter(n => n.network === networkFilter);
    const count = targetNodes.length || 1;

    const versionMap: Record<string, number> = {};
    targetNodes.forEach(n => {
       const v = n.version || 'Unknown';
       versionMap[v] = (versionMap[v] || 0) + 1;
    });
    
    const sorted = Object.entries(versionMap).sort((a, b) => b[1] - a[1]);
    const winnerVer = sorted[0]?.[0] || 'N/A';
    const winnerCount = sorted[0]?.[1] || 0;
    const score = ((winnerCount / count) * 100).toFixed(1);
    
    return { version: winnerVer, score };
  }, [nodes, networkFilter]);

  // 4. Display Values
  const isGlobalView = networkFilter === 'ALL';
  const displayCommitted = isGlobalView ? totalStorageCommitted : (networkFilter === 'MAINNET' ? splitStats.mainnetC : splitStats.devnetC);
  const displayUsed = isGlobalView ? totalStorageUsed : (networkFilter === 'MAINNET' ? splitStats.mainnetU : splitStats.devnetU);

  return {
    vitalsStats,
    consensusStats,
    displayCommitted,
    displayUsed,
    isGlobalView
  };
};
