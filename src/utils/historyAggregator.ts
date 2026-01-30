// REMOVED: import { getForensicHistoryAction } from '../app/actions/getHistory';
// ADDED: Direct DB Access to bypass potential caching issues during this fix
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  // --- NUCLEAR OPTION: DIRECT DB FETCH (Bypassing getHistory Cache) ---
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const { data: snapshots, error } = await supabase
    .from('node_snapshots')
    .select('node_id, uptime, credits, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
      console.error("🔥 FATAL: DB Fetch Error in Aggregator:", error.message);
      return report;
  }

  if (!snapshots || snapshots.length === 0) {
      console.warn("⚠️ No history snapshots found.");
      return report; 
  }

  const grouped: Record<string, any[]> = {};
  snapshots.forEach((s: any) => {
    if (!grouped[s.node_id]) grouped[s.node_id] = [];
    grouped[s.node_id].push(s);
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  let debugLogCount = 0; // Only log first 3 nodes to avoid spam

  Object.entries(grouped).forEach(([nodeId, history]) => {
    let restarts7d = 0;
    let restarts24h = 0;
    let currentFrozenStreakMs = 0;
    let minCredits24h = -1;
    let maxCredits24h = 0;

    // --- FIX 2: ROBUST LIFESPAN CALCULATION ---
    const firstPointTime = new Date(history[0].created_at).getTime();
    const lastPointTime = new Date(history[history.length - 1].created_at).getTime();
    
    // Ensure we don't get NaN if dates are weird
    if (isNaN(firstPointTime) || isNaN(lastPointTime)) {
        // Fallback for bad data
        report.set(nodeId, { restarts_7d: 0, restarts_24h: 0, yield_velocity_24h: 0, consistency_score: 1, frozen_duration_hours: 0 });
        return;
    }

    const lifespanHours = Math.max(0.1, (lastPointTime - firstPointTime) / (1000 * 60 * 60));
    
    // --- FIX 3: THE "NEW NODE" SAFETY GUARD ---
    // If a node is younger than 24 hours, FORCE 100% consistency.
    // This stops "0.00" on new deployments instantly.
    const isNewNode = lifespanHours < 24;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1];
      const curr = history[i];
      const prevTime = new Date(prev.created_at).getTime();
      const currTime = new Date(curr.created_at).getTime();
      const timeDiff = currTime - prevTime;

      // 1. Count Restarts
      if (curr.uptime < prev.uptime - 60) {
        restarts7d++;
        if ((now - currTime) <= oneDayMs) {
            restarts24h++;
        }
        currentFrozenStreakMs = 0; 
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

    // --- FIX 4: CONSISTENCY CALCULATION ---
    let consistency = 1;

    if (isNewNode) {
        consistency = 1; // Free pass for new nodes
    } else {
        // Standard logic for older nodes
        const expected = Math.min(168, lifespanHours); 
        // Prevent division by zero if expected is somehow 0
        const safeExpected = Math.max(1, expected);
        consistency = Math.min(1, history.length / (safeExpected * 0.8));
    }
    
    // Final NaN Guard
    if (isNaN(consistency)) consistency = 1;

    const velocity = minCredits24h === -1 ? 0 : Math.max(0, maxCredits24h - minCredits24h);
    const frozenHours = currentFrozenStreakMs / (1000 * 60 * 60);

    // --- SERVER LOGGING (Check your terminal) ---
    if (debugLogCount < 3) {
       console.log(`[Aggregator] Node: ${nodeId.substring(0, 15)}... | Lifespan: ${lifespanHours.toFixed(2)}h | IsNew: ${isNewNode} | Snapshots: ${history.length} | Score: ${consistency}`);
       debugLogCount++;
    }

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
