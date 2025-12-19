import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, Server } from 'lucide-react';

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
  
  // Initialize with a slightly larger zoom to fill the frame
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.3 });

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

  // --- ZOOM CONTROLS ---
  const handleZoomIn = () => {
    if (position.zoom >= 5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

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
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col relative selection:bg-blue-500/30">
      <Head>
        <title>Xandeum Command Center</title>
      </Head>

      {/* --- HEADER (Top Left) --- */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="group flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 backdrop-blur-md transition-all">
            <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Dashboard</span>
        </Link>
      </div>

      {/* --- MAIN CONTENT AREA (Bordered Map Frame) --- */}
      {/* Moved up by using 'mt-16 mb-32' to create space at top and bottom */}
      <div className="flex-grow relative z-10 mx-4 mt-20 mb-36 border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
        
        {/* --- BACKGROUND: SUBTLE RADAR GRID --- */}
        <div className="absolute inset-0 pointer-events-none z-0">
            {/* Soft Radial Glow centered on the map */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a2230_0%,_#050505_70%)] opacity-60"></div>
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-10" 
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)', 
                    backgroundSize: '30px 30px' 
                }}>
            </div>
        </div>

        {/* --- MAP CONTAINER --- */}
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center z-20">
             <div className="flex flex-col items-center gap-4">
               <Globe size={48} className="text-blue-500 animate-pulse" />
               <span className="text-blue-400 font-mono text-xs tracking-[0.3em] animate-pulse">ESTABLISHING LINK...</span>
             </div>
           </div>
        ) : (
          <ComposableMap 
            // Increased scale slightly for a larger default view
            projectionConfig={{ scale: 190 }} 
            className="w-full h-full"
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <ZoomableGroup 
              zoom={position.zoom} 
              center={position.coordinates as [number, number]} 
              onMoveEnd={handleMoveEnd}
              maxZoom={5}
            >
              {/* DARK WORLD MAP - Brighter, Clearer Landmass */}
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      // Brighter fill for clarity against dark background
                      fill="#262626" 
                      stroke="#3f3f46" 
                      strokeWidth={0.7}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#3f3f46", outline: "none" },
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
                        className="animate-ping opacity-30"
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
                                className="rotate-45 transition-all duration-300 group-hover:scale-125 shadow-[0_0_15px_rgba(255,255,255,0.6)]"
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

        {/* --- ZOOM CONTROLS (Inside the Frame) --- */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500/50 rounded-lg backdrop-blur transition">
                <Plus size={18} />
            </button>
            <button onClick={handleZoomOut} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500/50 rounded-lg backdrop-blur transition">
                <Minus size={18} />
            </button>
        </div>
      </div>


      {/* --- HUD: THE FUTURISTIC BOX (Bottom Right, Raised) --- */}
      {/* Raised 'bottom-24' to clear phone navigation bars */}
      <div className="absolute bottom-24 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Dynamic Tooltip (Top of HUD) */}
        {tooltip && (
            <div className="bg-black/90 backdrop-blur-xl border border-blue-500/30 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-1">
                <span className="text-sm font-bold text-white font-mono tracking-wide">{tooltip}</span>
            </div>
        )}

        {/* The Main Glass Panel */}
        <div className="pointer-events-auto bg-zinc-900/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-[320px]">
            
            {/* Header / Live Status */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Live Link</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{new Date().toLocaleTimeString()}</span>
            </div>

            {/* View Toggles Section */}
            <div className="mb-5">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 ml-1">Network View</div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl">
                    {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
                        let Icon = Database;
                        if (mode === 'HEALTH') Icon = Activity;
                        if (mode === 'CREDITS') Icon = Zap;

                        return (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all border ${
                                viewMode === mode 
                                ? 'bg-zinc-800 border-blue-500/50 text-white shadow-sm' 
                                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14} className={`mb-1 ${viewMode === mode ? 'text-blue-400' : ''}`}/>
                            <span className="text-[9px] font-bold tracking-wider">{mode}</span>
                        </button>
                        )
                    })}
                </div>
            </div>

            {/* Legend Section */}
            <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 ml-1">Legend</div>
                <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
                    {/* Hub Marker Legend */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-amber-400 rotate-45 border border-white shadow-sm"></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-200">Network Hub</span>
                                <span className="text-[9px] text-zinc-500">
                                    {viewMode === 'STORAGE' && '> 1 TB Storage'}
                                    {viewMode === 'HEALTH' && '> 98% Uptime'}
                                    {viewMode === 'CREDITS' && 'High Earner'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Standard Node Legend */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full border border-white shadow-sm"></div>
                            <span className="text-xs text-zinc-300">Standard Node</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="grid grid-cols-2 divide-x divide-white/10 mt-4 pt-3 border-t border-white/10">
                <div className="text-center px-2">
                    <div className="text-lg font-mono font-bold text-white leading-none">{stats.totalNodes}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Active Nodes</div>
                </div>
                <div className="text-center px-2">
                    <div className="text-lg font-mono font-bold text-blue-400 leading-none truncate">{stats.countries}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Countries</div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
