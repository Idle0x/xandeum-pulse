import { useState, useMemo } from 'react';
import { X, HeartPulse, Activity, Zap, Info, Clock } from 'lucide-react';
import { Node } from '../../../types';
import { useNetworkHistory, HistoryTimeRange } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
import { NetworkPulseChart } from './NetworkPulseChart';

interface VitalsModalProps {
  onClose: () => void;
  nodes: Node[];
  avgHealth: number;       
  consensusPercent: number; 
  consensusVersion: string; 
}

export const VitalsModal = ({ onClose, nodes, avgHealth }: VitalsModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  
  // 1. PULSE CHART STATE (The Big Chart)
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('7D');
  const { history: pulseHistory, loading: pulseLoading } = useNetworkHistory(timeRange);

  // 2. SHADOW LAYER STATE (Background Trends - Fixed to 30D)
  const { history: shadowHistory, loading: shadowLoading } = useNetworkHistory('30D');
  // Map raw history to the simple format required by the small shadow chart
  const healthData = shadowHistory.map(p => ({ date: p.date, value: p.avg_health }));

  // --- 3. DATA ENGINE (Client-side Aggregation) ---
  const data = useMemo(() => {
    const filtered = nodes.filter(n => activeTab === 'ALL' ? true : n.network === activeTab);
    const count = filtered.length || 1;

    // Calculate Real-time stats based on current node list
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

  // Theme Logic
  const theme = {
    ALL: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/20' },
    MAINNET: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/20' },
    DEVNET: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/20' },
  };
  const activeTheme = theme[activeTab];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border bg-opacity-10 ${activeTheme.bg} ${activeTheme.border}`}>
              <HeartPulse size={24} className={activeTheme.text} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Vitals</h3>
              <p className="text-xs text-zinc-500">Real-time health & stability metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-zinc-800">
             {(['ALL', 'MAINNET', 'DEVNET'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${activeTab === tab ? (tab === 'ALL' ? 'bg-zinc-100 text-black shadow-lg' : tab === 'MAINNET' ? 'bg-green-500 text-black shadow-lg' : 'bg-blue-500 text-white shadow-lg') : 'text-zinc-500 hover:text-zinc-300'}`}>
                   {tab}
                </button>
             ))}
             <button onClick={onClose} className="ml-2 p-1.5 rounded-full text-zinc-500 hover:text-white transition"><X size={16} /></button>
          </div>
        </div>

        <div className="space-y-4">

          {/* --- ROW 1: KPI CARDS --- */}
          <div className="grid grid-cols-2 gap-4">
             {/* CARD 1: AVG HEALTH */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden group h-32 flex flex-col justify-between">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                
                {/* Shadow Layer (Small EKG) */}
                <div className="absolute inset-0 z-0 opacity-20 transition-opacity pointer-events-none mt-6 px-2">
                    <HistoryChart 
                        data={healthData} 
                        color={activeTab === 'MAINNET' ? '#22c55e' : activeTab === 'DEVNET' ? '#3b82f6' : '#a855f7'} 
                        loading={shadowLoading} 
                        height={80} 
                    />
                </div>

                <div className="flex justify-between items-start relative z-10">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5"><Activity size={10} /> Avg Health</div>
                   <span className={`text-[9px] font-mono font-bold ${activeTheme.text}`}>{activeTab}</span>
                </div>
                <div className="relative z-10"><span className={`text-4xl font-black tracking-tight ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`}>{data.avgHealth}</span><span className="text-xs text-zinc-600 font-bold ml-1">/ 100</span></div>
             </div>

             {/* CARD 2: STABILITY */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden h-32 flex flex-col justify-between">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="flex justify-between items-start mb-2"><div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5"><Zap size={10} /> Stability</div></div>
                <div><span className="text-4xl font-black tracking-tight text-white">{data.stabilityPercent}%</span><div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Stable Nodes</div></div>
             </div>
          </div>

          {/* --- ROW 2: THE PULSE CHART (New Addition) --- */}
          <div className="h-64">
             <NetworkPulseChart 
                history={pulseHistory} 
                loading={pulseLoading} 
                timeRange={timeRange} 
                onTimeRangeChange={setTimeRange} 
             />
          </div>

          {/* --- ROW 3: FOOTER DISTRIBUTIONS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* Spectrum Bar */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-3"><div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><HeartPulse size={10} /> Health Spectrum</div></div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex mb-3">
                   <div className="h-full bg-green-500" style={{ width: `${(data.spectrum.excellent / data.count) * 100}%` }}></div>
                   <div className="h-full bg-blue-500" style={{ width: `${(data.spectrum.good / data.count) * 100}%` }}></div>
                   <div className="h-full bg-yellow-500" style={{ width: `${(data.spectrum.fair / data.count) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400">
                   <span>Exc: {data.spectrum.excellent}</span><span>Good: {data.spectrum.good}</span><span>Fair: {data.spectrum.fair}</span>
                </div>
             </div>

             {/* Tiers Grid */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-1.5"><Clock size={10} /> Uptime Tiers</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                   <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-blue-400">{data.tiers.ironclad}</div><div className="text-[6px] text-zinc-500 uppercase">Ironclad</div></div>
                   <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-white">{data.tiers.stable}</div><div className="text-[6px] text-zinc-500 uppercase">Stable</div></div>
                   <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50"><div className="text-[10px] font-bold text-orange-400">{data.tiers.volatile}</div><div className="text-[6px] text-zinc-500 uppercase">Volatile</div></div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
