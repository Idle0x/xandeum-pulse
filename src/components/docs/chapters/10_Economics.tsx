import { useState } from 'react';
import { 
  TrendingUp, BarChart2, Activity, Scale, 
  ArrowRight, Minus, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const ECONOMICS_CODE = `
// Official STOINC Logic: Geometric Mean Normalization
export function calculateStoinc(inputs) {
  // 1. Geometric Stacking: Compound multipliers
  let product = 1;
  Object.entries(inputs.boosts).forEach(([name, count]) => {
      const val = ERA_BOOSTS[name] || 1;
      // Multiply 'count' times (Geometric compounding)
      for(let i=0; i<count; i++) product *= val; 
  });

  // 2. Normalize: Root based on fleet size prevents 'whale' dominance
  // Example: 10 nodes = 10th root of total boost
  const geoMean = Math.pow(product, 1 / Math.max(1, inputs.nodeCount));
  
  // 3. Final Yield Power
  return inputs.userBaseCredits * geoMean;
}
`;

// --- SIMULATION 1: DUAL AXIS CHART ---
function YieldVelocitySim() {
    const [mode, setMode] = useState<'ACCUMULATION' | 'VELOCITY'>('VELOCITY');

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden h-full min-h-[280px]">
            {/* Header */}
            <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <TrendingUp size={14} className={mode === 'ACCUMULATION' ? 'text-yellow-500' : 'text-zinc-600'} />
                    <span>vs</span>
                    <BarChart2 size={14} className={mode === 'VELOCITY' ? 'text-emerald-500' : 'text-zinc-600'} />
                </div>
                
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 relative">
                     <button onClick={() => setMode('ACCUMULATION')} className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='ACCUMULATION' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>WEALTH</button>
                     <button onClick={() => setMode('VELOCITY')} className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='VELOCITY' ? 'bg-emerald-900/30 text-emerald-400 shadow border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>VELOCITY</button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative w-full flex items-end justify-between gap-1 px-2 pb-2">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 flex flex-col justify-between py-2 opacity-20 pointer-events-none">
                    <div className="w-full h-px bg-zinc-700 dashed"></div>
                    <div className="w-full h-px bg-zinc-700 dashed"></div>
                    <div className="w-full h-px bg-zinc-700 dashed"></div>
                </div>

                {/* Bars / Line */}
                {[...Array(20)].map((_, i) => {
                    // Mock Data Generation
                    const growth = Math.log(i + 5) * 20; // Smooth curve
                    const variance = 40 + (Math.sin(i) * 20) + (Math.random() * 10); // Jagged volatility

                    const height = mode === 'ACCUMULATION' ? growth : variance;
                    const color = mode === 'ACCUMULATION' ? 'bg-yellow-500' : 'bg-emerald-500';
                    
                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full group relative z-10">
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-[9px] font-mono text-white px-2 py-1 rounded border border-zinc-700 pointer-events-none whitespace-nowrap z-20">
                                {mode === 'ACCUMULATION' ? 'Total: 5.2M' : 'Yield: +420/hr'}
                            </div>
                            
                            {/* The Bar */}
                            <div 
                                className={`w-full rounded-t-sm transition-all duration-500 ease-in-out ${color}`}
                                style={{ 
                                    height: `${height}%`,
                                    opacity: mode === 'ACCUMULATION' ? 0.2 + (i/40) : 0.6 + (Math.random() * 0.4)
                                }}
                            ></div>
                        </div>
                    )
                })}
            </div>

            {/* Footer Legend */}
            <div className="text-center z-10">
                <p className="text-[10px] text-zinc-500 font-mono">
                    {mode === 'ACCUMULATION' 
                        ? "MACRO VIEW: Legacy Reputation (All-Time)" 
                        : "MICRO VIEW: Current Earning Rate (Real-Time)"}
                </p>
            </div>
        </div>
    )
}

