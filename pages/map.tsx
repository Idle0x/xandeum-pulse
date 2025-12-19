import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { 
    ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, 
    List, X, ChevronUp, ChevronDown 
} from 'lucide-react';

// --- CONFIG ---
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LocationData {
  name: string;
  country: string;
  lat: number;
  lon: number;
  count: number;
  totalStorage: number; // in GB
  totalCredits: number;
  avgHealth: number;    // 0-100
}

interface MapStats {
  totalNodes: number;
  countries: number;
  topRegion: string;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.3 });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Rich Data
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
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

  // --- ZOOM CONTROLS ---
  const handleZoomIn = () => position.zoom < 5 && setPosition(p => ({ ...p, zoom: p.zoom * 1.5 }));
  const handleZoomOut = () => position.zoom > 1 && setPosition(p => ({ ...p, zoom: p.zoom / 1.5 }));
  const handleMoveEnd = (pos: any) => setPosition(pos);

  // --- HELPER: FORMAT STORAGE ---
  const formatStorage = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb} GB`;
  };

  // --- HYBRID MARKER LOGIC ---
  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([4, 12]);
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
    if (count === 1) return "#22d3ee"; // Cyan
    if (count < 5) return "#60a5fa";   // Blue
    if (count < 10) return "#a78bfa";  // Purple
    return "#fbbf24";                  // Amber (Hub)
  };

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Uptime`;
        case 'CREDITS': return `${loc.totalCredits.toLocaleString()} Credits`;
    }
  };

  // --- SORTED DATA FOR MODAL ---
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'HEALTH') return b.avgHealth - a.avgHealth;
        return b.totalCredits - a.totalCredits;
    });
  }, [locations, viewMode]);

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      <Head><title>Xandeum Command Center</title></Head>

      {/* HEADER */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="group flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 backdrop-blur-md transition-all">
            <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Dashboard</span>
        </Link>
      </div>

      {/* MAP FRAME */}
      <div className="flex-grow relative z-10 mx-4 mt-20 mb-36 border border-blue-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)] relative bg-black/40">
        
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a2230_0%,_#000000_80%)] opacity-50"></div>
            <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
        </div>

        {/* Map */}
        {!loading && (
          <ComposableMap projectionConfig={{ scale: 190 }} className="w-full h-full">
            <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={5}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any }) => geographies.map((geo: any) => (
                    <Geography key={geo.rsmKey} geography={geo} fill="#262626" stroke="#404040" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#404040", outline: "none" }, pressed: { outline: "none" }}} />
                ))}
              </Geographies>
              {locations.map((loc) => {
                const isDiamond = isHub(loc);
                const color = getDensityColor(loc.count);
                const size = sizeScale(loc.count);
                return (
                    <Marker key={loc.name} coordinates={[loc.lon, loc.lat]}>
                        <g onMouseEnter={() => setTooltip(`${loc.name} • ${loc.count} Nodes`)} onMouseLeave={() => setTooltip(null)}>
                            <circle r={size * 2.5} fill={color} className="animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                            {isDiamond ? 
                                <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={color} stroke="#fff" strokeWidth={1.5} className="rotate-45" /> : 
                                <circle r={size} fill={color} stroke="#fff" strokeWidth={1} />
                            }
                        </g>
                    </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}

        {/* Tooltip Overlay */}
        {tooltip && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-blue-500/30 px-4 py-2 rounded-full shadow-2xl animate-fade-in z-50">
                <span className="text-xs font-bold font-mono tracking-wide">{tooltip}</span>
            </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-white/10"><Plus size={18} /></button>
            <button onClick={handleZoomOut} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-white/10"><Minus size={18} /></button>
        </div>

        {/* HUD 1: CENTER TOGGLE BAR */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl">
            {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
                let Icon = Database;
                if (mode === 'HEALTH') Icon = Activity;
                if (mode === 'CREDITS') Icon = Zap;
                return (
                    <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${viewMode === mode ? 'bg-zinc-800 border-blue-500/50 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                        <Icon size={14} className={viewMode === mode ? 'text-blue-400' : ''} />
                        <span className="text-[10px] font-bold tracking-widest">{mode}</span>
                    </button>
                )
            })}
        </div>
      </div>

      {/* HUD 2: LIVE INTELLIGENCE MODAL (Collapsible Drawer) */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] transition-transform duration-500 ease-in-out ${isModalOpen ? 'translate-y-0' : 'translate-y-[85%]'}`}>
        
        {/* The Drawer Container */}
        <div className="mx-auto max-w-2xl bg-zinc-900/95 backdrop-blur-xl border-t border-l border-r border-blue-500/30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[60vh] flex flex-col">
            
            {/* Drawer Handle / Header */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors"
                onClick={() => setIsModalOpen(!isModalOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-blue-500/10 text-blue-400`}>
                        {isModalOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white tracking-widest flex items-center gap-2">
                            LIVE INTELLIGENCE
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                            {sortedLocations.length} ACTIVE REGIONS • SORTED BY {viewMode}
                        </div>
                    </div>
                </div>
                {!isModalOpen && (
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        Expand Data
                    </span>
                )}
            </div>

            {/* Scrollable Data List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {sortedLocations.map((loc, i) => (
                    <div key={loc.name} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-blue-500/30 transition-all group">
                        
                        {/* Rank & Name */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-zinc-600 w-4">#{i + 1}</span>
                            <div>
                                <div className="text-sm font-bold text-zinc-200 group-hover:text-white">{loc.name}, {loc.country}</div>
                                <div className="text-[10px] text-zinc-500">{loc.count} Active Nodes</div>
                            </div>
                        </div>

                        {/* The Metric */}
                        <div className="text-right">
                            <div className="text-sm font-mono font-bold text-blue-400">
                                {getMetricText(loc)}
                            </div>
                            <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">
                                {viewMode === 'STORAGE' ? 'Capacity' : viewMode}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}
