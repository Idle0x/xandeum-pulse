import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2, Eye, EyeOff, Activity, Zap } from 'lucide-react';

interface NetworkStatusChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  // Data keys
  healthKey: keyof NetworkHistoryPoint;
  stabilityKey?: keyof NetworkHistoryPoint; // Added for the new dropdown option
  countKey: keyof NetworkHistoryPoint;
}

export const NetworkStatusChart = ({ 
  history, 
  loading, 
  timeRange, 
  onTimeRangeChange, 
  healthKey, 
  stabilityKey = 'stability_score' as keyof NetworkHistoryPoint, // Default if not passed
  countKey 
}: NetworkStatusChartProps) => {
  
  // State for Dropdowns & Toggles
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  
  // View State
  const [activeMetric, setActiveMetric] = useState<'HEALTH' | 'STABILITY'>('HEALTH');
  const [showRank, setShowRank] = useState(false); // Hidden by default

  // derived config based on active metric
  const config = useMemo(() => {
    return activeMetric === 'HEALTH' 
      ? {
          key: healthKey,
          label: 'Avg Health',
          subtitle: 'Global node performance & responsiveness',
          color: '#22c55e', // Green
          gradientId: 'healthGrad'
        }
      : {
          key: stabilityKey,
          label: 'Avg Stability',
          subtitle: 'Network uptime & connection consistency',
          color: '#eab308', // Yellow/Amber
          gradientId: 'stabilityGrad'
        };
  }, [activeMetric, healthKey, stabilityKey]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl text-[10px] backdrop-blur-md min-w-[140px]">
          <div className="text-zinc-500 mb-2 font-mono border-b border-zinc-800 pb-1">
            {new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute: '2-digit'})}
          </div>
          <div className="flex flex-col gap-1.5">
             {/* Primary Metric */}
             <div className="font-bold font-mono flex items-center justify-between" style={{ color: config.color }}>
               <span className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }}></div>
                 {config.label}
               </span>
               <span>{payload[0].value}%</span>
             </div>
             
             {/* Secondary Metric (Rank/Count) - Only if toggled on */}
             {showRank && payload[1] && (
               <div className="font-bold font-mono text-blue-400 flex items-center justify-between">
                 <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Rank Nodes
                 </span>
                 <span>{payload[1].value}</span>
               </div>
             )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 relative group">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col mb-2 relative z-20 shrink-0 gap-1">
         
         {/* Top Row: Title & Controls */}
         <div className="flex justify-between items-start">
            
            {/* Left: Title */}
            <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                    Network Overview
                    {/* Hide/Show Rank Toggle */}
                    <button 
                        onClick={() => setShowRank(!showRank)}
                        className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 hover:text-blue-400 transition-colors bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800/50 hover:border-blue-500/30 ml-2"
                    >
                        {showRank ? <Eye size={10} /> : <EyeOff size={10} />}
                        {showRank ? 'Hide Rank' : 'Show Rank'}
                    </button>
                </h3>
                <p className="text-[9px] text-zinc-500 font-medium mt-0.5">{config.subtitle}</p>
            </div>

            {/* Right: Dropdowns */}
            <div className="flex items-center gap-2">
                
                {/* Metric Selector */}
                <div className="relative">
                    <button onClick={() => setIsMetricOpen(!isMetricOpen)} className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all min-w-[90px] justify-between">
                        <span className="flex items-center gap-1.5">
                            {activeMetric === 'HEALTH' ? <Activity size={10} className="text-green-500"/> : <Zap size={10} className="text-yellow-500"/>}
                            {config.label}
                        </span>
                        <ChevronDown size={10} className="text-zinc-500" />
                    </button>
                    {isMetricOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30">
                            <button onClick={() => { setActiveMetric('HEALTH'); setIsMetricOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-green-400 flex items-center gap-2">
                                <Activity size={10} /> Avg Health
                            </button>
                            <button onClick={() => { setActiveMetric('STABILITY'); setIsMetricOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-yellow-400 flex items-center gap-2">
                                <Zap size={10} /> Avg Stability
                            </button>
                        </div>
                    )}
                </div>

                {/* Time Range Selector */}
                <div className="relative">
                    <button onClick={() => setIsTimeOpen(!isTimeOpen)} className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                        {timeRange === 'ALL' ? 'MAX' : timeRange}
                        <ChevronDown size={10} />
                    </button>
                    {isTimeOpen && (
                        <div className="absolute right-0 top-full mt-1 w-20 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30">
                            {(['24H', '7D', '30D', 'ALL'] as const).map((r) => (
                                <button key={r} onClick={() => { onTimeRangeChange(r); setIsTimeOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white">
                                    {r === 'ALL' ? 'MAX' : r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>

      {/* --- CHART --- */}
      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px]"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}
         
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="stabilityGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
               
               {/* X AXIS: Visible Date Labels */}
               <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#71717a'}} 
                  minTickGap={30} 
                  tickFormatter={(val) => {
                     const d = new Date(val);
                     return timeRange === '24H' 
                        ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
                  }} 
                  height={20} // Fixed height prevents clipping
                  dy={5} 
               />
               
               {/* Y AXIS (Left): Score */}
               <YAxis 
                  yAxisId="left" 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#71717a'}} 
                  width={28} // Fixed width prevents overlap
               />
               
               {/* Y AXIS (Right): Count/Rank (Hidden if toggled off to clean UI) */}
               {showRank && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={['auto', 'auto']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fill: '#3b82f6'}} 
                    width={28} 
                  />
               )}

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
               
               {/* PRIMARY METRIC (Health or Stability) */}
               <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey={config.key} 
                  stroke={config.color} 
                  strokeWidth={1.5} 
                  fill={`url(#${config.gradientId})`} 
                  isAnimationActive={false} 
               />
               
               {/* SECONDARY METRIC (Rank/Count) - Conditional Render */}
               {showRank && (
                   <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey={countKey} 
                        stroke="#3b82f6" 
                        strokeWidth={1.5} 
                        dot={false} 
                        isAnimationActive={false} 
                        strokeOpacity={0.7}
                   />
               )}
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
