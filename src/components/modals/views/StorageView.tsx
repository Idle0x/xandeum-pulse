import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';
import { HistoryChart } from '../common/HistoryChart';
import { useMemo } from 'react';

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

  // Transform history for Chart
  const chartData = useMemo(() => {
    return history.map(p => ({
      date: p.date,
      value: p.health // Proxying activity via health if storage history unavailable
    }));
  }, [history]);

  // Calculate Reliability from history prop for badge
  const reliabilityScore = history.length > 0 
      ? Math.round(history.reduce((acc, p) => acc + (p.health >= 80 ? 1 : 0), 0) / history.length * 100) 
      : 0;

  const multiplier = median > 0 ? (nodeCap / median) : 0;
  const multiplierDisplay = multiplier >= 1 ? `${multiplier.toFixed(1)}x` : `${(1/multiplier).toFixed(1)}x`;
  const utilization = nodeCap > 0 ? (nodeUsed / nodeCap) * 100 : 0;
  const dashArray = 2 * Math.PI * 18; // r=18
  const dashOffset = dashArray - ((utilization / 100) * dashArray);

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

       {/* HEADER: Back Button */}
       <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4">
        {/* Network Comparison with SHADOW CHART */}
        <div className={`p-4 rounded-xl border text-center relative overflow-hidden group ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60'}`}>

          {/* SHADOW CHART: Activity/Health Proxy */}
          <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none mt-2 px-2">
               <HistoryChart 
                  data={chartData} 
                  color={isPos ? '#22c55e' : '#ef4444'} 
                  loading={false} 
                  height={80} 
               />
          </div>

          {/* Reliability Badge */}
          {reliabilityScore > 90 && (
             <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 shadow-lg animate-in zoom-in duration-500 z-10">
                <ShieldCheck size={10} /> {reliabilityScore}% PROVEN
             </div>
          )}

          <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 flex items-center justify-center gap-1 tracking-wider relative z-10">NETWORK COMPARISON</div>
          <div className="text-sm text-zinc-300 relative z-10">
            Storage is 
            <span className={`font-mono font-black text-lg mx-1 ${zenMode ? 'text-white' : (isPos ? 'text-green-400' : 'text-red-400')}`}>
                {multiplierDisplay} {isPos ? 'Higher' : 'Lower'}
            </span> 
            than median
          </div>
        </div>

        {/* Utilization Donut & Status */}
        <div className="flex gap-3">
            <div className={`flex-1 border rounded-xl p-3 flex items-center gap-4 ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>
                <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#27272a" strokeWidth="4" />
                        <circle cx="20" cy="20" r="18" fill="none" stroke={zenMode ? '#ffffff' : (utilization > 90 ? '#ef4444' : '#3b82f6')} strokeWidth="4" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className={zenMode ? '' : 'transition-all duration-1000 ease-out'} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{Math.round(utilization)}%</div>
                </div>
                <div><div className="text-[9px] font-bold text-zinc-500 uppercase">Efficiency</div><div className="text-xs font-bold text-white">Utilization</div></div>
            </div>
            <div className={`flex-1 border rounded-xl p-3 flex flex-col justify-center items-center ${zenMode ? 'bg-black border-zinc-700' : (isPos ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30')}`}>
                <div className={`text-[9px] font-black uppercase tracking-wider ${zenMode ? 'text-white' : (isPos ? 'text-green-400' : 'text-red-400')}`}>{isPos ? 'ABOVE' : 'BELOW'}</div>
                <div className={`text-[9px] font-black uppercase tracking-wider ${zenMode ? 'text-zinc-500' : (isPos ? 'text-green-400' : 'text-red-400')}`}>MAJORITY</div>
            </div>
        </div>

        {/* Benchmarks */}
        <div className={`block p-4 rounded-xl border ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Network Benchmarks</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-sm text-zinc-400">Median Storage</span><span className="text-sm font-mono text-white">{formatBytes(median)}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-zinc-400">Average Storage</span><span className="text-sm font-mono text-white">{formatBytes(avgCommitted)}</span></div>
          </div>
        </div>

        {/* Used Space Info */}
        <div className={`border rounded-lg p-3 text-center ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
             <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Actual Used Space</div>
             <div className={`text-xl font-mono font-black leading-none ${zenMode ? 'text-white' : 'text-blue-400'}`}>{formatBytes(nodeUsed)}</div>
             <div className="text-[9px] font-mono text-zinc-600 mt-1">raw {nodeUsed.toLocaleString()} bytes</div>
        </div>
      </div>
    </div>
  );
};
