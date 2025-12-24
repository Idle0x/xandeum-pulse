import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { 
  ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, 
  MapPin, RotateCcw, Info, X, HelpCircle, Share2, Check, ArrowRight, 
  AlertOctagon, AlertCircle, EyeOff 
} from 'lucide-react';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// UPDATED INTERFACES FOR NEW API DATA
interface TopPerformerData {
    pk: string;
    val: number;
    subVal?: number; // For Uptime in health mode
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
  // New Structure
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
    STORAGE: { hex: '#8b5cf6', tailwind: 'text-violet-400', bg: 'bg-violet-600', border: 'border-violet-500/50' },
    HEALTH:  { hex: '#10b981', tailwind: 'text-emerald-500', bg: 'bg-emerald-600', border: 'border-emerald-500/50' },
    CREDITS: { hex: '#f97316', tailwind: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500/50' }
};

const TIER_COLORS = ["#f59e0b", "#ec4899", "#a855f7", "#3b82f6", "#22d3ee"]; 

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

  // UI State
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' | 'private' } | null>(null);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const hasDeepLinked = useRef(false);
  
  const [dynamicThresholds, setDynamicThresholds] = useState<number[]>([0, 0, 0, 0]);

  const visibleNodes = useMemo(() => locations.reduce((sum, loc) => sum + loc.count, 0), [locations]);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- SCROLL TO ACTIVE ---
  useEffect(() => {
      if (activeLocation && isSplitView) {
          const timer = setTimeout(() => {
              const item = document.getElementById(`list-item-${activeLocation}`);
              if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150); 
          return () => clearTimeout(timer);
      }
  }, [viewMode, activeLocation, isSplitView]);

  // --- FETCH LOOP ---
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });
          
          if (router.isReady && router.query.focus && !hasDeepLinked.current) {
              hasDeepLinked.current = true;
              const targetIP = router.query.focus as string;
              if (res.data.locations && res.data.locations.length > 0) {
                  const targetLoc = res.data.locations.find((l: LocationData) => l.ips && l.ips.includes(targetIP));
                  if (targetLoc) {
                      setTimeout(() => { lockTarget(targetLoc.name, targetLoc.lat, targetLoc.lon); }, 500);
                  } else {
                      setToast({ msg: `Node ${targetIP} uses a Masked IP (VPN/CGNAT). Geolocation unavailable.`, type: 'private' });
                      setTimeout(() => setToast(null), 6000);
                  }
              }
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    fetchGeo();
    const interval = setInterval(fetchGeo, 10000);
    return () => clearInterval(interval);
  }, [router.isReady, router.query.focus]); 

  // --- THRESHOLD CALCULATION ---
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
          if ((values[base + 1] !== undefined)) {
              return values[base] + rest * (values[base + 1] - values[base]);
          } else {
              return values[base];
          }
      };
      setDynamicThresholds([getQuantile(0.90), getQuantile(0.75), getQuantile(0.50), getQuantile(0.25)]);
  }, [locations, viewMode]);

  // --- HELPERS ---
  const getTierIndex = (loc: LocationData): number => {
    let val = 0;
    if (viewMode === 'STORAGE') val = loc.totalStorage;
    else if (viewMode === 'CREDITS') {
        if (loc.totalCredits === null) return -1;
        val = loc.totalCredits;
    }
    else val = loc.avgHealth;

    if (val >= dynamicThresholds[0]) return 0;
    if (val >= dynamicThresholds[1]) return 1;
    if (val >= dynamicThresholds[2]) return 2;
    if (val >= dynamicThresholds[3]) return 3;
    return 4;
  };

  const formatStorage = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
    return `${Math.round(gb)} GB`;
  };

  const formatCredits = (cr: number | null) => {
      if (cr === null) return "N/A";
      if (cr >= 1000000) return `${(cr/1000000).toFixed(1)}M`;
      if (cr >= 1000) return `${(cr/1000).toFixed(0)}k`;
      return cr.toString();
  };

  const formatUptime = (seconds: number) => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      if(d > 0) return `${d}d ${h}h`;
      return `${h}h`;
  };

  // Helper for Top Performer Stats
  const getPerformerStats = (pkData: TopPerformerData) => {
      if (viewMode === 'STORAGE') {
          return <span className="text-purple-400 font-bold">{formatStorage(pkData.val)} Committed</span>;
      }
      if (viewMode === 'CREDITS') {
          return <span className="text-yellow-500 font-bold">{pkData.val.toLocaleString()} Cr Earned</span>;
      }
      if (viewMode === 'HEALTH') {
          const score = pkData.val;
          const uptime = pkData.subVal || 0;
          const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
          
          return (
            <span className={`font-bold flex items-center gap-2 ${color}`}>
                 {score}% <span className="text-zinc-600">|</span> <span className="text-blue-300">{formatUptime(uptime)} Up</span>
            </span>
          );
      }
  };

  const getLegendLabels = () => {
      if (viewMode === 'HEALTH') return ['> 90%', '75-90%', '60-75%', '40-60%', '< 40%'];
      const format = (v: number) => viewMode === 'STORAGE' ? formatStorage(v) : formatCredits(v);
      return [`> ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[1])} - ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[2])} - ${format(dynamicThresholds[1])}`, `${format(dynamicThresholds[3])} - ${format(dynamicThresholds[2])}`, `< ${format(dynamicThresholds[3])}`];
  };

  const lockTarget = (name: string, lat: number, lon: number) => {
    if (activeLocation !== name) {
        setActiveLocation(name);
        setExpandedLocation(name); 
        setPosition({ coordinates: [lon, lat], zoom: 3 });
        setIsSplitView(true);
    }
    if (listRef.current) {
         setTimeout(() => {
             const item = document.getElementById(`list-item-${name}`);
             if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }, 300);
    }
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
    const text = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(name);
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  const handleShareLink = (e: React.MouseEvent, ip: string, name: string) => {
      e.stopPropagation();
      const url = `${window.location.origin}/map?focus=${ip}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(name);
      setTimeout(() => setCopiedLink(null), 2000);
  };
  
  const handleZoomIn = () => { if (position.zoom < 5) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 })); };
  const handleMoveEnd = (pos: any) => setPosition(pos);

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([5, 12]);
  }, [locations]);

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Health`;
        case 'CREDITS': return loc.totalCredits === null ? "API OFFLINE" : `${loc.totalCredits.toLocaleString()} Cr`;
    }
  };

  const getXRayStats = (loc: LocationData, index: number, tierColor: string) => {
      const globalShare = ((loc.count / stats.totalNodes) * 100).toFixed(1);
      const rawPercentile = ((locations.length - index) / locations.length) * 100;
      const topPercent = 100 - rawPercentile;
      let rankText = `Top < 0.01%`;
      if (topPercent >= 0.01) rankText = `Top ${topPercent.toFixed(2)}% Tier`;

      if (viewMode === 'STORAGE') {
          const avgPerNode = loc.totalStorage / loc.count;
          return {
              labelA: 'Avg Density',
              valA: <span className="text-indigo-400">{formatStorage(avgPerNode)} per Node</span>,
              descA: "Average committed storage per node in this region.",
              labelB: 'Global Share',
              valB: `${globalShare}% of Network`,
              descB: "Percentage of total network nodes located here.",
              labelC: 'Tier Rank',
              valC: <span style={{ color: tierColor }}>{rankText}</span>,
              descC: "Performance tier relative to other regions."
          };
      }
      if (viewMode === 'CREDITS') {
          if (loc.totalCredits === null) {
              return {
                  labelA: 'Avg Earnings',
                  valA: <span className="text-red-400 flex items-center justify-center gap-1 font-bold"><AlertOctagon size={12}/> API OFFLINE</span>,
                  descA: "Source endpoint is unreachable.",
                  labelB: 'Contribution',
                  valB: <span className="text-zinc-500 italic">Unknown</span>,
                  descB: "Data unavailable.",
                  labelC: 'Tier Rank',
                  valC: <span className="text-zinc-500 italic">Unknown</span>,
                  descC: "Cannot calculate rank without data."
              };
          }
          const avgCred = Math.round(loc.totalCredits / loc.count);
          return {
              labelA: 'Avg Earnings',
              valA: <span className="text-yellow-500">{avgCred.toLocaleString()} Cr per Node</span>,
              descA: "Average reputation credits earned per node here.",
              labelB: 'Contribution',
              valB: `${globalShare}% of Economy`,
              descB: "Share of total network reputation credits.",
              labelC: 'Tier Rank',
              valC: <span style={{ color: tierColor }}>{rankText}</span>,
              descC: "Earning power tier relative to other regions."
          };
      }
      return {
          labelA: 'Reliability',
          valA: <span className="text-green-400">{formatUptime(loc.avgUptime)} Avg Uptime</span>,
          descA: "Average continuous uptime of nodes in this region.",
          labelB: 'Node Count',
          valB: `${globalShare}% of Network`,
          descB: "Share of active physical nodes.",
          labelC: 'Tier Rank',
          valC: <span style={{ color: tierColor }}>{rankText}</span>,
          descC: "Stability tier relative to other regions."
      };
  };

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return (b.totalCredits || 0) - (a.totalCredits || 0);
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const leadingRegion = sortedLocations[0];

  const getDynamicTitle = () => {
    if (loading) return "Calibrating Global Sensors...";
    if (!leadingRegion) return "Waiting for Node Telemetry...";
    const { country } = leadingRegion;
    const colorClass = MODE_COLORS[viewMode].tailwind; 
    switch (viewMode) {
        case 'STORAGE': return <><span className={colorClass}>{country}</span> Leads Storage Capacity</>;
        case 'CREDITS': return <><span className={colorClass}>{country}</span> Tops Network Earnings</>;
        case 'HEALTH': return <><span className={colorClass}>{country}</span> Sets Vitality Standard</>;
    }
  };

  const getDynamicSubtitle = () => {
     if (!leadingRegion) return "Analyzing network topology...";
     const { name, totalStorage, totalCredits, avgHealth, count } = leadingRegion;
     switch (viewMode) {
        case 'STORAGE': return `The largest hub, ${name}, is currently providing ${formatStorage(totalStorage)}.`;
        case 'CREDITS': 
            if (totalCredits === null) return "Network credits data is currently unavailable from the endpoint.";
            return `Operators in ${name} have generated a total of ${totalCredits.toLocaleString()} Cr.`;
        case 'HEALTH': return `${name} is performing optimally with an average health score of ${avgHealth}% across ${count} nodes.`;
     }
  };

  const getLegendContext = () => {
      switch(viewMode) {
          case 'STORAGE': return "Visualizing global committed disk space.";
          case 'HEALTH': return "Monitoring uptime, version consensus, and stability.";
          case 'CREDITS': return "Tracking accumulated node rewards and reputation.";
      }
  }

  const locationsForMap = useMemo(() => {
    if (!activeLocation) return locations;
    const others = locations.filter(l => l.name !== activeLocation);
    const active = locations.find(l => l.name === activeLocation);
    return active ? [...others, active] : others;
  }, [locations, activeLocation]);

  const ViewToggles = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
        {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
            let Icon = Database;
            if (mode === 'HEALTH') Icon = Activity;
            if (mode === 'CREDITS') Icon = Zap;
            const active = viewMode === mode;
            const activeColorBg = MODE_COLORS[mode].bg;
            return (
                <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${active ? `${activeColorBg} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                    <Icon size={14} className={active ? "text-white" : "text-zinc-500"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
                </button>
            )
        })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col">
      <Head>
        <title>Xandeum Command Center</title>
        <style>{`@supports (padding: max(0px)) { .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); } }`}</style>
      </Head>

      {toast && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-95 duration-300 w-[90%] max-w-sm pointer-events-none">
              <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : toast.type === 'private' ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200' : 'bg-zinc-800 border-zinc-700 text-white'}`}>
                  {toast.type === 'error' ? <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" /> : toast.type === 'private' ? <EyeOff size={20} className="text-zinc-400 mt-0.5 shrink-0" /> : <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1"><p className="text-sm font-bold leading-tight">{toast.msg}</p></div>
              </div>
          </div>
      )}

      <div className="shrink-0 w-full z-50 flex flex-col gap-3 px-4 md:px-6 py-3 bg-[#09090b] border-b border-zinc-800/30">
        <div className="flex items-center justify-between w-full">
            <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all cursor-pointer">
                <ArrowLeft size={12} className="text-zinc-400 group-hover:text-white" />
                <span className="text-zinc-500 group-hover:text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
            </Link>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: MODE_COLORS[viewMode].hex }}></div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{viewMode} Mode</span>
                </div>
                {!loading && (
                    <button onClick={() => { setToast({ msg: `${privateNodes} nodes are running on Private Networks/VPNs, preventing public geolocation. Their data is tracked, but their map pin is hidden.`, type: 'private' }); setTimeout(() => setToast(null), 6000); }} className="hidden md:flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-help">
                        <HelpCircle size={12} className="text-zinc-500" />
                        <span className="text-xs md:text-sm font-bold tracking-tight">Tracking {visibleNodes} <span className="text-zinc-600">/ {stats.totalNodes} Nodes</span></span>
                    </button>
                )}
            </div>
        </div>
        <div><h1 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">{getDynamicTitle()}</h1><p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">{getDynamicSubtitle()}</p></div>
      </div>

      <div className={`relative w-full bg-[#080808] ${isSplitView ? 'h-[40vh] shrink-0' : 'flex-1 basis-0 min-h-0'}`}>
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center z-20"><Globe className="animate-pulse text-blue-500" /></div>
            ) : (
                <ComposableMap projectionConfig={{ scale: 170 }} className="w-full h-full" style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={5}>
                    <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#333" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#333", outline: "none" }, pressed: { outline: "none" }}} />))}
                    </Geographies>
                    {locationsForMap.map((loc) => {
                    const size = sizeScale(loc.count);
                    const isActive = activeLocation === loc.name;
                    const tier = getTierIndex(loc);
                    const isMissingData = viewMode === 'CREDITS' && loc.totalCredits === null;
                    const tierColor = isMissingData ? '#52525b' : TIER_COLORS[tier];
                    const opacity = activeLocation && !isActive ? 0.3 : 1;
                    const pingColor = isMissingData ? '#52525b' : (isActive ? '#22c55e' : tierColor);

                    return (
                        <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                        <g className="group cursor-pointer transition-all duration-500" style={{ opacity }}>
                            <circle r={size * 2.5} fill={pingColor} className="animate-ping opacity-20" style={{ animationDuration: isActive ? '1s' : '3s' }} />
                            {isActive ? (<polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,5 -7,9 -5,1 -11,-4 -3,-4" transform={`scale(${size/6})`} fill="#52525b" stroke="#22c55e" strokeWidth={1.5} className="drop-shadow-[0_0_15px_rgba(34,197,94,1)]" />) : (<>{viewMode === 'STORAGE' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" strokeWidth={1} />}{viewMode === 'CREDITS' && <circle r={size} fill={tierColor} stroke="#fff" strokeWidth={1} />}{viewMode === 'HEALTH' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" strokeWidth={1} className="rotate-45" />}</>)}
                            {isActive && (<g transform={`translate(0, ${-size - 18})`}><rect x="-60" y="-20" width="120" height="24" rx="4" fill="black" fillOpacity="0.8" stroke="#22c55e" strokeWidth="1" className="drop-shadow-lg" /><text y="-4" textAnchor="middle" className="font-mono text-[10px] fill-white font-bold uppercase tracking-widest pointer-events-none dominant-baseline-central">{loc.name}</text><path d="M -5 4 L 0 9 L 5 4" fill="black" stroke="#22c55e" strokeWidth="1" strokeDasharray="0,14,3" /></g>)}
                        </g>
                        </Marker>
                    );
                    })}
                </ZoomableGroup>
                </ComposableMap>
            )}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <button onClick={handleZoomIn} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={16} /></button>
                <button onClick={handleZoomOut} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={16} /></button>
                {(position.zoom > 1.2 || activeLocation) && <button onClick={resetView} className="p-2 md:p-3 bg-red-900/80 border border-red-500/50 text-red-200 rounded-xl hover:text-white"><RotateCcw size={16} /></button>}
            </div>
      </div>

      <div className={`shrink-0 bg-[#09090b] relative z-50 flex flex-col ${isSplitView ? 'h-[50vh]' : 'h-auto'}`}>
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 gap-4 ${isSplitView ? 'hidden' : 'flex'}`}>
                <div className="w-full md:w-auto flex justify-center md:justify-start"><ViewToggles /></div>
                <div className="w-full md:w-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 max-w-xl">
                        <div className="flex items-start gap-2"><Info size={12} className="text-blue-400 mt-0.5 shrink-0" /><p className="text-[10px] text-zinc-400 leading-tight"><strong className="text-zinc-200">{getLegendContext()}</strong> {viewMode === 'STORAGE' || viewMode === 'CREDITS' ? "Thresholds are dynamic (percentile-based)." : "Thresholds are fixed."}</p></div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 w-full">
                        {getLegendLabels().map((label, idx) => (<div key={idx} className="flex flex-col items-center gap-1.5"><div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: TIER_COLORS[idx] }}></div><span className="text-[9px] font-mono text-zinc-500 font-bold whitespace-nowrap">{label}</span></div>))}
                    </div>
                </div>
            </div>

            <div className={`flex flex-col h-full overflow-hidden ${isSplitView ? 'flex' : 'hidden'}`}>
                 <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-800/30 bg-[#09090b]">
                    <div className="flex items-center gap-3"><h2 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={14} className="text-green-500" /> Live Data</h2><div className="hidden md:block scale-90 origin-left"><ViewToggles /></div></div>
                    <div className="flex items-center gap-2">
                        <div className="md:hidden scale-75 origin-right"><ViewToggles /></div>
                        <button onClick={handleCloseDrawer} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><X size={20} /></button>
                    </div>
                 </div>

                 <div ref={listRef} className="flex-grow overflow-y-auto p-4 space-y-2 pb-safe custom-scrollbar bg-[#09090b]">
                    {sortedLocations.map((loc, i) => {
                        const tier = getTierIndex(loc);
                        const isMissingData = viewMode === 'CREDITS' && loc.totalCredits === null;
                        const tierColor = isMissingData ? '#71717a' : TIER_COLORS[tier];
                        const isExpanded = expandedLocation === loc.name;
                        const xray = getXRayStats(loc, i, tierColor);
                        const sampleIp = loc.ips && loc.ips.length > 0 ? loc.ips[0] : null;
                        const topData = loc.topPerformers ? loc.topPerformers[viewMode] : null;

                        return (
                            <div id={`list-item-${loc.name}`} key={loc.name} onClick={(e) => { e.stopPropagation(); toggleExpansion(loc.name, loc.lat, loc.lon); }} className={`group rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeLocation === loc.name ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800'}`}>
                                <div className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-white flex items-center gap-2">{loc.countryCode && <img src={`https://flagcdn.com/w20/${loc.countryCode.toLowerCase()}.png`} className="w-4 h-auto rounded-sm" />}{loc.name}, {loc.country}</span>
                                            <span onClick={(e) => { e.stopPropagation(); handleCopyCoords(loc.lat, loc.lon, loc.name); }} className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-blue-400 cursor-copy transition-colors"><MapPin size={10} /> {copiedCoords === loc.name ? <span className="text-green-500 font-bold">Copied!</span> : `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-mono font-bold ${isMissingData ? 'text-red-400' : ''}`} style={isMissingData ? {} : { color: tierColor }}>{getMetricText(loc)}</div>
                                        <div className="text-[10px] text-zinc-500">{loc.count} Nodes</div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="bg-black/30 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-4"><div className="text-[10px] md:text-sm font-bold uppercase tracking-widest px-3 py-1 rounded border bg-black/50" style={{ color: tierColor, borderColor: `${tierColor}40` }}>{isMissingData ? 'UNKNOWN' : TIER_LABELS[viewMode][tier]} TIER</div><div className="flex gap-2">{sampleIp && (<button onClick={(e) => handleShareLink(e, sampleIp, loc.name)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition">{copiedLink === loc.name ? <Check size={12} /> : <Share2 size={12} />}{copiedLink === loc.name ? 'Link Copied' : 'Share Region'}</button>)}</div></div>
                                        <div className="grid grid-cols-3 gap-2 text-xs md:text-sm text-center mb-4">
                                            <div className="flex flex-col items-center group/stat"><div className="text-zinc-500 text-[9px] md:text-[10px] uppercase mb-1 flex items-center gap-1">{xray.labelA}<HelpCircle size={8} className="cursor-help opacity-50"/><div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descA}</div></div><div className="font-mono font-bold">{xray.valA}</div></div>
                                            <div className="flex flex-col items-center border-l border-zinc-800/50 group/stat"><div className="text-zinc-500 text-[9px] md:text-[10px] uppercase mb-1 flex items-center gap-1">{xray.labelB}<HelpCircle size={8} className="cursor-help opacity-50"/><div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descB}</div></div><div className="text-white font-mono font-bold">{xray.valB}</div></div>
                                            <div className="flex flex-col items-center border-l border-zinc-800/50 group/stat"><div className="text-zinc-500 text-[9px] md:text-[10px] uppercase mb-1 flex items-center gap-1">{xray.labelC}<HelpCircle size={8} className="cursor-help opacity-50"/><div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descC}</div></div><div className="font-mono font-bold">{xray.valC}</div></div>
                                        </div>
                                        {topData && (
                                            <Link href={viewMode === 'CREDITS' ? `/leaderboard?highlight=${topData.pk}` : `/?open=${topData.pk}`}>
                                                <div className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between cursor-pointer group/card transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${MODE_COLORS[viewMode].bg} text-white`}>
                                                            {viewMode === 'STORAGE' ? <Database size={14} /> : viewMode === 'CREDITS' ? <Zap size={14} /> : <Activity size={14} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Region's Top Performer</div>
                                                            {/* Desktop Layout: Stat and Key inline */}
                                                            <div className="flex items-center gap-3">
                                                                {/* Shows PK on all screens, truncates more on desktop to fit stat */}
                                                                <div className="text-xs font-mono text-white truncate w-32 md:w-24 lg:w-32">{topData.pk.slice(0, 16)}...</div>
                                                                
                                                                {/* Desktop Only Stat */}
                                                                <div className="hidden md:block text-xs">
                                                                    {getPerformerStats(topData)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 group-hover/card:translate-x-1 transition-transform whitespace-nowrap">
                                                        VIEW DETAILS <ArrowRight size={12} />
                                                    </div>
                                                </div>
                                            </Link>
                                        )}
                                        <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden"><div className="h-full bg-white/20" style={{ width: `${(loc.count / stats.totalNodes) * 100}%` }}></div></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {!isSplitView && (
                <div className="shrink-0 p-3 md:px-6 md:py-4 bg-[#09090b] border-t border-zinc-800/30 z-50">
                    <button onClick={() => setIsSplitView(true)} className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900/80 hover:bg-zinc-800 border border-blue-500/30 hover:border-blue-500/60 rounded-xl transition-all group shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-[pulse_3s_infinite]"><Activity size={16} className="text-blue-400 group-hover:scale-110 transition-transform animate-pulse" /><span className="text-xs md:text-sm font-bold uppercase tracking-widest text-blue-100 group-hover:text-white">Open Live Stats</span><ChevronUp size={16} className="text-blue-500/50 group-hover:-translate-y-1 transition-transform" /></button>
                </div>
            )}
      </div>
    </div>
  );
}
