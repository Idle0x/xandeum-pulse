import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, Medal, MapPin, Activity, Calculator, Copy, 
  Check, Share2, ChevronDown, ChevronDown as ChevronIcon, 
  Wallet, AlertOctagon, Search 
} from 'lucide-react';
import { RankedNode } from '../../types/leaderboard';
import { Node } from '../../types'; // Import the full Node type for casting
// NEW IMPORT: The Shadow Layer Component
import { ExpandedRowDetails } from './ExpandedRowDetails';

interface NodeTableProps {
  nodes: RankedNode[];
  loading: boolean;
  offline: boolean;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  expandedNode: string | null;
  setExpandedNode: (id: string | null) => void;
  favorites: string[];
  onSimulate: (pubkey: string) => void;
  networkFilter: string;
}

export default function NodeTable({
  nodes, loading, offline, visibleCount, setVisibleCount,
  expandedNode, setExpandedNode, favorites, onSimulate, networkFilter
}: NodeTableProps) {

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Helper for generating the diagnostics link
  const getDashboardLink = (n: RankedNode) => {
    const params = new URLSearchParams();
    params.set('open', n.pubkey);
    if (n.network) params.set('network', n.network);
    if (n.address) params.set('focusAddr', n.address);
    return `/?${params.toString()}`;
  };

  const handleRowClick = (node: RankedNode) => {
    const compositeId = `${node.pubkey}-${node.network}-${node.address || 'no-ip'}`;
    setExpandedNode(expandedNode === compositeId ? null : compositeId);
  };

  const handleCopyKey = (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShareUrl = (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      const url = `${window.location.origin}/leaderboard?highlight=${key}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleUseInSim = (e: React.MouseEvent, pubkey: string) => {
      e.stopPropagation();
      onSimulate(pubkey);
  };

  return (
    <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
      {/* TABLE HEADER */}
      <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-zinc-800 text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
        <div className="col-span-6 md:col-span-7">Node Public Key</div>
        <div className="col-span-4 text-right">Credits</div>
      </div>

      {/* STATES */}
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="text-center animate-pulse text-zinc-500 font-mono flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
              LOADING...
           </div>
        </div>
      ) : offline ? (
        <div className="p-10 md:p-20 text-center flex flex-col items-center justify-center h-full">
            <AlertOctagon size={48} className="text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Offline</h3>
        </div>
      ) : nodes.length === 0 ? (
        <div className="p-20 text-center text-zinc-600"><Search size={48} className="mx-auto mb-4 opacity-50" /><p>No nodes found.</p></div>
      ) : (
        <div className="divide-y-0 px-2 pb-2">
          {nodes.slice(0, visibleCount).map((node) => {
              const isMyNode = node.address && favorites.includes(node.address);
              const compositeId = `${node.pubkey}-${node.network}-${node.address || 'no-ip'}`;
              const isExpanded = expandedNode === compositeId; 
              const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` : null;

              return (
              <div key={compositeId} id={`node-${compositeId}`} className={`relative transition-all duration-300 ease-out mb-2 rounded-xl border ${isExpanded ? 'scale-[1.02] z-10 bg-black border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'scale-100 bg-zinc-900/30 border-transparent hover:scale-[1.01] hover:bg-zinc-800 hover:border-zinc-600'} ${isMyNode && !isExpanded ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}>
                  {/* ROW HEADER */}
                  <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 items-center cursor-pointer" onClick={() => handleRowClick(node)}>
                      <div className="col-span-2 md:col-span-1 flex flex-col justify-center items-center gap-1 relative">
                          <div className="flex items-center gap-1">
                              {node.rank === 1 && <Trophy size={14} className="text-yellow-400" />}
                              {node.rank > 1 && node.rank <= 3 && <Medal size={14} className={node.rank === 2 ? "text-zinc-300" : "text-amber-600"} />}
                              <span className={`text-xs md:text-sm font-bold ${node.rank <= 3 ? 'text-white' : 'text-zinc-500'}`}>#{node.rank}</span>
                          </div>
                          {networkFilter === 'COMBINED' && (<span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${node.network === 'MAINNET' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>{node.network === 'MAINNET' ? 'MN' : 'DN'}</span>)}
                      </div>
                      <div className="col-span-6 md:col-span-7 font-mono text-[10px] md:text-sm text-zinc-300 truncate group-hover:text-white transition flex items-center justify-between pr-4">
                          <span>{node.pubkey}</span>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-cyan-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}><ChevronDown size={16} /></div>
                      </div>
                      <div className="col-span-4 text-right font-bold font-mono text-xs md:text-base text-yellow-500 flex items-center justify-end gap-2">
                          {node.credits.toLocaleString()}
                          <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                      </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                      <div className="border-t border-zinc-800/50 p-3 md:p-4 animate-in slide-in-from-top-2 duration-200">
                          
                          {/* NEW: THE DATABASE INJECTION POINT */}
                          {/* Type casting node to Node to bypass missing lat/lon in RankedNode */}
                          <ExpandedRowDetails node={node as unknown as Node} />

                          <div className="flex flex-col gap-4 mt-4">
                              {/* MOBILE ACTIONS */}
                              <div className="grid grid-cols-6 gap-2 md:hidden">
                                  {node.address && (
                                      <Link href={`/map?focus=${node.address.split(':')[0]}`} className="col-span-3">
                                          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-900/20 border border-blue-500/30 text-[10px] font-bold text-blue-400">
                                              {flagUrl ? <img src={flagUrl} className="w-4 rounded-sm" alt="flag"/> : <MapPin size={12} />} MAP
                                          </button>
                                      </Link>
                                  )}
                                  <Link href={getDashboardLink(node)} className="col-span-3">
                                      <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-white">
                                          <Activity size={12} className="text-green-400" /> DIAGNOSTICS
                                      </button>
                                  </Link>
                                  <button onClick={(e) => handleUseInSim(e, node.pubkey)} className="col-span-2 flex items-center justify-center gap-2 px-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-500">
                                      <Calculator size={12} /> CALC
                                  </button>
                                  <button onClick={(e) => handleCopyKey(e, node.pubkey)} className="col-span-2 flex items-center justify-center gap-1 px-0.5 py-3 bg-zinc-800/50 rounded-xl text-[10px] font-bold text-zinc-400">
                                      {copiedKey === node.pubkey ? <Check size={12} /> : <Copy size={12} />} COPY KEY
                                  </button>
                                  <button onClick={(e) => handleShareUrl(e, node.pubkey)} className="col-span-2 flex items-center justify-center gap-1 px-0.5 py-3 bg-blue-500/10 rounded-xl text-[10px] font-bold text-blue-400">
                                      {copiedLink === node.pubkey ? <Check size={12} /> : <Share2 size={12} />} SHARE
                                  </button>
                              </div>

                              {/* DESKTOP ACTIONS */}
                              <div className="hidden md:flex flex-row gap-4 items-center justify-between">
                                  <div className="flex gap-2 w-full md:w-auto">
                                      {node.address && (
                                          <Link href={`/map?focus=${node.address.split(':')[0]}`}>
                                              <button className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-[10px] md:text-xs font-bold text-blue-400 transition-all whitespace-nowrap">
                                                  {flagUrl ? <img src={flagUrl} className="w-4 rounded-sm" alt="flag"/> : <MapPin size={12} />}MAP
                                              </button>
                                          </Link>
                                      )}
                                      <Link href={getDashboardLink(node)}>
                                          <button className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[10px] md:text-xs font-bold text-white transition-all whitespace-nowrap">
                                              <Activity size={12} className="text-green-400" />DIAGNOSTICS
                                          </button>
                                      </Link>
                                      <button onClick={(e) => handleUseInSim(e, node.pubkey)} className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-[10px] md:text-xs font-bold text-yellow-500 transition-all whitespace-nowrap">
                                          <Calculator size={12} />CALCULATE
                                      </button>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                      <button onClick={(e) => handleCopyKey(e, node.pubkey)} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition">
                                          {copiedKey === node.pubkey ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                          {copiedKey === node.pubkey ? 'COPIED KEY' : 'COPY KEY'}
                                      </button>
                                      <button onClick={(e) => handleShareUrl(e, node.pubkey)} className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition">
                                          {copiedLink === node.pubkey ? <Check size={12} /> : <Share2 size={12} />}
                                          {copiedLink === node.pubkey ? 'LINK COPIED' : 'SHARE RANK'}
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
              );
          })}

          {/* LOAD MORE */}
          {visibleCount < nodes.length ? (
            <div className="p-4 flex justify-center border-t border-zinc-800">
                <button onClick={() => setVisibleCount(prev => prev + 100)} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all">
                    <ChevronIcon size={16} /> LOAD NEXT 100 NODES
                </button>
            </div>
          ) : nodes.length > 0 && (
            <div className="p-4 text-center border-t border-zinc-800 text-[10px] text-zinc-600 font-mono uppercase">--- END OF LIST ---</div>
          )}
        </div>
      )}
    </div>
  );
}
