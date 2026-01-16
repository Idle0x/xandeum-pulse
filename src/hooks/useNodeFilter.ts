import { useState, useMemo, useEffect } from 'react';
import { Node } from '../types';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';

type SortOption = 'uptime' | 'version' | 'storage' | 'health';
type SortOrder = 'asc' | 'desc';
type NetworkOption = 'ALL' | 'MAINNET' | 'DEVNET';

export const useNodeFilter = (nodes: Node[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [networkFilter, setNetworkFilter] = useState<NetworkOption>('ALL');

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('storage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 1. Helper: Toggle Sort Order
  const handleSortChange = (metric: SortOption) => {
    if (sortBy === metric) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(metric);
        setSortOrder('desc'); // Default to high-to-low for new metrics
    }
  };

  // 2. Helper: Extract exact value for sorting
  const getSortValue = (node: Node, metric: SortOption): number | string => {
    switch (metric) {
      case 'storage':
        return node.storage_committed ?? -1; // Default to -1 to push to bottom
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

  // 3. Scroll to top on search interaction
  useEffect(() => {
    if (searchQuery.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // 4. MAIN LOGIC: Filter & Sort
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

  return {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    networkFilter,
    setNetworkFilter,
    sortBy,
    sortOrder,
    handleSortChange,
    filteredNodes
  };
};
