import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, 
  HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, 
  ArrowDown, Wallet, Medal, Twitter, Info, ExternalLink, HelpCircle, 
  Maximize2, Map as MapIcon, BookOpen, Menu, LayoutDashboard, 
  HeartPulse, Swords, Monitor, ArrowLeftRight, Camera, 
  ChevronLeft, FileJson, ClipboardCopy, RefreshCw, Share2, Plus, Link as LinkIcon, Minimize2, Image as ImageIcon, ArrowLeft,
  AlertOctagon 
} from 'lucide-react';

// --- TYPES ---
interface Node {
  address?: string;
  pubkey?: string;
  version?: string;
  uptime?: number;
  last_seen_timestamp?: number;
  is_public?: boolean;
  storage_used?: number;
  storage_committed?: number;
  storage_usage_percentage?: string;
  storage_usage_raw?: number;
  rank?: number;
  credits?: number | null; // Nullable for crashproof logic
  location?: { lat: number; lon: number; countryName: string; countryCode: string; city: string; };
  health?: number;
  healthBreakdown?: {
    uptime: number;
    version: number;
    reputation: number | null;
    storage: number;
  };
}

// --- SUB-COMPONENTS ---

const PhysicalLocationBadge = ({ node, zenMode }: { node: Node; zenMode: boolean }) => {
  const ip = node.address ? node.address.split(':')[0] : 'Unknown';
  const country = node.location?.countryName || 'Unknown Location';
  const code = node.location?.countryCode;

  return (
    <div className="flex items-center gap-2 font-mono text-sm mt-1">
      <span className={`font-bold transition-all duration-1000 ${zenMode ? 'text-blue-400' : 'text-cyan-400'} animate-pulse-glow text-shadow-neon`}>{ip}</span>
      <span className="text-zinc-600">|</span>
      <div className="flex items-center gap-2">
        {code && code !== 'XX' && <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="flag" className="w-5 h-auto rounded-sm shadow-sm" />}
        <span className="text-white font-bold tracking-wide">{country}</span>
      </div>
      <style jsx>{`.text-shadow-neon { text-shadow: 0 0 10px rgba(34,211,238,0.5); } .animate-pulse-glow { animation: pulse-glow 2s infinite; } @keyframes pulse-glow { 0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(34,211,238,0.5); } 50% { opacity: 0.8; text-shadow: 0 0 20px rgba(34,211,238,0.8); } }`}</style>
    </div>
  );
};

