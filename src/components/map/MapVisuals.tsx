import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { Plus, Minus, RotateCcw, Globe } from 'lucide-react';
import { LocationData, ViewMode } from '../../types/map';
import { GEO_URL, TIER_COLORS } from '../../utils/mapConstants';

interface MapVisualsProps {
  loading: boolean;
  locations: LocationData[];
  activeLocation: string | null;
  viewMode: ViewMode;
  position: { coordinates: number[]; zoom: number };
  setPosition: (pos: any) => void;
  lockTarget: (name: string, lat: number, lon: number) => void;
  resetView: () => void;
  getTierIndex: (loc: LocationData) => number;
}

export const MapVisuals: React.FC<MapVisualsProps> = ({ 
  loading, locations, activeLocation, viewMode, position, setPosition, lockTarget, resetView, getTierIndex 
}) => {

  const handleZoomIn = () => { if (position.zoom < 5) setPosition((pos: any) => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition((pos: any) => ({ ...pos, zoom: pos.zoom / 1.5 })); };
  const handleMoveEnd = (pos: any) => setPosition(pos);

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([5, 12]);
  }, [locations]);

  // Filter logic: if active, show others faded or just active? 
  // (Original code Logic: If active, render active + others. Others rendered normally but we handle opacity in render)
  const locationsForMap = useMemo(() => {
    if (!activeLocation) return locations;
    const others = locations.filter(l => l.name !== activeLocation);
    const active = locations.find(l => l.name === activeLocation);
    return active ? [...others, active] : others;
  }, [locations, activeLocation]);

  if (loading) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <Globe className="animate-pulse text-blue-500" />
        </div>
    );
  }

  return (
    <>
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
            const tier = getTierIndex(loc);
            const isMissingData = viewMode === 'CREDITS' && loc.totalCredits === null;
            const tierColor = isMissingData ? '#52525b' : TIER_COLORS[tier];
            const opacity = activeLocation && !isActive ? 0.3 : 1;
            const pingColor = isMissingData ? '#52525b' : (isActive ? '#22c55e' : tierColor);

            return (
              <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                <g className="group cursor-pointer transition-all duration-500" style={{ opacity }}>
                  <circle r={size * 2.5} fill={pingColor} className="animate-ping opacity-20" style={{ animationDuration: isActive ? '1s' : '3s' }} />
                  {isActive ? (
                    <polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,5 -7,9 -5,1 -11,-4 -3,-4" transform={`scale(${size/6})`} fill="#52525b" stroke="#22c55e" strokeWidth={1.5} className="drop-shadow-[0_0_15px_rgba(34,197,94,1)]" />
                  ) : (
                    <>
                      {viewMode === 'STORAGE' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" strokeWidth={1} />}
                      {viewMode === 'CREDITS' && <circle r={size} fill={tierColor} stroke="#fff" strokeWidth={1} />}
                      {viewMode === 'HEALTH' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" strokeWidth={1} className="rotate-45" />}
                    </>
                  )}
                  {isActive && (
                    <g transform={`translate(0, ${-size - 18})`}>
                      <rect x="-60" y="-20" width="120" height="24" rx="4" fill="black" fillOpacity="0.8" stroke="#22c55e" strokeWidth="1" className="drop-shadow-lg" />
                      <text y="-4" textAnchor="middle" className="font-mono text-[10px] fill-white font-bold uppercase tracking-widest pointer-events-none dominant-baseline-central">{loc.name}</text>
                      <path d="M -5 4 L 0 9 L 5 4" fill="black" stroke="#22c55e" strokeWidth="1" strokeDasharray="0,14,3" />
                    </g>
                  )}
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
        <button onClick={handleZoomIn} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={16} /></button>
        <button onClick={handleZoomOut} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={16} /></button>
        {(position.zoom > 1.2 || activeLocation) && <button onClick={resetView} className="p-2 md:p-3 bg-red-900/80 border border-red-500/50 text-red-200 rounded-xl hover:text-white"><RotateCcw size={16} /></button>}
      </div>
    </>
  );
};
