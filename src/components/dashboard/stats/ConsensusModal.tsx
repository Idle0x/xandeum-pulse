import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ConsensusConvergenceChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  dataKey: keyof NetworkHistoryPoint;
  color?: string; // Dynamic color support
}

export const ConsensusConvergenceChart = ({ 
  history, 
  loading, 
  timeRange, 
  onTimeRangeChange, 
  dataKey,
  color = '#22c55e' 
}: ConsensusConvergenceChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fluidData = useMemo(() => {
    return history.map(point => ({
      date: point.date,
      value: Number(point[dataKey] || 0)
    }));
  }, [history, dataKey]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const isStrong = score > 66;
      return (
        <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl text-[10px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="text-zinc-500 mb-1.5 font-mono border-b border-zinc-800 pb-1">
            {new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}
          </div>
          <div className="font-bold font-mono flex items-center gap-1.5 transition-colors duration-500" style={{ color: isStrong ? '#22c55e' : '#eab308' }}>
             <div className="w-1.5 h-1.5 rounded-full transition-colors duration-500" style={{ backgroundColor: isStrong ? '#22c55e' : '#eab308' }}></div>
             {Number(score).toFixed(1)}% Alignment
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 relative group">

      {/* Header */}
      <div className="flex justify-between items-center mb-1 relative z-20 h-6 shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Convergence</span>
            <span className="text-[9px] text-zinc-600 hidden md:block transition-opacity duration-300">| Network Agreement %</span>
         </div>
         <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
               {timeRange === 'ALL' ? 'MAX' : timeRange}
               <ChevronDown size={10} />
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-20 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30 animate-in fade-in zoom-in-95 duration-100">
                    {(['24H', '3D', '7D', '30D', 'ALL'] as const).map((r) => (
                        <button key={r} onClick={() => { onTimeRangeChange(r); setIsDropdownOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white w-full">
                            {r === 'ALL' ? 'MAX' : r}
                        </button>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}

         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fluidData} margin={{ top: 5, right: 0, left: -2, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />

               <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                     const date = new Date(val);
                     return timeRange === '24H' 
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  }}
                  tick={{ fontSize: 9, fill: '#52525b' }} 
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  dy={5} 
               />

               <YAxis 
                  domain={[0, 100]} 
                  width={24} 
                  tick={{ fontSize: 9, fill: '#52525b' }} 
                  axisLine={false}
                  tickLine={false}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

               <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#000', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                  style={{ 
                    transition: 'stroke 1s ease',
                    filter: `drop-shadow(0 0 6px ${color}40)` // Subtle neon glow
                  }}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
