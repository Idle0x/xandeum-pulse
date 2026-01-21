import { ArrowLeft, Zap } from 'lucide-react';
import { Node } from '../../../types';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';
import { StabilityRibbon } from './StabilityRibbon';
import { HistoryChart } from '../common/HistoryChart';
import { useMemo } from 'react';

interface HealthViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  avgNetworkHealth: number;
  medianStorage: number;
  networkStats: any;
  history?: NodeHistoryPoint[];
  historyLoading?: boolean;
}

export const HealthView = ({ node, zenMode, onBack, avgNetworkHealth, medianStorage, networkStats, history = [], historyLoading = false }: HealthViewProps) => {
  const health = node.health || 0;

  // Transform history for Chart
  const chartData = useMemo(() => {
    return history.map(p => ({
      date: p.date,
      value: p.health
    }));
  }, [history]);

  // Safe Accessors
  const bd = node.healthBreakdown || { uptime: health, version: health, reputation: health, storage: health };
  const avgs = networkStats?.avgBreakdown || { uptime: 0, version: 0, reputation: 0, storage: 0 };
  const totalNodes = networkStats?.totalNodes || 1;
  const rank = node.health_rank || node.rank || totalNodes;
  const rankPercentile = (rank / totalNodes) * 100;
  const betterThanPercent = Math.max(0, 100 - rankPercentile);
  const diff = (health - avgNetworkHealth).toFixed(1);
  const diffNum = parseFloat(diff);

  const isUntracked = (node as any).isUntracked;
  const isApiOffline = node.credits === null;
  const isReputationInvalid = isUntracked || isApiOffline;

  const weights = isReputationInvalid 
      ? { uptime: 0.45, storage: 0.35, reputation: 0, version: 0.20 }
      : { uptime: 0.35, storage: 0.30, reputation: 0.20, version: 0.15 };

  const metrics = [
    { label: 'Storage', rawVal: bd.storage, avgRaw: avgs.storage ?? 0, weight: weights.storage },
    { label: 'Reputation', rawVal: bd.reputation, avgRaw: avgs.reputation ?? 0, weight: weights.reputation },
    { label: 'Uptime', rawVal: bd.uptime, avgRaw: avgs.uptime ?? 0, weight: weights.uptime },
    { label: 'Consensus', rawVal: bd.version, avgRaw: avgs.version ?? 0, weight: weights.version },
  ];

  const getStorageBonusText = (node: Node, median: number) => {
      const usedGB = (node.storage_used || 0) / (1024**3);
      let bonus = 0;
      if(usedGB > 0) bonus = Math.min(15, 5 * Math.log2(usedGB + 2));
      const rounded = Math.round(bonus);
      return rounded > 0 ? `(+${rounded} Bonus)` : '';
  };
  const getStorageBase = (total: number, node: Node) => {
      const usedGB = (node.storage_used || 0) / (1024**3);
      let bonus = 0;
      if(usedGB > 0) bonus = Math.min(15, 5 * Math.log2(usedGB + 2));
      return Math.max(0, Math.round(total - Math.round(bonus)));
  };

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

      {/* HEADER: Back Button */}
      <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">

        {/* SCORE CARD with SHADOW CHART */}
        <div className={`p-4 rounded-2xl border flex justify-between items-center relative overflow-hidden group ${zenMode ? 'bg-black border-zinc-600' : 'bg-black border-zinc-800'}`}>
          {!zenMode && <div className="absolute top-0 right-0 p-12 bg-green-500/5 blur-2xl rounded-full pointer-events-none"></div>}
          
          {/* SHADOW CHART: Node Health History */}
          <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none mt-2">
               <HistoryChart 
                  data={chartData} 
                  color={health >= 80 ? '#22c55e' : health >= 50 ? '#eab308' : '#ef4444'} 
                  loading={historyLoading} 
                  height={80} 
               />
          </div>

          <div className="relative z-10">
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">YOUR SCORE</div>
            <div className="text-4xl font-black text-white">{health}<span className="text-lg text-zinc-600 font-medium">/100</span></div>
          </div>
          <div className="text-right relative z-10">
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">NETWORK AVG</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold text-zinc-300">{avgNetworkHealth.toFixed(0)}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${zenMode ? 'bg-zinc-800 text-zinc-300' : (diffNum >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}`}>
                {diffNum > 0 ? '+' : ''}{diff}
              </span>
            </div>
          </div>
        </div>

        {/* STABILITY RIBBON */}
        {!zenMode && (
          <div className="px-1 animate-in fade-in slide-in-from-top-2 duration-500">
             <StabilityRibbon history={history} loading={historyLoading} />
          </div>
        )}

        {/* METRICS & BARS */}
        <div className="hidden md:flex flex-col gap-5">
          {metrics.map((m) => {
            const rawVal = m.rawVal || 0; 
            const rawAvg = m.avgRaw || 0;
            const weightedVal = (rawVal * m.weight).toFixed(2);
            const weightedAvg = (rawAvg * m.weight).toFixed(2);
            const barColor = zenMode ? 'bg-white' : rawVal >= 80 ? 'bg-green-500' : rawVal >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            const isInvalidRep = m.label === 'Reputation' && isReputationInvalid;
            const baseVal = m.label === 'Storage' ? getStorageBase(rawVal, node) : rawVal;
            const bonusText = m.label === 'Storage' ? getStorageBonusText(node, medianStorage) : '';

            return (
              <div key={m.label} className={isInvalidRep ? 'opacity-50 grayscale' : ''}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-bold flex items-center gap-2">
                      {m.label} <span className="text-[9px] font-mono text-zinc-600 font-normal">(Base: {isInvalidRep ? 'N/A' : baseVal}{bonusText ? ` ${bonusText}` : ''})</span>
                  </span>
                  <div className="font-mono text-[10px]">
                    {isInvalidRep ? <span className="text-zinc-500 font-bold uppercase tracking-wider">{isUntracked ? 'NO STORAGE CREDITS' : 'API OFFLINE'}</span> : <><span className="text-white font-bold">{weightedVal}</span><span className="text-zinc-600 mx-1">/</span><span className="text-zinc-500">Avg: {weightedAvg}</span></>}
                  </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-visible relative">
                  {!isInvalidRep && (
                    <>
                        <div className={`h-full rounded-l-full ${barColor} ${zenMode ? '' : 'transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]'}`} style={{ width: `${Math.min(100, rawVal)}%` }}></div>
                        <div className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white z-20 shadow-[0_0_5px_black]" style={{ left: `${Math.min(100, rawAvg)}%` }} title={`Network Average: ${rawAvg}`}></div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-2 flex justify-center text-center">
          <div className={`px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 border ${zenMode ? 'bg-black border-zinc-600 text-zinc-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
            <Zap size={14} className="shrink-0" /> 
            <span>RANK #{rank} • BETTER THAN {betterThanPercent < 1 ? '<1' : Math.floor(betterThanPercent)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