const ModalAvatar = ({ node }: { node: Node }) => {
  const code = node.location?.countryCode;
  if (code && code !== 'XX') {
    return (
      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden bg-zinc-900 relative group shrink-0">
        <img src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`} alt="country flag" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-500" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl shadow-lg border border-white/10 bg-gradient-to-br from-blue-600 to-purple-600 text-white shrink-0">
      {node.pubkey?.slice(0, 2) || '??'}
    </div>
  );
};

const RadialProgress = ({ score, size = 160, stroke = 12 }: { score: number, size?: number, stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'; 
    return (
        <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full drop-shadow-xl"><circle cx={size/2} cy={size/2} r={radius} stroke="#18181b" strokeWidth={stroke} fill="transparent" /><circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" /></svg>
            <div className="absolute flex flex-col items-center"><span className="text-4xl font-extrabold text-white tracking-tighter">{score}</span><span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Health Score</span></div>
        </div>
    );
};

const useTimeAgo = (timestamp: number | undefined) => { const [t, sT] = useState('Syncing...'); useEffect(() => { if(!timestamp) return; const u = () => { const n = Date.now(); const tm = timestamp < 10000000000 ? timestamp * 1000 : timestamp; const d = Math.floor((n-tm)/1000); if(d<60) sT(`${d}s ago`); else if(d<3600) sT(`${Math.floor(d/60)}m ago`); else sT(`${Math.floor(d/3600)}h ago`); }; u(); const i = setInterval(u, 1000); return () => clearInterval(i); }, [timestamp]); return t; };
const LiveWireLoader = () => (<div className="w-full h-1 relative overflow-hidden bg-zinc-900 border-b border-zinc-800"><div className="absolute inset-0 bg-blue-500/20 blur-[2px]"></div><div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }}></div></div>);
const PulseGraphLoader = () => { const [t, sT] = useState("Initializing Uplink..."); useEffect(() => { const x = ["Establishing Connection...", "Parsing Gossip Protocol...", "Syncing Node Storage...", "Decrypting Ledger..."]; let i=0; const n=setInterval(()=>{sT(x[i%x.length]);i++;},800); return ()=>clearInterval(n); },[]); return (<div className="flex flex-col items-center justify-center py-20 opacity-80"><div className="relative w-64 h-32 mb-6"><svg viewBox="0 0 300 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"><path d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50 L80,30 L90,70 L100,50 L150,50 L160,10 L170,90 L180,50 L220,50 L230,30 L240,70 L250,50 L300,50" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-graph" /><div className="absolute top-0 bottom-0 w-1 bg-white/50 blur-[1px] animate-scan-line"></div></svg></div><div className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">{t}</div><style jsx>{`.animate-draw-graph { stroke-dasharray: 400; stroke-dashoffset: 400; animation: draw 2s ease-in-out infinite; } .animate-scan-line { left: 0; animation: scan 2s ease-in-out infinite; } @keyframes draw { 0% { stroke-dashoffset: 400; opacity: 0; } 10% { opacity: 1; } 50% { stroke-dashoffset: 0; } 90% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } } @keyframes scan { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }`}</style></div>); };

// --- HELPERS ---
const getSafeIp = (node: Node | null) => node?.address ? node.address.split(':')[0] : 'Unknown IP';
const getSafeVersion = (node: Node | null) => node?.version || 'Unknown';
const formatBytes = (bytes: number | undefined) => { if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };
const formatUptime = (seconds: number | undefined) => { if (!seconds || isNaN(seconds)) return '0m'; const d = Math.floor(seconds / 86400); const h = Math.floor((seconds % 86400) / 3600); return d > 0 ? `${d}d ${h}h` : `${h}h`; };
const formatLastSeen = (timestamp: number | undefined) => { if (!timestamp || isNaN(timestamp)) return 'Never'; const now = Date.now(); const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp; const diff = now - time; if (diff < 1000) return 'Just now'; if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`; const mins = Math.floor(diff / 60000); if (mins < 60) return `${mins}m ago`; const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); return `${days}d ago`; };
const formatDetailedTimestamp = (timestamp: number | undefined) => { if (!timestamp || isNaN(timestamp)) return 'Never Seen'; const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp; return new Date(time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); };
const compareVersions = (v1: string = '0.0.0', v2: string = '0.0.0') => { const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number); const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number); for (let i = 0; i < Math.max(p1.length, p2.length); i++) { const n1 = p1[i] || 0; const n2 = p2[i] || 0; if (n1 > n2) return 1; if (n1 < n2) return -1; } return 0; };

