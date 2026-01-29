import { useState, useEffect } from 'react';
import { 
  Activity, Eye, Search, Hash, GitMerge, Shield, 
  Zap, TrendingUp, BarChart3, ScanLine, Swords, WifiOff,
  ArrowUpRight, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- TEXT CONTENT ---
const MANUAL_TEXT = [
    {
        title: "Modular Architecture",
        content: "Pulse is architected as a unified telemetry operating system. It allows operators to maintain full visibility over the network through 12 distinct, interoperable modules. These aren't isolated tools; they function as a mesh, where data from the Neural Core feeds directly into the Vitality Engine, which in turn dictates the Economic projections."
    },
    {
        title: "The Operator's Toolkit",
        content: "This grid represents the active capability set. From the Ghost Canvas (which virtualizes the DOM for high-fidelity reporting) to the STOINC Simulator (which replicates consensus-layer math), every module is designed to give node operators a computational advantage in managing their fleet."
    }
];

const GRID_CODE = `
// Interactive Grid Logic
const handleModuleTrigger = (id) => {
  // 1. Lock Grid
  setAnimatingId(id);
  
  // 2. Execute Micro-Simulation
  // (e.g., Flash Camera, Scan Document, Crunch Numbers)
  
  // 3. Reset after 3000ms
  setTimeout(() => setAnimatingId(null), 3000);
};
`;

export function ManualChapter() {
    const [animatingId, setAnimatingId] = useState<string | null>(null);

    const trigger = (id: string) => {
        if (animatingId) return;
        setAnimatingId(id);
        setTimeout(() => setAnimatingId(null), 3000);
    };

    return (
        <ChapterLayout
            chapterNumber="01"
            title="Field Manual"
            subtitle="The definitive guide to the 12 active protocols powering the ecosystem."
            textData={MANUAL_TEXT}
            codeSnippet={GRID_CODE}
            githubPath="src/components/grid/bento-layout.tsx"
        >
            <div className="flex flex-col h-full bg-[#080808] p-4 md:p-8">
                
                {/* THE BENTO GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 h-full min-h-[600px]">
                    
                    {/* --- GROUP 1: INTERFACE LAYER --- */}
                    <InteractiveCard 
                        id="ZEN" title="Zen Preservation" tag="OLED SAFE" icon={Eye} color="zinc" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="CYCLE" title="Cyclic Topology" tag="UX/UI" icon={Activity} color="blue" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="INSPECTOR" title="Vitality Inspector" tag="FORENSICS" icon={Search} color="cyan" 
                        animatingId={animatingId} trigger={trigger} 
                    />

                    {/* --- GROUP 2: DATA LAYER --- */}
                    {/* Wide Card */}
                    <div className="col-span-2">
                        <InteractiveCard 
                            id="PARALLEL" title="Hyper-Parallel Aggregation" tag="BACKEND" icon={GitMerge} color="indigo" 
                            animatingId={animatingId} trigger={trigger} large 
                        />
                    </div>
                    <InteractiveCard 
                        id="STABLE" title="Stable ID v2" tag="IDENTITY" icon={Hash} color="indigo" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="DEDUP" title="Forensic Deduplication" tag="INTEGRITY" icon={Shield} color="emerald" 
                        animatingId={animatingId} trigger={trigger} 
                    />

                    {/* --- GROUP 3: ECONOMIC LAYER --- */}
                    <InteractiveCard 
                        id="STOINC" title="STOINC Simulator" tag="MATH" icon={Zap} color="yellow" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="VELOCITY" title="Yield Velocity" tag="GROWTH" icon={TrendingUp} color="green" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="RIBBON" title="Consistency Ribbon" tag="HISTORY" icon={BarChart3} color="amber" 
                        animatingId={animatingId} trigger={trigger} 
                    />

                    {/* --- GROUP 4: STRATEGIC LAYER --- */}
                    {/* Wide Card */}
                    <div className="col-span-2">
                        <InteractiveCard 
                            id="COMPARE" title="Node Comparison" tag="ANALYTICS" icon={Swords} color="pink" 
                            animatingId={animatingId} trigger={trigger} large 
                        />
                    </div>
                    <InteractiveCard 
                        id="GHOST" title="Ghost Canvas" tag="EXPORT" icon={ScanLine} color="purple" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                    <InteractiveCard 
                        id="CRASH" title="Circuit Breaker" tag="RESILIENCE" icon={WifiOff} color="red" 
                        animatingId={animatingId} trigger={trigger} 
                    />
                </div>
            </div>
        </ChapterLayout>
    );
}

// --- INTERACTIVE CARD COMPONENT ---
function InteractiveCard({ id, title, tag, icon: Icon, color, large, animatingId, trigger }: any) {
    const isActive = animatingId === id;
    const isDimmed = animatingId && animatingId !== id;

    // Theme Config
    const colors: any = {
        blue: "text-blue-400 border-blue-500/20 group-hover:border-blue-500/50 hover:bg-blue-500/5",
        zinc: "text-zinc-400 border-zinc-500/20 group-hover:border-zinc-500/50 hover:bg-zinc-500/5",
        red: "text-red-400 border-red-500/20 group-hover:border-red-500/50 hover:bg-red-500/5",
        indigo: "text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50 hover:bg-indigo-500/5",
        green: "text-green-400 border-green-500/20 group-hover:border-green-500/50 hover:bg-green-500/5",
        purple: "text-purple-400 border-purple-500/20 group-hover:border-purple-500/50 hover:bg-purple-500/5",
        yellow: "text-yellow-400 border-yellow-500/20 group-hover:border-yellow-500/50 hover:bg-yellow-500/5",
        pink: "text-pink-400 border-pink-500/20 group-hover:border-pink-500/50 hover:bg-pink-500/5",
        orange: "text-orange-400 border-orange-500/20 group-hover:border-orange-500/50 hover:bg-orange-500/5",
        cyan: "text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/50 hover:bg-cyan-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50 hover:bg-emerald-500/5",
        amber: "text-amber-400 border-amber-500/20 group-hover:border-amber-500/50 hover:bg-amber-500/5",
    };

    return (
        <button 
            onClick={() => trigger(id)}
            className={`
                relative w-full h-full text-left p-5 rounded-2xl border transition-all duration-300 group overflow-hidden
                ${isDimmed ? 'opacity-30 scale-95 grayscale' : 'opacity-100 scale-100'}
                ${colors[color]}
                ${large ? 'bg-zinc-900/20' : 'bg-[#0c0c0e]'}
            `}
        >
            {/* STANDARD CONTENT */}
            <div className={`flex flex-col justify-between h-full relative z-10 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex justify-between items-start">
                    <Icon size={large ? 28 : 20} className="mb-4" />
                    <span className="text-[9px] font-bold uppercase bg-black border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 tracking-wider">
                        {tag}
                    </span>
                </div>
                <div className={`font-bold flex items-center gap-1 ${large ? 'text-xl' : 'text-sm'} text-zinc-200 group-hover:text-white`}>
                    {title}
                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500"/>
                </div>
            </div>

            {/* --- MICRO-SIMULATIONS (ABSOLUTE OVERLAYS) --- */}
            
            {/* 1. ZEN MODE (Fade Out) */}
            {id === 'ZEN' && isActive && (
                <div className="absolute inset-0 bg-black z-20 flex items-center justify-center animate-[fadeToBlack_2s_ease-in-out]">
                    <div className="text-[10px] text-zinc-800 font-mono tracking-[0.2em] animate-pulse">OLED_SAVING_MODE</div>
                </div>
            )}

            {/* 2. CYCLIC TOPOLOGY (Rotate) */}
            {id === 'CYCLE' && isActive && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="grid grid-cols-2 gap-1 animate-spin duration-1000">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
                        <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    </div>
                </div>
            )}

            {/* 3. VITALITY INSPECTOR (Radial Fill) */}
            {id === 'INSPECTOR' && isActive && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="4" fill="none" />
                        <circle cx="32" cy="32" r="28" stroke="#06b6d4" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset="175" className="animate-[dashOffset_2s_ease-out_forwards]" />
                    </svg>
                </div>
            )}

            {/* 4. HYPER-PARALLEL (Race) */}
            {id === 'PARALLEL' && isActive && (
                <div className="absolute inset-0 flex flex-col justify-center gap-2 px-8 z-20">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/3 animate-[slideRight_1.5s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. STABLE ID (Hash Lock) */}
            {id === 'STABLE' && isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="text-xs font-mono text-indigo-400 font-bold">0x82...AF2</div>
                    <div className="text-[9px] text-zinc-600 mt-1 animate-pulse">IP: 192.168.0.1</div>
                </div>
            )}

            {/* 6. DEDUPLICATION (Merge) */}
            {id === 'DEDUP' && isActive && (
                <div className="absolute inset-0 flex items-center justify-center gap-4 z-20">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[mergeLeft_1.5s_ease-in-out_infinite]"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[mergeRight_1.5s_ease-in-out_infinite]"></div>
                </div>
            )}

            {/* 7. STOINC SIMULATOR (Count Up) */}
            {id === 'STOINC' && isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="text-3xl font-black text-yellow-500 animate-bounce">14.2x</div>
                    <div className="text-[9px] font-bold text-yellow-600 uppercase mt-1">Geometric Mean</div>
                </div>
            )}

            {/* 8. YIELD VELOCITY (Chart Draw) */}
            {id === 'VELOCITY' && isActive && (
                <div className="absolute inset-0 flex items-end justify-center px-8 pb-8 z-20 gap-1">
                    {[20, 40, 60, 30, 80, 50, 90, 100].map((h, i) => (
                        <div key={i} className="w-2 bg-green-500 rounded-t-sm animate-[growUp_0.5s_ease-out_forwards]" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
            )}

            {/* 9. CONSISTENCY RIBBON (Flip) */}
            {id === 'RIBBON' && isActive && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 z-20">
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm animate-pulse"></div>
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm animate-pulse delay-75"></div>
                    <div className="w-4 h-4 bg-amber-500 rounded-sm animate-pulse delay-150"></div>
                    <div className="w-4 h-4 bg-rose-500 rounded-sm animate-pulse delay-200"></div>
                </div>
            )}

            {/* 10. NODE COMPARISON (Bar Swap) */}
            {id === 'COMPARE' && isActive && (
                <div className="absolute inset-0 flex items-end justify-center gap-6 pb-8 z-20">
                    <div className="w-6 bg-pink-500 rounded-t-md animate-[heightSwap1_1.5s_ease-in-out_infinite]" style={{ height: '40%' }}></div>
                    <div className="w-6 bg-zinc-700 rounded-t-md animate-[heightSwap2_1.5s_ease-in-out_infinite]" style={{ height: '80%' }}></div>
                </div>
            )}

            {/* 11. GHOST CANVAS (Scan) */}
            {id === 'GHOST' && isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <ScanLine size={32} className="text-purple-500 mb-2" />
                    <div className="absolute top-0 bottom-0 w-full bg-gradient-to-b from-purple-500/20 to-transparent animate-[scanDown_1.5s_linear_infinite]"></div>
                </div>
            )}

            {/* 12. CIRCUIT BREAKER (Switch) */}
            {id === 'CRASH' && isActive && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <AlertTriangle size={32} className="text-red-500 animate-ping" />
                </div>
            )}

        </button>
    );
}

// Add styles to global or component
// <style>{`
//   @keyframes fadeToBlack { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
//   @keyframes dashOffset { to { stroke-dashoffset: 0; } }
//   @keyframes slideRight { 0% { width: 0; opacity: 0; } 50% { width: 100%; opacity: 1; } 100% { width: 0; opacity: 0; } }
//   @keyframes mergeLeft { 0% { transform: translateX(-20px); opacity: 0; } 50% { transform: translateX(0); opacity: 1; } 100% { opacity: 0; } }
//   @keyframes mergeRight { 0% { transform: translateX(20px); opacity: 0; } 50% { transform: translateX(0); opacity: 1; } 100% { opacity: 0; } }
//   @keyframes growUp { from { height: 0; } }
//   @keyframes heightSwap1 { 0%, 100% { height: 40%; } 50% { height: 80%; } }
//   @keyframes heightSwap2 { 0%, 100% { height: 80%; } 50% { height: 40%; } }
//   @keyframes scanDown { 0% { top: -100%; } 100% { top: 100%; } }
// `}</style>
