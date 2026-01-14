import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  X, Star, Check, Copy, Shield, Maximize2, HelpCircle, Minimize2, 
  Database, Server, Trophy, Globe, Clock, Link as LinkIcon, 
  Swords, Camera, Activity, CheckCircle, AlertTriangle,
  ArrowUpRight, MapPin
} from 'lucide-react';
import { Node } from '../../types';
import { ModalAvatar } from '../common/ModalAvatar';
import { RadialProgress } from '../RadialProgress'; 
import { formatBytes, formatUptime } from '../../utils/formatters';
import { useTimeAgo } from '../../hooks/useTimeAgo'; 
import { getSafeIp, getSafeVersion, checkIsLatest } from '../../utils/nodeHelpers'; 
import { IdentityView } from './views/IdentityView';
import { HealthView } from './views/HealthView';
import { StorageView } from './views/StorageView';
import { ShareProof } from './ShareProof';
import { VersusMode } from './VersusMode';
import Link from 'next/link';

interface InspectorModalProps {
  selectedNode: Node;
  onClose: () => void;
  zenMode: boolean;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  nodes: Node[];
  networkStats: any;
  medianCommitted: number;
  totalStorageCommitted: number;
  mostCommonVersion: string;
  onShowToast: (msg: string) => void;
}

const getFlagEmoji = (countryCode: string | undefined) => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const InspectorModal = ({
  selectedNode,
  onClose,
  zenMode,
  favorites,
  onToggleFavorite,
  nodes,
  networkStats,
  medianCommitted,
  totalStorageCommitted,
  mostCommonVersion,
  onShowToast
}: InspectorModalProps) => {
  const router = useRouter();
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage' | 'identity'>('overview');
  const [mode, setMode] = useState<'VIEW' | 'COMPARE' | 'SHARE'>('VIEW');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setModalView('overview');
    setMode('VIEW');
  }, [selectedNode.pubkey]);

  const timeAgo = useTimeAgo(selectedNode.last_seen_timestamp);
  const isSelectedNodeLatest = checkIsLatest(selectedNode.version, mostCommonVersion);
  const avgNetworkHealth = networkStats?.avgBreakdown?.total || 0;

  // --- SIBLINGS LOGIC ---
  const siblingCount = nodes.filter(n => 
    n.pubkey === selectedNode.pubkey && 
    n.network === selectedNode.network && 
    n.address !== selectedNode.address
  ).length;

  // --- STRICT NAVIGATION GUARD ---
  const handleLeaderboardNav = (e: React.MouseEvent) => {
    e.stopPropagation();

    if ((selectedNode as any).isUntracked) {
       onShowToast("This node is currently not receiving storage credits from the protocol. It may be in a proving phase.");
       return;
    }

    if (selectedNode.credits === null) {
       onShowToast("The Credits API is currently offline. Leaderboard data is unavailable.");
       return;
    }

    if (selectedNode.pubkey) {
        router.push(`/leaderboard?highlight=${selectedNode.pubkey}`);
    } else {
        router.push('/leaderboard');
    }
  };

  const handleCardToggle = (view: 'health' | 'storage' | 'identity') => {
     setModalView(modalView === view ? 'overview' : view);
  };

  // --- HEALTH & STORAGE CALCULATIONS ---
  const healthScore = selectedNode.health || 0;
  const healthStatusLabel = healthScore >= 80 ? 'OPTIMAL' : 'FAIR'; 
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500';
  const healthGlowColor = healthScore >= 80 ? 'bg-green-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  const healthRingColor = healthScore >= 80 ? 'ring-green-500/20 hover:ring-green-500/60' : healthScore >= 50 ? 'ring-yellow-500/20 hover:ring-yellow-500/60' : 'ring-red-500/20 hover:ring-red-500/60';
  const identityRingColor = isSelectedNodeLatest ? 'ring-green-500/20 hover:ring-green-500/60' : 'ring-orange-500/20 hover:ring-orange-500/60';

  const nodeCap = selectedNode.storage_committed || 0;
  const tankFillPercent = Math.min(100, (nodeCap / (medianCommitted || 1)) * 100);

  // Helper to split value and unit safely
  const getStorageDisplay = (bytes: number) => {
    const formatted = formatBytes(bytes);
    const parts = formatted.split(' ');
    return { val: parts[0], unit: parts[1] || '' };
  };

  // FIX: Added '|| 0' to handle potential undefined values
  const usedDisplay = getStorageDisplay(selectedNode.storage_used || 0);
  const committedDisplay = getStorageDisplay(selectedNode.storage_committed || 0);

  // --- REPUTATION VISUALS ---
  const rank = selectedNode.rank || 0;
  let hoverShimmerGradient = "via-blue-400/20"; 
  if (rank > 0 && rank <= 100) hoverShimmerGradient = "via-yellow-300/30"; 
  else if (rank > 0 && rank <= 1000) hoverShimmerGradient = "via-slate-300/30";

  const isValidReputation = !((selectedNode as any).isUntracked || selectedNode.credits === null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shimmerOnceAnimation = "group-hover:animate-[shimmer-once_2.5s_forwards]";
  const breatheAnimation = "animate-[slow-breathe_5s_infinite_ease-in-out]";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={onClose}>
        <style jsx global>{`
        @keyframes shimmer-once {
            0% { transform: translateX(-150%) skewX(-12deg); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateX(150%) skewX(-12deg); opacity: 0; }
        }
        @keyframes slow-pulse { 0%, 100% { opacity: 0.05; transform: scale(0.98); } 50% { opacity: 0.15; transform: scale(1.02); } }
        @keyframes slow-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.92); opacity: 0.7; } }
        `}</style>
      <div className={`border w-full max-w-4xl 2xl:max-w-6xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] md:max-h-[90vh] ${zenMode ? 'bg-black border-zinc-800 shadow-none' : 'bg-[#09090b] border-zinc-800'}`} onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className={`shrink-0 border-b ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'}`}>
          {/* MOBILE HEADER */}
          <div className="md:hidden p-3 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="scale-75 origin-left"><ModalAvatar node={selectedNode} /></div>
                <h2 className="text-base font-black font-sans tracking-tight text-white">NODE INSPECTOR</h2>
                <button onClick={onClose} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition"><X size={16} /></button>
             </div>
             <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-900/80 px-2 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">{selectedNode.pubkey ? `${selectedNode.pubkey.slice(0, 12)}...` : 'Unknown'}</span>
                  <button onClick={() => copyToClipboard(selectedNode.pubkey || '', 'pubkey')} className="hover:text-white transition">{copiedField === 'pubkey' ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}</button>
                </div>
                <button onClick={(e) => onToggleFavorite(e, selectedNode.address || '')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-[10px] font-bold uppercase ${favorites.includes(selectedNode.address || '') ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <Star size={12} className={favorites.includes(selectedNode.address || '') ? 'fill-yellow-500' : ''} />
                  {favorites.includes(selectedNode.address || '') ? 'Saved' : 'Watchlist'}
                </button>
             </div>
             <div className="flex justify-start">
               <span className={`text-[9px] font-bold px-2 py-0.5 rounded border w-fit ${selectedNode.is_public ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                  {selectedNode.is_public ? 'STORAGE LAYER FULLY INDEXED' : 'STORAGE LAYER NOT INDEXED'}
                </span>
             </div>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden md:flex p-6 justify-between items-start">
            <div className="flex flex-row items-center gap-4">
              <ModalAvatar node={selectedNode} />
              <div className="min-w-0">
                <div className="flex flex-row items-center gap-4">
                  <h2 className="text-2xl font-black font-sans tracking-tight text-white mb-0.5 truncate">NODE INSPECTOR</h2>
                  <button onClick={(e) => onToggleFavorite(e, selectedNode.address || '')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition group w-fit ${favorites.includes(selectedNode.address || '') ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400'}`}>
                    <Star size={14} className={favorites.includes(selectedNode.address || '') ? 'fill-yellow-500' : 'group-hover:text-yellow-500'} />
                    <span className="text-xs font-bold uppercase leading-none">{favorites.includes(selectedNode.address || '') ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                  <span className="text-zinc-400">{selectedNode.pubkey ? `${selectedNode.pubkey.slice(0, 12)}...` : 'Unknown'}</span>
                  <button onClick={() => copyToClipboard(selectedNode.pubkey || '', 'pubkey')} className="hover:text-white transition">{copiedField === 'pubkey' ? <Check size={10} className="text-green-500 animate-in zoom-in" /> : <Copy size={10} />}</button>
                </div>
                <div className="mt-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${selectedNode.is_public ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                    {selectedNode.is_public ? 'STORAGE LAYER FULLY INDEXED' : 'STORAGE LAYER NOT INDEXED'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition group"><X size={20} className="group-hover:scale-110 transition-transform" /></button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 relative flex flex-col">
          {mode === 'COMPARE' ? (
            <VersusMode selectedNode={selectedNode} nodes={nodes} onBack={() => setMode('VIEW')} />
          ) : mode === 'SHARE' ? (
            <ShareProof node={selectedNode} onBack={() => setMode('VIEW')} />
          ) : (
            <div className="flex flex-col gap-3 md:gap-4 h-full">
               {modalView !== 'overview' ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {/* LEFT SIDEBAR (EXPANDED VIEW) */}
                    <div className="md:col-span-1 h-full">
                       {/* HEALTH TAB */}
                       {modalView === 'health' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-green-500 ring-1 ring-green-500 cursor-pointer" onClick={() => handleCardToggle('health')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">DIAGNOSTICS</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <div className="scale-90"><RadialProgress score={selectedNode.health || 0} size={115} /></div>
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                       {/* STORAGE TAB */}
                       {modalView === 'storage' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-purple-500 ring-1 ring-purple-500 cursor-pointer" onClick={() => handleCardToggle('storage')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">STORAGE</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <div className="w-full space-y-2 text-sm"><div className="flex justify-between text-purple-400"><span>Committed</span><span>{formatBytes(selectedNode.storage_committed)}</span></div><div className="flex justify-between text-blue-400"><span>Used</span><span>{formatBytes(selectedNode.storage_used)}</span></div></div>
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                       {/* IDENTITY TAB */}
                       {modalView === 'identity' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-blue-500 ring-1 ring-blue-500 cursor-pointer" onClick={() => handleCardToggle('identity')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">IDENTITY</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <Shield size={64} className="text-blue-500 opacity-80" />
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                    </div>
                    {/* RIGHT CONTENT */}
                    <div className="md:col-span-2 h-full">
                       {modalView === 'health' && <HealthView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} avgNetworkHealth={avgNetworkHealth} medianStorage={medianCommitted} networkStats={networkStats} />}
                       {modalView === 'storage' && <StorageView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} medianCommitted={medianCommitted} totalStorageCommitted={totalStorageCommitted} nodeCount={nodes.length} />}
                       {modalView === 'identity' && <IdentityView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} mostCommonVersion={mostCommonVersion} />}
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3 md:gap-4 h-full">
                    {/* MOBILE GRID */}
                    <div className="grid grid-cols-2 gap-2 md:hidden">
                        {/* HEALTH CARD (MOBILE) */}
                        <div onClick={() => handleCardToggle('health')} className={`col-span-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center relative overflow-hidden group cursor-pointer ring-1 ${healthRingColor}`}>
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full py-1">
                                <div><div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-1.5 leading-tight"><Activity size={10} className={healthColor} /> SYSTEM DIAGNOSTICS</div><div className="text-[9px] font-mono mt-1 text-zinc-600">Status: <span className={healthScore >= 80 ? 'text-green-400' : 'text-yellow-400'}>{healthStatusLabel}</span></div></div>
                                <div className={`text-[9px] text-green-400 font-bold uppercase flex items-center gap-1 transition-transform origin-left mt-2 ${breatheAnimation}`}><Maximize2 size={8}/> TAP TO EXPAND</div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center justify-center mr-2"><div className="relative scale-100 group-active:scale-110 transition-transform duration-300 flex items-center justify-center"><div className={`absolute inset-0 rounded-full blur-xl animate-[slow-pulse_12s_infinite_ease-in-out] ${healthGlowColor}`}></div><RadialProgress score={healthScore} size={54} stroke={6} /></div></div>
                        </div>

                        {/* STORAGE CARD (MOBILE) */}
                        <div onClick={() => handleCardToggle('storage')} className="aspect-square rounded-2xl bg-indigo-950/10 border border-zinc-800 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300 ring-1 ring-indigo-500/20 hover:ring-indigo-500/60">
                            <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out z-0" style={{ height: `${tankFillPercent}%` }}><div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent"></div><div className="absolute top-0 left-0 right-0 h-[1px] bg-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.4)]"></div></div>
                            <div className="relative z-10 p-3 flex flex-col h-full"><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-1.5"><Database size={12} className="text-indigo-300/80 drop-shadow-md"/><span className="text-[9px] font-bold uppercase text-zinc-500 leading-tight">STORAGE</span></div><div className="bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[7px] font-mono text-indigo-200/80 border border-indigo-500/20 shadow-sm">{(selectedNode.storage_used || 0).toLocaleString()} B</div></div><div className="mt-auto flex flex-col gap-1.5"><div className="flex justify-between items-end"><div className="flex flex-col items-center"><div className="text-[8px] font-bold text-zinc-500 uppercase shadow-black drop-shadow-sm">Used</div><div className="text-sm font-bold text-blue-400 drop-shadow-md whitespace-nowrap">{usedDisplay.val}<span className="text-[9px] ml-0.5 opacity-80">{usedDisplay.unit}</span></div></div><div className="w-px h-6 bg-white/20 mx-1"></div><div className="flex flex-col items-center"><div className="text-[8px] font-bold text-zinc-500 uppercase shadow-black drop-shadow-sm">Committed</div><div className="text-sm font-bold text-purple-400 drop-shadow-md whitespace-nowrap">{committedDisplay.val}<span className="text-[9px] ml-0.5 opacity-80">{committedDisplay.unit}</span></div></div></div></div></div>
                        </div>

                        {/* IDENTITY CARD (MOBILE) - SIBLINGS MOVED TO HEADER */}
                        <div onClick={() => handleCardToggle('identity')} className={`aspect-square rounded-2xl border border-zinc-800 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300 bg-zinc-900 ring-1 ${identityRingColor}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-40 ${isSelectedNodeLatest ? 'from-green-900/40 via-transparent to-blue-900/40' : 'from-orange-900/40 via-transparent to-red-900/40'}`}></div>
                            <div className="relative z-10 p-3 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="relative flex items-center gap-1.5"><Shield size={12} className={`text-zinc-200 drop-shadow-md ${isSelectedNodeLatest ? 'text-blue-200' : 'text-orange-200'}`} /><span className="text-[9px] font-bold uppercase text-zinc-500 leading-tight">IDENTITY</span></div>
                                    <div className="flex flex-col items-end gap-1">
                                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${selectedNode.network === 'MAINNET' ? 'text-green-400 border-green-500/30 bg-green-900/20' : 'text-blue-400 border-blue-500/30 bg-blue-900/20'}`}>{selectedNode.network || 'UNKNOWN'}</div>
                                      {/* SIBLINGS UNDER NETWORK */}
                                      {siblingCount > 0 && <span className="text-[8px] font-bold text-zinc-500 bg-black/40 px-1 rounded border border-white/5">+{siblingCount}</span>}
                                    </div>
                                </div>
                                <div className="mt-auto space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] font-bold uppercase text-zinc-500">Ver</span>
                                      <span className="font-mono text-xs font-bold text-white">{getSafeVersion(selectedNode)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] font-bold uppercase text-zinc-500">Up</span>
                                      <span className="font-mono text-[10px] text-zinc-300">{formatUptime(selectedNode.uptime)}</span>
                                    </div>
                                    <div className={`mt-1 flex items-center justify-center gap-1 py-1 rounded text-[8px] font-bold uppercase border ${isSelectedNodeLatest ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>{isSelectedNodeLatest ? <CheckCircle size={8}/> : <AlertTriangle size={8}/>}{isSelectedNodeLatest ? 'Up to Date' : 'Update Needed'}</div>
                                </div>
                            </div>
                        </div>

                        {/* REPUTATION CARD (MOBILE) - FIXED LAYOUT & SIZE */}
                        <div onClick={handleLeaderboardNav} className={`h-24 p-3 rounded-2xl relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-yellow-500/20 hover:ring-yellow-500/50 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/80 border-yellow-900/30'}`}>
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${hoverShimmerGradient} to-transparent -skew-x-12 -translate-x-[150%] pointer-events-none opacity-0 group-hover:opacity-100 ${shimmerOnceAnimation}`}></div>
                            <div className="flex justify-between items-start relative z-10 mb-2">
                                <div className="flex items-center gap-1.5"><Trophy size={12} className="text-yellow-500 relative z-10"/><span className="text-[9px] font-bold uppercase text-zinc-500 leading-tight">REPUTATION</span></div>
                                <ArrowUpRight size={14} className="text-yellow-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between pb-3">
                                {isValidReputation && (
                                  // SINGLE ROW, JUSTIFY BETWEEN, REDUCED SIZE
                                  <div className="flex justify-between items-center w-full mb-1">
                                      <div className="text-[9px] font-bold uppercase text-zinc-500">Global Rank</div>
                                      <div className="text-xs font-black text-zinc-200">#{selectedNode.rank || '-'}</div>
                                  </div>
                                )}
                                {/* GLASS DASHBOARD PILL */}
                                <div className="w-full bg-black/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border-b border-white/5 rounded-full px-2 py-1.5 flex items-center justify-between mt-auto">
                                   <span className="text-[8px] font-bold text-zinc-500 uppercase">CREDITS</span>
                                   <span className={`text-[9px] font-mono font-bold whitespace-nowrap ${(selectedNode as any).isUntracked || selectedNode.credits === null ? 'text-zinc-500' : 'text-yellow-500'}`}>
                                       {/* FIX: Changed 'OFFLINE' to 'API OFFLINE' to match test expectations */}
                                       {(selectedNode as any).isUntracked ? 'NO CREDITS' : selectedNode.credits === null ? 'API OFFLINE' : selectedNode.credits.toLocaleString()}
                                   </span>
                                </div>
                            </div>
                        </div>

                        {/* PHYSICAL CARD (MOBILE) - REMOVED DUPLICATE PIN */}
                        <Link href={`/map?focus=${getSafeIp(selectedNode)}`} className={`h-24 p-3 rounded-2xl relative overflow-hidden block group cursor-pointer ring-1 ring-blue-500/20 hover:ring-blue-500/50 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/80 border-blue-900/30'}`}>
                            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:16px_16px] origin-center group-hover:scale-[3.0] transition-transform duration-700 ease-in-out pointer-events-none"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                                {/* FIXED PIN ICON */}
                                <MapPin size={24} className="text-blue-500/30 drop-shadow-none" />
                            </div>
                            <div className="flex justify-between items-start relative z-10 w-full"><div className="flex items-center gap-1.5"><Globe size={12} className="text-blue-500 relative z-10"/><span className="text-[9px] font-bold uppercase text-zinc-500 leading-tight">PHYSICAL LAYER</span></div></div>
                            <div className="relative z-10 flex flex-col h-full justify-between pb-3 pt-2"><div className="text-[10px] font-mono text-zinc-400 truncate w-full">{getSafeIp(selectedNode)}</div><div className="flex items-center gap-2 text-[10px] font-bold text-white leading-none"><span className="text-lg leading-none">{getFlagEmoji(selectedNode.location?.countryCode)}</span><span>{selectedNode.location?.countryName || 'Unknown'}</span></div></div>
                        </Link>
                    </div>

                    {/* --- DESKTOP GRID (HIDDEN MD:GRID) --- */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {/* HEALTH (DESKTOP) */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 ring-1 ${zenMode ? 'bg-zinc-900' : 'bg-zinc-900/30'} ${healthRingColor}`} onClick={() => handleCardToggle('health')}>
                         <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                         <div className="flex justify-between items-start mb-4 relative z-10"><div><h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">SYSTEM DIAGNOSTICS</h3></div><HelpCircle size={14} className="text-zinc-500"/></div>
                         <div className="self-center hidden md:flex flex-col items-center justify-center relative z-10">
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-xl animate-[slow-pulse_12s_infinite_ease-in-out] ${healthGlowColor}`}></div>
                            <RadialProgress score={selectedNode.health || 0} size={115} />
                            <div className="mt-4 text-[10px] font-mono text-zinc-600">Status: <span className={healthScore >= 80 ? 'text-green-400' : 'text-yellow-400'}>{healthStatusLabel}</span></div>
                         </div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-green-400 flex justify-center gap-1 relative z-10 ${breatheAnimation}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>

                      {/* STORAGE (DESKTOP) */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 ring-1 ring-indigo-500/20 hover:ring-indigo-500/60 bg-indigo-950/10`} onClick={() => handleCardToggle('storage')}>
                         <div className="flex justify-between items-start mb-4 relative z-10"><div className="flex items-center gap-2"><Database size={18} className="text-indigo-300/80"/><span className="text-xs font-bold uppercase text-zinc-500">STORAGE</span></div></div>
                         <div className="space-y-4 relative z-10"><div className="flex justify-between items-end"><div><div className="text-2xl font-bold text-blue-400 whitespace-nowrap">{usedDisplay.val}<span className="text-sm ml-1 opacity-80">{usedDisplay.unit}</span></div><div className="text-[9px] font-bold text-zinc-600">USED</div></div><div className="text-right"><div className="text-2xl font-bold text-purple-400 whitespace-nowrap">{committedDisplay.val}<span className="text-sm ml-1 opacity-80">{committedDisplay.unit}</span></div><div className="text-[9px] font-bold text-zinc-600">COMMITTED</div></div></div><div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden relative"><div className="h-full bg-gradient-to-r from-transparent to-indigo-500/20 relative overflow-hidden" style={{ width: `${Math.min(100, ((selectedNode.storage_used || 0) / (selectedNode.storage_committed || 1)) * 100)}%` }}><div className="absolute top-0 bottom-0 right-0 w-[1px] bg-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.4)]"></div></div></div></div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-violet-300/80 flex justify-center gap-1 relative z-10 ${breatheAnimation}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>

                      {/* IDENTITY (DESKTOP) - SIBLINGS MOVED TO HEADER */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 ring-1 ${zenMode ? 'bg-zinc-900' : 'bg-zinc-900/30'} ${identityRingColor}`} onClick={() => handleCardToggle('identity')}>
                         <div className={`absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none ${isSelectedNodeLatest ? 'from-green-900/40 via-transparent to-blue-900/40' : 'from-orange-900/40 via-transparent to-red-900/40'}`}></div>
                         <div className="flex justify-between items-start mb-4 relative z-10">
                             <div className="flex items-center gap-2"><Server size={18} className="text-zinc-400"/><span className="text-xs font-bold uppercase text-zinc-500">IDENTITY</span></div>
                             <div className="flex flex-col items-end gap-1">
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${selectedNode.network === 'MAINNET' ? 'text-green-500 border-green-500/30' : 'text-blue-500 border-blue-500/30'}`}>{selectedNode.network}</div>
                                {siblingCount > 0 && <span className="text-[9px] font-bold text-zinc-500 bg-black/40 px-1.5 rounded border border-white/5">+{siblingCount}</span>}
                             </div>
                         </div>
                         <div className="space-y-2 relative z-10">
                            <div className="text-xl font-mono text-white">{getSafeVersion(selectedNode)}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12}/> Up: {formatUptime(selectedNode.uptime)}</div>{isSelectedNodeLatest ? <div className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckCircle size={10}/> UP TO DATE</div> : <div className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><AlertTriangle size={10}/> UPDATE NEEDED</div>}
                         </div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-blue-400 flex justify-center gap-1 relative z-10 ${breatheAnimation}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>
                    </div>

                    {/* DESKTOP BOTTOM ROW */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* REPUTATION (DESKTOP) - FIXED LAYOUT & SIZE */}
                       <div 
                          onClick={handleLeaderboardNav} 
                          className={`h-40 p-5 rounded-2xl border group cursor-pointer relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-yellow-500/20 hover:ring-yellow-500/50 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-yellow-900/30'}`}
                        >
                          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none"></div>
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${hoverShimmerGradient} to-transparent -skew-x-12 -translate-x-[150%] pointer-events-none opacity-0 group-hover:opacity-100 ${shimmerOnceAnimation}`}></div>
                          <div className="flex justify-between items-start relative z-10">
                             <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/><span className="text-xs font-bold uppercase text-zinc-500">REPUTATION</span></div>
                             <ArrowUpRight size={18} className="text-yellow-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
                          </div>
                          <div className="relative z-10 flex flex-col gap-2">
                             {/* SAME ROW, JUSTIFY BETWEEN */}
                             {isValidReputation && (
                                <div className="flex justify-between items-center w-full px-1">
                                    <div className="text-[10px] font-bold uppercase text-zinc-500">Global Rank</div>
                                    {/* REDUCED SIZE */}
                                    <div className="text-xs font-black text-zinc-200">#{selectedNode.rank || '-'}</div>
                                </div>
                             )}
                             {/* GLASS DASHBOARD PILL (DESKTOP) */}
                             <div className="w-full bg-black/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border-b border-white/5 rounded-full px-4 py-2 flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">CREDITS EARNED</span>
                                <span className={`text-[9px] font-mono font-bold whitespace-nowrap ${(selectedNode as any).isUntracked || selectedNode.credits === null ? 'text-zinc-500' : 'text-yellow-500'}`}>
                                    {/* FIX: Changed 'OFFLINE' to 'API OFFLINE' to match test expectations */}
                                    {(selectedNode as any).isUntracked ? 'NO CREDITS' : selectedNode.credits === null ? 'API OFFLINE' : selectedNode.credits.toLocaleString()}
                                </span>
                             </div>
                          </div>
                          <div className={`absolute bottom-2 right-4 text-[9px] font-bold uppercase text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity ${breatheAnimation}`}>OPEN LEADERBOARD</div>
                       </div>

                       {/* PHYSICAL (DESKTOP) */}
                       <Link href={`/map?focus=${getSafeIp(selectedNode)}`}>
                         <div className={`h-40 p-5 rounded-2xl border group cursor-pointer relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-blue-500/20 hover:ring-blue-500/50 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-blue-900/30'}`}>
                            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:20px_20px] origin-center group-hover:scale-[3.0] transition-transform duration-700 ease-in-out pointer-events-none"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                                {/* FIXED PIN */}
                                <MapPin size={48} className="text-blue-500/20 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                            </div>
                            <div className="flex justify-between items-start relative z-10"><div className="flex items-center gap-2"><Globe size={18} className="text-blue-500"/><span className="text-xs font-bold uppercase text-zinc-500">PHYSICAL LAYER</span></div><ArrowUpRight size={18} className="text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/></div>
                            <div className="relative z-10 mt-auto flex items-end justify-between w-full">
                                <div className="text-xs font-mono text-zinc-400">{getSafeIp(selectedNode)}</div>
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <span className="text-lg">{getFlagEmoji(selectedNode.location?.countryCode)}</span>
                                    <span>{selectedNode.location?.countryName || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className={`absolute bottom-2 right-4 text-[9px] font-bold uppercase text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ${breatheAnimation}`}>OPEN MAP VIEW</div>
                         </div>
                       </Link>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-auto pt-2 md:pt-6 border-t border-zinc-800 flex flex-col gap-2 md:gap-4">
                      {/* LAST SEEN / COPY */}
                      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 md:gap-3">
                        <div className="flex-1 md:flex-none text-[9px] md:text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 bg-black/40 px-3 py-1.5 md:py-1 rounded-full border border-zinc-800/50"><Clock size={10} /> <span className="hidden md:inline">Last Seen:</span> <span className="text-zinc-300 font-mono">{timeAgo}</span></div>
                        <button onClick={() => copyToClipboard(`${window.location.origin}/?open=${selectedNode.pubkey}`, 'url')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-1.5 md:py-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] md:text-[10px] font-bold text-blue-400 transition`}>{copiedField === 'url' ? <Check size={12} /> : <LinkIcon size={12} />} {copiedField === 'url' ? 'COPIED' : 'COPY NODE URL'}</button>
                      </div>
                      
                      {/* ACTION BUTTONS */}
                      <div className="flex gap-2 md:gap-4">
                        <button onClick={() => setMode('COMPARE')} className="flex-1 py-3 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700"><Swords size={16} className="text-red-400" /> <span className="hidden md:inline">COMPARE NODES</span><span className="md:hidden">COMPARE</span></button>
                        <button onClick={() => setMode('SHARE')} className="flex-1 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"><Camera size={16} /> <span className="hidden md:inline">PROOF OF PULSE</span><span className="md:hidden">PROOF</span></button>
                      </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
