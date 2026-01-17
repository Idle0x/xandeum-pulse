// pages/compare.tsx

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
  Activity, Share2, Map as MapIcon, RotateCcw, ChevronDown, Crown
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { getSafeIp } from '../utils/nodeHelpers';
import { formatBytes, formatUptime } from '../utils/formatters';
import { Node } from '../types';

// GeoJSON URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- THEME ENGINE ---
const PLAYER_THEMES = [
  { name: 'cyan', hex: '#22d3ee', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/30', gradient: 'from-cyan-500/10 to-transparent' },
  { name: 'violet', hex: '#a78bfa', bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', ring: 'ring-violet-500/30', gradient: 'from-violet-500/10 to-transparent' },
  { name: 'emerald', hex: '#34d399', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30', gradient: 'from-emerald-500/10 to-transparent' },
  { name: 'amber', hex: '#fbbf24', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30', gradient: 'from-amber-500/10 to-transparent' },
  { name: 'rose', hex: '#fb7185', bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500/30', gradient: 'from-rose-500/10 to-transparent' }
];

// --- MICRO COMPONENTS ---

const WinnerBadge = () => (
  <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded ml-2 animate-in zoom-in duration-300">
    <Crown size={8} className="text-yellow-500 fill-yellow-500" />
    <CheckCircle size={8} className="text-yellow-500" />
  </div>
);

const SyncStrip = () => (
  <div className="flex gap-0.5 mt-1 opacity-60" title="24h Uptime Visualization (Simulated)">
    {Array.from({ length: 12 }).map((_, i) => (
      <div 
        key={i} 
        className="h-1.5 w-1 rounded-full bg-green-500" 
        style={{ opacity: 0.4 + Math.random() * 0.6 }} 
      />
    ))}
  </div>
);

const DeltaTag = ({ val, base, type = 'number', reverse = false }: { val: number; base: number; type?: 'number' | 'bytes' | 'percent'; reverse?: boolean; }) => {
  if (val === base) return <div className="h-4 w-4 flex items-center justify-center opacity-20"><Minus size={8} /></div>;
  const diff = val - base;
  const isGood = reverse ? diff < 0 : diff > 0;
  const bgClass = isGood ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400';
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  let display = '';
  if (type === 'bytes') display = formatBytes(Math.abs(diff));
  else if (type === 'percent') display = `${Math.abs(diff).toFixed(1)}%`;
  else display = Math.abs(diff).toLocaleString();
  return <div className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border backdrop-blur-sm ${bgClass}`}><Icon size={8} />{display}</div>;
};

const MicroProgress = ({ val, max, color }: { val: number, max: number, color: string }) => (
  <div className="w-full h-0.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((val/max)*100, 100)}%`, backgroundColor: color }}></div>
  </div>
);

const SectionHeader = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="h-8 bg-zinc-900/95 backdrop-blur-md border-y border-white/5 flex items-center px-3 gap-2 sticky left-0 z-10 w-full">
    <Icon size={10} className="text-zinc-500" />
    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{label}</span>
  </div>
);

// --- MAIN COMPONENTS ---

const StickyLegend = ({ showAvg, leaderContext, networkStats, mostCommonVersion, medianStorage, leaderData }: any) => {
  const Benchmark = ({ label, val }: { label: string, val: string }) => (
    <div className="flex justify-between items-center text-[8px] font-mono mt-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/5 w-full">
      <span className="text-zinc-500 uppercase">{label}</span>
      <span className="text-zinc-300 font-bold">{val}</span>
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b] border-r border-white/10 w-[110px] md:w-[130px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)]">
      <div className="h-32 md:h-40 border-b border-white/5 p-3 flex flex-col justify-end pb-4 bg-zinc-900/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40"></div>
        <div className="relative z-10">
            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Settings2 size={10} /> PARAMS</div>
            <div className="text-[10px] font-bold text-white leading-tight">METRIC KEYS</div>
        </div>
      </div>
      <div className="bg-[#09090b]">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Version</span>{showAvg && <Benchmark label="Consensus" val={mostCommonVersion} />}</div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Network</span></div>
        
        <SectionHeader label="VITALITY" icon={Activity} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Health Score</span>{showAvg && <Benchmark label="Avg" val={Math.round(networkStats?.avgBreakdown?.total || 0).toString()} />}{leaderContext === 'HEALTH' && <Benchmark label="Top" val={leaderData.health} />}</div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Uptime</span></div>

        <SectionHeader label="HARDWARE" icon={Database} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Committed</span>{showAvg && <Benchmark label="Med" val={formatBytes(medianStorage)} />}{leaderContext === 'STORAGE' && <Benchmark label="Top" val={leaderData.storage} />}</div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Used Space</span></div>

        <SectionHeader label="ECONOMY" icon={Zap} />
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Credits</span>{leaderContext === 'CREDITS' && <Benchmark label="Top" val={leaderData.credits} />}</div>
        <div className="h-[70px] flex flex-col justify-center px-3 border-b border-white/5"><span className="text-[9px] font-bold text-zinc-400 uppercase">Global Rank</span></div>
      </div>
    </div>
  );
};

