import { useState, useEffect } from 'react';
import { Server, Zap, ShieldAlert, Cpu, Lock, Activity, Wifi } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const BRAIN_TEXT = [
    {
        title: "Orchestration & Failover",
        content: "The Neural Core acts as a high-availability data orchestrator. It simultaneously fetches sub-second telemetry from a high-performance private RPC while racing a 'swarm' of multiple public RPC sources. This ensures that every node's committed storage and reputation data is accurate."
    },
    {
        title: "Circuit Breaker Logic",
        content: "To maintain system integrity during upstream outages, the backend employs a Circuit Breaker pattern. If the private 'Hero' node fails to respond within 4000ms, the system automatically bans it for 60 seconds and triggers an optimistic failover to the public swarm, preventing UI crashes."
    }
];

const BRAIN_CODE = `
const rpcOrchestrator = async (hero, swarm) => {
  try {
    // 1. Race Private Node (Fast Lane)
    return await Promise.race([
      fetch(hero), 
      timeout(4000)
    ]);
  } catch (err) {
    // 2. Circuit Breaker (Failover)
    // Ban Hero for 60s, unleash Swarm
    banNode(hero, 60000);
    const backups = await Promise.allSettled(
      swarm.map(url => fetch(url))
    );
    return backups.find(r => r.ok);
  }
};
`;

export function BrainChapter() {
    const [isOffline, setIsOffline] = useState(false);
    const [logs, setLogs] = useState<string[]>(["SYS: Neural Core Active. Polling Hero Node..."]);

    // Log Simulator
    useEffect(() => {
        let interval: any;
        if (isOffline) {
            setLogs(prev => [...prev.slice(-4), "ERR: Hero RPC Timeout (4008ms)", "WARN: Engaging Circuit Breaker...", "SWRM: Broadcasting to 5 backup nodes...", "OK: Payload verified via Swarm #3"]);
        } else {
            interval = setInterval(() => {
                setLogs(prev => [...prev.slice(-4), `SYS: Hero Node Latency: ${Math.floor(Math.random() * 20) + 10}ms`]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isOffline]);

    return (
        <ChapterLayout
            chapterNumber="04"
            title="Neural Core"
            subtitle="High-availability RPC orchestration with optimistic failover."
            textData={BRAIN_TEXT}
            codeSnippet={BRAIN_CODE}
            githubPath="src/logic/rpc-orchestrator.ts"
        >
            <div className="h-full flex flex-col p-8 bg-[#080808]">
                
                {/* 1. Header & Controls */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <Cpu size={20} className="text-indigo-400"/>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RPC Topology</span>
                    </div>

                    {/* The Danger Switch */}
                    <button 
                        onClick={() => setIsOffline(!isOffline)}
                        className={`
                            relative flex items-center gap-3 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all
                            ${isOffline ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}
                        `}
                    >
                        <ShieldAlert size={14}/> {isOffline ? 'Reset Connection' : 'Simulate Outage'}
                        {/* Subconscious Pulse */}
                        {!isOffline && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>}
                    </button>
                </div>

                {/* 2. Visualizer (SVG Wires) */}
                <div className="flex-1 relative mb-8">
                    {/* Nodes */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white shadow-xl"><Activity size={20}/></div>
                        <span className="text-[9px] font-bold text-zinc-600 mt-2 uppercase">Core</span>
                    </div>

                    <div className="absolute bottom-0 left-10 z-20 flex flex-col items-center">
                        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all duration-500 ${isOffline ? 'bg-red-900/10 border-red-500 text-red-500' : 'bg-indigo-900/10 border-indigo-500 text-indigo-500'}`}>
                            {isOffline ? <Lock size={20}/> : <Server size={20}/>}
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600 mt-2 uppercase">Hero RPC</span>
                    </div>

                    <div className="absolute bottom-0 right-10 z-20 flex flex-col items-center">
                        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all duration-500 ${isOffline ? 'bg-green-900/10 border-green-500 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                            <Zap size={20}/>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600 mt-2 uppercase">Swarm</span>
                    </div>

                    {/* Wires */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        {/* Core -> Hero */}
                        <path 
                            d="M 50% 15% C 50% 50%, 15% 50%, 15% 85%" 
                            fill="none" 
                            stroke={isOffline ? "#ef4444" : "#6366f1"} 
                            strokeWidth="2" 
                            className={isOffline ? "" : "animate-[dash_1s_linear_infinite]"}
                            strokeDasharray={isOffline ? "0" : "5,5"}
                        />
                        {/* Core -> Swarm */}
                        <path 
                            d="M 50% 15% C 50% 50%, 85% 50%, 85% 85%" 
                            fill="none" 
                            stroke={isOffline ? "#22c55e" : "#27272a"} 
                            strokeWidth="2" 
                            className={isOffline ? "animate-[dash_0.5s_linear_infinite]" : ""}
                            strokeDasharray={isOffline ? "5,5" : "0"}
                        />
                    </svg>
                </div>

                {/* 3. Terminal Log */}
                <div className="h-32 bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] overflow-hidden flex flex-col justify-end">
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.includes('ERR') ? 'text-red-500' : log.includes('OK') ? 'text-green-500' : 'text-zinc-500'}`}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes dash { to { stroke-dashoffset: -20; } }`}</style>
        </ChapterLayout>
    );
}
