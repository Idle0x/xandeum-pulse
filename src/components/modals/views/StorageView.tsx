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

  const reliabilityScore = history.length > 0 
      ? Math.round(history.reduce((acc, p) => acc + (p.health >= 80 ? 1 : 0), 0) / history.length * 100) 
      : 0;

  const utilization = nodeCap > 0 ? (nodeUsed / nodeCap) * 100 : 0;
  const dashArray = 2 * Math.PI * 14; // Reduced radius r=14 (from 18) for compactness
  const dashOffset = dashArray - ((utilization / 100) * dashArray);

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

       {/* HEADER: Back Button */}
       <div className="flex justify-end items-center mb-2 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-2 md:gap-3">
        
        {/* ROW 1: COMPACT METRICS (Height reduced significantly) */}
        <div className="flex gap-2 h-16 md:h-20 shrink-0">
            {/* Donut Chart (Compact) */}
            <div className={`flex-1 border rounded-xl px-3 flex items-center gap-3 relative overflow-hidden ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>
                {reliabilityScore > 90 && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[6px] font-bold text-green-500 bg-green-500/10 px-1 py-px rounded border border-green-500/20">
                      <ShieldCheck size={6} /> {reliabilityScore}%
                  </div>
                )}
                <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="14" fill="none" stroke="#27272a" strokeWidth="4" />
                        <circle cx="20" cy="20" r="14" fill="none" stroke={zenMode ? '#ffffff' : (utilization > 90 ? '#ef4444' : '#3b82f6')} strokeWidth="4" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className={zenMode ? '' : 'transition-all duration-1000 ease-out'} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[7px] md:text-[8px] font-bold text-white">{Math.round(utilization)}%</div>
                </div>
                <div><div className="text-[8px] font-bold text-zinc-500 uppercase leading-tight">Efficiency</div><div className="text-[10px] md:text-xs font-bold text-white leading-tight">Utilization</div></div>
            </div>

            {/* Status Badge (Compact) */}
            <div className={`flex-1 border rounded-xl px-2 flex flex-col justify-center items-center ${zenMode ? 'bg-black border-zinc-700' : (isPos ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30')}`}>
                <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${zenMode ? 'text-white' : (isPos ? 'text-green-400' : 'text-red-400')}`}>{isPos ? 'ABOVE' : 'BELOW'}</div>
                <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${zenMode ? 'text-zinc-500' : (isPos ? 'text-green-400' : 'text-red-400')}`}>MAJORITY</div>
            </div>
        </div>

        {/* ROW 2: BENCHMARKS (Compressed to single strip) */}
        <div className={`flex items-center justify-between px-4 py-2 rounded-xl border shrink-0 ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 uppercase font-bold">Median</span>
              <span className="text-[10px] font-mono text-white">{formatBytes(median)}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex flex-col text-right">
              <span className="text-[8px] text-zinc-500 uppercase font-bold">Average</span>
              <span className="text-[10px] font-mono text-white">{formatBytes(avgCommitted)}</span>
          </div>
        </div>

        {/* ROW 3: PROFESSIONAL CHART (Takes remaining space) */}
        <div className="flex-1 min-h-[250px] overflow-hidden">
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
