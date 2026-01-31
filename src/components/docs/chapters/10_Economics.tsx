import { useState } from 'react';
import { 
  TrendingUp, Activity, CheckCircle2, 
  Coins, XCircle, AlertCircle, Terminal, 
  BarChart3, ArrowRight
} from 'lucide-react';

// --- CODE SNIPPET ---
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

export function EconomicsChapter() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-32">

            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                        Chapter 08
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Economic Engine</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    Reference implementation of the Xandeum STOINC protocol. This engine decouples "Wealth" (Total Accumulation) from "Velocity" (Current Rate), allowing the system to identify high-performing nodes regardless of their age.
                </p>
            </div>

            {/* ===================================================
                SECTION 1: YIELD VELOCITY (Text Left, Sim Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Text */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Yield Velocity</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Total accumulation tells the story of the past, but <strong>Yield Velocity</strong> reveals the health of the present. The dashboard tracks the first derivative of your earnings—your rate of change per session.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            This metric allows operators to distinguish between a "Legacy Whale" (high total, low velocity) and a "Rising Star" (low total, high velocity), acting as an early warning system for hardware degradation before it affects your rank.
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 text-[10px] font-bold uppercase text-zinc-500 border-t border-zinc-900 pt-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> 
                             Velocity (Rate)
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-yellow-500 rounded-full"></div> 
                             Wealth (Total)
                         </div>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <YieldVelocitySim />

            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            {/* ===================================================
                SECTION 2: CONSISTENCY MAPPING (Sim Left, Text Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Simulation */}
                <div className="order-2 lg:order-1">
                    <RibbonSim />
                </div>

                {/* RIGHT: Text */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Activity size={24} className="text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Consistency Mapping</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            To visualize reliability without drowning in spreadsheet data, the engine generates a <strong>Consistency Ribbon</strong>. This heatmap encodes 30 days of history into a single visual strip.
                        </p>
                    </div>

                    {/* List */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-zinc-200 font-bold text-xs block">Growth (Green)</span>
                                    <span className="text-zinc-500 text-[10px]">Active yield generation. System nominal.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-zinc-200 font-bold text-xs block">Stagnant (Yellow)</span>
                                    <span className="text-zinc-500 text-[10px]">Online but zero yield. Check configuration.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <XCircle size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-zinc-200 font-bold text-xs block">Missing (Grey)</span>
                                    <span className="text-zinc-500 text-[10px]">Node offline or penalized.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* ===================================================
                SECTION 3: SOURCE CODE (Bottom)
               =================================================== */}
            <div className="border-t border-zinc-900 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Terminal size={20} className="text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Underlying Logic</h3>
                    
                </div>
                
                <div className="bg-[#0D1117] border border-zinc-800 rounded-2xl p-6 overflow-x-auto custom-scrollbar shadow-2xl relative group">
                     <div className="absolute top-4 right-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded bg-[#0D1117]">
                           src/lib/xandeum-economics.ts
                     </div>
                    <pre className="font-mono text-xs md:text-sm leading-relaxed">
                        <code className="text-emerald-300/90">{ECONOMICS_CODE.trim()}</code>
                    </pre>
                </div>
            </div>

        </section>
    );
}

