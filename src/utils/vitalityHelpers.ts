import { NodeHistoryPoint } from '../hooks/useNodeHistory';

// --- TYPES ---

export type VitalityArchetype = 
  | 'CRITICAL'    // Dead / Obsolete+Stagnant (Rose)
  | 'TRAUMA'      // Instability (Violet)
  | 'DRIFT'       // Stagnant / Lagging / Obsolete(Active) (Amber)
  | 'ELITE'       // Perfect (Emerald)
  | 'INCUBATION'  // New / Warming Up (Blue)
  | 'STANDARD';   // Operational (Zinc)

export interface PinConfig {
  show: boolean;
  color: string; // Tailwind class for dots (safely purge-able or hex)
  label?: string;
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string; // HEX CODE
  textColor: string; // Tailwind text class
  label: string;
  vectors: string[]; // Debug list of active vectors
  topPin: PinConfig;
  bottomPin: PinConfig;
}

// --- VECTOR ENGINE ---

const calculateVectors = (
  point: NodeHistoryPoint, 
  prevPoint?: NodeHistoryPoint
) => {
  const uptime = point.uptime || 0;
  const credits = point.credits || 0;
  const prevCredits = prevPoint?.credits || 0;
  
  // Safe extraction of nested props
  const bd = (point as any).healthBreakdown || {};
  const penalties = bd.penalties || { restarts: 0, consistency: 1, restarts_7d_count: 0 };
  
  // 1. STATUS VECTORS
  const V_OFFLINE = uptime === 0;
  const V_SYNCING = uptime > 0 && uptime < 900; // < 15 mins

  // 2. VERSION VECTORS (Inferred from Version Score)
  // Score 15 = Latest, 12 = N-1, 6 = N-2, 0 = Obsolete (N-3+)
  const vScore = bd.version !== undefined ? bd.version : 15;
  const V_LATEST = vScore === 15;
  const V_LAGGING = vScore === 12 || vScore === 6;
  const V_OBSOLETE = vScore === 0;

  // 3. STABILITY VECTORS
  const restarts = penalties.restarts_7d_count || 0;
  const consistency = penalties.consistency !== undefined ? penalties.consistency : 1;
  const V_STABLE = restarts === 0;
  const V_JITTERY = restarts >= 1 && restarts <= 5;
  const V_VOLATILE = restarts > 5;
  const V_CONSISTENT = consistency > 0.95;
  const V_GHOST = consistency < 0.80;

  // 4. ECONOMIC VECTORS
  const velocity = prevPoint ? (credits - prevCredits) : 0;
  const V_PRODUCING = velocity > 0;
  const V_STAGNANT = prevPoint && credits > 0 && velocity === 0;

  // 5. PENALTY VECTORS
  const V_PENALIZED = penalties.restarts > 0;

  return {
    V_OFFLINE, V_SYNCING,
    V_LATEST, V_LAGGING, V_OBSOLETE,
    V_STABLE, V_JITTERY, V_VOLATILE, V_CONSISTENT, V_GHOST,
    V_PRODUCING, V_STAGNANT,
    V_PENALIZED
  };
};

// --- LOGIC MATRIX ---

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  prevPoint?: NodeHistoryPoint,
  oneHourAgoPoint?: NodeHistoryPoint
): VitalityAnalysis => {
  
  const v = calculateVectors(point, prevPoint);
  const activeVectors = Object.entries(v).filter(([_, val]) => val).map(([key]) => key);

  let archetype: VitalityArchetype = 'STANDARD';
  let baseColor = '#3f3f46'; // Zinc-700
  let textColor = 'text-zinc-400';
  let label = 'OPERATIONAL';

  // PRIORITY 1: CRITICAL (Dead or Dead-Obsolete)
  // Logic: Offline OR (Obsolete AND Stagnant)
  if (v.V_OFFLINE || (v.V_OBSOLETE && v.V_STAGNANT)) {
    archetype = 'CRITICAL';
    baseColor = '#be123c'; // Rose-700
    textColor = 'text-rose-500';
    label = v.V_OFFLINE ? 'OFFLINE' : 'OBSOLETE & STAGNANT';
  }
  // PRIORITY 2: TRAUMA (Active Instability)
  else if (v.V_VOLATILE || (v.V_PENALIZED && v.V_JITTERY)) {
    archetype = 'TRAUMA';
    baseColor = '#7c3aed'; // Violet-600
    textColor = 'text-violet-400';
    label = 'TRAUMA STATE';
  }
  // PRIORITY 3: DRIFT (Stagnation / Imperfection / Active-Obsolete)
  // Logic: Catch-all for "Working but imperfect"
  else if (v.V_STAGNANT || v.V_LAGGING || v.V_GHOST || v.V_OBSOLETE) {
    archetype = 'DRIFT';
    baseColor = '#d97706'; // Amber-600
    textColor = 'text-amber-500';
    if (v.V_OBSOLETE) label = 'OBSOLETE (ACTIVE)';
    else if (v.V_STAGNANT) label = 'ZOMBIE STATE';
    else if (v.V_LAGGING) label = 'VERSION LAG';
    else label = 'CONSISTENCY DRIFT';
  }
  // PRIORITY 4: ELITE (The Gold Standard)
  else if (v.V_LATEST && v.V_PRODUCING && v.V_STABLE && v.V_CONSISTENT) {
    archetype = 'ELITE';
    baseColor = '#059669'; // Emerald-600
    textColor = 'text-emerald-400';
    label = 'ELITE STATUS';
  }
  // PRIORITY 5: INCUBATION (New / Warming Up)
  else if (v.V_SYNCING || (v.V_PRODUCING && point.uptime < 259200 && v.V_STABLE)) { // < 3 days
    archetype = 'INCUBATION';
    baseColor = '#2563eb'; // Blue-600
    textColor = 'text-blue-400';
    label = v.V_SYNCING ? 'WARMING UP' : 'INCUBATION';
  }
  // PRIORITY 6: STANDARD (Fallback)
  else {
    archetype = 'STANDARD';
    baseColor = '#3f3f46'; // Zinc-700
    textColor = 'text-zinc-400';
    label = 'OPERATIONAL';
  }

  // --- PIN SYSTEM ---

  // TOP PIN: Consistency Gap (Ghosting)
  const topPin: PinConfig = { show: false, color: 'bg-white' };
  if (v.V_GHOST) {
      topPin.show = true;
      topPin.color = 'bg-white/90';
      topPin.label = 'Data Gap';
  }

  // BOTTOM PIN: Activity Events
  const bottomPin: PinConfig = { show: false, color: 'bg-transparent' };
  
  const isRestart = prevPoint && point.uptime < (prevPoint.uptime - 100);
  const isUpdate = prevPoint && point.version !== prevPoint.version;
  
  if (isRestart) {
      bottomPin.show = true;
      bottomPin.color = 'bg-rose-400'; 
      bottomPin.label = 'Restart';
  } else if (isUpdate) {
      bottomPin.show = true;
      bottomPin.color = 'bg-blue-400';
      bottomPin.label = 'Update';
  } else if (v.V_STAGNANT) {
      bottomPin.show = true;
      bottomPin.color = 'bg-amber-300';
      bottomPin.label = 'Zero Yield';
  }

  return { archetype, baseColor, textColor, label, vectors: activeVectors, topPin, bottomPin };
};
