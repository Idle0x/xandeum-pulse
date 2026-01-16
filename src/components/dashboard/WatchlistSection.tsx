import { useState } from 'react';
import { 
  ChevronDown, ChevronRight, HardDrive, Star, Activity, Coins 
} from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

interface WatchlistSectionProps {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
}

export const WatchlistSection = ({ nodes, onNodeClick, onToggleFavorite }: WatchlistSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate summary metrics for the header
  const totalStorage = nodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
  const activeCount = nodes.filter(n => n.credits !== null).length;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* --- HEADER (Click to toggle) --- */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-300 border border-zinc-800 rounded-xl bg-gradient-to-b from-zinc-900 to-black hover:border-zinc-700 group ${isExpanded ? 'rounded-b-none border-b-0' : 'shadow-lg hover:shadow-xl'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 transition-all duration-300 ${isExpanded ? 'bg-yellow-500/20 text-yellow-400' : ''}`}>
            <Star size={16} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Watchlist Rack
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                {nodes.length}
              </span>
            </h3>
            {!isExpanded && (
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Activity size={8} /> {activeCount} Active</span>
                <span className="w-0.5 h-2 bg-zinc-800"></span>
                <span className="flex items-center gap-1"><HardDrive size={8} /> {formatBytes(totalStorage)} Monitored</span>
              </p>
            )}
          </div>
        </div>

        <div className="text-zinc-500 group-hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* --- THE RACK (Collapsible Body) --- */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out border-x border-b border-zinc-800 rounded-b-xl bg-[#050505] shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 border-none'}`}
      >
        <div className="flex flex-col divide-y divide-white/5">
          {nodes.map((node) => {
            const isMainnet = node.network === 'MAINNET';
            const statusColor = node.credits !== null ? 'bg-green-500' : 'bg-red-500';
            
            return (
              <div 
                key={node.pubkey || node.address}
                onClick={() => onNodeClick(node)}
                className="group flex items-center justify-between p-3 md:px-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                {/* LEFT: Identity */}
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  {/* Status LED */}
                  <div className="relative shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></div>
                  </div>
                  
                  {/* Info */}
                  <div className="min-w-0">
                    {/* TOP ROW: Pubkey (Prominent) + Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300 truncate font-mono tracking-tight group-hover:text-white transition-colors" title={node.pubkey}>
                        {node.pubkey ? `${node.pubkey.slice(0, 16)}...` : 'Unknown Key'}
                      </span>
                      {/* Network Badge */}
                      <span className={`text-[7px] px-1 rounded border uppercase font-bold tracking-wider ${
                        isMainnet 
                          ? 'text-green-900 bg-green-500/20 border-green-500/30' 
                          : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                      }`}>
                        {isMainnet ? 'MN' : 'DN'}
                      </span>
                    </div>
                    {/* BOTTOM ROW: IP Address (Subtitle) */}
                    <div className="text-[9px] text-zinc-600 font-mono truncate">
                      {getSafeIp(node)}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Storage, Credits & Actions */}
                <div className="flex items-center gap-4 md:gap-6 pl-4 shrink-0">
                  {/* Metrics Cluster */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-500 uppercase font-bold mb-0.5">
                      <HardDrive size={10} className="text-purple-500" /> 
                      <span className="hidden md:inline">Committed</span>
                    </div>
                    <div className="flex items-baseline justify-end gap-2">
                        {/* Storage (Always Purple) */}
                        <div className="font-mono text-xs md:text-sm font-bold text-purple-400">
                          {formatBytes(node.storage_committed)}
                        </div>
                        {/* Credits (Tiny, Subtle) */}
                        <div className="font-mono text-[8px] text-zinc-500 flex items-center gap-0.5">
                           {node.credits?.toLocaleString() ?? 0} Cr
                        </div>
                    </div>
                  </div>

                  {/* Unstar Button */}
                  <button 
                    onClick={(e) => onToggleFavorite(e, node.address || '')}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove from watchlist"
                  >
                    <Star size={14} fill="currentColor" className="text-yellow-600 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Empty State / Footer of Rack */}
          {nodes.length === 0 && (
            <div className="p-8 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
              Rack Empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
