import { useState, useEffect } from 'react';
import { Grid, Monitor, Eye, LayoutList, LayoutGrid, RefreshCw, Share2, FileImage, Activity } from 'lucide-react';

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [cycleMetric, setCycleMetric] = useState(0);

    // Metric Rotation Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setCycleMetric(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`transition-all duration-700 ease-in-out ${zenMode ? 'bg-[#000000]' : ''}`}>
            <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-24">
                
                {/* Header: Professional Explanation */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Monitor size={12}/> Interface Architecture
                    </div>
                    <h2 className={`text-4xl font-bold mb-8 tracking-tight ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Telemetry & User Experience</h2>
                    
                    <div className="max-w-4xl mx-auto text-left space-y-6">
                        <p className={`text-base leading-relaxed ${zenMode ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            The Pulse interface is built on a <strong>Hybrid-Density Topology</strong> designed to adapt to different operator needs. Whether you are performing a macro-audit of 1,000+ nodes or deep-diving into a single validator's vitals, the dashboard manages data density through intelligent metric rotation and layout switching. This ensures that critical performance indicators remain visible without overwhelming the operator's mental map, maintaining a balance between aesthetic high-fidelity and pure tactical utility.
                        </p>
                        <p className={`text-base leading-relaxed ${zenMode ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            Beyond visualization, the platform incorporates a <strong>Hardware Preservation Protocol</strong> (Zen Mode) and a <strong>Social Verification Engine</strong> (Proof of Pulse). These features transform the dashboard from a passive monitor into an active tool for long-term fleet management and community trust-building. By prioritizing OLED pixel longevity and generating cryptographic health snapshots, Pulse serves as both a command center for the present and a verifiable record for the future of your network participation.
                        </p>
                        <div className="pt-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-zinc-800"></div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Why it matters: Operational clarity reduces reaction time.</span>
                            <div className="h-px flex-1 bg-zinc-800"></div>
                        </div>
                    </div>
                </div>

                {/* 1. LAYOUT TOPOLOGY (Grid vs List) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><LayoutGrid size={20}/></div>
                            <h3 className={`text-2xl font-bold ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Adaptive View Modes</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Pulse offers two distinct layout modes that persist via <code>localStorage</code>. Operators can choose between the <strong>Visual Grid</strong> for rapid health identification or the <strong>High-Density List</strong> for granular fleet comparisons and bulk data management.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center gap-2">
                                <LayoutGrid size={24} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Grid Mode</span>
                            </div>
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center gap-2">
                                <LayoutList size={24} className="text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">List Mode</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. CYCLIC METRICS (Visualizer) */}
                    <div className={`p-8 rounded-3xl border transition-all duration-500 ${zenMode ? 'bg-black border-zinc-800' : 'bg-zinc-900/20 border-blue-500/30 shadow-2xl shadow-blue-500/10'}`}>
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Feature: Card Cycle</div>
                                <h4 className={`text-lg font-bold ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Cyclic Metric Rotation</h4>
                            </div>
                            <RefreshCw size={16} className="text-blue-500 animate-spin [animation-duration:8s]" />
                        </div>
                        
                        <div className="space-y-6">
                             <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 border-b border-zinc-800 pb-2">
                                <span>Metric Slot A</span>
                                <span className="text-white">IP / Location</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 border-b border-zinc-800 pb-2">
                                <span>Metric Slot B</span>
                                <span className="text-white">Status / Network</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 border-b border-zinc-800 pb-2 relative overflow-hidden">
                                <span className="text-blue-400 font-bold">Metric Slot C (Cycling)</span>
                                <span className={`text-white font-bold transition-all duration-500 key={cycleMetric} animate-in fade-in slide-in-from-right-2`}>
                                    {cycleMetric === 0 ? 'Vitality: 98%' : cycleMetric === 1 ? 'Storage: 1.2 PB' : 'Uptime: 14d 5h'}
                                </span>
                             </div>
                        </div>
                        <p className="mt-6 text-[10px] text-zinc-500 italic leading-relaxed">
                            Card Slot C automatically rotates every 5 seconds to maximize information density without expanding card height.
                        </p>
                    </div>
                </div>

                {/* 3. ZEN MODE & HARDWARE (Interactive Switch) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 flex flex-col items-center">
                        <div className={`p-10 rounded-[3rem] border-2 transition-all duration-700 w-full flex flex-col items-center ${zenMode ? 'bg-black border-zinc-800 shadow-none' : 'bg-emerald-500/5 border-emerald-500/20 shadow-2xl shadow-emerald-500/10'}`}>
                            <div className={`mb-8 p-6 rounded-full transition-all duration-700 ${zenMode ? 'bg-zinc-900 text-zinc-600' : 'bg-emerald-500 text-black'}`}>
                                <Eye size={48} />
                            </div>
                            <button 
                                onClick={() => setZenMode(!zenMode)}
                                className={`w-full py-4 rounded-2xl font-black text-sm tracking-[0.2em] transition-all ${zenMode ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700' : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}
                            >
                                {zenMode ? 'RESTORE INTERFACE' : 'ENGAGE ZEN MODE'}
                            </button>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase mb-4">
                            <Monitor size={12}/> OLED Protocol
                        </div>
                        <h3 className={`text-3xl font-bold tracking-tight ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Hardware Preservation</h3>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            24/7 monitoring leads to screen burn-in. Engaging <strong>Zen Mode</strong> strips the UI of all blurs, gradients, and animations, rendering the entire dashboard in high-contrast OLED black. This minimizes light emission and preserves the lifespan of physical monitoring equipment.
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div> NO BLURS
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div> NO GRADIENTS
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div> NO ANIMATIONS
                        </div>
                    </div>
                </div>

                {/* 4. PROOF OF PULSE / SOCIAL ENGINE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase mb-4">
                            <Share2 size={12}/> Social Infrastructure
                        </div>
                        <h3 className={`text-3xl font-bold tracking-tight ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Proof of Pulse</h3>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            The <strong>Social Verification Engine</strong> allows you to prove your commitment to the network. By generating a "Proof of Pulse" report card, you create a high-fidelity, cryptographic snapshot of your node's performance that is ready for instant social verification.
                        </p>
                        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-purple-900/20 rounded-xl text-purple-400"><FileImage size={24}/></div>
                            <div>
                                <div className="text-xs font-bold text-white mb-1">Export Logic</div>
                                <div className="text-[10px] text-zinc-500">2x scale PNG generation with verified server-side timestamps.</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Report Card Visual Simulation */}
                    <div className={`p-1 rounded-[2.5rem] bg-gradient-to-br transition-all duration-700 ${zenMode ? 'from-zinc-800 to-zinc-900' : 'from-purple-500 via-pink-500 to-blue-500 shadow-2xl shadow-purple-500/10'}`}>
                        <div className="bg-[#050505] p-8 rounded-[2.3rem] relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 p-24 bg-purple-500/10 blur-[80px] rounded-full"></div>
                            <div className="relative z-10 text-center flex flex-col h-full justify-between">
                                <div>
                                    <div className="inline-block p-4 bg-zinc-900 rounded-2xl mb-6 border border-zinc-800">
                                        <Activity size={32} className="text-purple-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-1 tracking-tighter">PROOF OF PULSE</h3>
                                    <div className="text-[10px] font-mono text-zinc-500 mb-8 uppercase tracking-widest">Node: 8x...2A • Verified Snapshot</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-widest">Health</div>
                                        <div className="text-3xl font-black text-green-400 tracking-tighter">98</div>
                                    </div>
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-widest">Credits</div>
                                        <div className="text-3xl font-black text-yellow-500 tracking-tighter">5.4M</div>
                                    </div>
                                </div>
                                
                                <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em] mt-4">
                                    Auth-Sig: XND-PULSE-2026-01-25
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
