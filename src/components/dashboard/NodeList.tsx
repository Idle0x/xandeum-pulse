import { Star, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

// ... (Helpers formatUptime, formatLastSeen unchanged) ...
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
  if (sec < 600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

interface NodeListProps {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  favorites: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (metric: 'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits') => void;
}

export const NodeList = ({ 
  nodes, onNodeClick, onToggleFavorite, favorites, 
  sortBy, sortOrder, onSortChange 
}: NodeListProps) => {
  if (nodes.length === 0) return null;

  const HeaderCell = ({ label, metric, alignRight = false }: { label: string, metric?: 'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits', alignRight?: boolean }) => (
    <div 
      onClick={() => metric && onSortChange(metric)}
      className={`flex items-center gap-1 cursor-pointer transition-colors group select-none ${alignRight ? 'justify-end' : ''} ${sortBy === metric ? 'text-white' : 'hover:text-zinc-300'}`}
    >
      {label}
      {metric && (
        <div className={`transition-transform duration-300 ${sortBy === metric && sortOrder === 'asc' ? 'rotate-180' : ''}`}>
           <ArrowDown size={10} className={sortBy === metric ? 'text-blue-500' : 'text-zinc-700 group-hover:text-zinc-500'} />
        </div>
      )}
    </div>
  );

  // ALIGNMENT FIX: Synced with Header
  // 3rd col (Last Seen) shrunk to 1.0fr.
  // 4th, 5th, 6th, 7th, 8th cols increased to 1.1fr.
  // 9th col (Credits) fixed at 0.8fr.
  const gridClass = "grid-cols-[auto_2fr_1.0fr_1.1fr_1.1fr_1.1fr_1.0fr_1.0fr_0.8fr_auto]";

  return (
    <div className="flex flex-col min-w-full bg-[#09090b]/40">

      {/* --- DESKTOP HEADER (Interactive) --- */}
      <div className={`hidden md:grid ${gridClass} gap-4 px-5 py-3 border-b border-zinc-800/50 text-[9px] font-bold text-zinc-500 uppercase tracking-wider`}>
        <div className="w-2"></div>
        <div>Identity</div>
        <div className="cursor-default">Last Seen</div> 
        <HeaderCell label="Version" metric="version" />
        <HeaderCell label="Health" metric="health" />
        <HeaderCell label="Uptime" metric="uptime" alignRight />
        
        {/* Split Storage Headers */}
        <HeaderCell label="Comm." metric="storage" alignRight />
        <HeaderCell label="Used" metric="storage_used" alignRight />
        
        <HeaderCell label="Credits" metric="credits" alignRight />
        <div className="w-6"></div>
      </div>

      {/* --- DATA ROWS --- */}
      <div className="divide-y divide-zinc-800/30">
        {nodes.map((node, index) => {
          const isFav = favorites.includes(node.address || '');
          const statusColor = node.credits !== null ? 'bg-green-500' : 'bg-red-500';
          const countryCode = node.location?.countryCode;
          const showFlag = countryCode && countryCode !== 'XX';
          const health = node.health || 0;
          const isMainnet = node.network === 'MAINNET';
          const uniqueKey = node.pubkey ? `${node.pubkey}-${node.network}` : `fallback-${index}`;

          // --- SPOTLIGHT COLOR LOGIC ---
          const storageColorMain = sortBy === 'storage' ? 'text-purple-400' : 'text-zinc-500';
          const storageColorSub  = sortBy === 'storage_used' ? 'text-blue-400' : 'text-zinc-600';
          const uptimeColor = sortBy === 'uptime' ? 'text-orange-400' : 'text-zinc-400';
          const healthColor = sortBy === 'health' ? 'text-green-400' : 'text-zinc-400';
          const versionColor = sortBy === 'version' ? 'text-cyan-400' : 'text-zinc-400';
          const creditsColor = sortBy === 'credits' ? 'text-yellow-400' : 'text-zinc-500';

          return (
            <div 
              key={uniqueKey}
              onClick={() => onNodeClick(node)}
              className="group relative cursor-pointer hover:bg-white/[0.03] transition-colors"
            >

              {/* === DESKTOP ROW === */}
              <div className={`hidden md:grid ${gridClass} gap-4 px-5 py-3 items-center`}>
                {/* Status */}
                <div className="flex items-center justify-center">
                   <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_6px_rgba(255,255,255,0.2)]`}></div>
                </div>
                {/* Identity */}
                <div className="relative h-5 overflow-hidden">
                   <div className="absolute inset-0 flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <span className="font-mono text-xs text-zinc-300 font-bold truncate" title={node.pubkey}>{node.pubkey || 'Unknown'}</span>
                      <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider ${isMainnet ? 'text-green-900 bg-green-500/20 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>{isMainnet ? 'MN' : 'DN'}</span>
                   </div>
                   <div className="absolute inset-0 flex items-center gap-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                      {showFlag && <img src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt={countryCode} className="w-4 h-auto opacity-90 rounded-[2px]" />}
                      <span className="font-mono text-xs text-white font-bold tracking-tight">{getSafeIp(node)}</span>
                   </div>
                </div>
                {/* Last Seen */}
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                   <Clock size={10} /> <span>{formatLastSeen(node.last_seen_timestamp || 0)}</span>
                </div>
                {/* Version */}
                <div className={`font-mono text-[10px] truncate transition-colors duration-300 ${versionColor}`} title={node.version}>
                   {node.version}
                </div>
                {/* Health */}
                <div className={`font-mono text-xs font-bold transition-colors duration-300 ${healthColor}`}>
                   {health}%
                </div>
                {/* Uptime */}
                <div className={`text-right font-mono text-[10px] transition-colors duration-300 ${uptimeColor}`}>
                   {formatUptime(node.uptime || 0)}
                </div>
                {/* Committed */}
                <div className={`text-right font-bold text-xs font-mono transition-colors duration-300 ${storageColorMain}`}>
                   {formatBytes(node.storage_committed)}
                </div>
                {/* Used */}
                <div className={`text-right text-[9px] font-mono transition-colors duration-300 ${storageColorSub}`}>
                   {formatBytes(node.storage_used)}
                </div>
                {/* Credits */}
                <div className={`text-right font-mono text-[10px] ${creditsColor}`}>
                   {node.credits !== null ? node.credits.toLocaleString() : <span className="text-zinc-700">-</span>}
                </div>
                {/* Star */}
                <button onClick={(e) => onToggleFavorite(e, node.address || '')} className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${isFav ? 'text-yellow-500' : 'text-zinc-600 hover:text-yellow-500'}`}>
                  <Star size={14} fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>

              {/* === MOBILE ROW (RESTRUCTURED + HOVER RESTORED) === */}
              <div className="grid md:hidden grid-cols-[auto_1.5fr_0.8fr_0.5fr_1fr_auto] gap-3 px-4 py-3 items-center border-b border-zinc-800/20">
                 
                 {/* 1. Status Dot */}
                 <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`}></div>
                 
                 {/* 2. Identity Stack (RESTORED SLIDING ANIMATION) */}
                 <div className="flex flex-col min-w-0">
                     {/* Row 1: The Swapper (Key <-> Flag/IP) */}
                     <div className="relative h-5 overflow-hidden w-full mb-0.5">
                        {/* Slide 1: Public Key + Badge */}
                        <div className="absolute inset-0 flex items-center gap-1.5 transition-transform duration-300 group-hover:-translate-y-full">
                           <span className="font-mono text-xs font-bold text-white truncate w-full">{node.pubkey ? `${node.pubkey.slice(0, 8)}...` : 'Unknown'}</span>
                           <span className={`text-[6px] px-1 rounded border uppercase font-bold ${isMainnet ? 'text-green-500 border-green-900' : 'text-blue-500 border-blue-900'}`}>{isMainnet ? 'MN' : 'DN'}</span>
                        </div>
                        {/* Slide 2: Flag + IP */}
                        <div className="absolute inset-0 flex items-center gap-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                           {showFlag && <img src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt={countryCode} className="w-3 h-auto opacity-90 rounded-[2px]" />}
                           <span className="font-mono text-[10px] text-zinc-300 font-bold truncate">{getSafeIp(node)}</span>
                        </div>
                     </div>

                     {/* Row 2: Version (Static) */}
                     <div className={`font-mono text-[9px] truncate transition-colors duration-300 ${versionColor}`}>
                        v{node.version || '0.0.0'}
                     </div>
                 </div>

                 {/* 3. Time Stack */}
                 <div className="flex flex-col items-start leading-none gap-1">
                    <span className={`font-mono text-[9px] transition-colors duration-300 ${uptimeColor}`}>{formatUptime(node.uptime || 0)}</span>
                    <span className="font-mono text-[8px] text-zinc-600">{formatLastSeen(node.last_seen_timestamp || 0).replace(' ago', '')}</span>
                 </div>
                 
                 {/* 4. Health/Credits Stack */}
                 <div className="flex flex-col items-center leading-none gap-1">
                    <div className={`font-mono text-[10px] font-bold transition-colors duration-300 ${healthColor}`}>
                        {health}%
                    </div>
                    <div className={`font-mono text-[8px] ${creditsColor}`}>
                        {node.credits !== null ? node.credits.toLocaleString() : '-'}
                    </div>
                 </div>
                 
                 {/* 5. Storage Stack */}
                 <div className="flex flex-col items-end leading-none">
                     <span className={`font-bold text-[10px] font-mono transition-colors duration-300 ${storageColorMain}`}>{formatBytes(node.storage_committed)}</span>
                     <span className={`text-[8px] font-mono mt-0.5 transition-colors duration-300 ${storageColorSub}`}>{formatBytes(node.storage_used)}</span>
                 </div>
                 
                 {/* 6. Star */}
                 <button onClick={(e) => onToggleFavorite(e, node.address || '')} className="pl-1">
                    <Star size={12} className={isFav ? "text-yellow-500" : "text-zinc-700"} fill={isFav ? "currentColor" : "none"} />
                 </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