export default function Home() {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sorting: Default to STORAGE
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('storage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Cycle: Default to 1 (Committed Storage)
  const [cycleStep, setCycleStep] = useState(1);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [networkStats, setNetworkStats] = useState({
    avgBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0, total: 0 },
    totalNodes: 0,
    systemStatus: { credits: true, rpc: true } 
  });
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [medianCommitted, setMedianCommitted] = useState(0);
  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [avgNetworkHealth, setAvgNetworkHealth] = useState(0);
  const [networkConsensus, setNetworkConsensus] = useState(0);
  const [lastSync, setLastSync] = useState<string>('Syncing...');
  const [searchTipIndex, setSearchTipIndex] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Node | null>(null);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const [shareMode, setShareMode] = useState(false);
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage' | 'identity'>('overview');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const proofRef = useRef<HTMLDivElement>(null);
  const timeAgo = useTimeAgo(selectedNode?.last_seen_timestamp);

  const searchTips = ["You can search by node IP, public key, version or country", "You can click on any node for detailed insights", "Use the map to visualize network topology", "Use STOINC Simulator to forecast earnings", "You can compare your node metric again this network leader", "Copy node url to share a direct link"];

  // Jump-to-View Logic
  useEffect(() => {
    let targetStep = -1;
    if (sortBy === 'storage') targetStep = 1; 
    else if (sortBy === 'health') targetStep = 2; 
    else if (sortBy === 'uptime') targetStep = 3; 
    if (targetStep !== -1) setCycleStep(targetStep);
  }, [sortBy]);

  // Main Loops
  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));
    const cycleInterval = setInterval(() => { setCycleStep((prev) => prev + 1); }, 5000);
    const tipInterval = setInterval(() => { if (!isSearchFocused) setSearchTipIndex((prev) => (prev + 1) % searchTips.length); }, 9000);
    const dataInterval = setInterval(fetchData, 30000);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => { clearInterval(cycleInterval); clearInterval(tipInterval); clearInterval(dataInterval); window.removeEventListener('scroll', handleScroll); };
  }, [isSearchFocused]);

  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
      const pubkeyToOpen = router.query.open as string;
      const targetNode = nodes.find((n) => n.pubkey === pubkeyToOpen);
      if (targetNode) { setSelectedNode(targetNode); setModalView('overview'); }
    }
  }, [loading, nodes, router.query.open]);

  // Data Fetching
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/stats?t=${Date.now()}`);
      if (res.data.result && res.data.result.pods) {
        let podList = res.data.result.pods as Node[];
        const stats = res.data.stats;
        if (stats) {
            setNetworkStats(stats);
            setMostCommonVersion(stats.consensusVersion || 'N/A');
            setAvgNetworkHealth(stats.avgBreakdown?.total || 0);
            setMedianCommitted(stats.medianStorage || 0);
        }

        // Percentage calc for UI
        podList = podList.map(node => { 
          const used = node.storage_used || 0; 
          const cap = node.storage_committed || 0; 
          let percentStr = "0%"; let rawPercent = 0; 
          if (cap > 0 && used > 0) { rawPercent = (used / cap) * 100; percentStr = rawPercent < 0.01 ? "< 0.01%" : `${rawPercent.toFixed(2)}%`; } 
          return { ...node, storage_usage_percentage: percentStr, storage_usage_raw: rawPercent }; 
        });

        setNodes(podList);
        const stableNodes = podList.filter(n => (n.uptime || 0) > 86400).length;
        setNetworkHealth((podList.length > 0 ? (stableNodes / podList.length) * 100 : 0).toFixed(2));
        const consensusCount = podList.filter(n => getSafeVersion(n) === stats.consensusVersion).length;
        setNetworkConsensus((consensusCount / podList.length) * 100);
        setTotalStorageCommitted(podList.reduce((sum, n) => sum + (n.storage_committed || 0), 0));
        setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setError('');
      }
    } catch (err: any) { console.error("Fetch error:", err); setError('Syncing latest network data...'); } finally { setLoading(false); }
  };

  // Helper Actions
  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    let newFavs = favorites.includes(address) ? favorites.filter(f => f !== address) : [...favorites, address];
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };
  const closeModal = () => { setSelectedNode(null); setCompareMode(false); setShareMode(false); setCompareTarget(null); setShowOpponentSelector(false); setModalView('overview'); setActiveTooltip(null); if (router.query.open) router.replace('/', undefined, { shallow: true }); };
  const handleGlobalClick = () => { if (activeTooltip) setActiveTooltip(null); };
  const handleCompareLink = () => { if (nodes.length > 0) { setSelectedNode(nodes[0]); setCompareMode(true); setIsMenuOpen(false); } };
  const handleCardToggle = (view: 'health' | 'storage' | 'identity') => { modalView === view ? setModalView('overview') : setModalView(view); };
  const toggleTooltip = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setActiveTooltip(activeTooltip === id ? null : id); };
  const copyToClipboard = (text: string, fieldId?: string) => { navigator.clipboard.writeText(text); if(fieldId){ setCopiedField(fieldId); setTimeout(() => setCopiedField(null), 2000); }};
  const copyRawJson = (node: Node) => { copyToClipboard(JSON.stringify(node, null, 2), 'json'); };
  const copyStatusReport = (node: Node) => { const health = node.health || 0; const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address || 'Unknown'}\nStatus: ${(node.uptime || 0) > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${health}/100\nMonitor at: https://xandeum-pulse.vercel.app`; copyToClipboard(report, 'report'); };
  const shareToTwitter = (node: Node) => { const health = node.health || 0; const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${(node.uptime || 0) > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${health}/100\n💰 Credits: ${node.credits !== null ? node.credits.toLocaleString() : 'N/A'}\n\nMonitor here:`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://xandeum-pulse.vercel.app")}`, '_blank'); };
  const copyNodeUrl = (e: React.MouseEvent, pubkey: string) => { e.stopPropagation(); const url = `${window.location.origin}/?open=${pubkey}`; copyToClipboard(url, 'url'); };
  const exportCSV = () => { const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Health_Score,Country,Last_Seen_ISO\n'; const rows = filteredNodes.map(n => { return `${getSafeIp(n)},${n.pubkey || 'Unknown'},${n.rank},${n.credits ?? 'NULL'},${getSafeVersion(n)},${n.uptime},${n.storage_committed},${n.storage_used},${n.health},${n.location?.countryName},${new Date(n.last_seen_timestamp || 0).toISOString()}`; }); const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `xandeum_pulse_export_${new Date().toISOString().split('T')[0]}.csv`; a.click(); };
  const handleDownloadProof = async () => { if (proofRef.current === null) return; try { const dataUrl = await toPng(proofRef.current, { cacheBust: true, backgroundColor: '#09090b' }); const link = document.createElement('a'); link.download = `xandeum-proof-${selectedNode?.pubkey?.slice(0,6) || 'node'}.png`; link.href = dataUrl; link.click(); } catch (err) { console.error("Failed to generate proof", err); } };

  // Filter & Sort
  const filteredNodes = nodes.filter(node => { const q = searchQuery.toLowerCase(); const addr = getSafeIp(node).toLowerCase(); const pub = (node.pubkey || '').toLowerCase(); const ver = (node.version || '').toLowerCase(); const country = (node.location?.countryName || '').toLowerCase(); return (addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q)); }).sort((a, b) => { let valA: any, valB: any; if (sortBy === 'storage') { valA = a.storage_committed || 0; valB = b.storage_committed || 0; } else if (sortBy === 'health') { valA = a.health || 0; valB = b.health || 0; } else { valA = (a as any)[sortBy]; valB = (b as any)[sortBy]; } if (sortBy === 'version') return sortOrder === 'asc' ? compareVersions(a.version || '0.0.0', b.version || '0.0.0') : compareVersions(b.version || '0.0.0', a.version || '0.0.0'); return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1); });
  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  // Cycle Logic (5 Steps)
  const getCycleContent = (node: Node) => {
    const step = cycleStep % 5;
    if (step === 0) return { label: 'Storage Used', value: formatBytes(node.storage_used), color: zenMode ? 'text-zinc-300' : 'text-blue-400', icon: Database };
    if (step === 1) return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: zenMode ? 'text-zinc-300' : 'text-purple-400', icon: HardDrive };
    if (step === 2) { const score = node.health || 0; return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity }; }
    if (step === 3) return { label: 'Continuous Uptime', value: formatUptime(node.uptime), color: 'text-orange-400', icon: Zap };
    return { label: 'Last Seen', value: formatLastSeen(node.last_seen_timestamp), color: 'text-zinc-400', icon: Clock };
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node);
    const isFav = favorites.includes(node.address || '');
    const isVersionSort = sortBy === 'version';
    const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
    const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
    const isLatest = cleanVer === cleanConsensus; 

    return (
      <div key={node.address || i} onClick={() => { setSelectedNode(node); setModalView('overview'); }} className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${zenMode ? 'bg-black border-zinc-800 hover:border-zinc-600' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'}`}>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">View Details <Maximize2 size={8} /></div>
        <div className="mb-4 flex justify-between items-start">
            <div><div className="flex items-center gap-2 mb-1"><div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>{!node.is_public && <Shield size={10} className="text-zinc-600" />}</div><div className="font-mono text-sm text-zinc-300 truncate w-56">{node.pubkey?.slice(0,16)}...</div></div>
            <button onClick={(e) => toggleFavorite(e, node.address || '')} className={`p-1.5 rounded-full transition ${isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-yellow-500'}`}><Star size={16} fill={isFav ? "currentColor" : "none"} /></button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Version</span>
            <span className={`px-2 py-0.5 rounded transition-all duration-500 ${isVersionSort ? 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-zinc-900 border' : 'text-zinc-300 bg-zinc-800'}`}>{node.version || 'Unknown'} {isLatest && <CheckCircle size={10} className="inline text-green-500 ml-1"/>}</span>
          </div>
          <div className="pt-2">
            <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Network Rewards</div>
            <div className="flex justify-between items-center text-xs p-2 rounded-lg border bg-black/40 border-zinc-800/50">
               {/* CRASHPROOF UI: Check Null Credits */}
               {node.credits !== null ? (
                   <>
                       <div className="flex items-center gap-1.5"><Medal size={12} className={node.rank===1?'text-yellow-400':'text-zinc-500'} /><span className="text-zinc-400 font-bold">#{node.rank}</span></div>
                       <div className="flex items-center gap-1.5"><span className="text-zinc-300 font-mono">{node.credits.toLocaleString()}</span><Wallet size={12} className="text-yellow-600"/></div>
                   </>
               ) : (
                   <div className="flex items-center gap-2 text-red-400 w-full justify-center font-bold italic text-[10px]"><AlertOctagon size={12}/> CREDITS API OFFLINE</div>
               )}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-end">
            <div><span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1"><cycleData.icon size={10} /> {cycleData.label}</span><span className={`text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>{cycleData.value}</span></div>
          </div>
        </div>
      </div>
    );
  };

  const renderZenCard = (node: Node) => {
    const isVersionSort = sortBy === 'version';
    return (
      <div key={node.address || node.pubkey} onClick={() => { setSelectedNode(node); setModalView('overview'); }} className="group relative border border-zinc-800 bg-black/50 hover:border-zinc-600 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
          <div><div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">NODE ID</div><div className="font-mono text-sm text-zinc-300 truncate w-32 md:w-48">{node.pubkey || 'Unknown'}</div><div className="text-[10px] text-zinc-600 font-mono mt-0.5">{getSafeIp(node)}</div></div>
          <div className={`text-xl font-bold ${node.health && node.health >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{node.health}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Storage</div><div className="font-mono text-zinc-300">{formatBytes(node.storage_used)}</div><div className="w-full h-1 bg-zinc-900 rounded-full mt-1"><div className="h-full bg-zinc-600" style={{ width: node.storage_usage_percentage }}></div></div></div>
          <div><div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Uptime</div><div className="font-mono text-orange-400">{formatUptime(node.uptime)}</div></div>
          <div><div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Version</div><div className={`font-mono flex items-center gap-2 ${isVersionSort ? 'text-cyan-400 animate-pulse' : 'text-zinc-300'}`}>{node.version}</div></div>
          <div><div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Rank</div><div className="font-mono text-yellow-600">#{node.rank || '-'}</div></div>
        </div>
      </div>
    );
  };

  // --- IDENTITY DETAILS (With Uptime & Red Back) ---
  const renderIdentityDetails = () => {
    const details = [
      { label: 'Public Key', val: selectedNode?.pubkey || 'Unknown' },
      { label: 'RPC Endpoint', val: `http://${getSafeIp(selectedNode)}:6000` },
      { label: 'IP Address', val: getSafeIp(selectedNode) },
      { label: 'Node Version', val: getSafeVersion(selectedNode) },
      { label: 'Current Uptime', val: formatUptime(selectedNode?.uptime), color: 'text-orange-400' },
    ];
    return (
      <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${zenMode ? 'text-zinc-200' : 'text-zinc-500'}`}><Shield size={14} /> IDENTITY & STATUS</h3>
          <button onClick={() => setModalView('overview')} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"><ArrowLeft size={10} /> BACK</button>
        </div>
        <div className="space-y-4 flex-grow">
          {details.map((d) => (
            <div key={d.label} className={`p-4 rounded-xl border ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`}>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{d.label}</div>
              <div className="flex items-center justify-between"><code className={`text-sm font-mono truncate ${d.color || (zenMode ? 'text-zinc-300' : 'text-zinc-200')}`}>{d.val}</code><button onClick={() => copyToClipboard(d.val)} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"><Copy size={12} /></button></div>
            </div>
          ))}
          {/* Version Status Pill */}
          <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${getSafeVersion(selectedNode) === mostCommonVersion ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            {getSafeVersion(selectedNode) === mostCommonVersion ? <CheckCircle size={20} className="text-green-500" /> : <AlertTriangle size={20} className="text-orange-500" />}
            <div>
              <div className={`text-xs font-bold ${getSafeVersion(selectedNode) === mostCommonVersion ? 'text-green-400' : 'text-orange-400'}`}>{getSafeVersion(selectedNode) === mostCommonVersion ? 'Node is Up to Date' : 'Update Recommended'}</div>
              <div className="text-[10px] text-zinc-500">Current consensus version is <span className="font-mono text-zinc-300">{mostCommonVersion}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${zenMode ? 'bg-black text-zinc-300' : 'bg-[#09090b] text-zinc-100'}`} onClick={handleGlobalClick}>
      <Head><title>Xandeum Pulse</title></Head>
      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      {/* --- HEADER --- */}
      <header className={`sticky top-0 z-[100] backdrop-blur-md border-b px-6 py-4 flex flex-col gap-6 transition-all duration-500 ${zenMode ? 'bg-black/90 border-zinc-800' : 'bg-[#09090b]/90 border-zinc-800'}`}>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4"><button onClick={() => setIsMenuOpen(true)} className="p-3.5 rounded-xl text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white"><Menu size={28}/></button><div className="hidden md:flex flex-col"><h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white"><Activity className="text-blue-500" /> PULSE</h1><span className="text-[9px] text-zinc-600 font-mono tracking-wider ml-1">Last Sync: {lastSync}</span></div></div>
            <div className="flex-1 max-w-xl mx-4 relative group flex flex-col items-center">
                 <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg py-2 pl-4 pr-4 text-sm outline-none bg-transparent border border-zinc-800 text-white focus:border-blue-500" />
            </div>
            <button onClick={() => setZenMode(!zenMode)} className="p-2 rounded-lg text-red-500 border border-red-500/20"><Monitor size={18}/></button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['uptime', 'storage', 'version', 'health'].map(id => (
                <button key={id} onClick={() => setSortBy(id as any)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border whitespace-nowrap ${sortBy === id ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{id.toUpperCase()}</button>
            ))}
          </div>
      </header>

      {/* --- MAIN --- */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:gap-8 pb-20 mt-6">
            {nodes.filter(n => n.pubkey?.toLowerCase().includes(searchQuery.toLowerCase()) || n.address?.includes(searchQuery)).map((node, i) => renderNodeCard(node, i))}
        </div>
      </main>

      {/* --- MOBILE OPTIMIZED MODAL --- */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className={`border w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${zenMode ? 'bg-black border-zinc-800' : 'bg-[#09090b] border-zinc-800'}`} onClick={(e) => e.stopPropagation()}>
            {/* 1. COMPACT HEADER */}
            <div className={`shrink-0 p-4 md:p-6 border-b flex justify-between items-start ${zenMode ? 'bg-black' : 'bg-zinc-900/50'}`}>
              <div className="flex items-center gap-3 md:gap-4">
                <ModalAvatar node={selectedNode} />
                <div className="min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <h2 className="text-lg md:text-2xl font-black font-sans tracking-tight text-white mb-0.5 truncate">NODE INSPECTOR</h2>
                    <button onClick={(e) => toggleFavorite(e, selectedNode.address || '')} className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border transition w-fit ${favorites.includes(selectedNode.address||'') ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      <Star size={14} className={favorites.includes(selectedNode.address||'') ? 'fill-yellow-500' : ''}/>
                      <span className="text-[10px] md:text-xs font-bold uppercase leading-none">{favorites.includes(selectedNode.address||'') ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                    <span className="truncate max-w-[150px] md:max-w-none">{selectedNode.pubkey}</span>
                    <Copy size={10} className="cursor-pointer" onClick={() => copyToClipboard(selectedNode.pubkey||'')}/>
                  </div>
                  <div className="mt-1"><span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${selectedNode.is_public ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>{selectedNode.is_public ? 'STORAGE INDEXED' : 'STORAGE NOT INDEXED'}</span></div>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500"><X size={20}/></button>
            </div>

            {/* 2. SCROLLABLE CONTENT (WITH FOOTER) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative flex flex-col">
               {modalView !== 'overview' && (
                 <button onClick={() => setModalView('overview')} className="mb-4 text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800 w-fit"><ArrowLeft size={12} /> BACK TO OVERVIEW</button>
               )}
               {/* Content Switcher */}
               {modalView === 'identity' ? renderIdentityDetails() : (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                       <div className="md:col-span-1"><div onClick={() => handleCardToggle('health')} className="h-64 p-6 rounded-3xl border bg-zinc-900 border-zinc-800 cursor-pointer hover:border-green-500/50 transition flex flex-col items-center justify-between"><div className="w-full text-[10px] font-bold text-zinc-500">DIAGNOSTICS</div><RadialProgress score={selectedNode.health || 0}/></div></div>
                       <div className="md:col-span-1"><div onClick={() => handleCardToggle('storage')} className="h-64 p-6 rounded-3xl border bg-zinc-900 border-zinc-800 cursor-pointer hover:border-purple-500/50 transition flex flex-col justify-between"><div className="text-[10px] font-bold text-zinc-500">STORAGE</div><div className="text-3xl font-mono text-purple-400 font-bold">{formatBytes(selectedNode.storage_committed)}</div></div></div>
                       <div className="md:col-span-1"><div onClick={() => handleCardToggle('identity')} className="h-64 p-6 rounded-3xl border bg-zinc-900 border-zinc-800 cursor-pointer hover:border-blue-500/50 transition flex flex-col justify-between"><div className="text-[10px] font-bold text-zinc-500">IDENTITY</div><div className="text-xl font-mono text-white">{selectedNode.version}</div></div></div>
                   </div>
               )}

               {/* 3. IN-FLOW FOOTER (Fixed for Mobile) */}
               {!compareMode && !shareMode && (
                <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col gap-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-zinc-800/50">
                      <Clock size={10} /> Last Seen: <span className="text-zinc-300 font-mono">{timeAgo}</span>
                    </div>
                    <button onClick={(e) => copyNodeUrl(e, selectedNode.pubkey || '')} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400 transition group">
                      <LinkIcon size={12} /> {copiedField === 'url' ? 'LINK COPIED' : 'COPY NODE URL'}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setCompareMode(true)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition hover:scale-[1.02] border border-zinc-700"><Swords size={16} className="text-red-400" /> COMPARE NODES</button>
                    <button onClick={() => setShareMode(true)} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition hover:scale-[1.02] shadow-lg shadow-blue-900/20"><Camera size={16} /> PROOF OF PULSE</button>
                  </div>
                </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
