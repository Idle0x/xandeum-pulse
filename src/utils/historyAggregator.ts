import { supabase } from '../lib/supabase';

export interface HistoryContext {
  restarts_24h: number;
  yield_velocity_24h: number; // Credits earned in last 24h
  consistency_score: number;  // 0.0 - 1.0 (Availability)
}

export type NetworkHistoryReport = Map<string, HistoryContext>;

/**
 * Fetches a "Report Card" for all nodes based on the last 24 hours of history.
 * Used to penalize volatility (restarts) and reward active earners (velocity).
 */
export async function fetchNodeHistoryReport(): Promise<NetworkHistoryReport> {
  const report = new Map<string, HistoryContext>();
  
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // 1. Fetch all snapshots from the last 24h
  // We select minimal fields to keep it fast
  const { data: snapshots, error } = await supabase
    .from('node_snapshots')
    .select('node_id, uptime, credits, created_at')
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error || !snapshots) {
    console.warn("History Aggregation Failed:", error?.message);
    return report; // Return empty map on failure (fallback to snapshot scoring)
  }

  // 2. Group by Node ID
  const grouped: Record<string, any[]> = {};
  snapshots.forEach(s => {
    if (!grouped[s.node_id]) grouped[s.node_id] = [];
    grouped[s.node_id].push(s);
  });

  // 3. Analyze Each Node
  Object.entries(grouped).forEach(([nodeId, history]) => {
    let restarts = 0;
    let minCredits = history[0]?.credits || 0;
    let maxCredits = history[0]?.credits || 0;

    // Detect Restarts: Look for drops in uptime > 60s
    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1].uptime;
      const curr = history[i].uptime;
      
      if (curr < prev - 60) {
        restarts++;
      }

      // Track Credit Range
      const cred = history[i].credits || 0;
      if (cred < minCredits) minCredits = cred;
      if (cred > maxCredits) maxCredits = cred;
    }

    // Detect Consistency (Ghosting)
    // Assuming 1 snapshot per hour ideal (24 points). If we have < 12, penalty.
    // This is a rough heuristic based on snapshot frequency.
    const consistency = Math.min(1, history.length / 20); 

    report.set(nodeId, {
      restarts_24h: restarts,
      yield_velocity_24h: Math.max(0, maxCredits - minCredits),
      consistency_score: consistency
    });
  });

  return report;
}
