// PURE MATHEMATIC LOGIC - CLIENT & SERVER SAFE

// --- HELPER INTERFACES ---
export interface HistoryContext {
  restarts_7d: number;      
  restarts_24h: number;     // NEW
  yield_velocity_24h: number;
  consistency_score: number;
  frozen_duration_hours: number; // NEW
}

export const cleanSemver = (v: string) => {
  if (!v) return '0.0.0';
  const mainVer = v.split('-')[0];
  return mainVer.replace(/[^0-9.]/g, '');
};

export const compareVersions = (v1: string, v2: string) => {
  const p1 = cleanSemver(v1).split('.').map(Number);
  const p2 = cleanSemver(v2).split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// NEW: 30-Day Midpoint Sigmoid
export const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) =>
  100 / (1 + Math.exp(-steepness * (value - midpoint)));

export const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
  if (median === 0) return value > 0 ? maxScore : 0;
  return Math.min(maxScore, (maxScore / 2) * Math.log2((value / median) + 1));
};

export const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedCleanVersions: string[]) => {
  const cleanNode = cleanSemver(nodeVersion);
  const cleanConsensus = cleanSemver(consensusVersion);

  if (compareVersions(cleanNode, cleanConsensus) >= 0) return 100; // Current or Newer

  const consensusIndex = sortedCleanVersions.indexOf(cleanConsensus);
  const nodeIndex = sortedCleanVersions.indexOf(cleanNode);

  if (nodeIndex === -1) return 0; // Unknown version
  const distance = nodeIndex - consensusIndex;

  // The "Sunset" Gate
  if (distance <= 0) return 100; // Match
  if (distance === 1) return 80; // N-1
  if (distance === 2) return 40; // N-2 (Severe Warning)
  return 0; // N-3+ (Obsolete)
};

/**
 * THE PROFESSIONAL VITALITY MODEL
 * Philosophy: "Resilience over Accumulation"
 */
export const calculateVitalityScore = (
  storageCommitted: number, 
  storageUsed: number, 
  uptimeSeconds: number,
  version: string, 
  consensusVersion: string, 
  sortedCleanVersions: string[],
  medianCredits: number, 
  credits: number | null, 
  medianStorage: number,
  isCreditsApiOnline: boolean,
  history: HistoryContext = { 
    restarts_7d: 0, 
    restarts_24h: 0, 
    yield_velocity_24h: 0, 
    consistency_score: 1, 
    frozen_duration_hours: 0 
  } 
) => {
  // 1. HARD GATE: No storage = No Score.
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0, penalties: { restarts: 0, consistency: 1, restarts_7d_count: 0 } } };

  // --- PILLAR 1: UPTIME (The Veteran Curve) ---
  const uptimeDays = uptimeSeconds / 86400;
  const uptimeScore = calculateSigmoidScore(uptimeDays, 30, 0.15); 

  // --- PILLAR 2: STORAGE (Capacity + Utility) ---
  const baseStorageScore = calculateLogScore(storageCommitted, medianStorage, 100);
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  const totalStorageScore = baseStorageScore + utilizationBonus;

  // --- PILLAR 3: VERSION (The Sunset Gate) ---
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  // --- PILLAR 4: REPUTATION (Wealth + Velocity) ---
  let reputationScore: number | null = null;

  if (credits !== null && medianCredits > 0) {
    let rawRepScore = Math.min(100, (credits / (medianCredits * 2)) * 100);

    // ZOMBIE CHECK: If earning nothing today, max rep is capped at 50%
    if (history.yield_velocity_24h === 0) {
       rawRepScore = Math.min(50, rawRepScore); 
    }
    reputationScore = rawRepScore;
  } else if (isCreditsApiOnline) {
    reputationScore = 0; // API online, node has no credits
  } else {
    reputationScore = null; // API offline
  }

  // --- RAW CALCULATION ---
  // Weights: U(35) + S(30) + R(20) + V(15)
  let rawTotal = 0;

  if (reputationScore !== null) {
      rawTotal = (uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15);
  } else {
      // Re-weight if Rep is offline: U(45) + S(35) + V(20)
      rawTotal = (uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20);
  }

  // --- THE PENALTIES (The Teeth) ---

  // A. Quadratic Restart Penalty (Base)
  const rawRestartPenalty = Math.pow(history.restarts_7d, 2);
  let restartPenalty = Math.min(36, rawRestartPenalty);

  // NEW: Trauma Check
  // If >5 restarts in 24h, increase severity
  if (history.restarts_24h > 5) {
      restartPenalty = Math.min(50, restartPenalty * 1.5);
  }

  // B. Consistency Damper (Multiplier)
  const consistencyMult = Math.pow(history.consistency_score, 2);

  // C. NEW: Frozen "Ice Age" Protocol
  let frozenPenalty = 0;
  let frozenCap = 100; // Default: No cap

  if (history.frozen_duration_hours > 0) {
      // < 1 Hour: Slap on the wrist
      if (history.frozen_duration_hours < 1) {
          frozenPenalty = 5;
      }
      // 1h - 24h: Escalating Negligence
      else if (history.frozen_duration_hours < 24) {
          // 10 base + 1 per hour (Max ~34)
          frozenPenalty = 10 + Math.floor(history.frozen_duration_hours);
      }
      // > 24h: Heavy Penalty
      else {
          frozenPenalty = 50;
      }

      // > 72h (3 Days): ABANDONED CAP
      if (history.frozen_duration_hours >= 72) {
          frozenCap = 10;
      }
  }

  // Final Formula
  let netScore = (rawTotal - restartPenalty - frozenPenalty) * consistencyMult;

  // Apply Caps
  netScore = Math.min(netScore, frozenCap);
  
  // Floor at 0, Cap at 100
  netScore = Math.max(0, Math.min(100, netScore));

  return {
    total: Math.round(netScore),
    breakdown: { 
      uptime: Math.round(uptimeScore), 
      version: Math.round(versionScore), 
      reputation: reputationScore !== null ? Math.round(reputationScore) : null, 
      storage: Math.round(totalStorageScore),
      penalties: {
        restarts: Math.round(restartPenalty + frozenPenalty), // Sum of visual penalties
        consistency: Number(consistencyMult.toFixed(2)),
        restarts_7d_count: history.restarts_7d
      }
    }
  };
};
