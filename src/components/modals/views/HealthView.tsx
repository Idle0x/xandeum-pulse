import { ArrowLeft, Zap, ShieldCheck, Minimize2 } from 'lucide-react';
import { Node } from '../../../types';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { StabilityRibbon } from './StabilityRibbon';
import { HealthHistoryChart } from './HealthHistoryChart';
import { RadialProgress } from '../../RadialProgress';

interface HealthViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  avgNetworkHealth: number;
  medianStorage: number;
  networkStats: any;
  history?: NodeHistoryPoint[];
  historyLoading?: boolean;
  // State Lifted Props
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (range: HistoryTimeRange) => void;
}

export const HealthView = ({ 
  node, 
  zenMode, 
  onBack, 
  avgNetworkHealth, 
  medianStorage, 
  networkStats, 
  history = [], 
  historyLoading = false,
  timeRange,
  onTimeRangeChange
}: HealthViewProps) => {
  const health = node.health || 0;

  // Safe Accessors
  const bd = node.healthBreakdown || { uptime: health, version: health, reputation: health, storage: health };
  const avgs = networkStats?.avgBreakdown || { uptime: 0, version: 0, reputation: 0, storage: 0 };

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

  // --- NEW: Calculate ribbon density based on Time Range ---
  const getRibbonSlots = () => {
    switch(timeRange) {
        case '24H': return 24;  // 24 Hourly slots
        case '3D': return 72;   // 3 * 24 Hourly slots
        case '7D': return 168;  // 7 * 24 Hourly slots
        case '30D': return 30;  // 30 Daily slots (Aggregated)
        case 'ALL': return 60;  // Cap at 60 for visual sanity
        default: return 30;
    }
  };

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

      {/* HEADER: Back Button */}
      <div className="flex justify-end items-center mb-2 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">

        {/* --- ROW 1: METRICS GRID (Top) --- */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
           {metrics.map((m) => {
              const rawVal = m.rawVal || 0;
              const weightedVal = (rawVal * m.weight).toFixed(1);
              const weightedAvg = (m.avgRaw * m.weight).toFixed(1);

              const barColor = zenMode 
                ? 'bg-white'
                : (rawVal >= 80 ? 'bg-green-500' : rawVal >= 50 ? 'bg-yellow-500' : 'bg-red-500');

              const isInvalidRep = m.label === 'Reputation' && isReputationInvalid;
              const baseVal = m.label === 'Storage' ? getStorageBase(rawVal, node) : rawVal;
              const bonusText = m.label === 'Storage' ? getStorageBonusText(node, medianStorage) : '';

              return (
                <div 
                  key={m.label} 
                  className={`border rounded-xl p-2.5 md:p-4 flex flex-col justify-between h-[4.5rem] md:h-28 transition-all ${
                    isInvalidRep 
                      ? (zenMode ? 'bg-black border-zinc-700 border-dashed opacity-50' : 'bg-zinc-900/30 border-zinc-800/50 border-dashed opacity-60')
                      : (zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60')
                  }`}
                >
                   <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className="text-[7px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate mr-1">{m.label}</span>
                      <span className={`text-[10px] md:text-sm font-mono font-bold whitespace-nowrap ${isInvalidRep ? 'text-zinc-500' : 'text-white'}`}>
                        {isInvalidRep 
                          ? 'N/A'
                          : `${weightedVal} pts`}
                      </span>
                   </div>

                   <div className="mt-auto">
                       <div className="h-1 md:h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5 md:mb-2">
                          {!isInvalidRep && (
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, rawVal)}%` }}></div>
                          )}
                       </div>

                       <div className="text-[6px] md:text-[9px] text-zinc-600 flex justify-between items-center border-t border-white/5 pt-1 truncate">
                          <div className="flex items-center gap-1 truncate">
                              <span>Base: {isInvalidRep ? '-' : baseVal}</span>
                              {bonusText && <span className="text-zinc-500 hidden sm:inline">{bonusText}</span>}
                          </div>
                          {!isInvalidRep && <span className="opacity-70 ml-1">vs Avg: {weightedAvg}</span>}
                       </div>
                   </div>
                </div>
              );
           })}
        </div>

        {/* --- ROW 2: STABILITY RIBBON (Middle) --- */}
        <div className={`rounded-xl border p-3 flex flex-col gap-2 ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stability Map</span>
                {!historyLoading && (
                    <span className="text-[9px] font-mono text-zinc-400">
                        {timeRange === '24H' || timeRange === '3D' || timeRange === '7D' ? 'Hourly Resolution' : 'Daily Avg Resolution'}
                    </span>
                )}
            </div>
            <div className="h-8 md:h-10 w-full relative">
                {/* UPDATED: Pass dynamic days prop */}
                <StabilityRibbon 
                    history={history} 
                    loading={historyLoading} 
                    days={getRibbonSlots()} 
                />
            </div>
        </div>

        {/* --- ROW 3: HISTORY CHART (Bottom) --- */}
        <div className="min-h-[250px] shrink-0 pb-2">
            <HealthHistoryChart 
                history={history} 
                currentHealth={health}
                zenMode={zenMode}
                timeRange={timeRange}
                onTimeRangeChange={onTimeRangeChange}
                loading={historyLoading}
            />
        </div>

      </div>
    </div>
  );
};
