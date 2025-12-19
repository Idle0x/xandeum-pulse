import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Activity, Database, Zap, Layers, Cpu, Server } from 'lucide-react';

// --- CONFIG ---
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Types matching our new API Aggregation
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
  topRegionMetric: number;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  const [tooltip, setTooltip] = useState<string | null>(null);
  
  // Initialize slightly zoomed out to see the whole "terrain"
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });

  // Fetch Rich Data
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
    // Refresh data every 10s to keep the "Live" feel
    const interval = setInterval(fetchGeo, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- HYBRID MARKER LOGIC ---
  
  // 1. Calculate Sizes based on Count (Density)
  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([4, 12]);
  }, [locations]);

  // 2. Determine "Hub Status" based on active Toggle
  const isHub = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return loc.totalStorage > 1000; // Hub if > 1TB (1000GB)
        case 'HEALTH': return loc.avgHealth >= 98;      // Hub if > 98% Health
        case 'CREDITS': return loc.totalCredits > 5000; // Hub if "Whale"
        default: return false;
    }
  };

  // 3. Get Color based on Density (Heatmap Logic)
  const getDensityColor = (count: number) => {
    if (count === 1) return "#22d3ee"; // Cyan-400 (Outpost)
    if (count < 5) return "#60a5fa";   // Blue-400 (Active)
    if (count < 10) return "#a78bfa";  // Purple-400 (Cluster)
    return "#fbbf24";                  // Amber-400 (Core)
  };

  // 4. Get Tooltip Text based on Toggle
  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return `${(loc.totalStorage / 1024).toFixed(1)} TB Storage`;
        case 'HEALTH': return `${loc.avgHealth}% Uptime`;
        case 'CREDITS': return `${loc.totalCredits.toLocaleString()} Credits`;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col relative selection:bg-blue-500/30">
      <Head>
        <title>Xandeum Command Center</title>
      </Head>

      {/* --- BACKGROUND: RADAR GRID (Digital Terrain) --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
         {/* Radial Gradient for Depth */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#050505_100%)] opacity-80"></div>
         {/* Grid Pattern */}
         <div className="absolute inset-0 opacity-20" 
              style={{ 
                  backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
              }}>
         </div>
         {/* Scanline Effect (Optional, subtle) */}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-10 animate-scan"></div>
      </div>

      {/* --- HEADER (Top Left) --- */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="group flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-700 hover:border-blue-500/50 backdrop-blur-md transition-all">
            <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Dashboard</span>
        </Link>
      </div>

      {/* --- MAIN MAP --- */}
      <div className="flex-grow w-full h-full relative z-10">
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <Globe size={48} className="text-blue-500 animate-pulse" />
               <span className="text-blue-400 font-mono text-xs tracking-[0.3em] animate-pulse">ESTABLISHING LINK...</span>
             </div>
           </div>
        ) : (
          <ComposableMap 
            projectionConfig={{ scale: 180 }} 
            className="w-full h-full"
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <ZoomableGroup 
              zoom={position.zoom} 
              center={position.coordinates as [number, number]} 
              maxZoom={5}
            >
              {/* DARK WORLD MAP */}
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#18181b" 
                      stroke="#27272a" 
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#27272a", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* HYBRID MARKERS */}
              {locations.map((loc) => {
                const isDiamond = isHub(loc);
                const color = getDensityColor(loc.count);
                const size = sizeScale(loc.count);

                return (
                    <Marker key={loc.name} coordinates={[loc.lon, loc.lat]}>
                    <g 
                        className="group cursor-pointer"
                        onMouseEnter={() => setTooltip(`${loc.name} • ${loc.count} Nodes • ${getMetricText(loc)}`)}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {/* 1. SONAR RIPPLE (Outer Ring) */}
                        <circle 
                        r={size * 2.5} 
                        fill={color}
                        className="animate-ping opacity-20"
                        style={{ animationDuration: '3s' }}
                        />

                        {/* 2. THE MARKER (Shape Switch) */}
                        {isDiamond ? (
                            // DIAMOND SHAPE for "Hubs"
                            <rect
                                x={-size}
                                y={-size}
                                width={size * 2}
                                height={size * 2}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={1.5}
                                className="rotate-45 transition-all duration-300 group-hover:scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            />
                        ) : (
                            // DOT SHAPE for "Standard"
                            <circle 
                                r={size} 
                                fill={color} 
                                stroke="#fff"
                                strokeWidth={1}
                                className="transition-all duration-300 group-hover:scale-125 group-hover:fill-white"
                            />
                        )}
                    </g>
                    </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {/* --- HUD: THE FUTURISTIC BOX (Bottom Right) --- */}
      <div className="absolute bottom-8 right-6 z-40 flex flex-col items-end gap-4 pointer-events-none">
        
        {/* Dynamic Tooltip (Top of HUD) */}
        {tooltip && (
            <div className="bg-black/80 backdrop-blur-xl border border-zinc-700 px-4 py-2 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <span className="text-sm font-bold text-white font-mono tracking-wide">{tooltip}</span>
            </div>
        )}

        {/* The Main Glass Panel */}
        <div className="pointer-events-auto bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl w-[320px]">
            
            {/* Header / Live Status */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Live Feed</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{new Date().toLocaleTimeString()}</span>
            </div>

            {/* View Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 rounded-xl mb-4">
                {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`py-2 text-[10px] font-bold tracking-wider rounded-lg transition-all ${
                            viewMode === mode 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Dynamic Legend */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-400 rotate-45 border border-white"></div>
                        <span className="text-xs text-zinc-300">
                            {viewMode === 'STORAGE' && '> 1 TB Storage'}
                            {viewMode === 'HEALTH' && '> 98% Uptime'}
                            {viewMode === 'CREDITS' && 'High Earner'}
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Hub</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full border border-white"></div>
                        <span className="text-xs text-zinc-300">Standard Node</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Node</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Total Nodes</div>
                    <div className="text-lg font-mono font-bold text-white">{stats.totalNodes}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Top Region</div>
                    <div className="text-lg font-mono font-bold text-blue-400 truncate px-1">{stats.topRegion.split(',')[0]}</div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
