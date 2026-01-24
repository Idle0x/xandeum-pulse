import { useState, useMemo } from 'react';
import { X, Trophy, Wallet, Activity, BarChart3, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
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

const TIME_OPTIONS = [
    { label: '24 Hours', value: '24H' },
    { label: '3 Days', value: '3D' },
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: 'All Time', value: 'ALL' },
] as const;

// Shared style for consistent, professional chart axes
const AXIS_STYLE = {
    fontSize: 9, 
    fill: '#52525b', // zinc-600
    fontFamily: 'monospace'
};

export const LeaderboardAnalyticsModal = ({ onClose, currentStats }: LeaderboardAnalyticsModalProps) => {
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { history, loading } = useNetworkHistory(timeRange);

  // --- SMART AXIS FORMATTER ---
  const formatXAxis = (val: string) => {
      const date = new Date(val);
      // If 24H, show Time (14:30). If longer, show Date (Jan 24).
      if (timeRange === '24H') {
          return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // --- METRICS CALCULATION ---
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

  // --- REUSABLE FINANCIAL HEADER ---
  const ChartHeader = ({ icon: Icon, title, value, delta, pct, suffix = '', subLabel, customRightElement }: any) => {
      const isPos = delta > 0;
      const isNeg = delta < 0;
      const color = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-zinc-500';

      return (
          <div className="flex justify-between items-start mb-2 w-full border-b border-zinc-800/30 pb-3 shrink-0">
              <div className="flex flex-col justify-center">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Icon size={10} className="text-zinc-600"/> {title}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight font-mono">
                      {value}
                  </div>
              </div>
              <div className="flex flex-col items-end justify-center min-h-[40px]">
                  <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">
                      {subLabel || `Growth (${timeRange})`}
                  </div>
                  {customRightElement ? (
                      customRightElement
                  ) : (
                      !loading && metrics ? (
                          <div className={`flex items-center gap-1.5 ${color}`}>
                              <span className="text-[10px] font-mono font-bold">
                                  {isPos ? '+' : ''}{suffix ? delta.toFixed(2) + suffix : delta.toLocaleString()}
                              </span>
                              {pct !== undefined && (
                                  <span className={`text-[9px] px-1 py-0.5 rounded bg-zinc-900 border ${isPos ? 'border-emerald-500/20 text-emerald-500' : isNeg ? 'border-rose-500/20 text-rose-500' : 'border-zinc-800 text-zinc-500'}`}>
                                      {Math.abs(pct).toFixed(2)}%
                                  </span>
                              )}
                          </div>
                      ) : (
                          <div className="w-12 h-3 bg-zinc-800/50 rounded animate-pulse" />
                      )
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/10">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Market Analysis</h3>
              <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Financial Report & Trends</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-[10px] font-bold text-zinc-300 rounded transition-all min-w-[100px] justify-between uppercase tracking-wider"
                >
                    <span>{TIME_OPTIONS.find(o => o.value === timeRange)?.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-1 z-50">
                        {TIME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setTimeRange(opt.value); setIsDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${timeRange === opt.value ? 'text-white bg-zinc-900' : 'text-zinc-500'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition"><X size={16} /></button>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="space-y-4">

            {/* ROW 1: TOTAL CREDITS (AREA CHART) */}
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-72 flex flex-col relative overflow-hidden">
                <ChartHeader 
                    icon={Wallet}
                    title="Total Network Credits"
                    value={(currentStats.totalCredits / 1_000_000).toFixed(2) + "M"}
                    delta={metrics?.credit.delta}
                    pct={metrics?.credit.pct}
                />
                <div className="flex-1 w-full min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                                 <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                           
                           {/* SMART X-AXIS */}
                           <XAxis 
                               dataKey="date" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={AXIS_STYLE} 
                               minTickGap={40} 
                               tickFormatter={formatXAxis} 
                           />
                           
                           <YAxis 
                               axisLine={false} 
                               tickLine={false} 
                               tick={AXIS_STYLE} 
                               width={40} 
                               domain={['auto', 'auto']}
                               tickFormatter={(val) => (val/1000000).toFixed(1) + 'M'} 
                           />
                           
                           <Tooltip 
                               contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                               itemStyle={{ fontFamily: 'monospace' }} 
                               labelFormatter={(label) => new Date(label).toLocaleString()}
                           />
                           <Area type="monotone" dataKey="total_credits" stroke="#eab308" strokeWidth={2} fill="url(#creditGrad)" animationDuration={1000} />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2: SMALLER CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* DOMINANCE (LINE CHART) */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-64 flex flex-col">
                    <ChartHeader 
                        icon={BarChart3}
                        title="Top 10 Dominance"
                        value={currentStats.dominance.toFixed(1) + "%"}
                        delta={metrics?.dom.delta}
                        suffix="%"
                    />
                    <div className="flex-1 w-full mt-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                               
                               {/* SMART X-AXIS */}
                               <XAxis 
                                   dataKey="date" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   minTickGap={30}
                                   tickFormatter={formatXAxis}
                               />
                               
                               {/* VISIBLE Y-AXIS */}
                               <YAxis 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   width={40}
                                   domain={['auto', 'auto']}
                                   tickFormatter={(val) => val.toFixed(0) + '%'}
                               />
                               
                               <Tooltip 
                                   contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                                   itemStyle={{ fontFamily: 'monospace' }}
                                   labelFormatter={(label) => new Date(label).toLocaleString()}
                               />
                               <Line type="monotone" dataKey="top10_dominance" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={1000} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* AVERAGE EARNINGS (LINE CHART) */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-64 flex flex-col">
                    <ChartHeader 
                        icon={Activity}
                        title="Average Node Earnings"
                        value={(currentStats.avgCredits / 1000).toFixed(1) + "k"}
                        subLabel="Daily Credits Yield"
                        customRightElement={
                            metrics && (
                                <div className={`text-[10px] font-mono font-bold ${metrics.avg.velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {metrics.avg.velocity > 0 ? '+' : ''}{metrics.avg.velocity}/day
                                </div>
                            )
                        }
                    />
                    <div className="flex-1 w-full mt-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                               
                               {/* SMART X-AXIS */}
                               <XAxis 
                                   dataKey="date" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   minTickGap={30}
                                   tickFormatter={formatXAxis}
                               />
                               
                               {/* VISIBLE Y-AXIS */}
                               <YAxis 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   width={40}
                                   domain={['auto', 'auto']}
                                   tickFormatter={(val) => (val/1000).toFixed(1) + 'k'}
                               />
                               
                               <Tooltip 
                                   contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                                   itemStyle={{ fontFamily: 'monospace' }}
                                   labelFormatter={(label) => new Date(label).toLocaleString()}
                               />
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