// --- SIMULATION 1: YIELD AREA CHART ---
function YieldVelocitySim() {
    const [mode, setMode] = useState<'ACCUMULATION' | 'VELOCITY'>('VELOCITY');

    // Generate Points for SVG Path
    const generatePath = (type: 'ACCUMULATION' | 'VELOCITY') => {
        const points = [];
        const steps = 40;

        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * 100;
            let y = 0;

            if (type === 'ACCUMULATION') {
                // Smooth Exponential Curve (Yellow) - Wealth grows over time
                const progress = i / steps;
                // Invert Y axis: 100 is bottom, 0 is top
                y = 100 - (Math.pow(progress, 1.5) * 80); 
            } else {
                // Volatile Sine Wave (Green) - Velocity fluctuates
                const base = 60; // Middle of chart
                const noise = Math.sin(i * 0.5) * 15; 
                const jitter = (Math.random() - 0.5) * 15;
                y = base + noise + jitter;
            }
            points.push(`${x},${y}`);
        }

        // Close the loop for area fill
        return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
    };

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl min-h-[340px] flex flex-col justify-between">

            {/* Header */}
            <div className="flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    {mode === 'ACCUMULATION' 
                        ? <Coins size={14} className="text-yellow-500" />
                        : <Activity size={14} className="text-emerald-500" />
                    }
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {mode === 'ACCUMULATION' ? 'Total Wealth' : 'Real-Time Rate'}
                    </span>
                </div>

                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                     <button onClick={() => setMode('ACCUMULATION')} className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='ACCUMULATION' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>WEALTH</button>
                     <button onClick={() => setMode('VELOCITY')} className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='VELOCITY' ? 'bg-emerald-500/10 text-emerald-500 shadow border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>VELOCITY</button>
                </div>
            </div>

            {/* CHART AREA */}
            <div className="absolute inset-0 pt-20 pb-0 px-0 z-10 flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradYellow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#222" strokeWidth="0.2" strokeDasharray="2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#222" strokeWidth="0.2" strokeDasharray="2" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#222" strokeWidth="0.2" strokeDasharray="2" />

                    {/* The Area Path */}
                    <path 
                        d={generatePath(mode)} 
                        fill={`url(#${mode === 'ACCUMULATION' ? 'gradYellow' : 'gradGreen'})`} 
                        stroke={mode === 'ACCUMULATION' ? '#eab308' : '#10b981'}
                        strokeWidth="0.5"
                        className="transition-all duration-700 ease-in-out"
                    />
                </svg>
            </div>

             {/* Dynamic Value Overlay */}
             <div className="absolute top-20 left-8 z-20">
                <div className={`text-5xl font-black tracking-tighter transition-colors duration-300 ${mode === 'ACCUMULATION' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                    {mode === 'ACCUMULATION' ? '5.2M' : '+420'}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2 mt-1">
                    {mode === 'ACCUMULATION' ? <BarChart3 size={10}/> : <TrendingUp size={10}/>}
                    {mode === 'ACCUMULATION' ? 'Total Credits' : 'Credits / Hour'}
                </div>
             </div>
        </div>
    )
}

// --- SIMULATION 2: RIBBON SIM (Zinc Palette) ---
function RibbonSim() {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    // MOCK HISTORY: Green -> Yellow -> Grey -> Green
    const history = Array.from({ length: 30 }, (_, i) => {
        if (i < 4) return 'MISSING'; // Grey (Warmup/Offline)
        if (i === 12 || i === 13) return 'STAGNANT'; // Yellow
        if (i === 20 || i === 21) return 'MISSING'; // Grey (Penalty)
        return 'GROWTH'; // Green
    });

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-visible min-h-[280px] justify-center group">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Consistency Map
                </div>
                <div className="text-[9px] font-mono text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded">30-DAY WINDOW</div>
            </div>

            {/* The Ribbon Container */}
            <div className="relative h-20 w-full flex items-end gap-[3px]" onMouseLeave={() => setHoveredDay(null)}>
                {history.map((status, i) => {
                    let color = 'bg-zinc-800';
                    let label = 'Unknown';
                    let height = '30%';

                    if (status === 'GROWTH') { 
                        color = 'bg-emerald-500'; 
                        label = 'Growth'; 
                        height = '100%';
                    }
                    if (status === 'STAGNANT') { 
                        color = 'bg-amber-500'; 
                        label = 'Stagnant'; 
                        height = '60%';
                    }
                    if (status === 'MISSING') { 
                        color = 'bg-zinc-800'; 
                        label = 'Missing'; 
                        height = '20%';
                    }

                    const isHovered = hoveredDay === i;

                    return (
                        <div 
                            key={i}
                            onMouseEnter={() => setHoveredDay(i)}
                            className={`flex-1 rounded-[2px] transition-all duration-200 relative cursor-pointer ${isHovered ? 'scale-y-110 brightness-125 z-20' : 'hover:opacity-100 opacity-90'}`}
                            style={{ height }} 
                        >
                            <div className={`w-full h-full ${color}`}></div>

                            {/* Floating Tooltip */}
                            {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black border border-zinc-800 p-2 rounded-lg shadow-xl z-50 whitespace-nowrap min-w-[100px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                        <span className="text-[10px] font-bold text-white uppercase">{label}</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-mono">Day {i+1}</div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-b border-r border-zinc-800 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Legend / Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900/50">
                <div className="text-center p-2 rounded bg-emerald-500/5">
                    <div className="text-lg font-bold text-white">82%</div>
                    <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider">Uptime</div>
                </div>
                 <div className="text-center p-2 rounded bg-zinc-900/30">
                    <div className="text-lg font-bold text-zinc-400">24d</div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Active</div>
                </div>
                 <div className="text-center p-2 rounded bg-zinc-900/30">
                    <div className="text-lg font-bold text-zinc-400">6d</div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Downtime</div>
                </div>
            </div>

        </div>
    )
}
