import { X, Database, Trophy, PieChart, TrendingUp, Users } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  // Global Stats
  totalCommitted: number;
  totalUsed: number;
  medianCommitted: number;
  // Context Stats
  mainnetCommitted: number;
  mainnetUsed: number;
  devnetCommitted: number;
  devnetUsed: number;
}

export const CapacityModal = ({ 
  onClose, nodes, 
  totalCommitted, totalUsed, medianCommitted,
  mainnetCommitted, mainnetUsed, devnetCommitted, devnetUsed 
}: CapacityModalProps) => {
  
  // --- 1. RESTORED LOGIC: Benchmarks & Dominance ---
  const avgCommitted = totalCommitted / (nodes.length || 1);
  const top10Storage = [...nodes]
    .sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0))
    .slice(0, 10);
  const top10Total = top10Storage.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const top10Dominance = totalCommitted > 0 ? ((top10Total / totalCommitted) * 100).toFixed(2) : '0.00';

  // --- 2. CHART LOGIC ---
  const total = totalCommitted || 1;
  const mainnetPercent = (mainnetCommitted / total) * 100;
  const devnetPercent = (devnetCommitted / total) * 100;
  const otherCommitted = totalCommitted - (mainnetCommitted + devnetCommitted);
  const otherPercent = Math.max(0, (otherCommitted / total) * 100);

  // SVG Chart Config
  const r = 15.9155; 
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Database size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Capacity</h3>
              <p className="text-xs text-zinc-500">Storage distribution and utilization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* SECTION A: HERO (Global Stats) */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5">
             <div className="grid grid-cols-2 gap-8 divide-x divide-zinc-800">
                <div className="text-center">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Global Committed</div>
                   <div className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatBytes(totalCommitted)}</div>
                </div>
                <div className="text-center pl-8">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Global Used</div>
                   <div className="text-2xl md:text-3xl font-black text-blue-400 tracking-tight">{formatBytes(totalUsed)}</div>
                   <div className="text-xs text-zinc-600 font-mono mt-1">{((totalUsed/totalCommitted)*100).toFixed(2)}% Utilized</div>
                </div>
             </div>
          </div>

          {/* SECTION B: CONTEXT SPLIT (Mainnet vs Devnet) */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Mainnet</span>
                </div>
                <div className="space-y-0.5">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Cap</span>
                      <span className="text-xs font-mono font-bold text-white">{formatBytes(mainnetCommitted)}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Used</span>
                      <span className="text-xs font-mono font-bold text-zinc-400">{formatBytes(mainnetUsed)}</span>
                   </div>
                </div>
             </div>

             <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                   <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Devnet</span>
                </div>
                <div className="space-y-0.5">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Cap</span>
                      <span className="text-xs font-mono font-bold text-white">{formatBytes(devnetCommitted)}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Used</span>
                      <span className="text-xs font-mono font-bold text-zinc-400">{formatBytes(devnetUsed)}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* SECTION C: DEEP INSIGHTS (Restored Benchmarks & Dominance) */}
          <div className="grid grid-cols-2 gap-3">
              {/* Benchmarks */}
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <TrendingUp size={10} /> Benchmarks
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Median</span>
                    <span className="text-xs font-mono text-white">{formatBytes(medianCommitted)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Average</span>
                    <span className="text-xs font-mono text-zinc-300">{formatBytes(avgCommitted)}</span>
                  </div>
                </div>
              </div>

              {/* Top 10 Dominance */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={10} className="text-yellow-500" />
                  <div className="text-[9px] text-yellow-500 uppercase font-bold">Top 10 Nodes</div>
                </div>
                <div className="text-xl font-bold text-white">{top10Dominance}%</div>
                <div className="text-[9px] text-zinc-500 mt-0.5">of total network capacity</div>
                <div className="mt-2 text-[9px] text-zinc-600 border-t border-yellow-500/10 pt-1">
                   Combined: {formatBytes(top10Total)}
                </div>
              </div>
          </div>

          {/* SECTION D: VISUALIZATION (Donut Chart) */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-center gap-6">
            <div className="relative w-16 h-16 shrink-0">
               <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#27272a" strokeWidth="6" />
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#22c55e" strokeWidth="6" strokeDasharray={`${mainnetPercent} ${100 - mainnetPercent}`} strokeDashoffset="0" />
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray={`${devnetPercent} ${100 - devnetPercent}`} strokeDashoffset={-mainnetPercent} />
                  {otherPercent > 0 && <circle cx="21" cy="21" r={r} fill="transparent" stroke="#71717a" strokeWidth="6" strokeDasharray={`${otherPercent} ${100 - otherPercent}`} strokeDashoffset={-(mainnetPercent + devnetPercent)} />}
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-zinc-600"><PieChart size={12} /></div>
            </div>

            <div className="flex-1">
               <h4 className="text-[9px] text-zinc-500 uppercase font-bold mb-2">Committed Distribution</h4>
               <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[10px]">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <span className="text-zinc-300">Mainnet: <span className="font-mono text-zinc-500 ml-1">{mainnetPercent.toFixed(1)}%</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                     <span className="text-zinc-300">Devnet: <span className="font-mono text-zinc-500 ml-1">{devnetPercent.toFixed(1)}%</span></span>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
