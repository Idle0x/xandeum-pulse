import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, GitMerge, Cpu, Map as MapIcon, BarChart3, Lock, 
  HeartPulse, Search, Sliders 
} from 'lucide-react';

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
            Pulse is a serverless analytics engine designed to visualize the physical, logical, and economic topology of the Xandeum network. Here is how the machine thinks.
          </p>
        </header>

        {/* --- SECTION 1: THE VITALITY SIMULATOR --- */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <HeartPulse className="text-red-500" /> The Vitality Score Algorithm
            </h2>
            <span className="text-xs font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded">Interactive Demo</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="prose prose-invert prose-sm text-zinc-400">
              <p>
                A simple "Uptime" check is insufficient for a storage network. Pulse calculates a composite <strong>0-100 Vitality Score</strong> using a weighted 4-factor algorithm.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex gap-3">
                  <div className="min-w-[4px] h-full bg-blue-500 rounded-full"></div>
                  <div>
                    <strong className="text-white">Stability (30%)</strong>
                    <p className="text-xs mt-1">Measures continuous uptime. Nodes with &lt;24h uptime are penalized as "unproven."</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="min-w-[4px] h-full bg-purple-500 rounded-full"></div>
                  <div>
                    <strong className="text-white">Capacity (25%)</strong>
                    <p className="text-xs mt-1">Rewards storage commitment. <strong>Gatekeeper Rule:</strong> 0GB storage results in an instant 0 Score.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="min-w-[4px] h-full bg-yellow-500 rounded-full"></div>
                  <div>
                    <strong className="text-white">Reputation (25%)</strong>
                    <p className="text-xs mt-1">Compares node credits against the dynamic <strong>Network Median</strong>.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="min-w-[4px] h-full bg-pink-500 rounded-full"></div>
                  <div>
                    <strong className="text-white">Consensus (20%)</strong>
                    <p className="text-xs mt-1">Checks software version. Major mismatches are flagged as security risks.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* INTERACTIVE SIMULATOR */}
            <VitalitySimulator />
          </div>
        </section>

        <hr className="border-zinc-800 mb-20" />

        {/* --- SECTION 2: DYNAMIC TOPOLOGY --- */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Globe className="text-blue-500" /> Dynamic Geospatial Tiers
          </h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-400 mb-6">
              Static thresholds (e.g., "Gold = 1TB") become obsolete as the network grows. Pulse uses <strong>Dynamic Percentile Tiering</strong>. The map recalculates tiers live based on the current distribution of data.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <TierBadge color="#f59e0b" label="Massive / Legend" desc="Top 10%" />
              <TierBadge color="#ec4899" label="Major / Elite" desc="Top 25%" />
              <TierBadge color="#a855f7" label="Standard / Proven" desc="Top 50%" />
              <TierBadge color="#3b82f6" label="Entry / Active" desc="Top 75%" />
              <TierBadge color="#22d3ee" label="Micro / New" desc="Bottom 25%" />
            </div>

            <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Database size={20} /></div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Context-Aware "X-Ray" Vision</h4>
                <p className="text-xs text-zinc-400">
                  Clicking a region on the map performs a deep scan. Depending on your view mode (Storage vs. Health), the system calculates density (Avg per Node) or stability breakdowns (Stable vs Critical) on the fly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: RESILIENT ARCHITECTURE --- */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Server className="text-indigo-500" /> "Hero & Race" Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="prose prose-invert prose-sm text-zinc-400">
              <p>
                A centralized dashboard creates a single point of failure. Pulse implements a <strong>Self-Healing RPC Strategy</strong> inspired by high-frequency trading systems.
              </p>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <h4 className="text-white font-bold text-xs uppercase mb-1">Phase 1: The Hero</h4>
                  <p className="text-xs">Attempt direct connection to the primary high-performance seed node (4s timeout).</p>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                  <h4 className="text-white font-bold text-xs uppercase mb-1">Phase 2: The Backup Race</h4>
                  <p className="text-xs">If Hero fails, trigger <code>Promise.any()</code> on a shuffled pool of 6 backup nodes. The first to respond wins.</p>
                </div>
              </div>
            </div>
            
            {/* Simple Visual Representation */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5"></div>
                <div className="flex items-center gap-4 mb-8 w-full justify-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500"><Server size={20} /></div>
                    <div className="flex-1 h-0.5 bg-zinc-800 relative">
                        <div className="absolute right-0 -top-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xs">PULSE</div>
                </div>
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold border border-green-500/20">
                        <Zap size={10} /> 99.9% Uptime Strategy
                    </div>
                </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-12 text-center">
        <p className="text-zinc-600 text-sm mb-4">
          Documentation for Xandeum Pulse v1.0 • <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Launch Dashboard</Link>
        </p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TierBadge({ color, label, desc }: { color: string, label: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
            <div className="text-[10px] font-bold text-zinc-300 uppercase mb-0.5">{label}</div>
            <div className="text-[9px] text-zinc-500 font-mono">{desc}</div>
        </div>
    )
}

// Interactive Simulator Component
function VitalitySimulator() {
    const [uptime, setUptime] = useState(30); // Days
    const [storage, setStorage] = useState(500); // GB
    const [reputation, setReputation] = useState(1.2); // Ratio vs Median
    const [version, setVersion] = useState(100); // 100=Latest, 80=Minor behind

    // Replicate Logic
    const calcScore = () => {
        if (storage <= 0) return 0;
        let sUptime = 0;
        if (uptime >= 30) sUptime = 100;
        else if (uptime >= 7) sUptime = 70 + (uptime - 7) * (30/23);
        else if (uptime >= 1) sUptime = 40 + (uptime - 1) * (30/6);
        else sUptime = uptime * 40;

        let sCap = 0;
        if (storage >= 1000) sCap = 100;
        else if (storage >= 100) sCap = 70 + (storage - 100) * (30/900);
        else if (storage >= 10) sCap = 40 + (storage - 10) * (30/90);
        
        let sRep = 50;
        if (reputation >= 2) sRep = 100;
        else if (reputation >= 1) sRep = 75 + (reputation - 1) * 25;
        else if (reputation >= 0.5) sRep = 50 + (reputation - 0.5) * 50;
        
        return Math.round((sUptime * 0.3) + (version * 0.2) + (sRep * 0.25) + (sCap * 0.25));
    };

    const score = calcScore();
    const getGrade = (s: number) => s >= 90 ? 'FLAWLESS' : s >= 75 ? 'ROBUST' : s >= 50 ? 'FAIR' : 'CRITICAL';
    const getColor = (s: number) => s >= 90 ? 'text-green-400' : s >= 75 ? 'text-blue-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Activity size={120} /></div>
            
            <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Simulated Score</div>
                    <div className={`text-5xl font-bold ${getColor(score)} transition-colors duration-500`}>{score}</div>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full bg-black border border-zinc-800 ${getColor(score)}`}>
                    {getGrade(score)}
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Uptime Slider */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400">Uptime</span>
                        <span className="text-white font-mono">{uptime} Days</span>
                    </div>
                    <input type="range" min="0" max="40" value={uptime} onChange={(e) => setUptime(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                </div>

                {/* Storage Slider */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400">Storage</span>
                        <span className="text-white font-mono">{storage} GB</span>
                    </div>
                    <input type="range" min="0" max="1200" step="50" value={storage} onChange={(e) => setStorage(Number(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                </div>

                {/* Reputation Slider */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400">Reputation (vs Median)</span>
                        <span className="text-white font-mono">{reputation.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="2.5" step="0.1" value={reputation} onChange={(e) => setReputation(Number(e.target.value))} className="w-full accent-yellow-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                </div>
                
                {/* Version Toggle */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-400">Software Version</span>
                    <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                        <button onClick={() => setVersion(100)} className={`px-3 py-1 text-[10px] rounded ${version === 100 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Latest</button>
                        <button onClick={() => setVersion(30)} className={`px-3 py-1 text-[10px] rounded ${version === 30 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Outdated</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle() {
    return <div className="text-green-500 mt-0.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div></div>
}
