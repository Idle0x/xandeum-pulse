import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { ArrowLeft, Globe, Activity, Map as MapIcon, Wifi, Layers, Maximize2, Minus, Plus } from 'lucide-react';

// --- CONFIG ---
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LocationData {
  name: string;
  country: string;
  lat: number;
  lon: number;
  count: number;
}

interface MapStats {
  totalNodes: number;
  countries: number;
  topRegion: string;
}

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...' });
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });

  // Fetch Geo Data
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown' });
        }
      } catch (err) {
        console.error("Map data failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeo();
  }, []);

  // Scale bubble sizes: Huge hubs shouldn't look 100x bigger, just distinct.
  // We use Square Root scale for visual accuracy of "Area".
  const popScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([4, 15]); // Min 4px, Max 15px radius
  }, [locations]);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col relative selection:bg-blue-500/30">
      <Head>
        <title>Xandeum Network Map</title>
      </Head>

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
            <Link href="/" className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold tracking-widest uppercase">Back to Operations</span>
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
                GLOBAL TOPOLOGY
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono uppercase tracking-wider">
                    <Activity size={10} className="animate-pulse" />
                    Live Feed
                </div>
                <span className="text-zinc-600 text-xs font-mono">|</span>
                <span className="text-zinc-500 text-xs font-mono">
                    Updated {new Date().toLocaleTimeString()}
                </span>
            </div>
        </div>
      </div>

      {/* --- MAIN MAP AREA --- */}
      <div className="flex-grow w-full h-full relative">
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <Globe size={48} className="text-zinc-800 animate-pulse" />
               <span className="text-zinc-500 font-mono text-xs tracking-widest">TRIANGULATING NODES...</span>
             </div>
           </div>
        ) : (
          <ComposableMap 
            projectionConfig={{ scale: 200 }} 
            className="w-full h-full"
            style={{ width: "100%", height: "100%", background: "#050505" }}
          >
            <ZoomableGroup 
              zoom={position.zoom} 
              center={position.coordinates as [number, number]} 
              onMoveEnd={handleMoveEnd}
              maxZoom={4}
            >
              {/* LANDMASS */}
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#18181b" // zinc-900
                      stroke="#27272a" // zinc-800
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

              {/* NODE MARKERS */}
              {locations.map((loc) => (
                <Marker key={loc.name} coordinates={[loc.lon, loc.lat]}>
                  <g 
                    className="group cursor-pointer"
                    onMouseEnter={() => setTooltip(`${loc.name}, ${loc.country} • ${loc.count} Nodes`)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Pulsing Outer Ring (Animation) */}
                    <circle 
                      r={popScale(loc.count) * 1.5} 
                      fill="rgba(59, 130, 246, 0.2)" 
                      className="animate-ping opacity-75"
                      style={{ animationDuration: '3s' }}
                    />
                    {/* Glow Ring */}
                    <circle 
                      r={popScale(loc.count) * 1.2} 
                      fill="rgba(59, 130, 246, 0.3)" 
                    />
                    {/* Solid Core */}
                    <circle 
                      r={popScale(loc.count)} 
                      fill="#60a5fa" // blue-400
                      stroke="#fff"
                      strokeWidth={1}
                      className="transition-all duration-300 group-hover:fill-white"
                    />
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        )}
        
        {/* CUSTOM TOOLTIP (Follows no specific position, just fixed top-center when active for clean look) */}
        {tooltip && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 md:top-auto md:bottom-32 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-black/80 backdrop-blur-md border border-zinc-700 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-white tracking-wide">{tooltip}</span>
                </div>
            </div>
        )}
      </div>

      {/* --- ZOOM CONTROLS --- */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        <button onClick={handleZoomIn} className="p-3 bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl backdrop-blur transition">
            <Plus size={20} />
        </button>
        <button onClick={handleZoomOut} className="p-3 bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl backdrop-blur transition">
            <Minus size={20} />
        </button>
      </div>

      {/* --- BOTTOM HUD (STATS TRAY) --- */}
      <div className="absolute bottom-8 left-6 right-6 z-40 flex justify-center pointer-events-none">
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 pointer-events-auto shadow-2xl overflow-hidden">
            <div className="flex divide-x divide-white/5">
                
                {/* Stat 1 */}
                <div className="px-6 py-3 flex flex-col items-center min-w-[120px]">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        <MapIcon size={10} /> Active Nodes
                    </span>
                    <span className="text-2xl font-bold text-white font-mono">{stats.totalNodes}</span>
                </div>

                {/* Stat 2 */}
                <div className="px-6 py-3 flex flex-col items-center min-w-[120px]">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        <Globe size={10} /> Global Reach
                    </span>
                    <span className="text-2xl font-bold text-white font-mono">
                        {stats.countries} <span className="text-xs text-zinc-600 font-sans">Countries</span>
                    </span>
                </div>

                {/* Stat 3 */}
                <div className="px-6 py-3 flex flex-col items-center min-w-[140px] hidden md:flex">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        <Wifi size={10} /> High Density
                    </span>
                    <span className="text-xl font-bold text-blue-400 font-mono truncate max-w-[150px]">
                        {stats.topRegion}
                    </span>
                </div>

            </div>
        </div>
      </div>

      {/* --- DECORATIVE GRID --- */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>
    </div>
  );
}
