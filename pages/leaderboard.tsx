import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, ArrowLeft, Search, Wallet } from 'lucide-react';
import Link from 'next/link';

interface RankedNode {
  rank: number;
  pubkey: string;
  credits: number;
}

export default function Leaderboard() {
  const [ranking, setRanking] = useState<RankedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await axios.get('/api/credits');
        const rawData = res.data.pods_credits || res.data;
        
        let parsedList: RankedNode[] = [];

        // Parsing logic matching main dashboard
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

        // --- OLYMPIC RANKING LOGIC ---
        // 1. Sort Descending
        parsedList.sort((a, b) => b.credits - a.credits);

        // 2. Assign Ranks with Tie Handling
        let currentRank = 1;
        for (let i = 0; i < parsedList.length; i++) {
            if (i > 0 && parsedList[i].credits < parsedList[i - 1].credits) {
                currentRank = i + 1;
            }
            parsedList[i].rank = currentRank;
        }

        setRanking(parsedList);
      } catch (err) {
        console.error("Leaderboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  const filtered = ranking.filter(n => n.pubkey.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Back to Monitor
        </Link>
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-yellow-500">
          <Trophy size={32} /> LEADERBOARD
        </h1>
      </div>

      {/* SEARCH */}
      <div className="max-w-4xl mx-auto mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
        <input 
            type="text" 
            placeholder="Find Public Key..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>

      {/* TABLE */}
      <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-7 md:col-span-8">Node Public Key</div>
          <div className="col-span-3 text-right">Credits</div>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse text-zinc-500 font-mono">CALCULATING FORTUNES...</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filtered.slice(0, 100).map((node) => (
              <div key={node.pubkey} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition items-center group">
                
                {/* RANK BADGE */}
                <div className="col-span-2 md:col-span-1 flex justify-center font-bold text-zinc-500">
                  {node.rank === 1 && <Medal className="text-yellow-400" size={24} />}
                  {node.rank === 2 && <Medal className="text-gray-300" size={24} />}
                  {node.rank === 3 && <Medal className="text-amber-700" size={24} />}
                  {node.rank > 3 && <span>#{node.rank}</span>}
                </div>

                {/* ADDRESS */}
                <div className="col-span-7 md:col-span-8 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition">
                  {node.pubkey}
                </div>

                {/* CREDITS */}
                <div className="col-span-3 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                  {node.credits.toLocaleString()}
                  <Wallet size={14} className="text-zinc-600 group-hover:text-yellow-500 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
