import React, { useMemo } from 'react';
import { Users, Wallet, Activity, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RankedNode } from '../../types/leaderboard';
import { useNetworkHistory } from '../../hooks/useNetworkHistory';

interface StatsOverviewProps {
  nodes: RankedNode[];
  networkFilter: string;
  onOpenAnalytics: () => void;
}

export default function StatsOverview({ nodes, networkFilter, onOpenAnalytics }: StatsOverviewProps) {
  // 1. Strict 24H Context
  const { history, loading } = useNetworkHistory('24H');

  // 2. Current "Live" Stats
  const current = useMemo(() => {
      const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
      const avgCredits = nodes.length > 0 ? Math.round(totalCredits / nodes.length) : 0;
      const top10 = nodes.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
      const dominance = totalCredits > 0 ? (top10 / totalCredits) * 100 : 0;
      
      return { count: nodes.length, totalCredits, avgCredits, dominance };
  }, [nodes]);

  // 3. Historical Baseline (Yesterday)
  const baseline = useMemo(() => {
      return (history && history.length > 0) ? history[0] : null; 
  }, [history]);

  // --- SUB-COMPONENT: COMPACT TICKER CARD ---
  const TickerCard = ({ icon: Icon, label, value, subValue, deltaType, rawValue, valueColor = "text-white" }: any) => {
      let delta = 0;
      let pct = 0;

      if (baseline) {
          if (deltaType === 'COUNT') delta = rawValue - (baseline.total_nodes || 0);
          if (deltaType === 'CREDITS') delta = rawValue - (baseline.total_credits || 0);
          if (deltaType === 'AVG') delta = rawValue - (baseline.avg_credits || 0);
          if (deltaType === 'DOM') delta = rawValue - (baseline.top10_dominance || 0);

          const base = deltaType === 'COUNT' ? baseline.total_nodes : 
                       deltaType === 'CREDITS' ? baseline.total_credits :
                       deltaType === 'AVG' ? baseline.avg_credits :
                       baseline.top10_dominance;
                       
          pct = base > 0 ? (delta / base) * 100 : 0;
      }

      const isPos = delta > 0;
      const isNeg = delta < 0;
      // UNIFIED COLOR: Entire ticker string uses this color
      const trendColor = isPos ? 'text-green-500' : isNeg ? 'text-red-500' : 'text-zinc-500';
      const Arrow = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;

      return (
        <div 
            onClick={onOpenAnalytics}
            className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-lg backdrop-blur-md cursor-pointer group hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-center min-h-[60px]"
        >
            {/* LABEL ROW */}
            <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={10} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    {label}
                </span>
            </div>

            {/* VALUE & TICKER ROW (Baseline Aligned) */}
            <div className="flex items-baseline gap-2">
                {/* Main Value */}
                <div className={`text-lg font-black tracking-tight font-mono ${valueColor}`}>
                    {value}
                </div>
                
                {/* Ticker (Same Line) */}
                <div className={`flex items-center gap-1 text-[9px] font-mono font-bold ${trendColor}`}>
                    {!loading ? (
                        <>
                            <Arrow size={8} strokeWidth={3} />
                            <span>{Math.abs(pct).toFixed(1)}%</span>
                            <span className="opacity-60 font-medium">
                                ({delta > 0 ? '+' : ''}{subValue(delta)})
                            </span>
                        </>
                    ) : (
                        <div className="h-2 w-8 bg-zinc-800 rounded animate-pulse"/>
                    )}
                </div>
            </div>
        </div>
      );
  };

  if (nodes.length === 0) return null;

  // Format Network Name for Label
  const networkLabel = networkFilter === 'COMBINED' ? 'ALL' : networkFilter;

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
      <TickerCard 
          icon={Users} 
          label={`Nodes (${networkLabel})`} 
          value={current.count.toLocaleString()} 
          rawValue={current.count}
          deltaType="COUNT"
          subValue={(d: number) => d}
          valueColor="text-white"
      />
      <TickerCard 
          icon={Wallet} 
          label="Total Credits" 
          value={(current.totalCredits / 1_000_000).toFixed(2) + "M"} 
          rawValue={current.totalCredits}
          deltaType="CREDITS"
          subValue={(d: number) => (Math.abs(d)/1000).toFixed(1) + 'k'}
          valueColor="text-yellow-500" // GOLD
      />
      <TickerCard 
          icon={Activity} 
          label="Average Credits" 
          value={(current.avgCredits / 1000).toFixed(1) + "k"} 
          rawValue={current.avgCredits}
          deltaType="AVG"
          subValue={(d: number) => Math.abs(d).toLocaleString()}
          valueColor="text-white"
      />
      <TickerCard 
          icon={BarChart3} 
          label="Top 10 Dominance" 
          value={current.dominance.toFixed(1) + "%"} 
          rawValue={current.dominance}
          deltaType="DOM"
          subValue={(d: number) => Math.abs(d).toFixed(1) + '%'}
          valueColor="text-blue-500" // BLUE
      />
    </div>
  );
}
