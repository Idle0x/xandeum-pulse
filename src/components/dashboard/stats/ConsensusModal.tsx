import { useState, useMemo } from 'react';
import { X, Server, GitBranch, CheckCircle, AlertCircle, ArrowUpCircle, Activity, ShieldCheck } from 'lucide-react';
import { Node } from '../../../types';
import { compareVersions } from '../../../utils/nodeHelpers'; // Ensure this utility is available

interface ConsensusModalProps {
  onClose: () => void;
  nodes: Node[];
  mostCommonVersion: string; // Global fallback, though we recalculate per context
}

export const ConsensusModal = ({ onClose, nodes }: ConsensusModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // --- 1. DATA ENGINE ---
  const data = useMemo(() => {
    // A. Filter
    const filteredNodes = nodes.filter(n => 
      activeTab === 'ALL' ? true : n.network === activeTab
    );
    const count = filteredNodes.length || 1;

    // B. Group Versions
    const versionMap: Record<string, number> = {};
    filteredNodes.forEach(n => {
      const v = n.version || 'Unknown';
      versionMap[v] = (versionMap[v] || 0) + 1;
    });

    // C. Determine Consensus (Winner)
    const sortedVersions = Object.entries(versionMap).sort((a, b) => b[1] - a[1]);
    const consensusVer = sortedVersions[0]?.[0] || '0.0.0';
    const consensusCount = sortedVersions[0]?.[1] || 0;
    const agreementScore = ((consensusCount / count) * 100).toFixed(1);

    // D. Lifecycle Buckets (Lagging vs Target vs Leading)
    let lagging = 0;
    let target = 0;
    let leading = 0;

    filteredNodes.forEach(n => {
      const ver = n.version || '0.0.0';
      // If version matches exactly -> Target
      if (ver === consensusVer) {
        target++;
      } else {
        // Use helper to compare
        const cmp = compareVersions(ver, consensusVer);
        if (cmp < 0) lagging++; // Older
        if (cmp > 0) leading++; // Newer
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

  // Theme Logic
  const theme = {
    ALL: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/20' },
    MAINNET: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/20' },
    DEVNET: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/20' },
  };
  const activeTheme = theme[activeTab];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER & TOGGLES --- */}
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
          
          {/* --- ROW 1: HERO METRICS (Alignment) --- */}
          <div className="grid grid-cols-2 gap-4">
             {/* Left: Winning Version */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                   <GitBranch size={10} /> Consensus Target
                </div>
                <div className={`text-3xl font-black tracking-tight ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`}>
                   {data.consensusVer}
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mt-1">
                   Most common version on {activeTab}
                </div>
             </div>

             {/* Right: Agreement Score */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <ShieldCheck size={10} /> Unity Score
                   </div>
                   <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      parseFloat(data.agreementScore) > 66 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                   }`}>
                      {parseFloat(data.agreementScore) > 66 ? 'STRONG' : 'FRACTURED'}
                   </div>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-black tracking-tight text-white">{data.agreementScore}%</span>
                   <span className="text-[10px] text-zinc-600 font-bold uppercase">Agreement</span>
                </div>
             </div>
          </div>

          {/* --- ROW 2: LIFECYCLE BUCKETS (New Feature) --- */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
             {/* Lagging */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <div className="mb-1 p-1.5 rounded-full bg-red-500/10 text-red-500"><AlertCircle size={12} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.lagging}</div>
                <div className="text-[8px] font-bold text-red-400 uppercase tracking-wider">Lagging</div>
                <div className="text-[7px] text-zinc-600 mt-0.5">Outdated Nodes</div>
             </div>

             {/* Target (Consensus) */}
             <div className={`bg-zinc-900/30 border rounded-xl p-3 flex flex-col items-center justify-center text-center ${activeTheme.border} bg-opacity-5`}>
                <div className={`mb-1 p-1.5 rounded-full bg-opacity-10 ${activeTheme.bg} ${activeTheme.text}`}><CheckCircle size={12} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.target}</div>
                <div className={`text-[8px] font-bold uppercase tracking-wider ${activeTheme.text}`}>Synced</div>
                <div className="text-[7px] text-zinc-600 mt-0.5">Target Version</div>
             </div>

             {/* Leading */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <div className="mb-1 p-1.5 rounded-full bg-cyan-500/10 text-cyan-500"><ArrowUpCircle size={12} /></div>
                <div className="text-lg font-black text-white leading-none mb-1">{data.buckets.leading}</div>
                <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider">Leading</div>
                <div className="text-[7px] text-zinc-600 mt-0.5">Bleeding Edge</div>
             </div>
          </div>

          {/* --- ROW 3: DETAILED LIST --- */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden flex flex-col max-h-60">
             <div className="p-3 border-b border-zinc-800 bg-black/20 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><Activity size={10} /> Version Distribution</span>
                <span className="text-[9px] text-zinc-600 font-mono">{data.sortedVersions.length} Distinct Versions</span>
             </div>
             <div className="overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {data.sortedVersions.map(([ver, count], idx) => {
                   const isConsensus = ver === data.consensusVer;
                   const percent = ((count / data.count) * 100).toFixed(1);
                   
                   return (
                      <div key={ver} className={`flex items-center justify-between p-2 rounded-lg text-xs ${isConsensus ? 'bg-zinc-800/50 border border-zinc-700' : 'hover:bg-zinc-800/30 border border-transparent'}`}>
                         <div className="flex items-center gap-3">
                            <span className={`font-mono font-bold ${isConsensus ? 'text-white' : 'text-zinc-400'}`}>v{ver}</span>
                            {isConsensus && <span className={`text-[8px] px-1.5 rounded font-bold uppercase ${activeTheme.bg} bg-opacity-20 ${activeTheme.text}`}>Consensus</span>}
                         </div>
                         <div className="flex items-center gap-3 text-zinc-500 font-mono">
                            <span>{count} nodes</span>
                            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                               <div className={`h-full ${isConsensus ? activeTheme.bg : 'bg-zinc-600'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            <span className="w-8 text-right">{percent}%</span>
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
