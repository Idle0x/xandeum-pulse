import { NodeHistoryPoint } from '../hooks/useNodeHistory';

export type VitalityState = 'OFFLINE' | 'STAGNANT' | 'UNSTABLE' | 'WARMUP' | 'ONLINE';

export interface VitalityConfig {
  state: VitalityState;
  color: string;
  label: string;
  textColor: string;
  icon?: any;
}

/**
 * PURE FORENSIC ANALYSIS
 * Determines the state of a node at a specific point in time based on historical context.
 */
export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  prevPoint: NodeHistoryPoint | undefined,
  oneHourAgoPoint: NodeHistoryPoint | undefined
): VitalityConfig => {
  
  // 1. OFFLINE CHECK (The Dead Zone)
  if (!point || point.health === 0) {
    return { state: 'OFFLINE', color: 'bg-zinc-800', label: 'OFFLINE', textColor: 'text-zinc-500' };
  }

  const currUptime = point.uptime || 0;
  const prevUptime = prevPoint?.uptime || 0;

  // 2. UNSTABLE CHECK (The Crash Event)
  // If uptime dropped significantly compared to the immediate previous point
  if (prevPoint && currUptime < prevUptime - 60) {
     return { state: 'UNSTABLE', color: 'bg-orange-500', label: 'CRASH/RESET', textColor: 'text-orange-400' };
  }

  // 3. STAGNANT CHECK (The Zombie Process)
  // If we have a point from ~1 hour ago, and the uptime hasn't moved, but time has passed.
  if (oneHourAgoPoint) {
      const timeDiffSeconds = (new Date(point.date).getTime() - new Date(oneHourAgoPoint.date).getTime()) / 1000;
      const uptimeDiff = currUptime - oneHourAgoPoint.uptime;
      
      // If 1 hour passed real-time, but uptime grew less than 60 seconds
      if (timeDiffSeconds > 3000 && uptimeDiff < 60 && currUptime > 1000) {
          return { state: 'STAGNANT', color: 'bg-yellow-500', label: 'STAGNANT', textColor: 'text-yellow-400' };
      }
  }

  // 4. WARMUP CHECK (The Boot Phase)
  // If uptime is less than 30 minutes
  if (currUptime < 30 * 60) {
      return { state: 'WARMUP', color: 'bg-blue-500', label: 'WARMING UP', textColor: 'text-blue-400' };
  }

  // 5. ONLINE CHECK (Stable)
  return { state: 'ONLINE', color: 'bg-green-500', label: 'STABLE', textColor: 'text-green-400' };
};
