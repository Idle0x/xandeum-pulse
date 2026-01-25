import { useState } from 'react';
import { Activity, Database, Hash, Hand, Search } from 'lucide-react';

export function InspectorChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Search size={12}/> Diagnostics Suite
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Granular Diagnostics</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                    The Inspector Modal allows for deep inspection of individual nodes. Use the simulator below to see how the 
                    <span className="text-red-400 font-bold"> Sigmoid Algorithm</span> penalizes downtime in real-time.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:bg-zinc-900/40 transition-colors">
                        <div className="mb-4 text-green-500"><Activity /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Health View</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">Breakdown of the 4 Vitality Pillars: Uptime, Storage, Version, and Reputation.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:bg-zinc-900/40 transition-colors">
                        <div className="mb-4 text-purple-500"><Database /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Storage View</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">Visualizes Committed vs Used storage, including utilization bonuses.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:bg-zinc-900/40 transition-colors">
                        <div className="mb-4 text-indigo-500"><Hash /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Identity View</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">Displays RPC endpoints, Public Keys, and physical fleet topology.</p>
                    </div>
                </div>
                
                <div className="lg:col-span-7">
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
    const totalScore = Math.round((uScore * 0.45) + (80 * 0.35) + (100 * 0.20)); // Assumptions for other stats

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-green-500"></div>

            <div className="text-center mb-12">
                <div className={`text-7xl font-extrabold transition-colors duration-500 ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {totalScore}
                </div>
                <div className="text-xs text-zinc-500 mt-4 font-mono uppercase tracking-widest">Live Vitality Score</div>
            </div>

            <div className="space-y-8 max-w-sm mx-auto w-full">
                <div>
                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-wider">
                        <span className="text-blue-400 flex items-center gap-2">
                            Uptime ({uptimeDays} Days)
                            <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[9px] border border-zinc-700 flex items-center gap-1 animate-pulse">
                                <Hand size={10} /> DRAG
                            </span>
                        </span>
                        <span className="text-white">{uScore} pts</span>
                    </div>
                    <input 
                        type="range" min="0" max="30" 
                        value={uptimeDays} onChange={(e) => setUptimeDays(Number(e.target.value))} 
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                     <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
                        <span>0 Days (Crit)</span>
                        <span>7 Days (Mid)</span>
                        <span>30 Days (Max)</span>
                    </div>
                </div>
                
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 text-center leading-relaxed">
                        Notice how the score drops rapidly below 7 days. This creates a <strong>"Trust Barrier"</strong> against ephemeral nodes.
                    </p>
                </div>
            </div>
        </div>
    )
}
