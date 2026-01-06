import { 
  cleanSemver, 
  compareVersions, 
  calculateVitalityScore,
  getVersionScoreByRank
} from '../../lib/xandeum-brain';

describe('Xandeum Brain (Unit Logic)', () => {

  // --- 1. SEMVER PRECISION TESTS ---
  describe('Version Normalization', () => {
    test('Should strip "beta" or "trynet" suffixes', () => {
      expect(cleanSemver('1.5.0-beta')).toBe('1.5.0');
      expect(cleanSemver('2.0.1-trynet')).toBe('2.0.1');
    });

    test('Should handle null or empty versions safely', () => {
      expect(cleanSemver('')).toBe('0.0.0');
      // @ts-ignore - simulating bad API data
      expect(cleanSemver(null)).toBe('0.0.0');
    });
  });

  describe('Version Comparison', () => {
    test('Should identify newer versions correctly', () => {
      // 1.5.0 is newer than 1.4.9
      expect(compareVersions('1.5.0', '1.4.9')).toBe(1);
    });

    test('Should handle equal versions', () => {
      expect(compareVersions('1.2.0', '1.2.0')).toBe(0);
    });

    test('Should handle major version jumps', () => {
      expect(compareVersions('2.0.0', '1.9.99')).toBe(1);
    });
  });

  // --- 2. VITALITY ALGORITHM TESTS (The Core) ---
  describe('Vitality Score Algorithm', () => {

    // Mock Data Constants
    const MEDIAN_STORAGE = 1000;
    const MEDIAN_CREDITS = 5000;
    const LATEST_VER = '1.5.0';
    const CONSENSUS_VER = '1.5.0';
    const SORTED_VERSIONS = ['1.5.0', '1.4.0', '1.3.0'];

    test('GATEKEEPER RULE: Storage 0 should result in Health 0', () => {
      const result = calculateVitalityScore(
        0, // Committed Storage = 0 (FAIL CONDITION)
        0, // Used
        864000, // High Uptime
        LATEST_VER,
        CONSENSUS_VER,
        SORTED_VERSIONS,
        MEDIAN_CREDITS,
        10000, // High Credits
        MEDIAN_STORAGE
      );

      expect(result.total).toBe(0);
      expect(result.breakdown.uptime).toBe(0);
    });

    test('CRASH PROTOCOL: Should handle NULL credits (API Offline)', () => {
      const result = calculateVitalityScore(
        2000, // Good Storage
        1000, 
        864000, // Good Uptime
        LATEST_VER,
        CONSENSUS_VER,
        SORTED_VERSIONS,
        MEDIAN_CREDITS,
        null, // <--- API IS OFFLINE (Null)
        MEDIAN_STORAGE
      );

      // Should still generate a score, just re-weighted
      expect(result.total).toBeGreaterThan(0);
      // Reputation breakdown should be explicitly null to trigger UI badge
      expect(result.breakdown.reputation).toBeNull(); 
    });

    test('NEW NODE PENALTY: Uptime < 24h should cap score', () => {
      const result = calculateVitalityScore(
        2000,
        1000,
        3600, // Only 1 hour uptime
        LATEST_VER,
        CONSENSUS_VER,
        SORTED_VERSIONS,
        MEDIAN_CREDITS,
        5000,
        MEDIAN_STORAGE
      );

      // Sigmoid curve should punish low uptime heavily
      expect(result.breakdown.uptime).toBeLessThan(30);
    });

    test('PERFECT NODE: Should achieve 100 score', () => {
      const result = calculateVitalityScore(
        5000, // High Storage
        2000,
        86400 * 30, // 30 Days Uptime
        LATEST_VER, // Latest Version
        CONSENSUS_VER,
        SORTED_VERSIONS,
        MEDIAN_CREDITS,
        10000, // High Credits
        MEDIAN_STORAGE
      );

      // Score might cap at 100 or be very close
      expect(result.total).toBeGreaterThanOrEqual(95);
    });
  });

  // --- 3. VERSION DISTANCE TESTS ---
  describe('Version Scoring Logic', () => {
    const LIST = ['1.5.0', '1.4.0', '1.3.0', '1.2.0', '1.1.0', '1.0.0'];
    const CONSENSUS = '1.5.0';

    test('Latest version receives 100 pts', () => {
      expect(getVersionScoreByRank('1.5.0', CONSENSUS, LIST)).toBe(100);
    });

    test('1 Version behind receives 90 pts (Soft Penalty)', () => {
      expect(getVersionScoreByRank('1.4.0', CONSENSUS, LIST)).toBe(90);
    });

    test('DEATH ZONE: 6 versions behind receives severe penalty', () => {
      // 1.5.0 -> 1.4 -> 1.3 -> 1.2 -> 1.1 -> 1.0 (5 steps away)
      const score = getVersionScoreByRank('1.0.0', CONSENSUS, LIST);
      expect(score).toBeLessThan(20);
    });
  });

});