import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, Cpu, Map as MapIcon, BarChart3, Lock, 
  HeartPulse, Search, Info, Check, X, MousePointer2, Layers, 
  LayoutDashboard, GitMerge, Share2, Anchor, Terminal,
  AlertTriangle, Eye, Monitor, Command, AlertOctagon,
  ArrowRight, Minimize2, Maximize2, Camera, Swords, ArrowLeftRight,
  ClipboardCopy, Link as LinkIcon, RefreshCw, ChevronLeft, ChevronRight, RotateCcw,
  List
} from 'lucide-react';

export default function DocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'flight' | 'brain' | 'telemetry' | 'spatial' | 'economics'>('flight');
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (router.isReady && router.query.training) {
        setTimeout(() => scrollTo('flight'), 500);
    }
  }, [router.isReady, router.query]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveTab(id as any);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/docs?training=true`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <Head>
        <title>Operator Manual - Xandeum Pulse</title>
      </Head>

      {/* --- STICKY HELP BAR --- */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-blue-600/90 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest text-center py-2 cursor-pointer hover:bg-blue-500 transition-colors backdrop-blur-md" onClick={() => scrollTo('flight')}>
          Are you confused? 🚨 Click here to initialize Operator Training in Flight School
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-8 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-blue-500/50 transition-all duration-300">
              <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400" />
            </div>
            <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Dashboard</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
             {['flight', 'brain', 'telemetry', 'spatial', 'economics'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => scrollTo(tab)}
                  className={`text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ${activeTab === tab ? 'text-blue-400' : 'text-zinc-500'}`}
                >
                  {tab === 'flight' ? 'Flight School' : tab}
                </button>
             ))}
          </div>

          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-full border border-zinc-800 hover:border-blue-500/30 transition-all group"
          >
            <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white font-bold transition-colors">
                {copiedShare ? "LINK COPIED!" : "DEPLOY MANUAL"}
            </span>
            <Share2 size={12} className="text-zinc-500 group-hover:text-blue-400" />
          </button>
        </div>
      </nav>

      <main className="pt-40 pb-32">
        
        {/* ==========================================
            HERO: THE NERVOUS SYSTEM
           ========================================== */}
        <header className="max-w-5xl mx-auto px-6 mb-32 md:mb-40 text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <Cpu size={12} className="text-blue-500" /> v2.0 Architecture
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                The Nervous System of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Xandeum Pulse</span>
            </h1>
            <p className="text-lg md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-light animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Pulse is not just a UI wrapper. It is a serverless analytics engine visualizing the physical, logical, and economic topology of the network in real-time.
            </p>
        </header>

        {/* ==========================================
            SECTION 1: FLIGHT SCHOOL (PULSE OS)
           ========================================== */}
        <section id="flight" className="relative py-24 md:py-32 border-t border-zinc-900 bg-[#050505]">
             <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Terminal size={12} /> Interactive Simulator
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white">Flight School</h2>
                    <p className="text-zinc-500 mt-4 max-w-lg mx-auto">
                        Don't just read the manual. Fly the ship. <br/>
                        Use the <span className="text-blue-400 font-bold animate-pulse">Glowing Cues</span> to navigate the interconnected loop.
                    </p>
                </div>

                {/* THE SIMULATOR APP - FORCE HEIGHT TO PREVENT COLLAPSE */}
                <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-[#09090b] relative max-w-5xl mx-auto h-[600px] flex flex-col select-none">
                    <PulseOS_Simulator />
                </div>
             </div>
        </section>

        {/* ==========================================
            SECTION 2: THE BRAIN (Logic & Math)
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
                                <div className="text-[10px] text-zinc-500 font-mono">50 * log2(ratio + 1) + UtilBonus</div>
                             </div>
                        </div>

                        <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                            <h4 className="text-yellow-500 font-bold text-xs uppercase flex items-center gap-2 mb-2">
                                <AlertTriangle size={14}/> Crashproof Re-Weighting
                            </h4>
                            <p className="text-[10px] text-zinc-400 leading-relaxed">
                                If the Credits API goes offline, the Brain detects the <code className="text-zinc-300">null</code> payload and automatically shifts the scoring weights. Toggle the <strong>API Status</strong> switch in the simulator to see this live.
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
            SECTION 3: TELEMETRY (Dashboard UX)
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
            </div>
        </section>

        {/* ==========================================
            SECTION 4: SPATIAL INTELLIGENCE (Map)
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
                                    <span className="text-xs text-zinc-500 leading-relaxed">Calculates "Avg Density" to differentiate between Community Clusters vs Datacenters.</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 h-fit"><Zap size={20}/></div>
                                <div>
                                    <strong className="text-white text-sm block mb-1">Credits Mode</strong>
                                    <span className="text-xs text-zinc-500 leading-relaxed">Displays total reputation earnings and "Economic Share" of the region.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 5: ECONOMICS (Leaderboard)
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
// INTERACTIVE PULSE OS SIMULATOR (NEURAL GRAPH)
// ==========================================

function PulseOS_Simulator() {
    type ViewState = 'DASH' | 'MODAL' | 'COMPARE' | 'PROOF' | 'MAP' | 'CREDITS';
    const [view, setView] = useState<ViewState>('DASH');
    const [url, setUrl] = useState('https://xandeum-pulse.vercel.app');
    const [ready, setReady] = useState(false); 
    const [ghost, setGhost] = useState(false); 
    
    // Internal States for Views
    const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
    const [mapMode, setMapMode] = useState<'STORAGE' | 'HEALTH' | 'CREDITS'>('STORAGE');

    // --- BOOT SEQUENCE ---
    useEffect(() => {
        setTimeout(() => setReady(true), 300);
    }, []);

    // --- REBOOT ---
    const reboot = () => {
        setView('DASH');
        setReady(false);
        setUrl('https://xandeum-pulse.vercel.app');
        setMapDrawerOpen(false);
        setTimeout(() => setReady(true), 500);
    }

    // --- NAVIGATION HANDLERS ---
    const nav = (target: ViewState, delay = 0) => {
        setReady(false);
        setGhost(true); // Start transition animation
        setMapDrawerOpen(false); // Reset internal states
        
        // URL Bar Updates
        let newUrl = 'https://xandeum-pulse.vercel.app';
        if (target === 'MODAL') newUrl += '/?open=8x...2A';
        if (target === 'MAP') newUrl += '/map?focus=8x...2A';
        if (target === 'CREDITS') newUrl += '/leaderboard?highlight=8x...2A';
        setUrl(newUrl);

        setTimeout(() => {
            setView(target);
            setGhost(false);
            // Wait for render, then make buttons glow
            setTimeout(() => setReady(true), 600); 
        }, delay || 500);
    };

    // --- "GHOST" SIMULATION LOGIC ---
    const triggerGhostAction = (target: ViewState) => {
        setReady(false);
        setGhost(true); 
        setTimeout(() => {
            setView(target);
            setGhost(false);
            setTimeout(() => setReady(true), 600); 
        }, 1500);
    };

    return (
        <div className="w-full h-full flex flex-col font-sans text-sm select-none">
            {/* --- BROWSER BAR --- */}
            <div className="h-10 bg-[#18181b] border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-1 bg-black rounded border border-zinc-800 h-6 flex items-center px-3 text-[10px] font-mono text-zinc-400 justify-between group">
                    <div className="flex items-center">
                        <Lock size={8} className="mr-2 text-green-500"/>
                        {url}
                    </div>
                    {/* Fixed: wrapped in button to support title prop validly */}
                    <button onClick={reboot} title="Reboot System" className="cursor-pointer hover:text-white bg-transparent border-none p-0 flex items-center">
                        <RotateCcw size={10} />
                    </button>
                </div>
            </div>

            {/* --- VIEWPORT --- */}
            <div className="flex-1 relative bg-black overflow-hidden h-full">
                
                {/* === DASHBOARD VIEW === */}
                {view === 'DASH' && (
                    <div className="absolute inset-0 p-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                            <div className="text-xl font-bold text-white flex gap-2"><Activity className="text-blue-500"/> DASHBOARD</div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-zinc-800 rounded"></div>
                                <div className="h-8 w-24 bg-zinc-800 rounded"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[1,2,3].map(i => (
                                <div key={i} 
                                    onClick={() => i === 1 && nav('MODAL')}
                                    className={`h-48 border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 
                                    ${i===1 ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] bg-zinc-900 cursor-pointer hover:scale-105' : 'border-zinc-800 bg-zinc-900/30 opacity-50'}`}
                                >
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-zinc-500">NODE-0{i}</span>
                                        {i===1 && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                    </div>
                                    <div className="text-3xl font-bold text-white">{i===1 ? '98%' : '45%'}</div>
                                    {i===1 && (
                                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-bounce">
                                            CLICK HERE
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === MODAL HUB (The Central Node) === */}
                {view === 'MODAL' && (
                    <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-full h-full max-w-4xl bg-[#09090b] border border-zinc-700 rounded-2xl flex flex-col relative shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <span className="font-bold text-white flex items-center gap-2"><Globe size={16}/> 8x...2A</span>
                                {/* BACK BUTTON: Returns to DASH */}
                                <button 
                                    onClick={() => nav('DASH')}
                                    className={`p-2 rounded-lg transition-all duration-500 ${ready ? 'bg-red-500/10 text-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'text-zinc-600'}`}
                                >
                                    <X size={18}/>
                                </button>
                            </div>

                            <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">
                                {/* Left Col: Interactive Cards */}
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => nav('CREDITS')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${ready ? 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20' : 'border-zinc-800'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold text-yellow-500">CREDITS CARD</span>
                                            <ArrowRight size={14} className="text-yellow-500"/>
                                        </div>
                                        <div className="text-xl font-bold text-white">5.2M Cr</div>
                                        {ready && <div className="text-[9px] text-yellow-400 mt-1 animate-pulse">Click to view Leaderboard</div>}
                                    </div>
                                    <div 
                                        onClick={() => nav('MAP')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${ready ? 'border-green-500/50 bg-green-900/10 hover:bg-green-900/20' : 'border-zinc-800'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold text-green-500">HEALTH CARD</span>
                                            <ArrowRight size={14} className="text-green-500"/>
                                        </div>
                                        <div className="text-xl font-bold text-white">98/100</div>
                                    </div>
                                </div>

                                {/* Right Col: Actions */}
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => triggerGhostAction('COMPARE')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${ready ? 'border-red-500/30 text-red-400 hover:bg-red-900/10' : 'border-zinc-800 text-zinc-500'}`}
                                    >
                                        <Swords size={16}/> Compare Nodes
                                    </button>
                                    <button 
                                        onClick={() => triggerGhostAction('PROOF')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${ready ? 'border-blue-500/30 text-blue-400 hover:bg-blue-900/10' : 'border-zinc-800 text-zinc-500'}`}
                                    >
                                        <Camera size={16}/> Proof of Pulse
                                    </button>
                                    <button 
                                        onClick={() => nav('MAP')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${ready ? 'border-purple-500/30 text-purple-400 hover:bg-purple-900/10' : 'border-zinc-800 text-zinc-500'}`}
                                    >
                                        <MapIcon size={16}/> View on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === COMPARE VIEW (GHOST SIM) === */}
                {view === 'COMPARE' && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col animate-in slide-in-from-right duration-500">
                        {ghost ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                                <RefreshCw className="animate-spin mb-4 text-blue-500" size={32}/>
                                <div className="text-xs font-mono">SORTING CANDIDATES...</div>
                                <div className="mt-4 space-y-2 w-64">
                                    <div className="h-8 bg-zinc-800 rounded animate-pulse w-full"></div>
                                    <div className="h-8 bg-zinc-800 rounded animate-pulse w-3/4"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-8 mb-8">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-full mb-2 mx-auto"></div>
                                        <div className="font-bold text-white">Node A</div>
                                        <div className="text-green-500 font-mono">98%</div>
                                    </div>
                                    <div className="text-2xl font-bold text-zinc-600">VS</div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-full mb-2 mx-auto border-2 border-red-500"></div>
                                        <div className="font-bold text-white">Node B</div>
                                        <div className="text-red-500 font-mono">45%</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => nav('MODAL')}
                                    className={`px-8 py-3 rounded-full font-bold transition-all ${ready ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}
                                >
                                    BACK TO DIAGNOSTICS
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* === PROOF VIEW (GHOST SIM) === */}
                {view === 'PROOF' && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col animate-in slide-in-from-right duration-500">
                         {ghost ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                                <div className="text-xs font-mono mb-2 text-green-500">GENERATING SNAPSHOT...</div>
                                <div className="w-48 h-64 bg-zinc-900 border border-zinc-700 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>
                                </div>
                            </div>
                         ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-48 h-64 bg-zinc-900 border border-green-500/50 rounded-xl mb-8 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <div className="text-center">
                                        <Camera className="mx-auto text-green-500 mb-2"/>
                                        <div className="text-[10px] text-green-400 font-bold">VERIFIED PULSE</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => nav('MODAL')}
                                    className={`px-8 py-3 rounded-full font-bold transition-all ${ready ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}
                                >
                                    CLOSE SNAPSHOT
                                </button>
                            </div>
                         )}
                    </div>
                )}

                {/* === FULL MAP VIEW (INTERACTIVE STATE MACHINE) === */}
                {view === 'MAP' && (
                    <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col animate-in zoom-in-90 duration-700">
                        <div className="flex-1 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black"></div>
                            
                            {/* Map Toggles */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {['STORAGE', 'HEALTH', 'CREDITS'].map(m => (
                                    <button key={m} onClick={() => setMapMode(m as any)} className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${mapMode === m ? 'bg-white text-black' : 'bg-black text-zinc-500 border-zinc-700'}`}>{m}</button>
                                ))}
                            </div>

                            {/* Simulated Pins */}
                            <div 
                                onClick={() => setMapDrawerOpen(true)}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 ${mapDrawerOpen ? 'scale-125' : 'scale-100 hover:scale-110'}`}
                            >
                                <div className={`w-4 h-4 rounded-full animate-ping absolute ${mapMode === 'CREDITS' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                <div className={`w-4 h-4 rounded-full relative shadow-[0_0_20px_rgba(59,130,246,1)] ${mapMode === 'CREDITS' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                {ready && !mapDrawerOpen && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] text-white bg-black px-2 rounded animate-bounce whitespace-nowrap">CLICK ME</div>}
                            </div>
                        </div>

                        {/* DRAWER */}
                        <div className={`bg-zinc-900 border-t border-zinc-800 transition-all duration-300 flex flex-col ${mapDrawerOpen ? 'h-48' : 'h-0 overflow-hidden'}`}>
                            <div className="p-4 flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-white flex items-center gap-2"><Globe size={12}/> LISBON, PT</div>
                                    <div className="text-[10px] text-zinc-500">12 Nodes Active</div>
                                </div>
                                <X size={14} className="cursor-pointer" onClick={() => setMapDrawerOpen(false)}/>
                            </div>
                            <div className="p-4 border-t border-zinc-800/50 bg-black/20 flex gap-2">
                                <button onClick={() => nav('CREDITS')} className="flex-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold py-2 rounded hover:bg-yellow-500/20">
                                    VIEW TOP EARNER
                                </button>
                                <button onClick={() => nav('MODAL')} className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold py-2 rounded hover:bg-blue-500/20">
                                    INSPECT HUB
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-black border-t border-zinc-900 flex justify-center shrink-0">
                             <button 
                                onClick={() => nav('MODAL')}
                                className={`px-6 py-2 rounded-full font-bold border transition-all ${ready ? 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}
                            >
                                BACK TO DIAGNOSTICS
                            </button>
                        </div>
                    </div>
                )}

                {/* === CREDITS VIEW === */}
                {view === 'CREDITS' && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col animate-in slide-in-from-right duration-500">
                         <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                             <span className="font-bold text-yellow-500">LEADERBOARD</span>
                         </div>
                         <div className="flex-1 p-8">
                             <div className="w-full h-12 bg-zinc-800/50 rounded mb-2"></div>
                             <div className="w-full h-12 bg-zinc-800/50 rounded mb-2"></div>
                             {/* Active Row */}
                             <div className="w-full h-24 bg-yellow-900/20 border-l-4 border-yellow-500 p-4 flex items-center justify-between rounded mb-2 animate-pulse">
                                 <div>
                                     <div className="text-yellow-500 font-bold">#3 8x...2A</div>
                                     <div className="text-xs text-zinc-500">5,200,000 Credits</div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => nav('MAP')}
                                        className={`px-4 py-2 rounded text-xs font-bold transition-all ${ready ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-bounce' : 'bg-zinc-800 text-zinc-500'}`}
                                     >
                                         VIEW ON MAP
                                     </button>
                                     <button 
                                        onClick={() => nav('MODAL')}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold"
                                     >
                                         DIAGNOSTICS
                                     </button>
                                 </div>
                             </div>
                             <div className="w-full h-12 bg-zinc-800/50 rounded mb-2"></div>
                         </div>
                    </div>
                )}

            </div>
        </div>
    )
}


// --- 2. VITALITY SIMULATOR (UPDATED) ---
function VitalitySimulator() {
    const [uptimeDays, setUptimeDays] = useState(14);
    const [storageTB, setStorageTB] = useState(2);
    const [credits, setCredits] = useState(5000);
    const [versionGap, setVersionGap] = useState(0);
    const [apiOnline, setApiOnline] = useState(true);
    
    // Scores
    const uScore = Math.min(100, Math.round(100 / (1 + Math.exp(-0.2 * (uptimeDays - 7)))));
    const sScore = Math.min(100, Math.round(50 * Math.log2((storageTB/1) + 1)));
    const cScore = apiOnline ? Math.min(100, Math.round((credits / 10000) * 100)) : 0;
    const vScore = versionGap === 0 ? 100 : versionGap === 1 ? 90 : versionGap === 2 ? 70 : 30;
    
    // Weighted Total Logic
    let totalScore = 0;
    if (apiOnline) {
        // Standard: 35% Uptime, 30% Storage, 20% Credits, 15% Version
        totalScore = Math.round((uScore * 0.35) + (sScore * 0.30) + (cScore * 0.20) + (vScore * 0.15));
    } else {
        // Failover: 45% Uptime, 35% Storage, 0% Credits, 20% Version
        totalScore = Math.round((uScore * 0.45) + (sScore * 0.35) + (vScore * 0.20));
    }
    
    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500 ${apiOnline ? 'from-blue-500 via-purple-500 to-green-500' : 'from-red-500 via-orange-500 to-yellow-500'}`}></div>
            
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Vitality Engine
                </span>
                
                {/* API TOGGLE */}
                <button 
                    onClick={() => setApiOnline(!apiOnline)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 transition-all ${apiOnline ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}
                >
                    {apiOnline ? <Check size={10}/> : <AlertOctagon size={10}/>}
                    {apiOnline ? "API ONLINE" : "API DOWN (FAILOVER)"}
                </button>
            </div>

            <div className="text-center mb-8">
                <div className={`text-6xl font-extrabold transition-colors duration-500 ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {totalScore}
                </div>
                <div className="text-xs text-zinc-500 mt-2 font-mono">LIVE SCORE CALCULATION</div>
            </div>
            
            <div className="space-y-6">
                {/* Uptime */}
                <div>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-blue-400">Uptime ({apiOnline ? '35%' : '45%'})</span>
                        <span className="text-white">{uScore} pts</span>
                    </div>
                    <input type="range" min="0" max="30" value={uptimeDays} onChange={(e) => setUptimeDays(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>

                {/* Storage */}
                <div>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-purple-400">Storage ({apiOnline ? '30%' : '35%'})</span>
                        <span className="text-white">{sScore} pts</span>
                    </div>
                    <input type="range" min="0" max="10" step="0.1" value={storageTB} onChange={(e) => setStorageTB(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </div>

                {/* Credits (Disabled if API Down) */}
                <div className={`transition-opacity duration-500 ${apiOnline ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-yellow-500">Credits ({apiOnline ? '20%' : '0%'})</span>
                        <span className="text-white">{apiOnline ? cScore : 'N/A'} pts</span>
                    </div>
                    <input disabled={!apiOnline} type="range" min="0" max="20000" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:cursor-not-allowed"/>
                    {!apiOnline && <div className="text-[9px] text-red-500 mt-1 font-bold">⚠ SIGNAL LOST: EXCLUDED FROM CALCULATION</div>}
                </div>

                {/* Version */}
                <div>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-green-500">Version ({apiOnline ? '15%' : '20%'})</span>
                        <span className="text-white">{vScore} pts</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {['Latest', '-1', '-2', 'Old'].map((label, i) => (
                            <button key={i} onClick={() => setVersionGap(i)} className={`py-1 rounded text-[9px] font-bold border ${versionGap === i ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{label}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- 3. FAILOVER VISUALIZER (Unchanged Logic, refreshed UI) ---
function FailoverVisualizer() {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setStep(prev => (prev + 1) % 5), 1500);
        return () => clearInterval(interval);
    }, []);
    const logs = ["System Idle...", "Connecting Primary [173.x]...", "TIMEOUT (>4000ms)!", "RACE MODE: 3 Backups...", "Winner: Node 2 (80ms)"];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between relative h-24 select-none">
                <div className="z-10 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 shadow-xl"><Monitor size={20} className="text-white" /></div>
                    <span className="text-[9px] font-bold uppercase text-zinc-500">Client</span>
                </div>
                <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-zinc-800 -translate-y-1/2"></div>
                {step === 1 && <div className="absolute top-1/2 left-16 w-3 h-3 bg-blue-500 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>}
                {step === 2 && <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full -translate-y-1/2"></div>}
                {step === 3 && <><div className="absolute top-1/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><div className="absolute top-1/2 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><div className="absolute top-2/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></>}
                
                <div className="z-10 flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded border text-[10px] font-bold transition-all ${step === 2 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>Primary</div>
                    <div className={`px-3 py-1 rounded border text-[10px] font-bold transition-all ${step >= 4 ? 'bg-green-500/10 border-green-500 text-green-500 scale-105' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>Backups</div>
                </div>
            </div>
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

// --- 4. X-RAY SIMULATOR (UPDATED with CREDITS) ---
function XRaySimulator() {
    const [mode, setMode] = useState<'STORAGE' | 'HEALTH' | 'CREDITS'>('STORAGE');

    return (
        <div className="relative">
            <div className="flex gap-2 mb-8 justify-center">
                {['STORAGE', 'HEALTH', 'CREDITS'].map(m => (
                    <button key={m} onClick={() => setMode(m as any)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${mode === m ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>{m}</button>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 transition-all max-w-sm mx-auto shadow-2xl relative overflow-hidden h-64 flex flex-col justify-center">
                <div className={`absolute top-0 right-0 p-24 blur-[80px] rounded-full opacity-20 transition-colors duration-500 ${mode === 'STORAGE' ? 'bg-indigo-500' : mode === 'HEALTH' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="font-bold text-white text-lg">Lisbon, PT</div>
                    <div className={`text-sm font-mono font-bold ${mode === 'STORAGE' ? 'text-indigo-400' : mode === 'HEALTH' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                        {mode === 'STORAGE' ? '1.2 PB' : mode === 'HEALTH' ? '98% Score' : '5.2M Cr'}
                    </div>
                </div>
                
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 relative z-10">
                    <div className="flex justify-center mb-4">
                        <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded border tracking-widest ${mode === 'STORAGE' ? 'text-indigo-400 border-indigo-500/30' : mode === 'HEALTH' ? 'text-emerald-400 border-emerald-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                            {mode === 'STORAGE' ? 'MASSIVE TIER' : mode === 'HEALTH' ? 'FLAWLESS TIER' : 'ELITE EARNER'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Avg Density' : mode === 'HEALTH' ? 'Status' : 'Economy'}
                            </div>
                            <div className="text-white font-mono text-xs font-bold">
                                {mode === 'STORAGE' ? '120 TB / Node' : mode === 'HEALTH' ? '5 Up • 0 Down' : '2.1% Share'}
                            </div>
                        </div>
                        <div className="border-l border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                                {mode === 'STORAGE' ? 'Global Share' : mode === 'HEALTH' ? 'King Node' : 'Top Earner'}
                            </div>
                            <div className="text-white font-mono text-xs font-bold truncate px-2">
                                {mode === 'STORAGE' ? '12.5%' : '8x...2A'}
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
