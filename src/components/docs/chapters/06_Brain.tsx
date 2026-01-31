import { useState, useEffect, useRef } from 'react';
import { 
  Server, Share2, Zap, ShieldAlert, 
  CheckCircle2, Network, Terminal, Activity, 
  Cpu, ArrowRight, Database, Loader2
} from 'lucide-react';

// --- CODE SNIPPET ---
const ARCH_CODE = `
// THE HYBRID ARCHITECTURE: Hero vs. Swarm
class PulseEngine {
  async fetchBlock(height) {
    // 1. The Hero Sprint: Private, direct connection
    const heroPromise = this.heroRPC.getBlock(height)
      .catch(err => this.reportCasualty(err));

    // 2. The Swarm Backup: Redundant, decentralized mesh
    const swarmPromise = new Promise(resolve => {
       this.swarm.broadcast(height, (fragments) => {
          // 3. Gap Filling: Swarm patches missing chunks
          if (this.hero.isMissingData) {
             this.merge(fragments); 
          }
          resolve(fragments);
       });
    });

    // 4. The Race: First complete payload wins
    return Promise.race([heroPromise, swarmPromise]);
  }
}
`;

export function BrainChapter() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-24">

            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">
                        Chapter 06
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Hybrid Architecture</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    [attachment_0](attachment) Xandeum Pulse abandons the traditional "Round Robin" load balancing in favor of a competitive <strong>Hero/Swarm Model</strong>. This architecture ensures institutional-grade speed via a private primary node (Hero) while maintaining decentralized resilience through a public mesh (Swarm).
                </p>
            </div>

            {/* ===================================================
                SECTION 1: THE RPC RACEWAY (Text Left, Sim Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* LEFT: Text */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <Zap size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">The Hero vs. Swarm</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Every data request triggers a race. The <strong>Hero Node</strong> (Blue) takes the express lane, usually winning by a margin of 200-500ms.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            However, Heroes are fragile. If the Hero stalls (e.g., rate limits), the <strong>Swarm</strong> (Orange) naturally overtakes it. The system automatically spotlights the active provider, dimming the failed lane until recovery is confirmed.
                        </p>
                        
                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl mt-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500 mb-2">
                                <Activity size={12} /> Live Simulation
                            </div>
                            <p className="text-xs text-zinc-400">
                                This simulation runs on autopilot, cycling through 3 failure/recovery scenarios. <span className="text-white">Clicking nodes</span> acts as a catalyst to force immediate state changes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <RpcRaceway />

            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            {/* ===================================================
                SECTION 2: PAYLOAD ASSEMBLY (Sim Left, Text Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* LEFT: Simulation */}
                <div className="order-2 lg:order-1">
                    <PayloadAssembler />
                </div>

                {/* RIGHT: Text */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Database size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Gap Filling</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Speed isn't everything; completeness matters. Even if the Hero wins the race, it might deliver a "Swiss Cheese" payload—fast but missing specific transaction receipts.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            The Swarm doesn't stop when the Hero finishes. It arrives seconds later to <strong>patch the gaps</strong>, silently merging missing data chunks into the final block structure before the UI even renders.
                        </p>
                    </div>

                    <div className="flex gap-4 text-[10px] font-bold uppercase text-zinc-500 border-t border-zinc-900 pt-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div> 
                             Hero Data (Fast)
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-orange-500 rounded-sm"></div> 
                             Swarm Patch (Complete)
                         </div>
                    </div>
                </div>

            </div>

            {/* ===================================================
                SECTION 3: SOURCE CODE (Bottom)
               =================================================== */}
            <div className="border-t border-zinc-900 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Terminal size={20} className="text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Underlying Logic</h3>
                </div>
                
                <div className="bg-[#0D1117] border border-zinc-800 rounded-2xl p-6 overflow-x-auto custom-scrollbar shadow-2xl relative group">
                     <div className="absolute top-4 right-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded bg-[#0D1117]">
                           lib/pulse-engine.ts
                     </div>
                     <TypewriterCode code={ARCH_CODE.trim()} />
                </div>
            </div>

        </section>
    );
}


