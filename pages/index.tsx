import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  Search,
  Download,
  Server,
  Activity,
  Database,
  X,
  Shield,
  Clock,
  Zap,
  Trophy,
  HardDrive,
  Star,
  Copy,
  Check,
  CheckCircle,
  Globe,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Wallet,
  Medal,
  Twitter,
  Info,
  ExternalLink,
  HelpCircle,
  Maximize2,
  Map as MapIcon,
  BookOpen,
  Menu,
  LayoutDashboard,
  HeartPulse,
  Swords,
  Monitor,
  ArrowLeftRight,
  Camera,
  ChevronLeft,
  FileJson,
  ClipboardCopy,
  RefreshCw,
  Share2,
  Plus,
  Link as LinkIcon,
  Minimize2,
  Image as ImageIcon,
  ArrowLeft,
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
  credits: number | null; // Nullable
  location?: {
    lat: number;
    lon: number;
    countryName: string;
    countryCode: string;
    city: string;
  };
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
      <span
        className={`font-bold transition-all duration-1000 ${
          zenMode ? 'text-blue-400' : 'text-cyan-400'
        } animate-pulse-glow text-shadow-neon`}
      >
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
        <span className="text-white font-bold tracking-wide">{country}</span>
      </div>
      <style jsx>{`
        .text-shadow-neon {
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

const ModalAvatar = ({ node }: { node: Node }) => {
  const code = node.location?.countryCode;

  if (code && code !== 'XX') {
    return (
      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden bg-zinc-900 relative group shrink-0">
        <img
          src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
          alt="country flag"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-500"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl shadow-lg border border-white/10 bg-gradient-to-br from-blue-600 to-purple-600 text-white shrink-0">
      {node.pubkey?.slice(0, 2) || '??'}
    </div>
  );
};

const RadialProgress = ({
  score,
  size = 160,
  stroke = 12,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#18181b"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-white tracking-tighter">{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">
          Health Score
        </span>
      </div>
    </div>
  );
};

const LiveWireLoader = () => (
  <div className="w-full h-1 relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
    <div className="absolute inset-0 bg-blue-500/20 blur-[2px]"></div>
    <div
      className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer"
      style={{ animationDuration: '1.5s' }}
    ></div>
  </div>
);

const PulseGraphLoader = () => {
  const [text, setText] = useState('Initializing Uplink...');

  useEffect(() => {
    const texts = [
      'Establishing Connection...',
      'Parsing Gossip Protocol...',
      'Syncing Node Storage...',
      'Decrypting Ledger...',
    ];
    let i = 0;

    const interval = setInterval(() => {
      setText(texts[i % texts.length]);
      i++;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-80">
      <div className="relative w-64 h-32 mb-6">
        <svg viewBox="0 0 300 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          <path
            d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50 L80,30 L90,70 L100,50 L150,50 L160,10 L170,90 L180,50 L220,50 L230,30 L240,70 L250,50 L300,50"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-graph"
          />
          <div className="absolute top-0 bottom-0 w-1 bg-white/50 blur-[1px] animate-scan-line"></div>
        </svg>
      </div>
      <div className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">{text}</div>
      <style jsx>{`
        .animate-draw-graph {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw 2s ease-in-out infinite;
        }
        .animate-scan-line {
          left: 0;
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes draw {
          0% {
            stroke-dashoffset: 400;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
          }
          90% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }
        @keyframes scan {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// --- HELPER FUNCTIONS ---

const useTimeAgo = (timestamp: number | undefined) => {
  const [timeAgo, setTimeAgo] = useState('Syncing...');

  useEffect(() => {
    if (!timestamp) return;

    const update = () => {
      const now = Date.now();
      const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      const diff = Math.floor((now - time) / 1000);

      if (diff < 60) {
        setTimeAgo(`${diff} second${diff !== 1 ? 's' : ''} ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
};

const getSafeIp = (node: Node | null) => {
  return node?.address ? node.address.split(':')[0] : 'Unknown IP';
};

const getSafeVersion = (node: Node | null) => {
  return node?.version || 'Unknown';
};

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
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

// --- MAIN COMPONENT ---

export default function Home() {
  const router = useRouter();
  
  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sorting: Default to STORAGE
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('storage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Cycle: Default to 1 (Committed Storage)
  const [cycleStep, setCycleStep] = useState(1);

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Network Stats
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

  // Modal State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Node | null>(null);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const [shareMode, setShareMode] = useState(false);
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage' | 'identity'>('overview');
  
  // User Prefs
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const proofRef = useRef<HTMLDivElement>(null);
  const timeAgo = useTimeAgo(selectedNode?.last_seen_timestamp);

  const searchTips = [
    "You can search by node IP, public key, version or country",
    "You can click on any node for detailed insights",
    "Use the map to visualize network topology",
    "Use STOINC Simulator to forecast earnings",
    "You can compare your node metric again this network leader",
    "Copy node url to share a direct link"
  ];

  // --- EFFECTS ---

  // Jump-to-View Logic for Cycle
  useEffect(() => {
    let targetStep = -1;
    if (sortBy === 'storage') targetStep = 1; 
    else if (sortBy === 'health') targetStep = 2; 
    else if (sortBy === 'uptime') targetStep = 3; 
    
    if (targetStep !== -1) {
        setCycleStep(targetStep);
    }
  }, [sortBy]);

  // Main Event Loops
  useEffect(() => {
    fetchData();
    
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));
    
    const cycleInterval = setInterval(() => {
      setCycleStep((prev) => prev + 1);
    }, 5000);
    
    const tipInterval = setInterval(() => {
      if (!isSearchFocused) {
        setSearchTipIndex((prev) => (prev + 1) % searchTips.length);
      }
    }, 9000);
    
    const dataInterval = setInterval(fetchData, 30000);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(cycleInterval);
      clearInterval(tipInterval);
      clearInterval(dataInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSearchFocused]);

  // Deep Linking
  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
      const pubkeyToOpen = router.query.open as string;
      const targetNode = nodes.find((n) => n.pubkey === pubkeyToOpen);
      if (targetNode) {
        setSelectedNode(targetNode);
        setModalView('overview');
      }
    }
  }, [loading, nodes, router.query.open]);

  // --- HELPER FOR LATEST CHECK ---
  const checkIsLatest = (nodeVersion: string | null | undefined) => {
    const cleanVer = (nodeVersion || '').replace(/[^0-9.]/g, '');
    const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
    // Simple semantic check: if cleaned strings match, it's latest.
    // Also using compareVersions to catch newer versions.
    return cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;
  };

  // --- DATA FETCHING ---

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
          let percentStr = "0%";
          let rawPercent = 0; 
          
          if (cap > 0 && used > 0) {
            rawPercent = (used / cap) * 100;
            percentStr = rawPercent < 0.01 ? "< 0.01%" : `${rawPercent.toFixed(2)}%`;
          } 
          
          return {
            ...node,
            storage_usage_percentage: percentStr,
            storage_usage_raw: rawPercent
          }; 
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
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError('Syncing latest network data...');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(address)) {
      newFavs = favorites.filter(f => f !== address);
    } else {
      newFavs = [...favorites, address];
    }
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };

  const closeModal = () => {
    setSelectedNode(null);
    setCompareMode(false);
    setShareMode(false);
    setCompareTarget(null);
    setShowOpponentSelector(false);
    setModalView('overview');
    setActiveTooltip(null);
    if (router.query.open) {
      router.replace('/', undefined, { shallow: true });
    }
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

  const copyToClipboard = (text: string, fieldId?: string) => {
    navigator.clipboard.writeText(text);
    if(fieldId){
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const copyRawJson = (node: Node) => {
    copyToClipboard(JSON.stringify(node, null, 2), 'json');
  };

  const copyStatusReport = (node: Node) => {
    const health = node.health || 0;
    const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address || 'Unknown'}\nStatus: ${(node.uptime || 0) > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${health}/100\nMonitor at: https://xandeum-pulse.vercel.app`;
    copyToClipboard(report, 'report');
  };

  const shareToTwitter = (node: Node) => {
    const health = node.health || 0;
    // FIX: Explicit null check on node.credits
    const creditsDisplay = node.credits !== null ? node.credits.toLocaleString() : 'N/A';
    
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${(node.uptime || 0) > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${health}/100\n💰 Credits: ${creditsDisplay}\n\nMonitor here:`;
    
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://xandeum-pulse.vercel.app")}`,
      '_blank'
    );
  };

  const copyNodeUrl = (e: React.MouseEvent, pubkey: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?open=${pubkey}`;
    copyToClipboard(url, 'url');
  };

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Health_Score,Country,Last_Seen_ISO,Is_Favorite\n';
    const rows = filteredNodes.map(n => {
      // FIX: Handle Null Credits for CSV
      const creditVal = n.credits !== null ? n.credits : 'NULL';
      return `${getSafeIp(n)},${n.pubkey || 'Unknown'},${n.rank},${creditVal},${getSafeVersion(n)},${n.uptime},${n.storage_committed},${n.storage_used},${n.health},${n.location?.countryName},${new Date(n.last_seen_timestamp || 0).toISOString()},${favorites.includes(n.address || '')}`;
    });
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDownloadProof = async () => {
    if (proofRef.current === null) return;
    try {
      const dataUrl = await toPng(proofRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b'
      });
      const link = document.createElement('a');
      link.download = `xandeum-proof-${selectedNode?.pubkey?.slice(0,6) || 'node'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate proof", err);
    }
  };

  // Filter & Sort
  const filteredNodes = nodes.filter(node => {
    const q = searchQuery.toLowerCase();
    const addr = getSafeIp(node).toLowerCase();
    const pub = (node.pubkey || '').toLowerCase();
    const ver = (node.version || '').toLowerCase();
    const country = (node.location?.countryName || '').toLowerCase();
    return (addr.includes(q) || pub.includes(q) || ver.includes(q) || country.includes(q));
  }).sort((a, b) => {
    let valA: any, valB: any;
    
    if (sortBy === 'storage') {
      valA = a.storage_committed || 0;
      valB = b.storage_committed || 0;
    } else if (sortBy === 'health') {
      valA = a.health || 0;
      valB = b.health || 0;
    } else {
      valA = (a as any)[sortBy];
      valB = (b as any)[sortBy];
    }
    
    if (sortBy === 'version') {
      return sortOrder === 'asc'
        ? compareVersions(a.version || '0.0.0', b.version || '0.0.0')
        : compareVersions(b.version || '0.0.0', a.version || '0.0.0');
    }
    
    return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  // Cycle Logic (5 Steps)
  const getCycleContent = (node: Node) => {
    const step = cycleStep % 5;
    
    if (step === 0) {
      return {
        label: 'Storage Used',
        value: formatBytes(node.storage_used),
        color: zenMode ? 'text-zinc-300' : 'text-blue-400',
        icon: Database
      };
    }
    
    if (step === 1) {
      return {
        label: 'Committed',
        value: formatBytes(node.storage_committed || 0),
        color: zenMode ? 'text-zinc-300' : 'text-purple-400',
        icon: HardDrive
      };
    }
    
    if (step === 2) {
      const score = node.health || 0;
      return {
        label: 'Health Score',
        value: `${score}/100`,
        color: score > 80 ? 'text-green-400' : 'text-yellow-400',
        icon: Activity
      };
    }
    
    if (step === 3) {
      return {
        label: 'Continuous Uptime',
        value: formatUptime(node.uptime),
        color: 'text-orange-400',
        icon: Zap
      };
    }
    
    return {
      label: 'Last Seen',
      value: formatLastSeen(node.last_seen_timestamp),
      color: 'text-zinc-400',
      icon: Clock
    };
  };

  // --- RENDER HELPERS ---

  const renderComparisonRow = (
    label: string,
    valA: any,
    valB: any,
    format: (v: any) => string,
    better: 'HIGH' | 'LOW' | 'NONE'
  ) => {
    const isABetter =
      better === 'NONE' ? false : better === 'HIGH' ? valA > valB : valA < valB;
    const isBBetter =
      better === 'NONE' ? false : better === 'HIGH' ? valB > valA : valB < valA;

    return (
      <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 text-xs hover:bg-white/5 px-2 rounded">
        <div
          className={`flex-1 text-right font-mono flex items-center justify-end gap-2 ${
            isABetter ? 'text-green-400 font-bold' : 'text-zinc-400'
          }`}
        >
          {format(valA)} {isABetter && <CheckCircle size={12} />}
        </div>
        <div className="px-4 text-[10px] text-zinc-600 uppercase font-bold w-32 text-center">
          {label}
        </div>
        <div
          className={`flex-1 text-left font-mono flex items-center justify-start gap-2 ${
            isBBetter ? 'text-green-400 font-bold' : 'text-zinc-400'
          }`}
        >
          {isBBetter && <CheckCircle size={12} />} {format(valB)}
        </div>
      </div>
    );
  };

  // --- RENDERERS ---

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node);
    const isFav = favorites.includes(node.address || '');
    const isVersionSort = sortBy === 'version';
    const isLatest = checkIsLatest(node.version);
    const flagUrl = node.location?.countryCode && node.location.countryCode !== 'XX' 
      ? `https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png` 
      : null;

    return (
      <div
        key={node.address || i}
        onClick={() => { setSelectedNode(node); setModalView('overview'); }}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
          zenMode
            ? 'bg-black border-zinc-800 hover:border-zinc-600'
            : isFav
            ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
            : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
        }`}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
          View Details <Maximize2 size={8} />
        </div>
        
        {/* HEADER: Flex layout separates Left(Identity) from Right(Star) */}
        <div className="mb-4 flex justify-between items-start">
          <div className="overflow-hidden pr-2 w-full">
            {/* Identity Label */}
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>
              {!node.is_public && <Shield size={10} className="text-zinc-600" />}
            </div>
            
            {/* IDENTITY SWAP CONTAINER */}
            <div className="relative h-6 w-full">
               {/* Layer 1: PubKey (Default) */}
               <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 flex items-center">
                  <span className="font-mono text-sm text-zinc-300 truncate w-full">{node.pubkey?.slice(0,16)}...</span>
               </div>
               
               {/* Layer 2: IP + Flag (Hover) */}
               <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center gap-2">
                   {flagUrl && <img src={flagUrl} className="w-4 h-auto rounded-sm shrink-0" />}
                   <span className="font-mono text-sm text-blue-400 truncate">{getSafeIp(node)}</span>
               </div>
            </div>
          </div>
          
          {/* Star Button - Pushed to the right by flex justify-between */}
          <button
            onClick={(e) => toggleFavorite(e, node.address || '')}
            className={`p-1.5 rounded-full transition shrink-0 ${
              isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-yellow-500'
            }`}
          >
            <Star size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Version</span>
            <span
              className={`px-2 py-0.5 rounded transition-all duration-500 ${
                isVersionSort
                  ? 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-zinc-900 border'
                  : 'text-zinc-300 bg-zinc-800'
              }`}
            >
              {node.version || 'Unknown'} {isLatest && <CheckCircle size={10} className="inline text-green-500 ml-1"/>}
            </span>
          </div>
          
          <div className="pt-2">
            <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Network Rewards</div>
            <div className="flex justify-between items-center text-xs p-2 rounded-lg border bg-black/40 border-zinc-800/50">
               {/* CRASHPROOF UI: Check Null Credits */}
               {node.credits !== null ? (
                   <>
                       <div className="flex items-center gap-1.5">
                         <Medal size={12} className={node.rank===1?'text-yellow-400':'text-zinc-500'} />
                         <span className="text-zinc-400 font-bold">#{node.rank}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="text-zinc-300 font-mono">{node.credits.toLocaleString()}</span>
                         <Wallet size={12} className="text-yellow-600"/>
                       </div>
                   </>
               ) : (
                   <div className="flex items-center gap-2 text-red-400 w-full justify-center font-bold italic text-[10px]">
                     <AlertOctagon size={12}/> CREDITS API OFFLINE
                   </div>
               )}
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-end">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1">
                <cycleData.icon size={10} /> {cycleData.label}
              </span>
              <span className={`text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>
                {cycleData.value}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderZenCard = (node: Node) => {
    // FIX: Use shared helper logic
    const isLatest = checkIsLatest(node.version);
    const health = node.health || 0;
    const isVersionSort = sortBy === 'version';

    return (
      <div
        key={node.address || node.pubkey}
        onClick={() => { setSelectedNode(node); setModalView('overview'); }}
        className="group relative border border-zinc-800 bg-black/50 hover:border-zinc-600 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
          <div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">NODE ID</div>
            <div className="font-mono text-sm text-zinc-300 truncate w-32 md:w-48">{node.pubkey || 'Unknown'}</div>
            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{getSafeIp(node)}</div>
          </div>
          <div className={`text-xl font-bold ${health && health >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
            {health}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Storage</div>
            <div className="font-mono text-zinc-300">{formatBytes(node.storage_used)}</div>
            <div className="w-full h-1 bg-zinc-900 rounded-full mt-1">
              <div className="h-full bg-zinc-600" style={{ width: node.storage_usage_percentage }}></div>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Uptime</div>
            <div className="font-mono text-orange-400">{formatUptime(node.uptime)}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Version</div>
            <div className={`font-mono flex items-center gap-2 ${isVersionSort ? 'text-cyan-400 animate-pulse' : 'text-zinc-300'}`}>
              {node.version} {isLatest && <CheckCircle size={10} className="text-green-500" />}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Rank</div>
            <div className="font-mono text-yellow-600">#{node.rank || '-'}</div>
          </div>
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
    
    const isLatest = checkIsLatest(selectedNode?.version);

    return (
      <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${
              zenMode ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            <Shield size={14} /> IDENTITY & STATUS
          </h3>
          <button
            onClick={() => setModalView('overview')}
            className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
          >
            <ArrowLeft size={10} /> BACK
          </button>
        </div>
        
        <div className="space-y-4 flex-grow">
          {details.map((d) => (
            <div
              key={d.label}
              className={`p-4 rounded-xl border ${
                zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'
              }`}
            >
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{d.label}</div>
              <div className="flex items-center justify-between">
                <code
                  className={`text-sm font-mono truncate ${
                    d.color || (zenMode ? 'text-zinc-300' : 'text-zinc-200')
                  }`}
                >
                  {d.val}
                </code>
                <button
                  onClick={() => copyToClipboard(d.val)}
                  className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          ))}
          
          <div
            className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
              isLatest
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-orange-500/10 border-orange-500/30'
            }`}
          >
            {isLatest ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <AlertTriangle size={20} className="text-orange-500" />
            )}
            <div>
              <div
                className={`text-xs font-bold ${
                  isLatest
                    ? 'text-green-400'
                    : 'text-orange-400'
                }`}
              >
                {isLatest
                  ? 'Node is Up to Date'
                  : 'Update Recommended'}
              </div>
              <div className="text-[10px] text-zinc-500">
                Current consensus version is{' '}
                <span className="font-mono text-zinc-300">{mostCommonVersion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHealthBreakdown = () => {
    const health = selectedNode?.health || 0;
    const bd = selectedNode?.healthBreakdown || {
      uptime: health,
      version: health,
      reputation: health,
      storage: health,
    };
    const avgs = networkStats.avgBreakdown;
    const totalNodes = networkStats.totalNodes || 1;
    const rank = selectedNode?.rank || totalNodes;

    const percentile = ((totalNodes - rank) / totalNodes) * 100;
    const netAvgHealth = avgs.total || 50;
    const diff = health - netAvgHealth;

    const metrics = [
      { label: 'Storage Capacity', val: bd.storage, avg: avgs.storage },
      { label: 'Reputation Score', val: bd.reputation, avg: avgs.reputation },
      { label: 'Uptime Stability', val: bd.uptime, avg: avgs.uptime },
      { label: 'Version Consensus', val: bd.version, avg: avgs.version },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${
              zenMode ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            <Activity size={14} /> DIAGNOSTICS & VITALITY
          </h3>
          <button
            onClick={() => setModalView('overview')}
            className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
          >
            <ArrowLeft size={10} /> BACK
          </button>
        </div>

        <div className="flex-grow flex flex-col gap-6">
          <div className="p-6 bg-black rounded-2xl border border-zinc-800 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-green-500/5 blur-2xl rounded-full pointer-events-none"></div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">YOUR SCORE</div>
              <div className="text-4xl font-black text-white">
                {health}
                <span className="text-lg text-zinc-600 font-medium">/100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">NETWORK AVG</div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl font-bold text-zinc-300">{netAvgHealth}</span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    diff >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {diff > 0 ? '+' : ''}
                  {diff}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {metrics.map((m) => {
              if (m.val === null && m.label === 'Reputation Score') {
                  // Hide Reputation row if system is offline
                  return null;
              }
              const val = m.val || 0; // fallback for safety
              const barColor =
                val >= 80
                  ? 'bg-green-500'
                  : val >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500';

              return (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-bold">{m.label}</span>
                    <div className="font-mono text-[10px]">
                      <span className="text-white font-bold">{val}</span>
                      <span className="text-zinc-600 mx-1">/</span>
                      <span className="text-zinc-500">Avg: {m.avg}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-visible relative">
                    <div
                      className={`h-full rounded-l-full transition-all duration-1000 ${barColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      style={{ width: `${val}%` }}
                    ></div>
                    <div
                      className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white shadow-[0_0_5px_white] z-10"
                      style={{ left: `${m.avg}%` }}
                      title={`Network Average: ${m.avg}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-center">
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} /> TOP {percentile.toFixed(0)}% OF NETWORK
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStorageAnalysis = () => {
    const nodeCap = selectedNode?.storage_committed || 0;
    const median = medianCommitted || 1;
    const diff = nodeCap - median;
    const isPos = diff >= 0;
    const percentDiff = Math.abs((diff / median) * 100);
    const tankFill = isPos ? 100 : Math.max(10, (nodeCap / median) * 100);

    return (
      <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${
              zenMode ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            <Database size={14} /> STORAGE ANALYTICS
          </h3>
          <button
            onClick={() => setModalView('overview')}
            className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
          >
            <ChevronLeft size={10} /> BACK
          </button>
        </div>

        <div className="flex-grow flex flex-col gap-4">
          <div
            className={`p-4 rounded-2xl border text-center ${
              zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 flex items-center justify-center gap-1">
              NETWORK COMPARISON
            </div>
            <div className="text-sm text-zinc-300">
              Storage is{' '}
              <span
                className={`font-mono font-bold text-lg ${
                  isPos ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {percentDiff.toFixed(1)}% {isPos ? 'Higher' : 'Lower'}
              </span>{' '}
              than median
            </div>
          </div>

          <div className="flex-grow relative rounded-2xl border border-zinc-800 bg-black/50 overflow-hidden flex items-end justify-center group min-h-[160px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>

            <div
              className={`w-full transition-all duration-1000 relative z-10 group-hover:bg-purple-600/40 ${
                isPos ? 'bg-purple-600/30' : 'bg-purple-900/20'
              }`}
              style={{ height: `${tankFill}%` }}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  isPos
                    ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                    : 'bg-red-500/50'
                }`}
              ></div>

              {isPos && (
                <div className="absolute inset-0 overflow-hidden opacity-50">
                  <div className="absolute -top-10 left-1/4 w-0.5 h-full bg-green-400/40 animate-[rain_2s_infinite] group-hover:animate-[rain_1s_infinite]"></div>
                  <div className="absolute -top-20 left-1/2 w-0.5 h-full bg-green-400/40 animate-[rain_3s_infinite_0.5s] group-hover:animate-[rain_1.5s_infinite_0.5s]"></div>
                  <div className="absolute -top-5 left-3/4 w-0.5 h-full bg-green-400/40 animate-[rain_2.5s_infinite_1s] group-hover:animate-[rain_1.2s_infinite_1s]"></div>
                </div>
              )}
            </div>

            {!isPos && (
              <div
                className="absolute top-0 left-0 right-0 bg-red-900/10 border-b border-red-500/30 pattern-diagonal-lines"
                style={{ height: `${100 - tankFill}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-red-500 uppercase tracking-widest opacity-50">
                  Deficit Gap
                </div>
              </div>
            )}

            <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-4 text-[9px] text-zinc-600 font-mono z-20 pointer-events-none">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'
            }`}
          >
            <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-2">
              <span>Your Capacity</span>
              <span className={isPos ? 'text-green-500' : 'text-red-500'}>
                {isPos ? 'ABOVE MAJORITY' : 'BELOW MAJORITY'}
              </span>
            </div>
            <div className="h-3 w-full bg-zinc-900 rounded-full relative overflow-hidden">
              {isPos ? (
                <>
                  <div className="absolute top-0 bottom-0 left-0 bg-purple-600 w-3/4"></div>
                  <div className="absolute top-0 bottom-0 left-3/4 bg-green-500/20 border-l border-green-500 w-1/4"></div>
                </>
              ) : (
                <>
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-purple-600"
                    style={{ width: `${tankFill}%` }}
                  ></div>
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-red-500/10 border-l border-red-500/50"
                    style={{ width: `${100 - tankFill}%` }}
                  ></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- TOP LEVEL VARIABLE FOR MODAL ---
  // Fix: This variable is now accessible to the entire modal return block
  const isSelectedNodeLatest = checkIsLatest(selectedNode?.version);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        zenMode ? 'bg-black text-zinc-300 selection:bg-zinc-700' : 'bg-[#09090b] text-zinc-100 selection:bg-blue-500/30'
      }`}
      onClick={handleGlobalClick}
    >
      <Head>
        <title>Xandeum Pulse {zenMode ? '[ZEN MODE]' : ''}</title>
      </Head>

      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <LiveWireLoader />
        </div>
      )}

      {/* --- SIDE NAVIGATION (Z-INDEX FIXED) --- */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-[#09090b] border-r border-zinc-800 z-[200] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              Menu
            </h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-grow space-y-2">
            <Link href="/">
              <div className="flex items-center gap-3 p-3 bg-zinc-900/50 text-white rounded-lg border border-zinc-700 cursor-pointer">
                <LayoutDashboard size={18} />
                <span className="text-sm font-bold">Dashboard</span>
              </div>
            </Link>

            <Link href="/map">
              <div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer">
                <MapIcon size={18} />
                <span className="text-sm font-bold">Global Map</span>
              </div>
            </Link>

            <Link href="/leaderboard">
              <div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer">
                <Trophy size={18} />
                <span className="text-sm font-bold">Leaderboard</span>
              </div>
            </Link>

            <button
              onClick={handleCompareLink}
              className="w-full text-left flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"
            >
              <Swords size={18} />
              <span className="text-sm font-bold">Compare Nodes</span>
            </button>

            <Link href="/docs">
              <div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer">
                <BookOpen size={18} />
                <span className="text-sm font-bold">Documentation</span>
              </div>
            </Link>
          </nav>

          <div className="mt-auto border-t border-zinc-800 pt-6 space-y-4">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">
                Quick Actions
              </div>
              <button
                onClick={exportCSV}
                className="w-full py-2 bg-black border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-500 transition flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[190] backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* --- HEADER --- */}
      <header
        className={`sticky top-0 z-[100] backdrop-blur-md border-b px-6 py-2 md:py-4 flex flex-col gap-4 md:gap-6 transition-all duration-500 ${
          zenMode ? 'bg-black/90 border-zinc-800' : 'bg-[#09090b]/90 border-zinc-800'
        }`}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`p-2.5 md:p-3.5 rounded-xl transition ${
                zenMode
                  ? 'text-zinc-400 border border-zinc-800'
                  : 'text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Menu size={24} className="md:w-7 md:h-7" />
            </button>

            {/* Title visible on Mobile now but simpler */}
            <div className="flex flex-col">
              <h1
                className={`text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 ${
                  zenMode ? 'text-white' : 'text-white'
                }`}
              >
                <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={20} />
                PULSE
              </h1>
              <span className="text-[9px] text-zinc-600 font-mono tracking-wider ml-1">
                Last Sync: {lastSync}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 relative overflow-hidden group flex flex-col items-center">
            <div className="relative w-full">
              <Search
                className={`absolute left-3 top-2.5 size-4 z-10 ${
                  zenMode ? 'text-zinc-600' : 'text-zinc-500'
                }`}
              />

              {!searchQuery && !isSearchFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none pl-10 pr-4 overflow-hidden z-0">
                  <div className="whitespace-nowrap animate-marquee text-sm text-zinc-600 font-mono opacity-80">
                    Search nodes by Version, IP Address, Country, or Public Key...
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-lg py-2 pl-10 pr-4 text-sm outline-none shadow-inner transition-all relative z-10 bg-transparent ${
                  zenMode
                    ? 'border border-zinc-800 text-zinc-300 focus:border-zinc-600'
                    : 'border border-zinc-800 text-white focus:border-blue-500'
                }`}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>

            {/* ROTATING TOOLTIPS: Now visible on mobile, tiny font, no gaps */}
            {!zenMode && (
              <div className="mt-1 md:mt-2 w-full text-center pointer-events-none min-h-[16px] md:min-h-[20px] transition-all duration-300 block">
                <p
                  key={searchTipIndex}
                  className="text-[9px] md:text-xs text-zinc-500 font-mono tracking-wide uppercase flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500 whitespace-normal text-center leading-tight"
                >
                  <Info size={10} className="text-blue-500 shrink-0 md:w-3 md:h-3" />
                  <span>
                    {isSearchFocused
                      ? 'Type to filter nodes instantly'
                      : searchTips[searchTipIndex]}
                  </span>
                </p>
              </div>
            )}

            <style jsx>{`
              @keyframes marquee {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
              .animate-marquee {
                animation: marquee 15s linear infinite;
              }
            `}</style>
          </div>

          <button
            onClick={() => setZenMode(!zenMode)}
            className={`p-2 rounded-lg transition flex items-center gap-2 group ${
              zenMode
                ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                : 'bg-red-900/10 border border-red-500/20 text-red-500 hover:bg-red-900/30'
            }`}
            title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
          >
            <Monitor size={18} />
            <span className="hidden md:inline text-xs font-bold">
              {zenMode ? 'EXIT ZEN' : 'ZEN MODE'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide w-full mt-1 md:mt-6 border-t border-zinc-800/50 pt-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 h-8 md:h-12 rounded-xl transition font-bold text-[10px] md:text-xs ${
              loading
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-wait'
                : zenMode
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                : 'bg-zinc-900 border border-zinc-800 text-blue-400 hover:bg-zinc-800 hover:scale-105 transform active:scale-95'
            }`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'SYNCING...' : 'REFRESH'}
          </button>

          <div className="flex gap-2 relative">
            {['uptime', 'storage', 'version', 'health'].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  if (sortBy === opt) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(opt as any);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition border whitespace-nowrap h-8 md:h-auto ${
                  sortBy === opt
                    ? zenMode
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                      : 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : zenMode
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {opt === 'uptime' && <Clock size={12} />}
                {opt === 'storage' && <Database size={12} />}
                {opt === 'version' && <Server size={12} />}
                {opt === 'health' && <HeartPulse size={12} />}
                {opt.toUpperCase()}
                {sortBy === opt &&
                  (sortOrder === 'asc' ? (
                    <ArrowUp size={10} className="ml-1" />
                  ) : (
                    <ArrowDown size={10} className="ml-1" />
                  ))}
              </button>
            ))}
            {/* Scroll Indicator Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none md:hidden"></div>
          </div>
        </div>
      </header>

      {/* NEW: Sticky Shadow Trigger */}
      <div className={`sticky top-0 z-[80] w-full h-1 bg-gradient-to-b from-black/50 to-transparent pointer-events-none transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>

      {searchQuery && (
        <div className="sticky top-[140px] z-[85] w-full bg-blue-900/90 border-b border-blue-500/30 py-2 px-6 text-center backdrop-blur-md animate-in slide-in-from-top-1">
            <div className="text-xs font-mono text-blue-100">
            Found <span className="font-bold text-white">{filteredNodes.length}</span> matches
            for <span className="italic">"{searchQuery}"</span>
            </div>
        </div>
      )}

      <main
        className={`p-4 md:p-8 ${
          zenMode ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1800px] mx-auto'
        } transition-all duration-500`}
      >
        {!zenMode && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Network Capacity
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mt-1">
                {formatBytes(totalStorageCommitted)}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden group cursor-pointer active:scale-95 transition-transform">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="ekg-line"></div>
              </div>
              <div className="relative z-10">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1">
                  <HeartPulse size={12} className="text-green-500 animate-pulse" />
                  Network Vitals
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Stability</span>
                    <span className="font-mono font-bold text-white">{networkHealth}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Avg Health</span>
                    <span className="font-mono font-bold text-green-400">
                      {avgNetworkHealth}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Consensus</span>
                    <span className="font-mono font-bold text-blue-400">
                      {networkConsensus.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <style jsx>{`
                @keyframes ekg {
                  0% {
                    left: -100%;
                    opacity: 0;
                  }
                  50% {
                    opacity: 1;
                  }
                  100% {
                    left: 100%;
                    opacity: 0;
                  }
                }
                .ekg-line {
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  width: 50%;
                  background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(34, 197, 94, 0.5) 50%,
                    transparent 100%
                  );
                  animation: ekg 2s linear infinite;
                }
              `}</style>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Consensus Ver
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">
                {mostCommonVersion}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Active Nodes
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mt-1">{nodes.length}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {!zenMode && favorites.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-yellow-500" fill="currentColor" size={20} />
              <h3 className="text-lg font-bold text-white tracking-widest uppercase">
                Your Watchlist
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">
              {watchListNodes.map((node, i) => renderNodeCard(node, i))}
            </div>
          </div>
        )}

        {/* NEW: Active Nodes Header with 2-Line Filter Info */}
        {!loading && nodes.length > 0 && (
             <div className="flex items-center gap-2 mb-4 mt-8">
                <Activity className="text-green-500" size={20} />
                <h3 className="text-lg font-bold text-white tracking-widest uppercase">
                    Active Nodes - {filteredNodes.length}
                </h3>
                <div className="flex flex-col justify-center ml-2 leading-none">
                    <span className="text-[7px] md:text-[9px] font-mono text-zinc-500 uppercase">
                        (Distributed by <span className="text-zinc-300">{sortBy}</span>
                    </span>
                    <span className="text-[7px] md:text-[9px] font-mono text-zinc-500 uppercase text-center">
                        {sortOrder === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'})
                    </span>
                </div>
            </div>
        )}

        {loading && nodes.length === 0 ? (
          <PulseGraphLoader />
        ) : (
          <div
            className={`grid gap-4 ${
              zenMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:gap-8'
            } pb-20`}
          >
            {filteredNodes.map((node, i) => {
              if (zenMode) return renderZenCard(node);
              return renderNodeCard(node, i);
            })}
          </div>
        )}
      </main>

      {/* --- THE ULTRA MODAL --- */}
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className={`border w-full max-w-4xl 2xl:max-w-6xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${
              zenMode ? 'bg-black border-zinc-800 shadow-none' : 'bg-[#09090b] border-zinc-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* -- MODAL HEADER (Responsive Fix) -- */}
            <div
              className={`shrink-0 p-4 md:p-6 border-b flex justify-between items-start ${
                zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <ModalAvatar node={selectedNode} />
                <div className="min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    {/* Responsive Font Size */}
                    <h2 className="text-lg md:text-2xl font-black font-sans tracking-tight text-white mb-0.5 truncate">
                      NODE INSPECTOR
                    </h2>
                    <button
                      onClick={(e) => toggleFavorite(e, selectedNode.address || '')}
                      // UPDATED: Favorites button is now larger with toggle text
                      className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border transition group w-fit ${
                        favorites.includes(selectedNode.address || '') 
                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20' 
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Star
                        size={14}
                        className={
                          favorites.includes(selectedNode.address || '')
                            ? 'fill-yellow-500'
                            : 'group-hover:text-yellow-500'
                        }
                      />
                      <span className="text-[10px] md:text-xs font-bold uppercase leading-none">
                        {favorites.includes(selectedNode.address || '') ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                    <span className="text-zinc-400 truncate max-w-[120px] md:max-w-none">
                      {selectedNode.pubkey ? `${selectedNode.pubkey.slice(0, 12)}...` : 'Unknown'}
                    </span>
                    <Copy
                      size={10}
                      className="cursor-pointer hover:text-white"
                      onClick={() => copyToClipboard(selectedNode.pubkey || '', 'pubkey')}
                    />
                  </div>

                  <div className="mt-1">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        selectedNode.is_public
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      }`}
                    >
                      {selectedNode.is_public
                        ? 'STORAGE LAYER FULLY INDEXED'
                        : 'STORAGE LAYER NOT INDEXED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={closeModal}
                  className="p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition group"
                >
                  <X size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* -- SCROLLABLE CONTENT (Includes Footer Buttons Now) -- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative flex flex-col">
              {compareMode ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col relative">
                  <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <button
                      onClick={() => setCompareMode(false)}
                      className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition"
                    >
                      <ArrowLeftRight size={14} />
                      BACK TO DETAILS
                    </button>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Swords className="text-red-500" /> VERSUS MODE
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[400px]">
                    <div className="border border-blue-500/30 bg-blue-900/10 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-20 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
                      <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center">
                        <div className="mb-4">
                          <ModalAvatar node={selectedNode} />
                        </div>
                        <div className="text-2xl font-black text-white mb-1">
                          {getSafeIp(selectedNode)}
                        </div>
                        <div className="text-blue-400 font-mono text-xs">
                          {selectedNode.pubkey?.slice(0, 12)}...
                        </div>

                        {compareTarget && (
                          <div className="mt-8 w-full space-y-2 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between text-xs font-bold text-zinc-500 border-b border-white/5 pb-1 mb-2">
                              <span>STAT</span>
                              <span>VALUE</span>
                            </div>
                            {renderComparisonRow(
                              'Health',
                              selectedNode.health || 0,
                              compareTarget.health || 0,
                              (v) => v.toString(),
                              'HIGH'
                            )}
                            {renderComparisonRow(
                              'Storage',
                              selectedNode.storage_committed,
                              compareTarget.storage_committed,
                              formatBytes,
                              'HIGH'
                            )}
                            {renderComparisonRow(
                              'Credits',
                              selectedNode.credits || 0,
                              compareTarget.credits || 0,
                              (v) => v.toLocaleString(),
                              'HIGH'
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`border rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300 ${
                        compareTarget
                          ? 'border-red-500/30 bg-red-900/10 p-6'
                          : 'border-zinc-800 bg-zinc-900/20 border-dashed hover:border-zinc-600 cursor-pointer items-center justify-center group'
                      }`}
                      onClick={() => !compareTarget && setShowOpponentSelector(true)}
                    >
                      {compareTarget ? (
                        <>
                          <div className="absolute top-0 right-0 p-20 bg-red-500/20 blur-3xl rounded-full pointer-events-none"></div>
                          <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center">
                            <div className="absolute top-0 right-0 p-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCompareTarget(null);
                                }}
                                className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="mb-4">
                              <ModalAvatar node={compareTarget} />
                            </div>
                            <div className="text-2xl font-black text-white mb-1">
                              {getSafeIp(compareTarget)}
                            </div>
                            <div className="text-red-400 font-mono text-xs">
                              {compareTarget.pubkey?.slice(0, 12)}...
                            </div>
                            <div className="mt-8 w-full space-y-2 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                              <div className="flex justify-between text-xs font-bold text-zinc-500 border-b border-white/5 pb-1 mb-2">
                                <span>STAT</span>
                                <span>VALUE</span>
                              </div>
                              <div className="opacity-50 text-center text-xs italic py-2">
                                Stats compared on left panel
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center group-hover:scale-105 transition-transform">
                          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 border border-zinc-700 group-hover:border-zinc-500 group-hover:bg-zinc-700 transition">
                            <Plus size={40} className="text-zinc-500 group-hover:text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-zinc-400 group-hover:text-white">
                            SELECT OPPONENT
                          </h3>
                          <p className="text-zinc-600 text-sm mt-2">
                            Click to open node selector
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {showOpponentSelector && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-zinc-800 flex items-center gap-4 bg-zinc-900/50">
                        <Search className="text-zinc-500" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search Opponent by IP, Key, or Country..."
                          className="bg-transparent text-lg text-white w-full outline-none"
                          value={compareSearch}
                          onChange={(e) => setCompareSearch(e.target.value)}
                        />
                        <button
                          onClick={() => setShowOpponentSelector(false)}
                          className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {nodes
                            .filter(
                              (n) =>
                                n.pubkey !== selectedNode.pubkey &&
                                ((n.pubkey || '').toLowerCase().includes(compareSearch.toLowerCase()) ||
                                  getSafeIp(n).toLowerCase().includes(compareSearch.toLowerCase()) ||
                                  (n.location?.countryName || '')
                                    .toLowerCase()
                                    .includes(compareSearch.toLowerCase()))
                            )
                            .map((n) => (
                              <button
                                key={n.pubkey}
                                onClick={() => {
                                  setCompareTarget(n);
                                  setShowOpponentSelector(false);
                                }}
                                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition text-left group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-2xl">
                                    {n.location?.countryCode ? (
                                      <img
                                        src={`https://flagcdn.com/w40/${n.location.countryCode.toLowerCase()}.png`}
                                        className="w-6 rounded-sm"
                                      />
                                    ) : (
                                      <Globe />
                                    )}
                                  </span>
                                  <div className="opacity-0 group-hover:opacity-100 transition text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded">
                                    SELECT
                                  </div>
                                </div>
                                <div className="font-mono font-bold text-zinc-300 group-hover:text-white">
                                  {getSafeIp(n)}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono truncate">
                                  {n.pubkey}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : shareMode ? (
                <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300 py-10">
                  <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                    <div
                      ref={proofRef}
                      className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition duration-1000"></div>
                      <div className="relative z-10 text-center">
                        <div className="inline-block p-4 bg-zinc-900 rounded-2xl mb-6 shadow-lg border border-zinc-800">
                          <Activity size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                          PROOF OF PULSE
                        </h2>
                        <p className="font-mono text-xs text-zinc-500 mb-8 bg-zinc-900 px-3 py-1 rounded-full inline-block border border-zinc-800">
                          {getSafeIp(selectedNode)}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                              Health
                            </div>
                            <div className="text-2xl font-extrabold text-green-400">
                              {selectedNode.health}
                            </div>
                          </div>

                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                              Storage
                            </div>
                            <div className="text-xl font-extrabold text-purple-400">
                              {formatBytes(selectedNode.storage_committed)}
                            </div>
                          </div>

                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                              Credits
                            </div>
                            <div className="text-xl font-extrabold text-yellow-500">
                              {selectedNode.credits !== null
                                ? selectedNode.credits.toLocaleString()
                                : 'N/A'}
                            </div>
                          </div>

                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                              Version
                            </div>
                            <div className="text-lg font-mono text-white">
                              {getSafeVersion(selectedNode)}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-zinc-600 font-mono flex items-center justify-center gap-2 mb-6">
                          <Server size={10} /> VERIFIED BY XANDEUM PULSE
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-sm">
                      {/* --- NEW BACK BUTTON LAYOUT --- */}
                      <button
                        onClick={() => setShareMode(false)}
                        className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition border border-zinc-800 mb-6 flex items-center justify-center gap-2 group"
                      >
                        <ArrowLeft
                          size={16}
                          className="text-red-500 group-hover:-translate-x-1 transition-transform"
                        />
                        Back to Details
                      </button>

                      <button
                        onClick={() => copyStatusReport(selectedNode)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-white border border-zinc-700"
                      >
                        <ClipboardCopy size={14} />
                        Copy Diagnostic Report
                      </button>

                      <button
                        onClick={() => shareToTwitter(selectedNode)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-xs font-bold text-blue-400 border border-blue-800"
                      >
                        <Share2 size={14} />
                        Share Proof on X
                      </button>

                      <button
                        onClick={() => copyRawJson(selectedNode)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400 border border-zinc-800"
                      >
                        <FileJson size={14} />
                        Copy JSON Data (Dev)
                      </button>

                      <button
                        onClick={(e) => copyNodeUrl(e, selectedNode.pubkey || '')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400 border border-zinc-800"
                      >
                        <LinkIcon size={14} />
                        Copy Public Node URL
                      </button>

                      <button
                        onClick={handleDownloadProof}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold text-white border border-green-700 mt-2 shadow-lg shadow-green-900/20"
                      >
                        <ImageIcon size={14} />
                        DOWNLOAD PROOF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 h-full">
                    {modalView !== 'overview' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                        <div className="md:col-span-1 h-full">
                          {modalView === 'health' && (
                            <div
                              className={`h-full rounded-3xl p-6 border flex flex-col items-center justify-between relative overflow-hidden shadow-inner cursor-pointer transition-all group bg-zinc-900 border-green-500 ring-1 ring-green-500`}
                              onClick={() => handleCardToggle('health')}
                            >
                              <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 to-transparent pointer-events-none"></div>
                              <div className="w-full flex justify-between items-start z-10 mb-4">
                                <div className="flex flex-col">
                                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                                    DIAGNOSTICS
                                  </h3>
                                  <div className="text-[9px] font-mono mt-1 px-2 py-0.5 rounded-full inline-block w-fit bg-green-500/20 text-green-400">
                                    Active View
                                  </div>
                                </div>
                                <HelpCircle size={14} className="z-20 text-zinc-500 hover:text-white transition" />
                              </div>
                              <div className="relative z-10 scale-110">
                                <RadialProgress score={selectedNode.health || 0} size={160} />
                              </div>
                              <div className="mt-6 text-center w-full z-10 flex justify-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-red-400/80 group-hover:text-red-300 transition-colors flex items-center gap-1">
                                  <Minimize2 size={8} /> CLICK TO COLLAPSE
                                </div>
                              </div>
                            </div>
                          )}

                          {modalView === 'storage' && (
                            <div
                              className={`h-full rounded-3xl p-6 border flex flex-col items-center justify-between relative overflow-hidden shadow-inner cursor-pointer transition-all group bg-zinc-900 border-purple-500 ring-1 ring-purple-500`}
                              onClick={() => handleCardToggle('storage')}
                            >
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>
                              <div className="w-full flex justify-between items-start z-10 mb-4">
                                <div className="flex flex-col">
                                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                                    STORAGE
                                  </h3>
                                  <div className="text-[9px] font-mono mt-1 px-2 py-0.5 rounded-full inline-block w-fit bg-purple-500/20 text-purple-400">
                                    Active View
                                  </div>
                                </div>
                                <HelpCircle size={14} className="z-20 text-zinc-500 hover:text-white transition" />
                              </div>
                              <div className="relative w-full mt-4 space-y-2">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase">
                                  Your Node
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400 text-xs">Committed</span>
                                  <span className="text-purple-400 font-mono text-sm">
                                    {formatBytes(selectedNode.storage_committed)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400 text-xs">Used</span>
                                  <span className="text-blue-400 font-mono text-sm">
                                    {formatBytes(selectedNode.storage_used)}
                                  </span>
                                </div>
                                <div className="h-px bg-zinc-800 my-2"></div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500 text-xs">Network Median</span>
                                  <span className="text-zinc-300 font-mono text-sm">
                                    {formatBytes(medianCommitted)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-6 text-center w-full z-10 flex justify-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-red-400/80 group-hover:text-red-300 transition-colors flex items-center gap-1">
                                  <Minimize2 size={8} /> CLICK TO COLLAPSE
                                </div>
                              </div>
                            </div>
                          )}

                          {modalView === 'identity' && (
                            <div
                              className="h-full rounded-3xl p-6 border flex flex-col items-center justify-between relative overflow-hidden shadow-inner cursor-pointer transition-all group bg-zinc-900 border-blue-500 ring-1 ring-blue-500"
                              onClick={() => handleCardToggle('identity')}
                            >
                              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
                              <div className="w-full flex justify-between items-start z-10 mb-4">
                                <div className="flex flex-col">
                                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                                    IDENTITY
                                  </h3>
                                  <div className="text-[9px] font-mono mt-1 px-2 py-0.5 rounded-full inline-block w-fit bg-blue-500/20 text-blue-400">
                                    Active View
                                  </div>
                                </div>
                                <HelpCircle size={14} className="z-20 text-zinc-500 hover:text-white transition" />
                              </div>
                              <div className="relative z-10 flex flex-col items-center gap-4">
                                <Shield size={64} className="text-blue-500 opacity-80" />
                                {isSelectedNodeLatest
                                  ? (
                                  <div className="text-[10px] text-green-500 font-bold bg-green-500/10 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-green-500/20">
                                    <CheckCircle size={12} />
                                    UP TO DATE
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-orange-500 font-bold bg-orange-500/10 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-500/20">
                                    <AlertTriangle size={12} />
                                    UPDATE NEEDED
                                  </div>
                                )}
                              </div>
                              <div className="mt-6 text-center w-full z-10 flex justify-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-red-400/80 group-hover:text-red-300 transition-colors flex items-center gap-1">
                                  <Minimize2 size={8} /> CLICK TO COLLAPSE
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2 h-full">
                          {modalView === 'health' && renderHealthBreakdown()}
                          {modalView === 'storage' && renderStorageAnalysis()}
                          {modalView === 'identity' && renderIdentityDetails()}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div
                            className={`rounded-3xl p-6 border flex flex-col items-center justify-between relative overflow-hidden shadow-inner cursor-pointer transition-all group h-64 ${
                              zenMode
                                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                                : 'bg-zinc-900/30 border-zinc-800 hover:border-blue-500/30'
                            }`}
                            onClick={() => handleCardToggle('health')}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-b from-transparent pointer-events-none ${
                                zenMode ? 'to-green-900/10' : 'to-blue-900/10'
                              }`}
                            ></div>
                            <div className="w-full flex justify-between items-start z-10 mb-4">
                              <div className="flex flex-col">
                                <h3
                                  className={`text-[10px] font-bold tracking-widest uppercase ${
                                    zenMode ? 'text-zinc-400' : 'text-zinc-500'
                                  }`}
                                >
                                  SYSTEM DIAGNOSTICS
                                </h3>
                                <div
                                  className={`text-[9px] font-mono mt-1 px-2 py-0.5 rounded-full inline-block w-fit ${
                                    (selectedNode.health || 0) >= avgNetworkHealth
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {(selectedNode.health || 0) >= avgNetworkHealth
                                    ? '▲ Above Avg'
                                    : '▼ Below Avg'}
                                </div>
                              </div>
                              <HelpCircle
                                size={14}
                                className={`z-20 hover:text-white transition ${
                                  zenMode ? 'text-zinc-600' : 'text-zinc-500'
                                }`}
                              />
                            </div>
                            <div className="relative z-10 scale-110 group-hover:scale-125 transition-transform duration-500 ease-in-out group-hover:animate-pulse">
                              <RadialProgress score={selectedNode.health || 0} size={160} />
                            </div>
                            <div className="mt-6 text-center w-full z-10 flex justify-center">
                              <div className="text-[9px] font-bold uppercase tracking-widest text-green-400/80 animate-pulse group-hover:text-green-300 transition-colors flex items-center gap-1">
                                <Maximize2 size={8} /> CLICK TO EXPAND
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition group relative h-64 ${
                              zenMode
                                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30'
                            }`}
                            onClick={() => handleCardToggle('storage')}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-2 rounded-lg ${
                                    zenMode ? 'bg-green-900/20 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                  }`}
                                >
                                  <Database size={18} />
                                </div>
                                <div
                                  className={`text-xs font-bold uppercase ${
                                    zenMode ? 'text-zinc-400' : 'text-zinc-500'
                                  }`}
                                >
                                  STORAGE CAPACITY
                                </div>
                              </div>
                              <HelpCircle size={12} className="text-zinc-600 hover:text-white z-20" />
                            </div>

                            <div className="mt-auto space-y-4 relative z-10">
                              <div className="flex items-end justify-between">
                                <div>
                                  <div className="text-[9px] font-mono text-zinc-500 mb-1 bg-zinc-900/50 border border-zinc-800 px-2 py-0.5 rounded-full inline-block">
                                    {(selectedNode?.storage_used || 0).toLocaleString()} raw
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <span
                                      className={`text-2xl font-bold font-mono ${
                                        zenMode ? 'text-green-400' : 'text-blue-400'
                                      }`}
                                    >
                                      {formatBytes(selectedNode?.storage_used).split(' ')[0]}
                                      <span className="text-sm ml-1">
                                        {formatBytes(selectedNode?.storage_used).split(' ')[1]}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">
                                    USED
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="flex items-baseline gap-1 justify-end">
                                    <span
                                      className={`text-2xl font-bold font-mono ${
                                        zenMode ? 'text-green-600' : 'text-purple-400'
                                      }`}
                                    >
                                      {formatBytes(selectedNode?.storage_committed).split(' ')[0]}
                                      <span className="text-sm ml-1">
                                        {formatBytes(selectedNode?.storage_committed).split(' ')[1]}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">
                                    COMMITTED
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                                  <div
                                    className={`h-full transition-all duration-1000 group-hover:brightness-125 ${
                                      zenMode
                                        ? 'bg-green-500'
                                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        ((selectedNode?.storage_used || 0) /
                                          (selectedNode?.storage_committed || 1)) *
                                          100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/80 animate-pulse group-hover:text-purple-300 transition-colors flex items-center gap-1">
                                  <Maximize2 size={8} /> CLICK TO EXPAND
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden cursor-pointer group h-64 ${
                              zenMode
                                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30'
                            }`}
                            onClick={() => handleCardToggle('identity')}
                          >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-2 rounded-lg ${
                                    zenMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  <Server size={18} />
                                </div>
                                <div
                                  className={`text-xs font-bold uppercase ${
                                    zenMode ? 'text-zinc-400' : 'text-zinc-500'
                                  }`}
                                >
                                  IDENTITY & STATUS
                                </div>
                              </div>
                              <HelpCircle size={12} className="text-zinc-600 hover:text-white z-20" />
                            </div>

                            <div className="mt-auto relative z-10">
                              <div
                                className={`text-xl font-mono group-hover:text-blue-400 group-hover:animate-pulse ${
                                  zenMode ? 'text-white' : 'text-white'
                                }`}
                              >
                                {getSafeVersion(selectedNode)}
                              </div>

                              {/* UPDATED: Added Uptime Display beneath version in collapsed view */}
                              <div className="text-xs text-zinc-500 mt-1 font-mono flex items-center gap-1">
                                <Clock size={12} className="text-zinc-600" />
                                Up: <span className="text-zinc-400">{formatUptime(selectedNode.uptime)}</span>
                              </div>

                              {/* Existing status pill below uptime */}
                              {isSelectedNodeLatest
                                ? (
                                <div className="text-[10px] text-green-500 mt-2 font-bold bg-green-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded">
                                  <CheckCircle size={10} />
                                  UP TO DATE
                                </div>
                              ) : (
                                <div className="text-[10px] text-orange-500 mt-2 font-bold bg-orange-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded">
                                  <AlertTriangle size={10} />
                                  UPDATE NEEDED
                                </div>
                              )}

                              <div className="mt-4 flex justify-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 animate-pulse group-hover:text-blue-300 transition-colors flex items-center gap-1">
                                  <Maximize2 size={8} /> CLICK TO EXPAND
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Link href="/leaderboard">
                            <div
                              className={`h-40 p-5 rounded-2xl border group cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                                zenMode
                                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                                  : 'bg-zinc-900/50 border-zinc-800 hover:border-yellow-500/30'
                              }`}
                            >
                              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none"></div>
                              <div className="absolute top-0 right-0 p-12 bg-yellow-500/5 blur-2xl rounded-full group-hover:bg-yellow-500/10 transition"></div>

                              <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      zenMode ? 'bg-yellow-900/20 text-yellow-600' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}
                                  >
                                    <Trophy size={18} />
                                  </div>
                                  <div
                                    className={`text-xs font-bold uppercase ${
                                      zenMode ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}
                                  >
                                    REPUTATION
                                  </div>
                                </div>
                                <HelpCircle
                                  size={12}
                                  className="text-zinc-600 hover:text-white z-20"
                                  onClick={(e) => toggleTooltip(e, 'card_rank')}
                                />
                              </div>

                              {activeTooltip === 'card_rank' && (
                                <div className="absolute z-20 bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 top-12 left-4 right-4 animate-in fade-in">
                                  Rank is determined by total reputation credits.
                                </div>
                              )}

                              <div className="mt-auto relative z-10">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">
                                  Global Rank{' '}
                                  <span className="text-white text-lg ml-1">
                                    #{selectedNode?.rank || '-'}
                                  </span>
                                </div>
                                <div className="bg-zinc-800 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] rounded-lg p-3 mt-2 border-b border-white/5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-500 font-mono uppercase">
                                      Credits Earned
                                    </span>
                                    <span className="text-yellow-500 font-mono font-bold text-xs">
                                      {selectedNode?.credits !== null
                                        ? selectedNode.credits.toLocaleString()
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex justify-end">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-500/80 animate-pulse group-hover:text-yellow-300 transition-colors flex items-center gap-1">
                                  OPEN LEADERBOARD <ExternalLink size={8} />
                                </span>
                              </div>
                            </div>
                          </Link>

                          <Link href={`/map?focus=${getSafeIp(selectedNode)}`}>
                            <div
                              className={`h-40 p-5 rounded-2xl border group cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                                zenMode
                                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                                  : 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30'
                              }`}
                            >
                              <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-xl rounded-full group-hover:bg-blue-500/10 transition group-hover:scale-150 duration-700"></div>

                              <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      zenMode ? 'bg-blue-900/20 text-blue-600' : 'bg-blue-500/10 text-blue-500'
                                    }`}
                                  >
                                    <Globe size={18} />
                                  </div>
                                  <div
                                    className={`text-xs font-bold uppercase ${
                                      zenMode ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}
                                  >
                                    PHYSICAL LAYER
                                  </div>
                                </div>
                                <HelpCircle
                                  size={12}
                                  className="text-zinc-600 hover:text-white z-20"
                                  onClick={(e) => toggleTooltip(e, 'card_loc')}
                                />
                              </div>

                              {activeTooltip === 'card_loc' && (
                                <div className="absolute z-20 bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 top-12 left-4 right-4 animate-in fade-in">
                                  Approximate physical location based on IP triangulation.
                                </div>
                              )}

                              <div className="mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                <PhysicalLocationBadge node={selectedNode} zenMode={zenMode} />
                                <div className="mt-3 flex justify-end">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 animate-pulse group-hover:text-blue-300 transition-colors flex items-center gap-1">
                                    OPEN MAP VIEW <ExternalLink size={8} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* --- FOOTER CONTENT MOVED INSIDE SCROLLABLE AREA (MOBILE FIX) --- */}
              {!compareMode && !shareMode && (
                <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-col gap-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-zinc-800/50">
                      <Clock size={10} /> Last Seen:{' '}
                      <span className="text-zinc-300 font-mono">{timeAgo}</span>{' '}
                      <span className="text-zinc-600">
                        ({formatDetailedTimestamp(selectedNode.last_seen_timestamp)})
                      </span>
                    </div>
                    <button
                      onClick={(e) => copyNodeUrl(e, selectedNode.pubkey || '')}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400 transition group"
                    >
                      <LinkIcon size={12} />
                      {copiedField === 'url' ? 'LINK COPIED' : 'COPY NODE URL'}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setCompareMode(true)}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition hover:scale-[1.02] border border-zinc-700"
                    >
                      <Swords size={16} className="text-red-400" /> COMPARE NODES
                    </button>
                    <button
                      onClick={() => setShareMode(true)}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                    >
                      <Camera size={16} /> PROOF OF PULSE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!zenMode && (
        <footer className="border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center">
          <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
          <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">
            Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage
            capacity, and network consensus metrics directly from the blockchain.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600 mb-4">
            <span className="opacity-50">pRPC Powered</span>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-1">
              <span>Built by</span>
              <a
                href="https://twitter.com/33xp_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1"
              >
                riot' <Twitter size={10} />
              </a>
            </div>
            <span className="text-zinc-800">|</span>
            <a
              href="https://github.com/Idle0x/xandeum-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              Open Source <ExternalLink size={10} />
            </a>
          </div>
          <Link
            href="/docs"
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 flex items-center justify-center gap-1 mt-4"
          >
            <BookOpen size={10} /> System Architecture & Docs
          </Link>
        </footer>
      )}
    </div>
  );
}
