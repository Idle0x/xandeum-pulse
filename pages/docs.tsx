import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Activity, Shield, Zap, Globe, Server, Database, 
  Trophy, Cpu, Map as MapIcon, Lock, 
  HeartPulse, Info, Check, X, MousePointer2, 
  Share2, Terminal, AlertTriangle, Monitor, AlertOctagon,
  ArrowRight, Camera, Swords, 
  ClipboardCopy, RefreshCw, RotateCcw, MapPin, Wallet, Star,
  Eye, Search, Sliders, Radio, Grip, FileJson, Link as LinkIcon, Hash, Hand,
  WifiOff, Github, Code, ExternalLink, Minimize2
} from 'lucide-react';

export default function DocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'flight' | 'manual' | 'brain' | 'telemetry' | 'spatial' | 'economics' | 'engineering'>('flight');
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

          <div className="hidden md:flex items-center gap-6 overflow-x-auto scrollbar-hide">
             {['flight', 'manual', 'brain', 'telemetry', 'spatial', 'economics', 'engineering'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => scrollTo(tab)}
                  className={`text-xs font-bold uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap ${activeTab === tab ? 'text-blue-400' : 'text-zinc-500'}`}
                >
                  {tab === 'flight' ? 'Flight School' : tab === 'manual' ? 'Field Manual' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
             ))}
          </div>

          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-full border border-zinc-800 hover:border-blue-500/30 transition-all group shrink-0"
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
                <Cpu size={12} className="text-blue-500" /> v2.2 Architecture
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
                <div className="text-left mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Terminal size={12} /> Interactive Walkthrough
                    </div>
                    <h2 className="text-xl md:text-5xl font-extrabold text-white tracking-tighter whitespace-nowrap">
                        How it Works: Flight School 🛫
                    </h2>
                    <p className="text-zinc-500 mt-4 max-w-lg text-sm md:text-base leading-relaxed">
                        Don't just read the manual. Experience the platform. <br/>
                        Follow the <span className="text-blue-400 font-bold animate-pulse">Glowing Cues</span> to navigate the infinite ecosystem.
                    </p>
                </div>

                <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-[#09090b] relative max-w-5xl mx-auto h-[850px] md:h-[900px] flex flex-col">
                    <PulseOS_Simulator />
                </div>

                <div className="flex justify-center mt-6">
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> RESTART WALKTHROUGH
                    </button>
                </div>
             </div>
        </section>

        {/* ==========================================
            SECTION 1.5: THE FIELD MANUAL
           ========================================== */}
        <section id="manual" className="relative py-24 border-t border-zinc-900 bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-right mb-24 space-y-4 flex flex-col items-end">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-900/10 text-green-400 text-[10px] font-mono font-bold tracking-widest uppercase mb-4 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        System Access Granted
                    </div>
                    <h2 className="text-xl md:text-6xl font-black text-white tracking-tighter whitespace-nowrap">
                        How it Works: Field Manual 📑
                    </h2>
                    <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed font-light">
                        Pulse is not a passive display. It is an active intelligence tool. 
                        Master these <span className="text-white font-bold">8 Protocols</span> to achieve full network visibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="md:mt-0"><ManualCard type="CYCLIC" icon={Activity} title="Cyclic Metric Rotation" color="blue" tag="UX/UI" desc="Screen real estate is war. Node Cards automatically cycle their tertiary metric every 5 seconds. Storage → Capacity → Health." /></div>
                    <div className="md:mt-24"><ManualCard type="ZEN" icon={Eye} title="Zen Mode" color="zinc" tag="OLED" desc="Visual noise kills focus. Click the Monitor Icon to engage Zen Mode. This strips away all gradients, blurs, and animations." /></div>
                    <div className="md:mt-0"><ManualCard type="INSPECTOR" icon={Search} title="The Node Inspector" color="red" tag="DIAGNOSTICS" desc="Clicking any node opens the Inspector. This is the source of truth for raw Uptime, Storage, and Version data." /></div>
                    <div className="md:mt-24"><ManualCard type="PROOF" icon={Share2} title="Proof of Pulse" color="green" tag="SOCIAL" desc="Generates a cryptographic snapshot of a node's specific block-height and health status into a shareable PNG." /></div>
                    <div className="md:mt-0"><ManualCard type="TIERS" icon={MapIcon} title="Context-Aware Tiers" color="purple" tag="DYNAMIC" desc="The map rejects static thresholds. It uses Live Percentiles. A 'Gold' marker always represents the top 10% of nodes." /></div>
                    <div className="md:mt-24"><ManualCard type="GHOST" icon={AlertTriangle} title="Ghost Nodes" color="yellow" tag="PRIVACY" desc="Nodes running on VPNs or private subnets are tracked in the stats but hidden from the map to prevent errors." /></div>
                    
                    {/* NEW: CRASH PROTOCOLS CARD */}
                    <div className="md:mt-0">
                        <ManualCard 
                            type="CRASH"
                            icon={WifiOff} 
                            title="Crash Protocols" 
                            color="red"
                            tag="REDUNDANCY"
                            desc="Optimistic UI Architecture. If the upstream API fails, Pulse gracefully degrades. It switches to cached metrics or displays 'Offline' badges without breaking the rendering tree." 
                        />
                    </div>

                    <div className="md:mt-24"><ManualCard type="STOINC" icon={Zap} title="STOINC Simulator" color="yellow" tag="CALCULATOR" desc="Forecasts earnings based on hardware using Geometric Stacking—boosts compound rather than add linearly." /></div>
                    <div className="md:mt-0"><ManualCard type="IDENTITY" icon={Shield} title="The Identity Bridge" color="indigo" tag="BACKEND" desc="Links anonymous wallets to physical nodes via Dual-Fetch Resolution, revealing where top earners are located." /></div>
                    <div className="md:mt-24"><ManualCard type="VERSUS" icon={Swords} title="Head-to-Head Engine" color="red" tag="PVP" desc="The 'Compare' button highlights differentials in green (advantage) or red (deficit) for Uptime, Version, and Yield." /></div>
                </div>

                <div className="mt-32 max-w-2xl mx-auto text-center relative group cursor-pointer" onClick={() => scrollTo('brain')}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full group-hover:bg-purple-500/40 transition-all"></div>
                    <Radio size={48} className="text-purple-400 mx-auto mb-6 relative z-10 animate-pulse" />
                    <h4 className="text-2xl font-bold text-white mb-4 relative z-10">Subspace Echoes</h4>
                    <p className="text-zinc-400 text-sm relative z-10 leading-relaxed">
                        The dashboard listens to the "Gossip Protocol." Like a stethoscope, the pulsing orbs represent actual data packets traversing the network.
                    </p>
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
                            Pulse employs a high-frequency trading strategy to ensure data availability. It races multiple RPC nodes simultaneously.
                        </p>

                        <div className="mt-8">
                             <HoloCode 
                                filename="lib/xandeum-brain.ts"
                                githubLink="https://github.com/Idle0x/xandeum-pulse/blob/main/lib/xandeum-brain.ts"
                                code={`// Race multiple RPC endpoints for redundancy
const shuffled = RPC_NODES.slice(1).sort(() => 0.5 - Math.random()).slice(0, 3);

// Promise.any returns the first successful response (The Winner)
const winner = await Promise.any(shuffled.map(ip => 
    axios.post(\`http://\${ip}:6000/rpc\`, payload, { timeout: 4000 })
         .then(r => r.data?.result?.pods || [])
));`}
                             />
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
                        </div>

                        <HoloCode 
                                filename="lib/xandeum-brain.ts"
                                githubLink="https://github.com/Idle0x/xandeum-pulse/blob/main/lib/xandeum-brain.ts"
                                code={`const calculateVitalityScore = (uptimeDays, storage, medianStorage) => {
  // Sigmoid Curve: Penalizes downtime heavily
  let uptimeScore = 100 / (1 + Math.exp(-0.2 * (uptimeDays - 7)));

  // Logarithmic Scale: Diminishing returns on massive storage
  // Compares node storage vs network median
  const baseStorageScore = 50 * Math.log2((storage / medianStorage) + 1);
  const totalStorageScore = Math.min(100, baseStorageScore);

  // Weighted Final Score
  return (uptimeScore * 0.45) + (totalStorageScore * 0.35) + (versionScore * 0.20);
};`}
                        />
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
                <div className="mb-20 flex flex-col items-end text-right">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 flex items-center justify-end gap-4">
                        Telemetry & UX
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]"><Activity size={28} className="text-white" /></div>
                    </h2>
                    <p className="text-lg text-emerald-200/70 max-w-2xl ml-auto mb-6">
                        The interface is built for "Information Density without Clutter." It uses cyclical rotations and glassmorphism to present complex data.
                    </p>
                    <a href="https://github.com/Idle0x/xandeum-pulse/blob/main/pages/index.tsx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-xs font-bold text-zinc-400 hover:text-white transition-all group">
                        <Github size={14}/> View Dashboard Source <ExternalLink size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </a>
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
                    <p className="text-lg text-purple-200/70 max-w-2xl mb-6">
                        Static thresholds are obsolete. Pulse uses "Live Percentiles" to color-code the map, ensuring meaningful visualization regardless of network growth.
                    </p>
                    <a href="https://github.com/Idle0x/xandeum-pulse/blob/main/pages/map.tsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 hover:border-purple-500/50 text-xs font-bold text-zinc-400 hover:text-white transition-all group">
                        <Github size={14}/> View Map Source <ExternalLink size={12} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </a>
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
                            <h3 className="text-xl font-bold text-white">STOINC Simulator Logic</h3>
                        </div>
                        <p className="text-sm text-zinc-400 mb-6">
                            It supports <strong>Geometric Stacking</strong> for Era and NFT boosts, meaning multipliers compound rather than add.
                        </p>

                        <HoloCode 
                            filename="pages/leaderboard.tsx"
                            githubLink="https://github.com/Idle0x/xandeum-pulse/blob/main/pages/leaderboard.tsx"
                            code={`// Geometric Mean Boost Formula
let product = 1;

// Multipliers compound (multiply) rather than add
Object.entries(boostCounts).forEach(([name, count]) => {
    const val = BOOSTS[name] || 1;
    for(let i=0; i<count; i++) product *= val;
});

// Root based on node count to normalize fairness
const geoMean = Math.pow(product, 1 / Math.max(1, simNodes));
const boostedCredits = rawCredits * geoMean;`}
                        />
                    </div>

                    {/* Identity Bridge */}
                    <div className="bg-black border border-zinc-800 rounded-3xl p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-green-400" />
                            <h3 className="text-xl font-bold text-white">The Identity Bridge</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                            Pulse acts as the bridge by performing a <strong>Dual-Fetch Resolution</strong> in <code className="text-green-400">lib/xandeum-brain.ts</code>. It maps the anonymous financial ledger to the physical network topology.
                        </p>
                        <HoloCode 
                            filename="lib/xandeum-brain.ts"
                            githubLink="https://github.com/Idle0x/xandeum-pulse/blob/main/lib/xandeum-brain.ts"
                            code={`// Batch resolve IPs to physical locations (Lat/Lon)
const resolveLocations = async (ips) => {
  // Filter only new IPs to respect cache
  const missing = ips.filter(ip => !geoCache.has(ip));
  
  // Batch request to IP-API (100 at a time)
  const chunk = missing.slice(0, 100);
  await axios.post('http://ip-api.com/batch', chunk.map(ip => ({ 
      query: ip, fields: "lat,lon,country,city" 
  })));
}`}
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* ==========================================
            SECTION 6: ENGINEERING HEALTH (The "Flex")
           ========================================== */}
        <section id="engineering" className="relative py-24 border-t border-zinc-900 bg-[#050505]">
            <div className="max-w-4xl mx-auto px-6 text-center">
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/20 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-8 animate-pulse">
                    <Shield size={12} /> System Integrity Verified
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                    Engineering Standards
                </h2>
                <p className="text-zinc-400 mb-12 max-w-2xl mx-auto text-sm leading-relaxed">
                    This project is not just a UI. It operates on a <strong>CI/CD pipeline</strong> that rigorously tests financial accuracy, API failover protocols, and deep-link routing before every deployment.
                </p>

                {/* THE STATUS WIDGET */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* CARD 1: BUILD STATUS */}
                    <a 
                        href="https://github.com/Idle0x/xandeum-pulse/actions" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-green-500/50 transition-all cursor-pointer flex flex-col items-center gap-4 hover:bg-zinc-900/50"
                    >
                        <div className="absolute top-3 right-3">
                            <ExternalLink size={12} className="text-zinc-600 group-hover:text-green-400 transition-colors"/>
                        </div>
                        <div className="p-4 rounded-full bg-green-500/10 text-green-500 mb-2">
                            <Zap size={24} />
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Build Status</div>
                            <div className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                                {/* DYNAMIC BADGE FROM GITHUB */}
                                <img 
                                    src="https://img.shields.io/github/actions/workflow/status/Idle0x/xandeum-pulse/ci.yml?branch=main&label=Passing&style=flat-square&color=22c55e" 
                                    alt="Build Status" 
                                    className="h-6"
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-2">
                            Verifies Logic, Routing & Failover
                        </div>
                    </a>

                    {/* CARD 2: TEST COVERAGE */}
                    <a 
                        href="https://github.com/Idle0x/xandeum-pulse/blob/main/__tests__/lib/xandeum-economics.test.ts" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center gap-4 hover:bg-zinc-900/50"
                    >
                        <div className="absolute top-3 right-3">
                            <ExternalLink size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors"/>
                        </div>
                        <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 mb-2">
                            <Shield size={24} />
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Test Coverage</div>
                            <div className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                {/* STATIC BADGE (Since we confirmed 100%) */}
                                <img 
                                    src="https://img.shields.io/badge/Coverage-100%25-3b82f6?style=flat-square&logo=jest" 
                                    alt="Coverage" 
                                    className="h-6"
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-2">
                            Validates Economics & Math Precision
                        </div>
                    </a>

                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-16 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-500 mb-6">
            <Cpu size={16} />
            <span className="font-mono text-sm">
                Built by <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">riot'</a> for the Xandeum ecosystem | <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors">Open Source</a>
            </span>
        </div>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
          Pulse v2.2 • 2025
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// HOLO CODE HUB
// ==========================================

