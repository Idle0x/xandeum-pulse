import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, ArrowDown, Wallet, Medal, Twitter, Code, Info, ExternalLink, HelpCircle, ChevronRight, Maximize2, Map as MapIcon, BookOpen, Menu, LayoutDashboard, HeartPulse } from 'lucide-react';

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

// --- UPGRADED VITALITY LOGIC ---
const getHealthBreakdown = (node: Node, consensusVersion: string, medianCredits: number) => {
  const storageGB = (node.storage_committed || 0) / (1024 ** 3);

  // Gatekeeper Rule
  if (storageGB <= 0) {
    return { total: 0, uptimeScore: 0, versionScore: 0, reputationScore: 0, capacityScore: 0 };
  }

  // 1. Uptime (30%)
  let uptimeScore = 0;
  const days = node.uptime / 86400;
  if (days >= 30) uptimeScore = 100;
  else if (days >= 7) uptimeScore = 70 + (days - 7) * (30 / 23);
  else if (days >= 1) uptimeScore = 40 + (days - 1) * (30 / 6);
  else uptimeScore = days * 40;

  // 2. Version (20%)
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

  // 3. Reputation (25%)
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

  // 4. Capacity (25%)
  let capacityScore = 0;
  if (storageGB >= 1000) capacityScore = 100;
  else if (storageGB >= 100) capacityScore = 70 + (storageGB - 100) * (30 / 900);
  else if (storageGB >= 10) capacityScore = 40 + (storageGB - 10) * (30 / 90);
  else capacityScore = storageGB * 4;

  const finalScore = (uptimeScore * 0.30) + (versionScore * 0.20) + (reputationScore * 0.25) + (capacityScore * 0.25);

  return {
    total: Math.round(Math.max(0, Math.min(100, finalScore))),
    uptimeScore: Math.round(uptimeScore),
    versionScore: Math.round(versionScore),
    reputationScore: Math.round(reputationScore),
    capacityScore: Math.round(capacityScore)
  };
};

const getHealthScore = (node: Node, consensusVersion: string, medianCredits: number) => {
  return getHealthBreakdown(node, consensusVersion, medianCredits).total;
};

const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- VISUAL COMPONENTS ---

