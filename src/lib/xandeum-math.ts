// PURE MATHEMATIC LOGIC - CLIENT & SERVER SAFE
// No Node.js dependencies allowed here (e.g. no 'fs', 'net', 'geoip')

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
  if (distance === 5) return 10;
  return Math.max(0, 10 - (distance - 5));
};

export const calculateVitalityScore = (
  storageCommitted: number, storageUsed: number, uptimeSeconds: number,
  version: string, consensusVersion: string, sortedCleanVersions: string[],
  medianCredits: number, credits: number | null, medianStorage: number,
  isCreditsApiOnline: boolean
) => {
  if (storageCommitted <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 } };

  const uptimeDays = uptimeSeconds / 86400;
  let uptimeScore = calculateSigmoidScore(uptimeDays, 7, 0.2);
  if (uptimeDays < 1) uptimeScore = Math.min(uptimeScore, 20);

  const baseStorageScore = calculateLogScore(storageCommitted, medianStorage, 100);
  const utilizationBonus = storageUsed > 0 ? Math.min(15, 5 * Math.log2((storageUsed / (1024 ** 3)) + 2)) : 0;
  const totalStorageScore = baseStorageScore + utilizationBonus;

  const versionScore = getVersionScoreByRank(version, consensusVersion, sortedCleanVersions);

  let total = 0;
  let reputationScore: number | null = null;

  if (credits !== null && medianCredits > 0) {
    reputationScore = Math.min(100, (credits / (medianCredits * 2)) * 100);
    total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (reputationScore * 0.20) + (versionScore * 0.15));
  } else if (isCreditsApiOnline) {
    reputationScore = 0;
    total = Math.round((uptimeScore * 0.35) + (totalStorageScore * 0.30) + (0 * 0.20) + (versionScore * 0.15));
  } else {
    // Re-weight if API is offline
    total = Math.round((uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20));
    reputationScore = null;
  }

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: { uptime: Math.round(uptimeScore), version: Math.round(versionScore), reputation: reputationScore, storage: Math.round(totalStorageScore) }
  };
};
