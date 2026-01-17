import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { 
  ArrowLeft, Search, Plus, Minus, RotateCcw, X, Trash2, 
  Download, Settings2, CheckCircle, 
  Database, Shield, Zap, 
  Activity, Share2, Map as MapIcon, ChevronDown, Crown, 
  BarChart3, PieChart, Grid, Star, Clock, Info, AlertTriangle
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { getSafeIp } from '../utils/nodeHelpers';
import { formatBytes } from '../utils/formatters';
import { Node } from '../types';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- THEME ENGINE ---
const PLAYER_THEMES = [
  { name: 'cyan', hex: '#22d3ee', headerBg: 'bg-cyan-900/40', bodyBg: 'bg-cyan-900/5', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { name: 'violet', hex: '#a78bfa', headerBg: 'bg-violet-900/40', bodyBg: 'bg-violet-900/5', text: 'text-violet-400', border: 'border-violet-500/20' },
  { name: 'emerald', hex: '#34d399', headerBg: 'bg-emerald-900/40', bodyBg: 'bg-emerald-900/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { name: 'amber', hex: '#fbbf24', headerBg: 'bg-amber-900/40', bodyBg: 'bg-amber-900/5', text: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'rose', hex: '#fb7185', headerBg: 'bg-rose-900/40', bodyBg: 'bg-rose-900/5', text: 'text-rose-400', border: 'border-rose-500/20' }
];

// --- HOOKS ---

function useOutsideClick(ref: any, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

// --- MICRO COMPONENTS ---

const formatUptimePrecise = (seconds: number) => {
  if (!seconds) return '0m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const MicroBar = ({ val, max, color }: { val: number, max: number, color: string }) => (
  <div className="w-10 md:w-16 h-0.5 md:h-1 bg-zinc-800 rounded-full overflow-hidden ml-auto">
    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((val/max)*100, 100)}%`, backgroundColor: color }}></div>
  </div>
);

const SectionHeader = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="h-5 md:h-8 bg-black/90 backdrop-blur-md border-y border-white/5 flex items-center px-2 md:px-3 gap-1 md:gap-2 sticky left-0 z-10 w-full mt-1">
    <Icon size={8} className="text-zinc-500 md:w-3 md:h-3" />
    <span className="text-[6px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">{label}</span>
  </div>
);

const UnifiedLegend = ({ nodes, themes, metricMode = 'COUNTRY', specificMetric }: { nodes: Node[], themes: any[], metricMode: 'COUNTRY' | 'METRIC', specificMetric?: 'storage' | 'credits' | 'health' | 'uptime' }) => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 p-4 md:p-6 mt-auto border-t border-white/5 bg-black/40 min-h-[80px]">
         {nodes.map((node, i) => {
             let metricDisplay = null;
             if (metricMode === 'COUNTRY') {
                 // Map Tab: Keep exactly as was
                 metricDisplay = (
                    <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                        {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2.5 h-2 md:w-4 md:h-3 rounded-[1px]" />}
                        <span className="text-[8px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-wide truncate">{node.location?.countryName || 'Unknown Region'}</span>
                    </div>
                 );
             } else if (metricMode === 'METRIC' && specificMetric) {
                 let val = '';
                 if (specificMetric === 'storage') val = formatBytes(node.storage_committed || 0);
                 if (specificMetric === 'credits') val = (node.credits || 0).toLocaleString();
                 if (specificMetric === 'health') val = `${node.health || 0}/100`;
                 if (specificMetric === 'uptime') val = formatUptimePrecise(node.uptime || 0);
                 
                 metricDisplay = (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] md:text-xs text-white font-mono font-bold">{val}</span>
                        <span className="text-[6px] md:text-[10px] text-zinc-500 uppercase tracking-wide">Actual</span>
                    </div>
                 );
             }
 
             return (
                 <div key={node.pubkey} className="flex gap-2 md:gap-3 items-start p-2 md:p-3 rounded md:rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition">
                     <div className="w-2 h-2 md:w-3 md:h-3 rounded-full mt-1 shrink-0 shadow-lg" style={{ backgroundColor: themes[i].hex }}></div>
                     <div className="flex flex-col gap-0.5 md:gap-1 overflow-hidden w-full">
                         {/* Swapped Hierarchy: PubKey dominant, IP + Flag subtitle */}
                         <div className="text-[8px] md:text-xs font-mono font-bold text-zinc-300 truncate w-full tracking-wide" title={node.pubkey}>
                            {metricMode === 'COUNTRY' ? node.pubkey : node.pubkey?.slice(0, 16) + '...'}
                         </div>
                         {metricMode !== 'COUNTRY' && (
                             <div className="flex items-center gap-1.5 opacity-60">
                                {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2.5 h-2 rounded-[1px]" />}
                                <div className="text-[7px] md:text-[9px] font-mono text-zinc-400 truncate">{getSafeIp(node)}</div>
                             </div>
                         )}
                         {metricMode === 'COUNTRY' && (
                             <div className="text-[9px] md:text-sm font-mono font-bold text-zinc-200 truncate">{getSafeIp(node)}</div>
                         )}
                         {metricDisplay}
                     </div>
                 </div>
             )
         })}
      </div>
    )
 }

// --- MAIN COMPONENTS ---

const ControlRail = ({ showNetwork, leaderMetric, benchmarks }: any) => {
  const Benchmark = ({ label, val, subVal, netLabel }: { label: string, val: string, subVal?: string, netLabel?: string }) => (
    <div className="flex flex-col justify-center h-[36px] md:h-[72px] border-b border-white/5 px-2 md:px-4">
      <div className="flex justify-between md:items-center">
        <span className="text-[6px] md:text-xs text-zinc-500 font-bold uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1 md:gap-2">
            {showNetwork && netLabel && (
                <span className="text-[5px] md:text-[9px] font-bold text-pink-500/70 uppercase tracking-wider">{netLabel}</span>
            )}
            <span className={`text-[6px] md:text-xs font-mono ${showNetwork ? 'text-pink-500/70' : 'text-zinc-300'}`}>{showNetwork ? val : '-'}</span>
        </div>
      </div>
      {leaderMetric && subVal && (
          <div className="flex justify-between md:justify-start items-center gap-1.5 mt-0.5 md:mt-1 text-yellow-600/80">
              <span className="text-[6px] md:text-[8px] uppercase font-bold border border-yellow-900/40 px-0.5 md:px-1 rounded bg-yellow-900/10">TOP</span>
              <span className="text-[6px] md:text-[9px] font-mono">{subVal}</span>
          </div>
      )}
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b] border-r border-white/10 w-[100px] md:w-[200px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)] rounded-tl-xl rounded-bl-xl">
      <div className="h-24 md:h-32 border-b border-white/5 p-2 md:p-4 flex flex-col justify-end bg-black rounded-tl-xl">
        <div className="text-[6px] md:text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 md:gap-2"><Settings2 size={8} className="md:w-3 md:h-3" /> METRICS</div>
      </div>
      
      <div className="bg-transparent">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <Benchmark label="Version" val={benchmarks.network.version} subVal={benchmarks.leader.version} netLabel="LATEST" />
        <Benchmark label="Network" val="-" />
        
        <SectionHeader label="VITALITY" icon={Activity} />
        <Benchmark label="Health Score" val={benchmarks.network.health} subVal={benchmarks.leader.health} netLabel="AVG" />
        <Benchmark label="Uptime" val={benchmarks.network.uptime} subVal={benchmarks.leader.uptime} netLabel="AVG" />

        <SectionHeader label="HARDWARE" icon={Database} />
        <Benchmark label="Capacity" val={benchmarks.network.storage} subVal={benchmarks.leader.storage} netLabel="MED" />
        <Benchmark label="Used Space" val="-" />

        <SectionHeader label="ECONOMY" icon={Zap} />
        <Benchmark label="Credits" val={benchmarks.network.credits} subVal={benchmarks.leader.credits} netLabel="MED" />
        <Benchmark label="Global Rank" val="-" />
        
        <div className="h-[28px] md:h-[32px] border-t border-white/5 bg-black/50 rounded-bl-xl"></div>
      </div>
    </div>
  );
};

const NodeColumn = ({ node, onRemove, anchorNode, theme, winners, overallWinner, benchmarks, leaderMetric, showNetwork }: any) => {
  // Removed border-b from rows
  const Row = ({ children }: { children: React.ReactNode }) => (<div className={`h-[36px] md:h-[72px] flex flex-col justify-center px-3 md:px-4 min-w-[100px] md:min-w-[140px] relative`}>{children}</div>);
  const SectionSpacer = () => <div className="h-5 md:h-8 bg-transparent border-y border-transparent mt-1"></div>;

  return (
    <div className={`flex flex-col min-w-[100px] md:min-w-[140px] ${theme.bodyBg} relative border-r border-white/5 last:rounded-tr-xl last:rounded-br-xl`}>
      {/* Header - Reorganized Hierarchy */}
      <div className={`h-24 md:h-32 ${theme.headerBg} p-2 md:p-4 flex flex-col items-center justify-between relative overflow-hidden group first:rounded-tr-xl`}>
        {overallWinner && <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 animate-in zoom-in duration-500"><Crown size={10} className="md:w-3.5 md:h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-sm" /></div>}
        
        {/* Country Flag Centered & Bigger */}
        <div className="mt-1 md:mt-2">
             {node.location?.countryCode ? (
                 <img src={`https://flagcdn.com/w80/${node.location.countryCode.toLowerCase()}.png`} className="w-6 h-4 md:w-10 md:h-7 rounded-[2px] shadow-md object-cover" />
             ) : (
                 <div className="w-6 h-4 md:w-10 md:h-7 bg-white/5 rounded-[2px] border border-white/10"></div>
             )}
        </div>

        <div className="flex flex-col items-center gap-1 w-full text-center">
            {/* IP Address - Muted Subtitle */}
            <div className={`text-[7px] md:text-[10px] font-mono text-white/50`}>{getSafeIp(node)}</div>
            {/* Public Key - Dominant */}
            <div className="text-[8px] md:text-xs font-bold font-mono text-white bg-black/20 px-1 py-0.5 md:px-2 md:py-1 rounded border border-white/10 w-full truncate">
                {node.pubkey?.slice(0, 8)}<span className="hidden md:inline">{node.pubkey?.slice(8, 12)}...</span>
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <SectionSpacer />
        <Row><span className={`text-[9px] md:text-sm font-mono font-medium ${node.version === '0.0.0' ? 'text-zinc-600' : 'text-zinc-300'}`}>{node.version}</span></Row>
        <Row><span className={`text-[6px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded border w-fit font-bold ${node.network === 'MAINNET' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-blue-400 border-blue-500/20 bg-blue-500/5'}`}>{node.network}</span></Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{node.health}</span>
                    {winners.health && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
            <div className="absolute bottom-1 right-2 md:bottom-3 md:right-4 opacity-50"><MicroBar val={node.health} max={100} color={node.health >= 90 ? '#22c55e' : '#eab308'} /></div>
        </Row>
        <Row><span className="text-[9px] md:text-base font-mono text-zinc-300">{formatUptimePrecise(node.uptime)}</span></Row>

        <SectionSpacer />
        <Row>
             <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{formatBytes(node.storage_committed)}</span>
                    {winners.storage && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
        </Row>
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] md:text-base font-mono text-zinc-300">{formatBytes(node.storage_used)}</span>
                    <span className="text-[6px] md:text-[10px] text-zinc-500 font-mono mt-0 md:mt-0.5">{node.storage_committed > 0 ? ((node.storage_used / node.storage_committed) * 100).toFixed(0) : 0}% Utilized</span>
                </div>
            </div>
            <div className="absolute bottom-1 right-2 md:bottom-3 md:right-4 opacity-50"><MicroBar val={node.storage_used} max={node.storage_committed} color="#60a5fa" /></div>
        </Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] md:text-base font-bold font-mono text-zinc-200">{node.credits?.toLocaleString()}</span>
                    {winners.credits && <CheckCircle size={8} className="md:w-3.5 md:h-3.5 text-green-500" />}
                </div>
            </div>
        </Row>
        <Row><span className="text-[9px] md:text-base font-mono text-zinc-500">#{node.rank || '-'}</span></Row>

        {/* TRASHCAN ROW */}
        <div className="h-[28px] md:h-[32px] border-t border-white/5 flex items-center justify-center bg-black/20 hover:bg-red-500/10 transition-colors cursor-pointer group/trash" onClick={onRemove}>
            <Trash2 size={10} className="md:w-3 md:h-3 text-zinc-700 group-hover/trash:text-red-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

const OverviewLegend = ({ nodes, themes }: { nodes: Node[], themes: any[] }) => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-4 border-t border-white/5 bg-black/40 min-h-[60px]">
          {nodes.map((node, i) => (
              <div key={node.pubkey} className="flex items-center gap-1.5 md:gap-2">
                   <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] border border-white/10" style={{ backgroundColor: themes[i].hex }}></div>
                   {/* PubKey Dominant, IP + Flag Subtitle */}
                   <div className="flex flex-col">
                        <span className="text-[9px] md:text-xs font-mono font-bold text-zinc-300">{node.pubkey?.slice(0, 12)}...</span>
                        <div className="flex items-center gap-1 opacity-50">
                             {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2 h-1.5 rounded-[1px]" />}
                             <span className="text-[7px] md:text-[9px] font-mono text-zinc-400">{getSafeIp(node)}</span>
                        </div>
                   </div>
              </div>
          ))}
      </div>
    )
  }

