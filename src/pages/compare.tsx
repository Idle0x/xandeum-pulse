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
  Activity, Share2, Map as MapIcon, RotateCcw, ChevronDown, Crown, 
  BarChart3, Radar, Grid, Star, LayoutGrid, HelpCircle
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { getSafeIp, compareVersions } from '../utils/nodeHelpers';
import { formatBytes, formatUptime } from '../utils/formatters';
import { Node } from '../types';

// GeoJSON URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- THEME ENGINE ---
const PLAYER_THEMES = [
  { name: 'cyan', hex: '#22d3ee', bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20', gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent' },
  { name: 'violet', hex: '#a78bfa', bg: 'bg-violet-950/30', border: 'border-violet-500/30', text: 'text-violet-400', shadow: 'shadow-violet-500/20', gradient: 'from-violet-500/20 via-violet-500/5 to-transparent' },
  { name: 'emerald', hex: '#34d399', bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', text: 'text-emerald-400', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent' },
  { name: 'amber', hex: '#fbbf24', bg: 'bg-amber-950/30', border: 'border-amber-500/30', text: 'text-amber-400', shadow: 'shadow-amber-500/20', gradient: 'from-amber-500/20 via-amber-500/5 to-transparent' },
  { name: 'rose', hex: '#fb7185', bg: 'bg-rose-950/30', border: 'border-rose-500/30', text: 'text-rose-400', shadow: 'shadow-rose-500/20', gradient: 'from-rose-500/20 via-rose-500/5 to-transparent' }
];

// --- MICRO COMPONENTS ---

const GlowingWinner = ({ color }: { color: string }) => (
  <div className="absolute inset-0 z-0 pointer-events-none opacity-20 animate-pulse" style={{ boxShadow: `inset 0 0 40px ${color}` }}></div>
);

// Updated DeltaTag with Tooltip Context
const DeltaTag = ({ val, base, type = 'number', reverse = false, contextLabel }: { val: number; base: number; type?: 'number' | 'bytes' | 'percent'; reverse?: boolean; contextLabel: string }) => {
  if (val === base || !base) return <div className="h-4 w-4 flex items-center justify-center opacity-20"><Minus size={8} /></div>;
  
  const diff = val - base;
  const isGood = reverse ? diff < 0 : diff > 0;
  const display = type === 'bytes' ? formatBytes(Math.abs(diff)) : type === 'percent' ? `${Math.abs(diff).toFixed(1)}%` : Math.abs(diff).toLocaleString();
  
  return (
    <div className="group relative cursor-help">
      <div className={`flex items-center gap-0.5 text-[8px] font-bold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {diff > 0 ? '↑' : '↓'} {display}
      </div>
      {/* Context Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black border border-zinc-700 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
        vs {contextLabel}
      </div>
    </div>
  );
};

const HealthSpectrumBar = ({ health }: { health: number }) => {
  const color = health >= 90 ? 'bg-green-500' : health >= 70 ? 'bg-blue-500' : 'bg-yellow-500';
  return (
    <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden mt-1.5 backdrop-blur-sm border border-white/5">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${health}%` }}></div>
    </div>
  );
};

const SectionHeader = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="h-8 bg-black/60 backdrop-blur-md border-y border-white/5 flex items-center px-3 gap-2 sticky left-0 z-10 w-full">
    <Icon size={10} className="text-zinc-500" />
    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{label}</span>
  </div>
);

// --- MAIN COMPONENTS ---

