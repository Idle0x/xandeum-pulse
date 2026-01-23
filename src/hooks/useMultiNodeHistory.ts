import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Node } from '../types';

export type HistoryTimeRange = '24H' | '3D' | '7D' | '30D' | 'ALL';

export const useMultiNodeHistory = (nodes: Node[], timeRange: HistoryTimeRange = '7D') => {
  const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nodes.length === 0) return;

    let isMounted = true;
    setLoading(true);

    async function fetchAll() {
      // 1. Calculate Start Date
      let days = 7;
      if (timeRange === '24H') days = 1;
      if (timeRange === '3D') days = 3;
      if (timeRange === '30D') days = 30;
      if (timeRange === 'ALL') days = 3650;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const isoStart = startDate.toISOString();

      // 2. Parallel Fetching Strategy
      // We fetch all requests simultaneously using Promise.all
      const requests = nodes.map(async (node) => {
          const versionSafe = node.version || '0.0.0'; 
          const stableId = `${node.pubkey}-${node.address}-${versionSafe}-${node.is_public}`;
          
          const { data } = await supabase
            .from('node_snapshots')
            .select('created_at, health, uptime, storage_committed, storage_used, credits')
            .eq('node_id', stableId)
            .gte('created_at', isoStart)
            .order('created_at', { ascending: true });
            
          return { pubkey: node.pubkey, data: data || [] };
      });

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
  }, [nodes, timeRange]); // Re-fetches only if node list or time range changes

  return { historyMap, loading };
};
