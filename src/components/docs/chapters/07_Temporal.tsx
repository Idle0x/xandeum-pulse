import { useState, useEffect } from 'react';
import { RotateCcw, Hash, Database, Fingerprint, History } from 'lucide-react';

export function TemporalChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                
                {/* 1. STABLE ID DIFF VIEWER */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Fingerprint size={12}/> Identity Persistence
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-6">Stable ID v2</h2>
                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                        Volatile data (Version, Uptime) breaks history. Pulse generates a cryptographic fingerprint that persists across software upgrades.
                    </p>
                    <StableID_Diff_Simulator />
                </div>

                {/* 2. TIME MACHINE SLIDER */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <History size={12}/> Temporal Snapshots
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-6">The Time Machine</h2>
                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                        The <strong>Watchman Engine</strong> snapshots the network every 30 minutes. Drag the slider to travel back in time and view historical states.
                    </p>
                    <TimeMachine_Simulator />
                </div>
            </div>
        </div>
    )
}

function StableID_Diff_Simulator() {
    const [jitterID, setJitterID] = useState("8x...7A:v1.2");
    
    // Simulate Jitter
    useEffect(() => {
        const interval = setInterval(() => {
            const versions = ["v1.2", "v1.3", "v1.3.1", "v1.4"];
            setJitterID(`8x...7A:${versions[Math.floor(Math.random()*versions.length)]}`);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-xl">
                <div className="text-[9px] font-bold text-red-500 uppercase mb-2">Legacy ID (Volatile)</div>
                <div className="font-mono text-sm text-red-300 animate-pulse">{jitterID}</div>
                <div className="mt-2 text-[9px] text-zinc-500">Breaks on Upgrade</div>
            </div>
            <div className="bg-green-900/10 border border-green-500/30 p-4 rounded-xl">
                <div className="text-[9px] font-bold text-green-500 uppercase mb-2">Stable ID v2</div>
                <div className="font-mono text-sm text-green-300">8x...7A-MAIN</div>
                <div className="mt-2 text-[9px] text-zinc-500">Persists Forever</div>
            </div>
        </div>
    )
}

function TimeMachine_Simulator() {
    const [days, setDays] = useState(0);
    const score = days === 0 ? 98 : Math.max(40, 98 - (days * 2));

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="text-4xl font-bold text-white transition-all">{score}%</div>
                <div className="text-right">
                    <div className="text-xs font-bold text-zinc-500">SNAPSHOT DATE</div>
                    <div className="text-sm font-mono text-blue-400">
                        {days === 0 ? 'LIVE (NOW)' : `T-${days} DAYS AGO`}
                    </div>
                </div>
            </div>
            
            <input 
                type="range" min="0" max="30" step="1"
                value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
            />
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono uppercase">
                <span>Present Day</span>
                <span>15 Days Ago</span>
                <span>30 Days Ago</span>
            </div>
        </div>
    )
}
