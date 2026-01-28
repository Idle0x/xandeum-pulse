import { useState, useEffect } from 'react';
import { Server, Zap, ShieldAlert, Cpu, Lock } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const ORCHESTRATOR_LOGIC_SNIPPET = `
const rpcOrchestrator = async (heroRPC, swarm) => {
  try {
    // 1. Race Conditions
    // Attempt sub-second fetch from private 'Hero' node
    return await Promise.race([fetch(heroRPC), timeout(4000)]);
  } catch (err) {
    // 2. Circuit Breaker
    // If Hero fails, lock it for 60s and unleash the swarm
    banNode(heroRPC, 60000);
    const swarmRes = await Promise.allSettled(swarm.map(f => fetch(f)));
    return swarmRes.find(r => r.status === 'fulfilled');
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
            <FailoverVisualizer />
        </LogicWrapper>
    )
}

function FailoverVisualizer() {
    const [step, setStep] = useState(0);

    // The Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev + 1) % 4); 
            // 0: Idle/Start, 1: Private Fail, 2: Swarm Activate, 3: Success
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const isPrivateActive = step === 0;
    const isPrivateFailed = step >= 1;
    const isSwarmActive = step >= 2;

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-10 h-full relative overflow-hidden shadow-2xl flex flex-col justify-between">
            
            {/* 1. TOP NODE: FRONTEND */}
            <div className="flex justify-center relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-lg z-10">
                        <Cpu size={28} />
                    </div>
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest bg-black px-2 py-1 rounded border border-zinc-900">Neural Core</span>
                </div>
            </div>

            {/* 2. MIDDLE LAYER: THE RACE */}
            <div className="flex justify-between items-center px-4 md:px-12 relative z-0 py-12">
                
                {/* SVG WIRES connecting Top to Middle */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Wire to Private */}
                    <path 
                        d="M 50% 10% C 50% 50%, 20% 10%, 20% 50%" 
                        fill="none" 
                        stroke={isPrivateFailed ? "#3f3f46" : "#6366f1"} 
                        strokeWidth="2" 
                        strokeDasharray={isPrivateActive ? "5,5" : "0"}
                        className={isPrivateActive ? "animate-[dash_1s_linear_infinite]" : ""}
                    />
                     {/* Wire to Swarm */}
                     <path 
                        d="M 50% 10% C 50% 50%, 80% 10%, 80% 50%" 
                        fill="none" 
                        stroke={isSwarmActive ? "#22c55e" : "#3f3f46"} 
                        strokeWidth="2"
                        strokeDasharray={isSwarmActive ? "5,5" : "0"}
                        className={isSwarmActive ? "animate-[dash_0.5s_linear_infinite]" : ""}
                    />
                </svg>
                
                {/* Private Node */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`
                        w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500
                        ${isPrivateFailed ? 'bg-red-900/10 border-red-500 text-red-500' : 'bg-indigo-500/10 border-indigo-500 text-indigo-400'}
                    `}>
                        {isPrivateFailed ? <Lock size={20}/> : <Server size={20}/>}
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Hero RPC</span>
                    {isPrivateFailed && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full animate-bounce">408 Timeout</div>}
                </div>

                {/* Swarm Nodes */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`
                        w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500
                        ${isSwarmActive ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-700'}
                    `}>
                        <Zap size={20}/>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Public Swarm</span>
                </div>
            </div>

            {/* 3. TERMINAL OUTPUT */}
            <div className="bg-[#0a0a0a] rounded-xl border border-zinc-800 p-4 font-mono text-[10px] h-32 flex flex-col justify-end relative z-10 shadow-inner">
                <div className="absolute top-2 right-3 text-[8px] text-zinc-700 tracking-widest font-bold">ENGINE_LOG_v3.0</div>
                
                <div className={`mb-1 transition-opacity duration-300 ${step >= 0 ? 'opacity-100' : 'opacity-20'}`}>
                    <span className="text-blue-500">SYS:</span> Attempting handshake with HERO_NODE (12ms)...
                </div>
                <div className={`mb-1 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-red-500">ERR:</span> [TIMEOUT] Hero unresponsive. <span className="text-yellow-500">Engaging Circuit Breaker.</span>
                </div>
                <div className={`mb-1 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-green-500">SWRM:</span> Broadcasting to 5 public backups...
                </div>
                <div className={`transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-green-500">OK:</span> Payload verified via Backup #3 (45ms).
                </div>
            </div>
            
            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -10; }
                }
            `}</style>
        </div>
    )
}
