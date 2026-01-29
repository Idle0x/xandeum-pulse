import { useState, useEffect, useRef } from 'react';
import { 
    Activity, Eye, Search, Camera, Hash, FileBarChart, Zap, 
    WifiOff, Scale, Globe, Clock, ArrowUpRight, CheckCircle2, 
    ScanLine, Loader2, TrendingUp, BookOpen, Cpu 
} from 'lucide-react';

// --- TEXT CONTENT (Now at the top) ---
const MANUAL_FEATURES = [
    {
        id: "registry",
        icon: <BookOpen size={18} className="text-blue-400" />,
        title: "Protocol Registry",
        content: "The Field Manual indexes the 12 active logic modules within the Xandeum Pulse runtime. These protocols define the operational boundaries of the network, ranging from hardware preservation (Zen Mode) to predictive economic modeling (STOINC)."
    },
    {
        id: "arch",
        icon: <Cpu size={18} className="text-purple-400" />,
        title: "System Architecture",
        content: "Each module operates autonomously but shares a unified state. The 'Ghost Canvas' generator, for instance, pulls data from the same 'Stable ID' ledger as the 'Crash Protocols,' ensuring that diagnostic reports always reflect the exact state of the network at the moment of capture."
    }
];

export function ManualChapter() {
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click Outside to Dismiss
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveCardId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCardClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveCardId(prev => prev === id ? null : id);
    };

    return (
        <section className="max-w-5xl mx-auto px-6 py-24">
            <div className="flex flex-col gap-16">

                {/* --- 1. TOP SECTION: Header & Feature Specs --- */}
                <div className="space-y-10">
                    
                    {/* Header Text */}
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                                Chapter 01
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Field Manual</h2>
                        <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                            The definitive technical index of the protocols, logic modules, and operational standards that power the ecosystem.
                        </p>
                    </div>

                    {/* Feature Cards (Grid on Desktop, Stack on Mobile) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MANUAL_FEATURES.map((feature) => (
                            <div key={feature.id} className="group p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-bold text-white text-base">{feature.title}</h3>
                                </div>
                                <p className="text-sm text-zinc-500 leading-relaxed pl-1">
                                    {feature.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 w-fit">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-zinc-400 font-mono">
                            All Systems Operational
                        </span>
                    </div>

                </div>

                {/* --- 2. BOTTOM SECTION: The Active Registry Grid --- */}
                <div ref={containerRef} className="w-full">
                    {/* Grid Logic:
                        - Mobile: 2 Columns
                        - Desktop: 4 Columns
                        - This allows the "Large Cards" (col-span-2) to take up half a row on desktop, 
                          creating a perfect bento-box feel.
                    */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 group/grid">
                        
                        {/* --- ROW 1 --- */}
                        <ActiveCard 
                            id="cyclic"
                            isActive={activeCardId === 'cyclic'}
                            onClick={handleCardClick}
                            icon={Activity} title="Cyclic Rotation" tag="UX/UI" color="blue" 
                        />
                        <ActiveCard 
                            id="zen"
                            isActive={activeCardId === 'zen'}
                            onClick={handleCardClick}
                            icon={Eye} title="Zen Mode" tag="OLED" color="zinc" 
                        />
                        {/* Large Card: Node Inspector (Takes 2 slots) */}
                        <ActiveCard 
                            id="inspector"
                            isActive={activeCardId === 'inspector'}
                            onClick={handleCardClick}
                            icon={Search} title="Node Inspector" tag="DIAGNOSTICS" color="red" 
                            className="col-span-2 bg-zinc-900/20" 
                        />

                        {/* --- ROW 2 --- */}
                        {/* Large Card: Stable ID (Takes 2 slots) */}
                        <ActiveCard 
                            id="stable_id"
                            isActive={activeCardId === 'stable_id'}
                            onClick={handleCardClick}
                            icon={Hash} title="Stable ID v2" tag="BACKEND" color="indigo" 
                            className="col-span-2" 
                        />
                        <ActiveCard 
                            id="pulse"
                            isActive={activeCardId === 'pulse'}
                            onClick={handleCardClick}
                            icon={Camera} title="Proof of Pulse" tag="SOCIAL" color="green" 
                        />
                        <ActiveCard 
                            id="ghost"
                            isActive={activeCardId === 'ghost'}
                            onClick={handleCardClick}
                            icon={FileBarChart} title="Ghost Canvas" tag="REPORT" color="purple" 
                        />

                        {/* --- ROW 3 --- */}
                        <ActiveCard 
                            id="stoinc"
                            isActive={activeCardId === 'stoinc'}
                            onClick={handleCardClick}
                            icon={Zap} title="STOINC Sim" tag="ECONOMICS" color="yellow" 
                        />
                        <ActiveCard 
                            id="crash"
                            isActive={activeCardId === 'crash'}
                            onClick={handleCardClick}
                            icon={WifiOff} title="Crash Protocols" tag="RESILIENCE" color="red" 
                        />
                        <ActiveCard 
                            id="compare"
                            isActive={activeCardId === 'compare'}
                            onClick={handleCardClick}
                            icon={Scale} title="Comparative" tag="ANALYTICS" color="pink" 
                        />
                        <ActiveCard 
                            id="time"
                            isActive={activeCardId === 'time'}
                            onClick={handleCardClick}
                            icon={Clock} title="Time Machine" tag="TEMPORAL" color="orange" 
                        />

                        {/* --- FOOTER CARD --- */}
                        <ActiveCard 
                            id="king"
                            isActive={activeCardId === 'king'}
                            onClick={handleCardClick}
                            icon={Globe} title="King Node Logic" tag="SPATIAL" color="cyan" 
                            className="col-span-2 md:col-start-2" // Centered on desktop (starts at col 2, spans 2)
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}

// --- SUB-COMPONENTS (Unchanged Logic) ---

function ActiveCard({ id, isActive, onClick, icon: Icon, title, color, tag, className = "" }: any) {
    const colors: any = {
        blue: "text-blue-400 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5",
        zinc: "text-zinc-400 border-zinc-500/20 hover:border-zinc-500/50 hover:bg-zinc-500/5",
        red: "text-red-400 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5",
        indigo: "text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5",
        green: "text-green-400 border-green-500/20 hover:border-green-500/50 hover:bg-green-500/5",
        purple: "text-purple-400 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5",
        yellow: "text-yellow-400 border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/5",
        pink: "text-pink-400 border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/5",
        orange: "text-orange-400 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5",
        cyan: "text-cyan-400 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/5",
    };

    return (
        <div 
            onClick={(e) => onClick(id, e)}
            className={`
                relative overflow-hidden p-5 rounded-2xl border bg-[#080808] transition-all duration-300 group cursor-pointer
                ${isActive ? 'z-20 scale-[1.02] !opacity-100 shadow-2xl !bg-black' : 'hover:z-10 hover:shadow-2xl hover:-translate-y-1 group-hover/grid:opacity-50 hover:!opacity-100'}
                ${isActive ? 'border-white/20' : colors[color]}
                ${className}
            `}
        >
            {isActive ? (
                <SimulationOverlay id={id} color={color} />
            ) : (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <Icon size={20} />
                        <span className="text-[9px] font-bold uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{tag}</span>
                    </div>
                    <div className="font-bold text-white text-sm flex items-center gap-1">
                        {title}
                        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                </>
            )}
        </div>
    )
}

function SimulationOverlay({ id, color }: { id: string, color: string }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer1 = setTimeout(() => setStep(1), 500);  
        const timer2 = setTimeout(() => setStep(2), 2500); 
        return () => { clearTimeout(timer1); clearTimeout(timer2); }
    }, []);

    const txtColor = `text-${color}-400`;

    // --- GHOST CANVAS (Report Gen) ---
    if (id === 'ghost') {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
                {step === 0 && (
                     <div className="flex flex-col items-center gap-2 animate-pulse">
                        <ScanLine size={24} className="text-purple-500" />
                        <span className="text-[10px] uppercase font-bold text-purple-500">Scanning Grid...</span>
                     </div>
                )}
                {step === 1 && (
                    <div className="w-full space-y-1.5 px-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="h-2 w-full bg-purple-500/20 rounded-full overflow-hidden">
                             <div className="h-full bg-purple-500 w-[80%] animate-[progress_2s_ease-out_forwards]"></div>
                        </div>
                        <div className="h-2 w-2/3 bg-zinc-800 rounded-full"></div>
                        <div className="h-2 w-1/2 bg-zinc-800 rounded-full"></div>
                        <span className="text-[9px] text-zinc-500 block text-right pt-1">Compiling High-Res .PNG</span>
                    </div>
                )}
                {step === 2 && (
                    <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300">
                        <CheckCircle2 size={24} className="text-green-500" />
                        <span className="text-[10px] font-bold text-white">Report Generated</span>
                    </div>
                )}
            </div>
        );
    }

    // --- PROOF OF PULSE (Camera) ---
    if (id === 'pulse') {
        return (
            <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                <div className={`absolute inset-0 bg-white mix-blend-overlay transition-opacity duration-300 pointer-events-none ${step === 1 ? 'opacity-50' : 'opacity-0'}`}></div>
                
                {step < 2 ? (
                     <Camera size={24} className={`text-green-500 ${step === 1 ? 'scale-90' : 'scale-100'} transition-transform`} />
                ) : (
                    <div className="bg-white p-1 pb-4 rotate-3 animate-in slide-in-from-bottom-4 shadow-xl">
                         <div className="bg-zinc-900 w-16 h-12 flex items-center justify-center">
                            <Activity size={12} className="text-green-500" />
                         </div>
                         <div className="h-1 mt-1 w-full bg-zinc-200"></div>
                    </div>
                )}
                <span className="text-[9px] uppercase font-bold text-zinc-500 mt-2">
                    {step === 0 ? 'Ready' : step === 1 ? 'Capturing...' : 'Shared'}
                </span>
            </div>
        );
    }

    // --- STOINC SIM (Economics) ---
    if (id === 'stoinc') {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                 <div className="flex items-end gap-1 mb-1">
                    <span className="text-[10px] text-zinc-500">$</span>
                    <span className={`text-2xl font-black font-mono leading-none ${step > 0 ? 'text-yellow-400' : 'text-zinc-700'}`}>
                        {step === 0 ? '0.00' : '4,203'}
                    </span>
                 </div>
                 {step > 0 && (
                     <div className="flex items-center gap-1 text-[10px] text-green-500 animate-in slide-in-from-left-2">
                        <TrendingUp size={12} />
                        <span>+12.5% APY</span>
                     </div>
                 )}
            </div>
        );
    }

    // --- COMPARATIVE (Scale) ---
    if (id === 'compare') {
        return (
            <div className="h-full flex items-end justify-center gap-3 px-4 pb-2">
                <div className="w-8 bg-zinc-800 rounded-t-sm relative overflow-hidden group">
                     <div className={`absolute bottom-0 w-full bg-pink-500/50 transition-all duration-1000 ${step > 0 ? 'h-[60%]' : 'h-0'}`}></div>
                     <span className="absolute -top-4 w-full text-center text-[9px] text-zinc-500">A</span>
                </div>
                <div className="w-8 bg-zinc-800 rounded-t-sm relative overflow-hidden">
                     <div className={`absolute bottom-0 w-full bg-pink-500 transition-all duration-1000 delay-100 ${step > 0 ? 'h-[90%]' : 'h-0'}`}></div>
                     <span className="absolute -top-4 w-full text-center text-[9px] text-zinc-500">B</span>
                </div>
            </div>
        );
    }

    // --- DEFAULT LOADING SIM ---
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <Loader2 size={20} className={`animate-spin mb-2 ${txtColor}`} />
            <span className="text-[9px] uppercase font-bold text-zinc-500">Initializing {id}...</span>
        </div>
    );
}
