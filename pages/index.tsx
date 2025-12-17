import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Eye, CheckCircle, Zap, Trophy, HardDrive, Star, ExternalLink, Copy, Check, Globe, AlertTriangle, ArrowUpDown, Wallet, Medal } from 'lucide-react';

interface Node {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  storage_used: number;
  storage_committed?: number; 
  storage_usage_percentage?: number;
  rank?: number;
  credits?: number;
}

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
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
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return '>1d ago';
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

const getHealthScore = (node: Node, latestVersion: string) => {
  let score = 100;
  if (node.uptime < 3600) score -= 40;
  else if (node.uptime < 86400) score -= 20;
  else if (node.uptime < 259200) score -= 5;
  if (latestVersion !== 'N/A' && compareVersions(node.version, latestVersion) < 0) score -= 15;
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
  const [cycleStep, setCycleStep] = useState(0);

  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorage, setTotalStorage] = useState(0);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const interval = setInterval(() => {
      setCycleStep(prev => (prev + 1) % 1000); 
    }, 4000);
    return () => clearInterval(interval);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, creditsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/credits')
      ]);

      if (statsRes.data.result && statsRes.data.result.pods) {
        let podList: Node[] = statsRes.data.result.pods;
        
        // --- PARSING WITH POD_ID (FIXED) ---
        const creditsData = creditsRes.data.pods_credits || creditsRes.data;
        const creditMap = new Map<string, number>();
        
        if (Array.isArray(creditsData)) {
            creditsData.forEach((item: any) => {
                // Key fix: Look for pod_id first!
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

        const rankedPubkeys = Array.from(creditMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        podList = podList.map(node => {
            // Find Match by PubKey
            const credits = creditMap.get(node.pubkey) || 0;
            const rankIndex = rankedPubkeys.indexOf(node.pubkey);
            const rank = rankIndex !== -1 ? rankIndex + 1 : 9999;
            return { ...node, credits, rank };
        });

        setNodes(podList);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const stableNodes = podList.filter(n => n.uptime > 86400).length;
        setNetworkHealth((podList.length > 0 ? (stableNodes / podList.length) * 100 : 0).toFixed(2));

        if (podList.length > 0) {
            const versionCounts = podList.reduce((acc, n) => {
                acc[n.version] = (acc[n.version] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topVersion = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])[0][0];
            setMostCommonVersion(topVersion);
        }

        const totalBytes = podList.reduce((sum, n) => sum + (n.storage_used || 0), 0);
        setTotalStorage(totalBytes);
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
    .filter(node => 
      node.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.version.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
      return { label: 'Capacity', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
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
    const isLatest = mostCommonVersion !== 'N/A' && node.version === mostCommonVersion;
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className={`group relative bg-zinc-900/40 border rounded-xl p-5 cursor-pointer hover:bg-zinc-800/60 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${isFav ? 'border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/5 hover:border-blue-500/30'}`}
      >
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold">Address</div>
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

          <div className="flex justify-between items-center text-xs bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
             <div className="flex items-center gap-1.5">
                <Medal size={12} className={node.rank === 1 ? 'text-yellow-400' : 'text-zinc-500'} />
                <span className="text-zinc-400 font-bold">#{node.rank && node.rank < 9999 ? node.rank : '-'}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="text-zinc-300 font-mono">{node.credits?.toLocaleString() || 0}</span>
                <Wallet size={12} className="text-yellow-600" />
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
            
            <span className={`text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 ${
              node.uptime > 86400 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            }`}>
              {node.uptime > 86400 ? 'STABLE' : 'BOOTING'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-blue-500/30 selection:text-blue-200 flex flex-col">
      
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
            <span className="text-zinc-700">|</span>
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
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Storage</div>
          <div className="text-3xl font-bold text-white mt-1">{formatBytes(totalStorage)}</div>
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
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Watchlist</div>
          <div className="text-3xl font-bold text-yellow-500 mt-1">{favorites.length}</div>
        </div>
      </div>

      {watchListNodes.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-2 mb-4">
              <Star className="text-yellow-500" fill="currentColor" size={20} />
              <h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">
              {watchListNodes.map((node, i) => renderNodeCard(node, i))}
           </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto">
                <Link href="/leaderboard" className="flex-1 md:flex-none justify-center px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2">
                    <Trophy size={16} /> LEADERBOARD
                </Link>

                <button onClick={fetchData} className="flex-1 md:flex-none justify-center px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2 text-zinc-300">
                    <Zap size={16} className={loading ? "text-blue-500 animate-pulse" : "text-blue-500"} /> 
                    REFRESH
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

        <div className="relative">
          <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Node IP, Version, or Key..." 
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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

      {/* MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div className="bg-[#09090b] border border-zinc-700 w-full max-w-lg p-0 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            
            <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-start">
              <div className="flex-1 overflow-hidden mr-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server size={20} className="text-blue-500" /> Node Inspector
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-zinc-500 font-mono text-xs truncate">{selectedNode.address}</p>
                    <button onClick={() => copyToClipboard(selectedNode.address)} className="text-zinc-600 hover:text-white transition">
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <button 
                 onClick={(e) => toggleFavorite(e, selectedNode.address)}
                 className={`w-full mb-6 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition ${
                   favorites.includes(selectedNode.address) 
                   ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                   : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                 }`}
              >
                <Star size={18} fill={favorites.includes(selectedNode.address) ? "currentColor" : "none"} />
                {favorites.includes(selectedNode.address) ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
              </button>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="text-xs text-zinc-500 mb-1 font-bold">HEALTH SCORE</div>
                  <div className="text-3xl font-bold text-white">{getHealthScore(selectedNode, mostCommonVersion)}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="text-xs text-zinc-500 mb-1 font-bold">VISIBILITY</div>
                  <div className={`text-lg font-bold mt-1 flex justify-center items-center gap-2 ${selectedNode.is_public ? 'text-green-400' : 'text-orange-400'}`}>
                    {selectedNode.is_public ? <><Globe size={16} /> PUBLIC</> : <><Shield size={16} /> PRIVATE</>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-zinc-900/50 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3">
                    <Trophy size={20} className="text-yellow-500" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Global Rank</div>
                        <div className="text-xl font-bold text-white">#{selectedNode.rank && selectedNode.rank < 9999 ? selectedNode.rank : '-'}</div>
                    </div>
                 </div>
                 <div className="bg-zinc-900/50 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3">
                    <Wallet size={20} className="text-yellow-500" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Credits</div>
                        <div className="text-xl font-bold text-white">{selectedNode.credits?.toLocaleString() || 0}</div>
                    </div>
                 </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                  <Database size={12} /> Storage Metrics
                </h3>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Used</span>
                      <span className="text-blue-400 font-mono font-bold">{formatBytes(selectedNode.storage_used)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Capacity</span>
                      <span className="text-purple-400 font-mono font-bold">{formatBytes(selectedNode.storage_committed || 0)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Efficiency</span>
                      <span className="text-white font-mono font-bold">{selectedNode.storage_usage_percentage || 0}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedNode.storage_usage_percentage || 0}%` }}></div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 text-sm border-t border-white/5 pt-4">
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
              
              <div className="mt-6 pt-4 border-t border-white/5">
                 <a 
                   href={`https://explorer.solana.com/address/${selectedNode.pubkey}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
                 >
                   <ExternalLink size={18} /> VIEW ON EXPLORER
                 </a>
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
            <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">
                Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.
            </p>
            <div className="flex justify-center items-center gap-4 text-xs font-mono text-zinc-600">
                <span>pRPC Powered</span>
                <span>•</span>
                <span>Built by <span className="text-zinc-400 font-bold">riot'</span> (<a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">X: @33xp_</a> | <span className="opacity-70">Discord: @idle0x</span>)</span>
            </div>
        </div>
      </footer>
    </div>
  );
}
