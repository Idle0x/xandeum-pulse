// pages/compare.tsx

import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { 
  ArrowLeft, Search, Plus, X, Trash2, 
  Download, Settings2, CheckCircle, ArrowRight,
  TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Map as MapIcon,
  ChevronDown
} from 'lucide-react';

// Hooks & Utils
import { useNetworkData } from '../hooks/useNetworkData';
import { getSafeIp } from '../utils/nodeHelpers';
import { formatBytes, formatUptime } from '../utils/formatters';
import { Node } from '../types';

// GeoJSON URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- HELPER COMPONENTS ---

const DeltaTag = ({ 
  val, 
  base, 
  type = 'number', 
  reverse = false 
}: { 
  val: number; 
  base: number; 
  type?: 'number' | 'bytes' | 'percent';
  reverse?: boolean;
}) => {
  if (val === base) return <span className="text-zinc-600"><Minus size={8} /></span>;

  const diff = val - base;
  const isGood = reverse ? diff < 0 : diff > 0;
  
  const color = isGood ? 'text-green-500' : 'text-red-500';
  const Icon = diff > 0 ? TrendingUp : TrendingDown;

  let display = '';
  if (type === 'bytes') display = formatBytes(Math.abs(diff));
  else if (type === 'percent') display = `${Math.abs(diff).toFixed(1)}%`;
  else display = Math.abs(diff).toLocaleString();

  return (
    <div className={`flex items-center gap-0.5 text-[8px] font-bold ${color} bg-black/40 px-1 py-0.5 rounded border border-white/5`}>
      <Icon size={8} />
      {display}
    </div>
  );
};

