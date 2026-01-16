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

  // Helpers
  const handleSortChange = (metric: SortOption) => {
    if (sortBy === metric) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(metric);
        setSortOrder('desc'); 
    }
  };

  // Scroll to top on search
  useEffect(() => {
    if (searchQuery.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // Main Logic
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const q = searchQuery.toLowerCase();
      const addr = (getSafeIp(node) || '').toLowerCase();
      const pub = (node.pubkey || '').toLowerCase();
      const ver = (node.version || '').toLowerCase();
      const country = (node.location?.countryName || '').toLowerCase();
  
      const networkMatch = networkFilter === 'ALL' || node.network === networkFilter;
  
      return networkMatch && (addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q));
    }).sort((a, b) => {
      let valA: any, valB: any;
  
      if (sortBy === 'storage') {
        valA = a.storage_committed || 0;
        valB = b.storage_committed || 0;
      } else if (sortBy === 'health') {
        valA = a.health || 0;
        valB = b.health || 0;
      } else if (sortBy === 'version') {
         const res = compareVersions(a.version || '0.0.0', b.version || '0.0.0');
         return sortOrder === 'asc' ? res : -res;
      } else {
        valA = (a as any)[sortBy] || 0;
        valB = (b as any)[sortBy] || 0;
      }
  
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
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
