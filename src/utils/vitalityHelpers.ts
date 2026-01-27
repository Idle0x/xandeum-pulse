import { NodeHistoryPoint } from '../hooks/useNodeHistory';

// --- TYPES ---

export type VitalityArchetype = 
  | 'CRITICAL'    // Dead or Useless (Rose)
  | 'TRAUMA'      // Online but Penalized (Violet)
  | 'DRIFT'       // Stagnant/Old (Amber)
  | 'INCUBATION'  // New/Warming Up (Blue)
  | 'PRISTINE'    // Perfect (Emerald)
  | 'ONLINE';     // Standard (Emerald/Zinc)

export interface PinConfig {
  show: boolean;
  color: string; // Tailwind class
  label?: string;
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string;
  textColor: string;
  label: string;
  // The Pin System
  topPin: PinConfig;
  bottomPin: PinConfig;
}

// --- LOGIC ENGINE ---

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  prevPoint?: NodeHistoryPoint,
  oneHourAgoPoint?: NodeHistoryPoint
): VitalityAnalysis => {
  
  const health = point.health || 0;
  const uptime = point.uptime || 0;
  const credits = point.credits || 0;
  
  // Safe extraction of nested props if they exist (future proofing)
  const penalties = (point as any).healthBreakdown?.penalties || { restarts: 0, consistency: 1 };
  const breakdown = (point as any).healthBreakdown || {};

  // --- 1. DETERMINE ARCHETYPE (The Base Color) ---
  let archetype: VitalityArchetype = 'ONLINE';
  let baseColor = 'bg-zinc-700';
  let textColor = 'text-zinc-400';
  let label = 'OPERATIONAL';

  // LOGIC VECTOR 1: CRITICAL (Dead)
  if (uptime === 0 || health < 20) {
    archetype = 'CRITICAL';
    baseColor = 'bg-rose-600';
    textColor = 'text-rose-500';
    label = 'CRITICAL FAILURE';
  }
  // LOGIC VECTOR 2: TRAUMA (Penalized)
  // Logic: Online (>24h uptime) but Health is crushed (<50) OR explicit penalty > 10
  else if (penalties.restarts > 10 || (uptime > 86400 && health < 50)) {
    archetype = 'TRAUMA';
    baseColor = 'bg-violet-500';
    textColor = 'text-violet-400';
    label = 'TRAUMA STATE';
  }
  // LOGIC VECTOR 3: INCUBATION (New Node)
  // Logic: Health Low (<60) ONLY because Uptime is Low (< 7 days)
  else if (health < 60 && uptime < 604800) {
    archetype = 'INCUBATION';
    baseColor = 'bg-blue-600';
    textColor = 'text-blue-400';
    label = 'INCUBATION PHASE';
  }
  // LOGIC VECTOR 4: DRIFT (Stagnant)
  // Logic: Credits exist but didn't move (Zombie) OR Version score is low
  else if ((prevPoint && credits > 0 && point.credits === prevPoint.credits) || (breakdown.version !== undefined && breakdown.version < 10)) {
    archetype = 'DRIFT';
    baseColor = 'bg-amber-600';
    textColor = 'text-amber-500';
    label = 'DRIFT DETECTED';
  }
  // LOGIC VECTOR 5: PRISTINE (Perfect)
  else if (health >= 80) {
    archetype = 'PRISTINE';
    baseColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
    label = 'PRISTINE HEALTH';
  }
  // DEFAULT
  else {
    archetype = 'ONLINE';
    baseColor = 'bg-emerald-600/60'; // Slightly muted green for "Okay"
    textColor = 'text-emerald-500';
    label = 'OPERATIONAL';
  }

  // --- 2. DETERMINE PINS (The Events) ---
  
  // TOP PIN: Reliability/Consistency
  // Trigger: Explicit low consistency OR inferred data gap
  const topPin: PinConfig = { show: false, color: 'bg-white' };
  if (penalties.consistency < 0.9) {
      topPin.show = true;
      topPin.color = 'bg-white'; // White dot = "Missing Data"
      topPin.label = 'Consistency Gap';
  }

  // BOTTOM PIN: Events (Activity)
  // Priority: Restart (Red) > Update (Blue) > Stagnation (Yellow)
  const bottomPin: PinConfig = { show: false, color: 'bg-transparent' };
  
  const isRestart = prevPoint && point.uptime < (prevPoint.uptime - 100);
  const isUpdate = prevPoint && point.version !== prevPoint.version;
  const isStagnant = prevPoint && credits > 0 && point.credits === prevPoint.credits;

  if (isRestart) {
      bottomPin.show = true;
      bottomPin.color = 'bg-rose-300'; // Muted Red
      bottomPin.label = 'Restart Event';
  } else if (isUpdate) {
      bottomPin.show = true;
      bottomPin.color = 'bg-blue-300'; // Muted Blue
      bottomPin.label = 'System Update';
  } else if (isStagnant) {
      bottomPin.show = true;
      bottomPin.color = 'bg-amber-200'; // Muted Yellow
      bottomPin.label = 'Zero Yield';
  }

  return { archetype, baseColor, textColor, label, topPin, bottomPin };
};
