import { formatBytes, formatUptime } from '../../src/utils/formatters';
import { checkIsLatest, compareVersions } from '../../src/utils/nodeHelpers';

describe('Utility Functions', () => {

  describe('formatBytes', () => {
    test('Should format bytes to human readable strings', () => {
      // 0 bytes
      expect(formatBytes(0)).toBe('0.00 B');
      
      // 1 KB (Flexible match for "1 KB" or "1.00 KB")
      const kb = formatBytes(1024);
      expect(['1 KB', '1.00 KB']).toContain(kb);

      // 1 MB
      const mb = formatBytes(1024 * 1024);
      expect(['1 MB', '1.00 MB']).toContain(mb); 

      // 2.5 GB (Flexible match)
      const gb = formatBytes(1024 * 1024 * 1024 * 2.5);
      expect(['2.5 GB', '2.50 GB']).toContain(gb);
    });

    test('Should handle undefined or null', () => {
      expect(formatBytes(undefined)).toBe('0.00 B');
    });
  });

  describe('formatUptime', () => {
    test('Should format seconds to days/hours', () => {
      expect(formatUptime(3600)).toBe('1h');
      expect(formatUptime(86400)).toBe('1d 0h');
    });
  });

  describe('compareVersions', () => {
    test('Should compare semver strings correctly', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    });
  });

  describe('checkIsLatest', () => {
    test('Should return true if node is equal or ahead of consensus', () => {
      expect(checkIsLatest('1.5.0', '1.5.0')).toBe(true);
    });
  });
});
