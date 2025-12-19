import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Activity, Shield, Zap, Globe, Server, Database } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30">
      <Head>
        <title>System Architecture - Xandeum Pulse</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft size={16} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Back to Dashboard</span>
          </Link>
          <div className="text-xs font-mono text-zinc-500">v1.0.0-beta</div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {/* Header */}
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            Technical Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Under the Hood of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Pulse</span>
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
            Xandeum Pulse is a serverless analytics platform built to visualize the physical and logical topology of the Xandeum network. Here is how we process data, calculate health, and ensure 99.9% availability.
          </p>
        </header>

        {/* SECTION 1: HEALTH ALGORITHM */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-400"><Activity size={24} /></div>
            <h2 className="text-2xl font-bold text-white">The Vitality Score Algorithm</h2>
          </div>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400 mb-6">
              Unlike simple uptime monitors, Pulse calculates a comprehensive <strong>0-100 Vitality Score</strong> for every node. This score represents the node's true value to the network, preventing "zombie nodes" (high uptime, zero utility) from appearing healthy.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="text-blue-400 font-bold mb-2">1. Stability (30%)</div>
                <p className="text-sm text-zinc-500">
                  Measures continuous uptime. Nodes with &lt;24h uptime are heavily penalized (-20 points) as they haven't proven reliability yet.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="text-purple-400 font-bold mb-2">2. Capacity (25%)</div>
                <p className="text-sm text-zinc-500">
                  Rewards storage commitment. A node providing 0GB is considered "useless" and receives a total score of 0 regardless of other metrics.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="text-yellow-400 font-bold mb-2">3. Reputation (25%)</div>
                <p className="text-sm text-zinc-500">
                  Compares the node's accumulated credits against the <strong>Network Median</strong>. Nodes with &lt;1% of the median credit balance are flagged as underperforming.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="text-pink-400 font-bold mb-2">4. Consensus (20%)</div>
                <p className="text-sm text-zinc-500">
                  Checks the node's software version against the network majority. Major version mismatches incur significant penalties (-30 points).
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800 mb-20" />

        {/* SECTION 2: MAP TECH */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Globe size={24} /></div>
            <h2 className="text-2xl font-bold text-white">Geospatial Intelligence</h2>
          </div>
          <div className="space-y-6 text-zinc-400">
            <p>
              Visualizing a decentralized network requires mapping IP addresses to physical locations without degrading performance. Pulse implements a three-layer caching strategy:
            </p>
            <ul className="space-y-4 ml-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-white">1</span>
                <div>
                  <strong className="text-white block mb-1">In-Flight De-duplication</strong>
                  If 50 users load the map simultaneously, requests for the same IP (e.g., a popular seed node) are merged into a single promise. This prevents race conditions and saves API quota.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-white">2</span>
                <div>
                  <strong className="text-white block mb-1">LRU (Least Recently Used) Caching</strong>
                  We maintain a memory-safe cache of the last 500 resolved locations. As new nodes appear, the oldest data is strictly evicted to prevent memory leaks in the Node.js runtime.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-white">3</span>
                <div>
                  <strong className="text-white block mb-1">City-Level Aggregation</strong>
                  To protect operator privacy while maintaining data utility, coordinates are aggregated to the nearest city center. Pulse never stores or logs precise coordinates.
                </div>
              </li>
            </ul>
          </div>
        </section>

        <hr className="border-zinc-800 mb-20" />

        {/* SECTION 3: FAILOVER */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Server size={24} /></div>
            <h2 className="text-2xl font-bold text-white">Resilient RPC Architecture</h2>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
            <p className="text-zinc-400 mb-6">
              A dashboard is useless if it goes offline when a seed node fails. Pulse uses a <strong>"Hero & Race"</strong> strategy to ensure 99.9% data availability.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold">1</div>
                <div className="flex-1 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <div className="text-white font-bold text-sm">Primary "Hero" Request</div>
                  <div className="text-zinc-500 text-xs">Attempts connection to the designated high-performance seed node (4s timeout).</div>
                </div>
              </div>
              
              <div className="flex justify-center"><div className="h-6 w-0.5 bg-zinc-800"></div></div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold">2</div>
                <div className="flex-1 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <div className="text-white font-bold text-sm">Backup "Race" (Failover)</div>
                  <div className="text-zinc-500 text-xs">If primary fails, we trigger simultaneous requests to 3 random backup nodes.</div>
                </div>
              </div>

              <div className="flex justify-center"><div className="h-6 w-0.5 bg-zinc-800"></div></div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">3</div>
                <div className="flex-1 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <div className="text-white font-bold text-sm">Promise.any Resolution</div>
                  <div className="text-zinc-500 text-xs">The first successful response from the backup pool is used instantly.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center">
        <p className="text-zinc-600 text-sm">
          Xandeum Pulse Documentation • <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Launch App</Link>
        </p>
      </footer>
    </div>
  );
}