const InterpretationPanel = ({ contextText }: { contextText: string }) => (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-zinc-900/30 border-t border-white/5 flex items-start gap-3 md:gap-4">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5 md:w-4 md:h-4" />
        <div className="flex flex-col gap-1">
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl">{contextText}</p>
        </div>
    </div>
);

const SynthesisEngine = ({ nodes, themes, networkScope }: { nodes: Node[], themes: typeof PLAYER_THEMES, networkScope: string }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'TOPOLOGY'>('OVERVIEW');
  const [marketMetric, setMarketMetric] = useState<'storage' | 'credits' | 'health' | 'uptime'>('storage');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  // Map Controls
  const handleZoomIn = () => setPos(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 10) }));
  const handleZoomOut = () => setPos(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = () => setPos({ coordinates: [0, 20], zoom: 1 });

  // Click Outside Hook for Metric Dropdown
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
        const stop = `${themes[i].hex} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    }).join(', ')})`;
  };

  const getEvaluation = (tabName: string, metric?: string) => {
    if (tabName === 'OVERVIEW') {
        return "This grid separates performance into Relative Power (Storage, Credits, Uptime) versus Absolute Vitality (Health). While health is measured against a perfect 100 score, the other metrics are normalized against the strongest node in your selection, visually identifying the local leaders in each category.";
    }
    if (tabName === 'MARKET') {
        if (metric === 'storage') return `This sector analysis reveals the data holding power of your selection. A highly skewed chart indicates a "Whale" presence, where one node creates a centralization risk for stored data. A balanced chart suggests a healthy distribution of responsibility.`;
        if (metric === 'credits') return `Credit dominance highlights the primary earners in this group. Disparity here often reflects a significant gap in uptime or hardware reliability, as the protocol rewards consistency over raw capacity.`;
        if (metric === 'health') return `Unlike competitive metrics, Health is cooperative. Any node dropping below 80/100 represents a liability to the network's resilience. Consistent low scores across the board would indicate a systemic network issue rather than individual failure.`;
        if (metric === 'uptime') return `The Time-Online distribution. Elders of the network will dominate this chart. If a new node has a tiny slice, it doesn't mean it's failing—it simply lacks the historical provenance of the longer-running nodes.`;
    }
    return "";
  };

  const ChartCell = ({ title, icon: Icon, children }: any) => (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 md:p-6 flex flex-col items-center justify-end relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 text-zinc-500">
            <Icon size={10} className="md:w-3.5 md:h-3.5" />
            <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-end justify-center gap-3 md:gap-6 h-32 md:h-48 w-full px-2 md:px-4">
            {children}
        </div>
    </div>
  );

  return (
    <div className="shrink-0 min-h-[600px] border border-white/5 bg-[#09090b]/40 backdrop-blur-xl flex flex-col relative z-40 rounded-xl mt-6 shadow-2xl overflow-hidden">
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
                        {nodes.map((n, i) => (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.storage_committed || 0) / maxStorage) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{formatBytes(n.storage_committed || 0)}</div>
                             </div>
                        ))}
                    </ChartCell>
                    <ChartCell title="Credits Earned" icon={Zap}>
                        {nodes.map((n, i) => (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.credits || 0) / maxCredits) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{n.credits?.toLocaleString()}</div>
                             </div>
                        ))}
                    </ChartCell>
                    <ChartCell title="Health Score" icon={Activity}>
                        {nodes.map((n, i) => (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${Math.min(n.health || 0, 100)}%`, backgroundColor: themes[i].hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{n.health}/100</div>
                             </div>
                        ))}
                    </ChartCell>
                     <ChartCell title="Uptime Duration" icon={Clock}>
                        {nodes.map((n, i) => (
                             <div key={n.pubkey} className="w-6 md:w-12 bg-zinc-800/30 rounded-t-sm relative group/bar h-full flex flex-col justify-end">
                                 <div className="w-full rounded-t-sm transition-all duration-1000 relative" style={{ height: `${((n.uptime || 0) / maxUptime) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold font-mono text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 z-10">{formatUptimePrecise(n.uptime || 0)}</div>
                             </div>
                        ))}
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
                                    {nodes.map((n, i) => (
                                        <div key={n.pubkey} className="flex items-center gap-4">
                                            <span className="text-xs font-mono font-bold text-zinc-400 w-32 text-right truncate">{getSafeIp(n)}</span>
                                            <div className="flex-1 h-8 bg-zinc-900 rounded-full overflow-hidden relative border border-white/5">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.health}%`, backgroundColor: themes[i].hex }}></div>
                                                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[10px] font-bold text-black mix-blend-screen">{n.health} / 100</span>
                                            </div>
                                        </div>
                                    ))}
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
    {nodes.map((n, i) => (n.location && (
        <Marker key={n.pubkey} coordinates={[n.location.lon, n.location.lat]}>
            <circle r={8/pos.zoom} fill={themes[i].hex} fillOpacity={0.4} className="animate-pulse" />
            <circle r={4/pos.zoom} fill="#fff" stroke={themes[i].hex} strokeWidth={2/pos.zoom} />
        </Marker>
    )))}
</ZoomableGroup>
                        </ComposableMap>
                    </div>
                    <UnifiedLegend nodes={nodes} themes={themes} metricMode="COUNTRY" />
                </div>
            )}
        </div>
    </div>
  );
};

const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[100px] md:min-w-[140px] h-full bg-white/[0.01] group cursor-pointer hover:bg-white/[0.03] transition relative last:rounded-tr-xl last:rounded-br-xl" onClick={onClick}>
    <div className="h-24 md:h-32 p-2 flex flex-col items-center justify-center border-b border-white/5 bg-black/40 first:rounded-tr-xl">
      <Plus size={12} className="md:w-4 md:h-4 text-zinc-700 group-hover:text-zinc-400 transition" />
    </div>
    <div className="flex-1"></div>
  </div>
);

// --- MAIN PAGE ---

export default function ComparePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { nodes, loading } = useNetworkData(); 

  const [networkScope, setNetworkScope] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showNetwork, setShowNetwork] = useState(true);
  const [leaderMetric, setLeaderMetric] = useState<'STORAGE' | 'CREDITS' | 'HEALTH' | null>(null);
  
  const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Click Outside Refs
  const leaderRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  
  useOutsideClick(leaderRef, () => setIsLeaderDropdownOpen(false));
  useOutsideClick(watchlistRef, () => setIsWatchlistOpen(false));
  useOutsideClick(networkRef, () => setIsNetworkOpen(false));

  const availableNodes = useMemo(() => {
      if (networkScope === 'ALL') return nodes;
      return nodes.filter(n => n.network === networkScope);
  }, [nodes, networkScope]);

  const selectedNodes = useMemo(() => {
      return selectedKeys.map(key => availableNodes.find(n => n.pubkey === key)).filter((n): n is Node => !!n);
  }, [selectedKeys, availableNodes]);

  const benchmarks = useMemo(() => {
      if (availableNodes.length === 0) return { network: {}, leader: {}, networkRaw: {}, leaderRaw: {} };

      let leaderNode: Node | null = null;
      if (leaderMetric === 'STORAGE') leaderNode = availableNodes.reduce((p, c) => (p.storage_committed || 0) > (c.storage_committed || 0) ? p : c, availableNodes[0]);
      else if (leaderMetric === 'CREDITS') leaderNode = availableNodes.reduce((p, c) => (p.credits || 0) > (c.credits || 0) ? p : c, availableNodes[0]);
      else if (leaderMetric === 'HEALTH') leaderNode = availableNodes.reduce((p, c) => (p.health || 0) > (c.health || 0) ? p : c, availableNodes[0]);

      const healths = availableNodes.map(n => n.health || 0);
      const storages = availableNodes.map(n => n.storage_committed || 0);
      const credits = availableNodes.map(n => n.credits || 0);
      const uptimes = availableNodes.map(n => n.uptime || 0);
      
      const getMedian = (vals: number[]) => { if (vals.length === 0) return 0; const sorted = [...vals].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };

      const netHealthRaw = Math.round(healths.reduce((a, b) => a + b, 0) / healths.length) || 0;
      const netUptimeRaw = Math.round(uptimes.reduce((a, b) => a + b, 0) / uptimes.length) || 0;
      const netStorageRaw = getMedian(storages);
      const netCreditsRaw = getMedian(credits);
      const netVersion = 'v1.2.0'; 

      const leaderRaw = leaderNode ? { health: leaderNode.health || 0, storage: leaderNode.storage_committed || 0, credits: leaderNode.credits || 0, uptime: leaderNode.uptime || 0, version: leaderNode.version || 'N/A' } : { health: 0, storage: 0, credits: 0, uptime: 0, version: 'N/A' };

      return {
          network: { health: netHealthRaw.toString(), uptime: formatUptimePrecise(netUptimeRaw), storage: formatBytes(netStorageRaw), credits: netCreditsRaw.toLocaleString(), version: netVersion },
          leader: { health: leaderRaw.health.toString(), uptime: formatUptimePrecise(leaderRaw.uptime), storage: formatBytes(leaderRaw.storage), credits: leaderRaw.credits.toLocaleString(), version: leaderRaw.version },
          networkRaw: { health: netHealthRaw, storage: netStorageRaw, credits: netCreditsRaw, uptime: netUptimeRaw },
          leaderRaw
      };
  }, [availableNodes, leaderMetric]);

  const currentWinners = useMemo(() => {
      if (selectedNodes.length === 0) return { storage: 0, credits: 0, health: 0 };
      return { storage: Math.max(...selectedNodes.map(n => n.storage_committed || 0)), credits: Math.max(...selectedNodes.map(n => n.credits || 0)), health: Math.max(...selectedNodes.map(n => n.health || 0)) };
  }, [selectedNodes]);

  const overallWinnerKey = useMemo(() => {
      if (selectedNodes.length < 2) return null;
      let bestScore = -1; let bestKey = null;
      const maxH = Math.max(...selectedNodes.map(n => n.health || 1)); const maxS = Math.max(...selectedNodes.map(n => n.storage_committed || 1)); const maxC = Math.max(...selectedNodes.map(n => n.credits || 1));
      selectedNodes.forEach(n => { const score = ((n.health || 0)/maxH) + ((n.storage_committed || 0)/maxS) + ((n.credits || 0)/maxC); if (score > bestScore) { bestScore = score; bestKey = n.pubkey; } });
      return bestKey;
  }, [selectedNodes]);

  useEffect(() => { const saved = localStorage.getItem('xandeum_favorites'); if (saved) setFavorites(JSON.parse(saved)); }, []);
  const updateUrl = (keys: string[]) => router.replace({ pathname: '/compare', query: { nodes: keys.join(',') } }, undefined, { shallow: true });
  
  const addNode = (pubkey: string) => { if (!selectedKeys.includes(pubkey) && selectedKeys.length < 30) { const k = [...selectedKeys, pubkey]; setSelectedKeys(k); updateUrl(k); setIsSearchOpen(false); setSearchQuery(''); setIsWatchlistOpen(false); } };
  const removeNode = (pubkey: string) => { const k = selectedKeys.filter(x => x !== pubkey); setSelectedKeys(k); updateUrl(k); };
  const clearAllNodes = () => { setSelectedKeys([]); updateUrl([]); };

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setToast('Link Copied!'); setTimeout(() => setToast(null), 2000); };
  const handleExport = async () => { if (printRef.current) { try { const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: '#020202', pixelRatio: 3 }); const link = document.createElement('a'); link.download = `pulse-report.png`; link.href = dataUrl; link.click(); } catch (err) { console.error(err); } } };
  const watchlistNodes = availableNodes.filter(n => favorites.includes(n.address || ''));

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden relative">
      <Head><title>Pulse Compare</title></Head>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#18181b_0%,#020202_100%)] pointer-events-none z-0"></div>
      
      {/* STANDALONE BACK BUTTON (TOP LEFT) */}
      <div className="absolute top-4 left-4 z-[60]">
        <Link href="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"><ArrowLeft size={20} /></Link>
      </div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white text-black font-black uppercase text-xs rounded-full animate-in fade-in slide-in-from-top-4 flex items-center gap-2 shadow-2xl"><CheckCircle size={14}/>{toast}</div>}

      <header className="shrink-0 pt-6 pb-4 px-4 md:px-8 relative z-50 flex justify-center">
        {/* CENTERED GLASS HEADER */}
        <div className="flex flex-col items-center gap-3">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-full px-8 py-3 shadow-2xl">
                <h1 className="text-base font-bold text-white uppercase tracking-widest">COMPARATIVE INTELLIGENCE</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
                        <Plus size={14} />
                    </button>
                    <span className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        Selected: <span className="text-zinc-200">{selectedNodes.length}</span>
                    </span>
                </div>
                {selectedKeys.length > 0 && (
                    <button onClick={clearAllNodes} className="text-[9px] md:text-[10px] font-black text-red-500/80 hover:text-red-400 uppercase tracking-tighter border-l border-white/10 pl-4 transition">
                        Clear All
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="px-4 md:px-8 pb-6 relative z-50 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl">
            <button onClick={() => setShowNetwork(!showNetwork)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border ${showNetwork ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{showNetwork ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-zinc-500"></div>} VS NETWORK</button>
            
            <div className="relative" ref={leaderRef}>
                <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border ${leaderMetric ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{leaderMetric ? `VS ${leaderMetric} LEADER` : 'VS LEADER'} <ChevronDown size={12} /></button>
                {isLeaderDropdownOpen && <div className="absolute top-full left-0 mt-2 w-36 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">{['STORAGE', 'CREDITS', 'HEALTH'].map(opt => (<button key={opt} onClick={() => { setLeaderMetric(leaderMetric === opt ? null : opt as any); setIsLeaderDropdownOpen(false); }} className="px-4 py-3 text-[9px] font-bold text-left text-zinc-400 hover:text-white hover:bg-zinc-800 transition uppercase">{opt}</button>))}</div>}
            </div>

            <div className="relative" ref={watchlistRef}>
                <button onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white text-[9px] md:text-[10px] font-bold uppercase transition whitespace-nowrap"><Star size={12} /> WATCHLIST <ChevronDown size={12} /></button>
                {isWatchlistOpen && <div className="absolute top-full left-0 mt-2 w-56 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col max-h-64 overflow-y-auto">{watchlistNodes.length > 0 ? watchlistNodes.map(n => (<button key={n.pubkey} onClick={() => addNode(n.pubkey!)} disabled={selectedKeys.includes(n.pubkey!)} className={`px-4 py-3 text-[10px] font-bold text-left flex justify-between items-center ${selectedKeys.includes(n.pubkey!) ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'}`}><span>{getSafeIp(n)}</span>{selectedKeys.includes(n.pubkey!) && <CheckCircle size={12} />}</button>)) : <div className="p-4 text-[10px] text-zinc-600 text-center">No Favorites</div>}</div>}
            </div>

            <div className="relative" ref={networkRef}>
                <button onClick={() => setIsNetworkOpen(!isNetworkOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border border-zinc-600"><div className={`w-2 h-2 rounded-full ${networkScope === 'MAINNET' ? 'bg-green-500' : networkScope === 'DEVNET' ? 'bg-blue-500' : 'bg-white'}`}></div>{networkScope === 'ALL' ? 'ALL NETWORKS' : networkScope} <ChevronDown size={12} /></button>
                {isNetworkOpen && <div className="absolute top-full left-0 mt-2 w-44 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">{[{ id: 'ALL', label: 'All Networks', color: 'bg-white' }, { id: 'MAINNET', label: 'Mainnet', color: 'bg-green-500' }, { id: 'DEVNET', label: 'Devnet', color: 'bg-blue-500' }].map(opt => (<button key={opt.id} onClick={() => { setNetworkScope(opt.id as any); setIsNetworkOpen(false); }} className="px-4 py-3 text-[10px] font-bold text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition uppercase flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${opt.color}`}></div> {opt.label}</button>))}</div>}
            </div>

            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[9px] md:text-[10px] font-bold uppercase transition whitespace-nowrap border border-zinc-700"><Share2 size={12}/> SHARE</button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[9px] md:text-[10px] font-bold uppercase transition shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"><Download size={12}/> REPORT CARD</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative z-10 px-4 pb-4 md:px-8 md:pb-8 flex flex-col max-w-[1600px] mx-auto w-full">
         
         {/* MAIN DATA DECK */}
         <div className="flex-initial min-h-[400px] flex flex-col bg-[#09090b]/60 backdrop-blur-2xl rounded-xl border border-white/5 shadow-2xl overflow-hidden relative mb-6">
             {selectedNodes.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="w-56 h-56 border border-zinc-800 rounded-full flex items-center justify-center relative mb-8 animate-[spin_60s_linear_infinite]">
                        <div className="absolute inset-0 border border-zinc-900 rounded-full scale-125 border-dashed opacity-50"></div>
                        <Grid size={64} className="text-zinc-800 relative z-10" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2 z-10">Matrix Initialization</h2>
                    <p className="text-sm text-zinc-500 mb-8 max-w-sm z-10 leading-relaxed font-mono">System ready. Scope: <span className="text-white">{networkScope}</span>.</p>
                    <button onClick={() => setIsSearchOpen(true)} className="px-10 py-4 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 z-10 flex items-center gap-2"><Plus size={14} /> Add Node</button>
                 </div>
             ) : (
                 <main ref={printRef} className="flex-1 overflow-x-auto overflow-y-auto bg-transparent relative flex custom-scrollbar snap-x items-start content-start">
                    <ControlRail showNetwork={showNetwork} leaderMetric={leaderMetric} benchmarks={benchmarks} />
                    {selectedNodes.map((node, index) => {
                        const isWinner = {
                            health: (node.health || 0) === currentWinners.health,
                            storage: (node.storage_committed || 0) === currentWinners.storage,
                            credits: (node.credits || 0) === currentWinners.credits
                        };
                        return (
                            <NodeColumn 
                                key={node.pubkey} 
                                node={node} 
                                onRemove={() => removeNode(node.pubkey!)} 
                                anchorNode={selectedNodes[0]} 
                                theme={PLAYER_THEMES[index % PLAYER_THEMES.length]} 
                                isAnchor={index === 0} 
                                winners={isWinner}
                                overallWinner={node.pubkey === overallWinnerKey}
                                benchmarks={benchmarks}
                                leaderMetric={leaderMetric}
                                showNetwork={showNetwork}
                            />
                        );
                    })}
                    {selectedNodes.length < 30 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
                    <div className="w-8 shrink-0"></div>
                </main>
             )}
         </div>

         {/* ANALYTICS DECK */}
         <SynthesisEngine nodes={selectedNodes} themes={PLAYER_THEMES} networkScope={networkScope} />
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsSearchOpen(false)}>
              <div className="w-full max-w-xl bg-[#09090b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/30">
                      <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Add Source ({networkScope})</h3>
                          <button onClick={() => setIsSearchOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-center gap-3 bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
                          <Search size={16} className="text-zinc-500" />
                          <input autoFocus type="text" placeholder="Search..." className="bg-transparent w-full text-xs text-white outline-none placeholder-zinc-600 font-mono" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                      {availableNodes.filter(n => !searchQuery || n.pubkey?.toLowerCase().includes(searchQuery.toLowerCase()) || getSafeIp(n).includes(searchQuery)).map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} disabled={selectedKeys.includes(node.pubkey!)} className={`w-full text-left p-3 rounded-xl flex justify-between items-center group transition mb-1 border border-transparent ${selectedKeys.includes(node.pubkey!) ? 'opacity-50 cursor-not-allowed bg-zinc-900/30' : 'hover:bg-zinc-900/80 hover:border-zinc-800 cursor-pointer'}`}>
                              <div>
                                  <div className="text-xs font-bold text-zinc-200 group-hover:text-white font-mono flex items-center gap-3">{getSafeIp(node)}<span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${node.network === 'MAINNET' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{node.network}</span></div>
                                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{node.pubkey?.slice(0, 24)}...</div>
                              </div>
                              {selectedKeys.includes(node.pubkey!) ? <CheckCircle size={16} className="text-green-500"/> : <Plus size={14} className="text-zinc-600 group-hover:text-white"/>}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
