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
  // 1. Fetch History (Single Source of Truth)
  const { history, loading } = useNetworkHistory('24H');

  // 2. Derive Stats from History (Latest Snapshot vs Baseline)
  const stats = useMemo(() => {
      // Default / Loading State
      const empty = { 
          count: nodes.length, 
          totalCredits: 0, 
          avgCredits: 0, 
          dominance: 0,
          baseCredits: 0,
          baseAvg: 0,
          baseDom: 0
      };

      if (!history || history.length === 0) return empty;

      // Get Start (Baseline) and End (Current) points
      const latest = history[history.length - 1];
      const baseline = history[0];

      // Extract based on Filter
      if (networkFilter === 'MAINNET') {
          return {
              // UPDATED: Use Unique Providers, fallback to raw nodes if missing
              count: latest.mainnet_unique_providers || latest.mainnet_nodes,
              totalCredits: latest.mainnet_credits,
              avgCredits: latest.mainnet_avg_credits,
              dominance: latest.mainnet_dominance,
              baseCredits: baseline.mainnet_credits,
              baseAvg: baseline.mainnet_avg_credits,
              baseDom: baseline.mainnet_dominance
          };
      } else if (networkFilter === 'DEVNET') {
           return {
              // UPDATED: Use Unique Providers, fallback to raw nodes if missing
              count: latest.devnet_unique_providers || latest.devnet_nodes,
              totalCredits: latest.devnet_credits,
              avgCredits: latest.devnet_avg_credits,
              dominance: latest.devnet_dominance,
              baseCredits: baseline.devnet_credits,
              baseAvg: baseline.devnet_avg_credits,
              baseDom: baseline.devnet_dominance
          };
      } else {
          // COMBINED / ALL
          return {
              // UPDATED: Use Unique Providers, fallback to raw nodes if missing
              count: latest.total_unique_providers || latest.total_nodes,
              totalCredits: latest.total_credits,
              avgCredits: latest.avg_credits,
              dominance: latest.top10_dominance,
              baseCredits: baseline.total_credits,
              baseAvg: baseline.avg_credits,
              baseDom: baseline.top10_dominance
          };
      }
  }, [history, networkFilter, nodes.length]);

  // ... (Rest of TickerCard and return statement remains exactly the same)
  
  // --- SUB-COMPONENT: COMPACT TICKER CARD ---
  const TickerCard = ({ icon: Icon, label, value, subValue, deltaType, rawValue, valueColor = "text-white", hideTrend = false }: any) => {
      let delta = 0;
      let pct = 0;

      // Calculate Delta based on History Baseline
      if (stats.totalCredits > 0 && !hideTrend) {
          if (deltaType === 'CREDITS') {
             delta = rawValue - stats.baseCredits;
             pct = stats.baseCredits > 0 ? (delta / stats.baseCredits) * 100 : 0;
          }
          if (deltaType === 'AVG') {
              delta = rawValue - stats.baseAvg;
              pct = stats.baseAvg > 0 ? (delta / stats.baseAvg) * 100 : 0;
          }
          if (deltaType === 'DOM') {
              delta = rawValue - stats.baseDom;
              pct = stats.baseDom > 0 ? (delta / stats.baseDom) * 100 : 0;
          }
      }

      const isPos = delta > 0;
      const isNeg = delta < 0;
      const isNeutral = Math.abs(delta) < 0.01;

      const trendColor = isPos ? 'text-green-500' : isNeg ? 'text-red-500' : 'text-zinc-500';
      const Arrow = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;

      return (
        <div 
            onClick={onOpenAnalytics}
            className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-lg backdrop-blur-md cursor-pointer group hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-center min-h-[60px]"
        >
            <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={10} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <div className={`text-lg font-black tracking-tight font-mono ${valueColor}`}>
                    {loading ? <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse"/> : value}
                </div>
                {!hideTrend && !loading && (
                    <div className={`flex items-center gap-1 text-[9px] font-mono font-bold ${isNeutral ? 'text-zinc-500' : trendColor}`}>
                        {isNeutral ? <Minus size={8} /> : <Arrow size={8} strokeWidth={3} />}
                        <span>{Math.abs(pct).toFixed(1)}%</span>
                        <span className="opacity-60 font-medium">
                            ({delta > 0 ? '+' : ''}{subValue(delta)})
                        </span>
                    </div>
                )}
            </div>
        </div>
      );
  };

  const networkLabel = networkFilter === 'COMBINED' ? 'ALL' : networkFilter;

  return (
    <div className="max-w-5xl mx-auto mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TickerCard 
                icon={Users} 
                label={`Unique Nodes (${networkLabel})`} 
                value={stats.count.toLocaleString()} 
                rawValue={stats.count}
                deltaType="COUNT"
                subValue={(d: number) => d}
                valueColor="text-white"
                hideTrend={true} 
            />
            <TickerCard 
                icon={Wallet} 
                label="Total Credits" 
                value={(stats.totalCredits / 1_000_000).toFixed(2) + "M"} 
                rawValue={stats.totalCredits}
                deltaType="CREDITS"
                subValue={(d: number) => (Math.abs(d)/1000).toFixed(1) + 'k'}
                valueColor="text-yellow-500"
            />
            <TickerCard 
                icon={Activity} 
                label="Average Credits" 
                value={(stats.avgCredits / 1000).toFixed(1) + "k"} 
                rawValue={stats.avgCredits}
                deltaType="AVG"
                subValue={(d: number) => Math.abs(d).toLocaleString()}
                valueColor="text-white"
            />
            <TickerCard 
                icon={BarChart3} 
                label="Top 10 Dominance" 
                value={stats.dominance.toFixed(1) + "%"} 
                rawValue={stats.dominance}
                deltaType="DOM"
                subValue={(d: number) => Math.abs(d).toFixed(1) + '%'}
                valueColor="text-blue-500"
            />
        </div>

        <div className="flex justify-end mt-1.5 px-1">
            <span className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest opacity-80">
                Values reflect 24h change
            </span>
        </div>
    </div>
  );
}
