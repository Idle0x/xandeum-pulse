import { useState, useMemo } from 'react';
import { X, Trophy, Wallet, Activity, BarChart3, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { useNetworkHistory, HistoryTimeRange } from '../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface LeaderboardAnalyticsModalProps {
  onClose: () => void;
  // We can pass current stats to show "Realtime" values alongside history
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

  // Helper for tooltips
  const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-black/90 shadow-xl text-xs backdrop-blur-md">
          <div className="text-zinc-400 mb-1">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
          {payload.map((p: any, i: number) => (
             <div key={i} className="font-bold font-mono flex items-center gap-2" style={{ color: p.color }}>
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
               {p.value.toLocaleString()} {unit}
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Economy</h3>
              <p className="text-xs text-zinc-500">Reputation distribution & growth analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all">
                   {timeRange === 'ALL' ? 'Max' : timeRange} <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-24 py-1 rounded-xl border border-zinc-800 bg-black shadow-xl flex flex-col z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {(['24H', '7D', '30D', 'ALL'] as const).map((r) => (
                        <button key={r} onClick={() => setTimeRange(r)} className="px-3 py-2 text-left text-[10px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white">
                            {r === 'ALL' ? 'Max' : r}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full text-zinc-500 hover:text-white transition"><X size={20} /></button>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="space-y-6">

            {/* ROW 1: TOTAL MARKET CAP (Area Chart) */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden h-64 flex flex-col">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><Wallet size={12}/> Total Network Credits</div>
                        <div className="text-3xl font-black text-white tracking-tight">{(currentStats.totalCredits / 1_000_000).toFixed(2)}M</div>
                    </div>
                    {/* Placeholder for growth badge if calculated */}
                    <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold flex items-center gap-1">
                        <TrendingUp size={10}/> Growth
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
                           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} width={35} tickFormatter={(val) => (val/1000000).toFixed(0) + 'M'} />
                           <Tooltip content={<CustomTooltip unit="Cr" />} />
                           <Area type="monotone" dataKey="total_credits" stroke="#eab308" strokeWidth={2} fill="url(#creditGrad)" />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2: SPLIT CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CHART 2: WEALTH GAP (Top 10 vs Avg) */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 h-56 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><BarChart3 size={12}/> Dominance Trend</div>
                            <div className="text-xl font-black text-blue-400">{currentStats.dominance}% <span className="text-xs text-zinc-600 font-bold">Top 10 Share</span></div>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                         {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10"><Loader2 className="animate-spin text-zinc-500"/></div>}
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip content={<CustomTooltip unit="%" />} />
                               <Line type="monotone" dataKey="top10_dominance" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART 3: AVERAGE CREDITS */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 h-56 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1"><Activity size={12}/> Avg Node Wealth</div>
                            <div className="text-xl font-black text-white">{currentStats.avgCredits.toLocaleString()} <span className="text-xs text-zinc-600 font-bold">Credits</span></div>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                         {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10"><Loader2 className="animate-spin text-zinc-500"/></div>}
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={['auto', 'auto']} hide />
                               <Tooltip content={<CustomTooltip />} />
                               <Line type="monotone" dataKey="avg_credits" stroke="#fff" strokeWidth={2} dot={false} />
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
