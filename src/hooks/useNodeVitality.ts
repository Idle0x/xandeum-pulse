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

    // Pattern 1: Restart Frequency (CRASH DETECTION)
    // We scan the last 24h. A restart is ONLY counted if uptime RESETS to near zero.
    // Preventing false positives from minor RPC lag/jitter.
    let restartCount = 0;
    if (sortedHistory.length > 1) {
        for (let i = 0; i < sortedHistory.length - 1; i++) {
            const curr = sortedHistory[i].uptime;
            const prev = sortedHistory[i+1].uptime; // Older snapshot
            
            // LOGIC UPDATE:
            // 1. Current uptime must be significantly lower than previous
            // 2. AND Current uptime must be small (< 1 hour) indicating a fresh boot
            // This ignores "1000s -> 950s" glitches, but catches "1000s -> 10s" crashes.
            if (curr < prev && curr < 3600) {
                restartCount++;
            }
        }
    }

    // Pattern 2: Stagnation Check (The 24-Hour "Frozen" Rule)
    // Compare current live data vs snapshot from ~24 hours ago
    let isFrozen = false;
    const twentyFourHoursAgo = sortedHistory.find(p => {
        const diff = now - new Date(p.date).getTime();
        // Look for a point roughly 24h ago (23h - 25h window)
        return diff > 23 * 60 * 60 * 1000 && diff < 25 * 60 * 60 * 1000;
    });

    if (twentyFourHoursAgo && currentUptime > 3600) {
        const deltaRealTime = now - new Date(twentyFourHoursAgo.date).getTime();
        const deltaUptime = (currentUptime - twentyFourHoursAgo.uptime) * 1000; // to ms

        // Tolerance: 10 Minutes (600,000 ms)
        // If 24 hours passed, but uptime moved less than 10 minutes -> FROZEN
        if (Math.abs(deltaUptime) < 600000) {
            isFrozen = true;
        }
    }

    // Pattern 3: Data Consistency (Ghosting)
    // Missing from > 80% of snapshots in last 6 hours
    const sixHoursPoints = sortedHistory.filter(p => (now - new Date(p.date).getTime()) < 6 * 60 * 60 * 1000);
    const missingCount = sixHoursPoints.filter(p => p.health === 0).length;
    // We need at least 5 points to make a judgement
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
    // Criteria: Seen recently (< 2h) BUT uptime counter is stuck (24h Check)
    if (isFrozen) {
        return {
            status: 'STAGNANT',
            label: 'STAGNANT',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            icon: Activity,
            reason: 'Process hung: Uptime frozen for 24h',
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
                ? `High volatility: ${restartCount} restarts in 24h` 
                : `High latency: Last seen ${Math.round(sinceSeenMins)}m ago`,
            confidence: 85
        };
    }

    // LEVEL 4: THE "BOOT" CHECK (WARMUP)
    // Criteria: Uptime < 30 mins.
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
