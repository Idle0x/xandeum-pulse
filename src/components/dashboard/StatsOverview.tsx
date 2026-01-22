import { 
  Database, Globe, Maximize2, HeartPulse, GitBranch, Activity, RefreshCw 
} from 'lucide-react';
import { NetworkSwitcher } from '../common/NetworkSwitcher';
import { formatBytes } from '../../utils/formatters';
import { useNetworkHistory } from '../../hooks/useNetworkHistory';
import { HistoryChart } from '../common/HistoryChart';

interface StatsOverviewProps {
  stats: {
    vitalsStats: { avg: number; stability: string };
    consensusStats: { version: string; score: string };
    displayCommitted: number;
    displayUsed: number;
    isGlobalView: boolean;
  };
  totalStorageCommitted: number;
  totalNodes: number;
  displayedCount: number;
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET';
  onNetworkChange: (val: 'ALL' | 'MAINNET' | 'DEVNET') => void;
  loading: boolean;
  onOpenModal: (modal: 'capacity' | 'vitals' | 'consensus') => void;
  zenMode: boolean;
}

export const StatsOverview = ({
  stats,
  totalStorageCommitted,
  totalNodes,
  displayedCount,
  networkFilter,
  onNetworkChange,
  loading,
  onOpenModal,
  zenMode
}: StatsOverviewProps) => {
  if (zenMode) return null;

  const { vitalsStats, consensusStats, displayCommitted, displayUsed, isGlobalView } = stats;

  // 1. DATA FETCHING: The "Shadow Layer" (Default 7 Days)
  // We fetch one history object and map it for different charts
  const { history, loading: historyLoading } = useNetworkHistory('7D');

  // Mappers for the generic HistoryChart
  const capacityData = history.map(p => ({ date: p.date, value: p.total_capacity }));
  const healthData = history.map(p => ({ date: p.date, value: p.avg_health }));
  const consensusData = history.map(p => ({ date: p.date, value: p.consensus_score }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">

      {/* --- 1. CAPACITY CARD (Growth Trend) --- */}
      <div onClick={() => onOpenModal('capacity')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform group relative overflow-hidden h-24 md:h-auto">
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none mt-4">
           <HistoryChart 
              data={capacityData} 
              color={isGlobalView ? '#a855f7' : networkFilter === 'MAINNET' ? '#22c55e' : '#3b82f6'} 
              loading={historyLoading} 
              height={80} 
           />
        </div>
        <div className="relative z-10">
          <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
             <Database size={10} className={isGlobalView ? 'text-zinc-500' : networkFilter === 'MAINNET' ? 'text-green-500' : 'text-blue-500'} /> 
             {isGlobalView ? 'Network Capacity' : `${networkFilter} Capacity`}
          </div>
          <div>
            <div className={`text-lg md:text-3xl font-bold ${isGlobalView ? 'text-purple-400' : 'text-white'}`}>{formatBytes(displayCommitted)}</div>
            <div className="text-[9px] md:text-xs font-bold text-blue-400 mt-0.5 md:mt-1 flex items-center gap-1">{formatBytes(displayUsed)} <span className="text-zinc-600 font-normal">Used</span></div>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
           {!isGlobalView ? (
              <div className="flex items-center gap-1 text-[8px] text-zinc-600 font-mono"><Globe size={8} /> Global: <span className="text-zinc-500">{formatBytes(totalStorageCommitted)}</span></div>
           ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-purple-400 font-bold flex items-center gap-1"><Maximize2 size={8} /> DETAILS</div>
           )}
        </div>
      </div>

      {/* --- 2. VITALS CARD (Pulse/EKG) --- */}
      <div onClick={() => onOpenModal('vitals')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform h-24 md:h-auto">
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none mt-4">
           <HistoryChart 
              data={healthData} 
              color={networkFilter === 'DEVNET' ? '#3b82f6' : '#22c55e'} 
              loading={historyLoading} 
              height={80} 
           />
        </div>
        <div className="relative z-10">
          <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1">
              <HeartPulse size={12} className={`animate-pulse ${networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-green-500'}`} /> 
              {isGlobalView ? 'Network Vitals' : `${networkFilter} Vitals`}
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Stability</span><span className="font-mono font-bold text-white">{vitalsStats.stability}%</span></div>
            <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Avg Health</span><span className="font-mono font-bold text-green-400">{vitalsStats.avg}/100</span></div>
            <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Consensus</span><span className="font-mono font-bold text-blue-400">{consensusStats.score}%</span></div>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-green-400 font-bold flex items-center gap-1 z-10"><Maximize2 size={8} /> DETAILS</div>
      </div>

      {/* --- 3. CONSENSUS CARD (Unity Trend) --- */}
      <div onClick={() => onOpenModal('consensus')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform group relative overflow-hidden h-24 md:h-auto">
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none mt-4">
           <HistoryChart 
              data={consensusData} 
              color={parseFloat(consensusStats.score) > 66 ? '#22c55e' : '#eab308'} 
              loading={historyLoading} 
              height={80} 
           />
        </div>
        <div className="relative z-10">
          <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
             <GitBranch size={10} className="text-blue-500"/>
             {isGlobalView ? 'Global Consensus' : `${networkFilter} Target`}
          </div>
          <div className="text-lg md:text-3xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              <span className="text-[10px] md:text-xs text-zinc-500 font-mono uppercase tracking-tight">Version</span>
              {consensusStats.version}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${parseFloat(consensusStats.score) > 66 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`}></div>
             <span className={`text-[9px] md:text-xs font-mono font-bold ${parseFloat(consensusStats.score) > 66 ? 'text-green-400' : 'text-yellow-400'}`}>
                {consensusStats.score}% of network
             </span>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-blue-400 font-bold flex items-center gap-1 z-10"><Maximize2 size={8} /> DETAILS</div>
      </div>

      {/* --- 4. FILTER CARD --- */}
      <div onClick={() => { const nextFilter = networkFilter === 'ALL' ? 'MAINNET' : networkFilter === 'MAINNET' ? 'DEVNET' : 'ALL'; onNetworkChange(nextFilter); }} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl backdrop-blur-sm flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-zinc-700 cursor-pointer select-none active:scale-[0.98] h-24 md:h-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex justify-between items-center relative z-10 mb-2">
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1"><Activity size={10} className={networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-white'} /> Filter</div>
          <NetworkSwitcher current={networkFilter} onChange={onNetworkChange} size="sm" />
        </div>
        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-white tracking-tighter leading-none">{displayedCount}</div>
            <div className="text-[8px] font-mono text-zinc-600 font-bold uppercase tracking-tight">Nodes</div>
          </div>
          <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col"><div className={`text-[8px] font-black uppercase flex items-center gap-1 ${networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-zinc-400'}`}>{networkFilter === 'ALL' ? 'GLOBAL VIEW' : `${networkFilter} READY`}</div></div>
            <div className="flex items-center">
                {!isGlobalView && (
                   <div className="flex items-center gap-1 text-[7px] text-zinc-500 font-mono">
                      <Globe size={8} /> Global: {totalNodes}
                   </div>
                )}
                {isGlobalView && <div className="p-1.5 rounded-lg bg-black/40 border border-white/5"><RefreshCw size={10} className={`text-zinc-600 group-hover:text-zinc-400 transition-all duration-700 ${loading ? 'animate-spin' : ''}`} /></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
