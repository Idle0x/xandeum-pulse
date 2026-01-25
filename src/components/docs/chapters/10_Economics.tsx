import { useState } from 'react';
import { TrendingUp, BarChart2, Calculator, Zap, History, MousePointer2, Database } from 'lucide-react';

export function EconomicsChapter() {
    const [snapshotIndex, setSnapshotIndex] = useState(0);

    // Simulated historical raw data for the Time Machine
    const rawSnapshots = [
        { date: 'JAN 25 (NOW)', credits: '5,241.02', status: 'Optimal', rank: '#3' },
        { date: 'JAN 24 (24H)', credits: '5,102.44', status: 'Stable', rank: '#3' },
        { date: 'JAN 18 (7D)', credits: '4,890.12', status: 'Volatile', rank: '#5' }
    ];

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
            {/* Header: Plain English Context */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Zap size={12}/> Financial Suite
                 </div>
                <h2 className="text-4xl font-bold text-white mb-4">Economics & Reputation</h2>
                <p className="text-zinc-400 max-w-3xl mx-auto text-base leading-relaxed">
                    The platform tracks your node's financial story through four specialized tools. 
                    Monitor your total wealth, analyze your earning speed, travel back through raw data logs, 
                    and simulate future hardware rewards.
                </p>
            </div>

            {/* 1. ACCUMULATION & VELOCITY (Dual Area Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* CHART 1: ACCUMULATION (Wealth Growth) */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-8 flex flex-col shadow-xl">
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <TrendingUp className="text-blue-400" size={18}/> 1. Credits Accumulation
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            This area chart shows your <strong>total wealth</strong> over time. It is an upward-sloping graph that represents every credit your node has ever earned. 
                        </p>
                    </div>
                    <div className="h-40 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-end">
                         {/* Static Area Chart Path Simulation */}
                         <svg className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0 160 Q 50 140, 100 130 T 200 100 T 300 70 T 400 40 L 400 160 L 0 160 Z" fill="url(#blueGrad)" fillOpacity="0.2" />
                            <path d="M0 160 Q 50 140, 100 130 T 200 100 T 300 70 T 400 40" fill="none" stroke="#60a5fa" strokeWidth="2" />
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#60a5fa" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                         </svg>
                         <div className="absolute top-4 right-4 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">TOTAL WEALTH</div>
                    </div>
                </div>

                {/* CHART 2: YIELD VELOCITY (Earning Rate) */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-8 flex flex-col shadow-xl">
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <BarChart2 className="text-yellow-500" size={18}/> 2. Yield Velocity
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            This chart tracks <strong>fluctuations in your earning rate</strong>. It shows how many credits you earn per session, helping you see if your node is speeding up or slowing down.
                        </p>
                    </div>
                    <div className="h-40 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-end">
                         {/* Volatile Area Chart Path Simulation */}
                         <svg className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0 100 Q 25 150, 50 80 T 100 120 T 150 40 T 200 90 T 250 130 T 300 60 T 400 110 L 400 160 L 0 160 Z" fill="url(#yellowGrad)" fillOpacity="0.2" />
                            <path d="M0 100 Q 25 150, 50 80 T 100 120 T 150 40 T 200 90 T 250 130 T 300 60 T 400 110" fill="none" stroke="#eab308" strokeWidth="2" />
                            <defs>
                                <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#eab308" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                         </svg>
                         <div className="absolute top-4 right-4 text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">EARNING RATE</div>
                    </div>
                </div>
            </div>

            {/* 2. HISTORICAL SNAPSHOT (Raw Data Time Machine) */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 relative shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <History className="text-orange-500" size={24}/> 3. Historical Snapshot
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2">
                            Go back in time to view the <strong>exact raw data</strong> from your previous sessions. This verifies your earnings at specific block heights.
                        </p>
                    </div>

                    <div className="flex bg-black p-1.5 rounded-2xl border border-zinc-800 shrink-0 gap-1">
                        {['NOW', '24H AGO', '7D AGO'].map((label, idx) => (
                            <button 
                                key={label}
                                onClick={() => setSnapshotIndex(idx)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${snapshotIndex === idx ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Raw Data Row Simulation */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-500" key={snapshotIndex}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Timestamp</div>
                            <div className="text-sm font-mono text-white tracking-tighter">{rawSnapshots[snapshotIndex].date}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Exact Credits</div>
                            <div className="text-sm font-mono text-orange-400">{rawSnapshots[snapshotIndex].credits} Cr</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Global Rank</div>
                            <div className="text-sm font-mono text-white">{rawSnapshots[snapshotIndex].rank}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Node Status</div>
                            <div className="text-sm font-mono text-green-500 uppercase">{rawSnapshots[snapshotIndex].status}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. STOINC (Geometric Calculator) */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl w-fit mb-6 text-yellow-500"><Calculator size={32}/></div>
                    <h3 className="text-3xl font-bold text-white mb-4">4. STOINC Comprehensive Simulator</h3>
                    <p className="text-zinc-400 text-base leading-relaxed mb-6">
                        Before committing hardware, use the STOINC tool to estimate rewards. 
                        It uses <strong>Geometric Stacking</strong>—meaning NFT boosts and Era multipliers multiply each other rather than being added linearly.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400">+ Hardware Input</div>
                        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400">+ NFT Boosts</div>
                        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400">+ Era Select</div>
                    </div>
                </div>

                <div className="w-full md:w-80 bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 group-hover:shadow-[0_0_20px_rgba(234,179,8,1)] transition-all"></div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Projected Rewards</div>
                        <div className="text-5xl font-black text-yellow-500 mb-6">180.00</div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-mono border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Base</span>
                                <span className="text-white">100.00</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Combined Boost</span>
                                <span className="text-green-500">1.80x</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-3 bg-yellow-500 text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all">
                            Apply Boosts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