// --- SIMULATION 1: RPC RACEWAY (SOPHISTICATED AUTOPILOT) ---
function RpcRaceway() {
    // State
    const [heroPos, setHeroPos] = useState(0);
    const [swarmPos, setSwarmPos] = useState(0);
    const [scenario, setScenario] = useState<'SWARM_WIN' | 'HERO_RECOVER_CLEAN' | 'HERO_RECOVER_PATCH'>('HERO_RECOVER_PATCH');
    const [phase, setPhase] = useState<'IDLE' | 'RACING' | 'HERO_CRASHED' | 'HERO_RECOVERING' | 'FINISHED' | 'GAP_FILLING' | 'COOLDOWN'>('IDLE');
    const [spotlight, setSpotlight] = useState<'HERO' | 'SWARM' | 'NONE'>('NONE');
    const [logs, setLogs] = useState<Array<{msg: string, type: 'info'|'err'|'warn'|'success'}>>([]);
    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [logs]);

    const addLog = (msg: string, type: 'info'|'err'|'warn'|'success') => {
        setLogs(prev => [...prev.slice(-5), { msg, type }]);
    };

    // --- MAIN GAME LOOP ---
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // 1. IDLE / INIT
        if (phase === 'IDLE') {
            timer = setTimeout(() => {
                // Cycle Scenarios: 0 -> 1 -> 2 -> 0
                const scenarios: any[] = ['SWARM_WIN', 'HERO_RECOVER_CLEAN', 'HERO_RECOVER_PATCH'];
                const nextScenario = scenarios[(scenarios.indexOf(scenario) + 1) % scenarios.length];
                
                setScenario(nextScenario);
                setHeroPos(0);
                setSwarmPos(0);
                setPhase('RACING');
                setSpotlight('HERO'); // Hero starts strong
                addLog(`[SYSTEM] Starting Scenario: ${nextScenario.replace(/_/g, ' ')}`, 'info');
                addLog(`[HERO] Optimistic connection established.`, 'info');
            }, 1000);
        }

        // 2. RACING LOOP
        if (phase === 'RACING' || phase === 'HERO_CRASHED' || phase === 'HERO_RECOVERING' || phase === 'GAP_FILLING') {
            timer = setInterval(() => {
                
                // --- HERO LOGIC ---
                setHeroPos(prev => {
                    if (prev >= 100) return 100;
                    
                    // Trigger CRASH at 30% if not winning clean
                    if (phase === 'RACING' && prev > 30 && prev < 35) {
                        setPhase('HERO_CRASHED');
                        setSpotlight('SWARM'); // Spotlight shifts to Swarm
                        addLog(`[ERR] Hero Rate Limit (429). Connection Dropped.`, 'err');
                        addLog(`[SWARM] Failover active. Rerouting...`, 'warn');
                        return prev; 
                    }

                    if (phase === 'HERO_CRASHED') {
                        // If Scenario is Swarm Win, Hero stays dead.
                        if (scenario === 'SWARM_WIN') return prev; 
                        
                        // Otherwise, recover after Swarm passes 60%
                        if (swarmPos > 60 && Math.random() > 0.95) {
                            setPhase('HERO_RECOVERING');
                            setSpotlight('HERO'); // Spotlight back to Hero
                            addLog(`[HERO] Circuit breaker reset. Boosting...`, 'success');
                        }
                        return prev;
                    }

                    if (phase === 'HERO_RECOVERING') return prev + 3.5; // Boost speed
                    return prev + 1.2; // Normal speed
                });

                // --- SWARM LOGIC ---
                setSwarmPos(prev => {
                    if (prev >= 100) return 100;
                    return prev + 0.6; // Constant slow speed
                });

                // --- WIN CONDITION ---
                if (heroPos >= 100 && phase !== 'FINISHED' && phase !== 'GAP_FILLING') {
                    if (scenario === 'HERO_RECOVER_PATCH') {
                        setPhase('GAP_FILLING');
                        addLog(`[HERO] Payload secured. Waiting for integrity check...`, 'success');
                    } else {
                        setPhase('FINISHED');
                        addLog(`[HERO] Payload secured. Integrity 100%.`, 'success');
                    }
                } else if (swarmPos >= 100 && phase !== 'FINISHED') {
                    setPhase('FINISHED');
                    addLog(`[SWARM] Backup payload secured. Hero bypassed.`, 'warn');
                }

                // --- GAP FILL LOGIC ---
                if (phase === 'GAP_FILLING') {
                    // Hero is done, Swarm keeps running till end
                    if (swarmPos >= 100) {
                        setPhase('FINISHED');
                        addLog(`[MERGE] Swarm patched 12 missing transactions.`, 'info');
                    }
                }

            }, 30);
        }

        // 3. FINISHED -> COOLDOWN
        if (phase === 'FINISHED') {
            timer = setTimeout(() => {
                setPhase('COOLDOWN');
            }, 1000);
        }

        // 4. COOLDOWN (Working State) -> IDLE
        if (phase === 'COOLDOWN') {
            timer = setTimeout(() => {
                setPhase('IDLE');
                setLogs([]); // Clear logs for next run
            }, 3000); // 3 seconds working time
        }

        return () => clearInterval(timer);
    }, [phase, heroPos, swarmPos, scenario]);


    // --- RENDERING HELPERS ---
    const isHeroDimmed = spotlight === 'SWARM';
    const isSwarmDimmed = spotlight === 'HERO';

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px]">

             {/* Header */}
             <div className="flex justify-between items-center mb-6 z-10 border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                    <Network size={16} className="text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Orchestration View</span>
                </div>
                <div className="flex items-center gap-2">
                    {phase === 'COOLDOWN' && (
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 animate-pulse">
                            <Loader2 size={10} className="animate-spin text-cyan-500"/>
                            <span className="text-[9px] font-mono text-cyan-500">GARBAGE_COLLECTION...</span>
                        </div>
                    )}
                    <div className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
                        SCENARIO: {scenario === 'SWARM_WIN' ? 'FAILOVER' : scenario === 'HERO_RECOVER_CLEAN' ? 'RECOVERY' : 'PATCHING'}
                    </div>
                </div>
             </div>

             {/* THE TRACKS */}
             <div className="flex-1 flex flex-col gap-8 relative z-10 py-4">
                 
                 {/* 1. HERO LANE */}
                 <div className={`relative h-12 flex items-center transition-all duration-500 ${isHeroDimmed ? 'opacity-30 grayscale blur-[1px]' : 'opacity-100 grayscale-0'}`}>
                     {/* Track */}
                     <div className="absolute w-full h-px bg-cyan-900/30"></div>
                     <div className="absolute w-full h-px bg-cyan-500/20 blur-[2px]"></div>
                     <div className="absolute -left-2 -top-4 text-[9px] font-bold text-cyan-500/50 uppercase tracking-widest">Hero Node</div>

                     {/* Runner */}
                     <div 
                        className={`absolute w-12 h-6 bg-cyan-500 rounded-full shadow-[0_0_20px_#06b6d4] flex items-center justify-center transition-all duration-75 z-20 
                        ${phase === 'HERO_CRASHED' ? 'animate-shake bg-red-500 shadow-red-500' : ''}`}
                        style={{ left: `calc(${heroPos}% - 24px)` }}
                        onClick={() => { if(phase==='RACING') setPhase('HERO_CRASHED'); }} // User Catalyst
                     >
                        {phase === 'HERO_CRASHED' ? <ShieldAlert size={12} className="text-black" /> : <Zap size={12} className="text-black fill-black" />}
                     </div>
                     <div className="absolute h-1 bg-gradient-to-r from-transparent to-cyan-500/50" style={{ width: `${heroPos}%`, left: 0 }}></div>
                 </div>

                 {/* 2. SWARM LANE */}
                 <div className={`relative h-12 flex items-center transition-all duration-500 ${isSwarmDimmed ? 'opacity-30 grayscale blur-[1px]' : 'opacity-100 grayscale-0'}`}>
                     {/* Track */}
                     <div className="absolute w-full h-px bg-orange-900/30"></div>
                     <div className="absolute -left-2 -top-4 text-[9px] font-bold text-orange-500/50 uppercase tracking-widest">Swarm Mesh</div>

                     {/* Runner */}
                     <div 
                        className="absolute flex gap-1 transition-all duration-75 z-20"
                        style={{ left: `calc(${swarmPos}% - 24px)` }}
                        onClick={() => setSwarmPos(p => Math.min(100, p+10))} // User Catalyst
                     >
                        <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316] animate-pulse"></div>
                        <div className="w-3 h-3 bg-orange-600 rounded-full shadow-[0_0_10px_#f97316] animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                     </div>
                      <div className="absolute h-1 bg-gradient-to-r from-transparent to-orange-500/30" style={{ width: `${swarmPos}%`, left: 0 }}></div>
                 </div>

                 {/* Finish Line */}
                 <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20 border-r border-dashed border-zinc-600 flex items-center justify-center">
                    <div className="bg-zinc-800 text-[8px] text-zinc-400 rotate-90 px-1 border border-zinc-700 rounded">PAYLOAD</div>
                 </div>
             </div>

             {/* TERMINAL LOG */}
             <div className="bg-black/80 rounded-xl border border-zinc-800 p-3 h-32 flex flex-col gap-1 relative z-10 font-mono text-[10px] overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20"><Terminal size={14}/></div>
                <div ref={logRef} className="overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                    {logs.length === 0 && <span className="text-zinc-600 animate-pulse">Waiting for request...</span>}
                    {logs.map((l, i) => (
                        <div key={i} className={`${l.type === 'err' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : l.type === 'warn' ? 'text-amber-400' : 'text-zinc-300'}`}>
                            <span className="opacity-50 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                            {l.msg}
                        </div>
                    ))}
                </div>
             </div>

             {/* Background Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

             <style>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                .animate-shake { animation: shake 0.5s; }
             `}</style>
        </div>
    );
}

// --- SIMULATION 2: PAYLOAD ASSEMBLER ---
function PayloadAssembler() {
    const [chunks, setChunks] = useState<number[]>([0,0,0,0,0,0]); // 0=Empty, 1=Hero, 2=Swarm

    useEffect(() => {
        const interval = setInterval(() => {
            // Reset
            setChunks([0,0,0,0,0,0]);
            
            // Hero Arrives (Fast but imperfect)
            setTimeout(() => {
                setChunks([1,1,1,0,1,0]); // Misses index 3 and 5
            }, 1000);

            // Swarm Arrives (Patches gaps)
            setTimeout(() => {
                setChunks([1,1,1,2,1,2]); // Fills gaps with 2
            }, 2500);

        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col justify-center items-center gap-6 shadow-2xl relative overflow-hidden min-h-[300px]">
             
             <div className="flex gap-2">
                 {chunks.map((state, i) => (
                     <div 
                        key={i} 
                        className={`w-10 h-16 rounded-md border-2 transition-all duration-500 flex items-center justify-center
                            ${state === 0 ? 'border-zinc-800 bg-zinc-900/50' : 
                              state === 1 ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-100' : 
                              'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse'}
                        `}
                     >
                         {state === 2 && <CheckCircle2 size={16} className="text-orange-500" />}
                         {state === 1 && <div className="w-1 h-8 bg-cyan-500/50 rounded-full"></div>}
                     </div>
                 ))}
             </div>

             <div className="text-center space-y-2 relative z-10">
                 <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Block Assembly Status</div>
                 <div className={`text-2xl font-black transition-colors duration-300 ${chunks.includes(0) ? 'text-zinc-600' : 'text-white'}`}>
                     {chunks.includes(0) ? 'ASSEMBLING...' : '100% COMPLETE'}
                 </div>
                 <div className="h-1 w-32 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                     <div className="h-full bg-green-500 transition-all duration-500" style={{ width: chunks.includes(0) ? '60%' : '100%' }}></div>
                 </div>
             </div>

             {/* Background Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        </div>
    );
}

// --- TYPEWRITER COMPONENT ---
function TypewriterCode({ code }: { code: string }) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplay('');
        const interval = setInterval(() => {
            setDisplay(prev => prev + code.charAt(i));
            i++;
            if (i > code.length) clearInterval(interval);
        }, 5); // Speed of typing
        return () => clearInterval(interval);
    }, [code]);

    return (
        <pre className="font-mono text-xs md:text-sm leading-relaxed text-cyan-300/90 whitespace-pre-wrap">
            {display}
            <span className="animate-pulse inline-block w-2 h-4 bg-cyan-500 align-middle ml-1"></span>
        </pre>
    );
}
