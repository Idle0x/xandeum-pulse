import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, 
  HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, 
  ArrowDown, Wallet, Medal, Twitter, Code, Info, ExternalLink, HelpCircle, 
  ChevronRight, Maximize2, Map as MapIcon, BookOpen, Menu, LayoutDashboard, 
  HeartPulse, Swords, Share2, Monitor, ArrowLeftRight, Camera, BarChart2, ChevronLeft 
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
const formatBytes = (bytes: number | undefined) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatRawBytes = (bytes: number | undefined) => {
  return bytes ? bytes.toLocaleString() : '0';
};

const formatUptime = (seconds: number | undefined) => {
  if (!seconds) return '0m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
};

const formatLastSeen = (timestamp: number | undefined) => {
  if (!timestamp) return 'Unknown';
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
  if (!timestamp) return 'N/A';
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  return new Date(time).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
};

const compareVersions = (v1: string = '0.0.0', v2: string = '0.0.0') => {
  const s1 = v1 || '0.0.0';
  const s2 = v2 || '0.0.0';
  const parts1 = s1.split('.').map(Number);
  const parts2 = s2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

// --- RESTORED COMPLEX HEALTH ALGORITHM ---
const calculateVitalityMetrics = (node: Node | null, consensusVersion: string, medianCredits: number) => {
  if (!node) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, capacity: 0 } };

  const storageGB = (node.storage_committed || 0) / (1024 ** 3);
  if (storageGB <= 0) return { total: 0, breakdown: { uptime: 0, version: 0, reputation: 0, capacity: 0 } };

  // 1. Tiered Uptime Scoring
  let uptimeScore = 0;
  const days = (node.uptime || 0) / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  // 2. Version Consensus Scoring
  let versionScore = 100;
  const nodeVer = node.version || '0.0.0';
  if (consensusVersion !== 'N/A' && compareVersions(nodeVer, consensusVersion) < 0) {
      const parts1 = nodeVer.split('.').map(Number);
      const parts2 = consensusVersion.split('.').map(Number);
      const majorDiff = (parts2[0] || 0) - (parts1[0] || 0);
      const minorDiff = (parts2[1] || 0) - (parts1[1] || 0);
      if (majorDiff > 0) versionScore = 30; 
      else if (minorDiff > 2) versionScore = 60; 
      else versionScore = 80; 
  }

  // 3. Reputation Scoring (Relative to Median)
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

  // 4. Capacity Scoring
  let capacityScore = 0;
  if (storageGB >= 1000) capacityScore = 100; 
  else if (storageGB >= 100) capacityScore = 70 + (storageGB - 100) * (30 / 900);
  else if (storageGB >= 10) capacityScore = 40 + (storageGB - 10) * (30 / 90);
  else capacityScore = storageGB * 4;

  const finalScore = (uptimeScore * 0.30) + (versionScore * 0.20) + (reputationScore * 0.25) + (capacityScore * 0.25);
  
  return {
      total: Math.round(Math.max(0, Math.min(100, finalScore))),
      breakdown: {
          uptime: Math.round(uptimeScore),
          version: Math.round(versionScore),
          reputation: Math.round(reputationScore),
          capacity: Math.round(capacityScore)
      }
  };
};

const getHealthScore = (node: Node, consensusVersion: string, medianCredits: number) => {
    return calculateVitalityMetrics(node, consensusVersion, medianCredits).total;
};

const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- COMPONENTS ---

