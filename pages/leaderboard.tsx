import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, ArrowLeft, Search, Wallet, Bug } from 'lucide-react';
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
  // DIAGNOSTIC STATE
  const [debugRaw, setDebugRaw] = useState<string>('Waiting for data...');

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await axios.get('/api/credits');
        const rawData = res.data.pods_credits || res.data;
        
        // --- 🔍 DIAGNOSTIC TOOL ---
        // This grabs the first item from the data to see its structure
        let sample = "Empty Data";
        if (Array.isArray(rawData) && rawData.length > 0) {
            sample = JSON.stringify(rawData[0], null, 2);
        } else if (typeof rawData === 'object') {
            const keys = Object.keys(rawData);
            if (keys.length > 0) {
                const firstKey = keys[0]; // e.g. "204"
                const firstVal = rawData[firstKey]; // The object inside
                sample = `Key: "${firstKey}" \nValue: ${JSON.stringify(firstVal, null, 2)}`;
            }
        }
        setDebugRaw(sample);
        // ---------------------------

        let parsedList: RankedNode[] = [];

        if (Array.isArray(rawData)) {
          parsedList = rawData.map((item: any, i) => ({
            pubkey: item.pubkey || item.node_pubkey || item.identity || item.address || `Unknown-${i}`,
            credits: Number(item.credits || item.score || item.amount || item.total_credits || 0),
            rank: 0
          }));
        } else if (typeof rawData === 'object') {
          parsedList = Object.entries(rawData).map(([key, val]: [string, any]) => {
             if (key === 'status' || key === 'success') return null;
             
             // Try to find the Pubkey inside the object, or use the Key itself
             const extractedPubkey = val?.pubkey || val?.node_pubkey || val?.identity || key;
             // Try to find the Credits inside
             const extractedCredits = typeof val === 'number' ? val : Number(val?.credits || val?.score || val?.amount || 0);

             return {
                pubkey: extractedPubkey,
                credits: extractedCredits,
                rank: 0
             };
          }).filter(Boolean) as RankedNode[];
        }

        const sorted = parsedList
            .sort((a, b) => b.credits - a.credits)
            .map((node, index) => ({ ...node, rank: index + 1 }));

        setRanking(sorted);
      } catch (err: any) {
        setDebugRaw(`ERROR: ${err.message}`);
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

      {/* 🚨 DIAGNOSTIC BOX 🚨 */}
      <div className="max-w-4xl mx-auto mb-8 bg-blue-900/20 border border-blue-500/50 p-4 rounded-xl">
        <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-widest">
            <Bug size={16} /> Data Inspector
        </h3>
        <pre className="text-[10px] md:text-xs font-mono text-blue-200 overflow-x-auto whitespace-pre-wrap break-all">
            {debugRaw}
        </pre>
        <p className="text-xs text-blue-500 mt-2">
            *Tell me what property names you see above (e.g. "node_pubkey", "score", etc.)*
        </p>
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
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <span className="font-mono text-zinc-500">#{node.rank}</span>
                </div>

                {/* ADDRESS */}
                <div className="col-span-7 md:col-span-8 font-mono text-sm text-zinc-300 truncate group-hover:text-white transition">
                  {node.pubkey}
                </div>

                {/* CREDITS */}
                <div className="col-span-3 text-right font-bold font-mono text-yellow-500 flex items-center justify-end gap-2">
                  {node.credits.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