const NodeColumn = ({ node, onRemove, anchorNode, theme, isAnchor, winners }: any) => {
  const Row = ({ children }: { children: React.ReactNode }) => (<div className="h-[70px] flex flex-col justify-center px-4 min-w-[160px] md:min-w-[200px] relative group/cell hover:bg-white/[0.02] transition-colors border-b border-white/5">{children}</div>);
  const SectionSpacer = () => <div className="h-8 bg-zinc-900/90 backdrop-blur-md border-y border-white/5"></div>;

  return (
    <div className={`flex flex-col min-w-[160px] md:min-w-[200px] bg-[#09090b] relative`}>
      <div className={`absolute inset-0 ${theme.bg}`}></div>
      
      {/* Header Slot */}
      <div className={`h-32 md:h-40 border-b border-white/5 p-4 flex flex-col relative group`}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.hex }}></div>
        <button onClick={onRemove} className="absolute top-2 right-2 text-red-500 opacity-50 hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded z-20 transition"><Trash2 size={14} /></button>
        <div className="mt-auto relative z-10">
          <div className="flex items-center justify-between mb-3">
             <div className={`w-10 h-10 rounded-xl bg-zinc-900 border flex items-center justify-center overflow-hidden relative shadow-lg ${theme.border} ${theme.ring} ring-1`}>
                {node.location?.countryCode ? <img src={`https://flagcdn.com/w80/${node.location.countryCode.toLowerCase()}.png`} className="w-full h-full object-cover opacity-90" /> : <span className="text-[10px] font-bold text-zinc-500">??</span>}
             </div>
             {isAnchor && <div className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border backdrop-blur-md ${theme.bg} ${theme.text} ${theme.border}`}>Anchor</div>}
          </div>
          <div className={`text-[10px] md:text-xs font-black truncate font-mono tracking-tight mb-0.5 ${theme.text}`}>{node.pubkey?.slice(0, 16)}...</div>
          <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono truncate">{getSafeIp(node)}</div>
        </div>
      </div>

      <div className="relative z-10">
        <SectionSpacer />
        <Row><span className={`text-[10px] font-mono font-bold ${node.version === '0.0.0' ? 'text-zinc-600' : 'text-zinc-200'}`}>{node.version}</span></Row>
        <Row><span className={`text-[8px] px-2 py-0.5 rounded border w-fit font-bold ${node.network === 'MAINNET' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-blue-400 border-blue-500/20 bg-blue-500/10'}`}>{node.network}</span></Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className={`text-[12px] font-mono font-bold ${node.health >= 80 ? 'text-green-400' : node.health >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{node.health}</span>
                        {winners.health && <WinnerBadge />}
                    </div>
                    {!isAnchor && anchorNode && <DeltaTag val={node.health || 0} base={anchorNode.health || 0} />}
                </div>
                <MicroProgress val={node.health || 0} max={100} color={node.health >= 80 ? '#22c55e' : '#eab308'} />
            </div>
        </Row>
        <Row>
            <span className="text-[10px] font-mono text-zinc-400">{formatUptime(node.uptime)}</span>
            <SyncStrip />
        </Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-[10px] font-mono text-purple-300 font-bold">{formatBytes(node.storage_committed)}</span>
                        {winners.storage && <WinnerBadge />}
                    </div>
                    {!isAnchor && anchorNode && <DeltaTag val={node.storage_committed || 0} base={anchorNode.storage_committed || 0} type="bytes" />}
                </div>
            </div>
        </Row>
        <Row>
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-blue-300 font-bold">{formatBytes(node.storage_used)}</span>
                    {!isAnchor && anchorNode && <DeltaTag val={node.storage_used || 0} base={anchorNode.storage_used || 0} type="bytes" />}
                </div>
                <MicroProgress val={node.storage_used || 0} max={node.storage_committed || 1} color="#60a5fa" />
            </div>
        </Row>

        <SectionSpacer />
        <Row>
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-[10px] font-mono text-yellow-500 font-bold">{node.credits?.toLocaleString() || '-'}</span>
                        {winners.credits && <WinnerBadge />}
                    </div>
                    {!isAnchor && anchorNode && <DeltaTag val={node.credits || 0} base={anchorNode.credits || 0} type="number" />}
                </div>
            </div>
        </Row>
        <Row>
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-300">#{node.rank || '-'}</span>
                    {!isAnchor && anchorNode && node.rank && anchorNode.rank && <DeltaTag val={node.rank} base={anchorNode.rank} type="number" reverse={true} />}
                </div>
            </div>
        </Row>
      </div>

      <div className="h-16 border-t border-r border-white/5 flex items-center justify-center bg-zinc-900/10">
         <button onClick={onRemove} className="p-2 rounded-full text-red-500 opacity-60 hover:opacity-100 hover:bg-red-500/10 transition"><Trash2 size={14}/></button>
      </div>
    </div>
  );
};

