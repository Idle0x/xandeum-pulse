import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trophy, Medal, ArrowLeft, Search, Wallet, X, ChevronRight, Activity, Users, BarChart3, HelpCircle, Star } from 'lucide-react';

// --- TYPES ---
interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  address?: string; // Added for favorite matching
}

export default function Leaderboard() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, statsRes] = await Promise.all([
          axios.get('/api/credits'),
          axios.get('/api/stats')
        ]);

        // Build Map: PubKey -> Address
        const addressMap = new Map<string, string>();
        if (statsRes.data.result?.pods) {
            statsRes.data.result.pods.forEach((node: any) => {
                addressMap.set(node.pubkey, node.address);
            });
        }

        const rawData = creditsRes.data.pods_credits || creditsRes.data;
        let parsedList: RankedNode[] = [];

        if (Array.isArray(rawData)) {
          parsedList = rawData.map((item: any) => ({
            pubkey: item.pod_id || item.pubkey || 'Unknown',
            credits: Number(item.credits || 0),
            rank: 0,
            address: addressMap.get(item.pod_id || item.pubkey)
          }));
        } else if (typeof rawData === 'object') {
          parsedList = Object.entries(rawData).map(([key, val]: [string, any]) => {
            if (key === 'status' || key === 'success') return null;
            const pKey = val?.pod_id || val?.pubkey || key;
            return {
              pubkey: pKey,
              credits: typeof val === 'number' ? val : Number(val?.credits || 0),
              rank: 0,
              address: addressMap.get(pKey)
            };
          }).filter(Boolean) as RankedNode[];
        }

        parsedList.sort((a, b) => b.credits - a.credits);
        
        let currentRank = 1;
        for (let i = 0; i < parsedList.length; i++) {
          if (i > 0 && parsedList[i].credits < parsedList[i - 1].credits) {
            currentRank = i + 1;
          }
          parsedList[i].rank = currentRank;
        }

        setRanking(parsedList);

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

  const filtered = ranking.filter(n => 
    n.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (pubkey: string) => {
    router.push(`/?open=${pubkey}`);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* NETWORK STATS BAR */}
      {!loading && ranking.length > 0 && (
        <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Users size={12}/> Nodes with Credits</div>
            <div className="text-2xl font-bold text-white mt-1">{ranking.length}</div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Wallet size={12}/> Total Credits Issued</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {(ranking.reduce((sum, n) => sum + n.credits, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><Activity size={12}/> Avg Credits</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.round(ranking.reduce((sum, n) => sum + n.credits, 0) / ranking.length).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2"><BarChart3 size={12}/> Top 10 Dominance</div>
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

      {/* SEARCH */}
      <div className="max-w-5xl mx-auto mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Find node by public key..." 
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

      {/* TABLE */}
      <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-visible backdrop-blur-sm relative min-h-[400px]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
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
              const isMyNode = node.address && favorites.includes(node.address);

              return (
                <div 
                  key={node.pubkey} 
                  className={`grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition items-center group relative cursor-pointer ${
                    isMyNode ? 'bg-yellow-500/5 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => handleRowClick(node.pubkey)}
                >
                  
                  {/* RANK BADGE */}
                  <div className="col-span-2 md:col-span-1 flex justify-center items-center gap-1 relative">
                    {isMyNode && <Star size={12} className="text-yellow-500 absolute left-0 md:left-4" fill="currentColor" />}
                    {node.rank === 1 && <Trophy size={20} className="text-yellow-400" />}
                    {node.rank === 2 && <Medal size={20} className="text-zinc-300" />}
                    {node.rank === 3 && <Medal size={20} className="text-amber-600" />}
                    {node.rank > 3 && <span className="text-sm font-bold text-zinc-500">#{node.rank}</span>}
                  </div>

                  {/* PUBLIC KEY */}
                  <div className="col-span-7 md:col-span-8 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition flex items-center justify-between">
                    {node.pubkey}
                    
                    {/* MOBILE CHEVRON (Always Visible) */}
                    <div className="md:hidden text-zinc-600">
                        <ChevronRight size={14} />
                    </div>

                    {/* DESKTOP HOVER VIEW */}
                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition text-[10px] text-blue-400 font-bold items-center gap-1">
                        VIEW <ChevronRight size={10} />
                    </div>
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

      {/* FOOTER NOTE - FIXED */}
      {!loading && (
        <div className="max-w-5xl mx-auto mt-6 text-center text-xs text-zinc-600 flex flex-col md:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle size={12} />
            <span>Tracking <span className="text-zinc-400 font-bold">{ranking.length}</span> earning nodes. Top 100 displayed.</span>
          </div>
          <span className="hidden md:inline text-zinc-700">•</span>
          <span className="text-zinc-500">(Search to find others)</span>
        </div>
      )}
    </div>
  );
}
