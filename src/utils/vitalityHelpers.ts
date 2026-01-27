import { NodeHistoryPoint } from '../hooks/useNodeHistory';

// --- TYPES ---

export type VitalityArchetype = 
  | 'CRITICAL'    // Dead / Obsolete+Stagnant (Rose)
  | 'TRAUMA'      // Instability (Violet)
  | 'DRIFT'       // Hung / Stagnant / Lagging / Obsolete(Active) (Amber)
  | 'INCUBATION'  // New / Untracked+Good (Blue)
  | 'ELITE'       // Perfect (Emerald)
  | 'ACTIVE';     // Solid / Reliable (Cyan)

export interface PinConfig {
  show: boolean;
  color: string; 
  label?: string;
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string; // HEX CODE
  textColor: string; // Tailwind text class
  label: string;
  vectors: string[]; // Debug list
  topPin: PinConfig;
  bottomPin: PinConfig;
}

// --- VECTOR ENGINE ---

const calculateVectors = (
  point: NodeHistoryPoint, 
  prevPoint?: NodeHistoryPoint
) => {
  const uptime = point.uptime || 0;
  
  // Safe extraction
  const bd = (point as any).healthBreakdown || {};
  const penalties = bd.penalties || { restarts: 0, consistency: 1, restarts_7d_count: 0 };
  
  // --- 1. STATUS VECTORS ---
  const V_OFFLINE = uptime === 0;
  const V_SYNCING = uptime > 0 && uptime < 900; // < 15 mins

  // FROZEN UPTIME CHECK (The "Hung" Node)
  let V_FROZEN_UPTIME = false;
  if (prevPoint && !V_OFFLINE) {
      const timeDelta = new Date(point.date).getTime() - new Date(prevPoint.date).getTime();
      const uptimeDelta = point.uptime - prevPoint.uptime;
      // If time moved forward (> 1 min) but uptime didn't move (0), it's frozen
      if (timeDelta > 60000 && uptimeDelta === 0) {
          V_FROZEN_UPTIME = true;
      }
  }

  // --- 2. VERSION VECTORS ---
  // Score 15 = Latest, 12/6 = Lagging, 0 = Obsolete
  const vScore = bd.version !== undefined ? bd.version : 15;
  const V_LATEST = vScore === 15;
  const V_LAGGING = vScore === 12 || vScore === 6;
  const V_OBSOLETE = vScore === 0; // N-3 or older

  // --- 3. STABILITY VECTORS ---
  const restarts = penalties.restarts_7d_count || 0;
  const consistency = penalties.consistency !== undefined ? penalties.consistency : 1;
  const V_STABLE = restarts === 0;
  const V_JITTERY = restarts >= 1 && restarts <= 5;
  const V_VOLATILE = restarts > 5;
  const V_CONSISTENT = consistency > 0.95;
  const V_GHOST = consistency < 0.80;

  // --- 4. ECONOMIC VECTORS ---
  const credits = point.credits; // Can be null
  const prevCredits = prevPoint?.credits ?? 0;
  
  const V_UNTRACKED = credits === null || credits === undefined;
  
  // Velocity logic: strictly 0 means stagnant
  const valCredits = credits || 0;
  const velocity = prevPoint ? (valCredits - prevCredits) : 0;
  
  const V_PRODUCING = velocity > 0;
  const V_STAGNANT = !V_UNTRACKED && velocity === 0; // Only flag stagnant if tracked

  // --- 5. TIME/PENALTY VECTORS ---
  const V_PENALIZED = penalties.restarts > 0;
  const V_YOUNG = uptime < 259200; // < 3 days

  return {
    V_OFFLINE, V_SYNCING, V_FROZEN_UPTIME,
    V_LATEST, V_LAGGING, V_OBSOLETE,
    V_STABLE, V_JITTERY, V_VOLATILE, V_CONSISTENT, V_GHOST,
    V_PRODUCING, V_STAGNANT, V_UNTRACKED,
    V_PENALIZED, V_YOUNG
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

  let archetype: VitalityArchetype = 'ACTIVE';
  let baseColor = '#06b6d4'; // Cyan-500 (Active)
  let textColor = 'text-cyan-400';
  let label = 'ACTIVE';

  // PRIORITY 1: CRITICAL (Dead / Dangerous)
  if (v.V_OFFLINE || (v.V_OBSOLETE && v.V_STAGNANT) || (v.V_OBSOLETE && v.V_UNTRACKED)) {
    archetype = 'CRITICAL';
    baseColor = '#be123c'; // Rose-700
    textColor = 'text-rose-500';
    label = v.V_OFFLINE ? 'OFFLINE' : 'OBSOLETE';
  }
  // PRIORITY 2: TRAUMA (Active Instability)
  else if (v.V_VOLATILE || (v.V_PENALIZED && v.V_JITTERY) || (v.V_PENALIZED && v.V_STAGNANT)) {
    archetype = 'TRAUMA';
    baseColor = '#7c3aed'; // Violet-600
    textColor = 'text-violet-400';
    label = 'TRAUMA STATE';
  }
  // PRIORITY 3: DRIFT (Functional but Flawed)
  else if (v.V_FROZEN_UPTIME || (v.V_STAGNANT && !v.V_SYNCING) || v.V_LAGGING || v.V_GHOST || v.V_OBSOLETE) {
    archetype = 'DRIFT';
    baseColor = '#d97706'; // Amber-600
    textColor = 'text-amber-500';
    if (v.V_FROZEN_UPTIME) label = 'FROZEN STATE';
    else if (v.V_STAGNANT) label = 'ZOMBIE STATE';
    else if (v.V_LAGGING) label = 'VERSION LAG';
    else if (v.V_OBSOLETE) label = 'OBSOLETE (ACTIVE)';
    else label = 'CONSISTENCY DRIFT';
  }
  // PRIORITY 4: INCUBATION (Fresh / Protected)
  else if (v.V_SYNCING || (v.V_YOUNG && v.V_PRODUCING) || (v.V_UNTRACKED && v.V_LATEST && v.V_STABLE)) {
    archetype = 'INCUBATION';
    baseColor = '#2563eb'; // Blue-600
    textColor = 'text-blue-400';
    label = v.V_SYNCING ? 'WARMING UP' : 'INCUBATION';
  }
  // PRIORITY 5: ELITE (Perfection)
  else if (v.V_LATEST && v.V_PRODUCING && v.V_STABLE && v.V_CONSISTENT) {
    archetype = 'ELITE';
    baseColor = '#059669'; // Emerald-600
    textColor = 'text-emerald-400';
    label = 'ELITE STATUS';
  }
  // PRIORITY 6: ACTIVE (Solid Fallback)
  else {
    archetype = 'ACTIVE';
    baseColor = '#06b6d4'; // Cyan-500
    textColor = 'text-cyan-400';
    label = 'ACTIVE';
  }

  // --- PIN SYSTEM ---

  // TOP PIN: Consistency/Ghosting
  const topPin: PinConfig = { show: false, color: 'bg-white' };
  if (v.V_GHOST) {
      topPin.show = true;
      topPin.color = 'bg-white/90';
      topPin.label = 'Data Gap';
  }

  // BOTTOM PIN: Events
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
