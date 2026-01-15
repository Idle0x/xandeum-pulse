import { useState, useMemo } from 'react';
import { X, Database, TrendingUp, Users, PieChart, Globe, Activity } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
}

export const CapacityModal = ({ onClose, nodes }: CapacityModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // --- 1. DATA ENGINE ---
  // We calculate everything on the fly based on the active tab
  const dashboardData = useMemo(() => {
    // A. Filter the dataset
    const filteredNodes = nodes.filter(n => 
      activeTab === 'ALL' ? true : n.network === activeTab
    );

    // B. Basic Aggregates
    const totalCommitted = filteredNodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const totalUsed = filteredNodes.reduce((acc, n) => acc + (n.storage_used || 0), 0);
    const count = filteredNodes.length || 1;
    const average = totalCommitted / count;

    // C. Median Calculation
    const sortedByStorage = [...filteredNodes].sort((a, b) => (a.storage_committed || 0) - (b.storage_committed || 0));
    const mid = Math.floor(sortedByStorage.length / 2);
    const median = sortedByStorage.length > 0 ? (sortedByStorage[mid].storage_committed || 0) : 0;

    // D. Whale Watcher (Top 10 vs 11-100 vs Rest)
    // Sort descending for whale calc
    const descNodes = [...filteredNodes].sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0));
    
    const top10 = descNodes.slice(0, 10);
    const top10Sum = top10.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    
    const midTier = descNodes.slice(10, 100);
    const midTierSum = midTier.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    
    const restSum = totalCommitted - (top10Sum + midTierSum);

    // E. Network Split (Only relevant for ALL tab)
    let mainnetSum = 0;
    let devnetSum = 0;
    if (activeTab === 'ALL') {
      filteredNodes.forEach(n => {
        if (n.network === 'MAINNET') mainnetSum += (n.storage_committed || 0);
        if (n.network === 'DEVNET') devnetSum += (n.storage_committed || 0);
      });
    }

    return {
      totalCommitted,
      totalUsed,
      median,
      average,
      top10Sum,
      midTierSum,
      restSum,
      mainnetSum,
      devnetSum,
      nodeCount: filteredNodes.length
    };
  }, [nodes, activeTab]);

  // --- 2. VISUALIZATION HELPERS ---
  
  // Helper for SVG Pie Charts
  const renderPie = (slices: { value: number; color: string }[], size = 64) => {
    const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
    let cumulativePercent = 0;
    const r = 15.9155; // Radius for circumference ~100

    return (
      <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
        <circle cx="21" cy="21" r={r} fill="transparent" stroke="#27272a" strokeWidth="6" />
        {slices.map((slice, i) => {
          const percent = (slice.value / total) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = -cumulativePercent;
          cumulativePercent += percent;
          return (
            <circle
              key={i}
              cx="21"
              cy="21"
              r={r}
              fill="transparent"
              stroke={slice.color}
              strokeWidth="6"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
    );
  };

  // Theme Colors
  const theme = {
    ALL: { text: 'text-purple-400', border: 'border-white', bg: 'bg-zinc-100', icon: Globe },
    MAINNET: { text: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500', icon: Activity },
    DEVNET: { text: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-500', icon: Activity },
  };
  const activeTheme = theme[activeTab];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER & TOGGLES --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border bg-opacity-10 ${activeTab === 'ALL' ? 'bg-purple-500 border-purple-500/20' : activeTab === 'MAINNET' ? 'bg-green-500 border-green-500/20' : 'bg-blue-500 border-blue-500/20'}`}>
              <Database size={24} className={activeTab === 'ALL' ? 'text-purple-500' : activeTab === 'MAINNET' ? 'text-green-500' : 'text-blue-500'} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Capacity</h3>
              <p className="text-xs text-zinc-500">Storage analytics & distribution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-zinc-800">
             {(['ALL', 'MAINNET', 'DEVNET'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                     activeTab === tab 
                        ? (tab === 'ALL' ? 'bg-zinc-100 text-black shadow-lg' : tab === 'MAINNET' ? 'bg-green-500 text-black shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                        : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                   {tab}
                </button>
             ))}
             <button onClick={onClose} className="ml-2 p-1.5 rounded-full text-zinc-500 hover:text-white transition">
                <X size={16} />
             </button>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* --- 1. HERO SECTION (Dynamic) --- */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${activeTab === 'ALL' ? 'bg-purple-500' : activeTab === 'MAINNET' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
             <div className="grid grid-cols-2 gap-8 divide-x divide-zinc-800">
                <div className="text-center">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Committed</div>
                   <div className={`text-2xl md:text-4xl font-black tracking-tight ${activeTab === 'ALL' ? 'text-purple-400' : activeTab === 'MAINNET' ? 'text-white' : 'text-white'}`}>
                      {formatBytes(dashboardData.totalCommitted)}
                   </div>
                </div>
                <div className="text-center pl-8">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Used</div>
                   <div className="text-2xl md:text-4xl font-black text-blue-400 tracking-tight">
                      {formatBytes(dashboardData.totalUsed)}
                   </div>
                   <div className="text-xs text-zinc-600 font-mono mt-1">
                      {((dashboardData.totalUsed / (dashboardData.totalCommitted || 1)) * 100).toFixed(2)}% Utilized
                   </div>
                </div>
             </div>
          </div>

          {/* --- 2. NETWORK SPLIT (ALL TAB ONLY) --- */}
          {activeTab === 'ALL' && (
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-center gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="relative w-16 h-16 shrink-0">
                   {renderPie([
                      { value: dashboardData.mainnetSum, color: '#22c55e' }, // Green
                      { value: dashboardData.devnetSum, color: '#3b82f6' }   // Blue
                   ])}
                   <div className="absolute inset-0 flex items-center justify-center text-zinc-600"><PieChart size={12} /></div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                   <div>
                      <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[10px] font-bold text-zinc-300 uppercase">Mainnet</span></div>
                      <div className="text-sm font-mono text-white">{formatBytes(dashboardData.mainnetSum)}</div>
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-zinc-300 uppercase">Devnet</span></div>
                      <div className="text-sm font-mono text-white">{formatBytes(dashboardData.devnetSum)}</div>
                   </div>
                </div>
             </div>
          )}

          {/* --- 3. BENCHMARKS (Dynamic Context) --- */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <TrendingUp size={10} /> Median Node
                </div>
                <div className="text-lg font-mono font-bold text-white">{formatBytes(dashboardData.median)}</div>
             </div>
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <Activity size={10} /> Average Node
                </div>
                <div className="text-lg font-mono font-bold text-zinc-300">{formatBytes(dashboardData.average)}</div>
             </div>
          </div>

          {/* --- 4. WHALE WATCHER (Dynamic Context) --- */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 md:p-5 relative overflow-hidden">
             <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                
                {/* Chart Section */}
                <div className="relative w-24 h-24 shrink-0">
                   {renderPie([
                      { value: dashboardData.top10Sum, color: '#eab308' },  // Yellow (Top 10)
                      { value: dashboardData.midTierSum, color: '#a1a1aa' }, // Zinc-400 (11-100)
                      { value: dashboardData.restSum, color: '#3f3f46' }    // Zinc-700 (Rest)
                   ])}
                   <div className="absolute inset-0 flex items-center justify-center text-yellow-500"><Users size={16} /></div>
                </div>

                {/* Info Section */}
                <div className="flex-1 w-full">
                   <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Top 10 Dominance</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-bold border border-yellow-500/30">
                         {((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(2)}%
                      </span>
                   </div>
                   
                   <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      The top 10 nodes on <span className={activeTab === 'ALL' ? 'text-purple-400 font-bold' : activeTab === 'MAINNET' ? 'text-green-500 font-bold' : 'text-blue-500 font-bold'}>{activeTab}</span> control <span className="text-white font-mono font-bold">{formatBytes(dashboardData.top10Sum)}</span> combined.
                   </p>

                   {/* Legend */}
                   <div className="grid grid-cols-3 gap-2 border-t border-yellow-500/10 pt-3">
                      <div>
                         <div className="flex items-center gap-1 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div><span className="text-[9px] font-bold text-zinc-500 uppercase">Top 10</span></div>
                         <div className="text-[10px] font-mono text-zinc-300">{((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                         <div className="flex items-center gap-1 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div><span className="text-[9px] font-bold text-zinc-500 uppercase">11-100</span></div>
                         <div className="text-[10px] font-mono text-zinc-300">{((dashboardData.midTierSum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                         <div className="flex items-center gap-1 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div><span className="text-[9px] font-bold text-zinc-500 uppercase">Rest</span></div>
                         <div className="text-[10px] font-mono text-zinc-300">{((dashboardData.restSum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
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
