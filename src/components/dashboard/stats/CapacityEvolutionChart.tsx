import { useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [viewMode, setViewMode] = useState<'COMMITTED' | 'USED'>('COMMITTED');

  const config = useMemo(() => {
    return viewMode === 'COMMITTED' 
      ? { 
          key: capacityKey, 
          color: '#a855f7', 
          label: 'Capacity', 
          gradientId: 'gradCommitted',
          bg: 'bg-purple-500',
          text: 'text-purple-400'
        }
      : { 
          key: usedKey, 
          color: '#3b82f6', 
          label: 'Used', 
          gradientId: 'gradUsed',
          bg: 'bg-blue-500',
          text: 'text-blue-400'
        };
  }, [viewMode, capacityKey, usedKey]);

  // --- REFINED DOMAIN LOGIC ---
  // Calculates the Y-Axis boundaries to avoid "Jagged Mountains"
  // UPDATED: Explicitly returns [number, number] to satisfy Recharts strict typing
  const getDomain = useCallback(([dataMin, dataMax]: [number, number]): [number, number] => {
    // Safety check for empty data
    // If invalid, return a safe default range [0, 1] instead of [0, 'auto'] to satisfy NumberDomain type
    if (!isFinite(dataMin) || !isFinite(dataMax)) return [0, 1];

    // 1. Calculate Lower Bound: Lowest Point - 10%
    // We use Math.max(0, ...) to ensure we never go below zero (The "Zero Floor")
    const lowerBound = Math.max(0, dataMin * 0.90);

    // 2. Calculate Upper Bound: Highest Point + 5%
    const upperBound = dataMax * 1.05;

    // Cast as tuple to satisfy TypeScript
    return [lowerBound, upperBound] as [number, number];
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 shadow-xl text-[10px] backdrop-blur-md z-50">
          <div className="text-zinc-500 mb-1 font-mono">{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric'})}</div>
          <div className={`font-bold font-mono flex items-center gap-1.5 ${config.text}`}>
             <div className={`w-1.5 h-1.5 rounded-full ${config.bg}`}></div>
             {formatBytes(payload[0].value)} {config.label}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 relative transition-all duration-500">

      {/* Header controls */}
      <div className="flex justify-between items-center mb-1 relative z-20 h-6 shrink-0">
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Evolution</span>
            <div className="flex bg-zinc-900/80 rounded border border-zinc-800/50 p-0.5">
               <button 
                  onClick={() => setViewMode('COMMITTED')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all duration-300 ${viewMode === 'COMMITTED' ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_10px_-4px_rgba(168,85,247,0.5)]' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                  Committed
               </button>
               <button 
                  onClick={() => setViewMode('USED')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all duration-300 ${viewMode === 'USED' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_-4px_rgba(59,130,246,0.5)]' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                  Used
               </button>
            </div>
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

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px]"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}

         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id="gradCommitted" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradUsed" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
               </defs>

               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />

               <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#71717a'}} 
                  minTickGap={40} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})} 
                  height={15}
               />

               <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: config.color, fontWeight: 600}} 
                  width={35} 
                  domain={getDomain} 
                  tickCount={4}      
                  tickFormatter={(val) => {
                      const str = formatBytes(val);
                      const [num] = str.split(' ');
                      return Math.round(parseFloat(num)).toString();
                  }}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

               <Area 
                  type="monotone" 
                  dataKey={config.key} 
                  stroke={config.color} 
                  strokeWidth={1.5} 
                  fill={`url(#${config.gradientId})`} 
                  isAnimationActive={true}
                  animationDuration={1000}
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
