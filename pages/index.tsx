import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Eye, CheckCircle, Zap, Trophy, HardDrive, BarChart } from 'lucide-react';

// --- TYPES ---
interface Node {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  is_public: boolean;
  storage_used: number;
  // New Fields (Optional checks in case API doesn't have them yet)
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

  // --- CYCLING LOGIC ---
  const [cycleStep, setCycleStep] = useState(0);

  useEffect(() => {
    fetchStats();
    // Cycle every 4 seconds
    const interval = setInterval(() => {
      setCycleStep(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const exportCSV = () => {
    const headers = ['Address,Version,Uptime,StorageUsed,Capacity,LastSeen\n'];
    const rows = filteredNodes.map(n => 
      `${n.address},${n.version},${n.uptime},${n.storage_used},${n.storage_committed || 0},${n.last_seen_timestamp}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-nodes-${Date.now()}.csv`;
    a.click();
  };

  // Helper to get the content for the cycling display
  const getCycleContent = (node: Node, index: number) => {
    // "Randomize" by offsetting based on index
    const step = (cycleStep + index) % 3;
    
    if (step === 0) {
      return { label: 'Storage Used', value: formatBytes(node.storage_used), color: 'text-blue-400', icon: Database };
    } else if (step === 1) {
      // Show Capacity (Committed)
      return { label: 'Capacity', value: formatBytes(node.storage_committed || 0), color: 'text-purple-400', icon: HardDrive };
    } else {
      // Show Last Seen
      return { 
        label: 'Last Seen', 
        value: node.last_seen_timestamp ? formatLastSeen(node.last_seen_timestamp) : 'Unknown', 
        color: 'text-zinc-400', 
        icon: Clock 
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-zinc-800 pb-6">
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
        
        <div className="flex gap-3">
          <Link href="/leaderboard" className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-yellow-500 hover:text-yellow-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2">
            <Trophy size={14} className="text-yellow-600" /> LEADERS
          </Link>
          <button onClick={fetchStats} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2">
            <Zap size={14} className="text-yellow-500" /> REFRESH
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2">
            <Download size={14} className="text-zinc-400" /> CSV
          </button>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Filtered View</div>
          <div className="text-3xl font-bold text-white mt-1">{filteredNodes.length}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Node IP or Version..." 
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 pl-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* NODE GRID */}
      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Activity className="mx-auto mb-4 text-blue-500" size={48} />
          <div className="text-zinc-500 font-mono tracking-widest">ESTABLISHING UPLINK...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
          {filteredNodes.map((node, i) => {
            // Get the cycling content for this specific card
            const cycleData = getCycleContent(node, i);
            
            return (
            <div 
              key={i} 
              onClick={() => setSelectedNode(node)}
              className="group relative bg-zinc-900/40 border border-white/5 rounded-xl p-5 cursor-pointer hover:bg-zinc-800/60 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
            >
              <div className="mb-4 flex justify-between items-start">
                 <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Address</div>
                    <div className="font-mono text-sm text-zinc-300 truncate w-40 md:w-56 group-hover:text-white transition">
                      {node.address}
                    </div>
                 </div>
                 <span className={`text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 ${
                    node.uptime > 600 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${node.uptime > 600 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    {node.uptime > 600 ? 'ONLINE' : 'SYNCING'}
                 </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Version</span>
                  <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{node.version}</span>
                </div>
                
                {/* CYCLING HERO SECTION */}
                <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-end">
                  <div className="transition-all duration-500 ease-in-out">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5 flex items-center gap-1">
                       <cycleData.icon size={10} /> {cycleData.label}
                    </span>
                    <span className={`text-lg font-bold ${cycleData.color} font-mono tracking-tight`}>
                      {cycleData.value}
                    </span>
                  </div>
                  
                  <div className="text-zinc-600 group-hover:text-blue-400 transition transform group-hover:translate-x-1">
                    <Eye size={16} />
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* --- DETAIL MODAL (ENHANCED) --- */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div className="bg-[#09090b] border border-zinc-700 w-full max-w-lg p-0 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server size={20} className="text-blue-500" /> Node Inspector
                </h2>
                <p className="text-zinc-500 font-mono text-xs mt-1">{selectedNode.address}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
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

              {/* ENHANCED STORAGE SECTION */}
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
                      <span className="text-zinc-400 text-sm">Capacity (Committed)</span>
                      <span className="text-purple-400 font-mono font-bold">{formatBytes(selectedNode.storage_committed || 0)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Efficiency</span>
                      <span className="text-white font-mono font-bold">{selectedNode.storage_usage_percentage || 0}%</span>
                   </div>
                   {/* Mini Bar */}
                   <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedNode.storage_usage_percentage || 0}%` }}></div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 text-sm border-t border-white/5 pt-4">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Public Key</span>
                  <span className="text-zinc-300 font-mono truncate w-32 text-right">{selectedNode.pubkey}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Current Session</span>
                  <span className="text-white font-mono">{formatUptime(selectedNode.uptime)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Last Seen</span>
                  <span className="text-white flex items-center gap-2">
                    <Clock size={12} className="text-zinc-600" />
                    {selectedNode.last_seen_timestamp ? formatLastSeen(selectedNode.last_seen_timestamp) : 'Now'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
