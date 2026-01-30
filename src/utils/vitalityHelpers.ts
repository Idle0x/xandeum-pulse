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

// NEW: For Human-Readable Context
export interface VitalityIssue {
  code: string;       // e.g. "V_FROZEN"
  title: string;      // e.g. "Process Hung"
  description: string;// e.g. "Snapshot identical to 24h ago."
  severity: 'critical' | 'warning' | 'info';
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string; // HEX CODE
  textColor: string; // Tailwind text class
  label: string;
  vectors: string[]; // Debug list
  issues: VitalityIssue[]; // NEW: List of human-readable issues
  topPin: PinConfig;
  bottomPin: PinConfig;
}

// --- HUMANIZER DEFINITIONS ---

const VECTOR_DEFINITIONS: Record<string, { title: string; desc: string; severity: VitalityIssue['severity'] }> = {
  // CRITICAL
  V_OFFLINE:       { title: 'System Offline', desc: 'Node is unreachable.', severity: 'critical' },
  V_OBSOLETE:      { title: 'Update Required', desc: 'Consensus lost. Update ASAP.', severity: 'critical' },
  
  // WARNINGS
  V_FROZEN_UPTIME: { title: 'Process Hung',   desc: 'Uptime stuck for >24h. Restart needed.', severity: 'warning' },
  V_STAGNANT:      { title: 'Zero Yield',     desc: 'Online but earning nothing.', severity: 'warning' },
  V_LAGGING:       { title: 'Version Lag',    desc: 'Newer version available.', severity: 'warning' },
  V_VOLATILE:      { title: 'Instability',    desc: 'Frequent restarts detected.', severity: 'warning' },
  V_GHOST:         { title: 'Data Gaps',      desc: 'Irregular reporting patterns.', severity: 'warning' },
  
  // INFO / EVENTS (For Pins)
  V_RESTART:       { title: 'System Restart', desc: 'Uptime reset detected.', severity: 'info' },
  V_UPDATE:        { title: 'Software Update',desc: 'Version changed recently.', severity: 'info' },
  V_SYNCING:       { title: 'Syncing',        desc: 'Initializing network data.', severity: 'info' },
};

// --- LOGIC HELPERS ---

// Sort semantic versions and determine status relative to consensus
const getVersionStatus = (nodeVersion: string | undefined, allSortedVersions: string[], consensusVersion: string) => {
    if (!nodeVersion) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };
    
    const consensusIndex = allSortedVersions.indexOf(consensusVersion);
    const nodeIndex = allSortedVersions.indexOf(nodeVersion);
    
    // If version not found in list, assume lagging/unknown
    if (nodeIndex === -1) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };

    // Leading (lower index than consensus) counts as Latest
    // Lagging is 1-2 steps behind. Obsolete is >2 steps behind.
    const distance = nodeIndex - consensusIndex;
    
    return {
        V_LATEST: distance <= 0,
        V_LAGGING: distance > 0 && distance <= 2,
        V_OBSOLETE: distance > 2
    };
};

// --- VECTOR ENGINE ---

const calculateVectors = (
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[], // Last ~5 points for smoothing
  refPoint24H: NodeHistoryPoint | undefined, // Point from ~24 hours ago
  versionContext: { allSorted: string[], consensus: string }
) => {
  const uptime = point.uptime || 0;
  const bd = (point as any).healthBreakdown || {};
  const penalties = bd.penalties || { restarts: 0, consistency: 1, restarts_7d_count: 0 };

  // --- 1. STATUS VECTORS ---
  const V_OFFLINE = uptime === 0;
  const V_SYNCING = uptime > 0 && uptime < 900; // < 15 mins

  // --- FROZEN UPTIME CHECK (24 HOUR LOGIC) ---
  let V_FROZEN_UPTIME = false;
  if (refPoint24H && !V_OFFLINE) {
      const timeDelta = new Date(point.date).getTime() - new Date(refPoint24H.date).getTime();
      const uptimeDelta = point.uptime - refPoint24H.uptime;

      // Allow slight jitter (e.g. 10s), but if time passed > 20 hours and uptime moved < 10s
      if (timeDelta > 72000000 && uptimeDelta < 10) { 
          V_FROZEN_UPTIME = true;
      }
  }

  // --- 2. VERSION VECTORS (Consensus Based) ---
  const vStats = getVersionStatus(bd.version, versionContext.allSorted, versionContext.consensus);
  const { V_LATEST, V_LAGGING, V_OBSOLETE } = vStats;

  // --- 3. STABILITY VECTORS ---
  const restarts = penalties.restarts_7d_count || 0;
  const consistency = penalties.consistency !== undefined ? penalties.consistency : 1;
  const V_STABLE = restarts === 0;
  const V_JITTERY = restarts >= 1 && restarts <= 5;
  const V_VOLATILE = restarts > 5;
  const V_CONSISTENT = consistency > 0.95;
  const V_GHOST = consistency < 0.80;

  // --- 4. ECONOMIC VECTORS (Windowed) ---
  const credits = point.credits; 
  const V_UNTRACKED = credits === null || credits === undefined;

  // Calculate Net Velocity over the window (e.g. last 3-6 hours)
  // We compare Current Point vs The Oldest Point in the Window
  let windowVelocity = 0;
  if (historyWindow.length > 0) {
      const oldestInWindow = historyWindow[0];
      const currentCredits = credits || 0;
      const oldCredits = oldestInWindow.credits || 0;
      windowVelocity = currentCredits - oldCredits;
  }

  const V_PRODUCING = windowVelocity > 0;
  
  // Stagnant only if: Tracked + Online + No credits produced in entire window + Not Frozen
  const V_STAGNANT = !V_UNTRACKED && windowVelocity === 0 && !V_FROZEN_UPTIME && !V_OFFLINE && !V_SYNCING; 

  // --- 5. TIME/PENALTY VECTORS ---
  const V_PENALIZED = penalties.restarts > 0;
  const V_YOUNG = uptime < 259200; // < 3 days

  // Event Detectors (For Pins)
  const prevPoint = historyWindow[historyWindow.length - 1]; // Use immediate prev for Restart check
  const isRestart = prevPoint && point.uptime < (prevPoint.uptime - 100);
  const isUpdate = prevPoint && bd.version !== prevPoint.version;

  const V_RESTART = !!isRestart;
  const V_UPDATE = !!isUpdate;

  return {
    V_OFFLINE, V_SYNCING, V_FROZEN_UPTIME,
    V_LATEST, V_LAGGING, V_OBSOLETE,
    V_STABLE, V_JITTERY, V_VOLATILE, V_CONSISTENT, V_GHOST,
    V_PRODUCING, V_STAGNANT, V_UNTRACKED,
    V_PENALIZED, V_YOUNG,
    V_RESTART, V_UPDATE // Included for Humanizer mapping
  };
};

