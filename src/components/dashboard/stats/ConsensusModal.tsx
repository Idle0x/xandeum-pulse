import { useState, useMemo } from 'react';
import { X, Server, GitBranch, CheckCircle, AlertCircle, ArrowUpCircle, Activity, ShieldCheck } from 'lucide-react';
import { Node } from '../../../types';
import { compareVersions } from '../../../utils/nodeHelpers';
import { useNetworkHistory, HistoryTimeRange, NetworkHistoryPoint } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';
import { ConsensusConvergenceChart } from './ConsensusConvergenceChart';

interface ConsensusModalProps {
  onClose: () => void;
  nodes: Node[];
  mostCommonVersion: string;
}

export const ConsensusModal = ({ onClose, nodes }: ConsensusModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // 1. DATA FETCHING
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');
  const { history: convHistory, loading: convLoading } = useNetworkHistory(timeRange);
  const { history: trendHistory, loading: trendLoading } = useNetworkHistory('30D');

  // --- Dynamic Key Logic ---
  const consensusKey: keyof NetworkHistoryPoint = 
    activeTab === 'MAINNET' ? 'mainnet_consensus_score' : 
    activeTab === 'DEVNET' ? 'devnet_consensus_score' : 
    'consensus_score';

  const sparkData = trendHistory.map(p => ({ 
    date: p.date, 
    value: p[consensusKey] 
  }));

  // --- 2. DATA ENGINE ---
  const data = useMemo(() => {
    const filteredNodes = nodes.filter(n => 
      activeTab === 'ALL' ? true : n.network === activeTab
    );
    const count = filteredNodes.length || 1;

    const versionMap: Record<string, number> = {};
    filteredNodes.forEach(n => {
      const v = n.version || 'Unknown';
      versionMap[v] = (versionMap[v] || 0) + 1;
    });

    const sortedVersions = Object.entries(versionMap).sort((a, b) => b[1] - a[1]);
    const consensusVer = sortedVersions[0]?.[0] || '0.0.0';
    const consensusCount = sortedVersions[0]?.[1] || 0;
    const agreementScore = ((consensusCount / count) * 100).toFixed(1);

    let lagging = 0;
    let target = 0;
    let leading = 0;

    filteredNodes.forEach(n => {
      const ver = n.version || '0.0.0';
      if (ver === consensusVer) {
        target++;
      } else {
        const cmp = compareVersions(ver, consensusVer);
        if (cmp < 0) lagging++;
        if (cmp > 0) leading++;
      }
    });

    return {
      count,
      consensusVer,
      agreementScore,
      sortedVersions,
      buckets: { lagging, target, leading }
    };
  }, [nodes, activeTab]);

  const isStrong = parseFloat(data.agreementScore) > 66;
  const statusBorder = isStrong 
     ? 'border-green-500/20 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]' 
     : 'border-yellow-500/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.1)]';

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
              <Server size={20} className={activeTheme.text} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Consensus State</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Network alignment & version control</p>
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
             <div className={`bg-zinc-900/50 border ${statusBorder} rounded-xl p-3 relative flex flex-col justify-between h-20 transition-all duration-300`}>
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><GitBranch size={10} /> Target Version</div>
                   <div className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950/50 border border-white/5 ${activeTheme.text}`}>{activeTab}</div>
                </div>
                <div className="flex items-baseline gap-1.5">
                   <div className={`text-2xl font-black tracking-tighter truncate tabular-nums ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`} title={data.consensusVer}>
                      {data.consensusVer}
                   </div>
                   <div className="text-[9px] text-zinc-600 font-bold uppercase">Active</div>
                </div>
             </div>

             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative overflow-hidden group h-20 flex flex-col justify-between">
                <div className="absolute inset-0 z-0 opacity-10 transition-opacity pointer-events-none px-2 mt-4">
                    <HistoryChart 
                        data={sparkData} 
                        color={isStrong ? '#22c55e' : '#eab308'} 
                        loading={trendLoading} 
                        height={60} 
                    />
                </div>
                <div className="flex justify-between items-center mb-1 relative z-10">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><ShieldCheck size={10} /> Unity Score</div>
                   <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      isStrong ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                   }`}>
                      {isStrong ? 'STRONG' : 'FRACTURED'}
                   </div>
                </div>
                <div className="relative z-10 flex items-baseline gap-1">
                   <span className="text-2xl font-black tracking-tighter text-white tabular-nums">{data.agreementScore}%</span>
                   <span className="text-[9px] text-zinc-600 font-bold">Aligned</span>
                </div>
             </div>
          </div>

          {/* ROW 2: CONVERGENCE CHART */}
          <div className="h-60">
             <ConsensusConvergenceChart 
                history={convHistory} 
                loading={convLoading} 
                timeRange={timeRange} 
                onTimeRangeChange={setTimeRange}
                dataKey={consensusKey}
             />
          </div>

          {/* ROW 3: DETAILED DISTRIBUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* BUCKETS STRIP (Polish: Hero Target & Dimmed Others) */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between h-[7.5rem]">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-1.5"><Activity size={10} /> Lifecycle State</div>
                <div className="grid grid-cols-3 gap-2 text-center h-full items-center">
                   {/* Lagging - Dimmed */}
                   <div className="border-r border-zinc-800 last:border-0 opacity-60">
                      <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.lagging}</div>
                      <div className="text-[7px] font-bold text-red-400 uppercase tracking-wider flex justify-center items-center gap-1"><AlertCircle size={8}/> Lagging</div>
                   </div>
                   {/* Synced - HERO */}
                   <div className="border-r border-zinc-800 last:border-0 px-1 scale-110">
                      <div className={`text-2xl font-black leading-none mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] ${activeTheme.text}`}>{data.buckets.target}</div>
                      <div className={`text-[7px] font-extrabold uppercase tracking-wider flex justify-center items-center gap-1 bg-zinc-800 py-0.5 rounded-sm text-white`}>
                         <CheckCircle size={8} className="text-green-500"/> Synced
                      </div>
                   </div>
                   {/* Leading - Dimmed */}
                   <div className="opacity-60">
                      <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.leading}</div>
                      <div className="text-[7px] font-bold text-cyan-400 uppercase tracking-wider flex justify-center items-center gap-1"><ArrowUpCircle size={8}/> Leading</div>
                   </div>
                </div>
             </div>

             {/* VERSION LIST (Polish: Compact & Clean) */}
             <div className={`border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[7.5rem] ${activeTab === 'ALL' ? 'bg-purple-900/5' : activeTab === 'MAINNET' ? 'bg-green-900/5' : 'bg-blue-900/5'}`}>
                 <div className="px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Version List</span>
                    <span className="text-[8px] text-zinc-600 font-mono">{data.sortedVersions.length} Active</span>
                 </div>
                 <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {data.sortedVersions.map(([ver, count]) => {
                       const isConsensus = ver === data.consensusVer;
                       const percent = ((count / data.count) * 100).toFixed(1);
                       const isExpanded = expandedVersion === ver;
                       return (
                          <div key={ver} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 p-1.5 rounded text-[9px] transition-colors ${isConsensus ? 'bg-zinc-800/50 border border-zinc-700' : 'hover:bg-zinc-800/30 border border-transparent'}`}>
                             <div 
                                className={`font-mono font-bold truncate cursor-pointer hover:text-white relative ${isConsensus ? 'text-white' : 'text-zinc-400'}`}
                                onClick={() => setExpandedVersion(isExpanded ? null : ver)}
                             >
                                {ver}
                                {isExpanded && <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black border border-zinc-700 rounded text-[9px] text-white whitespace-nowrap z-50 shadow-xl">{ver}</div>}
                             </div>
                             <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full ${isConsensus ? activeTheme.bg : 'bg-zinc-600'}`} style={{ width: `${percent}%` }}></div>
                             </div>
                             <div className="text-right font-mono text-zinc-500 w-16 tabular-nums">
                                <span className="mr-1.5 text-zinc-400">{count}</span>
                                <span className={isConsensus ? activeTheme.text : 'text-zinc-600'}>{percent}%</span>
                             </div>
                          </div>
                       );
                    })}
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
