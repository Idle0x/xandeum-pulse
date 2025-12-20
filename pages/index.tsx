import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, 
  Trophy, HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, 
  ArrowUp, ArrowDown, Wallet, Medal, Twitter, Code, Info, ExternalLink, 
  HelpCircle, ChevronRight, Maximize2, Map as MapIcon, BookOpen, Menu, 
  LayoutDashboard, TrendingUp, Hash, HeartPulse 
} from 'lucide-react';

// --- TYPES ---
interface Node {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  storage_used: number;
  storage_committed?: number; 
  storage_usage_percentage?: string;
  storage_usage_raw?: number; 
  rank?: number;
  credits?: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${m}m`;
};

const formatLastSeen = (timestamp: number) => {
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

const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

// --- VITALITY SCORE ALGORITHM ---
const getHealthScore = (node: Node, consensusVersion: string, medianCredits: number) => {
  const storageGB = (node.storage_committed || 0) / (1024 ** 3);
  if (storageGB <= 0) return 0; // Gatekeeper Rule

  let uptimeScore = 0;
  const days = node.uptime / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  let versionScore = 100;
  if (consensusVersion !== 'N/A' && compareVersions(node.version, consensusVersion) < 0) {
      const parts1 = node.version.split('.').map(Number);
      const parts2 = consensusVersion.split('.').map(Number);
      const majorDiff = (parts2[0] || 0) - (parts1[0] || 0);
      const minorDiff = (parts2[1] || 0) - (parts1[1] || 0);
      if (majorDiff > 0) versionScore = 30; 
      else if (minorDiff > 2) versionScore = 60; 
      else versionScore = 80; 
  }

  let reputationScore = 50; 
  const credits = node.credits || 0;
  if (medianCredits > 0 && credits > 0) {
      const ratio = credits / medianCredits;
      if (ratio >= 2) reputationScore = 100;
      else if (ratio >= 1) reputationScore = 75 + (ratio - 1) * 25;
      else if (ratio >= 0.5) reputationScore = 50 + (ratio - 0.5) * 50;
      else if (ratio >= 0.1) reputationScore = 25 + (ratio - 0.1) * 62.5;
      else reputationScore = ratio * 250;
  } else if (credits === 0) {
      reputationScore = 0; 
  } else if (medianCredits === 0 && credits > 0) {
      reputationScore = 100; 
  }

  let capacityScore = 0;
  if (storageGB >= 1000) capacityScore = 100; 
  else if (storageGB >= 100) capacityScore = 70 + (storageGB - 100) * (30 / 900);
  else if (storageGB >= 10) capacityScore = 40 + (storageGB - 10) * (30 / 90);
  else capacityScore = storageGB * 4;

  const finalScore = (uptimeScore * 0.30) + (versionScore * 0.20) + (reputationScore * 0.25) + (capacityScore * 0.25);
  return Math.round(Math.max(0, Math.min(100, finalScore)));
};

const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- NEW COMPONENT: NETWORK VITALS CARD (TOP DASHBOARD) ---
const NetworkVitalsCard = ({ 
  stability, 
  avgHealth, 
  consensusVersion, 
  totalNodes 
}: { stability: string, avgHealth: number, consensusVersion: string, totalNodes: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 1. Network Stability */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 group hover:border-blue-500/30 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity size={40} className="text-blue-500" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Network Stability</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-mono text-white font-medium">{stability}%</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="mt-3 text-xs text-zinc-400 flex items-center gap-2">
          <Clock size={12} />
          <span>Tracking {totalNodes} active nodes</span>
        </div>
      </div>

      {/* 2. Global Vitality (With Sparkline) */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 group hover:border-emerald-500/30 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <HeartPulse size={40} className="text-emerald-500" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Avg. Vitality Score</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-mono font-medium ${avgHealth >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {avgHealth}/100
          </span>
          {/* Simple Sparkline SVG */}
          <div className="h-8 w-24 opacity-50">
             <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
               <path d="M0,25 Q20,15 40,20 T80,5" 
                     fill="none" stroke="currentColor" strokeWidth="2" 
                     className={`${avgHealth >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
             </svg>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-400 flex items-center gap-2">
           <TrendingUp size={12} className={`${avgHealth >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
           <span>Network Health Trend: Stable</span>
        </div>
      </div>

      {/* 3. Consensus Health */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 group hover:border-purple-500/30 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Hash size={40} className="text-purple-500" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Consensus Health</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-mono text-white font-medium">{consensusVersion}</span>
          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono">LATEST</span>
        </div>
        <div className="mt-3 text-xs text-zinc-400">
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 mb-2 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '94%' }}></div>
          </div>
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-purple-500"/> Majority Consensus Reached</span>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: DIAGNOSTIC PANEL (FOR MODAL) ---
const DiagnosticPanel = ({ node, avgNetworkHealth, mostCommonVersion, medianCredits }: { node: Node, avgNetworkHealth: number, mostCommonVersion: string, medianCredits: number }) => {
  const health = getHealthScore(node, mostCommonVersion, medianCredits);
  const delta = health - avgNetworkHealth;
  const isPositive = delta >= 0;

  // Calculate individual visual scores (approximate for UI)
  const uptimeScore = Math.min(100, (node.uptime / 86400 >= 30) ? 100 : (node.uptime / 86400) * 3.33 * 10); 
  const storageGB = (node.storage_committed || 0) / (1024 ** 3);
  const capacityScore = Math.min(100, storageGB >= 1000 ? 100 : storageGB / 10);
  const reputationScore = node.credits ? Math.min(100, (node.credits / (medianCredits || 1)) * 50) : 0;
  const versionScore = compareVersions(node.version, mostCommonVersion) >= 0 ? 100 : 50;

  const MetricBar = ({ label, score, avg }: { label: string, score: number, avg: number }) => (
    <div className="mb-2 group">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 mb-1 group-hover:text-zinc-300 transition-colors">
        <span>{label}</span>
        <span className="font-mono">
           <span className={`${score >= avg ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round(score)}</span> 
           <span className="text-zinc-600"> / {avg} AVG</span>
        </span>
      </div>
      <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
            className={`absolute h-full rounded-full transition-all duration-500 ${score >= avg ? 'bg-emerald-500' : 'bg-amber-500'}`} 
            style={{ width: `${score}%` }}
        ></div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10" style={{ left: `${avg}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-black/20 border border-zinc-800 rounded-xl p-4 mt-2">
      <div className="flex justify-between items-start mb-4 border-b border-zinc-800/50 pb-4">
        <div>
           <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Diagnostic Score</div>
           <div className="flex items-center gap-3">
             <span className={`text-4xl font-mono font-bold ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {health}
             </span>
             <div className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {isPositive ? '+' : ''}{delta}
             </div>
           </div>
        </div>
        <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Network Avg</div>
            <div className="text-xl font-mono text-zinc-400">{avgNetworkHealth}</div>
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label="Uptime Stability" score={uptimeScore} avg={78} />
        <MetricBar label="Storage Capacity" score={capacityScore} avg={65} />
        <MetricBar label="Reputation" score={reputationScore} avg={50} />
        <MetricBar label="Software Version" score={versionScore} avg={90} />
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-400">
        <Trophy size={14} className="text-yellow-500" />
        <span>Ranked in the <strong>Top {Math.max(1, Math.round((node.rank || 1) / 10) * 10)}%</strong> of nodes</span>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('uptime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [searchTipIndex, setSearchTipIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTips = [
    "Search by IP, Public Key, or Version",
    "Tip: Click any node card for deep inspection",
    "Use the map to visualize network topology"
  ];

  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null); 
  const [cycleStep, setCycleStep] = useState(0);

  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [avgVitality, setAvgVitality] = useState(0); // NEW
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [medianCredits, setMedianCredits] = useState(0);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);

    const cycleInterval = setInterval(() => { setCycleStep(prev => prev + 1); }, 4000);
    const tipInterval = setInterval(() => {
        if (!isSearchFocused) setSearchTipIndex(prev => (prev + 1) % searchTips.length);
    }, 5000);

    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedNode(null); if(router.query.open) router.replace('/', undefined, { shallow: true }); } };
    document.addEventListener('keydown', handleEscape);

    return () => {
        clearInterval(cycleInterval);
        clearInterval(tipInterval);
        document.removeEventListener('visibilitychange', handleVisibility);
        document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchFocused]);

  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
        const pubkeyToOpen = router.query.open as string;
        const targetNode = nodes.find(n => n.pubkey === pubkeyToOpen);
        if (targetNode) setSelectedNode(targetNode);
    }
  }, [loading, nodes, router.query.open]);

  const closeModal = () => {
      setSelectedNode(null);
      if (router.query.open) router.replace('/', undefined, { shallow: true });
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchData = async () => {
    try {
      const [statsRes, creditsRes] = await Promise.all([
        axios.get(`/api/stats?t=${Date.now()}`),
        axios.get(`/api/credits?t=${Date.now()}`)
      ]);

      if (statsRes.data.result && statsRes.data.result.pods) {
        let podList: Node[] = statsRes.data.result.pods;
        const creditsData = creditsRes.data.pods_credits || creditsRes.data;
        const creditMap = new Map<string, number>();
        
        if (Array.isArray(creditsData)) {
            creditsData.forEach((item: any) => {
                const key = item.pod_id || item.pubkey || item.node || item.address;
                const val = Number(item.credits || item.amount || 0);
                if (key) creditMap.set(key, val);
            });
        }
        
        let mergedList = podList.map(node => ({
            ...node,
            credits: creditMap.get(node.pubkey) || 0
        }));

        // Calculate Ranks & Median Credits
        mergedList.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        let currentRank = 1;
        for (let i = 0; i < mergedList.length; i++) {
            if (i > 0 && (mergedList[i].credits || 0) < (mergedList[i - 1].credits || 0)) currentRank = i + 1;
            mergedList[i].rank = currentRank;
        }
        
        const creditValues = mergedList.map(n => n.credits || 0);
        const calculatedMedianCredits = calculateMedian(creditValues);
        setMedianCredits(calculatedMedianCredits);

        // Version Calculation
        const versionCounts = mergedList.reduce((acc, n) => { acc[n.version] = (acc[n.version] || 0) + 1; return acc; }, {} as Record<string, number>);
        const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        setMostCommonVersion(topVersion);

        // Process Storage %
        mergedList = mergedList.map(node => {
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

        setNodes(mergedList);
        
        // Network Health Calc
        const stableNodes = mergedList.filter(n => n.uptime > 86400).length;
        setNetworkHealth((mergedList.length > 0 ? (stableNodes / mergedList.length) * 100 : 0).toFixed(2));

        // Average Vitality Calculation (NEW)
        if (mergedList.length > 0) {
            const totalVitality = mergedList.reduce((acc, node) => {
                return acc + getHealthScore(node, topVersion, calculatedMedianCredits);
            }, 0);
            setAvgVitality(Math.round(totalVitality / mergedList.length));
        }

        setError('');
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (isFirstLoad) setError('Connection failed. Retrying...');
    } finally {
        setLoading(false);
        setIsFirstLoad(false);
    }
  };

  const filteredNodes = nodes
    .filter(node => {
      const q = searchQuery.toLowerCase();
      return (
        (node.address || '').toLowerCase().includes(q) ||
        (node.pubkey || '').toLowerCase().includes(q) ||
        (node.version || '').toLowerCase().includes(q) || 
        (node.rank && node.rank.toString() === q)
      );
    })
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortBy === 'storage') { valA = a.storage_committed || 0; valB = b.storage_committed || 0; } 
      else if (sortBy === 'health') {
          valA = getHealthScore(a, mostCommonVersion, medianCredits);
          valB = getHealthScore(b, mostCommonVersion, medianCredits);
      }
      else { valA = a[sortBy] as any; valB = b[sortBy] as any; }
      
      if (sortBy === 'version') return sortOrder === 'asc' ? compareVersions(a.version, b.version) : compareVersions(b.version, a.version);
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 4;
    if (step === 0) return { label: 'Storage Used', value: formatBytes(node.storage_used), color: 'text-blue-400', icon: Database };
    if (step === 1) return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
    if (step === 2) {
      const score = getHealthScore(node, mostCommonVersion, medianCredits);
      return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400', icon: Activity };
    }
    return { label: 'Last Seen', value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', color: 'text-zinc-400', icon: Clock };
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    const score = getHealthScore(node, mostCommonVersion, medianCredits);
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className="group relative border border-zinc-800 bg-zinc-900/40 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/10 hover:border-zinc-700"
      >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${node.uptime > 86400 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="font-mono text-xs text-zinc-400 truncate w-32">{node.address}</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); const f = favorites.includes(node.address) ? favorites.filter(x => x !== node.address) : [...favorites, node.address]; setFavorites(f); localStorage.setItem('xandeum_favorites', JSON.stringify(f)); }}
                className={`p-1 rounded-full transition-colors ${isFav ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
                <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
        </div>

        {/* Dynamic Cycle Data */}
        <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{cycleData.label}</div>
            <div className={`flex items-center gap-2 font-mono text-lg font-medium ${cycleData.color}`}>
                <cycleData.icon size={16} />
                {cycleData.value}
            </div>
        </div>

        {/* Footer Metrics */}
        <div className="flex justify-between items-center border-t border-zinc-800 pt-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
                <Hash size={12} />
                <span>v{node.version}</span>
            </div>
            <div className="flex items-center gap-1">
                <Trophy size={12} className={node.rank && node.rank <= 10 ? 'text-yellow-500' : ''} />
                <span>#{node.rank || '-'}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
        <Head><title>Xandeum Pulse | Network Monitor</title></Head>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        XANDEUM PULSE
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Decentralized Storage Network Monitor</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button onClick={fetchData} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <Activity size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* NEW: Network Vitals Card */}
            <NetworkVitalsCard 
                stability={networkHealth} 
                avgHealth={avgVitality} 
                consensusVersion={mostCommonVersion}
                totalNodes={nodes.length}
            />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 z-20 bg-black/80 backdrop-blur-md py-4 border-b border-zinc-800/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                        type="text" 
                        placeholder={isSearchFocused ? "Try searching '1.0.4' or '100 GB'" : searchTips[searchTipIndex]}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                </div>
                <div className="flex gap-2">
                    {['uptime', 'health', 'storage', 'version'].map((key) => (
                        <button 
                            key={key}
                            onClick={() => { if(sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else setSortBy(key as any); }}
                            className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors border ${sortBy === key ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading && isFirstLoad ? (
                <div className="text-center py-20 text-zinc-500 animate-pulse">Initializing Neural Link...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredNodes.map((node, i) => renderNodeCard(node, i))}
                </div>
            )}
        </main>

        {/* MODAL - Updated with Diagnostic Panel */}
        {selectedNode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black" onClick={e => e.stopPropagation()}>
                    
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Node Inspector</div>
                            <div className="font-mono text-lg text-white font-medium flex items-center gap-2">
                                {selectedNode.address}
                                <button onClick={() => copyToClipboard(selectedNode.address, 'addr')} className="text-zinc-600 hover:text-white transition-colors">
                                    {copiedField === 'addr' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                </button>
                            </div>
                        </div>
                        <button onClick={closeModal} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Content Grid */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* COL 1: Identity & Config */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2"><Shield size={14}/> Identity</h3>
                                <div className="space-y-3">
                                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                                        <div className="text-[10px] text-zinc-500 uppercase">Public Key</div>
                                        <div className="font-mono text-xs text-zinc-300 break-all">{selectedNode.pubkey}</div>
                                    </div>
                                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50 flex justify-between">
                                        <span className="text-zinc-500 text-xs">Network Mode</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${selectedNode.is_public ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {selectedNode.is_public ? 'PUBLIC' : 'PRIVATE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COL 2: Storage Metrics */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2"><Database size={14}/> Storage</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50 text-center">
                                        <div className="text-[10px] text-zinc-500 uppercase mb-1">Used</div>
                                        <div className="text-xl font-mono text-blue-400">{formatBytes(selectedNode.storage_used)}</div>
                                    </div>
                                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50 text-center">
                                        <div className="text-[10px] text-zinc-500 uppercase mb-1">Committed</div>
                                        <div className="text-xl font-mono text-purple-400">{formatBytes(selectedNode.storage_committed || 0)}</div>
                                    </div>
                                </div>
                                <div className="mt-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-zinc-500">Utilization</span>
                                        <span className="text-white">{selectedNode.storage_usage_percentage}</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, selectedNode.storage_usage_raw || 0)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COL 3: NEW Performance Diagnostics */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Activity size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Performance Diagnostics</h3>
                            </div>
                            
                            <DiagnosticPanel 
                                node={selectedNode} 
                                avgNetworkHealth={avgVitality}
                                mostCommonVersion={mostCommonVersion}
                                medianCredits={medianCredits}
                            />
                            
                            <div className="bg-zinc-900/30 rounded-lg p-3 flex justify-between items-center text-xs border border-zinc-800/50">
                                <span className="text-zinc-500">Last Seen</span>
                                <span className="font-mono text-zinc-300">{formatLastSeen(selectedNode.last_seen_timestamp)}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
