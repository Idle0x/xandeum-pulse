import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, Cpu, Map as MapIcon, BarChart3, Lock, 
  HeartPulse, Search, Info, Check, X, MousePointer2, Layers, 
  LayoutDashboard, GitMerge, Share2, Anchor, Terminal,
  AlertTriangle, Eye, Monitor, Command
} from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'intro' | 'brain' | 'telemetry' | 'spatial' | 'economics' | 'manual'>('intro');

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(id as any);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Head>
        <title>System Architecture - Xandeum Pulse</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-blue-500/50 transition-all duration-300">
              <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400" />
            </div>
            <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Dashboard</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
             {['brain', 'telemetry', 'spatial', 'economics', 'manual'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => scrollTo(tab)}
                  className={`text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}
                >
                  {tab}
                </button>
             ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 font-bold">LIVE DOCS v2.0</span>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-32">
        
        {/* ==========================================
            HERO SECTION
           ========================================== */}
        <header id="intro" className="max-w-5xl mx-auto px-6 mb-32 md:mb-40 text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <Cpu size={12} className="text-blue-500" /> System Architecture & Logic
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                The Nervous System of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Xandeum Pulse</span>
            </h1>
            <p className="text-lg md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-light animate-in fade-in slide-in-from-bottom-8 duration-1000">
                A serverless, real-time analytics engine visualizing the physical and logical topology of the Gossip Protocol. Featuring crashproof telemetry and dynamic scoring algorithms.
            </p>
        </header>

        {/* ==========================================
            SECTION 1: THE BRAIN (Logic & Math)
           ========================================== */}
        <section id="brain" className="relative py-24 md:py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-indigo-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)]"><Server size={28} className="text-white" /></div>
                        The Neural Core
                    </h2>
                    <p className="text-lg text-indigo-200/70 max-w-2xl">
                        Located in <code className="text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded text-sm">lib/xandeum-brain.ts</code>, the backend handles deduplication, failover, and the proprietary Vitality Score algorithm.
                    </p>
                </div>

                {/* 1.1 FAILOVER LOGIC */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">"Hero & Race" Failover Strategy</h3>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                            Pulse doesn't rely on a single endpoint. It employs a high-frequency trading strategy to ensure data availability.
                        </p>
                        <div className="space-y-6">
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <strong className="text-white text-sm block mb-1">Phase 1: The Hero (4s Timeout)</strong>
                                <p className="text-xs text-zinc-500">We attempt a connection to the Primary Seed. If it hangs for &gt;4s, we abort immediately.</p>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <strong className="text-white text-sm block mb-1">Phase 2: The Race (Promise.any)</strong>
                                <p className="text-xs text-zinc-500">We shuffle the backup node pool and trigger 3 simultaneous requests. The first node to respond wins; the others are discarded.</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/50 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm">
                        <FailoverVisualizer />
                    </div>
                </div>

                {/* 1.2 VITALITY ALGORITHM */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-5">
                        <h3 className="text-2xl font-bold text-white mb-4">The Vitality Algorithm</h3>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                            We use non-linear math to calculate a fair 0-100 score. A linear scale fails because the difference between 99% and 99.9% uptime is massive.
                        </p>
                        
                        <div className="space-y-4 mb-8">
                             <div className="p-3 bg-zinc-900 border-l-2 border-blue-500">
                                <div className="text-xs font-bold text-blue-400 uppercase mb-1">Sigmoid Uptime</div>
                                <div className="text-[10px] text-zinc-500 font-mono">100 / (1 + e^(-0.2 * (days - 7)))</div>
                             </div>
                             <div className="p-3 bg-zinc-900 border-l-2 border-purple-500">
                                <div className="text-xs font-bold text-purple-400 uppercase mb-1">Logarithmic Storage</div>
                                <div className="text-[10px] text-zinc-500 font-mono">50 * log2(ratio + 1) + UtilizationBonus</div>
                             </div>
                        </div>

                        <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                            <h4 className="text-yellow-500 font-bold text-xs uppercase flex items-center gap-2 mb-2">
                                <AlertTriangle size={14}/> Crashproof Re-Weighting
                            </h4>
                            <p className="text-[10px] text-zinc-400 leading-relaxed">
                                If the Credits API goes offline, the Brain detects the <code className="text-zinc-300">null</code> payload and automatically shifts the scoring weights to exclude Reputation, ensuring the dashboard never shows a "0" score due to API failure.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <VitalitySimulator />
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 2: TELEMETRY (Dashboard UX)
           ========================================== */}
        <section id="telemetry" className="relative py-24 md:py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-emerald-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20 text-right">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 flex items-center justify-end gap-4">
                        Telemetry & UX
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]"><Activity size={28} className="text-white" /></div>
                    </h2>
                    <p className="text-lg text-emerald-200/70 max-w-2xl ml-auto">
                        The interface is built for "Information Density without Clutter." It uses cyclical rotations and glassmorphism to present complex data.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                    <FeatureCard icon={Monitor} title="Zen Mode" desc="Toggles a minimalist, high-contrast OLED view (`setZenMode`). Strips gradients and animations for pure data focus." color="emerald" />
                    <FeatureCard icon={HeartPulse} title="Cyclic Rotation" desc="To save screen space, node cards automatically rotate metrics (Storage -> Uptime -> Health) every 5 seconds, synced with the user's sort preference." color="emerald" />
                    <FeatureCard icon={Share2} title="Proof of Pulse" desc="A modal that generates a verifiable PNG snapshot (`toPng`) of a node's health, ready for sharing on X (Twitter)." color="emerald" />
                </div>

                {/* VISUAL BREAKDOWN OF MODAL */}
                <div className="bg-black border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="text-center mb-12 relative z-10">
                        <h3 className="text-2xl font-bold text-white">The Deep-Link Inspector</h3>
                        <p className="text-zinc-500 text-sm mt-2 max-w-xl mx-auto">
                            The modal system supports URL parameters (e.g. <code className="bg-zinc-800 px-1 rounded text-emerald-400">?open=pubkey</code>). This allows users to share direct links to specific diagnostics.
                        </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 opacity-90 select-none relative z-10">
                         {/* Card 1: Overview */}
                         <div className="border border-zinc-700 bg-zinc-900/80 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Overview Card</div>
                                <Activity size={16} className="text-emerald-500"/>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 w-1/2 bg-zinc-700 rounded-full"></div>
                                <div className="h-2 w-3/4 bg-zinc-800 rounded-full"></div>
                            </div>
                            <div className="mt-8 flex gap-2">
                                <div className="h-8 w-8 rounded bg-zinc-800"></div>
                                <div className="h-8 w-24 rounded bg-zinc-800"></div>
                            </div>
                         </div>

                         {/* Card 2: Diagnostics */}
                         <div className="border border-zinc-700 bg-zinc-900/80 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Health Radial</div>
                                <div className="text-emerald-400 font-mono font-bold">98/100</div>
                            </div>
                            <div className="flex justify-center my-4">
                                <div className="w-24 h-24 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-center text-[10px] text-zinc-500">BREAKDOWN: UPTIME • STORAGE • VERSION</div>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 3: SPATIAL INTELLIGENCE (Map)
           ========================================== */}
        <section id="spatial" className="relative py-24 md:py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-purple-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.3)]"><Globe size={28} className="text-white" /></div>
                        Spatial Intelligence
                    </h2>
                    <p className="text-lg text-purple-200/70 max-w-2xl">
                        Static thresholds are obsolete. Pulse uses "Live Percentiles" to color-code the map, ensuring meaningful visualization regardless of network growth.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div className="bg-black border border-zinc-800 rounded-3xl p-8 relative shadow-2xl">
                        <XRaySimulator />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-6">Context-Aware X-Ray</h3>
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                            The map isn't just points on a grid. Clicking a region activates the Split-View Drawer. 
                            The data schema changes based on the selected mode:
                        </p>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 h-fit"><Database size={20}/></div>
                                <div>
                                    <strong className="text-white text-sm block mb-1">Storage Mode</strong>
                                    <span className="text-xs text-zinc-500 leading-relaxed">Calculates "Avg Density" to differentiate between Community Clusters (many small nodes) vs Datacenters (few massive nodes).</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 h-fit"><Activity size={20}/></div>
                                <div>
                                    <strong className="text-white text-sm block mb-1">Health Mode</strong>
                                    <span className="text-xs text-zinc-500 leading-relaxed">Aggregates regional stability. Identifies outages by country/city immediately.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* DYNAMIC TIERS EXPLAINER */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 lg:p-12">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="text-yellow-500"/> Dynamic Percentile Tiering
                    </h3>
                    <p className="text-zinc-400 text-sm mb-8 max-w-3xl">
                         Instead of hardcoding "Gold = 1TB", we calculate live quantiles.
                         <br/>
                         <code className="text-purple-400">getQuantile(0.90)</code> ensures only the top 10% of nodes ever appear Gold, whether the network avg is 1TB or 1PB.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {['Massive (>90%)', 'Major (75-90%)', 'Standard (50-75%)', 'Entry (25-50%)', 'Micro (<25%)'].map((label, i) => (
                            <div key={i} className="bg-black p-4 rounded-xl border border-zinc-800 text-center">
                                <div className="w-full h-2 rounded-full mb-3" style={{ backgroundColor: ["#f59e0b", "#ec4899", "#a855f7", "#3b82f6", "#22d3ee"][i] }}></div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 4: ECONOMICS (Leaderboard)
           ========================================== */}
        <section id="economics" className="relative py-24 md:py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-yellow-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20 text-right">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 flex items-center justify-end gap-4">
                        The Economic Ledger
                        <div className="p-3 bg-yellow-600 rounded-2xl shadow-[0_0_30px_rgba(202,138,4,0.3)]"><Trophy size={28} className="text-white" /></div>
                    </h2>
                    <p className="text-lg text-yellow-200/70 max-w-2xl ml-auto">
                        Reputation is trust. The Leaderboard combines historical trend tracking with the powerful STOINC Simulator for earnings forecasting.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Simulator Logic */}
                    <div className="bg-black border border-zinc-800 rounded-3xl p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="text-yellow-500" />
                            <h3 className="text-xl font-bold text-white">STOINC Simulator</h3>
                        </div>
                        <div className="prose prose-invert prose-sm text-zinc-400">
                            <p>
                                Forecasting earnings involves complex multipliers. The Simulator allows users to input hardware specs to estimate base credits.
                            </p>
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl font-mono text-xs mt-4 mb-4">
                                <div className="text-zinc-500">// Simulator Logic</div>
                                <div className="text-blue-400">const</div> base = Nodes * Storage * Stake;<br/>
                                <div className="text-blue-400">const</div> multiplier = Boosts.<div className="text-yellow-400 inline">reduce</div>((a,b) =&gt; a * b, 1);<br/>
                                <div className="text-purple-400">return</div> base * multiplier;
                            </div>
                            <p>
                                It supports <strong>Geometric Stacking</strong> for Era and NFT boosts, meaning multipliers compound rather than add.
                            </p>
                        </div>
                    </div>

                    {/* Identity Bridge */}
                    <div className="bg-black border border-zinc-800 rounded-3xl p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-green-400" />
                            <h3 className="text-xl font-bold text-white">The Identity Bridge</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                            The Credits Oracle only knows <code className="text-zinc-300">PubKey</code>. The Gossip Protocol only knows <code className="text-zinc-300">IP Address</code>.
                        </p>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                            Pulse acts as the bridge by performing a <strong>Dual-Fetch Resolution</strong> in <code className="text-green-400">api/stats.ts</code>. It maps the anonymous financial ledger to the physical network topology, allowing you to see exactly <em>where</em> the top earners are located.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 p-2 rounded border border-zinc-800">
                            <span className="text-yellow-500">Credits API</span>
                            <span className="text-zinc-600">--&gt;</span>
                            <span className="text-white font-bold">PULSE</span>
                            <span className="text-zinc-600">&lt;--</span>
                            <span className="text-blue-500">RPC Nodes</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 5: MISSION CONTROL (Walkthrough)
           ========================================== */}
        <section id="manual" className="relative py-24 md:py-32 border-t border-zinc-900 bg-[#050505]">
             <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Terminal size={12} className="text-zinc-300" /> Operator's Manual
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white">Mission Control</h2>
                    <p className="text-zinc-500 mt-4">Common scenarios for network operators and stakers.</p>
                </div>

                <MissionControlTabs />
             </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-16 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-500 mb-6">
            <Cpu size={16} />
            <span className="font-mono text-sm">
                Built by <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">riot'</a> for the Xandeum ecosystem
            </span>
        </div>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
          Pulse v2.0 • 2025
        </p>
      </footer>
    </div>
  );
}


// ==========================================
// INTERACTIVE SUB-COMPONENTS (UPDATED LOGIC)
// ==========================================

function VitalitySimulator() {
    // UPDATED: Using logic from xandeum-brain.ts
    // Sigmoid Uptime: 7 days midpoint
    // Log Storage: Median based
    
    const [uptimeDays, setUptimeDays] = useState(14); // Default 14 days
    const [storageTB, setStorageTB] = useState(2); // Default 2TB
    const [versionGap, setVersionGap] = useState(0); // 0 = Latest
    
    // 1. Uptime Score (Sigmoid: midpoint 7, steepness 0.2)
    const calcUptimeScore = (days: number) => {
        return Math.min(100, Math.round(100 / (1 + Math.exp(-0.2 * (days - 7)))));
    };
    
    // 2. Storage Score (Log2: ratio against Median of 1TB)
    const calcStorageScore = (tb: number) => {
        const ratio = tb / 1; // Assuming median is 1TB
        return Math.min(100, Math.round(50 * Math.log2(ratio + 1)));
    };

    // 3. Version Score (Rank Penalty)
    const calcVersionScore = (gap: number) => {
        if(gap === 0) return 100;
        if(gap === 1) return 90;
        if(gap === 2) return 70;
        return 30;
    };

    const uScore = calcUptimeScore(uptimeDays);
    const sScore = calcStorageScore(storageTB);
    const vScore = calcVersionScore(versionGap);
    
    // Weighted Total (Standard Mode: 35/30/20/15) - approximating Rep as 100 for sim
    const totalScore = Math.round((uScore * 0.35) + (sScore * 0.30) + (100 * 0.20) + (vScore * 0.15));
    
    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>
            
            <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Vitality Engine
                </span>
                <div className={`text-5xl font-extrabold transition-colors duration-500 ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {totalScore}
                </div>
            </div>
            
            <div className="space-y-8">
                {/* Uptime (Sigmoid) */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-blue-400">Uptime: {uptimeDays} Days</span>
                        <span className="text-white">{uScore} pts</span>
                    </div>
                    <input type="range" min="0" max="30" value={uptimeDays} onChange={(e) => setUptimeDays(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                    <div className="text-[9px] text-zinc-600 mt-1 font-mono">Sigmoid Curve: Rapid gain 0-&gt;14 days.</div>
                </div>

                {/* Storage (Log) */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-purple-400">Storage: {storageTB} TB</span>
                        <span className="text-white">{sScore} pts</span>
                    </div>
                    <input type="range" min="0" max="10" step="0.1" value={storageTB} onChange={(e) => setStorageTB(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                    <div className="text-[9px] text-zinc-600 mt-1 font-mono">Log Curve: Diminishing returns > 4TB.</div>
                </div>

                {/* Version */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-green-500">Consensus Gap</span>
                        <span className="text-white">{vScore} pts</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {['Latest', '-1 Ver', '-2 Ver', 'Old'].map((label, i) => (
                            <button 
                                key={i}
                                onClick={() => setVersionGap(i)}
                                className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${versionGap === i ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function FailoverVisualizer() {
    const [step, setStep] = useState(0);

    // UPDATED: Matches "Hero & Race" logic from code
    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev + 1) % 5); 
            // 0: Idle
            // 1: Connect Primary (Hero)
            // 2: Hero Timeout (Red)
            // 3: Trigger Race (3 Backups)
            // 4: Winner Found (Green)
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const logs = [
        "System Idle. Waiting for fetch...",
        "Attempting connection to Primary Seed [173.x.x.x]...",
        "Connection Timeout (>4000ms). Aborting Hero.",
        "Triggering RACE mode. Shuffling backup pool...",
        "Promise.any() resolved. Winner: Backup Node 2."
    ];

    return (
        <div>
            <div className="mt-4 mb-8 flex items-center justify-between relative h-32 select-none">
                {/* Client */}
                <div className="z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 shadow-xl">
                        <Monitor size={20} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Pulse</span>
                </div>

                {/* Connection Line */}
                <div className="absolute top-1/2 left-14 right-14 h-0.5 bg-zinc-800 -translate-y-1/2"></div>
                
                {/* Hero Packet (Red = Fail) */}
                {step === 1 && <div className="absolute top-1/2 left-20 w-3 h-3 bg-blue-500 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>}
                {step === 2 && <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full -translate-y-1/2"></div>}

                {/* Race Packets */}
                {step === 3 && (
                    <>
                        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    </>
                )}

                {/* Server Nodes */}
                <div className="z-10 flex flex-col gap-3">
                    <div className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${step === 2 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                        <Server size={14} /> Primary (Timeout)
                    </div>
                    <div className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${step >= 4 ? 'bg-green-500/10 border-green-500 text-green-500 scale-105' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                        <Activity size={14} /> Backup Race (Win)
                    </div>
                </div>
            </div>

            {/* Console Log */}
            <div className="bg-black/80 rounded-lg p-3 font-mono text-[9px] text-zinc-400 border-t-2 border-zinc-800 h-24 flex flex-col justify-end">
                {logs.map((log, i) => (
                    <div key={i} className={`transition-opacity duration-300 ${i === step ? 'text-green-400 opacity-100' : i < step ? 'opacity-30' : 'opacity-0'}`}>
                        <span className="text-zinc-600 mr-2">{`[00:0${i}]`}</span>{log}
                    </div>
                ))}
            </div>
        </div>
    )
}

function XRaySimulator() {
    const [mode, setMode] = useState<'STORAGE' | 'HEALTH'>('STORAGE');

    return (
        <div className="relative">
            <div className="flex gap-2 mb-8 justify-center">
                <button onClick={() => setMode('STORAGE')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === 'STORAGE' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-zinc-900 text-zinc-500'}`}>STORAGE MODE</button>
                <button onClick={() => setMode('HEALTH')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === 'HEALTH' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-900 text-zinc-500'}`}>HEALTH MODE</button>
            </div>

            {/* The Simulated Card */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 transition-all max-w-sm mx-auto shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-16 blur-[60px] rounded-full opacity-20 transition-colors duration-500 ${mode === 'STORAGE' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="font-bold text-white text-lg">Lisbon, Portugal</div>
                    <div className={`text-sm font-mono font-bold ${mode === 'STORAGE' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {mode === 'STORAGE' ? '1.2 PB' : '98% Health'}
                    </div>
                </div>
                
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 relative z-10">
                    <div className="flex justify-center mb-4">
                        <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded border tracking-widest ${mode === 'STORAGE' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                            {mode === 'STORAGE' ? 'MASSIVE TIER (>90%)' : 'FLAWLESS TIER (>90%)'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Avg Density' : 'Stability'}
                            </div>
                            <div className="text-white font-mono text-xs font-bold">
                                {mode === 'STORAGE' ? '120 TB / Node' : '5 Up • 0 Down'}
                            </div>
                        </div>
                        <div className="border-l border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Global Share' : 'King Node'}
                            </div>
                            <div className="text-white font-mono text-xs font-bold truncate px-2">
                                {mode === 'STORAGE' ? '12.5% of Net' : '8x...2A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, desc, color = "blue" }: { icon: any, title: string, desc: string, color?: string }) {
    return (
        <div className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl hover:bg-zinc-900/40 transition-all group hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all bg-zinc-800 text-zinc-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function MissionControlTabs() {
    const [scenario, setScenario] = useState(0);

    const scenarios = [
        {
            title: "Track a Whale",
            desc: "How to identify high-earning nodes.",
            steps: [
                "Open the Leaderboard (/leaderboard).",
                "Look for Gold Trophies (Rank 1).",
                "Click the row to expand details.",
                "Hit 'View on Map' to see physical location."
            ]
        },
        {
            title: "Verify Network Health",
            desc: "How to check if the network is stable.",
            steps: [
                "Check 'Network Vitals' on Dashboard.",
                "Look for 'Consensus Version' match.",
                "Open Map in 'Health Mode'.",
                "Red markers indicate regional outages."
            ]
        },
        {
            title: "Share Proof",
            desc: "How to prove your node is active.",
            steps: [
                "Search your PubKey on Dashboard.",
                "Open the Node Inspector Modal.",
                "Click 'Proof of Pulse' (Camera Icon).",
                "Download the generated PNG."
            ]
        }
    ];

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row overflow-hidden min-h-[300px]">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 bg-black/20">
                {scenarios.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => setScenario(i)}
                        className={`w-full text-left p-6 border-b border-zinc-800/50 transition-colors ${scenario === i ? 'bg-zinc-800/50 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className="font-bold text-sm mb-1">{s.title}</div>
                        <div className="text-[10px] opacity-70">{s.desc}</div>
                    </button>
                ))}
            </div>
            <div className="w-full md:w-2/3 p-8 flex flex-col justify-center relative">
                <div className="absolute top-4 right-4 text-zinc-700">
                    <Command size={64} strokeWidth={0.5} />
                </div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Terminal size={20} className="text-green-500"/> Protocol: {scenarios[scenario].title}
                </h3>
                <div className="space-y-4">
                    {scenarios[scenario].steps.map((step, k) => (
                        <div key={k} className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${k * 100}ms` }}>
                            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400 font-bold border border-zinc-700">
                                {k + 1}
                            </div>
                            <span className="text-sm text-zinc-300">{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
