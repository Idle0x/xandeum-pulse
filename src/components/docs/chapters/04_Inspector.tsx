import { useState } from 'react';
import { Activity, Database, Hash, Hand, Search, Info } from 'lucide-react';

export function InspectorChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
            {/* Header: Professional Explanation */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Search size={12}/> Diagnostics Suite
                </div>
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Granular Diagnostics</h2>
                
                <div className="max-w-4xl mx-auto text-left space-y-6">
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The <strong>Inspector System</strong> is the platform's investigative core, transforming complex network telemetry into three distinct perspectives: <strong>Health</strong>, <strong>Storage</strong>, and <strong>Identity</strong>. The <strong>Health View</strong> uses a non-linear scoring engine to weigh uptime stability and reputation against the network average, providing a 0-100 "Vitality Score." The <strong>Storage View</strong> focuses on physical utility, visualizing the gap between committed capacity and actual data usage, while the <strong>Identity View</strong> unmasks the technical footprint of a node—mapping its RPC endpoints and fleet topology to ensure you are connected to the correct physical hardware.
                    </p>
                    <p className="text-zinc-300 text-base leading-relaxed">
                        These views matter because they provide the "Ground Truth" for your operations. Data is pulled directly from the blockchain's gossip protocol and enriched with historical snapshots to create fluid visualizations like 30-day stability ribbons and growth curves. By handling data this way, the Inspector allows you to see through session-level noise. You aren't just looking at current numbers; you are seeing a verified record of performance that proves a node's long-term reliability and economic value to the Xandeum ecosystem.
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Visual Feature Breakdown */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 hover:border-green-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-green-500/10 rounded-xl text-green-500 group-hover:scale-110 transition-transform"><Activity size={20}/></div>
                            <h3 className="text-lg font-bold text-white">Health Analysis</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Aggregates 4 pillars (Uptime, Storage, Version, Reputation) into a single score. It uses the <strong>Sigmoid Algorithm</strong> to ensure new nodes must earn trust over time.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform"><Database size={20}/></div>
                            <h3 className="text-lg font-bold text-white">Storage Metrics</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Visualizes the "Load State" of a node. Shows exactly how much data is stored versus how much was promised, including utilization bonuses for active data hosting.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform"><Hash size={20}/></div>
                            <h3 className="text-lg font-bold text-white">Identity Verification</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">The source of truth for metadata. Displays Public Keys, IP history, and software versions to prevent spoofing and ensure consensus alignment across the fleet.</p>
                    </div>
                </div>
                
                {/* The Simulation Widget */}
                <div className="lg:col-span-7 h-full">
                    <VitalitySimulator />
                </div>
            </div>
        </div>
    )
}

function VitalitySimulator() {
    const [uptimeDays, setUptimeDays] = useState(14);
    
    // Sigmoid logic: 100 / (1 + e^(-0.2 * (days - 7)))
    const uScore = Math.min(100, Math.round(100 / (1 + Math.exp(-0.2 * (uptimeDays - 7)))));
    const totalScore = Math.round((uScore * 0.45) + (80 * 0.35) + (100 * 0.20)); 

    return (
        <div className="bg-black border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center min-h-[450px]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-green-500"></div>

            <div className="text-center mb-12">
                <div className={`text-8xl font-black transition-colors duration-500 tracking-tighter ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {totalScore}
                </div>
                <div className="text-[10px] text-zinc-500 mt-4 font-mono uppercase tracking-[0.3em] font-bold">Mathematical Vitality Score</div>
            </div>

            <div className="space-y-8 max-w-sm mx-auto w-full">
                <div>
                    <div className="flex justify-between text-xs mb-4 font-bold uppercase tracking-wider">
                        <span className="text-blue-400 flex items-center gap-2">
                            Uptime Duration ({uptimeDays} Days)
                            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 animate-pulse">LIVE SIM</div>
                        </span>
                        <span className="text-white font-mono">{uScore} pts</span>
                    </div>
                    <div className="relative group/slider">
                        <input 
                            type="range" min="0" max="30" 
                            value={uptimeDays} onChange={(e) => setUptimeDays(Number(e.target.value))} 
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 relative z-10"
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded">
                            DRAG TO KILL UPTIME
                        </div>
                    </div>
                     <div className="flex justify-between text-[9px] text-zinc-600 mt-3 font-mono font-bold">
                        <span>CRITICAL (0D)</span>
                        <span>MIDPOINT (7D)</span>
                        <span>IRONCLAD (30D)</span>
                    </div>
                </div>
                
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex gap-3 items-center">
                    <Info size={16} className="text-zinc-500 shrink-0" />
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                        The <strong>Sigmoid Curve</strong> penalizes new nodes heavily. Stability is only "Proven" once a node crosses the 7-day threshold.
                    </p>
                </div>
            </div>
        </div>
    )
}
