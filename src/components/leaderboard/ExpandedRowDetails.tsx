import { useState } from 'react';
import { ChevronDown, ChevronUp, LineChart } from 'lucide-react';
import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { StabilityRibbon } from '../modals/views/StabilityRibbon';
import { HistoryChart } from '../common/HistoryChart'; 
// 👇 IMPORT THE DEBUGGER (Make sure this file exists!)
import { NodeDebugger } from '../debug/NodeDebugger'; 

export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  const [isOpen, setIsOpen] = useState(false);

  // ⚡ PERFORMANCE TIP: 
  // By passing 'undefined' when closed, the hook pauses and doesn't fetch.
  // The moment you click open, it receives 'node' and triggers the fetch.
  const { history, loading } = useNodeHistory(isOpen ? node : undefined);

  // Safety map: ensures we map the 'credits' from the hook to 'value' for the chart
  const creditsData = history ? history.map(h => ({ 
    date: h.date, 
    value: h.credits || 0 
  })) : [];

  return (
    <div className="border-t border-zinc-800 pt-2 mt-2">
       {/* TOGGLE BUTTON */}
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className={`w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${isOpen ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
       >
          <LineChart size={12} />
          {isOpen ? 'Hide History' : 'Show History & Stability'}
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
       </button>

       {/* COLLAPSIBLE CONTENT */}
       {isOpen && (
           <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
               {/* 1. STABILITY MAP */}
               <div>
                   <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Stability Map (7D)</div>
                   <div className="h-12 border border-zinc-800 rounded-lg bg-black/20 p-2">
                       <StabilityRibbon history={history} loading={loading} />
                   </div>
               </div>

               {/* 2. CREDITS CHART */}
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
                              height={40}
                              label="Credits" 
                           />
                       </div>
                   </div>
               </div>

               {/* 👇 DEBUGGER: This will appear at the bottom of the expanded row 👇 */}
               <div className="col-span-1 md:col-span-2">
                  <NodeDebugger node={node} />
               </div>
           </div>
       )}
    </div>
  );
};