// 1. Sticky Legend
const StickyLegend = ({ 
  showAvg, 
  leaderContext, 
  networkStats,
  mostCommonVersion,
  medianStorage,
  leaderData
}: { 
  showAvg: boolean; 
  leaderContext: string | null; 
  networkStats: any;
  mostCommonVersion: string;
  medianStorage: number;
  leaderData: any;
}) => {
  
  const renderBenchmark = (label: string, val: string) => (
    <div className="flex justify-between items-center text-[7px] font-mono text-zinc-500 mt-0.5 px-1 bg-zinc-900/20 rounded">
      <span>{label}</span>
      <span className="text-zinc-300">{val}</span>
    </div>
  );

  return (
    <div className="sticky left-0 z-30 bg-[#09090b] border-r border-zinc-800 w-[90px] md:w-[120px] shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="h-32 md:h-40 border-b border-zinc-800 p-2 flex flex-col justify-end pb-4 bg-[#09090b]">
        <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">COMPARISON</div>
        <div className="text-[10px] md:text-xs font-bold text-white leading-tight">
          MATRIX VIEW
        </div>
      </div>

      <div className="divide-y divide-zinc-800/50 bg-[#09090b]">
        {/* IDENTITY */}
        <div className="h-6 bg-zinc-900/50 flex items-center px-2 text-[7px] font-bold text-zinc-500 uppercase tracking-widest">IDENTITY</div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Version</span>
          {showAvg && renderBenchmark('Consensus', mostCommonVersion)}
        </div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Network</span>
        </div>

        {/* VITALITY */}
        <div className="h-6 bg-zinc-900/50 flex items-center px-2 text-[7px] font-bold text-zinc-500 uppercase tracking-widest">VITALITY</div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Health Score</span>
          {showAvg && renderBenchmark('Avg', Math.round(networkStats?.avgBreakdown?.total || 0).toString())}
          {leaderContext === 'HEALTH' && renderBenchmark('Top', leaderData.health)}
        </div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Uptime</span>
        </div>

        {/* HARDWARE */}
        <div className="h-6 bg-zinc-900/50 flex items-center px-2 text-[7px] font-bold text-zinc-500 uppercase tracking-widest">HARDWARE</div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Committed</span>
          {showAvg && renderBenchmark('Med', formatBytes(medianStorage))}
          {leaderContext === 'STORAGE' && renderBenchmark('Top', leaderData.storage)}
        </div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Used Space</span>
        </div>

        {/* ECONOMY */}
        <div className="h-6 bg-zinc-900/50 flex items-center px-2 text-[7px] font-bold text-zinc-500 uppercase tracking-widest">ECONOMY</div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Credits</span>
          {leaderContext === 'CREDITS' && renderBenchmark('Top', leaderData.credits)}
        </div>
        <div className="h-[60px] flex flex-col justify-center px-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase">Global Rank</span>
        </div>
      </div>
    </div>
  );
};

// 2. Data Column
const NodeColumn = ({ 
  node, 
  onRemove,
  anchorNode,
  color
}: { 
  node: Node; 
  onRemove: () => void;
  anchorNode: Node | null;
  color: string;
}) => {
  const isAnchor = anchorNode?.pubkey === node.pubkey;
  
  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="h-[60px] flex flex-col justify-center px-3 md:px-4 min-w-[130px] md:min-w-[180px] border-r border-zinc-800/50 relative">
      {children}
    </div>
  );

  const SectionBreak = () => <div className="h-6 bg-black/50 border-r border-zinc-800/50"></div>;

  return (
    <div className={`flex flex-col min-w-[130px] md:min-w-[180px] bg-[#09090b] transition-colors ${isAnchor ? 'bg-zinc-900/10' : ''}`}>
      <div className={`h-32 md:h-40 border-b border-r border-zinc-800 p-3 flex flex-col relative group ${isAnchor ? 'bg-zinc-900/20' : ''}`}>
        <button onClick={onRemove} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded"><Trash2 size={12} /></button>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden relative">
                {node.location?.countryCode ? <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-full h-full object-cover opacity-80" /> : <span className="text-[10px] font-bold text-zinc-500">??</span>}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }}></div>
             </div>
             {isAnchor && <div className="text-[7px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase">Anchor</div>}
          </div>
          <div className="text-[10px] md:text-xs font-bold text-white truncate font-mono tracking-tight">{getSafeIp(node)}</div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 font-mono truncate">{node.pubkey?.slice(0, 12)}...</div>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/50">
        <SectionBreak />
        <Row><span className="text-[10px] font-mono text-zinc-300">{node.version}</span></Row>
        <Row><span className={`text-[8px] px-2 py-0.5 rounded border w-fit font-bold ${node.network === 'MAINNET' ? 'text-green-500 border-green-900/30 bg-green-900/10' : 'text-blue-500 border-blue-900/30 bg-blue-900/10'}`}>{node.network}</span></Row>

        <SectionBreak />
        <Row><div className="flex flex-col gap-1"><span className={`text-[12px] font-bold ${node.health && node.health >= 80 ? 'text-white' : 'text-yellow-500'}`}>{node.health}/100</span>{!isAnchor && anchorNode && <DeltaTag val={node.health || 0} base={anchorNode.health || 0} />}</div></Row>
        <Row><span className="text-[10px] font-mono text-zinc-400">{formatUptime(node.uptime)}</span></Row>

        <SectionBreak />
        <Row><div className="flex flex-col gap-1"><span className="text-[10px] font-mono text-purple-400 font-bold">{formatBytes(node.storage_committed)}</span>{!isAnchor && anchorNode && <DeltaTag val={node.storage_committed || 0} base={anchorNode.storage_committed || 0} type="bytes" />}</div></Row>
        <Row><div className="flex flex-col gap-1"><span className="text-[10px] font-mono text-blue-400 font-bold">{formatBytes(node.storage_used)}</span>{!isAnchor && anchorNode && <DeltaTag val={node.storage_used || 0} base={anchorNode.storage_used || 0} type="bytes" />}</div></Row>

        <SectionBreak />
        <Row><div className="flex flex-col gap-1"><span className="text-[10px] font-mono text-yellow-500 font-bold">{node.credits?.toLocaleString() || '-'}</span>{!isAnchor && anchorNode && <DeltaTag val={node.credits || 0} base={anchorNode.credits || 0} type="number" />}</div></Row>
        <Row><div className="flex flex-col gap-1"><span className="text-[10px] font-mono text-zinc-300">#{node.rank || '-'}</span>{!isAnchor && anchorNode && node.rank && anchorNode.rank && <DeltaTag val={node.rank} base={anchorNode.rank} type="number" reverse={true} />}</div></Row>
      </div>
    </div>
  );
};

// 3. Visualizer Module
const Visualizer = ({ nodes, colors }: { nodes: Node[], colors: string[] }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'MARKET' | 'MAP'>('OVERVIEW');

  if (nodes.length < 1) return null;

  const maxStorage = Math.max(...nodes.map(n => n.storage_committed || 0), 1);
  const maxCredits = Math.max(...nodes.map(n => n.credits || 0), 1);

  const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);

  const getConicGradient = (type: 'STORAGE' | 'CREDITS') => {
    let currentDeg = 0;
    const total = type === 'STORAGE' ? totalStorage : totalCredits;
    if (total === 0) return 'conic-gradient(#333 0deg 360deg)';

    const stops = nodes.map((n, i) => {
        const val = type === 'STORAGE' ? (n.storage_committed || 0) : (n.credits || 0);
        const deg = (val / total) * 360;
        const stop = `${colors[i]} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  };

  return (
    <div className="shrink-0 h-[280px] border-t border-zinc-800 bg-[#09090b] flex flex-col relative z-40">
        <div className="flex items-center justify-center gap-1 p-2 border-b border-zinc-800 bg-black/20">
            {['OVERVIEW', 'MARKET', 'MAP'].map(t => (
                <button 
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${tab === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    {t === 'MARKET' ? 'MARKET SHARE' : t}
                </button>
            ))}
        </div>

        <div className="flex-1 p-4 overflow-hidden relative">
            {tab === 'OVERVIEW' && (
                <div className="h-full flex items-end justify-center gap-4 md:gap-8 pb-4">
                    {nodes.map((n, i) => (
                        <div key={n.pubkey} className="flex flex-col items-center gap-2 h-full justify-end w-12 md:w-16 group">
                            <div className="w-full flex gap-0.5 h-[80%] items-end justify-center">
                                <div className="w-1.5 md:w-2 bg-purple-500/50 rounded-t-sm transition-all duration-500 relative group-hover:bg-purple-500" style={{ height: `${((n.storage_committed || 0) / maxStorage) * 100}%` }}></div>
                                <div className="w-1.5 md:w-2 bg-green-500/50 rounded-t-sm transition-all duration-500 relative group-hover:bg-green-500" style={{ height: `${n.health || 0}%` }}></div>
                                <div className="w-1.5 md:w-2 bg-yellow-500/50 rounded-t-sm transition-all duration-500 relative group-hover:bg-yellow-500" style={{ height: `${((n.credits || 0) / maxCredits) * 100}%` }}></div>
                            </div>
                            <div className="text-[8px] font-mono text-zinc-500 truncate w-full text-center" style={{ color: colors[i] }}>
                                {getSafeIp(n)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'MARKET' && (
                <div className="h-full flex items-center justify-center gap-8 md:gap-16">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full relative flex items-center justify-center" style={{ background: getConicGradient('STORAGE') }}>
                            <div className="w-16 h-16 bg-[#09090b] rounded-full flex flex-col items-center justify-center z-10">
                                <span className="text-[8px] font-bold text-zinc-500">STORAGE</span>
                            </div>
                        </div>
                        <div className="text-[9px] text-zinc-400 font-mono">{formatBytes(totalStorage)} Total</div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full relative flex items-center justify-center" style={{ background: getConicGradient('CREDITS') }}>
                            <div className="w-16 h-16 bg-[#09090b] rounded-full flex flex-col items-center justify-center z-10">
                                <span className="text-[8px] font-bold text-zinc-500">CREDITS</span>
                            </div>
                        </div>
                        <div className="text-[9px] text-zinc-400 font-mono">{(totalCredits / 1000000).toFixed(1)}M Total</div>
                    </div>
                </div>
            )}

            {tab === 'MAP' && (
                <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800 bg-[#050505] relative">
                    <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full opacity-60">
                        <Geographies geography={GEO_URL}>
                            {({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (
                                <Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#262626" />
                            ))}
                        </Geographies>
                        {nodes.map((n, i) => (
                            n.location && (
                                <Marker key={n.pubkey} coordinates={[n.location.lon, n.location.lat]}>
                                    <circle r={4} fill={colors[i]} stroke="#fff" strokeWidth={1} />
                                    <text textAnchor="middle" y={-8} style={{ fontSize: '8px', fill: 'white', fontWeight: 'bold' }}>{getSafeIp(n)}</text>
                                </Marker>
                            )
                        ))}
                    </ComposableMap>
                </div>
            )}
        </div>
    </div>
  );
};

// 4. Empty Slot
const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[100px] md:min-w-[160px] h-full border-r border-zinc-800/30 bg-black/20">
    <div className="h-32 md:h-40 border-b border-zinc-800 p-4 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-zinc-900/30 transition" onClick={onClick}>
      <div className="w-8 h-8 rounded-full border border-zinc-700 border-dashed flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-500 transition">
        <Plus size={14} />
      </div>
      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400">ADD NODE</div>
    </div>
    <div className="flex-1 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>
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
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedNodes = useMemo(() => {
    return selectedKeys
      .map(key => nodes.find(n => n.pubkey === key))
      .filter((n): n is Node => !!n);
  }, [selectedKeys, nodes]);

  const leaderData = useMemo(() => {
      if (nodes.length === 0) return { storage: '0', credits: '0', health: '0' };
      const maxS = Math.max(...nodes.map(n => n.storage_committed || 0));
      const maxC = Math.max(...nodes.map(n => n.credits || 0));
      const maxH = Math.max(...nodes.map(n => n.health || 0));
      return {
          storage: formatBytes(maxS),
          credits: maxC.toLocaleString(),
          health: maxH.toString()
      };
  }, [nodes]);

  const NODE_COLORS = ['#3b82f6', '#a855f7', '#eab308', '#22c55e', '#ef4444'];

  useEffect(() => {
    if (!router.isReady || loading || nodes.length === 0) return;
    const urlNodes = router.query.nodes as string;
    
    if (urlNodes) {
        const keys = urlNodes.split(',');
        if (JSON.stringify(keys) !== JSON.stringify(selectedKeys)) {
            setSelectedKeys(keys);
            if (keys.length > 0) {
                setShowAvg(true); 
                setLeaderContext(null); 
            }
        }
    } else {
        setSelectedKeys([]);
        setShowAvg(false);
    }
  }, [router.isReady, loading, nodes.length]);

  const addNode = (pubkey: string) => {
    if (selectedKeys.includes(pubkey)) return;
    if (selectedKeys.length >= 5) return;
    const newKeys = [...selectedKeys, pubkey];
    setSelectedKeys(newKeys);
    setIsSearchOpen(false);
    setSearchQuery('');
    router.replace({ pathname: '/compare', query: { nodes: newKeys.join(',') } }, undefined, { shallow: true });
  };

  const removeNode = (pubkey: string) => {
    const newKeys = selectedKeys.filter(k => k !== pubkey);
    setSelectedKeys(newKeys);
    router.replace({ pathname: '/compare', query: { nodes: newKeys.join(',') } }, undefined, { shallow: true });
  };

  const handleExport = async () => {
      if (!printRef.current) return;
      try {
          const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: '#050505', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `pulse-comparison-${new Date().toISOString().split('T')[0]}.png`;
          link.href = dataUrl;
          link.click();
      } catch (err) { console.error('Export failed', err); }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter(n => n.pubkey?.toLowerCase().includes(q) || getSafeIp(n).toLowerCase().includes(q)).slice(0, 5); 
  }, [nodes, searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
      <Head><title>Pulse Comparative Analysis</title></Head>

      <header className="shrink-0 border-b border-zinc-800 bg-[#09090b] px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-zinc-400 hover:text-white"><ArrowLeft size={16} /></Link>
            <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider">Comparative Analysis</h1>
                <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2"><span>{selectedNodes.length} Nodes Selected</span><span className="text-zinc-700">|</span><span className="text-blue-500">Live Matrix</span></div>
            </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button onClick={() => setShowAvg(!showAvg)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition whitespace-nowrap ${showAvg ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>
                {showAvg ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-zinc-500"></div>} VS Average
            </button>

            <div className="relative">
                <button onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition whitespace-nowrap ${leaderContext ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>
                    {leaderContext ? `VS ${leaderContext}` : 'VS Leader'} <ChevronDown size={10} />
                </button>
                {isLeaderDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
                        {['STORAGE', 'CREDITS', 'HEALTH'].map(opt => (
                            <button key={opt} onClick={() => { setLeaderContext(leaderContext === opt ? null : opt); setIsLeaderDropdownOpen(false); }} className="px-3 py-2 text-[9px] font-bold text-left text-zinc-400 hover:text-white hover:bg-zinc-800 transition uppercase">{opt}</button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-4 w-px bg-zinc-800 mx-1"></div>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase transition shadow-lg shadow-blue-900/20 whitespace-nowrap"><Download size={10} /> Report Card</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#050505] flex flex-col custom-scrollbar">
         <main ref={printRef} className="flex-1 overflow-x-auto bg-[#050505] relative flex">
            <StickyLegend showAvg={showAvg} leaderContext={leaderContext} networkStats={networkStats} mostCommonVersion={mostCommonVersion} medianStorage={medianCommitted} leaderData={leaderData} />
            {selectedNodes.map((node, index) => (
                <NodeColumn key={node.pubkey} node={node} onRemove={() => removeNode(node.pubkey!)} anchorNode={selectedNodes[0]} color={NODE_COLORS[index % 5]} />
            ))}
            {selectedNodes.length < 5 && <EmptySlot onClick={() => setIsSearchOpen(true)} />}
            <div className="w-8 shrink-0"></div>
         </main>
         <Visualizer nodes={selectedNodes} colors={NODE_COLORS} />
      </div>

      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-3"><Search size={16} className="text-zinc-500" /><input autoFocus type="text" placeholder="Search node..." className="bg-transparent w-full text-sm text-white outline-none placeholder-zinc-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><button onClick={() => setIsSearchOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button></div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                      {searchResults.length > 0 ? searchResults.map(node => (
                          <button key={node.pubkey} onClick={() => addNode(node.pubkey!)} className="w-full text-left p-3 hover:bg-zinc-900 rounded-lg flex justify-between items-center group transition">
                              <div><div className="text-xs font-bold text-zinc-200 group-hover:text-white">{getSafeIp(node)}</div><div className="text-[10px] font-mono text-zinc-500">{node.pubkey?.slice(0, 16)}...</div></div><ArrowRight size={12} className="text-zinc-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100" />
                          </button>
                      )) : <div className="p-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest">{searchQuery ? 'No nodes found' : 'Type to search'}</div>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