// --- LOGIC MATRIX ---

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[],
  refPoint24H: NodeHistoryPoint | undefined,
  versionContext: { allSorted: string[], consensus: string }
): VitalityAnalysis => {

  const v = calculateVectors(point, historyWindow, refPoint24H, versionContext);
  const activeVectors = Object.entries(v).filter(([_, val]) => val).map(([key]) => key);

  let archetype: VitalityArchetype = 'ACTIVE';
  let baseColor = '#06b6d4'; // Cyan-500
  let textColor = 'text-cyan-400';
  let label = 'ACTIVE';

  // PRIORITY 1: CRITICAL
  if (v.V_OFFLINE || (v.V_OBSOLETE && v.V_STAGNANT) || (v.V_OBSOLETE && v.V_UNTRACKED)) {
    archetype = 'CRITICAL';
    baseColor = '#be123c'; // Rose-700
    textColor = 'text-rose-500';
    label = v.V_OFFLINE ? 'OFFLINE' : 'OBSOLETE';
  }
  // PRIORITY 2: TRAUMA
  else if (v.V_VOLATILE || (v.V_PENALIZED && v.V_JITTERY) || (v.V_PENALIZED && v.V_STAGNANT)) {
    archetype = 'TRAUMA';
    baseColor = '#7c3aed'; // Violet-600
    textColor = 'text-violet-400';
    label = 'TRAUMA STATE';
  }
  // PRIORITY 3: DRIFT
  else if (v.V_FROZEN_UPTIME || (v.V_STAGNANT && !v.V_SYNCING) || v.V_LAGGING || v.V_GHOST || v.V_OBSOLETE) {
    archetype = 'DRIFT';
    baseColor = '#d97706'; // Amber-600
    textColor = 'text-amber-500';

    if (v.V_FROZEN_UPTIME) label = 'FROZEN (24H)';
    else if (v.V_STAGNANT) label = 'ZOMBIE STATE'; 
    else if (v.V_LAGGING) label = 'VERSION LAG';
    else if (v.V_OBSOLETE) label = 'OBSOLETE (ACTIVE)';
    else label = 'CONSISTENCY DRIFT';
  }
  // PRIORITY 4: INCUBATION
  else if (v.V_SYNCING || (v.V_YOUNG && v.V_PRODUCING) || (v.V_UNTRACKED && v.V_LATEST && v.V_STABLE)) {
    archetype = 'INCUBATION';
    baseColor = '#2563eb'; // Blue-600
    textColor = 'text-blue-400';
    label = v.V_SYNCING ? 'WARMING UP' : 'INCUBATION';
  }
  // PRIORITY 5: ELITE
  else if (v.V_LATEST && v.V_PRODUCING && v.V_STABLE && v.V_CONSISTENT) {
    archetype = 'ELITE';
    baseColor = '#059669'; // Emerald-600
    textColor = 'text-emerald-400';
    label = 'ELITE STATUS';
  }
  // PRIORITY 6: ACTIVE
  else {
    archetype = 'ACTIVE';
    baseColor = '#06b6d4'; // Cyan-500
    textColor = 'text-cyan-400';
    label = 'ACTIVE';
  }

  // --- BUILD HUMAN ISSUES LIST ---
  // Maps true vectors to the human-readable definitions
  const issues: VitalityIssue[] = activeVectors
    .filter(key => VECTOR_DEFINITIONS[key])
    .map(key => ({ code: key, ...VECTOR_DEFINITIONS[key] }));

  // --- PIN SYSTEM ---

  const topPin: PinConfig = { show: false, color: 'bg-white' };
  if (v.V_GHOST) {
      topPin.show = true;
      topPin.color = 'bg-white/90';
      topPin.label = 'Gap';
  }

  const bottomPin: PinConfig = { show: false, color: 'bg-transparent' };

  if (v.V_RESTART) {
      bottomPin.show = true;
      bottomPin.color = 'bg-rose-400'; 
      bottomPin.label = 'Restart';
  } else if (v.V_UPDATE) {
      bottomPin.show = true;
      bottomPin.color = 'bg-blue-400';
      bottomPin.label = 'Update';
  } else if (v.V_FROZEN_UPTIME) {
      bottomPin.show = true;
      bottomPin.color = 'bg-amber-500';
      bottomPin.label = 'Hung';
  } else if (v.V_STAGNANT) {
      bottomPin.show = true;
      bottomPin.color = 'bg-amber-300';
      bottomPin.label = 'Zero Yield';
  }

  return { archetype, baseColor, textColor, label, vectors: activeVectors, issues, topPin, bottomPin };
};
