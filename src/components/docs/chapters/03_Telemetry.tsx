import { useState, useEffect } from 'react';
import { Grid, Monitor, Eye, LayoutList, LayoutGrid, RefreshCw, Share2, FileImage } from 'lucide-react';

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [cycleMetric, setCycleMetric] = useState(0);

    // Cyclic Rotation Simulator
    useEffect(() => {
        const interval = setInterval(() => {
            setCycleMetric(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`transition-colors duration-700 ease-in-out ${zenMode ? 'bg-black' : ''}`}>
            <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-24">
                
                {/* Context Header */}
                <div className="text-center">
                    <h2 className={`text-3xl font-bold mb-4 ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Telemetry & UX</h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-base">
                        Pulse uses advanced UI topology to manage data density. This section explains how we handle visualization, hardware preservation, and social reporting.
                    </p>
                </div>

                {/* 1. CYCLIC METRICS (Visualizer) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase mb-4">
                            <RefreshCw size={12}/> Data Density
                        </div>
                        <h3 className={`text-2xl font-bold mb-4 ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Cyclic Metric Rotation</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Screen real estate is valuable. Instead of cluttering the card with 3 different numbers, we automatically cycle the "Tertiary Metric" every 5 seconds.
                        </p>
                        <div className="mt-6 flex gap-2 text-[10px] font-mono text-zinc-500">
                            <span className={cycleMetric === 0 ? 'text-blue-400 font-bold' : ''}>1. VITALITY</span> &rarr;
                            <span className={cycleMetric === 1 ? 'text-blue-400 font-bold' : ''}>2. STORAGE</span> &rarr;
                            <span className={cycleMetric === 2 ? 'text-blue-400 font-bold' : ''}>3. UPTIME</span>
                        </div>
                    </div>
                    
                    {/* The Card Simulator */}
                    <div className={`w-full max-w-xs mx-auto h-48 rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ${zenMode ? 'border border-zinc-800 bg-black' : 'border border-blue-500/30 bg-zinc-900/50 shadow-2xl shadow-blue-500/10'}`}>
                        <div className="flex justify-between items-start">
                            <div className="text-xs font-bold text-zinc-500">NODE-8X...2A</div>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider transition-all">
                                {cycleMetric === 0 ? 'Vitality Score' : cycleMetric === 1 ? 'Storage Used' : 'Uptime Duration'}
                            </div>
                            <div className={`text-4xl font-black transition-all ${zenMode ? 'text-zinc-300' : 'text-white'}`}>
                                {cycleMetric === 0 ? '98%' : cycleMetric === 1 ? '1.2 PB' : '14d 5h'}
                            </div>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-4">
                            <div className="h-full bg-blue-500 animate-[progress_3s_linear_infinite]"></div>
                        </div>
                    </div>
                </div>

                {/* 2. ZEN MODE (Interactive Switch) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 bg-zinc-900/20 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                        <div className={`mb-6 p-4 rounded-full transition-all duration-700 ${zenMode ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            <Eye size={32} />
                        </div>
                        <h4 className={`text-lg font-bold mb-2 ${zenMode ? 'text-zinc-500' : 'text-white'}`}>Simulation Control</h4>
                        <button 
                            onClick={() => setZenMode(!zenMode)}
                            className={`px-6 py-2 rounded-full font-bold text-xs transition-all ${zenMode ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
                        >
                            {zenMode ? 'DISABLE ZEN MODE' : 'ENABLE ZEN MODE'}
                        </button>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase mb-4">
                            <Monitor size={12}/> Hardware Preservation
                        </div>
                        <h3 className={`text-2xl font-bold mb-4 ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Zen Mode Protocol</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Dedicated monitoring walls run 24/7. Standard UI gradients cause pixel burn-in on OLED screens. 
                            Zen Mode strips the UI to pure <code className="text-zinc-300">#000000</code> black and grays.
                            <br/><br/>
                            Try the toggle to see how the documentation page itself adapts to this protocol.
                        </p>
                    </div>
                </div>

                {/* 3. REPORT CARD / PROOF OF PULSE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase mb-4">
                            <Share2 size={12}/> Social Export
                        </div>
                        <h3 className={`text-2xl font-bold mb-4 ${zenMode ? 'text-zinc-300' : 'text-white'}`}>Proof of Pulse</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm mb-6">
                            Operators need to prove their reliability. The "Proof of Pulse" feature generates a cryptographic snapshot of a node's health status.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className={`p-2 rounded ${zenMode ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-900/20 text-purple-400'}`}><FileImage size={16}/></div>
                                <div>
                                    <strong className={`text-sm block ${zenMode ? 'text-zinc-400' : 'text-white'}`}>High-Fidelity PNG</strong>
                                    <span className="text-xs text-zinc-500">Renders locally at 2x scale for crisp text on Twitter/X.</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className={`p-2 rounded ${zenMode ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-900/20 text-purple-400'}`}><Share2 size={16}/></div>
                                <div>
                                    <strong className={`text-sm block ${zenMode ? 'text-zinc-400' : 'text-white'}`}>Verified Timestamp</strong>
                                    <span className="text-xs text-zinc-500">Includes a server-signed timestamp to prevent falsified reports.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Report Card Visual */}
                    <div className={`p-1 rounded-2xl bg-gradient-to-br ${zenMode ? 'from-zinc-800 to-zinc-900' : 'from-purple-500 via-pink-500 to-blue-500'}`}>
                        <div className="bg-[#050505] p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-20 bg-purple-500/10 blur-3xl rounded-full"></div>
                            <div className="relative z-10 text-center">
                                <div className="inline-block p-3 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
                                    <Activity size={24} className="text-purple-500" />
                                </div>
                                <h3 className="text-lg font-extrabold text-white mb-1">PROOF OF PULSE</h3>
                                <div className="text-[9px] font-mono text-zinc-500 mb-6">8x...2A • Verified • Jan 25</div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Health</div>
                                        <div className="text-lg font-extrabold text-green-400">98</div>
                                    </div>
                                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Credits</div>
                                        <div className="text-lg font-extrabold text-yellow-500">5.4M</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
