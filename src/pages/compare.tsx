import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import { 
  ArrowLeft, Search, Plus, X, Trash2, 
  Download, Settings2, CheckCircle, ArrowRight,
  TrendingUp, TrendingDown, Minus, Database, Shield, Zap, Globe, 
  Activity, Share2, Map as MapIcon, ChevronDown, Crown, 
  BarChart3, PieChart, Grid, Star, LayoutGrid, Info
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';
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

const DeltaTag = ({ val, base, type = 'number', reverse = false, contextLabel }: { val: number; base: number; type?: 'number' | 'bytes' | 'percent'; reverse?: boolean; contextLabel: string }) => {
  if (val === base || !base) return null;
  const diff = val - base;
  const isGood = reverse ? diff < 0 : diff > 0;
  return (
    <div className="group relative cursor-help ml-1">
        <span className={`text-[6px] font-bold ${isGood ? 'text-green-500' : 'text-red-500'}`}>
        {diff > 0 ? '↑' : '↓'}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black border border-zinc-700 rounded text-[6px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
            vs {contextLabel}
        </div>
    </div>
  );
};

const MicroBar = ({ val, max, color }: { val: number, max: number, color: string }) => (
  <div className="w-10 h-0.5 bg-zinc-800 rounded-full overflow-hidden ml-auto">
    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((val/max)*100, 100)}%`, backgroundColor: color }}></div>
  </div>
);

const SectionHeader = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="h-5 bg-black/90 backdrop-blur-md border-y border-white/5 flex items-center px-2 gap-1 sticky left-0 z-10 w-full mt-1">
    <Icon size={8} className="text-zinc-500" />
    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.1em]">{label}</span>
  </div>
);

// --- MAIN COMPONENTS ---

const ControlRail = ({ showNetwork, leaderMetric, benchmarks }: any) => {
  const Benchmark = ({ label, val, subVal }: { label: string, val: string, subVal?: string }) => (
    <div className="flex flex-col justify-center h-[36px] border-b border-white/5 px-2">
      <div className="flex justify-between items-center text-[6px] font-mono">
        <span className="text-zinc-500 font-bold">{label}</span>
        <span className="text-zinc-400">{showNetwork ? val : '-'}</span>
      </div>
      {leaderMetric && subVal && (
          <div className="flex justify-between items-center text-[6px] font-mono mt-0.5 text-yellow-600/80">
              <span className="uppercase font-bold">TOP</span>
              <span>{subVal}</span>
          </div>
      )}
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b] border-r border-white/10 w-[100px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)]">
      <div className="h-24 border-b border-white/5 p-2 flex flex-col justify-end bg-black">
        <div className="text-[6px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1"><Settings2 size={8} /> METRICS</div>
      </div>
      
      <div className="bg-transparent">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <Benchmark label="Version" val={benchmarks.network.version} subVal={benchmarks.leader.version} />
        <Benchmark label="Network" val="-" />
        
        <SectionHeader label="VITALITY" icon={Activity} />
        <Benchmark label="Health Score" val={benchmarks.network.health} subVal={benchmarks.leader.health} />
        <Benchmark label="Uptime" val={benchmarks.network.uptime} subVal={benchmarks.leader.uptime} />

        <SectionHeader label="HARDWARE" icon={Database} />
        <Benchmark label="Capacity" val={benchmarks.network.storage} subVal={benchmarks.leader.storage} />
        <Benchmark label="Used Space" val="-" />

        <SectionHeader label="ECONOMY" icon={Zap} />
        <Benchmark label="Credits" val={benchmarks.network.credits} subVal={benchmarks.leader.credits} />
        <Benchmark label="Global Rank" val="-" />
        
        <div className="h-[28px] border-t border-white/5 bg-black/50"></div>
      </div>
    </div>
  );
};

const NodeColumn = ({ node, onRemove, anchorNode, theme, winners, overallWinner, benchmarks, leaderMetric, showNetwork }: any) => {
  const Row = ({ children }: { children: React.ReactNode }) => (<div className={`h-[36px] flex flex-col justify-center px-3 min-w-[100px] md:min-w-[110px] relative border-b border-white/5`}>{children}</div>);
  const SectionSpacer = () => <div className="h-5 bg-transparent border-y border-transparent mt-1"></div>;

  const getContext = (metric: 'health' | 'storage' | 'credits') => {
      if (leaderMetric) return { base: benchmarks.leaderRaw[metric], label: 'Leader' };
      if (showNetwork) return { base: benchmarks.networkRaw[metric], label: 'Network' };
      if (anchorNode && node.pubkey !== anchorNode.pubkey) return { base: anchorNode[metric === 'storage' ? 'storage_committed' : metric] || 0, label: 'Anchor' };
      return { base: 0, label: '' };
  };

  return (
    <div className={`flex flex-col min-w-[100px] md:min-w-[110px] ${theme.bodyBg} relative border-r border-white/5`}>
      {/* Header */}
      <div className={`h-24 ${theme.headerBg} p-2 flex flex-col items-center justify-center relative overflow-hidden group`}>
        {overallWinner && <div className="absolute top-1.5 left-1.5 animate-in zoom-in duration-500"><Crown size={10} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" /></div>}
        
        <div className="mb-2 scale-150">
            {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-4 h-3 rounded-[1px] shadow-sm" />}
        </div>
        
        <div className="text-center">
            <div className={`text-[9px] font-bold font-mono text-white/90`}>{getSafeIp(node)}</div>
            <div className="text-[6px] text-white/50 font-mono truncate max-w-[80px]">{node.pubkey?.slice(0, 10)}...</div>
        </div>
      </div>

      <div className="relative z-10">
        <SectionSpacer />
        <Row><span className={`text-[9px] font-mono font-medium ${node.version === '0.0.0' ? 'text-zinc-600' : 'text-zinc-300'}`}>{node.version}</span></Row>
        <Row><span className={`text-[6px] px-1.5 py-0.5 rounded border w-fit font-bold ${node.network === 'MAINNET' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-blue-400 border-blue-500/20 bg-blue-500/5'}`}>{node.network}</span></Row>

        <SectionSpacer />
        <Row>
            <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-mono text-zinc-300">{node.health}</span>
                {winners.health && <CheckCircle size={8} className="text-green-500" />}
                {(() => { const ctx = getContext('health'); return ctx.base > 0 && <DeltaTag val={node.health} base={ctx.base} contextLabel={ctx.label} />; })()}
            </div>
            <MicroBar val={node.health} max={100} color={node.health >= 90 ? '#22c55e' : '#eab308'} />
        </Row>
        <Row><span className="text-[9px] font-mono text-zinc-300">{formatUptimePrecise(node.uptime)}</span></Row>

        <SectionSpacer />
        <Row>
            <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-mono text-zinc-300">{formatBytes(node.storage_committed)}</span>
                {winners.storage && <CheckCircle size={8} className="text-green-500" />}
                {(() => { const ctx = getContext('storage'); return ctx.base > 0 && <DeltaTag val={node.storage_committed} base={ctx.base} type="bytes" contextLabel={ctx.label} />; })()}
            </div>
        </Row>
        <Row>
            <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-mono text-zinc-300">{formatBytes(node.storage_used)}</span>
                <span className="text-[6px] text-zinc-500 font-mono">{node.storage_committed > 0 ? ((node.storage_used / node.storage_committed) * 100).toFixed(0) : 0}%</span>
            </div>
            <MicroBar val={node.storage_used} max={node.storage_committed} color="#60a5fa" />
        </Row>

        <SectionSpacer />
        <Row>
            <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-mono text-zinc-300">{node.credits?.toLocaleString()}</span>
                {winners.credits && <CheckCircle size={8} className="text-green-500" />}
                {(() => { const ctx = getContext('credits'); return ctx.base > 0 && <DeltaTag val={node.credits} base={ctx.base} contextLabel={ctx.label} />; })()}
            </div>
        </Row>
        <Row><span className="text-[9px] font-mono text-zinc-500">#{node.rank || '-'}</span></Row>

        {/* TRASHCAN ROW */}
        <div className="h-[28px] border-t border-white/5 flex items-center justify-center bg-black/20 hover:bg-red-500/10 transition-colors cursor-pointer group/trash" onClick={onRemove}>
            <Trash2 size={10} className="text-zinc-700 group-hover/trash:text-red-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

const SynthesisEngine = ({ nodes, themes, networkScope }: { nodes: Node[], themes: typeof PLAYER_THEMES, networkScope: string }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'TOPOLOGY'>('OVERVIEW');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);
  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);

  const getConicGradient = (type: 'STORAGE' | 'CREDITS') => {
    let currentDeg = 0;
    const total = type === 'STORAGE' ? totalStorage : totalCredits;
    if (total === 0) return 'conic-gradient(#333 0deg 360deg)';
    return `conic-gradient(${nodes.map((n, i) => {
        const val = type === 'STORAGE' ? (n.storage_committed || 0) : (n.credits || 0);
        const deg = (val / total) * 360;
        const stop = `${themes[i].hex} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    }).join(', ')})`;
  };

  return (
    <div className="shrink-0 h-[400px] border-t border-white/5 bg-black/80 backdrop-blur-xl flex flex-col relative z-40">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-zinc-900/80 backdrop-blur-md p-1 rounded-full flex gap-1 border border-white/10 shadow-2xl">
                {[ { id: 'OVERVIEW', icon: BarChart3, label: 'Equalizer' }, { id: 'MARKET', icon: PieChart, label: 'Market Share' }, { id: 'TOPOLOGY', icon: MapIcon, label: 'Topology' } ].map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-2 ${tab === t.id ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                        <t.icon size={12} /> {t.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col pt-16 pb-4">
            {tab === 'OVERVIEW' && (
                <>
                    <div className="flex-1 flex items-end justify-center gap-4 md:gap-8 px-8">
                        {nodes.map((n, i) => (
                            <div key={n.pubkey} className="flex flex-col items-center gap-3 h-full justify-end w-24 group">
                                <div className="w-full flex gap-1.5 h-[70%] items-end justify-center">
                                    <div className="w-3 rounded-t-sm transition-all duration-1000 relative group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ height: `${((n.storage_committed || 0) / maxStorage) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                    <div className="w-3 rounded-t-sm transition-all duration-1000 relative opacity-60 group-hover:opacity-100" style={{ height: `${((n.credits || 0) / maxCredits) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                </div>
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {n.location?.countryCode && <img src={`https://flagcdn.com/w20/${n.location.countryCode.toLowerCase()}.png`} className="w-2.5 h-2 rounded-[1px]" />}
                                    <div className={`text-[9px] font-mono truncate font-bold ${themes[i].text}`}>{getSafeIp(n)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-auto pt-4 flex items-center justify-center gap-2"><Activity size={10}/> Comparative Signal Strength ({networkScope})</div>
                </>
            )}
            
            {tab === 'MARKET' && (
                <>
                    <div className="flex-1 flex items-center justify-center gap-12 md:gap-24 animate-in fade-in duration-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full relative flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105" style={{ background: getConicGradient('STORAGE') }}>
                                <div className="w-24 h-24 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner border border-white/5">
                                    <Database size={14} className="text-zinc-600 mb-1" />
                                    <span className="text-[8px] font-bold text-zinc-500">STORAGE</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">{formatBytes(totalStorage)} Combined</div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full relative flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105" style={{ background: getConicGradient('CREDITS') }}>
                                <div className="w-24 h-24 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner border border-white/5">
                                    <Zap size={14} className="text-zinc-600 mb-1" />
                                    <span className="text-[8px] font-bold text-zinc-500">CREDITS</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">{(totalCredits / 1000000).toFixed(1)}M Combined</div>
                        </div>
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-auto pt-2 flex items-center justify-center gap-2">
                        <PieChart size={10}/> Market Dominance Visualization
                    </div>
                </>
            )}

            {tab === 'TOPOLOGY' && (
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-8 relative group shadow-inner">
                    <ComposableMap projectionConfig={{ scale: 200 }} className="w-full h-full opacity-50 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                        <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} maxZoom={10}>
                            <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} />))}</Geographies>
                            {nodes.map((n, i) => (n.location && (<Marker key={n.pubkey} coordinates={[n.location.lon, n.location.lat]}><circle r={12/pos.zoom} fill={themes[i].hex} fillOpacity={0.3} className="animate-ping" /><circle r={4/pos.zoom} fill="#fff" stroke={themes[i].hex} strokeWidth={2/pos.zoom} /></Marker>)))}
                        </ZoomableGroup>
                    </ComposableMap>
                </div>
            )}
        </div>
    </div>
  );
};

