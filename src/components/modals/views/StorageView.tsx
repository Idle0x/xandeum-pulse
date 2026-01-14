import { Database, ArrowLeft } from 'lucide-react';
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
  
  // Desktop Calculation
  const tankFill = isPos ? 100 : Math.max(10, (nodeCap / median) * 100);

  // Mobile Calculation: Normalize to largest value for horizontal capsule
  const maxValue = Math.max(nodeCap, median, avgCommitted) * 1.1; 
  const nodeWidth = (nodeCap / maxValue) * 100;
  const medianPos = (median / maxValue) * 100;
  const avgPos = (avgCommitted / maxValue) * 100;

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
       {/* HEADER */}
       <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${zenMode ? 'text-zinc-200' : 'text-zinc-500'}`}>
          <Database size={14} /> STORAGE ANALYTICS
        </h3>
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

        {/* --- MOBILE LAYOUT: PREMIUM LIQUID CAPSULE --- */}
        <div className="md:hidden flex flex-col justify-center py-6">
             
             {/* The Capsule Container */}
             <div className="relative h-14 w-full bg-zinc-900/80 rounded-full border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* 1. The Liquid Fill */}
                <div 
                   className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out flex items-center overflow-hidden ${isPos ? 'bg-purple-600' : 'bg-purple-900/60'}`} 
                   style={{ width: `${nodeWidth}%` }}
                >
                    {/* Digital Rain Animation (Ported to Horizontal) */}
                    <div className="absolute inset-0 opacity-30 w-full h-full">
                         <div className="absolute top-0 left-0 h-[1px] w-full bg-white/40 animate-[shimmer-once_2s_infinite]"></div>
                    </div>
                    {/* Leading Edge Glow */}
                    <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                </div>

                {/* 2. Holographic Markers (Overlay) */}
                <div className="absolute top-0 bottom-0 w-[2px] bg-yellow-400 z-10 shadow-[0_0_8px_rgba(234,179,8,1)]" style={{ left: `${medianPos}%` }}></div>
                <div className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-10 shadow-[0_0_8px_rgba(59,130,246,1)]" style={{ left: `${avgPos}%` }}></div>

                {/* 3. Floating Data Labels (Inside/Outside Logic) */}
                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-20">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-white/70 drop-shadow-md">Committed</span>
                        <span className="text-xs font-mono font-bold text-white drop-shadow-md">{formatBytes(nodeCap)}</span>
                    </div>
                </div>
             </div>

             {/* Legend Below Capsule */}
             <div className="flex justify-between mt-3 px-2">
                  <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">Median</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 pl-3">{formatBytes(median)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">Average</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 pr-3">{formatBytes(avgCommitted)}</span>
                  </div>
             </div>

             {/* Used Space Info */}
             <div className="mt-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-2 flex justify-between items-center">
                 <span className="text-[9px] font-bold text-zinc-500 uppercase">Actual Used Space</span>
                 <span className="text-xs font-mono font-bold text-blue-400">{formatBytes(node?.storage_used)}</span>
             </div>
        </div>

        {/* --- DESKTOP LAYOUT: VERTICAL TANKS (Preserved) --- */}
        <div className="hidden md:flex flex-grow relative rounded-2xl border border-zinc-800 bg-black/50 overflow-hidden items-end justify-center group min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>
          <div className={`w-full transition-all duration-1000 relative z-10 group-hover:bg-purple-600/40 ${isPos ? 'bg-purple-600/30' : 'bg-purple-900/20'}`} style={{ height: `${tankFill}%` }}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPos ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-red-500/50'}`}></div>
            {isPos && (
              <div className="absolute inset-0 overflow-hidden opacity-50">
                <div className="absolute -top-10 left-1/4 w-0.5 h-full bg-green-400/40 animate-[rain_2s_infinite] group-hover:animate-[rain_1s_infinite]"></div>
                <div className="absolute -top-20 left-1/2 w-0.5 h-full bg-green-400/40 animate-[rain_3s_infinite_0.5s] group-hover:animate-[rain_1.5s_infinite_0.5s]"></div>
                <div className="absolute -top-5 left-3/4 w-0.5 h-full bg-green-400/40 animate-[rain_2.5s_infinite_1s] group-hover:animate-[rain_1.2s_infinite_1s]"></div>
              </div>
            )}
          </div>
          {!isPos && (
            <div className="absolute top-0 left-0 right-0 bg-red-900/10 border-b border-red-500/30 pattern-diagonal-lines" style={{ height: `${100 - tankFill}%` }}>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-red-500 uppercase tracking-widest opacity-50">Deficit Gap</div>
            </div>
          )}
          <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-4 text-[9px] text-zinc-600 font-mono z-20 pointer-events-none"><span>100%</span><span>50%</span><span>0%</span></div>
        </div>

        <div className="hidden md:block p-4 rounded-2xl border bg-zinc-900/30 border-zinc-800">
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

        <div className="hidden md:block p-4 rounded-xl border bg-zinc-900/30 border-zinc-800">
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
      </div>
    </div>
  );
};
