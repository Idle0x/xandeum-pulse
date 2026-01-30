import { getForensicHistoryAction } from '../app/actions/getHistory';

// ==========================================
// PART 1: CHART AGGREGATION UTILITIES
// ==========================================

export const consolidateHistory = (data: any[], timeRange: string) => {
  if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
    return data;
  }
  const groups: Record<string, any[]> = {};
  data.forEach(point => {
    const dateObj = new Date(point.date || point.created_at);
    if (isNaN(dateObj.getTime())) return;
    const dateKey = dateObj.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(point);
  });
  return Object.keys(groups).sort().map(dateStr => {
    const dayPoints = groups[dateStr];
    dayPoints.sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());
    const lastPoint = dayPoints[dayPoints.length - 1];
    const avgHealth = dayPoints.reduce((sum, p) => sum + (Number(p.health) || 0), 0) / dayPoints.length;
    const avgUptime = dayPoints.reduce((sum, p) => sum + (Number(p.uptime) || 0), 0) / dayPoints.length;
    const minRank = Math.min(...dayPoints.map(p => p.rank || 999999));
    return {
      ...lastPoint,
      date: dateStr,
      health: Math.round(avgHealth),
      uptime: avgUptime,
      credits: lastPoint.credits,
      storage_committed: lastPoint.storage_committed,
      storage_used: lastPoint.storage_used,
      version: lastPoint.version,
      rank: minRank === 999999 ? 0 : minRank
    };
  });
};

export const consolidateNetworkHistory = (data: any[], timeRange: string) => {
  if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
    return data;
  }
  const groups: Record<string, any[]> = {};
  data.forEach(point => {
    const dateObj = new Date(point.date || point.id); 
    if (isNaN(dateObj.getTime())) return;
    const dateKey = dateObj.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(point);
  });
  return Object.keys(groups).sort().map(dateStr => {
    const dayPoints = groups[dateStr];
    dayPoints.sort((a, b) => new Date(a.date || a.id).getTime() - new Date(b.date || b.id).getTime());
    const lastPoint = dayPoints[dayPoints.length - 1];
    const getAvg = (key: string) => dayPoints.reduce((sum, p) => sum + (Number(p[key]) || 0), 0) / dayPoints.length;
    return {
      ...lastPoint, 
      date: dateStr, 
      avg_health: Math.round(getAvg('avg_health')),
      avg_stability: Math.round(getAvg('avg_stability') * 10) / 10, 
      consensus_score: Math.round(getAvg('consensus_score')),
      avg_credits: getAvg('avg_credits'), 
      mainnet_avg_health: Math.round(getAvg('mainnet_avg_health')),
      mainnet_avg_stability: Math.round(getAvg('mainnet_avg_stability') * 10) / 10,
      mainnet_consensus_score: Math.round(getAvg('mainnet_consensus_score')),
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
  restarts_7d: number;        
  restarts_24h: number;       
  yield_velocity_24h: number; 
  consistency_score: number;  
  frozen_duration_hours: number; 
}

export type NetworkHistoryReport = Map<string, HistoryContext>;

export async function fetchNodeHistoryReport(): Promise<NetworkHistoryReport> {
  const report = new Map<string, HistoryContext>();

  // CACHE UPGRADE: Use the Action instead of direct DB call
  // Fetch 7 Days of data (Forensic Mode)
  let snapshots = [];
  try {
      snapshots = await getForensicHistoryAction(7);
  } catch (e) {
      console.warn("History Aggregation Failed:", e);
      return report;
  }

  if (!snapshots || snapshots.length === 0) {
      return report; 
  }

  const grouped: Record<string, any[]> = {};
  snapshots.forEach((s: any) => {
    if (!grouped[s.node_id]) grouped[s.node_id] = [];
    grouped[s.node_id].push(s);
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  Object.entries(grouped).forEach(([nodeId, history]) => {
    let restarts7d = 0;
    let restarts24h = 0;

    // Forensics for Frozen State
    let currentFrozenStreakMs = 0;

    // Forensics for 24h Velocity
    let minCredits24h = -1;
    let maxCredits24h = 0;

    // --- FIX: DYNAMIC EXPECTATION CALCULATION ---
    // We calculate how long we have actually known about this node ID
    // instead of hardcoding a 7-day expectation.
    const firstPointTime = new Date(history[0].created_at).getTime();
    const lastPointTime = new Date(history[history.length - 1].created_at).getTime();
    
    // Calculate hours between first and last seen point
    const lifespanHours = Math.max(1, (lastPointTime - firstPointTime) / (1000 * 60 * 60));
    
    // If the node is young (< 7 days), expect fewer snapshots.
    // If the node is old (> 7 days), expect the full 168.
    const expected = Math.min(168, lifespanHours);
    // --- END FIX ---

    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1];
      const curr = history[i];
      const prevTime = new Date(prev.created_at).getTime();
      const currTime = new Date(curr.created_at).getTime();
      const timeDiff = currTime - prevTime;

      // 1. Count Restarts (Logic: Uptime dropped significantly)
      if (curr.uptime < prev.uptime - 60) {
        restarts7d++;
        if ((now - currTime) <= oneDayMs) {
            restarts24h++;
        }
        currentFrozenStreakMs = 0; // Reset on restart
      }
      // 2. Frozen Detection
      else if (timeDiff > 1000 * 60 * 30) {
         const uptimeDelta = curr.uptime - prev.uptime;
         if (uptimeDelta === 0 && curr.uptime > 0) {
             currentFrozenStreakMs += timeDiff;
         } else {
             currentFrozenStreakMs = 0;
         }
      }

      // 3. Track 24h Yield Velocity
      if ((now - currTime) <= oneDayMs) {
          const cred = curr.credits || 0;
          if (minCredits24h === -1) minCredits24h = cred;
          if (cred < minCredits24h) minCredits24h = cred;
          if (cred > maxCredits24h) maxCredits24h = cred;
      }
    }

    // 4. Consistency Score
    // Using the dynamic 'expected' value calculated above
    const consistency = Math.min(1, history.length / (expected * 0.8));

    // Calculate final velocity
    const velocity = minCredits24h === -1 ? 0 : Math.max(0, maxCredits24h - minCredits24h);

    // Calculate frozen hours
    const frozenHours = currentFrozenStreakMs / (1000 * 60 * 60);

    report.set(nodeId, {
      restarts_7d: restarts7d,
      restarts_24h: restarts24h,
      yield_velocity_24h: velocity,
      consistency_score: consistency,
      frozen_duration_hours: frozenHours
    });
  });

  return report;
}
