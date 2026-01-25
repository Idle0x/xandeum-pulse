import { 
    Activity, Eye, Search, Camera, Hash, Layers, Zap, WifiOff, Swords 
} from 'lucide-react';
import { useState } from 'react';

export function ManualChapter() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Activity size={12}/> Active Protocols
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Field Manual</h2>
                <p className="text-zinc-500 max-w-xl mx-auto text-sm">
                    Pulse is an active intelligence tool. Master these 9 protocols to achieve full network visibility.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-700 stagger-100">
                <ManualCard 
                    icon={Activity} title="Cyclic Rotation" color="blue" tag="UX/UI" 
                    desc="Node Cards automatically cycle metrics every 5 seconds. Storage → Health → Uptime." 
                />
                <ManualCard 
                    icon={Eye} title="Zen Mode" color="zinc" tag="OLED" 
                    desc="Minimizes burn-in for 24/7 monitors by stripping all gradients and animations." 
                />
                <ManualCard 
                    icon={Search} title="Diagnostics" color="red" tag="MODAL" 
                    desc="Deep-dive into specific node health, storage distribution, and version consensus." 
                />
                <ManualCard 
                    icon={Camera} title="Proof of Pulse" color="green" tag="SOCIAL" 
                    desc="Generates cryptographic PNG snapshots for social verification." 
                />
                <ManualCard 
                    icon={Hash} title="Stable ID v2" color="indigo" tag="BACKEND" 
                    desc="Strips volatile version data to ensure history persists across upgrades." 
                />
                <ManualCard 
                    icon={Layers} title="Ghost Canvas" color="purple" tag="EXPORT" 
                    desc="Off-screen rendering engine that captures pixel-perfect reports without scrollbars." 
                />
                <ManualCard 
                    icon={Zap} title="STOINC Sim" color="yellow" tag="MATH" 
                    desc="Hardware-based rewards forecasting using geometric stacking multipliers." 
                />
                <ManualCard 
                    icon={WifiOff} title="Crash Protocols" color="red" tag="RESILIENCE" 
                    desc="Gracefully degrades to cached data if upstream APIs fail." 
                />
                <ManualCard 
                    icon={Swords} title="Comparative Intel" color="pink" tag="ANALYTICS" 
                    desc="Head-to-head node analysis with synthetic narrative generation." 
                />
            </div>
        </div>
    )
}

function ManualCard({ icon: Icon, title, desc, color, tag }: any) {
    const [isActive, setIsActive] = useState(false);
    
    // Quick color mapping
    const cMap: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
        green: "text-green-400 bg-green-500/10 border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]",
        red: "text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]",
        pink: "text-pink-400 bg-pink-500/10 border-pink-500/20 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]",
        zinc: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20 hover:border-zinc-500/50 hover:shadow-[0_0_30px_rgba(113,113,122,0.1)]"
    };
    const style = cMap[color] || cMap['zinc'];

    return (
        <div 
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
            className={`p-6 md:p-8 rounded-3xl border transition-all duration-300 cursor-pointer backdrop-blur-sm ${style} ${isActive ? '-translate-y-2' : ''}`}
        >
            <div className="flex gap-4 items-start">
                <div className={`p-3 bg-black rounded-xl border border-white/10 shrink-0 transition-transform duration-500 ${isActive ? 'scale-110 rotate-3' : ''}`}>
                    <Icon size={24} className={isActive ? 'animate-pulse' : ''}/>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-white">{title}</h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] border border-white/10 bg-white/5 uppercase">{tag}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
                </div>
            </div>
        </div>
    )
}
