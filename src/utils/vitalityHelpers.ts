import { NodeHistoryPoint } from '../hooks/useNodeHistory';

// --- TYPES ---

export type VitalityArchetype = 
  | 'CRITICAL'    
  | 'TRAUMA'      
  | 'DRIFT'       
  | 'INCUBATION'  
  | 'ELITE'       
  | 'ACTIVE';     

export interface PinConfig {
  show: boolean;
  color: string; 
  label?: string; // Short label for the Pin itself (e.g. "Hung")
}

export interface VitalityIssue {
  code: string;       // e.g. "V_FROZEN"
  title: string;      // e.g. "Process Hung"
  description: string;// e.g. "Snapshot identical to 24h ago."
  severity: 'critical' | 'warning' | 'info';
}

export interface VitalityAnalysis {
  archetype: VitalityArchetype;
  baseColor: string;
  textColor: string;
  label: string;
  
  // New Human-Readable Fields
  issues: VitalityIssue[]; // List of problems for the Middle Section
  
  topPin: PinConfig;
  bottomPin: PinConfig;
  
  // Debug (keep these hidden or small if needed)
  rawVectors: string[]; 
}

// --- HUMANIZER CONFIG ---

const VECTOR_DEFINITIONS: Record<string, { title: string; desc: string; severity: VitalityIssue['severity'] }> = {
  // CRITICAL
  V_OFFLINE:       { title: 'System Offline', desc: 'Node is unreachable.', severity: 'critical' },
  V_OBSOLETE:      { title: 'Update Required', desc: 'Consensus lost. Update ASAP.', severity: 'critical' },
  
  // WARNINGS
  V_FROZEN_UPTIME: { title: 'Process Hung',   desc: 'Uptime stuck for >24h.', severity: 'warning' },
  V_STAGNANT:      { title: 'Zero Yield',     desc: 'Online but earning nothing.', severity: 'warning' },
  V_LAGGING:       { title: 'Version Lag',    desc: 'Newer version available.', severity: 'warning' },
  V_VOLATILE:      { title: 'Instability',    desc: 'Frequent restarts detected.', severity: 'warning' },
  V_GHOST:         { title: 'Data Gaps',      desc: 'Irregular reporting patterns.', severity: 'warning' },
  
  // INFO / EVENTS (For Pins)
  V_RESTART:       { title: 'System Restart', desc: 'Uptime reset detected.', severity: 'info' },
  V_UPDATE:        { title: 'Software Update',desc: 'Version changed recently.', severity: 'info' },
  V_SYNCING:       { title: 'Syncing',        desc: 'Initializing network data.', severity: 'info' },
};

// --- LOGIC HELPERS (Consensus & Window) ---

const getVersionStatus = (nodeVersion: string | undefined, allSortedVersions: string[], consensusVersion: string) => {
    if (!nodeVersion) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };
    const consensusIndex = allSortedVersions.indexOf(consensusVersion);
    const nodeIndex = allSortedVersions.indexOf(nodeVersion);
    if (nodeIndex === -1) return { V_LATEST: false, V_LAGGING: true, V_OBSOLETE: false };
    
    // Logic: Leading (lower index) counts as Latest. 
    // Lagging is 1-2 steps behind. Obsolete is >2 steps behind.
    const distance = nodeIndex - consensusIndex;
    
    return {
        V_LATEST: distance <= 0,
        V_LAGGING: distance > 0 && distance <= 2,
        V_OBSOLETE: distance > 2
    };
};

// --- MAIN ANALYZER ---

