import { Star, HardDrive, Server, Activity, Coins, Globe } from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

interface NodeListProps {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  favorites: string[];
}

export const NodeList = ({ nodes, onNodeClick, onToggleFavorite, favorites }: NodeListProps) => {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <div className="text-zinc-500 font-mono text-sm">No nodes found matching criteria.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-800/50">
      {nodes.map((node) => {
        const isFav = favorites.includes(node.address || '');
        const isMainnet = node.network === 'MAINNET';
        const statusColor = node.credits !== null ? 'bg-green-500' : 'bg-red-500';
        const countryCode = node.location?.countryCode;

        return (
          <div 
            key={node.pubkey || node.address}
            onClick={() => onNodeClick(node)}
            className="group relative flex flex-col md:flex-row md:items-center justify-between p-3 md:px-5 hover:bg-white/[0.02] transition-colors cursor-pointer gap-2 md:gap-4"
          >
            {/* --- LEFT: IDENTITY & CONTEXT --- */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              
              {/* Status Dot */}
              <div className="relative shrink-0 pt-1 md:pt-0">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_8px_rgba(255,255,255,0.1)]`}></div>
              </div>

              {/* Identity Block (Swap Logic on Hover) */}
              <div className="min-w-0 flex-1 relative group/identity">
                
                {/* DEFAULT VIEW: Public Key */}
                <div className="flex items-center gap-2 transition-all duration-300 md:group-hover/identity:opacity-0 md:group-hover/identity:-translate-y-2">
                  <span className="text-xs md:text-sm font-bold text-zinc-200 font-mono tracking-tight truncate">
                    {node.pubkey ? `${node.pubkey.slice(0, 24)}...` : 'Unknown Key'}
                  </span>
                  <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider ${
                    isMainnet 
                      ? 'text-green-900 bg-green-500/20 border-green-500/30' 
                      : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                  }`}>
                    {isMainnet ? 'MN' : 'DN'}
                  </span>
                </div>

                {/* HOVER VIEW: IP + Country (Desktop Only) */}
                <div className="hidden md:flex absolute inset-0 items-center gap-2 opacity-0 translate-y-2 transition-all duration-300 md:group-hover/identity:opacity-100 md:group-hover/identity:translate-y-0">
                  {countryCode && (
                    <img 
                      src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} 
                      alt={countryCode}
                      className="w-4 h-auto opacity-80"
                    />
                  )}
                  <span className="text-sm font-bold text-white font-mono tracking-tight">
                    {getSafeIp(node)}
                  </span>
                </div>

                {/* MOBILE SECONDARY ROW: Version + IP */}
                <div className="flex md:hidden items-center gap-3 mt-1 text-[9px] text-zinc-600 font-mono">
                   <span className="flex items-center gap-1"><Server size={8} /> v{node.version}</span>
                   <span className="flex items-center gap-1"><Globe size={8} /> {getSafeIp(node)}</span>
                </div>
              </div>
            </div>

            {/* --- RIGHT: METRICS STRIP --- */}
            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto pl-4 md:pl-0">
              
              {/* DESKTOP: Version (Hidden on Mobile, shown in bottom deck above) */}
              <div className="hidden md:block text-right w-24">
                 <div className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Version</div>
                 <div className="font-mono text-xs text-zinc-400">v{node.version}</div>
              </div>

              {/* UPTIME (Tiny on mobile, Full on Desktop) */}
              <div className="text-left md:text-right w-20 md:w-24">
                 <div className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5 md:hidden">Uptime</div>
                 <div className="text-[9px] md:text-[9px] text-zinc-500 uppercase font-bold mb-0.5 hidden md:block">Uptime</div>
                 <div className="font-mono text-xs text-zinc-400">{(node.uptime ? (node.uptime / 3600).toFixed(1) : 0)}h</div>
              </div>

              {/* STORAGE (Purple Highlight) */}
              <div className="text-right w-24">
                 <div className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5 flex items-center justify-end gap-1">
                    <HardDrive size={8} className="text-purple-500" /> <span className="hidden md:inline">Storage</span>
                 </div>
                 <div className="font-mono text-xs md:text-sm font-bold text-purple-400">
                    {formatBytes(node.storage_committed)}
                 </div>
              </div>

              {/* CREDITS (Subtle) */}
              <div className="text-right w-20">
                 <div className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5 flex items-center justify-end gap-1">
                    <Coins size={8} className="text-yellow-600" /> <span className="hidden md:inline">Credits</span>
                 </div>
                 <div className="font-mono text-[9px] md:text-xs text-zinc-500">
                    {node.credits?.toLocaleString() ?? 0}
                 </div>
              </div>

              {/* STAR ACTION */}
              <button 
                onClick={(e) => onToggleFavorite(e, node.address || '')}
                className={`p-2 rounded-lg transition-all ${isFav ? 'text-yellow-500 bg-yellow-500/10 opacity-100' : 'text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
              >
                <Star size={14} fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
};
