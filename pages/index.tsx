import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Eye, CheckCircle, Zap, Trophy, HardDrive, Star, Copy, Check, Globe, AlertTriangle, ArrowUpDown, Wallet, Medal, Share2, Twitter, Code, Info, ExternalLink } from 'lucide-react';

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
  rank?: number;
  credits?: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatRawBytes = (bytes: number) => {
  return bytes ? bytes.toLocaleString() + ' B' : '0 B';
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
  
  if (diff < 60000) return 'Just now';
  
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
  
  const relative = formatLastSeen(timestamp); 
  
  const date = new Date(time);
  const dateStr = date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return `${relative} (${dateStr})`;
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

const getHealthScore = (node: Node, consensusVersion: string) => {
  let score = 100;
  if (node.uptime < 3600) score -= 40;
  else if (node.uptime < 86400) score -= 20;
  else if (node.uptime < 259200) score -= 5;
  
  if (consensusVersion !== 'N/A' && compareVersions(node.version, consensusVersion) < 0) score -= 15;
  
  if (!node.is_public) score -= 10;
  if (node.storage_used > 1000000) score += 5; 
  return Math.max(0, Math.min(100, score));
};

const LiveWireLoader = () => (
  <div className="w-full h-1 relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
    <div className="absolute inset-0 bg-blue-500/20 blur-[2px]"></div>
    <div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }}></div>
  </div>
);

