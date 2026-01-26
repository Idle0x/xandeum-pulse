import { useMemo } from 'react';
import { Node } from '../types';
import { NodeHistoryPoint } from './useNodeHistory';
import { Wifi, WifiOff, Activity, ThermometerSun } from 'lucide-react';

export type VitalityStatus = 'ONLINE' | 'OFFLINE' | 'STAGNANT' | 'WARMUP';

interface VitalityResult {
  status: VitalityStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  reason: string;
  confidence: number; // 0-100% confidence in this diagnosis
}

export const useNodeVitality = (node: Node, history: NodeHistoryPoint[] = []) => {
  return useMemo((): VitalityResult => {
    const now = Date.now();
    const lastSeen = node.last_seen_timestamp ? node.last_seen_timestamp * 1000 : 0;
    const sinceSeenMs = now - lastSeen;
    const sinceSeenMins = sinceSeenMs / 1000 / 60;
    const currentUptime = node.uptime || 0;

    // --- 1. PATTERN ANALYSIS HELPERS ---
    
    // Get history points from ~1 hour and ~3 hours ago to check trends
    // We assume history is sorted or we sort it here to be safe
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
    
    const oneHourAgo = sortedHistory.find(p => (now - new Date(p.date).getTime()) > 60 * 60 * 1000);
    const threeHoursAgo = sortedHistory.find(p => (now - new Date(p.date).getTime()) > 3 * 60 * 60 * 1000);

    // Metric: Data Consistency (How often was it missing in the last 5 snapshots?)
    const recentSnapshots = sortedHistory.slice(0, 5);
    const missingCount = recentSnapshots.filter(p => p.health === 0).length;
    const consistencyScore = recentSnapshots.length > 0 ? ((recentSnapshots.length - missingCount) / recentSnapshots.length) : 1;

    // Metric: Uptime Progression (Is the counter moving?)
    let isFrozen = false;
    if (oneHourAgo) {
        const deltaUptime = currentUptime - oneHourAgo.uptime;
        // If uptime increased by less than 60 seconds over a 1 hour real-time window, it's suspicious
        if (Math.abs(deltaUptime) < 60 && currentUptime > 1000) {
            isFrozen = true;
        }
    }

    // --- 2. DIAGNOSTIC LOGIC ---

    // A. DETECT STAGNANT (The Zombie)
    // Priority: High (Because it looks like it's working but isn't)
    if (isFrozen && sinceSeenMins < 120) { // Must be "seen" recently to be stagnant, otherwise it's just offline
        return {
            status: 'STAGNANT',
            label: 'STAGNANT',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            icon: Activity,
            reason: 'Uptime counter is frozen despite recent contact',
            confidence: 90
        };
    }

    // B. DETECT WARMUP (The Recovery)
    // Logic: Low uptime (< 30m) AND strictly consistent connection since reset
    if (currentUptime < 30 * 60 && sinceSeenMins < 20) {
        return {
            status: 'WARMUP',
            label: 'WARMING UP',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20',
            icon: ThermometerSun,
            reason: `Node restarted ${Math.round(currentUptime / 60)}m ago. Stabilizing.`,
            confidence: 100
        };
    }

    // C. DETECT OFFLINE (The Dead Zone)
    // Relaxed Logic: > 60 mins unseen OR (missing from DB consistently AND unseen > 20 mins)
    const isDeepOffline = sinceSeenMins > 60;
    const isFlappingOffline = consistencyScore < 0.4 && sinceSeenMins > 20;

    if (isDeepOffline || isFlappingOffline) {
        return {
            status: 'OFFLINE',
            label: 'OFFLINE',
            color: 'text-zinc-500',
            bgColor: 'bg-zinc-900 border-zinc-800',
            icon: WifiOff,
            reason: isDeepOffline 
                ? `No contact for ${Math.round(sinceSeenMins / 60)} hours` 
                : 'Intermittent connectivity failure detected',
            confidence: isDeepOffline ? 100 : 70
        };
    }

    // D. DETECT ONLINE (The Standard)
    // Fallback: If it's not the above, it's Online.
    return {
        status: 'ONLINE',
        label: 'ONLINE',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 border-green-500/20',
        icon: Wifi,
        reason: 'Healthy heartbeat and consistent history',
        confidence: Math.round(consistencyScore * 100)
    };

  }, [node, history]);
};
