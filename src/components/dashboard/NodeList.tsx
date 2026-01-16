import { Star, HardDrive, Server, Coins, Clock, Activity, Globe } from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

// Fixed Uptime Helper
const formatUptime = (seconds: number) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const d = Math.floor(h / 24);
  
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Fixed Last Seen Helper
const formatLastSeen = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return 'Never';
  
  // Detect if timestamp is seconds (10 digits) or ms (13 digits)
  // Most blockchain timestamps are seconds, JS requires ms
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const diff = Date.now() - time;
  const sec = Math.floor(diff / 1000);
  
  if (sec < 0) return 'Just now'; // Clock skew protection
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

interface NodeListProps {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  favorites: string[];
}

export const NodeList = ({ nodes, onNodeClick, onToggleFavorite, favorites }: NodeListProps) => {
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col min-w-full bg-[#09090b]/40">
      
      {/* DESKTOP HEADER */}
      <div className="hidden md:grid grid-cols-[auto_2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-2 border-b border-zinc-800/50 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
        <div className="w-2"></div>
        <div>Identity</div>
        <div>Last Seen</div>
        <div>Version</div>
        <div>Health</div>
        <div className="text-right">Uptime</div>
        <div className="text-right">Storage</div>
        <div className="text-right">Credits</div>
        <div className="w-6"></div>
      </div>

      {/* DATA ROWS */}
      <div className="divide-y divide-zinc-800/30">
        {nodes.map((node) => {
          const isFav = favorites.includes(node.address || '');
          const statusColor = node.credits !== null ? 'bg-green-500' : 'bg-red-500';
          const countryCode = node.location?.countryCode;
          const health = node.health || 0;
          const isMainnet = node.network === 'MAINNET';

          // Color for Health text only
          const healthColor = health > 90 ? 'text-green-500' : health > 70 ? 'text-blue-500' : 'text-yellow-500';

          return (
            <div 
              key={node.pubkey || node.address}
              onClick={() => onNodeClick(node)}
              className="group relative cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              
              {/* --- DESKTOP LAYOUT --- */}
              <div className="hidden md:grid grid-cols-[auto_2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-3 items-center">
                
                {/* 1. Status */}
                <div className="flex items-center justify-center">
                   <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_6px_rgba(255,255,255,0.2)]`}></div>
                </div>

                {/* 2. Identity (Swap Logic) */}
                <div className="relative h-5 overflow-hidden">
                   {/* Default: Pubkey + Badge */}
                   <div className="absolute inset-0 flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <span className="font-mono text-xs text-zinc-300 font-bold truncate" title={node.pubkey}>
                        {node.pubkey || 'Unknown'}
                      </span>
                      <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider ${
                        isMainnet 
                          ? 'text-green-900 bg-green-500/20 border-green-500/30' 
                          : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                      }`}>
                        {isMainnet ? 'MN' : 'DN'}
                      </span>
                   </div>
                   {/* Hover: Flag + IP */}
                   <div className="absolute inset-0 flex items-center gap-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                      {countryCode && (
                        <img 
                          src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} 
                          alt={countryCode}
                          className="w-4 h-auto opacity-90 rounded-[2px]"
                        />
                      )}
                      <span className="font-mono text-xs text-white font-bold tracking-tight">
                        {getSafeIp(node)}
                      </span>
                   </div>
                </div>

                {/* 3. Last Seen */}
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                   <Clock size={10} />
                   <span>{formatLastSeen(node.last_seen_timestamp || 0)}</span>
                </div>

                {/* 4. Version (Truncated) */}
                <div className="font-mono text-[10px] text-zinc-400 truncate" title={node.version}>
                   {node.version}
                </div>

                {/* 5. Health (Text Only) */}
                <div className={`font-mono text-xs font-bold ${healthColor}`}>
                   {health}%
                </div>

                {/* 6. Uptime */}
                <div className="text-right font-mono text-[10px] text-zinc-400">
                   {formatUptime(node.uptime || 0)}
                </div>

                {/* 7. Storage (Stacked) */}
                <div className="flex flex-col items-end leading-none">
                   <div className="font-bold text-xs text-purple-400 font-mono mb-0.5">
                      {formatBytes(node.storage_committed)}
                   </div>
                   <div className="text-[9px] text-blue-500 font-mono">
                      {formatBytes(node.storage_used)}
                   </div>
                </div>

                {/* 8. Credits */}
                <div className="text-right font-mono text-[10px] text-zinc-500">
                   {node.credits?.toLocaleString() ?? 0}
                </div>

                {/* 9. Action */}
                <button 
                  onClick={(e) => onToggleFavorite(e, node.address || '')}
                  className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${isFav ? 'text-yellow-500' : 'text-zinc-600 hover:text-yellow-500'}`}
                >
                  <Star size={14} fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>


              {/* --- MOBILE LAYOUT (2-DECK STACK) --- */}
              <div className="flex md:hidden flex-col gap-2 p-3">
                 
                 {/* DECK 1: Identity & Storage (Primary) */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${statusColor}`}></div>
                       {/* Pubkey */}
                       <span className="font-mono text-xs font-bold text-white truncate w-32">
                          {node.pubkey ? `${node.pubkey.slice(0, 16)}...` : 'Unknown'}
                       </span>
                       {/* Badge */}
                       <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider shrink-0 ${
                          isMainnet 
                            ? 'text-green-900 bg-green-500/20 border-green-500/30' 
                            : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                        }`}>
                          {isMainnet ? 'MN' : 'DN'}
                       </span>
                    </div>

                    {/* Storage Stack */}
                    <div className="flex flex-col items-end leading-none shrink-0 pl-2">
                       <span className="font-bold text-xs text-purple-400 font-mono">{formatBytes(node.storage_committed)}</span>
                       <span className="text-[8px] text-blue-500 font-mono mt-0.5">{formatBytes(node.storage_used)}</span>
                    </div>
                 </div>

                 {/* DECK 2: Context Metrics (Secondary) */}
                 <div className="flex items-center justify-between pl-4.5">
                    
                    <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono overflow-hidden">
                       {/* Last Seen */}
                       <span className="flex items-center gap-1 shrink-0 text-zinc-400">
                          <Clock size={8} /> {formatLastSeen(node.last_seen_timestamp || 0)}
                       </span>
                       <span className="w-0.5 h-2 bg-zinc-800 shrink-0"></span>
                       
                       {/* Version */}
                       <span className="truncate max-w-[60px]">{node.version}</span>
                       <span className="w-0.5 h-2 bg-zinc-800 shrink-0"></span>
                       
                       {/* Uptime */}
                       <span>{formatUptime(node.uptime || 0)}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                       {/* Health */}
                       <span className={`text-[9px] font-bold ${healthColor}`}>{health}%</span>
                       
                       {/* Credits */}
                       <span className="text-[9px] text-zinc-600 font-mono">{node.credits?.toLocaleString() ?? 0} Cr</span>
                       
                       {/* Action */}
                       <button onClick={(e) => onToggleFavorite(e, node.address || '')} className="ml-1">
                          <Star size={12} className={isFav ? "text-yellow-500" : "text-zinc-700"} fill={isFav ? "currentColor" : "none"} />
                       </button>
                    </div>
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
