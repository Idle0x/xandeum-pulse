import { useState, useRef, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Line } from 'react-simple-maps';
import { 
  BarChart3, PieChart, Map as MapIcon, Database, Zap, Activity, Clock, Info,
  ChevronDown, Plus, Minus, RotateCcw
} from 'lucide-react';
import { Node } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { OverviewLegend, UnifiedLegend } from './ComparisonLegends';
import { generateNarrative } from '../../lib/narrative-engine';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { formatUptimePrecise } from './MicroComponents';

// 👇 History Chart Component
import { MarketHistoryChart } from './MarketHistoryChart';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- MESH COLORS ---
const MESH_COLORS = [
    "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f43f5e", "#84cc16",
    "#6366f1", "#14b8a6", "#d946ef", "#eab308", "#f97316", "#a855f7", "#22c55e", "#0ea5e9",
    "#fca5a5", "#86efac", "#93c5fd", "#c4b5fd", "#fdba74", "#5eead4", "#fcd34d", "#fda4af",
    "#64748b", "#71717a", "#78716c", "#a1a1aa", "#94a3b8", "#e2e8f0"
];

const getLinkColor = (startLat: number, startLon: number, endLat: number) => {
    const hash = Math.abs((startLat * 1000) + (startLon * 1000) + (endLat * 1000));
    return MESH_COLORS[Math.floor(hash) % MESH_COLORS.length];
};

const InterpretationPanel = ({ contextText }: { contextText: string }) => (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-zinc-900/30 border-t border-white/5 flex items-start gap-3 md:gap-4 transition-all duration-300 print-exclude min-h-[80px]">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5 md:w-4 md:h-4 animate-pulse" />
        <div className="flex flex-col gap-1">
            <p key={contextText} className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl font-medium animate-in fade-in slide-in-from-bottom-1 duration-300">
                {contextText}
            </p>
        </div>
    </div>
);

const ChartCell = ({ title, icon: Icon, children, isFocused, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`rounded-xl p-4 md:p-6 flex flex-col items-center justify-end relative overflow-hidden transition-all duration-300 cursor-pointer 
        ${isFocused ? 'bg-zinc-900/80 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.01] z-10' : 'bg-black/20 border border-white/5 hover:border-white/10 hover:bg-black/40'}
        `}
    >
        <div className={`absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 transition-colors ${isFocused ? 'text-blue-400' : 'text-zinc-500'}`}>
            <Icon size={10} className="md:w-3.5 md:h-3.5" />
            <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-end justify-center gap-1 md:gap-3 h-32 md:h-48 w-full px-2 md:px-4 pt-8">
            {children}
        </div>
    </div>
);

interface SynthesisEngineProps {
  nodes: Node[];
  themes: any[];
  networkScope: string;
  benchmarks: any;
  hoveredNodeKey?: string | null;
  onHover?: (key: string | null) => void; // Existing: for hover state syncing
  isExport?: boolean;
  focusedNodeKey?: string | null; // From parent (Table selection)
  onHover?: (key: string | null) => void; // Update prop signature (already there, just clarifying)
  
  // NEW PROP: For broadcasting chart clicks back to parent to trigger scroll
  onNodeSelect?: (key: string | null) => void;
}

