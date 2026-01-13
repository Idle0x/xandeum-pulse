import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  X, Star, Check, Copy, Shield, Maximize2, HelpCircle, Minimize2, 
  HeartPulse, Database, Server, Trophy, Globe, Clock, Link as LinkIcon, 
  Swords, Camera, ExternalLink, Activity, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { Node } from '../../types';
import { ModalAvatar } from '../common/ModalAvatar';
import { RadialProgress } from '../RadialProgress'; 
import { PhysicalLocationBadge } from '../PhysicalLocationBadge'; 
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
}

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
  mostCommonVersion
}: InspectorModalProps) => {
  const router = useRouter();
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage' | 'identity'>('overview');
  const [mode, setMode] = useState<'VIEW' | 'COMPARE' | 'SHARE'>('VIEW');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // When node changes, reset view
  useEffect(() => {
    setModalView('overview');
    setMode('VIEW');
  }, [selectedNode.pubkey]);

  const timeAgo = useTimeAgo(selectedNode.last_seen_timestamp);
  const isSelectedNodeLatest = checkIsLatest(selectedNode.version, mostCommonVersion);
  const avgNetworkHealth = networkStats?.avgBreakdown?.total || 0;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCardToggle = (view: 'health' | 'storage' | 'identity') => {
     setModalView(modalView === view ? 'overview' : view);
  };

  // --- Z-INDEX UPDATE: z-[200] ensures it is above Sticky Header (z-50) ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className={`border w-full max-w-4xl 2xl:max-w-6xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${zenMode ? 'bg-black border-zinc-800 shadow-none' : 'bg-[#09090b] border-zinc-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER (Preserved) */}
        <div className={`shrink-0 p-4 md:p-6 border-b flex justify-between items-start ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'}`}>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
            <ModalAvatar node={selectedNode} />
            <div className="min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <h2 className="text-lg md:text-2xl font-black font-sans tracking-tight text-white mb-0.5 truncate">NODE INSPECTOR</h2>
                <button onClick={(e) => onToggleFavorite(e, selectedNode.address || '')} className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border transition group w-fit ${favorites.includes(selectedNode.address || '') ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400'}`}>
                  <Star size={14} className={favorites.includes(selectedNode.address || '') ? 'fill-yellow-500' : 'group-hover:text-yellow-500'} />
                  <span className="text-[10px] md:text-xs font-bold uppercase leading-none">{favorites.includes(selectedNode.address || '') ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                <span className="text-zinc-400 truncate max-w-[120px] md:max-w-none">{selectedNode.pubkey ? `${selectedNode.pubkey.slice(0, 12)}...` : 'Unknown'}</span>
                <button onClick={() => copyToClipboard(selectedNode.pubkey || '', 'pubkey')} className="hover:text-white transition">
                  {copiedField === 'pubkey' ? <Check size={10} className="text-green-500 animate-in zoom-in" /> : <Copy size={10} />}
                </button>
              </div>
              <div className="mt-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${selectedNode.is_public ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                  {selectedNode.is_public ? 'STORAGE LAYER FULLY INDEXED' : 'STORAGE LAYER NOT INDEXED'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 absolute top-4 right-4 md:static">
            <button onClick={onClose} className="p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition group">
              <X size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative flex flex-col">
          {mode === 'COMPARE' ? (
            <VersusMode selectedNode={selectedNode} nodes={nodes} onBack={() => setMode('VIEW')} />
          ) : mode === 'SHARE' ? (
            <ShareProof node={selectedNode} onBack={() => setMode('VIEW')} />
          ) : (
            // VIEW MODE (Overview + Tabs)
            <div className="flex flex-col gap-4 h-full">
               {modalView !== 'overview' ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {/* LEFT SIDEBAR (Tabs) */}
                    <div className="hidden md:flex md:col-span-1 h-full flex-col gap-4">
                       {/* DESKTOP TABS PRESERVED */}
                       {modalView === 'health' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-green-500 ring-1 ring-green-500 cursor-pointer" onClick={() => handleCardToggle('health')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">DIAGNOSTICS</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <div className="scale-90"><RadialProgress score={selectedNode.health || 0} size={140} /></div>
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                       {modalView === 'storage' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-purple-500 ring-1 ring-purple-500 cursor-pointer" onClick={() => handleCardToggle('storage')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">STORAGE</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <div className="w-full space-y-2 text-sm"><div className="flex justify-between text-purple-400"><span>Committed</span><span>{formatBytes(selectedNode.storage_committed)}</span></div><div className="flex justify-between text-blue-400"><span>Used</span><span>{formatBytes(selectedNode.storage_used)}</span></div></div>
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                       {modalView === 'identity' && (
                         <div className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between bg-zinc-900 border-blue-500 ring-1 ring-blue-500 cursor-pointer" onClick={() => handleCardToggle('identity')}>
                           <div className="w-full flex justify-between items-start mb-4"><div className="text-[10px] font-bold uppercase text-zinc-400">IDENTITY</div><Minimize2 size={14} className="text-zinc-500"/></div>
                           <Shield size={64} className="text-blue-500 opacity-80" />
                           <div className="mt-6 text-[9px] font-bold uppercase text-red-400/80 flex items-center gap-1"><Minimize2 size={8}/> CLICK TO COLLAPSE</div>
                         </div>
                       )}
                    </div>
                    
                    {/* EXPANDED CONTENT (Mobile takes full width, Desktop takes 2 cols) */}
                    <div className="col-span-1 md:col-span-2 h-full">
                       {modalView === 'health' && <HealthView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} avgNetworkHealth={avgNetworkHealth} medianStorage={medianCommitted} networkStats={networkStats} />}
                       {modalView === 'storage' && <StorageView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} medianCommitted={medianCommitted} totalStorageCommitted={totalStorageCommitted} nodeCount={nodes.length} />}
                       {modalView === 'identity' && <IdentityView node={selectedNode} zenMode={zenMode} onBack={() => setModalView('overview')} mostCommonVersion={mostCommonVersion} />}
                    </div>
                 </div>
               ) : (
                 // OVERVIEW DASHBOARD
                 <div className="flex flex-col gap-4 h-full">
                    
                    {/* === MOBILE "BENTO HERO" LAYOUT (Grid) === */}
                    <div className="grid grid-cols-2 gap-2 md:hidden">
                        {/* 1. HERO HEALTH CARD (Full Width) */}
                        <div className={`col-span-2 rounded-2xl p-4 border flex items-center justify-between cursor-pointer relative overflow-hidden ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('health')}>
                            <div className="z-10">
                                <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">SYSTEM DIAGNOSTICS</h3>
                                <div className={`text-4xl font-black ${selectedNode.health && selectedNode.health >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{selectedNode.health || 0}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-2 flex items-center gap-1"><Maximize2 size={8}/> TAP TO EXPAND</div>
                            </div>
                            <div className="scale-75 -mr-4"><RadialProgress score={selectedNode.health || 0} size={100} /></div>
                        </div>

                        {/* 2. STORAGE CARD (Square) */}
                        <div className={`col-span-1 aspect-square rounded-2xl p-3 border flex flex-col justify-between cursor-pointer ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('storage')}>
                            <div className="flex justify-between items-start">
                                <Database size={14} className="text-purple-500"/>
                                <Maximize2 size={10} className="text-zinc-700"/>
                            </div>
                            <div>
                                {/* Glass Pill for Raw Bytes */}
                                <div className="inline-block px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[7px] font-mono text-zinc-400 mb-1">
                                    {(selectedNode.storage_used || 0).toLocaleString()} B
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-left">
                                        <div className="text-[8px] font-bold text-zinc-600 uppercase">Used</div>
                                        <div className="text-sm font-bold text-blue-400 leading-none">{formatBytes(selectedNode.storage_used).split(' ')[0]}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-bold text-zinc-600 uppercase">Commit</div>
                                        <div className="text-sm font-bold text-purple-400 leading-none">{formatBytes(selectedNode.storage_committed).split(' ')[0]}</div>
                                    </div>
                                </div>
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5 w-full">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.min(100, ((selectedNode.storage_used || 0) / (selectedNode.storage_committed || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* 3. IDENTITY CARD (Square) */}
                        <div className={`col-span-1 aspect-square rounded-2xl p-3 border flex flex-col justify-between cursor-pointer ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('identity')}>
                            <div className="flex justify-between items-start">
                                <Server size={14} className="text-blue-500"/>
                                <Maximize2 size={10} className="text-zinc-700"/>
                            </div>
                            <div className="space-y-1">
                                <div className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded w-fit border ${selectedNode.network === 'MAINNET' ? 'text-green-500 border-green-500/30 bg-green-500/5' : 'text-blue-500 border-blue-500/30 bg-blue-500/5'}`}>
                                    {selectedNode.network}
                                </div>
                                <div className="text-xs font-mono text-white">{getSafeVersion(selectedNode)}</div>
                                <div className="text-[8px] text-zinc-500 flex items-center gap-1">
                                    <Clock size={8}/> {formatUptime(selectedNode.uptime)}
                                </div>
                            </div>
                        </div>

                        {/* 4. REPUTATION (Link) */}
                        <div className={`col-span-1 p-3 rounded-2xl border cursor-pointer flex flex-col justify-center gap-1 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => router.push(`/leaderboard?highlight=${selectedNode.pubkey}`)}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Trophy size={12} className="text-yellow-500"/>
                                <span className="text-[8px] font-bold uppercase text-zinc-500">Reputation</span>
                            </div>
                            <div className="text-[10px] font-bold text-white">Rank #{selectedNode.rank || '-'}</div>
                            <div className="text-[8px] font-mono text-yellow-500/80">{(selectedNode.credits || 0).toLocaleString()} Cr</div>
                        </div>

                        {/* 5. MAP (Link) */}
                        <div className={`col-span-1 p-3 rounded-2xl border cursor-pointer flex flex-col justify-center gap-1 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => router.push(`/map?focus=${getSafeIp(selectedNode)}`)}>
                             <div className="flex items-center gap-1.5 mb-1">
                                <Globe size={12} className="text-blue-500"/>
                                <span className="text-[8px] font-bold uppercase text-zinc-500">Location</span>
                            </div>
                            <div className="text-[9px] font-bold text-white truncate">{selectedNode.location?.countryName || 'Unknown'}</div>
                            <div className="text-[8px] text-blue-400 flex items-center gap-1">Open Map <ExternalLink size={8}/></div>
                        </div>
                    </div>

                    {/* === DESKTOP LAYOUT (Preserved, Hidden on Mobile) === */}
                    <div className="hidden md:grid grid-cols-3 gap-4">
                      {/* 1. DIAGNOSTICS CARD */}
                      <div className={`rounded-3xl p-6 border flex flex-col justify-between cursor-pointer group h-64 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('health')}>
                         <div className="flex justify-between items-start mb-4">
                           <div><h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">SYSTEM DIAGNOSTICS</h3></div>
                           <HelpCircle size={14} className="text-zinc-500"/>
                         </div>
                         <div className="self-center"><RadialProgress score={selectedNode.health || 0} size={140} /></div>
                         <div className="mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-green-400 flex justify-center gap-1"><Maximize2 size={8}/> EXPAND</div>
                      </div>

                      {/* 2. STORAGE CARD */}
                      <div className={`rounded-3xl p-6 border flex flex-col justify-between cursor-pointer group h-64 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('storage')}>
                         <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-2"><Database size={18} className="text-blue-500"/><span className="text-xs font-bold uppercase text-zinc-500">STORAGE</span></div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-end">
                               <div><div className="text-2xl font-bold text-blue-400">{formatBytes(selectedNode.storage_used).split(' ')[0]}</div><div className="text-[9px] font-bold text-zinc-600">USED</div></div>
                               <div className="text-right"><div className="text-2xl font-bold text-purple-400">{formatBytes(selectedNode.storage_committed).split(' ')[0]}</div><div className="text-[9px] font-bold text-zinc-600">TOTAL</div></div>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.min(100, ((selectedNode.storage_used || 0) / (selectedNode.storage_committed || 1)) * 100)}%` }}></div></div>
                         </div>
                         <div className="mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-purple-400 flex justify-center gap-1"><Maximize2 size={8}/> EXPAND</div>
                      </div>

                      {/* 3. IDENTITY CARD */}
                      <div className={`rounded-3xl p-6 border flex flex-col justify-between cursor-pointer group h-64 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`} onClick={() => handleCardToggle('identity')}>
                         <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-2"><Server size={18} className="text-zinc-400"/><span className="text-xs font-bold uppercase text-zinc-500">IDENTITY</span></div>
                           <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${selectedNode.network === 'MAINNET' ? 'text-green-500 border-green-500/30' : 'text-blue-500 border-blue-500/30'}`}>{selectedNode.network}</div>
                         </div>
                         <div className="space-y-2">
                            <div className="text-xl font-mono text-white">{getSafeVersion(selectedNode)}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12}/> Up: {formatUptime(selectedNode.uptime)}</div>
                            {isSelectedNodeLatest ? <div className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckCircle size={10}/> UP TO DATE</div> : <div className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><AlertTriangle size={10}/> UPDATE NEEDED</div>}
                         </div>
                         <div className="mt-auto text-center text-[9px] font-bold uppercase tracking-widest text-blue-400 flex justify-center gap-1"><Maximize2 size={8}/> EXPAND</div>
                      </div>
                    </div>

                    {/* BOTTOM ROW (Desktop) */}
                    <div className="hidden md:grid grid-cols-2 gap-4">
                       <div className={`h-40 p-5 rounded-2xl border group cursor-pointer relative overflow-hidden flex flex-col justify-between ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'}`} onClick={() => router.push(`/leaderboard?highlight=${selectedNode.pubkey}`)}>
                          <div className="flex justify-between items-start relative z-10">
                             <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/><span className="text-xs font-bold uppercase text-zinc-500">REPUTATION</span></div>
                             <HelpCircle size={12} className="text-zinc-600"/>
                          </div>
                          <div className="relative z-10">
                             <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Global Rank <span className="text-white text-base ml-1">#{selectedNode.rank || '-'}</span></div>
                             <div className="font-mono text-yellow-500 font-bold text-xs">{(selectedNode.credits || 0).toLocaleString()} Credits</div>
                          </div>
                       </div>

                       <Link href={`/map?focus=${getSafeIp(selectedNode)}`}>
                         <div className={`h-40 p-5 rounded-2xl border group cursor-pointer relative overflow-hidden flex flex-col justify-between ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'}`}>
                            <div className="flex justify-between items-start relative z-10">
                               <div className="flex items-center gap-2"><Globe size={18} className="text-blue-500"/><span className="text-xs font-bold uppercase text-zinc-500">LOCATION</span></div>
                            </div>
                            <div className="relative z-10 mt-auto"><PhysicalLocationBadge node={selectedNode} zenMode={zenMode} /></div>
                         </div>
                       </Link>
                    </div>

                    {/* FOOTER ACTIONS (Responsive) */}
                    <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-col gap-4">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-zinc-800/50">
                          <Clock size={10} /> Last Seen: <span className="text-zinc-300 font-mono">{timeAgo}</span>
                        </div>
                        <button onClick={() => copyToClipboard(`${window.location.origin}/?open=${selectedNode.pubkey}`, 'url')} className={`flex items-center justify-center gap-2 px-6 py-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 transition`}>
                          {copiedField === 'url' ? <Check size={12} /> : <LinkIcon size={12} />} {copiedField === 'url' ? 'LINK COPIED' : 'COPY NODE URL'}
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setMode('COMPARE')} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700">
                          <Swords size={16} className="text-red-400" /> COMPARE NODES
                        </button>
                        <button onClick={() => setMode('SHARE')} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                          <Camera size={16} /> PROOF OF PULSE
                        </button>
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
