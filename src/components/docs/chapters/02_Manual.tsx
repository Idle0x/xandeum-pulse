import { 
    Activity, Eye, Search, Camera, Hash, Layers, Zap, WifiOff, Swords, 
    Globe, Clock, MessageSquare, ArrowUpRight 
} from 'lucide-react';

export function ManualChapter() {
    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-24">
            
            {/* Header: Professional & Scannable */}
            <div className="mb-20 space-y-6">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                    Field Manual <span className="text-zinc-600">v3.0</span>
                </h2>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-l-2 border-zinc-800 pl-6">
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
                        A collection of 12 active protocols powering the Xandeum Pulse ecosystem. 
                        Master these operational standards to maintain full visibility over your 
                        network's physical and economic topology.
                    </p>
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Protocols</div>
                        <div className="text-3xl font-mono text-white">12</div>
                    </div>
                </div>
            </div>

            {/* THE BENTO GRID 
                Notice 'group/grid': This allows us to dim non-hovered items
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 group/grid">
                
                {/* Row 1 */}
                <ManualCard 
                    icon={Activity} title="Cyclic Rotation" tag="UX/UI" color="blue"
                    desc="Node Cards automatically cycle metrics every 5s: Storage → Capacity → Health."
                    className="lg:col-span-1"
                />
                <ManualCard 
                    icon={Eye} title="Zen Mode" tag="OLED" color="zinc"
                    desc="Strips gradients and blurs. Renders UI in pure #000000 black to save OLED pixels."
                    className="lg:col-span-1"
                />
                <ManualCard 
                    icon={Search} title="Node Inspector" tag="DIAGNOSTICS" color="red"
                    desc="Source of truth for raw Uptime, Storage usage, and Version consensus."
                    className="lg:col-span-2"
                />

                {/* Row 2 */}
                <ManualCard 
                    icon={Hash} title="Stable ID v2" tag="BACKEND" color="indigo"
                    desc="Strips volatile data ensures history isn't lost during upgrades."
                    className="lg:col-span-2"
                />
                <ManualCard 
                    icon={Camera} title="Proof of Pulse" tag="SOCIAL" color="green"
                    desc="Generates verifiable cryptographic snapshots."
                    className="lg:col-span-1"
                />
                <ManualCard 
                    icon={Layers} title="Ghost Canvas" tag="EXPORT" color="purple"
                    desc="Renders off-screen reports at 5000px width."
                    className="lg:col-span-1"
                />

                {/* Row 3 */}
                <ManualCard 
                    icon={Zap} title="STOINC Sim" tag="ECONOMICS" color="yellow"
                    desc="Forecasts earnings using Geometric Stacking multipliers."
                    className="lg:col-span-1"
                />
                <ManualCard 
                    icon={WifiOff} title="Crash Protocols" tag="RESILIENCE" color="red"
                    desc="Optimistic UI Architecture switches to cached metrics on fail."
                    className="lg:col-span-1"
                />
                <ManualCard 
                    icon={Swords} title="Comparative Intel" tag="ANALYTICS" color="pink"
                    desc="Head-to-head analysis against Network Average or Leaders."
                    className="lg:col-span-1"
                />
                 <ManualCard 
                    icon={Clock} title="Time Machine" tag="TEMPORAL" color="orange"
                    desc="Travel back to see performance from days or weeks ago."
                    className="lg:col-span-1"
                />

                {/* Row 4 */}
                <ManualCard 
                    icon={Globe} title="King Node Logic" tag="SPATIAL" color="cyan"
                    desc="Selects a single 'King Node' to represent the cluster based on highest score."
                    className="lg:col-span-2"
                />
                <ManualCard 
                    icon={MessageSquare} title="Synthesis Engine" tag="AI" color="emerald"
                    desc="Logic-driven narrative builder explaining why a node is succeeding."
                    className="lg:col-span-2"
                />
            </div>
        </div>
    )
}

function ManualCard({ icon: Icon, title, desc, color, tag, className = "" }: any) {
    
    // Dynamic Color Classes based on props
    const colorVariants: any = {
        blue: "group-hover:border-blue-500/50 group-hover:bg-blue-500/5 text-blue-400",
        green: "group-hover:border-green-500/50 group-hover:bg-green-500/5 text-green-400",
        red: "group-hover:border-red-500/50 group-hover:bg-red-500/5 text-red-400",
        purple: "group-hover:border-purple-500/50 group-hover:bg-purple-500/5 text-purple-400",
        yellow: "group-hover:border-yellow-500/50 group-hover:bg-yellow-500/5 text-yellow-400",
        indigo: "group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 text-indigo-400",
        pink: "group-hover:border-pink-500/50 group-hover:bg-pink-500/5 text-pink-400",
        cyan: "group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5 text-cyan-400",
        orange: "group-hover:border-orange-500/50 group-hover:bg-orange-500/5 text-orange-400",
        zinc: "group-hover:border-white/20 group-hover:bg-white/5 text-zinc-200",
        emerald: "group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 text-emerald-400",
    };

    const activeColor = colorVariants[color] || colorVariants.zinc;

    return (
        <div className={`
            group relative p-6 rounded-3xl border border-zinc-800 bg-[#09090b] 
            transition-all duration-500 cursor-default
            hover:-translate-y-1 hover:shadow-2xl hover:z-10
            group-hover/grid:opacity-50 hover:!opacity-100
            ${activeColor}
            ${className}
        `}>
            <div className="flex flex-col h-full justify-between gap-8">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 group-hover:scale-110 transition-transform duration-500">
                        <Icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded bg-black">
                        {tag}
                    </span>
                </div>
                
                <div>
                    <h4 className="font-bold text-zinc-100 text-lg mb-2 flex items-center gap-2">
                        {title}
                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    )
}
