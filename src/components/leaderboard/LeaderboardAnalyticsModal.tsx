import { useState, useMemo } from 'react';
import { X, Trophy, Wallet, Activity, BarChart3, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { useNetworkHistory, HistoryTimeRange } from '../../hooks/useNetworkHistory';
import { ChevronDown } from 'lucide-react';

interface LeaderboardAnalyticsModalProps {
  onClose: () => void;
  currentStats: {
    totalCredits: number;
    avgCredits: number;
    dominance: string;
    nodeCount: number;
  };
}

export const LeaderboardAnalyticsModal = ({ onClose, currentStats }: LeaderboardAnalyticsModalProps) => {
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('7D');
  const { history, loading } = useNetworkHistory(timeRange);

  // 1. Calculate Ticker Changes (Current vs Start of Timeframe)
  const changes = useMemo(() => {
      if (!history || history.length < 2) return { credits: 0, avg: 0, dom: 0 };
      const start = history[0];
      const end = history[history.length - 1];
      return {
          credits: end.total_credits - start.total_credits,
          creditsPct: start.total_credits > 0 ? ((end.total_credits - start.total_credits) / start.total_credits) * 100 : 0,
          avg: end.avg_credits - start.avg_credits,
          dom: end.top10_dominance - start.top10_dominance
      };
  }, [history]);

  // 2. Calculate Daily Velocity (Average earnings per day over the period)
  const dailyVelocity = useMemo(() => {
      if (!history || history.length < 2) return 0;
      const totalChange = history[history.length - 1].avg_credits - history[0].avg_credits;
      const days = history.length; // Approximate
      return days > 0 ? Math.round(totalChange / days) : 0;
  }, [history]);

  // 3. Smart Tooltip with Delta
  const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
    if (active && payload && payload.length) {
      // Find previous data point for delta calc
      const currentIndex = history.findIndex(h => h.date === label);
      const prevData = currentIndex > 0 ? history[currentIndex - 1] : null;
      
      return (
        <div className="px-4 py-3 rounded-xl border border-zinc-800 bg-black/95 shadow-2xl text-xs backdrop-blur-md min-w-[180px]">
          <div className="text-zinc-400 mb-2 font-mono uppercase tracking-wider border-b border-zinc-800 pb-1">
            {new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
          </div>
          {payload.map((p: any, i: number) => {
             const key = p.dataKey;
             const currentVal = p.value;
             // safe access to previous value
             const prevVal = prevData ? (prevData as any)[key] : currentVal; 
             const delta = currentVal - prevVal;
             
             return (
               <div key={i} className="flex flex-col gap-0.5 mb-1 last:mb-0">
                   <div className="font-bold font-mono text-white flex items-center gap-2 text-sm">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                       {p.value.toLocaleString()} {unit}
                   </div>
                   {/* Delta Badge in Tooltip */}
                   {delta !== 0 && (
                       <div className={`text-[10px] pl-4 font-mono ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {delta > 0 ? '+' : ''}{delta.toLocaleString()} from prev
                       </div>
                   )}
               </div>
             );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl border bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Network Economy</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span className="uppercase tracking-wider font-bold">Live Analysis</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                  <span className="font-mono text-zinc-400">{timeRange} View</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all">
                   {timeRange === 'ALL' ? 'Max History' : timeRange} <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 py-1 rounded-xl border border-zinc-800 bg-black shadow-xl flex flex-col z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {(['24H', '7D', '30D', 'ALL'] as const).map((r) => (
                        <button key={r} onClick={() => setTimeRange(r)} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors">
                            {r === 'ALL' ? 'Max' : r}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full bg-zinc-900/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition border border-transparent hover:border-red-500/20"><X size={20} /></button>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="space-y-6">

            {/* ROW 1: TOTAL MARKET CAP (Area Chart) */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden h-72 flex flex-col group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><Wallet size={12}/> Total Network Credits</div>
                        <div className="flex items-baseline gap-3">
                            <div className="text-3xl font-black text-white tracking-tight">{(currentStats.totalCredits / 1_000_000).toFixed(2)}M</div>
                            {/* Ticker Badge */}
                            {!loading && (
                                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${changes.credits >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {changes.credits >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {changes.credits > 0 ? '+' : ''}{(changes.credits / 1000).toFixed(1)}k
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Growth Badge */}
                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                        <TrendingUp size={12}/> {changes.creditsPct.toFixed(1)}% Growth
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0 relative">
                     {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10"><Loader2 className="animate-spin text-zinc-500"/></div>}
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                           <defs>
                              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} width={35} tickFormatter={(val) => (val/1000000).toFixed(0) + 'M'} />
                           <Tooltip content={<CustomTooltip unit="Cr" />} />
                           <Area type="monotone" dataKey="total_credits" stroke="#eab308" strokeWidth={3} fill="url(#creditGrad)" animationDuration={1000} />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2: SPLIT CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* CHART 2: WEALTH GAP */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 h-64 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><BarChart3 size={12}/> Dominance Trend</div>
                            <div className="flex items-baseline gap-3">
                                <div className="text-2xl font-black text-blue-400">{currentStats.dominance}%</div>
                                {!loading && (
                                    <div className={`text-xs font-mono font-bold ${changes.dom <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {changes.dom > 0 ? '+' : ''}{changes.dom.toFixed(2)}%
                                    </div>
                                )}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-bold mt-1">Top 10 Nodes Share</div>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                         {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10"><Loader2 className="animate-spin text-zinc-500"/></div>}
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip content={<CustomTooltip unit="%" />} />
                               <Line type="monotone" dataKey="top10_dominance" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={1000} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART 3: AVERAGE CREDITS */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 h-64 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><Activity size={12}/> Avg Node Wealth</div>
                            <div className="flex items-baseline gap-3">
                                <div className="text-2xl font-black text-white">{currentStats.avgCredits.toLocaleString()}</div>
                                {/* DAILY VELOCITY BADGE */}
                                {!loading && (
                                    <div className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${dailyVelocity >= 0 ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                        {dailyVelocity > 0 ? '+' : ''}{dailyVelocity}/day
                                    </div>
                                )}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-bold mt-1">Global Average</div>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                         {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10"><Loader2 className="animate-spin text-zinc-500"/></div>}
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip content={<CustomTooltip />} />
                               <Line type="monotone" dataKey="avg_credits" stroke="#fff" strokeWidth={2} dot={false} animationDuration={1000} />
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
