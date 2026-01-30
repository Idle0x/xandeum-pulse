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

export interface VitalityIssue {
  code: string;       
  title: string;      
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string; 
  textColor: string; 
  label: string;
  vectors: string[]; 
  issues: VitalityIssue[]; 
  topPin: PinConfig;
  bottomPin: PinConfig;
}

// --- HUMANIZER DEFINITIONS ---

const VECTOR_DEFINITIONS: Record<string, { title: string; description: string; severity: VitalityIssue['severity'] }> = {
  // CRITICAL
  V_OFFLINE:       { title: 'System Offline', description: 'Node is unreachable.', severity: 'critical' },
  V_OBSOLETE:      { title: 'Update Required', description: 'Consensus lost. Update ASAP.', severity: 'critical' },

  // WARNINGS
  V_FROZEN_UPTIME: { title: 'Process Hung',   description: 'Uptime stuck for >24h. Restart needed.', severity: 'warning' },
  V_STAGNANT:      { title: 'Zero Yield',     description: 'Online but earning nothing.', severity: 'warning' },
  V_LAGGING:       { title: 'Version Lag',    description: 'Newer version available.', severity: 'warning' },
  V_VOLATILE:      { title: 'Instability',    description: 'Frequent restarts detected.', severity: 'warning' },
  V_GHOST:         { title: 'Data Gaps',      description: 'Irregular reporting patterns.', severity: 'warning' },

  // INFO / EVENTS
  V_RESTART:       { title: 'System Restart', description: 'Uptime reset detected.', severity: 'info' },
  V_UPDATE:        { title: 'Software Update',description: 'Version changed recently.', severity: 'info' },
  V_SYNCING:       { title: 'Syncing',        description: 'Initializing network data.', severity: 'info' },
};

// --- LOGIC HELPERS ---

// Helper: Semantic Version Comparison (Sort Independent)
// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
const compareSemver = (v1: string, v2: string) => {
  const clean = (v: string) => v.replace(/[^0-9.]/g, ''); 
  const p1 = clean(v1).split('.').map(Number);
  const p2 = clean(v2).split('.').map(Number);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// --- UPDATED: STRICT GLOBAL CONSENSUS CHECK ---
const getVersionStatus = (nodeVersion: string | undefined, globalSortedVersions: string[], consensusVersion: string) => {
    if (!nodeVersion) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };

    // 1. SAFETY CHECK: If Leading or Matching Consensus -> LATEST
    // "Any version above or on consensus is fine."
    if (compareSemver(nodeVersion, consensusVersion) >= 0) {
        return { V_LATEST: true, V_LAGGING: false, V_OBSOLETE: false };
    }

    // 2. DISTANCE CHECK (Using Global List)
    // We only look at versions that are OLDER than consensus in the global list
    // to calculate how "far behind" this node is.
    
    // Clean and Normalize logic
    const cleanVer = (v: string) => v.replace(/[^0-9.]/g, '');
    const cleanNode = cleanVer(nodeVersion);
    const cleanList = globalSortedVersions.map(cleanVer);
    
    // Find where the node sits in the global stack
    const nodeIndex = cleanList.indexOf(cleanNode);
    const consensusIndex = cleanList.indexOf(cleanVer(consensusVersion));

    // If version is unknown to the network, assume Lagging
    if (nodeIndex === -1) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };

    // Calculate strict steps behind
    // Example: [v1.5, v1.4, v1.3]. Consensus v1.5 (idx 0). Node v1.3 (idx 2). Distance = 2.
    const distance = nodeIndex - consensusIndex;

    return {
        V_LATEST: false,
        V_LAGGING: distance > 0 && distance <= 2, // 1 or 2 steps behind
        V_OBSOLETE: distance > 2                  // 3+ steps behind
    };
};

// --- VECTOR ENGINE ---

