import { Activity, ArrowLeft, Zap, Info } from 'lucide-react';
import { Node } from '../../../types';

interface HealthViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  avgNetworkHealth: number;
  medianStorage: number;
  networkStats: any; 
}

export const HealthView = ({ node, zenMode, onBack, avgNetworkHealth, medianStorage, networkStats }: HealthViewProps) => {
  const health = node.health || 0;
  const bd = node.healthBreakdown || {
    uptime: health,
    version: health,
    reputation: health,
    storage: health,
  };
  const avgs = networkStats.avgBreakdown || {};
  const totalNodes = networkStats.totalNodes || 1;
  const rank = node.health_rank || node.rank || totalNodes;
  const rankPercentile = (rank / totalNodes) * 100;
  const betterThanPercent = 100 - rankPercentile;
  const diff = health - avgNetworkHealth;
  const isCreditsOffline = node.credits === null && !(node as any).isUntracked;

  const weights = isCreditsOffline 
      ? { uptime: 0.45, storage: 0.35, reputation: 0, version: 0.20 }
      : { uptime: 0.35, storage: 0.30, reputation: 0.20, version: 0.15 };

  const metrics = [
    { label: 'Storage', rawVal: bd.storage, avgRaw: avgs.storage, weight: weights.storage },
    { label: 'Reputation', rawVal: bd.reputation, avgRaw: avgs.reputation, weight: weights.reputation },
    { label: 'Uptime', rawVal: bd.uptime, avgRaw: avgs.uptime, weight: weights.uptime },
    { label: 'Consensus', rawVal: bd.version, avgRaw: avgs.version, weight: weights.version },
  ];

  const getStorageBreakdownText = (node: Node, median: number) => {
      const commGB = (node.storage_committed || 0) / (1024**3);
      const usedGB = (node.storage_used || 0) / (1024**3);
      const medGB = (median || 0) / (1024**3);
      let base = 0;
      if(medGB > 0) base = Math.min(100, 50 * Math.log2((commGB / medGB) + 1));
      let bonus = 0;
      if(usedGB > 0) bonus = Math.min(15, 5 * Math.log2(usedGB + 2));
      return `(Base: ${Math.round(base)} + Bonus: ${Math.round(bonus)})`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${zenMode ? 'text-zinc-200' : 'text-zinc-500'}`}>
          <Activity size={14} /> DIAGNOSTICS & VITALITY
        </h3>
        <button onClick={onBack} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition">
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4 md:gap-6">
        {/* SCORE CARD */}
        <div className="p-4 md:p-6 bg-black rounded-2xl border border-zinc-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-green-500/5 blur-2xl rounded-full pointer-events-none"></div>
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">YOUR SCORE</div>
            <div className="text-4xl font-black text-white">{health}<span className="text-lg text-zinc-600 font-medium">/100</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">NETWORK AVG</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold text-zinc-300">{avgNetworkHealth}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${diff >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{diff > 0 ? '+' : ''}{diff}</span>
            </div>
          </div>
        </div>

        {/* --- MOBILE LAYOUT: 2x2 GRID (No Scroll) --- */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
           {metrics.map((m) => {
              const rawVal = m.rawVal || 0;
              const weightedVal = (rawVal * m.weight).toFixed(1);
              const barColor = rawVal >= 80 ? 'bg-green-500' : rawVal >= 50 ? 'bg-yellow-500' : 'bg-red-500';
              
              return (
                <div key={m.label} className="bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-zinc-400">{m.label}</span>
                      <span className="text-[10px] font-mono font-bold text-white">{weightedVal} pts</span>
                   </div>
                   <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                      <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, rawVal)}%` }}></div>
                   </div>
                   <div className="text-[8px] text-zinc-600 flex justify-between">
                      <span>Base: {rawVal}</span>
                      {m.label === 'Storage' && <span>{getStorageBreakdownText(node, medianStorage)}</span>}
                   </div>
                </div>
              );
           })}
        </div>

        {/* --- DESKTOP LAYOUT: VERTICAL STACK (Preserved) --- */}
        <div className="hidden md:flex flex-col gap-5">
          {metrics.map((m) => {
            const rawVal = m.rawVal || 0; 
            const rawAvg = m.avgRaw || 0;
            const weightedVal = (rawVal * m.weight).toFixed(2);
            const weightedAvg = (rawAvg * m.weight).toFixed(2);
            const barColor = rawVal >= 80 ? 'bg-green-500' : rawVal >= 50 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-bold flex items-center gap-2">
                      {m.label} {m.label === 'Storage' ? <span className="text-[9px] font-mono text-zinc-600 font-normal">{getStorageBreakdownText(node, medianStorage)}</span> : <span className="text-[9px] font-mono text-zinc-600 font-normal">(Base: {rawVal})</span>}
                  </span>
                  <div className="font-mono text-[10px]">
                    <span className="text-white font-bold">{weightedVal}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-zinc-500">Avg: {weightedAvg}</span>
                  </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-visible relative">
                  <div className={`h-full rounded-l-full transition-all duration-1000 ${barColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} style={{ width: `${Math.min(100, rawVal)}%` }}></div>
                  <div className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white shadow-[0_0_5px_white] z-10" style={{ left: `${Math.min(100, rawAvg)}%` }} title={`Network Average: ${rawAvg}`}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-center text-center">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="shrink-0" /> 
            <span>RANK #{rank} • BETTER THAN {betterThanPercent < 1 ? '<1' : Math.floor(betterThanPercent)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
