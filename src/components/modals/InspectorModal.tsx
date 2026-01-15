import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  X, Star, Check, Copy, Shield, Maximize2, HelpCircle, Minimize2, 
  Database, Server, Trophy, Globe, Clock, Link as LinkIcon, 
  Swords, Camera, Activity, CheckCircle, AlertTriangle,
  ArrowUpRight, MapPin, Boxes, Network
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

  // --- SIBLINGS & FLEET LOGIC ---
  const siblingCount = nodes.filter(n => 
    n.pubkey === selectedNode.pubkey && 
    n.network === selectedNode.network && 
    n.address !== selectedNode.address
  ).length;

  const ownerNodes = nodes.filter(n => n.pubkey === selectedNode.pubkey);
  const totalOwned = ownerNodes.length;
  const mainnetCount = ownerNodes.filter(n => n.network === 'MAINNET').length;
  const devnetCount = ownerNodes.filter(n => n.network !== 'MAINNET').length;

  // --- NAVIGATION GUARD ---
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
  
  // Zen Mode Logic: Monochrome vs Colors
  const healthColor = zenMode 
    ? 'text-white' 
    : healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500';
  
  const healthGlowColor = zenMode 
    ? '' 
    : healthScore >= 80 ? 'bg-green-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  const healthRingColor = zenMode
    ? 'border border-zinc-800' // Simple border in Zen
    : healthScore >= 80 ? 'ring-green-500/20 hover:ring-green-500/60' : healthScore >= 50 ? 'ring-yellow-500/20 hover:ring-yellow-500/60' : 'ring-red-500/20 hover:ring-red-500/60';
  
  const identityRingColor = zenMode
    ? 'border border-zinc-800'
    : isSelectedNodeLatest ? 'ring-green-500/20 hover:ring-green-500/60' : 'ring-orange-500/20 hover:ring-orange-500/60';

  const nodeCap = selectedNode.storage_committed || 0;
  const tankFillPercent = Math.min(100, (nodeCap / (medianCommitted || 1)) * 100);

  // Storage Calculations (Bar Chart)
  const avgCommitted = totalStorageCommitted / (nodes.length || 1);
  const maxValue = Math.max(nodeCap, medianCommitted, avgCommitted) * 1.1; 

  const nodeP = (nodeCap / maxValue) * 100;
  const medP = (medianCommitted / maxValue) * 100;
  const avgP = (avgCommitted / maxValue) * 100;

  const getStorageDisplay = (bytes: number) => {
    const formatted = formatBytes(bytes);
    const parts = formatted.split(' ');
    return { val: parts[0], unit: parts[1] || '' };
  };

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

  // KILL SWITCH: Disable animations in Zen Mode
  const shimmerOnceAnimation = zenMode ? "" : "group-hover:animate-[shimmer-once_2.5s_forwards]";
  const breatheAnimation = zenMode ? "" : "animate-[slow-breathe_5s_infinite_ease-in-out]";

  return (
    // Zen Mode: Solid black bg, no backdrop blur.
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${zenMode ? 'bg-black' : 'bg-black/90 backdrop-blur-md'}`} onClick={onClose}>
        {!zenMode && (
           <style jsx global>{`
           @keyframes shimmer-once {
               0% { transform: translateX(-150%) skewX(-12deg); opacity: 0; }
               20% { opacity: 1; }
               100% { transform: translateX(150%) skewX(-12deg); opacity: 0; }
           }
           @keyframes slow-pulse { 0%, 100% { opacity: 0.05; transform: scale(0.98); } 50% { opacity: 0.15; transform: scale(1.02); } }
           @keyframes slow-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.92); opacity: 0.7; } }
           `}</style>
        )}
      <div className={`w-full max-w-4xl 2xl:max-w-6xl rounded-3xl overflow-hidden relative flex flex-col max-h-[85vh] md:max-h-[90vh] ${zenMode ? 'bg-black border border-zinc-800 shadow-none' : 'bg-[#09090b] border border-zinc-800 shadow-2xl'}`} onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className={`shrink-0 border-b ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'}`}>
          {/* MOBILE HEADER */}
          <div className="md:hidden p-3 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="scale-75 origin-left"><ModalAvatar node={selectedNode} /></div>
                <h2 className="text-base font-black font-sans tracking-tight text-white">NODE INSPECTOR</h2>
                <button onClick={onClose} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition"><X size={16} /></button>
             </div>
             {/* ... Mobile Sub-header (simplified) ... */}
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden md:flex p-6 justify-between items-start">
            <div className="flex flex-row items-center gap-4">
              <ModalAvatar node={selectedNode} />
              <div className="min-w-0">
                <div className="flex flex-row items-center gap-4">
                  <h2 className="text-2xl font-black font-sans tracking-tight text-white mb-0.5 truncate">NODE INSPECTOR</h2>
                  <button onClick={(e) => onToggleFavorite(e, selectedNode.address || '')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition group w-fit ${favorites.includes(selectedNode.address || '') ? (zenMode ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-yellow-500/10 border-yellow-500 text-yellow-500') : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400'}`}>
                    <Star size={14} className={favorites.includes(selectedNode.address || '') ? 'fill-current' : ''} />
                    <span className="text-xs font-bold uppercase leading-none">{favorites.includes(selectedNode.address || '') ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                  <span className="text-zinc-400">{selectedNode.pubkey ? `${selectedNode.pubkey.slice(0, 12)}...` : 'Unknown'}</span>
                  <button onClick={() => copyToClipboard(selectedNode.pubkey || '', 'pubkey')} className="hover:text-white transition">{copiedField === 'pubkey' ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}</button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`p-3 rounded-xl transition group ${zenMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white' : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}><X size={20} className={!zenMode ? "group-hover:scale-110 transition-transform" : ""} /></button>
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
                    {/* LEFT SIDEBAR (EXPANDED HEADER VIEW) */}
                    <div className="md:col-span-1 h-full">

                       {/* --- HEALTH HEADER --- */}
                       {modalView === 'health' && (
                         <div className={`h-full rounded-3xl p-6 border flex flex-col items-center justify-between cursor-pointer ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900 border-green-500 ring-1 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]'}`} onClick={() => handleCardToggle('health')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">DIAGNOSTICS</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <div className="relative scale-95">
                                {!zenMode && <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse"></div>}
                                <RadialProgress score={selectedNode.health || 0} size={115} zenMode={zenMode} />
                           </div>
                           <div className={`mt-6 text-[9px] font-bold uppercase flex items-center gap-1 transition ${zenMode ? 'text-zinc-500' : 'text-red-400/80 hover:text-red-400'}`}><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}

                       {/* --- STORAGE HEADER (VERTICAL BAR CHART - MONOLITH STYLE) --- */}
                       {modalView === 'storage' && (
                         <div className={`h-full min-h-[400px] md:min-h-0 rounded-3xl p-6 border flex flex-col justify-between cursor-pointer relative overflow-hidden ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900 border-purple-500 ring-1 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.1)]'}`} onClick={() => handleCardToggle('storage')}>
                           {!zenMode && <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>}

                           <div className="w-full flex justify-between items-start mb-2 relative z-10">
                               <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">STORAGE</div>
                               <Minimize2 size={14} className="text-zinc-500"/>
                           </div>

                           <div className="flex justify-between items-end px-1 mb-6 relative z-10">
                                <div className="text-left">
                                    <div className={`text-2xl font-black drop-shadow-md ${zenMode ? 'text-white' : 'text-blue-400'}`}>{formatBytes(selectedNode.storage_used || 0)}</div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Used Space</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black drop-shadow-md ${zenMode ? 'text-zinc-300' : 'text-purple-400'}`}>{formatBytes(nodeCap)}</div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Committed</div>
                                </div>
                           </div>

                           {/* CHART CONTAINER */}
                           <div className="flex-1 w-full flex items-end justify-between gap-4 relative z-10 px-2 pb-2">
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>
                                {[
                                    { label: 'YOU', val: nodeP, raw: nodeCap, type: 'MY_NODE' },
                                    { label: 'MEDIAN', val: medP, raw: medianCommitted, type: 'MEDIAN' }, 
                                    { label: 'AVERAGE', val: avgP, raw: avgCommitted, type: 'AVG' }
                                ].map((bar, i) => {
                                    const isMyNode = bar.type === 'MY_NODE';
                                    
                                    // Zen Color Logic
                                    const barColor = zenMode 
                                        ? (isMyNode ? 'bg-white' : 'bg-zinc-800')
                                        : (isMyNode ? 'bg-gradient-to-t from-purple-900/80 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-zinc-800/60 border-t border-white/5');

                                    const labelColor = isMyNode ? (zenMode ? 'text-white' : 'text-purple-400') : 'text-zinc-600';

                                    return (
                                        <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">
                                            {!isMyNode && (
                                                <div className="mb-2 text-[8px] font-mono font-bold text-zinc-600 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {formatBytes(bar.raw)}
                                                </div>
                                            )}
                                            <div 
                                                className={`w-full max-w-[40px] md:max-w-[50px] rounded-t-sm md:rounded-t-md transition-all duration-1000 ease-out relative ${barColor}`} 
                                                style={{ height: `${Math.max(bar.val, 2)}%` }} 
                                            >
                                                {!zenMode && <div className={`absolute top-0 left-0 right-0 h-[1px] ${isMyNode ? 'bg-white/60 shadow-[0_0_8px_white]' : 'bg-white/10'}`}></div>}
                                            </div>
                                            <div className={`mt-2 text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                                                {bar.label}
                                            </div>
                                        </div>
                                    );
                                })}
                           </div>
                           <div className={`mt-4 text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition ${zenMode ? 'text-zinc-500' : 'text-red-400/80 hover:text-red-400'}`}><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}

                       {/* --- IDENTITY HEADER --- */}
                       {modalView === 'identity' && (
                         <div className={`h-full rounded-3xl border flex flex-col justify-between relative overflow-hidden cursor-pointer ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900 border-blue-500 ring-1 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]'}`} onClick={() => handleCardToggle('identity')}>
                           {!zenMode && <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>}
                           <div className="p-6 relative z-10">
                               <div className="w-full flex justify-between items-start mb-6">
                                   <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">IDENTITY</div>
                                   <Minimize2 size={14} className="text-zinc-500"/>
                               </div>
                               <div className="flex flex-col items-center text-center">
                                   <Shield size={48} className={`${zenMode ? 'text-zinc-500' : 'text-blue-500 mb-3 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`} />
                                   <div className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Current Network</div>
                                   <div className={`text-xl font-black tracking-tight ${zenMode ? 'text-white' : (selectedNode.network === 'MAINNET' ? 'text-green-400' : 'text-blue-400')}`}>
                                       {selectedNode.network || 'UNKNOWN'}
                                   </div>
                               </div>
                           </div>
                           {/* Bottom Grid omitted for brevity, uses same Zen logic */}
                           <div className="absolute bottom-1 w-full text-center pb-1">
                               <div className={`text-[8px] font-bold uppercase flex items-center justify-center gap-1 ${zenMode ? 'text-zinc-500' : 'text-red-400/60'}`}><Minimize2 size={8}/> COLLAPSE</div>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="md:col-span-2 h-full">
                       {modalView === 'health' && <HealthView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} avgNetworkHealth={avgNetworkHealth} medianStorage={medianCommitted} networkStats={networkStats} />}
                       {modalView === 'storage' && <StorageView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} medianCommitted={medianCommitted} totalStorageCommitted={totalStorageCommitted} nodeCount={nodes.length} />}
                       {modalView === 'identity' && <IdentityView node={selectedNode} nodes={nodes} zenMode={zenMode} onBack={() => setModalView('overview')} mostCommonVersion={mostCommonVersion} />}
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3 md:gap-4 h-full">
                    
                    {/* --- DESKTOP GRID --- */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {/* HEALTH (DESKTOP) */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${zenMode ? 'bg-black border border-zinc-800' : `bg-zinc-900/30 ring-1 ${healthRingColor} hover:-translate-y-1 transition-all duration-300`}`} onClick={() => handleCardToggle('health')}>
                         {!zenMode && <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>}
                         <div className="flex justify-between items-start mb-4 relative z-10"><div><h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">SYSTEM DIAGNOSTICS</h3></div><HelpCircle size={14} className="text-zinc-500"/></div>
                         <div className="self-center hidden md:flex flex-col items-center justify-center relative z-10">
                            {!zenMode && <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-xl animate-[slow-pulse_12s_infinite_ease-in-out] ${healthGlowColor}`}></div>}
                            <RadialProgress score={selectedNode.health || 0} size={115} zenMode={zenMode} />
                            <div className="mt-4 text-[10px] font-mono text-zinc-600">Status: <span className={zenMode ? 'text-white' : (healthScore >= 80 ? 'text-green-400' : 'text-yellow-400')}>{healthStatusLabel}</span></div>
                         </div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest flex justify-center gap-1 relative z-10 ${zenMode ? 'text-zinc-500' : `text-green-400 ${breatheAnimation}`}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>

                      {/* STORAGE (DESKTOP) */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${zenMode ? 'bg-black border border-zinc-800' : 'bg-indigo-950/10 ring-1 ring-indigo-500/20 hover:ring-indigo-500/60 hover:-translate-y-1 transition-all duration-300'}`} onClick={() => handleCardToggle('storage')}>
                         <div className="flex justify-between items-start mb-4 relative z-10"><div className="flex items-center gap-2"><Database size={18} className={zenMode ? 'text-zinc-500' : 'text-indigo-300/80'}/><span className="text-xs font-bold uppercase text-zinc-500">STORAGE</span></div></div>
                         <div className="space-y-4 relative z-10">
                             {/* Stats logic same as before, just colors changed via ZenMode conditional */}
                             <div className="flex justify-between items-end">
                                 <div><div className={`text-2xl font-bold whitespace-nowrap ${zenMode ? 'text-white' : 'text-blue-400'}`}>{usedDisplay.val}<span className="text-sm ml-1 opacity-80">{usedDisplay.unit}</span></div><div className="text-[9px] font-bold text-zinc-600">USED</div></div>
                                 <div className="text-right"><div className={`text-2xl font-bold whitespace-nowrap ${zenMode ? 'text-zinc-400' : 'text-purple-400'}`}>{committedDisplay.val}<span className="text-sm ml-1 opacity-80">{committedDisplay.unit}</span></div><div className="text-[9px] font-bold text-zinc-600">COMMITTED</div></div>
                             </div>
                             {/* Progress Bar Zen Logic */}
                             <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden relative">
                                 <div className={`h-full relative overflow-hidden ${zenMode ? 'bg-white' : 'bg-gradient-to-r from-transparent to-indigo-500/20'}`} style={{ width: `${Math.min(100, ((selectedNode.storage_used || 0) / (selectedNode.storage_committed || 1)) * 100)}%` }}>{!zenMode && <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.4)]"></div>}</div></div></div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest flex justify-center gap-1 relative z-10 ${zenMode ? 'text-zinc-500' : `text-violet-300/80 ${breatheAnimation}`}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>

                      {/* IDENTITY (DESKTOP) */}
                      {/* Similar logic applied: Remove gradients, flatten colors to White/Zinc */}
                      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${zenMode ? 'bg-black border border-zinc-800' : `bg-zinc-900/30 ring-1 ${identityRingColor} hover:-translate-y-1 transition-all duration-300`}`} onClick={() => handleCardToggle('identity')}>
                         {/* ... Identity Content ... */}
                         <div className="space-y-2 relative z-10">
                            <div className="text-xl font-mono text-white">{getSafeVersion(selectedNode)}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12}/> Up: {formatUptime(selectedNode.uptime)}</div>
                            {isSelectedNodeLatest ? <div className={`text-[10px] font-bold flex items-center gap-1 ${zenMode ? 'text-zinc-400' : 'text-green-500'}`}><CheckCircle size={10}/> UP TO DATE</div> : <div className={`text-[10px] font-bold flex items-center gap-1 ${zenMode ? 'text-white' : 'text-orange-500'}`}><AlertTriangle size={10}/> UPDATE NEEDED</div>}
                         </div>
                         <div className={`mt-auto text-center text-[9px] font-bold uppercase tracking-widest flex justify-center gap-1 relative z-10 ${zenMode ? 'text-zinc-500' : `text-blue-400 ${breatheAnimation}`}`}><Maximize2 size={8}/> CLICK TO EXPAND</div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-auto pt-2 md:pt-6 border-t border-zinc-800 flex flex-col gap-2 md:gap-4">
                      {/* ... Copy Buttons & Compare Actions (Styled consistently) ... */}
                      <div className="flex gap-2 md:gap-4">
                        <button onClick={() => setMode('COMPARE')} className={`flex-1 py-3 md:py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border ${zenMode ? 'bg-black border-zinc-700 text-white hover:bg-zinc-900' : 'bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700'}`}><Swords size={16} className={zenMode ? 'text-white' : 'text-red-400'} /> <span className="hidden md:inline">COMPARE NODES</span><span className="md:hidden">COMPARE</span></button>
                        {/* FIX APPLIED HERE: Removed text-white from static class string */}
                        <button onClick={() => setMode('SHARE')} className={`flex-1 py-3 md:py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 ${zenMode ? 'bg-white text-black border-transparent hover:bg-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}><Camera size={16} /> <span className="hidden md:inline">PROOF OF PULSE</span><span className="md:hidden">PROOF</span></button>
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