export const analyzePointVitality = (
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[],
  refPoint24H: NodeHistoryPoint | undefined,
  versionContext: { allSorted: string[], consensus: string }
): VitalityAnalysis => {

  const uptime = point.uptime || 0;
  const bd = (point as any).healthBreakdown || {};
  const penalties = bd.penalties || { restarts: 0, consistency: 1 };
  
  // 1. CALCULATE RAW VECTORS
  const v: Record<string, boolean> = {};

  // Status
  v.V_OFFLINE = uptime === 0;
  v.V_SYNCING = uptime > 0 && uptime < 900; 
  
  // Frozen (24h Check)
  if (refPoint24H && !v.V_OFFLINE) {
      const timeDelta = new Date(point.date).getTime() - new Date(refPoint24H.date).getTime();
      const uptimeDelta = point.uptime - refPoint24H.uptime;
      // > 20h passed AND < 10s uptime change
      if (timeDelta > 72000000 && uptimeDelta < 10) v.V_FROZEN_UPTIME = true;
  }

  // Version
  const vStats = getVersionStatus(bd.version, versionContext.allSorted, versionContext.consensus);
  Object.assign(v, vStats);

  // Stability
  const restarts = penalties.restarts_7d_count || 0;
  const consistency = penalties.consistency ?? 1;
  v.V_STABLE = restarts === 0;
  v.V_VOLATILE = restarts > 5;
  v.V_JITTERY = restarts >= 1 && restarts <= 5;
  v.V_GHOST = consistency < 0.80;
  v.V_CONSISTENT = consistency > 0.95;

  // Economic (Windowed)
  const credits = point.credits;
  v.V_UNTRACKED = credits == null;
  
  let windowVelocity = 0;
  if (historyWindow.length > 0) {
      windowVelocity = (credits || 0) - (historyWindow[0].credits || 0);
  }
  v.V_PRODUCING = windowVelocity > 0;
  v.V_STAGNANT = !v.V_UNTRACKED && windowVelocity === 0 && !v.V_FROZEN_UPTIME && !v.V_OFFLINE && !v.V_SYNCING;
  
  v.V_PENALIZED = penalties.restarts > 0;
  v.V_YOUNG = uptime < 259200; // < 3 days

  // Event Detectors (For Pins)
  const prevPoint = historyWindow[historyWindow.length - 1];
  const isRestart = prevPoint && point.uptime < (prevPoint.uptime - 100);
  const isUpdate = prevPoint && bd.version !== prevPoint.version;
  if (isRestart) v.V_RESTART = true;
  if (isUpdate) v.V_UPDATE = true;

  // 2. DETERMINE ARCHETYPE
  let archetype: VitalityArchetype = 'ACTIVE';
  let baseColor = '#06b6d4'; 
  let textColor = 'text-cyan-400';
  let label = 'ACTIVE';

  if (v.V_OFFLINE || (v.V_OBSOLETE && v.V_STAGNANT)) {
    archetype = 'CRITICAL'; baseColor = '#be123c'; textColor = 'text-rose-500'; label = v.V_OFFLINE ? 'OFFLINE' : 'OBSOLETE';
  } else if (v.V_VOLATILE || (v.V_PENALIZED && v.V_JITTERY)) {
    archetype = 'TRAUMA'; baseColor = '#7c3aed'; textColor = 'text-violet-400'; label = 'TRAUMA';
  } else if (v.V_FROZEN_UPTIME || v.V_STAGNANT || v.V_LAGGING || v.V_GHOST) {
    archetype = 'DRIFT'; baseColor = '#d97706'; textColor = 'text-amber-500';
    if (v.V_FROZEN_UPTIME) label = 'FROZEN';
    else if (v.V_STAGNANT) label = 'ZOMBIE';
    else label = 'DRIFT';
  } else if (v.V_SYNCING || (v.V_YOUNG && v.V_PRODUCING)) {
    archetype = 'INCUBATION'; baseColor = '#2563eb'; textColor = 'text-blue-400'; label = 'WARMING UP';
  } else if (v.V_LATEST && v.V_PRODUCING && v.V_STABLE && v.V_CONSISTENT) {
    archetype = 'ELITE'; baseColor = '#059669'; textColor = 'text-emerald-400'; label = 'ELITE';
  }

  // 3. BUILD HUMAN READABLE ISSUES
  const activeKeys = Object.keys(v).filter(k => v[k]);
  const issues: VitalityIssue[] = activeKeys
    .filter(k => VECTOR_DEFINITIONS[k]) // Only map ones we have text for
    .map(k => ({ code: k, ...VECTOR_DEFINITIONS[k] }));

  // 4. CONFIGURE PINS
  const topPin: PinConfig = { show: false, color: 'bg-white' };
  if (v.V_GHOST) { topPin.show = true; topPin.color = 'bg-white/90'; topPin.label = 'Gap'; }

  const bottomPin: PinConfig = { show: false, color: 'bg-transparent' };
  if (v.V_RESTART) { bottomPin.show = true; bottomPin.color = 'bg-rose-400'; bottomPin.label = 'Restart'; }
  else if (v.V_UPDATE) { bottomPin.show = true; bottomPin.color = 'bg-blue-400'; bottomPin.label = 'Update'; }
  else if (v.V_FROZEN_UPTIME) { bottomPin.show = true; bottomPin.color = 'bg-amber-500'; bottomPin.label = 'Hung'; }
  else if (v.V_STAGNANT) { bottomPin.show = true; bottomPin.color = 'bg-amber-300'; bottomPin.label = 'Stagnant'; }

  return { archetype, baseColor, textColor, label, issues, topPin, bottomPin, rawVectors: activeKeys };
};
