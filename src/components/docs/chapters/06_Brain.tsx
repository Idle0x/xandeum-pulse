import { useState, useEffect } from 'react';
import { Server, Monitor, ShieldAlert, Zap, Code, ShieldCheck, Cpu } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const ORCHESTRATOR_LOGIC_SNIPPET = `
const rpcOrchestrator = async (heroRPC, swarm) => {
  try {
    // Attempt private high-speed fetch with 4s timeout
    return await Promise.race([fetch(heroRPC), timeout(4000)]);
  } catch (err) {
    // Circuit Breaker: Ban Hero for 60s and race the public swarm
    banNode(heroRPC, 60000);
    const swarmResults = await Promise.allSettled(swarm.map(url => fetch(url)));
    return swarmResults.find(res => res.status === 'fulfilled');
  }
};
`;

export function BrainChapter() {
    return (
        <LogicWrapper 
            title="RPC_Orchestrator.ts" 
            code={ORCHESTRATOR_LOGIC_SNIPPET} 
            githubPath="src/logic/rpc-orchestrator.ts"
        >
            <div className="flex flex-col gap-16">
                {/* Header: Professional Explanation */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Cpu size={12}/> Neural Core Logic
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Orchestration & Failover</h2>
                    
                    <div className="max-w-4xl mx-auto text-left space-y-6">
                        <p className="text-zinc-300 text-base leading-relaxed">
                            The <strong>Neural Core</strong> acts as a high-availability data orchestrator, simultaneously fetching sub-second telemetry from a high-performance private RPC while racing a "swarm" of multiple public RPC sources across both Mainnet and Devnet. By cross-referencing these parallel streams against centralized financial APIs, the backend filters redundant network echoes to ensure that every node's committed storage and reputation data is accurate and uniquely fingerprinted.
                        </p>
                        <p className="text-zinc-300 text-base leading-relaxed">
                            To maintain system integrity during upstream outages, the backend employs a <strong>Circuit Breaker</strong> pattern that automatically bans unresponsive nodes and triggers an optimistic failover to cached metrics, preventing UI crashes. This processed data then feeds into the <strong>Vitality Engine</strong>, which utilizes non-linear Sigmoid and Logarithmic curves to calculate a fair 0-100 score—penalizing instability while rewarding long-term storage utility and consensus alignment.
                        </p>
                    </div>
                </div>

                {/* Visualizer Container */}
                <div className="bg-black/50 border border-indigo-500/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden backdrop-blur-sm shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                    <FailoverVisualizer />
                </div>

                {/* Logic Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-indigo-500/50 transition-colors">
                        <div className="text-indigo-400"><Server size={20}/></div>
                        <div className="text-sm font-bold text-white uppercase tracking-wider">Dual-Stream Fetch</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">Prioritizes private RPC speed while using public swarms to discover "ghost nodes" and verify Devnet metrics.</div>
                    </div>
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-red-500/50 transition-colors">
                        <div className="text-green-400"><ShieldCheck size={20}/></div>
                        <div className="text-sm font-bold text-white uppercase tracking-wider">Crash Protection</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">Circuit breakers isolate failing APIs in 60s intervals to prevent lag cascades and maintain 99.9% UI uptime.</div>
                    </div>
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-purple-500/50 transition-colors">
                        <div className="text-purple-400"><Zap size={20}/></div>
                        <div className="text-sm font-bold text-white uppercase tracking-wider">Vitality Curves</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">Replaces linear math with Sigmoid curves to weigh uptime and Logarithmic scales for hardware commitment.</div>
                    </div>
                </div>
            </div>
        </LogicWrapper>
    )
}

function FailoverVisualizer() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setStep(prev => (prev + 1) % 5), 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-12">
            <div className="flex justify-between items-center relative h-32 px-4 md:px-12 select-none">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-zinc-800 -translate-y-1/2 overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-all duration-[2000ms] ease-linear ${step === 0 ? 'translate-x-full opacity-0' : 'translate-x-[-100%] opacity-100 animate-[scan_2s_infinite]'}`}></div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-zinc-700 flex items-center justify-center shadow-xl">
                        <Monitor size={24} className="text-zinc-300"/>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800 tracking-widest">FRONTEND</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${step >= 2 ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}`}>
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${step >= 1 ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-indigo-900/20 border-indigo-500 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]'}`}>
                        {step >= 1 ? <ShieldAlert size={28}/> : <Server size={28}/>}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800 tracking-widest uppercase">Private RPC</span>
                    {step >= 2 && <div className="absolute -top-4 -right-4 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">TRIPPED</div>}
                </div>

                <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${step >= 3 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                     <div className="w-16 h-16 rounded-full border-2 border-green-500 bg-green-900/20 text-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                        <Zap size={28}/>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800 tracking-widest uppercase">Swarm Race</span>
                </div>
            </div>

            <div className="bg-black/80 rounded-xl p-5 font-mono text-[10px] h-36 flex flex-col justify-end border border-zinc-800 relative overflow-hidden shadow-inner text-left">
                <div className="absolute top-2 right-3 text-[8px] text-zinc-700 tracking-widest font-bold">ENGINE_LOG_v3.0</div>
                
                <div className={`text-zinc-600 mb-1 transition-opacity ${step===0 ? 'opacity-100' : 'opacity-50'}`}>
                    <span className="text-indigo-500 mr-2">SYS:</span> [INFO] Polling Private RPC (wad-east-1)...
                </div>
                <div className={`text-red-400 mb-1 transition-opacity ${step===1 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-red-500 mr-2">ERR:</span> [TIMEOUT] Endpoint unresponsive after 4000ms.
                </div>
                <div className={`text-yellow-500 mb-1 transition-opacity ${step===2 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-yellow-500 mr-2">WRN:</span> [CIRCUIT_BREAKER] Hero restricted. Cooling down...
                </div>
                <div className={`text-indigo-400 mb-1 transition-opacity ${step===3 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-indigo-500 mr-2">ACT:</span> [RACE] Querying 5 backup providers in parallel.
                </div>
                <div className={`text-green-400 transition-opacity ${step===4 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-green-500 mr-2">OK:</span> [VITALITY] Node identified. Health calculated: 98.
                </div>
            </div>
        </div>
    )
}
