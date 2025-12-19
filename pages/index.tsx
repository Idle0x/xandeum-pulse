import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, ArrowDown, Wallet, Medal, Twitter, Code, Info, ExternalLink, HelpCircle, ChevronRight, Maximize2, Map as MapIcon, BookOpen, Menu, LayoutDashboard } from 'lucide-react';

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
  // NEW: Vitality components
  health?: number;
  uptimeScore?: number;
  capacityScore?: number;
  reputationScore?: number;
  versionScore?: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatRawBytes = (bytes: number) => {
  return bytes ? bytes.toLocaleString() : '0';
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

const formatDetailedTimestamp = (timestamp: number) => {
  if (!timestamp) return 'N/A';
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(time);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
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

// NEW: Full vitality calculation with component breakdown
const calculateVitality = (node: Node, consensusVersion: string, medianCredits: number) => {
  const storageGB = (node.storage_committed || 0) / (1024 ** 3);
  if (storageGB <= 0) {
    return { uptimeScore: 0, versionScore: 0, reputationScore: 0, capacityScore: 0, totalScore: 0 };
  }

  // Uptime Score
  let uptimeScore = 0;
  const days = node.uptime / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  // Version Score
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

  // Reputation Score
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

  // Capacity Score
  let capacityScore = 0;
  if (storageGB >= 1000) capacityScore = 100;
  else if (storageGB >= 100) capacityScore = 70 + (storageGB - 100) * (30 / 900);
  else if (storageGB >= 10) capacityScore = 40 + (storageGB - 10) * (30 / 90);
  else capacityScore = storageGB * 4;

  const totalScore = Math.round(
    uptimeScore * 0.30 +
    versionScore * 0.20 +
    reputationScore * 0.25 +
    capacityScore * 0.25
  );

  return {
    uptimeScore,
    versionScore,
    reputationScore,
    capacityScore,
    totalScore
  };
};

const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// NEW: 5-dot progress indicator
const DotIndicator = ({ value, max = 100 }: { value: number; max?: number }) => {
  const filled = Math.floor((value / max) * 5);
  const dots = [0, 1, 2, 3, 4];
  const getColor = () => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  return (
    <div className="flex items-center gap-1">
      {dots.map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${i < filled ? getColor() : 'bg-zinc-700'}`}
        />
      ))}
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

  // NEW: Network-wide stats
  const [networkStats, setNetworkStats] = useState({
    avgHealth: 0,
    avgUptimeScore: 0,
    avgCapacityScore: 0,
    avgReputationScore: 0,
    avgVersionScore: 0,
    consensusPct: '0.0',
    stabilityPct: '0.00'
  });

  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [medianCommitted, setMedianCommitted] = useState(0);
  const [medianCredits, setMedianCredits] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false); 

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

  const handleGlobalClick = () => {
    if (activeTooltip) setActiveTooltip(null);
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

  const closeModal = () => {
      setSelectedNode(null);
      if (router.query.open) router.replace('/', undefined, { shallow: true });
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
    const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address}\nStatus: ${node.uptime > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${node.health || 0}/100\nMonitor at: https://xandeum-pulse.vercel.app`;
    navigator.clipboard.writeText(report);
    setCopiedField('report');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${node.uptime > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${node.health || 0}/100\n💰 Credits: ${node.credits?.toLocaleString() || 0}\n\nMonitor here:`;
    const url = "https://xandeum-pulse.vercel.app";
    window.open(`https://twitter.com/intent/tweet?text=\( {encodeURIComponent(text)}&url= \){encodeURIComponent(url)}`, '_blank');
  };

  const handleRefresh = () => {
      setLoading(true);
      setTimeout(() => { fetchData(); }, 300);
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

        mergedList.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        let currentRank = 1;
        for (let i = 0; i < mergedList.length; i++) {
            if (i > 0 && (mergedList[i].credits || 0) < (mergedList[i - 1].credits || 0)) currentRank = i + 1;
            mergedList[i].rank = currentRank;
        }

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

        // NEW: Calculate vitality scores and network averages
        let sumUptime = 0, sumCapacity = 0, sumRep = 0, sumVersion = 0, sumHealth = 0;
        mergedList.forEach(node => {
          const vit = calculateVitality(node, mostCommonVersion, medianCredits); // temporary consensus/med for initial pass
          node.uptimeScore = vit.uptimeScore;
          node.capacityScore = vit.capacityScore;
          node.reputationScore = vit.reputationScore;
          node.versionScore = vit.versionScore;
          node.health = vit.totalScore;

          sumUptime += vit.uptimeScore;
          sumCapacity += vit.capacityScore;
          sumRep += vit.reputationScore;
          sumVersion += vit.versionScore;
          sumHealth += vit.totalScore;
        });

        // Re-calculate with final medians and consensus
        const versionCounts = mergedList.reduce((acc, n) => { acc[n.version] = (acc[n.version] || 0) + 1; return acc; }, {} as Record<string, number>);
        const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        setMostCommonVersion(topVersion);

        const consensusCount = versionCounts[topVersion] || 0;
        const consensusPct = mergedList.length ? (consensusCount / mergedList.length * 100).toFixed(1) : '0.0';

        const stableNodes = mergedList.filter(n => n.uptime > 86400).length;
        const stabilityPct = mergedList.length ? (stableNodes / mergedList.length * 100).toFixed(2) : '0.00';

        const totalBytesUsed = mergedList.reduce((sum, n) => sum + (n.storage_used || 0), 0);
        const totalBytesCommitted = mergedList.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
        setTotalStorageUsed(totalBytesUsed);
        setTotalStorageCommitted(totalBytesCommitted);

        const committedValues = mergedList.map(n => n.storage_committed || 0);
        setMedianCommitted(calculateMedian(committedValues));
        const creditValues = mergedList.map(n => n.credits || 0);
        setMedianCredits(calculateMedian(creditValues));

        // Final vitality pass with correct consensus/medias
        mergedList.forEach(node => {
          const vit = calculateVitality(node, topVersion, calculateMedian(creditValues));
          node.uptimeScore = vit.uptimeScore;
          node.capacityScore = vit.capacityScore;
          node.reputationScore = vit.reputationScore;
          node.versionScore = vit.versionScore;
          node.health = vit.totalScore;
          sumUptime += vit.uptimeScore;
          sumCapacity += vit.capacityScore;
          sumRep += vit.reputationScore;
          sumVersion += vit.versionScore;
          sumHealth += vit.totalScore;
        });

        const count = mergedList.length;
        setNetworkStats({
          avgHealth: count ? Math.round(sumHealth / count) : 0,
          avgUptimeScore: count ? Math.round(sumUptime / count) : 0,
          avgCapacityScore: count ? Math.round(sumCapacity / count) : 0,
          avgReputationScore: count ? Math.round(sumRep / count) : 0,
          avgVersionScore: count ? Math.round(sumVersion / count) : 0,
          consensusPct,
          stabilityPct
        });

        setNodes(mergedList);
        setLastUpdated(new Date().toLocaleTimeString());
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

  const isLatest = (nodeVersion: string) => { return mostCommonVersion !== 'N/A' && compareVersions(nodeVersion, mostCommonVersion) >= 0; };

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
          valA = a.health || 0;
          valB = b.health || 0;
      }
      else { valA = a[sortBy] as any; valB = b[sortBy] as any; }
      
      if (sortBy === 'version') return sortOrder === 'asc' ? compareVersions(a.version, b.version) : compareVersions(b.version, a.version);
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address));

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Utilization_Percent,Health_Score,Network_Mode,Last_Seen_ISO,RPC_URL,Is_Favorite\n';
    
    const rows = filteredNodes.map(n => {
        const utilization = n.storage_usage_percentage?.replace('%', '') || '0';
        const mode = n.is_public ? 'Public' : 'Private';
        const isoTime = new Date(n.last_seen_timestamp < 10000000000 ? n.last_seen_timestamp * 1000 : n.last_seen_timestamp).toISOString();
        
        return `\( {n.address}, \){n.pubkey},\( {n.rank}, \){n.credits},\( {n.version}, \){n.uptime},\( {n.storage_committed}, \){n.storage_used},\( {utilization}, \){n.health || 0},\( {mode}, \){isoTime},http://\( {n.address.split(':')[0]}:6000, \){favorites.includes(n.address)}`;
    });
    
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 4;
    if (step === 0) return { label: 'Storage Used', value: formatBytes(node.storage_used), color: 'text-blue-400', icon: Database };
    if (step === 1) return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
    if (step === 2) {
      return { label: 'Health Score', value: `${node.health || 0}/100`, color: (node.health || 0) > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity };
    }
    return { label: 'Last Seen', value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', color: 'text-zinc-400', icon: Clock };
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    const latest = isLatest(node.version);
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/50 ${
            isFav ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800'
        }`}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
            View Details <Maximize2 size={8} />
        </div>
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1"><div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>{!node.is_public && <Shield size={10} className="text-zinc-600" />}</div>
              <div className="relative h-6 w-56">
                  <div className="absolute inset-0 font-mono text-sm text-zinc-300 truncate transition-opacity duration-300 group-hover:opacity-0">{(node.pubkey || '').length > 12 ? `\( {(node.pubkey || '').slice(0, 12)}... \){(node.pubkey || '').slice(-4)}` : (node.pubkey || 'Unknown Identity')}</div>
                  <div className="absolute inset-0 font-mono text-sm text-blue-400 truncate opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center gap-2"><span className="text-[10px] text-zinc-500">IP:</span> {node.address || 'N/A'}</div>
              </div>
            </div>
            <button onClick={(e) => toggleFavorite(e, node.address)} className={`p-1.5 rounded-full transition ${isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-yellow-500'}`}><Star size={16} fill={isFav ? "currentColor" : "none"} /></button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Version</span>
            <div className="flex items-center gap-2"><span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{node.version}</span>{latest && <CheckCircle size={12} className="text-green-500" />}</div>
          </div>
          <div className="pt-2">
             <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1 tracking-wider">Network Rewards</div>
             <div className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-lg border border-zinc-800/50">
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

  // NEW: Calculate percentile for selected node
  const getPercentile = (node: Node) => {
    if (!node.health || nodes.length === 0) return 0;
    const betterOrEqualCount = nodes.filter(n => (n.health || 0) >= node.health!).length;
    return Math.round((betterOrEqualCount / nodes.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-blue-500/30 selection:text-blue-200 flex flex-col" onClick={handleGlobalClick}>
      <Head>
        <title>Xandeum Pulse - Live Network Monitor</title>
        <meta name="description" content="Real-time pNode health, storage capacity, and network consensus metrics for Xandeum." />
        <meta property="og:title" content="Xandeum Pulse - Live Network Monitor" />
      </Head>
      <style jsx global>{`::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #09090b; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }`}</style>
      
      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      {/* SIDE NAVIGATION (DRAWER) */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-[#09090b] border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* ... unchanged ... */}
      </div>
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>}

      <div className="p-4 md:p-8 flex-grow">
      {/* HEADER */}
      {/* ... unchanged ... */}

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
          <div className="flex items-center gap-2"><AlertTriangle size={20} /><span>{error}</span></div>
          <button onClick={fetchData} className="text-xs underline hover:text-white">Retry</button>
        </div>
      )}

      {/* STATS OVERVIEW - REPLACED STABILITY WITH VITALS CARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-2">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Capacity</div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-1">{formatBytes(totalStorageCommitted)}</div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono">{formatBytes(totalStorageUsed)} Used</div>
        </div>

        {/* NEW: NETWORK VITALS CARD */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm space-y-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Vitals</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Stability</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{networkStats.stabilityPct}%</span>
                <DotIndicator value={parseFloat(networkStats.stabilityPct)} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Avg Health</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{networkStats.avgHealth}/100</span>
                <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${networkStats.avgHealth}%` }} /></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Consensus</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{networkStats.consensusPct}%</span>
                <DotIndicator value={parseFloat(networkStats.consensusPct)} />
              </div>
            </div>
            {/* Optional sparkline - uncomment when you have trend data */}
            {/* <div className="text-[9px] text-zinc-500">╱╲╱‾‾╲_ ↗ +2.1% (Last hour)</div> */}
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

      {/* WATCHLIST AND REST UNCHANGED */}
      {/* ... rest of your existing code until modal ... */}

      {/* ULTIMATE MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => closeModal()}>
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/5 w-full max-w-lg lg:max-w-5xl p-0 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => { e.stopPropagation(); handleGlobalClick(); }}>
            {/* Header unchanged */}
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-start shrink-0">
              {/* ... */}
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1 & 2 unchanged */}
                {/* ... */}

                {/* COLUMN 3: PERFORMANCE - FULL DIAGNOSTICS */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase">Health Diagnostics</h3>
                      <button className="text-zinc-600 hover:text-zinc-400 relative group">
                        <HelpCircle size={12} />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Vitality Score (0-100) built from:<br/>
                          • Uptime (30%) – stability over time<br/>
                          • Capacity (25%) – committed storage<br/>
                          • Reputation (25%) – earned credits vs network<br/>
                          • Version (20%) – consensus participation<br/>
                          <br/>
                          Gatekeeper: 0 GB committed → 0 health
                        </div>
                      </button>
                    </div>

                    {/* NEW DIAGNOSTICS PANEL */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-5 backdrop-blur-md space-y-5">
                      {/* Top summary with dots */}
                      <div className="text-center space-y-3">
                        <DotIndicator value={selectedNode.health || 0} />
                        <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                          <span className="text-white">{selectedNode.health || 0}</span>
                          <span className="text-zinc-500 text-xl">vs</span>
                          <span className="text-zinc-400">{networkStats.avgHealth} Network Avg</span>
                          <span className={`text-lg font-bold ${(selectedNode.health || 0) > networkStats.avgHealth ? 'text-green-400' : 'text-red-400'}`}>
                            {((selectedNode.health || 0) > networkStats.avgHealth) ? '+' : ''}{((selectedNode.health || 0) - networkStats.avgHealth)}
                          </span>
                        </div>
                      </div>

                      {/* Component breakdown */}
                      <div className="space-y-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Component Breakdown</div>
                        {[
                          { label: 'Uptime', nodeVal: selectedNode.uptimeScore || 0, avg: networkStats.avgUptimeScore },
                          { label: 'Capacity', nodeVal: selectedNode.capacityScore || 0, avg: networkStats.avgCapacityScore },
                          { label: 'Reputation', nodeVal: selectedNode.reputationScore || 0, avg: networkStats.avgReputationScore },
                          { label: 'Version', nodeVal: selectedNode.versionScore || 0, avg: networkStats.avgVersionScore },
                        ].map(item => {
                          const isAbove = item.nodeVal > item.avg;
                          const isBelow = item.nodeVal < item.avg;
                          return (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-400 w-20 text-right">{item.label}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all \( {isAbove ? 'bg-green-500' : isBelow ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: ` \){item.nodeVal}%` }} />
                              </div>
                              <span className="text-zinc-300 w-12 text-right font-mono">{item.nodeVal}</span>
                              <span className="text-zinc-500 text-[10px]">(Avg: {item.avg})</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Percentile */}
                      <div className="text-center pt-3 border-t border-zinc-800">
                        <span className="text-sm font-bold text-green-400 flex items-center justify-center gap-1">
                          <Zap size={14} className="text-green-400" fill="currentColor" />
                          TOP {getPercentile(selectedNode)}% of all nodes
                        </span>
                      </div>
                    </div>

                    {/* Existing reputation box */}
                    <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-md relative mt-5">
                      {/* ... unchanged ... */}
                    </div>

                    <div className="mt-4 text-xs text-center text-zinc-500 group relative cursor-help">
                      <Clock size={12} className="inline mr-1" />
                      Last seen {formatLastSeen(selectedNode.last_seen_timestamp)}
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-zinc-700 rounded px-2 py-1 text-[10px] whitespace-nowrap z-10">
                        {formatDetailedTimestamp(selectedNode.last_seen_timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom actions unchanged */}
                <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                  {/* ... */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* FOOTER unchanged */}
    </div>
  );
}
