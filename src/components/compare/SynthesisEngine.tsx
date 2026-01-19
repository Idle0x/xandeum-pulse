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
import { formatUptimePrecise } from './MicroComponents';
import { OverviewLegend, UnifiedLegend } from './ComparisonLegends';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- MESH COLOR PALETTE (30 Distinct Tech/Earth Tones) ---
const MESH_COLORS = [
    "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f43f5e", "#84cc16",
    "#6366f1", "#14b8a6", "#d946ef", "#eab308", "#f97316", "#a855f7", "#22c55e", "#0ea5e9",
    "#fca5a5", "#86efac", "#93c5fd", "#c4b5fd", "#fdba74", "#5eead4", "#fcd34d", "#fda4af",
    "#64748b", "#71717a", "#78716c", "#a1a1aa", "#94a3b8", "#e2e8f0"
];

// --- HELPER: Deterministic Color Picker ---
const getLinkColor = (startLat: number, startLon: number, endLat: number) => {
    const hash = Math.abs((startLat * 1000) + (startLon * 1000) + (endLat * 1000));
    return MESH_COLORS[Math.floor(hash) % MESH_COLORS.length];
};

// --- SUB-COMPONENTS ---
const InterpretationPanel = ({ contextText }: { contextText: string }) => (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-zinc-900/30 border-t border-white/5 flex items-start gap-3 md:gap-4 transition-all duration-300">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5 md:w-4 md:h-4 animate-pulse" />
        <div className="flex flex-col gap-1">
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl font-medium">{contextText}</p>
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

// --- NARRATIVE ENGINE (SPATIAL INTELLIGENCE UPDATED) ---
const generateLiveReport = (tab: string, metric: string, focusKey: string | null, focusSection: string | null, nodes: Node[], benchmarks: any, clusters: any[], meshLinks: any[]) => {
    const groupCount = nodes.length;
    if (groupCount === 0) return "Select nodes to generate analysis.";

    // --- TOPOLOGY INTELLIGENCE (NEW) ---
    if (tab === 'TOPOLOGY') {
        const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);

        if (!focusKey) {
            // Global Network Context
            const uniqueCountries = new Set(nodes.map(n => n.location?.countryName)).size;
            const density = meshLinks.length / Math.max(nodes.length, 1);
            const topologyType = density > 2.5 ? "Dense Mesh" : "Sparse Hub-and-Spoke";

            return `Network Topology: Your fleet forms a ${topologyType} spanning ${uniqueCountries} jurisdictions. The decentralized web structure ensures high data availability. A random failure in one region is mitigated by ${meshLinks.length} active redundant paths visible in the map.`;
        }

        // Specific Node Context
        const node = nodes.find(n => n.pubkey === focusKey);
        const cluster = clusters.find(c => c.id === focusKey); // If focusing a cluster marker

        // Handle Cluster Focus (Marker Click)
        if (cluster) {
             const isHub = cluster.nodes.length > 1;
             return `Regional Hub [${cluster.country}]: This location hosts ${cluster.nodes.length} nodes, acting as a critical aggregation point. High concentration here improves local sync speed but introduces jurisdiction risk if local regulations change.`;
        }

        // Handle Single Node Focus (Legend/List Click)
        if (node) {
            const connections = meshLinks.filter(l => l.source === node.pubkey || l.target === node.pubkey).length;
            const storageShare = ((node.storage_committed || 0) / totalStorage) * 100;
            const role = connections > 3 ? "Central Bridge" : "Edge Outpost";
            const impact = connections > 3 ? "critical for routing between clusters" : "extends the network perimeter";

            return `Node Intelligence [${getSafeIp(node)}]: Acts as a ${role} with ${connections} active P2P connections. Located in ${node.location?.countryName}, it contributes ${storageShare.toFixed(1)}% to the global storage pool. Its position is ${impact}, enhancing overall decentralization.`;
        }
    }

    // --- OVERVIEW CONTEXT ---
    if (tab === 'OVERVIEW') {
        if (!focusSection) return `Global Overview: You are comparing ${groupCount} nodes. The dashboard highlights relative strengths (Power) versus absolute reliability (Vitality). Click any chart to dive deeper.`;
        if (focusSection === 'health') {
            const avgHealth = Math.round(nodes.reduce((a, b) => a + (b.health || 0), 0) / groupCount);
            const netAvg = benchmarks.networkRaw?.health || 0;
            const diff = avgHealth - netAvg;
            return `Vitality Focus: This group averages a Health Score of ${avgHealth}/100. ${diff > 0 ? `They outperform the network average by +${diff} points.` : `They lag behind the network average by ${Math.abs(diff)} points.`} Vitality is a cooperative metric—consistency here is key to network stability.`;
        }
        if (focusSection === 'storage') {
            const total = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
            return `Capacity Focus: Combined, this cluster provides ${formatBytes(total)} of storage. In a decentralized network, high concentration in few nodes (Whales) can present a risk, while even distribution suggests a healthy mesh.`;
        }
        if (focusSection === 'credits') return `Economy Focus: Credits represent proven work. This view exposes the 'Earners' vs the 'Idlers'. High disparity here often points to configuration issues or uptime gaps in the lower-performing nodes.`;
        if (focusSection === 'uptime') return `Longevity Focus: Uptime is the historic footprint of a node. Newer nodes will naturally show smaller bars here, but look for gaps in older nodes which indicate instability.`;
    }

    // --- MARKET CONTEXT ---
    if (tab === 'MARKET') {
        const totalVal = nodes.reduce((a, b) => a + ((b as any)[metric === 'storage' ? 'storage_committed' : metric] || 0), 0);
        if (!focusKey) {
            if (metric === 'storage') return `Storage Market: This chart visualizes data centralization risks. A balanced pie means a resilient cluster. If one slice dominates (>50%), that node is a local single-point-of-failure.`;
            if (metric === 'credits') return `Credit Distribution: This is the reward pie. Ideally, rewards should correlate with storage provided. If a small node has a huge credit slice, it may be over-performing or older than the rest.`;
            if (metric === 'health') return `Health Distribution: Unlike competitive metrics, this should be uniform. A 'cracked' bar where one node is significantly lower indicates a specific failure that needs attention.`;
            return `Market Analysis: Click on any node color in the chart or legend to isolate its specific performance metrics against the group.`;
        }
        const node = nodes.find(n => n.pubkey === focusKey);
        if (!node) return "Node data unavailable.";
        const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
        const share = totalVal > 0 ? (val / totalVal) * 100 : 0;
        const safeName = getSafeIp(node);
        let verdict = "";
        if (share > 50) verdict = "This node is the dominant force in this group (a 'Whale').";
        else if (share < 10) verdict = "This node is a minor contributor in this specific comparison.";
        else verdict = "This node holds a balanced share of the group's resources.";
        return `Node Focus [${safeName}]: It controls ${share.toFixed(1)}% of the selected ${metric}. ${verdict} Comparing against the ${nodes.length - 1} other peers, its performance in this sector is ${share > (100/nodes.length) ? 'above' : 'below'} the group average.`;
    }

    return "Interactive Analysis Ready.";
};

