import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, ChevronDown, MapPin, RotateCcw } from 'lucide-react';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LocationData {
  name: string; country: string; lat: number; lon: number; count: number;
  totalStorage: number; totalCredits: number; avgHealth: number;
}

interface MapStats {
  totalNodes: number; countries: number; topRegion: string; topRegionMetric: number;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

const TIER_COLORS = ["#22d3ee", "#3b82f6", "#a855f7", "#ec4899", "#f59e0b"]; 

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchGeo();
    const interval = setInterval(fetchGeo, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- INTERACTION LOGIC ---

  const lockTarget = (name: string, lat: number, lon: number) => {
    if (activeLocation === name) {
        resetView();
        return;
    }
    setActiveLocation(name);
    setPosition({ coordinates: [lon, lat], zoom: 3 });
    
    if (drawerOpen && listRef.current) {
         const item = document.getElementById(`list-item-${name}`);
         if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const resetView = () => {
    setActiveLocation(null);
    setPosition({ coordinates: [10, 20], zoom: 1.2 });
  };

  const handleCopyCoords = (lat: number, lon: number, name: string) => {
    const text = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(name);
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  const handleZoomIn = () => { if (position.zoom < 5) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 })); };
  const handleMoveEnd = (pos: any) => setPosition(pos);

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([5, 12]);
  }, [locations]);

  const getTier = (loc: LocationData): number => {
    if (viewMode === 'STORAGE') {
        const gb = loc.totalStorage;
        if (gb < 1) return 0; if (gb < 10) return 1; if (gb < 100) return 2; if (gb < 1000) return 3; return 4;
    }
    if (viewMode === 'CREDITS') {
        const cr = loc.totalCredits;
        if (cr < 100) return 0; if (cr < 1000) return 1; if (cr < 10000) return 2; if (cr < 100000) return 3; return 4;
    }
    const h = loc.avgHealth;
    if (h < 40) return 0; if (h < 60) return 1; if (h < 75) return 2; if (h < 90) return 3; return 4;
  };

  const formatStorage = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
    return `${Math.round(gb)} GB`;
  };

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Health`;
        case 'CREDITS': return `${loc.totalCredits.toLocaleString()} Cr`;
    }
  };

  // --- DYNAMIC TITLES & SORTING ---

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return b.totalCredits - a.totalCredits;
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const leadingRegion = sortedLocations[0];

  const getDynamicTitle = () => {
    if (loading) return "Calibrating Global Sensors...";
    if (!leadingRegion) return "Waiting for Node Telemetry...";

    const { country } = leadingRegion;

    switch (viewMode) {
        case 'STORAGE':
            return <><span className="text-blue-400">{country}</span> Leads Storage Capacity</>;
        case 'CREDITS':
            return <><span className="text-yellow-400">{country}</span> Tops Network Earnings</>;
        case 'HEALTH':
            return <><span className="text-green-400">{country}</span> Sets Vitality Standard</>;
    }
  };

  const getDynamicSubtitle = () => {
     if (!leadingRegion) return "Analyzing network topology...";
     
     const { name, totalStorage, totalCredits, avgHealth, count } = leadingRegion;

     switch (viewMode) {
        case 'STORAGE':
             return `Visualizing regions by committed disk space. The largest hub, ${name}, is currently providing ${formatStorage(totalStorage)}.`;
        case 'CREDITS':
             return `Tracking accumulated node rewards. Operators in ${name} have generated a total of ${totalCredits.toLocaleString()} Cr.`;
        case 'HEALTH':
             return `Monitoring uptime and stability. ${name} is performing optimally with an average health score of ${avgHealth}% across ${count} nodes.`;
     }
  };

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
            return (
                <button
                    key={mode}
                    onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        active ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                >
                    <Icon size={14} className={active ? "text-white" : "text-zinc-500"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
                </button>
            )
        })}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      <Head>
        <title>Xandeum Command Center</title>
        <style>{`
          @supports (padding: max(0px)) {
            .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
          }
        `}</style>
      </Head>

      {/* --- HORIZONTAL HEADER BAR --- */}
      <div className="w-full shrink-0 z-50 flex flex-col gap-4 px-6 py-4 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50 shadow-lg">
        <div className="flex items-center justify-between w-full">
            <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all cursor-pointer">
                <ArrowLeft size={12} className="text-zinc-400 group-hover:text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
                    Dashboard
                </span>
            </Link>
            
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                     viewMode === 'HEALTH' ? 'bg-green-500' : viewMode === 'CREDITS' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    {viewMode} Mode
                </span>
            </div>
        </div>
        
        <div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {getDynamicTitle()}
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed mt-2 max-w-2xl">
                {getDynamicSubtitle()}
            </p>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA (Scrollable if screen is tiny, but generally fixed) --- */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        
        {/* --- MAP CONTAINER --- */}
        {/* Adjusted Height: Not full screen, leaves room for control dock */}
        <div className="relative w-full h-[50vh] md:h-[55vh] border-b border-zinc-800/50 bg-[#080808] transition-all duration-500">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center z-20"><Globe className="animate-pulse text-blue-500" /></div>
            ) : (
                <ComposableMap projectionConfig={{ scale: 170 }} className="w-full h-full" style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={5}>
                    <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any }) => geographies.map((geo: any) => (
                        <Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#333" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#333", outline: "none" }, pressed: { outline: "none" }}} />
                    ))}
                    </Geographies>
                    {locationsForMap.map((loc) => {
                    const size = sizeScale(loc.count);
                    const isActive = activeLocation === loc.name;
                    const tier = getTier(loc);
                    const baseColor = TIER_COLORS[tier];

                    return (
                        <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                        <g className="group cursor-pointer transition-all duration-500">
                            <circle 
                                r={size * 2.5} 
                                fill={isActive ? '#22c55e' : baseColor} 
                                className="animate-ping opacity-20" 
                                style={{ animationDuration: isActive ? '1s' : '3s' }} 
                            />
                            {isActive ? (
                                <polygon 
                                    points="0,-12 3,-4 11,-4 5,1 7,9 0,5 -7,9 -5,1 -11,-4 -3,-4" 
                                    transform={`scale(${size/6})`}
                                    fill="#52525b" stroke="#22c55e" strokeWidth={1.5}
                                    className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                />
                            ) : (
                                <>
                                    {viewMode === 'STORAGE' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={baseColor} stroke="#fff" strokeWidth={1} />}
                                    {viewMode === 'CREDITS' && <circle r={size} fill={baseColor} stroke="#fff" strokeWidth={1} />}
                                    {viewMode === 'HEALTH' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={baseColor} stroke="#fff" strokeWidth={1} className="rotate-45" />}
                                </>
                            )}
                            {isActive && (
                                <text y={-size - 15} textAnchor="middle" className="font-mono text-[8px] fill-white font-bold uppercase tracking-widest pointer-events-none drop-shadow-md z-50">
                                    {loc.name}
                                </text>
                            )}
                        </g>
                        </Marker>
                    );
                    })}
                </ZoomableGroup>
                </ComposableMap>
            )}

            {/* Floating Zoom Controls (Still fine on map) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <button onClick={handleZoomIn} title="Zoom In" className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={16} /></button>
                <button onClick={handleZoomOut} title="Zoom Out" className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={16} /></button>
                {(position.zoom > 1.2 || activeLocation) && (
                    <button onClick={resetView} className="p-2 md:p-3 bg-red-900/80 border border-red-500/50 text-red-200 rounded-xl hover:text-white"><RotateCcw size={16} /></button>
                )}
            </div>
        </div>

        {/* --- CONTROL DOCK (Dedicated Space Below Map) --- */}
        <div className="flex-grow bg-[#09090b] flex flex-col md:flex-row items-center justify-between p-4 md:px-8 gap-4 overflow-y-auto">
            
            {/* Left: View Toggles */}
            <div className="w-full md:w-auto flex justify-center md:justify-start">
                 <ViewToggles />
            </div>

            {/* Center/Right: The Legend (Now in a block, not floating) */}
            <div className="w-full md:w-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-4 opacity-80 text-[10px] md:text-xs text-zinc-400">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-zinc-500"></div><span>Storage</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-500"></div><span>Credits</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-zinc-500 rotate-45"></div><span>Health</span></div>
                </div>

                <div className="hidden md:block w-px h-8 bg-zinc-800"></div>

                <div className="flex flex-col w-full md:w-auto">
                    <div className="text-[10px] md:text-xs font-bold text-zinc-500 mb-1 text-center md:text-left">Metric Intensity</div>
                    <div className="flex items-center gap-2">
                         <div className="w-full md:w-32 h-2 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#a855f7] to-[#f59e0b]"></div>
                    </div>
                    <div className="flex justify-between w-full md:w-32 text-[8px] md:text-[10px] font-mono text-zinc-500 mt-1">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- FOOTER: ACTION BUTTON --- */}
      {/* Fixed at bottom, always accessible, clearly actionable */}
      <div className="shrink-0 p-4 md:p-6 bg-[#09090b] border-t border-zinc-800 z-50">
        {!drawerOpen ? (
            <button 
                onClick={() => setDrawerOpen(true)}
                className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500/50 rounded-xl shadow-lg transition-all group"
            >
                <Activity size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-200 group-hover:text-white">
                    Click to Open Live Stats
                </span>
                <ChevronUp size={18} className="text-zinc-500 group-hover:-translate-y-1 transition-transform" />
            </button>
        ) : (
            <div className="w-full text-center">
                 <span className="text-xs text-zinc-500">Panel Open</span>
            </div>
        )}
      </div>

      {/* --- DRAWER PANEL (Same as before) --- */}
      <div 
        className={`absolute inset-x-0 bottom-0 z-[60] flex flex-col justify-end pointer-events-none transition-transform duration-300 ease-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="pointer-events-auto w-full md:max-w-xl mx-auto h-[60vh] bg-[#09090b] border-t border-zinc-700 rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-black/40 cursor-pointer hover:bg-black/60 transition-colors" onClick={() => setDrawerOpen(false)}>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity size={14} className="text-green-500" /> Live Network Data
                </span>
                <ChevronDown size={20} className="text-zinc-400" />
            </div>

            <div ref={listRef} className="flex-grow overflow-y-auto p-4 space-y-2 pb-safe custom-scrollbar bg-[#09090b]">
                {sortedLocations.map((loc, i) => (
                    <div 
                        id={`list-item-${loc.name}`}
                        key={loc.name} 
                        onClick={(e) => {
                            e.stopPropagation();
                            lockTarget(loc.name, loc.lat, loc.lon);
                        }}
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                            activeLocation === loc.name 
                            ? 'bg-zinc-800 border-green-500/50' 
                            : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${
                                activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                                {i + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-200 group-hover:text-white">{loc.name}, {loc.country}</span>
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyCoords(loc.lat, loc.lon, loc.name);
                                    }}
                                    className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-blue-400 cursor-copy transition-colors"
                                    title="Click to copy GPS"
                                >
                                    <MapPin size={10} /> 
                                    {copiedCoords === loc.name ? <span className="text-green-500 font-bold">Copied!</span> : `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-mono font-bold ${activeLocation === loc.name ? 'text-green-400' : 'text-blue-400'}`}>{getMetricText(loc)}</div>
                            <div className="text-[10px] text-zinc-500">{loc.count} Nodes</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
