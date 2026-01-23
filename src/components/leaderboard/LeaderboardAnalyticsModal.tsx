import { useState, useMemo } from 'react';
import { X, Trophy, Wallet, Activity, BarChart3, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { useNetworkHistory, HistoryTimeRange } from '../../hooks/useNetworkHistory';

interface LeaderboardAnalyticsModalProps {
  onClose: () => void;
  currentStats: {
    totalCredits: number;
    avgCredits: number;
    dominance: number;
    nodeCount: number;
  };
}

export const LeaderboardAnalyticsModal = ({ onClose, currentStats }: LeaderboardAnalyticsModalProps) => {
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('30D');
  const { history, loading } = useNetworkHistory(timeRange);

  // --- METRICS CALCULATION (Same Logic, stricter typing) ---
  const metrics = useMemo(() => {
      if (!history || history.length < 2) return null;
      const start = history[0];
      const end = history[history.length - 1];
      const days = history.length;

      return {
          credit: { 
              delta: end.total_credits - start.total_credits, 
              pct: start.total_credits > 0 ? ((end.total_credits - start.total_credits) / start.total_credits) * 100 : 0 
          },
          dom: { 
              delta: end.top10_dominance - start.top10_dominance 
          },
          avg: { 
              delta: end.avg_credits - start.avg_credits, 
              velocity: days > 0 ? Math.round((end.avg_credits - start.avg_credits) / days) : 0 
          }
      };
  }, [history]);

  // --- REUSABLE HEADER (Clean Flex Layout, No Overlaps) ---
  const ChartHeader = ({ icon: Icon, title, value, delta, pct, suffix = '', rightElement }: any) => {
      const isPos = delta > 0;
      const isNeg = delta < 0;
      const color = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-zinc-500';

      return (
          <div className="flex justify-between items-start mb-6 w-full">
              {/* LEFT: Main Metric */}
              <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Icon size={12} className="text-zinc-600"/> {title}
                  </div>
                  <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-bold text-white tracking-tight font-mono">
                          {value}
                      </div>
                      
                      {/* TICKER PILL */}
                      {!loading && metrics ? (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-zinc-900 ${color} ${isPos ? 'border-emerald-500/20' : isNeg ? 'border-rose-500/20' : 'border-zinc-800'}`}>
                              {isPos ? <TrendingUp size={10} strokeWidth={2.5} /> : isNeg ? <TrendingDown size={10} strokeWidth={2.5} /> : <Minus size={10} />}
                              <span>{isPos ? '+' : ''}{suffix ? delta.toFixed(2) + suffix : delta.toLocaleString()}</span>
                          </div>
                      ) : (
                          <div className="w-16 h-4 bg-zinc-800/50 rounded animate-pulse" />
                      )}
                  </div>
              </div>

              {/* RIGHT: Contextual Badge (Velocity or Growth) */}
              {rightElement && (
                  <div className="text-right">
                      {rightElement}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/10">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Market Analysis</h3>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Network Economy & Trends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 flex">
                {(['7D', '30D', 'ALL'] as const).map((t) => (
                    <button 
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${timeRange === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition"><X size={18} /></button>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="space-y-6">

            {/* ROW 1: LIQUIDITY */}
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 h-80 flex flex-col relative overflow-hidden">
                <ChartHeader 
                    icon={Wallet}
                    title="Total Network Liquidity"
                    value={(currentStats.totalCredits / 1_000_000).toFixed(2) + "M"}
                    delta={metrics?.credit.delta}
                    pct={metrics?.credit.pct}
                    rightElement={
                        metrics?.credit.pct !== undefined && (
                            <div className={`flex flex-col items-end ${metrics.credit.delta > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Period Growth</span>
                                <span className="text-lg font-mono font-bold">{metrics.credit.pct.toFixed(2)}%</span>
                            </div>
                        )
                    }
                />
                <div className="flex-1 w-full min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                           <defs>
                              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                                 <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#52525b', fontFamily: 'monospace'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#52525b', fontFamily: 'monospace'}} width={35} tickFormatter={(val) => (val/1000000).toFixed(1) + 'M'} />
                           <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} itemStyle={{ fontFamily: 'monospace' }} />
                           <Area type="monotone" dataKey="total_credits" stroke="#eab308" strokeWidth={2} fill="url(#creditGrad)" animationDuration={1000} />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* DOMINANCE */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 h-72 flex flex-col">
                    <ChartHeader 
                        icon={BarChart3}
                        title="Top 10 Dominance"
                        value={currentStats.dominance.toFixed(1) + "%"}
                        delta={metrics?.dom.delta}
                        suffix="%"
                    />
                    <div className="flex-1 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} itemStyle={{ fontFamily: 'monospace' }}/>
                               <Line type="monotone" dataKey="top10_dominance" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={1000} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* WEALTH & VELOCITY */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 h-72 flex flex-col">
                    <ChartHeader 
                        icon={Activity}
                        title="Average Node Wealth"
                        value={(currentStats.avgCredits / 1000).toFixed(1) + "k"}
                        delta={metrics?.avg.delta}
                        rightElement={
                            metrics && (
                                <div className={`flex flex-col items-end ${metrics.avg.velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Daily Yield</span>
                                    <span className="text-lg font-mono font-bold">{metrics.avg.velocity > 0 ? '+' : ''}{metrics.avg.velocity}/day</span>
                                </div>
                            )
                        }
                    />
                    <div className="flex-1 w-full mt-2">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} itemStyle={{ fontFamily: 'monospace' }}/>
                               <Line type="monotone" dataKey="avg_credits" stroke="#d4d4d8" strokeWidth={2} dot={false} animationDuration={1000} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

            </div>

        </div>
      </div>
    </div>
  );
};
