import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trophy, Medal, ArrowLeft, Search, Wallet, X, ChevronRight, Activity, Users, BarChart3, HelpCircle, Star, Calculator, TrendingUp, Zap, Info, ChevronDown, ChevronUp, PlayCircle, RefreshCw, ExternalLink, ArrowUpRight } from 'lucide-react';

interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  address?: string;
}

const ERA_BOOSTS = {
    'DeepSouth': 16,
    'South': 10,
    'Main': 7,
    'Coal': 3.5,
    'Central': 2,
    'North': 1.25
};

const NFT_BOOSTS = {
    'Titan': 11,
    'Dragon': 4,
    'Coyote': 2.5,
    'Rabbit': 1.5,
    'Cricket': 1.1,
    'XENO': 1.1
};

export default function Leaderboard() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // --- SIMULATOR STATE ---
  const [showSim, setShowSim] = useState(false);
  const [showHardwareCalc, setShowHardwareCalc] = useState(false);
  
  // The Core Input (Auto-filled on row click)
  const [baseCreditsInput, setBaseCreditsInput] = useState<number>(0);
  
  // Hardware Calculator Inputs
  const [simNodes, setSimNodes] = useState<number>(1);
  const [simStorageVal, setSimStorageVal] = useState<number>(1);
  const [simStorageUnit, setSimStorageUnit] = useState<'MB' | 'GB' | 'TB' | 'PB'>('TB');
  const [simStake, setSimStake] = useState<number>(1000); 
  const [simPerf, setSimPerf] = useState(0.95);
  
  // Boosts
  const [simBoosts, setSimBoosts] = useState<number[]>([]); 
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // EXPANDED ROW STATE
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits'),
          axios.get('/api/stats')
        ]);

        const addressMap = new Map<string, string>();
        if (statsRes.data.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                addressMap.set(node.pubkey, node.address);
            });
        }

        const rawData = creditsRes.data.pods_credits || creditsRes.data;
        let parsedList: RankedNode[] = [];

        if (Array.isArray(rawData)) {
          parsedList = rawData.map((item: any) => ({
            pubkey: item.pod_id || item.pubkey || 'Unknown',
            credits: Number(item.credits || 0),
            rank: 0,
            address: addressMap.get(item.pod_id || item.pubkey)
          }));
        } else if (typeof rawData === 'object') {
          parsedList = Object.entries(rawData).map(([key, val]: [string, any]) => {
            if (key === 'status' || key === 'success') return null;
            const pKey = val?.pod_id || val?.pubkey || key;
            return {
              pubkey: pKey,
              credits: typeof val === 'number' ? val : Number(val?.credits || 0),
              rank: 0,
              address: addressMap.get(pKey)
            };
          }).filter(Boolean) as RankedNode[];
        }

        parsedList.sort((a, b) => b.credits - a.credits);
        
        let currentRank = 1;
        for (let i = 0; i < parsedList.length; i++) {
          if (i > 0 && parsedList[i].credits < parsedList[i - 1].credits) {
            currentRank = i + 1;
          }
          parsedList[i].rank = currentRank;
        }

        setRanking(parsedList);
        
        // Auto-fill top node for demo if input is empty
        if (parsedList.length > 0 && baseCreditsInput === 0) setBaseCreditsInput(parsedList[0].credits);

        const saved = localStorage.getItem('xandeum_favorites');
        if (saved) setFavorites(JSON.parse(saved));

      } catch (err) {
        console.error("Leaderboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update Base Credits when Hardware Inputs Change (If Hardware Calc is Open)
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

  const filtered = ranking.filter(n => 
    n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- INTERACTION HANDLERS ---

  const handleRowClick = (node: RankedNode) => {
      // 1. Auto-fill the simulator (Backend Logic)
      setBaseCreditsInput(node.credits);
      setShowHardwareCalc(false); // Switch to manual/auto input mode

      // 2. Toggle Expansion (UI Logic)
      if (expandedNode === node.pubkey) {
          setExpandedNode(null);
      } else {
          setExpandedNode(node.pubkey);
      }
  };

  const handleUseInSim = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowSim(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateFinal = () => {
      let multiplier = 1;
      if (simBoosts.length > 0) {
          const totalBoostProduct = simBoosts.reduce((a, b) => a * b, 1);
          multiplier = totalBoostProduct; 
      }
      return { 
          boosted: baseCreditsInput * multiplier, 
          multiplier 
      };
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
      <Head>
        <title>Xandeum Pulse - Reputation & Earnings</title>
      </Head>

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Monitor
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-yellow-500 justify-center">
            <Trophy size={32} /> REPUTATION LEDGER
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-wide uppercase">The definitive registry of node reputation and network contribution</p>
        </div>
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* --- STOINC SIMULATOR WIDGET --- */}
      <div className="max-w-5xl mx-auto mb-10 bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
          <div 
            className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer hover:bg-yellow-500/20 transition"
            onClick={() => setShowSim(!showSim)}
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 text-black rounded-lg"><Calculator size={20} /></div>
                  <div>
                      <h2 className="font-bold text-yellow-500 text-sm uppercase tracking-widest">STOINC Simulator</h2>
                      <p className="text-[10px] text-zinc-400">Estimate your projected earnings based on the official Xandeum economic model</p>
                  </div>
              </div>
              {showSim ? <ChevronUp size={20} className="text-yellow-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
          </div>

          {showSim && (
              <div className="p-6 md:p-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      
                      {/* LEFT: INPUTS */}
                      <div className="space-y-8">
                          
                          {/* BASE CREDIT INPUT */}
                          <div className="relative">
                              <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2 text-zinc-400">
                                      <span className="text-xs font-bold uppercase tracking-wider text-white">Base Reputation Credits</span>
                                      <HelpCircle size={12} className="cursor-help hover:text-white" onClick={() => toggleTooltip('base_input')} />
                                  </div>
                                  <button 
                                    onClick={() => setShowHardwareCalc(!showHardwareCalc)}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
                                  >
                                      {showHardwareCalc ? "Hide Calculator" : "Don't know? Calculate from Hardware"}
                                  </button>
                              </div>
                              {activeTooltip === 'base_input' && <div className="absolute z-10 bg-zinc-800 border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 w-full -top-12 left-0 shadow-xl">The raw score derived from (Nodes × Storage × Stake). Select a node below to auto-fill, or type a hypothetical value.</div>}
                              
                              <div className={`flex items-center bg-zinc-900 border rounded-xl overflow-hidden transition-all ${showHardwareCalc ? 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'border-zinc-700 focus-within:border-yellow-500'}`}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={baseCreditsInput} 
                                    onChange={(e) => {
                                        setBaseCreditsInput(Number(e.target.value));
                                        setShowHardwareCalc(false); // Disable hardware sync if user types manually
                                    }}
                                    className="w-full bg-transparent p-4 text-white text-2xl font-mono font-bold outline-none"
                                    placeholder="0"
                                  />
                                  <span className="pr-6 text-xs font-bold text-zinc-600">CREDITS</span>
                              </div>
                          </div>

                          {/* HARDWARE CALCULATOR (COLLAPSIBLE) */}
                          {showHardwareCalc && (
                              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Hardware Specs Calculator</div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Fleet Size</label>
                                          <input type="number" min="1" value={simNodes} onChange={(e) => setSimNodes(Math.max(1, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono outline-none focus:border-blue-500"/>
                                      </div>
                                      <div>
                                          <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">XAND Stake</label>
                                          <input type="number" min="0" value={simStake} onChange={(e) => setSimStake(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono outline-none focus:border-blue-500"/>
                                      </div>
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

                          {/* BOOSTS */}
                          <div className="relative pt-4 border-t border-zinc-800">
                              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                                  <span className="text-xs font-bold uppercase tracking-wider">Apply Boosts (NFTs / Eras)</span>
                                  <HelpCircle size={12} className="cursor-help hover:text-white" onClick={() => toggleTooltip('boost')} />
                              </div>
                              {activeTooltip === 'boost' && <div className="absolute z-10 bg-zinc-800 border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 w-64 -top-12 left-0 shadow-xl">Multipliers from NFTs and pNode Eras. Stacks geometrically (Product of boosts).</div>}
                              <div className="flex flex-wrap gap-2">
                                  {Object.entries({...ERA_BOOSTS, ...NFT_BOOSTS}).map(([name, val]) => (
                                      <button 
                                        key={name}
                                        onClick={() => toggleBoost(val)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${simBoosts.includes(val) ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                                      >
                                          {name} <span className="opacity-60">x{val}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* RIGHT: OUTPUTS */}
                      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col justify-center space-y-6 relative">
                          
                          <div className="text-center relative">
                              <div className="text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center justify-center gap-1">
                                  Total Boost Factor
                                  <HelpCircle size={10} className="cursor-help" onClick={() => toggleTooltip('factor')} />
                              </div>
                              {activeTooltip === 'factor' && <div className="absolute z-10 bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 w-full top-8 left-0">Cumulative multiplier applied to your base credits.</div>}
                              <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-2">
                                  <Zap size={24} className={simResult.multiplier > 1 ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"} />
                                  {simResult.multiplier.toLocaleString(undefined, { maximumFractionDigits: 4 })}x
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 relative">
                                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                                      Projected Credits <HelpCircle size={10} onClick={() => toggleTooltip('boosted')} className="cursor-help"/>
                                  </span>
                                  {activeTooltip === 'boosted' && <div className="absolute z-10 bg-black border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 right-0 top-8 w-64 shadow-xl z-20">The final 'BoostedCredits' score used by the network to calculate your slice of the STOINC pie.</div>}
                                  <span className="font-mono text-2xl font-bold text-yellow-500 text-shadow-glow">
                                      {simResult.boosted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                              </div>

                              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center relative">
                                  <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                      Est. Network Share <HelpCircle size={10} onClick={() => toggleTooltip('share')} className="cursor-help"/>
                                  </div>
                                  {activeTooltip === 'share' && <div className="absolute z-10 bg-black border border-zinc-700 p-3 rounded text-[10px] text-zinc-300 w-full bottom-full mb-2 left-0 shadow-xl">Your theoretical percentage of the total reward pool, assuming current network conditions.</div>}
                                  <div className="text-2xl font-bold text-white">
                                      {ranking.length > 0 
                                        ? ((simResult.boosted / (ranking.reduce((a,b)=>a+b.credits, 0) + simResult.boosted)) * 100).toFixed(8) 
                                        : '0.00'}%
                                  </div>
                                  <div className="text-[9px] text-blue-300/50 mt-1">of Total Epoch Rewards</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* NETWORK STATS BAR */}
      {!loading && ranking.length > 0 && (
        <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Users size={12}/> Nodes with Credits</div>
            <div className="text-2xl font-bold text-white mt-1">{ranking.length}</div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Wallet size={12}/> Total Credits Issued</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {(ranking.reduce((sum, n) => sum + n.credits, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Activity size={12}/> Avg Credits</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.round(ranking.reduce((sum, n) => sum + n.credits, 0) / ranking.length).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><BarChart3 size={12}/> Top 10 Dominance</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {(() => {
                const total = ranking.reduce((sum, n) => sum + n.credits, 0);
                const top10 = ranking.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
                return total > 0 ? ((top10 / total) * 100).toFixed(1) : 0;
              })()}%
            </div>
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="max-w-5xl mx-auto mb-6 relative space-y-2">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
            type="text" 
            placeholder="Find node by public key..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 pr-10 text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
            <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"
            >
                <X size={20} />
            </button>
            )}
        </div>
        
        {/* DISCLAIMER / UPDATE FREQUENCY */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 px-2">
            <RefreshCw size={10} />
            <span>Credits & Rank update per <strong>Epoch</strong>. Liveness updates in real-time.</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-7">Node Public Key</div>
          <div className="col-span-4 text-right">Credits</div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center animate-pulse text-zinc-500 font-mono flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                CALCULATING FORTUNES...
             </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-zinc-600">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No nodes match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filtered.slice(0, 100).map((node) => {
              const isMyNode = node.address && favorites.includes(node.address);
              const isExpanded = expandedNode === node.pubkey;

              return (
                <div key={node.pubkey} className="group transition-all duration-300">
                    <div 
                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-white/5 items-center cursor-pointer relative ${
                        isExpanded ? 'bg-white/5 border-l-4 border-yellow-500' : 
                        isMyNode ? 'bg-yellow-500/5 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
                    }`}
                    onClick={() => handleRowClick(node)}
                    >
                    
                    {/* RANK BADGE */}
                    <div className="col-span-2 md:col-span-1 flex justify-center items-center gap-1 relative">
                        {isMyNode && <Star size={12} className="text-yellow-500 absolute left-0 md:left-4" fill="currentColor" />}
                        {node.rank === 1 && <Trophy size={20} className="text-yellow-400" />}
                        {node.rank === 2 && <Medal size={20} className="text-zinc-300" />}
                        {node.rank === 3 && <Medal size={20} className="text-amber-600" />}
                        {node.rank > 3 && <span className="text-sm font-bold text-zinc-500">#{node.rank}</span>}
                    </div>

                    {/* PUBLIC KEY */}
                    <div className="col-span-6 md:col-span-7 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition flex items-center justify-between">
                        {node.pubkey}
                        
                        {/* EXPAND INDICATOR */}
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* CREDITS */}
                    <div className="col-span-4 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                        {node.credits.toLocaleString()}
                        <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                    </div>
                    </div>

                    {/* EXPANDED VIEW (ACCORDION) */}
                    {isExpanded && (
                        <div className="bg-black/40 border-b border-zinc-800/50 p-4 pl-8 md:pl-16 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden md:block mr-4">
                                    Quick Actions
                                </div>
                                <Link href={`/?open=${node.pubkey}`} className="w-full md:w-auto">
                                    <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs font-bold text-white transition-all shadow-lg hover:shadow-blue-500/10">
                                        <Activity size={14} className="text-blue-400" />
                                        VIEW NODE DIAGNOSTICS
                                        <ExternalLink size={10} className="text-zinc-500" />
                                    </button>
                                </Link>
                                <button 
                                    onClick={handleUseInSim}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-xs font-bold text-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/10"
                                >
                                    <Calculator size={14} />
                                    CALCULATE EARNINGS
                                    <ArrowUpRight size={10} className="text-yellow-500/50" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER NOTE */}
      {!loading && (
        <div className="max-w-5xl mx-auto mt-6 text-center text-xs text-zinc-600 flex flex-col md:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle size={12} />
            <span>Tracking <span className="text-zinc-400 font-bold">{ranking.length}</span> earning nodes. Top 100 displayed.</span>
          </div>
          <span className="hidden md:inline text-zinc-700">•</span>
          <span className="text-zinc-500">(Search to find others)</span>
        </div>
      )}
    </div>
  );
}