function HoloCode({ code, filename, githubLink }: { code: string, filename: string, githubLink: string }) {
    const [displayedCode, setDisplayedCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for Typewriter Effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasTyped) {
                    setHasTyped(true);
                    let i = 0;
                    const interval = setInterval(() => {
                        setDisplayedCode(code.slice(0, i));
                        i++;
                        if (i > code.length) clearInterval(interval);
                    }, 10);
                }
            },
            { threshold: 0.5 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [code, hasTyped]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div ref={containerRef} className="relative group rounded-xl overflow-hidden border border-blue-500/20 bg-[#0a0a0c] shadow-2xl backdrop-blur-sm">
            {/* Glass Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <Code size={12} className="text-blue-400"/>
                    <span className="text-[10px] font-mono text-blue-300/80">{filename}</span>
                </div>
                <div className="flex items-center gap-2">
                    <a href={githubLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" title="View on GitHub">
                        <Github size={12}/>
                    </a>
                    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" title="Copy Snippet">
                        {isCopied ? <Check size={12} className="text-green-500"/> : <ClipboardCopy size={12}/>}
                    </button>
                </div>
            </div>

            {/* Code Body */}
            <div className="p-4 overflow-x-auto relative">
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-20"></div>

                <pre className="font-mono text-[10px] md:text-xs leading-relaxed text-zinc-300">
                    <code dangerouslySetInnerHTML={{ 
                        __html: displayedCode.replace(/\/\/.*/g, '<span class="text-zinc-500 italic">$&</span>')
                    }} />
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 align-middle animate-pulse"></span>
                </pre>
            </div>
        </div>
    );
}

