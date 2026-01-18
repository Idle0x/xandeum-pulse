// src/types/leaderboard.ts

export type NetworkType = 'MAINNET' | 'DEVNET';

export interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  health: number;
  network: NetworkType;
  address?: string;
  location?: {
    countryName: string;
    countryCode: string;
  };
  trend: number;
}

export interface NodeStats {
  pubkey: string;
  address: string;
  location?: any;
  health: number;
}

export interface StoincMetrics {
  rawCredits: number;
  geoMean: number;
  boostedCredits: number;
  share: number;
  stoinc: number;
  currentNetworkTotal: number;
}