// --- COMPONENT: CENTER PULSE GRAPH ---
const PulseGraphLoader = () => {
  const [text, setText] = useState("Initializing Uplink...");
  
  useEffect(() => {
    const texts = ["Establishing Connection...", "Parsing Gossip Protocol...", "Syncing Node Storage...", "Decrypting Ledger..."];
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
            </svg>
            <div className="absolute top-0 bottom-0 w-1 bg-white/50 blur-[1px] animate-scan-line"></div>
        </div>
        <div className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">
            {text}
        </div>
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
                0% { stroke-dashoffset: 400; opacity: 0; }
                10% { opacity: 1; }
                50% { stroke-dashoffset: 0; }
                90% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0; }
            }
            @keyframes scan {
                0% { left: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { left: 100%; opacity: 0; }
            }
        `}</style>
    </div>
  );
};

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'rank'>('uptime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [cycleStep, setCycleStep] = useState(0);

  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [latestVersion, setLatestVersion] = useState('N/A');
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      setCycleStep(prev => prev + 1); 
    }, 4000);
    
    return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRawJson = (node: Node) => {
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const copyStatusReport = (node: Node) => {
    const report = `[XANDEUM PULSE REPORT]
-----------------------
Node: ${node.address}
Status: ${node.uptime > 86400 ? 'STABLE' : 'BOOTING'}
Rank: #${node.rank || '-'}
Credits: ${node.credits?.toLocaleString() || 0}
Storage: ${formatBytes(node.storage_used)} / ${formatBytes(node.storage_committed || 0)}
Uptime: ${formatUptime(node.uptime)}
Version: ${node.version}
-----------------------
Monitor at: https://xandeum-pulse.vercel.app`;
    navigator.clipboard.writeText(report);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${node.uptime > 86400 ? 'Stable' : 'Booting'}\n🏆 Rank: #${node.rank || '-'}\n💰 Credits: ${node.credits?.toLocaleString() || 0}\n💾 Storage: ${formatBytes(node.storage_used)}\n\nMonitor the network here:`;
    const url = "https://xandeum-pulse.vercel.app";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, creditsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/credits')
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
        } else if (typeof creditsData === 'object' && creditsData !== null) {
            Object.entries(creditsData).forEach(([key, val]: [string, any]) => {
                if (key === 'status' || key === 'success') return;
                const keyToUse = val?.pod_id || val?.pubkey || key;
                const numVal = typeof val === 'number' ? val : Number(val?.credits || 0);
                creditMap.set(keyToUse, numVal);
            });
        }

        let mergedList = podList.map(node => ({
            ...node,
            credits: creditMap.get(node.pubkey) || 0
        }));

        // --- OLYMPIC RANKING ---
        mergedList.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        let currentRank = 1;
        for (let i = 0; i < mergedList.length; i++) {
            if (i > 0 && (mergedList[i].credits || 0) < (mergedList[i - 1].credits || 0)) {
                currentRank = i + 1;
            }
            mergedList[i].rank = currentRank;
        }

        // --- PRECISE STORAGE MATH ---
        mergedList = mergedList.map(node => {
            const used = node.storage_used || 0;
            const cap = node.storage_committed || 0;
            let percentStr = "0%";
            
            if (cap > 0 && used > 0) {
                const p = (used / cap) * 100;
                if (p < 0.01) percentStr = "< 0.01%";
                else percentStr = `${p.toFixed(2)}%`;
            } else if (used === 0) {
                percentStr = "0%";
            }
            
            return { ...node, storage_usage_percentage: percentStr };
        });

        setNodes(mergedList);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const stableNodes = mergedList.filter(n => n.uptime > 86400).length;
        setNetworkHealth((mergedList.length > 0 ? (stableNodes / mergedList.length) * 100 : 0).toFixed(2));

        if (mergedList.length > 0) {
            const versionCounts = mergedList.reduce((acc, n) => {
                acc[n.version] = (acc[n.version] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0][0];
            setMostCommonVersion(topVersion);
            
            const allVersions = mergedList.map(n => n.version);
            const sortedVersions = allVersions.sort((a, b) => compareVersions(b, a));
            setLatestVersion(sortedVersions[0] || 'N/A');
        }

        const totalBytesUsed = mergedList.reduce((sum, n) => sum + (n.storage_used || 0), 0);
        const totalBytesCommitted = mergedList.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
        setTotalStorageUsed(totalBytesUsed);
        setTotalStorageCommitted(totalBytesCommitted);
        setError('');
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError('Connection failed. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = nodes
    .filter(node => {
      const q = searchQuery.toLowerCase();
      // Safe navigation to prevent crashes on null values
      return (
        (node.address || '').toLowerCase().includes(q) ||
        (node.pubkey || '').toLowerCase().includes(q) ||
        (node.rank && node.rank.toString() === q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortBy === 'storage' ? 'storage_used' : (sortBy === 'rank' ? 'rank' : sortBy)] as any;
      let valB = b[sortBy === 'storage' ? 'storage_used' : (sortBy === 'rank' ? 'rank' : sortBy)] as any;
      
      if (sortBy === 'version') {
         return sortOrder === 'asc' ? compareVersions(a.version, b.version) : compareVersions(b.version, a.version);
      }
      if (sortBy === 'rank') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const watchListNodes = nodes.filter(node => favorites.includes(node.address));

  const exportCSV = () => {
    const headers = 'Address,Rank,Credits,Version,Uptime(s),Storage Used,Is Public,Is Favorite,RPC Endpoint\n';
    const rows = filteredNodes.map(n => 
      `${n.address},${n.rank},${n.credits},${n.version},${n.uptime},${n.storage_used},${n.is_public},${favorites.includes(n.address)},http://${n.address.split(':')[0]}:6000`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_export.csv`;
    a.click();
  };

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 4;
    if (step === 0) {
      return { label: 'Storage Used', value: formatBytes(node.storage_used), color: 'text-blue-400', icon: Database };
    } else if (step === 1) {
      return { label: 'Committed', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
    } else if (step === 2) {
      const score = getHealthScore(node, mostCommonVersion);
      return { label: 'Health Score', value: `${score}/100`, color: score > 80 ? 'text-green-400' : 'text-yellow-400', icon: Activity };
    } else {
      return { 
        label: 'Last Seen', 
        value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', 
        color: 'text-zinc-400', 
        icon: Clock 
      };
    }
  };

  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    const isLatest = latestVersion !== 'N/A' && node.version === latestVersion;
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
            isFav 
            ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
            : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800 hover:border-blue-500/50'
        }`}
      >
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IP</div>
                 {!node.is_public && <Shield size={10} className="text-zinc-600" />}
              </div>
              <div className="font-mono text-sm text-zinc-300 truncate w-40 md:w-56 group-hover:text-white transition">
                {node.address}
              </div>
            </div>
            
            <button 
              onClick={(e) => toggleFavorite(e, node.address)}
              className={`p-1.5 rounded-full transition ${isFav ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-yellow-500'}`}
            >
              <Star size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Version</span>
            <div className="flex items-center gap-2">
               <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{node.version}</span>
               {isLatest ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-yellow-600" />}
            </div>
          </div>

          <div className="pt-2">
             <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1 tracking-wider">Network Rewards</div>
             <div className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                    <Medal size={12} className={node.rank === 1 ? 'text-yellow-400' : 'text-zinc-500'} />
                    <span className="text-zinc-400 font-bold">#{node.rank && node.rank < 9999 ? node.rank : '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-zinc-300 font-mono">{node.credits?.toLocaleString() || 0}</span>
                    <Wallet size={12} className="text-yellow-600" />
                </div>
             </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-end">
            <div className="transition-all duration-500 ease-in-out">
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-blue-500/30 selection:text-blue-200 flex flex-col">
      {/* GLOBAL HEAD */}
      <Head>
        <title>Xandeum Pulse - Live Network Monitor</title>
        <meta name="description" content="Real-time pNode health, storage capacity, and network consensus metrics for Xandeum." />
        <meta property="og:title" content="Xandeum Pulse - Live Network Monitor" />
        <meta property="og:description" content="Monitor Xandeum pNodes, track network rewards, and check storage consensus in real-time." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* GLOBAL STYLES (Scrollbar) */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
      
      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      <div className="p-4 md:p-8 flex-grow">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-zinc-800 pb-6">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 justify-center md:justify-start">
            <Activity className="text-blue-500" />
            XANDEUM PULSE
          </h1>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 justify-center md:justify-start font-mono">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            GOSSIP PROTOCOL ONLINE
            <span className="text-zinc-700 mx-1">|</span>
            SYNC: {lastUpdated || '--:--'}
          </div>
        </div>

        <button onClick={exportCSV} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2 text-zinc-300">
            <Download size={16} /> 
            CSV EXPORT
        </button>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="text-xs underline hover:text-white">Retry</button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Capacity</div>
          <div className="text-3xl font-bold text-white mt-1">{formatBytes(totalStorageCommitted)}</div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono">{formatBytes(totalStorageUsed)} Used</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Stability</div>
          <div className="text-3xl font-bold text-green-500 mt-1">{networkHealth}%</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Consensus Ver</div>
          <div className="text-3xl font-bold text-blue-400 mt-1">{mostCommonVersion}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Nodes</div>
          <div className="text-3xl font-bold text-white mt-1">{nodes.length}</div>
        </div>
      </div>

      {/* WATCHLIST SECTION - WITH EMPTY STATE */}
      {watchListNodes.length > 0 ? (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-2 mb-4">
              <Star className="text-yellow-500" fill="currentColor" size={20} />
              <h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">
              {watchListNodes.map((node, i) => renderNodeCard(node, i))}
           </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="mb-10 p-6 bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-xl text-center animate-in fade-in">
            <Star size={24} className="mx-auto mb-2 text-zinc-600" />
            <h3 className="text-zinc-500 font-bold text-sm mb-1">No Favorites Yet</h3>
            <p className="text-zinc-600 text-xs">
            Click the star icon <Star size={10} className="inline text-zinc-500" /> on any node to pin it here.
            </p>
        </div>
      ) : null}

      {/* CONTROLS */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto">
                <Link href="/leaderboard" className="flex-1 md:flex-none justify-center px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2">
                    <Trophy size={16} /> LEADERBOARD
                </Link>

                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="flex-1 md:flex-none justify-center px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Zap size={16} className={loading ? "text-yellow-500 animate-spin" : "text-blue-500"} /> 
                    {loading ? 'SYNCING...' : 'REFRESH'}
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto justify-end">
                {[
                    { id: 'uptime', label: 'UPTIME', icon: Clock },
                    { id: 'version', label: 'VERSION', icon: Server },
                    { id: 'storage', label: 'STORAGE', icon: Database },
                    { id: 'rank', label: 'RANK', icon: Trophy },
                ].map((opt) => (
                    <button
                    key={opt.id}
                    onClick={() => {
                        if (sortBy === opt.id) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else setSortBy(opt.id as any);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border whitespace-nowrap ${
                        sortBy === opt.id 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    >
                    <opt.icon size={12} />
                    {opt.label}
                    {sortBy === opt.id && <ArrowUpDown size={10} className="ml-1" />}
                    </button>
                ))}
            </div>
        </div>

        {/* SEARCH BAR WITH TIP AND CLEAR */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Node IP..." 
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 pl-10 pr-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-zinc-500 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-600 text-center font-mono tracking-wide uppercase mt-2">
            Click any node for deep inspection
        </p>
      </div>

      {loading && nodes.length === 0 ? (
        <PulseGraphLoader />
      ) : (
        <>
          {filteredNodes.length === 0 && !loading ? (
            <div className="py-20 text-center text-zinc-500">
                <Server size={48} className="mx-auto mb-4 opacity-50" />
                <p>No nodes found matching parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
              {filteredNodes.map((node, i) => renderNodeCard(node, i))}
            </div>
          )}
        </>
      )}

      {/* --- ULTIMATE MODAL (RESPONSIVE & STEALTH) --- */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 border border-t-white/10 border-zinc-700 w-full max-w-lg md:max-w-4xl p-0 rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-start shrink-0">
              <div className="flex-1 overflow-hidden mr-4">
                 <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Server size={20} className="text-blue-500" /> Node Inspector
                    </h2>
                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700">{selectedNode.version}</span>
                 </div>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-zinc-400 font-mono text-xs truncate">{selectedNode.address}</p>
                    <button onClick={() => copyToClipboard(selectedNode.address)} className="text-zinc-500 hover:text-white transition">
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <button 
                 onClick={(e) => toggleFavorite(e, selectedNode.address)}
                 className={`w-full mb-6 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition ${
                   favorites.includes(selectedNode.address) 
                   ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                   : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60'
                 }`}
              >
                <Star size={18} fill={favorites.includes(selectedNode.address) ? "currentColor" : "none"} />
                {favorites.includes(selectedNode.address) ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
              </button>

              <div className="md:grid md:grid-cols-2 md:gap-6">
                
                {/* LEFT COLUMN */}
                <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center group relative backdrop-blur-md">
                        <div className="text-xs text-zinc-500 mb-1 font-bold flex justify-center items-center gap-1 cursor-help">
                            HEALTH SCORE <Info size={10} />
                        </div>
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-zinc-700 rounded-lg text-[10px] text-zinc-300 z-10 shadow-xl">
                            Calculated from Uptime, Version Consensus, and Visibility.
                        </div>
                        <div className="text-3xl font-bold text-white">{getHealthScore(selectedNode, mostCommonVersion)}</div>
                        </div>
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center backdrop-blur-md">
                        <div className="text-xs text-zinc-500 mb-1 font-bold">VISIBILITY</div>
                        <div className={`text-lg font-bold mt-1 flex justify-center items-center gap-2 ${selectedNode.is_public ? 'text-green-400' : 'text-orange-400'}`}>
                            {selectedNode.is_public ? <><Globe size={16} /> PUBLIC</> : <><Shield size={16} /> PRIVATE</>}
                        </div>
                        </div>
                    </div>

                    {/* NETWORK REWARDS SECTION - LINKED */}
                    <Link href="/leaderboard">
                        <div className="mb-6 cursor-pointer hover:opacity-90 transition">
                            <div className="flex items-center gap-2 mb-3 group relative w-fit">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 cursor-help">
                                    <Trophy size={12} /> Network Rewards <Info size={10} /> <ExternalLink size={10} className="ml-1 text-blue-500"/>
                                </h3>
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-zinc-700 rounded-lg text-[10px] text-zinc-300 z-10 shadow-xl">
                                    Accumulated reputation credits and current network rank. Click to view full Leaderboard.
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3 hover:border-yellow-500/40 transition backdrop-blur-md">
                                    <Trophy size={20} className="text-yellow-500" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Global Rank</div>
                                        <div className="text-xl font-bold text-white">#{selectedNode.rank && selectedNode.rank < 9999 ? selectedNode.rank : '-'}</div>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3 hover:border-yellow-500/40 transition backdrop-blur-md">
                                    <Wallet size={20} className="text-yellow-500" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Credits</div>
                                        <div className="text-xl font-bold text-white">{selectedNode.credits?.toLocaleString() || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* RIGHT COLUMN */}
                <div>
                    {/* STORAGE SECTION */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 group relative w-fit">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 cursor-help">
                            <Database size={12} /> Storage Metrics <Info size={10} />
                            </h3>
                            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-zinc-700 rounded-lg text-[10px] text-zinc-300 z-10 shadow-xl">
                                Real-time storage allocation and commitment.
                            </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3 backdrop-blur-md">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Used</span>
                            <div className="flex flex-col items-end">
                                <span className="text-blue-400 font-mono font-bold">{formatBytes(selectedNode.storage_used)}</span>
                                <div className="flex items-center gap-1 mt-0.5 opacity-60 hover:opacity-100 transition">
                                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">RAW</span>
                                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 rounded border border-zinc-800">
                                        {selectedNode.storage_used?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Committed</span>
                            <span className="text-purple-400 font-mono font-bold">{formatBytes(selectedNode.storage_committed || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                            <span className="text-zinc-400 text-sm flex items-center gap-1">Utilization <Info size={10}/></span>
                            <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-48 p-2 bg-black border border-zinc-700 rounded-lg text-[10px] text-zinc-300 z-10 shadow-xl">
                                Percentage of Committed Storage currently in use.
                            </div>
                            <span className="text-white font-mono font-bold">{selectedNode.storage_usage_percentage}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-blue-500" style={{ width: selectedNode.storage_usage_percentage?.includes('<') ? '1%' : selectedNode.storage_usage_percentage }}></div>
                        </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM FULL WIDTH - TECHNICAL DETAILS */}
                <div className="md:col-span-2">
                    <div className="space-y-3 text-sm border-t border-white/5 pt-4">
                        <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Last Seen</span>
                        <span className="text-white font-mono text-xs text-right">{formatDetailedTimestamp(selectedNode.last_seen_timestamp)}</span>
                        </div>

                        <div className="flex justify-between py-1">
                        <span className="text-zinc-500">RPC Endpoint</span>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-300 font-mono text-xs truncate max-w-[150px]">http://{selectedNode.address.split(':')[0]}:6000</span>
                            <button onClick={() => copyToClipboard(`http://${selectedNode.address.split(':')[0]}:6000`)}>
                                <Copy size={12} className="text-zinc-600 hover:text-white" />
                            </button>
                        </div>
                        </div>

                        <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Public Key</span>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-300 font-mono truncate w-24 text-right">{selectedNode.pubkey}</span>
                            <button onClick={() => copyToClipboard(selectedNode.pubkey)}>
                                <Copy size={12} className="text-zinc-600 hover:text-white" />
                            </button>
                        </div>
                        </div>
                        
                        <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Uptime</span>
                        <span className="text-white font-mono">{formatUptime(selectedNode.uptime)}</span>
                        </div>
                    </div>
                </div>
              </div>
              
              {/* SHARE BUTTONS (FULL WIDTH) */}
              <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => copyStatusReport(selectedNode)}
                   className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl transition border border-zinc-700"
                 >
                   {shared ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                   {shared ? 'COPIED!' : 'REPORT'}
                 </button>
                 <button 
                   onClick={() => shareToTwitter(selectedNode)}
                   className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold py-3 rounded-xl transition"
                 >
                   <Twitter size={14} fill="currentColor" />
                   SHARE ON X
                 </button>
                 <button 
                   onClick={() => copyRawJson(selectedNode)}
                   className="col-span-2 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono py-2 rounded-lg transition border border-zinc-800"
                 >
                   {jsonCopied ? <Check size={12} className="text-green-500" /> : <Code size={12} />}
                   {jsonCopied ? 'JSON COPIED' : 'COPY RAW JSON (DEV)'}
                 </button>
              </div>
              
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto">
        <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
            <p className="text-zinc-500 text-sm mb-2 max-w-lg mx-auto">
                Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-zinc-600">
                <span className="opacity-50">pRPC Powered</span>
                <span>•</span>
                <span>Built by <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-400 transition font-bold">riot'</a></span>
            </div>
        </div>
      </footer>
    </div>
  );
}
