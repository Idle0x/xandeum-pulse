import { useState } from 'react';
import { Grid, Monitor, Eye, LayoutList, LayoutGrid } from 'lucide-react';

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);

    return (
        <div className={`transition-colors duration-700 ${zenMode ? 'bg-black' : ''}`}>
            <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-24">
                
                {/* 1. View Modes (Static Explanation) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-in fade-in slide-in-from-right duration-700">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase mb-4">
                            <Grid size={12}/> Topology States
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4">Grid vs. List Topology</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm mb-6">
                            Operators need different data densities. Pulse offers two distinct view modes that persist via <code className="text-emerald-400">localStorage</code>.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4">
                                <div className="p-2 bg-black rounded border border-zinc-700"><LayoutGrid size={20} className="text-emerald-500"/></div>
                                <div>
                                    <strong className="text-white text-sm block">Grid Mode (Visual)</strong>
                                    <span className="text-xs text-zinc-500">Best for "At-a-glance" monitoring. Features cyclic metric rotation.</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4">
                                <div className="p-2 bg-black rounded border border-zinc-700"><LayoutList size={20} className="text-zinc-400"/></div>
                                <div>
                                    <strong className="text-white text-sm block">List Mode (Data)</strong>
                                    <span className="text-xs text-zinc-500">High-density table showing raw IP, Version, and Credit counts.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 2. Zen Mode Simulator */}
                    <div className={`p-8 rounded-3xl border transition-all duration-700 ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/20 border-zinc-800'}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className={`text-2xl font-bold mb-2 ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Zen Mode Protocol</h3>
                                <p className="text-xs text-zinc-500 max-w-xs">
                                    Simulate the OLED-saving protocol. Strips all color/gradients to pure black.
                                </p>
                            </div>
                            <button 
                                onClick={() => setZenMode(!zenMode)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${zenMode ? 'bg-zinc-700' : 'bg-emerald-500'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${zenMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        {/* Dummy Card that reacts to Zen Mode */}
                        <div className={`h-40 rounded-xl p-6 flex flex-col justify-between transition-all duration-700 ${zenMode ? 'bg-black border border-zinc-800 grayscale' : 'bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 shadow-xl'}`}>
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-zinc-500">NODE-8X</span>
                                <div className={`w-2 h-2 rounded-full ${zenMode ? 'bg-zinc-500' : 'bg-green-500 animate-pulse'}`}></div>
                            </div>
                            <div className={`text-4xl font-bold ${zenMode ? 'text-zinc-300' : 'text-white'}`}>98%</div>
                            <div className="text-[10px] text-zinc-600 font-mono uppercase">VITALITY SCORE</div>
                        </div>
                        <div className="mt-4 text-[10px] text-center text-zinc-600 font-mono">
                            {zenMode ? 'GRADIENTS DISABLED // PIXELS OFF' : 'STANDARD UI ACTIVE'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
