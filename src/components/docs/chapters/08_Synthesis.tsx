import { useState, useEffect } from 'react';
import { 
  Sparkles, GitMerge, BrainCircuit, ArrowRight, 
  Activity, PieChart, Map as MapIcon, Terminal 
} from 'lucide-react';

// --- CODE SNIPPET ---
const ENGINE_CODE = `
// The Weaving Protocol: Stitching Math to Meaning
const MATRIX = {
  tech: ["Positive variance of +14%", "Delta exceeds baseline"],
  simple: ["performing better than peers", "lifting the group average"],
  bridges: ["which indicates that", "translating to a state where"]
};

// 1. Determine Context
const getLens = (tab) => {
  if (tab === 'MARKET SHARE') return 'INEQUALITY';
  if (tab === 'TOPOLOGY') return 'JURISDICTION';
  return 'EFFICIENCY';
};

// 2. Weave the Narrative
function weaveNarrative(stats, context) {
  // Select segments based on context intensity
  const technical = stats.delta > 0 ? MATRIX.tech[0] : MATRIX.tech[1];
  const simplified = stats.intensity === 'high' ? MATRIX.simple[1] : MATRIX.simple[0];
  
  // Select a random semantic bridge to keep it organic
  const bridge = MATRIX.bridges[Math.floor(Math.random() * MATRIX.bridges.length)];

  // Output: "Positive variance of +14% which indicates that..."
  return \`\${technical} \${bridge} \${simplified}.\`;
}
`;

export function SynthesisChapter() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-32">

            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 bg-pink-500/10 px-2 py-1 rounded">
                        Chapter 09
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Synthesis Engine</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    Context-aware orchestration and deterministic natural language generation. This engine acts as the "Cortex" of the dashboard, translating raw telemetry into human-readable strategic insights based on the user's active focus.
                </p>
            </div>

            {/* ===================================================
                SECTION 1: CONTEXT LENS (Text Left, Sim Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Text */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <BrainCircuit size={24} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Intelligence Orchestration</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            The Synthesis Engine applies a <strong>Semantic Lens</strong> to the data based on your active tab. It ensures that the same metric is interpreted differently depending on the context.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            For example, high throughput is viewed as "Efficiency" in the Overview tab, but analyzed as "Centralization Risk" in the Market Share tab. This contextual shifting prevents data misinterpretation.
                        </p>
                    </div>

                    {/* Interactive Legend */}
                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-6">
                        <div className="p-2 rounded bg-blue-500/5 border border-blue-500/10 text-center">
                            <div className="text-[9px] font-bold text-blue-500 uppercase">Overview</div>
                            <div className="text-[8px] text-zinc-500 mt-1">Efficiency</div>
                        </div>
                        <div className="p-2 rounded bg-pink-500/5 border border-pink-500/10 text-center">
                            <div className="text-[9px] font-bold text-pink-500 uppercase">Market Share</div>
                            <div className="text-[8px] text-zinc-500 mt-1">Inequality</div>
                        </div>
                        <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-center">
                            <div className="text-[9px] font-bold text-emerald-500 uppercase">Topology</div>
                            <div className="text-[8px] text-zinc-500 mt-1">Jurisdiction</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <ContextLensSimulator />

            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            {/* ===================================================
                SECTION 2: NARRATIVE ENGINE (Sim Left, Text Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Simulation */}
                <div className="order-2 lg:order-1">
                    <TerminalSimulator />
                </div>

                {/* RIGHT: Text */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                <Sparkles size={24} className="text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Narrative Generation</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Working in tandem is the <strong>Narrative Engine</strong>, a deterministic linguist that converts raw statistical variance into human-readable reports.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                              It employs a <strong>Combinatorial Weave</strong> technique, stitching precise technical telemetry with semantic bridges. This allows the system to autonomously toggle between distinct personalities—Executive, Analyst, or Strategist—without sounding robotic.
                        </p>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Construction Logic</div>
                        <div className="space-y-2 font-mono text-xs">
                            <div className="flex gap-2">
                                <span className="text-zinc-600">1. Input:</span>
                                <span className="text-zinc-300">Delta +14% (Technical)</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-zinc-600">2. Bridge:</span>
                                <span className="text-pink-400">"...indicating that..."</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-zinc-600">3. Output:</span>
                                <span className="text-zinc-300">Performance exceeds peers.</span>
                            </div>
                        </div>
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
                           lib/narrative-engine.ts
                     </div>
                    <pre className="font-mono text-xs md:text-sm leading-relaxed">
                        <code className="text-pink-300/90">{ENGINE_CODE.trim()}</code>
                    </pre>
                </div>
            </div>

        </section>
    );
}

