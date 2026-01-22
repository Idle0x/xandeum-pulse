import React from 'react';
import { Users, Wallet, Activity, BarChart3, Maximize2 } from 'lucide-react';
import { RankedNode } from '../../types/leaderboard';

interface StatsOverviewProps {
  nodes: RankedNode[];
  networkFilter: string;
  onOpenAnalytics: () => void; // NEW PROP
}

export default function StatsOverview({ nodes, networkFilter, onOpenAnalytics }: StatsOverviewProps) {
  if (nodes.length === 0) return null;

  const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
  const avgCredits = Math.round(totalCredits / nodes.length);

  const top10Credits = nodes.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
  const dominance = totalCredits > 0 ? ((top10Credits / totalCredits) * 100).toFixed(1) : '0';

  const Card = ({ icon: Icon, label, value, colorClass }: any) => (
    <div 
        onClick={onOpenAnalytics}
        className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm cursor-pointer group hover:bg-zinc-900 hover:border-zinc-700 transition-all relative overflow-hidden"
    >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={10} className="text-zinc-500"/></div>
        <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
            <Icon size={12}/> {label}
        </div>
        <div className={`text-lg md:text-2xl font-bold mt-1 ${colorClass}`}>
            {value}
        </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card icon={Users} label={`Nodes (${networkFilter})`} value={nodes.length} colorClass="text-white" />
      <Card icon={Wallet} label="Total Credits" value={(totalCredits / 1_000_000).toFixed(1) + "M"} colorClass="text-yellow-400" />
      <Card icon={Activity} label="Avg Credits" value={avgCredits.toLocaleString()} colorClass="text-white" />
      <Card icon={BarChart3} label="Top 10 Dom" value={dominance + "%"} colorClass="text-blue-400" />
    </div>
  );
}
