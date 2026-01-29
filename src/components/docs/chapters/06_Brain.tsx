import { useState, useEffect, useRef } from 'react';
import { 
  Server, Zap, ShieldAlert, Cpu, Lock, Activity, 
  Wifi, FastForward, Share2, CheckCircle2, AlertTriangle, 
  Network, ArrowRight 
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- UPDATED BRAIN CODE ---
const BRAIN_CODE = `
/**
 * The Parallel Race Logic
 * Racing the 'Hero' against the 'Swarm'
 */
async function fetchNodes() {
  // 1. Race Private Hero (Fast Lane) vs 4s Timeout
  try {
    const data = await Promise.race([
      this.rpcCall(this.hero.ip),
      new Promise((_, reject) => 
        setTimeout(() => reject('Timeout'), 4000)
      )
    ]);
    return data;
  } catch (e) {
    // 2. Circuit Breaker: Failover to Swarm
    console.warn("Hero Down. Engaging Swarm Failover.");
    this.hero.isOnline = false;
    return this.failoverFetch(); // Iterates through backups
  }
}
`;

export function BrainChapter() {
    return (
        <ChapterLayout
            chapterNumber="04"
            title="Neural Core"
            subtitle="High-availability RPC orchestration with optimistic failover."
            textData={[]} 
            codeSnippet={BRAIN_CODE}
            githubPath="lib/rpc-orchestrator.ts"
        >
            <div className="flex flex-col gap-24 pb-12">

                {/* ===================================================
                    SECTION 1: THE RACE (Text Left, Sim Right)
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* LEFT: Text */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <FastForward size={24} className="text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">The Race for Consensus</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                The Neural Core functions as a high-velocity data orchestrator. Rather than relying on a sequential fetch, the engine initiates a <strong>Parallel Race</strong>.
                            </p>
                            <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                                It simultaneously queries a high-performance private "Hero" node while broadcasting to a "Swarm" of public backups. The system accepts the first valid payload to arrive, ensuring sub-second responsiveness even if the Hero node stutters.
                            </p>
                        </div>

                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Hero (Private)
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Swarm (Public)
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Race Simulator */}
                    <RaceSimulator />

                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* ===================================================
                    SECTION 2: CIRCUIT BREAKER (Icon Left, Text Right)
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* LEFT: Visual Concept */}
                    <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 h-[320px] relative overflow-hidden flex flex-col items-center justify-center text-center group">
                         {/* Abstract Circuit Breaker Visual */}
                         <div className="relative mb-6">
                             <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full"></div>
                             <Lock size={64} className="text-pink-500 relative z-10" />
                             <div className="absolute -top-4 -right-4 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <Activity size={10} className="text-red-500 animate-pulse" /> Timeout
                             </div>
                         </div>
                         <h4 className="text-xl font-bold text-white mb-2">Circuit Breaker Active</h4>
                         <p className="text-xs text-zinc-500 max-w-[250px] mx-auto">
                             Automatic endpoint banning prevents the UI from waiting on dead nodes.
                         </p>
                         
                         {/* Background Grid */}
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                    </div>

                    {/* RIGHT: Text */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                    <ShieldAlert size={24} className="text-pink-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Optimistic Failover</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                To prevent cascading failures during upstream outages, the backend employs a <strong>Circuit Breaker</strong> pattern.
                            </p>
                            <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                                If the primary Hero node fails to respond within a 4000ms window, the system automatically "bans" the endpoint for 60 seconds, instantly failing over all traffic to the Swarm. While in failover mode, a background <strong>Passive Discovery</strong> process silently pings the Hero for recovery.
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
                                <div className="text-2xl font-black text-white">4000ms</div>
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Timeout Threshold</div>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
                                <div className="text-2xl font-black text-white">60s</div>
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Ban Duration</div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </ChapterLayout>
    );
}

// --- SUB-COMPONENT: RACE SIMULATOR ---
function RaceSimulator() {
    const [isOffline, setIsOffline] = useState(false);
    const [raceState, setRaceState] = useState<'IDLE' | 'RACING' | 'FINISHED'>('IDLE');
    const [winner, setWinner] = useState<'HERO' | 'SWARM' | null>(null);

    // Latency Counters
    const [heroMs, setHeroMs] = useState(0);
    const [swarmMs, setSwarmMs] = useState(0);

    // Auto-Run Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const runRace = () => {
            setRaceState('IDLE');
            setWinner(null);
            setHeroMs(0);
            setSwarmMs(0);

            // Small delay before start
            setTimeout(() => {
                setRaceState('RACING');
            }, 500);
        };

        // Start initial race
        runRace();

        // Loop races
        interval = setInterval(runRace, 4000); // New race every 4 seconds

        return () => clearInterval(interval);
    }, [isOffline]); // Restart loop if offline toggle changes

    // Race Physics
    useEffect(() => {
        if (raceState !== 'RACING') return;

        let hTimer: NodeJS.Timeout;
        let sTimer: NodeJS.Timeout;

        // HERO LOGIC
        if (isOffline) {
            // Hero crashes at 50%
            // No winner set by Hero
        } else {
            // Hero finishes in 800ms
            hTimer = setTimeout(() => {
                if (!winner) {
                    setWinner('HERO');
                    setRaceState('FINISHED');
                    setHeroMs(45); // Fast
                }
            }, 800);
        }

        // SWARM LOGIC
        // Swarm finishes in 1500ms (Always reliable, but slower)
        sTimer = setTimeout(() => {
            if (!winner) {
                // Only win if Hero hasn't already won
                setWinner('SWARM'); 
                setRaceState('FINISHED');
                setSwarmMs(120); // Slower
            }
        }, 1500);

        return () => { clearTimeout(hTimer); clearTimeout(sTimer); };
    }, [raceState, isOffline, winner]);


    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden min-h-[320px]">
            
            {/* Header / Controls */}
            <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Orchestrator</span>
                </div>
                <button 
                    onClick={() => setIsOffline(!isOffline)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${isOffline ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                >
                    <ShieldAlert size={12}/> {isOffline ? 'Hero Severed' : 'Kill Hero Node'}
                </button>
            </div>

            {/* THE TRACK */}
            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                
                {/* LANE 1: HERO */}
                <div className="relative">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-2">
                        <span className="flex items-center gap-1"><Server size={10}/> Private Node</span>
                        <span className={winner === 'HERO' ? 'text-indigo-400' : 'text-zinc-600'}>{winner === 'HERO' ? '45ms' : isOffline && raceState !== 'IDLE' ? 'TIMEOUT' : '---'}</span>
                    </div>
                    {/* Pipe Background */}
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                        {/* The Data Packet */}
                        <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all ease-out flex items-center justify-end pr-1
                                ${isOffline ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}
                            `}
                            style={{ 
                                width: raceState === 'IDLE' ? '0%' : isOffline ? '40%' : '100%', 
                                transitionDuration: raceState === 'IDLE' ? '0ms' : isOffline ? '2000ms' : '800ms' 
                            }}
                        >
                            {/* Sparkle at head of packet */}
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* LANE 2: SWARM */}
                <div className="relative">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-2">
                        <span className="flex items-center gap-1"><Network size={10}/> Public Swarm</span>
                        <span className={winner === 'SWARM' ? 'text-emerald-400' : 'text-zinc-600'}>{winner === 'SWARM' ? '120ms' : '---'}</span>
                    </div>
                    {/* Pipe Background */}
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                        {/* The Data Packet */}
                        <div 
                            className="absolute top-0 left-0 h-full rounded-full transition-all ease-out flex items-center justify-end pr-1 bg-emerald-500 shadow-[0_0_10px_#10b981]"
                            style={{ 
                                width: raceState === 'IDLE' ? '0%' : '100%', 
                                transitionDuration: raceState === 'IDLE' ? '0ms' : '1500ms' 
                            }}
                        >
                             <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* RESULT LOG */}
            <div className="h-10 border-t border-zinc-800 pt-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${raceState === 'IDLE' ? 'bg-zinc-700' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {raceState === 'IDLE' ? 'ORCHESTRATOR_READY' : raceState === 'RACING' ? 'RACE_IN_PROGRESS...' : 'PAYLOAD_SECURED'}
                    </span>
                </div>
                {winner && (
                    <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${winner === 'HERO' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'} animate-in slide-in-from-right`}>
                        Winner: {winner}
                    </div>
                )}
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

        </div>
    );
}
