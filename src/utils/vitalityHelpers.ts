import { NodeHistoryPoint } from '../hooks/useNodeHistory';

// Define the "Forensic States"
export type VitalityState = 'OFFLINE' | 'STAGNANT' | 'UNSTABLE' | 'TRAUMA' | 'WARMUP' | 'ONLINE';

export interface VitalityAnalysis {
  state: VitalityState;
  color: string;     // Tailwind bg class
  textColor: string; // Tailwind text class
  label: string;
}

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  prevPoint?: NodeHistoryPoint,
  oneHourAgoPoint?: NodeHistoryPoint
): VitalityAnalysis => {
  
  // 1. PRIORITY 1: OFFLINE (The Void)
  if (point.uptime === 0 || point.health === 0) {
    return { 
      state: 'OFFLINE', 
      color: 'bg-zinc-800', 
      textColor: 'text-zinc-500', 
      label: 'OFFLINE' 
    };
  }

  // 2. PRIORITY 2: TRAUMA (High Penalty)
  // If the node has active penalties > 10 points (meaning > 3 restarts recently)
  // Note: We check if penalties exist on the point object
  const penalty = (point as any).penalties?.restarts || 0;
  if (penalty > 10) {
      return {
          state: 'TRAUMA',
          color: 'bg-violet-500', // Neon Violet for "Damaged"
          textColor: 'text-violet-400',
          label: 'TRAUMA DETECTED'
      };
  }

  // 3. PRIORITY 3: UNSTABLE (Recent Restart)
  // Check if uptime dropped significantly in the last hour
  if (oneHourAgoPoint && point.uptime < (oneHourAgoPoint.uptime - 100)) {
    return { 
      state: 'UNSTABLE', 
      color: 'bg-rose-500', 
      textColor: 'text-rose-400', 
      label: 'UNSTABLE' 
    };
  }

  // 4. PRIORITY 4: ZOMBIE (Stagnant)
  // Credits exist but didn't increase
  if (prevPoint && point.credits > 0 && (point.credits === prevPoint.credits)) {
    return { 
      state: 'STAGNANT', 
      color: 'bg-amber-600', 
      textColor: 'text-amber-500', 
      label: 'STAGNANT YIELD' 
    };
  }

  // 5. PRIORITY 5: WARMUP (New Node)
  if (point.uptime < 86400) {
    return { 
      state: 'WARMUP', 
      color: 'bg-blue-500', 
      textColor: 'text-blue-400', 
      label: 'WARMUP PHASE' 
    };
  }

  // 6. PRIORITY 6: HEALTHY
  return { 
    state: 'ONLINE', 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-400', 
    label: 'OPERATIONAL' 
  };
};
