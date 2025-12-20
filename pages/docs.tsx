import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, Cpu, Map as MapIcon, BarChart3, Lock, 
  HeartPulse, Search, Info, Check, X, MousePointer2, Layers, 
  LayoutDashboard, GitMerge, Share2, Anchor
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Head>
        <title>System Architecture - Xandeum Pulse</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-blue-500/50 transition-all duration-300">
              <ArrowLeft size={18} className="text-zinc-400 group-hover:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-bold">SYSTEM ONLINE</span>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-32">
        
        {/* ==========================================
            HERO SECTION
           ========================================== */}
        <header className="max-w-5xl mx-auto px-6 mb-40 text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-8">
                <Cpu size={14} className="text-blue-500" /> Technical Whitepaper v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                The Nervous System of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Xandeum Pulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-light">
                Pulse is not just a UI wrapper. It is a serverless analytics engine designed to visualize the physical, logical, and economic topology of the network in real-time.
            </p>
        </header>

        {/* ==========================================
            SECTION 1: THE BRAIN (Indigo Theme)
           ========================================== */}
        <section className="relative py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-indigo-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl"><Server size={32} className="text-white" /></div>
                        The Neural Core
                    </h2>
                    <p className="text-xl text-indigo-200/70 max-w-2xl">
                        The backend logic handles fault tolerance, deduplication, and the proprietary Vitality Score algorithm.
                    </p>
                </div>

                {/* 1.1 FAILOVER VISUALIZER */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">"Hero & Race" Failover</h3>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                            Traditional dashboards crash when the API goes down. Pulse uses a high-frequency trading strategy. 
                            First, we try the <strong>Hero</strong> (Primary Seed). If it hangs for >4s, we trigger a <strong>Race</strong> 
                            between 3 random backup nodes.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 h-fit"><Shield size={18}/></div>
                                <div><strong className="text-white text-sm block">Resilience</strong><span className="text-xs text-zinc-500">99.9% Uptime even if seeds fail.</span></div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 h-fit"><Zap size={18}/></div>
                                <div><strong className="text-white text-sm block">Speed</strong><span className="text-xs text-zinc-500">Promise.any() ensures the fastest node wins.</span></div>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-zinc-900/50 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
                        <FailoverVisualizer />
                    </div>
                </div>

                {/* 1.2 VITALITY SIMULATOR */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-5">
                        <h3 className="text-2xl font-bold text-white mb-4">The Vitality Algorithm</h3>
                        <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                            We don't just check if a node is "online." We calculate a <strong>0-100 Vitality Score</strong> based on 4 weighted factors.
                        </p>
                        <div className="space-y-6">
                            <AlgorithmBar label="Uptime Stability" percent="30%" width="w-[30%]" color="bg-blue-500" desc="> 30 Days = 100pts. Penalizes frequent restarts." />
                            <AlgorithmBar label="Storage Capacity" percent="25%" width="w-[25%]" color="bg-purple-500" desc="Logarithmic scale. > 1TB = 100pts." />
                            <AlgorithmBar label="Reputation Credits" percent="25%" width="w-[25%]" color="bg-yellow-500" desc="Relative to Network Median. Dynamic difficulty." />
                            <AlgorithmBar label="Consensus Version" percent="20%" width="w-[20%]" color="bg-green-500" desc="Strict penalties for outdated versions." />
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <VitalitySimulator />
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 2: TELEMETRY (Emerald Theme)
           ========================================== */}
        <section className="relative py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-emerald-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20 text-right">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 flex items-center justify-end gap-4">
                        Telemetry & Diagnostics
                        <div className="p-3 bg-emerald-600 rounded-2xl"><Activity size={32} className="text-white" /></div>
                    </h2>
                    <p className="text-xl text-emerald-200/70 max-w-2xl ml-auto">
                        A medical-grade interface for monitoring network health. Designed for clarity, speed, and depth.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                    <FeatureCard icon={LayoutDashboard} title="The Command Deck" desc="Search, Filter, and Refresh controls are locked to the sticky header. Accessible instantly, no matter how deep you scroll." color="emerald" />
                    <FeatureCard icon={HeartPulse} title="Live EKG" desc="The 'Network Vitals' card features a CSS-animated heartbeat that visualizes real-time stability metrics." color="emerald" />
                    <FeatureCard icon={BarChart3} title="Comparative Diagnostics" desc="Nodes aren't just given a score; they are compared against the Global Average with visual deltas (e.g., +15% above avg)." color="emerald" />
                </div>

                {/* VISUAL BREAKDOWN OF MODAL */}
                <div className="bg-black border border-zinc-800 rounded-3xl p-12 relative">
                    <div className="absolute top-6 left-6 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="text-center mb-16">
                        <h3 className="text-2xl font-bold text-white">The Node Inspector</h3>
                        <p className="text-zinc-500 text-sm mt-2">A 2-column master view designed to prevent data clutter.</p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-90 select-none">
                        <div className="space-y-6">
                            <div className="h-40 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Identity & Status</div>
                                <div className="text-zinc-600 text-[10px]">Public Keys • RPC Endpoints • Version Tags</div>
                            </div>
                            <div className="h-40 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Storage Metrics</div>
                                <div className="text-zinc-600 text-[10px]">Real-time Capacity • Utilization Graphs</div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="h-56 bg-zinc-900/50 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64} className="text-emerald-500"/></div>
                                <div className="text-emerald-400 text-xs font-bold mb-4 uppercase tracking-widest">Health Diagnostics</div>
                                <div className="w-full space-y-3">
                                    <div className="h-1.5 bg-emerald-500/20 rounded-full w-full"><div className="h-full w-3/4 bg-emerald-500 rounded-full"></div></div>
                                    <div className="h-1.5 bg-emerald-500/20 rounded-full w-full"><div className="h-full w-1/2 bg-emerald-500 rounded-full"></div></div>
                                    <div className="h-1.5 bg-emerald-500/20 rounded-full w-full"><div className="h-full w-full bg-emerald-500 rounded-full"></div></div>
                                </div>
                            </div>
                            <div className="h-24 bg-zinc-900/50 rounded-2xl border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xs uppercase font-bold tracking-widest">Reputation & Credits</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 3: SPATIAL INTELLIGENCE (Purple Theme)
           ========================================== */}
        <section className="relative py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-purple-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-600 rounded-2xl"><Globe size={32} className="text-white" /></div>
                        Spatial Intelligence
                    </h2>
                    <p className="text-xl text-purple-200/70 max-w-2xl">
                        Static maps are boring. Pulse uses "Context-Aware Expansion" and "Dynamic Tiering" to tell the story behind the region.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div className="bg-black border border-zinc-800 rounded-3xl p-8 relative shadow-2xl">
                        <XRaySimulator />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-6">The X-Ray View</h3>
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                            Clicking a region doesn't just zoom in. It activates an "X-Ray" card that changes its data schema based on what you are looking for. Play with the toggle to see the data adapt.
                        </p>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 h-fit"><Database size={20}/></div>
                                <div>
                                    <strong className="text-white text-sm block mb-1">Storage Mode</strong>
                                    <span className="text-xs text-zinc-500 leading-relaxed">Calculates "Avg Density" to differentiate between a region with 100 small nodes (Community) vs 1 massive node (Whale).</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 h-fit"><Activity size={20}/></div>
                                <div>
                                    <strong className="text-white text-sm block mb-1">Health Mode</strong>
                                    <span className="text-xs text-zinc-500 leading-relaxed">Switches to "Status Breakdown". Instead of an average, it tells you exactly how many nodes are Stable vs Critical.</span>
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
                        Hardcoded thresholds (e.g. &gt;1TB) become obsolete as the network grows. Pulse calculates 
                        <strong>Live Percentiles</strong> to color-code the map. "Gold" always means "Top 10%", whether that's 10TB today or 100PB tomorrow.
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
            SECTION 4: THE ECONOMIC LEDGER (Gold Theme)
           ========================================== */}
        <section className="relative py-32 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-yellow-950/10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-20 text-right">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 flex items-center justify-end gap-4">
                        The Economic Ledger
                        <div className="p-3 bg-yellow-600 rounded-2xl"><Trophy size={32} className="text-white" /></div>
                    </h2>
                    <p className="text-xl text-yellow-200/70 max-w-2xl ml-auto">
                        Reputation is the currency of trust. The Leaderboard tracks, ranks, and bridges the identity gap.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Identity Bridge */}
                    <div className="bg-black border border-zinc-800 rounded-3xl p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-green-400" />
                            <h3 className="text-xl font-bold text-white">The Identity Bridge</h3>
                        </div>
                        <div className="prose prose-invert prose-sm text-zinc-400">
                            <p>
                                Xandeum's Credits Oracle lists anonymous Public Keys. The Gossip Protocol lists IP Addresses. They don't talk to each other.
                            </p>
                            <p className="mt-4">
                                Pulse acts as the bridge. We fetch both datasets and perform a <strong>Dual-Fetch Map</strong> to link `PubKey` -&gt; `IP`.
                            </p>
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl font-mono text-xs mt-6">
                                <div className="text-zinc-500">// leaderboard.tsx</div>
                                <div className="text-blue-400">const</div> <div className="text-white inline">addressMap</div> = <div className="text-purple-400 inline">new Map()</div>;
                                <br/>
                                <div className="text-zinc-500 pl-4">// Result: You can find YOUR node</div>
                            </div>
                        </div>
                    </div>

                    {/* Hyper-Context */}
                    <div className="bg-black border border-zinc-800 rounded-3xl p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Share2 className="text-blue-400" />
                            <h3 className="text-xl font-bold text-white">Hyper-Connected Context</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                            Every page talks to every other page. If you see a node on the Leaderboard, you can click it to inspect its health, or jump to its location on the Map.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded"><Trophy size={16}/></div>
                                <ArrowLeft size={16} className="text-zinc-600" />
                                <div className="p-2 bg-zinc-800 text-white rounded font-bold text-xs px-3">Node Modal</div>
                                <ArrowLeft size={16} className="text-zinc-600 rotate-180" />
                                <div className="p-2 bg-purple-500/10 text-purple-500 rounded"><Globe size={16}/></div>
                            </div>
                            <div className="text-center text-[10px] text-zinc-500 uppercase tracking-widest">
                                Universal Deep Linking
                            </div>
                        </div>
                    </div>
                </div>
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
// INTERACTIVE SUB-COMPONENTS
// ==========================================