// --- SIMULATOR 1: CONTEXT LENS ---
function ContextLensSimulator() {
    const [activeLens, setActiveLens] = useState<'OVERVIEW' | 'MARKET SHARE' | 'TOPOLOGY'>('OVERVIEW');

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col gap-8 min-h-[300px] justify-center">

             {/* Background Icon */}
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <GitMerge size={160} />
            </div>

            {/* FLOW DIAGRAM */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

                {/* 1. INPUT */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-24 h-24 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative group">
                        <div className="absolute -top-3 bg-zinc-800 text-[9px] font-bold px-2 py-0.5 rounded text-zinc-400 uppercase">Input</div>
                        <span className="text-3xl font-bold text-white mb-1">High</span>
                        <span className="text-[10px] font-mono text-zinc-500">CREDITS</span>
                    </div>
                </div>

                {/* 2. ARROW (Responsive) */}
                <ArrowRight className="text-zinc-600 rotate-90 md:rotate-0" size={24} />

                {/* 3. PROCESSOR (The Buttons) */}
                <div className="flex-1 flex flex-col gap-2 w-full md:max-w-[180px]">
                    <button 
                        onClick={() => setActiveLens('OVERVIEW')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 ${activeLens === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
                    >
                        <Activity size={14} /> Overview
                    </button>
                    <button 
                        onClick={() => setActiveLens('MARKET SHARE')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 ${activeLens === 'MARKET SHARE' ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(219,39,119,0.3)] scale-105' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
                    >
                        <PieChart size={14} /> Market Share
                    </button>
                    <button 
                        onClick={() => setActiveLens('TOPOLOGY')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 ${activeLens === 'TOPOLOGY' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.3)] scale-105' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
                    >
                        <MapIcon size={14} /> Topology
                    </button>
                </div>

                {/* 4. ARROW (Responsive) */}
                <ArrowRight className="text-zinc-600 rotate-90 md:rotate-0" size={24} />

                {/* 5. OUTPUT */}
                <div className="flex-1 w-full md:w-auto bg-black border border-zinc-800 rounded-2xl p-4 h-28 flex items-center justify-center relative overflow-hidden shadow-inner">
                     <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${activeLens === 'OVERVIEW' ? 'bg-blue-500' : activeLens === 'MARKET SHARE' ? 'bg-pink-500' : 'bg-emerald-500'}`}></div>

                     {activeLens === 'OVERVIEW' && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <span className="text-blue-500 font-bold text-[10px] tracking-widest block mb-2">LENS: EFFICIENCY</span>
                            <span className="text-zinc-200 text-sm font-medium leading-tight">"Throughput is at<br/>max capacity."</span>
                        </div>
                    )}
                    {activeLens === 'MARKET SHARE' && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <span className="text-pink-500 font-bold text-[10px] tracking-widest block mb-2">LENS: RISK</span>
                            <span className="text-zinc-200 text-sm font-medium leading-tight">"Oligarchy structure<br/>detected."</span>
                        </div>
                    )}
                    {activeLens === 'TOPOLOGY' && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <span className="text-emerald-500 font-bold text-[10px] tracking-widest block mb-2">LENS: GEOPOLITICS</span>
                            <span className="text-zinc-200 text-sm font-medium leading-tight">"Strategic regional<br/>anchor."</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// --- SIMULATOR 2: TERMINAL ---
function TerminalSimulator() {
    const [termStep, setTermStep] = useState(0);

    useEffect(() => {
        // Sequence loop
        const runLoop = () => {
            setTermStep(0);
            setTimeout(() => setTermStep(1), 1500); // Fetch
            setTimeout(() => setTermStep(2), 3000); // Analyze
            setTimeout(() => setTermStep(3), 4500); // Output
            setTimeout(() => runLoop(), 9000); // Restart
        };
        
        runLoop();
        return () => {}; // Cleanup not strictly needed for this simple loop
    }, []);

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-3xl p-6 font-mono text-sm relative overflow-hidden shadow-2xl min-h-[260px] flex flex-col justify-between group">
            
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>

            {/* Header */}
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 z-10">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <span className="text-zinc-600 text-[10px] ml-2 font-bold tracking-wider">NARRATIVE_ENGINE_V2</span>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col gap-3 pt-4 text-[11px] sm:text-xs z-10">
                {/* STEP 0 */}
                <div className={`flex items-center gap-2 transition-all duration-300 ${termStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    <span className="text-zinc-600 mr-1">$</span>
                    <span className="text-blue-400">FETCH_TELEMETRY --source=mainnet</span>
                </div>

                {/* STEP 1 */}
                <div className={`flex items-center gap-2 transition-all duration-300 delay-75 ${termStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    <span className="text-zinc-600 mr-1">{'>'}</span>
                    <span className="text-zinc-400">GINI_COEFF: <span className="text-yellow-400">0.65</span></span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">DOMINANCE: <span className="text-yellow-400">55%</span></span>
                </div>

                {/* STEP 2 */}
                <div className={`flex items-center gap-2 transition-all duration-300 delay-75 ${termStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    <span className="text-zinc-600 mr-1">{'>'}</span>
                    <span className="text-purple-400">CONTEXT_SWITCH: <span className="text-white bg-purple-500/20 px-1 rounded border border-purple-500/30">ANALYST_WARNING</span></span>
                </div>

                {/* STEP 3 */}
                <div className={`mt-3 border-l-2 border-pink-500 pl-3 py-1 transition-all duration-500 ${termStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <p className="text-zinc-100 leading-relaxed font-medium">
                        <span className="text-pink-500 font-bold mr-2 text-[10px] uppercase tracking-wider">Generated Report</span>
                        <br/>
                        "Top 3 nodes currently control 55% of total network resources, indicating a <span className="text-pink-400">high centralization risk</span> that requires immediate rebalancing."
                        <span className="inline-block w-1.5 h-3 bg-pink-500 ml-1 animate-pulse align-middle"></span>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[9px] text-zinc-600 uppercase tracking-widest pt-3 border-t border-zinc-900 z-10">
                <span>Status: {termStep === 3 ? 'IDLE' : 'PROCESSING...'}</span>
                <div className="flex gap-1">
                        {[0,1,2,3].map(s => (
                            <div key={s} className={`w-6 h-1 rounded-full transition-colors duration-300 ${termStep >= s ? 'bg-pink-500' : 'bg-zinc-800'}`}></div>
                        ))}
                </div>
            </div>
        </div>
    );
}
