import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { ChevronDown, Loader2, Eye, EyeOff, Activity, Zap } from 'lucide-react';

interface NetworkStatusChartProps {
  history: NetworkHistoryPoint[];
  loading: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (r: HistoryTimeRange) => void;
  healthKey: keyof NetworkHistoryPoint;
  stabilityKey?: keyof NetworkHistoryPoint; 
  countKey: keyof NetworkHistoryPoint;
}

export const NetworkStatusChart = ({ 
  history, 
  loading, 
  timeRange, 
  onTimeRangeChange, 
  healthKey, 
  stabilityKey = 'avg_stability', 
  countKey 
}: NetworkStatusChartProps) => {

  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'HEALTH' | 'STABILITY'>('HEALTH');
  const [showNodeCount, setShowNodeCount] = useState(false);

  // --- CONFIG ---
  const config = useMemo(() => {
    return activeMetric === 'HEALTH' 
      ? {
          sourceKey: healthKey,
          label: 'Avg Health',
          subtitle: 'Global node performance & responsiveness',
          color: '#22c55e', 
        }
      : {
          sourceKey: stabilityKey,
          label: 'Avg Stability',
          subtitle: 'Network uptime & connection consistency',
          color: '#eab308', 
        };
  }, [activeMetric, healthKey, stabilityKey]);

  // --- FLUID DATA MAPPING ---
  const fluidData = useMemo(() => {
    return history.map(point => ({
      date: point.date,
      primary: Number(point[config.sourceKey] || 0), 
      secondary: point[countKey]
    }));
  }, [history, config.sourceKey, countKey]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl text-[10px] backdrop-blur-md min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
          <div className="text-zinc-500 mb-2 font-mono border-b border-zinc-800 pb-1">
            {new Date(label).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute: '2-digit'})}
          </div>
          <div className="flex flex-col gap-1.5">
             <div className="font-bold font-mono flex items-center justify-between transition-colors duration-500" style={{ color: config.color }}>
               <span className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full transition-colors duration-500" style={{ backgroundColor: config.color }}></div>
                 {config.label}
               </span>
               <span>{Number(payload[0].value).toFixed(1)}%</span>
             </div>

             {showNodeCount && payload[1] && (
               <div className="font-bold font-mono text-blue-400 flex items-center justify-between">
                 <span className="flex items-center gap-1.5">
                    {/* Dashed line legend icon */}
                    <div className="w-3 h-0.5 border-t border-dashed border-blue-500"></div>
                    Node Count
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

      {/* HEADER */}
      <div className="flex flex-col mb-2 relative z-20 shrink-0 gap-1">
         <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                    Network Overview
                    <button 
                        onClick={() => setShowNodeCount(!showNodeCount)}
                        className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 hover:text-blue-400 transition-colors bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800/50 hover:border-blue-500/30 ml-2"
                    >
                        {showNodeCount ? <Eye size={10} /> : <EyeOff size={10} />}
                        {showNodeCount ? 'Hide Nodes' : 'Show Nodes'}
                    </button>
                </h3>
                <p className="text-[9px] text-zinc-500 font-medium mt-0.5 transition-opacity duration-300">{config.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
                {/* METRIC SELECTOR */}
                <div className="relative">
                    <button onClick={() => setIsMetricOpen(!isMetricOpen)} className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all min-w-[90px] justify-between">
                        <span className="flex items-center gap-1.5">
                            {activeMetric === 'HEALTH' ? <Activity size={10} className="text-green-500"/> : <Zap size={10} className="text-yellow-500"/>}
                            {config.label}
                        </span>
                        <ChevronDown size={10} className="text-zinc-500" />
                    </button>
                    {isMetricOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { setActiveMetric('HEALTH'); setIsMetricOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-green-400 flex items-center gap-2 w-full">
                                <Activity size={10} /> Avg Health
                            </button>
                            <button onClick={() => { setActiveMetric('STABILITY'); setIsMetricOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-yellow-400 flex items-center gap-2 w-full">
                                <Zap size={10} /> Avg Stability
                            </button>
                        </div>
                    )}
                </div>

                {/* TIME SELECTOR */}
                <div className="relative">
                    <button onClick={() => setIsTimeOpen(!isTimeOpen)} className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                        {timeRange === 'ALL' ? 'MAX' : timeRange}
                        <ChevronDown size={10} />
                    </button>
                    {isTimeOpen && (
                        <div className="absolute right-0 top-full mt-1 w-20 py-1 rounded border border-zinc-800 bg-black shadow-xl flex flex-col z-30 animate-in fade-in zoom-in-95 duration-100">
                            {(['24H', '3D', '7D', '30D', 'ALL'] as const).map((r) => (
                                <button key={r} onClick={() => { onTimeRangeChange(r); setIsTimeOpen(false); }} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-zinc-500 hover:bg-zinc-900 hover:text-white w-full">
                                    {r === 'ALL' ? 'MAX' : r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
         {loading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300"><Loader2 className="w-4 h-4 animate-spin text-zinc-600"/></div>}

         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluidData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id="fluidGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={config.color} stopOpacity={0.2} style={{ transition: 'stop-color 1s ease' }} />
                     <stop offset="95%" stopColor={config.color} stopOpacity={0} style={{ transition: 'stop-color 1s ease' }} />
                  </linearGradient>
               </defs>

               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />

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
                  height={20}
                  dy={5} 
               />

               <YAxis 
                  yAxisId="left" 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#71717a'}} 
                  width={28}
               />

               {showNodeCount && (
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

               {/* PRIMARY METRIC: Area Chart */}
               <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="primary" 
                  stroke={config.color} 
                  strokeWidth={1.5} 
                  fill="url(#fluidGradient)" 
                  isAnimationActive={true} 
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                  style={{ transition: 'stroke 1s ease' }}
               />

               {/* SECONDARY METRIC: Broken Line for Node Count */}
               {showNodeCount && (
                   <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="secondary" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        strokeDasharray="4 4" // BROKEN LINE EFFECT
                        dot={false} 
                        isAnimationActive={true} 
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        strokeOpacity={0.8}
                   />
               )}
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
