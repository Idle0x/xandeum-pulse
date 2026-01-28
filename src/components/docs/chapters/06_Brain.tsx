import { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  Zap, 
  ShieldAlert, 
  Cpu, 
  Lock, 
  Activity, 
  Wifi, 
  FastForward,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- UPDATED BRAIN CODE: REFLECTING THE RACE LOGIC ---
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
    const [isOffline, setIsOffline] = useState(false);
    const [raceStatus, setRaceStatus] = useState<'IDLE' | 'RACING' | 'FINISHED'>('IDLE');
    const [winner, setWinner] = useState<'HERO' | 'SWARM' | null>(null);
    const [logs, setLogs] = useState<string[]>(["SYS: Neural Core Initialized."]);

    // 1. Log Management
    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-4), msg]);
    };

    // 2. Simulation Logic
    useEffect(() => {
        if (raceStatus === 'RACING') {
            const heroSpeed = isOffline ? 9999 : 600; // Hero "stalls" if offline
            const swarmSpeed = 1200; // Swarm is reliable but slightly slower

            const timer = setTimeout(() => {
                if (isOffline) {
                    setWinner('SWARM');
                    addLog("ERR: Hero Timeout. Failover to Swarm successful.");
                } else {
                    setWinner('HERO');
                    addLog("OK: Hero won race (42ms). Payload verified.");
                }
                setRaceStatus('FINISHED');
            }, Math.min(heroSpeed, swarmSpeed));

            return () => clearTimeout(timer);
        }
    }, [raceStatus, isOffline]);

    // Auto-trigger race
    useEffect(() => {
        const interval = setInterval(() => {
            if (raceStatus === 'IDLE' || raceStatus === 'FINISHED') {
                setWinner(null);
                setRaceStatus('RACING');
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [raceStatus]);

    return (
        <ChapterLayout
            chapterNumber="04"
            title="Neural Core"
            subtitle="High-availability RPC orchestration with optimistic failover."
            textData={[]} // Custom render below
            codeSnippet={BRAIN_CODE}
            githubPath="lib/rpc-orchestrator.ts"
        >
            <div className="flex flex-col gap-12 pb-12">

                {/* --- SECTION 1: THE RACE --- */}
                <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <FastForward size={20} className="text-indigo-400" />
                        The Race for Consensus
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        The <strong>Neural Core</strong> functions as a high-velocity data orchestrator, designed to eliminate single points of failure at the RPC layer. Rather than relying on a sequential fetch, the engine initiates a <strong>Parallel Race</strong>: it simultaneously queries a high-performance private "Hero" node while broadcasting to a "Swarm" of eight decentralized public backups. By utilizing a race-condition strategy, the system always accepts the first valid payload to arrive, ensuring sub-second UI responsiveness even if specific network segments are experiencing latency spikes.
                    </p>
                </div>

                {/* --- SIMULATION: THE RACE TRACK --- */}
                <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                    
                    {/* Controls */}
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Orchestrator</span>
                        </div>
                        <button 
                            onClick={() => setIsOffline(!isOffline)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${isOffline ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                        >
                            <ShieldAlert size={14}/> {isOffline ? 'Hero Offline' : 'Simulate Hero Outage'}
                        </button>
                    </div>

                    {/* The Track */}
                    <div className="space-y-6 relative z-10">
                        {/* HERO LANE */}
                        <div className="relative h-12 bg-zinc-900/30 rounded-xl border border-zinc-800/50 overflow-hidden flex items-center px-4">
                            <div className="flex items-center gap-3 z-10 w-24">
                                <Server size={14} className={isOffline ? 'text-red-500' : 'text-indigo-400'} />
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Hero</span>
                            </div>
                            <div className="flex-1 h-px bg-zinc-800 mx-4 relative">
                                {raceStatus === 'RACING' && !isOffline && (
                                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1] animate-race-fast"></div>
                                )}
                                {isOffline && <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[8px] text-red-500 font-bold uppercase">Stalled</div>}
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${winner === 'HERO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-900 text-zinc-800'}`}>
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        {/* SWARM LANE */}
                        <div className="relative h-12 bg-zinc-900/30 rounded-xl border border-zinc-800/50 overflow-hidden flex items-center px-4">
                            <div className="flex items-center gap-3 z-10 w-24">
                                <Share2 size={14} className="text-emerald-400" />
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Swarm</span>
                            </div>
                            <div className="flex-1 h-px bg-zinc-800 mx-4 relative">
                                {raceStatus === 'RACING' && (
                                    <>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-race-slow"></div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-race-mid delay-100"></div>
                                    </>
                                )}
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${winner === 'SWARM' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-zinc-900 text-zinc-800'}`}>
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="mt-8 bg-black rounded-lg p-4 font-mono text-[10px] border border-zinc-800">
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('ERR') ? 'text-red-500' : log.includes('OK') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                {`> ${log}`}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- SECTION 2: CIRCUIT BREAKER --- */}
                <div className="prose prose-invert max-w-none mt-4">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Lock size={20} className="text-pink-400" />
                        Circuit Breaker & Passive Discovery
                    </h3>
                    
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        To prevent cascading failures during upstream outages, the backend employs a <strong>Circuit Breaker</strong> pattern. If the primary Hero node fails to respond within a 4000ms window, the system automatically "bans" the endpoint for 60 seconds, optimistically failing over all traffic to the Swarm. While in failover mode, a background <strong>Passive Discovery</strong> process silently pings the Hero for recovery. Once the Hero's health is verified, the orchestrator seamlessly promotes it back to the "Fast Lane," restoring the high-performance baseline without a single dropped frame in the user interface.
                    </p>
                </div>

            </div>
            
            <style>{`
                @keyframes race-fast {
                    0% { left: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
                .animate-race-fast { animation: race-fast 0.6s linear infinite; }
                .animate-race-mid { animation: race-fast 0.9s linear infinite; }
                .animate-race-slow { animation: race-fast 1.2s linear infinite; }
            `}</style>
        </ChapterLayout>
    );
}
