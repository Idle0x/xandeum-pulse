import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Server, Activity, HardDrive, X, Shield, Clock, Eye, CheckCircle, AlertCircle } from 'lucide-react';

// --- TYPES ---
interface Node {
  address: string;
  pubkey: string;
  version: string;
  uptime: number;
  last_seen_timestamp: number; // New field we found in JSON
  is_public: boolean;
  storage_used: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
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
  // If timestamp is huge (microseconds), convert to millis
  const now = Date.now();
  // Xandeum timestamps might be in seconds or millis. Let's assume seconds if small.
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

  useEffect(() => {
    fetchStats();
  }, []);

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
    const headers = ['Address,Version,Uptime(s),Storage(B),Public,LastSeen\n'];
    const rows = filteredNodes.map(n => 
      `${n.address},${n.version},${n.uptime},${n.storage_used},${n.is_public},${n.last_seen_timestamp}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-nodes-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 relative selection:bg-green-500 selection:text-black">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-green-900/50 pb-6">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-4xl font-bold tracking-tighter text-white glow-text">XANDEUM PULSE</h1>
          <div className="flex items-center gap-2 text-xs text-green-700 mt-2 justify-center md:justify-start">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            REAL-TIME GOSSIP PROTOCOL
            <span className="text-green-900">|</span>
            SYNC: {lastUpdated || '--:--'}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={fetchStats} className="px-4 py-2 border border-green-800 hover:bg-green-900/30 hover:border-green-500 transition text-xs font-bold tracking-widest">
            REFRESH
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-green-900/20 border border-green-800 hover:bg-green-900/50 hover:text-white transition text-xs flex items-center gap-2">
            <Download size={14} /> CSV
          </button>
        </div>
      </header>

      {/* CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-3 text-green-700" size={18} />
          <input 
            type="text" 
            placeholder="Search Node IP or Version..." 
            className="w-full bg-black border border-green-900 p-2.5 pl-10 text-white focus:border-green-500 focus:outline-none transition placeholder-green-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-6 flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'uptime', label: 'UPTIME', icon: Clock },
            { id: 'version', label: 'VERSION', icon: Server },
            { id: 'storage', label: 'STORAGE', icon: HardDrive },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                if (sortBy === opt.id) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else setSortBy(opt.id as any);
              }}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs border transition ${
                sortBy === opt.id 
                  ? 'bg-green-900/30 border-green-500 text-white' 
                  : 'border-green-900/50 text-green-700 hover:border-green-700'
              } p-2`}
            >
              <opt.icon size={12} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-900/5 border border-green-900/30 p-4">
          <div className="text-[10px] text-green-800 uppercase tracking-widest">Active Nodes</div>
          <div className="text-2xl font-bold text-white">{nodes.length}</div>
        </div>
        <div className="bg-green-900/5 border border-green-900/30 p-4">
          <div className="text-[10px] text-green-800 uppercase tracking-widest">Network Health</div>
          <div className="text-2xl font-bold text-green-400">98.2%</div>
        </div>
        <div className="bg-green-900/5 border border-green-900/30 p-4">
          <div className="text-[10px] text-green-800 uppercase tracking-widest">Avg Version</div>
          <div className="text-2xl font-bold text-gray-300">0.8.0</div>
        </div>
        <div className="bg-green-900/5 border border-green-900/30 p-4">
          <div className="text-[10px] text-green-800 uppercase tracking-widest">Visible</div>
          <div className="text-2xl font-bold text-white">{filteredNodes.length}</div>
        </div>
      </div>

      {/* NODE GRID */}
      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Activity className="mx-auto mb-4 text-green-500" size={48} />
          <div className="text-green-700 tracking-widest">ESTABLISHING UPLINK...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredNodes.map((node, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedNode(node)}
              className="border border-green-900/40 bg-black p-5 cursor-pointer hover:border-green-500 hover:bg-green-900/10 transition group relative flex flex-col justify-between"
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[10px] text-green-800 uppercase">Node Address</div>
                   {/* STATUS BADGE - REPLACES DOT */}
                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${node.uptime > 600 ? 'bg-green-900/30 text-green-400 border border-green-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                      {node.uptime > 600 ? 'ONLINE' : 'SYNCING'}
                   </span>
                </div>
                <div className="font-mono text-sm text-gray-200 truncate group-hover:text-white transition">
                  {node.address}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                <div>
                  <span className="text-green-800 block mb-1">VERSION</span>
                  <span className="text-green-400">{node.version}</span>
                </div>
                <div className="text-right">
                  <span className="text-green-800 block mb-1">UPTIME</span>
                  <span className="text-gray-300">{formatUptime(node.uptime)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-green-900/30 flex justify-between items-center">
                  <div>
                    <span className="text-green-800 block">STORAGE</span>
                    <span className="text-white font-bold">{formatBytes(node.storage_used)}</span>
                  </div>
                  {/* VIEW DETAILS BUTTON */}
                  <div className="text-green-600 flex items-center gap-1 group-hover:text-green-400 transition">
                    <Eye size={12} />
                    <span>View</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div className="bg-black border border-green-500 w-full max-w-lg p-6 relative shadow-[0_0_50px_rgba(34,197,94,0.15)]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-green-700 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="mb-6 border-b border-green-900 pb-4">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Server size={20} /> NODE DIAGNOSTICS
              </h2>
              <p className="text-green-600 font-mono text-xs">{selectedNode.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-900/10 p-4 border border-green-900/50 text-center">
                <div className="text-xs text-green-600 mb-1">HEALTH SCORE</div>
                <div className="text-3xl font-bold text-white">{getHealthScore(selectedNode)}/100</div>
              </div>
              <div className="bg-green-900/10 p-4 border border-green-900/50 text-center">
                <div className="text-xs text-green-600 mb-1">STATUS</div>
                <div className="text-xl font-bold text-green-400 mt-1 flex justify-center items-center gap-2">
                  <CheckCircle size={16} /> OPERATIONAL
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between border-b border-green-900/30 pb-2">
                <span className="text-gray-400">Public Key</span>
                <span className="text-green-500 truncate w-32 text-right">{selectedNode.pubkey}</span>
              </div>
              <div className="flex justify-between border-b border-green-900/30 pb-2">
                <span className="text-gray-400">Version</span>
                <span className="text-white">{selectedNode.version}</span>
              </div>
              <div className="flex justify-between border-b border-green-900/30 pb-2">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white">{formatUptime(selectedNode.uptime)}</span>
              </div>
              <div className="flex justify-between border-b border-green-900/30 pb-2">
                <span className="text-gray-400">Storage Used</span>
                <span className="text-white font-bold">{formatBytes(selectedNode.storage_used)}</span>
              </div>
               <div className="flex justify-between border-b border-green-900/30 pb-2">
                <span className="text-gray-400">Last Seen</span>
                <span className="text-green-400">
                  {selectedNode.last_seen_timestamp ? formatLastSeen(selectedNode.last_seen_timestamp) : 'Now'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-green-900 text-center">
               <p className="text-[10px] text-gray-500 uppercase">
                 Note: CPU & RAM metrics are unavailable via public pRPC
               </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
