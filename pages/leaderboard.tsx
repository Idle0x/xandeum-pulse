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
  AlertOctagon, ChevronDown as ChevronIcon,
  Layers, Info
} from 'lucide-react';

// --- INTERFACES ---
interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  network: 'MAINNET' | 'DEVNET';
  address?: string;
  location?: {
      countryName: string;
      countryCode: string;
  };
  trend: number; 
}

// --- CONSTANTS ---
const ERA_BOOSTS = { 'DeepSouth': 16, 'South': 10, 'Main': 7, 'Coal': 3.5, 'Central': 2, 'North': 1.25 };
const NFT_BOOSTS = { 'Titan': 11, 'Dragon': 4, 'Coyote': 2.5, 'Rabbit': 1.5, 'Cricket': 1.1, 'XENO': 1.1 };

export default function Leaderboard() {
  const router = useRouter();

  // --- DATA STATE ---
  const [allNodes, setAllNodes] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsOffline, setCreditsOffline] = useState(false);

  // --- FILTER STATE ---
  const [networkFilter, setNetworkFilter] = useState<'MAINNET' | 'DEVNET' | 'COMBINED'>('MAINNET');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(100);

  // --- SIMULATOR STATE ---
  const [showSim, setShowSim] = useState(false);
  const [simStep, setSimStep] = useState(0); 
  const [simMode, setSimMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingNodeData, setExistingNodeData] = useState<{pubkey: string, credits: number} | null>(null);

  // Step 1 Inputs
  const [importKey, setImportKey] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [simNodes, setSimNodes] = useState<number>(1); // Default 1
  const [simStorageVal, setSimStorageVal] = useState<number>(1);
  const [simStorageUnit, setSimStorageUnit] = useState<'MB' | 'GB' | 'TB' | 'PB'>('TB');
  const [simStake, setSimStake] = useState<number>(1000); 
  const [simPerf, setSimPerf] = useState(0.95);

  // Step 2 Inputs
  const [boostCounts, setBoostCounts] = useState<Record<string, number>>({});

  // Step 3 Inputs
  const [simNetworkFees, setSimNetworkFees] = useState<number>(100); // Default 100
  const [showFeeHelp, setShowFeeHelp] = useState(false); // Tooltip State

  // --- UI STATE ---
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const lastProcessedHighlight = useRef<string | null>(null);

  // --- 1. DATA FETCHING ---
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
             setAllNodes([]); 
        } else {
            setCreditsOffline(false);
            let history: Record<string, number> = {};
            try {
                const h = localStorage.getItem('xandeum_rank_history');
                if (h) history = JSON.parse(h);
            } catch (e) {}
            const newHistory: Record<string, number> = {};

            const parsedList: RankedNode[] = rawData.map((item: any) => {
                const pKey = item.pod_id || item.pubkey || 'Unknown';
                const meta = metaMap.get(pKey);
                return {
                    pubkey: pKey,
                    credits: Number(item.credits || 0),
                    network: item.network || 'MAINNET',
                    rank: 0,
                    address: meta?.address,
                    location: meta?.location,
                    trend: 0
                };
            });

            parsedList.sort((a, b) => b.credits - a.credits);
            parsedList.forEach((n, i) => {
                const prevRank = history[n.pubkey];
                if (prevRank) n.trend = prevRank - (i + 1); 
                newHistory[n.pubkey] = i + 1;
            });
            localStorage.setItem('xandeum_rank_history', JSON.stringify(newHistory));
            setAllNodes(parsedList);
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
  }, []);

  // --- 2. FILTER & RANKING LOGIC ---
  const filteredAndRanked = useMemo(() => {
      const filtered = allNodes.filter(n => 
          (networkFilter === 'COMBINED' || n.network === networkFilter) && 
          n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
      );
      filtered.sort((a, b) => b.credits - a.credits);
      let currentRank = 1;
      return filtered.map((n, i) => {
          if (i > 0 && n.credits < filtered[i-1].credits) currentRank = i + 1;
          return { ...n, rank: currentRank };
      });
  }, [allNodes, networkFilter, searchQuery]);

  // --- 3. DEEP LINK LOGIC ---
  useEffect(() => {
      if (!router.isReady || !router.query.highlight || allNodes.length === 0) return;
      const targetKey = router.query.highlight as string;
      if (lastProcessedHighlight.current === targetKey) return;

      const targetNode = allNodes.find(n => n.pubkey === targetKey);
      if (targetNode) {
          lastProcessedHighlight.current = targetKey;
          if (networkFilter !== 'COMBINED' && targetNode.network !== networkFilter) {
              setNetworkFilter(targetNode.network);
          }
          setTimeout(() => {
              const listToSearch = networkFilter === 'COMBINED' 
                ? allNodes.sort((a,b) => b.credits - a.credits)
                : allNodes.filter(n => n.network === targetNode.network).sort((a,b) => b.credits - a.credits);
              const idx = listToSearch.findIndex(n => n.pubkey === targetKey);
              if (idx >= visibleCount) setVisibleCount(idx + 20);
              setExpandedNode(targetKey);
              setTimeout(() => {
                  const el = document.getElementById(`node-${targetKey}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
          }, 100);
      }
  }, [router.isReady, router.query.highlight, allNodes, networkFilter]); 


  // --- 4. SIMULATOR LOGIC ---
  const handleImportNode = () => {
    setImportError(null);
    setImportSuccess(false);
    const key = importKey.trim();

    if (!key) { setImportError("Please enter a public key."); return; }
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(key)) {
        setImportError("Invalid format. Public keys are Base58 strings.");
        return;
    }

    const node = allNodes.find(n => n.pubkey === key);
    if (node) {
        setImportSuccess(true);
        setSimMode('EXISTING');
        setExistingNodeData({ pubkey: node.pubkey, credits: node.credits });
        setTimeout(() => {
            setSimStep(2); 
            setImportSuccess(false);
        }, 1000);
    } else {
        setImportError("Key not found in active leaderboard.");
    }
  };

  const calculateSimMetrics = () => {
    if (simMode === 'EXISTING' && existingNodeData) {
        const currentNetworkTotal = allNodes.reduce((sum, n) => sum + n.credits, 0);
        const share = currentNetworkTotal > 0 ? existingNodeData.credits / currentNetworkTotal : 0;
        const stoinc = simNetworkFees * 0.94 * share;
        return { rawCredits: 0, geoMean: 1, boostedCredits: existingNodeData.credits, share, stoinc };
    }

    let storageInGB = simStorageVal;
    if (simStorageUnit === 'MB') storageInGB = simStorageVal / 1000;
    if (simStorageUnit === 'TB') storageInGB = simStorageVal * 1000;
    if (simStorageUnit === 'PB') storageInGB = simStorageVal * 1000000;
    const rawCredits = simNodes * storageInGB * simPerf * simStake;

    let product = 1;
    Object.entries(boostCounts).forEach(([name, count]) => {
        const val = {...ERA_BOOSTS, ...NFT_BOOSTS}[name as keyof typeof ERA_BOOSTS | keyof typeof NFT_BOOSTS] || 1;
        for(let i=0; i<count; i++) product *= val;
    });
    const safeNodes = Math.max(1, simNodes);
    const geoMean = Math.pow(product, 1 / safeNodes);
    const boostedCredits = rawCredits * geoMean;

    const currentNetworkTotal = allNodes.reduce((sum, n) => sum + n.credits, 0);
    const newNetworkTotal = currentNetworkTotal + boostedCredits;
    const share = newNetworkTotal > 0 ? boostedCredits / newNetworkTotal : 0;
    const stoinc = simNetworkFees * 0.94 * share;

    return { rawCredits, geoMean, boostedCredits, share, stoinc };
  };

  const metrics = calculateSimMetrics();

  const toggleBoostCount = (name: string, delta: number) => {
      const current = boostCounts[name] || 0;
      const next = Math.max(0, current + delta);
      setBoostCounts({...boostCounts, [name]: next});
  };

  const handleRowClick = (node: RankedNode) => {
      setExpandedNode(expandedNode === node.pubkey ? null : node.pubkey);
  };

  const handleUseInSim = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowSim(true);
      setSimStep(0);
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-2 md:p-8 selection:bg-yellow-500/30">
      <Head><title>Xandeum Pulse - Credits & Reputation</title></Head>

      {/* HEADER */}
      <div className="max-w-5xl mx-2 md:mx-auto mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-xs md:text-sm font-bold uppercase tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Monitor
        </Link>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-yellow-500 justify-center"><Trophy className="w-6 h-6 md:w-8 md:h-8" /> CREDITS & REPUTATION</h1>
          <p className="text-[10px] md:text-xs text-zinc-500 mt-1 font-mono tracking-wide uppercase">The definitive registry of node reputation and network contribution</p>
        </div>
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* --- STOINC SIMULATOR WIZARD --- */}
      <div className="max-w-5xl mx-auto mb-6 md:mb-10 bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/30 rounded-xl md:rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all duration-300">

          {/* HEADER BAR */}
          <div className="p-3 md:p-4 bg-yellow-500/10 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer hover:bg-yellow-500/20 transition" onClick={() => setShowSim(!showSim)}>
              <div className="flex items-center gap-3">
                  <div className="p-1.5 md:p-2 bg-yellow-500 text-black rounded-lg"><Calculator size={18} /></div>
                  <div>
                      <h2 className="font-bold text-yellow-500 text-xs md:text-sm uppercase tracking-widest">STOINC Simulator</h2>
                      <p className="text-[9px] md:text-[10px] text-zinc-400">Official Formula Calculator • Step {simStep + 1}/3</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                   {showSim && (
                       <div className="flex gap-2">
                           {[0,1,2].map(s => (
                               <div key={s} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${simStep === s ? 'bg-yellow-500' : 'bg-zinc-700'}`} />
                           ))}
                       </div>
                   )}
                   {showSim ? <ChevronDown size={20} className="rotate-180 text-yellow-500 transition-transform" /> : <ChevronDown size={20} className="text-zinc-500 transition-transform" />}
              </div>
          </div>

          {/* WIZARD CONTENT */}
          {showSim && (
              <div className="relative min-h-[400px]">

                  {/* SCREEN 1: HARDWARE & IMPORT */}
                  {simStep === 0 && (
                      <div className="p-4 md:p-8 animate-in slide-in-from-right-4 fade-in duration-300">
                          <div className="mb-6 text-center">
                              <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Step 1: Configure Fleet</h3>
                              <p className="text-[10px] md:text-xs text-zinc-500 mt-1">Define your hardware baseline OR import an active node.</p>
                          </div>

                          <div className={`mb-6 md:mb-8 border rounded-xl p-3 md:p-4 flex flex-col md:flex-row gap-4 items-start transition-colors ${importError ? 'bg-red-500/10 border-red-500/30' : importSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/20'}`}>
                              <div className="flex-1 w-full">
                                  <label className={`text-[9px] md:text-[10px] font-bold uppercase mb-1 block ${importError ? 'text-red-400' : importSuccess ? 'text-green-400' : 'text-blue-300'}`}>
                                      {importSuccess ? 'SUCCESS!' : importError ? 'ERROR' : 'ALREADY LIVE? PASTE PUBLIC KEY'}
                                  </label>
                                  <div className="flex gap-2 relative">
                                      <input 
                                          type="text" 
                                          placeholder="Search pubkey..." 
                                          value={importKey}
                                          onChange={(e) => { setImportKey(e.target.value); if(importError) setImportError(null); }}
                                          onKeyDown={(e) => e.key === 'Enter' && handleImportNode()}
                                          className={`w-full bg-zinc-900 border rounded-lg p-2 text-[10px] md:text-xs text-white font-mono outline-none transition ${importError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-blue-500'}`}
                                      />
                                      <button 
                                          onClick={handleImportNode}
                                          disabled={importSuccess}
                                          className={`font-bold text-[10px] px-3 md:px-4 rounded-lg uppercase transition whitespace-nowrap ${importSuccess ? 'bg-green-500 text-black' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                      >
                                          {importSuccess ? <Check size={14} /> : 'LOAD'}
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8" onClick={() => { if(simMode === 'EXISTING') setSimMode('NEW'); }}>
                              <div className="space-y-4 md:space-y-6">
                                  <div>
                                      <label className="text-[10px] text-zinc-400 uppercase font-bold flex justify-between mb-2"><span>Number of pNodes</span></label>
                                      {/* Changed from Slider to Number Input */}
                                      <div className="relative">
                                          <input type="number" min="1" value={simNodes} onChange={(e) => setSimNodes(Math.max(1, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 md:p-3 text-[10px] md:text-base text-white font-mono outline-none focus:border-yellow-500 transition"/>
                                          <span className="absolute right-3 top-2 md:top-3 text-[10px] md:text-sm text-zinc-500 font-bold">NODES</span>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">Total Storage</label>
                                      <div className="flex gap-2">
                                          <input type="number" min="1" value={simStorageVal} onChange={(e) => setSimStorageVal(Math.max(0, Number(e.target.value)))} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-2 md:p-3 text-[10px] md:text-base text-white font-mono outline-none focus:border-yellow-500 transition"/>
                                          <select value={simStorageUnit} onChange={(e) => setSimStorageUnit(e.target.value as any)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 md:p-3 text-[10px] md:text-base text-zinc-300 font-bold outline-none"><option>MB</option><option>GB</option><option>TB</option><option>PB</option></select>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">Total Stake (XAND)</label>
                                      <input type="number" min="0" value={simStake} onChange={(e) => setSimStake(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 md:p-3 text-[10px] md:text-base text-white font-mono outline-none focus:border-yellow-500 transition"/>
                                  </div>
                              </div>
                              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6 flex flex-col justify-center items-center text-center">
                                  <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold mb-1">Base Metric</div>
                                  <div className="text-2xl md:text-4xl font-mono font-bold text-white mb-2">{metrics.rawCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* SCREEN 2: BOOSTS */}
                  {simStep === 1 && (
                      <div className="p-3 md:p-8 animate-in slide-in-from-right-4 fade-in duration-300 h-[450px] md:h-[400px] flex flex-col">
                          <div className="mb-4 text-center shrink-0">
                              <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Step 2: Boosts</h3>
                              <p className="text-[10px] md:text-xs text-zinc-500 mt-1">Select Active Boosts</p>
                          </div>
                          
                          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 flex-grow min-h-0">
                              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3 md:space-y-4">
                                  <div className="space-y-1 md:space-y-2">
                                      <div className="text-[9px] text-zinc-500 font-bold uppercase sticky top-0 bg-[#09090b] z-10 py-1">Eras</div>
                                      {Object.entries(ERA_BOOSTS).map(([name, val]) => (
                                          <div key={name} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 md:p-3 rounded-lg md:rounded-xl">
                                              <div><div className="text-[10px] md:text-xs font-bold text-white">{name}</div><div className="text-[9px] md:text-[10px] text-yellow-500 font-mono">x{val}</div></div>
                                              <div className="flex items-center gap-2 md:gap-3 bg-black rounded-lg p-1">
                                                  <button onClick={() => toggleBoostCount(name, -1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-zinc-500 hover:text-white text-sm">-</button>
                                                  <span className="text-[10px] md:text-xs font-mono w-4 text-center">{boostCounts[name] || 0}</span>
                                                  <button onClick={() => toggleBoostCount(name, 1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-zinc-500 hover:text-white text-sm">+</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="space-y-1 md:space-y-2">
                                      <div className="text-[9px] text-zinc-500 font-bold uppercase sticky top-0 bg-[#09090b] z-10 py-1">NFTs</div>
                                      {Object.entries(NFT_BOOSTS).map(([name, val]) => (
                                          <div key={name} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 md:p-3 rounded-lg md:rounded-xl">
                                              <div><div className="text-[10px] md:text-xs font-bold text-white">{name}</div><div className="text-[9px] md:text-[10px] text-blue-400 font-mono">x{val}</div></div>
                                              <div className="flex items-center gap-2 md:gap-3 bg-black rounded-lg p-1">
                                                  <button onClick={() => toggleBoostCount(name, -1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-zinc-500 hover:text-white text-sm">-</button>
                                                  <span className="text-[10px] md:text-xs font-mono w-4 text-center">{boostCounts[name] || 0}</span>
                                                  <button onClick={() => toggleBoostCount(name, 1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-zinc-500 hover:text-white text-sm">+</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <div className="shrink-0 md:h-full flex flex-row md:flex-col gap-2 md:gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-800">
                                  <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg md:rounded-xl p-2 md:p-6 flex flex-col justify-center items-center text-center">
                                      <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold mb-0.5 md:mb-2 whitespace-nowrap">Geo Mean</div>
                                      <div className="text-sm md:text-4xl font-mono font-bold text-yellow-400 flex items-center gap-1 md:gap-2"><Zap size={12} className="md:w-6 md:h-6 fill-yellow-400" />{metrics.geoMean.toFixed(3)}x</div>
                                  </div>
                                  <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg md:rounded-xl p-2 md:p-4 flex flex-col justify-center items-center md:flex-row md:justify-between">
                                      <span className="text-[9px] md:text-xs text-zinc-500 font-bold uppercase mb-0.5 md:mb-0">Total Credits</span>
                                      <span className="font-mono text-sm md:text-xl font-bold text-white">{metrics.boostedCredits.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* SCREEN 3: EARNINGS */}
                  {simStep === 2 && (
                      <div className="p-4 md:p-8 animate-in slide-in-from-right-4 fade-in duration-300">
                          <div className="mb-6 text-center">
                              <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Step 3: Income</h3>
                              {simMode === 'EXISTING' ? (
                                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30"><Activity size={10} /><span className="text-[9px] font-bold uppercase">Live ({existingNodeData?.pubkey.slice(0,4)}...)</span></div>
                              ) : (
                                <p className="text-[10px] md:text-xs text-zinc-500 mt-1">Estimate fees.</p>
                              )}
                          </div>

                          <div className="max-w-xl mx-auto space-y-6 md:space-y-8">
                              <div>
                                  {/* CLICK OUTSIDE LAYER */}
                                  {showFeeHelp && (
                                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFeeHelp(false)}></div>
                                  )}

                                  <div className="flex justify-between items-end mb-2 md:mb-4 relative z-50">
                                      <div className="flex items-center gap-2">
                                        <label className="text-[10px] md:text-xs text-zinc-400 uppercase font-bold">Total Network Fees (from sedApps)</label>
                                        <div className="relative">
                                            <button onClick={() => setShowFeeHelp(!showFeeHelp)} className="text-zinc-500 hover:text-white transition"><Info size={14} /></button>
                                            {showFeeHelp && (
                                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-200">
                                                    <p className="text-[10px] md:text-xs text-zinc-300 leading-relaxed">
                                                        <strong className="text-white block mb-1">About Network Fees:</strong>
                                                        Revenue collected from storage-enabled dApps (sedApps) per epoch. 
                                                        <span className="text-yellow-500 block mt-1">94% of this total is distributed to pNode owners.</span>
                                                        <br/>Higher network usage = higher fees pot.
                                                    </p>
                                                    <div className="absolute bottom-[-6px] left-1 w-3 h-3 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                      </div>
                                  </div>
                                  
                                  {/* Changed from Slider to Number Input */}
                                  <div className="relative">
                                     <input type="number" min="0" value={simNetworkFees} onChange={(e) => setSimNetworkFees(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-[12px] md:text-lg text-white font-mono outline-none focus:border-blue-500 transition"/>
                                     <span className="absolute right-4 top-3.5 text-xs font-bold text-zinc-600">SOL</span>
                                  </div>
                              </div>

                              <div className="bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/30 rounded-xl md:rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-16 md:p-32 bg-yellow-500/5 rounded-full blur-2xl md:blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                                  <div className="relative z-10 flex flex-col items-center text-center space-y-4 md:space-y-6">
                                      <div>
                                          <div className="text-[9px] md:text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Your Share</div>
                                          {/* FIX: Multiplied by 100 to show correct percentage */}
                                          <div className="text-sm md:text-lg font-mono text-zinc-300">{(metrics.share * 100).toFixed(6)}%</div>
                                      </div>
                                      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                                      <div>
                                          <div className="text-[10px] md:text-xs text-yellow-600 font-bold uppercase tracking-widest mb-2">Estimated Payout</div>
                                          <div className="text-4xl md:text-6xl font-extrabold text-white text-shadow-lg tracking-tight flex items-baseline justify-center gap-2">{metrics.stoinc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}<span className="text-sm md:text-lg font-bold text-zinc-500">SOL</span></div>
                                          <div className="text-[9px] md:text-[10px] text-zinc-500 mt-2">Per Epoch (~2 Days)</div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* NAVIGATION FOOTER */}
                  <div className="p-3 md:p-4 border-t border-zinc-800 flex justify-between bg-black/20">
                      <button onClick={() => setSimStep(Math.max(0, simStep - 1))} disabled={simStep === 0} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-bold transition ${simStep === 0 ? 'opacity-0 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>BACK</button>
                      {simStep < 2 ? (
                          <button onClick={() => setSimStep(simStep + 1)} className="px-6 md:px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] md:text-xs rounded-lg transition-colors flex items-center gap-2">NEXT STEP <ArrowUpRight size={14} /></button>
                      ) : (
                          <button onClick={() => { setSimStep(0); setBoostCounts({}); setSimMode('NEW'); setExistingNodeData(null); setImportKey(''); }} className="px-6 md:px-8 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] md:text-xs rounded-lg transition-colors flex items-center gap-2">RESET <Activity size={14} /></button>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* NETWORK STATS BAR */}
      {!loading && !creditsOffline && filteredAndRanked.length > 0 && (
        <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm"><div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Users size={12}/> Nodes ({networkFilter})</div><div className="text-lg md:text-2xl font-bold text-white">{filteredAndRanked.length}</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm"><div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Wallet size={12}/> Total Credits</div><div className="text-lg md:text-2xl font-bold text-yellow-400 mt-1">{(filteredAndRanked.reduce((sum, n) => sum + n.credits, 0) / 1000000).toFixed(1)}M</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm"><div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Activity size={12}/> Avg Credits</div><div className="text-lg md:text-2xl font-bold text-white mt-1">{Math.round(filteredAndRanked.reduce((sum, n) => sum + n.credits, 0) / filteredAndRanked.length).toLocaleString(undefined, { notation: 'compact' })}</div></div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-4 rounded-xl backdrop-blur-sm"><div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><BarChart3 size={12}/> Top 10 Dom</div><div className="text-lg md:text-2xl font-bold text-blue-400 mt-1">{(() => { const total = filteredAndRanked.reduce((sum, n) => sum + n.credits, 0); const top10 = filteredAndRanked.slice(0, 10).reduce((sum, n) => sum + n.credits, 0); return total > 0 ? ((top10 / total) * 100).toFixed(1) : 0; })()}%</div></div>
        </div>
      )}

      {/* SEARCH & TOGGLE */}
      <div className="max-w-5xl mx-auto mb-6 relative space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
             <div className="flex w-full md:w-auto bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
                 <button onClick={() => setNetworkFilter('MAINNET')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'MAINNET' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}><Zap size={12} className={networkFilter === 'MAINNET' ? 'fill-black' : ''}/> MAINNET</button>
                 <button onClick={() => setNetworkFilter('DEVNET')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'DEVNET' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity size={12} /> DEVNET</button>
                 <button onClick={() => setNetworkFilter('COMBINED')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'COMBINED' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}><Layers size={12} /> ALL</button>
             </div>
             <div className="relative w-full">
                <Search className="absolute left-4 top-3 md:top-3.5 text-zinc-500" size={16} />
                <input type="text" placeholder={networkFilter === 'COMBINED' ? "Search all nodes..." : `Search ${networkFilter.toLowerCase()} nodes...`} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 md:p-3 pl-10 md:pl-12 pr-10 text-[12px] md:text-sm text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-4 top-3 md:top-3.5 text-zinc-500 hover:text-white"><X size={16} /></button>)}
             </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-zinc-800 text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-7">Node Public Key</div>
          <div className="col-span-4 text-right">Credits</div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center animate-pulse text-zinc-500 font-mono flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                LOADING...
             </div>
          </div>
        ) : creditsOffline ? (
          <div className="p-10 md:p-20 text-center flex flex-col items-center justify-center h-full">
              <AlertOctagon size={48} className="text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Offline</h3>
          </div>
        ) : filteredAndRanked.length === 0 ? (
          <div className="p-20 text-center text-zinc-600"><Search size={48} className="mx-auto mb-4 opacity-50" /><p>No nodes found.</p></div>
        ) : (
          <div className="divide-y-0 px-2 pb-2">
            {filteredAndRanked.slice(0, visibleCount).map((node) => {
              const isMyNode = node.address && favorites.includes(node.address);
              const isExpanded = expandedNode === node.pubkey;
              const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` : null;

              return (
                <div key={`${node.pubkey}-${node.network}`} id={`node-${node.pubkey}`} className={`relative transition-all duration-300 ease-out mb-2 rounded-xl border ${isExpanded ? 'scale-[1.02] z-10 bg-black border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'scale-100 bg-zinc-900/30 border-transparent hover:scale-[1.01] hover:bg-zinc-800 hover:border-zinc-600'} ${isMyNode && !isExpanded ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}>
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
                            {node.credits.toLocaleString(undefined, { notation: 'compact' })}
                            <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="border-t border-zinc-800/50 p-3 md:p-4 pl-3 md:pl-12 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                                        {node.address && (<Link href={`/map?focus=${node.address.split(':')[0]}`}><button className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-[10px] md:text-xs font-bold text-blue-400 transition-all whitespace-nowrap">{flagUrl ? <img src={flagUrl} className="w-4 rounded-sm" alt="flag"/> : <MapPin size={12} />}MAP</button></Link>)}
                                        <Link href={`/?open=${node.pubkey}`}><button className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[10px] md:text-xs font-bold text-white transition-all whitespace-nowrap"><Activity size={12} className="text-green-400" />DIAGNOSTICS</button></Link>
                                        <button onClick={(e) => handleUseInSim(e)} className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-[10px] md:text-xs font-bold text-yellow-500 transition-all whitespace-nowrap"><Calculator size={12} />CALCULATE</button>
                                        <button onClick={(e) => handleCopyKey(e, node.pubkey)} className="md:hidden w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg text-[10px] font-mono text-zinc-400">{copiedKey === node.pubkey ? <Check size={12} /> : <Copy size={12} />} COPY</button>
                                    </div>
                                    <div className="hidden md:flex gap-2 justify-end">
                                        <button onClick={(e) => handleCopyKey(e, node.pubkey)} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition">{copiedKey === node.pubkey ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}{copiedKey === node.pubkey ? 'COPIED KEY' : 'COPY KEY'}</button>
                                        <button onClick={(e) => handleShareUrl(e, node.pubkey)} className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition">{copiedLink === node.pubkey ? <Check size={12} /> : <Share2 size={12} />}{copiedLink === node.pubkey ? 'LINK COPIED' : 'SHARE RANK'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              );
            })}
            {visibleCount < filteredAndRanked.length ? (<div className="p-4 flex justify-center border-t border-zinc-800"><button onClick={handleLoadMore} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all"><ChevronIcon size={16} /> LOAD NEXT 100 NODES</button></div>) : filteredAndRanked.length > 0 && (<div className="p-4 text-center border-t border-zinc-800 text-[10px] text-zinc-600 font-mono uppercase">--- END OF LIST ---</div>)}
          </div>
        )}
      </div>

      {!loading && !creditsOffline && (<div className="max-w-5xl mx-auto mt-6 text-center text-[10px] text-zinc-600 flex flex-col md:flex-row items-center justify-center gap-2"><div className="flex items-center gap-2"><Eye size={12} /><span>Showing <span className="text-zinc-400 font-bold">{Math.min(visibleCount, filteredAndRanked.length)}</span> of <span className="text-zinc-400 font-bold">{filteredAndRanked.length}</span> nodes.</span></div></div>)}
    </div>
  );
}
