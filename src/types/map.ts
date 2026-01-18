import { Globe, Server, Network } from 'lucide-react';

export type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';
export type NetworkType = 'ALL' | 'MAINNET' | 'DEVNET';

export interface TopPerformerData {
    pk: string;
    val: number;
    subVal?: number; 
    network?: string;
    address?: string; 
    isUntracked?: boolean; 
}

export interface LocationData {
  name: string; 
  country: string; 
  lat: number; 
  lon: number; 
  count: number;
  totalStorage: number; 
  totalCredits: number | null; 
  avgHealth: number;
  avgUptime: number;
  publicRatio: number;
  ips?: string[];
  countryCode?: string;
  topPerformers?: {
      STORAGE: TopPerformerData;
      CREDITS: TopPerformerData;
      HEALTH: TopPerformerData;
  };
}

export interface MapStats {
  totalNodes: number; 
  countries: number; 
  topRegion: string; 
  topRegionMetric: number;
}

// Helper interface for the aggregation logic
export interface CountryAggregated {
    code: string;
    name: string;
    count: number;
    storage: number;
    credits: number;
    healthSum: number;
    uptimeSum: number;
    stableCount: number;
    avgHealth: number;
    avgUptime: number;
}
