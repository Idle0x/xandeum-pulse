import { useMemo } from 'react';
import { Node } from '../types';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';

type SortOption = 'uptime' | 'version' | 'storage' | 'health';
type SortOrder = 'asc' | 'desc';
type NetworkOption = 'ALL' | 'MAINNET' | 'DEVNET';

export const useNodeFilter = (
  nodes: Node[],
  searchQuery: string,
  networkFilter: NetworkOption,
  sortBy: SortOption,
  sortOrder: SortOrder
) => {

  // Helper: Extract value for sorting
  const getSortValue = (node: Node, metric: SortOption): number | string => {
    switch (metric) {
      case 'storage':
        // Map 'storage' to committed (capacity), as requested
        return node.storage_committed ?? -1; 
      case 'uptime':
        return node.uptime ?? -1;
      case 'health':
        return node.health ?? -1;
      case 'version':
        return node.version || '0.0.0';
      default:
        return 0;
    }
  };

  // MAIN LOGIC: Filter & Sort
  const filteredNodes = useMemo(() => {
    // A. Filter Stage
    let result = nodes.filter(node => {
      // Network Filter
      if (networkFilter !== 'ALL' && node.network !== networkFilter) {
        return false;
      }

      // Search Query
      if (!searchQuery) return true;

      const q = searchQuery.toLowerCase();
      const addr = (getSafeIp(node) || '').toLowerCase();
      const pub = (node.pubkey || '').toLowerCase();
      const ver = (node.version || '').toLowerCase();
      const country = (node.location?.countryName || '').toLowerCase();

      return addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q);
    });

    // B. Sort Stage
    result.sort((a, b) => {
      const valA = getSortValue(a, sortBy);
      const valB = getSortValue(b, sortBy);

      // Special Handling for Version Strings
      if (sortBy === 'version') {
        const res = compareVersions(valA as string, valB as string);
        return sortOrder === 'asc' ? res : -res;
      }

      // Standard Numeric Sort
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [nodes, searchQuery, networkFilter, sortBy, sortOrder]);

  return filteredNodes;
};
