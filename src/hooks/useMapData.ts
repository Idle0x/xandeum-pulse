import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LocationData, MapStats, ViewMode, NetworkType } from '../types/map';

export function useMapData(viewMode: ViewMode, selectedNetwork: NetworkType) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);
  
  // 1. Fetching Logic
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get(`/api/geo?network=${selectedNetwork}`);
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    fetchGeo();
    const interval = setInterval(fetchGeo, 10000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  // 2. Aggregation Logic (Country Breakdown)
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, {
      code: string;
      name: string;
      count: number;
      storage: number;
      credits: number;
      healthSum: number;
      uptimeSum: number;
      stableCount: number;
    }>();

    locations.forEach(loc => {
      const code = loc.countryCode || 'XX';
      const current = map.get(code) || { 
        code, 
        name: loc.country, 
        count: 0, 
        storage: 0, 
        credits: 0, 
        healthSum: 0,
        uptimeSum: 0,
        stableCount: 0 
      };

      current.count += loc.count;
      current.storage += loc.totalStorage;
      current.credits += (loc.totalCredits || 0);
      current.healthSum += (loc.avgHealth * loc.count); 
      current.uptimeSum += (loc.avgUptime * loc.count);

      if (loc.avgUptime > 86400) {
          current.stableCount += loc.count;
      }

      map.set(code, current);
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      avgHealth: c.healthSum / (c.count || 1),
      avgUptime: c.uptimeSum / (c.count || 1)
    })).sort((a, b) => {
      if (viewMode === 'STORAGE') return b.storage - a.storage;
      if (viewMode === 'CREDITS') return b.credits - a.credits;
      return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  // 3. Global Totals
  const globalTotals = useMemo(() => {
    return {
      storage: countryBreakdown.reduce((sum, c) => sum + c.storage, 0),
      credits: countryBreakdown.reduce((sum, c) => sum + c.credits, 0),
      nodes: countryBreakdown.reduce((sum, c) => sum + c.count, 0)
    };
  }, [countryBreakdown]);

  // 4. API Status Check
  const isGlobalCreditsOffline = useMemo(() => {
      if (locations.length === 0) return false; 
      return !locations.some(l => l.totalCredits !== null);
  }, [locations]);

  // 5. Sorted Locations (for the Drawer List)
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return (b.totalCredits || 0) - (a.totalCredits || 0);
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  return {
    locations,
    stats,
    loading,
    countryBreakdown,
    globalTotals,
    isGlobalCreditsOffline,
    sortedLocations
  };
}
