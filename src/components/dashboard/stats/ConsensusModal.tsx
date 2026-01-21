import { useState, useMemo } from 'react';
import { X, Server, GitBranch, CheckCircle, AlertCircle, ArrowUpCircle, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { Node } from '../../../types';
import { compareVersions } from '../../../utils/nodeHelpers';
// NEW IMPORTS: History Hook & Chart Component
import { useNetworkHistory } from '../../../hooks/useNetworkHistory';
import { HistoryChart } from '../../common/HistoryChart';

interface ConsensusModalProps {
  onClose: () => void;
  nodes: Node[];
  mostCommonVersion: string;
}

export const ConsensusModal = ({ onClose, nodes, mostCommonVersion }: ConsensusModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // 1. DATA FETCHING: Shadow Layer (Consensus Trends)
  // We want to see if the network is converging (score goes up) or forking (score goes down)
  const { history, loading: historyLoading } = useNetworkHistory('consensus_score');

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

  const theme = {
    ALL: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/20' },
    MAINNET: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/20' },
    DEVNET: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/20' },
  };
  const activeTheme = theme[activeTab];

  const Tooltip = ({ text, align = 'center' }: { text: string, align?: 'left' | 'center' | 'right' }) => {
    const positionClasses = {
      left: 'left-0 translate-x-0',
      center: 'left-1/2 -translate-x-1/2',
      right: 'right-0 translate-x-0',
    };
    const arrowClasses = {
      left: 'left-2',
      center: 'left-1/2 -translate-x-1/2',
      right: 'right-2',
    };

    return (
      <div className="group relative inline-block ml-1 cursor-help z-[50]">
        <HelpCircle size={8} className="text-zinc-600 hover:text-zinc-400" />
        <div className={`absolute bottom-full mb-2 w-40 p-2 bg-[#09090b] border border-zinc-700 rounded-lg text-[9px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-[60] leading-snug ${positionClasses[align]}`}>
          {text}
          <div className={`absolute top-full w-0 h-0 border-4 border-transparent border-t-zinc-700 ${arrowClasses[align]}`}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border bg-opacity-10 ${activeTheme.bg} ${activeTheme.border}`}>
              <Server size={24} className={activeTheme.text} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Consensus State</h3>
              <p className="text-xs text-zinc-500">Network alignment & version control</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-zinc-800">
             {(['ALL', 'MAINNET', 'DEVNET'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-bold transition-all duration-300 ${
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

        <div className="space-y-3">

          {/* ROW 1: HERO METRICS */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 relative">
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${activeTheme.bg}`}></div>
                <div className="flex justify-between items-start mb-1">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1">
                      <GitBranch size={10} /> Consensus Target
                      <Tooltip text="The software version that the majority of the network is currently running." align="left" />
                   </div>
                </div>
                <div className={`text-2xl font-black tracking-tight truncate ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`} title={data.consensusVer}>
                   {data.consensusVer}
                </div>
                <div className="text-[9px] text-zinc-600 font-mono mt-1">
                   Most common version {activeTab === 'ALL' ? 'across all networks' : `on ${activeTab}`}
                </div>
             </div>

             {/* UNITY SCORE CARD WITH SHADOW CHART */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group">
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${activeTheme.bg}`}></div>

                {/* SHADOW CHART: Consensus Trend */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none mt-4 px-2">
                    <HistoryChart 
                        data={history} 
                        color={parseFloat(data.agreementScore) > 66 ? '#22c55e' : '#eab308'} 
                        loading={historyLoading} 
                        height={60} 
                    />
                </div>

                <div className="flex justify-between items-start mb-1 relative z-10">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1">
                      <ShieldCheck size={10} /> Unity Score
                      <Tooltip text="The percentage of nodes running the consensus version." align="right" />
                   </div>
                   <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      parseFloat(data.agreementScore) > 66 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                   }`}>
                      {parseFloat(data.agreementScore) > 66 ? 'STRONG' : 'FRACTURED'}
                   </div>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                   <span className="text-2xl font-black tracking-tight text-white">{data.agreementScore}%</span>
                   <span className="text-[9px] text-zinc-600 font-bold uppercase">of Network Synced</span>
                </div>
             </div>
          </div>

          {/* ROW 2: LIFECYCLE BUCKETS */}
          <div className="grid grid-cols-3 gap-2">
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group">
                <div className="absolute top-2 right-2"><Tooltip text="Nodes running older versions than consensus." align="left" /></div>
                <div className="mb-1 p-1 rounded-full bg-red-500/10 text-red-500"><AlertCircle size={10} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.lagging}</div>
                <div className="text-[8px] font-bold text-red-400 uppercase tracking-wider">Lagging</div>
             </div>

             <div className={`bg-zinc-900/30 border rounded-xl p-3 flex flex-col items-center justify-center text-center ${activeTheme.border} bg-opacity-5 relative group`}>
                <div className="absolute top-2 right-2"><Tooltip text="Nodes perfectly aligned with the target version." align="center" /></div>
                <div className={`mb-1 p-1 rounded-full bg-opacity-10 ${activeTheme.bg} ${activeTheme.text}`}><CheckCircle size={10} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.target}</div>
                <div className={`text-[8px] font-bold uppercase tracking-wider ${activeTheme.text}`}>Synced</div>
             </div>

             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group">
                <div className="absolute top-2 right-2"><Tooltip text="Nodes testing newer, experimental versions." align="right" /></div>
                <div className="mb-1 p-1 rounded-full bg-cyan-500/10 text-cyan-500"><ArrowUpCircle size={10} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.leading}</div>
                <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider">Leading</div>
             </div>
          </div>

          {/* ROW 3: DETAILED LIST */}
          <div className={`border border-zinc-800 rounded-xl overflow-hidden flex flex-col max-h-60 ${activeTab === 'ALL' ? 'bg-purple-900/5' : activeTab === 'MAINNET' ? 'bg-green-900/5' : 'bg-blue-900/5'}`}>
             <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                   <Activity size={10} /> Version Distribution
                   <Tooltip text="Breakdown of all active software versions." align="left" />
                </span>
                <span className="text-[8px] text-zinc-600 font-mono">{data.sortedVersions.length} Versions Active</span>
             </div>
             <div className="overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                {data.sortedVersions.map(([ver, count], idx) => {
                   const isConsensus = ver === data.consensusVer;
                   const percent = ((count / data.count) * 100).toFixed(1);
                   const isExpanded = expandedVersion === ver;

                   return (
                      <div key={ver} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 p-2 rounded-lg text-[10px] ${isConsensus ? 'bg-zinc-800/50 border border-zinc-700' : 'hover:bg-zinc-800/30 border border-transparent'}`}>
                         <div className="flex items-center gap-2 min-w-0">
                            <div 
                               className={`font-mono font-bold truncate cursor-pointer hover:text-white transition-colors relative ${isConsensus ? 'text-white' : 'text-zinc-400'}`}
                               onClick={() => setExpandedVersion(isExpanded ? null : ver)}
                            >
                               {ver}
                               {isExpanded && (
                                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black border border-zinc-700 rounded text-[9px] text-white whitespace-nowrap z-50 shadow-xl">
                                     {ver}
                                  </div>
                               )}
                            </div>
                            {isConsensus && <span className={`text-[7px] px-1 rounded font-bold uppercase ${activeTheme.bg} bg-opacity-20 ${activeTheme.text}`}>Consensus</span>}
                         </div>
                         <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${isConsensus ? activeTheme.bg : 'bg-zinc-600'}`} style={{ width: `${percent}%` }}></div>
                         </div>
                         <div className="text-right font-mono text-zinc-500 w-16">
                            <span className="mr-2 text-zinc-400">{count}</span>
                            <span>{percent}%</span>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
