import { useState, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Line } from 'react-simple-maps';
import { 
  Plus, Minus, RotateCcw, Database, Zap, Activity, Map as MapIcon, 
  ChevronDown, BarChart3, PieChart, Clock, Info
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
    <div className="px-4 py-3 md:px-6 md:py-4 bg-zinc-900/30 border-t border-white/5 flex items-start gap-3 md:gap-4">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5 md:w-4 md:h-4" />
        <div className="flex flex-col gap-1">
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl">{contextText}</p>
        </div>
    </div>
);

const ChartCell = ({ title, icon: Icon, children }: any) => (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 md:p-6 flex flex-col items-center justify-end relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 text-zinc-500">
            <Icon size={10} className="md:w-3.5 md:h-3.5" />
            <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        {/* pt-8 protects bar from hitting title */}
        <div className="flex items-end justify-center gap-3 md:gap-6 h-32 md:h-48 w-full px-2 md:px-4 pt-8">
            {children}
        </div>
    </div>
);

// --- MAIN ENGINE ---
export const SynthesisEngine = ({ nodes, themes, networkScope }: { nodes: Node[], themes: any[], networkScope: string }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'TOPOLOGY'>('OVERVIEW');
  const [marketMetric, setMarketMetric] = useState<'storage' | 'credits' | 'health' | 'uptime'>('storage');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  const handleZoomIn = () => setPos(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 10) }));
  const handleZoomOut = () => setPos(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = () => setPos({ coordinates: [0, 20], zoom: 1 });

  const handleNodeFocus = (node: Node) => {
    if (node.location) {
        setPos({ coordinates: [node.location.lon, node.location.lat], zoom: 4 });
    }
  };

  const metricDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(metricDropdownRef, () => setIsMetricDropdownOpen(false));

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);
  const maxUptime = Math.max(...nodes.map(n => n.uptime || 0), 1);

  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);
  const totalUptime = nodes.reduce((sum, n) => sum + (n.uptime || 0), 0);

  const getConicGradient = (type: 'storage' | 'credits' | 'uptime') => {
    let currentDeg = 0;
    let total = 0;
    if (type === 'storage') total = totalStorage;
    else if (type === 'credits') total = totalCredits;
    else if (type === 'uptime') total = totalUptime;

    if (total === 0) return 'conic-gradient(#333 0deg 360deg)';
    return `conic-gradient(${nodes.map((n, i) => {
        let val = 0;
        if (type === 'storage') val = n.storage_committed || 0;
        else if (type === 'credits') val = n.credits || 0;
        else if (type === 'uptime') val = n.uptime || 0;

        const deg = (val / total) * 360;
        // SAFETY FIX: Modulo
        const theme = themes[i % themes.length];
        const stop = `${theme.hex} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    }).join(', ')})`;
  };

  const getEvaluation = (tabName: string, metric?: string) => {
    if (tabName === 'OVERVIEW') return "This grid separates performance into Relative Power vs Absolute Vitality. Normalized against the strongest node in your selection.";
    if (tabName === 'MARKET') {
        if (metric === 'storage') return `Sector analysis of data holding power. Skewed charts indicate 'Whale' presence.`;
        if (metric === 'credits') return `Credit dominance highlights primary earners. Disparity reflects uptime or reliability gaps.`;
        if (metric === 'health') return `Cooperative metric. Any node < 80 represents a liability.`;
        if (metric === 'uptime') return `Time-Online distribution. Elders dominate this chart.`;
    }
    return "";
  };

  return (
    <div className="shrink-0 min-h-[600px] border border-white/5 bg-[#09090b]/40 backdrop-blur-xl flex flex-col relative z-40 rounded-xl mt-6 shadow-2xl overflow-hidden">
        {/* Tab Switcher */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-full flex gap-2 border border-white/10 shadow-2xl">
                {[ { id: 'OVERVIEW', icon: BarChart3, label: 'Overview' }, { id: 'MARKET', icon: PieChart, label: 'Market Share' }, { id: 'TOPOLOGY', icon: MapIcon, label: 'Topology' } ].map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[9px] md:text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${tab === t.id ? 'bg-zinc-100 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10'}`}>
                        <t.icon size={10} className="md:w-3.5 md:h-3.5" /> {t.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col pt-24">
            {tab === 'OVERVIEW' && (
                <>
                <div className="grid grid-cols-2 grid-rows-2 gap-4 md:gap-6 p-4 md:p-6 h-full">
                    <ChartCell title="Storage Capacity" icon={Database}>
                        {nodes.map((n, i) => {
                             const theme = themes[i % themes.length];
                             return (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.storage_committed || 0) / maxStorage) * 100}%`, backgroundColor: theme.hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{formatBytes(n.storage_committed || 0)}</div>
                             </div>
                        )})}
                    </ChartCell>
                    <ChartCell title="Credits Earned" icon={Zap}>
                        {nodes.map((n, i) => {
                             const theme = themes[i % themes.length];
                             return (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.credits || 0) / maxCredits) * 100}%`, backgroundColor: theme.hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{n.credits?.toLocaleString()}</div>
                             </div>
                        )})}
                    </ChartCell>
                    <ChartCell title="Health Score" icon={Activity}>
                        {nodes.map((n, i) => {
                             const theme = themes[i % themes.length];
                             return (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${Math.min(n.health || 0, 100)}%`, backgroundColor: theme.hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{n.health}/100</div>
                             </div>
                        )})}
                    </ChartCell>
                     <ChartCell title="Uptime Duration" icon={Clock}>
                        {nodes.map((n, i) => {
                             const theme = themes[i % themes.length];
                             return (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.uptime || 0) / maxUptime) * 100}%`, backgroundColor: theme.hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{formatUptimePrecise(n.uptime || 0)}</div>
                             </div>
                        )})}
                    </ChartCell>
                </div>
                <OverviewLegend nodes={nodes} themes={themes} />
                <InterpretationPanel contextText={getEvaluation('OVERVIEW')} />
                </>
            )}

            {tab === 'MARKET' && (
                <>
                    <div className="relative flex flex-col flex-1">
                        {/* METRIC SELECTOR */}
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
                                    <div className="w-56 h-56 md:w-72 md:h-72 rounded-full relative flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all" style={{ background: getConicGradient(marketMetric as any) }}>
                                        <div className="w-44 h-44 md:w-56 md:h-56 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner border border-white/5 p-4 text-center">
                                            {marketMetric === 'storage' && <Database size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'credits' && <Zap size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}
                                            {marketMetric === 'uptime' && <Clock size={24} className="md:w-8 md:h-8 text-zinc-600 mb-2" />}

                                            <span className="text-xs md:text-sm font-bold text-zinc-400 tracking-widest uppercase mb-1">{marketMetric} Share</span>
                                            <span className="text-[10px] md:text-xs text-zinc-600 font-mono">
                                                {marketMetric === 'storage' && formatBytes(totalStorage)}
                                                {marketMetric === 'credits' && `${(totalCredits / 1000000).toFixed(1)}M`}
                                                {marketMetric === 'uptime' && formatUptimePrecise(totalUptime)}
                                                <br/>Combined
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-3xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-500">
                                    {nodes.map((n, i) => {
                                        const theme = themes[i % themes.length];
                                        return (
                                        <div key={n.pubkey} className="flex items-center gap-4">
                                            <span className="text-xs font-mono font-bold text-zinc-400 w-32 text-right truncate">{getSafeIp(n)}</span>
                                            <div className="flex-1 h-8 bg-zinc-900 rounded-full overflow-hidden relative border border-white/5">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.health}%`, backgroundColor: theme.hex }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-white font-mono w-16 text-left">{n.health} / 100</span>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="METRIC" specificMetric={marketMetric} />
                    <InterpretationPanel contextText={getEvaluation('MARKET', marketMetric)} />
                </>
            )}

            {tab === 'TOPOLOGY' && (
                <div className="flex flex-col h-full relative">
                    {/* MAP CONTROLS */}
                    <div className="absolute bottom-28 right-8 z-50 flex flex-col gap-2">
                        <button onClick={handleZoomIn} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition shadow-lg"><Plus size={16} /></button>
                        <button onClick={handleReset} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition shadow-lg"><RotateCcw size={16} /></button>
                        <button onClick={handleZoomOut} className="p-2 bg-black/80 backdrop-blur text-zinc-300 hover:text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition shadow-lg"><Minus size={16} /></button>
                    </div>

                    <div className="flex-1 rounded-xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-6 relative group shadow-inner">
                        <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
                            <ZoomableGroup 
                                zoom={pos.zoom} 
                                center={pos.coordinates as [number, number]} 
                                maxZoom={10} 
                                onMoveEnd={(e: any) => setPos({ coordinates: e.coordinates as [number, number], zoom: e.zoom })}
                            >
                                <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} />))}</Geographies>
                                
                                <Line 
                                    coordinates={nodes.filter(n => n.location).map(n => [n.location!.lon, n.location!.lat])}
                                    stroke="#52525b"
                                    strokeWidth={1}
                                    strokeOpacity={0.5}
                                />

                                {nodes.map((n, i) => {
                                    const theme = themes[i % themes.length];
                                    return (
                                    n.location && (
                                        <Marker key={n.pubkey} coordinates={[n.location.lon, n.location.lat]}>
                                            <circle r={24/pos.zoom} fill={theme.hex} fillOpacity={0.4} className="animate-pulse" />
                                            <circle r={12/pos.zoom} fill="#fff" stroke={theme.hex} strokeWidth={4/pos.zoom} />
                                        </Marker>
                                    )
                                )})}
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="COUNTRY" onNodeClick={handleNodeFocus} />
                </div>
            )}
        </div>
    </div>
  );
};