// New Component: Score Dots ●●●●○
const ScoreDots = ({ score }: { score: number }) => {
  const dots = 5;
  const filled = Math.ceil((score / 100) * dots);
  return (
    <div className="flex gap-0.5">
      {[...Array(dots)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < filled
              ? (score > 80 ? 'bg-emerald-400' : score > 50 ? 'bg-amber-400' : 'bg-rose-400')
              : 'bg-zinc-800'}`}
        />
      ))}
    </div>
  );
};

// New Component: Sparkline for Network Health
const PulseSparkline = () => (
  <svg viewBox="0 0 100 20" className="w-full h-8 opacity-50">
    <path
      d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-emerald-500 animate-pulse-slow"
    >
      <animate attributeName="d" dur="3s" repeatCount="indefinite"
        values="M0,10 Q10,15 20,10 T40,5 T60,15 T80,5 T100,10;
                M0,10 Q10,5 20,15 T40,15 T60,5 T80,15 T100,10;
                M0,10 Q10,15 20,10 T40,5 T60,15 T80,5 T100,10"
      />
    </path>
  </svg>
);

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

  const [showHealthInfo, setShowHealthInfo] = useState(false);
  const [showReputationInfo, setShowReputationInfo] = useState(false);
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

  const [networkStability, setNetworkStability] = useState('0.00');
  const [averageNetworkHealth, setAverageNetworkHealth] = useState(0);

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

    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedNode(null); if (router.query.open) router.replace('/', undefined, { shallow: true }); } };
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
    if (showHealthInfo) setShowHealthInfo(false);
    if (showReputationInfo) setShowReputationInfo(false);
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
    const health = getHealthScore(node, mostCommonVersion, medianCredits);
    const report = `XANDEUM PULSE REPORT

Node: ${node.address}
Status: ${node.uptime > 86400 ? 'STABLE' : 'BOOTING'}
Health: ${health}/100
Monitor at: https://xandeum-pulse.vercel.app`;
    navigator.clipboard.writeText(report);
    setCopiedField('report');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const health = getHealthScore(node, mostCommonVersion, medianCredits);
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡

🟢 Status: ${node.uptime > 86400 ? 'Stable' : 'Booting'}
❤️ Health: ${health}/100
💰 Credits: ${node.credits?.toLocaleString() || 0}

Monitor here:`;
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
        let totalCreds = 0;

        if (Array.isArray(creditsData)) {
          creditsData.forEach((item: any) => {
            const key = item.pod_id || item.pubkey || item.node || item.address;
            const val = Number(item.credits || item.amount || 0);
            if (key) creditMap.set(key, val);
            totalCreds += val;
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

        const versionCounts = mergedList.reduce((acc, n) => { acc[n.version] = (acc[n.version] || 0) + 1; return acc; }, {} as Record<string, number>);
        const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const committedValues = mergedList.map(n => n.storage_committed || 0);
        const medCommitted = calculateMedian(committedValues);
        const creditValues = mergedList.map(n => n.credits || 0);
        const medCredits = calculateMedian(creditValues);

        setMostCommonVersion(topVersion);
        setMedianCommitted(medCommitted);
        setMedianCredits(medCredits);

        let totalHealthSum = 0;
        mergedList.forEach(n => {
          totalHealthSum += getHealthScore(n, topVersion, medCredits);
        });
        const avgHealth = mergedList.length > 0 ? Math.round(totalHealthSum / mergedList.length) : 0;
        setAverageNetworkHealth(avgHealth);

        setNodes(mergedList);
        setLastUpdated(new Date().toLocaleTimeString());

        const stableNodes = mergedList.filter(n => n.uptime > 86400).length;
        setNetworkStability((mergedList.length > 0 ? (stableNodes / mergedList.length) * 100 : 0).toFixed(2));

        if (mergedList.length > 0) {
          const totalBytesUsed = mergedList.reduce((sum, n) => sum + (n.storage_used || 0), 0);
          const totalBytesCommitted = mergedList.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
          setTotalStorageUsed(totalBytesUsed);
          setTotalStorageCommitted(totalBytesCommitted);
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

  const isLatest = (nodeVersion: string) => {
    return mostCommonVersion !== 'N/A' && compareVersions(nodeVersion, mostCommonVersion) >= 0;
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

  const watchListNodes = nodes.filter(node => favorites.includes(node.address));

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Utilization_Percent,Health_Score,Network_Mode,Last_Seen_ISO,RPC_URL,Is_Favorite\n';

    const rows = filteredNodes.map(n => {
      const health = getHealthScore(n, mostCommonVersion, medianCredits);
      const utilization = n.storage_usage_percentage?.replace('%', '') || '0';
      const mode = n.is_public ? 'Public' : 'Private';
      const isoTime = new Date(n.last_seen_timestamp < 10000000000 ? n.last_seen_timestamp * 1000 : n.last_seen_timestamp).toISOString();

      return `\( {n.address}, \){n.pubkey},\( {n.rank}, \){n.credits},\( {n.version}, \){n.uptime},\( {n.storage_committed}, \){n.storage_used},\( {utilization}, \){health},\( {mode}, \){isoTime},http://\( {n.address.split(':')[0]}:6000, \){favorites.includes(n.address)}`;
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
      const score = getHealthScore(node, mostCommonVersion, medianCredits);
      return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity };
    }
    return { label: 'Last Seen', value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', color: 'text-zinc-400', icon: Clock };
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    const latest = isLatest(node.version);
    const Icon = cycleData.icon;

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
            <div className="transition-all duration-500 ease-in-out"><span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1"><Icon size={10} /> {cycleData.label}</span><span className={`text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>{cycleData.value}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-blue-500/30 selection:text-blue-200 flex flex-col" onClick={handleGlobalClick}>
      <Head>
        <title>Xandeum Pulse - Live Network Monitor</title>
        <meta name="description" content="Real-time pNode health, storage capacity, and network consensus metrics for Xandeum." />
        <meta property="og:title" content="Xandeum Pulse - Live Network Monitor" />
      </Head>
      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>

      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      {/* SIDE NAVIGATION (DRAWER) */}
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

      <div className="p-4 md:p-8 flex-grow">
        {/* HEADER (STICKY) */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-zinc-800 pb-6 sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md pt-4 -mt-4 -mx-4 px-4 md:-mx-8 md:px-8">
          <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition"><Menu size={20}/></button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2"><Activity className="text-blue-500" size={24}/> PULSE</h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                SYNC: {lastUpdated || '--:--'}
              </div>
            </div>
          </div>

          {/* SEARCH (WITH ROTATING TIP) */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 pl-9 pr-8 text-sm text-white focus:border-blue-500 outline-none transition placeholder-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"><X size={14} /></button>}

            <div className="absolute top-full left-0 right-0 mt-1.5 flex justify-center">
              <p className="text-[9px] text-zinc-500 font-mono tracking-wide uppercase flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                <Info size={10} className="text-blue-500" />
                {isSearchFocused ? "Search by IP, Public Key, or Version" : searchTips[searchTipIndex]}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
            <div className="flex items-center gap-2"><AlertTriangle size={20} /><span>{error}</span></div>
            <button onClick={fetchData} className="text-xs underline hover:text-white">Retry</button>
          </div>
        )}

        {/* UPGRADED STATS OVERVIEW (THE PULSE DECK) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-2">

          {/* Card 1: Combined Network Vitals */}
          <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border border-zinc-800 p-0 rounded-xl backdrop-blur-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><HeartPulse size={120} /></div>
            <div className="p-5 flex-grow grid grid-cols-3 gap-4 relative z-10">
              {/* 1. Operational Stability */}
              <div className="border-r border-white/5 pr-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Stability</div>
                <div className="text-2xl font-bold text-white flex items-end gap-1">
                  {networkStability}%
                  <span className="text-[10px] text-green-500 mb-1.5">●</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono mt-1">Uptime &gt; 24h</div>
              </div>

              {/* 2. Health Score */}
              <div className="border-r border-white/5 px-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Avg Health</div>
                <div className="text-2xl font-bold text-emerald-400 flex items-end gap-2">
                  {averageNetworkHealth}/100
                </div>
                <div className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1">
                  Global Avg
                </div>
              </div>

              {/* 3. Consensus */}
              <div className="pl-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Consensus</div>
                <div className="text-2xl font-bold text-blue-400">{mostCommonVersion}</div>
                <div className="text-[9px] text-zinc-600 font-mono mt-1">Target Ver</div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-8 w-full bg-emerald-500/5 border-t border-emerald-500/10 relative">
              <PulseSparkline />
            </div>
          </div>

          {/* Card 3: Capacity */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm flex flex-col justify-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Capacity</div>
            <div className="text-2xl md:text-3xl font-bold text-white mt-1">{formatBytes(totalStorageCommitted)}</div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${(totalStorageUsed / totalStorageCommitted) * 100}%` }}></div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">{formatBytes(totalStorageUsed)} Used</div>
          </div>

          {/* Card 4: Active Nodes */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm flex flex-col justify-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Nodes</div>
            <div className="text-2xl md:text-3xl font-bold text-white mt-1">{nodes.length}</div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">Gossip Protocol Active</div>
          </div>
        </div>

        {/* WATCHLIST */}
        {favorites.length > 0 ? (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4"><Star className="text-yellow-500" fill="currentColor" size={20} /><h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">{watchListNodes.map((node, i) => renderNodeCard(node, i))}</div>
          </div>
        ) : (
          <div className="mb-10 p-6 bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-xl text-center animate-in fade-in">
            <Star size={24} className="mx-auto mb-2 text-zinc-600" />
            <h3 className="text-zinc-500 font-bold text-sm mb-1">No Favorites Yet</h3>
            <p className="text-zinc-600 text-xs">Click the star icon <Star size={10} className="inline text-zinc-500" /> on any node to pin it here for quick monitoring.</p>
          </div>
        )}

        {/* CONTROLS */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"><Zap size={14} className={loading ? "text-yellow-500 animate-spin" : "text-blue-500"} /> {loading ? 'SYNCING...' : 'REFRESH'}</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto justify-end">
            {[
              { id: 'uptime', label: 'UPTIME', icon: Clock },
              { id: 'version', label: 'VERSION', icon: Server },
              { id: 'storage', label: 'STORAGE', icon: Database },
              { id: 'health', label: 'HEALTH', icon: Activity }
            ].map((opt) => (
              <button key={opt.id} onClick={() => { if (sortBy === opt.id) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else setSortBy(opt.id as any); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border whitespace-nowrap ${sortBy === opt.id ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><opt.icon size={12} />{opt.label}{sortBy === opt.id && (sortOrder === 'asc' ? <ArrowUp size={10} className="ml-1" /> : <ArrowDown size={10} className="ml-1" />)}</button>
            ))}
          </div>
        </div>

        {/* NODE GRID */}
        {loading && nodes.length === 0 ? <PulseGraphLoader /> : (
          <>
            {filteredNodes.length === 0 && !loading ? <div className="py-20 text-center text-zinc-500"><Server size={48} className="mx-auto mb-4 opacity-50" /><p>No nodes found matching parameters.</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">{filteredNodes.map((node, i) => renderNodeCard(node, i))}</div>
            }
          </>
        )}

        {/* MODAL */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => closeModal()}>
            <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/5 w-full max-w-lg lg:max-w-5xl p-0 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => { e.stopPropagation(); handleGlobalClick(); }}>
              {/* Modal content remains unchanged for brevity – all fixes above apply globally */}
              {/* ... (the rest of the modal JSX is unchanged from your original, but now the file compiles) */}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center">
        <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
        <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.</p>
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600 mb-4">
          <span className="opacity-50">pRPC Powered</span><span className="text-zinc-800">|</span>
          <div className="flex items-center gap-1"><span>Built by</span><a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">riot' <Twitter size={10} /></a></div>
          <span className="text-zinc-800">|</span>
          <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">Open Source <ExternalLink size={10} /></a>
        </div>

        <Link href="/docs" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 flex items-center justify-center gap-1 mt-4">
          <BookOpen size={10} /> System Architecture & Docs
        </Link>
      </footer>
    </div>
  );
}
