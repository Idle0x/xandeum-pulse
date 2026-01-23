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
  // 1. Strict 24H Context for the "Live Ticker" feel
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

  // --- SUB-COMPONENT: TICKER CARD ---
  const TickerCard = ({ icon: Icon, label, value, subValue, deltaType, rawValue }: any) => {
      let delta = 0;
      let pct = 0;

      if (baseline) {
          if (deltaType === 'COUNT') delta = rawValue - (baseline.total_nodes || 0);
          if (deltaType === 'CREDITS') delta = rawValue - (baseline.total_credits || 0);
          if (deltaType === 'AVG') delta = rawValue - (baseline.avg_credits || 0);
          if (deltaType === 'DOM') delta = rawValue - (baseline.top10_dominance || 0);

          // Calculate Percentage Change
          const base = deltaType === 'COUNT' ? baseline.total_nodes : 
                       deltaType === 'CREDITS' ? baseline.total_credits :
                       deltaType === 'AVG' ? baseline.avg_credits :
                       baseline.top10_dominance;
                       
          pct = base > 0 ? (delta / base) * 100 : 0;
      }

      const isPos = delta > 0;
      const isNeg = delta < 0;
      const color = isPos ? 'text-green-500' : isNeg ? 'text-red-500' : 'text-zinc-500';
      const Arrow = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;

      return (
        <div 
            onClick={onOpenAnalytics}
            className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl backdrop-blur-md cursor-pointer group hover:bg-zinc-900 hover:border-zinc-700 transition-all relative flex flex-col justify-between h-28"
        >
            {/* Header: Label */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md bg-zinc-800/50 text-zinc-400 group-hover:text-white transition-colors`}>
                    <Icon size={12} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
            </div>

            {/* Body: Grid Layout for Value vs Ticker */}
            <div className="mt-auto">
                <div className="text-2xl font-black tracking-tight text-white font-mono">
                    {value}
                </div>
                
                {/* Ticker Row */}
                <div className="flex items-center gap-2 mt-1">
                    {loading ? (
                        <div className="h-3 w-12 bg-zinc-800 rounded animate-pulse"/>
                    ) : (
                        <>
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${color} bg-zinc-950/30 px-1.5 py-0.5 rounded border border-zinc-800/50`}>
                                <Arrow size={10} strokeWidth={3} />
                                <span>{Math.abs(pct).toFixed(2)}%</span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">
                                {delta > 0 ? '+' : ''}{subValue(delta)} (24h)
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
      );
  };

  if (nodes.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
      <TickerCard 
          icon={Users} 
          label="Active Nodes" 
          value={current.count.toLocaleString()} 
          rawValue={current.count}
          deltaType="COUNT"
          subValue={(d: number) => d}
      />
      <TickerCard 
          icon={Wallet} 
          label="Total Liquidity" 
          value={(current.totalCredits / 1_000_000).toFixed(2) + "M"} 
          rawValue={current.totalCredits}
          deltaType="CREDITS"
          subValue={(d: number) => (Math.abs(d)/1000).toFixed(1) + 'k'}
      />
      <TickerCard 
          icon={Activity} 
          label="Avg Wealth" 
          value={(current.avgCredits / 1000).toFixed(1) + "k"} 
          rawValue={current.avgCredits}
          deltaType="AVG"
          subValue={(d: number) => Math.abs(d).toLocaleString()}
      />
      <TickerCard 
          icon={BarChart3} 
          label="Market Dominance" 
          value={current.dominance.toFixed(1) + "%"} 
          rawValue={current.dominance}
          deltaType="DOM"
          subValue={(d: number) => Math.abs(d).toFixed(2) + '%'}
      />
    </div>
  );
}