const Visualizer = ({ nodes, themes }: { nodes: Node[], themes: typeof PLAYER_THEMES }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'MAP'>('OVERVIEW');
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

  const handleZoomIn = () => { if (pos.zoom < 8) setPos(p => ({ ...p, zoom: p.zoom * 1.5 })); };
  const handleZoomOut = () => { if (pos.zoom > 1) setPos(p => ({ ...p, zoom: p.zoom / 1.5 })); };
  const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => { setPos(position); };

  return (
    <div className="shrink-0 h-[450px] border-t border-zinc-800 bg-[#050505] flex flex-col relative z-40">
        <div className="flex items-center justify-center p-3 border-b border-zinc-800/50">
            <div className="bg-zinc-900/50 p-1 rounded-xl flex gap-1 border border-zinc-800">
                {['OVERVIEW', 'MARKET', 'MAP'].map(t => (
                    <button key={t} onClick={() => setTab(t as any)} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase transition-all duration-300 ${tab === t ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>{t === 'MARKET' ? 'MARKET SHARE' : t}</button>
                ))}
            </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden relative flex flex-col">
            {tab === 'OVERVIEW' && (
                <>
                    <div className="flex-1 flex items-end justify-center gap-8 md:gap-12 pb-4">
                        {nodes.map((n, i) => (
                            <div key={n.pubkey} className="flex flex-col items-center gap-3 h-full justify-end w-16 group">
                                <div className="w-full flex gap-1 h-[80%] items-end justify-center">
                                    <div className="w-2 rounded-t-sm transition-all duration-700 relative opacity-60 group-hover:opacity-100" style={{ height: `${((n.storage_committed || 0) / maxStorage) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                    <div className="w-2 rounded-t-sm transition-all duration-700 relative opacity-40 group-hover:opacity-80" style={{ height: `${((n.credits || 0) / maxCredits) * 100}%`, backgroundColor: themes[i].hex }}></div>
                                </div>
                                <div className={`text-[8px] font-mono truncate w-full text-center font-bold opacity-80 ${themes[i].text}`}>{getSafeIp(n)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-auto pb-2">Comparing normalized performance metrics across selected nodes</div>
                </>
            )}

            {tab === 'MARKET' && (
                <>
                    <div className="flex-1 flex items-center justify-center gap-12 md:gap-24 animate-in fade-in duration-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-28 h-28 rounded-full relative flex items-center justify-center shadow-2xl" style={{ background: getConicGradient('STORAGE') }}><div className="w-20 h-20 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner"><Database size={14} className="text-zinc-600 mb-1" /><span className="text-[8px] font-bold text-zinc-500">STORAGE</span></div></div>
                            <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">{formatBytes(totalStorage)} Combined</div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-28 h-28 rounded-full relative flex items-center justify-center shadow-2xl" style={{ background: getConicGradient('CREDITS') }}><div className="w-20 h-20 bg-[#050505] rounded-full flex flex-col items-center justify-center z-10 shadow-inner"><Zap size={14} className="text-zinc-600 mb-1" /><span className="text-[8px] font-bold text-zinc-500">CREDITS</span></div></div>
                            <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">{(totalCredits / 1000000).toFixed(1)}M Combined</div>
                        </div>
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-auto pb-2">Visualizing dominance of Storage Capacity and Network Credits</div>
                </>
            )}

            {tab === 'MAP' && (
                <>
                    <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800/50 bg-[#080808] relative group">
                        <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity">
                            <ZoomableGroup zoom={pos.zoom} center={pos.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={10}>
                                <Geographies geography={GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#18181b" stroke="#27272a" strokeWidth={0.5} />))}</Geographies>
                                {nodes.length > 1 && nodes.slice(1).map((n, i) => { if (!nodes[0].location || !n.location) return null; return (<Line key={`line-${i}`} from={[nodes[0].location.lon, nodes[0].location.lat]} to={[n.location.lon, n.location.lat]} stroke={themes[i+1].hex} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 4" />) })}
                                {nodes.map((n, i) => (n.location && (<Marker key={n.pubkey} coordinates={[n.location.lon, n.location.lat]}><circle r={12/pos.zoom} fill={themes[i].hex} fillOpacity={0.2} className="animate-ping" /><circle r={5/pos.zoom} fill={themes[i].hex} stroke="#fff" strokeWidth={1/pos.zoom} /></Marker>)))}
                            </ZoomableGroup>
                        </ComposableMap>
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button onClick={handleZoomIn} className="p-2 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-lg hover:text-white"><Plus size={14} /></button>
                            <button onClick={handleZoomOut} className="p-2 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-lg hover:text-white"><Minus size={14} /></button>
                            <button onClick={() => setPos({ coordinates: [0, 20], zoom: 1 })} className="p-2 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg hover:text-white"><RotateCcw size={14} /></button>
                        </div>
                    </div>
                    {/* MAP LEGEND GRID */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 px-2">
                        {nodes.map((n, i) => (
                            <div key={n.pubkey} className="flex items-center gap-3 bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themes[i].hex }}></div>
                                <div className="min-w-0">
                                    <div className={`text-[9px] font-bold font-mono truncate ${themes[i].text}`}>{n.pubkey?.slice(0, 16)}...</div>
                                    <div className="text-[8px] text-zinc-500 font-mono truncate">{getSafeIp(n)}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {n.location?.countryCode && <img src={`https://flagcdn.com/w20/${n.location.countryCode.toLowerCase()}.png`} className="w-3 rounded-[1px]" />}
                                        <span className="text-[8px] text-zinc-400 font-bold uppercase truncate">{n.location?.countryName || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-[9px] text-zinc-600 uppercase font-bold mt-2">Geographical distribution and latency topology</div>
                </>
            )}
        </div>
    </div>
  );
};

const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[160px] md:min-w-[200px] h-full border-r border-zinc-800/30 bg-black/20 group cursor-pointer hover:bg-zinc-900/10 transition" onClick={onClick}>
    <div className="h-32 md:h-40 border-b border-zinc-800 p-4 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border border-zinc-700 border-dashed flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:border-zinc-500 transition-all duration-300 group-hover:scale-110"><Plus size={16} /></div>
      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400">ADD NODE</div>
    </div>
    <div className="flex-1 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>
  </div>
);

const EmptyState = ({ onOpenSearch }: { onOpenSearch: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#18181b_0%,transparent_70%)] opacity-50 pointer-events-none"></div>
        <div className="w-48 h-48 rounded-full border border-zinc-800 flex items-center justify-center animate-[spin_60s_linear_infinite] opacity-30 mb-8 relative">
            <div className="absolute inset-0 border border-dashed border-zinc-700 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
            <Globe size={64} className="text-zinc-700" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2 z-10">Initialize Matrix</h2>
        <p className="text-xs text-zinc-500 mb-6 max-w-sm z-10">Select nodes to begin comparative analysis. Visualize performance deltas, network spread, and economic dominance.</p>
        <button onClick={onOpenSearch} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-105 z-10 flex items-center gap-2">
            <Plus size={14} /> Add First Node
        </button>
    </div>
);

// --- MAIN PAGE ---

export default function ComparePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { nodes, loading, networkStats, mostCommonVersion, medianCommitted } = useNetworkData(); 

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showAvg, setShowAvg] = useState(false);
  const [leaderContext, setLeaderContext] = useState<string | null>(null); 
  const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
  const [networkToggle, setNetworkToggle] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const selectedNodes = useMemo(() => selectedKeys.map(key => nodes.find(n => n.pubkey === key)).filter((n): n is Node => !!n), [selectedKeys, nodes]);

  const leaderData = useMemo(() => {
      if (nodes.length === 0) return { storage: '0', credits: '0', health: '0' };
      const maxS = Math.max(...nodes.map(n => n.storage_committed || 0));
      const maxC = Math.max(...nodes.map(n => n.credits || 0));
      const maxH = Math.max(...nodes.map(n => n.health || 0));
      return { storage: formatBytes(maxS), credits: maxC.toLocaleString(), health: maxH.toString() };
  }, [nodes]);

  const currentWinners = useMemo(() => {
      if (selectedNodes.length === 0) return { storage: 0, credits: 0, health: 0 };
      return {
          storage: Math.max(...selectedNodes.map(n => n.storage_committed || 0)),
          credits: Math.max(...selectedNodes.map(n => n.credits || 0)),
          health: Math.max(...selectedNodes.map(n => n.health || 0))
      };
  }, [selectedNodes]);

  useEffect(() => {
    if (!router.isReady || loading || nodes.length === 0) return;
    const urlNodes = router.query.nodes as string;
    if (urlNodes) {
        const keys = urlNodes.split(',');
        if (JSON.stringify(keys) !== JSON.stringify(selectedKeys)) {
            setSelectedKeys(keys);
            if (keys.length > 0) { setShowAvg(true); setLeaderContext(null); }
        }
    } else { setSelectedKeys([]); setShowAvg(false); }
  }, [router.isReady, loading, nodes.length]);

  const updateUrl = (keys: string[]) => router.replace({ pathname: '/compare', query: { nodes: keys.join(',') } }, undefined, { shallow: true });
  const addNode = (pubkey: string) => { if (!selectedKeys.includes(pubkey) && selectedKeys.length < 5) { const k = [...selectedKeys, pubkey]; setSelectedKeys(k); updateUrl(k); setIsSearchOpen(false); setSearchQuery(''); } };
  const removeNode = (pubkey: string) => { const k = selectedKeys.filter(x => x !== pubkey); setSelectedKeys(k); updateUrl(k); };

  const handleShare = () => {
      navigator.clipboard.writeText(window.location.href);
      setToast('Analysis Link Copied!');
      setTimeout(() => setToast(null), 2000);
  };

  const handleExport = async () => {
      if (!printRef.current) return;
      try {
          const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: '#050505', pixelRatio: 3 });
          const link = document.createElement('a'); link.download = `pulse-report-${new Date().toISOString().split('T')[0]}.png`; link.href = dataUrl; link.click();
      } catch (err) { console.error('Export failed', err); }
  };

  const searchResults = useMemo(() => {
    let filtered = nodes;
    if (networkToggle !== 'ALL') {
        filtered = filtered.filter(n => n.network === networkToggle);
    }
    if (!searchQuery) return filtered.slice(0, 100); 
    const q = searchQuery.toLowerCase();
    return filtered.filter(n => n.pubkey?.toLowerCase().includes(q) || getSafeIp(n).toLowerCase().includes(q)).slice(0, 20); 
  }, [nodes, searchQuery, networkToggle]);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden relative">
      <Head><title>Pulse Comparative Analysis</title></Head>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#18181b_0%,#000_100%)] pointer-events-none z-0"></div>
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none z-0"></div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 font-bold text-xs flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/>{toast}</div>}

      <header className="shrink-0 pt-4 pb-2 px-4 md:px-8 relative z-50">
        <div className="max-w-7xl mx-auto bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-4 w-full md:w-auto"><Link href="/" className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:bg-red-500/10 transition text-red-500"><ArrowLeft size={16} /></Link><div><h1 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">COMPARATIVE ANALYSIS <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-mono">BETA</span></h1><div className="text-[9px] text-zinc-500 font-mono font-bold mt-0.5">ACTIVE MATRIX: {selectedNodes.length} NODES</div></div></div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
                <button onClick={() => setShowAvg(!showAvg)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition whitespace-nowrap border ${showAvg ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{showAvg ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-zinc-500"></div>} VS AVG</button>
                <div className="relative">
                    <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition whitespace-nowrap border ${leaderContext ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20'}`}>{leaderContext ? `VS ${leaderContext}` : 'VS LEADER'} <ChevronDown size={10} /></button>
                    {isLeaderDropdownOpen && <div className="absolute top-full right-0 mt-2 w-32 bg-[#09090b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">{['STORAGE', 'CREDITS', 'HEALTH'].map(opt => (<button key={opt} onClick={() => { setLeaderContext(leaderContext === opt ? null : opt); setIsLeaderDropdownOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-400 hover:text-white hover:bg-zinc-800 transition uppercase">{opt}</button>))}</div>}
                </div>
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[9px] font-bold uppercase transition whitespace-nowrap border border-zinc-700"><Share2 size={12} /> SHARE</button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase transition shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"><Download size={12} /> REPORT</button>
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative z-10 px-4 pb-4 md:px-8 md:pb-8 flex flex-col">
         <div className="max-w-7xl mx-auto w-full h-full flex flex-col bg-[#09090b]/80 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
             {selectedNodes.length === 0 ? (
                 <EmptyState onOpenSearch={() => setIsSearchOpen(true)} />
             ) : (
                 <>
                    <main ref={printRef} className="flex-1 overflow-x-auto overflow-y-auto bg-transparent relative flex custom-scrollbar snap-x">
                        <StickyLegend showAvg={showAvg} leaderContext={leaderContext} networkStats={networkStats} mostCommonVersion={mostCommonVersion} medianStorage={medianCommitted} leaderData={leaderData} />
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
                                />
                            );
                        })}
                        {selectedNodes.length < 5 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
                        <div className="w-8 shrink-0"></div>
                    </main>
                    <Visualizer nodes={selectedNodes} themes={PLAYER_THEMES} />
                 </>
             )}
         </div>
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-zinc-800 flex flex-col gap-4">
                      <div className="flex items-center gap-3"><Search size={16} className="text-zinc-500" /><input autoFocus type="text" placeholder="Search any node..." className="bg-transparent w-full text-sm text-white outline-none placeholder-zinc-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><button onClick={() => setIsSearchOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button></div>
                      <div className="flex gap-2">
                          <button onClick={() => setNetworkToggle('ALL')} className={`flex-1 py-1.5 text-[9px] font-bold rounded uppercase border ${networkToggle === 'ALL' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>All</button>
                          <button onClick={() => setNetworkToggle('MAINNET')} className={`flex-1 py-1.5 text-[9px] font-bold rounded uppercase border flex items-center justify-center gap-1 ${networkToggle === 'MAINNET' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}><div className={`w-1.5 h-1.5 rounded-full ${networkToggle === 'MAINNET' ? 'bg-green-400' : 'bg-zinc-600'}`}></div>Mainnet</button>
                          <button onClick={() => setNetworkToggle('DEVNET')} className={`flex-1 py-1.5 text-[9px] font-bold rounded uppercase border flex items-center justify-center gap-1 ${networkToggle === 'DEVNET' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}><div className={`w-1.5 h-1.5 rounded-full ${networkToggle === 'DEVNET' ? 'bg-blue-400' : 'bg-zinc-600'}`}></div>Devnet</button>
                      </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                      {searchResults.length > 0 ? searchResults.map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} disabled={selectedKeys.includes(node.pubkey!)} className={`w-full text-left p-3 rounded-lg flex justify-between items-center group transition ${selectedKeys.includes(node.pubkey!) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-900 cursor-pointer'}`}>
                              <div><div className="text-xs font-bold text-zinc-200 group-hover:text-white">{getSafeIp(node)}</div><div className="text-[10px] font-mono text-zinc-500">{node.pubkey?.slice(0, 16)}...</div></div>
                              {selectedKeys.includes(node.pubkey!) ? <CheckCircle size={12} className="text-green-500"/> : <Plus size={12} className="text-zinc-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100" />}
                          </button>
                      )) : <div className="p-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest">No nodes found</div>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
