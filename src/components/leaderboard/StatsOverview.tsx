// src/components/leaderboard/StatsOverview.tsx
import React from 'react';
import { Users, Wallet, Activity, BarChart3 } from 'lucide-react';
import { RankedNode } from '../../types/leaderboard';

interface StatsOverviewProps {
  nodes: RankedNode[];
  networkFilter: string;
}

export default function StatsOverview({ nodes, networkFilter }: StatsOverviewProps) {
  if (nodes.length === 0) return null;

  const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
  const avgCredits = Math.round(totalCredits / nodes.length);
  
  // Calculate Top 10 Dominance
  const top10Credits = nodes.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
  const dominance = totalCredits > 0 ? ((top10Credits / totalCredits) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm">
        <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
            <Users size={12}/> Nodes ({networkFilter})
        </div>
        <div className="text-lg md:text-2xl font-bold text-white">{nodes.length}</div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm">
        <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
            <Wallet size={12}/> Total Credits
        </div>
        <div className="text-lg md:text-2xl font-bold text-yellow-400 mt-1">
            {(totalCredits / 1_000_000).toFixed(1)}M
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm">
        <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
            <Activity size={12}/> Avg Credits
        </div>
        <div className="text-lg md:text-2xl font-bold text-white mt-1">
            {avgCredits.toLocaleString()}
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm">
        <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
            <BarChart3 size={12}/> Top 10 Dom
        </div>
        <div className="text-lg md:text-2xl font-bold text-blue-400 mt-1">
            {dominance}%
        </div>
      </div>
    </div>
  );
}
