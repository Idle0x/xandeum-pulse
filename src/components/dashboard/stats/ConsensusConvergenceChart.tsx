import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ConsensusConvergenceChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
}

export const ConsensusConvergenceChart = ({ history, loading, timeRange, onTimeRangeChange }: ConsensusConvergenceChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      return (
        <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-black/90 shadow-xl text-xs backdrop-blur-md">
          <div className="text-zinc-400 mb-1">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
          <div className={`font-bold font-mono flex items-center gap-2 ${score > 66 ? 'text-green-400' : 'text-yellow-400'}`}>
             <div className={`w-2 h-2 rounded-full ${score > 66 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
             {score}% Alignment
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-2xl border border-zinc-800 bg-black/40 p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 relative z-20">
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Network Convergence</span>
            <span className="text-xs text-zinc-300">Consensus Strength over Time</span>
         </div>
         <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all">
               {timeRange === 'ALL' ? 'Max' : timeRange}
               <ChevronDown size={12} />
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-24 py-1 rounded-xl border border-zinc-800 bg-black shadow-xl flex flex-col z-30">
                    {(['24H', '7D', '30D', 'ALL'] as const).map((r) => (
                        <button key={r} onClick={() => { onTimeRangeChange(r); setIsDropdownOpen(false); }} className="px-3 py-2 text-left text-[10px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white">
                            {r === 'ALL' ? 'Max' : r}
                        </button>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[180px] relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px]"><Loader2 className="animate-spin text-zinc-500"/></div>}
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
               <defs>
                  <linearGradient id="unityGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fractureGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} />
               <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} width={30} />
               <Tooltip content={<CustomTooltip />} />
               {/* We render a single area but color it dynamically if Recharts supported simple conditional fills, 
                   but since it doesn't easily, we default to green (Growth) or Yellow (Warning) based on the *current* average */}
               <Area 
                  type="stepAfter" 
                  dataKey="consensus_score" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  fill="url(#unityGrad)" 
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
