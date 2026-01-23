import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { DualAxisGrowthChart } from './DualAxisGrowthChart';

const TIME_OPTIONS = [
    { label: '24H', value: '24H' }, // Shortened labels for compact fit
    { label: '3 Days', value: '3D' },
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: 'All', value: 'ALL' },
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

  // BARCODE RENDERER
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
    <div className="border-t border-zinc-800/50 pt-0.5 mt-0.5 bg-gradient-to-b from-zinc-900/10 to-zinc-900/30">
       {/* TOGGLE BUTTON: Reduced Height & Font */}
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className={`w-full flex items-center justify-center gap-2 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'}`}
       >
          {isOpen ? 'Hide History' : 'Show Historical Earnings'}
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
       </button>

       {isOpen && (
           <div className="px-2 pb-2 pt-1 animate-in slide-in-from-top-1 duration-200">
               
               {/* TOP ROW: Dropdown & Ribbon Title */}
               <div className="flex justify-between items-center mb-1 relative z-20">
                   <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Consistency Map</span>
                   
                   {/* COMPACT DROPDOWN */}
                   <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-[9px] font-bold text-zinc-400 rounded transition-all uppercase tracking-wider"
                        >
                            <span>{TIME_OPTIONS.find(o => o.value === timeRange)?.label}</span>
                            <ChevronDown size={10} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-24 bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-0.5">
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

               {/* BARCODE RIBBON: Tight Spacing */}
               <div className="h-4 w-full bg-black/40 rounded-sm border border-zinc-800/30 overflow-hidden mb-2">
                   <Ribbon />
               </div>

               {/* CHART CONTAINER: Reduced Height (h-32 = 128px) */}
               <div className="h-32 border border-zinc-800/40 rounded-lg bg-black/20 p-2 relative">
                   <DualAxisGrowthChart history={history} loading={loading} />
               </div>

               {/* FOOTER: NET POSITION CHANGE (Single Row, Bottom) */}
               <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/30 px-1">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Net Position Change</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] md:text-xs font-mono font-bold ${netPositionChange > 0 ? 'text-emerald-400' : netPositionChange < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                            {netPositionChange > 0 ? '+' : ''}{netPositionChange}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium uppercase">
                            {netPositionChange > 0 ? 'Gained' : netPositionChange < 0 ? 'Lost' : 'Flat'}
                        </span>
                    </div>
               </div>

           </div>
       )}
    </div>
  );
};
