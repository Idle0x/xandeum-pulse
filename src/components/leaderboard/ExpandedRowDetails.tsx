import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { StabilityRibbon } from '../modals/views/StabilityRibbon';
import { HistoryChart } from '../common/HistoryChart'; // Reusing your generic chart

export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  // Ensure useNodeHistory fetches 'credits' and 'rank' now (via Part 1 SQL)
  const { history, loading } = useNodeHistory(node);

  // Map history to chart format for Credits
  const creditsData = history ? history.map(h => ({ date: h.date, value: h.credits || 0 })) : [];

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
       
       {/* 1. STABILITY MAP (Existing) */}
       <div>
           <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Stability Map (7D)</div>
           <div className="h-12 border border-zinc-800 rounded-lg bg-black/20 p-2">
               <StabilityRibbon history={history} loading={loading} />
           </div>
       </div>

       {/* 2. EARNINGS PERFORMANCE (New) */}
       <div>
           <div className="flex justify-between items-center mb-2">
               <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Credits Growth (30D)</div>
               {!loading && creditsData.length > 0 && (
                   <span className="text-[8px] font-mono text-green-500 bg-green-900/20 px-1.5 rounded">
                       Live Data
                   </span>
               )}
           </div>
           <div className="h-12 border border-zinc-800 rounded-lg bg-black/20 relative overflow-hidden">
               <div className="absolute inset-0 opacity-80 pt-2 pr-2">
                   <HistoryChart 
                      data={creditsData} 
                      color="#eab308" 
                      loading={loading} 
                      height={40} // Mini sparkline
                   />
               </div>
           </div>
       </div>

    </div>
  );
};
