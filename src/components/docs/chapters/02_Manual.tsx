import { Activity, Eye, Search, Camera, Hash, Layers, Zap, WifiOff, Swords, Globe, Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// Data for the layout
const MANUAL_TEXT = [
    {
        title: "Operational Standards",
        content: "The Field Manual is a collection of 12 active protocols that power the Xandeum Pulse ecosystem. These aren't just visual features; they are the operational standards that allow you to maintain full visibility over the network's physical and economic topology."
    },
    {
        title: "System Interoperability",
        content: "From the way we preserve your hardware with Zen Mode to the high-speed failover logic of our crash protocols, every system is designed to give you a competitive edge. Understanding how these protocols interact—like how Stable ID preserves history during software updates—is key to achieving 100% operational awareness."
    }
];

const GRID_LOGIC = `
// Bento Grid Auto-Layout
const renderGrid = (cards) => {
  return cards.map(card => {
    // Dynamic Span Calculation
    const span = card.priority > 8 ? 'col-span-2' : 'col-span-1';
    
    return <Card 
      data={card} 
      className={\`\${span} animate-in fade-in\`} 
    />;
  });
};
`;

export function ManualChapter() {
    return (
        <ChapterLayout
            chapterNumber="01"
            title="Field Manual"
            subtitle="The definitive guide to the 12 active protocols powering the ecosystem."
            textData={MANUAL_TEXT}
            codeSnippet={GRID_LOGIC}
            githubPath="src/components/grid/bento-layout.tsx"
        >
            <div className="p-8 h-full bg-[#080808] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 group/grid">
                    {/* Row 1 */}
                    <ManualCard icon={Activity} title="Cyclic Rotation" tag="UX/UI" color="blue" />
                    <ManualCard icon={Eye} title="Zen Mode" tag="OLED" color="zinc" />
                    
                    {/* Large Card */}
                    <ManualCard icon={Search} title="Node Inspector" tag="DIAGNOSTICS" color="red" className="col-span-2 bg-zinc-900/20" />

                    {/* Row 2 */}
                    <ManualCard icon={Hash} title="Stable ID v2" tag="BACKEND" color="indigo" className="col-span-2" />
                    <ManualCard icon={Camera} title="Proof of Pulse" tag="SOCIAL" color="green" />
                    <ManualCard icon={Layers} title="Ghost Canvas" tag="EXPORT" color="purple" />

                    {/* Row 3 */}
                    <ManualCard icon={Zap} title="STOINC Sim" tag="ECONOMICS" color="yellow" />
                    <ManualCard icon={WifiOff} title="Crash Protocols" tag="RESILIENCE" color="red" />
                    <ManualCard icon={Swords} title="Comparative" tag="ANALYTICS" color="pink" />
                    <ManualCard icon={Clock} title="Time Machine" tag="TEMPORAL" color="orange" />
                    
                    {/* Footer Card */}
                    <ManualCard icon={Globe} title="King Node Logic" tag="SPATIAL" color="cyan" className="col-span-2" />
                </div>
            </div>
        </ChapterLayout>
    );
}

function ManualCard({ icon: Icon, title, color, tag, className = "" }: any) {
    // Simplified card for the Bento view
    const colors: any = {
        blue: "text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/50",
        zinc: "text-zinc-400 group-hover:bg-zinc-500/10 group-hover:border-zinc-500/50",
        red: "text-red-400 group-hover:bg-red-500/10 group-hover:border-red-500/50",
        indigo: "text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/50",
        green: "text-green-400 group-hover:bg-green-500/10 group-hover:border-green-500/50",
        purple: "text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/50",
        yellow: "text-yellow-400 group-hover:bg-yellow-500/10 group-hover:border-yellow-500/50",
        pink: "text-pink-400 group-hover:bg-pink-500/10 group-hover:border-pink-500/50",
        orange: "text-orange-400 group-hover:bg-orange-500/10 group-hover:border-orange-500/50",
        cyan: "text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/50",
    };

    return (
        <div className={`p-5 rounded-2xl border border-zinc-800 bg-[#0c0c0e] hover:z-10 transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 group-hover/grid:opacity-50 hover:!opacity-100 cursor-default ${colors[color]} ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <Icon size={20} />
                <span className="text-[9px] font-bold uppercase bg-black border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{tag}</span>
            </div>
            <div className="font-bold text-white text-sm flex items-center gap-1">
                {title}
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
            </div>
        </div>
    )
}
