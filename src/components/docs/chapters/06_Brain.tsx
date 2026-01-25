import { useState, useEffect } from 'react';
import { Server, Monitor, ShieldAlert, Zap, Code } from 'lucide-react';

export function BrainChapter() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Server size={12}/> Neural Core
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Orchestration & Failover</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                    The backend operates on a "Zero-Trust" principle. It employs a <span className="text-indigo-400 font-bold">Circuit Breaker</span> pattern to seamlessly switch between private and public data streams.
                </p>
            </div>

            <div className="bg-black/50 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm shadow-2xl animate-in zoom-in-95 duration-700">
                 <FailoverVisualizer />
            </div>
        </div>
    )
}

function FailoverVisualizer() {
    const [step, setStep] = useState(0);
    
    // Simulation Loop: Idle -> Fail -> Trip -> Race -> Success
    useEffect(() => {
        const interval = setInterval(() => setStep(prev => (prev + 1) % 5), 2500);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="flex flex-col gap-12">
            {/* Visualizer Canvas */}
            <div className="flex justify-between items-center relative h-32 px-4 md:px-12 select-none">
                
                {/* Connection Line */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-zinc-800 -translate-y-1/2 overflow-hidden">
                    {/* Data Packet Animation */}
                    <div className={`absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-all duration-[2000ms] ease-linear ${step === 0 ? 'translate-x-full opacity-0' : 'translate-x-[-100%] opacity-100 animate-[scan_2s_infinite]'}`}></div>
                </div>
                
                {/* Client Node */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-zinc-700 flex items-center justify-center shadow-xl">
                        <Monitor size={24} className="text-zinc-300"/>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800">FRONTEND</span>
                </div>

                {/* Hero Node (Status Changes) */}
                <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${step >= 2 ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}`}>
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${step >= 1 ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-indigo-900/20 border-indigo-500 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]'}`}>
                        {step >= 1 ? <ShieldAlert size={28}/> : <Server size={28}/>}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800">HERO (RPC)</span>
                    
                    {/* Banned Badge */}
                    {step >= 2 && (
                        <div className="absolute -top-4 -right-4 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-bounce shadow-lg">
                            BANNED
                        </div>
                    )}
                </div>

                {/* Swarm Backup (Activates on Fail) */}
                <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${step >= 3 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                     <div className="w-16 h-16 rounded-full border-2 border-green-500 bg-green-900/20 text-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                        <Zap size={28}/>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800">SWARM</span>
                </div>
            </div>

            {/* Console Log Simulator */}
            <div className="bg-black rounded-xl p-5 font-mono text-[10px] h-32 flex flex-col justify-end border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-2 right-3 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
                
                <div className={`text-zinc-600 mb-1 transition-opacity ${step===0 ? 'opacity-100' : 'opacity-50'}`}>
                    <span className="text-blue-500 mr-2">➜</span> [SYSTEM] Idle. Monitoring latency...
                </div>
                <div className={`text-red-400 mb-1 transition-opacity ${step===1 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-red-500 mr-2">✖</span> [ERROR] Hero RPC Timeout (4001ms).
                </div>
                <div className={`text-yellow-500 mb-1 transition-opacity ${step===2 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-yellow-500 mr-2">⚠</span> [WARN] Circuit Breaker TRIPPED. Banning Hero for 60s.
                </div>
                <div className={`text-indigo-400 mb-1 transition-opacity ${step===3 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-indigo-500 mr-2">⚡</span> [INFO] Initiating Swarm Race (5 Nodes)...
                </div>
                <div className={`text-green-400 transition-opacity ${step===4 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-green-500 mr-2">✔</span> [SUCCESS] Swarm Node 3 responded in 82ms.
                </div>
            </div>
        </div>
    )
}
