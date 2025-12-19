import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, Trophy, GitMerge, Cpu, Map as MapIcon, BarChart3, Lock } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30">
      <Head>
        <title>System Architecture - Xandeum Pulse</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft size={16} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Return to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-mono text-zinc-500">System Online</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        
        {/* Header */}
        <header className="mb-20 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Cpu size={12} /> Technical Whitepaper
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            The Nervous System of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Xandeum Pulse</span>
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-3xl">
            Pulse is not just a UI wrapper. It is a serverless analytics engine designed to visualize the physical, logical, and economic topology of the Xandeum network in real-time.
          </p>
        </header>

        {/* --- PART 1: THE TRINITY (How the 3 pages connect) --- */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <GitMerge className="text-purple-500" /> Core Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. MONITOR */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition">
              <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4 text-blue-400"><Activity size={24} /></div>
              <h3 className="text-lg font-bold text-white mb-2">1. The Monitor</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Real-time operational dashboard.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex gap-2"><CheckCircle /> Hero & Race RPC Failover</li>
                <li className="flex gap-2"><CheckCircle /> Median Comparison Logic</li>
                <li className="flex gap-2"><CheckCircle /> Deep Packet Inspection</li>
              </ul>
            </div>

            {/* 2. TOPOLOGY */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition">
              <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4 text-purple-400"><MapIcon size={24} /></div>
              <h3 className="text-lg font-bold text-white mb-2">2. The Topology</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Geospatial decentralization engine.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex gap-2"><CheckCircle /> Vitality Score Algorithm</li>
                <li className="flex gap-2"><CheckCircle /> LRU Geo-Caching</li>
                <li className="flex gap-2"><CheckCircle /> In-flight Request De-duping</li>
              </ul>
            </div>

            {/* 3. LEDGER */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition">
              <div className="p-3 bg-yellow-500/10 rounded-xl w-fit mb-4 text-yellow-400"><Trophy size={24} /></div>
              <h3 className="text-lg font-bold text-white mb-2">3. The Ledger</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Reputation and contribution ranking.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex gap-2"><CheckCircle /> Dual-Fetch Identity Mapping</li>
                <li className="flex gap-2"><CheckCircle /> Olympic-style Ranking</li>
                <li className="flex gap-2"><CheckCircle /> Cross-Context Watchlists</li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- PART 2: THE VITALITY SCORE --- */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Zap className="text-yellow-500" /> The Vitality Score Logic
            </h2>
            <span className="text-xs font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded">api/geo.ts</span>
          </div>
          
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8">
            <p className="text-zinc-400 mb-8 max-w-2xl">
              Simple uptime monitoring is insufficient for a storage network. Pulse calculates a composite <strong>0-100 score</strong> based on four weighted factors. A node with 0GB storage commitment automatically receives a 0 score ("Useless Node Gate").
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard 
                title="Stability" 
                percent="30%" 
                color="text-blue-400" 
                desc="Penalizes nodes with <24h uptime. Trust is earned over time." 
              />
              <ScoreCard 
                title="Capacity" 
                percent="25%" 
                color="text-purple-400" 
                desc="Rewards storage commitment. Scale: 10GB to 1TB logarithmic." 
              />
              <ScoreCard 
                title="Reputation" 
                percent="25%" 
                color="text-yellow-400" 
                desc="Compares node credits against the global network median." 
              />
              <ScoreCard 
                title="Consensus" 
                percent="20%" 
                color="text-pink-400" 
                desc="Checks version against the network majority. Punishes forks." 
              />
            </div>
          </div>
        </section>

        {/* --- PART 3: ARCHITECTURE DEEP DIVES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          
          {/* FAILOVER */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Server size={20} className="text-indigo-400" /> Hero & Race Failover
            </h2>
            <div className="prose prose-invert prose-sm text-zinc-400">
              <p>
                The dashboard uses a resilient connection strategy found in high-frequency trading apps.
              </p>
              <ul className="list-disc pl-4 space-y-2 mt-4">
                <li><strong>Hero Request:</strong> We first attempt to connect to a high-performance primary node (4s timeout).</li>
                <li><strong>The Backup Race:</strong> If the Hero fails, we trigger <code>Promise.any()</code> on a pool of 3 random backup nodes.</li>
                <li><strong>Result:</strong> The dashboard loads even if 80% of the seed nodes are offline.</li>
              </ul>
            </div>
          </section>

          {/* IDENTITY BRIDGE */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock size={20} className="text-green-400" /> The Identity Bridge
            </h2>
            <div className="prose prose-invert prose-sm text-zinc-400">
              <p>
                Xandeum's Credits Oracle lists anonymous Public Keys. The Gossip Protocol lists IP Addresses. The Leaderboard bridges them:
              </p>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg font-mono text-xs mt-4">
                <div className="text-zinc-500">// leaderboard.tsx</div>
                <div className="text-blue-400">const</div> <div className="text-white inline">addressMap</div> = <div className="text-purple-400 inline">new Map()</div>;
                <br/>
                <div className="text-zinc-500 pl-4">// Maps PubKey (Oracle) -&gt; IP (Gossip)</div>
              </div>
              <p className="mt-4">
                This allows operators to find <em>their</em> specific machine in the global ranking.
              </p>
            </div>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-12 text-center">
        <p className="text-zinc-600 text-sm mb-4">
          Documentation for Xandeum Pulse v1.0 • <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Launch Dashboard</Link>
        </p>
        <div className="flex justify-center gap-4">
            <div className="h-1 w-1 bg-zinc-800 rounded-full"></div>
            <div className="h-1 w-1 bg-zinc-800 rounded-full"></div>
            <div className="h-1 w-1 bg-zinc-800 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
}

// Sub-component for Score Cards
function ScoreCard({ title, percent, color, desc }: { title: string, percent: string, color: string, desc: string }) {
    return (
        <div className="p-6 rounded-2xl bg-black border border-zinc-800 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <BarChart3 size={48} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${color}`}>{percent}</div>
            <div className="text-white font-bold text-sm uppercase tracking-wider mb-3">{title}</div>
            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
        </div>
    )
}

function CheckCircle() {
    return <div className="text-green-500 mt-0.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div></div>
}
