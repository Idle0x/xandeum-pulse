import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { Trophy, Medal, ArrowLeft, Search, Wallet, X, Star, Zap, ChevronRight, Activity, Users, BarChart3, HelpCircle } from 'lucide-react';

// --- TYPES ---
interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
}

interface NodeDetails {
  address: string;
  version: string;
  uptime: number;
  storage_used: number;
  is_public: boolean;
}

export default function Leaderboard() {
  const [ranking, setRanking] = useState<RankedNode[]>([]);
  const [nodeMap, setNodeMap] = useState<Map<string, NodeDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Hover State with Debounce Refs
  const [hoveredPubkey, setHoveredPubkey] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits'),
          axios.get('/api/stats')
        ]);

        // 1. Process Credits & Ranking
        const rawData = creditsRes.data.pods_credits || creditsRes.data;
        let parsedList: RankedNode[] = [];

        if (Array.isArray(rawData)) {
          parsedList = rawData.map((item: any) => ({
            pubkey: item.pod_id || item.pubkey || 'Unknown',
            credits: Number(item.credits || 0),
            rank: 0
          }));
        } else if (typeof rawData === 'object') {
          parsedList = Object.entries(rawData).map(([key, val]: [string, any]) => {
            if (key === 'status' || key === 'success') return null;
            return {
              pubkey: val?.pod_id || val?.pubkey || key,
              credits: typeof val === 'number' ? val : Number(val?.credits || 0),
              rank: 0
            };
          }).filter(Boolean) as RankedNode[];
        }

        // Olympic Sorting Logic
        parsedList.sort((a, b) => b.credits - a.credits);
        let currentRank = 1;
        for (let i = 0; i < parsedList.length; i++) {
          if (i > 0 && parsedList[i].credits < parsedList[i - 1].credits) {
            currentRank = i + 1;
          }
          parsedList[i].rank = currentRank;
        }

        // 2. Process Node Details (for Hover Cards)
        const map = new Map<string, NodeDetails>();
        if (statsRes.data.result?.pods) {
          statsRes.data.result.pods.forEach((node: any) => {
            map.set(node.pubkey, {
              address: node.address,
              version: node.version,
              uptime: node.uptime,
              storage_used: node.storage_used,
              is_public: node.is_public
            });
          });
        }

        setRanking(parsedList);
        setNodeMap(map);

        // 3. Load Favorites
        const saved = localStorage.getItem('xandeum_favorites');
        if (saved) setFavorites(JSON.parse(saved));

      } catch (err) {
        console.error("Leaderboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- HELPERS ---

  // Debounced Hover Handlers (Prevents lag when scrolling)
  const handleMouseEnter = (pubkey: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
        setHoveredPubkey(pubkey);
    }, 150); // 150ms delay
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredPubkey(null);
  };

  const filtered = ranking.filter(n => 
    n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-400', label: 'Champion', bg: 'bg-yellow-500/10 border-yellow-500/50' };
    if (rank === 2) return { icon: Medal, color: 'text-zinc-300', label: 'Silver', bg: 'bg-zinc-500/10 border-zinc-500/50' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600', label: 'Bronze', bg: 'bg-amber-500/10 border-amber-500/50' };
    
    const percentile = (rank / ranking.length) * 100;
    if (percentile <= 10) return { icon: Star, color: 'text-blue-400', label: 'Elite', bg: 'bg-blue-500/10 border-blue-500/20' };
    if (percentile <= 25) return { icon: Zap, color: 'text-purple-400', label: 'Advanced', bg: 'bg-purple-500/10 border-purple-500/20' };
    
    return { icon: null, color: 'text-zinc-500', label: '', bg: '' };
  };

  const isFavorite = (pubkey: string) => {
    const details = nodeMap.get(pubkey);
    return details && favorites.includes(details.address);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      <Head>
        <title>Xandeum Pulse - Reputation Leaderboard</title>
      </Head>

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Monitor
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-yellow-500 justify-center">
            <Trophy size={32} /> REPUTATION LEADERBOARD
          </h1>
          <p className="text-xs text-zinc-600 mt-1 font-mono tracking-wide">RANKED BY PROVEN NETWORK CONTRIBUTION</p>
        </div>
        <div className="w-32 hidden md:block"></div> {/* Spacer for alignment */}
      </div>

      {/* NETWORK STATS BAR */}
      {!loading && ranking.length > 0 && (
        <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Users size={12}/> Total Nodes</div>
            <div className="text-2xl font-bold text-white mt-1">{ranking.length}</div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Wallet size={12}/> Total Credits</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {(ranking.reduce((sum, n) => sum + n.credits, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Activity size={12}/> Avg Score</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.round(ranking.reduce((sum, n) => sum + n.credits, 0) / ranking.length).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><BarChart3 size={12}/> Top 10 Share</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {(() => {
                const total = ranking.reduce((sum, n) => sum + n.credits, 0);
                const top10 = ranking.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
                return total > 0 ? ((top10 / total) * 100).toFixed(1) : 0;
              })()}%
            </div>
          </div>
        </div>
      )}

      {/* PODIUM SECTION (TOP 3) */}
      {!loading && ranking.length >= 3 && (
        <div className="max-w-5xl mx-auto mb-12">
          {/* Mobile: Vertical Stack */}
          <div className="flex md:hidden flex-col gap-4">
            {ranking.slice(0, 3).map((node, idx) => {
              const tier = getTierBadge(node.rank);
              return (
                <div key={node.pubkey} className={`rounded-xl p-4 flex items-center justify-between border ${tier.bg}`}>
                  <div className="flex items-center gap-3">
                    <tier.icon className={tier.color} size={32} />
                    <div>
                      <div className="text-xs text-zinc-400 uppercase font-bold">{tier.label}</div>
                      <div className="font-mono text-sm text-white truncate max-w-[150px]">{node.pubkey}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-400">{node.credits.toLocaleString()}</div>
                    <div className="text-[9px] text-zinc-500 uppercase">Credits</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Podium Layout */}
          <div className="hidden md:flex items-end justify-center gap-6 px-4 pb-4">
            {/* 2nd Place */}
            {ranking[1] && (
              <div className="flex flex-col items-center flex-1 max-w-[220px] group cursor-pointer" onClick={() => window.open(`/?search=${ranking[1].pubkey}`, '_self')}>
                <Medal className="text-zinc-400 mb-4 group-hover:-translate-y-2 transition duration-300" size={48} />
                <div className="w-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-600/50 rounded-t-2xl p-6 text-center hover:bg-zinc-800 transition" style={{ minHeight: '180px' }}>
                  <div className="text-6xl font-bold text-zinc-500 mb-2 opacity-50">2</div>
                  <div className="text-xs text-zinc-400 uppercase mb-2 font-bold tracking-widest">Silver</div>
                  <div className="font-mono text-xs text-white truncate mb-4 bg-black/40 py-1 px-2 rounded">{ranking[1].pubkey.slice(0, 8)}...</div>
                  <div className="text-2xl font-bold text-white">{ranking[1].credits.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-500 uppercase mt-1">Credits</div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {ranking[0] && (
              <div className="flex flex-col items-center flex-1 max-w-[240px] group cursor-pointer" onClick={() => window.open(`/?search=${ranking[0].pubkey}`, '_self')}>
                <Trophy className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] group-hover:-translate-y-2 transition duration-300" size={64} />
                <div className="w-full bg-gradient-to-b from-yellow-900/40 to-zinc-900 border border-yellow-500/50 rounded-t-2xl p-6 text-center shadow-[0_0_30px_rgba(234,179,8,0.1)] hover:bg-yellow-900/30 transition" style={{ minHeight: '240px' }}>
                  <div className="text-7xl font-bold text-yellow-500 mb-2 opacity-80">1</div>
                  <div className="text-xs text-yellow-400 uppercase mb-2 font-bold tracking-widest">Champion</div>
                  <div className="font-mono text-xs text-white truncate mb-4 bg-black/40 py-1 px-2 rounded border border-yellow-500/20">{ranking[0].pubkey.slice(0, 8)}...</div>
                  <div className="text-3xl font-bold text-white">{ranking[0].credits.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-400 uppercase mt-1">Credits</div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {ranking[2] && (
              <div className="flex flex-col items-center flex-1 max-w-[220px] group cursor-pointer" onClick={() => window.open(`/?search=${ranking[2].pubkey}`, '_self')}>
                <Medal className="text-amber-700 mb-4 group-hover:-translate-y-2 transition duration-300" size={48} />
                <div className="w-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-amber-900/50 rounded-t-2xl p-6 text-center hover:bg-zinc-800 transition" style={{ minHeight: '160px' }}>
                  <div className="text-5xl font-bold text-amber-900 mb-2 opacity-80">3</div>
                  <div className="text-xs text-amber-600 uppercase mb-2 font-bold tracking-widest">Bronze</div>
                  <div className="font-mono text-xs text-white truncate mb-4 bg-black/40 py-1 px-2 rounded">{ranking[2].pubkey.slice(0, 8)}...</div>
                  <div className="text-xl font-bold text-white">{ranking[2].credits.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-500 uppercase mt-1">Credits</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="max-w-5xl mx-auto mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Search leaderboard by public key..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 pr-10 text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* RESULT COUNT */}
      {searchQuery && (
        <div className="max-w-5xl mx-auto mb-4 text-center text-sm text-zinc-500 animate-in fade-in">
          {filtered.length === 0 ? (
            <span className="text-red-400">No nodes found matching "{searchQuery}"</span>
          ) : (
            <span>
              Found <span className="text-white font-bold">{filtered.length}</span> matching nodes
            </span>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-7 md:col-span-8">Node Public Key</div>
          <div className="col-span-3 text-right">Credits</div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center animate-pulse text-zinc-500 font-mono flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                CALCULATING FORTUNES...
             </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-zinc-600">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No nodes match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filtered.slice(0, 100).map((node) => {
              const tier = getTierBadge(node.rank);
              const details = nodeMap.get(node.pubkey);
              const isMyNode = isFavorite(node.pubkey);

              return (
                <div 
                  key={node.pubkey} 
                  className={`grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition items-center group relative cursor-pointer ${
                    isMyNode ? 'bg-yellow-500/5 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
                  }`}
                  onMouseEnter={() => handleMouseEnter(node.pubkey)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => window.open(`/?search=${node.pubkey}`, '_self')}
                >
                  
                  {/* RANK BADGE */}
                  <div className="col-span-2 md:col-span-1 flex justify-center items-center gap-1">
                    {isMyNode && <Star size={12} className="text-yellow-500 absolute left-2" fill="currentColor" />}
                    {tier.icon ? (
                      <div className="flex flex-col items-center">
                         <span className={`text-xs font-bold ${node.rank <= 3 ? 'text-white' : 'text-zinc-500'}`}>#{node.rank}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-zinc-500">#{node.rank}</span>
                    )}
                  </div>

                  {/* PUBLIC KEY */}
                  <div className="col-span-7 md:col-span-8 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition relative">
                    <div className="flex items-center gap-2">
                        {node.pubkey}
                        {tier.label && node.rank > 3 && (
                            <span className={`hidden md:inline-block text-[9px] uppercase px-1.5 py-0.5 rounded border ${tier.bg} ${tier.color} font-bold`}>
                                {tier.label}
                            </span>
                        )}
                    </div>
                    
                    {/* HOVER PREVIEW CARD */}
                    {hoveredPubkey === node.pubkey && details && (
                      <div className="absolute left-0 top-8 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200 pointer-events-none md:pointer-events-auto">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                            <span className="text-zinc-500 font-bold uppercase">Quick Stats</span>
                            <span className={`text-[10px] ${details.is_public ? 'text-green-500' : 'text-orange-500'} font-bold`}>
                                {details.is_public ? 'PUBLIC GOSSIP' : 'PRIVATE NODE'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Uptime</span>
                            <span className="text-white font-mono">{formatUptime(details.uptime)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Storage</span>
                            <span className="text-blue-400 font-mono font-bold">{formatBytes(details.storage_used)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Version</span>
                            <span className="text-zinc-300 font-mono bg-zinc-800 px-1.5 rounded">{details.version}</span>
                          </div>
                        </div>
                        <div className="mt-3 text-center text-[10px] text-zinc-600 bg-zinc-950/50 py-1 rounded">
                            Click row to view full dashboard
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CREDITS */}
                  <div className="col-span-3 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                    {node.credits.toLocaleString()}
                    <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition hidden md:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER NOTE */}
      {!loading && ranking.length > 100 && (
        <div className="max-w-5xl mx-auto mt-6 text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
          <HelpCircle size={12} />
          Showing top 100 nodes by reputation. Total network size: {ranking.length} nodes.
        </div>
      )}
    </div>
  );
}
