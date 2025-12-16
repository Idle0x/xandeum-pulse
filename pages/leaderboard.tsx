import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, ArrowLeft, Search, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function Leaderboard() {
  const [debugData, setDebugData] = useState<any>(null); // DEBUG
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await axios.get('/api/credits');
        const rawData = res.data.pods_credits || res.data;
        
        // 🚨 CAPTURE DEBUG DATA (First 2 entries)
        let sample = {};
        if (Array.isArray(rawData)) sample = rawData.slice(0, 2);
        else if (typeof rawData === 'object') sample = Object.entries(rawData).slice(0, 2);
        setDebugData(sample);

        let parsedList: any[] = [];

        // Logic (Trying our best)
        if (Array.isArray(rawData)) {
          parsedList = rawData.map((item: any) => ({
            pubkey: item.pubkey || item.node || item.address || item.id || 'Unknown',
            credits: Number(item.credits || item.amount || 0),
            rank: 0 
          }));
        } else if (typeof rawData === 'object') {
          parsedList = Object.entries(rawData).map(([key, val]: [string, any]) => {
             if (key === 'status' || key === 'success') return null;
             return {
                pubkey: key, // Assuming key is the ID/Pubkey
                credits: typeof val === 'number' ? val : Number(val?.credits || 0),
                rank: 0
             };
          }).filter(Boolean);
        }

        const sorted = parsedList.sort((a, b) => b.credits - a.credits).map((node, index) => ({ ...node, rank: index + 1 }));
        setRanking(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, []);

  const filtered = ranking.filter(n => n.pubkey.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8">
      <Link href="/" className="flex items-center gap-2 text-zinc-500 mb-8"><ArrowLeft size={16} /> Back to Monitor</Link>
      
      {/* 🚨 DEBUG BOX */}
      <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 mb-8 font-mono text-xs overflow-auto max-h-60 rounded-xl">
        <h3 className="font-bold mb-2">DIAGNOSTIC DATA (SEND SCREENSHOT)</h3>
        <pre>{JSON.stringify(debugData, null, 2)}</pre>
      </div>

      <h1 className="text-3xl font-extrabold flex items-center gap-3 text-yellow-500 mb-6"><Trophy size={32} /> LEADERBOARD</h1>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        {filtered.slice(0, 50).map((node) => (
          <div key={node.rank} className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 hover:bg-white/5">
            <div className="col-span-1 text-center font-bold text-zinc-500">#{node.rank}</div>
            <div className="col-span-8 font-mono text-sm truncate">{node.pubkey}</div>
            <div className="col-span-3 text-right font-bold text-yellow-500">{node.credits.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
