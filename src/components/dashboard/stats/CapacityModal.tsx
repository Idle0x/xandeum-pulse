import { useState, useMemo } from 'react';
import { X, Database, TrendingUp, TrendingDown, Users, PieChart, Globe } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';
import { useNetworkHistory } from '../../../hooks/useNetworkHistory';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  medianCommitted: number;
  totalCommitted: number;
  totalUsed: number;
}

export const CapacityModal = ({ onClose, nodes, medianCommitted, totalCommitted, totalUsed }: CapacityModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // NEW: Shadow Layer Fetch (30-day Growth)
  const { growth, loading: historyLoading } = useNetworkHistory('total_capacity');
  const isPositive = growth >= 0;

  // --- 1. DATA ENGINE ---
  const dashboardData = useMemo(() => {
    const globalCommitted = nodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const filteredNodes = nodes.filter(n => activeTab === 'ALL' ? true : n.network === activeTab);
    const tCommitted = filteredNodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const tUsed = filteredNodes.reduce((acc, n) => acc + (n.storage_used || 0), 0);
    const count = filteredNodes.length || 1;
    const average = tCommitted / count;

    const sortedByStorage = [...filteredNodes].sort((a, b) => (a.storage_committed || 0) - (b.storage_committed || 0));
    const mid = Math.floor(sortedByStorage.length / 2);
    const median = sortedByStorage.length > 0 ? (sortedByStorage[mid].storage_committed || 0) : 0;

    const descNodes = [...filteredNodes].sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0));
    const top10 = descNodes.slice(0, 10);
    const top10Sum = top10.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const midTier = descNodes.slice(10, 100);
    const midTierSum = midTier.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const restSum = tCommitted > (top10Sum + midTierSum) ? tCommitted - (top10Sum + midTierSum) : 0;

    let mainnetSum = 0;
    let devnetSum = 0;
    nodes.forEach(n => {
      if (n.network === 'MAINNET') mainnetSum += (n.storage_committed || 0);
      if (n.network === 'DEVNET') devnetSum += (n.storage_committed || 0);
    });

    return {
      totalCommitted: tCommitted, 
      totalUsed: tUsed, 
      median, 
      average,
      top10Sum, midTierSum, restSum,
      mainnetSum, devnetSum,
      nodeCount: filteredNodes.length,
      globalShare: globalCommitted > 0 ? (tCommitted / globalCommitted) * 100 : 0
    };
  }, [nodes, activeTab]);

  // --- 2. SVG HELPER ---
  const renderPie = (slices: { value: number; color: string }[]) => {
    const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
    let cumulativePercent = 0;
    const r = 15.9155; 

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
              cx="21" cy="21" r={r} fill="transparent" stroke={slice.color} strokeWidth="6"
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
    );
  };

  const getWhaleText = () => {
     if (activeTab === 'ALL') return <>The top 10 nodes <span className="text-zinc-300 font-bold">across all networks</span> control</>;
     if (activeTab === 'MAINNET') return <>The top 10 nodes <span className="text-green-500 font-bold">on Mainnet</span> control</>;
     return <>The top 10 nodes <span className="text-blue-500 font-bold">on Devnet</span> control</>;
  };

  const themeColor = activeTab === 'MAINNET' ? 'text-green-500' : 'text-blue-500';
  const themeBg = activeTab === 'MAINNET' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* HEADER (FIXED: Toggles Restored) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border bg-opacity-10 ${activeTab === 'ALL' ? 'bg-purple-500 border-purple-500/20' : activeTab === 'MAINNET' ? 'bg-green-500 border-green-500/20' : 'bg-blue-500 border-blue-500/20'}`}>
              <Database size={24} className={activeTab === 'ALL' ? 'text-purple-500' : themeColor} />
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

        <div className="space-y-3 md:space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${activeTab === 'ALL' ? 'bg-purple-500' : themeBg}`}></div>
             <div className="grid grid-cols-2 gap-8 divide-x divide-zinc-800">
                <div className="text-center">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Committed</div>
                   <div className={`text-2xl md:text-3xl font-black tracking-tight ${activeTab === 'ALL' ? 'text-purple-400' : 'text-white'}`}>
                      {formatBytes(dashboardData.totalCommitted)}
                   </div>
                </div>
                <div className="text-center pl-8">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{activeTab} Used</div>
                   <div className="text-2xl md:text-3xl font-black text-blue-400 tracking-tight">
                      {formatBytes(dashboardData.totalUsed)}
                   </div>
                   <div className="text-[10px] text-zinc-600 font-mono mt-1">
                      {((dashboardData.totalUsed / (dashboardData.totalCommitted || 1)) * 100).toFixed(2)}% Utilized
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {activeTab === 'ALL' ? (
                 <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0">
                       {renderPie([
                          { value: dashboardData.mainnetSum, color: '#22c55e' }, 
                          { value: dashboardData.devnetSum, color: '#3b82f6' }
                       ])}
                       <div className="absolute inset-0 flex items-center justify-center text-zinc-600"><PieChart size={12} /></div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                       <div>
                          <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[9px] font-bold text-zinc-400 uppercase">Mainnet</span></div>
                          <div className="text-[10px] font-mono text-white leading-none">{formatBytes(dashboardData.mainnetSum)}</div>
                       </div>
                       <div>
                          <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[9px] font-bold text-zinc-400 uppercase">Devnet</span></div>
                          <div className="text-[10px] font-mono text-white leading-none">{formatBytes(dashboardData.devnetSum)}</div>
                       </div>
                    </div>
                 </div>
             ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><Globe size={10} /> Network Footprint</div>
                        <span className={`text-[9px] font-mono font-bold ${themeColor}`}>{dashboardData.globalShare.toFixed(1)}% Share</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-bold text-white tracking-tight">{dashboardData.nodeCount.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Active Nodes</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${themeBg}`} style={{ width: `${dashboardData.globalShare}%` }}></div>
                    </div>
                </div>
             )}

             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-1.5">
                   <TrendingUp size={10} /> Network Benchmark
                </div>
                
                {/* GROWTH BADGE */}
                {!historyLoading && (
                   <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(growth).toFixed(1)}% (30d)
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <div className="text-[9px] text-zinc-500 mb-0.5">Median Node</div>
                      <div className="text-sm font-mono font-bold text-white">{formatBytes(dashboardData.median)}</div>
                   </div>
                   <div>
                      <div className="text-[9px] text-zinc-500 mb-0.5">Average Node</div>
                      <div className="text-sm font-mono font-bold text-zinc-300">{formatBytes(dashboardData.average)}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 md:p-5 relative">
             <div className="flex justify-between items-start mb-4">
                <div className="max-w-[65%] pr-4">
                   <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top 10 Dominance</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-bold border border-yellow-500/30">
                         {((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(2)}%
                      </span>
                   </div>
                   <p className="text-[10px] text-zinc-400 leading-relaxed mb-0">
                      {getWhaleText()} <span className="text-white font-mono font-bold">{formatBytes(dashboardData.top10Sum)}</span> combined.
                   </p>
                </div>
                <div className="w-16 h-16 shrink-0 relative">
                   {renderPie([
                      { value: dashboardData.top10Sum, color: '#eab308' }, 
                      { value: dashboardData.midTierSum, color: '#06b6d4' },
                      { value: dashboardData.restSum, color: '#a1a1aa' }   
                   ])}
                   <div className="absolute inset-0 flex items-center justify-center text-yellow-500"><Users size={12} /></div>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-2 border-t border-yellow-500/10 pt-3">
                <div>
                   <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div><span className="text-[8px] font-bold text-zinc-500 uppercase">Top 10</span></div>
                   <div className="text-[9px] font-mono text-zinc-300">{((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
                </div>
                <div>
                   <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div><span className="text-[8px] font-bold text-zinc-500 uppercase">11-100</span></div>
                   <div className="text-[9px] font-mono text-zinc-300">{((dashboardData.midTierSum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
                </div>
                <div>
                   <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div><span className="text-[8px] font-bold text-zinc-500 uppercase">Rest</span></div>
                   <div className="text-[9px] font-mono text-zinc-300">{((dashboardData.restSum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
