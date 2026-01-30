// PURE MATHEMATIC LOGIC - CLIENT & SERVER SAFE

// --- HELPER INTERFACES ---
export interface ForensicContext {
  restarts_7d: number;      
  restarts_24h: number;          
  yield_velocity_24h: number;    
  consistency_score: number;
  frozen_duration_hours: number; 
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

// 30-Day Midpoint Sigmoid for Uptime
export const calculateSigmoidScore = (value: number, midpoint: number, steepness: number) =>
  100 / (1 + Math.exp(-steepness * (value - midpoint)));

// --- ELASTIC STORAGE SCORE ---
export const calculateElasticStorageScore = (
  committedBytes: number, 
  medianBytes: number, 
  p95Bytes: number
) => {
  if (medianBytes === 0) return 0;

  const safeP95 = Math.max(p95Bytes, medianBytes * 1.01);

  if (committedBytes <= medianBytes) {
      return 50 * Math.log2((committedBytes / medianBytes) + 1);
  }

  if (committedBytes <= safeP95) {
      const position = Math.log10(committedBytes / medianBytes) / Math.log10(safeP95 / medianBytes);
      return 50 + (40 * position);
  }

  return Math.min(100, 90 + 10 * Math.log2((committedBytes / safeP95) + 1));
};

// --- VERSION SCORING ---
export const getVersionScoreByRank = (nodeVersion: string, consensusVersion: string, sortedCleanVersions: string[]) => {
  const cleanNode = cleanSemver(nodeVersion);
  const cleanConsensus = cleanSemver(consensusVersion);

  if (compareVersions(cleanNode, cleanConsensus) >= 0) return 100; 

  const consensusIndex = sortedCleanVersions.indexOf(cleanConsensus);
  const nodeIndex = sortedCleanVersions.indexOf(cleanNode);

  if (nodeIndex === -1) return 0; 
  const distance = nodeIndex - consensusIndex;

  if (distance <= 0) return 100; 
  if (distance === 1) return 80; 
  if (distance === 2) return 70; 
  return 0;
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
  p95Storage: number,
  isCreditsApiOnline: boolean,
  context: ForensicContext 
) => {
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0, penalties: { restarts: 0, consistency: 1, restarts_7d_count: 0 } } };

  // --- PILLAR 1: UPTIME ---
  const uptimeDays = uptimeSeconds / 86400;
  const uptimeScore = calculateSigmoidScore(uptimeDays, 30, 0.15); 

  // --- PILLAR 2: STORAGE ---
  const baseStorageScore = calculateElasticStorageScore(storageCommitted, medianStorage, p95Storage);
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  const totalStorageScore = Math.min(100, baseStorageScore + utilizationBonus);

  // --- PILLAR 3: VERSION ---
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  // --- PILLAR 4: REPUTATION ---
  let reputationScore: number | null = null;
  if (credits !== null && medianCredits > 0) {
    let rawRepScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
    if (context.yield_velocity_24h === 0) {
       rawRepScore = Math.min(50, rawRepScore); 
    }
    reputationScore = rawRepScore;
  } else if (isCreditsApiOnline) {
    reputationScore = 0; 
  } else {
    reputationScore = null; 
  }

  // --- RAW CALCULATION ---
  let rawTotal = 0;
  if (reputationScore !== null) {
      rawTotal = (uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15);
  } else {
      rawTotal = (uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20);
  }

  // --- THE PENALTIES ---

  // A. Quadratic Restart Penalty
  const rawRestartPenalty = Math.pow(context.restarts_7d, 2);
  let restartPenalty = Math.min(36, rawRestartPenalty);

  // B. Trauma Multiplier
  if (context.restarts_24h > 5) {
      restartPenalty = Math.min(50, restartPenalty * 1.5);
  }

  // C. Consistency Damper
  // DEBUG BYPASS: Hardcoded to 1 to ignore data gaps while debugging history aggregator.
  // Original: const consistencyMult = Math.pow(context.consistency_score, 2);
  const consistencyMult = 1;

  // D. Frozen Penalty
  let frozenPenalty = 0;
  let frozenCap = 100; 

  if (context.frozen_duration_hours > 0) {
      if (context.frozen_duration_hours < 1) {
          frozenPenalty = 5;
      } else if (context.frozen_duration_hours < 24) {
          frozenPenalty = 10 + Math.floor(context.frozen_duration_hours); 
      } else {
          frozenPenalty = 50; 
      }
      if (context.frozen_duration_hours >= 72) {
          frozenCap = 10; 
      }
  }

  // --- FINAL FORMULA ---
  let netScore = (rawTotal - restartPenalty - frozenPenalty) * consistencyMult;

  netScore = Math.min(netScore, frozenCap);
  netScore = Math.max(0, Math.min(100, netScore));

  return {
    total: Math.round(netScore),
    breakdown: { 
      uptime: Math.round(uptimeScore), 
      version: Math.round(versionScore), 
      reputation: reputationScore !== null ? Math.round(reputationScore) : null, 
      storage: Math.round(totalStorageScore),
      penalties: {
        restarts: Math.round(restartPenalty + frozenPenalty), 
        consistency: Number(consistencyMult.toFixed(2)),
        restarts_7d_count: context.restarts_7d
      }
    }
  };
};