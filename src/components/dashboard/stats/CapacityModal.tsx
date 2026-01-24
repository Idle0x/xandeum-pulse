import { useState, useMemo } from 'react';
import { X, Database, TrendingUp, TrendingDown, Users, PieChart as PieIcon, BarChart3, HardDrive, CloudLightning, Scale } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';
import { useNetworkHistory, HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
import { CapacityEvolutionChart } from './CapacityEvolutionChart';

interface CapacityModalProps {
  onClose: () => void;
  nodes: Node[];
  // Added these to match the props passed from index.tsx and fix the build error
  medianCommitted: number;
  totalCommitted: number;
  totalUsed: number;
}

export const CapacityModal = ({ 
  onClose, 
  nodes, 
  medianCommitted: globalMedian, // Renamed to avoid collision with local memo
  totalCommitted: globalCommitted, 
  totalUsed: globalUsed 
}: CapacityModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');

  const { history: evoHistory, loading: evoLoading } = useNetworkHistory(timeRange);
  const { history: trendHistory, growth, loading: trendLoading } = useNetworkHistory('30D');
  
  const capacityKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_capacity' : activeTab === 'DEVNET' ? 'devnet_capacity' : 'total_capacity';
  const usedKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_used' : activeTab === 'DEVNET' ? 'devnet_used' : 'total_used';

  const heroChartData = trendHistory.map(p => ({ date: p.date, value: p[capacityKey] }));

  const dashboardData = useMemo(() => {
    const filteredNodes = nodes.filter(n => activeTab === 'ALL' ? true : n.network === activeTab);
    const tCommitted = filteredNodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const tUsed = filteredNodes.reduce((acc, n) => acc + (n.storage_used || 0), 0);

    const sorted = [...filteredNodes].sort((a, b) => (a.storage_committed || 0) - (b.storage_committed || 0));
    const median = sorted.length > 0 ? (sorted[Math.floor(sorted.length / 2)].storage_committed || 0) : 0;
    const average = tCommitted / (filteredNodes.length || 1);

    const descNodes = [...filteredNodes].sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0));
    const top10Sum = descNodes.slice(0, 10).reduce((acc, n) => acc + (n.storage_committed || 0), 0);

    let mainnetSum = 0; 
    let devnetSum = 0;
    nodes.forEach(n => {
      if (n.network === 'MAINNET') mainnetSum += (n.storage_committed || 0);
      if (n.network === 'DEVNET') devnetSum += (n.storage_committed || 0);
    });

    return {
      totalCommitted: tCommitted, 
      totalUsed: tUsed, 
      nodeCount: filteredNodes.length,
      median, 
      average, 
      top10Sum, 
      mainnetSum, 
      devnetSum,
      remainderSum: tCommitted > top10Sum ? tCommitted - top10Sum : 0
    };
  }, [nodes, activeTab]);

  const themeColor = activeTab === 'MAINNET' ? 'text-green-500' : activeTab === 'DEVNET' ? 'text-blue-500' : 'text-purple-500';
  const themeBg = activeTab === 'MAINNET' ? 'bg-green-500' : activeTab === 'DEVNET' ? 'bg-blue-500' : 'bg-purple-500';

  const renderPie = (slices: { value: number; color: string; muted?: boolean }[]) => {
    const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
    let cumulativePercent = 0;
    return (
      <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#18181b" strokeWidth="6" />
        {slices.map((slice, i) => {
          const percent = (slice.value / total) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = -cumulativePercent;
          cumulativePercent += percent;
          return (
            <circle
              key={i} cx="21" cy="21" r="15.9155" fill="transparent"
              stroke={slice.muted ? '#27272a' : slice.color}
              strokeWidth="6" strokeDasharray={dashArray} strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-in-out"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border bg-opacity-10 border-zinc-800 transition-all duration-500 ${themeBg}`}>
              <Database size={20} className={`transition-colors duration-500 ${themeColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Network Capacity</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Live Infrastructure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {(['ALL', 'MAINNET', 'DEVNET'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 ${activeTab === tab ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 mt-6 px-2">
                <HistoryChart 
                  data={heroChartData} 
                  color={activeTab === 'ALL' ? '#a855f7' : activeTab === 'MAINNET' ? '#22c55e' : '#3b82f6'} 
                  loading={trendLoading} 
                  height={60} 
                />
              </div>
              <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5 relative z-10"><HardDrive size={10}/> Committed</span>
              <div className={`text-3xl font-black tabular-nums tracking-tighter transition-colors duration-500 ${themeColor}`}>
                {formatBytes(dashboardData.totalCommitted)}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 flex flex-col justify-between">
              <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><CloudLightning size={10}/> Load State</span>
              <div className="text-3xl font-black text-blue-400 tabular-nums tracking-tighter">
                {formatBytes(dashboardData.totalUsed)}
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><Users size={12} className={themeColor}/> Active Nodes</span>
                  <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{dashboardData.nodeCount}</span>
                </div>
                <div className="w-16 h-16 relative">
                  {renderPie([
                    { value: dashboardData.mainnetSum, color: '#22c55e', muted: activeTab === 'DEVNET' },
                    { value: dashboardData.devnetSum, color: '#3b82f6', muted: activeTab === 'MAINNET' }
                  ])}
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-700"><PieIcon size={14}/></div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                <div className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Scale size={12}/> Distribution</div>
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">Median</span>
                      <span className="text-white font-bold">{formatBytes(dashboardData.median)}</span>
                   </div>
                   <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                      <div 
                        style={{ width: `${Math.min((dashboardData.median / (dashboardData.average || 1)) * 100, 100)}%` }} 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${themeBg}`}
                      />
                   </div>
                   <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">Average</span>
                      <span className="text-zinc-400">{formatBytes(dashboardData.average)}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1 max-w-[60%]">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2"><Users size={12} className="text-yellow-500"/> Top 10 Dominance</h4>
                <div className="text-4xl font-black text-yellow-500 tracking-tighter my-1">
                  {((dashboardData.top10Sum / (dashboardData.totalCommitted || 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[9px] leading-relaxed text-zinc-500 uppercase font-bold">
                  Top 10 controls <span className="text-white">{formatBytes(dashboardData.top10Sum)}</span>
                </div>
              </div>
              <div className="w-24 h-24 relative">
                {renderPie([
                  { value: dashboardData.top10Sum, color: '#eab308' }, 
                  { value: dashboardData.remainderSum, color: '#27272a' }
                ])}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
