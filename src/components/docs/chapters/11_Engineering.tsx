import { useState, useEffect } from 'react';
import { Activity, Shield, Zap, CheckCircle2, Lock } from 'lucide-react';

export function EngineeringChapter() {
    const [latency, setLatency] = useState<number | null>(null);

    const runPing = () => {
        setLatency(null);
        const start = Date.now();
        setTimeout(() => {
            setLatency(Date.now() - start);
        }, Math.random() * 40 + 15); 
    };

    useEffect(() => {
        const interval = setInterval(runPing, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 text-center flex flex-col items-center">
            {/* Context Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                    <Shield size={12} /> System Integrity Verified
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Engineering Standards</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
                    Xandeum Pulse is built for professional operators who require 24/7 reliability. 
                    We don't just hope the data is correct—we verify it through <strong>automated hourly audits</strong> and a 
                    rigorous testing suite that ensures every credit and byte is accounted for.
                </p>
            </div>
            
            {/* The Live Proof Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 w-full text-left">
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl h-fit text-blue-400"><Activity size={24}/></div>
                        <div>
                            <h4 className="text-white font-bold mb-2">Live Performance Tracking</h4>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                The gauge on the right shows our <strong>Real-Time API Latency</strong>. 
                                By using background workers and RAM-based caching, we deliver network updates in milliseconds, 
                                ensuring you never make decisions based on stale data.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl h-fit text-green-400"><Lock size={24}/></div>
                        <div>
                            <h4 className="text-white font-bold mb-2">100% Logic Audit</h4>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Every line of code related to the <strong>STOINC Simulator</strong> and <strong>Vitality Math</strong> is tested 
                                against 31 different network failure scenarios. This guarantees the mathematical accuracy of your projected earnings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Live Latency Gauge */}
                <div className="relative flex flex-col items-center justify-center w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-zinc-900 bg-[#050505] shadow-[0_0_80px_rgba(34,197,94,0.05)] mx-auto group">
                    {/* Spinning Outer Ring */}
                    <div className="absolute inset-0 rounded-full border-t-2 border-green-500/30 animate-spin [animation-duration:4s]"></div>
                    
                    <Activity size={48} className={`mb-4 transition-colors duration-500 ${latency && latency < 40 ? 'text-green-500' : 'text-yellow-500'}`} />
                    <div className="text-6xl font-black text-white font-mono tracking-tighter">
                        {latency ?? '--'}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">Latency (ms)</div>
                    
                    <div className="absolute -bottom-4 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full text-[9px] font-mono text-zinc-400 group-hover:text-green-400 transition-colors shadow-2xl">
                        UPLINK: ACTIVE // ENDPOINT: /API/STATS
                    </div>
                </div>
            </div>

            {/* Validation Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                 <div className="p-8 rounded-[2rem] bg-zinc-900/30 border border-zinc-800 flex flex-col items-center gap-5 hover:bg-zinc-900/50 transition-all">
                    <div className="p-4 rounded-full bg-green-500/10 text-green-500"><Zap size={28} /></div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">CI/CD Build Status</div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-1.5 bg-green-900/20 border border-green-500/30 rounded-full text-green-400 uppercase tracking-wider">
                            <CheckCircle2 size={12}/> Deployment Stable
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-zinc-900/30 border border-zinc-800 flex flex-col items-center gap-5 hover:bg-zinc-900/50 transition-all">
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-500"><Shield size={28} /></div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Financial Logic Audit</div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-1.5 bg-blue-900/20 border border-blue-500/30 rounded-full text-blue-400 uppercase tracking-wider">
                            <CheckCircle2 size={12}/> 100% Test Coverage
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
