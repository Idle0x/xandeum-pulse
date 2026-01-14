import { ArrowLeft, Minimize2 } from 'lucide-react';
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
  const nodeUsed = node?.storage_used || 0;
  
  // Stats
  const avgCommitted = totalStorageCommitted / (nodeCount || 1);
  const median = medianCommitted || 1;
  const diff = nodeCap - median;
  const isPos = diff >= 0;

  // Multiplier Calculation (e.g., 131x)
  const multiplier = median > 0 ? (nodeCap / median) : 0;
  const multiplierDisplay = multiplier >= 1 ? `${multiplier.toFixed(1)}x` : `${(1/multiplier).toFixed(1)}x`;

  // Utilization (Efficiency)
  const utilization = nodeCap > 0 ? (nodeUsed / nodeCap) * 100 : 0;
  const dashArray = 2 * Math.PI * 18; // r=18
  const dashOffset = dashArray - ((utilization / 100) * dashArray);

  // --- BAR CHART LOGIC (Local implementation to match InspectorModal) ---
  const maxValue = Math.max(nodeCap, median, avgCommitted) * 1.1; // 10% buffer
  const nodeP = (nodeCap / maxValue) * 100;
  const medP = (median / maxValue) * 100;
  const avgP = (avgCommitted / maxValue) * 100;

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col custom-scrollbar overflow-y-auto pr-1">
       {/* HEADER: Back Button Only */}
       <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 transition hover:bg-zinc-800">
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4">
        
        {/* TOP ROW: Multiplier & Status */}
        <div className="flex gap-3">
            <div className={`flex-1 p-3 rounded-xl border text-center relative overflow-hidden flex flex-col justify-center ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/60'}`}>
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">vs Median</div>
                <div className={`font-mono font-black text-xl ${isPos ? 'text-green-400' : 'text-red-400'}`}>{multiplierDisplay}</div>
            </div>
             <div className={`flex-1 border rounded-xl p-3 flex flex-col justify-center items-center ${isPos ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className={`text-[9px] font-black uppercase tracking-wider ${isPos ? 'text-green-400' : 'text-red-400'}`}>{isPos ? 'ABOVE' : 'BELOW'}</div>
                <div className={`text-[9px] font-black uppercase tracking-wider ${isPos ? 'text-green-400' : 'text-red-400'}`}>MAJORITY</div>
            </div>
        </div>

        {/* COMPARISON CHART */}
        <div className="p-4 rounded-xl border bg-zinc-900/30 border-zinc-800 relative overflow-hidden">
             <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-4 flex justify-between relative z-10">
                 <span>Capacity Distribution</span>
                 <Minimize2 size={12} className="opacity-50"/>
             </div>

             <div className="h-32 flex items-end justify-between gap-4 relative z-10 px-2">
                {/* Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10"></div>
                
                {/* Bars */}
                {[
                    { label: 'YOU', val: nodeP, raw: nodeCap, type: 'MY_NODE' },
                    { label: 'MEDIAN', val: medP, raw: median, type: 'MEDIAN' },
                    { label: 'AVERAGE', val: avgP, raw: avgCommitted, type: 'AVG' }
                ].map((bar, i) => {
                    const isMyNode = bar.type === 'MY_NODE';
                    const barColor = isMyNode 
                         ? 'bg-gradient-to-t from-purple-900/80 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                         : 'bg-zinc-800/60 border-t border-white/5';
                    const labelColor = isMyNode ? 'text-purple-400' : 'text-zinc-600';

                    return (
                        <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">
                            {/* Value Label */}
                            <div className="mb-2 text-[9px] font-mono font-bold text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatBytes(bar.raw).split(' ')[0]} <span className="text-[7px]">{formatBytes(bar.raw).split(' ')[1]}</span>
                            </div>

                            {/* Bar */}
                            <div 
                                className={`w-full max-w-[40px] rounded-t-sm transition-all duration-1000 ease-out relative ${barColor}`} 
                                style={{ height: `${Math.max(bar.val, 2)}%` }} // Force min 2%
                            >
                                <div className={`absolute top-0 left-0 right-0 h-[1px] ${isMyNode ? 'bg-white/60' : 'bg-white/10'}`}></div>
                            </div>
                            
                            {/* Axis Label */}
                            <div className={`mt-2 text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                                {bar.label}
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>

        {/* Utilization Donut */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#27272a" strokeWidth="4" />
                    <circle 
                        cx="20" cy="20" r="18" fill="none" 
                        stroke={utilization > 90 ? '#ef4444' : '#3b82f6'} 
                        strokeWidth="4" 
                        strokeDasharray={dashArray} 
                        strokeDashoffset={dashOffset} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{Math.round(utilization)}%</div>
            </div>
            <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase">Efficiency</div>
                <div className="text-xs font-bold text-white">Utilization</div>
            </div>
        </div>

        {/* Used Space Info */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 text-center">
             <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Actual Used Space</div>
             <div className="text-xl font-mono font-black text-blue-400 leading-none">{formatBytes(nodeUsed)}</div>
             <div className="text-[9px] font-mono text-zinc-600 mt-1">raw {nodeUsed.toLocaleString()} bytes</div>
        </div>
      </div>
    </div>
  );
};
