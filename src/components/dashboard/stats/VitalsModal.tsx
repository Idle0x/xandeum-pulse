import { useState, useMemo } from 'react';
import { X, Activity, Zap, Server, HeartPulse } from 'lucide-react';
import { Node } from '../../../types';
import { useNetworkHistory, HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
// FIX: Imported the renamed component
import { NetworkStatusChart } from './NetworkStatusChart'; 

interface VitalsModalProps {
  onClose: () => void;
  nodes: Node[];
  avgHealth: number;
}

export const VitalsModal = ({ onClose, nodes }: VitalsModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // 1. DATA FETCHING
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');
  const { history: vitalsHistory, loading: vitalsLoading } = useNetworkHistory(timeRange);
  
  // Sparkline data (30D trend)
  const { history: trendHistory, loading: trendLoading } = useNetworkHistory('30D');

  // --- Dynamic Key Logic ---
  // We determine which keys to pass to the chart based on the active tab
  const healthKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_avg_health' : 
    activeTab === 'DEVNET' ? 'devnet_avg_health' : 
    'avg_health';

  const stabilityKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_stability_score' : 
    activeTab === 'DEVNET' ? 'devnet_stability_score' : 
    'stability_score';

  const countKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_node_count' : 
    activeTab === 'DEVNET' ? 'devnet_node_count' : 
    'node_count';

  // Sparkline Data mapping
  const sparkData = trendHistory.map(p => ({ 
    date: p.date, 
    value: p[healthKey] 
  }));

  // --- 2. DATA ENGINE ---
  const data = useMemo(() => {
    const filteredNodes = nodes.filter(n => 
      activeTab === 'ALL' ? true : n.network === activeTab
    );
    const count = filteredNodes.length || 1;

    // Calculate current stats from live nodes
    const totalHealth = filteredNodes.reduce((acc, n) => acc + (n.health_score || 0), 0);
    const avgHealth = (totalHealth / count).toFixed(1);

    // Mock stability calculation (replace with real property if available on Node type)
    // Assuming stability is roughly correlated to health for this dashboard view
    const totalStability = filteredNodes.reduce((acc, n) => acc + ((n.health_score || 0) * 0.95), 0);
    const avgStability = (totalStability / count).toFixed(1);

    return {
      count,
      avgHealth,
      avgStability,
    };
  }, [nodes, activeTab]);

  const isHealthy = parseFloat(data.avgHealth) > 80;

  // Theme Helpers
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
            <div className={`p-2.5 rounded-lg border bg-opacity-10 border-zinc-800 ${activeTheme.bg}`}>
              <HeartPulse size={20} className={activeTheme.text} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Network Vitals</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Health, stability & node counts</p>
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
          <div className="grid grid-cols-3 gap-3">
             
             {/* CARD 1: AVG HEALTH */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative overflow-hidden group h-20 flex flex-col justify-between">
                <div className="absolute inset-0 z-0 opacity-10 transition-opacity pointer-events-none px-2 mt-4">
                    <HistoryChart 
                        data={sparkData} 
                        color={isHealthy ? '#22c55e' : '#eab308'} 
                        loading={trendLoading} 
                        height={60} 
                    />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><Activity size={10} /> Avg Health</div>
                </div>
                <div className="relative z-10 flex items-baseline gap-1">
                   <span className={`text-2xl font-black tracking-tighter tabular-nums ${isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>{data.avgHealth}%</span>
                </div>
             </div>

             {/* CARD 2: AVG STABILITY */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 h-20 flex flex-col justify-between">
                <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><Zap size={10} /> Stability</div>
                <div className="text-2xl font-black tracking-tighter text-yellow-400 tabular-nums">
                   {data.avgStability}%
                </div>
             </div>

             {/* CARD 3: ACTIVE NODES */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 h-20 flex flex-col justify-between">
                 <div className="flex justify-between items-center">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><Server size={10} /> Active Nodes</div>
                    <div className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950/50 border border-white/5 ${activeTheme.text}`}>{activeTab}</div>
                 </div>
                 <div className="text-2xl font-black tracking-tighter text-blue-400 tabular-nums">
                    {data.count}
                 </div>
             </div>
          </div>

          {/* ROW 2: NETWORK STATUS CHART (The Renamed Component) */}
          <div className="h-72">
             <NetworkStatusChart 
                history={vitalsHistory} 
                loading={vitalsLoading} 
                timeRange={timeRange} 
                onTimeRangeChange={setTimeRange}
                healthKey={healthKey}
                stabilityKey={stabilityKey}
                countKey={countKey}
             />
          </div>

        </div>
      </div>
    </div>
  );
};
