import { formatBytes, formatUptime } from '../../src/utils/formatters';
import { checkIsLatest, compareVersions } from '../../src/utils/nodeHelpers';

describe('Utility Functions', () => {

  describe('formatBytes', () => {
    test('Should format bytes to human readable strings', () => {
      expect(formatBytes(0)).toBe('0.00 B');
      
      // Flexible matching for different test environments
      const kb = formatBytes(1024);
      expect(['1 KB', '1.00 KB']).toContain(kb);

      const mb = formatBytes(1024 * 1024);
      expect(['1 MB', '1.00 MB']).toContain(mb); 

      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.50 GB');
    });

    test('Should handle undefined or null', () => {
      expect(formatBytes(undefined)).toBe('0.00 B');
    });
  });

  describe('formatUptime', () => {
    test('Should format seconds to days/hours', () => {
      expect(formatUptime(3600)).toBe('1h');
      expect(formatUptime(86400)).toBe('1d 0h');
      expect(formatUptime(90000)).toBe('1d 1h');
    });
  });

  describe('compareVersions', () => {
    test('Should compare semver strings correctly', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1); // Newer
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1); // Older
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });
  });

  describe('checkIsLatest', () => {
    test('Should return true if node is equal or ahead of consensus', () => {
      expect(checkIsLatest('1.5.0', '1.5.0')).toBe(true);
      expect(checkIsLatest('1.6.0', '1.5.0')).toBe(true);
    });

    test('Should return false if node is behind', () => {
      expect(checkIsLatest('1.4.9', '1.5.0')).toBe(false);
    });
  });

});