// --- SIMULATION 2: CONSISTENCY RIBBON ---
function RibbonSim() {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    // Mock History Pattern: Start slow -> Good -> Crash -> Recovery
    const history = Array.from({ length: 30 }, (_, i) => {
        if (i < 5) return 'WARMUP'; // Blue
        if (i === 12 || i === 13) return 'STAGNANT'; // Yellow
        if (i === 20) return 'PENALTY'; // Red
        return 'GROWTH'; // Green
    });

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl h-full justify-center relative overflow-visible">
            <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-zinc-500" /> Consistency Map
                </div>
                <div className="text-[9px] font-mono text-zinc-600">30-DAY WINDOW</div>
            </div>

            {/* The Ribbon Container */}
            <div className="relative h-12 w-full flex items-end gap-1" onMouseLeave={() => setHoveredDay(null)}>
                {history.map((status, i) => {
                    let color = 'bg-zinc-800';
                    let label = 'Offline';
                    if (status === 'GROWTH') { color = 'bg-emerald-500'; label = '+Growth'; }
                    if (status === 'STAGNANT') { color = 'bg-amber-500'; label = 'Stagnant'; }
                    if (status === 'PENALTY') { color = 'bg-rose-500'; label = 'Penalty'; }
                    if (status === 'WARMUP') { color = 'bg-blue-500'; label = 'Warmup'; }

                    const isHovered = hoveredDay === i;

                    return (
                        <div 
                            key={i}
                            onMouseEnter={() => setHoveredDay(i)}
                            className={`flex-1 rounded-sm transition-all duration-200 relative cursor-pointer ${isHovered ? 'scale-y-125 brightness-125 z-20' : 'hover:opacity-100 opacity-80'}`}
                            style={{ height: status === 'GROWTH' ? '100%' : '60%', backgroundColor: isHovered ? 'white' : '' }} // Hover highlight logic handled by class except color override
                        >
                            <div className={`w-full h-full ${color}`}></div>
                            
                            {/* Floating Tooltip */}
                            {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-xl z-50 whitespace-nowrap min-w-[100px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                        <span className="text-[10px] font-bold text-white uppercase">{label}</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-mono">Day {i+1}: {status === 'GROWTH' ? '+450 Credits' : status === 'PENALTY' ? '-50 Credits' : '0 Credits'}</div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-zinc-700 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-2 pt-4 border-t border-zinc-900">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[9px] text-zinc-500 uppercase">Growth</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><span className="text-[9px] text-zinc-500 uppercase">Stagnant</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-[9px] text-zinc-500 uppercase">Penalty</span></div>
                </div>
            </div>
        </div>
    )
}

export function EconomicsChapter() {
    return (
        <ChapterLayout
            chapterNumber="08"
            title="Economic Engine"
            subtitle="Reference implementation of the Xandeum STOINC protocol."
            textData={[]} // Custom Grid Render
            codeSnippet={ECONOMICS_CODE}
            githubPath="src/lib/xandeum-economics.ts"
        >
            <div className="flex flex-col gap-16 pb-8">

                {/* ===================================================
                    ROW 1: PROTOCOL COMPLIANCE (FULL WIDTH)
                   =================================================== */}
                <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                        <Scale size={20} className="text-blue-400" />
                        Protocol Reference Implementation
                    </h3>
                    <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                        The Economic Engine is built as a strict <strong>Reference Implementation</strong> of the official Xandeum STOINC protocol. Unlike linear reward systems, the network utilizes a <strong>Geometric Mean</strong> to normalize boost stacking across fleet sizes. 
                    </p>
                    <p className="text-zinc-400 leading-relaxed mt-4 text-sm md:text-base">
                        Pulse replicates this logic 1:1, ensuring that your projected yield—compounded by Era Multipliers, NFT Power, and Hardware Tiers—matches the exact consensus calculations used by the blockchain. This prevents "whale" dominance while exponentially rewarding high-commitment operators.
                    </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* ===================================================
                    ROW 2: YIELD VELOCITY
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* TEXT */}
                    <div className="prose prose-invert">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <TrendingUp size={20} className="text-emerald-400" />
                            Yield Velocity
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                            Total accumulation tells the story of the past, but <strong>Yield Velocity</strong> reveals the health of the present. The dashboard tracks the first derivative of your earnings—your rate of change per session. 
                        </p>
                        <p className="text-zinc-400 leading-relaxed mt-4 text-sm md:text-base">
                            This metric allows operators to distinguish between a "Legacy Whale" (high total, low velocity) and a "Rising Star" (low total, high velocity), acting as an early warning system for hardware degradation before it affects your rank.
                        </p>
                    </div>

                    {/* SIMULATOR */}
                    <YieldVelocitySim />
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* ===================================================
                    ROW 3: CONSISTENCY MAPPING
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* SIMULATOR (Left on Desktop for variety, or keep Right) -> Let's keep Right for consistency */}
                    <div className="prose prose-invert order-1">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <Activity size={20} className="text-amber-400" />
                            Consistency Mapping
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                            To visualize reliability without drowning in spreadsheet data, the engine generates a <strong>Consistency Ribbon</strong>. This heatmap encodes 30 days of history into a single visual strip.
                        </p>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> <strong>Green:</strong> Active Growth (Healthy Yield)</li>
                            <li className="flex items-center gap-2"><AlertCircle size={14} className="text-amber-500"/> <strong>Yellow:</strong> Stagnation (Online but Zero Yield)</li>
                            <li className="flex items-center gap-2"><Minus size={14} className="text-rose-500"/> <strong>Red:</strong> Penalties or Offline Status</li>
                        </ul>
                    </div>

                    {/* SIMULATOR */}
                    <div className="order-2">
                        <RibbonSim />
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}
