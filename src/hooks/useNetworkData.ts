import { useState, useEffect } from 'react';
// Import the Server Action to hit RAM cache
import { getNetworkHistoryAction } from '../app/actions/getHistory';

export const useNetworkData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLatest() {
      try {
        // Request just 1 day of history to get the absolute latest snapshot
        const history = await getNetworkHistoryAction(1);
        
        if (!isMounted) return;

        if (history && history.length > 0) {
          // The last item in the array is the most recent "Live" snapshot
          const raw = history[history.length - 1];

          // Map the raw DB columns to a clean object for the UI
          const cleanData = {
            // --- CORE METRICS ---
            total_nodes: Number(raw.total_nodes || 0),
            total_capacity: Number(raw.total_capacity || 0),
            total_used: Number(raw.total_used || 0),
            
            // --- HEALTH & STABILITY (The Fix) ---
            // Health = Algo Score, Stability = Uptime
            avg_health: Number(raw.avg_health || 0),
            avg_stability: Number(raw.avg_stability || 0), 

            // --- FINANCIALS (The New Update) ---
            total_credits: Number(raw.total_credits || 0),
            avg_credits: Number(raw.avg_credits || 0),
            top10_dominance: Number(raw.top10_dominance || 0),

            // --- MAINNET SPECIFIC ---
            mainnet_nodes: Number(raw.mainnet_nodes || 0),
            mainnet_capacity: Number(raw.mainnet_capacity || 0),
            mainnet_avg_health: Number(raw.mainnet_avg_health || 0),
            mainnet_avg_stability: Number(raw.mainnet_avg_stability || 0), // <--- Vital
            mainnet_credits: Number(raw.mainnet_credits || 0),             // <--- New

            // --- DEVNET SPECIFIC ---
            devnet_nodes: Number(raw.devnet_nodes || 0),
            devnet_capacity: Number(raw.devnet_capacity || 0),
            devnet_avg_health: Number(raw.devnet_avg_health || 0),
            devnet_avg_stability: Number(raw.devnet_avg_stability || 0),   // <--- Vital
            devnet_credits: Number(raw.devnet_credits || 0),               // <--- New

            // --- CONSENSUS ---
            consensus_version: raw.consensus_version || '0.0.0',
            consensus_score: Number(raw.consensus_score || 0),
            
            // Timestamp
            updated_at: raw.id
          };

          setData(cleanData);
        }
      } catch (err) {
        console.error("Failed to fetch live network data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLatest();
    return () => { isMounted = false; };
  }, []);

  return { data, loading };
};