export const SynthesisEngine = ({ 
    nodes, 
    themes, 
    networkScope, 
    benchmarks, 
    hoveredNodeKey: externalHoverKey, 
    onHover: setExternalHover, 
    isExport = false, 
    focusedNodeKey: propFocusedKey,
    onNodeSelect // <--- NEW
}: SynthesisEngineProps) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'TOPOLOGY'>('OVERVIEW');
  const [marketMetric, setMarketMetric] = useState<'storage' | 'credits' | 'health' | 'uptime'>('storage');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  const [focusedSection, setFocusedSection] = useState<string | null>(null); 
  // We still keep local state for internal logic, but we sync interactions
  const [localFocusedNodeKey, setLocalFocusedNodeKey] = useState<string | null>(null); 
  const [internalHoverKey, setInternalHoverKey] = useState<string | null>(null);

  // Determine effective focused node (Parent prop takes precedence)
  const focusedNodeKey = propFocusedKey !== undefined ? propFocusedKey : localFocusedNodeKey;

  const focusedNode = useMemo(() => {
      return nodes.find(n => n.pubkey === focusedNodeKey);
  }, [nodes, focusedNodeKey]);

  // FETCH HISTORY FOR CONTEXT (Using '30D' for reliability)
  const { reliabilityScore, loading: historyLoading } = useNodeHistory(focusedNode || undefined, '30D');

  const activeHoverKey = externalHoverKey !== undefined ? externalHoverKey : internalHoverKey;

  const handleHover = (key: string | null) => {
      setInternalHoverKey(key);
      if (setExternalHover) setExternalHover(key);
  };

  // --- UPDATED: HANDLE SELECTION ---
  // This function updates local state AND tells the parent to scroll
  const handleSelection = (key: string | null, location?: {lat: number, lon: number}) => {
      // 1. Update Local State (for highlighting)
      setLocalFocusedNodeKey(prev => prev === key ? null : key);
      
      // 2. Topology Logic: Zoom to node if location provided
      if (location) {
          setPos({ coordinates: [location.lon, location.lat], zoom: 4 });
      }

      // 3. Notify Parent (Triggers Table Scroll)
      if (key && onNodeSelect) {
          onNodeSelect(key);
      }
  };

  const clusters = useMemo(() => {
      const map = new Map();
      nodes.forEach((node, index) => {
          if (!node.location) return;
          const lat = node.location.lat.toFixed(2);
          const lon = node.location.lon.toFixed(2);
          const key = `${lat},${lon}`;
          if (!map.has(key)) {
              map.set(key, { id: `cluster-${key}`, lat: node.location.lat, lon: node.location.lon, country: node.location.countryName || 'Unknown', nodes: [], themeIndex: index });
          }
          map.get(key).nodes.push(node);
      });
      return Array.from(map.values());
  }, [nodes]);

  const meshLinks = useMemo(() => {
      if (nodes.length < 2) return [];
      const links: any[] = [];
      nodes.forEach((sourceNode) => {
          if (!sourceNode.location) return;
          const distances = nodes
            .filter(n => n.pubkey !== sourceNode.pubkey && n.location)
            .map(targetNode => {
                const dx = (sourceNode.location!.lat - targetNode.location!.lat);
                const dy = (sourceNode.location!.lon - targetNode.location!.lon);
                return { id: targetNode.pubkey, dist: Math.sqrt(dx*dx + dy*dy), target: targetNode };
            })
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);

          distances.forEach(d => {
             const linkKey = [sourceNode.pubkey, d.id].sort().join('-');
             if (!links.find(l => l.key === linkKey)) {
                 links.push({
                     key: linkKey,
                     source: sourceNode.pubkey,
                     target: d.id,
                     start: [sourceNode.location!.lon, sourceNode.location!.lat],
                     end: [d.target.location!.lon, d.target.location!.lat],
                     color: getLinkColor(sourceNode.location!.lat, sourceNode.location!.lon, d.target.location!.lat)
                 });
             }
          });
      });
      return links;
  }, [nodes]);

  const handleTabChange = (t: any) => { setTab(t); setFocusedSection(null); setLocalFocusedNodeKey(null); handleHover(null); };
  const handleZoomIn = () => setPos(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 10) }));
  const handleZoomOut = () => setPos(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = () => setPos({ coordinates: [0, 20], zoom: 1 });

  const metricDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(metricDropdownRef, () => setIsMetricDropdownOpen(false));

  const narrative = useMemo(() => {
      return generateNarrative({
          tab,
          metric: tab === 'MARKET' ? marketMetric : undefined,
          focusKey: focusedNodeKey,
          hoverKey: activeHoverKey,
          nodes,
          benchmarks,
          chartSection: focusedSection
      });
  }, [tab, marketMetric, focusedNodeKey, focusedSection, activeHoverKey, nodes, benchmarks]);

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);
  const maxUptime = Math.max(...nodes.map(n => n.uptime || 0), 1);
  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);
  const totalUptime = nodes.reduce((sum, n) => sum + (n.uptime || 0), 0);

  const isDense = nodes.length > 10;
  const overviewBarWidth = isDense ? 'flex-1 mx-[1px]' : 'w-2 md:w-3 mx-0.5'; 
  
  const getElementStyle = (nodeKey: string | null, sectionType?: string) => {
      if (focusedSection && sectionType && sectionType !== focusedSection) return 'opacity-30 grayscale-[0.5] transition-all duration-500';

      const isActive = activeHoverKey === nodeKey || focusedNodeKey === nodeKey;
      const isBackground = (activeHoverKey && activeHoverKey !== nodeKey) || (focusedNodeKey && focusedNodeKey !== nodeKey);

      if (isActive) return 'opacity-100 scale-[1.05] z-50 brightness-110 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative transition-all duration-200 ease-out';
      if (isBackground) return 'opacity-40 grayscale-[0.5] scale-95 transition-all duration-300';
      return 'opacity-100 scale-100';
  };

  const getConicGradient = (type: string) => {
    let currentDeg = 0;
    let total = type === 'storage' ? totalStorage : type === 'credits' ? totalCredits : totalUptime;
    if (total === 0) return 'conic-gradient(#333 0deg 360deg)';
    return `conic-gradient(${nodes.map((n, i) => {
        let val = (n as any)[type === 'storage' ? 'storage_committed' : type] || 0;
        const deg = (val / total) * 360;
        const theme = themes[i % themes.length];
        const isFocusActive = activeHoverKey || focusedNodeKey;
        const isCurrentNode = activeHoverKey === n.pubkey || focusedNodeKey === n.pubkey;
        const color = isFocusActive ? (isCurrentNode ? theme.hex : '#3f3f46') : theme.hex;
        const stop = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    }).join(', ')})`;
  };

  return (
    <div className="shrink-0 min-h-[600px] border border-white/5 bg-[#09090b]/40 backdrop-blur-xl flex flex-col relative z-40 rounded-xl mt-6 shadow-2xl overflow-hidden" 
         onMouseLeave={() => handleHover(null)}
         onClick={() => { setFocusedSection(null); setLocalFocusedNodeKey(null); }}>

        {!isExport && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-full flex gap-2 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    {[{ id: 'OVERVIEW', icon: BarChart3, label: 'Overview' }, { id: 'MARKET', icon: PieChart, label: 'Market Share' }, { id: 'TOPOLOGY', icon: MapIcon, label: 'Topology' }].map((t) => (
                        <button key={t.id} onClick={() => handleTabChange(t.id)} className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[9px] md:text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${tab === t.id ? 'bg-zinc-100 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10'}`}>
                            <t.icon size={10} className="md:w-3.5 md:h-3.5" /> {t.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className={`flex-1 overflow-hidden relative flex flex-col ${isExport ? 'pt-6' : 'pt-24'}`} onClick={() => { setFocusedSection(null); setLocalFocusedNodeKey(null); }}>

            {/* OVERVIEW TAB */}
            {tab === 'OVERVIEW' && (
                <>
                <div className="grid grid-cols-2 grid-rows-2 gap-4 md:gap-6 p-4 md:p-6 h-full">
                    {[
                        { id: 'storage', title: 'Storage Capacity', icon: Database, max: maxStorage, key: 'storage_committed', unit: (v: number) => formatBytes(v) },
                        { id: 'credits', title: 'Credits Earned', icon: Zap, max: maxCredits, key: 'credits', unit: (v: number) => v.toLocaleString() },
                        { id: 'health', title: 'Health Score', icon: Activity, max: 100, key: 'health', unit: (v: number) => `${v}/100` },
                        { id: 'uptime', title: 'Uptime Duration', icon: Clock, max: maxUptime, key: 'uptime', unit: (v: number) => formatUptimePrecise(v) }
                    ].map((sec) => (
                        <div key={sec.id} className={getElementStyle(null, sec.id)}>
                            <ChartCell title={sec.title} icon={sec.icon} isFocused={focusedSection === sec.id} onClick={(e: any) => { e.stopPropagation(); setFocusedSection(sec.id); }}>
                                {nodes.map((n, i) => (
                                    <div 
                                        key={n.pubkey} 
                                        onMouseEnter={() => handleHover(n.pubkey || null)}
                                        onMouseLeave={() => handleHover(null)}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            // --- UPDATE: Use unified handler ---
                                            handleSelection(n.pubkey || null); 
                                        }}
                                        className={`${overviewBarWidth} bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end min-w-[2px] transition-all duration-200 cursor-pointer ${getElementStyle(n.pubkey || null)}`}
                                    >
                                        <div className="w-full rounded-t-sm transition-all duration-500 relative" style={{ height: `${(((n as any)[sec.key] || 0) / sec.max) * 100}%`, backgroundColor: themes[i % themes.length].hex }}></div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-50 pointer-events-none">
                                            {sec.unit((n as any)[sec.key] || 0)}
                                        </div>
                                    </div>
                                ))}
                            </ChartCell>
                        </div>
                    ))}
                </div>
                {/* --- UPDATE: Pass down click handler to legend --- */}
                <OverviewLegend nodes={nodes} themes={themes} hoveredKey={activeHoverKey} onHover={handleHover} onNodeClick={(n) => handleSelection(n.pubkey || null)} />

                {focusedNodeKey && !historyLoading && (
                   <div className="mt-2 mx-4 md:mx-6 p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className={`text-xl font-black ${reliabilityScore >= 98 ? 'text-green-500' : reliabilityScore >= 90 ? 'text-yellow-500' : 'text-red-500'}`}>
                         {reliabilityScore}%
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Historical Reliability (30d)</span>
                         <span className="text-[10px] text-zinc-500 leading-tight">
                            This node has been online and healthy for <strong>{reliabilityScore}%</strong> of recorded snapshots.
                            {reliabilityScore < 90 && " Caution recommended for long-term storage."}
                         </span>
                      </div>
                   </div>
                )}

                {!isExport && <InterpretationPanel contextText={narrative} />}
                </>
            )}

            {/* MARKET SHARE TAB */}
            {tab === 'MARKET' && (
                <>
                    <div className="relative flex flex-col flex-1 h-full">
                        {/* METRIC SELECTOR */}
                        <div className="absolute top-4 left-4 z-20" ref={metricDropdownRef}>
                             <button onClick={(e) => { e.stopPropagation(); setIsMetricDropdownOpen(!isMetricDropdownOpen); }} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded-lg text-[10px] md:text-xs font-bold uppercase transition shadow-xl">
                                <span className="opacity-50">Metric:</span> {marketMetric} <ChevronDown size={12} className="md:w-3.5 md:h-3.5" />
                            </button>
                            {isMetricDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col z-30">
                                    {['storage', 'credits', 'health', 'uptime'].map(m => (
                                        <button key={m} onClick={(e) => { e.stopPropagation(); setMarketMetric(m as any); setIsMetricDropdownOpen(false); }} className={`px-4 py-3 text-xs font-bold text-left uppercase hover:bg-zinc-800 transition ${marketMetric === m ? 'text-white bg-zinc-800' : 'text-zinc-400'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SPLIT VIEW LAYOUT */}
                        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-8 h-full">

                            {/* LEFT: VISUALIZATION */}
                            <div className="w-full lg:w-[40%] flex items-center justify-center relative">
                                {marketMetric !== 'health' ? (
                                    <div className="w-56 h-56 md:w-72 md:h-72 rounded-full relative flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all animate-in zoom-in-50 duration-500" style={{ background: getConicGradient(marketMetric) }}>
                                        <div className="w-44 h-44 md:w-56 md:h-56 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner border border-white/5 p-4 text-center">
                                            {marketMetric === 'storage' && <Database size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'credits' && <Zap size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'uptime' && <Clock size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            <span className="text-xs md:text-sm font-bold text-zinc-400 tracking-widest uppercase mb-1">{marketMetric} Share</span>
                                            <span className="text-[10px] md:text-xs text-zinc-600 font-mono text-center">
                                                {(activeHoverKey || focusedNodeKey) 
                                                    ? getSafeIp(nodes.find(n => n.pubkey === (activeHoverKey || focusedNodeKey))!) 
                                                    : 'Aggregated Fleet'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    /* --- NEW PRECISION TRACK HEALTH LAYOUT --- */
                                    <div className="w-full max-w-sm flex flex-col gap-2 animate-in slide-in-from-bottom-10 duration-500 overflow-y-auto max-h-[300px] custom-scrollbar pr-2 pt-2">
                                        {nodes.map((n, i) => (
                                            <div 
                                                key={n.pubkey} 
                                                onMouseEnter={() => handleHover(n.pubkey || null)} 
                                                onMouseLeave={() => handleHover(null)} 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    // --- UPDATE: Use unified handler ---
                                                    handleSelection(n.pubkey || null); 
                                                }}
                                                className={`flex flex-col gap-1.5 cursor-pointer p-1.5 rounded-lg hover:bg-zinc-800/30 transition-all duration-300 ${getElementStyle(n.pubkey || null)}`}
                                            >
                                                {/* ROW 1: DATA LABELS */}
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-mono font-medium text-zinc-400 tracking-tight">{getSafeIp(n)}</span>
                                                    <span className={`text-[10px] font-mono font-bold ${n.health >= 90 ? 'text-green-500' : n.health >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {n.health}%
                                                    </span>
                                                </div>
                                                
                                                {/* ROW 2: PRECISION TRACK BAR (Ultra-Thin 2px) */}
                                                <div className="w-full h-[2px] bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]" 
                                                        style={{ 
                                                            width: `${n.health}%`, 
                                                            backgroundColor: themes[i % themes.length].hex 
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: HISTORY CHART */}
                            <div className="w-full lg:w-[60%] h-[300px] lg:h-full min-h-[300px] animate-in slide-in-from-right-4 duration-500">
                                <MarketHistoryChart 
                                    nodes={nodes} 
                                    themes={themes} 
                                    metric={marketMetric} 
                                    hoveredNodeKey={activeHoverKey}
                                    onHover={handleHover}
                                />
                            </div>

                        </div>
                    </div>

                    {/* --- UPDATE: Unified Handler for Legend Clicks --- */}
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="METRIC" specificMetric={marketMetric} hoveredKey={activeHoverKey} onHover={handleHover} onNodeClick={(n) => handleSelection(n.pubkey || null)} />
                    {!isExport && <InterpretationPanel contextText={narrative} />}
                </>
            )}

            {/* TOPOLOGY TAB */}
            {tab === 'TOPOLOGY' && (
                <div className="flex flex-col h-full relative group/map">
                    {!isExport && (
                        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button onClick={handleZoomIn} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><Plus size={16} /></button>
                            <button onClick={handleReset} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><RotateCcw size={16} /></button>
                            <button onClick={handleZoomOut} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><Minus size={16} /></button>
                        </div>
                    )}

                    <div className="flex-1 rounded-xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-6 relative shadow-inner">
                        <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
                            <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} maxZoom={10} onMoveEnd={(e: any) => setPos({ coordinates: e.coordinates as [number, number], zoom: e.zoom })}>
                                <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />))}</Geographies>
                                {meshLinks.map((link: any) => {
                                    const isRelevant = !activeHoverKey || activeHoverKey === link.source || activeHoverKey === link.target;
                                    const opacity = activeHoverKey ? (isRelevant ? 0.8 : 0.05) : 0.2;
                                    const width = activeHoverKey && isRelevant ? 2 / pos.zoom : 0.5 / pos.zoom;
                                    return (
                                        <Line key={link.key} from={link.start} to={link.end} stroke={link.color} strokeWidth={width} strokeDasharray="4 4" strokeOpacity={opacity} style={{ transition: 'all 0.3s ease' }} />
                                    );
                                })}
                                {clusters.map((cluster) => {
                                    const theme = themes[cluster.themeIndex % themes.length];
                                    const isHovered = activeHoverKey === cluster.id || (cluster.nodes.some((n: Node) => n.pubkey === activeHoverKey));
                                    const isFocused = focusedNodeKey === cluster.id || (cluster.nodes.some((n: Node) => n.pubkey === focusedNodeKey));
                                    return (
                                        <Marker 
                                            key={cluster.id} 
                                            coordinates={[cluster.lon, cluster.lat]} 
                                            onClick={(e: any) => { 
                                                e.stopPropagation(); 
                                                // --- UPDATE: Unified Handler ---
                                                const nodeId = cluster.nodes.length === 1 ? cluster.nodes[0].pubkey : cluster.id;
                                                handleSelection(nodeId, { lat: cluster.lat, lon: cluster.lon }); 
                                            }} 
                                            onMouseEnter={() => handleHover(cluster.nodes.length === 1 ? cluster.nodes[0].pubkey : cluster.id)} 
                                            onMouseLeave={() => handleHover(null)}
                                        >
                                            <circle r={(cluster.nodes.length > 1 ? 20 : 10) / pos.zoom} fill={theme.hex} fillOpacity={isHovered || isFocused ? 1 : 0.6} stroke="#fff" strokeWidth={(isHovered || isFocused ? 3 : 2)/pos.zoom} className={`transition-all duration-300 ${isHovered || isFocused ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`} />
                                        </Marker>
                                    );
                                })}
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>
                    {/* --- UPDATE: Unified Handler --- */}
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="COUNTRY" hoveredKey={activeHoverKey} onHover={handleHover} onNodeClick={(n) => handleSelection(n.pubkey || null, n.location ? { lat: n.location.lat, lon: n.location.lon } : undefined)} />
                    {!isExport && <InterpretationPanel contextText={narrative} />}
                </div>
            )}
        </div>
    </div>
  );
};
