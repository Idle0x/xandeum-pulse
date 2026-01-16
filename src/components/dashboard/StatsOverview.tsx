import { 
  Database, Globe, Maximize2, HeartPulse, GitBranch, Activity, RefreshCw 
} from 'lucide-react';
import { NetworkSwitcher } from '../common/NetworkSwitcher';
import { formatBytes } from '../../utils/formatters';

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
  displayedCount: number; // <--- NEW PROP
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
  displayedCount, // <--- Receive it here
  networkFilter,
  onNetworkChange,
  loading,
  onOpenModal,
  zenMode
}: StatsOverviewProps) => {
  if (zenMode) return null;

  const { vitalsStats, consensusStats, displayCommitted, displayUsed, isGlobalView } = stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
      {/* ... Capacity, Vitals, Consensus Cards (Unchanged) ... */}

      {/* --- 4. FILTER CARD (The one you want to fix) --- */}
      <div 
        onClick={() => { const nextFilter = networkFilter === 'ALL' ? 'MAINNET' : networkFilter === 'MAINNET' ? 'DEVNET' : 'ALL'; onNetworkChange(nextFilter); }} 
        className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl backdrop-blur-sm flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-zinc-700 cursor-pointer select-none active:scale-[0.98] h-24 md:h-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="flex justify-between items-center relative z-10 mb-2">
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1">
            <Activity size={10} className={networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-white'} /> 
            Filter
          </div>
          <NetworkSwitcher current={networkFilter} onChange={onNetworkChange} size="sm" />
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5">
            {/* USE DISPLAYED COUNT HERE */}
            <div className="text-3xl font-black text-white tracking-tighter leading-none">{displayedCount}</div>
            <div className="text-[8px] font-mono text-zinc-600 font-bold uppercase tracking-tight">Nodes</div>
          </div>
          
          <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className={`text-[8px] font-black uppercase flex items-center gap-1 ${networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-zinc-400'}`}>
                {networkFilter === 'ALL' ? 'GLOBAL VIEW' : `${networkFilter} READY`}
              </div>
            </div>
            
            <div className="flex items-center">
                {/* Logic: If filtered, show Global context. If Global, show loading spinner or nothing */}
                {!isGlobalView && (
                   <div className="flex items-center gap-1 text-[7px] text-zinc-500 font-mono">
                      <Globe size={8} /> Global: {totalNodes}
                   </div>
                )}
                {isGlobalView && (
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                    <RefreshCw size={10} className={`text-zinc-600 group-hover:text-zinc-400 transition-all duration-700 ${loading ? 'animate-spin' : ''}`} />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
