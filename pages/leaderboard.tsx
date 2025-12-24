import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Trophy, Medal, ArrowLeft, Search, Wallet, X, 
  Activity, Users, BarChart3, HelpCircle, Star, 
  Calculator, Zap, ChevronDown, 
  ExternalLink, ArrowUpRight, Eye, MapPin, Copy, Check, Share2, ArrowUp, ArrowDown,
  AlertOctagon, ChevronDown as ChevronIcon 
} from 'lucide-react';

interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  address?: string;
  location?: {
      countryName: string;
      countryCode: string;
  };
  trend: number; 
}

const ERA_BOOSTS = { 'DeepSouth': 16, 'South': 10, 'Main': 7, 'Coal': 3.5, 'Central': 2, 'North': 1.25 };
const NFT_BOOSTS = { 'Titan': 11, 'Dragon': 4, 'Coyote': 2.5, 'Rabbit': 1.5, 'Cricket': 1.1, 'XENO': 1.1 };

export default function Leaderboard() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsOffline, setCreditsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // --- PAGINATION STATE ---
  const [visibleCount, setVisibleCount] = useState(100);

  // Simulator State
  const [showSim, setShowSim] = useState(false);
  const [showHardwareCalc, setShowHardwareCalc] = useState(false);
  
  // Inputs
  const [baseCreditsInput, setBaseCreditsInput] = useState<number>(0);
  const [simNodes, setSimNodes] = useState<number>(1);
  const [simStorageVal, setSimStorageVal] = useState<number>(1);
  const [simStorageUnit, setSimStorageUnit] = useState<'MB' | 'GB' | 'TB' | 'PB'>('TB');
  const [simStake, setSimStake] = useState<number>(1000); 
  const [simPerf, setSimPerf] = useState(0.95);
  const [simBoosts, setSimBoosts] = useState<number[]>([]); 
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Expanded Row
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  
  // Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const hasDeepLinked = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits').catch(() => ({ data: [] })), 
          axios.get('/api/stats').catch(() => ({ data: { result: { pods: [] } } }))
        ]);

        const metaMap = new Map<string, { address: string, location?: any }>();
        if (statsRes.data?.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                metaMap.set(node.pubkey, { address: node.address, location: node.location });
            });
        }

        const rawData = creditsRes.data.pods_credits || creditsRes.data;
        
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
             setCreditsOffline(true);
             setRanking([]); 
        } else {
            setCreditsOffline(false);
            
            // 1. Fetch History
            let history: Record<string, number> = {};
            try {
                const h = localStorage.getItem('xandeum_rank_history');
                if (h) history = JSON.parse(h);
            } catch (e) {}
            
            const newHistory: Record<string, number> = {};

            // 2. Parse
            const parsedList: RankedNode[] = rawData.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = metaMap.get(pKey);
                return {
                pubkey: pKey,
                credits: Number(item.credits || 0),
                rank: 0, 
                address: meta?.address,
                location: meta?.location,
                trend: 0
                };
            });

            // 3. Sort & Rank
            parsedList.sort((a, b) => b.credits - a.credits);
            
            let currentRank = 1;
            for (let i = 0; i < parsedList.length; i++) {
                if (i > 0 && parsedList[i].credits < parsedList[i - 1].credits) currentRank = i + 1;
                parsedList[i].rank = currentRank;
                
                // Trend
                const prevRank = history[parsedList[i].pubkey];
                if (prevRank) parsedList[i].trend = prevRank - currentRank;
                newHistory[parsedList[i].pubkey] = currentRank;
            }

            localStorage.setItem('xandeum_rank_history', JSON.stringify(newHistory));
            setRanking(parsedList);
            
            // --- UPDATED DEEP LINK LOGIC (Fixes Modal Scroll) ---
            if (router.isReady && router.query.highlight && !hasDeepLinked.current) {
                const targetKey = router.query.highlight as string;
                const targetIndex = parsedList.findIndex(n => n.pubkey === targetKey);

                if (targetIndex !== -1) {
                    hasDeepLinked.current = true;

                    // 1. Force the list to grow if the target is hidden
                    if (targetIndex >= 100) {
                        setVisibleCount(targetIndex + 20);
                    }

                    // 2. Expand and Scroll (Delayed to allow render)
                    setTimeout(() => {
                        setExpandedNode(targetKey);
                        
                        setTimeout(() => {
                            const el = document.getElementById(`node-${targetKey}`);
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100); 
                    }, 600);
                }
            }
        }

        const saved = localStorage.getItem('xandeum_favorites');
        if (saved) setFavorites(JSON.parse(saved));

      } catch (err) {
        console.error("Leaderboard Fatal:", err);
        setCreditsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router.isReady, router.query.highlight]);

  // Hardware Calc Logic
  useEffect(() => {
      if (showHardwareCalc) {
          let storageInGB = simStorageVal;
          if (simStorageUnit === 'MB') storageInGB = simStorageVal / 1000;
          if (simStorageUnit === 'TB') storageInGB = simStorageVal * 1000;
          if (simStorageUnit === 'PB') storageInGB = simStorageVal * 1000000;
          const calculated = simNodes * storageInGB * simPerf * simStake;
          setBaseCreditsInput(calculated);
      }
  }, [simNodes, simStorageVal, simStorageUnit, simStake, simPerf, showHardwareCalc]);

  // OPTIMIZATION: Memoize filtering to keep interactions snappy
  const filtered = useMemo(() => {
    return ranking.filter(n => n.pubkey.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [ranking, searchQuery]);

  const handleRowClick = (node: RankedNode) => {
      setBaseCreditsInput(node.credits);
      setShowHardwareCalc(false);
      setExpandedNode(expandedNode === node.pubkey ? null : node.pubkey);
  };

  const handleUseInSim = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowSim(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 100);
  };

  const calculateFinal = () => {
      let multiplier = 1;
      if (simBoosts.length > 0) multiplier = simBoosts.reduce((a, b) => a * b, 1);
      return { boosted: baseCreditsInput * multiplier, multiplier };
  };

  const simResult = calculateFinal();
  
  const toggleBoost = (val: number) => {
      if (simBoosts.includes(val)) setSimBoosts(simBoosts.filter(b => b !== val));
      else setSimBoosts([...simBoosts, val]);
  };

  const toggleTooltip = (id: string) => {
      setActiveTooltip(activeTooltip === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      <Head><title>Xandeum Pulse - Credits & Reputation</title></Head>

      {/* HEADER */}
      <div className="max-w-5xl mx-4 md:mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Monitor
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-yellow-500 justify-center"><Trophy size={32} /> CREDITS & REPUTATION</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-wide uppercase">The definitive registry of node reputation and network contribution</p>
        </div>
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* --- STOINC SIMULATOR WIDGET --- */}
      <div className="max-w-5xl mx-auto mb-10 bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all duration-300">
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer hover:bg-yellow-500/20 transition" onClick={() => setShowSim(!showSim)}>
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 text-black rounded-lg animate-pulse"><Calculator size={20} /></div>
                  <div>
                      <h2 className="font-bold text-yellow-500 text-sm uppercase tracking-widest">STOINC Simulator</h2>
                      <p className="text-[10px] text-zinc-400">Estimate forecasted earnings based on official Xandeum calculations</p>
                  </div>
              </div>
              {showSim ? <ChevronDown size={20} className="rotate-180 text-yellow-500 transition-transform" /> : <ChevronDown size={20} className="text-zinc-500 transition-transform" />}
          </div>

          {showSim && (
              <div className="p-6 md:p-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                          <div className={`relative ${showHardwareCalc ? 'hidden' : 'block'}`}>
                              <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2 text-zinc-400"><span className="text-xs font-bold uppercase tracking-wider text-white">Base Reputation Credits</span><HelpCircle size={12} className="cursor-help hover:text-white" onClick={() => toggleTooltip('base_input')} /></div>
                                  <button onClick={() => setShowHardwareCalc(true)} className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1">Don't know? Calculate from Hardware</button>
                              </div>
                              {activeTooltip === 'base_input' && <div className="absolute z-10 bg-zinc-800 border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 w-full -top-12 left-0 shadow-xl">The raw score derived from (Nodes × Storage × Stake). Select a node below to auto-fill, or type a hypothetical value.</div>}
                              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-yellow-500 transition-all">
                                  <input type="number" min="0" value={baseCreditsInput} onChange={(e) => setBaseCreditsInput(Number(e.target.value))} className="w-full bg-transparent p-4 text-white text-2xl font-mono font-bold outline-none" placeholder="0" />
                                  <span className="pr-6 text-xs font-bold text-zinc-600">CREDITS</span>
                              </div>
                          </div>

                          {showHardwareCalc && (
                              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 relative">
                                  <div className="flex justify-between items-center mb-2">
                                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Hardware Specs Calculator</div>
                                      <button onClick={() => setShowHardwareCalc(false)} className="text-[10px] text-zinc-500 hover:text-white underline">Hide Calculator</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Fleet Size</label><input type="number" min="1" value={simNodes} onChange={(e) => setSimNodes(Math.max(1, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono outline-none focus:border-blue-500"/></div>
                                      <div><label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">XAND Stake</label><input type="number" min="0" value={simStake} onChange={(e) => setSimStake(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono outline-none focus:border-blue-500"/></div>
                                  </div>
                                  <div>
                                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Total Storage</label>
                                      <div className="flex gap-2">
                                          <input type="number" min="1" value={simStorageVal} onChange={(e) => setSimStorageVal(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono outline-none focus:border-blue-500"/>
                                          <select value={simStorageUnit} onChange={(e) => setSimStorageUnit(e.target.value as any)} className="bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-300 text-xs font-bold outline-none"><option>MB</option><option>GB</option><option>TB</option><option>PB</option></select>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="relative pt-4 border-t border-zinc-800">
                              <div className="flex items-center gap-2 mb-3 text-zinc-400"><span className="text-xs font-bold uppercase tracking-wider">Apply Boosts (NFTs / Eras)</span><HelpCircle size={12} className="cursor-help hover:text-white" onClick={() => toggleTooltip('boost')} /></div>
                              {activeTooltip === 'boost' && <div className="absolute z-10 bg-zinc-800 border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 w-64 -top-12 left-0 shadow-xl">Multipliers from NFTs and pNode Eras. Stacks geometrically.</div>}
                              <div className="flex flex-wrap gap-2">
                                  {Object.entries({...ERA_BOOSTS, ...NFT_BOOSTS}).map(([name, val]) => (
                                      <button key={name} onClick={() => toggleBoost(val)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${simBoosts.includes(val) ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}>{name} <span className="opacity-60">x{val}</span></button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col justify-center space-y-6 relative">
                          <div className="text-center relative">
                              <div className="text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center justify-center gap-1">Total Boost Factor</div>
                              <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-2"><Zap size={24} className={simResult.multiplier > 1 ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"} />{simResult.multiplier.toLocaleString(undefined, { maximumFractionDigits: 4 })}x</div>
                          </div>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 relative"><span className="text-xs text-zinc-400 flex items-center gap-1">Projected Credits</span><span className="font-mono text-2xl font-bold text-yellow-500 text-shadow-glow">{simResult.boosted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                              {/* If offline, we can't calc share */}
                              {!creditsOffline ? (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center relative">
                                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center justify-center gap-1">Est. Network Share</div>
                                    <div className="text-2xl font-bold text-white">{ranking.length > 0 ? ((simResult.boosted / (ranking.reduce((a,b)=>a+b.credits, 0) + simResult.boosted)) * 100).toFixed(8) : '0.00'}%</div>
                                    <div className="text-[9px] text-blue-300/50 mt-1">of Total Epoch Rewards</div>
                                </div>
                              ) : (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center relative">
                                    <div className="text-[10px] text-red-400 font-bold uppercase mb-1 flex items-center justify-center gap-1">Network Offline</div>
                                    <div className="text-xs text-zinc-400">Cannot calculate share</div>
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* NETWORK STATS BAR */}
      {!loading && !creditsOffline && ranking.length > 0 && (
        <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm"><div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Users size={12}/> Nodes Fetched</div><div className="text-2xl font-bold text-white">{ranking.length}</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm"><div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Wallet size={12}/> Total Credits Issued</div><div className="text-2xl font-bold text-yellow-400 mt-1">{(ranking.reduce((sum, n) => sum + n.credits, 0) / 1000000).toFixed(1)}M</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm"><div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Activity size={12}/> Avg Credits</div><div className="text-2xl font-bold text-white mt-1">{Math.round(ranking.reduce((sum, n) => sum + n.credits, 0) / ranking.length).toLocaleString()}</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm"><div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><BarChart3 size={12}/> Top 10 Dominance</div><div className="text-2xl font-bold text-blue-400 mt-1">{(() => { const total = ranking.reduce((sum, n) => sum + n.credits, 0); const top10 = ranking.slice(0, 10).reduce((sum, n) => sum + n.credits, 0); return total > 0 ? ((top10 / total) * 100).toFixed(1) : 0; })()}%</div></div>
        </div>
      )}

      {/* SEARCH & TIPS */}
      <div className="max-w-5xl mx-auto mb-6 relative space-y-3">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input type="text" placeholder="Find node by public key..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 pr-10 text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"><X size={20} /></button>)}
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-7">Node Public Key</div>
          <div className="col-span-4 text-right">Credits</div>
        </div>

        {/* --- CRASHPROOF ERROR STATE --- */}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center animate-pulse text-zinc-500 font-mono flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                CALCULATING FORTUNES...
             </div>
          </div>
        ) : creditsOffline ? (
          <div className="p-20 text-center flex flex-col items-center justify-center h-full">
              <AlertOctagon size={48} className="text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Credits System Offline</h3>
              <p className="text-sm text-zinc-500 max-w-sm">The upstream Xandeum Credits API is currently unreachable. Leaderboard rankings are temporarily unavailable.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-zinc-600"><Search size={48} className="mx-auto mb-4 opacity-50" /><p>No nodes match your search.</p></div>
        ) : (
          <div className="divide-y-0 px-2 pb-2">
            {/* RENDER LOGIC: Filter first, then Slice */}
            {filtered.slice(0, visibleCount).map((node) => {
              const isMyNode = node.address && favorites.includes(node.address);
              const isExpanded = expandedNode === node.pubkey;
              const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` : null;

              return (
                <div 
                    key={node.pubkey} 
                    id={`node-${node.pubkey}`} 
                    className={`
                        relative transition-all duration-300 ease-out mb-2 rounded-xl border
                        ${isExpanded 
                           ? 'scale-[1.02] z-10 bg-black border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                           : 'scale-100 bg-zinc-900/30 border-transparent hover:scale-[1.01] hover:bg-zinc-800 hover:border-zinc-600'
                        }
                        ${isMyNode && !isExpanded ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
                    `}
                >
                    <div className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer" onClick={() => handleRowClick(node)}>
                        
                        {/* RANK */}
                        <div className="col-span-2 md:col-span-1 flex flex-col justify-center items-center gap-1 relative">
                            <div className="flex items-center gap-1">
                                {node.rank === 1 && <Trophy size={16} className="text-yellow-400" />}
                                {node.rank > 1 && node.rank <= 3 && <Medal size={16} className={node.rank === 2 ? "text-zinc-300" : "text-amber-600"} />}
                                <span className={`text-sm font-bold ${node.rank <= 3 ? 'text-white' : 'text-zinc-500'}`}>#{node.rank}</span>
                            </div>
                            
                            {/* WHALE WATCH TREND */}
                            {node.trend !== 0 && (
                                <div className={`text-[9px] font-bold flex items-center ${node.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {node.trend > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />} {Math.abs(node.trend)}
                                </div>
                            )}
                        </div>

                        {/* PUBKEY & ADDRESS */}
                        <div className="col-span-6 md:col-span-7 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition flex items-center justify-between pr-4">
                            <span>{node.pubkey}</span>
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-cyan-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}><ChevronDown size={16} /></div>
                        </div>

                        {/* CREDITS */}
                        <div className="col-span-4 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                            {node.credits.toLocaleString()}
                            <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                        </div>
                    </div>

                    {/* EXPANDED ACTIONS */}
                    {isExpanded && (
                        <div className="border-t border-zinc-800/50 p-4 pl-4 md:pl-12 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    
                                    {/* ROW 1: ACTIONS */}
                                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                        {/* 1. VIEW ON MAP */}
                                        {node.address && (
                                            <Link href={`/map?focus=${node.address.split(':')[0]}`}>
                                                <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-xs font-bold text-blue-400 transition-all whitespace-nowrap">
                                                    {flagUrl ? <img src={flagUrl} className="w-4 rounded-sm" alt="flag"/> : <MapPin size={14} />}
                                                    VIEW ON MAP
                                                </button>
                                            </Link>
                                        )}

                                        {/* 2. VIEW DIAGNOSTICS */}
                                        <Link href={`/?open=${node.pubkey}`}>
                                            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs font-bold text-white transition-all shadow-lg hover:shadow-blue-500/10 whitespace-nowrap">
                                                <Activity size={14} className="text-green-400" />
                                                VIEW DIAGNOSTICS
                                                <ExternalLink size={10} className="text-zinc-500" />
                                            </button>
                                        </Link>

                                        {/* 3. CALCULATE */}
                                        <button 
                                            onClick={handleUseInSim}
                                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-xs font-bold text-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/10 whitespace-nowrap"
                                        >
                                            <Calculator size={14} />
                                            CALC
                                            <ArrowUpRight size={10} className="text-yellow-500/50" />
                                        </button>
                                    </div>

                                    {/* ROW 2: UTILS */}
                                    <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                        <button 
                                            onClick={(e) => handleCopyKey(e, node.pubkey)}
                                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition"
                                        >
                                            {copiedKey === node.pubkey ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                            {copiedKey === node.pubkey ? 'COPIED KEY' : 'COPY KEY'}
                                        </button>

                                        {/* SHARE RANK BUTTON */}
                                        <button 
                                            onClick={(e) => handleShareUrl(e, node.pubkey)}
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition"
                                        >
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
            
            {/* LOAD MORE BUTTON */}
            {visibleCount < filtered.length ? (
                <div className="p-4 flex justify-center border-t border-zinc-800">
                    <button 
                        onClick={handleLoadMore}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                    >
                        <ChevronIcon size={16} /> LOAD NEXT 100 NODES
                    </button>
                </div>
            ) : filtered.length > 0 && (
                <div className="p-4 text-center border-t border-zinc-800 text-xs text-zinc-600 font-mono uppercase">
                    --- END OF LIST ---
                </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {!loading && !creditsOffline && (
        <div className="max-w-5xl mx-auto mt-6 text-center text-xs text-zinc-600 flex flex-col md:flex-row items-center justify-center gap-2">
          {/* UPDATED FOOTER STATS */}
          <div className="flex items-center gap-2"><Eye size={12} />
              <span>Showing <span className="text-zinc-400 font-bold">{Math.min(visibleCount, filtered.length)}</span> of <span className="text-zinc-400 font-bold">{filtered.length}</span> nodes.</span>
          </div>
          <span className="hidden md:inline text-zinc-700">•</span>
          <span className="text-zinc-500">(Scroll or search to find others)</span>
          
          {/* NEW ADDITION */}
          <span className="hidden md:inline text-zinc-700">•</span>
          <span className="text-zinc-600">
            Data sourced directly from the <a href="https://podcredits.xandeum.network/api/pods-credits" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white underline underline-offset-2 transition-colors">podcredits API</a>.
          </span>
        </div>
      )}
    </div>
  );
}