function VitalitySimulator() {
    const [uptime, setUptime] = useState(80);
    const [storage, setStorage] = useState(60);
    const [credits, setCredits] = useState(50);
    const [version, setVersion] = useState("1.0.0");
    
    // Determine Version Score
    const getVersionScore = (v: string) => {
        if (v === "1.0.0") return 100;
        if (v === "0.8.0") return 80;
        if (v === "0.7.3") return 60;
        return 30; // 0.7.1
    };

    const verScore = getVersionScore(version);
    
    // Score Calculation
    const score = Math.round((uptime * 0.3) + (storage * 0.25) + (credits * 0.25) + (verScore * 0.20)); 
    
    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500"></div>
            
            <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Simulate Your Health Score
                </span>
                <div className={`text-5xl font-extrabold ${score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {score}
                </div>
            </div>
            
            <div className="space-y-8">
                {/* Uptime */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-blue-400">Uptime (Stability)</span>
                        <span className="text-white">{uptime} pts</span>
                    </div>
                    <input type="range" min="0" max="100" value={uptime} onChange={(e) => setUptime(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>

                {/* Storage */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-purple-400">Storage (Capacity)</span>
                        <span className="text-white">{storage} pts</span>
                    </div>
                    <input type="range" min="0" max="100" value={storage} onChange={(e) => setStorage(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </div>

                {/* Credits */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-yellow-500">Reputation (Credits)</span>
                        <span className="text-white">{credits} pts</span>
                    </div>
                    <input type="range" min="0" max="100" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
                </div>

                {/* Version Selector */}
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-green-500">Software Version</span>
                        <span className="text-white">{verScore} pts</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {['1.0.0', '0.8.0', '0.7.3', '0.7.1'].map((v) => (
                            <button 
                                key={v}
                                onClick={() => setVersion(v)}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${version === v ? 'bg-green-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {v}
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

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev + 1) % 4); // 0: Idle, 1: Hero Fail, 2: Race Start, 3: Success
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 flex items-center justify-between relative h-32">
            {/* Client */}
            <div className="z-10 flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 shadow-xl">
                    <Globe size={24} className="text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Client</span>
            </div>

            {/* Connection Line */}
            <div className="absolute top-1/2 left-16 right-16 h-0.5 bg-zinc-800 -translate-y-1/2"></div>
            
            {/* Hero Packet (Red = Fail) */}
            {step === 1 && (
                <div className="absolute top-1/2 left-16 w-3 h-3 bg-red-500 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>
            )}

            {/* Race Packets (Green = Fast) */}
            {step === 2 && (
                <>
                    <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                </>
            )}

            {/* Server Nodes */}
            <div className="z-10 flex flex-col gap-3">
                <div className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${step === 1 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                    <Server size={14} /> Primary (Timeout)
                </div>
                <div className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${step >= 2 ? 'bg-green-500/10 border-green-500 text-green-500 scale-105' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                    <Activity size={14} /> Backup Pool (Race)
                </div>
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
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 transition-all max-w-sm mx-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="font-bold text-white text-lg">Lisbon, Portugal</div>
                    <div className={`text-sm font-mono font-bold ${mode === 'STORAGE' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {mode === 'STORAGE' ? '1.2 PB' : '98% Health'}
                    </div>
                </div>
                
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 animate-in fade-in duration-300">
                    <div className="flex justify-center mb-4">
                        <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded border tracking-widest ${mode === 'STORAGE' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                            {mode === 'STORAGE' ? 'MASSIVE TIER' : 'FLAWLESS TIER'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Avg Density' : 'Status'}
                            </div>
                            <div className="text-white font-mono text-sm">
                                {mode === 'STORAGE' ? '120 TB / Node' : '5 Stable • 0 Critical'}
                            </div>
                        </div>
                        <div className="border-l border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Global Share' : 'Node Count'}
                            </div>
                            <div className="text-white font-mono text-sm">
                                {mode === 'STORAGE' ? '12.5%' : '5 Nodes'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AlgorithmBar({ label, percent, width, color, desc }: { label: string, percent: string, width: string, color: string, desc: string }) {
    return (
        <div>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-zinc-300">{label}</span>
                <span className="text-xs font-mono text-white opacity-60">{percent} Weight</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full mb-2 overflow-hidden">
                <div className={`h-full rounded-full ${color} ${width}`}></div>
            </div>
            <p className="text-[10px] text-zinc-500">{desc}</p>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, desc, color = "blue" }: { icon: any, title: string, desc: string, color?: string }) {
    const colorClasses = {
        emerald: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
        blue: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20",
    }[color] || "text-blue-400 bg-blue-500/10";

    return (
        <div className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl hover:bg-zinc-900/40 transition-all group hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all ${colorClasses}`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
            <p className="text-sm
