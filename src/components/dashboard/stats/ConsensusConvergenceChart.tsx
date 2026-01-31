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
}

export const ConsensusConvergenceChart = ({ 
  history, 
  loading, 
  timeRange, 
  onTimeRangeChange, 
  dataKey
}: ConsensusConvergenceChartProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // The BFT Threshold for network failure
  const THRESHOLD = 66; 

  const fluidData = useMemo(() => {
    return history.map(point => ({
      date: point.date,
      value: Number(point[dataKey] || 0)
    }));
  }, [history, dataKey]);

  // --- 1. ELASTIC DOMAIN LOGIC ---
  // Calculates the min/max of the view to ensure we zoom in on the action
  const getElasticDomain = useCallback(([dataMin, dataMax]: [number, number]) => {
     if (!isFinite(dataMin) || !isFinite(dataMax)) return [0, 100];

     const buffer = 5; // 5% breathing room
     let min = dataMin - buffer;
     let max = dataMax + buffer;

     // Clamp to reality
     if (min < 0) min = 0;
     if (max > 100) max = 100;

     // Prevent flat-line errors (if min == max)
     if (min === max) {
         if (min === 0) max = 10;
         else if (max === 100) min = 90;
         else { min -= 5; max += 5; }
     }

     return [min, max];
  }, []);

  // --- 2. SPLIT GRADIENT OFFSET CALCULATION ---
  // Calculates exactly where the 66% line is relative to the current view
  const gradientOffset = useMemo(() => {
    if (fluidData.length === 0) return 0;

    const dataMax = Math.max(...fluidData.map((i) => i.value));
    const dataMin = Math.min(...fluidData.map((i) => i.value));
    
    // We must use the *Elastic Domain* values, not the raw data values, 
    // because the gradient is drawn relative to the Y-Axis view, not the data limits.
    const [domainMin, domainMax] = getElasticDomain([dataMin, dataMax]);

    if (domainMax <= THRESHOLD) return 0; // Everything is below 66% (All Red)
    if (domainMin >= THRESHOLD) return 1; // Everything is above 66% (All Green)

    // Calculate percentage position of the threshold line
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

      {/* Header */}
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

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}

         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluidData} margin={{ top: 5, right: 0, left: -2, bottom: 0 }}>
               <defs>
                  {/* DYNAMIC SPLIT GRADIENT */}
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                     {/* Top Section (Green) */}
                     <stop offset={gradientOffset} stopColor="#22c55e" stopOpacity={0.3} />
                     <stop offset={gradientOffset} stopColor="#22c55e" stopOpacity={0} />
                     
                     {/* Bottom Section (Red) - Starts exactly where green ends */}
                     <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.5} />
                     <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  
                  {/* Stroke Gradient (Solid Lines) */}
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
                  width={24} 
                  tick={{ fontSize: 9, fill: '#52525b' }} 
                  axisLine={false}
                  tickLine={false}
               />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

               {/* The Threshold Line (Only visible if within view) */}
               <ReferenceLine y={THRESHOLD} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />

               <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#splitStroke)" 
                  strokeWidth={2} 
                  fill="url(#splitColor)" 
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
