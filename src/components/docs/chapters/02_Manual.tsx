import { 
    Activity, Eye, Search, Camera, Hash, Layers, Zap, WifiOff, Swords, 
    Globe, Clock, MessageSquare 
} from 'lucide-react';
import { useState } from 'react';

export function ManualChapter() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header: Professional Explanation */}
            <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Field Manual</h2>
                
                <div className="max-w-4xl mx-auto text-left space-y-6">
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The <strong>Field Manual</strong> is a collection of 12 active protocols that power the Xandeum Pulse ecosystem. These aren't just visual features; they are the operational standards that allow you to maintain full visibility over the network's physical and economic topology. From the way we preserve your hardware with Zen Mode to the high-speed failover logic of our crash protocols, every system is designed to give you a competitive edge while ensuring your data remains accurate and verifiable.
                    </p>
                    <p className="text-zinc-300 text-base leading-relaxed">
                        To get the most out of the platform, you should understand how these protocols interact. For example, our <strong>Stable ID</strong> system ensures your historical records survive software updates, while the <strong>Synthesis Engine</strong> interprets that history to tell you exactly how your node is performing compared to the rest of the world. Hover over any protocol card below to activate a micro-simulation and see these systems in action.
                    </p>
                    <div className="pt-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-zinc-800"></div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Objective: Master the toolkit to achieve 100% operational awareness.</span>
                        <div className="h-px flex-1 bg-zinc-800"></div>
                    </div>
                </div>
            </div>

            {/* The Materializing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ManualCard 
                    icon={Activity} title="Cyclic Rotation" color="blue" tag="UX/UI" 
                    desc="To save screen space, Node Cards automatically cycle their tertiary metric every 5 seconds: Storage → Capacity → Health." 
                    delay={0}
                />
                <ManualCard 
                    icon={Eye} title="Zen Mode" color="zinc" tag="OLED" 
                    desc="Visual noise kills focus. Zen Mode strips away all gradients and blurs, rendering the UI in pure #000000 black to save OLED pixels." 
                    delay={100}
                />
                <ManualCard 
                    icon={Search} title="Node Inspector" color="red" tag="DIAGNOSTICS" 
                    desc="Clicking any node opens the Inspector. This is the source of truth for raw Uptime, Storage usage, and Version consensus." 
                    delay={200}
                />
                <ManualCard 
                    icon={Camera} title="Proof of Pulse" color="green" tag="SOCIAL" 
                    desc="Generates a verifiable, cryptographic snapshot of a node's health status into a shareable high-res PNG." 
                    delay={300}
                />
                <ManualCard 
                    icon={Hash} title="Stable ID v2" color="indigo" tag="BACKEND" 
                    desc="The system strips volatile data (like Version tags) from the ID, ensuring your node's history isn't lost when you upgrade software." 
                    delay={400}
                />
                <ManualCard 
                    icon={Layers} title="Ghost Canvas" color="purple" tag="EXPORT" 
                    desc="An invisible engine that renders reports off-screen at 5000px width, allowing you to export massive data tables without scrollbars." 
                    delay={500}
                />
                <ManualCard 
                    icon={Zap} title="STOINC Sim" color="yellow" tag="ECONOMICS" 
                    desc="Forecasts earnings based on hardware using Geometric Stacking—multipliers compound (multiply) rather than add." 
                    delay={0}
                />
                <ManualCard 
                    icon={WifiOff} title="Crash Protocols" color="red" tag="RESILIENCE" 
                    desc="Optimistic UI Architecture. If the upstream API fails, Pulse switches to cached metrics without breaking the rendering tree." 
                    delay={100}
                />
                <ManualCard 
                    icon={Swords} title="Comparative Intel" color="pink" tag="ANALYTICS" 
                    desc="Head-to-head analysis engine. Compare your node against the Network Average or specific 'Leader' nodes." 
                    delay={200}
                />
                <ManualCard 
                    icon={Globe} title="King Node Logic" color="cyan" tag="SPATIAL" 
                    desc="In crowded cities, the map selects a single 'King Node' to represent the cluster based on the highest score." 
                    delay={300}
                />
                <ManualCard 
                    icon={Clock} title="Time Machine" color="orange" tag="TEMPORAL" 
                    desc="The database snapshots the network every 30 minutes. You can 'travel back' to see performance from days or weeks ago." 
                    delay={400}
                />
                <ManualCard 
                    icon={MessageSquare} title="Synthesis Engine" color="pink" tag="AI" 
                    desc="A logic-driven narrative builder that writes human-readable reports explaining *why* a node is succeeding or failing." 
                    delay={500}
                />
            </div>
        </div>
    )
}

function ManualCard({ icon: Icon, title, desc, color, tag, delay }: any) {
    const [isActive, setIsActive] = useState(false);
    
    // Color Theme Mapping
    const themes: any = {
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50",
        green: "text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50",
        red: "text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50",
        purple: "text-purple-400 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50",
        yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50",
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50",
        pink: "text-pink-400 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/50",
        cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50",
        orange: "text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/50",
        zinc: "text-zinc-400 border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10 hover:border-zinc-500/50"
    };
    const activeTheme = themes[color] || themes['zinc'];

    return (
        <div 
            className={`
                group relative p-8 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden
                animate-in slide-in-from-bottom-8 fade-in fill-mode-backwards
                ${activeTheme}
                hover:-translate-y-1 hover:shadow-2xl
            `}
            style={{ animationDelay: `${delay}ms` }}
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
        >
            <div className="flex gap-5 items-start relative z-10">
                <div className={`p-4 rounded-2xl bg-black border border-white/5 shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon size={24} className={isActive ? 'animate-pulse' : ''}/>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-bold text-white text-lg tracking-tight">{title}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-white/10 bg-white/5 uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                            {tag}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    )
}