// ==========================================
// COMPREHENSIVE PULSE OS SIMULATOR (V5.1 - FIXED MAP LAYOUT & LOGIC)
// ==========================================

function PulseOS_Simulator() {
    type View = 'DASH' | 'MODAL' | 'MAP' | 'HEALTH_SIM' | 'LEADERBOARD_SIM' | 'COMPARE' | 'PROOF';

    // NAVIGATION & SYSTEM STATE
    const [view, setView] = useState<View>('DASH');
    const [url, setUrl] = useState('https://xandeum-pulse.vercel.app');
    const [isAnimating, setIsAnimating] = useState(false);
    const [readyButtons, setReadyButtons] = useState<string[]>([]);

    // --- MAP STATE ---
    type MapStage = 'IDLE' | 'SELECTED' | 'DRAWER_OPEN' | 'SCROLLING' | 'EXPANDED';
    const [mapStage, setMapStage] = useState<MapStage>('IDLE');
    const [drawerTab, setDrawerTab] = useState<'CREDITS' | 'HEALTH' | 'STORAGE'>('CREDITS');

    // HEALTH SIM STATE
    const [healthScore, setHealthScore] = useState(0);

    // --- BOOT SEQUENCE ---
    useEffect(() => {
        const targetUrl = 'https://xandeum-pulse.vercel.app';
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i <= targetUrl.length) {
                setUrl(targetUrl.slice(0, i));
                i++;
            } else {
                clearInterval(typeInterval);
                setReadyButtons(['card-1']);
            }
        }, 30);
        setTimeout(() => setReadyButtons(['card-1']), 1500);
        return () => clearInterval(typeInterval);
    }, []);

    // --- REBOOT ---
    const reboot = () => {
        setView('DASH');
        setReadyButtons([]);
        setIsAnimating(false);
        setMapStage('IDLE');
        setUrl('');
        setTimeout(() => {
            setUrl('https://xandeum-pulse.vercel.app');
            setReadyButtons(['card-1']);
        }, 500);
    }

    // --- NAVIGATION CONTROLLER ---
    const navigate = (target: View, animationDuration = 1000, urlSuffix = '') => {
        setReadyButtons([]); 
        setIsAnimating(true);

        // URL Bar Updates
        let newUrl = 'https://xandeum-pulse.vercel.app';
        if (target === 'MODAL') newUrl += '/?open=8x...2A';
        if (target === 'MAP') newUrl += '/map' + urlSuffix;
        if (target === 'HEALTH_SIM') newUrl += '/inspector?node=8x...2A';
        if (target === 'LEADERBOARD_SIM') newUrl += '/leaderboard';
        setUrl(newUrl);

        setTimeout(() => {
            setView(target);
            setIsAnimating(false);

            // --- SCENARIO SPECIFIC INIT LOGIC ---

            // 1. HEALTH SIMULATION
            if (target === 'HEALTH_SIM') {
                setHealthScore(0);
                let score = 0;
                const interval = setInterval(() => {
                    score += 3;
                    if (score >= 81) {
                        score = 81;
                        clearInterval(interval);
                        setReadyButtons(['btn-back-modal']);
                    }
                    setHealthScore(score);
                }, 50);
            }

            // 2. LEADERBOARD SIM
            else if (target === 'LEADERBOARD_SIM') {
                setTimeout(() => setReadyButtons(['lb-row-3']), 800);
            }

            // 3. MAP LOGIC RESET
            else if (target === 'MAP') {
                 setMapStage('IDLE');
                 setDrawerTab('CREDITS');
            }

            // 4. STANDARD VIEWS (COMPARE/PROOF)
            else {
                setTimeout(() => {
                    const exits = getExitButtons(target);
                    setReadyButtons(exits);
                }, 700);
            }

        }, animationDuration);
    };

    // --- SMART BUTTON DEFINITIONS ---
    const getExitButtons = (currentView: View): string[] => {
        switch(currentView) {
            case 'DASH': return ['card-1'];
            case 'MODAL': return ['btn-credits', 'btn-health', 'btn-compare', 'btn-proof', 'btn-map', 'btn-back-dash'];
            case 'COMPARE': return ['btn-back-modal', 'btn-view-winner-map'];
            case 'PROOF': return ['btn-back-modal', 'btn-share-credits'];
            default: return [];
        }
    };

    // --- MAP INTERACTION SEQUENCE ---
    const handleMapPinClick = () => {
        setMapStage('SELECTED');
        setTimeout(() => {
            setMapStage('DRAWER_OPEN');
            setTimeout(() => {
                setMapStage('SCROLLING');
                setTimeout(() => {
                    setMapStage('EXPANDED');
                    setReadyButtons(['btn-back-dash-map']);
                }, 1000); // Wait for scroll
            }, 800); // Wait for drawer open
        }, 600); // Wait for pin morph
    };

    // --- DUMMY PINS DATA ---
    const pins = [
        { id: 1, city: "St Louis", country: "USA", top: "32%", left: "22%", color: "bg-pink-500" },
        { id: 2, city: "Sao Paulo", country: "Brazil", top: "70%", left: "30%", color: "bg-cyan-500" },
        { id: 3, city: "London", country: "UK", top: "25%", left: "46%", color: "bg-purple-500" },
        { id: 4, city: "Lisbon", country: "Portugal", top: "35%", left: "45%", color: "bg-yellow-500", isTarget: true }, // TARGET
        { id: 5, city: "Berlin", country: "Germany", top: "28%", left: "51%", color: "bg-blue-500" },
        { id: 6, city: "Mumbai", country: "India", top: "45%", left: "68%", color: "bg-pink-500" },
        { id: 7, city: "Tokyo", country: "Japan", top: "32%", left: "85%", color: "bg-cyan-500" },
    ];

    return (
        <div className="w-full h-full flex flex-col font-sans text-sm select-none bg-black text-zinc-300">
            {/* --- BROWSER BAR --- */}
            <div className="h-10 bg-[#18181b] border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-1 bg-black rounded border border-zinc-800 h-6 flex items-center px-3 text-[10px] font-mono text-zinc-400 justify-between group">
                    <div className="flex items-center truncate">
                        <Lock size={8} className="mr-2 text-green-500"/>
                        {url}
                    </div>
                    <button onClick={reboot} title="Reboot System" className="cursor-pointer hover:text-white bg-transparent border-none p-0 flex items-center">
                        <RotateCcw size={10} />
                    </button>
                </div>
            </div>

            {/* --- VIEWPORT --- */}
            <div className="flex-1 relative bg-black overflow-hidden h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black">

                {/* =======================================
                    VIEW: DASHBOARD
                   ======================================= */}
                {view === 'DASH' && (
                    <div className="absolute inset-0 p-6 md:p-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                            <div className="text-lg md:text-xl font-bold text-white flex gap-2"><Activity className="text-blue-500"/> DASHBOARD</div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-zinc-800 rounded"></div>
                                <div className="h-8 w-20 md:w-24 bg-zinc-800 rounded"></div>
                            </div>
                        </div>

                        {/* Tip Banner */}
                        <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 flex items-center gap-2">
                            <Info size={14} className="text-blue-400 shrink-0"/>
                            <span className="text-[10px] text-blue-300 font-bold">TIP: Click the glowing node card to open diagnostics</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} 
                                    onClick={() => i === 1 && readyButtons.includes('card-1') && navigate('MODAL', 800)}
                                    className={`h-40 md:h-48 border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 relative
                                    ${i===1 && readyButtons.includes('card-1') ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] bg-zinc-900 cursor-pointer scale-105' : 'border-zinc-800 bg-zinc-900/30 opacity-40'}`}
                                >
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-zinc-500">NODE-0{i}</span>
                                        {i===1 && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                    </div>
                                    <div className="text-2xl md:text-3xl font-bold text-white">{i===1 ? '98%' : `${40 + i*5}%`}</div>
                                    <div className="text-[9px] text-zinc-600">Health Score</div>

                                    {i===1 && readyButtons.includes('card-1') && (
                                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-full animate-bounce shadow-lg z-10">
                                            CLICK HERE
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =======================================
                    VIEW: MODAL HUB
                   ======================================= */}
                {view === 'MODAL' && (
                    <div className="absolute inset-0 bg-black/90 z-20 flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-full h-full max-w-4xl bg-[#09090b] border border-zinc-700 rounded-2xl flex flex-col relative shadow-2xl overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-3 md:p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
                                <span className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><Globe size={16}/> Node 8x...2A</span>
                                <button 
                                    onClick={() => navigate('DASH', 500)}
                                    className={`p-2 rounded-lg transition-all duration-500 ${readyButtons.includes('btn-back-dash') ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    <X size={18}/>
                                </button>
                            </div>

                            {/* BOUNCING TIP */}
                            {!isAnimating && (
                                <div className="mx-4 md:mx-6 mt-4 flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                                     <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full animate-bounce shadow-lg flex items-center gap-2">
                                        <MousePointer2 size={12} fill="currentColor" />
                                        CLICK ON ANY CARD TO CONTINUE
                                     </div>
                                </div>
                            )}

                            <div className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-y-auto">
                                {/* Left Col: Metric Cards */}
                                <div className="space-y-3 md:space-y-4">
                                    <div 
                                        onClick={() => readyButtons.includes('btn-credits') && navigate('LEADERBOARD_SIM', 800)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${readyButtons.includes('btn-credits') ? 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-zinc-800 bg-zinc-900/30'}`}
                                    >
                                        <div className="flex justify-between mb-2 items-center">
                                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Wallet size={12}/> REPUTATION</span>
                                            {readyButtons.includes('btn-credits') && <ArrowRight size={14} className="text-yellow-500 animate-pulse"/>}
                                        </div>
                                        <div className="text-xl md:text-2xl font-bold text-white">5.2M Cr</div>
                                        <div className="text-[9px] text-zinc-500 mt-1">Rank #3 Global</div>
                                    </div>

                                    <div 
                                        onClick={() => readyButtons.includes('btn-health') && navigate('HEALTH_SIM', 600)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${readyButtons.includes('btn-health') ? 'border-green-500/50 bg-green-900/10 hover:bg-green-900/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-zinc-800 bg-zinc-900/30'}`}
                                    >
                                        <div className="flex justify-between mb-2 items-center">
                                            <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Activity size={12}/> HEALTH</span>
                                            {readyButtons.includes('btn-health') && <ArrowRight size={14} className="text-green-500 animate-pulse"/>}
                                        </div>
                                        <div className="text-xl md:text-2xl font-bold text-white">81/100</div>
                                        <div className="text-[9px] text-zinc-500 mt-1">Inspect Vitality</div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold text-purple-500 flex items-center gap-1"><Database size={12}/> STORAGE</span>
                                        </div>
                                        <div className="text-xl md:text-2xl font-bold text-white">1.2 TB</div>
                                        <div className="text-[9px] text-zinc-500 mt-1">Committed</div>
                                    </div>
                                </div>

                                {/* Right Col: Action Buttons */}
                                <div className="space-y-3 md:space-y-4">
                                    <button 
                                        onClick={() => readyButtons.includes('btn-compare') && navigate('COMPARE', 1500)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${readyButtons.includes('btn-compare') ? 'border-red-500/50 bg-red-900/10 text-red-400 hover:bg-red-900/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-zinc-800 text-zinc-500 bg-zinc-900/30'}`}
                                    >
                                        <Swords size={16}/> <span className="text-sm font-bold">Compare Nodes</span>
                                    </button>

                                    <button 
                                        onClick={() => readyButtons.includes('btn-proof') && navigate('PROOF', 1500)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${readyButtons.includes('btn-proof') ? 'border-blue-500/50 bg-blue-900/10 text-blue-400 hover:bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-zinc-800 text-zinc-500 bg-zinc-900/30'}`}
                                    >
                                        <Camera size={16}/> <span className="text-sm font-bold">Proof of Pulse</span>
                                    </button>

                                    <button 
                                        onClick={() => readyButtons.includes('btn-map') && navigate('MAP', 1200)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${readyButtons.includes('btn-map') ? 'border-purple-500/50 bg-purple-900/10 text-purple-400 hover:bg-purple-900/20 shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'border-zinc-800 text-zinc-500 bg-zinc-900/30'}`}
                                    >
                                        <MapIcon size={16}/> <span className="text-sm font-bold">View on Map</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =======================================
                    VIEW: HEALTH SIMULATION (INSPECTOR)
                   ======================================= */}
                {view === 'HEALTH_SIM' && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col items-center justify-center p-4 md:p-8 animate-in slide-in-from-bottom duration-500">
                        <div className="w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
                            {/* Header */}
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">FR</div>
                                    <div>
                                        <div className="font-bold text-white text-sm">NODE INSPECTOR</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">0xcJ9...8X (Active)</div>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-zinc-900 rounded text-[10px] text-zinc-500 border border-zinc-800">SIMULATION MODE</div>
                            </div>

                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                {/* Left: The Gauge */}
                                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center aspect-square relative">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                                            <path className="text-green-500 transition-all duration-100 ease-out" strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-white">{healthScore}</span>
                                            <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Score</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Sliders */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-white">Diagnostics & Vitality</span>
                                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/50">TOP 1% NETWORK</span>
                                    </div>

                                    {['Storage Capacity', 'Reputation Score', 'Uptime Stability'].map((label, idx) => (
                                        <div key={label} className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                                                <span>{label}</span>
                                                <span className="text-white">{Math.min(100, Math.floor(healthScore * (1 + idx*0.1)))}%</span>
                                            </div>
                                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-300 ease-out ${idx === 1 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(100, Math.floor(healthScore * (1 + idx*0.1)))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer / Back Button */}
                            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-center">
                                <button 
                                    onClick={() => readyButtons.includes('btn-back-modal') && navigate('MODAL', 600)}
                                    className={`px-8 py-3 rounded-full text-xs font-bold border transition-all duration-300 ${readyButtons.includes('btn-back-modal') ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse' : 'bg-zinc-800 text-zinc-600 border-zinc-700 opacity-50 cursor-not-allowed'}`}
                                >
                                    {readyButtons.includes('btn-back-modal') ? 'CLOSE DIAGNOSTICS' : 'CALCULATING...'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* =======================================
                    VIEW: LEADERBOARD SIMULATION
                   ======================================= */}
                {view === 'LEADERBOARD_SIM' && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Same logic as before for Leaderboard... simplified for map focus */}
                        <div className="p-3 md:p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
                            <span className="font-bold text-yellow-500 flex items-center gap-2"><Trophy size={16}/> LEADERBOARD</span>
                            <div className="text-[10px] text-zinc-500 font-mono">SIMULATION MODE</div>
                        </div>
                        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
                            <div 
                                onClick={() => navigate('MAP', 800)}
                                className={`p-6 rounded-xl border bg-yellow-900/10 border-yellow-500/50 cursor-pointer hover:bg-yellow-900/20 transition-all ${readyButtons.includes('lb-row-3') ? 'animate-pulse ring-2 ring-yellow-500' : ''}`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-500 mb-2">#3 Node (You)</div>
                                    <div className="text-zinc-400 mb-4">Click to find this node on the Global Map</div>
                                    <button className="bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold animate-bounce">LOCATE ON MAP</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =======================================
                    VIEW: MAP (REDESIGNED V5.1 - SPLIT SCREEN)
                   ======================================= */}
                {view === 'MAP' && (
                    <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col animate-in zoom-in-90 duration-700">

                        {/* 1. TOP MAP SECTION (Transitions to 45% height) */}
                        <div className={`relative w-full transition-all duration-700 ease-in-out bg-[#0a0a0a] overflow-hidden flex flex-col ${mapStage === 'EXPANDED' ? 'h-[45%]' : 'h-full'}`}>

                            {/* Map Header */}
                            <div className="p-3 md:p-4 bg-black/80 border-b border-zinc-800 flex justify-between items-center shrink-0 z-10">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Globe className="text-purple-500"/> GLOBAL NODES
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                    {mapStage === 'IDLE' ? 'WAITING FOR INPUT...' : 'REGION ACTIVE'}
                                </div>
                            </div>

                            {/* Map Canvas */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_70%)]"></div>
                                {/* PINS */}
                                {pins.map((pin) => (
                                    <div 
                                        key={pin.id}
                                        style={{ top: pin.top, left: pin.left }}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                                    >
                                        {pin.isTarget && mapStage === 'IDLE' ? (
                                            <div className="relative group cursor-pointer" onClick={handleMapPinClick}>
                                                <div className="w-4 h-4 rounded-full bg-yellow-500 animate-ping absolute opacity-75"></div>
                                                <div className="w-4 h-4 rounded-full bg-yellow-500 relative border-2 border-black shadow-[0_0_15px_rgba(234,179,8,1)]"></div>
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-bounce whitespace-nowrap shadow-lg">
                                                    CLICK HERE
                                                </div>
                                                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-400 whitespace-nowrap bg-black/50 px-1 rounded">{pin.city}, {pin.country}</div>
                                            </div>
                                        ) : pin.isTarget && mapStage !== 'IDLE' ? (
                                            <div className="animate-in zoom-in spin-in-90 duration-500">
                                                <Star size={32} className="text-green-500 fill-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,1)] animate-pulse"/>
                                            </div>
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${pin.color} opacity-40 hover:opacity-100 transition-opacity`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. BOTTOM DRAWER SECTION (Transitions to 55% height) */}
                        <div className={`w-full bg-[#09090b] border-t border-zinc-800 transition-all duration-700 ease-in-out flex flex-col relative ${mapStage === 'EXPANDED' ? 'h-[55%]' : 'h-0'}`}>

                            {/* DRAWER CONTENT */}
                            {mapStage === 'EXPANDED' && (
                                <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-bottom duration-700 fade-in">

                                    {/* Header & Back */}
                                    <div className="flex justify-between items-start mb-6 shrink-0">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-black font-bold">PT</div>
                                                <h2 className="text-2xl font-bold text-white">Lisbon, Portugal</h2>
                                            </div>
                                            <div className="text-xs text-zinc-500">Region ID: eu-west-3 • 9 Nodes Active</div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('DASH', 500)}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-[10px] font-bold border border-zinc-700"
                                        >
                                            BACK TO DASHBOARD
                                        </button>
                                    </div>

                                    {/* BOUNCING TOGGLES */}
                                    <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2 shrink-0">
                                        {(['CREDITS', 'HEALTH', 'STORAGE'] as const).map(tab => (
                                            <button 
                                                key={tab}
                                                onClick={() => setDrawerTab(tab)}
                                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all relative ${drawerTab === tab ? 
                                                    (tab === 'CREDITS' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 
                                                     tab === 'HEALTH' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                                                     'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]') 
                                                    : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 animate-bounce'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* DYNAMIC STATS CONTENT (THE X-RAY STYLE) */}
                                    <div className="flex-1 bg-zinc-900/20 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-center relative overflow-hidden">
                                        {/* Background Glow */}
                                        <div className={`absolute top-0 right-0 p-32 blur-[100px] rounded-full opacity-20 transition-colors duration-500 
                                            ${drawerTab === 'CREDITS' ? 'bg-yellow-500' : drawerTab === 'HEALTH' ? 'bg-green-500' : 'bg-purple-500'}`}>
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                            {drawerTab === 'CREDITS' && (
                                                <>
                                                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Total Region Earnings</div>
                                                    <div className="text-5xl font-black text-yellow-500">5.2M <span className="text-lg text-zinc-500 font-medium">Cr</span></div>
                                                    <div className="grid grid-cols-2 gap-8 w-full max-w-xs pt-4 border-t border-zinc-800/50">
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Economy</div>
                                                            <div className="text-white font-mono">2.1% Share</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Top Earner</div>
                                                            <div className="text-white font-mono">8x...2A</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {drawerTab === 'HEALTH' && (
                                                <>
                                                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Region Vitality</div>
                                                    <div className="text-5xl font-black text-green-500">98% <span className="text-lg text-zinc-500 font-medium">Score</span></div>
                                                    <div className="grid grid-cols-2 gap-8 w-full max-w-xs pt-4 border-t border-zinc-800/50">
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Status</div>
                                                            <div className="text-white font-mono">5 Up • 0 Down</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">King Node</div>
                                                            <div className="text-white font-mono">8x...2A</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {drawerTab === 'STORAGE' && (
                                                <>
                                                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Data Density</div>
                                                    <div className="text-5xl font-black text-purple-500">1.2 <span className="text-lg text-zinc-500 font-medium">PB</span></div>
                                                    <div className="grid grid-cols-2 gap-8 w-full max-w-xs pt-4 border-t border-zinc-800/50">
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Density</div>
                                                            <div className="text-white font-mono">120 TB/Node</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Global Share</div>
                                                            <div className="text-white font-mono">12.5%</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === COMPARE & PROOF VIEWS === */}
                {(view === 'COMPARE' || view === 'PROOF') && (
                    <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col items-center justify-center p-8 text-center animate-in slide-in-from-right">
                         {isAnimating ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 px-4">
                                <RefreshCw className="animate-spin mb-4 text-red-500" size={32}/>
                                <div className="text-xs font-mono mb-4">{view === 'COMPARE' ? 'SORTING CANDIDATE NODES...' : 'GENERATING SNAPSHOT...'}</div>
                                <div className="space-y-2 w-full max-w-xs">
                                    <div className="h-8 bg-zinc-800 rounded animate-pulse"></div>
                                    <div className="h-8 bg-zinc-800 rounded animate-pulse w-3/4"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center w-full">
                                {view === 'COMPARE' ? (
                                    <>
                                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full mb-2 mx-auto flex items-center justify-center">
                                                    <Check className="text-green-500" size={32}/>
                                                </div>
                                                <div className="font-bold text-white mb-1">Node A (Yours)</div>
                                                <div className="text-green-500 font-mono text-sm">98% Health</div>
                                                <div className="text-xs text-zinc-500">5.2M Credits</div>
                                            </div>
                                            <div className="text-2xl font-bold text-zinc-600">VS</div>
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full mb-2 mx-auto flex items-center justify-center">
                                                    <X className="text-red-500" size={32}/>
                                                </div>
                                                <div className="font-bold text-white mb-1">Node B</div>
                                                <div className="text-red-500 font-mono text-sm">45% Health</div>
                                                <div className="text-xs text-zinc-500">800K Credits</div>
                                            </div>
                                        </div>

                                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                                            <div className="text-xs text-zinc-500 uppercase font-bold mb-3 text-center">Comparison Results</div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-400">Winner:</span>
                                                    <span className="text-green-500 font-bold">Node A (You)</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-400">Health Advantage:</span>
                                                    <span className="text-white font-mono">+53%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-400">Credits Lead:</span>
                                                    <span className="text-white font-mono">+4.4M</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Generated Proof Card */}
                                        <div className="w-64 md:w-80 bg-zinc-950 border-2 border-green-500/50 rounded-2xl p-6 mb-8 relative shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500">
                                            <div className="absolute top-0 right-0 p-20 bg-green-500/10 blur-3xl rounded-full"></div>

                                            <div className="text-center relative z-10">
                                                <div className="inline-block p-3 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
                                                    <Activity size={32} className="text-green-500" />
                                                </div>
                                                <h3 className="text-xl font-extrabold text-white mb-2">PROOF OF PULSE</h3>
                                                <div className="text-[10px] font-mono text-zinc-500 mb-6">8x...2A • Verified</div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                                                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Health</div>
                                                        <div className="text-xl font-extrabold text-green-400">98</div>
                                                    </div>
                                                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                                                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Credits</div>
                                                        <div className="text-lg font-extrabold text-yellow-500">5.2M</div>
                                                    </div>
                                                </div>

                                                <div className="text-[9px] text-zinc-600 font-mono flex items-center justify-center gap-1">
                                                    <Shield size={8}/> VERIFIED BY XANDEUM PULSE
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-col md:flex-row gap-3">
                                    <button 
                                        onClick={() => readyButtons.includes('btn-view-winner-map') && navigate('MAP', 1000)}
                                        className={`px-6 py-3 rounded-full font-bold transition-all ${readyButtons.includes('btn-view-winner-map') ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse' : view === 'COMPARE' ? 'bg-zinc-800 text-zinc-500' : 'hidden'}`}
                                    >
                                        VIEW WINNER ON MAP
                                    </button>
                                    <button 
                                        onClick={() => readyButtons.includes('btn-share-credits') && navigate('LEADERBOARD_SIM', 800)}
                                        className={`px-6 py-3 rounded-full font-bold transition-all ${readyButtons.includes('btn-share-credits') ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse' : view === 'PROOF' ? 'bg-zinc-800 text-zinc-500' : 'hidden'}`}
                                    >
                                        SHARE TO LEADERBOARD
                                    </button>
                                    <button 
                                        onClick={() => readyButtons.includes('btn-back-modal') && navigate('MODAL', 600)}
                                        className={`px-6 py-3 rounded-full font-bold transition-all ${readyButtons.includes('btn-back-modal') ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}
                                    >
                                        BACK TO DIAGNOSTICS
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}


// ==========================================
// SUPPORTING COMPONENTS (UNCHANGED)
// ==========================================

function VitalitySimulator() {
    const [uptimeDays, setUptimeDays] = useState(14);
    const [storageTB, setStorageTB] = useState(2);
    const [credits, setCredits] = useState(5000);
    const [versionGap, setVersionGap] = useState(0);
    const [apiOnline, setApiOnline] = useState(true);

    const uScore = Math.min(100, Math.round(100 / (1 + Math.exp(-0.2 * (uptimeDays - 7)))));
    const sScore = Math.min(100, Math.round(50 * Math.log2((storageTB/1) + 1)));
    const cScore = apiOnline ? Math.min(100, Math.round((credits / 10000) * 100)) : 0;
    const vScore = versionGap === 0 ? 100 : versionGap === 1 ? 90 : versionGap === 2 ? 70 : 30;

    let totalScore = 0;
    if (apiOnline) {
        totalScore = Math.round((uScore * 0.35) + (sScore * 0.30) + (cScore * 0.20) + (vScore * 0.15));
    } else {
        totalScore = Math.round((uScore * 0.45) + (sScore * 0.35) + (vScore * 0.20));
    }

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500 ${apiOnline ? 'from-blue-500 via-purple-500 to-green-500' : 'from-red-500 via-orange-500 to-yellow-500'}`}></div>

            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Vitality Engine
                </span>

                <div className="relative">
                    {/* Bouncing Label */}
                    <div className="absolute -top-8 right-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-bounce whitespace-nowrap shadow-lg z-10">
                        CLICK TO TEST FAILOVER
                    </div>
                    {/* The Switch */}
                    <div 
                        onClick={() => setApiOnline(!apiOnline)}
                        className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-all duration-300 ${apiOnline ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border border-zinc-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${apiOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

            <div className="text-center mb-8">
                <div className={`text-6xl font-extrabold transition-colors duration-500 ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {totalScore}
                </div>
                <div className="text-xs text-zinc-500 mt-2 font-mono">LIVE SCORE CALCULATION</div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-blue-400 flex items-center gap-2">
                            Uptime 
                            <span className="bg-zinc-800 text-zinc-400 px-1.5 rounded text-[8px] border border-zinc-700 flex items-center gap-1">
                                <Hand size={8} /> DRAG TO SIMULATE
                            </span>
                        </span>
                        <span className="text-white">{uScore} pts</span>
                    </div>
                    <div className="relative group">
                        {/* Ghost Hand Animation */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                             <Hand className="text-white animate-[ping_1.5s_infinite]" size={16} />
                        </div>
                        <input type="range" min="0" max="30" value={uptimeDays} onChange={(e) => setUptimeDays(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 relative z-20"/>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-purple-400">Storage ({apiOnline ? '30%' : '35%'})</span>
                        <span className="text-white">{sScore} pts</span>
                    </div>
                    <input type="range" min="0" max="10" step="0.1" value={storageTB} onChange={(e) => setStorageTB(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </div>

                <div className={`transition-opacity duration-500 ${apiOnline ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                    <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                        <span className="text-yellow-500">Credits ({apiOnline ? '20%' : '0%'})</span>
                        <span className="text-white">{apiOnline ? cScore : 'N/A'} pts</span>
                    </div>
                    <input disabled={!apiOnline} type="range" min="0" max="20000" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:cursor-not-allowed"/>
                    {!apiOnline && <div className="text-[9px] text-red-500 mt-1 font-bold">⚠ SIGNAL LOST: EXCLUDED FROM CALCULATION</div>}
                </div>

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

function ManualCard({ icon: Icon, title, desc, color, tag, type }: { icon: any, title: string, desc: string, color: string, tag: string, type: string }) {
    const [isActive, setIsActive] = useState(false);
    const [cyclicIcon, setCyclicIcon] = useState(0);

    const handleClick = () => {
        setIsActive(true);
        setTimeout(() => setIsActive(false), 2000); // Auto reset
    };

    const colorStyles = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
        green: "text-green-400 bg-green-500/10 border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]",
        red: "text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]",
        zinc: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20 hover:border-zinc-500/50 hover:shadow-[0_0_30px_rgba(113,113,122,0.1)]",
    }[color] || "";

    const hoverBorder = colorStyles.match(/hover:border-\S+/)?.[0] || "";
    const hoverShadow = colorStyles.match(/hover:shadow-\S+/)?.[0] || "";
    const baseClasses = colorStyles.split(' hover')[0] || "";

    // Cyclic Rotation Logic
    useEffect(() => {
        if(type === 'CYCLIC' && isActive) {
            const interval = setInterval(() => {
                setCyclicIcon(prev => (prev + 1) % 3);
            }, 300);
            return () => clearInterval(interval);
        }
    }, [isActive, type]);

    const renderIcon = () => {
        if (type === 'CYCLIC') {
            return isActive ? (
                cyclicIcon === 0 ? <Activity size={32} className="animate-bounce" /> :
                cyclicIcon === 1 ? <Database size={32} className="animate-bounce" /> :
                <HeartPulse size={32} className="animate-bounce" />
            ) : <Icon size={32} />;
        }
        if (type === 'ZEN') {
            return isActive ? <Monitor size={32} className="text-white" /> : <Icon size={32} className={isActive ? "animate-pulse" : ""} />;
        }
        if (type === 'INSPECTOR') {
            return <Icon size={32} className={`transition-transform duration-500 ${isActive ? 'scale-150 text-white' : ''}`} />;
        }
        if (type === 'PROOF') {
            return isActive ? <div className="flex gap-1 animate-in fade-in"><FileJson size={16}/><LinkIcon size={16}/><Hash size={16}/></div> : <Icon size={32} />;
        }
        if (type === 'GHOST') {
            return <Icon size={32} className={isActive ? "opacity-20 transition-opacity duration-500" : ""} />;
        }
        if (type === 'STOINC') {
            return isActive ? <span className="text-xl font-black font-mono animate-ping">12x</span> : <Icon size={32} />;
        }
        if (type === 'IDENTITY') {
            return isActive ? <div className="animate-spin"><RefreshCw size={32}/></div> : <Icon size={32} />;
        }
        if (type === 'VERSUS') {
            return <Icon size={32} className={isActive ? "animate-[spin_0.5s_ease-in-out]" : ""} />;
        }
        if (type === 'WHALE') {
            return <Icon size={32} className={`transition-all duration-500 ${isActive ? '-translate-y-4 scale-125' : ''}`} />;
        }
        return <Icon size={32} className={isActive ? "animate-bounce" : ""} />;
    };

    return (
        <div 
            onClick={handleClick}
            className={`p-6 md:p-8 rounded-3xl border transition-all duration-200 active:scale-95 cursor-pointer border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 backdrop-blur-sm ${baseClasses} ${hoverBorder} ${hoverShadow}`}
        >
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className={`p-4 rounded-2xl shrink-0 bg-black border border-zinc-800 ${baseClasses} flex items-center justify-center w-16 h-16`}>
                    {renderIcon()}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-white group-hover:translate-x-1 transition-transform">{title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-zinc-400 uppercase tracking-wide">{tag}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    )
}
