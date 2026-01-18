import { Globe, Server, Network } from 'lucide-react';
import { ViewMode, NetworkType } from '../types/map';

export const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const HEALTH_THRESHOLDS = [90, 75, 60, 40];

export const MODE_COLORS: Record<ViewMode, { hex: string; tailwind: string; bg: string; border: string }> = {
    STORAGE: { hex: '#6366f1', tailwind: 'text-indigo-500', bg: 'bg-indigo-600', border: 'border-indigo-500/50' },
    HEALTH:  { hex: '#10b981', tailwind: 'text-emerald-500', bg: 'bg-emerald-600', border: 'border-emerald-500/50' },
    CREDITS: { hex: '#f97316', tailwind: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500/50' }
};

export const NETWORK_STYLES: Record<NetworkType, { color: string; label: string; icon: any }> = {
    ALL: { color: 'text-white', label: 'All Networks', icon: Globe },
    MAINNET: { color: 'text-green-500', label: 'Mainnet', icon: Server },
    DEVNET: { color: 'text-blue-500', label: 'Devnet', icon: Network }
};

export const TIER_COLORS = [
    "#f59e0b", 
    "#ec4899", 
    "#00ced1", 
    "#00bfff", 
    "#d8b4fe"  
];

export const TIER_LABELS: Record<ViewMode, string[]> = {
    STORAGE: ['Massive Hub', 'Major Zone', 'Standard', 'Entry Level', 'Micro Node'],
    CREDITS: ['Legendary', 'Elite', 'Proven', 'Active', 'New Entry'],
    HEALTH:  ['Flawless', 'Robust', 'Fair', 'Shaky', 'Critical']
};
