import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { 
  ArrowLeft, Search, Plus, X, 
  Download, CheckCircle, Share2, ChevronDown, Grid, Star
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { getSafeIp } from '../utils/nodeHelpers';
import { formatBytes } from '../utils/formatters';
import { formatUptimePrecise, PLAYER_THEMES } from '../components/compare/MicroComponents';
import { Node } from '../types';

// Child Components
import { ControlRail } from '../components/compare/ControlRail';
import { NodeColumn } from '../components/compare/NodeColumn';
import { SynthesisEngine } from '../components/compare/SynthesisEngine';
import { EmptySlot } from '../components/compare/ComparisonUI';

export default function ComparePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const { nodes, loading } = useNetworkData(); 

  // --- STATE ---
  const [networkScope, setNetworkScope] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showNetwork, setShowNetwork] = useState(true);
  const [leaderMetric, setLeaderMetric] = useState<'STORAGE' | 'CREDITS' | 'HEALTH' | 'UPTIME' | null>(null);

  const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // --- REFS ---
  const leaderRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  const prevNodeCount = useRef(0);

  useOutsideClick(leaderRef, () => setIsLeaderDropdownOpen(false));
  useOutsideClick(watchlistRef, () => setIsWatchlistOpen(false));
  useOutsideClick(networkRef, () => setIsNetworkOpen(false));

  // --- DATA LOGIC ---
  const availableNodes = useMemo(() => {
      if (networkScope === 'ALL') return nodes;
      return nodes.filter(n => n.network === networkScope);
  }, [nodes, networkScope]);

  const selectedNodes = useMemo(() => {
      return selectedKeys.map(key => availableNodes.find(n => n.pubkey === key)).filter((n): n is Node => !!n);
  }, [selectedKeys, availableNodes]);

  const benchmarks = useMemo(() => {
      if (availableNodes.length === 0) return { network: {}, leader: {}, networkRaw: {}, leaderRaw: {} };

      let leaderNode: Node | null = null;
      if (leaderMetric === 'STORAGE') leaderNode = availableNodes.reduce((p, c) => (p.storage_committed || 0) > (c.storage_committed || 0) ? p : c, availableNodes[0]);
      else if (leaderMetric === 'CREDITS') leaderNode = availableNodes.reduce((p, c) => (p.credits || 0) > (c.credits || 0) ? p : c, availableNodes[0]);
      else if (leaderMetric === 'HEALTH') leaderNode = availableNodes.reduce((p, c) => (p.health || 0) > (c.health || 0) ? p : c, availableNodes[0]);
      else if (leaderMetric === 'UPTIME') leaderNode = availableNodes.reduce((p, c) => (p.uptime || 0) > (c.uptime || 0) ? p : c, availableNodes[0]);

      const healths = availableNodes.map(n => n.health || 0);
      const storages = availableNodes.map(n => n.storage_committed || 0);
      const credits = availableNodes.map(n => n.credits || 0);
      const uptimes = availableNodes.map(n => n.uptime || 0);

      const getMedian = (vals: number[]) => { if (vals.length === 0) return 0; const sorted = [...vals].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };

      const netHealthRaw = Math.round(healths.reduce((a, b) => a + b, 0) / healths.length) || 0;
      const netUptimeRaw = Math.round(uptimes.reduce((a, b) => a + b, 0) / uptimes.length) || 0;
      const netStorageRaw = getMedian(storages);
      const netCreditsRaw = getMedian(credits);
      const netVersion = 'v1.2.0'; 

      const leaderRaw = leaderNode ? { health: leaderNode.health || 0, storage: leaderNode.storage_committed || 0, credits: leaderNode.credits || 0, uptime: leaderNode.uptime || 0, version: leaderNode.version || 'N/A' } : { health: 0, storage: 0, credits: 0, uptime: 0, version: 'N/A' };

      return {
          network: { health: netHealthRaw.toString(), uptime: formatUptimePrecise(netUptimeRaw), storage: formatBytes(netStorageRaw), credits: netCreditsRaw.toLocaleString(), version: netVersion },
          leader: { health: leaderRaw.health.toString(), uptime: formatUptimePrecise(leaderRaw.uptime), storage: formatBytes(leaderRaw.storage), credits: leaderRaw.credits.toLocaleString(), version: leaderRaw.version },
          networkRaw: { health: netHealthRaw, storage: netStorageRaw, credits: netCreditsRaw, uptime: netUptimeRaw },
          leaderRaw
      };
  }, [availableNodes, leaderMetric]);

  const currentWinners = useMemo(() => {
      if (selectedNodes.length === 0) return { storage: 0, credits: 0, health: 0 };
      return { storage: Math.max(...selectedNodes.map(n => n.storage_committed || 0)), credits: Math.max(...selectedNodes.map(n => n.credits || 0)), health: Math.max(...selectedNodes.map(n => n.health || 0)) };
  }, [selectedNodes]);

  const overallWinnerKey = useMemo(() => {
      if (selectedNodes.length < 2) return null;
      let bestScore = -1; let bestKey = null;
      const maxH = Math.max(...selectedNodes.map(n => n.health || 1)); const maxS = Math.max(...selectedNodes.map(n => n.storage_committed || 1)); const maxC = Math.max(...selectedNodes.map(n => n.credits || 1));
      selectedNodes.forEach(n => { const score = ((n.health || 0)/maxH) + ((n.storage_committed || 0)/maxS) + ((n.credits || 0)/maxC); if (score > bestScore) { bestScore = score; bestKey = n.pubkey; } });
      return bestKey;
  }, [selectedNodes]);

  // --- EFFECTS & HANDLERS ---
  useEffect(() => { const saved = localStorage.getItem('xandeum_favorites'); if (saved) setFavorites(JSON.parse(saved)); }, []);
  const updateUrl = (keys: string[]) => router.replace({ pathname: '/compare', query: { nodes: keys.join(',') } }, undefined, { shallow: true });

  const addNode = (pubkey: string) => { if (!selectedKeys.includes(pubkey) && selectedKeys.length < 30) { const k = [...selectedKeys, pubkey]; setSelectedKeys(k); updateUrl(k); setIsSearchOpen(false); setSearchQuery(''); setIsWatchlistOpen(false); } };
  const removeNode = (pubkey: string) => { const k = selectedKeys.filter(x => x !== pubkey); setSelectedKeys(k); updateUrl(k); };
  const clearAllNodes = () => { setSelectedKeys([]); updateUrl([]); };

  useEffect(() => {
    if (selectedKeys.length > prevNodeCount.current) {
        if (printRef.current) {
            const maxScroll = printRef.current.scrollWidth - printRef.current.clientWidth;
            const targetScroll = Math.max(0, maxScroll - 70); 
            printRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
    }
    prevNodeCount.current = selectedKeys.length;
  }, [selectedKeys.length]);

  const hasProcessedDeepLink = useRef(false);
  useEffect(() => {
    if (!router.isReady || loading || nodes.length === 0 || hasProcessedDeepLink.current) return;
    const { nodes: nodesParam, network: networkParam } = router.query;
    if (nodesParam && typeof nodesParam === 'string') {
        const keys = nodesParam.split(',');
        if (networkParam && typeof networkParam === 'string') {
            const upperNet = networkParam.toUpperCase();
            if (upperNet === 'MAINNET' || upperNet === 'DEVNET') {
                setNetworkScope(upperNet as 'MAINNET' | 'DEVNET');
            }
        }
        setSelectedKeys(keys);
        setShowNetwork(true);
        hasProcessedDeepLink.current = true;
    }
  }, [router.isReady, loading, nodes, router.query]);

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setToast('Link Copied!'); setTimeout(() => setToast(null), 2000); };
  
  const handleExport = async () => {
    if (printRef.current) {
      try {
        const dataUrl = await toPng(printRef.current, {
          cacheBust: true,
          backgroundColor: '#020202',
          pixelRatio: 2, 
          width: printRef.current.scrollWidth, 
          height: printRef.current.scrollHeight,
          filter: (node) => {
             if (node instanceof HTMLElement && node.classList.contains('print-exclude')) return false;
             return true;
          },
          style: { overflow: 'visible' }
        });
        const link = document.createElement('a');
        link.download = `pulse-report-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) { console.error("Export failed:", err); setToast('Export Failed'); setTimeout(() => setToast(null), 2000); }
    }
  };

  const watchlistNodes = availableNodes.filter(n => favorites.includes(n.address || ''));

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden relative">
      <Head><title>Pulse Compare</title></Head>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#18181b_0%,#020202_100%)] pointer-events-none z-0"></div>

      {/* BACK BUTTON */}
      <div className="absolute top-4 left-4 z-[60]">
        <Link href="/" className="flex items-center justify-center p-3 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:bg-white/10 hover:border-white/20 transition group">
            <ArrowLeft size={18} className="text-red-500/80 group-hover:text-red-400" />
        </Link>
      </div>

       {/* NETWORK SWITCHER */}
       <div className="absolute top-4 right-4 z-[60]" ref={networkRef}>
          <button onClick={() => setIsNetworkOpen(!isNetworkOpen)} className="flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900/40 backdrop-blur-md text-white text-[10px] font-bold uppercase transition border border-white/5 hover:bg-white/10">
              <div className={`w-2 h-2 rounded-full ${networkScope === 'MAINNET' ? 'bg-green-500' : networkScope === 'DEVNET' ? 'bg-blue-500' : 'bg-white'}`}></div>
              {networkScope === 'ALL' ? 'ALL NETWORKS' : networkScope} <ChevronDown size={12} />
          </button>
          {isNetworkOpen && <div className="absolute top-full right-0 mt-2 w-44 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">{[{ id: 'ALL', label: 'All Networks', color: 'bg-white' }, { id: 'MAINNET', label: 'Mainnet', color: 'bg-green-500' }, { id: 'DEVNET', label: 'Devnet', color: 'bg-blue-500' }].map(opt => (<button key={opt.id} onClick={() => { setNetworkScope(opt.id as any); setIsNetworkOpen(false); }} className="px-4 py-3 text-[10px] font-bold text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition uppercase flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${opt.color}`}></div> {opt.label}</button>))}</div>}
      </div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white text-black font-black uppercase text-xs rounded-full animate-in fade-in slide-in-from-top-4 flex items-center gap-2 shadow-2xl"><CheckCircle size={14}/>{toast}</div>}

      <header className="shrink-0 pt-20 md:pt-6 pb-4 px-4 md:px-8 relative z-50 flex justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-full px-8 py-3 shadow-2xl">
                <h1 className="text-base font-bold text-white uppercase tracking-widest">COMPARATIVE INTELLIGENCE</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
                        <Plus size={14} />
                    </button>
                    <span className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        Selected: <span className="text-zinc-200">{selectedNodes.length}</span>
                    </span>
                </div>
                {selectedKeys.length > 0 && (
                    <button onClick={clearAllNodes} className="text-[9px] md:text-[10px] font-black text-red-500/80 hover:text-red-400 uppercase tracking-tighter border-l border-white/10 pl-4 transition">
                        Clear All
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="px-4 md:px-8 pb-6 relative z-50 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-5xl">
            <button onClick={() => setShowNetwork(!showNetwork)} className={`flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg text-[8px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border w-auto ${showNetwork ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{showNetwork ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-zinc-500"></div>} VS NETWORK</button>

            <div className="relative" ref={leaderRef}>
                <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg text-[8px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border w-auto ${leaderMetric ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{leaderMetric ? `VS ${leaderMetric} LEADER` : 'VS LEADER'} <ChevronDown size={12} /></button>
                {isLeaderDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-36 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">
                        {['STORAGE', 'CREDITS', 'HEALTH', 'UPTIME', 'NONE'].map(opt => (
                            <button 
                                key={opt} 
                                onClick={() => { 
                                    setLeaderMetric(opt === 'NONE' ? null : opt as any); 
                                    setIsLeaderDropdownOpen(false); 
                                }} 
                                className={`px-4 py-3 text-[9px] font-bold text-left hover:bg-zinc-800 transition uppercase ${opt === 'NONE' ? 'text-zinc-600 hover:text-zinc-400 border-t border-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {opt === 'NONE' ? 'None (Reset)' : opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative" ref={watchlistRef}>
                <button onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg bg-black/40 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white text-[8px] md:text-[10px] font-bold uppercase transition whitespace-nowrap w-auto"><Star size={12} /> WATCHLIST <ChevronDown size={12} /></button>
                {isWatchlistOpen && <div className="absolute top-full left-0 mt-2 w-56 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col max-h-64 overflow-y-auto">{watchlistNodes.length > 0 ? watchlistNodes.map(n => (<button key={n.pubkey} onClick={() => addNode(n.pubkey!)} disabled={selectedKeys.includes(n.pubkey!)} className={`px-4 py-3 text-[10px] font-bold text-left flex justify-between items-center ${selectedKeys.includes(n.pubkey!) ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'}`}><span>{getSafeIp(n)}</span>{selectedKeys.includes(n.pubkey!) && <CheckCircle size={12} />}</button>)) : <div className="p-4 text-[10px] text-zinc-600 text-center">No Favorites</div>}</div>}
            </div>

            <button onClick={handleShare} className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[8px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border border-zinc-700 w-auto"><Share2 size={12}/> SHARE</button>
            <button onClick={handleExport} className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[8px] md:text-[10px] font-bold uppercase transition shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap w-auto"><Download size={12}/> REPORT CARD</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative z-10 px-4 pb-4 md:px-8 md:pb-8 flex flex-col max-w-[1600px] mx-auto w-full">
         <div className="flex-initial min-h-[400px] flex flex-col bg-[#09090b]/60 backdrop-blur-2xl rounded-xl border border-white/5 shadow-2xl overflow-hidden relative mb-6">
             {selectedNodes.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden h-[400px]">
                    {/* BACKGROUND SPINNER + PULSE */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] scale-[2]">
                        <div className="animate-[spin_60s_linear_infinite]"><Grid size={300} /></div>
                    </div>
                    {/* SHOCKWAVE PULSE */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-96 h-96 bg-cyan-500/5 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        {/* CYAN BUTTON */}
                        <button onClick={() => setIsSearchOpen(true)} className="px-10 py-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-50 hover:bg-cyan-500/20 font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all hover:scale-105 flex items-center gap-2 mb-2">
                            <Plus size={16} className="animate-pulse" /> Add Node
                        </button>
                        
                        <div className="flex flex-col items-center gap-1">
                            <h2 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-[0.2em]">Compare Nodes</h2>
                            <p className="text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide max-w-xs text-center leading-relaxed">
                                Select a minimum of 2 nodes for head-to-head analysis against the network or top performers.
                            </p>
                        </div>
                        <div className="text-[9px] uppercase font-bold text-zinc-600">Current Network: <span className="text-zinc-400">{networkScope}</span></div>
                    </div>
                 </div>
             ) : (
                 <main ref={printRef} className="flex-1 overflow-x-auto overflow-y-auto bg-transparent relative flex custom-scrollbar snap-x items-start content-start">
                    <ControlRail showNetwork={showNetwork} leaderMetric={leaderMetric} benchmarks={benchmarks} />
                    {selectedNodes.map((node, index) => {
                        const isWinner = {
                            health: (node.health || 0) === currentWinners.health,
                            storage: (node.storage_committed || 0) === currentWinners.storage,
                            credits: (node.credits || 0) === currentWinners.credits
                        };
                        return (
                            <NodeColumn 
                                key={node.pubkey} 
                                node={node} 
                                onRemove={() => removeNode(node.pubkey!)} 
                                anchorNode={selectedNodes[0]} 
                                theme={PLAYER_THEMES[index % PLAYER_THEMES.length]} 
                                winners={isWinner}
                                overallWinner={node.pubkey === overallWinnerKey}
                                benchmarks={benchmarks}
                                leaderMetric={leaderMetric}
                                showNetwork={showNetwork}
                            />
                        );
                    })}
                    {selectedNodes.length < 30 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
                    <div className="w-8 shrink-0"></div>
                </main>
             )}
         </div>

         {/* ANALYTICS DECK */}
         <SynthesisEngine 
            nodes={selectedNodes} 
            themes={PLAYER_THEMES} 
            networkScope={networkScope} 
            benchmarks={benchmarks} 
         />
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsSearchOpen(false)}>
              <div className="w-full max-w-xl bg-[#09090b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/30">
                      <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Add Source ({networkScope})</h3>
                          <button onClick={() => setIsSearchOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-center gap-3 bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
                          <Search size={16} className="text-zinc-500" />
                          <input autoFocus type="text" placeholder="Search..." className="bg-transparent w-full text-xs text-white outline-none placeholder-zinc-600 font-mono" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                      {availableNodes.filter(n => !searchQuery || n.pubkey?.toLowerCase().includes(searchQuery.toLowerCase()) || getSafeIp(n).includes(searchQuery)).map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} disabled={selectedKeys.includes(node.pubkey!)} className={`w-full text-left p-3 rounded-xl flex justify-between items-center group transition mb-1 border border-transparent ${selectedKeys.includes(node.pubkey!) ? 'opacity-50 cursor-not-allowed bg-zinc-900/30' : 'hover:bg-zinc-900/80 hover:border-zinc-800 cursor-pointer'}`}>
                              <div>
                                  <div className="text-xs font-bold text-zinc-200 group-hover:text-white font-mono flex items-center gap-3">{getSafeIp(node)}<span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${node.network === 'MAINNET' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{node.network}</span></div>
                                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{node.pubkey?.slice(0, 24)}...</div>
                              </div>
                              {selectedKeys.includes(node.pubkey!) ? <CheckCircle size={16} className="text-green-500"/> : <Plus size={14} className="text-zinc-600 group-hover:text-white"/>}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
