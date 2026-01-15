import { useState, useMemo } from 'react';
import { X, Database, Users, PieChart, TrendingUp, Activity, Globe, Server } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  // We still accept these for the "ALL" view split calculation
  mainnetCommitted: number;
  devnetCommitted: number;
}

export const CapacityModal = ({ 
  onClose, nodes, 
  mainnetCommitted, devnetCommitted 
}: CapacityModalProps) => {

  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // --- 1. DYNAMIC HYDRATION ENGINE ---
  // Recalculate everything based on the active tab
  const { scopeNodes, scopeCommitted, scopeUsed, scopeMedian, scopeAvg, whaleStats } = useMemo(() => {
    
    // A. Filter Nodes
    const filtered = nodes.filter(n => activeTab === 'ALL' || n.network === activeTab);
    
    // B. Calculate Scope Totals
    const committed = filtered.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
    const used = filtered.reduce((sum, n) => sum + (n.storage_used || 0), 0);
    
    // C. Calculate Benchmarks (Median & Average)
    const sortedByStorage = [...filtered].sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0));
    const avg = filtered.length > 0 ? committed / filtered.length : 0;
    const midPoint = Math.floor(sortedByStorage.length / 2);
    const median = sortedByStorage.length > 0 ? (sortedByStorage[midPoint].storage_committed || 0) : 0;

    // D. Whale Watcher (Top 10 vs 11-100 vs Rest)
    const top10 = sortedByStorage.slice(0, 10);
    const top10Sum = top10.reduce((s, n) => s + (n.storage_committed || 0), 0);
    
    const midTier = sortedByStorage.slice(10, 100);
    const midTierSum = midTier.reduce((s, n) => s + (n.storage_committed || 0), 0);
    
    const restSum = committed - (top10Sum + midTierSum);

    // E. Percentages for Whale Chart
    const totalCap = committed || 1; // prevent div/0
    const whaleP = (top10Sum / totalCap) * 100;
    const midP = (midTierSum / totalCap) * 100;
    const restP = (restSum / totalCap) * 100;

    return {
      scopeNodes: filtered,
      scopeCommitted: committed,
      scopeUsed: used,
      scopeMedian: median,
      scopeAvg: avg,
      whaleStats: { top10Sum, midTierSum, restSum, whaleP, midP, restP }
    };
  }, [nodes, activeTab]);

  // --- 2. THEME CONFIG ---
  // Dynamic styling based on context
  const getTheme = () => {
    if (activeTab === 'MAINNET') return {
      main: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', 
      heroText: 'text-white', subText: 'text-green-400', 
      icon: Server
    };
    if (activeTab === 'DEVNET') return {
      main: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', 
      heroText: 'text-white', subText: 'text-blue-400',
      icon: Server
    };
    return {
      main: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', 
      heroText: 'text-purple-400', subText: 'text-blue-400',
      icon: Globe
    };
  };
  const theme = getTheme();

  // Helper for Chart Circles
  const r = 15.9155; 

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER & TABS --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${theme.bg} ${theme.border}`}>
              <theme.icon size={24} className={theme.main} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Capacity</h3>
              <p className="text-xs text-zinc-500">Storage analytics & distribution</p>
            </div>
          </div>

          {/* TINY PILL TOGGLES */}
          <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-full">
            {(['ALL', 'MAINNET', 'DEVNET'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                  activeTab === tab 
                    ? (tab === 'ALL' ? 'bg-white text-black shadow-lg' : tab === 'MAINNET' ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]')
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition md:static">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* --- SECTION A: HERO STATS --- */}
          <div className={`border rounded-2xl p-5 relative overflow-hidden ${activeTab === 'ALL' ? 'bg-zinc-900/50 border-zinc-800' : `${theme.bg} ${theme.border}`}`}>
             <div className="grid grid-cols-2 gap-8 divide-x divide-zinc-700/50 relative z-10">
                <div className="text-center">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Committed</div>
                   <div className={`text-3xl font-black tracking-tight ${theme.heroText}`}>{formatBytes(scopeCommitted)}</div>
                </div>
                <div className="text-center pl-8">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Used</div>
                   <div className={`text-3xl font-black tracking-tight ${theme.subText}`}>{formatBytes(scopeUsed)}</div>
                   <div className="text-xs text-zinc-500 font-mono mt-1">{((scopeUsed/scopeCommitted)*100).toFixed(2)}% Utilized</div>
                </div>
             </div>
          </div>

          {/* --- SECTION B: NETWORK SPLIT (ONLY ON 'ALL') --- */}
          {activeTab === 'ALL' && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-center gap-6 animate-in fade-in slide-in-from-top-2">
               <div className="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
                     <circle cx="21" cy="21" r={r} fill="transparent" stroke="#27272a" strokeWidth="6" />
                     {/* Mainnet Slice */}
                     <circle cx="21" cy="21" r={r} fill="transparent" stroke="#22c55e" strokeWidth="6" 
                       strokeDasharray={`${(mainnetCommitted/(mainnetCommitted+devnetCommitted))*100} 100`} strokeDashoffset="0" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600"><Activity size={10} /></div>
               </div>
               <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-green-500 font-bold uppercase mb-0.5">Mainnet Share</div>
                    <div className="text-xs font-mono text-white">{formatBytes(mainnetCommitted)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-blue-500 font-bold uppercase mb-0.5">Devnet Share</div>
                    <div className="text-xs font-mono text-white">{formatBytes(devnetCommitted)}</div>
                  </div>
               </div>
            </div>
          )}

          {/* --- SECTION C: BENCHMARKS --- */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                   <TrendingUp size={10} /> Median Node
                </div>
                <div className="text-sm font-mono font-bold text-white">{formatBytes(scopeMedian)}</div>
             </div>
             <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                   <Activity size={10} /> Average Node
                </div>
                <div className="text-sm font-mono font-bold text-zinc-300">{formatBytes(scopeAvg)}</div>
             </div>
          </div>

          {/* --- SECTION D: WHALE WATCHER (TOP 10 DOMINANCE) --- */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
             <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                   <Users size={16} className={theme.main} />
                   <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top 10 Dominance</h4>
                      <div className="text-[9px] text-zinc-500">Wealth distribution in {activeTab.toLowerCase()}</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`text-xl font-black ${theme.main}`}>{whaleStats.whaleP.toFixed(2)}%</div>
                   <div className="text-[9px] text-zinc-500">Network Control</div>
                </div>
             </div>

             <div className="flex flex-col md:flex-row items-center gap-6">
                {/* WHALE CHART */}
                <div className="relative w-24 h-24 shrink-0">
                   <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
                      {/* Background */}
                      <circle cx="21" cy="21" r={r} fill="transparent" stroke="#18181b" strokeWidth="8" />
                      
                      {/* Top 10 (Theme Color) */}
                      <circle cx="21" cy="21" r={r} fill="transparent" 
                        stroke={activeTab === 'MAINNET' ? '#22c55e' : activeTab === 'DEVNET' ? '#3b82f6' : '#a855f7'} 
                        strokeWidth="8" 
                        strokeDasharray={`${whaleStats.whaleP} ${100 - whaleStats.whaleP}`} 
                        strokeDashoffset="0" 
                      />
                      
                      {/* Mid Tier (White) */}
                      <circle cx="21" cy="21" r={r} fill="transparent" stroke="#e4e4e7" strokeWidth="8" 
                        strokeDasharray={`${whaleStats.midP} ${100 - whaleStats.midP}`} 
                        strokeDashoffset={-whaleStats.whaleP} 
                      />
                      
                      {/* Rest (Zinc) */}
                      {whaleStats.restP > 0 && (
                        <circle cx="21" cy="21" r={r} fill="transparent" stroke="#3f3f46" strokeWidth="8" 
                           strokeDasharray={`${whaleStats.restP} ${100 - whaleStats.restP}`} 
                           strokeDashoffset={-(whaleStats.whaleP + whaleStats.midP)} 
                        />
                      )}
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center text-zinc-500"><PieChart size={16} /></div>
                </div>

                {/* WHALE LEGEND */}
                <div className="flex-1 w-full space-y-2">
                   <div className="text-[10px] text-zinc-400 mb-2">
                      Top 10 nodes control <span className="text-white font-bold font-mono">{formatBytes(whaleStats.top10Sum)}</span> combined.
                   </div>
                   
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold">
                         <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded ${activeTab === 'MAINNET' ? 'bg-green-500' : activeTab === 'DEVNET' ? 'bg-blue-500' : 'bg-purple-500'}`}></div> <span className="text-zinc-300">Top 10 Nodes</span></div>
                         <span className="font-mono text-zinc-500">{whaleStats.whaleP.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold">
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-zinc-200"></div> <span className="text-zinc-300">Nodes 11-100</span></div>
                         <span className="font-mono text-zinc-500">{whaleStats.midP.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold">
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-zinc-700"></div> <span className="text-zinc-300">Rest of Network</span></div>
                         <span className="font-mono text-zinc-500">{whaleStats.restP.toFixed(1)}%</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
