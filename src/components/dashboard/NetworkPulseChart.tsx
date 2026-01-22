import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface NetworkPulseChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
}

export const NetworkPulseChart = ({ history, loading, timeRange, onTimeRangeChange }: NetworkPulseChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-black/90 shadow-xl text-xs backdrop-blur-md">
          <div className="text-zinc-400 mb-1">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric'})}</div>
          <div className="flex flex-col gap-1">
             <div className="font-bold font-mono text-green-400 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               {payload[0].value} Health
             </div>
             {payload[1] && (
               <div className="font-bold font-mono text-blue-400 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 {payload[1].value} Nodes
               </div>
             )}
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
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Network Pulse</span>
            <span className="text-xs text-zinc-300">Health (Green) vs Node Count (Blue)</span>
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
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} />
               <YAxis yAxisId="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} width={30} />
               <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#71717a'}} width={30} />
               <Tooltip content={<CustomTooltip />} />
               <Area yAxisId="left" type="monotone" dataKey="avg_health" stroke="#22c55e" strokeWidth={2} fill="url(#healthGrad)" />
               <Line yAxisId="right" type="monotone" dataKey="total_nodes" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
