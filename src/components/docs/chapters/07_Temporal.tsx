import { useState, useEffect } from 'react';
import { RotateCcw, Fingerprint, History, Database, AlertCircle } from 'lucide-react';

export function TemporalChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <History size={12}/> Temporal Intelligence
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Time Travel & Persistence</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                    Real-time data disappears the moment a node goes offline. Pulse uses <strong>Persistent Identity</strong> and 
                    <strong> 30-minute snapshots</strong> to ensure your node's story is never lost.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* 1. STABLE ID DIFF VIEWER */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Fingerprint className="text-orange-500" size={20} />
                            <h3 className="font-bold text-white">Stable ID v2</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                            When you update your node software, the version string changes. 
                            If your ID includes the version, your history resets. Pulse strips this data to keep your identity rock solid.
                        </p>
                        <StableID_Diff_Simulator />
                    </div>
                </div>

                {/* 2. TIME MACHINE SLIDER */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl h-full flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                            <RotateCcw className="text-blue-400" size={20} />
                            <h3 className="font-bold text-white">Snapshot Slider</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-8">
                            Drag the slider to see how the dashboard looks up historical data from the <strong>Supabase Shadow Database</strong>.
                        </p>
                        <TimeMachine_Simulator />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StableID_Diff_Simulator() {
    const [ver, setVer] = useState("v1.2.0");
    
    useEffect(() => {
        const interval = setInterval(() => {
            const versions = ["v1.2.1", "v1.3.0", "v1.3.5", "v1.4.0"];
            setVer(versions[Math.floor(Math.random() * versions.length)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl relative overflow-hidden">
                <div className="text-[8px] font-bold text-red-500 uppercase mb-1">Old ID (Volatile)</div>
                <code className="text-xs text-red-300 font-mono block truncate">8x...2A-{ver}-ONLINE</code>
                <div className="absolute top-2 right-3 animate-pulse text-red-500"><AlertCircle size={10}/></div>
            </div>
            <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-xl relative overflow-hidden">
                <div className="text-[8px] font-bold text-green-500 uppercase mb-1">Pulse ID (Stable)</div>
                <code className="text-xs text-green-300 font-mono block">8x...2A-MAINNET</code>
                <div className="absolute top-2 right-3 text-green-500"><Fingerprint size={10}/></div>
            </div>
        </div>
    );
}

function TimeMachine_Simulator() {
    const [days, setDays] = useState(0);
    const score = days === 0 ? 98 : Math.max(40, 98 - (days * 1.5));

    return (
        <div className="p-6 bg-black rounded-2xl border border-zinc-800">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Historical Health</div>
                    <div className="text-4xl font-black text-white">{score.toFixed(0)}%</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Travel Duration</div>
                    <div className="text-sm font-mono text-zinc-300">{days === 0 ? "LIVE VIEW" : `${days} DAYS AGO`}</div>
                </div>
            </div>
            
            <input 
                type="range" min="0" max="30" 
                value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
            />
            <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                <span>PRESENT</span>
                <span>T-15D</span>
                <span>T-30D</span>
            </div>
        </div>
    )
}