const ControlRail = ({ showNetwork, leaderMetric, benchmarks }: any) => {
  const Benchmark = ({ label, val, subVal }: { label: string, val: string, subVal?: string }) => (
    <div className="flex flex-col justify-center mt-1 w-full gap-1">
        {showNetwork && (
            <div className="flex justify-between items-center text-[8px] font-mono px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                <span className="text-zinc-500 uppercase">{label}</span>
                <span className="text-zinc-300 font-bold">{val}</span>
            </div>
        )}
        {leaderMetric && subVal && (
            <div className="flex justify-between items-center text-[8px] font-mono px-1.5 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20 animate-in fade-in slide-in-from-left-1">
                <span className="text-yellow-600 uppercase font-bold">LEADER</span>
                <span className="text-yellow-500 font-bold">{subVal}</span>
            </div>
        )}
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b]/90 backdrop-blur-2xl border-r border-white/10 w-[110px] md:w-[130px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)]">
      <div className="h-36 md:h-44 border-b border-white/5 p-3 flex flex-col justify-end pb-4 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))] z-10"></div>
        <div className="relative z-20">
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Settings2 size={10} /> CONFIG</div>
            <div className="text-[10px] font-bold text-white leading-tight">METRIC KEYS</div>
        </div>
      </div>
      
      <div className="bg-transparent">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Version</span><Benchmark label="Consensus" val={benchmarks.network.version} subVal={benchmarks.leader.version} /></div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Network</span></div>
        
        <SectionHeader label="VITALITY" icon={Activity} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Health</span><Benchmark label="Avg" val={benchmarks.network.health} subVal={benchmarks.leader.health} /></div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Uptime</span><Benchmark label="Avg" val={benchmarks.network.uptime} subVal={benchmarks.leader.uptime} /></div>

        <SectionHeader label="HARDWARE" icon={Database} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Capacity</span><Benchmark label="Med" val={benchmarks.network.storage} subVal={benchmarks.leader.storage} /></div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Utilization</span></div>

        <SectionHeader label="ECONOMY" icon={Zap} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Credits</span><Benchmark label="Med" val={benchmarks.network.credits} subVal={benchmarks.leader.credits} /></div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Rank</span></div>
      </div>
    </div>
  );
};

