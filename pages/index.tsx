import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, 
  HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, 
  ArrowDown, Wallet, Medal, Twitter, Info, ExternalLink, HelpCircle, 
  Maximize2, Map as MapIcon, BookOpen, Menu, LayoutDashboard, 
  HeartPulse, Swords, Monitor, ArrowLeftRight, Camera, 
  ChevronLeft, FileJson, ClipboardCopy, RefreshCw, Share2, Plus, Share, Link as LinkIcon
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
  credits?: number;
  location?: { lat: number; lon: number; countryName: string; countryCode: string; city: string; };
  health?: number;
}

// --- SUB-COMPONENTS ---

const PhysicalLocationBadge = ({ node, zenMode }: { node: Node, zenMode: boolean }) => {
    const ip = node.address ? node.address.split(':')[0] : 'Unknown';
    const country = node.location?.countryName || 'Unknown Location';
    const code = node.location?.countryCode;
    
    return (
        <div className="flex items-center gap-2 font-mono text-sm mt-1">
            <span className={`font-bold transition-all duration-1000 ${zenMode ? 'text-blue-400' : 'text-cyan-400'} animate-pulse-glow text-shadow-neon`}>
                {ip}
            </span>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-2">
                {code && code !== 'XX' && (
                    <img 
                        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} 
                        alt="flag" 
                        className="w-5 h-auto rounded-sm shadow-sm"
                    />
                )}
                <span className="text-white font-bold tracking-wide">
                    {country}
                </span>
            </div>
            <style jsx>{`
                .text-shadow-neon { text-shadow: 0 0 10px rgba(34,211,238,0.5); }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(34,211,238,0.5); }
                    50% { opacity: 0.8; text-shadow: 0 0 20px rgba(34,211,238,0.8); }
                }
                .animate-pulse-glow { animation: pulse-glow 2s infinite; }
            `}</style>
        </div>
    );
};

