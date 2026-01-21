import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';
import { StorageHistoryChart } from './StorageHistoryChart';

interface StorageViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  medianCommitted: number;
  totalStorageCommitted: number;
  nodeCount: number;
  history?: NodeHistoryPoint[];
}

export const StorageView = ({ node, zenMode, onBack, medianCommitted, totalStorageCommitted, nodeCount, history = [] }: StorageViewProps) => {
  const nodeCap = node?.storage_committed || 0;
  const nodeUsed = node?.storage_used || 0;
  const median = medianCommitted || 1;
  const avgCommitted = totalStorageCommitted / (nodeCount || 1);
  const diff = nodeCap - median;
  const isPos = diff >= 0;

  // Calculate Reliability from history prop for badge
  const reliabilityScore = history.length > 0 
      ? Math.round(history.reduce((acc, p) => acc + (p.health >= 80 ? 1 : 0), 0) / history.length * 100) 
      : 0;

  const multiplier = median > 0 ? (nodeCap / median) : 0;
  const multiplierDisplay = multiplier >= 1 ? `${multiplier.toFixed(1)}x` : `${(1/multiplier).toFixed(1)}x`;

  // Bar Chart Math
  const maxValue = Math.max(nodeCap, median, avgCommitted) * 1.1; 
  const nodeP = (nodeCap / maxValue) * 100;
  const medP = (median / maxValue) * 100;
  const avgP = (avgCommitted / maxValue) * 100;

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

       {/* HEADER: Back Button */}
       <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4">
        
        {/* MAIN METRIC CARD */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60'}`}>
          
           {/* Reliability Badge */}
           {reliabilityScore > 90 && (
             <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 shadow-lg animate-in zoom-in duration-500 z-20">
                <ShieldCheck size={10} /> {reliabilityScore}% PROVEN
             </div>
           )}

           {/* Header */}
           <div className="w-full flex justify-between items-start mb-6 z-10">
               <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">NETWORK COMPARISON</div>
           </div>

           {/* Bar Chart Section */}
           <div className="flex-1 w-full flex items-end justify-between gap-4 relative z-10 px-4 pb-2 mb-2 min-h-[120px]">
                {/* Horizontal Baseline */}
                <div className="absolute bottom-[18px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>

                {[
                    { label: 'YOU', val: nodeP, raw: nodeCap, type: 'MY_NODE' },
                    { label: 'MEDIAN', val: medP, raw: median, type: 'MEDIAN' }, 
                    { label: 'AVERAGE', val: avgP, raw: avgCommitted, type: 'AVG' }
                ].map((bar, i) => {
                    const isMyNode = bar.type === 'MY_NODE';
                    const barColor = zenMode 
                        ? (isMyNode ? 'bg-white' : 'bg-zinc-800')
                        : (isMyNode ? 'bg-gradient-to-t from-purple-900/80 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-zinc-800/60 border-t border-white/5');
                    const labelColor = isMyNode ? (zenMode ? 'text-white' : 'text-purple-400') : 'text-zinc-500';

                    return (
                        <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">
                            {/* Hover Value */}
                            <div className="mb-2 text-[9px] font-mono font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute bottom-full">
                                {formatBytes(bar.raw)}
                            </div>
                            
                            {/* The Bar */}
                            <div 
                                className={`w-full max-w-[40px] md:max-w-[50px] rounded-t-sm md:rounded-t-md transition-all duration-1000 ease-out relative ${barColor}`} 
                                style={{ height: `${Math.max(bar.val, 2)}%` }}
                            >
                                {!zenMode && isMyNode && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60 shadow-[0_0_8px_white]"></div>}
                            </div>

                            {/* Axis Label */}
                            <div className={`mt-2 text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                                {bar.label}
                            </div>
                        </div>
                    );
                })}
           </div>

           {/* Footer Comparison Text (Moved here) */}
           <div className="mt-2 pt-3 border-t border-zinc-800/50 text-center">
                <span className="text-[10px] text-zinc-500">
                    Your Commitment is <span className={zenMode ? 'text-white font-bold' : (isPos ? 'text-green-400 font-bold' : 'text-red-400 font-bold')}>{multiplierDisplay} {isPos ? 'Higher' : 'Lower'}</span> than median
                </span>
           </div>
        </div>

        {/* PROFESSIONAL CHART AREA (Replaces old benchmark boxes) */}
        <div className="flex-1 min-h-[200px]">
            <StorageHistoryChart 
                history={history} 
                currentUsed={nodeUsed} 
                currentCommitted={nodeCap}
                zenMode={zenMode}
            />
        </div>

      </div>
    </div>
  );
};
