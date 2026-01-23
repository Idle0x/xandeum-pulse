import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { VelocityRibbon } from './VelocityRibbon';
import { DualAxisGrowthChart } from './DualAxisGrowthChart';

export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('30D'); // Default to 30D for better context

  const { history, loading } = useNodeHistory(isOpen ? node : undefined, timeRange);

  // --- RIVALRY CALC (Rank Change) ---
  const rankChange = useMemo(() => {
      if (!history || history.length < 2) return 0;
      const first = history[0].rank;
      const last = history[history.length - 1].rank;
      return first - last; // Positive means rank went down (improved), e.g. 50 -> 40 = +10
  }, [history]);

  return (
    <div className="border-t border-zinc-800 pt-2 mt-2">
       {/* TOGGLE BUTTON */}
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className={`w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${isOpen ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
       >
          <LineChart size={12} />
          {isOpen ? 'Hide Performance' : 'Show Performance & Rivalry'}
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
       </button>

       {isOpen && (
           <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
               
               {/* 1. HEADER & CONTROLS */}
               <div className="flex justify-between items-end mb-4">
                   {/* RIVALRY INDICATOR */}
                   <div className="flex items-center gap-3">
                       <div className={`text-2xl font-black ${rankChange > 0 ? 'text-green-500' : rankChange < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                           {rankChange > 0 ? '+' : ''}{rankChange}
                       </div>
                       <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rivalry Index</span>
                           <span className="text-[10px] text-zinc-500">
                               {rankChange > 0 ? 'Positions Gained' : rankChange < 0 ? 'Positions Lost' : 'No Change'} in {timeRange}
                           </span>
                       </div>
                   </div>

                   {/* TIME SELECTOR */}
                   <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                       {['7D', '30D', 'ALL'].map((t) => (
                           <button 
                               key={t}
                               onClick={() => setTimeRange(t as any)}
                               className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition ${timeRange === t ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                               {t}
                           </button>
                       ))}
                   </div>
               </div>

               {/* 2. VELOCITY RIBBON (Subtle Background Style) */}
               <div className="mb-6">
                   <div className="flex justify-between items-center mb-1.5 px-1">
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Earning Velocity (Daily)</span>
                       <span className="text-[9px] text-zinc-600 font-mono">Heatmap</span>
                   </div>
                   <div className="h-6 w-full opacity-80 hover:opacity-100 transition-opacity">
                       <VelocityRibbon history={history} loading={loading} />
                   </div>
               </div>

               {/* 3. DUAL AXIS CHART (Tall) */}
               <div className="h-48 md:h-56 border border-zinc-800 rounded-xl bg-black/20 p-3 relative">
                   <div className="absolute top-3 left-3 text-[9px] font-bold text-zinc-500 uppercase tracking-wider z-10 flex gap-4">
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Earnings</span>
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Rank</span>
                   </div>
                   <DualAxisGrowthChart history={history} loading={loading} />
               </div>

           </div>
       )}
    </div>
  );
};
