import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

// --- COMPONENTS ---
import { WelcomeCurtain } from '../components/WelcomeCurtain'; 

// --- REFACTORED COMPONENTS ---
import { NetworkSwitcher } from '../components/common/NetworkSwitcher';
import { LiveWireLoader, PulseGraphLoader } from '../components/common/Loaders';
import { NodeCard } from '../components/dashboard/cards/NodeCard';
import { ZenCard } from '../components/dashboard/cards/ZenCard';
import { CapacityModal } from '../components/dashboard/stats/CapacityModal';
import { VitalsModal } from '../components/dashboard/stats/VitalsModal';
import { ConsensusModal } from '../components/dashboard/stats/ConsensusModal';
import { InspectorModal } from '../components/modals/InspectorModal';

// --- UTILS & TYPES ---
import { Node } from '../types';
import { formatBytes } from '../utils/formatters';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';

// --- ICONS ---
import {
  Search, Download, Activity, Database, X,
  Clock, Trophy, Star, ArrowUp, ArrowDown,
  Info, ExternalLink, Maximize2, Map as MapIcon,
  BookOpen, Menu, LayoutDashboard, HeartPulse,
  Swords, Monitor, AlertTriangle, RefreshCw, Twitter, Server, ChevronDown, ChevronUp
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  // --- STATE ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [error, setError] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('storage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Cycle & UX
  const [cycleStep, setCycleStep] = useState(1);
  const [cycleReset, setCycleReset] = useState(0); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Network Data
  const [networkStats, setNetworkStats] = useState({
    avgBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0, total: 0 },
    totalNodes: 0,
    systemStatus: { credits: true, rpc: true },
    consensusVersion: '0.0.0',
    medianStorage: 0
  });
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [medianCommitted, setMedianCommitted] = useState(0);
  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [avgNetworkHealth, setAvgNetworkHealth] = useState(0);
  const [networkConsensus, setNetworkConsensus] = useState(0);
  const [lastSync, setLastSync] = useState<string>('Syncing...');
  const [searchTipIndex, setSearchTipIndex] = useState(0);

  // Filters & Selection
  const [networkFilter, setNetworkFilter] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [isNetDropdownOpen, setIsNetDropdownOpen] = useState(false); // NEW STATE FOR HEADER DROPDOWN
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeStatsModal, setActiveStatsModal] = useState<'capacity' | 'vitals' | 'consensus' | null>(null);

  // User Prefs
  const [favorites, setFavorites] = useState<string[]>([]);

  // Toasts
  const [toast, setToast] = useState<{visible: boolean, msg: string} | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const searchTips = [
    "You can search by node IP, public key, version or country",
    "You can click on any node for detailed insights",
    "Use the map to visualize network topology",
    "Use STOINC Simulator to forecast earnings",
    "You can compare your node metric again this network leader",
    "Copy node url to share a direct link"
  ];

  // --- HELPERS ---

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000); 
  };

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(address)) {
      newFavs = favorites.filter(f => f !== address);
    } else {
      newFavs = [...favorites, address];
    }
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };

  const handleGlobalClick = () => {
    if (activeTooltip) setActiveTooltip(null);
    if (isNetDropdownOpen) setIsNetDropdownOpen(false); // Close dropdown on global click
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNetDropdownOpen(!isNetDropdownOpen);
  };

  // PERSISTENCE: Toggle Zen Mode & Save to LocalStorage
  const toggleZenMode = () => {
    const newState = !zenMode;
    setZenMode(newState);
    localStorage.setItem('xandeum_zen_mode', String(newState));
  };

  // --- DATA FETCHING ---
  const fetchData = async (mode: 'fast' | 'swarm' = 'fast') => {
    if (mode === 'fast') setLoading(true);
    else setIsBackgroundSyncing(true);

    try {
      const res = await axios.get(`/api/stats?mode=${mode}&t=${Date.now()}`);

      if (res.data.result && res.data.result.pods) {
        let podList = res.data.result.pods as Node[];
        const stats = res.data.stats;

        if (stats) {
          setNetworkStats(stats);
          setMostCommonVersion(stats.consensusVersion || 'N/A');
          setAvgNetworkHealth(stats.avgBreakdown?.total || 0);
          setMedianCommitted(stats.medianStorage || 0);
        }

        const sortFn = (a: Node, b: Node) => {
          if ((b.credits || 0) !== (a.credits || 0)) return (b.credits || 0) - (a.credits || 0);
          if ((b.health || 0) !== (a.health || 0)) return (b.health || 0) - (a.health || 0);
          return (a.pubkey || '').localeCompare(b.pubkey || '');
        };

        const clusterMap = new Map<string, { mainnet: number; devnet: number }>();
        podList.forEach(node => {
          if (!node.pubkey) return;
          const current = clusterMap.get(node.pubkey) || { mainnet: 0, devnet: 0 };
          if (node.network === 'MAINNET') current.mainnet++;
          if (node.network === 'DEVNET') current.devnet++;
          clusterMap.set(node.pubkey, current);
        });

        const mainnetNodes = podList.filter(n => n.network === 'MAINNET').sort(sortFn);
        const devnetNodes = podList.filter(n => n.network === 'DEVNET').sort(sortFn);
        const rankMap = new Map<string, number>();

        mainnetNodes.forEach((node, idx) => { if (node.pubkey) rankMap.set(`${node.pubkey}-MAINNET`, idx + 1); });
        devnetNodes.forEach((node, idx) => { if (node.pubkey) rankMap.set(`${node.pubkey}-DEVNET`, idx + 1); });

        podList = podList.map(node => {
          const used = node.storage_used || 0;
          const cap = node.storage_committed || 0;
          let percentStr = '0%';
          let rawPercent = 0;
          if (cap > 0 && used > 0) {
            rawPercent = (used / cap) * 100;
            percentStr = rawPercent < 0.01 ? '< 0.01%' : `${rawPercent.toFixed(2)}%`;
          }
          const compositeKey = `${node.pubkey}-${node.network}`;
          const cluster = clusterMap.get(node.pubkey || '') || { mainnet: 0, devnet: 0 };
          return {
            ...node,
            rank: node.pubkey ? rankMap.get(compositeKey) || 0 : 0,
            storage_usage_percentage: percentStr,
            storage_usage_raw: rawPercent,
            clusterStats: {
              totalGlobal: cluster.mainnet + cluster.devnet,
              mainnetCount: cluster.mainnet,
              devnetCount: cluster.devnet,
            },
          };
        });

        if (mode === 'swarm' && podList.length > nodes.length && nodes.length > 0) {
           showToast(`New nodes detected. Refreshing... (+${podList.length - nodes.length} nodes)`);
        }

        setNodes(podList);

        const stableNodes = podList.filter(n => (n.uptime || 0) > 86400).length;
        setNetworkHealth((podList.length > 0 ? (stableNodes / podList.length) * 100 : 0).toFixed(2));
        const consensusCount = podList.filter(n => (n.version || 'Unknown') === stats.consensusVersion).length;
        setNetworkConsensus((consensusCount / podList.length) * 100);
        setTotalStorageCommitted(podList.reduce((sum, n) => sum + (n.storage_committed || 0), 0));
        setTotalStorageUsed(podList.reduce((sum, n) => sum + (n.storage_used || 0), 0));
        setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setError('');

        if (mode === 'fast') fetchData('swarm');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (mode === 'fast') setError('Syncing latest network data...');
    } finally {
      if (mode === 'fast') setLoading(false);
      else setIsBackgroundSyncing(false);
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    // RESTORE ZEN PREFERENCE
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);

    const cycleInterval = setInterval(() => {
        setCycleStep((prev) => prev + 1);
    }, 9000); 

    // RESTORE FAVORITES
    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    fetchData('fast');
    const dataInterval = setInterval(() => fetchData('swarm'), 30000);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(cycleInterval);
      clearInterval(dataInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); 

  useEffect(() => {
    const tipInterval = setInterval(() => {
      if (!isSearchFocused) setSearchTipIndex((prev) => (prev + 1) % searchTips.length);
    }, 9000);
    return () => clearInterval(tipInterval);
  }, [isSearchFocused]);

  // --- NEW: SEARCH AUTO-SCROLL EFFECT ---
  useEffect(() => {
    if (searchQuery.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
      const pubkeyToOpen = router.query.open as string;
      const networkParam = router.query.network as string;
      const addrParam = router.query.focusAddr as string;

      const identityMatches = nodes.filter(n => {
          const keyMatch = n.pubkey === pubkeyToOpen;
          const netMatch = networkParam ? n.network === networkParam : true;
          return keyMatch && netMatch;
      });

      if (identityMatches.length > 0) {
          let bestMatch = identityMatches.find(n => addrParam && n.address === decodeURIComponent(addrParam));
          if (!bestMatch) bestMatch = identityMatches[0];
          setSelectedNode(bestMatch);
          router.replace('/', undefined, { shallow: true });
      } else {
          const desperateMatch = nodes.find(n => n.pubkey === pubkeyToOpen);
          if(desperateMatch) {
              setSelectedNode(desperateMatch);
              router.replace('/', undefined, { shallow: true });
          }
      }
    }
  }, [loading, nodes, router.query]);

  // --- FILTER & SORT LOGIC ---

  const handleSortChange = (metric: 'uptime' | 'version' | 'storage' | 'health') => {
      if (sortBy === metric) {
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortBy(metric);
          setSortOrder('desc'); 
      }

      let targetStep = -1;
      if (metric === 'storage') targetStep = 1;
      if (metric === 'health') targetStep = 2;
      if (metric === 'uptime') targetStep = 3;

      if (targetStep !== -1) {
          setCycleStep(targetStep);
          setCycleReset(prev => prev + 1);
      }
  };

  const filteredNodes = nodes.filter(node => {
    const q = searchQuery.toLowerCase();
    const addr = (getSafeIp(node) || '').toLowerCase();
    const pub = (node.pubkey || '').toLowerCase();
    const ver = (node.version || '').toLowerCase();
    const country = (node.location?.countryName || '').toLowerCase();

    const networkMatch = networkFilter === 'ALL' || node.network === networkFilter;

    return networkMatch && (addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q));
  }).sort((a, b) => {
    let valA: any, valB: any;

    if (sortBy === 'storage') {
      valA = a.storage_committed || 0;
      valB = b.storage_committed || 0;
    } else if (sortBy === 'health') {
      valA = a.health || 0;
      valB = b.health || 0;
    } else if (sortBy === 'version') {
       const res = compareVersions(a.version || '0.0.0', b.version || '0.0.0');
       return sortOrder === 'asc' ? res : -res;
    } else {
      valA = (a as any)[sortBy] || 0;
      valB = (b as any)[sortBy] || 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  // --- RENDER ---

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        zenMode ? 'bg-black text-zinc-300 selection:bg-zinc-700' : 'bg-[#09090b] text-zinc-100 selection:bg-blue-500/30'
      }`}
      onClick={handleGlobalClick}
    >
      <Head>
        <title>Xandeum Pulse {zenMode ? '[ZEN MODE]' : ''}</title>
      </Head>
      <WelcomeCurtain />

      {/* --- MODALS --- */}
      {activeStatsModal === 'capacity' && (
        <CapacityModal 
          onClose={() => setActiveStatsModal(null)}
          totalCommitted={totalStorageCommitted}
          totalUsed={totalStorageUsed}
          nodes={nodes}
          medianCommitted={medianCommitted}
        />
      )}
      {activeStatsModal === 'vitals' && (
        <VitalsModal
           onClose={() => setActiveStatsModal(null)}
           nodes={nodes}
           avgHealth={avgNetworkHealth}
           consensusPercent={networkConsensus}
           consensusVersion={mostCommonVersion}
        />
      )}
      {activeStatsModal === 'consensus' && (
        <ConsensusModal
          onClose={() => setActiveStatsModal(null)}
          nodes={nodes}
          mostCommonVersion={mostCommonVersion}
        />
      )}

      {selectedNode && (
        <InspectorModal 
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          zenMode={zenMode}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          nodes={nodes}
          networkStats={networkStats}
          medianCommitted={medianCommitted}
          totalStorageCommitted={totalStorageCommitted}
          mostCommonVersion={mostCommonVersion}
          onShowToast={showToast}
        />
      )}

      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <LiveWireLoader />
        </div>
      )}

      {/* --- SIDE NAVIGATION --- */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-black border-r border-zinc-800 z-[200] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 shrink-0 relative z-10">
            <h2 className="font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={18} /> Menu
            </h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>

          <div className="mb-8 shrink-0 relative z-10">
            <div className={`border p-4 rounded-2xl relative overflow-hidden group ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/80 border-white/5'}`}>
              {!zenMode && <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-xl rounded-full group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none z-0"></div>}
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className={`w-1.5 h-1.5 rounded-full ${zenMode ? 'bg-white' : 'bg-blue-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Protocol Context</span>
              </div>
              <div className="relative z-20">
                <NetworkSwitcher current={networkFilter} onChange={(val) => { setNetworkFilter(val); showToast(`Switched to ${val} View`); }} />
              </div>
              <div className="mt-4 flex items-center justify-between relative z-10">
                <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-tight">Active Stream</span>
                <span className={`text-[9px] font-mono font-bold ${zenMode ? 'text-white' : (networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-zinc-400')}`}>
                  {networkFilter === 'ALL' ? 'GLOBAL_SYNC' : `${networkFilter}_READY`}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-grow space-y-2 relative z-10 overflow-y-auto scrollbar-hide">
            <Link href="/" onClick={() => setIsMenuOpen(false)}><div className="flex items-center gap-3 p-3 bg-zinc-900/50 text-white rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors"><LayoutDashboard size={18} /><span className="text-sm font-bold">Dashboard</span></div></Link>
            <Link href="/map" onClick={() => setIsMenuOpen(false)}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><MapIcon size={18} /><span className="text-sm font-bold">Global Map</span></div></Link>
            <Link href="/leaderboard" onClick={() => setIsMenuOpen(false)}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><Trophy size={18} /><span className="text-sm font-bold">Leaderboard</span></div></Link>
            <button onClick={() => { router.push('/compare'); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><Swords size={18} /><span className="text-sm font-bold">Compare Nodes</span></button>
            <Link href="/docs" onClick={() => setIsMenuOpen(false)}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><BookOpen size={18} /><span className="text-sm font-bold">Documentation</span></div></Link>
          </nav>
        </div>
      </div>

      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-[190] backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>}

      {/* --- HEADER --- */}
      {/* HEADER TWEAK: Reduced vertical padding (py-1 on mobile) and gap */}
      <header className={`sticky top-0 z-[50] border-b px-4 py-1 md:py-3 flex flex-col gap-1 md:gap-4 transition-all duration-500 ${zenMode ? 'bg-black border-zinc-800' : 'bg-[#09090b]/90 backdrop-blur-md border-zinc-800'}`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            {/* HEADER TWEAK: Reduced menu button size slightly */}
            <button onClick={() => setIsMenuOpen(true)} className={`p-2 md:p-3.5 rounded-xl transition ${zenMode ? 'text-zinc-400 border border-zinc-800 hover:text-white' : 'text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'}`}>
              <Menu size={20} className="md:w-7 md:h-7" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={20} /> PULSE
              </h1>
              <span className="text-[9px] text-zinc-600 font-mono tracking-wider ml-1">Sync: {lastSync}</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 relative overflow-hidden group flex flex-col items-center">
            <div className="relative w-full">
              <Search className={`absolute left-3 top-2.5 size-4 z-10 ${zenMode ? 'text-zinc-600' : 'text-zinc-500'}`} />
              {!zenMode && !searchQuery && !isSearchFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none pl-10 pr-4 overflow-hidden z-0">
                  <div className="whitespace-nowrap animate-marquee text-sm text-zinc-600 font-mono opacity-80">
                    Search nodes by Version, IP Address, Country, or Public Key...
                  </div>
                </div>
              )}
              <input type="text" placeholder={zenMode ? "Search..." : ""} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full rounded-lg py-2 pl-10 pr-8 md:pr-4 text-sm outline-none transition-all relative z-10 bg-transparent ${zenMode ? 'border border-zinc-800 text-zinc-300 focus:border-zinc-600 placeholder:text-zinc-700' : 'border border-zinc-800 text-white focus:border-blue-500 shadow-inner'}`} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-zinc-500 hover:text-white transition z-20 p-0.5 bg-black/20 rounded-full hover:bg-zinc-700"><X size={14} /></button>}
            </div>
            {!zenMode && (
              <div className="mt-1 md:mt-2 w-full text-center pointer-events-none min-h-[16px] md:min-h-[20px] transition-all duration-300 hidden md:block">
                <p key={searchTipIndex} className="text-[9px] md:text-xs text-zinc-500 font-mono tracking-wide uppercase flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500 whitespace-normal text-center leading-tight">
                  <Info size={10} className="text-blue-500 shrink-0 md:w-3 md:h-3" />
                  <span>{isSearchFocused ? 'Type to filter nodes instantly' : searchTips[searchTipIndex]}</span>
                </p>
              </div>
            )}
            {!zenMode && <style jsx>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } } .animate-marquee { animation: marquee 15s linear infinite; } `}</style>}
          </div>

          <button onClick={toggleZenMode} className={`p-2 rounded-lg transition flex items-center gap-2 group ${zenMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white' : 'bg-red-900/10 border border-red-500/20 text-red-500 hover:bg-red-900/30'}`} title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}>
            <Monitor size={18} />
            <span className="hidden md:inline text-xs font-bold">{zenMode ? 'EXIT ZEN' : 'ZEN MODE'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-2 scrollbar-hide w-full mt-1 md:mt-6 border-t border-zinc-800/50 pt-2">
          {/* HEADER TWEAK: Aggressive Mobile Size Reduction (h-6, px-3, text-[9px]) */}
          <button onClick={() => fetchData('fast')} disabled={loading} className={`flex items-center gap-1 md:gap-2 px-3 h-6 md:px-6 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs shrink-0 ${loading ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-wait' : zenMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-zinc-900 border border-zinc-800 text-blue-400 hover:bg-zinc-800 hover:scale-105 transform active:scale-95'}`}>
            <RefreshCw size={10} className={`md:w-[14px] md:h-[14px] ${loading || isBackgroundSyncing ? 'animate-spin' : ''}`} /> {loading ? 'SYNC...' : 'REFRESH'}
          </button>

          {/* --- NEW: MINI NETWORK DROPDOWN (Between Refresh & Filters) --- */}
          <div className="relative shrink-0">
             <button 
                onClick={handleDropdownClick}
                className={`flex items-center gap-1 px-2 h-6 md:px-4 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs border ${zenMode ? 'bg-black border-zinc-800 text-zinc-400' : 'bg-black/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}
             >
                {/* Status Dot */}
                <div className={`w-1.5 h-1.5 rounded-full ${networkFilter === 'MAINNET' ? 'bg-green-500' : networkFilter === 'DEVNET' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                <span>{networkFilter === 'ALL' ? 'ALL' : networkFilter === 'MAINNET' ? 'MAIN' : 'DEV'}</span>
                {isNetDropdownOpen ? <ChevronUp size={10} className="md:w-3 md:h-3"/> : <ChevronDown size={10} className="md:w-3 md:h-3"/>}
             </button>

             {/* Dropdown Content */}
             {isNetDropdownOpen && (
               <div className="absolute top-full left-0 mt-1 md:mt-2 w-20 md:w-28 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  {['ALL', 'MAINNET', 'DEVNET'].map((net) => (
                    <button
                      key={net}
                      onClick={() => { setNetworkFilter(net as any); setIsNetDropdownOpen(false); showToast(`View switched to ${net}`); }}
                      className={`px-3 py-2 text-[9px] md:text-xs font-bold text-left hover:bg-zinc-900 flex items-center gap-2 ${networkFilter === net ? 'text-white bg-zinc-900' : 'text-zinc-500'}`}
                    >
                       <div className={`w-1.5 h-1.5 rounded-full ${net === 'MAINNET' ? 'bg-green-500' : net === 'DEVNET' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                       {net === 'ALL' ? 'ALL' : net === 'MAINNET' ? 'MAIN' : 'DEV'}
                    </button>
                  ))}
               </div>
             )}
          </div>

          <div className="flex gap-1 md:gap-2 relative ml-auto">
            {['uptime', 'storage', 'version', 'health'].map((opt) => (
              /* HEADER TWEAK: Aggressive Mobile Size Reduction (px-1.5, h-6, text-[8px]/[9px]) */
              <button key={opt} onClick={() => handleSortChange(opt as any)} className={`flex items-center gap-1 px-1.5 h-6 md:px-3 md:py-2 md:h-auto rounded-lg text-[8px] md:text-xs font-bold transition border whitespace-nowrap ${sortBy === opt ? zenMode ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-blue-500/10 border-blue-500/50 text-blue-400' : zenMode ? 'bg-black border border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                {opt === 'uptime' && <Clock size={10} className="md:w-3 md:h-3" />}{opt === 'storage' && <Database size={10} className="md:w-3 md:h-3" />}{opt === 'version' && <Server size={10} className="md:w-3 md:h-3" />}{opt === 'health' && <HeartPulse size={10} className="md:w-3 md:h-3" />}
                {opt.toUpperCase()}
                {sortBy === opt && (sortOrder === 'asc' ? <ArrowUp size={8} className="ml-0.5 md:ml-1 md:w-[10px] md:h-[10px]" /> : <ArrowDown size={8} className="ml-0.5 md:ml-1 md:w-[10px] md:h-[10px]" />)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!zenMode && <div className={`sticky top-0 z-[80] w-full h-1 bg-gradient-to-b from-black/50 to-transparent pointer-events-none transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>}

      {searchQuery && !zenMode && (
        <div className="sticky top-[110px] md:top-[140px] z-[85] w-full bg-blue-900/90 border-b border-blue-500/30 py-2 px-6 text-center backdrop-blur-md animate-in slide-in-from-top-1">
            <div className="text-xs font-mono text-blue-100">Found <span className="font-bold text-white">{filteredNodes.length}</span> matches for <span className="italic">"{searchQuery}"</span></div>
        </div>
      )}

      {toast && toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-md px-4 pointer-events-none">
            <div className={`border px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 pointer-events-auto ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-yellow-500/30 text-zinc-200'}`}>
               <AlertTriangle size={20} className={zenMode ? 'text-white' : 'text-yellow-500'} />
               <div className="text-xs font-bold leading-relaxed">{toast.msg}</div>
               <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white ml-auto"><X size={16}/></button>
            </div>
        </div>
      )}

      {/* --- MAIN MAIN --- */}
      <main className={`p-4 md:p-8 ${zenMode ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1800px] mx-auto'} transition-all duration-500`}>
        {!zenMode && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
            <div onClick={() => setActiveStatsModal('capacity')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform group relative overflow-hidden h-24 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Network Capacity</div>
                <div>
                  <div className="text-lg md:text-3xl font-bold text-purple-400">{formatBytes(totalStorageCommitted)}</div>
                  <div className="text-[9px] md:text-xs font-bold text-blue-400 mt-0.5 md:mt-1 flex items-center gap-1">{formatBytes(totalStorageUsed)} <span className="text-zinc-600 font-normal">Used</span></div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-purple-400 font-bold flex items-center gap-1 z-10"><Maximize2 size={8} /> DETAILS</div>
            </div>

            <div onClick={() => setActiveStatsModal('vitals')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform h-24 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 opacity-20 pointer-events-none"><div className="ekg-line"></div></div>
              <div className="relative z-10">
                <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1"><HeartPulse size={12} className="text-green-500 animate-pulse" /> Network Vitals</div>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Stability</span><span className="font-mono font-bold text-white">{networkHealth}%</span></div>
                  <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Avg Health</span><span className="font-mono font-bold text-green-400">{avgNetworkHealth}/100</span></div>
                  <div className="flex justify-between text-[8px] md:text-xs"><span className="text-zinc-400">Consensus</span><span className="font-mono font-bold text-blue-400">{networkConsensus.toFixed(1)}%</span></div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-green-400 font-bold flex items-center gap-1 z-10"><Maximize2 size={8} /> DETAILS</div>
              <style jsx>{` @keyframes ekg { 0% { left: -100%; opacity: 0; } 50% { opacity: 1; } 100% { left: 100%; opacity: 0; } } .ekg-line { position: absolute; top: 0; bottom: 0; width: 50%; background: linear-gradient( 90deg, transparent 0%, rgba(34, 197, 94, 0.5) 50%, transparent 100% ); animation: ekg 2s linear infinite; } `}</style>
            </div>

            <div onClick={() => setActiveStatsModal('consensus')} className="bg-zinc-900/50 border border-zinc-800 p-3 md:p-5 rounded-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform group relative overflow-hidden h-24 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Consensus Ver</div>
                <div className="text-lg md:text-3xl font-bold text-blue-400 mt-1">{mostCommonVersion}</div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-blue-400 font-bold flex items-center gap-1 z-10"><Maximize2 size={8} /> DETAILS</div>
            </div>

            <div onClick={() => { const nextFilter = networkFilter === 'ALL' ? 'MAINNET' : networkFilter === 'MAINNET' ? 'DEVNET' : 'ALL'; setNetworkFilter(nextFilter); }} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl backdrop-blur-sm flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-zinc-700 cursor-pointer select-none active:scale-[0.98] h-24 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex justify-between items-center relative z-10 mb-2">
                <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1"><Activity size={10} className={networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-white'} /> Filter</div>
                <NetworkSwitcher current={networkFilter} onChange={setNetworkFilter} size="sm" />
              </div>
              <div className="relative z-10">
                <div className="flex items-baseline gap-1.5"><div className="text-3xl font-black text-white tracking-tighter leading-none" key={filteredNodes.length}>{filteredNodes.length}</div><div className="text-[8px] font-mono text-zinc-600 font-bold uppercase tracking-tight">Nodes</div></div>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col"><div className={`text-[9px] font-black uppercase flex items-center gap-1 ${networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-zinc-400'}`}>{networkFilter === 'ALL' ? 'GLOBAL VIEW' : `${networkFilter} READY`}</div></div>
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/5"><RefreshCw size={10} className={`text-zinc-600 group-hover:text-zinc-400 transition-all duration-700 ${loading ? 'animate-spin' : ''}`} /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mb-8 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse"><RefreshCw size={14} className="animate-spin" /><span className="text-xs font-bold">{error}</span></div>}

        {!zenMode && favorites.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4"><Star className="text-yellow-500" fill="currentColor" size={20} /><h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">
              {watchListNodes.map((node) => (
                <NodeCard key={`${node.pubkey}-${node.network}`} node={node} onClick={(n) => setSelectedNode(n)} onToggleFavorite={toggleFavorite} isFav={true} cycleStep={cycleStep} zenMode={zenMode} mostCommonVersion={mostCommonVersion} sortBy={sortBy} />
              ))}
            </div>
          </div>
        )}

        {!loading && nodes.length > 0 && (
             <div className="flex items-start gap-3 mb-4 mt-8">
                <div className="mt-1">
                   <Activity className={zenMode ? 'text-zinc-500' : (networkFilter === 'MAINNET' ? "text-green-500" : networkFilter === 'DEVNET' ? "text-blue-500" : "text-white")} size={20} />
                </div>
                {/* HEADING TWEAK: Reduced font size, Flex Column, Distributed by on new line */}
                <div className="flex flex-col">
                   <h3 className="text-sm md:text-lg font-bold text-white tracking-widest uppercase leading-tight">
                     {networkFilter === 'ALL' ? 'Nodes across all networks' : networkFilter === 'MAINNET' ? <span className={zenMode ? 'text-white' : "text-green-500"}>Nodes on Mainnet</span> : <span className={zenMode ? 'text-white' : "text-blue-500"}>Nodes on Devnet</span>} 
                     <span className="text-zinc-600 ml-2 text-xs md:text-sm">({filteredNodes.length})</span>
                   </h3>
                   <div className="text-[9px] font-mono text-zinc-500 uppercase mt-1">
                     Distributed by <span className="text-zinc-300">{sortBy}</span> ({sortOrder === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'})
                   </div>
                </div>
            </div>
        )}

        {/* --- DYNAMIC GRID --- */}
        {loading && nodes.length === 0 ? (
          <PulseGraphLoader />
        ) : (
          <div key={`grid-${sortBy}-${sortOrder}-${filteredNodes.length}`} className={`grid gap-2 md:gap-4 ${zenMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:gap-8'} pb-20`}>
            {filteredNodes.map((node, index) => {
              const uniqueKey = node.pubkey ? `${node.pubkey}-${node.network}` : `fallback-${index}`;
              if (zenMode) {
                return (
                   <ZenCard 
                     key={uniqueKey} 
                     node={node} 
                     onClick={(n) => setSelectedNode(n)} 
                     mostCommonVersion={mostCommonVersion} 
                     sortBy={sortBy} 
                   />
                );
              }
              return (
                <NodeCard 
                  key={uniqueKey} 
                  node={node} 
                  onClick={(n) => setSelectedNode(n)} 
                  onToggleFavorite={toggleFavorite} 
                  isFav={favorites.includes(node.address || '')} 
                  cycleStep={cycleStep} 
                  zenMode={zenMode} 
                  mostCommonVersion={mostCommonVersion} 
                  sortBy={sortBy} 
                />
              );
            })}
          </div>
        )}
      </main>

      {!zenMode && (
        <footer className="relative border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center overflow-hidden">
          <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
          <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.</p>
          <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600 mb-4">
            <span className="opacity-50">pRPC Powered</span><span className="text-zinc-800">|</span>
            <div className="flex items-center gap-1"><span>Built by</span><a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">riot' <Twitter size={10} /></a></div>
            <span className="text-zinc-800">|</span><a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">Open Source <ExternalLink size={10} /></a>
          </div>
          <Link href="/docs" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 flex items-center justify-center gap-1 mt-4"><BookOpen size={10} /> System Architecture & Docs</Link>

          {/* --- ACTIVE PODS UPLINK (Integrated Dashboard Pill) --- */}
          <div className="mt-8 md:mt-0 md:absolute md:bottom-6 md:right-6 flex items-center justify-center animate-in fade-in duration-1000">
             <div className="group flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-white/10 hover:bg-black/60 cursor-help" title="Live count of filtered nodes currently in view">
                <div className="relative flex h-1.5 w-1.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 duration-1000"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </div>

                <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-zinc-400 transition-colors">
                   <span>Active Pods Uplink</span>
                   <span className="text-zinc-700">|</span>
                   <span className="text-zinc-300 font-black text-[10px]">{filteredNodes.length}</span>
                </div>
             </div>
          </div>
        </footer>
      )}

      {/* ZEN MODE FOOTER */}
      {zenMode && (
        <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-2 px-6 flex justify-between items-center text-[9px] text-zinc-600 font-mono z-40">
           <div>ZEN MODE ACTIVE</div>
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
             <span>{filteredNodes.length} NODES SYNCED</span>
           </div>
        </footer>
      )}
    </div>
  );
}
