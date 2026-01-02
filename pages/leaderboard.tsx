import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trophy, Medal, ArrowLeft, Search, Wallet, X, ChevronDown, Check, Copy, Share2, Activity, Zap } from 'lucide-react';

interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
  network: 'MAINNET' | 'DEVNET';
  address?: string;
}

export default function Leaderboard() {
  const router = useRouter();
  const [nodes, setNodes] = useState<RankedNode[]>([]);
  const [networkFilter, setNetworkFilter] = useState<'MAINNET' | 'DEVNET'>('MAINNET');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/credits'); // Fetches MERGED list with network tags
        if (res.data?.pods_credits) {
             const allData = res.data.pods_credits.map((item: any) => ({
                 pubkey: item.pod_id || item.pubkey || item.node,
                 credits: Number(item.credits || 0),
                 network: item.network || 'MAINNET',
                 rank: 0
             }));
             setNodes(allData);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Filter & Sort
  const filteredList = nodes
    .filter(n => n.network === networkFilter) // KEY: Network Toggle
    .filter(n => n.pubkey.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.credits - a.credits);

  // Assign Ranks dynamically based on current view
  let currentRank = 1;
  const rankedList = filteredList.map((n, i) => {
      if (i > 0 && n.credits < filteredList[i-1].credits) currentRank = i + 1;
      return { ...n, rank: currentRank };
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans p-4 md:p-8">
      <Head><title>Leaderboard | Xandeum</title></Head>

      <div className="max-w-5xl mx-auto mb-8 flex flex-col gap-6">
         <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase"><ArrowLeft size={16}/> Back to Dashboard</Link>
         
         <div className="flex flex-col md:flex-row justify-between items-end gap-4">
             <div>
                <h1 className="text-3xl font-black text-yellow-500 flex items-center gap-3"><Trophy size={32}/> LEADERBOARD</h1>
                <p className="text-zinc-500 text-sm mt-1">Top performing nodes by reputation credits.</p>
             </div>

             {/* NETWORK TOGGLE */}
             <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex gap-1">
                 <button 
                    onClick={() => setNetworkFilter('MAINNET')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'MAINNET' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                    <Zap size={12} className={networkFilter === 'MAINNET' ? 'fill-black' : ''}/> MAINNET
                 </button>
                 <button 
                    onClick={() => setNetworkFilter('DEVNET')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'DEVNET' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                    <Activity size={12} /> DEVNET
                 </button>
             </div>
         </div>

         <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input type="text" placeholder="Search Node Public Key..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 text-white focus:border-yellow-500 outline-none" />
         </div>

         <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
             <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/80">
                 <div className="col-span-2 text-center">Rank</div>
                 <div className="col-span-6">Node Public Key</div>
                 <div className="col-span-4 text-right">Credits</div>
             </div>
             
             {loading ? (
                 <div className="p-12 text-center text-zinc-500 animate-pulse">Loading Rankings...</div>
             ) : (
                 rankedList.slice(0, 100).map((node) => (
                     <div key={node.pubkey} className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800/50 items-center hover:bg-zinc-800/30 transition">
                         <div className="col-span-2 flex justify-center">
                             {node.rank === 1 ? <Trophy size={16} className="text-yellow-400"/> : 
                              node.rank === 2 ? <Medal size={16} className="text-zinc-300"/> : 
                              node.rank === 3 ? <Medal size={16} className="text-amber-700"/> : 
                              <span className="text-zinc-500 font-mono">#{node.rank}</span>}
                         </div>
                         <div className="col-span-6 font-mono text-sm text-zinc-300 truncate">{node.pubkey}</div>
                         <div className="col-span-4 text-right font-mono font-bold text-yellow-500">{node.credits.toLocaleString()}</div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
}
