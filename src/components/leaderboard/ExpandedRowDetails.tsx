import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, History, LineChart } from 'lucide-react';
import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { DualAxisGrowthChart } from './DualAxisGrowthChart';

const TIME_OPTIONS = [
    { label: '24H', value: '24H' },
    { label: '3 Days', value: '3D' },
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: 'All', value: 'ALL' },
] as const;

export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<typeof TIME_OPTIONS[number]['value']>('24H');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE'>('CHART');

  // Chart Controls
  const [chartMode, setChartMode] = useState<'ACCUMULATION' | 'VELOCITY'>('ACCUMULATION');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [showRank, setShowRank] = useState(false); 

  const { history, loading } = useNodeHistory(isOpen ? node : undefined, timeRange);

  // Logic to determine resolution label based on our aggregation rules
  const resolutionLabel = ['24H', '3D', '7D'].includes(timeRange) 
    ? 'Hourly Resolution' 
    : 'Daily Resolution';

  const cleanHistory = useMemo(() => {
      if (!history) return [];
      return history.filter((h: any) => h.network ? h.network === node.network : true);
  }, [history, node.network]);

  const stats = useMemo(() => {
      if (!cleanHistory || cleanHistory.length < 2) return { rankChange: 0, creditChange: 0 };
      const first = cleanHistory[0];
      const last = cleanHistory[cleanHistory.length - 1];
      return {
          rankChange: first.rank - last.rank, 
          creditChange: last.credits - first.credits 
      };
  }, [cleanHistory]);

  const Ribbon = () => {
      if (loading) return <div className="w-full h-full bg-zinc-900/50 animate-pulse" />;
      if (!cleanHistory || cleanHistory.length < 2) return <div className="w-full h-full bg-zinc-900/30" />;
      return (
        <div className="flex items-center justify-start h-full w-full overflow-hidden">
            {cleanHistory.slice(1).map((day, i) => {
                const prev = cleanHistory[i];
                const earnedDelta = day.credits - prev.credits;
                const earnedMore = earnedDelta > 0;
                return (
                    <div 
                        key={i} 
                        className={`flex-1 max-w-[4px] h-full ${earnedMore ? 'bg-emerald-500 opacity-80' : 'bg-zinc-800 opacity-50'} border-r border-black/20`}
                        title={`${new Date(day.date).toLocaleDateString()}: +${earnedDelta}`}
                    />
                );
            })}
        </div>
      );
  };

  return (
    <div className="border-t border-zinc-800/50 pt-0.5 mt-0.5 bg-gradient-to-b from-zinc-900/10 to-zinc-900/30">
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className={`w-full flex items-center justify-center gap-2 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'}`}
       >
          {isOpen ? 'Hide History' : 'Show Historical Earnings'}
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
       </button>

       {isOpen && (
           <div className="px-2 pb-2 pt-1 animate-in slide-in-from-top-1 duration-200">

               {/* TOP CONTROLS */}
               <div className="flex justify-between items-center mb-1 relative z-30">
                   {/* UPDATED HEADER WITH RESOLUTION TEXT */}
                   <div className="flex items-baseline gap-2">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Consistency Map</span>
                       <span className="text-[8px] font-medium text-zinc-500 opacity-70">
                           {resolutionLabel}
                       </span>
                   </div>

                   <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-[9px] font-bold text-zinc-400 rounded transition-all uppercase tracking-wider"
                        >
                            <span>{TIME_OPTIONS.find(o => o.value === timeRange)?.label}</span>
                            <ChevronDown size={10} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-24 bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-0.5 z-50">
                                {TIME_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setTimeRange(opt.value); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${timeRange === opt.value ? 'text-white bg-zinc-900' : 'text-zinc-500'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                   </div>
               </div>

               {/* RIBBON */}
               <div className="h-4 w-full bg-black/40 rounded-sm border border-zinc-800/30 overflow-hidden mb-2">
                   <Ribbon />
               </div>

               {/* CHART / TABLE CONTROLS */}
               <div className="flex justify-between items-center mb-1 px-1 relative z-20">
                   {viewMode === 'CHART' ? (
                        <button 
                            onClick={() => setShowRank(!showRank)}
                            className={`flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest transition-colors ${showRank ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            {showRank ? <Eye size={10} /> : <EyeOff size={10} />}
                            {showRank ? 'Rank Visible' : 'Show Rank'}
                        </button>
                   ) : (
                       <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                           Raw Snapshots ({cleanHistory.length})
                       </span>
                   )}

                   {viewMode === 'CHART' && (
                       <div className="relative">
                           <button 
                                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                                className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-zinc-500 hover:text-yellow-500 transition-colors"
                           >
                                {chartMode === 'ACCUMULATION' ? 'Total Accumulation' : 'Yield Velocity'}
                                <ChevronDown size={10} className={`transition-transform duration-200 ${isModeDropdownOpen ? 'rotate-180' : ''}`}/>
                           </button>

                           {isModeDropdownOpen && (
                               <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-0.5 z-50">
                                   <button onClick={() => { setChartMode('ACCUMULATION'); setIsModeDropdownOpen(false); }} className={`w-full text-left px-2 py-1.5 text-[8px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${chartMode === 'ACCUMULATION' ? 'text-yellow-500 bg-zinc-900' : 'text-zinc-500'}`}>
                                       Total Accumulation
                                   </button>
                                   <button onClick={() => { setChartMode('VELOCITY'); setIsModeDropdownOpen(false); }} className={`w-full text-left px-2 py-1.5 text-[8px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${chartMode === 'VELOCITY' ? 'text-yellow-500 bg-zinc-900' : 'text-zinc-500'}`}>
                                       Yield Velocity
                                   </button>
                               </div>
                           )}
                       </div>
                   )}
               </div>

               {/* MAIN VISUALIZATION AREA (Swaps between Chart and Table) */}
               <div className="h-32 border border-zinc-800/40 rounded-lg bg-black/20 p-1 relative overflow-hidden">
                   {viewMode === 'CHART' ? (
                       <DualAxisGrowthChart 
                            history={cleanHistory} 
                            loading={loading} 
                            mode={chartMode}    
                            showRank={showRank}
                            timeRange={timeRange}
                        />
                   ) : (
                       <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                           {loading ? (
                               <div className="text-zinc-600 text-[9px] font-mono text-center pt-10 animate-pulse">Loading Snapshots...</div>
                           ) : cleanHistory.length === 0 ? (
                               <div className="text-zinc-600 text-[9px] font-mono text-center pt-10">No snapshot data available</div>
                           ) : (
                               <table className="w-full text-[9px] font-mono border-collapse">
                                   <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 text-zinc-500 uppercase z-10">
                                       <tr>
                                           <th className="text-left py-1.5 px-2 font-bold tracking-wider">Timestamp</th>
                                           <th className="text-right py-1.5 px-2 font-bold tracking-wider">Credits</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-zinc-900/50">
                                       {/* Show newest first */}
                                       {[...cleanHistory].reverse().map((point, i) => (
                                           <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                                               <td className="py-1 px-2 text-zinc-400">
                                                   {new Date(point.date).toLocaleString(undefined, {
                                                       month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                   })}
                                               </td>
                                               <td className="py-1 px-2 text-right font-bold text-yellow-500/90">
                                                   {point.credits.toLocaleString()}
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           )}
                       </div>
                   )}
               </div>

               {/* BOTTOM STATS ROW */}
               <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/30 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">({timeRange}) Rank Change</span>
                        <span className={`text-[9px] font-mono font-bold ${stats.rankChange > 0 ? 'text-emerald-400' : stats.rankChange < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                            {stats.rankChange > 0 ? '+' : ''}{stats.rankChange}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">({timeRange}) Credits Accumulated</span>
                        <span className={`text-[9px] font-mono font-bold ${stats.creditChange > 0 ? 'text-yellow-500' : 'text-zinc-500'}`}>
                            {stats.creditChange > 0 ? '+' : ''}{stats.creditChange.toLocaleString()}
                        </span>

                        {/* TOGGLE BUTTON */}
                        <button 
                            onClick={() => setViewMode(viewMode === 'CHART' ? 'TABLE' : 'CHART')}
                            className={`ml-1 p-1 rounded hover:bg-zinc-800 transition-colors ${viewMode === 'TABLE' ? 'text-yellow-500 bg-zinc-900' : 'text-zinc-600 hover:text-zinc-400'}`}
                            title={viewMode === 'CHART' ? "View Raw Snapshots" : "View Growth Chart"}
                        >
                            {viewMode === 'CHART' ? <History size={10} /> : <LineChart size={10} />}
                        </button>
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};
