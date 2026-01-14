import { ArrowLeft } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface StorageViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  medianCommitted: number;
  totalStorageCommitted: number;
  nodeCount: number;
}

export const StorageView = ({ node, zenMode, onBack, medianCommitted, totalStorageCommitted, nodeCount }: StorageViewProps) => {
  const nodeCap = node?.storage_committed || 0;
  const median = medianCommitted || 1;
  const avgCommitted = totalStorageCommitted / (nodeCount || 1);
  const diff = nodeCap - median;
  const isPos = diff >= 0;
  const percentDiff = Math.abs((diff / median) * 100);
  const tankFill = isPos ? 100 : Math.max(10, (nodeCap / median) * 100);

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
       {/* HEADER: Back Button Only */}
       <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 transition hover:bg-zinc-800">
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4">
        {/* Comparison Text */}
        <div className={`p-4 rounded-xl border text-center relative overflow-hidden ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/60'}`}>
          <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 flex items-center justify-center gap-1 tracking-wider">NETWORK COMPARISON</div>
          <div className="text-sm text-zinc-300 relative z-10">
            Storage is <span className={`font-mono font-black text-base ${isPos ? 'text-green-400' : 'text-red-400'}`}>{percentDiff.toFixed(1)}% {isPos ? 'Higher' : 'Lower'}</span> than median
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="block p-4 rounded-xl border bg-zinc-900/30 border-zinc-800">
          <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-2">
            <span>Your Capacity</span>
            <span className={isPos ? 'text-green-500' : 'text-red-500'}>{isPos ? 'ABOVE MAJORITY' : 'BELOW MAJORITY'}</span>
          </div>
          <div className="h-3 w-full bg-zinc-900 rounded-full relative overflow-hidden">
            {isPos ? (
              <>
                <div className="absolute top-0 bottom-0 left-0 bg-purple-600 w-3/4"></div>
                <div className="absolute top-0 bottom-0 left-3/4 bg-green-500/20 border-l border-green-500 w-1/4"></div>
              </>
            ) : (
              <>
                <div className="absolute top-0 bottom-0 left-0 bg-purple-600" style={{ width: `${tankFill}%` }}></div>
                <div className="absolute top-0 bottom-0 right-0 bg-red-500/10 border-l border-red-500/50" style={{ width: `${100 - tankFill}%` }}></div>
              </>
            )}
          </div>
        </div>

        {/* Benchmarks */}
        <div className="block p-4 rounded-xl border bg-zinc-900/30 border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Network Benchmarks</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Median Storage</span>
              <span className="text-sm font-mono text-white">{formatBytes(medianCommitted)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Average Storage</span>
              <span className="text-sm font-mono text-white">{formatBytes(avgCommitted)}</span>
            </div>
          </div>
        </div>

        {/* Used Space Info */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 flex justify-between items-center">
             <span className="text-[9px] font-bold text-zinc-500 uppercase">Actual Used Space</span>
             <span className="text-xs font-mono font-bold text-blue-400">{formatBytes(node?.storage_used)}</span>
        </div>
      </div>
    </div>
  );
};
