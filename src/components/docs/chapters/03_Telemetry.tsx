import { useState, useEffect } from 'react';
import { Monitor, Eye, LayoutGrid, LayoutList, RefreshCw, Wifi, EyeOff, Zap, Server } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const TELEMETRY_TEXT = [
    {
        title: "Hybrid-Density Topology",
        content: "The Pulse interface is built on a Hybrid-Density Topology designed to adapt to different operator needs. Whether you are performing a macro-audit of 1,000+ nodes (List View) or deep-diving into a single validator's vitals (Grid View), the dashboard manages data density through intelligent metric rotation."
    },
    {
        title: "OLED Preservation Protocol",
        content: "Beyond visualization, the platform incorporates a Hardware Preservation Protocol (Zen Mode). 24/7 monitoring leads to screen burn-in. Engaging Zen Mode strips the UI of all blurs, gradients, and animations, rendering the entire dashboard in high-contrast OLED black to minimize light emission."
    }
];

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
    const [metricIndex, setMetricIndex] = useState(0);

    // Cyclic Metric Logic (Simulates data rotation in Grid View)
    useEffect(() => {
        const i = setInterval(() => setMetricIndex(p => (p + 1) % 3), 3000);
        return () => clearInterval(i);
    }, []);

    return (
        <ChapterLayout
            chapterNumber="02"
            title="Telemetry & UX"
            subtitle="Adapting data density for macro-audits and hardware preservation."
            textData={TELEMETRY_TEXT}
            // FIX: Pass empty strings to satisfy TypeScript strict mode
            codeSnippet=""
            githubPath=""
        >
            <div className={`h-full min-h-[500px] rounded-3xl relative overflow-hidden transition-all duration-1000 border ${zenMode ? 'bg-black border-zinc-900' : 'bg-[#09090b] border-zinc-800'}`}>
                
                {/* --- 1. GLOBAL DIMMER OVERLAY --- 
                    This sits on top of content to simulate full-screen dimming, 
                    but below the controls (z-20 vs z-30) so you can turn it off. 
                */}
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none z-20 ${zenMode ? 'opacity-95' : 'opacity-0'}`}
                ></div>

                {/* --- 2. HEADER CONTROLS (Z-30 to stay clickable) --- */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 border-b border-white/5 bg-gradient-to-b from-black/50 to-transparent">
                    
                    {/* Layout Switcher */}
                    <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 backdrop-blur-md">
                        <button 
                            onClick={() => setLayoutMode('GRID')}
                            className={`p-2 rounded-md transition-all ${layoutMode === 'GRID' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Grid Topology (Micro)"
                        >
                            <LayoutGrid size={16}/>
                        </button>
                        <button 
                            onClick={() => setLayoutMode('LIST')}
                            className={`p-2 rounded-md transition-all ${layoutMode === 'LIST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="List Topology (Macro)"
                        >
                            <LayoutList size={16}/>
                        </button>
                    </div>

                    {/* Zen Toggle */}
                    <button 
                        onClick={() => setZenMode(!zenMode)}
                        className={`
                            group relative px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 overflow-hidden
                            ${zenMode 
                                ? 'bg-zinc-900 border-zinc-800 text-emerald-500 hover:bg-zinc-800' 
                                : 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'
                            }
                        `}
                    >
                        <div className="relative z-10 flex items-center gap-2">
                            {zenMode ? <Eye size={14}/> : <EyeOff size={14}/>} 
                            {zenMode ? 'ZEN ACTIVE' : 'ENGAGE ZEN'}
                        </div>
                    </button>
                </div>

                {/* --- 3. MAIN SIMULATION CONTENT --- */}
                <div className="pt-24 px-6 pb-6 h-full overflow-y-auto custom-scrollbar relative z-10">
                    
                    {layoutMode === 'GRID' ? (
                        // --- GRID MODE: CYCLIC METRICS ---
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`p-5 rounded-2xl border transition-all duration-500 ${zenMode ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'}`}>
                                    <div className="flex justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${zenMode ? 'bg-zinc-900 text-zinc-700' : 'bg-blue-500/10 text-blue-400'}`}>
                                                <Server size={14} />
                                            </div>
                                            <div>
                                                <div className={`text-xs font-bold ${zenMode ? 'text-zinc-600' : 'text-zinc-200'}`}>Validator-0{i}</div>
                                                <div className="text-[9px] font-mono text-zinc-600">192.168.0.{i}</div>
                                            </div>
                                        </div>
                                        {/* Status Dot */}
                                        <div className={`w-2 h-2 rounded-full ${zenMode ? 'bg-zinc-800' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                                    </div>

                                    {/* The Cyclic Metric Area */}
                                    <div className="bg-black/40 rounded-lg p-3 border border-white/5 relative overflow-hidden h-14 flex items-center">
                                        <div className={`absolute inset-0 flex items-center justify-between px-4 transition-all duration-500 ${metricIndex === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Health Score</span>
                                            <span className={`font-mono text-lg font-bold ${zenMode ? 'text-zinc-500' : 'text-white'}`}>98.5%</span>
                                        </div>
                                        <div className={`absolute inset-0 flex items-center justify-between px-4 transition-all duration-500 ${metricIndex === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Storage Cap</span>
                                            <span className={`font-mono text-lg font-bold ${zenMode ? 'text-zinc-500' : 'text-blue-400'}`}>1.2 PB</span>
                                        </div>
                                        <div className={`absolute inset-0 flex items-center justify-between px-4 transition-all duration-500 ${metricIndex === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Uptime</span>
                                            <span className={`font-mono text-lg font-bold ${zenMode ? 'text-zinc-500' : 'text-emerald-400'}`}>14d 2h</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                                            <RefreshCw size={8} className={zenMode ? '' : 'animate-spin'} /> Cycling Telemetry
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // --- LIST MODE: HIGH DENSITY ---
                        <div className="flex flex-col gap-2">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50">
                                <span>Identity</span>
                                <span>Location</span>
                                <span>Health</span>
                                <span className="text-right">Capacity</span>
                            </div>
                            
                            {/* Rows */}
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`grid grid-cols-4 px-4 py-3 rounded-lg border items-center transition-colors ${zenMode ? 'border-zinc-900 text-zinc-700 bg-black' : 'border-zinc-800/50 hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${zenMode ? 'bg-zinc-800' : 'bg-emerald-500'}`}></div>
                                        <span className="font-mono text-xs">0x82...{i}A</span>
                                    </div>
                                    <span className="text-xs">Tokyo, JP</span>
                                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${zenMode ? 'bg-zinc-700' : 'bg-emerald-500'}`} style={{ width: `${80 + (i*2)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-mono text-right">{1.2 + (i * 0.1)} PB</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </ChapterLayout>
    );
}
