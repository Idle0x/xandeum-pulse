import React, { useMemo } from 'react';
import { Users, Wallet, Activity, BarChart3, Maximize2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RankedNode } from '../../types/leaderboard';
import { useNetworkHistory } from '../../hooks/useNetworkHistory';

interface StatsOverviewProps {
  nodes: RankedNode[];
  networkFilter: string;
  onOpenAnalytics: () => void;
}

export default function StatsOverview({ nodes, networkFilter, onOpenAnalytics }: StatsOverviewProps) {
  // 1. Fetch 24H History for "Ticker" Comparison
  const { history, loading } = useNetworkHistory('24H');

  // 2. Calculate Current Stats (Real-time from Props)
  const current = useMemo(() => {
      const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
      const avgCredits = nodes.length > 0 ? Math.round(totalCredits / nodes.length) : 0;
      const top10 = nodes.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
      const dominance = totalCredits > 0 ? (top10 / totalCredits) * 100 : 0;
      
      return {
          count: nodes.length,
          totalCredits,
          avgCredits,
          dominance
      };
  }, [nodes]);

  // 3. Get Previous Stats (24 Hours Ago from DB)
  // We take the first point of the 24H window as the baseline
  const previous = useMemo(() => {
      if (!history || history.length === 0) return null;
      return history[0]; 
  }, [history]);

  // --- SUB-COMPONENT: METRIC CARD ---
  const MetricCard = ({ icon: Icon, label, value, colorClass, deltaType, rawValue }: any) => {
      
      // Calculate Delta Logic
      let deltaValue = 0;
      let deltaPercent = 0;
      let hasHistory = !!previous;

      if (previous) {
          if (deltaType === 'COUNT') {
              deltaValue = rawValue - (previous.total_nodes || 0);
              deltaPercent = previous.total_nodes > 0 ? (deltaValue / previous.total_nodes) * 100 : 0;
          }
          if (deltaType === 'CREDITS') {
              deltaValue = rawValue - (previous.total_credits || 0);
              deltaPercent = previous.total_credits > 0 ? (deltaValue / previous.total_credits) * 100 : 0;
          }
          if (deltaType === 'AVG') {
              deltaValue = rawValue - (previous.avg_credits || 0);
              deltaPercent = previous.avg_credits > 0 ? (deltaValue / previous.avg_credits) * 100 : 0;
          }
          if (deltaType === 'DOM') {
              deltaValue = rawValue - (previous.top10_dominance || 0);
              deltaPercent = previous.top10_dominance > 0 ? (deltaValue / previous.top10_dominance) * 100 : 0;
          }
      }

      const isPositive = deltaValue > 0;
      const isNeutral = deltaValue === 0;
      
      return (
        <div 
            onClick={onOpenAnalytics}
            className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm cursor-pointer group hover:bg-zinc-900 hover:border-zinc-700 transition-all relative overflow-hidden flex flex-col justify-between min-h-[100px]"
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={10} className="text-zinc-500"/></div>
            
            {/* LABEL */}
            <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2 mb-1">
                <Icon size={12}/> {label}
            </div>

            {/* MAIN VALUE */}
            <div className={`text-lg md:text-2xl font-black tracking-tight ${colorClass}`}>
                {value}
            </div>

            {/* DELTA BADGE (THE TICKER) */}
            <div className="mt-2 flex items-center gap-1.5 h-4">
                {loading ? (
                    <div className="w-16 h-3 bg-zinc-800 rounded animate-pulse"></div>
                ) : hasHistory ? (
                    <>
                        <div className={`flex items-center text-[9px] font-bold ${isNeutral ? 'text-zinc-600' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        </div>
                        <span className={`text-[9px] font-mono font-medium ${isNeutral ? 'text-zinc-600' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {deltaType === 'CREDITS' ? (deltaValue > 0 ? '+' : '') + (deltaValue / 1000).toFixed(1) + 'k' : 
                             deltaType === 'AVG' ? (deltaValue > 0 ? '+' : '') + deltaValue.toLocaleString() :
                             deltaType === 'DOM' ? (deltaValue > 0 ? '+' : '') + deltaValue.toFixed(2) + '%' :
                             (deltaValue > 0 ? '+' : '') + deltaValue}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono opacity-60">
                            ({deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}% 24h)
                        </span>
                    </>
                ) : (
                    <span className="text-[8px] text-zinc-700 font-mono">--</span>
                )}
            </div>
        </div>
      );
  };

  if (nodes.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <MetricCard 
          icon={Users} 
          label={`Nodes (${networkFilter === 'COMBINED' ? 'ALL' : networkFilter})`} 
          value={current.count} 
          rawValue={current.count}
          colorClass="text-white" 
          deltaType="COUNT"
      />
      <MetricCard 
          icon={Wallet} 
          label="Total Credits" 
          value={(current.totalCredits / 1_000_000).toFixed(2) + "M"} 
          rawValue={current.totalCredits}
          colorClass="text-yellow-400" 
          deltaType="CREDITS"
      />
      <MetricCard 
          icon={Activity} 
          label="Avg Credits" 
          value={current.avgCredits.toLocaleString()} 
          rawValue={current.avgCredits}
          colorClass="text-white" 
          deltaType="AVG"
      />
      <MetricCard 
          icon={BarChart3} 
          label="Top 10 Dom" 
          value={current.dominance.toFixed(1) + "%"} 
          rawValue={Number(current.dominance)}
          colorClass="text-blue-400" 
          deltaType="DOM"
      />
    </div>
  );
}
