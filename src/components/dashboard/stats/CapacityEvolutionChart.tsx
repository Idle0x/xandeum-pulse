import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';
import { formatBytes } from '../../../utils/formatters';

interface CapacityEvolutionChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  // NEW: Dynamic keys
  capacityKey: keyof NetworkHistoryPoint;
  usedKey: keyof NetworkHistoryPoint;
}

export const CapacityEvolutionChart = ({ 
  history, loading, timeRange, onTimeRangeChange, capacityKey, usedKey 
}: CapacityEvolutionChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 shadow-xl text-[10px] backdrop-blur-md">
          <div className="text-zinc-500 mb-1 font-mono">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric'})}</div>
          <div className="flex flex-col gap-0.5">
             <div className="font-bold font-mono text-purple-400 flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
               {formatBytes(payload[0].value)} Capacity
             </div>
             {payload[1] && (
               <div className="font-bold font-mono text-blue-400 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 {formatBytes(payload[1].value)} Used
               </div>
             )}
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
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Evolution</span>
            <span className="text-[9px] hidden md:flex items-center gap-1">
               <span className="text-zinc-600">|</span> 
               <span className="text-purple-400 font-bold">Total Capacity</span> 
               <span className="text-zinc-600">vs</span> 
               <span className="text-blue-400 font-bold">Usage</span>
            </span>
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
            <AreaChart data={history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
               <defs>
                  <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#52525b'}} minTickGap={40} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} height={12} />
               <YAxis yAxisId="left" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#52525b'}} width={35} tickFormatter={(val) => formatBytes(val).split(' ')[0]} />
               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
               {/* DYNAMIC KEYS USED HERE */}
               <Area yAxisId="left" type="monotone" dataKey={capacityKey} stroke="#a855f7" strokeWidth={1.5} fill="url(#capGrad)" isAnimationActive={false} />
               <Line yAxisId="left" type="monotone" dataKey={usedKey} stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