const RadialProgress = ({ score, size = 160, stroke = 12 }: { score: number, size?: number, stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'; // Green, Yellow, Red

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
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Health</span>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-white/5 opacity-0 group-hover:opacity-100 transition-opacity animate-ping pointer-events-none"></div>
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('uptime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // MODAL STATES
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Node | null>(null);
  const [shareMode, setShareMode] = useState(false);
  const [modalView, setModalView] = useState<'overview' | 'health' | 'storage'>('overview'); // NEW: Drill-down state
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null); 
  const [cycleStep, setCycleStep] = useState(0);

  // GLOBAL STATES
  const [warRoom, setWarRoom] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // NETWORK DATA
  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [avgNetworkHealth, setAvgNetworkHealth] = useState(0); 
  const [networkConsensus, setNetworkConsensus] = useState(0); 
  const [globalHealthBreakdown, setGlobalHealthBreakdown] = useState({ uptime: 0, capacity: 0, reputation: 0, version: 0 });
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [medianCommitted, setMedianCommitted] = useState(0);
  const [medianCredits, setMedianCredits] = useState(0);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);

    const cycleInterval = setInterval(() => { setCycleStep(prev => prev + 1); }, 4000);
    
    // Auto-refresh interval (30s)
    const dataInterval = setInterval(fetchData, 30000);

    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeModal(); } };
    document.addEventListener('keydown', handleEscape);

    return () => {
        clearInterval(cycleInterval);
        clearInterval(dataInterval);
        document.removeEventListener('visibilitychange', handleVisibility);
        document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Sync Modal with URL
  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
        const pubkeyToOpen = router.query.open as string;
        const targetNode = nodes.find(n => n.pubkey === pubkeyToOpen);
        if (targetNode) {
            setSelectedNode(targetNode);
            setModalView('overview'); // Always start at overview
        }
    }
  }, [loading, nodes, router.query.open]);

  // Handle Modal Close & URL Cleanup
  const closeModal = () => {
      setSelectedNode(null);
      setCompareMode(false);
      setShareMode(false);
      setCompareTarget(null);
      setModalView('overview');
      if (router.query.open) router.replace('/', undefined, { shallow: true });
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
    const health = getHealthScore(node, mostCommonVersion, medianCredits);
    const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address}\nStatus: ${node.uptime > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${health}/100\nMonitor at: https://xandeum-pulse.vercel.app`;
    navigator.clipboard.writeText(report);
    setCopiedField('report');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const health = getHealthScore(node, mostCommonVersion, medianCredits);
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${node.uptime > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${health}/100\n💰 Credits: ${node.credits?.toLocaleString() || 0}\n\nMonitor here:`;
    const url = "https://xandeum-pulse.vercel.app";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Utilization_Percent,Health_Score,Access_Policy,Last_Seen_ISO,RPC_URL,Is_Favorite\n';
    const rows = filteredNodes.map(n => {
        const health = getHealthScore(n, mostCommonVersion, medianCredits);
        const utilization = n.storage_usage_percentage?.replace('%', '') || '0';
        const mode = n.is_public ? 'Public' : 'Private';
        const isoTime = new Date(n.last_seen_timestamp < 10000000000 ? n.last_seen_timestamp * 1000 : n.last_seen_timestamp).toISOString();
        return `${n.address},${n.pubkey},${n.rank},${n.credits},${n.version},${n.uptime},${n.storage_committed},${n.storage_used},${utilization},${health},${mode},${isoTime},http://${n.address.split(':')[0]}:6000,${favorites.includes(n.address)}`;
    });
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

        // Ranking Logic
        mergedList.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        let currentRank = 1;
        for (let i = 0; i < mergedList.length; i++) {
            if (i > 0 && (mergedList[i].credits || 0) < (mergedList[i - 1].credits || 0)) currentRank = i + 1;
            mergedList[i].rank = currentRank;
        }

        // Processing
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
        setLastUpdated(new Date().toLocaleTimeString());
        
        // Global Stats Calculation
        const stableNodes = mergedList.filter(n => n.uptime > 86400).length;
        setNetworkHealth((mergedList.length > 0 ? (stableNodes / mergedList.length) * 100 : 0).toFixed(2));

        if (mergedList.length > 0) {
            const versionCounts = mergedList.reduce((acc, n) => { 
                const ver = n.version || '0.0.0';
                acc[ver] = (acc[ver] || 0) + 1; 
                return acc; 
            }, {} as Record<string, number>);
            const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '0.0.0';
            setMostCommonVersion(topVersion);
            
            setTotalStorageUsed(mergedList.reduce((sum, n) => sum + (n.storage_used || 0), 0));
            setTotalStorageCommitted(mergedList.reduce((sum, n) => sum + (n.storage_committed || 0), 0));
            setMedianCommitted(calculateMedian(mergedList.map(n => n.storage_committed || 0)));
            setMedianCredits(calculateMedian(mergedList.map(n => n.credits || 0)));

            let sumHealth = 0, sumUptime = 0, sumCap = 0, sumRep = 0, sumVer = 0;
            let consensusCount = 0;

            mergedList.forEach(n => {
                const stats = calculateVitalityMetrics(n, topVersion, medianCredits); // Fixed typo: medCreds -> medianCredits
                sumHealth += stats.total;
                sumUptime += stats.breakdown.uptime;
                sumCap += stats.breakdown.capacity;
                sumRep += stats.breakdown.reputation;
                sumVer += stats.breakdown.version;
                if (n.version === topVersion) consensusCount++;
            });

            // Re-assign medCreds to medianCredits for scope
            const medCreds = medianCredits; // Handled by state

            setAvgNetworkHealth(Math.round(sumHealth / mergedList.length));
            setNetworkConsensus((consensusCount / mergedList.length) * 100);
            setGlobalHealthBreakdown({
                uptime: Math.round(sumUptime / mergedList.length),
                capacity: Math.round(sumCap / mergedList.length),
                reputation: Math.round(sumRep / mergedList.length),
                version: Math.round(sumVer / mergedList.length)
            });
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

  // Filter Logic
  const filteredNodes = nodes
    .filter(node => {
      const q = searchQuery.toLowerCase();
      const addr = node.address || '';
      const pub = node.pubkey || '';
      const ver = node.version || '';
      return (addr.toLowerCase().includes(q) || pub.toLowerCase().includes(q) || ver.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortBy === 'storage') { valA = a.storage_committed || 0; valB = b.storage_committed || 0; } 
      else if (sortBy === 'health') {
          valA = getHealthScore(a, mostCommonVersion, medianCredits);
          valB = getHealthScore(b, mostCommonVersion, medianCredits);
      }
      else { valA = a[sortBy] as any; valB = b[sortBy] as any; }
      
      if (sortBy === 'version') return sortOrder === 'asc' ? compareVersions(a.version || '0.0.0', b.version || '0.0.0') : compareVersions(b.version || '0.0.0', a.version || '0.0.0');
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address));

  // --- RENDER HELPERS ---
  
  const isLatest = (nodeVersion: string) => { return mostCommonVersion !== 'N/A' && compareVersions(nodeVersion, mostCommonVersion) >= 0; };

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 4;
    if (step === 0) return { label: 'Storage Used', value: formatBytes(node.storage_used), color: warRoom ? 'text-green-400' : 'text-blue-400', icon: Database };
    if (step === 1) return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: warRoom ? 'text-green-400' : 'text-purple-400', icon: HardDrive };
    if (step === 2) {
      const score = getHealthScore(node, mostCommonVersion, medianCredits);
      return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity };
    }
    return { label: 'Last Seen', value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', color: 'text-zinc-400', icon: Clock };
  };

  const handleNodeClick = (node: Node) => {
      setSelectedNode(node);
      setCompareMode(false);
      setShareMode(false);
      setCompareTarget(null);
      setModalView('overview'); // Reset view on new open
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    const latest = isLatest(node.version || '0.0.0');
    
    return (
      <div 
        key={node.address} 
        onClick={() => handleNodeClick(node)}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl 
        ${warRoom 
            ? 'bg-black border-green-900/30 hover:border-green-500' 
            : isFav ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
        }`}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
            View Details <Maximize2 size={8} />
        </div>
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1"><div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>{!node.is_public && <Shield size={10} className="text-zinc-600" />}</div>
              <div className="relative h-6 w-56">
                  <div className={`absolute inset-0 font-mono text-sm truncate transition-opacity duration-300 group-hover:opacity-0 ${warRoom ? 'text-green-500' : 'text-zinc-300'}`}>{(node.pubkey || '').length > 12 ? `${(node.pubkey || '').slice(0, 12)}...${(node.pubkey || '').slice(-4)}` : (node.pubkey || 'Unknown Identity')}</div>
                  <div className="absolute inset-0 font-mono text-sm text-blue-400 truncate opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center gap-2"><span className="text-[10px] text-zinc-500">IP:</span> {node.address || 'N/A'}</div>
              </div>
            </div>
            <button onClick={(e) => toggleFavorite(e, node.address)} className={`p-1.5 rounded-full transition ${isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-yellow-500'}`}><Star size={16} fill={isFav ? "currentColor" : "none"} /></button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Version</span>
            <div className="flex items-center gap-2"><span className={`text-zinc-300 px-2 py-0.5 rounded ${warRoom ? 'bg-zinc-900 border border-green-900' : 'bg-zinc-800'}`}>{node.version || 'Unknown'}</span>{latest && <CheckCircle size={12} className="text-green-500" />}</div>
          </div>
          <div className="pt-2">
             <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1 tracking-wider">Network Rewards</div>
             <div className={`flex justify-between items-center text-xs p-2 rounded-lg border ${warRoom ? 'bg-zinc-900/50 border-zinc-800' : 'bg-black/40 border-zinc-800/50'}`}>
                <div className="flex items-center gap-1.5"><Medal size={12} className={node.rank === 1 ? 'text-yellow-400' : 'text-zinc-500'} /><span className="text-zinc-400 font-bold">#{node.rank && node.rank < 9999 ? node.rank : '-'}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-zinc-300 font-mono">{node.credits?.toLocaleString() || 0}</span><Wallet size={12} className="text-yellow-600" /></div>
             </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-end">
            <div className="transition-all duration-500 ease-in-out"><span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1"><cycleData.icon size={10} /> {cycleData.label}</span><span className={`text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>{cycleData.value}</span></div>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonRow = (label: string, valA: any, valB: any, format: (v: any) => string, better: 'HIGH' | 'LOW' | 'NONE') => {
      const isABetter = better === 'NONE' ? false : better === 'HIGH' ? valA > valB : valA < valB;
      const isBBetter = better === 'NONE' ? false : better === 'HIGH' ? valB > valA : valB < valA;
      
      return (
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 text-xs hover:bg-white/5 px-2 rounded">
              <div className={`flex-1 text-right font-mono flex items-center justify-end gap-2 ${isABetter ? 'text-green-400 font-bold' : 'text-zinc-400'}`}>
                  {format(valA)} {isABetter && <CheckCircle size={12} />}
              </div>
              <div className="px-4 text-[10px] text-zinc-600 uppercase font-bold w-32 text-center">{label}</div>
              <div className={`flex-1 text-left font-mono flex items-center justify-start gap-2 ${isBBetter ? 'text-green-400 font-bold' : 'text-zinc-400'}`}>
                  {isBBetter && <CheckCircle size={12} />} {format(valB)}
              </div>
          </div>
      );
  };

  // --- SUB-RENDERERS FOR MODAL DEEP DIVE ---
  
  const renderHealthBreakdown = () => {
      const stats = calculateVitalityMetrics(selectedNode, mostCommonVersion, medianCredits);
      // Mock percentile calculation for visual (in real app, sort `nodes` and find index)
      const healthPercentile = Math.round((stats.total / 100) * 100); 
      
      return (
          <div className="animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={16} className="text-green-500" /> HEALTH BREAKDOWN</h3>
                  <button onClick={() => setModalView('overview')} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><ChevronLeft size={12} /> BACK</button>
              </div>
              <div className="space-y-4">
                  {[
                      { label: 'Uptime Stability', val: stats.breakdown.uptime, avg: globalHealthBreakdown.uptime },
                      { label: 'Version Consensus', val: stats.breakdown.version, avg: globalHealthBreakdown.version },
                      { label: 'Reputation', val: stats.breakdown.reputation, avg: globalHealthBreakdown.reputation },
                      { label: 'Storage Capacity', val: stats.breakdown.capacity, avg: globalHealthBreakdown.capacity }
                  ].map((m) => (
                      <div key={m.label} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                          <div className="flex justify-between text-xs mb-2">
                              <span className="text-zinc-400">{m.label}</span>
                              <div className="flex gap-2">
                                  <span className="font-mono text-white">{m.val}/100</span>
                                  <span className={`text-[10px] px-1.5 rounded ${m.val >= m.avg ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                      {m.val >= m.avg ? '▲' : '▼'} vs Avg
                                  </span>
                              </div>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${m.val}%` }}></div>
                              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_white] z-10" style={{ left: `${m.avg}%` }} title="Network Average"></div>
                          </div>
                      </div>
                  ))}
                  <div className="mt-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl text-center">
                      <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Performance Ranking</div>
                      <div className="text-lg text-white font-bold">Top {100 - healthPercentile}% <span className="text-zinc-500 text-xs font-normal">of Network</span></div>
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
      const percentDiff = ((diff / median) * 100).toFixed(1);
      
      // Scaling for visualization
      const maxScale = Math.max(nodeCap, median) * 1.5;
      const nodeWidth = Math.min(100, (nodeCap / maxScale) * 100);
      const medianPos = Math.min(100, (median / maxScale) * 100);

      return (
          <div className="animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Database size={16} className="text-blue-500" /> STORAGE ANALYSIS</h3>
                  <button onClick={() => setModalView('overview')} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><ChevronLeft size={12} /> BACK</button>
              </div>
              
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 text-center mb-4">
                  <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Vs Network Median</div>
                  <div className={`text-3xl font-extrabold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{percentDiff}%
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Capacity Difference</div>
              </div>

              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-6">
                  <div>
                      <div className="flex justify-between text-xs mb-1 text-zinc-400">
                          <span>Your Node</span>
                          <span className="text-white font-mono">{formatBytes(nodeCap)}</span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${nodeWidth}%` }}></div>
                      </div>
                  </div>
                  
                  <div className="relative">
                      <div className="flex justify-between text-xs mb-1 text-zinc-400">
                          <span>Network Median</span>
                          <span className="text-white font-mono">{formatBytes(median)}</span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10 h-full" style={{ left: `${medianPos}%` }}></div>
                          <div className="h-full bg-zinc-700/50 w-full"></div>
                      </div>
                      <div className="text-[10px] text-center text-zinc-500 mt-2">The median represents the standard commitment level across all active nodes.</div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${warRoom ? 'bg-black text-green-500 selection:bg-green-900/30' : 'bg-[#09090b] text-zinc-100 selection:bg-blue-500/30'}`}>
      <Head><title>Xandeum Pulse {warRoom ? '[WAR ROOM]' : ''}</title></Head>
      
      {/* LOADING OVERLAY */}
      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      {/* --- SIDE NAVIGATION (DRAWER) --- */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-[#09090b] border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-white tracking-widest uppercase flex items-center gap-2"><Activity className="text-blue-500" size={18}/> Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <nav className="flex-grow space-y-2">
                <Link href="/"><div className="flex items-center gap-3 p-3 bg-zinc-900/50 text-white rounded-lg border border-zinc-700 cursor-pointer"><LayoutDashboard size={18}/><span className="text-sm font-bold">Dashboard</span></div></Link>
                <Link href="/map"><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"><MapIcon size={18}/><span className="text-sm font-bold">Global Map</span></div></Link>
                <Link href="/leaderboard"><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"><Trophy size={18}/><span className="text-sm font-bold">Leaderboard</span></div></Link>
                <Link href="/docs"><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"><BookOpen size={18}/><span className="text-sm font-bold">Documentation</span></div></Link>
            </nav>

            <div className="mt-auto border-t border-zinc-800 pt-6 space-y-4">
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Quick Actions</div>
                    <button onClick={exportCSV} className="w-full py-2 bg-black border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-500 transition flex items-center justify-center gap-2"><Download size={14}/> Export Data</button>
                </div>
            </div>
        </div>
      </div>
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>}

      {/* --- MAIN HEADER --- */}
      {!warRoom && (
        <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition"><Menu size={24}/></button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2"><Activity className="text-blue-500" /> PULSE</h1>
                        <span className="text-[10px] text-zinc-500 font-mono">SYNC: {lastUpdated || '--:--'}</span>
                    </div>
                </div>
                {/* Mobile Refresh */}
                <button onClick={fetchData} className="md:hidden p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-blue-400"><Zap size={18} className={loading ? "animate-spin" : ""} /></button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search IP / PubKey..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500 outline-none w-full shadow-inner text-white"
                    />
                </div>
                
                {/* DESKTOP CONTROLS */}
                <div className="hidden md:flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 bg-zinc-900 border border-zinc-800 text-blue-400 rounded-lg hover:bg-zinc-800 hover:text-blue-300 transition" title="Refresh Data">
                        <Zap size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="h-6 w-px bg-zinc-800 mx-1"></div>
                    
                    {[
                        { id: 'uptime', icon: Clock, label: 'UPTIME' },
                        { id: 'storage', icon: Database, label: 'STORAGE' },
                        { id: 'version', icon: Server, label: 'VERSION' },
                        { id: 'health', icon: HeartPulse, label: 'HEALTH' } 
                    ].map((opt) => (
                        <button key={opt.id} onClick={() => { if (sortBy === opt.id) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else setSortBy(opt.id as any); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border whitespace-nowrap ${sortBy === opt.id ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                            <opt.icon size={14} /> {opt.label}
                            {sortBy === opt.id && (sortOrder === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />)}
                        </button>
                    ))}

                    <div className="h-6 w-px bg-zinc-800 mx-1"></div>
                    <button 
                        onClick={() => setWarRoom(true)} 
                        className="p-2 bg-red-900/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-900/30 hover:text-red-400 transition flex items-center gap-2 group"
                        title="Enter War Room Mode"
                    >
                        <Monitor size={18} /> <span className="text-xs font-bold group-hover:tracking-wider transition-all">WAR ROOM</span>
                    </button>
                </div>
            </div>
        </header>
      )}

      {/* --- WAR ROOM HEADER --- */}
      {warRoom && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
              <button onClick={() => setWarRoom(false)} className="px-6 py-2 bg-black border border-green-500/50 text-green-500 hover:bg-green-500/10 rounded text-xs font-bold font-mono tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all">
                  EXIT WAR ROOM
              </button>
          </div>
      )}

      <main className={`p-4 md:p-8 ${warRoom ? 'max-w-full' : 'max-w-7xl mx-auto'}`}>
          
          {/* NETWORK VITALS */}
          {!warRoom && !loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Capacity</div>
                    <div className="text-2xl md:text-3xl font-bold text-white mt-1">{formatBytes(totalStorageCommitted)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1"><HeartPulse size={12} className="text-green-500" /> Network Vitals</div>
                        <div className="space-y-1 mt-1">
                            <div className="flex justify-between text-xs"><span className="text-zinc-400">Stability</span><span className="font-mono font-bold text-white">{networkHealth}%</span></div>
                            <div className="flex justify-between text-xs"><span className="text-zinc-400">Avg Health</span><span className="font-mono font-bold text-green-400">{avgNetworkHealth}/100</span></div>
                            <div className="flex justify-between text-xs"><span className="text-zinc-400">Consensus</span><span className="font-mono font-bold text-blue-400">{networkConsensus.toFixed(1)}%</span></div>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Consensus Ver</div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{mostCommonVersion}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Nodes</div>
                    <div className="text-2xl md:text-3xl font-bold text-white mt-1">{nodes.length}</div>
                </div>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
              <div className="flex items-center gap-2"><AlertTriangle size={20} /><span>{error}</span></div>
              <button onClick={fetchData} className="text-xs underline hover:text-white">Retry</button>
            </div>
          )}

          {/* WATCHLIST */}
          {!warRoom && favorites.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-2 mb-4"><Star className="text-yellow-500" fill="currentColor" size={20} /><h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3></div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">{watchListNodes.map((node, i) => renderNodeCard(node, i))}</div>
            </div>
          )}

          {/* NODE GRID */}
          {loading && nodes.length === 0 ? <PulseGraphLoader /> : (
              <div className={`grid gap-4 ${warRoom ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} pb-20`}>
                  {filteredNodes.slice(0, warRoom ? 500 : 50).map((node, i) => renderNodeCard(node, i))}
              </div>
          )}
      </main>

      {/* --- THE ULTRA MODAL --- */}
      {selectedNode && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={closeModal}>
              <div 
                className="bg-[#09090b] border border-zinc-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* MODAL HEADER */}
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-white/10">
                              {selectedNode.pubkey.slice(0, 2)}
                          </div>
                          <div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                                  NODE INSPECTOR 
                                  <span className={`px-2 py-0.5 rounded text-[9px] ${selectedNode.is_public ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                      {selectedNode.is_public ? 'ACCESS: OPEN' : 'ACCESS: RESTRICTED'}
                                  </span>
                              </div>
                              <h2 className="text-lg md:text-xl font-mono text-white truncate w-64 md:w-96 flex items-center gap-2">
                                  {selectedNode.pubkey}
                                  <Copy size={14} className="text-zinc-600 hover:text-white cursor-pointer" onClick={() => copyToClipboard(selectedNode.pubkey, 'pubkey')} />
                              </h2>
                          </div>
                      </div>
                      <button onClick={closeModal} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition"><X size={20} /></button>
                  </div>

                  {/* MODAL BODY */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                      
                      {/* VIEW 1: COMPARATOR MODE */}
                      {compareMode ? (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                  <button onClick={() => setCompareMode(false)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition"><ArrowLeftRight size={14}/> BACK TO DETAILS</button>
                                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Swords className="text-red-500" /> VERSUS MODE</h3>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                  {/* LEFT: CURRENT */}
                                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-center">
                                      <div className="text-xs text-blue-400 font-bold mb-1">CHAMPION</div>
                                      <div className="font-mono text-sm text-white truncate">{selectedNode.address}</div>
                                  </div>
                                  
                                  {/* RIGHT: RIVAL (Selector) */}
                                  <div className="relative">
                                      {!compareTarget ? (
                                          <div className="h-full flex items-center justify-center p-4 bg-zinc-900 border border-zinc-800 border-dashed rounded-xl text-zinc-500 hover:border-zinc-600 cursor-pointer group relative">
                                              <span className="text-xs font-bold group-hover:text-white flex items-center gap-2 pointer-events-none">
                                                  <Search size={14}/> SELECT RIVAL
                                              </span>
                                              <select 
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                onChange={(e) => setCompareTarget(nodes.find(n => n.pubkey === e.target.value) || null)}
                                              >
                                                  <option value="">Select a node...</option>
                                                  {nodes.slice(0, 50).map(n => <option key={n.pubkey} value={n.pubkey}>{n.address} ({n.rank ? `#${n.rank}` : 'Unranked'})</option>)}
                                              </select>
                                          </div>
                                      ) : (
                                          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-center relative group">
                                              <button onClick={() => setCompareTarget(null)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 bg-black/50 rounded-full p-1"><X size={12}/></button>
                                              <div className="text-xs text-red-400 font-bold mb-1">CHALLENGER</div>
                                              <div className="font-mono text-sm text-white truncate">{compareTarget.address}</div>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {compareTarget && (
                                  <div className="space-y-1 bg-black/20 p-6 rounded-2xl border border-zinc-800">
                                      {renderComparisonRow('Health Score', getHealthScore(selectedNode, mostCommonVersion, medianCredits), getHealthScore(compareTarget, mostCommonVersion, medianCredits), (v)=>v.toString(), 'HIGH')}
                                      {renderComparisonRow('Storage', selectedNode.storage_committed, compareTarget.storage_committed, formatBytes, 'HIGH')}
                                      {renderComparisonRow('Credits', selectedNode.credits || 0, compareTarget.credits || 0, (v)=>v.toLocaleString(), 'HIGH')}
                                      {renderComparisonRow('Uptime', selectedNode.uptime, compareTarget.uptime, formatUptime, 'HIGH')}
                                      {renderComparisonRow('Rank', selectedNode.rank || 9999, compareTarget.rank || 9999, (v)=>`#${v}`, 'LOW')}
                                  </div>
                              )}
                          </div>
                      ) : shareMode ? (
                          /* VIEW 2: SHARE CARD MODE */
                          <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300 py-10">
                              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition duration-1000"></div>
                                  <div className="relative z-10 text-center">
                                      <div className="inline-block p-4 bg-zinc-900 rounded-2xl mb-6 shadow-lg border border-zinc-800">
                                          <Activity size={40} className="text-blue-500" />
                                      </div>
                                      <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">NODE REPORT</h2>
                                      <p className="font-mono text-xs text-zinc-500 mb-8 bg-zinc-900 px-3 py-1 rounded-full inline-block border border-zinc-800">{selectedNode.address}</p>
                                      
                                      <div className="grid grid-cols-2 gap-4 mb-8">
                                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                                              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Health Score</div>
                                              <div className="text-3xl font-extrabold text-green-400">{getHealthScore(selectedNode, mostCommonVersion, medianCredits)}</div>
                                          </div>
                                          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                                              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Global Rank</div>
                                              <div className="text-3xl font-extrabold text-yellow-500">#{selectedNode.rank || '-'}</div>
                                          </div>
                                      </div>
                                      
                                      <div className="text-[10px] text-zinc-600 font-mono flex items-center justify-center gap-2">
                                          <Server size={10} /> VERIFIED BY XANDEUM PULSE
                                      </div>
                                  </div>
                              </div>
                              <div className="mt-8 flex gap-4">
                                  <button onClick={() => setShareMode(false)} className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition border border-zinc-800">Close</button>
                                  <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"><Camera size={14}/> Screenshot This</button>
                              </div>
                          </div>
                      ) : (
                          /* VIEW 3: STANDARD DASHBOARD (Expanded) */
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* LEFT COL: VITALITY (Interactive) */}
                              <div 
                                className="md:col-span-1 bg-zinc-900/30 rounded-3xl p-8 border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner cursor-pointer hover:border-blue-500/30 transition group"
                                onClick={() => setModalView('health')}
                              >
                                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                                  <RadialProgress score={getHealthScore(selectedNode, mostCommonVersion, medianCredits)} size={180} />
                                  <div className="mt-8 text-center w-full">
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2 tracking-wider group-hover:text-blue-400 transition">Click for Breakdown</div>
                                      <div className={`py-2 px-4 rounded-xl border text-xs font-bold inline-block ${selectedNode.uptime > 86400 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                          {selectedNode.uptime > 86400 ? 'ONLINE & STABLE' : 'UNSTABLE / SYNCING'}
                                      </div>
                                  </div>
                              </div>

                              {/* CENTER COL: DYNAMIC VIEW AREA */}
                              <div className="md:col-span-2">
                                  {modalView === 'health' ? renderHealthBreakdown() : 
                                   modalView === 'storage' ? renderStorageAnalysis() : (
                                      <div className="grid grid-cols-2 gap-4 h-full">
                                          {/* STORAGE CARD (Interactive) */}
                                          <div 
                                            className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between cursor-pointer hover:border-blue-500/30 transition group"
                                            onClick={() => setModalView('storage')}
                                          >
                                              <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold uppercase group-hover:text-blue-400"><Database size={14}/> Storage <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition"/></div>
                                              <div>
                                                  <div className="text-2xl font-mono text-white tracking-tight">{formatBytes(selectedNode.storage_used)}</div>
                                                  <div className="h-1.5 bg-zinc-800 mt-3 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: selectedNode.storage_usage_percentage }}></div></div>
                                              </div>
                                          </div>
                                          
                                          {/* RANK CARD (Interactive) */}
                                          <Link href="/leaderboard">
                                              <div className="h-full bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 group cursor-pointer hover:border-yellow-500/30 transition relative overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] animate-[pulse_4s_infinite]">
                                                  <div className="absolute top-0 right-0 p-8 bg-yellow-500/5 blur-xl rounded-full group-hover:bg-yellow-500/10 transition"></div>
                                                  <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold uppercase"><Trophy size={14}/> Rank</div>
                                                  <div className="text-3xl font-mono text-yellow-500 font-bold">#{selectedNode.rank || 'N/A'}</div>
                                                  <div className="text-xs text-zinc-400 font-mono mt-1">{selectedNode.credits ? `${(selectedNode.credits / 1000).toFixed(1)}k Credits` : '0 Credits'}</div>
                                                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2 text-yellow-500"><ChevronRight size={16}/></div>
                                              </div>
                                          </Link>

                                          {/* LOCATION CARD (Interactive) */}
                                          <Link href={`/map?focus=${selectedNode.address.split(':')[0]}`}>
                                              <div className="h-full bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 group cursor-pointer hover:border-blue-500/30 transition relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] animate-[pulse_5s_infinite]">
                                                  <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-xl rounded-full group-hover:bg-blue-500/10 transition"></div>
                                                  <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold uppercase"><Globe size={14}/> Location</div>
                                                  <div className="text-lg font-mono text-white truncate opacity-80">{selectedNode.address.split(':')[0]}</div>
                                                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2 text-blue-400"><MapIcon size={16}/></div>
                                              </div>
                                          </Link>

                                          {/* VERSION CARD */}
                                          <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                                              <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold uppercase"><Server size={14}/> Version</div>
                                              <div className="text-xl font-mono text-white">{selectedNode.version}</div>
                                              <div className="text-[10px] text-green-500 mt-1 font-bold bg-green-500/10 inline-block px-2 py-0.5 rounded">LATEST</div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* MODAL FOOTER (ACTION BAR) */}
                  <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex gap-4">
                      {!compareMode && !shareMode && (
                          <>
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
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
      
      {/* FOOTER - Hidden in War Room */}
      {!warRoom && (
        <footer className="border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center">
            <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
            <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.</p>
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600 mb-4">
                <span className="opacity-50">pRPC Powered</span><span className="text-zinc-800">|</span>
                <div className="flex items-center gap-1"><span>Built by</span><a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">riot' <Twitter size={10} /></a></div>
                <span className="text-zinc-800">|</span>
                <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">Open Source <ExternalLink size={10} /></a>
            </div>
            <Link href="/docs" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 flex items-center justify-center gap-1 mt-4"><BookOpen size={10} /> System Architecture & Docs</Link>
        </footer>
      )}
    </div>
  );
}
