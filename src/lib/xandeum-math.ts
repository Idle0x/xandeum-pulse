// PURE MATHEMATIC LOGIC - CLIENT & SERVER SAFE

// --- HELPER INTERFACES ---
export interface ForensicContext {
  restarts_7d: number;      
  restarts_24h: number;          // NEW: Trauma context
  yield_velocity_24h: number;    // NEW: Zombie context
  consistency_score: number;
  frozen_duration_hours: number; // NEW: Ice Age context
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

// --- NEW: ELASTIC STORAGE SCORE (The Trifecta Model) ---
export const calculateElasticStorageScore = (
  committedBytes: number, 
  medianBytes: number, 
  p95Bytes: number
) => {
  if (medianBytes === 0) return 0;
  
  // Guard: Ensure P95 is at least Median to prevent division errors
  const safeP95 = Math.max(p95Bytes, medianBytes * 1.01);
  
  // ZONE 1: The Standard Zone (C <= Median)
  // Logic: Fair start. Hit Median = 50 pts.
  if (committedBytes <= medianBytes) {
      return 50 * Math.log2((committedBytes / medianBytes) + 1);
  }
  
  // ZONE 2: The Growth Zone (Median < C <= P95)
  // Logic: Scale from 50 -> 90 pts based on position between Median and Elite.
  // We use Log10 to dampen the massive gap between 140GB and 4TB.
  if (committedBytes <= safeP95) {
      const position = Math.log10(committedBytes / medianBytes) / Math.log10(safeP95 / medianBytes);
      return 50 + (40 * position);
  }
  
  // ZONE 3: The Whale Zone (C > P95)
  // Logic: The final push to 100 requires doubling the P95.
  // 90 pts base + logarithmic bonus.
  return Math.min(100, 90 + 10 * Math.log2((committedBytes / safeP95) + 1));
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
  p95Storage: number, // NEW INPUT
  isCreditsApiOnline: boolean,
  context: ForensicContext 
) => {
  // 1. HARD GATE: No storage = No Score.
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0, penalties: { restarts: 0, consistency: 1, restarts_7d_count: 0 } } };

  // --- PILLAR 1: UPTIME (The Veteran Curve) ---
  const uptimeDays = uptimeSeconds / 86400;
  const uptimeScore = calculateSigmoidScore(uptimeDays, 30, 0.15); 

  // --- PILLAR 2: STORAGE (Elastic Model + Utility) ---
  const baseStorageScore = calculateElasticStorageScore(storageCommitted, medianStorage, p95Storage);
  
  // Utilization Bonus (Unchanged: Absolute value reward)
  // Max 15 pts if usage is high
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  
  // Combine but cap sub-score at 100 (Bonus can push it up, but total health logic handles the final cap)
  const totalStorageScore = Math.min(100, baseStorageScore + utilizationBonus);

  // --- PILLAR 3: VERSION (The Sunset Gate) ---
  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  // --- PILLAR 4: REPUTATION (Wealth + Velocity) ---
  let reputationScore: number | null = null;

  if (credits !== null && medianCredits > 0) {
    let rawRepScore = Math.min(100, (credits / (medianCredits * 2)) * 100);

    // ZOMBIE CHECK: If earning nothing today, max rep is capped at 50%
    if (context.yield_velocity_24h === 0) {
       rawRepScore = Math.min(50, rawRepScore); 
    }
    reputationScore = rawRepScore;
  } else if (isCreditsApiOnline) {
    reputationScore = 0; // API online, node has no credits
  } else {
    reputationScore = null; // API offline
  }

  // --- RAW CALCULATION ---
  let rawTotal = 0;

  if (reputationScore !== null) {
      // Balanced Weights
      rawTotal = (uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15);
  } else {
      // Re-weight if Rep is offline
      rawTotal = (uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20);
  }

  // --- THE PENALTIES (The Teeth) ---

  // A. Quadratic Restart Penalty (Base)
  const rawRestartPenalty = Math.pow(context.restarts_7d, 2);
  let restartPenalty = Math.min(36, rawRestartPenalty);

  // B. Trauma Multiplier (Rapid Restarts)
  // If >5 restarts in 24h, we increase severity by 50%
  if (context.restarts_24h > 5) {
      restartPenalty = Math.min(50, restartPenalty * 1.5);
  }

  // C. Consistency Damper (Multiplier)
  const consistencyMult = Math.pow(context.consistency_score, 2);

  // D. FROZEN PENALTY (The Ice Age Protocol)
  let frozenPenalty = 0;
  let frozenCap = 100; // Default no cap

  if (context.frozen_duration_hours > 0) {
      // 1. Immediate Warning (< 1 Hour)
      if (context.frozen_duration_hours < 1) {
          frozenPenalty = 5;
      }
      // 2. Escalating Negligence (1h - 24h)
      else if (context.frozen_duration_hours < 24) {
          frozenPenalty = 10 + Math.floor(context.frozen_duration_hours); 
      }
      // 3. Heavy Penalty (> 24h)
      else {
          frozenPenalty = 50; 
      }

      // 4. THE CAP (> 3 Days / 72 Hours)
      if (context.frozen_duration_hours >= 72) {
          frozenCap = 10; // Cap score at 10
      }
  }

  // --- FINAL FORMULA ---
  let netScore = (rawTotal - restartPenalty - frozenPenalty) * consistencyMult;

  // Apply Hard Caps
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
        restarts: Math.round(restartPenalty + frozenPenalty), 
        consistency: Number(consistencyMult.toFixed(2)),
        restarts_7d_count: context.restarts_7d
      }
    }
  };
};