// 2. NODE COLUMN
const NodeColumn = ({ node, onRemove, anchorNode, theme, winners, benchmarks, leaderMetric, showNetwork }: any) => {
  const Row = ({ children }: { children: React.ReactNode }) => (<div className="h-[70px] flex flex-col justify-center px-4 min-w-[170px] md:min-w-[220px] relative group/cell hover:bg-white/[0.03] transition-colors border-b border-white/5">{children}</div>);
  const SectionSpacer = () => <div className="h-8 bg-black/40 backdrop-blur-sm border-y border-white/5"></div>;

  // --- THE LOGIC CORE ---
  // Determines what we are comparing against.
  // Priority 1: Leader (Highest context)
  // Priority 2: Network (Global context)
  // Priority 3: Anchor Node (Local context)
  const getContext = (metric: 'health' | 'storage' | 'credits' | 'uptime') => {
      if (leaderMetric) return { base: benchmarks.leaderRaw[metric], label: 'Leader' };
      if (showNetwork) return { base: benchmarks.networkRaw[metric], label: 'Network' };
      // Fallback: Compare vs Anchor Node (Node #1)
      if (anchorNode && node.pubkey !== anchorNode.pubkey) return { base: anchorNode[metric === 'storage' ? 'storage_committed' : metric] || 0, label: 'Anchor' };
      return { base: 0, label: '' };
  };

  return (
    <div className={`flex flex-col min-w-[170px] md:min-w-[220px] bg-black/20 backdrop-blur-sm relative border-r border-white/5`}>
      <div className={`h-36 md:h-44 border-b border-white/5 p-4 flex flex-col relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} opacity-80`}></div>
        <button onClick={onRemove} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg z-20 transition-all"><X size={12} /></button>
        <div className="mt-auto relative z-10 flex flex-col gap-2">
          <div className="flex items-end justify-between">
             <div className={`w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl ${theme.shadow}`}>
                {node.location?.countryCode ? <img src={`https://flagcdn.com/w80/${node.location.countryCode.toLowerCase()}.png`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <span className="text-[10px] font-bold text-zinc-600">N/A</span>}
             </div>
             <div className={`text-4xl font-black opacity-10 absolute -right-2 -bottom-4 font-mono ${theme.text}`}>{node.pubkey?.slice(0, 2)}</div>
          </div>
          <div>
            <div className={`text-xs md:text-sm font-black truncate font-mono tracking-tight text-white group-hover:text-white transition-colors`}>{node.pubkey?.slice(0, 12)}...</div>
            <div className="text-[9px] text-zinc-500 font-mono truncate mt-0.5 flex items-center gap-1"><Globe size={8} /> {getSafeIp(node)}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <SectionSpacer />
        <Row>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${node.version === '0.0.0' ? 'bg-zinc-600' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></div>
                <span className="text-[11px] font-mono font-bold text-zinc-200">{node.version}</span>
            </div>
        </Row>
        <Row><span className={`text-[8px] px-2 py-0.5 rounded border w-fit font-bold tracking-wider ${node.network === 'MAINNET' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-blue-400 border-blue-500/20 bg-blue-500/5'}`}>{node.network}</span></Row>

        <SectionSpacer />
        <Row>
            {winners.health && <GlowingWinner color={theme.hex} />}
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-end mb-1">
                    <span className={`text-lg font-mono font-bold ${node.health >= 90 ? 'text-white' : 'text-zinc-400'}`}>{node.health}</span>
                    {(() => {
                        const ctx = getContext('health');
                        return ctx.base > 0 && <DeltaTag val={node.health || 0} base={ctx.base} contextLabel={ctx.label} />;
                    })()}
                </div>
                <HealthSpectrumBar health={node.health || 0} />
            </div>
        </Row>
        <Row>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"><Activity size={10} /></div>
                    <span className="text-[10px] font-mono text-zinc-300">{formatUptime(node.uptime)}</span>
                </div>
            </div>
        </Row>

        <SectionSpacer />
        <Row>
            {winners.storage && <GlowingWinner color={theme.hex} />}
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-mono text-purple-300 font-bold">{formatBytes(node.storage_committed)}</span>
                    {(() => {
                        const ctx = getContext('storage');
                        return ctx.base > 0 && <DeltaTag val={node.storage_committed || 0} base={ctx.base} type="bytes" contextLabel={ctx.label} />;
                    })()}
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex"><div className="h-full bg-purple-500" style={{ width: '100%' }}></div></div>
            </div>
        </Row>
        <Row>
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-mono text-blue-300 font-bold">{formatBytes(node.storage_used)}</span>
                    <span className="text-[8px] text-zinc-500 font-mono">{node.storage_committed > 0 ? ((node.storage_used / node.storage_committed) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((node.storage_used||0)/(node.storage_committed||1))*100, 100)}%` }}></div></div>
            </div>
        </Row>

        <SectionSpacer />
        <Row>
            {winners.credits && <GlowingWinner color={theme.hex} />}
            <div className="relative z-10 w-full flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-lg font-mono text-yellow-500 font-bold tracking-tight">{node.credits?.toLocaleString() || '-'}</span>
                    {(() => {
                        const ctx = getContext('credits');
                        return ctx.base > 0 && <DeltaTag val={node.credits || 0} base={ctx.base} contextLabel={ctx.label} />;
                    })()}
                </div>
                <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Total Credits</span>
            </div>
        </Row>
        <Row>
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2"><span className="text-xs font-mono text-white font-bold">#{node.rank || '-'}</span>{node.rank <= 10 && <Crown size={10} className="text-yellow-500 fill-yellow-500 animate-pulse" />}</div>
            </div>
        </Row>
      </div>
    </div>
  );
};

// 3. SYNTHESIS VISUALIZER (Footer)
const SynthesisEngine = ({ nodes, themes, networkScope }: { nodes: Node[], themes: typeof PLAYER_THEMES, networkScope: string }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'SONAR' | 'TOPOLOGY'>('OVERVIEW');
  const [pos, setPos] = useState({ coordinates: [0, 20], zoom: 1 });

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);

  return (
    <div className="shrink-0 h-[400px] border-t border-white/5 bg-black/80 backdrop-blur-xl flex flex-col relative z-40">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-zinc-900/80 backdrop-blur-md p-1 rounded-full flex gap-1 border border-white/10 shadow-2xl">
                {[ { id: 'OVERVIEW', icon: BarChart3, label: 'Equalizer' }, { id: 'SONAR', icon: Radar, label: 'Sonar' }, { id: 'TOPOLOGY', icon: MapIcon, label: 'Topology' } ].map((t) => (
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
                                <div className={`text-[9px] font-mono truncate w-full text-center font-bold opacity-60 group-hover:opacity-100 transition-opacity ${themes[i].text}`}>{n.pubkey?.slice(0, 8)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-auto pt-4 flex items-center justify-center gap-2"><Activity size={10}/> Comparative Signal Strength ({networkScope})</div>
                </>
            )}
            
            {tab === 'SONAR' && (
                <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-[300px] h-[300px] rounded-full border border-zinc-700"></div>
                        <div className="absolute w-[200px] h-[200px] rounded-full border border-zinc-700"></div>
                        <div className="absolute w-[100px] h-[100px] rounded-full border border-zinc-700"></div>
                    </div>
                    <div className="flex gap-16 relative z-10">
                        {nodes.map((n, i) => {
                            const size = 40 + (((n.storage_committed || 0) / maxStorage) * 60);
                            return (
                                <div key={n.pubkey} className="flex flex-col items-center gap-4 animate-in zoom-in duration-700">
                                    <div className="rounded-full border-2 flex items-center justify-center relative group cursor-crosshair transition-all hover:scale-110" style={{ width: `${size}px`, height: `${size}px`, borderColor: themes[i].hex, boxShadow: `0 0 ${((n.credits || 0) / maxCredits) * 30}px ${themes[i].hex}40` }}>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute"></div>
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold ${themes[i].text}`}>{getSafeIp(n)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {tab === 'TOPOLOGY' && (
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-[#050505] mx-4 md:mx-8 relative group shadow-inner">
                    <ComposableMap projectionConfig={{ scale: 200 }} className="w-full h-full opacity-50 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                        <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} maxZoom={10}>
                            <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} />))}</Geographies>
                            {nodes.length > 1 && nodes.slice(1).map((n, i) => { if (!nodes[0].location || !n.location) return null; return (<Line key={`line-${i}`} from={[nodes[0].location.lon, nodes[0].location.lat]} to={[n.location.lon, n.location.lat]} stroke={themes[i+1].hex} strokeWidth={1} strokeOpacity={0.4} strokeDasharray="2 4" />) })}
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
  <div className="flex flex-col min-w-[170px] md:min-w-[220px] h-full border-r border-white/5 bg-white/[0.01] group cursor-pointer hover:bg-white/[0.03] transition relative" onClick={onClick}>
    <div className="h-36 md:h-44 border-b border-white/5 p-4 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full border border-zinc-800 border-dashed flex items-center justify-center text-zinc-700 group-hover:text-white group-hover:border-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"><Plus size={20} /></div>
      <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-400">ADD NODE</div>
    </div>
    <div className="flex-1 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function ComparePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { nodes, loading } = useNetworkData(); 

  // --- STATE ---
  const [networkScope, setNetworkScope] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  
  // Toggles
  const [showNetwork, setShowNetwork] = useState(true);
  const [leaderMetric, setLeaderMetric] = useState<'STORAGE' | 'CREDITS' | 'HEALTH' | null>(null);
  
  // Dropdowns
  const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // --- 1. FILTER NODES BASED ON SCOPE (Global Context) ---
  const availableNodes = useMemo(() => {
      if (networkScope === 'ALL') return nodes;
      return nodes.filter(n => n.network === networkScope);
  }, [nodes, networkScope]);

  const selectedNodes = useMemo(() => {
      return selectedKeys.map(key => availableNodes.find(n => n.pubkey === key)).filter((n): n is Node => !!n);
  }, [selectedKeys, availableNodes]);

  // --- 2. CALCULATE BENCHMARKS (The Engine) ---
  const benchmarks = useMemo(() => {
      if (availableNodes.length === 0) {
          return {
              network: { health: '0', uptime: '0', storage: '0', credits: '0', version: 'N/A' },
              leader: { health: '0', uptime: '0', storage: '0', credits: '0', version: 'N/A' },
              networkRaw: { health: 0, storage: 0, credits: 0, uptime: 0 },
              leaderRaw: { health: 0, storage: 0, credits: 0, uptime: 0 }
          };
      }

      // Find the specific Leader Node based on selection
      let leaderNode: Node | null = null;
      if (leaderMetric === 'STORAGE') {
          leaderNode = availableNodes.reduce((prev, current) => (prev.storage_committed || 0) > (current.storage_committed || 0) ? prev : current, availableNodes[0]);
      } else if (leaderMetric === 'CREDITS') {
          leaderNode = availableNodes.reduce((prev, current) => (prev.credits || 0) > (current.credits || 0) ? prev : current, availableNodes[0]);
      } else if (leaderMetric === 'HEALTH') {
          leaderNode = availableNodes.reduce((prev, current) => (prev.health || 0) > (current.health || 0) ? prev : current, availableNodes[0]);
      }

      // Network Stats (Avg/Median)
      const healths = availableNodes.map(n => n.health || 0);
      const storages = availableNodes.map(n => n.storage_committed || 0);
      const credits = availableNodes.map(n => n.credits || 0);
      const uptimes = availableNodes.map(n => n.uptime || 0);
      
      const getMedian = (vals: number[]) => {
          if (vals.length === 0) return 0;
          const sorted = [...vals].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };
      
      const getMode = (arr: string[]) => {
          if (arr.length === 0) return 'N/A';
          const counts: Record<string, number> = {};
          arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
          return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      };

      const netHealthRaw = Math.round(healths.reduce((a, b) => a + b, 0) / healths.length) || 0;
      const netUptimeRaw = Math.round(uptimes.reduce((a, b) => a + b, 0) / uptimes.length) || 0;
      const netStorageRaw = getMedian(storages);
      const netCreditsRaw = getMedian(credits);
      const netVersion = getMode(availableNodes.map(n => n.version || '0.0.0'));

      // Leader Raw Stats (From specific node, or fallback to absolute maxes if no metric selected yet)
      const leaderRaw = leaderNode ? {
          health: leaderNode.health || 0,
          storage: leaderNode.storage_committed || 0,
          credits: leaderNode.credits || 0,
          uptime: leaderNode.uptime || 0,
          version: leaderNode.version || 'N/A'
      } : {
          // If no leader selected, we don't show comparisons, so zeros are fine or maxes
          health: 0, storage: 0, credits: 0, uptime: 0, version: 'N/A'
      };

      return {
          network: {
              health: netHealthRaw.toString(),
              uptime: formatUptime(netUptimeRaw),
              storage: formatBytes(netStorageRaw),
              credits: netCreditsRaw.toLocaleString(),
              version: netVersion
          },
          leader: {
              health: leaderRaw.health.toString(),
              uptime: formatUptime(leaderRaw.uptime),
              storage: formatBytes(leaderRaw.storage),
              credits: leaderRaw.credits.toLocaleString(),
              version: leaderRaw.version
          },
          networkRaw: { health: netHealthRaw, storage: netStorageRaw, credits: netCreditsRaw, uptime: netUptimeRaw },
          leaderRaw
      };
  }, [availableNodes, leaderMetric]);

  const currentWinners = useMemo(() => {
      if (selectedNodes.length === 0) return { storage: 0, credits: 0, health: 0 };
      return {
          storage: Math.max(...selectedNodes.map(n => n.storage_committed || 0)),
          credits: Math.max(...selectedNodes.map(n => n.credits || 0)),
          health: Math.max(...selectedNodes.map(n => n.health || 0))
      };
  }, [selectedNodes]);

  // --- ACTIONS ---
  useEffect(() => {
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const updateUrl = (keys: string[]) => router.replace({ pathname: '/compare', query: { nodes: keys.join(',') } }, undefined, { shallow: true });
  const addNode = (pubkey: string) => { if (!selectedKeys.includes(pubkey) && selectedKeys.length < 5) { const k = [...selectedKeys, pubkey]; setSelectedKeys(k); updateUrl(k); setIsSearchOpen(false); setSearchQuery(''); setIsWatchlistOpen(false); } };
  const removeNode = (pubkey: string) => { const k = selectedKeys.filter(x => x !== pubkey); setSelectedKeys(k); updateUrl(k); };

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setToast('Link Copied!'); setTimeout(() => setToast(null), 2000); };
  const handleExport = async () => { if (printRef.current) { try { const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: '#020202', pixelRatio: 3 }); const link = document.createElement('a'); link.download = `pulse-report-${new Date().toISOString().split('T')[0]}.png`; link.href = dataUrl; link.click(); } catch (err) { console.error('Export failed', err); } } };

  const watchlistNodes = availableNodes.filter(n => favorites.includes(n.address || ''));

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden relative">
      <Head><title>Pulse Comparative Analysis</title></Head>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#18181b_0%,#020202_100%)] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none z-0"></div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-in fade-in slide-in-from-top-4 flex items-center gap-2"><CheckCircle size={12}/>{toast}</div>}

      <header className="shrink-0 pt-4 pb-2 px-4 md:px-8 relative z-50">
        <div className="max-w-[1400px] mx-auto bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-full p-2 pl-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"><ArrowLeft size={14} /></Link>
                <h1 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">COMPARATIVE INTELLIGENCE</h1>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pr-2">
                {/* VS NETWORK TOGGLE */}
                <button onClick={() => setShowNetwork(!showNetwork)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase transition whitespace-nowrap border ${showNetwork ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>
                    {showNetwork ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-zinc-500"></div>} VS NETWORK
                </button>

                {/* VS LEADER DROPDOWN */}
                <div className="relative">
                    <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase transition whitespace-nowrap border ${leaderMetric ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>
                        {leaderMetric ? `VS ${leaderMetric} LEADER` : 'VS LEADER'} <ChevronDown size={10} />
                    </button>
                    {isLeaderDropdownOpen && <div className="absolute top-full right-0 mt-2 w-32 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">{['STORAGE', 'CREDITS', 'HEALTH'].map(opt => (<button key={opt} onClick={() => { setLeaderMetric(leaderMetric === opt ? null : opt as any); setIsLeaderDropdownOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-400 hover:text-white hover:bg-zinc-800 transition uppercase">{opt}</button>))}</div>}
                </div>

                {/* WATCHLIST DROPDOWN */}
                <div className="relative">
                    <button onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white text-[9px] font-bold uppercase transition whitespace-nowrap">
                        <Star size={10} /> WATCHLIST <ChevronDown size={10} />
                    </button>
                    {isWatchlistOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-60 overflow-y-auto">
                            {watchlistNodes.length > 0 ? watchlistNodes.map(n => (
                                <button key={n.pubkey} onClick={() => addNode(n.pubkey!)} disabled={selectedKeys.includes(n.pubkey!)} className={`px-3 py-2 text-[9px] font-bold text-left flex justify-between items-center ${selectedKeys.includes(n.pubkey!) ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'}`}>
                                    <span>{getSafeIp(n)}</span>
                                    {selectedKeys.includes(n.pubkey!) && <CheckCircle size={10} />}
                                </button>
                            )) : <div className="p-3 text-[9px] text-zinc-600 text-center">No Favorites Found</div>}
                        </div>
                    )}
                </div>

                <div className="h-4 w-px bg-white/10 mx-1"></div>

                {/* NETWORK SCOPE DROPDOWN */}
                <div className="relative">
                    <button onClick={() => setIsNetworkOpen(!isNetworkOpen)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] font-bold uppercase transition whitespace-nowrap border border-zinc-600">
                        <div className={`w-1.5 h-1.5 rounded-full ${networkScope === 'MAINNET' ? 'bg-green-500' : networkScope === 'DEVNET' ? 'bg-blue-500' : 'bg-white'}`}></div>
                        {networkScope === 'ALL' ? 'ALL NETWORKS' : networkScope} <ChevronDown size={10} />
                    </button>
                    {isNetworkOpen && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
                            {[
                                { id: 'ALL', label: 'All Networks', color: 'bg-white' },
                                { id: 'MAINNET', label: 'Mainnet', color: 'bg-green-500' },
                                { id: 'DEVNET', label: 'Devnet', color: 'bg-blue-500' }
                            ].map(opt => (
                                <button key={opt.id} onClick={() => { setNetworkScope(opt.id as any); setIsNetworkOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition uppercase flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></div> {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={handleShare} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"><Share2 size={12}/></button>
                <button onClick={handleExport} className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition"><Download size={12}/></button>
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative z-10 px-4 pb-4 md:px-8 md:pb-8 flex flex-col">
         <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col bg-[#09090b]/60 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden relative">
             {selectedNodes.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="w-64 h-64 border border-zinc-800 rounded-full flex items-center justify-center relative mb-8 animate-[spin_60s_linear_infinite]">
                        <div className="absolute inset-0 border border-zinc-900 rounded-full scale-125 border-dashed opacity-50"></div>
                        <Grid size={64} className="text-zinc-800 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-3 z-10">Matrix Initialization</h2>
                    <p className="text-xs text-zinc-500 mb-8 max-w-sm z-10 leading-relaxed font-mono">System ready. Scope: <span className="text-white">{networkScope}</span>.</p>
                    <button onClick={() => setIsSearchOpen(true)} className="px-10 py-4 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 z-10 flex items-center gap-3"><Plus size={14} /> Add Data Source</button>
                 </div>
             ) : (
                 <>
                    <main ref={printRef} className="flex-1 overflow-x-auto overflow-y-auto bg-transparent relative flex custom-scrollbar snap-x">
                        <ControlRail 
                            showNetwork={showNetwork} 
                            leaderMetric={leaderMetric} 
                            benchmarks={benchmarks}
                        />
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
                                    benchmarks={benchmarks}
                                    leaderMetric={leaderMetric}
                                    showNetwork={showNetwork}
                                />
                            );
                        })}
                        {selectedNodes.length < 5 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
                        <div className="w-8 shrink-0"></div>
                    </main>
                    <SynthesisEngine nodes={selectedNodes} themes={PLAYER_THEMES} networkScope={networkScope} />
                 </>
             )}
         </div>
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/30">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Add Data Source ({networkScope})</h3>
                          <button onClick={() => setIsSearchOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-center gap-3 bg-black/50 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-600 transition-colors">
                          <Search size={16} className="text-zinc-500" />
                          <input autoFocus type="text" placeholder="Search by IP, Pubkey or Version..." className="bg-transparent w-full text-xs text-white outline-none placeholder-zinc-600 font-mono" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                      {availableNodes.filter(n => !searchQuery || n.pubkey?.toLowerCase().includes(searchQuery.toLowerCase()) || getSafeIp(n).includes(searchQuery)).slice(0, 20).map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} disabled={selectedKeys.includes(node.pubkey!)} className={`w-full text-left p-3 rounded-xl flex justify-between items-center group transition mb-1 border border-transparent ${selectedKeys.includes(node.pubkey!) ? 'opacity-50 cursor-not-allowed bg-zinc-900/30' : 'hover:bg-zinc-900/80 hover:border-zinc-800 cursor-pointer'}`}>
                              <div>
                                  <div className="text-xs font-bold text-zinc-200 group-hover:text-white font-mono flex items-center gap-2">
                                      {getSafeIp(node)}
                                      <span className={`text-[8px] px-1.5 rounded font-bold ${node.network === 'MAINNET' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{node.network}</span>
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{node.pubkey?.slice(0, 24)}...</div>
                              </div>
                              {selectedKeys.includes(node.pubkey!) ? <CheckCircle size={14} className="text-green-500"/> : <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-all"><Plus size={12}/></div>}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
