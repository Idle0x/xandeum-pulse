import { useState, useMemo } from 'react';
import { X, HeartPulse, Activity, Zap, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { Node } from '../../../types';

interface VitalsModalProps {
  onClose: () => void;
  nodes: Node[];
}

export const VitalsModal = ({ onClose, nodes }: VitalsModalProps) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');

  // --- 1. DATA ENGINE ---
  const data = useMemo(() => {
    // Filter
    const filtered = nodes.filter(n => activeTab === 'ALL' ? true : n.network === activeTab);
    const count = filtered.length || 1;

    // A. Hero Stats
    const totalHealth = filtered.reduce((acc, n) => acc + (n.health || 0), 0);
    const avgHealth = (totalHealth / count).toFixed(1);
    
    const stableNodes = filtered.filter(n => (n.uptime || 0) > 86400).length; // > 24h
    const stabilityPercent = ((stableNodes / count) * 100).toFixed(1);

    // B. Health Spectrum (Distribution)
    // New Logic: Green (Exc), Blue (Good), Yellow (Fair)
    const excellent = filtered.filter(n => (n.health || 0) >= 90).length;
    const good = filtered.filter(n => (n.health || 0) >= 70 && (n.health || 0) < 90).length;
    const fair = filtered.filter(n => (n.health || 0) < 70).length;

    // C. Uptime Tiers
    const ironclad = filtered.filter(n => (n.uptime || 0) > 604800).length; // > 7 days
    const volatile = count - stableNodes; // < 24h

    return {
      count,
      avgHealth,
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
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER & TOGGLES --- */}
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

          {/* --- ROW 1: HERO STATS --- */}
          <div className="grid grid-cols-2 gap-4">
             {/* Avg Health */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <Activity size={10} /> Avg Health
                   </div>
                   <span className={`text-[9px] font-mono font-bold ${activeTheme.text}`}>{activeTab}</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className={`text-3xl font-black tracking-tight ${activeTab === 'ALL' ? 'text-white' : activeTheme.text}`}>{data.avgHealth}</span>
                   <span className="text-xs text-zinc-600 font-bold">/ 100</span>
                </div>
             </div>

             {/* Stability */}
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <Zap size={10} /> Stability Score
                   </div>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-black tracking-tight text-white">{data.stabilityPercent}%</span>
                   <span className="text-[9px] text-zinc-500 uppercase font-bold">Stable Nodes</span>
                </div>
             </div>
          </div>

          {/* --- ROW 2: SPECTRUM & TIERS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             
             {/* LEFT: HEALTH SPECTRUM (Updated Colors/Labels) */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-3">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><HeartPulse size={10} /> Health Spectrum</div>
                   <div className="text-[8px] text-zinc-600 font-mono">{data.count} Nodes Analyzed</div>
                </div>

                {/* The Bar Chart: Green -> Blue -> Yellow */}
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex mb-3">
                   <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(data.spectrum.excellent / data.count) * 100}%` }}></div>
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(data.spectrum.good / data.count) * 100}%` }}></div>
                   <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(data.spectrum.fair / data.count) * 100}%` }}></div>
                </div>

                {/* Legend */}
                <div className="flex justify-between items-center text-[9px] font-mono">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-zinc-300">Excellent <span className="text-zinc-500">({data.spectrum.excellent})</span></span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-300">Good <span className="text-zinc-500">({data.spectrum.good})</span></span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      <span className="text-zinc-300">Fair <span className="text-zinc-500">({data.spectrum.fair})</span></span>
                   </div>
                </div>
             </div>

             {/* RIGHT: UPTIME TIERS */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-1.5">
                   <Clock size={10} /> Uptime Tiers
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <div className="text-center p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50">
                      <div className="text-[10px] font-bold text-blue-400 mb-0.5">{data.tiers.ironclad}</div>
                      <div className="text-[7px] text-zinc-500 uppercase font-bold">Ironclad</div>
                      <div className="text-[6px] text-zinc-600">&gt;7 Days</div>
                   </div>
                   <div className="text-center p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50">
                      <div className="text-[10px] font-bold text-white mb-0.5">{data.tiers.stable}</div>
                      <div className="text-[7px] text-zinc-500 uppercase font-bold">Stable</div>
                      <div className="text-[6px] text-zinc-600">&gt;24 Hours</div>
                   </div>
                   <div className="text-center p-1.5 rounded bg-zinc-900/50 border border-zinc-800/50">
                      {/* Changed Volatile color from Red to Yellow/Orange to match the "No Critical" vibe */}
                      <div className="text-[10px] font-bold text-orange-400 mb-0.5">{data.tiers.volatile}</div>
                      <div className="text-[7px] text-zinc-500 uppercase font-bold">Volatile</div>
                      <div className="text-[6px] text-zinc-600">&lt;24 Hours</div>
                   </div>
                </div>
             </div>
          </div>

          {/* --- ROW 3: FOOTER (Logic Ref) --- */}
          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-4">
             <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1.5 shrink-0">
               <Info size={10} /> Logic
             </div>
             
             <div className="flex items-center gap-4 text-[9px] text-zinc-400 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 shrink-0">
                   <div className="w-1 h-1 rounded-full bg-green-500"></div>
                   <span><span className="text-white font-bold">Excellent:</span> Score &gt; 90</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                   <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                   <span><span className="text-white font-bold">Good:</span> Score 70-89</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                   <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                   <span><span className="text-white font-bold">Fair:</span> Score &lt; 70</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