// --- MAIN ENGINE ---
export const SynthesisEngine = ({ nodes, themes, networkScope, benchmarks }: { nodes: Node[], themes: any[], networkScope: string, benchmarks: any }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'TOPOLOGY'>('OVERVIEW');
  const [marketMetric, setMarketMetric] = useState<'storage' | 'credits' | 'health' | 'uptime'>('storage');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  // --- INTERACTION STATE ---
  const [focusedSection, setFocusedSection] = useState<string | null>(null); 
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null); 
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);

  // --- DATA PREPARATION ---
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

  // --- GENERATE MESH (Simulate P2P Web) ---
  const meshLinks = useMemo(() => {
      if (nodes.length < 2) return [];
      const links: any[] = [];
      // Connect every node to its 2 nearest neighbors to simulate a mesh
      nodes.forEach((sourceNode) => {
          if (!sourceNode.location) return;
          const distances = nodes
            .filter(n => n.pubkey !== sourceNode.pubkey && n.location)
            .map(targetNode => {
                const dx = (sourceNode.location!.lat - targetNode.location!.lat);
                const dy = (sourceNode.location!.lon - targetNode.location!.lon);
                return { 
                    id: targetNode.pubkey, 
                    dist: Math.sqrt(dx*dx + dy*dy), 
                    target: targetNode 
                };
            })
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2); // Connect to 2 nearest

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

  const handleTabChange = (t: any) => { setTab(t); setFocusedSection(null); setFocusedNodeKey(null); setHoveredNodeKey(null); };
  const handleZoomIn = () => setPos(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 10) }));
  const handleZoomOut = () => setPos(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = () => setPos({ coordinates: [0, 20], zoom: 1 });

  const handleFocus = (key: string | null, location?: {lat: number, lon: number}) => {
    if (location) setPos({ coordinates: [location.lon, location.lat], zoom: 4 });
    setFocusedNodeKey(focusedNodeKey === key ? null : key);
  };

  const metricDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(metricDropdownRef, () => setIsMetricDropdownOpen(false));

  const narrative = useMemo(() => {
      return generateLiveReport(tab, marketMetric, focusedNodeKey, focusedSection, nodes, benchmarks, clusters, meshLinks);
  }, [tab, marketMetric, focusedNodeKey, focusedSection, nodes, benchmarks, clusters, meshLinks]);

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);
  const maxUptime = Math.max(...nodes.map(n => n.uptime || 0), 1);
  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);
  const totalUptime = nodes.reduce((sum, n) => sum + (n.uptime || 0), 0);

  // --- STYLE HELPERS ---
  const isDense = nodes.length > 10;
  const overviewBarWidth = isDense ? 'flex-1 mx-[1px]' : 'w-2 md:w-3 mx-0.5'; 
  const marketBarWidth = isDense ? 'flex-1' : 'w-24 md:w-32';

  const getElementStyle = (nodeKey: string | null, sectionType?: string) => {
      if (focusedSection && sectionType && sectionType !== focusedSection) return 'opacity-30 grayscale-[0.5] transition-all duration-500';

      const isActive = hoveredNodeKey === nodeKey || focusedNodeKey === nodeKey;
      const isBackground = (hoveredNodeKey && hoveredNodeKey !== nodeKey) || (focusedNodeKey && focusedNodeKey !== nodeKey);

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
        const isFocusActive = hoveredNodeKey || focusedNodeKey;
        const isCurrentNode = hoveredNodeKey === n.pubkey || focusedNodeKey === n.pubkey;
        const color = isFocusActive ? (isCurrentNode ? theme.hex : '#3f3f46') : theme.hex;
        const stop = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    }).join(', ')})`;
  };

  return (
    <div className="shrink-0 min-h-[600px] border border-white/5 bg-[#09090b]/40 backdrop-blur-xl flex flex-col relative z-40 rounded-xl mt-6 shadow-2xl overflow-hidden" 
         onMouseLeave={() => setHoveredNodeKey(null)}
         onClick={() => { setFocusedSection(null); setFocusedNodeKey(null); }}>

        {/* TAB CONTROLS */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-full flex gap-2 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {[{ id: 'OVERVIEW', icon: BarChart3, label: 'Overview' }, { id: 'MARKET', icon: PieChart, label: 'Market Share' }, { id: 'TOPOLOGY', icon: MapIcon, label: 'Topology' }].map((t) => (
                    <button key={t.id} onClick={() => handleTabChange(t.id)} className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[9px] md:text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${tab === t.id ? 'bg-zinc-100 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10'}`}>
                        <t.icon size={10} className="md:w-3.5 md:h-3.5" /> {t.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Removed onClick={e => e.stopPropagation()} to allow click-outside reset */}
        <div className="flex-1 overflow-hidden relative flex flex-col pt-24">
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
                                        onMouseEnter={() => setHoveredNodeKey(n.pubkey || null)}
                                        onMouseLeave={() => setHoveredNodeKey(null)}
                                        className={`${overviewBarWidth} bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end min-w-[2px] transition-all duration-200 ${getElementStyle(n.pubkey || null)}`}
                                    >
                                        <div className="w-full rounded-t-sm transition-all duration-500 relative" style={{ height: `${(((n as any)[sec.key] || 0) / sec.max) * 100}%`, backgroundColor: themes[i % themes.length].hex }}></div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-50 pointer-events-none">{sec.unit((n as any)[sec.key] || 0)}</div>
                                    </div>
                                ))}
                            </ChartCell>
                        </div>
                    ))}
                </div>
                <OverviewLegend nodes={nodes} themes={themes} hoveredKey={hoveredNodeKey} onHover={setHoveredNodeKey} />
                <InterpretationPanel contextText={narrative} />
                </>
            )}

            {/* MARKET SHARE TAB */}
            {tab === 'MARKET' && (
                <>
                    <div className="relative flex flex-col flex-1">
                        <div className="absolute top-0 right-4 md:right-8 z-20" ref={metricDropdownRef}>
                            <button onClick={(e) => { e.stopPropagation(); setIsMetricDropdownOpen(!isMetricDropdownOpen); }} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded-lg text-[10px] md:text-xs font-bold uppercase transition">
                                <span className="opacity-50">Analyzing:</span> {marketMetric} <ChevronDown size={12} className="md:w-3.5 md:h-3.5" />
                            </button>
                            {isMetricDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col z-30">
                                    {['storage', 'credits', 'health', 'uptime'].map(m => (
                                        <button key={m} onClick={(e) => { e.stopPropagation(); setMarketMetric(m as any); setIsMetricDropdownOpen(false); }} className={`px-4 py-3 text-xs font-bold text-left uppercase hover:bg-zinc-800 transition ${marketMetric === m ? 'text-white bg-zinc-800' : 'text-zinc-400'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 flex items-center justify-center p-8">
                            {marketMetric !== 'health' ? (
                                <div className="flex flex-col items-center gap-6 animate-in zoom-in-50 duration-500">
                                    <div className="w-56 h-56 md:w-72 md:h-72 rounded-full relative flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all" style={{ background: getConicGradient(marketMetric) }}>
                                        <div className="w-44 h-44 md:w-56 md:h-56 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner border border-white/5 p-4 text-center">
                                            {marketMetric === 'storage' && <Database size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'credits' && <Zap size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'uptime' && <Clock size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            <span className="text-xs md:text-sm font-bold text-zinc-400 tracking-widest uppercase mb-1">{marketMetric} Share</span>
                                            <span className="text-[10px] md:text-xs text-zinc-600 font-mono text-center">{(hoveredNodeKey || focusedNodeKey) ? getSafeIp(nodes.find(n => n.pubkey === (hoveredNodeKey || focusedNodeKey))!) : 'Aggregated Fleet'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-3xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-500">
                                    {nodes.map((n, i) => (
                                        <div key={n.pubkey} onMouseEnter={() => setHoveredNodeKey(n.pubkey || null)} onMouseLeave={() => setHoveredNodeKey(null)} className={`flex items-center gap-4 transition-all duration-300 cursor-pointer ${getElementStyle(n.pubkey || null)} ${!isDense ? 'justify-center' : ''}`} onClick={(e) => { e.stopPropagation(); setFocusedNodeKey(n.pubkey || null); }}>
                                            <span className="text-xs font-mono font-bold text-zinc-400 w-32 text-right truncate">{getSafeIp(n)}</span>
                                            <div className={`${marketBarWidth} h-8 bg-zinc-900 rounded-full overflow-hidden relative border border-white/5`}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.health}%`, backgroundColor: themes[i % themes.length].hex }}></div></div>
                                            <span className="text-xs font-bold text-white font-mono w-16 text-left">{n.health} / 100</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="METRIC" specificMetric={marketMetric} hoveredKey={hoveredNodeKey} onHover={setHoveredNodeKey} onNodeClick={(n) => setFocusedNodeKey(n.pubkey || null)} />
                    <InterpretationPanel contextText={narrative} />
                </>
            )}

            {/* TOPOLOGY TAB (SPATIAL INTELLIGENCE) */}
            {tab === 'TOPOLOGY' && (
                <div className="flex flex-col h-full relative group/map">
                    {/* Controls relocated INSIDE map container (Bottom Right) */}
                    <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleZoomIn} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><Plus size={16} /></button>
                        <button onClick={handleReset} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><RotateCcw size={16} /></button>
                        <button onClick={handleZoomOut} className="p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white border border-white/10 rounded-lg shadow-lg hover:bg-zinc-800 transition"><Minus size={16} /></button>
                    </div>

                    <div className="flex-1 rounded-xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-6 relative shadow-inner">
                        <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
                            <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} maxZoom={10} onMoveEnd={(e: any) => setPos({ coordinates: e.coordinates as [number, number], zoom: e.zoom })}>
                                <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />))}</Geographies>

                                {/* MESH VISUALIZATION (Broken Lines) */}
                                {meshLinks.map((link: any) => {
                                    // Logic: If highlighting a node, only show its own links strongly. Dim others.
                                    const isRelevant = !hoveredNodeKey || hoveredNodeKey === link.source || hoveredNodeKey === link.target;
                                    const opacity = hoveredNodeKey ? (isRelevant ? 0.8 : 0.05) : 0.2;
                                    const width = hoveredNodeKey && isRelevant ? 2 / pos.zoom : 0.5 / pos.zoom;

                                    return (
                                        <Line
                                            key={link.key}
                                            from={link.start}
                                            to={link.end}
                                            stroke={link.color}
                                            strokeWidth={width}
                                            strokeDasharray="4 4" // Dotted "Footpath" style
                                            strokeOpacity={opacity}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                    );
                                })}

                                {clusters.map((cluster) => {
                                    const theme = themes[cluster.themeIndex % themes.length];
                                    const isHovered = hoveredNodeKey === cluster.id || (cluster.nodes.some((n: Node) => n.pubkey === hoveredNodeKey));
                                    const isFocused = focusedNodeKey === cluster.id || (cluster.nodes.some((n: Node) => n.pubkey === focusedNodeKey));

                                    return (
                                        <Marker key={cluster.id} coordinates={[cluster.lon, cluster.lat]} 
                                            onClick={(e: any) => { e.stopPropagation(); handleFocus(cluster.id, { lat: cluster.lat, lon: cluster.lon }); }}
                                            onMouseEnter={() => setHoveredNodeKey(cluster.nodes.length === 1 ? cluster.nodes[0].pubkey : cluster.id)}
                                            onMouseLeave={() => setHoveredNodeKey(null)}
                                        >
                                            <circle 
                                                r={(cluster.nodes.length > 1 ? 20 : 10) / pos.zoom} 
                                                fill={theme.hex} 
                                                fillOpacity={isHovered || isFocused ? 1 : 0.6} 
                                                stroke="#fff" 
                                                strokeWidth={(isHovered || isFocused ? 3 : 2)/pos.zoom} 
                                                className={`transition-all duration-300 ${isHovered || isFocused ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`} 
                                            />
                                        </Marker>
                                    );
                                })}
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="COUNTRY" hoveredKey={hoveredNodeKey} onHover={setHoveredNodeKey} onNodeClick={(n) => handleFocus(n.pubkey || null, n.location ? { lat: n.location.lat, lon: n.location.lon } : undefined)} />
                    <InterpretationPanel contextText={narrative} />
                </div>
            )}
        </div>
    </div>
  );
};
