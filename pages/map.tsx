import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { 
  ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, 
  MapPin, RotateCcw, Info, X, HelpCircle, Share2, Check, ArrowRight, 
  AlertOctagon, AlertCircle, EyeOff, BarChart3
} from 'lucide-react';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- INTERFACES ---
interface TopPerformerData {
    pk: string;
    val: number;
    subVal?: number; 
    network?: string;
    address?: string; 
    isUntracked?: boolean; 
}

interface LocationData {
  name: string; 
  country: string; 
  lat: number; 
  lon: number; 
  count: number;
  totalStorage: number; 
  totalCredits: number | null; 
  avgHealth: number;
  avgUptime: number;
  publicRatio: number;
  ips?: string[];
  countryCode?: string;
  topPerformers?: {
      STORAGE: TopPerformerData;
      CREDITS: TopPerformerData;
      HEALTH: TopPerformerData;
  };
}

interface MapStats {
  totalNodes: number; 
  countries: number; 
  topRegion: string; 
  topRegionMetric: number;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

const MODE_COLORS = {
    STORAGE: { hex: '#6366f1', tailwind: 'text-indigo-500', bg: 'bg-indigo-600', border: 'border-indigo-500/50' },
    HEALTH:  { hex: '#10b981', tailwind: 'text-emerald-500', bg: 'bg-emerald-600', border: 'border-emerald-500/50' },
    CREDITS: { hex: '#f97316', tailwind: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500/50' }
};

const TIER_COLORS = ["#f59e0b", "#ec4899", "#00ced1", "#00bfff", "#d8b4fe"];
const TIER_LABELS = {
    STORAGE: ['Massive Hub', 'Major Zone', 'Standard', 'Entry Level', 'Micro Node'],
    CREDITS: ['Legendary', 'Elite', 'Proven', 'Active', 'New Entry'],
    HEALTH:  ['Flawless', 'Robust', 'Fair', 'Shaky', 'Critical']
};
const HEALTH_THRESHOLDS = [90, 75, 60, 40];

export default function MapPage() {
  const router = useRouter();

  // Data State
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // UI State
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' | 'private' } | null>(null);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Refs for Scroll Preservation
  const listRef = useRef<HTMLDivElement>(null);
  const prescrollRef = useRef<number>(0);
  const hasDeepLinked = useRef(false);

  const [dynamicThresholds, setDynamicThresholds] = useState<number[]>([0, 0, 0, 0]);

  const visibleNodes = useMemo(() => locations.reduce((sum, loc) => sum + loc.count, 0), [locations]);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- 1. DATA FETCHING (SILENT REFRESH LOGIC) ---
  useEffect(() => {
    const fetchGeo = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      
      try {
        // Record current scroll position before state update
        if (listRef.current) {
          prescrollRef.current = listRef.current.scrollTop;
        }

        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });

          // Deep Link Logic (Only on first valid data)
          if (isInitial && router.isReady && router.query.focus && !hasDeepLinked.current) {
              hasDeepLinked.current = true;
              const targetIP = router.query.focus as string;
              const targetLoc = res.data.locations?.find((l: LocationData) => l.ips?.includes(targetIP));
              if (targetLoc) {
                  setTimeout(() => { lockTarget(targetLoc.name, targetLoc.lat, targetLoc.lon); }, 500);
              } else {
                  setToast({ msg: `Node ${targetIP} uses a Masked IP (VPN/CGNAT). Geolocation unavailable.`, type: 'private' });
                  setTimeout(() => setToast(null), 6000);
              }
          }
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchGeo(true); // Initial load
    const interval = setInterval(() => fetchGeo(false), 10000); // Silent refresh
    return () => clearInterval(interval);
  }, [router.isReady, router.query.focus]);

  // --- 2. SCROLL GUARD (PRESERVE POSITION) ---
  useLayoutEffect(() => {
    if (listRef.current && prescrollRef.current > 0) {
      listRef.current.scrollTop = prescrollRef.current;
    }
  }, [locations, stats]); // Trigger whenever data updates

  // --- AGGREGATION LOGIC (Country Breakdown) ---
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, {
      code: string;
      name: string;
      count: number;
      storage: number;
      credits: number;
      healthSum: number;
    }>();

    locations.forEach(loc => {
      const code = loc.countryCode || 'XX';
      const current = map.get(code) || { 
        code, 
        name: loc.country, 
        count: 0, 
        storage: 0, 
        credits: 0, 
        healthSum: 0 
      };
      current.count += loc.count;
      current.storage += loc.totalStorage;
      current.credits += (loc.totalCredits || 0);
      current.healthSum += (loc.avgHealth * loc.count); 
      map.set(code, current);
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      avgHealth: c.healthSum / (c.count || 1)
    })).sort((a, b) => {
      if (viewMode === 'STORAGE') return b.storage - a.storage;
      if (viewMode === 'CREDITS') return b.credits - a.credits;
      return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const globalTotals = useMemo(() => ({
      storage: countryBreakdown.reduce((sum, c) => sum + c.storage, 0),
      credits: countryBreakdown.reduce((sum, c) => sum + c.credits, 0),
      nodes: countryBreakdown.reduce((sum, c) => sum + c.count, 0)
  }), [countryBreakdown]);

  const isGlobalCreditsOffline = useMemo(() => {
      if (locations.length === 0) return false; 
      return !locations.some(l => l.totalCredits !== null);
  }, [locations]);

  // Scroll to Active Region (Only when user explicitly clicks/deep links)
  useEffect(() => {
      if (activeLocation && isSplitView) {
          const timer = setTimeout(() => {
              const item = document.getElementById(`list-item-${activeLocation}`);
              if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150); 
          return () => clearTimeout(timer);
      }
  }, [activeLocation, isSplitView]);

  useEffect(() => {
      if (locations.length === 0) return;
      if (viewMode === 'HEALTH') {
          setDynamicThresholds(HEALTH_THRESHOLDS);
          return;
      }
      const values = locations
        .map(l => viewMode === 'STORAGE' ? l.totalStorage : (l.totalCredits || 0))
        .sort((a, b) => a - b);

      const getQuantile = (q: number) => {
          const pos = (values.length - 1) * q;
          const base = Math.floor(pos);
          const rest = pos - base;
          return values[base + 1] !== undefined ? values[base] + rest * (values[base + 1] - values[base]) : values[base];
      };
      setDynamicThresholds([getQuantile(0.90), getQuantile(0.75), getQuantile(0.50), getQuantile(0.25)]);
  }, [locations, viewMode]);

  // --- HELPERS ---
  const getDeepLink = (data: TopPerformerData, destination: 'DASHBOARD' | 'LEADERBOARD') => {
    const params = new URLSearchParams();
    if (destination === 'DASHBOARD') params.set('open', data.pk);
    else params.set('highlight', data.pk); 
    if (data.network) params.set('network', data.network);
    if (data.address) params.set('focusAddr', data.address);
    return destination === 'DASHBOARD' ? `/?${params.toString()}` : `/leaderboard?${params.toString()}`;
  };

  const getTierIndex = (loc: LocationData): number => {
    let val = 0;
    if (viewMode === 'STORAGE') val = loc.totalStorage;
    else if (viewMode === 'CREDITS') val = loc.totalCredits ?? -1;
    else val = loc.avgHealth;

    if (val >= dynamicThresholds[0]) return 0;
    if (val >= dynamicThresholds[1]) return 1;
    if (val >= dynamicThresholds[2]) return 2;
    if (val >= dynamicThresholds[3]) return 3;
    return 4;
  };

  const formatStorage = (gb: number) => gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;
  const formatCredits = (cr: number | null) => cr === null ? "N/A" : cr >= 1000000 ? `${(cr/1000000).toFixed(1)}M` : cr >= 1000 ? `${(cr/1000).toFixed(0)}k` : cr.toString();
  const formatUptime = (seconds: number) => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      return d > 0 ? `${d}d ${h}h` : `${h}h`;
  };

  const getPerformerStats = (pkData: TopPerformerData) => {
      if (viewMode === 'STORAGE') return <span className="text-indigo-400 font-bold">{formatStorage(pkData.val)} Committed</span>;
      if (viewMode === 'CREDITS') return pkData.isUntracked ? <span className="text-orange-400/80 font-bold italic">No Storage Credits</span> : <span className="text-yellow-500 font-bold">{pkData.val.toLocaleString()} Cr Earned</span>;
      if (viewMode === 'HEALTH') {
          const color = pkData.val >= 80 ? 'text-green-400' : pkData.val >= 50 ? 'text-yellow-400' : 'text-red-400';
          return <span className={`font-bold flex items-center gap-2 ${color}`}>{pkData.val}% <span className="text-zinc-600">|</span> <span className="text-blue-300">{formatUptime(pkData.subVal || 0)} Up</span></span>;
      }
  };

  const getLegendLabels = () => {
      if (viewMode === 'HEALTH') return ['> 90%', '75-90%', '60-75%', '40-60%', '< 40%'];
      const format = (v: number) => viewMode === 'STORAGE' ? formatStorage(v) : formatCredits(v);
      return [`> ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[1])} - ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[2])} - ${format(dynamicThresholds[1])}`, `${format(dynamicThresholds[3])} - ${format(dynamicThresholds[2])}`, `< ${format(dynamicThresholds[3])}`];
  };

  const lockTarget = (name: string, lat: number, lon: number) => {
    setActiveLocation(name);
    setExpandedLocation(name); 
    setPosition({ coordinates: [lon, lat], zoom: 3 });
    setIsSplitView(true);
  };

  const toggleExpansion = (name: string, lat: number, lon: number) => {
      if (expandedLocation === name) resetView(); else lockTarget(name, lat, lon);
  };

  const resetView = () => {
    setActiveLocation(null);
    setExpandedLocation(null);
    setPosition({ coordinates: [10, 20], zoom: 1.2 });
  };

  const handleCloseDrawer = () => { setIsSplitView(false); resetView(); };
  const handleCopyCoords = (lat: number, lon: number, name: string) => {
    navigator.clipboard.writeText(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    setCopiedCoords(name);
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  const handleShareLink = (e: React.MouseEvent, ip: string, name: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(`${window.location.origin}/map?focus=${ip}`);
      setCopiedLink(name);
      setTimeout(() => setCopiedLink(null), 2000);
  };

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([5, 12]);
  }, [locations]);

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Health`;
        case 'CREDITS': return loc.totalCredits === null ? (isGlobalCreditsOffline ? "API OFFLINE" : "UNTRACKED") : `${loc.totalCredits.toLocaleString()} Cr`;
    }
  };

  const getXRayStats = (loc: LocationData, index: number, tierColor: string) => {
      const globalShare = ((loc.count / stats.totalNodes) * 100).toFixed(1);
      const topPercent = 100 - (((locations.length - index) / locations.length) * 100);
      let rankText = topPercent < 0.01 ? `Top < 0.01%` : `Top ${topPercent.toFixed(2)}% Tier`;

      if (viewMode === 'STORAGE') return { labelA: 'Avg Density', valA: <span className="text-indigo-400">{formatStorage(loc.totalStorage / loc.count)} per Node</span>, descA: "Avg capacity per node.", labelB: 'Global Share', valB: `${globalShare}% of Network`, descB: "% of total nodes.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Relative tier." };
      if (viewMode === 'CREDITS') {
          if (loc.totalCredits === null) return { labelA: 'Avg Earnings', valA: <span className={`${isGlobalCreditsOffline ? "text-red-400" : "text-zinc-500"} flex items-center justify-center gap-1 font-bold`}>{isGlobalCreditsOffline ? <AlertOctagon size={12}/> : <EyeOff size={12}/>} No Rewards</span>, descA: "Node hasn't met Proof cycles.", labelB: 'Contribution', valB: <span className="text-zinc-400 font-bold">Gossip Active</span>, descB: "Active in topology.", labelC: 'Tier Rank', valC: <span className="text-zinc-500 italic">Unknown</span>, descC: "N/A" };
          return { labelA: 'Avg Earnings', valA: <span className="text-yellow-500">{Math.round(loc.totalCredits / loc.count).toLocaleString()} Cr per Node</span>, descA: "Avg credits per node.", labelB: 'Contribution', valB: `${globalShare}% of Economy`, descB: "Share of total rewards.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Earning power rank." };
      }
      return { labelA: 'Reliability', valA: <span className="text-green-400">{formatUptime(loc.avgUptime)} Avg Uptime</span>, descA: "Avg region uptime.", labelB: 'Node Count', valB: `${globalShare}% of Network`, descB: "Share of active nodes.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Stability tier." };
  };

  const sortedLocations = useMemo(() => [...locations].sort((a, b) => {
    if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
    if (viewMode === 'CREDITS') return (b.totalCredits || 0) - (a.totalCredits || 0);
    return b.avgHealth - a.avgHealth;
  }), [locations, viewMode]);

  const leadingRegion = sortedLocations[0];

  const getDynamicTitle = () => {
    if (loading) return "Calibrating Global Sensors...";
    if (!leadingRegion) return "Waiting for Node Telemetry...";
    const colorClass = MODE_COLORS[viewMode].tailwind; 
    return <><span className={colorClass}>{leadingRegion.country}</span> Leads {viewMode === 'STORAGE' ? 'Storage' : viewMode === 'CREDITS' ? 'Earnings' : 'Vitality'}</>;
  };

  const getDynamicSubtitle = () => {
     if (!leadingRegion) return "Analyzing network topology...";
     const { name, totalStorage, totalCredits, avgHealth, count } = leadingRegion;
     switch (viewMode) {
        case 'STORAGE': return `The largest hub, ${name}, provides ${formatStorage(totalStorage)}.`;
        case 'CREDITS': return totalCredits === null ? "Credits data currently unavailable." : `Operators in ${name} generated ${totalCredits.toLocaleString()} Cr.`;
        case 'HEALTH': return `${name} performs optimally at ${avgHealth}% avg health across ${count} nodes.`;
     }
  };

  const locationsForMap = useMemo(() => {
    if (!activeLocation) return locations;
    const active = locations.find(l => l.name === activeLocation);
    return active ? [...locations.filter(l => l.name !== activeLocation), active] : locations;
  }, [locations, activeLocation]);

  // --- UI COMPONENTS ---
  const ViewToggles = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
        {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
            const Icon = mode === 'STORAGE' ? Database : mode === 'HEALTH' ? Activity : Zap;
            const active = viewMode === mode;
            return (
                <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${active ? `${MODE_COLORS[mode].bg} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Icon size={14} /> <span className="text-[10px] md:text-xs font-bold uppercase">{mode}</span>
                </button>
            );
        })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col">
      <Head>
        <title>Xandeum Command Center</title>
        <style>{`
          @keyframes scanner { 0% { transform: translateX(-100%) skewX(-15deg); } 50%, 100% { transform: translateX(200%) skewX(-15deg); } }
          .animate-scanner { animation: scanner 3s ease-in-out infinite; }
          .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
        `}</style>
      </Head>

      {/* TOAST OVERLAY */}
      {toast && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-95 duration-300 w-[90%] max-w-sm pointer-events-none">
              <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : toast.type === 'private' ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200' : 'bg-zinc-800 border-zinc-700'}`}>
                  {toast.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : toast.type === 'private' ? <EyeOff size={20} className="text-zinc-400" /> : <Info size={20} className="text-blue-500" />}
                  <p className="text-sm font-bold leading-tight">{toast.msg}</p>
              </div>
          </div>
      )}

      {/* COUNTRY BREAKDOWN MODAL */}
      {isCountryModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsCountryModalOpen(false)}>
          <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
              <div className="flex justify-between">
                <div><h3 className="text-lg font-bold text-white flex items-center gap-2"><Globe size={18} className="text-blue-500" /> Global Breakdown</h3></div>
                <button onClick={() => setIsCountryModalOpen(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><X size={18} /></button>
              </div>
              <ViewToggles className="w-full justify-between bg-black/40 border-zinc-800" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {countryBreakdown.map((c, i) => {
                const primaryShare = viewMode === 'STORAGE' ? (c.storage / (globalTotals.storage || 1)) * 100 : viewMode === 'CREDITS' ? (c.credits / (globalTotals.credits || 1)) * 100 : c.avgHealth;
                const metricValue = viewMode === 'STORAGE' ? formatStorage(c.storage) : viewMode === 'CREDITS' ? formatCredits(c.credits) : c.avgHealth.toFixed(2) + '%';
                return (
                  <div key={c.code} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 transition">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3"><span className="text-xs font-mono text-zinc-600">#{i + 1}</span><img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} className="w-5" /><span className="text-sm font-bold text-zinc-200">{c.name}</span></div>
                      <div className={`text-sm font-mono font-bold ${MODE_COLORS[viewMode].tailwind}`}>{metricValue}</div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex"><div className={`h-full ${MODE_COLORS[viewMode].bg}`} style={{ width: `${Math.max(2, primaryShare)}%` }}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-[#09090b] border-b border-zinc-800/30">
        <div className="flex justify-between items-center mb-3">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all"><ArrowLeft size={12} className="text-zinc-400" /><span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Dashboard</span></Link>
            {!loading && (
              <button onClick={() => { setToast({ msg: `${privateNodes} nodes are on Private Networks. Map pins hidden.`, type: 'private' }); setTimeout(() => setToast(null), 6000); }} className="text-zinc-400 text-xs font-bold">Tracking {visibleNodes} <span className="text-zinc-600">/ {stats.totalNodes} Nodes</span></button>
            )}
        </div>
        <div className="flex justify-between items-end">
            <div><h1 className="text-lg md:text-2xl font-bold tracking-tight text-white">{getDynamicTitle()}</h1><p className="text-xs text-zinc-400 mt-1 max-w-2xl">{getDynamicSubtitle()}</p></div>
            {!loading && (
              <button onClick={() => setIsCountryModalOpen(true)} className="hidden md:flex bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold items-center gap-2"><BarChart3 size={12} /> Global Stats</button>
            )}
        </div>
      </div>

      {/* MAP VIEW */}
      <div className={`relative w-full bg-[#080808] ${isSplitView ? 'h-[40vh] shrink-0' : 'flex-1 min-h-0'}`}>
            {loading ? (<div className="absolute inset-0 flex items-center justify-center"><Globe className="animate-pulse text-blue-500" /></div>) : (
                <ComposableMap projectionConfig={{ scale: 170 }} className="w-full h-full">
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={5}>
                    <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#333" strokeWidth={0.5} style={{ default: { outline: "none" }}} />))}</Geographies>
                    {locationsForMap.map((loc) => {
                    const size = sizeScale(loc.count);
                    const isActive = activeLocation === loc.name;
                    const tier = getTierIndex(loc);
                    const isMissing = viewMode === 'CREDITS' && loc.totalCredits === null;
                    const tierColor = isMissing ? '#52525b' : TIER_COLORS[tier];
                    const pingColor = isMissing ? '#52525b' : (isActive ? '#22c55e' : tierColor);
                    return (
                        <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                        <g style={{ opacity: activeLocation && !isActive ? 0.3 : 1 }}>
                            <circle r={size * 2.5} fill={pingColor} className="animate-ping opacity-20" />
                            {isActive ? (<polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,5 -7,9 -5,1 -11,-4 -3,-4" transform={`scale(${size/6})`} fill="#52525b" stroke="#22c55e" strokeWidth={1.5} />) : (<>{viewMode === 'STORAGE' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" />}{viewMode === 'CREDITS' && <circle r={size} fill={tierColor} stroke="#fff" />}{viewMode === 'HEALTH' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" className="rotate-45" />}</>)}
                        </g>
                        </Marker>
                    );
                    })}
                </ZoomableGroup>
                </ComposableMap>
            )}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <button onClick={handleZoomIn} className="p-2 bg-zinc-900/90 rounded-xl"><Plus size={16} /></button>
                <button onClick={handleZoomOut} className="p-2 bg-zinc-900/90 rounded-xl"><Minus size={16} /></button>
                <button onClick={resetView} className="p-2 bg-red-900/80 rounded-xl"><RotateCcw size={16} /></button>
            </div>
      </div>

      {/* STATS DRAWER (FIXED SCROLL JUMPING) */}
      <div className={`shrink-0 bg-[#09090b] relative z-50 flex flex-col ${isSplitView ? 'h-[50vh]' : 'h-auto'}`}>
            {!isSplitView ? (
              <div className="p-4 flex flex-col items-center gap-4">
                  <ViewToggles />
                  <button onClick={() => setIsSplitView(true)} className="w-full max-w-2xl flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-blue-500/30 rounded-xl transition-all shadow-lg"><Activity size={16} className="text-blue-400" /><span className="text-xs font-bold uppercase tracking-widest">Open Live Stats</span><ChevronUp size={16} /></button>
              </div>
            ) : (
                 <div className="flex flex-col h-full overflow-hidden">
                    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800/30">
                       <h2 className="text-sm font-bold flex items-center gap-2"><Activity size={14} className="text-green-500" /> Regional Health</h2>
                       <button onClick={handleCloseDrawer} className="p-2 bg-red-500/10 rounded-xl text-red-500"><X size={20} /></button>
                    </div>

                    <div 
                      ref={listRef} 
                      className="flex-grow overflow-y-auto p-4 space-y-2 pb-safe custom-scrollbar"
                      style={{ overflowAnchor: 'none' }} // Hint for browser anchoring
                    >
                        {sortedLocations.map((loc, i) => {
                            const tier = getTierIndex(loc);
                            const isMissing = viewMode === 'CREDITS' && loc.totalCredits === null;
                            const tierColor = isMissing ? '#71717a' : TIER_COLORS[tier];
                            const isExpanded = expandedLocation === loc.name;
                            const xray = getXRayStats(loc, i, tierColor);
                            const topData = loc.topPerformers ? loc.topPerformers[viewMode] : null;

                            return (
                                <div id={`list-item-${loc.name}`} key={loc.name} onClick={() => toggleExpansion(loc.name, loc.lat, loc.lon)} className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeLocation === loc.name ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-200">{loc.name}</span>
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono font-bold" style={{ color: tierColor }}>{getMetricText(loc)}</div>
                                            <div className="text-[10px] text-zinc-500">{loc.count} Nodes</div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="bg-black/30 border-t border-white/5 p-4">
                                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                                <div className="flex flex-col"><span className="text-zinc-500 text-[9px] uppercase">{xray.labelA}</span><span className="font-mono text-xs font-bold">{xray.valA}</span></div>
                                                <div className="flex flex-col border-l border-zinc-800/50"><span className="text-zinc-500 text-[9px] uppercase">{xray.labelB}</span><span className="text-white font-mono text-xs font-bold">{xray.valB}</span></div>
                                                <div className="flex flex-col border-l border-zinc-800/50"><span className="text-zinc-500 text-[9px] uppercase">{xray.labelC}</span><span className="font-mono text-xs font-bold" style={{ color: tierColor }}>{xray.valC}</span></div>
                                            </div>
                                            {topData && (
                                                <Link href={viewMode === 'CREDITS' ? getDeepLink(topData, 'LEADERBOARD') : getDeepLink(topData, 'DASHBOARD')}>
                                                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Top: {topData.pk.slice(0, 8)}...</div>
                                                            {getPerformerStats(topData)}
                                                        </div>
                                                        <ArrowRight size={14} className="text-blue-400" />
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </div>
            )}
      </div>
    </div>
  );
}
