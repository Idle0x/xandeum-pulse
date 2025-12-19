import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, ChevronDown, MapPin } from 'lucide-react';

// --- CONFIG ---
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Types
interface LocationData {
  name: string;
  country: string;
  lat: number;
  lon: number;
  count: number;
  totalStorage: number; 
  totalCredits: number;
  avgHealth: number;    
}

interface MapStats {
  totalNodes: number;
  countries: number;
  topRegion: string;
  topRegionMetric: number;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  
  // Selection State
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Auto-dismiss timer ref
  const dismissTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Map Position State
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });

  // Fetch Data
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });
        }
      } catch (err) {
        console.error("Map data failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeo();
    const interval = setInterval(fetchGeo, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC HELPERS ---
  
  const handleZoomIn = () => { if (position.zoom < 5) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 })); };
  const handleMoveEnd = (pos: any) => setPosition(pos);

  // Handle Region Selection (Click)
  const selectRegion = (name: string, lat: number, lon: number) => {
    // 1. Set Selected
    setSelectedRegion(name);
    // 2. Fly to location
    setPosition({ coordinates: [lon, lat], zoom: 3 });
    
    // 3. Auto-dismiss logic (15 seconds)
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    dismissTimeout.current = setTimeout(() => {
        setSelectedRegion(null);
    }, 15000);
  };

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([4, 10]);
  }, [locations]);

  const isHub = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return loc.totalStorage > 1000;
        case 'HEALTH': return loc.avgHealth >= 98;
        case 'CREDITS': return loc.totalCredits > 5000;
        default: return false;
    }
  };

  const getDensityColor = (count: number) => {
    if (count === 1) return "#22d3ee"; 
    if (count < 5) return "#60a5fa";   
    if (count < 10) return "#a78bfa";  
    return "#fbbf24";                  
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

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return b.totalCredits - a.totalCredits;
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      <Head><title>Xandeum Command Center</title></Head>

      {/* --- HEADER --- */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="group flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 backdrop-blur-md transition-all">
            <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Dashboard</span>
        </Link>
      </div>

      {/* --- LAYER 1: MAP FRAME (Vertically Reduced) --- */}
      {/* Changed margins to constrain height better: mt-12 mb-28 */}
      <div className="flex-grow relative z-10 mx-4 mt-12 mb-28 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl bg-[#080808]">
        
        {/* Radar Grid */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a202c_0%,_#000000_80%)] opacity-50"></div>
            <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
        </div>

        {/* Map */}
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
              {locations.map((loc) => {
                const isSelected = selectedRegion === loc.name;
                const isDiamond = isHub(loc);
                const color = isSelected ? '#ffffff' : getDensityColor(loc.count);
                const size = sizeScale(loc.count);
                
                return (
                    <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => selectRegion(loc.name, loc.lat, loc.lon)}>
                    <g className="group cursor-pointer">
                        {/* Pulse Ring */}
                        <circle r={size * 2} fill={color} className="animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                        
                        {/* Selection Ring (If Active) */}
                        {isSelected && (
                            <circle r={size * 3} fill="none" stroke="#3b82f6" strokeWidth={2} className="animate-pulse opacity-80" />
                        )}

                        {/* The Marker */}
                        {isDiamond ? (
                            <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={color} stroke="#fff" strokeWidth={1} className="rotate-45" />
                        ) : (
                            <circle r={size} fill={color} stroke="#fff" strokeWidth={1} />
                        )}
                        
                        {/* Floating Label (Visible on Selection) */}
                        {isSelected && (
                            <text y={-size - 10} textAnchor="middle" className="text-[8px] font-bold fill-white uppercase tracking-widest drop-shadow-md">
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

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className="p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl"><Plus size={18} /></button>
            <button onClick={handleZoomOut} className="p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl"><Minus size={18} /></button>
        </div>
        
        {/* Info Box for Selection */}
        {selectedRegion && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-blue-500/50 px-6 py-3 rounded-full z-40 animate-in fade-in slide-in-from-top-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                     {locations.find(l => l.name === selectedRegion)?.name}: <span className="text-blue-400 font-mono">{locations.find(l => l.name === selectedRegion) ? getMetricText(locations.find(l => l.name === selectedRegion)!) : ''}</span>
                </span>
            </div>
        )}
      </div>

      {/* --- LAYER 2: THE DOCK (Floating Above Modal) --- */}
      {/* Moved upwards slightly to clear the collapsed drawer handle */}
      <div className={`absolute bottom-[80px] left-0 right-0 z-40 flex flex-col items-center transition-all duration-300 ${drawerOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="mb-3 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-white/5 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] text-zinc-400 font-medium">
                Pulse: Density &nbsp;|&nbsp; {viewMode === 'STORAGE' ? 'Diamond: High Capacity' : viewMode === 'CREDITS' ? 'Diamond: High Earner' : 'Diamond: High Uptime'}
            </span>
        </div>

        <div className="flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
            {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
                let Icon = Database;
                if (mode === 'HEALTH') Icon = Activity;
                if (mode === 'CREDITS') Icon = Zap;
                const active = viewMode === mode;

                return (
                    <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                        <Icon size={14} />
                        <span className="text-xs font-bold tracking-wide">{mode}</span>
                    </button>
                )
            })}
        </div>
      </div>

      {/* --- LAYER 3: THE INTELLIGENCE DRAWER (Slide Up) --- */}
      
      {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)} className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors z-50 rounded-t-2xl">
            <ChevronUp size={16} className="animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-widest">Open Live Statistics</span>
          </button>
      )}

      {/* Drawer Container */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Transparent Click-Away Layer (NO BLUR) */}
        {drawerOpen && (
            <div className="absolute inset-0 -top-[100vh] bg-transparent" onClick={() => setDrawerOpen(false)}></div>
        )}

        <div className="relative bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[50vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 cursor-pointer" onClick={() => setDrawerOpen(false)}>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white flex items-center gap-2"><Activity size={14} className="text-green-500" /> Live Network Breakdown</span>
                    <span className="text-[10px] text-zinc-500">Sorted by {viewMode.toLowerCase()} • {locations.length} Regions Active</span>
                </div>
                <button className="p-2 bg-zinc-800/50 rounded-full text-zinc-400"><ChevronDown size={16} /></button>
            </div>

            {/* Scrollable List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2 pb-12">
                {sortedLocations.map((loc, i) => (
                    <div 
                        key={loc.name} 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent closing drawer
                            selectRegion(loc.name, loc.lat, loc.lon);
                        }}
                        className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                            selectedRegion === loc.name 
                            ? 'bg-blue-900/20 border-blue-500/50' 
                            : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${
                                selectedRegion === loc.name ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                                {i + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${selectedRegion === loc.name ? 'text-blue-400' : 'text-zinc-200'}`}>{loc.name}, {loc.country}</span>
                                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-mono font-bold text-blue-400">{getMetricText(loc)}</div>
                            <div className="text-[10px] text-zinc-500">{loc.count} Nodes</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-700 rounded-full opacity-50"></div>
        </div>
      </div>
    </div>
  );
}
