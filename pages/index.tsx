import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Eye, CheckCircle, Zap, Trophy, HardDrive, Star, ExternalLink, Copy, Check } from 'lucide-react';

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
  storage_usage_percentage?: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
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
  return `${hours}h ago`;
};

const getHealthScore = (node: Node) => {
  let score = 100;
  if (node.uptime < 3600) score -= 20; 
  if (!node.is_public) score -= 10;    
  if (node.version < '0.8.0') score -= 30; 
  return Math.max(0, score);
};

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage'>('uptime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // --- FAVORITES & COPY ---
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // --- CYCLING LOGIC ---
  const [cycleStep, setCycleStep] = useState(0);

  useEffect(() => {
    fetchStats();
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const interval = setInterval(() => {
      setCycleStep(prev => prev + 1);
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/stats');
      if (res.data.result && res.data.result.pods) {
        setNodes(res.data.result.pods);
        setLastUpdated(new Date().toLocaleTimeString());
        setError('');
      }
    } catch (err: any) {
      setError('Failed to fetch: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter for MAIN LIST (Does not force favorites to top anymore)
  const filteredNodes = nodes
    .filter(node => 
      node.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.version.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortBy === 'storage' ? 'storage_used' : sortBy];
      let valB = b[sortBy === 'storage' ? 'storage_used' : sortBy];
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  // Filter for WATCHLIST SECTION
  const watchListNodes = nodes.filter(node => favorites.includes(node.address));

  const exportCSV = () => {
    const headers = ['Address,Version,Uptime,StorageUsed,Capacity,LastSeen,IsFavorite\n'];
    const rows = filteredNodes.map(n => 
      `${n.address},${n.version},${n.uptime},${n.storage_used},${n.storage_committed || 0},${n.last_seen_timestamp},${favorites.includes(n.address)}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-nodes-${Date.now()}.csv`;
    a.click();
  };

  const getCycleContent = (node: Node, index: number) => {
    const step = (cycleStep + index) % 3;
    if (step === 0) {
      return { label: 'Storage Used', value: formatBytes(node.storage_used), color: 'text-blue-400', icon: Database };
    } else if (step === 1) {
      return { label: 'Capacity', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
    } else {
      return { 
        label: 'Last Seen', 
        value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', 
        color: 'text-zinc-400', 
        icon: Clock 
      };
    }
  };

  // Reusable Card Renderer
  const renderNodeCard = (node: Node, i: number) => {
    const cycleData = getCycleContent(node, i);
    const isFav = favorites.includes(node.address);
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className={`group relative bg-zinc-900/40 border rounded-xl p-5 cursor-pointer hover:bg-zinc-800/60 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${isFav ? 'border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/5 hover:border-blue-500/30'}`}
      >
        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Address</div>
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
            <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{node.version}</span>
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
              node.uptime > 600 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            }`}>
              {node.uptime > 600 ? 'ONLINE' : 'SYNC'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      
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

        {/* TOP RIGHT CSV BUTTON */}
        <button onClick={exportCSV} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2 text-zinc-300">
            <Download size={16} /> 
            CSV EXPORT
        </button>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Nodes</div>
          <div className="text-3xl font-bold text-white mt-1">{nodes.length}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Health</div>
          <div className="text-3xl font-bold text-green-500 mt-1">98.2%</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Avg Version</div>
          <div className="text-3xl font-bold text-blue-400 mt-1">0.8.0</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Watchlist</div>
          <div className="text-3xl font-bold text-yellow-500 mt-1">{favorites.length}</div>
        </div>
      </div>

      {/* --- DEDICATED WATCHLIST SECTION (Only visible if favorites exist) --- */}
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
        {/* Action Buttons Row */}
        <div className="flex justify-between items-center">
            <Link href="/leaderboard" className="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2">
                <Trophy size={16} /> RICH LIST
            </Link>

            <button onClick={fetchStats} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-bold tracking-wide flex items-center gap-2 text-zinc-300">
                <Zap size={16} className={loading ? "text-zinc-500" : "text-blue-500"} /> 
                REFRESH
            </button>
        </div>

        {/* Search Bar */}
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

      {/* MAIN NODE GRID */}
      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Activity className="mx-auto mb-4 text-blue-500" size={48} />
          <div className="text-zinc-500 font-mono tracking-widest">ESTABLISHING UPLINK...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
          {filteredNodes.map((node, i) => renderNodeCard(node, i))}
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
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

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="text-xs text-zinc-500 mb-1 font-bold">HEALTH SCORE</div>
                  <div className="text-3xl font-bold text-white">{getHealthScore(selectedNode)}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="text-xs text-zinc-500 mb-1 font-bold">STATUS</div>
                  <div className="text-lg font-bold text-green-400 mt-1 flex justify-center items-center gap-2">
                    <CheckCircle size={16} /> OPERATIONAL
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
                  <span className="text-zinc-500">Public Key</span>
                  <div className="flex items-center gap-2">
                     <span className="text-zinc-300 font-mono truncate w-24 text-right">{selectedNode.pubkey}</span>
                     <button onClick={() => copyToClipboard(selectedNode.pubkey)}>
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-zinc-600 hover:text-white" />}
                     </button>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Current Session</span>
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
  );
}
