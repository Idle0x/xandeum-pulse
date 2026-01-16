import { Star, HardDrive, Server, Coins, Clock, Activity, Globe } from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

const formatUptime = (seconds: number) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatLastSeen = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return 'Never';
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const diff = Date.now() - time;
  const sec = Math.floor(diff / 1000);
  if (sec < 0) return 'Just now';
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
      
      {/* DESKTOP HEADER - ABSOLUTE COLUMNS */}
      <div className="hidden md:grid grid-cols-[10px_2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-2 border-b border-zinc-800/50 text-[9px] font-bold text-zinc-500 uppercase tracking-wider items-center">
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

          return (
            <div 
              key={node.pubkey || node.address}
              onClick={() => onNodeClick(node)}
              className="group relative cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              
              {/* --- DESKTOP LAYOUT (STRICT GRID) --- */}
              <div className="hidden md:grid grid-cols-[10px_2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-3 items-center">
                
                {/* 1. Status */}
                <div className="flex justify-center">
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
                      {countryCode ? (
                        <img 
                          src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} 
                          alt={countryCode}
                          className="w-4 h-auto opacity-90 rounded-[2px]"
                        />
                      ) : (
                        <Globe size={14} className="text-zinc-600" />
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

                {/* 4. Version */}
                <div className="font-mono text-[10px] text-zinc-400 truncate" title={node.version}>
                   {node.version}
                </div>

                {/* 5. Health (Pure White) */}
                <div className="font-mono text-xs font-bold text-zinc-300">
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


              {/* --- MOBILE LAYOUT (STRICT GRID) --- */}
              <div className="flex md:hidden flex-col gap-2 p-3">
                 
                 {/* DECK 1: Identity (Grid: Status | Pubkey | Storage) */}
                 <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                    {/* Status */}
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${statusColor}`}></div>
                    
                    {/* Identity Container (With Hover/Reveal Logic) */}
                    <div className="relative h-4 overflow-hidden group/mobile">
                        {/* Default: Pubkey */}
                        <div className="absolute inset-0 flex items-center gap-2 transition-transform duration-300 group-active:-translate-y-full">
                           <span className="font-mono text-xs font-bold text-white truncate w-32 sm:w-48">
                              {node.pubkey ? `${node.pubkey.slice(0, 16)}...` : 'Unknown'}
                           </span>
                           <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider shrink-0 ${
                              isMainnet ? 'text-green-900 bg-green-500/20 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                           }`}>
                              {isMainnet ? 'MN' : 'DN'}
                           </span>
                        </div>
                        {/* Tap/Active: IP + Flag */}
                        <div className="absolute inset-0 flex items-center gap-2 translate-y-full transition-transform duration-300 group-active:translate-y-0">
                           {countryCode ? (
                              <img src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt={countryCode} className="w-3 h-auto rounded-[1px]" />
                           ) : <Globe size={12} className="text-zinc-600"/>}
                           <span className="font-mono text-xs text-zinc-200 font-bold">{getSafeIp(node)}</span>
                        </div>
                    </div>

                    {/* Storage Stack */}
                    <div className="flex flex-col items-end leading-none">
                       <span className="font-bold text-xs text-purple-400 font-mono">{formatBytes(node.storage_committed)}</span>
                       <span className="text-[8px] text-blue-500 font-mono mt-0.5">{formatBytes(node.storage_used)}</span>
                    </div>
                 </div>

                 {/* DECK 2: Metrics (Strict Grid for Absolute Alignment) */}
                 <div className="grid grid-cols-4 gap-2 pl-4.5 text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-2 mt-1">
                    
                    {/* Col 1: Last Seen */}
                    <div className="flex items-center gap-1.5 truncate">
                       <Clock size={8} className="shrink-0" />
                       <span className="truncate">{formatLastSeen(node.last_seen_timestamp || 0)}</span>
                    </div>
                    
                    {/* Col 2: Version */}
                    <div className="truncate text-zinc-400" title={node.version}>
                       {node.version}
                    </div>

                    {/* Col 3: Uptime & Health */}
                    <div className="flex items-center gap-2 truncate">
                       <span>{formatUptime(node.uptime || 0)}</span>
                       <span className="text-zinc-300 font-bold">| {health}%</span>
                    </div>

                    {/* Col 4: Action & Credits */}
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-zinc-600">{node.credits?.toLocaleString() ?? 0} Cr</span>
                       <button onClick={(e) => onToggleFavorite(e, node.address || '')}>
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
