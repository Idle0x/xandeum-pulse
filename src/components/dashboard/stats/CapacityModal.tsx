import { X, Database, HardDrive, PieChart } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  // Global Stats
  totalCommitted: number;
  totalUsed: number;
  medianCommitted: number;
  // Context Stats (New)
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
  
  // --- Chart Logic ---
  const total = totalCommitted || 1;
  const mainnetPercent = (mainnetCommitted / total) * 100;
  const devnetPercent = (devnetCommitted / total) * 100;
  // Calculate "Other" (Unknown/Testnet) just in case
  const otherCommitted = totalCommitted - (mainnetCommitted + devnetCommitted);
  const otherPercent = Math.max(0, (otherCommitted / total) * 100);

  // SVG Dash Arrays for Donut Chart
  // Circle circumference = 2 * pi * r. Let r=16 (approx 100 circumference for easy math) -> C=100
  const r = 15.9155; 
  const c = 100; 
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        
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

        <div className="space-y-6">
          
          {/* 1. HERO SECTION: Global Stats */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-6">
             <div className="grid grid-cols-2 gap-8 divide-x divide-zinc-800">
                <div className="text-center">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Global Committed</div>
                   <div className="text-2xl md:text-4xl font-black text-white tracking-tight">{formatBytes(totalCommitted)}</div>
                </div>
                <div className="text-center pl-8">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Global Used</div>
                   <div className="text-2xl md:text-4xl font-black text-blue-400 tracking-tight">{formatBytes(totalUsed)}</div>
                   <div className="text-xs text-zinc-600 font-mono mt-1">{((totalUsed/totalCommitted)*100).toFixed(2)}% Utilized</div>
                </div>
             </div>
          </div>

          {/* 2. SPLIT CONTEXT: Mainnet vs Devnet */}
          <div className="grid grid-cols-2 gap-4">
             {/* Mainnet Box */}
             <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Mainnet</span>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Cap</span>
                      <span className="text-sm font-mono font-bold text-white">{formatBytes(mainnetCommitted)}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Used</span>
                      <span className="text-sm font-mono font-bold text-zinc-400">{formatBytes(mainnetUsed)}</span>
                   </div>
                </div>
             </div>

             {/* Devnet Box */}
             <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                   <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Devnet</span>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Cap</span>
                      <span className="text-sm font-mono font-bold text-white">{formatBytes(devnetCommitted)}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Used</span>
                      <span className="text-sm font-mono font-bold text-zinc-400">{formatBytes(devnetUsed)}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* 3. VISUALIZATION: Donut Chart */}
          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-6 md:gap-10">
            {/* SVG Chart */}
            <div className="relative w-24 h-24 shrink-0">
               <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
                  {/* Background Ring */}
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#27272a" strokeWidth="5" />
                  
                  {/* Mainnet Segment (Green) */}
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#22c55e" strokeWidth="5"
                     strokeDasharray={`${mainnetPercent} ${100 - mainnetPercent}`}
                     strokeDashoffset="0" 
                  />
                  
                  {/* Devnet Segment (Blue) */}
                  <circle cx="21" cy="21" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="5"
                     strokeDasharray={`${devnetPercent} ${100 - devnetPercent}`}
                     strokeDashoffset={-mainnetPercent} 
                  />

                  {/* Other Segment (Purple/Grey - if any) */}
                  {otherPercent > 0 && (
                     <circle cx="21" cy="21" r={r} fill="transparent" stroke="#71717a" strokeWidth="5"
                        strokeDasharray={`${otherPercent} ${100 - otherPercent}`}
                        strokeDashoffset={-(mainnetPercent + devnetPercent)} 
                     />
                  )}
               </svg>
               {/* Center Icon */}
               <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                  <PieChart size={16} />
               </div>
            </div>

            {/* Legend */}
            <div className="flex-1">
               <h4 className="text-[10px] text-zinc-500 uppercase font-bold mb-3 border-b border-zinc-800 pb-2">Committed Storage Distribution</h4>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-green-500"></div><span className="text-zinc-300">Mainnet</span></div>
                     <span className="font-mono text-zinc-500">{mainnetPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500"></div><span className="text-zinc-300">Devnet</span></div>
                     <span className="font-mono text-zinc-500">{devnetPercent.toFixed(1)}%</span>
                  </div>
                  {otherPercent > 0 && (
                     <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-zinc-500"></div><span className="text-zinc-300">Unknown</span></div>
                        <span className="font-mono text-zinc-500">{otherPercent.toFixed(1)}%</span>
                     </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
