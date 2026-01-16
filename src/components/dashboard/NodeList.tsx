import { Star, HardDrive, Server, Coins, Clock, Zap } from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';
import { useTimeAgo } from '../../hooks/useTimeAgo'; // You likely have this, if not I'll use a simple helper below

// Helper for Uptime (e.g. 0.4h -> 24m)
const formatUptime = (seconds: number) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const d = Math.floor(h / 24);
  
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Helper for simple "time ago" if hook isn't available
const timeAgo = (timestamp: number) => {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
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
      {/* HEADER ROW (Desktop Only) */}
      <div className="hidden md:grid grid-cols-[auto_2fr_1.2fr_1.2fr_1fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-2 border-b border-zinc-800/50 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
        <div className="w-2"></div> {/* Status Dot */}
        <div>Identity</div>
        <div>Activity</div>
        <div>Version</div>
        <div>Health</div>
        <div className="text-right">Uptime</div>
        <div className="text-right">Storage</div>
        <div className="text-right">Credits</div>
        <div className="w-6"></div> {/* Star */}
      </div>

      {/* DATA ROWS */}
      <div className="divide-y divide-zinc-800/30">
        {nodes.map((node) => {
          const isFav = favorites.includes(node.address || '');
          const statusColor = node.credits !== null ? 'bg-green-500' : 'bg-red-500';
          const countryCode = node.location?.countryCode;
          const health = node.health || 0;
          
          // Health Bar Color Logic
          const healthColor = health > 90 ? 'bg-green-500' : health > 70 ? 'bg-blue-500' : 'bg-yellow-500';

          return (
            <div 
              key={node.pubkey || node.address}
              onClick={() => onNodeClick(node)}
              className="group relative cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              {/* --- DESKTOP LAYOUT (CSS GRID) --- */}
              <div className="hidden md:grid grid-cols-[auto_2fr_1.2fr_1.2fr_1fr_0.8fr_1.2fr_0.8fr_auto] gap-4 px-5 py-3 items-center">
                
                {/* 1. Status */}
                <div className="flex items-center justify-center">
                   <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_6px_rgba(255,255,255,0.2)]`}></div>
                </div>

                {/* 2. Identity (Swap on Row Hover) */}
                <div className="relative h-5 overflow-hidden">
                   {/* Default: Pubkey */}
                   <div className="absolute inset-0 flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <span className="font-mono text-xs text-zinc-300 font-bold truncate" title={node.pubkey}>
                        {node.pubkey || 'Unknown'}
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

                {/* 3. Activity */}
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                   <Clock size={10} />
                   <span>{timeAgo(node.last_seen_timestamp || 0)}</span>
                </div>

                {/* 4. Version (Strict Truncation) */}
                <div className="font-mono text-[10px] text-zinc-400 truncate" title={node.version}>
                   {node.version}
                </div>

                {/* 5. Health Bar */}
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${healthColor}`} style={{ width: `${health}%` }}></div>
                   </div>
                   <span className="text-[10px] font-mono text-zinc-300">{health}%</span>
                </div>

                {/* 6. Uptime */}
                <div className="text-right font-mono text-[10px] text-zinc-400">
                   {formatUptime(node.uptime || 0)}
                </div>

                {/* 7. Storage (Stacked: Purple/Blue) */}
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

                {/* 9. Action (Always Visible) */}
                <button 
                  onClick={(e) => onToggleFavorite(e, node.address || '')}
                  className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${isFav ? 'text-yellow-500' : 'text-zinc-600 hover:text-yellow-500'}`}
                >
                  <Star size={14} fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>


              {/* --- MOBILE LAYOUT (STACKED STRIP) --- */}
              <div className="flex md:hidden flex-col gap-2 p-3">
                 {/* Top Deck: Primary Info */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></div>
                       <span className="font-mono text-xs font-bold text-white truncate w-32">
                          {node.pubkey ? `${node.pubkey.slice(0, 12)}...` : 'Unknown'}
                       </span>
                    </div>
                    {/* Storage Stacked */}
                    <div className="flex flex-col items-end leading-none">
                       <span className="font-bold text-xs text-purple-400 font-mono">{formatBytes(node.storage_committed)}</span>
                       <span className="text-[8px] text-blue-500 font-mono mt-0.5">{formatBytes(node.storage_used)}</span>
                    </div>
                 </div>

                 {/* Bottom Deck: Context */}
                 <div className="flex items-center justify-between pl-4.5">
                    <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono">
                       <span className="flex items-center gap-1"><Server size={8} /> {node.version?.split('-')[0]}</span>
                       <span className="w-0.5 h-2 bg-zinc-800"></span>
                       <span>{formatUptime(node.uptime || 0)} up</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] text-zinc-600 font-mono">{node.credits?.toLocaleString() ?? 0} Cr</span>
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
