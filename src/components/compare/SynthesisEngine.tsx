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
        ${isFocused ? 'bg-zinc-900/80 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02] z-10' : 'bg-black/20 border border-white/5 hover:border-white/10 hover:bg-black/40'}
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

// --- NARRATIVE ENGINE LOGIC (RESTORED) ---
const generateLiveReport = (tab: string, metric: string, focusKey: string | null, focusSection: string | null, nodes: Node[], benchmarks: any, clusters: any[]) => {
    const groupCount = nodes.length;
    if (groupCount === 0) return "Select nodes to generate analysis.";
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
    if (tab === 'TOPOLOGY') {
        if (!focusKey) {
            const countryCounts: Record<string, number> = {};
            nodes.forEach(n => { const c = n.location?.countryName || 'Unknown'; countryCounts[c] = (countryCounts[c] || 0) + 1; });
            const uniqueCountries = Object.keys(countryCounts).length;
            const maxConcentration = Math.max(...Object.values(countryCounts));
            const concentrationPct = (maxConcentration / nodes.length) * 100;
            if (uniqueCountries === 1 && nodes.length > 1) return `⚠️ High Geographic Risk: 100% of this group shares a single jurisdiction (${Object.keys(countryCounts)[0]}). A regional outage would knock out this entire fleet.`;
            if (concentrationPct > 50) return `⚠️ Moderate Centralization: ${concentrationPct.toFixed(0)}% of your nodes are concentrated in one country. Consider diversifying to improve flood/power resilience.`;
            return `✅ Resilient Topology: Your fleet spans ${uniqueCountries} distinct regions. This geo-redundancy creates a robust mesh resistant to local outages.`;
        }
        const cluster = clusters.find(c => c.id === focusKey);
        if (cluster) {
            const isHub = cluster.nodes.length > 1;
            const totalStorage = cluster.nodes.reduce((acc: number, n: Node) => acc + (n.storage_committed || 0), 0);
            return `Region Focus: ${cluster.country}. ${isHub ? `This is a dense HUB hosting ${cluster.nodes.length} nodes.` : "This is a standalone outpost."} Collectively, this location contributes ${formatBytes(totalStorage)} of storage capacity. ${isHub ? "Multiple nodes here maximize hardware efficiency but share physical risks." : "Single nodes here expand the network's physical edge."}`;
        }
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
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null); // NEW: Shared hover state

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
      return generateLiveReport(tab, marketMetric, focusedNodeKey, focusedSection, nodes, benchmarks, clusters);
  }, [tab, marketMetric, focusedNodeKey, focusedSection, nodes, benchmarks, clusters]);

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);
  const maxUptime = Math.max(...nodes.map(n => n.uptime || 0), 1);
  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);
  const totalUptime = nodes.reduce((sum, n) => sum + (n.uptime || 0), 0);

  // --- STYLE HELPERS ---
  const isDense = nodes.length > 5;
  const overviewBarWidth = isDense ? 'flex-1 mx-[1px] md:mx-1' : 'w-6 md:w-8';
  const marketBarWidth = isDense ? 'flex-1' : 'w-48 md:w-64';

  const getElementStyle = (nodeKey: string | null, sectionType?: string) => {
      if (focusedSection && sectionType && sectionType !== focusedSection) return 'opacity-20 blur-[1px] grayscale transition-all duration-500';
      if (hoveredNodeKey) {
          return hoveredNodeKey === nodeKey ? 'opacity-100 scale-y-[1.05] brightness-125 z-30' : 'opacity-15 grayscale blur-[0.5px]';
      }
      if (focusedNodeKey) {
          return focusedNodeKey === nodeKey ? 'opacity-100 scale-[1.02]' : 'opacity-30 blur-[1px] grayscale-[0.5]';
      }
      return 'opacity-100';
  };

  const getConicGradient = (type: string) => {
    let currentDeg = 0;
    let total = type === 'storage' ? totalStorage : type === 'credits' ? totalCredits : totalUptime;
    if (total === 0) return 'conic-gradient(#333 0deg 360deg)';
    return `conic-gradient(${nodes.map((n, i) => {
        let val = (n as any)[type === 'storage' ? 'storage_committed' : type] || 0;
        const deg = (val / total) * 360;
        const theme = themes[i % themes.length];
        const color = hoveredNodeKey ? (hoveredNodeKey === n.pubkey ? theme.hex : '#111') : theme.hex;
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

        <div className="flex-1 overflow-hidden relative flex flex-col pt-24" onClick={(e) => e.stopPropagation()}>
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
                            <ChartCell title={sec.title} icon={sec.icon} isFocused={focusedSection === sec.id} onClick={(e: any) => { e.stopPropagation(); setFocusedSection(focusedSection === sec.id ? null : sec.id); }}>
                                {nodes.map((n, i) => (
                                    <div 
                                        key={n.pubkey} 
                                        onMouseEnter={() => setHoveredNodeKey(n.pubkey || null)}
                                        onMouseLeave={() => setHoveredNodeKey(null)}
                                        className={`${overviewBarWidth} bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end min-w-[2px] transition-all duration-200 ${getElementStyle(n.pubkey || null)}`}
                                    >
                                        <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${(((n as any)[sec.key] || 0) / sec.max) * 100}%`, backgroundColor: themes[i % themes.length].hex }}></div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{sec.unit((n as any)[sec.key] || 0)}</div>
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

            {tab === 'MARKET' && (
                <>
                    <div className="relative flex flex-col flex-1">
                        <div className="absolute top-0 right-4 md:right-8 z-20" ref={metricDropdownRef}>
                            <button onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded-lg text-[10px] md:text-xs font-bold uppercase transition">
                                <span className="opacity-50">Analyzing:</span> {marketMetric} <ChevronDown size={12} className="md:w-3.5 md:h-3.5" />
                            </button>
                            {isMetricDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col z-30">
                                    {['storage', 'credits', 'health', 'uptime'].map(m => (
                                        <button key={m} onClick={() => { setMarketMetric(m as any); setIsMetricDropdownOpen(false); }} className={`px-4 py-3 text-xs font-bold text-left uppercase hover:bg-zinc-800 transition ${marketMetric === m ? 'text-white bg-zinc-800' : 'text-zinc-400'}`}>
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
                                            <span className="text-[10px] md:text-xs text-zinc-600 font-mono text-center">
                                                {hoveredNodeKey ? getSafeIp(nodes.find(n => n.pubkey === hoveredNodeKey)!) : 'Aggregated Fleet'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-3xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-500">
                                    {nodes.map((n, i) => (
                                        <div 
                                            key={n.pubkey} 
                                            onMouseEnter={() => setHoveredNodeKey(n.pubkey || null)}
                                            onMouseLeave={() => setHoveredNodeKey(null)}
                                            className={`flex items-center gap-4 transition-all duration-300 cursor-pointer ${getElementStyle(n.pubkey || null)} ${!isDense ? 'justify-center' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); setFocusedNodeKey(focusedNodeKey === n.pubkey ? null : (n.pubkey || null)); }}
                                        >
                                            <span className="text-xs font-mono font-bold text-zinc-400 w-32 text-right truncate">{getSafeIp(n)}</span>
                                            <div className={`${marketBarWidth} h-8 bg-zinc-900 rounded-full overflow-hidden relative border border-white/5`}>
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.health}%`, backgroundColor: themes[i % themes.length].hex }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-white font-mono w-16 text-left">{n.health} / 100</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="METRIC" specificMetric={marketMetric} hoveredKey={hoveredNodeKey} onHover={setHoveredNodeKey} onNodeClick={(n) => setFocusedNodeKey(focusedNodeKey === n.pubkey ? null : (n.pubkey || null))} />
                    <InterpretationPanel contextText={narrative} />
                </>
            )}

            {tab === 'TOPOLOGY' && (
                <div className="flex flex-col h-full relative">
                    <div className="absolute bottom-28 right-8 z-50 flex flex-col gap-2">
                        <button onClick={handleZoomIn} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg"><Plus size={16} /></button>
                        <button onClick={handleReset} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg"><RotateCcw size={16} /></button>
                        <button onClick={handleZoomOut} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg"><Minus size={16} /></button>
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-6 relative group shadow-inner">
                        <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
                            <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} maxZoom={10} onMoveEnd={(e: any) => setPos({ coordinates: e.coordinates as [number, number], zoom: e.zoom })}>
                                <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} />))}</Geographies>
                                {clusters.map((cluster) => {
                                    const theme = themes[cluster.themeIndex % themes.length];
                                    const isHovered = hoveredNodeKey === cluster.id;
                                    return (
                                        <Marker key={cluster.id} coordinates={[cluster.lon, cluster.lat]} onClick={(e: any) => { e.stopPropagation(); handleFocus(cluster.id, { lat: cluster.lat, lon: cluster.lon }); }}>
                                            <circle r={(cluster.nodes.length > 1 ? 20 : 10) / pos.zoom} fill={theme.hex} fillOpacity={isHovered ? 1 : 0.6} stroke="#fff" strokeWidth={2/pos.zoom} className="transition-all duration-200" />
                                        </Marker>
                                    );
                                })}
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="COUNTRY" hoveredKey={hoveredNodeKey} onHover={setHoveredNodeKey} onNodeClick={(n) => handleFocus(n.pubkey || null, n.location ? { lat: n.location.lat, lon: n.location.lon } : undefined)} />
                </div>
            )}
        </div>
    </div>
  );
};
