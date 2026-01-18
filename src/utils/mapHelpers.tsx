import React from 'react';
import { Database, Zap, Activity, AlertOctagon, EyeOff, HelpCircle } from 'lucide-react';
import { TopPerformerData, ViewMode, LocationData, MapStats } from '../types/map';

export const formatStorage = (gb: number) => {
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
  return `${Math.round(gb)} GB`;
};

export const formatCredits = (cr: number | null) => {
    if (cr === null) return "N/A";
    if (cr >= 1000000) return `${(cr/1000000).toFixed(1)}M`;
    if (cr >= 1000) return `${(cr/1000).toFixed(0)}k`;
    return cr.toString();
};

export const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h ${m}m`;
};

export const getDeepLink = (data: TopPerformerData, destination: 'DASHBOARD' | 'LEADERBOARD') => {
  const params = new URLSearchParams();
  if (destination === 'DASHBOARD') params.set('open', data.pk);
  else params.set('highlight', data.pk); 

  if (data.network) params.set('network', data.network);
  if (data.address) params.set('focusAddr', data.address);

  return destination === 'DASHBOARD' 
      ? `/?${params.toString()}` 
      : `/leaderboard?${params.toString()}`;
};

export const getPerformerStats = (pkData: TopPerformerData, viewMode: ViewMode) => {
    if (viewMode === 'STORAGE') {
        return <span className="text-indigo-400 font-bold">{formatStorage(pkData.val)} Committed</span>;
    }
    if (viewMode === 'CREDITS') {
        if (pkData.isUntracked) {
            return <span className="text-orange-400/80 font-bold italic">No Storage Credits</span>;
        }
        return <span className="text-yellow-500 font-bold">{pkData.val.toLocaleString()} Cr Earned</span>;
    }
    if (viewMode === 'HEALTH') {
        const score = pkData.val;
        const uptime = pkData.subVal || 0;
        const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

        return (
          <span className={`font-bold flex items-center gap-2 ${color}`}>
               {score}% <span className="text-zinc-600">|</span> <span className="text-blue-300">{formatUptime(uptime)} Up</span>
          </span>
        );
    }
};

export const getXRayStats = (loc: LocationData, index: number, tierColor: string, viewMode: ViewMode, stats: MapStats, totalLocations: number, isGlobalCreditsOffline: boolean) => {
    const globalShare = ((loc.count / stats.totalNodes) * 100).toFixed(1);
    const rawPercentile = ((totalLocations - index) / totalLocations) * 100;
    const topPercent = 100 - rawPercentile;
    let rankText = `Top < 0.01%`;
    if (topPercent >= 0.01) rankText = `Top ${topPercent.toFixed(2)}% Tier`;

    if (viewMode === 'STORAGE') {
        const avgPerNode = loc.totalStorage / loc.count;
        return {
            labelA: 'Avg Density',
            valA: <span className="text-indigo-400">{formatStorage(avgPerNode)} per Node</span>,
            descA: "Average committed storage per node in this region.",
            labelB: 'Global Share',
            valB: `${globalShare}% of Network`,
            descB: "Percentage of total network nodes located here.",
            labelC: 'Tier Rank',
            valC: <span style={{ color: tierColor }}>{rankText}</span>,
            descC: "Performance tier relative to other regions."
        };
    }
    if (viewMode === 'CREDITS') {
        if (loc.totalCredits === null) {
            const statusText = isGlobalCreditsOffline ? "API OFFLINE" : "UNTRACKED";
            const statusColor = isGlobalCreditsOffline ? "text-red-400" : "text-zinc-500";
            const statusIcon = isGlobalCreditsOffline ? <AlertOctagon size={12}/> : <EyeOff size={12}/>;

            return {
                labelA: 'Avg Earnings',
                valA: <span className={`${statusColor} flex items-center justify-center gap-1 font-bold`}>{statusIcon} No Rewards Active</span>,
                descA: "Node is visible via Gossip protocol but has not completed a Storage Proof cycle required for rewards.",

                labelB: 'Contribution',
                valB: <span className="text-zinc-400 font-bold">Gossip Active</span>,
                descB: "Node contributes to network topology but may be in a proving phase or below stake thresholds.",

                labelC: 'Tier Rank',
                valC: <span className="text-zinc-500 italic">Unknown</span>,
                descC: "Cannot calculate rank without confirmed credits."
            };
        }
        const avgCred = Math.round(loc.totalCredits / loc.count);
        return {
            labelA: 'Avg Earnings',
            valA: <span className="text-yellow-500">{avgCred.toLocaleString()} Cr per Node</span>,
            descA: "Average reputation credits earned per node here.",
            labelB: 'Contribution',
            valB: `${globalShare}% of Economy`,
            descB: "Share of total network reputation credits.",
            labelC: 'Tier Rank',
            valC: <span style={{ color: tierColor }}>{rankText}</span>,
            descC: "Earning power tier relative to other regions."
        };
    }
    return {
        labelA: 'Reliability',
        valA: <span className="text-green-400">{formatUptime(loc.avgUptime)} Avg Uptime</span>,
        descA: "Average continuous uptime of nodes in this region.",
        labelB: 'Node Count',
        valB: `${globalShare}% of Network`,
        descB: "Share of active physical nodes.",
        labelC: 'Tier Rank',
        valC: <span style={{ color: tierColor }}>{rankText}</span>,
        descC: "Stability tier relative to other regions."
    };
};