const calculateVectors = (
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[], 
  refPoint24H: NodeHistoryPoint | undefined, 
  globalSortedVersions: string[], // <--- GLOBAL CONTEXT
  globalConsensus: string,        // <--- GLOBAL CONTEXT
  firstSeenDate: string 
) => {
  const uptime = point.uptime || 0;
  const bd = (point as any).healthBreakdown || {};
  const penalties = bd.penalties || { restarts: 0, consistency: 1, restarts_7d_count: 0 };

  // --- 1. STATUS VECTORS ---
  const V_OFFLINE = uptime === 0;
  const V_SYNCING = uptime > 0 && uptime < 900; 

  // --- FROZEN UPTIME CHECK (24 HOUR LOGIC) ---
  let V_FROZEN_UPTIME = false;
  if (refPoint24H && !V_OFFLINE) {
      const timeDelta = new Date(point.date).getTime() - new Date(refPoint24H.date).getTime();
      const uptimeDelta = point.uptime - refPoint24H.uptime;

      // Relaxed tolerance (60s) to handle network jitter/RPC lag
      if (timeDelta > 72000000 && Math.abs(uptimeDelta) < 60) { 
          V_FROZEN_UPTIME = true;
      }
  }

  // --- 2. VERSION VECTORS (Using Global Context) ---
  const versionString = (point as any).version || '0.0.0'; 
  const vStats = getVersionStatus(versionString, globalSortedVersions, globalConsensus);
  const { V_LATEST, V_LAGGING, V_OBSOLETE } = vStats;

  // --- 3. STABILITY VECTORS ---
  const restarts = penalties.restarts_7d_count || 0;
  const consistency = penalties.consistency !== undefined ? penalties.consistency : 1;
  const V_STABLE = restarts === 0;
  const V_JITTERY = restarts >= 1 && restarts <= 5;
  const V_VOLATILE = restarts > 5;
  const V_CONSISTENT = consistency > 0.95;
  const V_GHOST = consistency < 0.80;

  // --- 4. ECONOMIC VECTORS ---
  const credits = point.credits; 
  const V_UNTRACKED = credits === null || credits === undefined;

  let windowVelocity = 0;
  if (historyWindow.length > 0) {
      const oldestInWindow = historyWindow[0];
      const currentCredits = credits || 0;
      const oldCredits = oldestInWindow.credits || 0;
      windowVelocity = currentCredits - oldCredits;
  }

  const V_PRODUCING = windowVelocity > 0;

  const V_STAGNANT = !V_UNTRACKED && windowVelocity === 0 && !V_FROZEN_UPTIME && !V_OFFLINE && !V_SYNCING; 

  // --- 5. TIME/PENALTY VECTORS ---
  const V_PENALIZED = penalties.restarts > 0;

  // First Seen Logic
  const ageMs = new Date(point.date).getTime() - new Date(firstSeenDate).getTime();
  const V_YOUNG = ageMs < 259200000; 

  // Event Detectors
  const prevPoint = historyWindow[historyWindow.length - 1]; 
  const isRestart = prevPoint && point.uptime < (prevPoint.uptime - 100);
  const isUpdate = prevPoint && (point as any).version !== (prevPoint as any).version;

  const V_RESTART = !!isRestart;
  const V_UPDATE = !!isUpdate;

  return {
    V_OFFLINE, V_SYNCING, V_FROZEN_UPTIME,
    V_LATEST, V_LAGGING, V_OBSOLETE,
    V_STABLE, V_JITTERY, V_VOLATILE, V_CONSISTENT, V_GHOST,
    V_PRODUCING, V_STAGNANT, V_UNTRACKED,
    V_PENALIZED, V_YOUNG,
    V_RESTART, V_UPDATE 
  };
};

// --- LOGIC MATRIX ---

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[],
  refPoint24H: NodeHistoryPoint | undefined,
  globalSortedVersions: string[], // <--- ARG 4
  globalConsensus: string,        // <--- ARG 5
  firstSeenDate: string           // <--- ARG 6
): VitalityAnalysis => {

  const v = calculateVectors(point, historyWindow, refPoint24H, globalSortedVersions, globalConsensus, firstSeenDate);
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
