import { useState, useEffect } from 'react';
import { Eye, LayoutGrid, LayoutList, RefreshCw, Wifi, EyeOff, Cpu, Zap, Activity } from 'lucide-react';

// --- DATA: Feature Highlights (Replaces Code) ---
const TELEMETRY_FEATURES = [
    {
        id: "density",
        icon: <Activity size={18} className="text-blue-400" />,
        title: "Hybrid-Density Topology",
        content: "The Pulse interface adapts to operator needs. It automatically switches between high-fidelity 'Card Views' for single-validator deep dives and compressed 'List Views' for macro-audits of 1,000+ nodes."
    },
    {
        id: "oled",
        icon: <Zap size={18} className="text-yellow-400" />,
        title: "OLED Preservation Protocol",
        content: "24/7 monitoring causes screen burn-in. 'Zen Mode' is a hardware-safety feature that eliminates blurs, gradients, and static pixels, rendering the dashboard in pure #000000 to minimize organic light emission."
    }
];

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
    const [metricIndex, setMetricIndex] = useState(0);

    // Cyclic Metric Logic (Simulates live data)
    useEffect(() => {
        const i = setInterval(() => setMetricIndex(p => (p + 1) % 3), 4000);
        return () => clearInterval(i);
    }, []);

    return (
        <section className="max-w-7xl mx-auto px-6 py-24 relative">
            
            {/* --- GLOBAL ZEN OVERLAY --- 
                This covers the ENTIRE screen (fixed inset-0) when active.
                z-index 40 ensures it covers the sidebar/header of the main site 
                but sits below the simulation content (z-50).
            */}
            <div 
                className={`fixed inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${zenMode ? 'opacity-100 z-[40]' : 'opacity-0 z-[-1]'}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* --- LEFT COL: The Simulation (Span 7) --- */}
                {/* We add z-50 here so this specific container stays visible above the black overlay in Zen Mode */}
                <div className={`lg:col-span-7 flex flex-col gap-6 relative transition-all duration-1000 ${zenMode ? 'z-[50]' : 'z-0'}`}>
                    
                    {/* SIMULATION CONTAINER */}
                    <div className={`
                        w-full rounded-3xl overflow-hidden border transition-all duration-1000 relative min-h-[500px] flex flex-col
                        ${zenMode ? 'bg-black border-zinc-900 shadow-none' : 'bg-[#09090b] border-zinc-800 shadow-2xl'}
                    `}>
                        
                        {/* 1. CONTROL DECK (Header) */}
                        <div className={`
                            flex items-center justify-between px-6 py-4 border-b transition-colors duration-1000
                            ${zenMode ? 'border-zinc-900 bg-black' : 'border-zinc-800 bg-zinc-900/50'}
                        `}>
                            {/* Layout Switcher */}
                            <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
                                <button 
                                    onClick={() => setLayoutMode('GRID')}
                                    className={`p-1.5 rounded-md transition-all ${layoutMode === 'GRID' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <LayoutGrid size={14}/>
                                </button>
                                <button 
                                    onClick={() => setLayoutMode('LIST')}
                                    className={`p-1.5 rounded-md transition-all ${layoutMode === 'LIST' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <LayoutList size={14}/>
                                </button>
                            </div>

                            {/* Zen Toggle (High Visibility) */}
                            <button 
                                onClick={() => setZenMode(!zenMode)}
                                className={`
                                    group relative pl-3 pr-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 flex items-center gap-2
                                    ${zenMode 
                                        ? 'bg-zinc-900 border-zinc-800 text-green-500 hover:bg-zinc-800' 
                                        : 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'
                                    }
                                `}
                            >
                                {zenMode ? <Eye size={12}/> : <EyeOff size={12}/>}
                                {zenMode ? 'System Safe' : 'Zen Mode Off'}
                            </button>
                        </div>

                        {/* 2. DATA VIEWPORT */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            {layoutMode === 'GRID' ? (
                                // GRID MODE
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`p-5 rounded-xl border transition-all duration-1000 ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/30 border-zinc-700/50 hover:border-zinc-600'}`}>
                                            <div className="flex justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${zenMode ? 'bg-zinc-800' : 'bg-green-500 animate-pulse'}`}></div>
                                                    <span className={`font-mono text-xs ${zenMode ? 'text-zinc-600' : 'text-zinc-300'}`}>0x82...9A</span>
                                                </div>
                                                <Wifi size={12} className="text-zinc-600"/>
                                            </div>
                                            
                                            {/* Cycling Metrics Area */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                                                    <span className="text-[10px] uppercase text-zinc-600 font-bold">Health</span>
                                                    <span className={`text-xs font-mono ${zenMode ? 'text-zinc-500' : 'text-green-400'}`}>98.2%</span>
                                                </div>
                                                
                                                <div className="relative h-5 overflow-hidden">
                                                    <div className={`absolute w-full transition-all duration-500 flex justify-between items-center ${metricIndex === 0 ? 'top-0 opacity-100' : '-top-5 opacity-0'}`}>
                                                        <span className="text-[10px] uppercase text-zinc-600 font-bold">Storage</span>
                                                        <span className="text-xs font-mono text-zinc-400">1.2 PB</span>
                                                    </div>
                                                    <div className={`absolute w-full transition-all duration-500 flex justify-between items-center ${metricIndex === 1 ? 'top-0 opacity-100' : '-top-5 opacity-0'}`}>
                                                        <span className="text-[10px] uppercase text-zinc-600 font-bold">Uptime</span>
                                                        <span className="text-xs font-mono text-zinc-400">14d 2h</span>
                                                    </div>
                                                    <div className={`absolute w-full transition-all duration-500 flex justify-between items-center ${metricIndex === 2 ? 'top-0 opacity-100' : '-top-5 opacity-0'}`}>
                                                        <span className="text-[10px] uppercase text-zinc-600 font-bold">Version</span>
                                                        <span className="text-xs font-mono text-zinc-400">v1.0.4</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // LIST MODE
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${zenMode ? 'border-zinc-900 text-zinc-600' : 'bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900 text-zinc-400'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-1 rounded-full ${zenMode ? 'bg-zinc-800' : 'bg-blue-500'}`}></div>
                                                <span className="text-xs font-mono">0x82...9A</span>
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-600 hidden sm:block">Tokyo, JP</span>
                                            <div className="flex gap-4">
                                                <span className={`text-xs font-mono w-12 text-right ${zenMode ? 'text-zinc-700' : 'text-green-500'}`}>98%</span>
                                                <span className="text-xs font-mono w-16 text-right">1.2PB</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Caption for Simulation */}
                    <div className={`flex items-center gap-2 justify-center transition-opacity duration-500 ${zenMode ? 'opacity-0' : 'opacity-100'}`}>
                        <RefreshCw size={12} className="text-zinc-600 animate-spin-slow"/>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Live Simulation Active</span>
                    </div>
                </div>

                {/* --- RIGHT COL: Feature Specs (Span 5) --- */}
                {/* Replaces the code block. This fades out in Zen Mode to focus on data. */}
                <div className={`lg:col-span-5 space-y-8 pt-4 transition-opacity duration-1000 ${zenMode ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Telemetry & UX</h2>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            The Xandeum Pulse dashboard isn't just a data dump. It is an intelligent surface that manages cognitive load and hardware longevity through adaptive layouts.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {TELEMETRY_FEATURES.map((feature) => (
                            <div key={feature.id} className="group p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed pl-1">
                                    {feature.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <Cpu size={16} className="text-blue-500" />
                        <span className="text-xs text-blue-300 font-mono">
                            src/components/ui/telemetry-engine.tsx
                        </span>
                    </div>

                </div>

            </div>
        </section>
    );
}
