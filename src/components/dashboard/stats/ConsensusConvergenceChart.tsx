import { useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2, AlertTriangle } from 'lucide-react';

interface ConsensusConvergenceChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  dataKey: keyof NetworkHistoryPoint;
  color?: string; 
}

export const ConsensusConvergenceChart = ({ 
  history, 
  loading, 
  timeRange, 
  onTimeRangeChange, 
  dataKey,
}: ConsensusConvergenceChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const THRESHOLD = 66; 

  const fluidData = useMemo(() => {
    return history.map(point => ({
      date: point.date,
      value: Number(point[dataKey] || 0)
    }));
  }, [history, dataKey]);

  // --- ELASTIC DOMAIN LOGIC ---
  const getElasticDomain = useCallback(([dataMin, dataMax]: any): [number, number] => {
     if (!isFinite(dataMin) || !isFinite(dataMax)) return [0, 100];

     const buffer = 5; 
     let min = dataMin - buffer;
     let max = dataMax + buffer;

     if (min < 0) min = 0;
     if (max > 100) max = 100;

     if (min === max) {
         if (min === 0) max = 10;
         else if (max === 100) min = 90;
         else { min -= 5; max += 5; }
     }

     return [min, max];
  }, []);

  // --- STROKE COLOR LOGIC ONLY ---
  const gradientOffset = useMemo(() => {
    if (fluidData.length === 0) return 0;

    const dataMax = Math.max(...fluidData.map((i) => i.value));
    const dataMin = Math.min(...fluidData.map((i) => i.value));

    const [domainMin, domainMax] = getElasticDomain([dataMin, dataMax]);

    if (domainMax <= THRESHOLD) return 0; 
    if (domainMin >= THRESHOLD) return 1; 

    return (domainMax - THRESHOLD) / (domainMax - domainMin);
  }, [fluidData, getElasticDomain]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const isCritical = score <= THRESHOLD;

      return (
        <div className={`px-3 py-2 rounded-lg border shadow-xl text-[10px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${isCritical ? 'bg-red-950/90 border-red-500/50' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="text-zinc-500 mb-1.5 font-mono border-b border-zinc-800/50 pb-1 flex justify-between">
            <span>{new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}</span>
            {isCritical && <AlertTriangle size={10} className="text-red-500"/>}
          </div>
          <div className="font-bold font-mono flex items-center gap-1.5 transition-colors duration-500" style={{ color: isCritical ? '#ef4444' : '#22c55e' }}>
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCritical ? '#ef4444' : '#22c55e' }}></div>
             {Number(score).toFixed(1)}% Agreement
          </div>
          {isCritical && <div className="text-[9px] text-red-400 mt-1 font-medium">Critical Consensus Failure</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 relative group">
      <div className="flex justify-between items-center mb-1 relative z-20 h-6 shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Convergence</span>
            <span className="text-[9px] text-zinc-600 hidden md:block transition-opacity duration-300">| Network Agreement</span>
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

      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}

         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluidData} margin={{ top: 5, right: 0, left: -2, bottom: 0 }}>
               <defs>
                  {/* SIMPLE FILL: Pure Green Gradient only. */}
                  <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>

                  {/* STROKE ONLY: Splits color at 66% */}
                  <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                     <stop offset={gradientOffset} stopColor="#22c55e" stopOpacity={1} />
                     <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={1} />
                  </linearGradient>
               </defs>

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
                  domain={getElasticDomain} 
                  width={34} 
                  tick={{ fontSize: 9, fill: '#52525b' }} 
                  axisLine={false}
                  tickLine={false}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
               <ReferenceLine y={THRESHOLD} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />

               <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#splitStroke)" 
                  strokeWidth={2} 
                  fill="url(#fillGradient)" 
                  isAnimationActive={true}
                  animationDuration={1000}
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
