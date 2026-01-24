import { useState, useEffect } from 'react';
// Import the Server Action (Cached) instead of Supabase
import { getNetworkHistoryAction } from '../app/actions/getHistory';

export interface NetworkHistoryPoint {
  date: string;
  value: number;
}

export const useNetworkHistory = (
  metric: 'total_capacity' | 'avg_health' | 'consensus_score', 
  days = 30
) => {
  const [data, setData] = useState<NetworkHistoryPoint[]>([]);
  const [growth, setGrowth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      setLoading(true);

      try {
        // 1. Call Server Action (Hits the RAM Cache)
        // We fetch the full dataset, then filter for the specific metric we need.
        const rows = await getNetworkHistoryAction(days);

        if (!isMounted) return;

        if (!rows || rows.length === 0) {
          setData([]);
          setGrowth(0);
          setLoading(false);
          return;
        }

        // 2. Process Data (Map locally)
        const processed = rows.map((r: any) => ({
          date: new Date(r.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: Number(r[metric] || 0)
        }));

        // 3. Calculate Growth (Last vs First)
        if (processed.length > 0) {
          const first = processed[0].value;
          const last = processed[processed.length - 1].value;
          
          // Safe percentage calc
          let percentChange = 0;
          if (first > 0) {
            percentChange = ((last - first) / first) * 100;
          } else {
            percentChange = last > 0 ? 100 : 0;
          }
          
          setGrowth(percentChange);
        } else {
          setGrowth(0);
        }

        setData(processed);
      } catch (err) {
        console.error("Failed to fetch history widget:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();

    return () => { isMounted = false; };
  }, [metric, days]);

  return { history: data, growth, loading };
};
