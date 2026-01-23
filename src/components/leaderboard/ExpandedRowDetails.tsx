import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { DualAxisGrowthChart } from './DualAxisGrowthChart';

const TIME_OPTIONS = [
    { label: '24 Hours', value: '24H' },
    { label: '3 Days', value: '3D' },
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: 'All Time', value: 'ALL' },
] as const;

export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<typeof TIME_OPTIONS[number]['value']>('30D');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { history, loading } = useNodeHistory(isOpen ? node : undefined, timeRange);

  const netPositionChange = useMemo(() => {
      if (!history || history.length < 2) return 0;
      return history[0].rank - history[history.length - 1].rank; 
  }, [history]);

  // BARCODE RENDERER (Clean, no gaps)
  const Ribbon = () => {
      if (loading) return <div className="w-full h-full bg-zinc-900/50 animate-pulse" />;
      if (!history || history.length < 2) return <div className="w-full h-full bg-zinc-900/30" />;

      return (
        <div className="flex items-center justify-start h-full w-full overflow-hidden">
            {history.slice(1).map((day, i) => {
                const prev = history[i];
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
    <div className="border-t border-zinc-800/50 pt-1 mt-1 bg-gradient-to-b from-zinc-900/10 to-zinc-900/30">
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'}`}
       >
          {isOpen ? 'Close Analysis' : 'Expand Performance Metrics'}
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
       </button>

       {isOpen && (
           <div className="px-4 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
               
               {/* CONTROLS HEADER */}
               <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6 border-b border-zinc-800/50 pb-4">
                   
                   {/* NET POSITION (Financial Metric) */}
                   <div>
                       <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Net Position Change</div>
                       <div className="flex items-baseline gap-3">
                           <div className={`text-2xl font-mono font-bold ${netPositionChange > 0 ? 'text-emerald-400' : netPositionChange < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                               {netPositionChange > 0 ? '+' : ''}{netPositionChange}
                           </div>
                           <div className="text-[10px] font-medium text-zinc-500">
                               {netPositionChange > 0 ? 'Positions Gained' : netPositionChange < 0 ? 'Positions Lost' : 'Unchanged'}
                           </div>
                       </div>
                   </div>

                   {/* TIMEFRAME DROPDOWN (UI Component) */}
                   <div className="relative z-20">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-3 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-[10px] font-bold text-zinc-300 rounded transition-all min-w-[140px] uppercase tracking-wider"
                        >
                            <span>{TIME_OPTIONS.find(o => o.value === timeRange)?.label}</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-full bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-1">
                                {TIME_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setTimeRange(opt.value); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${timeRange === opt.value ? 'text-white bg-zinc-900' : 'text-zinc-500'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                   </div>
               </div>

               {/* BARCODE RIBBON */}
               <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Earning Consistency (Heatmap)</span>
                   </div>
                   <div className="h-5 w-full bg-black/40 rounded-sm border border-zinc-800/30 overflow-hidden">
                       <Ribbon />
                   </div>
               </div>

               {/* DUAL AXIS CHART */}
               <div className="h-64 border border-zinc-800/40 rounded-lg bg-black/20 p-4 relative">
                   <div className="absolute top-4 left-4 flex gap-6 z-10">
                       <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Yield</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Rank</span>
                       </div>
                   </div>
                   <DualAxisGrowthChart history={history} loading={loading} />
               </div>
           </div>
       )}
    </div>
  );
};
