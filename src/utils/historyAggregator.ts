import { supabase } from '../lib/supabase';

// ==========================================
// PART 1: CHART AGGREGATION UTILITIES
// ==========================================

/**
 * Aggregates Node History (Health, Uptime, Rank, etc.)
 * Used by: useNodeHistory
 */
export const consolidateHistory = (data: any[], timeRange: string) => {
  // 1. For High-Res windows, return raw hourly data
  if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
    return data;
  }

  // 2. For Long-Term windows, group by Date (YYYY-MM-DD)
  const groups: Record<string, any[]> = {};

  data.forEach(point => {
    const dateObj = new Date(point.date || point.created_at);
    if (isNaN(dateObj.getTime())) return;

    const dateKey = dateObj.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(point);
  });

  // 3. Flatten into Daily Summaries
  return Object.keys(groups).sort().map(dateStr => {
    const dayPoints = groups[dateStr];

    // Sort chronological
    dayPoints.sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());

    const lastPoint = dayPoints[dayPoints.length - 1];

    // AVERAGE these fields
    const avgHealth = dayPoints.reduce((sum, p) => sum + (Number(p.health) || 0), 0) / dayPoints.length;
    const avgUptime = dayPoints.reduce((sum, p) => sum + (Number(p.uptime) || 0), 0) / dayPoints.length;

    // MINIMUM (Best) for Rank
    const minRank = Math.min(...dayPoints.map(p => p.rank || 999999));

    return {
      ...lastPoint,
      date: dateStr,
      health: Math.round(avgHealth),
      uptime: avgUptime,
      
      // LAST VALUE for these (Accumulators)
      credits: lastPoint.credits,
      storage_committed: lastPoint.storage_committed,
      storage_used: lastPoint.storage_used,
      
      // NEW: Preserve the Version String
      version: lastPoint.version,

      rank: minRank === 999999 ? 0 : minRank
    };
  });
};

/**
 * Aggregates Network History (Global Capacity, Consensus, Stability, etc.)
 * Used by: useNetworkHistory
 */
export const consolidateNetworkHistory = (data: any[], timeRange: string) => {
  // 1. High Resolution (Hourly) - Return Raw
  if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
    return data;
  }

  // 2. Group by Date
  const groups: Record<string, any[]> = {};

  data.forEach(point => {
    // Supabase often uses 'id' as timestamp for network snapshots, check both
    const dateObj = new Date(point.date || point.id); 
    if (isNaN(dateObj.getTime())) return;

    const dateKey = dateObj.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(point);
  });

  // 3. Flatten to Daily Summaries
  return Object.keys(groups).sort().map(dateStr => {
    const dayPoints = groups[dateStr];

    // Sort chronological to get the true "Close" value of the day
    dayPoints.sort((a, b) => new Date(a.date || a.id).getTime() - new Date(b.date || b.id).getTime());

    const lastPoint = dayPoints[dayPoints.length - 1];

    // HELPER: Calculate Average for a specific field
    const getAvg = (key: string) => dayPoints.reduce((sum, p) => sum + (Number(p[key]) || 0), 0) / dayPoints.length;

    return {
      ...lastPoint, // Default to "Closing Value" for counts (Nodes, Capacity, Used, Credits)
      date: dateStr, 

      // OVERRIDES: Fields that should be Averages, not Closing Values

      // Global Averages
      avg_health: Math.round(getAvg('avg_health')),
      avg_stability: Math.round(getAvg('avg_stability') * 10) / 10, // Keep 1 decimal
      consensus_score: Math.round(getAvg('consensus_score')),
      avg_credits: getAvg('avg_credits'), // Keep precision

      // Mainnet Averages
      mainnet_avg_health: Math.round(getAvg('mainnet_avg_health')),
      mainnet_avg_stability: Math.round(getAvg('mainnet_avg_stability') * 10) / 10,
      mainnet_consensus_score: Math.round(getAvg('mainnet_consensus_score')),

      // Devnet Averages
      devnet_avg_health: Math.round(getAvg('devnet_avg_health')),
      devnet_avg_stability: Math.round(getAvg('devnet_avg_stability') * 10) / 10,
      devnet_consensus_score: Math.round(getAvg('devnet_consensus_score')),
    };
  });
};

// ==========================================
// PART 2: VITALITY SCORING AGGREGATOR
// ==========================================

export interface HistoryContext {
  restarts_24h: number;
  yield_velocity_24h: number; 
  consistency_score: number;  
}

export type NetworkHistoryReport = Map<string, HistoryContext>;

export async function fetchNodeHistoryReport(): Promise<NetworkHistoryReport> {
  const report = new Map<string, HistoryContext>();

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: snapshots, error } = await supabase
    .from('node_snapshots')
    .select('node_id, uptime, credits, created_at')
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error || !snapshots) {
    console.warn("History Aggregation Failed:", error?.message);
    return report; 
  }

  const grouped: Record<string, any[]> = {};
  snapshots.forEach(s => {
    if (!grouped[s.node_id]) grouped[s.node_id] = [];
    grouped[s.node_id].push(s);
  });

  Object.entries(grouped).forEach(([nodeId, history]) => {
    let restarts = 0;
    let minCredits = history[0]?.credits || 0;
    let maxCredits = history[0]?.credits || 0;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1].uptime;
      const curr = history[i].uptime;

      if (curr < prev - 60) {
        restarts++;
      }

      const cred = history[i].credits || 0;
      if (cred !== null) {
          if (cred < minCredits) minCredits = cred;
          if (cred > maxCredits) maxCredits = cred;
      }
    }

    const consistency = Math.min(1, history.length / 20); 

    report.set(nodeId, {
      restarts_24h: restarts,
      yield_velocity_24h: Math.max(0, maxCredits - minCredits),
      consistency_score: consistency
    });
  });

  return report;
}