const ModalAvatar = ({ node }: { node: Node }) => {
    const code = node.location?.countryCode;
    
    if (code && code !== 'XX') {
        return (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden bg-zinc-900 relative group">
                <img 
                    src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`} 
                    alt="country flag" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-500"
                />
            </div>
        );
    }
    
    return (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg border border-white/10 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            {node.pubkey?.slice(0, 2) || '??'}
        </div>
    );
};

// --- HOOKS ---
const useTimeAgo = (timestamp: number | undefined) => {
    const [timeAgo, setTimeAgo] = useState('Syncing...');
    useEffect(() => {
        if (!timestamp) return;
        const update = () => {
            const now = Date.now();
            const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            const diff = Math.floor((now - time) / 1000); 
            if (diff < 60) setTimeAgo(`${diff} second${diff !== 1 ? 's' : ''} ago`);
            else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`);
            else setTimeAgo(`${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [timestamp]);
    return timeAgo;
};

// --- HELPERS ---
const getSafeIp = (node: Node | null) => node?.address ? node.address.split(':')[0] : 'Unknown IP';
const getSafeVersion = (node: Node | null) => node?.version || 'Unknown';

const formatBytes = (bytes: number | undefined) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number | undefined) => {
  if (!seconds || isNaN(seconds)) return '0m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
};

const formatLastSeen = (timestamp: number | undefined) => {
  if (!timestamp || isNaN(timestamp)) return 'Never';
  const now = Date.now();
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const diff = now - time;
  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`; 
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDetailedTimestamp = (timestamp: number | undefined) => {
  if (!timestamp || isNaN(timestamp)) return 'Never Seen';
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  return new Date(time).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
};

const compareVersions = (v1: string = '0.0.0', v2: string = '0.0.0') => {
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// --- VISUAL COMPONENTS ---
const RadialProgress = ({ score, size = 160, stroke = 12 }: { score: number, size?: number, stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'; 

    return (
        <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
                <circle cx={size/2} cy={size/2} r={radius} stroke="#18181b" strokeWidth={stroke} fill="transparent" />
                <circle 
                    cx={size/2} cy={size/2} r={radius} 
                    stroke={color} strokeWidth={stroke} fill="transparent" 
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white tracking-tighter">{score}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Vitality</span>
            </div>
        </div>
    );
};

const LiveWireLoader = () => (
  <div className="w-full h-1 relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
    <div className="absolute inset-0 bg-blue-500/20 blur-[2px]"></div>
    <div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }}></div>
  </div>
);

const PulseGraphLoader = () => {
  const [text, setText] = useState("Initializing Uplink...");
  useEffect(() => {
    const texts = ["Establishing Connection...", "Parsing Gossip Protocol...", "Syncing Node Storage...", "Decrypting Ledger..."];
    let i = 0;
    const interval = setInterval(() => { setText(texts[i % texts.length]); i++; }, 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-80">
        <div className="relative w-64 h-32 mb-6">
            <svg viewBox="0 0 300 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <path d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50 L80,30 L90,70 L100,50 L150,50 L160,10 L170,90 L180,50 L220,50 L230,30 L240,70 L250,50 L300,50" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-graph" />
            </svg>
            <div className="absolute top-0 bottom-0 w-1 bg-white/50 blur-[1px] animate-scan-line"></div>
        </div>
        <div className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">{text}</div>
        <style jsx>{`
            .animate-draw-graph { stroke-dasharray: 400; stroke-dashoffset: 400; animation: draw 2s ease-in-out infinite; }
            .animate-scan-line { left: 0; animation: scan 2s ease-in-out infinite; }
            @keyframes draw { 0% { stroke-dashoffset: 400; opacity: 0; } 10% { opacity: 1; } 50% { stroke-dashoffset: 0; } 90% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
            @keyframes scan { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        `}</style>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('uptime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UX STATE
  const [searchTipIndex, setSearchTipIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null); 
  const searchTips = [
    "You can search by node IP, public key, version or country",
    "You can click on any node for detailed insights",
    "Use the map to visualize network topology",
    "Use STOINC Simulator to forecast earnings and plan storage before you buy",
    "You can compare your node metrics against the network leader",
    "Copy node URL to share a direct link to your diagnostics, reputation or topology"
  ];

  // MODAL STATES
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Node | null>(null);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [compareSearch, setCompareSearch] = useState(''); 
  const [shareMode, setShareMode] = useState(false);
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage' | 'identity'>('overview'); 
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null); 
  const [cycleStep, setCycleStep] = useState(0);

  // GLOBAL STATES
  const [zenMode, setZenMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // NETWORK DATA
  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [avgNetworkHealth, setAvgNetworkHealth] = useState(0); 
  const [networkConsensus, setNetworkConsensus] = useState(0); 
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [medianCommitted, setMedianCommitted] = useState(0);
  const [medianCredits, setMedianCredits] = useState(0);

  // --- HOOKS ---
  const timeAgo = useTimeAgo(selectedNode?.last_seen_timestamp);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const cycleInterval = setInterval(() => { setCycleStep(prev => prev + 1); }, 4000);
    const tipInterval = setInterval(() => {
        if (!isSearchFocused) setSearchTipIndex(prev => (prev + 1) % searchTips.length);
    }, 15000);
    const dataInterval = setInterval(fetchData, 30000);
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeModal(); } };
    document.addEventListener('keydown', handleEscape);

    return () => {
        clearInterval(cycleInterval);
        clearInterval(tipInterval);
        clearInterval(dataInterval);
        document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchFocused]);

  // Sync Modal with URL
  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
        const pubkeyToOpen = router.query.open as string;
        const targetNode = nodes.find(n => n.pubkey === pubkeyToOpen);
        if (targetNode) {
            setSelectedNode(targetNode);
            setModalView('overview'); 
        }
    }
  }, [loading, nodes, router.query.open]);

  const closeModal = () => {
      setSelectedNode(null);
      setCompareMode(false);
      setShareMode(false);
      setCompareTarget(null);
      setShowOpponentSelector(false);
      setModalView('overview');
      setActiveTooltip(null);
      if (router.query.open) router.replace('/', undefined, { shallow: true });
  };

  const handleGlobalClick = () => {
      if (activeTooltip) setActiveTooltip(null);
  };

  const handleCompareLink = () => {
      if (nodes.length > 0) {
          setSelectedNode(nodes[0]);
          setCompareMode(true);
          setIsMenuOpen(false);
      }
  };

  const handleCardToggle = (view: 'health' | 'storage' | 'identity') => {
      if (modalView === view) {
          setModalView('overview');
      } else {
          setModalView(view);
      }
  };

  const toggleTooltip = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveTooltip(activeTooltip === id ? null : id);
  };

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(address)) newFavs = favorites.filter(f => f !== address);
    else newFavs = [...favorites, address];
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyRawJson = (node: Node) => {
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    setCopiedField('json');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyStatusReport = (node: Node) => {
    const health = node.health || 0;
    const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address || 'Unknown'}\nStatus: ${(node.uptime || 0) > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${health}/100\nMonitor at: https://xandeum-pulse.vercel.app`;
    navigator.clipboard.writeText(report);
    setCopiedField('report');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const health = node.health || 0;
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${(node.uptime || 0) > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${health}/100\n💰 Credits: ${node.credits?.toLocaleString() || 0}\n\nMonitor here:`;
    const url = "https://xandeum-pulse.vercel.app";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyNodeUrl = (e: React.MouseEvent, pubkey: string) => { 
      e.stopPropagation(); 
      const url = `${window.location.origin}/?open=${pubkey}`; 
      navigator.clipboard.writeText(url); 
      setCopiedField('url'); 
      setTimeout(() => setCopiedField(null), 2000); 
  };

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Utilization_Percent,Health_Score,Country,Last_Seen_ISO,Is_Favorite\n';
    const rows = filteredNodes.map(n => {
        const health = n.health || 0;
        const utilization = n.storage_usage_percentage?.replace('%', '') || '0';
        const country = n.location?.countryName || 'Unknown';
        const isoTime = new Date(n.last_seen_timestamp || Date.now()).toISOString();
        return `${getSafeIp(n)},${n.pubkey || 'Unknown'},${n.rank},${n.credits},${getSafeVersion(n)},${n.uptime},${n.storage_committed},${n.storage_used},${utilization},${health},${country},${isoTime},${favorites.includes(n.address || '')}`;
    });
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/stats?t=${Date.now()}`);
      
      if (res.data.result && res.data.result.pods) {
        let podList: Node[] = res.data.result.pods;
        const stats = res.data.stats;

        podList = podList.map(node => {
            const used = node.storage_used || 0;
            const cap = node.storage_committed || 0;
            let percentStr = "0%";
            let rawPercent = 0;
            if (cap > 0 && used > 0) {
                rawPercent = (used / cap) * 100;
                percentStr = rawPercent < 0.01 ? "< 0.01%" : `${rawPercent.toFixed(2)}%`;
            }
            return { ...node, storage_usage_percentage: percentStr, storage_usage_raw: rawPercent };
        });

        setNodes(podList);
        
        setMostCommonVersion(stats.consensusVersion || '0.0.0');
        setMedianCredits(stats.medianCredits || 0);
        
        const stableNodes = podList.filter(n => (n.uptime || 0) > 86400).length;
        setNetworkHealth((podList.length > 0 ? (stableNodes / podList.length) * 100 : 0).toFixed(2));
        
        const consensusCount = podList.filter(n => getSafeVersion(n) === stats.consensusVersion).length;
        setNetworkConsensus((consensusCount / podList.length) * 100);

        setTotalStorageCommitted(podList.reduce((sum, n) => sum + (n.storage_committed || 0), 0));
        
        const sumHealth = podList.reduce((acc, n) => acc + (n.health || 0), 0);
        setAvgNetworkHealth(Math.round(sumHealth / podList.length));

        const commitedArr = podList.map(n => n.storage_committed || 0).sort((a,b) => a-b);
        const mid = Math.floor(commitedArr.length / 2);
        setMedianCommitted(commitedArr.length ? commitedArr[mid] : 0);

        setError('');
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError('Syncing latest network data...'); 
    } finally {
        setLoading(false);
    }
  };

  const filteredNodes = nodes
    .filter(node => {
      const q = searchQuery.toLowerCase();
      const addr = getSafeIp(node).toLowerCase();
      const pub = (node.pubkey || '').toLowerCase();
      const ver = (node.version || '').toLowerCase();
      const country = (node.location?.countryName || '').toLowerCase(); 

      return (addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q));
    })
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortBy === 'storage') { valA = a.storage_committed || 0; valB = b.storage_committed || 0; } 
      else if (sortBy === 'health') { valA = a.health || 0; valB = b.health || 0; }
      else { valA = a[sortBy] as any; valB = b[sortBy] as any; }
      
      if (sortBy === 'version') return sortOrder === 'asc' ? compareVersions(a.version || '0.0.0', b.version || '0.0.0') : compareVersions(b.version || '0.0.0', a.version || '0.0.0');
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  const isLatest = (nodeVersion: string) => { return mostCommonVersion !== 'N/A' && compareVersions(nodeVersion, mostCommonVersion) >= 0; };

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 4;
    if (step === 0) return { label: 'Storage Used', value: formatBytes(node.storage_used), color: zenMode ? 'text-zinc-300' : 'text-blue-400', icon: Database };
    if (step === 1) return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: zenMode ? 'text-zinc-300' : 'text-purple-400', icon: HardDrive };
    if (step === 2) {
      const score = node.health || 0;
      return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity };
    }
    return { label: 'Last Seen', value: formatLastSeen(node.last_seen_timestamp), color: 'text-zinc-400', icon: Clock };
  };

  const handleNodeClick = (node: Node) => {
      setSelectedNode(node);
      setCompareMode(false);
      setShareMode(false);
      setCompareTarget(null);
      setModalView('overview'); 
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address || '');
    const latest = isLatest(getSafeVersion(node));
    const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' 
        ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` 
        : null;
    
    return (
      <div 
        key={node.address || i} 
        onClick={() => handleNodeClick(node)}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl 
        ${zenMode 
            ? 'bg-black border-zinc-800 hover:border-zinc-600' 
            : isFav ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
        }`}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
            View Details <Maximize2 size={8} />
        </div>
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>
                {!node.is_public && <Shield size={10} className="text-zinc-600" />}
              </div>
              <div className="relative h-6 w-56">
                  <div className={`absolute inset-0 font-mono text-sm truncate transition-opacity duration-300 group-hover:opacity-0 ${zenMode ? 'text-zinc-300' : 'text-zinc-300'}`}>
                    {(node.pubkey || '').length > 12 ? `${(node.pubkey || '').slice(0, 12)}...${(node.pubkey || '').slice(-4)}` : (node.pubkey || 'Unknown Identity')}
