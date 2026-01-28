import { useState, useEffect } from 'react';
import { 
    Monitor, Eye, LayoutGrid, RefreshCw, Activity, Share2, 
    Wifi, CheckCircle2, ChevronRight, LayoutList 
} from 'lucide-react';

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [cycleMetric, setCycleMetric] = useState(0);

    // Metric Rotation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setCycleMetric(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`
            relative w-full py-24 transition-colors duration-1000 ease-in-out border-y border-zinc-900
            ${zenMode ? 'bg-black' : 'bg-[#09090b]'}
        `}>
            {/* Zen Overlay: Adds a scanline texture when Zen Mode is OFF */}
            {!zenMode && (
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
            )}

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div className="max-w-2xl">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 transition-colors duration-1000 ${zenMode ? 'bg-zinc-900 text-zinc-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Monitor size={12}/> Interface Topology
                        </div>
                        <h2 className={`text-4xl md:text-5xl font-black tracking-tighter transition-colors duration-1000 ${zenMode ? 'text-zinc-500' : 'text-white'}`}>
                            Telemetry & <br/> User Experience
                        </h2>
                    </div>
                    
                    {/* The Zen Switch - Styled like a physical slider */}
                    <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-1000 ${zenMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {zenMode ? 'OLED SAVER ACTIVE' : 'STANDARD MODE'}
                        </span>
                        <button 
                            onClick={() => setZenMode(!zenMode)}
                            className={`
                                relative w-16 h-8 rounded-full border transition-all duration-500
                                ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-800 border-zinc-700 shadow-inner'}
                            `}
                        >
                            <div className={`
                                absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center
                                ${zenMode ? 'translate-x-0 bg-zinc-800' : 'translate-x-8 bg-white'}
                            `}>
                                <Eye size={12} className={zenMode ? 'text-zinc-600' : 'text-black'}/>
                            </div>
                        </button>
                    </div>
                </div>

                {/* THE GRID SYSTEM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 1. VISUALIZER CARD (Cyclic Metrics) */}
                    <div className={`
                        lg:col-span-2 rounded-[2.5rem] p-10 border transition-all duration-1000 flex flex-col justify-between
                        ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/30 border-zinc-800 hover:border-blue-500/30'}
                    `}>
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className={`text-2xl font-bold mb-2 ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Metric Cycler</h3>
                                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                                    To conserve screen real-estate, tertiary metric slots rotate automatically every 5 seconds.
                                </p>
                            </div>
                            <RefreshCw size={20} className={`transition-all duration-1000 ${zenMode ? 'text-zinc-800' : 'text-blue-500 animate-spin [animation-duration:8s]'}`} />
                        </div>

                        {/* The Metric Card Simulation */}
                        <div className={`p-6 rounded-2xl border transition-all duration-1000 ${zenMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-black border-zinc-700 shadow-2xl'}`}>
                            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${zenMode ? 'bg-zinc-700' : 'bg-green-500 animate-pulse'}`}></div>
                                    <span className="text-xs font-bold text-zinc-300">Validator 0x82...9A</span>
                                </div>
                                <Wifi size={14} className="text-zinc-600"/>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Region</div>
                                    <div className="text-sm font-mono text-zinc-400">Tokyo, JP</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Status</div>
                                    <div className="text-sm font-mono text-zinc-400">Optimized</div>
                                </div>
                                {/* The Cycling Slot */}
                                <div className="relative overflow-hidden">
                                    <div className="text-[9px] font-bold text-blue-500 uppercase mb-1 flex items-center gap-1">
                                        <RefreshCw size={8} className="animate-spin"/> Cycling
                                    </div>
                                    <div className="h-6 relative">
                                        <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${cycleMetric === 0 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                                            <span className="text-sm font-mono text-white font-bold">Health: 98%</span>
                                        </div>
                                        <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${cycleMetric === 1 ? 'translate-y-0 opacity-100' : cycleMetric < 1 ? 'translate-y-4 opacity-0' : '-translate-y-4 opacity-0'}`}>
                                            <span className="text-sm font-mono text-white font-bold">Stor: 1.2PB</span>
                                        </div>
                                        <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${cycleMetric === 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                            <span className="text-sm font-mono text-white font-bold">Up: 14d 5h</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. LAYOUT SWITCHER */}
                    <div className={`
                        rounded-[2.5rem] p-10 border transition-all duration-1000 flex flex-col justify-center gap-6
                        ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}
                    `}>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">View Modes</div>
                            <h3 className={`text-2xl font-bold mb-4 ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Adaptive Topology</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors ${zenMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}>
                                <LayoutGrid size={24} className={zenMode ? 'text-zinc-600' : 'text-white'} />
                                <span className="text-[9px] font-bold uppercase text-zinc-500">Grid Mode</span>
                            </div>
                            <div className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors ${zenMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}>
                                <LayoutList size={24} className="text-zinc-600" />
                                <span className="text-[9px] font-bold uppercase text-zinc-500">List Mode</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. PROOF OF PULSE (Full Width Bottom) */}
                    <div className={`
                        lg:col-span-3 rounded-[2.5rem] p-12 border overflow-hidden relative group
                        ${zenMode ? 'bg-black border-zinc-800' : 'bg-gradient-to-br from-[#0f0f11] to-black border-zinc-800'}
                    `}>
                        <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full transition-opacity duration-1000 ${zenMode ? 'opacity-0' : 'opacity-100'}`}></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                            <div className="flex-1 space-y-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${zenMode ? 'bg-zinc-900 text-zinc-600' : 'bg-purple-500/10 text-purple-400'}`}>
                                    <Share2 size={12}/> Social Infrastructure
                                </div>
                                <h3 className={`text-3xl font-bold ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Proof of Pulse</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm max-w-md">
                                    Generates a verifiable, cryptographic snapshot of a node's health status. 
                                    Ready for instant social verification on X (Twitter) or Discord.
                                </p>
                                <button className={`
                                    flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all
                                    ${zenMode ? 'border-zinc-800 text-zinc-600 hover:bg-zinc-900' : 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white'}
                                `}>
                                    Generate Report <ChevronRight size={14}/>
                                </button>
                            </div>

                            {/* The Report Card Visual */}
                            <div className={`
                                w-full max-w-sm rounded-3xl p-6 border shadow-2xl rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105
                                ${zenMode ? 'bg-black border-zinc-800 grayscale' : 'bg-[#050505] border-zinc-700 shadow-purple-900/20'}
                            `}>
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-900 rounded-lg text-purple-500 border border-zinc-800">
                                            <Activity size={20} />
                                        </div>
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">Pulse Report</div>
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-500">2026-01-25</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Vitality</div>
                                        <div className="text-2xl font-black text-green-400">98.4</div>
                                    </div>
                                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Credits</div>
                                        <div className="text-2xl font-black text-white">5.4M</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                                    <CheckCircle2 size={12} className="text-green-500"/> Sig_Verified_0x9A
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
