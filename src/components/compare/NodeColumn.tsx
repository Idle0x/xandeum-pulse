import { useMemo } from 'react';
import { Crown, CheckCircle, Trash2, X } from 'lucide-react';
import { Node } from '../../types';
import { getSafeIp } from '../../utils/nodeHelpers';
import { formatBytes } from '../../utils/formatters';
import { MicroBar, MetricDelta, formatUptimePrecise } from './MicroComponents';
// NEW IMPORTS: History Hook & Ribbon
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { StabilityRibbon } from '../modals/views/StabilityRibbon';

interface NodeColumnProps {
  node: Node;
  onRemove: () => void;
  anchorNode: Node | undefined;
  theme: any;
  winners: any;
  overallWinner: boolean;
  benchmarks: any;
  showNetwork: boolean;
  hoveredNodeKey?: string | null;
  onFocus?: (key: string | null) => void;
  isLeader?: boolean;
  leaderType?: string;
}

export const NodeColumn = ({ 
    node, 
    onRemove, 
    anchorNode, 
    theme, 
    winners, 
    overallWinner, 
    benchmarks, 
    showNetwork,
    hoveredNodeKey,
    onFocus, 
    isLeader,
    leaderType
}: NodeColumnProps) => {

  // 1. Fetch History for the "DNA Strip" 
  // FIXED: Passed '30D' (valid string type) instead of 15 (invalid number)
  // The ribbon will display whatever data it gets.
  const { history, loading } = useNodeHistory(node.pubkey, '30D');

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className={`h-[36px] md:h-[72px] flex flex-col justify-center px-3 md:px-4 min-w-[100px] md:min-w-[140px] relative`}>
        {children}
    </div>
  );

  const SectionSpacer = () => <div className="h-5 md:h-8 bg-transparent border-y border-transparent mt-1"></div>;

  const baselines = useMemo(() => {
      if (showNetwork) return benchmarks.networkRaw;
      if (anchorNode) return { 
          health: anchorNode.health || 0,
          storage: anchorNode.storage_committed || 0,
          credits: anchorNode.credits || 0,
          uptime: anchorNode.uptime || 0
      };
      return {};
  }, [showNetwork, benchmarks, anchorNode]);

  const showDelta = !isLeader && (showNetwork || (anchorNode && node.pubkey !== anchorNode.pubkey));
  const isActive = hoveredNodeKey === node.pubkey;
  const isDimmed = hoveredNodeKey && hoveredNodeKey !== node.pubkey;

  return (
    <div 
        onClick={(e) => {
            e.stopPropagation();
            onFocus?.(node.pubkey || null);
        }}
        className={`flex flex-col min-w-[100px] md:min-w-[140px] relative border-r last:rounded-tr-xl last:rounded-br-xl group/col transition-all duration-300 cursor-pointer
            ${isActive 
                ? 'z-50 scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[#09090b] brightness-110' 
                : isDimmed 
                    ? 'opacity-40 grayscale-[0.5] scale-[0.98]' 
                    : `${theme.bodyBg}`
            }
            ${isLeader ? theme.border : 'border-white/5'}
        `}
    >
      {/* Header */}
      <div className={`h-24 md:h-32 ${isActive ? 'bg-zinc-800' : theme.headerBg} p-2 md:p-4 flex flex-col items-center justify-between relative overflow-hidden group first:rounded-tr-xl transition-colors duration-300`}>
        {overallWinner && <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 animate-in zoom-in duration-500"><Crown size={10} className="md:w-3.5 md:h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-sm" /></div>}

        <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className={`absolute top-1 right-1 p-1 rounded transition-all opacity-0 group-hover/col:opacity-100 z-20 ${isLeader ? 'text-yellow-600 hover:text-yellow-400 hover:bg-yellow-500/20' : 'text-red-500/50 hover:text-red-500 hover:bg-red-500/10'}`}
        >
            <X size={12} className="md:w-3.5 md:h-3.5" />
        </button>

        <div className="mt-1 md:mt-2">
             {node.location?.countryCode ? (
                 <img src={`https://flagcdn.com/w80/${node.location.countryCode.toLowerCase()}.png`} className="w-6 h-4 md:w-10 md:h-7 rounded-[2px] shadow-md object-cover" />
             ) : (
                 <div className="w-6 h-4 md:w-10 md:h-7 bg-white/5 rounded-[2px] border border-white/10"></div>
             )}
        </div>

        <div className="flex flex-col items-center gap-1 w-full text-center">
            <div className={`text-[7px] md:text-[10px] font-mono ${isActive ? 'text-white' : 'text-white/50'}`}>{getSafeIp(node)}</div>
            <div className={`text-[8px] md:text-xs font-bold font-mono text-white px-1 py-0.5 md:px-2 md:py-1 rounded border border-white/10 w-full truncate ${isActive ? 'bg-zinc-700' : 'bg-black/20'}`}>
                {node.pubkey?.slice(0, 8)}<span className="hidden md:inline">{node.pubkey?.slice(8, 12)}...</span>
            </div>
            {isLeader && (
                <div className="mt-1 text-[7px] md:text-[9px] font-black text-yellow-400 uppercase tracking-widest whitespace-nowrap">
                   ( {leaderType} LEADER )
                </div>
            )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="relative z-10">
        <SectionSpacer />
        <Row><span className={`text-[9px] md:text-sm font-mono font-medium ${node.version === '0.0.0' ? 'text-zinc-600' : 'text-zinc-300'}`}>{node.version}</span></Row>
        <Row><span className={`text-[6px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded border w-fit font-bold ${node.network === 'MAINNET' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-blue-400 border-blue-500/20 bg-blue-500/5'}`}>{node.network}</span></Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{node.health}</span>
                        {showDelta && <MetricDelta val={node.health || 0} base={baselines.health} />}
                    </div>
                    {winners.health && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
            <div className="absolute bottom-1 right-2 md:bottom-3 md:right-4 opacity-50"><MicroBar val={node.health || 0} max={100} color={node.health && node.health >= 90 ? '#22c55e' : '#eab308'} /></div>
        </Row>
        <Row><span className="text-[9px] md:text-base font-mono text-zinc-300">{formatUptimePrecise(node.uptime || 0)}</span></Row>

        <SectionSpacer />
        <Row>
             <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{formatBytes(node.storage_committed)}</span>
                        {showDelta && <MetricDelta val={node.storage_committed || 0} base={baselines.storage} type="bytes" />}
                    </div>
                    {winners.storage && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
        </Row>
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] md:text-base font-mono text-zinc-300">{formatBytes(node.storage_used)}</span>
                    <span className="text-[6px] md:text-[10px] text-zinc-500 font-mono mt-0 md:mt-0.5">
                        {(node.storage_committed || 0) > 0 
                            ? ((node.storage_used || 0) / (node.storage_committed || 1) * 100).toFixed(0) 
                            : 0}% Utilized
                    </span>
                </div>
            </div>
            <div className="absolute bottom-1 right-2 md:bottom-3 md:right-4 opacity-50"><MicroBar val={node.storage_used || 0} max={node.storage_committed || 1} color="#60a5fa" /></div>
        </Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{node.credits?.toLocaleString()}</span>
                        {showDelta && <MetricDelta val={node.credits || 0} base={baselines.credits} />}
                    </div>
                    {winners.credits && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
        </Row>
        <Row><span className="text-[9px] md:text-base font-mono text-zinc-500">#{node.rank || '-'}</span></Row>

        {/* --- INTEGRATION: The DNA Strip --- */}
        <div className="px-3 md:px-4 py-3 bg-black/20 border-t border-white/5 backdrop-blur-sm group-hover/col:bg-black/40 transition-colors">
           <div className="text-[6px] md:text-[8px] font-bold text-zinc-600 uppercase mb-1.5 text-center tracking-wider opacity-60 group-hover/col:opacity-100 transition-opacity">
              30-Day Stability
           </div>
           {/* Passed history directly; removed unsupported 'days' prop */}
           <div className="opacity-80 group-hover/col:opacity-100 transition-opacity">
              <StabilityRibbon history={history} loading={loading} />
           </div>
        </div>

        {/* BOTTOM TRASHCAN */}
        <div className={`h-[28px] md:h-[32px] border-t border-white/5 flex items-center justify-center transition-colors cursor-pointer group/trash ${isLeader ? 'bg-yellow-900/10 hover:bg-yellow-500/20' : 'bg-black/20 hover:bg-red-500/10'}`} onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            {isLeader ? (
                 <X size={10} className="md:w-3 md:h-3 text-yellow-600 group-hover/trash:text-yellow-400 transition-colors" />
            ) : (
                 <Trash2 size={10} className="md:w-3 md:h-3 text-red-500/80 group-hover/trash:text-red-500 transition-colors" />
            )}
        </div>
      </div>
    </div>
  );
};
