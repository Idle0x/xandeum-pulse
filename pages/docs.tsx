import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, Cpu, Map as MapIcon, BarChart3, Lock, 
  HeartPulse, Search, Info, Check, X, MousePointer2, Layers
} from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'map' | 'core'>('core');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30">
      <Head>
        <title>Xandeum Pulse - The Architecture</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-blue-500/50 transition-colors">
              <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Back to App</span>
          </Link>
          <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
             {['core', 'monitor', 'map'].map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                   activeTab === tab 
                   ? 'bg-zinc-800 text-white shadow-sm' 
                   : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 {tab === 'core' ? 'The Brain' : tab === 'monitor' ? 'Dashboard' : 'Geospatial'}
               </button>
             ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        
        {/* Dynamic Content Switching */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'core' && <CoreArchitectureSection />}
            {activeTab === 'monitor' && <DashboardWalkthrough />}
            {activeTab === 'map' && <MapIntelligenceSection />}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-12 text-center mt-20">
        <div className="flex items-center justify-center gap-2 text-zinc-500 mb-4">
            <Cpu size={16} />
            <span className="font-mono text-sm">Engineered by @33xp_</span>
        </div>
        <p className="text-zinc-600 text-xs">
          Built for the Xandeum Hackathon 2025 • <Link href="/" className="hover:text-blue-400 transition-colors">Launch App</Link>
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// SECTION 1: CORE ARCHITECTURE (THE BRAIN)
// ==========================================
function CoreArchitectureSection() {
    return (
        <div className="space-y-24">
            {/* HERO */}
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Backend Architecture
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                    Resilient by Design.
                </h1>
                <p className="text-lg text-zinc-400">
                    Pulse isn't just a UI. It's a fault-tolerant analytics engine that aggregates, caches, and scores network data in milliseconds.
                </p>
            </div>

            {/* INTERACTIVE COMPONENT: VITALITY CALCULATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <HeartPulse className="text-pink-500" /> The Vitality Algorithm
                    </h2>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                        We don't just check if a node is "online." We calculate a <strong>0-100 Vitality Score</strong> based on 4 weighted factors. Play with the simulator to see how the score reacts.
                    </p>
                    <ul className="space-y-3 text-xs text-zinc-500 mb-8">
                        <li className="flex gap-2"><div className="w-1 h-full bg-blue-500 rounded"></div> <strong>30% Stability:</strong> Penalizes frequent restarts (&lt;30 days).</li>
                        <li className="flex gap-2"><div className="w-1 h-full bg-purple-500 rounded"></div> <strong>25% Capacity:</strong> Logarithmic scale favoring >1TB.</li>
                        <li className="flex gap-2"><div className="w-1 h-full bg-yellow-500 rounded"></div> <strong>25% Reputation:</strong> Comparing credits vs Network Median.</li>
                        <li className="flex gap-2"><div className="w-1 h-full bg-green-500 rounded"></div> <strong>20% Consensus:</strong> Must match majority version.</li>
                    </ul>
                </div>
                <VitalitySimulator />
            </div>

            {/* INTERACTIVE COMPONENT: HERO & RACE ANIMATION */}
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Server size={300} /></div>
                
                <div className="max-w-2xl relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-4">"Hero & Race" Failover System</h2>
                    <p className="text-zinc-400 mb-8 text-sm">
                        Traditional apps crash when the API goes down. Pulse uses a two-stage fetch strategy. 
                        First, we try the <strong>Hero</strong> (Primary Seed). If it hangs for >4s, we trigger a <strong>Race</strong> 
                        between 3 random backup nodes.
                    </p>
                </div>

                <FailoverVisualizer />
            </div>
        </div>
    )
}

// ==========================================
// SECTION 2: DASHBOARD WALKTHROUGH
// ==========================================
function DashboardWalkthrough() {
    return (
        <div className="space-y-24">
             <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    User Interface
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                    The Medical Dashboard.
                </h1>
                <p className="text-lg text-zinc-400">
                    Designed like a sci-fi telemetry screen. Every pixel serves a purpose—monitoring the heartbeat of the Xandeum network.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={LayoutDashboard} 
                    title="The Command Deck" 
                    desc="Search, Filter, and Refresh controls are locked to the header. Accessible instantly, no matter how deep you scroll."
                />
                <FeatureCard 
                    icon={HeartPulse} 
                    title="Live EKG" 
                    desc="The 'Network Vitals' card features a CSS-animated heartbeat that visualizes real-time stability metrics."
                />
                <FeatureCard 
                    icon={BarChart3} 
                    title="Comparative Diagnostics" 
                    desc="Nodes aren't just given a score; they are compared against the Global Average with visual deltas (e.g., +15% above avg)."
                />
            </div>

            {/* Visual breakdown of the Modal */}
            <div className="bg-black border border-zinc-800 rounded-3xl p-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-white">The Node Inspector</h2>
                    <p className="text-zinc-500 text-sm mt-2">A 2-column master view designed to prevent data clutter.</p>
                </div>
                
                {/* Mockup of the Modal Layout */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-80 pointer-events-none select-none">
                    <div className="space-y-4">
                        <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs uppercase font-bold">Identity & Status</div>
                        <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs uppercase font-bold">Storage Metrics</div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-48 bg-zinc-900/50 border border-blue-500/20 rounded-xl flex flex-col items-center justify-center p-4">
                            <div className="text-blue-400 text-xs font-bold mb-2 uppercase">Health Diagnostics</div>
                            <div className="w-full space-y-2">
                                <div className="h-1 bg-blue-500/20 rounded w-full"><div className="h-full w-3/4 bg-blue-500 rounded"></div></div>
                                <div className="h-1 bg-blue-500/20 rounded w-full"><div className="h-full w-1/2 bg-blue-500 rounded"></div></div>
                                <div className="h-1 bg-blue-500/20 rounded w-full"><div className="h-full w-full bg-blue-500 rounded"></div></div>
                            </div>
                        </div>
                        <div className="h-16 bg-zinc-900 rounded-xl border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xs uppercase font-bold">Reputation & Credits</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// SECTION 3: MAP INTELLIGENCE (X-RAY)
// ==========================================
function MapIntelligenceSection() {
    return (
        <div className="space-y-24">
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Geospatial Engine
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                    The X-Ray View.
                </h1>
                <p className="text-lg text-zinc-400">
                    Static maps are boring. Pulse uses "Context-Aware Expansion" to tell you the story behind the region.
                </p>
            </div>

            {/* INTERACTIVE: X-RAY SIMULATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="bg-black border border-zinc-800 rounded-3xl p-8 relative">
                    <XRaySimulator />
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Context-Aware Insights</h3>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                        Notice how the data inside the card changes based on what you are looking for?
                    </p>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 h-fit"><Database size={18}/></div>
                            <div>
                                <strong className="text-white text-sm block">Storage Mode</strong>
                                <span className="text-xs text-zinc-500">Shows "Avg Density" to detect Whale nodes vs Community clusters.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 h-fit"><Activity size={18}/></div>
                            <div>
                                <strong className="text-white text-sm block">Health Mode</strong>
                                <span className="text-xs text-zinc-500">Shows "Status Breakdown" (e.g., 3 Stable, 1 Critical) instead of averages.</span>
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
                <p className="text-zinc-400 text-sm mb-8 max-w-2xl">
                    Hardcoded thresholds (e.g. ">1TB") become obsolete as the network grows. Pulse calculates 
                    <strong>Live Percentiles</strong> to color-code the map. "Gold" always means "Top 10%", whether that's 10TB today or 100PB tomorrow.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['Massive (>90%)', 'Major (75-90%)', 'Standard (50-75%)', 'Entry (25-50%)', 'Micro (<25%)'].map((label, i) => (
                        <div key={i} className="bg-black p-3 rounded-lg border border-zinc-800 text-center">
                            <div className="w-full h-1.5 rounded-full mb-2" style={{ backgroundColor: ["#f59e0b", "#ec4899", "#a855f7", "#3b82f6", "#22d3ee"][i] }}></div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}


// ==========================================
// INTERACTIVE SUB-COMPONENTS
// ==========================================

function VitalitySimulator() {
    const [uptime, setUptime] = useState(80);
    const [storage, setStorage] = useState(60);
    
    // Simple mock calc based on the real algo logic
    const score = Math.round((uptime * 0.3) + (storage * 0.25) + (50 * 0.25) + (100 * 0.20)); 
    
    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Simulator</span>
                <div className={`text-3xl font-bold ${score > 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {score}<span className="text-sm text-zinc-600">/100</span>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-blue-400">Uptime Stability</span>
                        <span className="text-white">{uptime} pts</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" value={uptime} 
                        onChange={(e) => setUptime(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-purple-400">Storage Capacity</span>
                        <span className="text-white">{storage} pts</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" value={storage} 
                        onChange={(e) => setStorage(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 pt-2 border-t border-zinc-800">
                    <span>*Assumes Avg Reputation & Latest Version</span>
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
        <div className="mt-8 flex items-center justify-between relative h-24">
            {/* User */}
            <div className="z-10 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                    <Globe size={20} className="text-white" />
                </div>
                <span className="text-[10px] text-zinc-500">Client</span>
            </div>

            {/* Packets */}
            <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-zinc-800 -translate-y-1/2"></div>
            
            {/* Hero Packet */}
            {step === 1 && (
                <div className="absolute top-1/2 left-12 w-4 h-4 bg-red-500 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>
            )}

            {/* Race Packets */}
            {step === 2 && (
                <>
                    <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </>
            )}

            {/* Nodes */}
            <div className="z-10 flex flex-col gap-2">
                <div className={`p-2 rounded border text-xs font-bold transition-colors ${step === 1 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                    Primary Node (Timeout)
                </div>
                <div className={`p-2 rounded border text-xs font-bold transition-colors ${step >= 2 ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                    Backup Pool (Race)
                </div>
            </div>
        </div>
    )
}

function XRaySimulator() {
    const [mode, setMode] = useState<'STORAGE' | 'HEALTH'>('STORAGE');

    return (
        <div>
            <div className="flex gap-2 mb-6">
                <button onClick={() => setMode('STORAGE')} className={`px-3 py-1 rounded text-xs font-bold ${mode === 'STORAGE' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>STORAGE</button>
                <button onClick={() => setMode('HEALTH')} className={`px-3 py-1 rounded text-xs font-bold ${mode === 'HEALTH' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>HEALTH</button>
            </div>

            {/* The Simulated Card */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-white">Lisbon, Portugal</div>
                    <div className={`text-xs font-mono font-bold ${mode === 'STORAGE' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {mode === 'STORAGE' ? '1.2 PB' : '98% Health'}
                    </div>
                </div>
                
                <div className="bg-black/50 p-3 rounded-lg border border-white/5 animate-in fade-in duration-300">
                    <div className="flex justify-center mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${mode === 'STORAGE' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                            {mode === 'STORAGE' ? 'MASSIVE TIER' : 'FLAWLESS TIER'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase mb-1">
                                {mode === 'STORAGE' ? 'Avg Density' : 'Status'}
                            </div>
                            <div className="text-white font-mono text-xs">
                                {mode === 'STORAGE' ? '120 TB / Node' : '5 Stable • 0 Critical'}
                            </div>
                        </div>
                        <div className="border-l border-zinc-800">
                            <div className="text-[9px] text-zinc-500 uppercase mb-1">
                                {mode === 'STORAGE' ? 'Global Share' : 'Node Count'}
                            </div>
                            <div className="text-white font-mono text-xs">
                                {mode === 'STORAGE' ? '12.5%' : '5 Nodes'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-6 bg-zinc-900/20 border border-zinc-800 rounded-2xl hover:bg-zinc-900/40 transition-colors group">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 mb-4 group-hover:text-white group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                <Icon size={20} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    )
}
