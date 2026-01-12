import { 
  Shield, Star, Maximize2, CheckCircle, 
  AlertTriangle, Medal, Wallet, AlertOctagon 
} from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, compareVersions } from '../../../utils/nodeHelpers';
import { useCardCycle } from '../../../hooks/useCardCycle';

interface NodeCardProps {
  node: Node;
  onClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  isFav: boolean;
  cycleStep: number;
  zenMode: boolean;
  mostCommonVersion: string;
  sortBy: string;
}

export const NodeCard = ({ 
  node, 
  onClick, 
  onToggleFavorite, 
  isFav, 
  cycleStep, 
  zenMode, 
  mostCommonVersion,
  sortBy 
}: NodeCardProps) => {
  const cycleData = useCardCycle(node, cycleStep, zenMode);
  const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` : null;
  
  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;
  const isVersionSort = sortBy === 'version';

  // --- MOBILE LAYOUT ---
  const MobileCard = (
    <div
      onClick={() => onClick(node)}
      className={`md:hidden group relative border rounded-xl p-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        zenMode ? 'bg-black border-zinc-800 hover:border-zinc-600' : isFav ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
      }`}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition duration-300 text-[8px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/80 px-1.5 py-0.5 rounded-full border border-blue-500/20 z-10">
        <Maximize2 size={8} />
      </div>

      <div className="mb-2 flex justify-between items-start">
        <div className="overflow-hidden pr-2 w-full">
          <div className="flex items-center gap-1.5 mb-1">
            {node.network === 'MAINNET' && <span className="text-[7px] bg-green-500 text-black px-1 rounded font-bold uppercase">MN</span>}
            {node.network === 'DEVNET' && <span className="text-[7px] bg-blue-500 text-white px-1 rounded font-bold uppercase">DN</span>}
            {node.network === 'UNKNOWN' && <span className="text-[7px] bg-zinc-700 text-zinc-300 px-1 rounded font-bold uppercase">UNK</span>}
            {!node.is_public && <Shield size={8} className="text-zinc-600" />}
          </div>

          <div className="relative h-4 w-full">
             <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 flex items-center">
                <span className="font-mono text-[10px] text-zinc-300 truncate w-full">{node.pubkey?.slice(0,12)}...</span>
             </div>
             <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center gap-1.5">
                 {flagUrl && <img src={flagUrl} className="w-3 h-auto rounded-sm shrink-0" />}
                 <span className="font-mono text-[10px] text-blue-400 truncate">{getSafeIp(node)}</span>
             </div>
          </div>
        </div>

        <button onClick={(e) => onToggleFavorite(e, node.address || '')} className={`p-1.5 rounded-full transition-all duration-200 shrink-0 active:scale-90 ${isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-600 hover:text-yellow-500 hover:bg-zinc-800'}`}>
          <Star size={14} strokeWidth={isFav ? 2.5 : 2} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[9px]">
          <span className="text-zinc-500">Ver</span>
          <span className={`px-1.5 py-0.5 rounded transition-all duration-500 ${
            isVersionSort ? 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-zinc-900 border' : 'text-zinc-300 bg-zinc-800'
          }`}>
            {node.version || 'Unknown'} {isLatest && <CheckCircle size={8} className="inline text-green-500 ml-0.5"/>}
          </span>
        </div>

        <div className="pt-1">
          <div className={`flex justify-between items-center text-[9px] p-1 rounded-lg border transition-colors ${
            (node as any).isUntracked 
              ? 'bg-zinc-900/50 border-zinc-800' 
              : node.credits !== null 
                ? 'bg-black/40 border-zinc-800/50' 
                : 'bg-red-900/10 border-red-500/20'
          }`}>
            {(node as any).isUntracked ? (
              <div className="flex items-center gap-1 text-zinc-500 w-full justify-center font-bold tracking-wide">
                <AlertTriangle size={8} /> No Cr
              </div>
            ) : node.credits !== null ? (
              <>
                <div className="flex items-center gap-1">
                  <Medal size={8} className={node.rank===1?'text-yellow-400':'text-zinc-500'} />
                  <span className="text-zinc-400 font-bold">#{node.rank}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300 font-mono">{(node.credits >= 1000 ? (node.credits/1000).toFixed(1) + 'k' : node.credits)}</span>
                  <Wallet size={8} className="text-yellow-600"/>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-red-400 w-full justify-center font-bold italic">
                <AlertOctagon size={8}/> Offline
              </div>
            )}
          </div>
        </div>

        <div className="pt-1 mt-1 border-t border-white/5 flex justify-between items-end">
          <div>
            <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1">
              <cycleData.icon size={8} /> {cycleData.label}
            </span>
            <span className={`text-xs font-bold ${cycleData.color} font-mono tracking-tight`}>
              {cycleData.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- DESKTOP LAYOUT ---
  const DesktopCard = (
    <div
      onClick={() => onClick(node)}
      className={`hidden md:block group relative border rounded-xl p-3 md:p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        zenMode ? 'bg-black border-zinc-800 hover:border-zinc-600' : isFav ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
      }`}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
        View Details <Maximize2 size={8} />
      </div>

      <div className="mb-2 md:mb-4 flex justify-between items-start">
        <div className="overflow-hidden pr-2 w-full">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>
            {!node.is_public && <Shield size={10} className="text-zinc-600" />}
            {node.network === 'MAINNET' && <span className="text-[8px] bg-green-500 text-black px-1 rounded font-bold uppercase">MAINNET</span>}
            {node.network === 'DEVNET' && <span className="text-[8px] bg-blue-500 text-white px-1 rounded font-bold uppercase">DEVNET</span>}
            {node.network === 'UNKNOWN' && <span className="text-[8px] bg-zinc-700 text-zinc-300 px-1 rounded font-bold uppercase">UNKNOWN</span>}
          </div>

          <div className="relative h-6 w-full">
             <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 flex items-center">
                <span className="font-mono text-xs md:text-sm text-zinc-300 truncate w-full">{node.pubkey?.slice(0,16)}...</span>
             </div>
             <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center gap-2">
                 {flagUrl && <img src={flagUrl} className="w-4 h-auto rounded-sm shrink-0" />}
                 <span className="font-mono text-xs md:text-sm text-blue-400 truncate">{getSafeIp(node)}</span>
             </div>
          </div>
        </div>

        <button onClick={(e) => onToggleFavorite(e, node.address || '')} className={`p-3 rounded-full transition-all duration-200 shrink-0 active:scale-90 ${isFav ? 'text-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-zinc-600 hover:text-yellow-500 hover:bg-zinc-800'}`} style={{ minWidth: '44px', minHeight: '44px' }}>
          <Star size={24} strokeWidth={isFav ? 2.5 : 2} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="space-y-1.5 md:space-y-3">
        <div className="flex justify-between items-center text-[10px] md:text-xs">
          <span className="text-zinc-500">Version</span>
          <span className={`px-2 py-0.5 rounded transition-all duration-500 ${
            isVersionSort ? 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-zinc-900 border' : 'text-zinc-300 bg-zinc-800'
          }`}>
            {node.version || 'Unknown'} {isLatest && <CheckCircle size={10} className="inline text-green-500 ml-1"/>}
          </span>
        </div>

        <div className="pt-1 md:pt-2">
          <div className="text-[9px] md:text-[10px] text-zinc-600 uppercase font-bold mb-1">Network Rewards</div>
          <div className={`flex justify-between items-center text-[10px] md:text-xs p-1.5 md:p-2 rounded-lg border transition-colors ${
            (node as any).isUntracked 
              ? 'bg-zinc-900/50 border-zinc-800' 
              : node.credits !== null 
                ? 'bg-black/40 border-zinc-800/50' 
                : 'bg-red-900/10 border-red-500/20'
          }`}>
            {(node as any).isUntracked ? (
              <div className="flex items-center gap-2 text-zinc-500 w-full justify-center font-bold text-[9px] md:text-[10px] tracking-wide">
                <AlertTriangle size={10} className="text-zinc-600"/> NO STORAGE CREDITS
              </div>
            ) : node.credits !== null ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Medal size={10} className={node.rank===1?'text-yellow-400':'text-zinc-500'} />
                  <span className="text-zinc-400 font-bold">#{node.rank}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-300 font-mono">{node.credits.toLocaleString()}</span>
                  <Wallet size={10} className="text-yellow-600"/>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-red-400 w-full justify-center font-bold italic text-[9px] md:text-[10px]">
                <AlertOctagon size={10}/> CREDITS API OFFLINE
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 md:pt-3 mt-2 md:mt-3 border-t border-white/5 flex justify-between items-end">
          <div>
            <span className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1">
              <cycleData.icon size={10} /> {cycleData.label}
            </span>
            <span className={`text-sm md:text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>
              {cycleData.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {MobileCard}
      {DesktopCard}
    </>
  );
};
