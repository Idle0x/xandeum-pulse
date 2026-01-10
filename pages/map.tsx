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
  const [loading, setLoading] = useState(true); // Initial load only
  const [isRefreshing, setIsRefreshing] = useState(false); // Background sync status

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

  const listRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0); // Store scroll position for the guard
  const hasDeepLinked = useRef(false);

  const [dynamicThresholds, setDynamicThresholds] = useState<number[]>([0, 0, 0, 0]);

  const visibleNodes = useMemo(() => locations.reduce((sum, loc) => sum + loc.count, 0), [locations]);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- 1. SCROLL GUARD LOGIC ---
  // Captures the scroll position right before the DOM re-renders with new data
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = scrollPosRef.current;
    }
  }, [locations, countryBreakdown]); // Triggered whenever data updates

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollPosRef.current = e.currentTarget.scrollTop;
  };

  // --- 2. AGGREGATION LOGIC (Memoized for Stability) ---
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, any>();
    locations.forEach(loc => {
      const code = loc.countryCode || 'XX';
      const current = map.get(code) || { code, name: loc.country, count: 0, storage: 0, credits: 0, healthSum: 0 };
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

  // --- 3. SILENT REFRESH FETCH LOOP ---
  useEffect(() => {
    const fetchGeo = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          // Capturing scroll before setting state
          if (listRef.current) scrollPosRef.current = listRef.current.scrollTop;
          
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });

          if (router.isReady && router.query.focus && !hasDeepLinked.current) {
              hasDeepLinked.current = true;
              const targetIP = router.query.focus as string;
              const targetLoc = res.data.locations.find((l: LocationData) => l.ips?.includes(targetIP));
              if (targetLoc) setTimeout(() => lockTarget(targetLoc.name, targetLoc.lat, targetLoc.lon), 500);
          }
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
        setIsRefreshing(false);
      }
    };

    fetchGeo(true);
    const interval = setInterval(() => fetchGeo(false), 10000);
    return () => clearInterval(interval);
  }, [router.isReady]);

  // --- 4. THRESHOLDS ---
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
  const getDeepLink = (data: TopPerformerData, dest: 'DASHBOARD' | 'LEADERBOARD') => {
    const params = new URLSearchParams();
    if (dest === 'DASHBOARD') params.set('open', data.pk); else params.set('highlight', data.pk); 
    if (data.network) params.set('network', data.network);
    if (data.address) params.set('focusAddr', data.address);
    return dest === 'DASHBOARD' ? `/?${params.toString()}` : `/leaderboard?${params.toString()}`;
  };

  const getTierIndex = (loc: LocationData): number => {
    let val = viewMode === 'STORAGE' ? loc.totalStorage : viewMode === 'CREDITS' ? (loc.totalCredits ?? -1) : loc.avgHealth;
    if (val === -1) return -1;
    if (val >= dynamicThresholds[0]) return 0;
    if (val >= dynamicThresholds[1]) return 1;
    if (val >= dynamicThresholds[2]) return 2;
    if (val >= dynamicThresholds[3]) return 3;
    return 4;
  };

  const formatStorage = (gb: number) => gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;
  const formatCredits = (cr: number | null) => cr === null ? "N/A" : cr >= 1000000 ? `${(cr/1000000).toFixed(1)}M` : cr >= 1000 ? `${(cr/1000).toFixed(0)}k` : cr.toString();
  const formatUptime = (s: number) => { const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600); return d > 0 ? `${d}d ${h}h` : `${h}h`; };

  const getPerformerStats = (pkData: TopPerformerData) => {
      if (viewMode === 'STORAGE') return <span className="text-indigo-400 font-bold">{formatStorage(pkData.val)} Committed</span>;
      if (viewMode === 'CREDITS') return pkData.isUntracked ? <span className="text-orange-400/80 font-bold italic">No Storage Credits</span> : <span className="text-yellow-500 font-bold">{pkData.val.toLocaleString()} Cr Earned</span>;
      const color = pkData.val >= 80 ? 'text-green-400' : pkData.val >= 50 ? 'text-yellow-400' : 'text-red-400';
      return <span className={`font-bold flex items-center gap-2 ${color}`}>{pkData.val}% <span className="text-zinc-600">|</span> <span className="text-blue-300">{formatUptime(pkData.subVal || 0)} Up</span></span>;
  };

  const getLegendLabels = () => {
      if (viewMode === 'HEALTH') return ['> 90%', '75-90%', '60-75%', '40-60%', '< 40%'];
      const f = (v: number) => viewMode === 'STORAGE' ? formatStorage(v) : formatCredits(v);
      return [`> ${f(dynamicThresholds[0])}`, `${f(dynamicThresholds[1])}-${f(dynamicThresholds[0])}`, `${f(dynamicThresholds[2])}-${f(dynamicThresholds[1])}`, `${f(dynamicThresholds[3])}-${f(dynamicThresholds[2])}`, `< ${f(dynamicThresholds[3])}`];
  };

  const lockTarget = (name: string, lat: number, lon: number) => {
    if (activeLocation !== name) {
        setActiveLocation(name);
        setExpandedLocation(name); 
        setPosition({ coordinates: [lon, lat], zoom: 3 });
        setIsSplitView(true);
    }
  };

  const resetView = () => { setActiveLocation(null); setExpandedLocation(null); setPosition({ coordinates: [10, 20], zoom: 1.2 }); };
  const handleZoomIn = () => { if (position.zoom < 5) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 })); };

  const sizeScale = useMemo(() => scaleSqrt().domain([0, Math.max(...locations.map(d => d.count), 0)]).range([5, 12]), [locations]);

  const sortedLocations = useMemo(() => [...locations].sort((a, b) => {
    if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
    if (viewMode === 'CREDITS') return (b.totalCredits || 0) - (a.totalCredits || 0);
    return b.avgHealth - a.avgHealth;
  }), [locations, viewMode]);

  const getXRayStats = (loc: LocationData, index: number, tierColor: string) => {
      const globalShare = ((loc.count / stats.totalNodes) * 100).toFixed(1);
      const topPercent = 100 - (((locations.length - index) / locations.length) * 100);
      let rankText = topPercent < 0.01 ? `Top < 0.01%` : `Top ${topPercent.toFixed(2)}% Tier`;

      if (viewMode === 'STORAGE') return { labelA: 'Avg Density', valA: <span className="text-indigo-400">{formatStorage(loc.totalStorage / loc.count)} per Node</span>, descA: "Avg storage per node.", labelB: 'Global Share', valB: `${globalShare}% of Network`, descB: "% of total nodes.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Performance tier." };
      if (viewMode === 'CREDITS') {
          if (loc.totalCredits === null) return { labelA: 'Avg Earnings', valA: <span className="text-zinc-500 font-bold">UNTRACKED</span>, descA: "No proving cycles.", labelB: 'Contribution', valB: "Gossip Active", descB: "Active in topology.", labelC: 'Tier Rank', valC: "Unknown", descC: "Rank unknown." };
          return { labelA: 'Avg Earnings', valA: <span className="text-yellow-500">{Math.round(loc.totalCredits / loc.count).toLocaleString()} Cr per Node</span>, descA: "Avg reputation earned.", labelB: 'Contribution', valB: `${globalShare}% of Economy`, descB: "Share of global credits.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Earning power tier." };
      }
      return { labelA: 'Reliability', valA: <span className="text-green-400">{formatUptime(loc.avgUptime)} Avg Uptime</span>, descA: "Avg continuous uptime.", labelB: 'Node Count', valB: `${globalShare}% of Network`, descB: "Share of active nodes.", labelC: 'Tier Rank', valC: <span style={{ color: tierColor }}>{rankText}</span>, descC: "Stability tier." };
  };

  // --- RENDER HELPERS ---
  const ViewToggles = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
        {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
            const Icon = mode === 'HEALTH' ? Activity : mode === 'CREDITS' ? Zap : Database;
            const active = viewMode === mode;
            return (
                <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${active ? `${MODE_COLORS[mode].bg} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                    <Icon size={14} className={active ? "text-white" : "text-zinc-500"} /><span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
                </button>
            )
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
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
          @supports (padding: max(0px)) { .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); } }
        `}</style>
      </Head>

      {toast && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-95 duration-300 w-[90%] max-w-sm pointer-events-none">
              <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : toast.type === 'private' ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200' : 'bg-zinc-800 border-zinc-700 text-white'}`}>
                  {toast.type === 'error' ? <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" /> : toast.type === 'private' ? <EyeOff size={20} className="text-zinc-400 mt-0.5 shrink-0" /> : <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1"><p className="text-sm font-bold leading-tight">{toast.msg}</p></div>
              </div>
          </div>
      )}

      {/* --- COUNTRY BREAKDOWN MODAL --- */}
      {isCountryModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsCountryModalOpen(false)}>
          <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
              <div className="flex justify-between items-start">
                <div><h3 className="text-lg font-bold text-white flex items-center gap-2"><Globe size={18} className="text-blue-500" /> Global Breakdown</h3><p className="text-xs text-zinc-500 mt-0.5">Ranking {countryBreakdown.length} regions.</p></div>
                <button onClick={() => setIsCountryModalOpen(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition"><X size={18} /></button>
              </div>
              <ViewToggles className="w-full justify-between bg-black/40 border-zinc-800" />
            </div>

            {/* THE FIX: Captured onScroll and LayoutEffect anchor */}
            <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {countryBreakdown.map((c, i) => {
                let share = viewMode === 'STORAGE' ? (c.storage/globalTotals.storage)*100 : viewMode === 'CREDITS' ? (c.credits/globalTotals.credits)*100 : c.avgHealth;
                let val = viewMode === 'STORAGE' ? formatStorage(c.storage) : viewMode === 'CREDITS' ? formatCredits(c.credits) : c.avgHealth.toFixed(2)+'%';
                return (
                  <div key={c.code} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800 transition flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3"><span className="text-xs font-mono text-zinc-600 w-4">#{i + 1}</span><img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} className="w-5 rounded-[2px]" /><span className="text-sm font-bold text-zinc-200">{c.name}</span></div>
                      <div className={`text-sm font-mono font-bold ${MODE_COLORS[viewMode].tailwind}`}>{val}</div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${MODE_COLORS[viewMode].bg}`} style={{ width: `${Math.max(2, share)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="shrink-0 w-full z-50 flex flex-col gap-3 px-4 md:px-6 py-3 bg-[#09090b] border-b border-zinc-800/30">
        <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all"><ArrowLeft size={12} className="text-zinc-400 group-hover:text-white" /><span className="text-zinc-500 group-hover:text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Dashboard</span></Link>
            <div className="flex items-center gap-3">
               {isRefreshing && <div className="flex items-center gap-1.5 animate-pulse"><RotateCcw size={10} className="animate-spin text-blue-500" /><span className="text-[8px] text-blue-400 font-bold uppercase">Syncing Live...</span></div>}
               <div className="flex flex-col items-end leading-none"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: MODE_COLORS[viewMode].hex }}></div><span className="text-[10px] font-mono text-zinc-500 uppercase">{viewMode} Mode</span></div></div>
            </div>
        </div>
        <div className="flex justify-between items-end">
            <div><h1 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">{loading ? "Scanning Protocols..." : viewMode === 'STORAGE' ? "Global Storage Density" : viewMode === 'HEALTH' ? "Network Vitality Index" : "Economic Distribution"}</h1><p className="text-xs text-zinc-400 mt-1 max-w-2xl">{stats.totalNodes} verified nodes detected across {stats.countries} regions.</p></div>
            {!loading && <button onClick={() => setIsCountryModalOpen(true)} className="hidden md:flex bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-2 transition-all items-center gap-3 shadow-lg"><div className="flex -space-x-2">{countryBreakdown.slice(0,3).map(c=>(<div key={c.code} className="w-5 h-5 rounded-full border border-zinc-900 overflow-hidden shadow-sm"><img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} className="w-full h-full object-cover" /></div>))}</div><span className="text-xs font-bold text-zinc-300">View Global Stats</span></button>}
        </div>
      </div>

      {/* MAP */}
      <div className={`relative w-full bg-[#080808] ${isSplitView ? 'h-[40vh] shrink-0' : 'flex-1 basis-0 min-h-0'}`}>
            {loading ? <div className="absolute inset-0 flex items-center justify-center z-20"><Globe className="animate-pulse text-blue-500" /></div> : (
                <ComposableMap projectionConfig={{ scale: 170 }} className="w-full h-full">
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={(pos)=>setPosition(pos)} maxZoom={5}>
                    <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#333" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#333", outline: "none" }}} />))}</Geographies>
                    {locations.map((loc) => {
                        const tier = getTierIndex(loc), size = sizeScale(loc.count), isActive = activeLocation === loc.name;
                        const tColor = tier === -1 ? '#52525b' : TIER_COLORS[tier];
                        return (
                            <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                            <g className="group cursor-pointer transition-all duration-500" style={{ opacity: activeLocation && !isActive ? 0.3 : 1 }}>
                                <circle r={size * 2.5} fill={isActive ? '#22c55e' : tColor} className="animate-ping opacity-20" />
                                {viewMode === 'STORAGE' ? <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tColor} stroke="#fff" /> : viewMode === 'CREDITS' ? <circle r={size} fill={tColor} stroke="#fff" /> : <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tColor} stroke="#fff" className="rotate-45" />}
                            </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
                </ComposableMap>
            )}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <button onClick={handleZoomIn} className="p-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={16} /></button>
                <button onClick={handleZoomOut} className="p-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={16} /></button>
                {activeLocation && <button onClick={resetView} className="p-2 bg-red-900 border border-red-500 text-red-200 rounded-xl"><RotateCcw size={16} /></button>}
            </div>
      </div>

      {/* SPLIT VIEW LIST */}
      <div className={`shrink-0 bg-[#09090b] relative z-50 flex flex-col ${isSplitView ? 'h-[50vh]' : 'h-auto p-4 md:px-6 py-4'}`}>
            {!isSplitView ? (
                <button onClick={() => setIsSplitView(true)} className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 border border-blue-500/30 rounded-xl hover:bg-zinc-800 transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)]"><Activity size={16} className="text-blue-400" /><span className="text-xs font-bold uppercase tracking-widest text-blue-100">Open Live Stats</span><ChevronUp size={16} className="text-blue-500/50" /></button>
            ) : (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-800/30 bg-[#09090b]">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={14} className="text-green-500" /> Regional Telemetry</h2>
                        <button onClick={() => setIsSplitView(false)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"><X size={18} /></button>
                    </div>
                    {/* THE FIX: Captured onScroll and LayoutEffect anchor */}
                    <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-2 pb-safe custom-scrollbar">
                        {sortedLocations.map((loc, i) => {
                            const tier = getTierIndex(loc), isExp = expandedLocation === loc.name, tColor = tier === -1 ? '#71717a' : TIER_COLORS[tier];
                            const xray = getXRayStats(loc, i, tColor), topData = loc.topPerformers?.[viewMode];
                            return (
                                <div id={`list-item-${loc.name}`} key={loc.name} onClick={() => setExpandedLocation(isExp ? null : loc.name)} className={`group rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeLocation === loc.name ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800'}`}>
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3"><div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div><div className="flex flex-col"><span className="text-sm font-bold text-zinc-200 group-hover:text-white flex items-center gap-2">{loc.countryCode && <img src={`https://flagcdn.com/w20/${loc.countryCode.toLowerCase()}.png`} className="w-4" />}{loc.name}, {loc.country}</span><span className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}</span></div></div>
                                        <div className="text-right"><div className="text-sm font-mono font-bold" style={{ color: tColor }}>{getMetricText(loc)}</div><div className="text-[10px] text-zinc-500">{loc.count} Nodes</div></div>
                                    </div>
                                    {isExp && (
                                        <div className="bg-black/30 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                                <div className="flex flex-col items-center"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelA}</div><div className="font-mono font-bold text-[11px]">{xray.valA}</div></div>
                                                <div className="flex flex-col items-center border-l border-zinc-800/50"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelB}</div><div className="font-mono font-bold text-[11px]">{xray.valB}</div></div>
                                                <div className="flex flex-col items-center border-l border-zinc-800/50"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelC}</div><div className="font-mono font-bold text-[11px]">{xray.valC}</div></div>
                                            </div>
                                            {topData && (
                                                <Link href={viewMode === 'CREDITS' ? getDeepLink(topData, 'LEADERBOARD') : getDeepLink(topData, 'DASHBOARD')}>
                                                    <div className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${MODE_COLORS[viewMode].bg} text-white`}><Activity size={14} /></div><div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-400 uppercase">Top Performer</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-white truncate w-32">{topData.pk.slice(0, 16)}...</span>{getPerformerStats(topData)}</div></div></div>
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
