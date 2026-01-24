import { useState, useMemo } from 'react';
import { X, Database, TrendingUp, TrendingDown, Users, PieChart, BarChart3, HardDrive, CloudLightning, Activity, Scale } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';
import { useNetworkHistory, HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
import { CapacityEvolutionChart } from './CapacityEvolutionChart';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  medianCommitted: number;
  totalCommitted: number;
  totalUsed: number;
}

export const CapacityModal = ({ onClose, nodes }: CapacityModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // 1. DATA FETCHING
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');
  const { history: evoHistory, loading: evoLoading } = useNetworkHistory(timeRange);

  const { history: trendHistory, growth, loading: trendLoading } = useNetworkHistory('30D');
  const isPositive = growth >= 0;

  // --- Dynamic Key Logic ---
  const capacityKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_capacity' : 
    activeTab === 'DEVNET' ? 'devnet_capacity' : 
    'total_capacity';

  const usedKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_used' : 
    activeTab === 'DEVNET' ? 'devnet_used' : 
    'total_used';

  const heroChartData = trendHistory.map(p => ({ 
    date: p.date, 
    value: p[capacityKey]
  }));

  // --- 2. DATA ENGINE ---
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

    // Aggregations for Mainnet/Devnet split
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
      top10Sum,
      remainderSum: tCommitted > top10Sum ? tCommitted - top10Sum : 0,
      mainnetSum, devnetSum,
      nodeCount: filteredNodes.length,
      globalShare: globalCommitted > 0 ? (tCommitted / globalCommitted) * 100 : 0,
      globalCommitted
    };
  }, [nodes, activeTab]);

  const usagePercent = (dashboardData.totalUsed / (dashboardData.totalCommitted || 1)) * 100;
  const usageBorderClass = usagePercent > 80 
     ? 'border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]' 
     : 'border-zinc-800';

  const themeColor = activeTab === 'MAINNET' ? 'text-green-500' : 'text-blue-500';
  const themeBg = activeTab === 'MAINNET' ? 'bg-green-500' : 'bg-blue-500';

  // --- 3. SVG HELPER (Pie Chart) ---
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
     if (activeTab === 'ALL') return <>Top 10 nodes <span className="text-zinc-300 font-bold">across network</span> control</>;
     if (activeTab === 'MAINNET') return <>Top 10 nodes <span className="text-green-500 font-bold">on Mainnet</span> control</>;
     return <>Top 10 nodes <span className="text-blue-500 font-bold">on Devnet</span> control</>;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-5 md:p-6 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border bg-opacity-10 border-zinc-800 ${activeTab === 'ALL' ? 'bg-purple-500 border-purple-500/20' : themeBg.replace('bg-', 'bg-opacity-10 bg-')}`}>
              <Database size={20} className={activeTab === 'ALL' ? 'text-purple-500' : themeColor} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Network Capacity</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Storage analytics & distribution</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex-1 md:flex-none flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                 {(['ALL', 'MAINNET', 'DEVNET'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 ${activeTab === tab ? (tab === 'ALL' ? 'bg-zinc-100 text-black shadow-sm' : tab === 'MAINNET' ? 'bg-green-500 text-black shadow-sm' : 'bg-blue-500 text-white shadow-sm') : 'text-zinc-500 hover:text-zinc-300'}`}>
                       {tab}
                    </button>
                 ))}
             </div>
             <button onClick={onClose} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20">
                <X size={16} />
             </button>
          </div>
        </div>

        <div className="space-y-3">

          {/* ROW 1: HERO METRICS */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative overflow-hidden group h-20 flex flex-col justify-between">
                 <div className={`absolute top-0 left-0 w-0.5 h-full ${activeTab === 'ALL' ? 'bg-purple-500' : themeBg}`}></div>
                 <div className="absolute inset-0 z-0 opacity-10 transition-opacity pointer-events-none px-2 mt-4">
                    <HistoryChart 
                        data={heroChartData} 
                        color={activeTab === 'ALL' ? '#a855f7' : activeTab === 'MAINNET' ? '#22c55e' : '#3b82f6'} 
                        loading={trendLoading} 
                        height={60} 
                    />
                 </div>
                 <div className="flex justify-between items-center relative z-10">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><HardDrive size={10} /> Committed</div>
                    {!trendLoading && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            {growth.toFixed(1)}%
                        </span>
                    )}
                 </div>
                 <div className={`relative z-10 text-2xl font-black tracking-tighter tabular-nums ${activeTab === 'ALL' ? 'text-white' : themeColor}`}>
                    {formatBytes(dashboardData.totalCommitted)}
                 </div>
             </div>

             <div className={`bg-zinc-900/50 border ${usageBorderClass} rounded-xl p-3 relative h-20 flex flex-col justify-between transition-colors duration-300`}>
                 <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><CloudLightning size={10} /> Load State</div>
                 <div>
                    <div className="text-2xl font-black text-blue-400 tracking-tighter tabular-nums">
                       {formatBytes(dashboardData.totalUsed)}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-bold mt-0.5">
                       {usagePercent.toFixed(2)}% Utilized
                    </div>
                 </div>
             </div>
          </div>

          {/* ROW 2: EVOLUTION CHART */}
          <div className="h-60">
             <CapacityEvolutionChart 
                history={evoHistory} 
                loading={evoLoading} 
                timeRange={timeRange} 
                onTimeRangeChange={setTimeRange}
                capacityKey={capacityKey}
                usedKey={usedKey}
             />
          </div>

          {/* ROW 3: INSIGHTS & DEMOGRAPHICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

             {/* LEFT BLOCK: DYNAMIC CONTEXT */}
             {activeTab === 'ALL' ? (
                // 🟣 GLOBAL VIEW: COMPOSITION (The "Map")
                <div className="flex flex-col gap-3">
                   <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex items-center gap-4 h-20">
                      <div className="relative w-12 h-12 shrink-0">
                         {renderPie([
                            { value: dashboardData.mainnetSum, color: '#22c55e' }, 
                            { value: dashboardData.devnetSum, color: '#3b82f6' }
                         ])}
                         <div className="absolute inset-0 flex items-center justify-center text-zinc-600"><PieChart size={12} /></div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                         <div>
                            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[8px] font-bold text-zinc-400 uppercase">Mainnet</span></div>
                            <div className="text-[9px] font-mono text-white leading-none">{formatBytes(dashboardData.mainnetSum)}</div>
                         </div>
                         <div>
                            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[8px] font-bold text-zinc-400 uppercase">Devnet</span></div>
                            <div className="text-[9px] font-mono text-white leading-none">{formatBytes(dashboardData.devnetSum)}</div>
                         </div>
                      </div>
                   </div>
                   {/* Benchmark Ticker */}
                   <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex items-center justify-between h-16">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><BarChart3 size={12}/> Benchmark</div>
                      <div className="flex items-center gap-4">
                          <div className="text-right">
                              <div className="text-[8px] text-zinc-500">Median</div>
                              <div className="text-xs font-mono font-bold text-white">{formatBytes(dashboardData.median)}</div>
                          </div>
                          <div className="w-px h-6 bg-zinc-800"></div>
                          <div className="text-right">
                              <div className="text-[8px] text-zinc-500">Average</div>
                              <div className="text-xs font-mono font-bold text-zinc-300">{formatBytes(dashboardData.average)}</div>
                          </div>
                      </div>
                   </div>
                </div>
             ) : (
                // 🟢 / 🔵 LOCAL VIEW: DEMOGRAPHICS (The "Vital Signs")
                <div className="flex flex-col gap-3">
                   {/* Node Count & Health Card */}
                   <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 h-[156px] flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className={`text-[9px] uppercase font-bold flex items-center gap-1.5 ${activeTab === 'MAINNET' ? 'text-green-500' : 'text-blue-500'}`}>
                               <Users size={12}/> Active Nodes
                            </div>
                            <div className="text-3xl font-black text-white tracking-tighter mt-1 tabular-nums">
                               {dashboardData.nodeCount}
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 justify-end"><Scale size={10}/> Distribution</div>
                            <div className="text-[9px] text-zinc-400 mt-1">Median vs Average</div>
                         </div>
                      </div>

                      {/* Distribution Health Bar */}
                      <div className="space-y-2">
                         <div className="flex items-center justify-between text-[9px]">
                            <span className="font-mono text-zinc-400">Median</span>
                            <span className="font-mono text-white font-bold">{formatBytes(dashboardData.median)}</span>
                         </div>
                         <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                             {/* Average Marker (Background) */}
                             <div className="absolute top-0 left-0 h-full bg-zinc-700 w-full opacity-30"></div> 
                             {/* Median Bar (Fill) */}
                             <div 
                                style={{ width: `${Math.min((dashboardData.median / (dashboardData.average || 1)) * 100, 100)}%` }} 
                                className={`h-full rounded-full ${activeTab === 'MAINNET' ? 'bg-green-500' : 'bg-blue-500'}`}
                             ></div>
                         </div>
                         <div className="flex items-center justify-between text-[9px]">
                            <span className="font-mono text-zinc-500">Average</span>
                            <span className="font-mono text-zinc-500 font-bold">{formatBytes(dashboardData.average)}</span>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* RIGHT BLOCK: WHALE DOMINANCE (Always Relevant) */}
             <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 relative flex items-center h-full">
                 <div className="flex flex-col justify-center gap-1 shrink-0 max-w-[60%]">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                       <Users size={10} className="text-yellow-500"/> Top 10 Dominance
                    </h4>
                    <span className="text-3xl font-black text-yellow-500 tracking-tight leading-none my-1">
                       {((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%
                    </span>
                    <div className="text-[9px] leading-tight text-zinc-400">
                       <span className="block mb-0.5">{getWhaleText()}</span>
                       <span className="text-white font-mono font-bold">{formatBytes(dashboardData.top10Sum)} storage.</span>
                    </div>
                 </div>

                 <div className="w-px h-12 bg-yellow-500/20 mx-4"></div>

                 <div className="flex-1 flex items-center justify-center h-full">
                    <div className="w-20 h-20 relative opacity-90">
                        {renderPie([
                            { value: dashboardData.top10Sum, color: '#eab308' }, 
                            { value: dashboardData.remainderSum, color: '#52525b' }   
                        ])}
                    </div>
                 </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};
