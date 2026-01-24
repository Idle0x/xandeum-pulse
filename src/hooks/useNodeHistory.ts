import { useState, useEffect } from 'react';
import { Node } from '../types';
// Import the Server Action
import { getNodeHistoryAction } from '../app/actions/getHistory';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useMultiNodeHistory = (nodes: Node[], timeRange: HistoryTimeRange = '7D') => {
  const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no nodes selected, clear map and return
    if (nodes.length === 0) {
      setHistoryMap({});
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchAll() {
      // 1. Calculate Start Date (Days)
      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;
      if (timeRange === 'ALL') days = 365;

      // 2. Parallel Fetching Strategy (Through Server Cache)
      const requests = nodes.map(async (node) => {
          // Standardize ID Generation to match your Backend/Server Action
          const ipOnly = node.address && node.address.includes(':') 
            ? node.address.split(':')[0] 
            : (node.address || '0.0.0.0');
          
          const network = node.network || 'MAINNET';
          const stableId = `${node.pubkey}-${ipOnly}-${network}`;

          try {
            // Call Server Action
            const data = await getNodeHistoryAction(stableId, network, days);
            
            // Map the raw server data to the format your charts expect
            const cleanData = (data || []).map((row: any) => ({
              created_at: row.created_at,
              health: Number(row.health || 0),
              uptime: Number(row.uptime || 0),
              storage_committed: Number(row.storage_committed || 0),
              storage_used: Number(row.storage_used || 0),
              credits: Number(row.credits || 0)
            }));

            return { pubkey: node.pubkey, data: cleanData };
          } catch (err) {
            console.error(`Failed to fetch history for ${node.pubkey}:`, err);
            return { pubkey: node.pubkey, data: [] };
          }
      });

      // Wait for all cached requests to finish
      const results = await Promise.all(requests);

      if (isMounted) {
          const newMap: Record<string, any[]> = {};
          results.forEach(res => {
              if (res.pubkey) newMap[res.pubkey] = res.data;
          });
          setHistoryMap(newMap);
          setLoading(false);
      }
    }

    fetchAll();

    return () => { isMounted = false; };
  }, [nodes, timeRange]); 

  return { historyMap, loading };
};
