import { useState } from 'react';
import { TrendingUp, BarChart2, Calculator, Zap, History, MousePointer2, Database } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const ECONOMICS_LOGIC_SNIPPET = `
const calculateYield = (base, eraMultiplier, nftMultiplier) => {
  // Geometric Stacking: Multipliers compound (multiply) rather than add
  // Prevents linear reward dilution and rewards optimized hardware setups
  const totalMultiplier = eraMultiplier * nftMultiplier;
  return base * totalMultiplier;
};

// Example: 100 * 1.5 (Era) * 1.2 (NFT) = 180 (Geometric)
// vs: 100 * (1 + 0.5 + 0.2) = 170 (Linear)
`;

export function EconomicsChapter() {
    const [snapshotIndex, setSnapshotIndex] = useState(0);

    // Simulated historical raw data for the Time Machine
    const rawSnapshots = [
        { date: 'JAN 25 (NOW)', credits: '5,241.02', status: 'Optimal', rank: '#3' },
        { date: 'JAN 24 (24H)', credits: '5,102.44', status: 'Stable', rank: '#3' },
        { date: 'JAN 18 (7D)', credits: '4,890.12', status: 'Volatile', rank: '#5' }
    ];

    return (
        <LogicWrapper 
            title="Economics_Engine.ts" 
            code={ECONOMICS_LOGIC_SNIPPET} 
            githubPath="src/logic/economics-engine.ts"
        >
            <div className="flex flex-col gap-16">
                {/* Header: Professional Explanation */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Zap size={12}/> Financial Suite
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Economics & Reputation</h2>
                    
                    <div className="max-w-4xl mx-auto text-left space-y-6">
                        <p className="text-zinc-300 text-base leading-relaxed">
                            The platform tracks your node's financial story through four specialized tools. By distinguishing between <strong>Accumulation</strong> (Total Wealth) and <strong>Yield Velocity</strong> (Growth Rate), the system provides a macro-to-micro view of your earning efficiency. These metrics are processed by the <strong>Neural Core</strong> to identify whether your node is maintaining its competitive edge or experiencing yield dilution relative to the network mean.
                        </p>
                        <p className="text-zinc-300 text-base leading-relaxed">
                            At the heart of the reward system is the <strong>STOINC Simulator</strong>, which utilizes <strong>Geometric Stacking</strong> logic. Unlike traditional linear rewards, Pulse compounds multipliers (Era boosts, NFT power, and hardware tier) to reward optimized setups exponentially. This ensures that high-commitment operators are significantly more profitable than transient participants, creating a sustainable and ironclad economic foundation for the fleet.
                        </p>
                    </div>
                </div>

                {/* 1. ACCUMULATION & VELOCITY (Dual Area Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CHART 1: ACCUMULATION (Wealth Growth) */}
                    <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-8 flex flex-col shadow-xl text-left">
                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <TrendingUp className="text-blue-400" size={18}/> 1. Credits Accumulation
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Tracks <strong>total wealth</strong> over time. This upward-sloping area chart visualizes every credit ever earned by the node's stable identity.
                            </p>
                        </div>
                        <div className="h-40 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-end">
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
                    <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-8 flex flex-col shadow-xl text-left">
                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <BarChart2 className="text-yellow-500" size={18}/> 2. Yield Velocity
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Measures <strong>earning rate fluctuations</strong>. Shows how many credits are earned per session, identifying peaks and dips in growth speed.
                            </p>
                        </div>
                        <div className="h-40 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-end">
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 text-left">
                        <div className="max-w-md">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <History className="text-orange-500" size={24}/> 3. Historical Snapshot
                            </h3>
                            <p className="text-sm text-zinc-500 mt-2">
                                Travel back to view <strong>raw telemetry</strong> from previous sessions. Verifies earnings and rank at specific block heights.
                            </p>
                        </div>

                        <div className="flex bg-black p-1.5 rounded-2xl border border-zinc-800 shrink-0 gap-1">
                            {['NOW', '24H AGO', '7D AGO'].map((label, idx) => (
                                <button 
                                    key={label}
                                    onClick={() => setSnapshotIndex(idx)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${snapshotIndex === idx ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black border border-zinc-800 rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-500" key={snapshotIndex}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
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
                                <div className="text-sm font-mono text-green-500 uppercase font-bold">{rawSnapshots[snapshotIndex].status}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. STOINC (Geometric Calculator) */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-12 text-left">
                    <div className="flex-1">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl w-fit mb-6 text-yellow-500"><Calculator size={32}/></div>
                        <h3 className="text-3xl font-bold text-white mb-4">4. STOINC Comprehensive Simulator</h3>
                        <p className="text-zinc-400 text-base leading-relaxed mb-6">
                            Before committing hardware, estimate potential rewards. Pulse uses <strong>Geometric Stacking</strong>—meaning NFT boosts and Era multipliers multiply each other rather than being added linearly, maximizing high-performance yield.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-500">+ Hardware Logic</div>
                            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-500">+ NFT Multiplier</div>
                            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-500">+ Era Phase</div>
                        </div>
                    </div>

                    <div className="w-full md:w-80 bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 group-hover:shadow-[0_0_20px_rgba(234,179,8,1)] transition-all"></div>
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Projected Session Yield</div>
                            <div className="text-5xl font-black text-yellow-500 mb-6 tracking-tighter">180.00</div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-mono border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Base Reward</span>
                                    <span className="text-white">100.00</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-mono border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Stacking Boost</span>
                                    <span className="text-green-500">1.80x</span>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-4 bg-yellow-500 text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10 active:scale-95">
                                APPLY GEOMETRIC BOOST
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </LogicWrapper>
    );
}
