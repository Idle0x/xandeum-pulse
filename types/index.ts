import * as React from 'react';

// --- MAIN INTERFACE ---
export interface Node {
  uid?: string; // <--- Unique ID
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
  health?: number;
  healthBreakdown?: {
    uptime: number;
    version: number;
    reputation: number | null;
    storage: number;
  };
  clusterStats?: {
    totalGlobal: number;
    mainnetCount: number;
    devnetCount: number;
  };
}

// --- MODULE DECLARATIONS ---
// Only declare this module ONCE. 

declare module 'react-simple-maps' {
  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string | Function;
    projectionConfig?: object;
    className?: string;
    style?: object;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const ZoomableGroup: React.FC<any>;
  export const Geographies: React.FC<any>;
  export const Geography: React.FC<any>;
  export const Marker: React.FC<any>;
  export const Line: React.FC<any>;
  export const Annotation: React.FC<any>;
}

declare module 'd3-scale' {
  export function scaleSqrt(): any;
  export function scaleLinear(): any;
}