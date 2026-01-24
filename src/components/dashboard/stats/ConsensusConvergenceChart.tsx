import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ConsensusConvergenceChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  dataKey: keyof NetworkHistoryPoint;
}

export const ConsensusConvergenceChart = ({ 
  history, loading, timeRange, onTimeRangeChange, dataKey 
}: ConsensusConvergenceChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const isStrong = score > 66;
      return (
        <div className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 shadow-xl text-[10px] backdrop-blur-md">
          <div className="text-zinc-500 mb-1 font-mono">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric'})}</div>
          <div className={`font-bold font-mono flex items-center gap-1.5 ${isStrong ? 'text-green-400' : 'text-yellow-400'}`}>
             <div className={`w-1.5 h-1.5 rounded-full ${isStrong ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
             {score}% Alignment
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 relative">
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-1 relative z-20 h-6 shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Convergence</span>
            <span className="text-[9px] text-zinc-600 hidden md:block">| Network Agreement %</span>
         </div>
         <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
               {timeRange === 'ALL' ? 'MAX' : timeRange}
               <ChevronDown size={10} />
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-20 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30">
                    {(['24H', '7D', '30D', 'ALL'] as const).map((r) => (
                        <button key={r} onClick={() => { onTimeRangeChange(r); setIsDropdownOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white">
                            {r === 'ALL' ? 'MAX' : r}
                        </button>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px]"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}
         <ResponsiveContainer width="100%" height="100%">
            {/* Added slight margins to prevent labels from clipping */}
            <AreaChart data={history} margin={{ top: 5, right: 0, left: -2, bottom: 0 }}>
               <defs>
                  <linearGradient id="unityGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />

               <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                     const date = new Date(val);
                     // If range is short (24H), show time. Otherwise show Date.
                     return timeRange === '24H' 
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  }}
                  tick={{ fontSize: 9, fill: '#52525b' }} // zinc-600
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  dy={5} // Push text down slightly away from graph
               />

               <YAxis 
                  domain={[0, 100]} 
                  width={24} // Fixed small width to keep graph area maxed
                  tick={{ fontSize: 9, fill: '#52525b' }} // zinc-600
                  axisLine={false}
                  tickLine={false}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

               <Area 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke="#22c55e" 
                  strokeWidth={1.5} 
                  fill="url(#unityGrad)" 
                  isAnimationActive={false}
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
