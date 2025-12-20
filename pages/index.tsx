import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trophy, Medal, ArrowLeft, Search, Wallet, X, ChevronRight, Activity, Users, BarChart3, HelpCircle, Star, Calculator, TrendingUp, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

// --- TYPES ---
interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  address?: string;
}

// --- BOOST FACTOR CONSTANTS ---
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
  const [simNodes, setSimNodes] = useState(1);
  const [simStorage, setSimStorage] = useState(1000); // GB
  const [simStake, setSimStake] = useState(1000); // XAND
  const [simPerf, setSimPerf] = useState(0.95); // 0-1 Score
  const [simBoosts, setSimBoosts] = useState<number[]>([]); // Array of active boost multipliers

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

  const filtered = ranking.filter(n => 
    n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (pubkey: string) => {
    router.push(`/?open=${pubkey}`);
  };

  // --- STOINC CALCULATOR LOGIC ---
  const calculateSTOINC = () => {
      // 1. Base Credits = Nodes * Storage * Perf * Stake
      // Note: Formula implies direct multiplication. If any is 0, result is 0.
      const baseCredits = simNodes * simStorage * simPerf * simStake;

      // 2. Boost Factor Calculation (Geometric Mean)
      // Formula: n-th root of (product of all boosts)
      // If no boosts selected, default is 1
      let productBoosts = 1;
      let activeBoostCount = 0;

      // We assume user applies boosts to the "Fleet". 
      // Simplified: If user selects "Titan", we assume it applies to the calculation logic.
      // For exact per-node boost, we'd need a complex UI. Here we average the selected boosts.
      
      if (simBoosts.length > 0) {
          simBoosts.forEach(b => productBoosts *= b);
          // If we have N boosts, do we root by N? 
          // The formula says: root(N) where N is number of pNodes owned.
          // So if I have 3 nodes, I take the cube root of the product of the 3 boost factors.
          // Here, we let the user select boosts. We'll fill the remaining "slots" with 1 (no boost).
          
          let totalFactors = productBoosts;
          // Fill remaining nodes with 1x boost if selected boosts < node count
          // Or if selected boosts > node count, we just use the selected boosts (assuming multiple NFTs per node?)
          // Let's stick to the user formula: N = number of pNodes.
          
          // If user selected 1 Titan (11x) but has 3 nodes.
          // Factors: 11 * 1 * 1. Product = 11.
          // Boost = 11^(1/3) = 2.22
          
          // If user selects MORE boosts than nodes, we clamp? Or assumes upgrades? 
          // Let's assume user is selecting the BEST boost for each of their N nodes.
          
          let factors = [...simBoosts];
          while (factors.length < simNodes) factors.push(1); // Fill rest with 1x
          if (factors.length > simNodes) factors = factors.slice(0, simNodes); // Limit to N nodes
          
          const finalProduct = factors.reduce((a, b) => a * b, 1);
          const geometricMean = Math.pow(finalProduct, 1 / simNodes);
          
          return { base: baseCredits, boosted: baseCredits * geometricMean, multiplier: geometricMean };
      }

      return { base: baseCredits, boosted: baseCredits, multiplier: 1 };
  };

  const simResult = calculateSTOINC();
  const toggleBoost = (val: number) => {
      if (simBoosts.includes(val)) setSimBoosts(simBoosts.filter(b => b !== val));
      else setSimBoosts([...simBoosts, val]);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      <Head>
        <title>Xandeum Pulse - Reputation & STOINC</title>
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
          <p className="text-xs text-zinc-600 mt-1 font-mono tracking-wide">ECONOMIC RANKING & STOINC CALCULATOR</p>
        </div>
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* --- STOINC SIMULATOR WIDGET --- */}
      <div className="max-w-5xl mx-auto mb-10 bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <div 
            className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer hover:bg-yellow-500/20 transition"
            onClick={() => setShowSim(!showSim)}
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 text-black rounded-lg"><Calculator size={20} /></div>
                  <div>
                      <h2 className="font-bold text-yellow-500 text-sm uppercase tracking-widest">STOINC Revenue Simulator</h2>
                      <p className="text-[10px] text-zinc-400">Estimate earnings based on the official Xandeum formula</p>
                  </div>
              </div>
              {showSim ? <ChevronUp size={20} className="text-yellow-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
          </div>

          {showSim && (
              <div className="p-6 md:p-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* INPUTS */}
                      <div className="space-y-6">
                          <div>
                              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                                  <span>MY FLEET SIZE</span>
                                  <span className="text-white">{simNodes} pNodes</span>
                              </div>
                              <input type="range" min="1" max="50" value={simNodes} onChange={(e) => setSimNodes(Number(e.target.value))} className="w-full accent-yellow-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"/>
                          </div>
                          
                          <div>
                              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                                  <span>TOTAL STORAGE (GB)</span>
                                  <span className="text-white">{simStorage.toLocaleString()} GB</span>
                              </div>
                              <input type="range" min="100" max="100000" step="100" value={simStorage} onChange={(e) => setSimStorage(Number(e.target.value))} className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"/>
                          </div>

                          <div>
                              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                                  <span>XAND STAKE</span>
                                  <span className="text-white">{simStake.toLocaleString()} XAND</span>
                              </div>
                              <input type="range" min="0" max="1000000" step="1000" value={simStake} onChange={(e) => setSimStake(Number(e.target.value))} className="w-full accent-green-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"/>
                          </div>

                          <div>
                              <div className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Apply Boosts (NFTs / Eras)</div>
                              <div className="flex flex-wrap gap-2">
                                  {Object.entries({...ERA_BOOSTS, ...NFT_BOOSTS}).map(([name, val]) => (
                                      <button 
                                        key={name}
                                        onClick={() => toggleBoost(val)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${simBoosts.includes(val) ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                                      >
                                          {name} ({val}x)
                                      </button>
                                  ))}
                              </div>
                              <p className="text-[10px] text-zinc-600 mt-2">*Boosts are averaged across your {simNodes} nodes using Geometric Mean.</p>
                          </div>
                      </div>

                      {/* OUTPUTS */}
                      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col justify-center space-y-6">
                          <div className="text-center">
                              <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Boost Multiplier</div>
                              <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-2">
                                  <Zap size={24} className={simResult.multiplier > 1 ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"} />
                                  {simResult.multiplier.toFixed(4)}x
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                  <span className="text-xs text-zinc-400">Base Credits</span>
                                  <span className="font-mono font-bold text-zinc-300">{simResult.base.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                  <span className="text-xs text-zinc-400">Boosted Credits</span>
                                  <span className="font-mono font-bold text-yellow-500">{Math.round(simResult.boosted).toLocaleString()}</span>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-center">
                                  <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Estimated Network Share</div>
                                  <div className="text-xl font-bold text-white">
                                      {ranking.length > 0 
                                        ? ((simResult.boosted / ranking.reduce((a,b)=>a+b.credits, 0)) * 100).toFixed(6) 
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
      <div className="max-w-5xl mx-auto mb-6 relative">
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

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-7 md:col-span-8">Node Public Key</div>
          <div className="col-span-3 text-right">Credits</div>
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

              return (
                <div 
                  key={node.pubkey} 
                  className={`grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition items-center group relative cursor-pointer ${
                    isMyNode ? 'bg-yellow-500/5 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => handleRowClick(node.pubkey)}
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
                  <div className="col-span-7 md:col-span-8 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition flex items-center justify-between">
                    {node.pubkey}
                    <div className="md:hidden text-zinc-600"><ChevronRight size={14} /></div>
                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition text-[10px] text-blue-400 font-bold items-center gap-1">
                        VIEW <ChevronRight size={10} />
                    </div>
                  </div>

                  {/* CREDITS */}
                  <div className="col-span-3 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                    {node.credits.toLocaleString()}
                    <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                  </div>
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
