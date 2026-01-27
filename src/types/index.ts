export interface Node {
  uid?: string;
  address?: string;
  pubkey?: string;
  version?: string;
  uptime?: number;
  last_seen_timestamp?: number;
  is_public?: boolean;
  network?: 'MAINNET' | 'DEVNET' | 'UNKNOWN';
  storage_used?: number;
  storage_committed?: number;
  storage_usage_percentage?: string;
  storage_usage_raw?: number;
  rank?: number;
  health_rank?: number;
  credits: number | null;
  location?: {
    lat: number;
    lon: number;
    countryName: string;
    countryCode: string;
    city: string;
  };
  // NEW: Professional Vitality Metrics
  health?: number;
  healthBreakdown?: {
    uptime: number;
    version: number;
    reputation: number | null;
    storage: number;
    // NEW: Penalty Object
    penalties?: {
      restarts: number;        // Points subtracted (e.g. 36)
      consistency: number;     // The multiplier (e.g. 0.81)
      restarts_7d_count: number; // Raw count for UI
    };
  };
  clusterStats?: {
    totalGlobal: number;
    mainnetCount: number;
    devnetCount: number;
  };
}
