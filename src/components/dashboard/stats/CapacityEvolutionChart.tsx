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
        <div className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 shadow-xl text-[10px] backdrop-blur-md z-50">
          <div className="text-zinc-500 mb-1 font-mono">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric'})}</div>
          <div className="flex flex-col gap-0.5">
             {/* We need to safely find the correct payload based on dataKey since order might vary */}
             {payload.map((p: any) => (
                <div key={p.dataKey} className={`font-bold font-mono flex items-center gap-1.5 ${p.dataKey === capacityKey ? 'text-purple-400' : 'text-blue-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${p.dataKey === capacityKey ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  {formatBytes(p.value)} {p.dataKey === capacityKey ? 'Capacity' : 'Used'}
                </div>
             ))}
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
            <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
               
               {/* X Axis */}
               <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#71717a'}} 
                  minTickGap={40} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} 
                  height={15}
               />

               {/* LEFT Y-Axis: USED (Blue) */}
               <YAxis 
                  yAxisId="left"
                  orientation="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#60a5fa', fontWeight: 600}} // Blue-400
                  width={35} 
                  tickFormatter={(val) => formatBytes(val).split(' ')[0]} 
                  domain={['auto', 'auto']}
               />

               {/* RIGHT Y-Axis: CAPACITY (Purple) */}
               <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#c084fc', fontWeight: 600}} // Purple-400
                  width={35} 
                  tickFormatter={(val) => formatBytes(val).split(' ')[0]} 
                  domain={['auto', 'auto']}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
               
               {/* Capacity Area (Right Axis) */}
               <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey={capacityKey} 
                  stroke="#a855f7" 
                  strokeWidth={1.5} 
                  fill="url(#capGrad)" 
                  isAnimationActive={false} 
               />
               
               {/* Used Line (Left Axis) */}
               <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey={usedKey} 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  dot={false} 
                  isAnimationActive={false} 
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