const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[100px] md:min-w-[110px] h-full bg-white/[0.01] group cursor-pointer hover:bg-white/[0.03] transition relative" onClick={onClick}>
    <div className="h-24 p-2 flex flex-col items-center justify-center border-b border-white/5 bg-black/40">
      <Plus size={12} className="text-zinc-700 group-hover:text-zinc-400 transition" />
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
      const getMode = (arr: string[]) => { if (arr.length === 0) return 'N/A'; const counts: Record<string, number> = {}; arr.forEach(val => counts[val] = (counts[val] || 0) + 1); return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b); };

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
  const addNode = (pubkey: string) => { if (!selectedKeys.includes(pubkey) && selectedKeys.length < 5) { const k = [...selectedKeys, pubkey]; setSelectedKeys(k); updateUrl(k); setIsSearchOpen(false); setSearchQuery(''); setIsWatchlistOpen(false); } };
  const removeNode = (pubkey: string) => { const k = selectedKeys.filter(x => x !== pubkey); setSelectedKeys(k); updateUrl(k); };
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setToast('Link Copied!'); setTimeout(() => setToast(null), 2000); };
  const handleExport = async () => { if (printRef.current) { try { const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: '#020202', pixelRatio: 3 }); const link = document.createElement('a'); link.download = `pulse-report.png`; link.href = dataUrl; link.click(); } catch (err) { console.error(err); } } };
  const watchlistNodes = availableNodes.filter(n => favorites.includes(n.address || ''));

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden relative">
      <Head><title>Pulse Compare</title></Head>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#18181b_0%,#020202_100%)] pointer-events-none z-0"></div>
      
      {/* STANDALONE BACK BUTTON (TOP LEFT) */}
      <div className="absolute top-4 left-4 z-[60]">
        <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"><ArrowLeft size={16} /></Link>
      </div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-white text-black font-black uppercase text-[10px] rounded-full animate-in fade-in slide-in-from-top-4 flex items-center gap-2"><CheckCircle size={10}/>{toast}</div>}

      <header className="shrink-0 pt-4 pb-2 px-4 md:px-8 relative z-50 flex justify-center">
        {/* CENTERED GLASS HEADER */}
        <div className="flex flex-col items-center gap-1">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-full px-6 py-2 shadow-2xl">
                <h1 className="text-sm font-bold text-white uppercase tracking-widest">COMPARATIVE INTELLIGENCE</h1>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Pods: {selectedNodes.length}</span>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="px-4 md:px-8 pb-4 relative z-50 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl">
            <button onClick={() => setShowNetwork(!showNetwork)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition whitespace-nowrap border ${showNetwork ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{showNetwork ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-zinc-500"></div>} VS NETWORK</button>
            
            <div className="relative">
                <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition whitespace-nowrap border ${leaderMetric ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{leaderMetric ? `VS ${leaderMetric} LEADER` : 'VS LEADER'} <ChevronDown size={10} /></button>
                {isLeaderDropdownOpen && <div className="absolute top-full left-0 mt-2 w-32 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">{['STORAGE', 'CREDITS', 'HEALTH'].map(opt => (<button key={opt} onClick={() => { setLeaderMetric(leaderMetric === opt ? null : opt as any); setIsLeaderDropdownOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-400 hover:text-white hover:bg-zinc-800 transition uppercase">{opt}</button>))}</div>}
            </div>

            <div className="relative">
                <button onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white text-[9px] font-bold uppercase transition whitespace-nowrap"><Star size={10} /> WATCHLIST <ChevronDown size={10} /></button>
                {isWatchlistOpen && <div className="absolute top-full left-0 mt-2 w-48 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col max-h-60 overflow-y-auto">{watchlistNodes.length > 0 ? watchlistNodes.map(n => (<button key={n.pubkey} onClick={() => addNode(n.pubkey!)} disabled={selectedKeys.includes(n.pubkey!)} className={`px-3 py-2 text-[9px] font-bold text-left flex justify-between items-center ${selectedKeys.includes(n.pubkey!) ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'}`}><span>{getSafeIp(n)}</span>{selectedKeys.includes(n.pubkey!) && <CheckCircle size={10} />}</button>)) : <div className="p-3 text-[9px] text-zinc-600 text-center">No Favorites</div>}</div>}
            </div>

            <div className="relative">
                <button onClick={() => setIsNetworkOpen(!isNetworkOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] font-bold uppercase transition whitespace-nowrap border border-zinc-600"><div className={`w-1.5 h-1.5 rounded-full ${networkScope === 'MAINNET' ? 'bg-green-500' : networkScope === 'DEVNET' ? 'bg-blue-500' : 'bg-white'}`}></div>{networkScope === 'ALL' ? 'ALL NETWORKS' : networkScope} <ChevronDown size={10} /></button>
                {isNetworkOpen && <div className="absolute top-full left-0 mt-2 w-40 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[70] flex flex-col">{[{ id: 'ALL', label: 'All Networks', color: 'bg-white' }, { id: 'MAINNET', label: 'Mainnet', color: 'bg-green-500' }, { id: 'DEVNET', label: 'Devnet', color: 'bg-blue-500' }].map(opt => (<button key={opt.id} onClick={() => { setNetworkScope(opt.id as any); setIsNetworkOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition uppercase flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></div> {opt.label}</button>))}</div>}
            </div>

            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[9px] font-bold uppercase transition whitespace-nowrap border border-zinc-700"><Share2 size={10}/> SHARE</button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase transition shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"><Download size={10}/> REPORT CARD</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative z-10 px-4 pb-4 md:px-8 md:pb-8 flex flex-col">
         <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col bg-[#09090b]/60 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden relative">
             {selectedNodes.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="w-48 h-48 border border-zinc-800 rounded-full flex items-center justify-center relative mb-6 animate-[spin_60s_linear_infinite]">
                        <div className="absolute inset-0 border border-zinc-900 rounded-full scale-125 border-dashed opacity-50"></div>
                        <Grid size={48} className="text-zinc-800 relative z-10" />
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-[0.2em] mb-2 z-10">Matrix Initialization</h2>
                    <p className="text-xs text-zinc-500 mb-6 max-w-sm z-10 leading-relaxed font-mono">System ready. Scope: <span className="text-white">{networkScope}</span>.</p>
                    <button onClick={() => setIsSearchOpen(true)} className="px-8 py-3 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[8px] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 z-10 flex items-center gap-2"><Plus size={10} /> Add Node</button>
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
                    {selectedNodes.length < 5 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
                    <div className="w-8 shrink-0"></div>
                </main>
             )}
             <SynthesisEngine nodes={selectedNodes} themes={PLAYER_THEMES} networkScope={networkScope} />
         </div>
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-zinc-800 flex flex-col gap-3 bg-zinc-900/30">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-white uppercase tracking-widest">Add Source ({networkScope})</h3>
                          <button onClick={() => setIsSearchOpen(false)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-center gap-2 bg-black/50 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-600 transition-colors">
                          <Search size={14} className="text-zinc-500" />
                          <input autoFocus type="text" placeholder="Search..." className="bg-transparent w-full text-[10px] text-white outline-none placeholder-zinc-600 font-mono" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                      {availableNodes.filter(n => !searchQuery || n.pubkey?.toLowerCase().includes(searchQuery.toLowerCase()) || getSafeIp(n).includes(searchQuery)).slice(0, 20).map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} disabled={selectedKeys.includes(node.pubkey!)} className={`w-full text-left p-2 rounded-lg flex justify-between items-center group transition mb-1 border border-transparent ${selectedKeys.includes(node.pubkey!) ? 'opacity-50 cursor-not-allowed bg-zinc-900/30' : 'hover:bg-zinc-900/80 hover:border-zinc-800 cursor-pointer'}`}>
                              <div>
                                  <div className="text-[10px] font-bold text-zinc-200 group-hover:text-white font-mono flex items-center gap-2">{getSafeIp(node)}<span className={`text-[7px] px-1 rounded font-bold ${node.network === 'MAINNET' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{node.network}</span></div>
                                  <div className="text-[8px] font-mono text-zinc-500">{node.pubkey?.slice(0, 24)}...</div>
                              </div>
                              {selectedKeys.includes(node.pubkey!) ? <CheckCircle size={12} className="text-green-500"/> : <Plus size={10} className="text-zinc-600 group-hover:text-white"/>}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
