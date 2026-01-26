import { useMemo } from 'react';
import { Node } from '../types';
import { NodeHistoryPoint } from './useNodeHistory';
import { Wifi, WifiOff, Activity, ThermometerSun, AlertTriangle } from 'lucide-react';

export type VitalityStatus = 'ONLINE' | 'OFFLINE' | 'STAGNANT' | 'WARMUP' | 'UNSTABLE';

interface VitalityResult {
  status: VitalityStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  reason: string;
  confidence: number;
}

export const useNodeVitality = (node: Node, history: NodeHistoryPoint[] = []) => {
  return useMemo((): VitalityResult => {
    const now = Date.now();
    // last_seen_timestamp is in seconds, convert to ms
    const lastSeen = node.last_seen_timestamp ? node.last_seen_timestamp * 1000 : 0;
    const sinceSeenMs = now - lastSeen;
    const sinceSeenMins = sinceSeenMs / 1000 / 60;
    const currentUptime = node.uptime || 0;

    // --- 1. HISTORICAL FORENSICS ---
    // We sort history newest-first to analyze recent trends
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Pattern 1: Restart Frequency (Volatility)
    // We scan the last 24h of snapshots. If uptime drops significantly, it's a restart.
    let restartCount = 0;
    if (sortedHistory.length > 1) {
        for (let i = 0; i < sortedHistory.length - 1; i++) {
            const curr = sortedHistory[i].uptime;
            const prev = sortedHistory[i+1].uptime; // Older snapshot
            // If current uptime is less than previous (by > 60s buffer), it reset
            if (curr < prev - 60) {
                restartCount++;
            }
        }
    }

    // Pattern 2: Stagnation Check (Zombie Process)
    // Compare current live data vs snapshot from ~1 hour ago
    let isFrozen = false;
    const oneHourAgo = sortedHistory.find(p => (now - new Date(p.date).getTime()) > 60 * 60 * 1000);
    if (oneHourAgo) {
        const deltaUptime = currentUptime - oneHourAgo.uptime;
        // If 1 hour passed in real time, but uptime grew < 60 seconds -> Frozen
        if (Math.abs(deltaUptime) < 60 && currentUptime > 1000) {
            isFrozen = true;
        }
    }

    // Pattern 3: Data Consistency (Ghosting)
    // Missing from > 80% of snapshots in last 6 hours
    const sixHoursPoints = sortedHistory.filter(p => (now - new Date(p.date).getTime()) < 6 * 60 * 60 * 1000);
    const missingCount = sixHoursPoints.filter(p => p.health === 0).length;
    const isGhosting = sixHoursPoints.length > 5 && (missingCount / sixHoursPoints.length > 0.8);


    // --- 2. WATERFALL PRIORITY MATRIX (The "Filter" Logic) ---

    // LEVEL 1: THE "DEAD" CHECK (OFFLINE)
    // Criteria: Hard Offline (> 2h) OR Ghosting OR "Ghost-Boot" (Old last_seen + Low uptime)
    if (sinceSeenMins > 120 || isGhosting || (sinceSeenMins > 45 && currentUptime < 300)) {
        return {
            status: 'OFFLINE',
            label: 'OFFLINE',
            color: 'text-zinc-500',
            bgColor: 'bg-zinc-900 border-zinc-800',
            icon: WifiOff,
            reason: isGhosting 
                ? 'Persistent failure to report data (Ghosting)' 
                : `No contact for ${Math.round(sinceSeenMins / 60)} hours`,
            confidence: 100
        };
    }

    // LEVEL 2: THE "ZOMBIE" CHECK (STAGNANT)
    // Criteria: Seen recently (< 2h) BUT uptime counter is stuck
    if (isFrozen) {
        return {
            status: 'STAGNANT',
            label: 'STAGNANT',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            icon: Activity,
            reason: 'Process hung: Uptime counter frozen',
            confidence: 95
        };
    }

    // LEVEL 3: THE "VOLATILITY" CHECK (UNSTABLE)
    // Criteria: Technically online, but highly unreliable.
    // - More than 5 restarts in history
    // - OR Late Reporting (> 30 mins lag)
    if (restartCount > 5 || sinceSeenMins > 30) {
        return {
            status: 'UNSTABLE',
            label: 'UNSTABLE',
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10 border-orange-500/20',
            icon: AlertTriangle,
            reason: restartCount > 5 
                ? `High volatility: ${restartCount} restarts detected` 
                : `High latency: Last seen ${Math.round(sinceSeenMins)}m ago`,
            confidence: 85
        };
    }

    // LEVEL 4: THE "BOOT" CHECK (WARMUP)
    // Criteria: Uptime < 30 mins.
    // Note: If it passed Level 1 (Offline) and Level 3 (Unstable - Late Reporting), 
    // it means it's reporting on time but just started. This is a healthy boot.
    if (currentUptime < 30 * 60) {
        return {
            status: 'WARMUP',
            label: 'WARMING UP',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20',
            icon: ThermometerSun,
            reason: `Fresh boot: Up for ${Math.round(currentUptime / 60)}m`,
            confidence: 100
        };
    }

    // LEVEL 5: THE "SURVIVOR" CHECK (ONLINE)
    // Criteria: Survived all filters. Healthy heartbeat, stable process, low latency.
    return {
        status: 'ONLINE',
        label: 'ONLINE',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 border-green-500/20',
        icon: Wifi,
        reason: 'Stable heartbeat and consistent history',
        confidence: 100
    };

  }, [node, history]);
};
