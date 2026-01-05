// __tests__/lib/xandeum-economics.test.ts

import { calculateStoinc, ERA_BOOSTS, NFT_BOOSTS } from '../../lib/xandeum-economics';

describe('Xandeum Economics (Stoinc Simulator)', () => {

  // Baseline mock data
  const BASE_INPUT = {
    storageVal: 1,
    storageUnit: 'TB' as const, // 1000 GB
    nodeCount: 1,
    performance: 1.0, // 100%
    stake: 1000, // 1000 XAND
    boosts: {},
    networkTotalBase: 5000000, // 5M existing credits
    networkFees: 1000 // 1000 SOL pot
  };

  // ===========================================
  // TEST 1: UNIT CONVERSION PRECISION
  // ===========================================
  test('Should normalize storage units correctly (TB -> GB)', () => {
    const result = calculateStoinc({ ...BASE_INPUT, storageVal: 2, storageUnit: 'TB' });
    // 2 TB * 1000 Stake * 1 Perf * 1 Node = 2,000,000 Base
    expect(result.userBaseCredits).toBe(2000000); 
  });

  test('Should handle MB precision', () => {
    const result = calculateStoinc({ ...BASE_INPUT, storageVal: 500, storageUnit: 'MB' });
    // 0.5 GB * 1000 Stake = 500 Base
    expect(result.userBaseCredits).toBe(500); 
  });

  // ===========================================
  // TEST 2: GEOMETRIC BOOST STACKING
  // ===========================================
  test('Should apply GEOMETRIC stacking for multiple NFTs (Not Linear)', () => {
    // Scenario: 1 Titan (11x) + 1 Dragon (4x)
    // Linear would be: 1 + 11 + 4 = 16x (WRONG)
    // Geometric is: 1 * 11 * 4 = 44x (CORRECT)
    
    const result = calculateStoinc({ 
      ...BASE_INPUT, 
      boosts: { 'Titan': 1, 'Dragon': 1 } 
    });

    const expectedMult = NFT_BOOSTS.Titan * NFT_BOOSTS.Dragon; // 11 * 4 = 44
    expect(result.geoMean).toBeCloseTo(expectedMult, 2);
  });

  test('Should handle Fleet Root scaling (The "Whale" Check)', () => {
    // If you have 2 nodes, and 2 Titans, you don't get 11*11=121x.
    // You get sqrt(11*11) = 11x average boost per node.
    
    const result = calculateStoinc({ 
      ...BASE_INPUT, 
      nodeCount: 2,
      boosts: { 'Titan': 2 } 
    });

    // Math: (11 * 11) ^ (1/2) = 11
    expect(result.geoMean).toBeCloseTo(11, 2);
  });

  // ===========================================
  // TEST 3: EDGE CASES & SAFETY
  // ===========================================
  test('Should handle 0 performance (Offline Node)', () => {
    const result = calculateStoinc({ ...BASE_INPUT, performance: 0 });
    expect(result.userBaseCredits).toBe(0);
    expect(result.solEarnings).toBe(0);
  });

  test('Should clamp negative performance to 0', () => {
    const result = calculateStoinc({ ...BASE_INPUT, performance: -0.5 });
    expect(result.userBaseCredits).toBe(0);
  });

  test('Should handle empty network (Division by Zero protection)', () => {
    const result = calculateStoinc({ 
      ...BASE_INPUT, 
      networkTotalBase: 0, 
      networkFees: 100 
    });
    
    // If we are the ONLY node, we should get 100% of rewards (approx 94 SOL)
    // Formula: share = our / (0 + our) = 1.0
    expect(result.share).toBeCloseTo(1.0, 5);
    expect(result.solEarnings).toBeCloseTo(94, 2);
  });

});
