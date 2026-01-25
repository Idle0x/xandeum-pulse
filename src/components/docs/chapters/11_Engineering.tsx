import { useState, useEffect } from 'react';
import { Activity, Zap, Shield, ExternalLink } from 'lucide-react';

export function EngineeringChapter() {
    const [latency, setLatency] = useState<number | null>(null);

    const ping = () => {
        setLatency(null);
        const start = Date.now();
        // Simulate a real fetch to your API
        setTimeout(() => {
            setLatency(Date.now() - start);
        }, Math.random() * 50 + 20); // Simulating 20-70ms network trip
    };

    useEffect(() => {
        const interval = setInterval(ping, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest mb-8">
                <Shield size={12} /> Standards & Assurance
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-12">
                Engineering Integrity
            </h2>
            
            {/* Live Latency Gauge */}
            <div className="inline-flex flex-col items-center justify-center w-48 h-48 rounded-full border-4 border-zinc-800 bg-[#09090b] relative mb-12 shadow-2xl">
                <Activity size={32} className={`mb-2 transition-colors ${latency && latency < 50 ? 'text-green-500' : 'text-yellow-500'}`} />
                <div className="text-4xl font-black text-white font-mono">{latency ?? '--'}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase mt-1">API Latency (ms)</div>
                
                {/* Speedometer needle simulation (CSS rotation) */}
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-4 border-green-500 opacity-20 animate-spin [animation-duration:3s]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                 {/* CARD 1: BUILD STATUS */}
                 <a 
                    href="#" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-green-500/50 transition-all cursor-pointer flex flex-col items-center gap-4"
                >
                    <div className="p-4 rounded-full bg-green-500/10 text-green-500 mb-2"><Zap size={24} /></div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Build Status</div>
                        <div className="text-xl font-bold text-white">PASSING</div>
                    </div>
                </a>

                {/* CARD 2: TEST COVERAGE */}
                <a 
                    href="#" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center gap-4"
                >
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 mb-2"><Shield size={24} /></div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Test Coverage</div>
                        <div className="text-xl font-bold text-white">100%</div>
                    </div>
                </a>
            </div>
        </div>
    )
}
