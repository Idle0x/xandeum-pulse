import { useMemo } from 'react';
import { Node } from '../types';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';

type SortOption = 'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits';
type SortOrder = 'asc' | 'desc';
type NetworkOption = 'ALL' | 'MAINNET' | 'DEVNET';

export const useNodeFilter = (
  nodes: Node[],
  searchQuery: string,
  networkFilter: NetworkOption,
  sortBy: SortOption,
  sortOrder: SortOrder
) => {

  const getSortValue = (node: Node, metric: SortOption): number | string => {
    switch (metric) {
      case 'storage':
        return node.storage_committed ?? -1; 
      case 'storage_used':
        return node.storage_used ?? -1;
      case 'uptime':
        return node.uptime ?? -1;
      case 'health':
        return node.health ?? -1;
      case 'version':
        return node.version || '0.0.0';
      case 'credits':
        return node.credits ?? -1;
      default:
        return 0;
    }
  };

  const filteredNodes = useMemo(() => {
    // 1. FILTER STAGE
    let result = nodes.filter(node => {
      // Network Check
      if (networkFilter !== 'ALL' && node.network !== networkFilter) return false;

      // Search Check
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const addr = (getSafeIp(node) || '').toLowerCase();
      const pub = (node.pubkey || '').toLowerCase();
      const ver = (node.version || '').toLowerCase();
      const country = (node.location?.countryName || '').toLowerCase();

      return addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q);
    });

    // 2. SORT STAGE (With Tie-Breakers)
    result.sort((a, b) => {
      const valA = getSortValue(a, sortBy);
      const valB = getSortValue(b, sortBy);

      // A. Version Sorting
      if (sortBy === 'version') {
        const res = compareVersions(valA as string, valB as string);
        return sortOrder === 'asc' ? res : -res;
      }

      // B. Numeric Sorting
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;

      // C. TIE-BREAKER (Pubkey)
      return (a.pubkey || '').localeCompare(b.pubkey || '');
    });

    // 3. RETURN SHALLOW COPY
    return [...result]; 

  }, [nodes, searchQuery, networkFilter, sortBy, sortOrder]);

  return filteredNodes;
};
