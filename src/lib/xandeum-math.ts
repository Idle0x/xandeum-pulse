// PURE MATHEMATIC LOGIC - CLIENT & SERVER SAFE

// --- HELPER INTERFACES ---
export interface HistoryContext {
  restarts_24h: number;
  yield_velocity_24h: number;
  consistency_score: number;
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

export const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) =>
  100 / (1 + Math.exp(-steepness * (value - midpoint)));

export const calculateLogScore = (value: number, median: number, maxScore: number = 100) => {
  if (median === 0) return value > 0 ? maxScore : 0;
  // Logarithmic Scale: 100 points at ~4x Median. 50 points at Median.
  return Math.min(maxScore, (maxScore / 2) * Math.log2((value / median) + 1));
};

export const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedCleanVersions: string[]) => {
  const cleanNode = cleanSemver(nodeVersion);
  const cleanConsensus = cleanSemver(consensusVersion);

  if (compareVersions(cleanNode, cleanConsensus) >= 0) return 100;
  const consensusIndex = sortedCleanVersions.indexOf(cleanConsensus);
  const nodeIndex = sortedCleanVersions.indexOf(cleanNode);
  if (nodeIndex === -1) return 0;
  const distance = nodeIndex - consensusIndex;
  
  if (distance <= 0) return 100;
  if (distance === 1) return 90;
  if (distance === 2) return 70;
  if (distance === 3) return 50;
  if (distance === 4) return 30;
  return 10;
};

/**
 * THE TEMPORAL VITALITY MODEL
 * Scores a node based on Snapshot Data AND Historical Context.
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
  history: HistoryContext = { restarts_24h: 0, yield_velocity_24h: 0, consistency_score: 1 } // Default if no history
) => {
  // 1. GATEKEEPER RULE: No storage committed = No Score.
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 } };

  // --- COMPONENT 1: UPTIME (Stability) ---
  const uptimeDays = uptimeSeconds / 86400;
  let uptimeScore = calculateSigmoidScore(uptimeDays, 7, 0.2);
  
  // Rule: New Node Cap (< 24h)
  if (uptimeDays < 1) uptimeScore = Math.min(uptimeScore, 20);

  // Rule: Progressive Restart Penalty (Forensic Slash)
  // -2.5 points per restart, capped at -20 (8 restarts)
  const restartPenalty = Math.min(20, history.restarts_24h * 2.5);
  uptimeScore = Math.max(0, uptimeScore - restartPenalty);

  // --- COMPONENT 2: STORAGE (Capacity) ---
  const baseStorageScore = calculateLogScore(storageCommitted, medianStorage, 100);
  // Bonus: Usage is proof of utility.
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  const totalStorageScore = baseStorageScore + utilizationBonus;

  // --- COMPONENT 3: VERSION (Compliance) ---
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  // --- COMPONENT 4: REPUTATION (Wealth + Velocity) ---
  let reputationScore: number | null = null;
  let total = 0;

  if (credits !== null && medianCredits > 0) {
    // Base Wealth Score
    let rawRepScore = Math.min(100, (credits / (medianCredits * 2)) * 100);

    // Rule: Yield Velocity Bonus/Decay
    // If earning nothing (0 velocity) -> Decay (Rich Zombie)
    if (history.yield_velocity_24h === 0 && credits > 100) {
       rawRepScore *= 0.9; // 10% Decay for stagnation
    }
    // If earning actively (> 0) -> Small Efficiency Bonus
    if (history.yield_velocity_24h > 0) {
       rawRepScore = Math.min(100, rawRepScore + 5);
    }
    
    reputationScore = rawRepScore;

    // Standard Weights: U(35) + S(30) + R(20) + V(15)
    total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15));
  } else if (isCreditsApiOnline) {
    // API is Online but this node has NO credits -> Reputation 0
    reputationScore = 0;
    total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (0 * 0.20) + (versionScore * 0.15));
  } else {
    // API Failure -> Re-weight: U(45) + S(35) + V(20)
    total = Math.round((uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20));
    reputationScore = null;
  }

  // Final Clamp
  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: { 
      uptime: Math.round(uptimeScore), 
      version: Math.round(versionScore), 
      reputation: reputationScore !== null ? Math.round(reputationScore) : null, 
      storage: Math.round(totalStorageScore) 
    }
  };
};
