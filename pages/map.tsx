import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, ChevronDown, MapPin } from 'lucide-react';

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
  
  // Interaction State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null); // New for "Surprise" Sync
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const highlightTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // --- LOGIC ---
  const lockTarget = (name: string, lat: number, lon: number) => {
    setActiveLocation(name);
    setPosition({ coordinates: [lon, lat], zoom: 3 });
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => setActiveLocation(null), 15000); 
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
    if (h < 50) return 0; if (h < 80) return 1; if (h < 90) return 2; if (h < 98) return 3; return 4;
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

  // Sort Logic
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return b.totalCredits - a.totalCredits;
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const locationsForMap = useMemo(() => {
    // Sort so active/hovered nodes render last (on top)
    const priority = activeLocation || hoveredLocation;
    if (!priority) return locations;
    const others = locations.filter(l => l.name !== priority);
    const active = locations.find(l => l.name === priority);
    return active ? [...others, active] : others;
  }, [locations, activeLocation, hoveredLocation]);

  // Reusable Toggle Component
  const ViewToggles = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-lg ${className}`}>
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
                    <Icon size={12} />
                    <span className="text-[10px] font-bold tracking-wide">{mode}</span>
                </button>
            )
        })}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      <Head><title>Xandeum Command Center</title></Head>

      {/* --- HEADER --- */}
      <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-4 max-w-[80%] pointer-events-none">
        <Link href="/" className="pointer-events-auto group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all">
            <ArrowLeft size={14} className="text-zinc-400 group-hover:text-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">Operations</span>
        </Link>
        <div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-zinc-400">
                Global Distribution of {viewMode.charAt(0) + viewMode.slice(1).toLowerCase()}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs md:text-sm text-zinc-400 font-mono">
                    Tracking <span className="text-white font-bold">{stats.totalNodes}</span> nodes across <span className="text-white font-bold">{stats.countries}</span> regions
                </p>
            </div>
        </div>
      </div>

      {/* --- LAYER 1: MAP FRAME (Top 50-60%) --- */}
      {/* Z-Index 10: Stays Interactive even when Drawer (Z-40) is open below it */}
      <div className="relative z-10 mx-6 mt-32 h-[45vh] border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl bg-[#080808] transition-all duration-500">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a202c_0%,_#000000_80%)] opacity-50"></div>
            <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
        </div>

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
                // Active if Clicked OR Hovered in List
                const isActive = activeLocation === loc.name || hoveredLocation === loc.name;
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
                        {isActive && (
                            <text y={size + 15} textAnchor="middle" className="font-sans text-[6px] fill-green-400 font-bold pointer-events-none z-50">
                                {getMetricText(loc)}
                            </text>
                        )}
                    </g>
                    </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}

        <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className="p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={18} /></button>
            <button onClick={handleZoomOut} className="p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={18} /></button>
        </div>
      </div>

      {/* --- LAYER 2: EXTERNAL DOCK (Fades out when Drawer Open) --- */}
      {/* Hidden on Mobile (since drawer has toggles). Visible on Desktop. */}
      <div className={`hidden md:flex absolute top-[55vh] mt-6 left-0 right-0 z-30 flex-col items-center transition-opacity duration-500 ${drawerOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <ViewToggles />
        <div className="mt-4 flex flex-col items-center text-[9px] text-zinc-400 font-mono bg-black/40 px-4 py-3 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-xl">
            <div className="mb-2 font-bold text-zinc-300">Pulse shows node density</div>
            <div className="flex items-stretch gap-3">
                <div className="w-1.5 rounded-full bg-gradient-to-b from-[#22d3ee] via-[#a855f7] to-[#f59e0b] shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                <div className="flex flex-col justify-between h-24 text-[8px] text-zinc-500 font-bold uppercase tracking-wider py-1">
                    {viewMode === 'STORAGE' && <>{['< 1 GB','1 - 10 GB','10 - 100 GB','100 GB - 1 TB'].map(t=><span key={t}>{t}</span>)}<span className="text-[#f59e0b]">&gt; 1 TB</span></>}
                    {viewMode === 'CREDITS' && <>{['< 100','100 - 1k','1k - 10k','10k - 100k'].map(t=><span key={t}>{t}</span>)}<span className="text-[#f59e0b]">&gt; 100k</span></>}
                    {viewMode === 'HEALTH' && <>{['< 50%','50% - 80%','80% - 90%','90% - 98%'].map(t=><span key={t}>{t}</span>)}<span className="text-[#f59e0b]">&gt; 98%</span></>}
                </div>
            </div>
        </div>
      </div>

      {/* --- LAYER 3: TRIGGERS --- */}
      {!drawerOpen && (
          <>
            {/* Desktop: Floating Pill */}
            <div className="hidden md:flex absolute top-[80vh] left-0 right-0 justify-center z-50 pointer-events-none transition-all duration-500">
                <button 
                    onClick={() => setDrawerOpen(true)}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-zinc-200 hover:text-white hover:border-blue-500/50 hover:bg-zinc-800 transition-all active:scale-95 transform -translate-y-1/2"
                >
                    <Activity size={16} className="text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Statistics</span>
                    <ChevronUp size={16} className="text-zinc-500" />
                </button>
            </div>

            {/* Mobile: Fixed Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b] border-t border-zinc-800 pb-safe">
                <button 
                    onClick={() => setDrawerOpen(true)}
                    className="w-full flex items-center justify-between px-6 py-4 text-zinc-300 hover:text-white transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Live Statistics</span>
                    </div>
                    <ChevronUp size={16} />
                </button>
            </div>
          </>
      )}

      {/* --- LAYER 4: UTILITY PANEL (Non-Blocking) --- */}
      {/* 1. pointer-events-none container: Allows clicks to pass through to map
          2. pointer-events-auto card: Allows interaction with the panel itself 
      */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) pointer-events-none ${
            drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '50vh' }} // Stops halfway up the screen
      >
        {/* The Card */}
        <div className="w-full md:w-[600px] h-full bg-[#09090b]/95 border-t md:border border-zinc-700 md:rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto">
            
            {/* Header */}
            <div className="flex flex-col gap-3 px-6 py-4 border-b border-zinc-800/50 bg-black/20 shrink-0">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setDrawerOpen(false)}>
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity size={14} className="text-green-500" /> Network Data
                    </span>
                    <button className="p-2 bg-zinc-800/50 rounded-full text-zinc-400 hover:bg-zinc-700">
                        <ChevronDown size={16} />
                    </button>
                </div>
                {/* Toggles Inside Panel */}
                <ViewToggles className="w-full justify-between bg-black/50" />
            </div>

            {/* Scrollable List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2 pb-8">
                {sortedLocations.map((loc, i) => (
                    <div 
                        key={loc.name} 
                        // SYNC MAGIC: Hovering list highlights map!
                        onMouseEnter={() => setHoveredLocation(loc.name)}
                        onMouseLeave={() => setHoveredLocation(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            lockTarget(loc.name, loc.lat, loc.lon);
                        }}
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                            activeLocation === loc.name || hoveredLocation === loc.name
                            ? 'bg-zinc-800 border-green-500/50' 
                            : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${
                                activeLocation === loc.name || hoveredLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                                {i + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-200 group-hover:text-white">{loc.name}, {loc.country}</span>
                                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <MapPin size={10} /> {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-mono font-bold ${activeLocation === loc.name || hoveredLocation === loc.name ? 'text-green-400' : 'text-blue-400'}`}>{getMetricText(loc)}</div>
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
