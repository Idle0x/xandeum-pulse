import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
// FIX: Aliased 'Map' to 'MapIcon' to avoid conflict with JS Map constructor
import { Search, Download, Server, Activity, Database, X, Shield, Clock, Zap, Trophy, HardDrive, Star, Copy, Check, CheckCircle, Globe, AlertTriangle, ArrowUp, ArrowDown, Wallet, Medal, Twitter, Code, Info, ExternalLink, HelpCircle, ChevronRight, Maximize2, Map as MapIcon } from 'lucide-react';

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

// --- CALCULATE MEDIAN (ROBUST AGAINST OUTLIERS) ---
const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'rank'>('uptime');
  // FIX: Updated type definition to allow both 'asc' and 'desc'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [showHealthInfo, setShowHealthInfo] = useState(false);
  const [showReputationInfo, setShowReputationInfo] = useState(false); 
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [searchTipIndex, setSearchTipIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTips = [
    "Search by IP, Public Key, or Version",
    "Tip: Click any node card for deep inspection"
  ];

  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null); 
  const [cycleStep, setCycleStep] = useState(0);

  const [networkHealth, setNetworkHealth] = useState('0.00');
  const [mostCommonVersion, setMostCommonVersion] = useState('N/A');
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [totalStorageCommitted, setTotalStorageCommitted] = useState(0);
  const [totalNetworkCredits, setTotalNetworkCredits] = useState(0);
  
  // CHANGED: Renamed from Avg to Median for clarity
  const [medianCommitted, setMedianCommitted] = useState(0);

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

    const cycleInterval = setInterval(() => {
      setCycleStep(prev => prev + 1); 
    }, 4000);

    const tipInterval = setInterval(() => {
        if (!isSearchFocused) {
            setSearchTipIndex(prev => (prev + 1) % searchTips.length);
        }
    }, 5000);
    
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSelectedNode(null);
            if (router.query.open) {
                router.replace('/', undefined, { shallow: true });
            }
        }
    };
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
        if (targetNode) {
            setSelectedNode(targetNode);
        }
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
      if (router.query.open) {
          router.replace('/', undefined, { shallow: true });
      }
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
    setCopiedField('report');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToTwitter = (node: Node) => {
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${node.uptime > 86400 ? 'Stable' : 'Booting'}\n🏆 Rank: #${node.rank || '-'}\n💰 Credits: ${node.credits?.toLocaleString() || 0}\n💾 Storage: ${formatBytes(node.storage_used)}\n\nMonitor the network here:`;
    const url = "https://xandeum-pulse.vercel.app";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleRefresh = () => {
      // FORCE LOADING STATE for UX feedback
      setLoading(true);
      // Small timeout to ensure user sees the "flash" of interaction
      setTimeout(() => {
          fetchData();
      }, 300);
  };

  const fetchData = async () => {
    // If it's first load, we might already have loading=true. 
    // If manual refresh, handleRefresh sets it true.
    
    try {
      const [statsRes, creditsRes] = await Promise.all([
        // Added timestamp to prevent caching
        axios.get(`/api/stats?t=${Date.now()}`),
        axios.get(`/api/credits?t=${Date.now()}`)
      ]);

      if (statsRes.data.result && statsRes.data.result.pods) {
        let podList: Node[] = statsRes.data.result.pods;
        
        const creditsData = creditsRes.data.pods_credits || creditsRes.data;
        // CORRECTED: Now this uses the native JS Map because we renamed the import
        const creditMap = new Map<string, number>();
        let totalCreds = 0;
        
        if (Array.isArray(creditsData)) {
            creditsData.forEach((item: any) => {
                const key = item.pod_id || item.pubkey || item.node || item.address;
                const val = Number(item.credits || item.amount || 0);
                if (key) creditMap.set(key, val);
                totalCreds += val;
            });
        } else if (typeof creditsData === 'object' && creditsData !== null) {
            Object.entries(creditsData).forEach(([key, val]: [string, any]) => {
                if (key === 'status' || key === 'success') return;
                const keyToUse = val?.pod_id || val?.pubkey || key;
                const numVal = typeof val === 'number' ? val : Number(val?.credits || 0);
                creditMap.set(keyToUse, numVal);
                totalCreds += numVal;
            });
        }
        setTotalNetworkCredits(totalCreds);

        let mergedList = podList.map(node => ({
            ...node,
            credits: creditMap.get(node.pubkey) || 0
        }));

        mergedList.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        let currentRank = 1;
        for (let i = 0; i < mergedList.length; i++) {
            if (i > 0 && (mergedList[i].credits || 0) < (mergedList[i - 1].credits || 0)) {
                currentRank = i + 1;
            }
            mergedList[i].rank = currentRank;
        }

        mergedList = mergedList.map(node => {
            const used = node.storage_used || 0;
            const cap = node.storage_committed || 0;
            let percentStr = "0%";
            let rawPercent = 0;
            
            if (cap > 0 && used > 0) {
                rawPercent = (used / cap) * 100;
                if (rawPercent < 0.01) percentStr = "< 0.01%";
                else percentStr = `${rawPercent.toFixed(2)}%`;
            } else if (used === 0) {
                percentStr = "0%";
            }
            
            return { 
                ...node, 
                storage_usage_percentage: percentStr,
                storage_usage_raw: rawPercent 
            };
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
            
            const totalBytesUsed = mergedList.reduce((sum, n) => sum + (n.storage_used || 0), 0);
            const totalBytesCommitted = mergedList.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
            setTotalStorageUsed(totalBytesUsed);
            setTotalStorageCommitted(totalBytesCommitted);

            // LOGIC CHANGE: Calculate Median instead of Mean to handle Outliers
            const committedValues = mergedList.map(n => n.storage_committed || 0);
            setMedianCommitted(calculateMedian(committedValues));
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
      // LOGIC FIX: Sort storage by Committed (Capacity), not Used
      let valA: any, valB: any;
      
      if (sortBy === 'storage') {
          valA = a.storage_committed || 0;
          valB = b.storage_committed || 0;
      } else {
          valA = a[sortBy === 'rank' ? 'rank' : sortBy] as any;
          valB = b[sortBy === 'rank' ? 'rank' : sortBy] as any;
      }
      
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
    const headers = 'Node_IP,Public_Key,Rank,Reputation_Credits,Version,Uptime_Seconds,Capacity_Bytes,Used_Bytes,Utilization_Percent,Health_Score,Network_Mode,Last_Seen_ISO,RPC_URL,Is_Favorite\n';
    
    const rows = filteredNodes.map(n => {
        const health = getHealthScore(n, mostCommonVersion);
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
    const latest = isLatest(node.version);
    
    return (
      <div 
        key={node.address} 
        onClick={() => setSelectedNode(node)}
        className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/50 ${
            isFav 
            ? 'bg-gradient-to-b from-zinc-900 to-black border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
            : 'bg-gradient-to-b from-zinc-900 to-black border-zinc-800'
        }`}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-blue-500/20">
            View Details <Maximize2 size={8} />
        </div>

        <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 {/* UX FIX: PubKey is now the identity hero, IP is hidden/secondary */}
                 <div className="text-[10px] text-zinc-500 uppercase font-bold">NODE IDENTITY</div>
                 {!node.is_public && <Shield size={10} className="text-zinc-600" />}
              </div>
              
              {/* IDENTITY SWAP ON HOVER */}
              <div className="relative h-6 w-56">
                  {/* Default State: PubKey */}
                  <div className="absolute inset-0 font-mono text-sm text-zinc-300 truncate transition-opacity duration-300 group-hover:opacity-0">
                    {node.pubkey.slice(0, 12)}...{node.pubkey.slice(-4)}
                  </div>
                  {/* Hover State: IP Address */}
                  <div className="absolute inset-0 font-mono text-sm text-blue-400 truncate opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center gap-2">
                     <span className="text-[10px] text-zinc-500">IP:</span> {node.address}
                  </div>
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
               {latest && <CheckCircle size={12} className="text-green-500" />}
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-blue-500/30 selection:text-blue-200 flex flex-col" onClick={handleGlobalClick}>
      {/* GLOBAL HEAD */}
      <Head>
        <title>Xandeum Pulse - Live Network Monitor</title>
        <meta name="description" content="Real-time pNode health, storage capacity, and network consensus metrics for Xandeum." />
        <meta property="og:title" content="Xandeum Pulse - Live Network Monitor" />
      </Head>

      {/* GLOBAL STYLES */}
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

        <div className="flex items-center gap-2">
             {/* CORRECTED: USING MAPICON */}
            <Link href="/map">
                <button className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-blue-500 hover:text-blue-400 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2 text-zinc-300">
                    <MapIcon size={16} /> 
                    NETWORK MAP
                </button>
            </Link>
            
            <button onClick={exportCSV} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 rounded-lg transition text-xs font-semibold tracking-wide flex items-center gap-2 text-zinc-300">
                <Download size={16} /> 
                CSV EXPORT
            </button>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

      {/* GRID LAYOUT: Leaderboard + Map Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* LEADERBOARD LINK */}
          <Link href="/leaderboard" className="block group h-full">
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 hover:bg-yellow-500/10 transition cursor-pointer text-center h-full">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500 shrink-0" />
                    <span className="text-sm font-mono text-zinc-400 whitespace-nowrap">
                        Credits: <span className="text-yellow-400 font-bold ml-1">{(totalNetworkCredits / 1000000).toFixed(2)}M</span>
                    </span>
                </div>
                <span className="hidden md:inline text-zinc-600">|</span>
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white flex items-center gap-1 whitespace-nowrap">
                    View Leaderboard <ChevronRight size={14} />
                </span>
            </div>
          </Link>

          {/* MAP CTA */}
          <Link href="/map" className="block group h-full">
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 hover:bg-blue-500/10 transition cursor-pointer text-center h-full">
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-300 group-hover:text-blue-200 uppercase tracking-wide">
                        Global Distribution
                    </span>
                </div>
                <span className="hidden md:inline text-zinc-600">|</span>
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white flex items-center gap-1 whitespace-nowrap">
                    View Map <ChevronRight size={14} />
                </span>
            </div>
          </Link>

      </div>

      {/* WATCHLIST SECTION */}
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
                <button 
                    onClick={handleRefresh} 
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
                    {sortBy === opt.id && (
                        sortOrder === 'asc' ? <ArrowUp size={10} className="ml-1" /> : <ArrowDown size={10} className="ml-1" />
                    )}
                    </button>
                ))}
            </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 pl-10 pr-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
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
        <p className="text-[10px] text-zinc-600 text-center font-mono tracking-wide uppercase mt-2 h-4 transition-all duration-500">
            {isSearchFocused ? "Search by IP, Public Key, or Version" : searchTips[searchTipIndex]}
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

      {/* --- ULTIMATE MODAL (UPDATED WITH MEDIAN LOGIC) --- */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => closeModal()}>
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/5 w-full max-w-lg lg:max-w-5xl p-0 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => { e.stopPropagation(); handleGlobalClick(); }}>
            
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-start shrink-0">
              <div className="flex-1 overflow-hidden mr-4">
                 <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Server size={20} className="text-blue-500" /> Node Inspector
                    </h2>
                 </div>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-zinc-500 font-mono text-xs truncate">{selectedNode.address}</p>
                    <button onClick={() => copyToClipboard(selectedNode.address, 'ip')} className="text-zinc-600 hover:text-white transition">
                        {copiedField === 'ip' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                </div>
              </div>
              <button onClick={() => closeModal()} className="text-zinc-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: IDENTITY */}
                <div>
                    <div className="flex items-center gap-2 mb-3 cursor-help group" onClick={(e) => toggleTooltip(e, 'identity')}>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase">Identity & Status</h3>
                        <HelpCircle size={10} className="text-zinc-600 group-hover:text-zinc-400" />
                        <div className="flex-grow flex justify-end">
                            <button 
                                onClick={(e) => toggleFavorite(e, selectedNode.address)}
                                className={`p-1.5 rounded transition border ${favorites.includes(selectedNode.address) ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-white'}`}
                            >
                                <Star size={12} fill={favorites.includes(selectedNode.address) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                    {activeTooltip === 'identity' && (
                        <div className="mb-3 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400 animate-in fade-in slide-in-from-top-1">
                            Core identifiers and current network synchronization status.
                        </div>
                    )}
                    
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-3 mb-4 backdrop-blur-md">
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase mb-1">Public Key</div>
                            <div className="font-mono text-sm text-zinc-300 flex items-center justify-between">
                                <span className="truncate w-full">{selectedNode.pubkey.slice(0, 12)}...</span>
                                <Copy size={12} onClick={() => copyToClipboard(selectedNode.pubkey, 'pubkey')} className="cursor-pointer hover:text-white shrink-0" />
                                {copiedField === 'pubkey' && <span className="absolute right-8 text-[9px] text-green-500 font-bold">COPIED</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase mb-1">RPC Endpoint</div>
                            <div className="font-mono text-sm text-zinc-300 flex items-center justify-between">
                                <span className="truncate w-full">http://{selectedNode.address.split(':')[0]}:6000</span>
                                <Copy size={12} onClick={() => copyToClipboard(`http://${selectedNode.address.split(':')[0]}:6000`, 'rpc')} className="cursor-pointer hover:text-white shrink-0" />
                                {copiedField === 'rpc' && <span className="absolute right-8 text-[9px] text-green-500 font-bold">COPIED</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 backdrop-blur-md">
                        <div className="space-y-3 text-xs">
                           <div className="flex justify-between items-center">
                              <span className="text-zinc-400">Uptime Stability</span>
                              <span className={selectedNode.uptime > 86400 ? "text-green-500" : "text-yellow-500"}>
                                {selectedNode.uptime > 86400 ? "STABLE" : "BOOTING"}
                              </span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-zinc-400">Software Version</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`${
                                    selectedNode.version === mostCommonVersion ? 'text-zinc-300 bg-zinc-800' : 
                                    compareVersions(selectedNode.version, mostCommonVersion) < 0 ? 'text-red-400 bg-zinc-800' : 
                                    'text-white bg-zinc-800'
                                } px-1.5 rounded transition-colors`}>{selectedNode.version}</span>
                                {selectedNode.version === mostCommonVersion && <span className="text-[9px] text-green-500 bg-green-500/10 px-1 rounded uppercase font-bold">Majority</span>}
                              </div>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-zinc-400">Network Mode</span>
                              <span className={selectedNode.is_public ? "text-green-500" : "text-orange-500"}>
                                {selectedNode.is_public ? "PUBLIC" : "PRIVATE"}
                              </span>
                           </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: STORAGE METRICS (UPDATED: MEDIAN LOGIC) */}
                <div>
                    <div className="flex items-center gap-2 mb-3 cursor-help group" onClick={(e) => toggleTooltip(e, 'infra')}>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase">Storage Metrics</h3>
                        <HelpCircle size={10} className="text-zinc-600 group-hover:text-zinc-400" />
                    </div>
                    {activeTooltip === 'infra' && (
                        <div className="mb-3 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400 animate-in fade-in slide-in-from-top-1">
                            Real-time storage capacity and utilization compared to network averages.
                        </div>
                    )}

                    <div className="bg-black/50 rounded-xl p-4 border border-white/5 space-y-4 backdrop-blur-md mb-4">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex flex-col items-start">
                                    <span className="mb-1 inline-block bg-zinc-900 border border-zinc-800/50 rounded px-1.5 py-0.5 text-[9px] text-zinc-500 font-mono">
                                        {formatRawBytes(selectedNode.storage_used)} raw bytes
                                    </span>
                                    <span className="text-xl font-mono font-bold text-blue-400">{formatBytes(selectedNode.storage_used)}</span>
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">USED</span>
                                </div>
                                <div className="text-zinc-700 text-xl font-light pb-4">/</div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-mono font-bold text-purple-400">{formatBytes(selectedNode.storage_committed || 0)}</span>
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">CAPACITY</span>
                                </div>
                            </div>

                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden w-full mb-2">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(selectedNode.storage_usage_raw || 0, 100)}%` }}></div>
                            </div>
                            
                            <div className="flex justify-center">
                                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900/80 px-2 py-1 rounded-full border border-zinc-800">
                                    {selectedNode.storage_usage_percentage} Utilization
                                </span>
                            </div>
                        </div>
                    </div>

                    <h4 className="text-[9px] text-zinc-500 uppercase mb-2 font-bold pl-1">VS Network Median</h4>
                    {/* CUSTOM HYBRID BAR COMPONENT (MEDIAN LOGIC) */}
                    {(() => {
                        const nodeCap = selectedNode.storage_committed || 0;
                        const median = medianCommitted || 1; 
                        const diff = nodeCap - median;
                        const isPos = diff >= 0;
                        const percentDiff = (Math.abs(diff) / median) * 100;
                        
                        // Dynamic Scale Logic: Ensure both node bar and average line fit
                        const maxScale = Math.max(nodeCap, median) * 1.1; // 10% headroom
                        const nodeWidth = (nodeCap / maxScale) * 100;
                        const medianPos = (median / maxScale) * 100;

                        return (
                            <div className="bg-black/50 rounded-xl p-4 border border-white/5 backdrop-blur-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-zinc-400">Storage Capacity</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                        isPos 
                                        ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                                        : 'bg-red-900/20 text-red-400 border-red-900/50'
                                    }`}>
                                        {isPos ? '▲' : '▼'} {percentDiff.toFixed(1)}% vs median
                                    </span>
                                </div>
                                
                                <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden w-full">
                                    {/* User Bar */}
                                    <div 
                                        className={`h-full transition-all duration-700 ${isPos ? 'bg-purple-500' : 'bg-orange-500'}`} 
                                        style={{ width: `${nodeWidth}%` }}
                                    ></div>
                                    
                                    {/* Median Needle */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                                        style={{ left: `${medianPos}%` }}
                                        title={`Network Median: ${formatBytes(median)}`}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-zinc-600 mt-1 font-mono">
                                    <span>0 B</span>
                                    <span className="text-zinc-400">Median: {formatBytes(median)}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* COLUMN 3: PERFORMANCE */}
                <div>
                    <div className="flex items-center gap-2 mb-3 cursor-help group" onClick={(e) => toggleTooltip(e, 'perf')}>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase">Performance</h3>
                        <HelpCircle size={10} className="text-zinc-600 group-hover:text-zinc-400" />
                    </div>
                    {activeTooltip === 'perf' && (
                        <div className="mb-3 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400 animate-in fade-in slide-in-from-top-1">
                            Health score and reputation credits earned from network participation.
                        </div>
                    )}
                    
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-center mb-4 backdrop-blur-md relative group">
                        <div className="text-xs text-zinc-500 mb-2 flex items-center justify-center gap-1 font-bold uppercase">
                            Health Score 
                            <button onClick={(e) => { e.stopPropagation(); setShowHealthInfo(!showHealthInfo); }}>
                                <Info size={12} className="cursor-pointer hover:text-white" />
                            </button>
                        </div>
                        
                        {(showHealthInfo) && (
                            <div className="absolute top-10 left-4 right-4 bg-zinc-900 border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-10 shadow-xl animate-in fade-in slide-in-from-top-1">
                                Score based on Uptime, Version Consensus, and Network Visibility.
                            </div>
                        )}

                        <div className="text-5xl font-bold text-white mb-1">{getHealthScore(selectedNode, mostCommonVersion)}</div>
                        <div className="text-[9px] text-zinc-600">out of 100</div>
                    </div>

                    <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-md relative">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[9px] text-zinc-500 uppercase font-bold">Reputation</h4>
                            <button onClick={(e) => { e.stopPropagation(); setShowReputationInfo(!showReputationInfo); }}>
                                <HelpCircle size={10} className="text-zinc-600 hover:text-zinc-400" />
                            </button>
                        </div>

                        {(showReputationInfo) && (
                            <div className="absolute top-8 right-4 w-48 bg-zinc-900 border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-10 shadow-xl animate-in fade-in slide-in-from-top-1">
                                Reputation is earned by proving storage capacity and maintaining high uptime.
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-400 text-xs">Credits</span>
                            <span className="text-yellow-400 font-mono font-bold">{selectedNode.credits?.toLocaleString() || 0}</span>
                        </div>
                        
                        <Link href="/leaderboard">
                            <div className="bg-zinc-900/50 border border-yellow-500/20 p-2 rounded-lg flex items-center justify-between cursor-pointer hover:border-yellow-500/40 transition mt-3 group">
                                <div className="flex items-center gap-2">
                                    <Trophy size={14} className="text-yellow-500" />
                                    <span className="text-xs font-bold text-zinc-400">Global Rank</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-white">#{selectedNode.rank && selectedNode.rank < 9999 ? selectedNode.rank : '-'}</span>
                                    <ExternalLink size={12} className="text-zinc-500 group-hover:text-white transition" />
                                </div>
                            </div>
                        </Link>
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
              
              {/* SHARE BUTTONS */}
              <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                 <button 
                   onClick={() => copyStatusReport(selectedNode)}
                   className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold py-3 rounded-xl transition border border-zinc-700"
                 >
                   {copiedField === 'report' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                   {copiedField === 'report' ? 'COPIED' : 'REPORT'}
                 </button>
                 <button 
                   onClick={() => shareToTwitter(selectedNode)}
                   className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-bold py-3 rounded-xl transition"
                 >
                   <Twitter size={12} fill="currentColor" />
                   SHARE ON X
                 </button>
                 <button 
                   onClick={() => copyRawJson(selectedNode)}
                   className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono py-3 rounded-xl transition border border-zinc-800"
                 >
                   {copiedField === 'json' ? <Check size={12} className="text-green-500" /> : <Code size={12} />}
                   {copiedField === 'json' ? 'COPIED' : 'DIAGNOSTIC DATA'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center">
        <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
        <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">
            Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600">
            <span className="opacity-50">pRPC Powered</span>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-1">
                <span>Built by</span>
                <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">
                    riot' <Twitter size={10} />
                </a>
            </div>
            <span className="text-zinc-800">|</span>
            <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">
                Open Source <ExternalLink size={10} />
            </a>
        </div>
      </footer>
    </div>
  );
}
