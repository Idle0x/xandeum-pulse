import { useState, useMemo } from 'react';
import { X, HeartPulse, Activity, Zap, Clock } from 'lucide-react';
import { Node } from '../../../types';
import { useNetworkHistory, HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
import { NetworkStatusChart } from './NetworkStatusChart';

interface VitalsModalProps {
  onClose: () => void;
  nodes: Node[];
  avgHealth: number;       
  consensusPercent: number; 
  consensusVersion: string; 
}

export const VitalsModal = ({ onClose, nodes }: VitalsModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // CHANGED: Initial state is now '30D'
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('30D');
  const { history: pulseHistory, loading: pulseLoading } = useNetworkHistory(timeRange);
  const { history: shadowHistory, loading: shadowLoading } = useNetworkHistory('30D');

  const healthKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_avg_health' : 
    activeTab === 'DEVNET' ? 'devnet_avg_health' : 
    'avg_health';

  const stabilityKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_avg_stability' : 
    activeTab === 'DEVNET' ? 'devnet_avg_stability' : 
    'avg_stability';

  const countKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_nodes' : 
    activeTab === 'DEVNET' ? 'devnet_nodes' : 
    'total_nodes';

  const healthData = shadowHistory.map(p => ({ date: p.date, value: p[healthKey] }));
  const stabilityData = shadowHistory.map(p => ({ date: p.date, value: p[stabilityKey] }));

  const data = useMemo(() => {
    const filtered = nodes.filter(n => activeTab === 'ALL' ? true : n.network === activeTab);
    const count = filtered.length || 1;

    const totalHealth = filtered.reduce((acc, n) => acc + (n.health || 0), 0);
    const avgHealthVal = (totalHealth / count).toFixed(1);

    const stableNodes = filtered.filter(n => (n.uptime || 0) > 86400).length;
    const stabilityPercent = ((stableNodes / count) * 100).toFixed(1);

    const excellent = filtered.filter(n => (n.health || 0) >= 90).length;
    const good = filtered.filter(n => (n.health || 0) >= 70 && (n.health || 0) < 90).length;
    const fair = filtered.filter(n => (n.health || 0) < 70).length;

    const ironclad = filtered.filter(n => (n.uptime || 0) > 604800).length;
    const volatile = count - stableNodes;

    return {
      count,
      avgHealth: avgHealthVal,
      stabilityPercent,
      spectrum: { excellent, good, fair },
      tiers: { ironclad, stable: stableNodes, volatile }
    };
  }, [nodes, activeTab]);

  const theme = {
    ALL: { text: 'text-purple-400', bg: 'bg-purple-500' },
    MAINNET: { text: 'text-green-500', bg: 'bg-green-500' },
    DEVNET: { text: 'text-blue-500', bg: 'bg-blue-500' },
  };
  const activeTheme = theme[activeTab];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-5 md:p-6 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border bg-opacity-10 border-zinc-800 transition-colors duration-500 ${activeTheme.bg}`}>
              <HeartPulse size={20} className={`transition-colors duration-500 ${activeTheme.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Network Vitals</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Real-time health & stability metrics</p>
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

          {/* ROW 1: COMPACT KPI CARDS */}
          <div className="grid grid-cols-2 gap-3">
             {/* CARD 1: AVG HEALTH */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative overflow-hidden group h-20 flex flex-col justify-between">
                <div className={`absolute top-0 left-0 w-0.5 h-full transition-colors duration-500 ${activeTheme.bg}`}></div>
                <div className="absolute inset-0 z-0 opacity-10 transition-opacity pointer-events-none px-2 mt-4">
                    <HistoryChart 
                        data={healthData} 
                        color={activeTab === 'MAINNET' ? '#22c55e' : activeTab === 'DEVNET' ? '#3b82f6' : '#a855f7'} 
                        loading={shadowLoading} 
                        height={60} 
                    />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><Activity size={10} /> Avg Health</div>
                   <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950/50 border border-white/5 transition-colors duration-500 ${activeTheme.text}`}>{activeTab}</span>
                </div>
                <div className="relative z-10 flex items-baseline gap-1">
                    <span className={`text-2xl font-black tracking-tighter tabular-nums transition-colors duration-500 ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`}>{data.avgHealth}</span>
                    <span className="text-[10px] text-zinc-600 font-bold">/ 100</span>
                </div>
             </div>

             {/* CARD 2: STABILITY */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative overflow-hidden h-20 flex flex-col justify-between">
                <div className={`absolute top-0 left-0 w-0.5 h-full transition-colors duration-500 ${activeTheme.bg}`}></div>
                <div className="absolute inset-0 z-0 opacity-10 transition-opacity pointer-events-none px-2 mt-4">
                    <HistoryChart 
                        data={stabilityData} 
                        color={'#eab308'} 
                        loading={shadowLoading} 
                        height={60} 
                    />
                </div>
                <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5 relative z-10"><Zap size={10} /> Stability</div>
                <div className="flex items-baseline gap-1 relative z-10">
                    <span className="text-2xl font-black tracking-tighter text-white tabular-nums">{data.stabilityPercent}%</span>
                    <span className="text-[9px] text-zinc-600 font-bold">Uptime</span>
                </div>
             </div>
          </div>

          {/* ROW 2: THE PULSE CHART */}
          <div className="h-60">
             <NetworkStatusChart 
                history={pulseHistory} 
                loading={pulseLoading} 
                timeRange={timeRange} 
                onTimeRangeChange={setTimeRange}
                healthKey={healthKey}
                stabilityKey={stabilityKey}
                countKey={countKey}
             />
          </div>

          {/* ROW 3: FOOTER DISTRIBUTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col justify-center h-20">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><HeartPulse size={10} /> Health Spectrum</div>
                    <div className="text-[8px] text-zinc-600 font-mono">Real-time Dist.</div>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex mb-2">
                   <div className="h-full bg-green-500 transition-all duration-700 ease-out" style={{ width: `${(data.spectrum.excellent / data.count) * 100}%` }}></div>
                   <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${(data.spectrum.good / data.count) * 100}%` }}></div>
                   <div className="h-full bg-yellow-500 transition-all duration-700 ease-out" style={{ width: `${(data.spectrum.fair / data.count) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400">
                   <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-500"/> {data.spectrum.excellent} Excellent</span>
                   <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-500"/> {data.spectrum.good} Good</span>
                   <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-yellow-500"/> {data.spectrum.fair} Fair</span>
                </div>
             </div>

             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 h-20 flex flex-col justify-center">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2 tracking-wider flex items-center gap-1.5"><Clock size={10} /> Uptime Tiers</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                   <div className="p-1 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-blue-400 tabular-nums">{data.tiers.ironclad}</div><div className="text-[6px] text-zinc-500 uppercase">Ironclad</div></div>
                   <div className="p-1 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-white tabular-nums">{data.tiers.stable}</div><div className="text-[6px] text-zinc-500 uppercase">Stable</div></div>
                   <div className="p-1 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-orange-400 tabular-nums">{data.tiers.volatile}</div><div className="text-[6px] text-zinc-500 uppercase">Volatile</div></div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
