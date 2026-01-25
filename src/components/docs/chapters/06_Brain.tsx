import { useState, useEffect } from 'react';
import { Server, Monitor, ShieldAlert } from 'lucide-react';

export function BrainChapter() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="text-center mb-16">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Server size={12}/> Neural Core
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Orchestration & Failover</h2>
                <p className="text-zinc-500 max-w-2xl mx-auto">
                    The backend operates on a "Zero-Trust" principle. It employs a <span className="text-indigo-400 font-bold">Circuit Breaker</span> pattern to seamlessly switch between private and public data streams.
                </p>
            </div>

            <div className="bg-black/50 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm shadow-2xl">
                 <FailoverVisualizer />
            </div>
        </div>
    )
}

function FailoverVisualizer() {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setStep(prev => (prev + 1) % 5), 2000);
        return () => clearInterval(interval);
    }, []);
    
    // 0: Idle, 1: Hero Fail, 2: Circuit Trip, 3: Swarm Race, 4: Success
    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center relative h-32 px-12">
                {/* Connection Lines */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-zinc-800 -translate-y-1/2"></div>
                
                {/* Client */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center"><Monitor size={20} className="text-white"/></div>
                    <span className="text-[10px] font-bold text-zinc-500">FRONTEND</span>
                </div>

                {/* Packet Animation */}
                {step === 1 && <div className="absolute top-1/2 left-[20%] w-3 h-3 bg-indigo-500 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>}
                
                {/* Hero Node */}
                <div className={`relative z-10 flex flex-col items-center gap-2 transition-all ${step >= 1 ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${step >= 1 ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-indigo-900/20 border-indigo-500 text-indigo-500'}`}>
                        {step >= 1 ? <ShieldAlert size={20}/> : <Server size={20}/>}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500">HERO (RPC)</span>
                </div>

                {/* Swarm Backup */}
                <div className={`relative z-10 flex flex-col items-center gap-2 transition-all ${step >= 3 ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                     <div className="w-12 h-12 rounded-full border border-green-500 bg-green-900/20 text-green-500 flex items-center justify-center">
                        <Server size={20}/>
                    </div>
                    <span className="text-[10px] font-bold text-green-500">SWARM</span>
                </div>
            </div>

            {/* Console Log */}
            <div className="bg-black rounded-lg p-4 font-mono text-[10px] h-24 flex flex-col justify-end border-t border-zinc-800">
                <div className={`text-zinc-500 ${step===0 ? 'block' : 'hidden'}`}>[SYSTEM] Idle. Monitoring latency...</div>
                <div className={`text-red-400 ${step===1 ? 'block' : 'hidden'}`}>[ERROR] Hero RPC Timeout (4001ms).</div>
                <div className={`text-yellow-500 ${step===2 ? 'block' : 'hidden'}`}>[WARN] Circuit Breaker TRIPPED. Banning Hero for 60s.</div>
                <div className={`text-indigo-400 ${step===3 ? 'block' : 'hidden'}`}>[INFO] Initiating Swarm Race (5 Nodes)...</div>
                <div className={`text-green-400 ${step===4 ? 'block' : 'hidden'}`}>[SUCCESS] Swarm Node 3 responded in 82ms.</div>
            </div>
        </div>
    )
}
