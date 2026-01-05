// lib/xandeum-economics.ts

// --- CONSTANTS ---
export const ERA_BOOSTS = { 'DeepSouth': 16, 'South': 10, 'Main': 7, 'Coal': 3.5, 'Central': 2, 'North': 1.25 };
export const NFT_BOOSTS = { 'Titan': 11, 'Dragon': 4, 'Coyote': 2.5, 'Rabbit': 1.5, 'Cricket': 1.1, 'XENO': 1.1 };

export interface StoincInputs {
  storageVal: number;
  storageUnit: 'MB' | 'GB' | 'TB' | 'PB';
  nodeCount: number;
  performance: number; // 0.0 - 1.0
  stake: number;
  boosts: Record<string, number>; // e.g. { "Titan": 1, "South": 2 }
  networkTotalBase: number; // Current network raw credits
  networkAvgMult?: number; // User estimation (default 14)
  networkFees?: number; // Total SOL fees
}

export function calculateStoinc(inputs: StoincInputs) {
  // 1. NORMALIZE STORAGE TO GB
  let storageInGB = inputs.storageVal;
  if (inputs.storageUnit === 'MB') storageInGB = inputs.storageVal / 1000;
  if (inputs.storageUnit === 'TB') storageInGB = inputs.storageVal * 1000;
  if (inputs.storageUnit === 'PB') storageInGB = inputs.storageVal * 1000000;

  // 2. CALCULATE BASE CREDITS (Raw)
  // Formula: Nodes * Storage * Perf * Stake
  const validPerf = Math.min(1, Math.max(0, inputs.performance));
  const userBaseCredits = Math.max(1, inputs.nodeCount) * storageInGB * validPerf * inputs.stake;

  // 3. CALCULATE GEOMETRIC BOOST
  let product = 1;
  Object.entries(inputs.boosts).forEach(([name, count]) => {
      const val = {...ERA_BOOSTS, ...NFT_BOOSTS}[name as keyof typeof ERA_BOOSTS | keyof typeof NFT_BOOSTS] || 1;
      // Geometric stacking: Multiply val 'count' times
      for(let i=0; i<count; i++) product *= val;
  });

  // Root based on node count to normalize fairness
  // If importing 1 node, nodeCount is 1. If simulating fleet, it uses root of fleet size.
  const safeNodes = Math.max(1, inputs.nodeCount);
  const geoMean = Math.pow(product, 1 / safeNodes);
  
  const boostedCredits = userBaseCredits * geoMean;

  // 4. NETWORK SHARE & EARNINGS
  const avgMult = inputs.networkAvgMult || 14;
  const fees = inputs.networkFees || 100;
  
  // Estimate Network Total (Existing + Our New Power)
  const estimatedNetworkBoostedTotal = (inputs.networkTotalBase * avgMult) + boostedCredits;
  
  const share = estimatedNetworkBoostedTotal > 0 ? boostedCredits / estimatedNetworkBoostedTotal : 0;
  const solEarnings = fees * 0.94 * share; // 94% Distribution

  return {
    userBaseCredits,
    geoMean,
    boostedCredits,
    share,
    solEarnings
  };
}
