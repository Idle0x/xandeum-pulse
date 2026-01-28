import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  GitMerge, 
  BrainCircuit, 
  ArrowRight, 
  Activity, 
  PieChart, 
  Map as MapIcon,
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- CODE SNIPPET FOR BOTTOM DRAWER ---
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
    // --- SIMULATION 1 STATE: CONTEXT LENS ---
    const [activeLens, setActiveLens] = useState<'OVERVIEW' | 'MARKET SHARE' | 'TOPOLOGY'>('OVERVIEW');

    // --- SIMULATION 2 STATE: TERMINAL ---
    const [termStep, setTermStep] = useState(0);
    
    // Terminal Animation Loop
    useEffect(() => {
        const sequence = [
            { step: 0, duration: 1500 }, // Fetching
            { step: 1, duration: 1500 }, // Analyzing
            { step: 2, duration: 1500 }, // Selecting
            { step: 3, duration: 4000 }, // Output (Long pause to read)
        ];

        let currentStepIndex = 0;

        const runStep = () => {
            setTermStep(sequence[currentStepIndex].step);
            const duration = sequence[currentStepIndex].duration;
            
            currentStepIndex = (currentStepIndex + 1) % sequence.length;
            setTimeout(runStep, duration);
        };

        const timer = setTimeout(runStep, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ChapterLayout
            chapterNumber="09"
            title="Synthesis & Narrative Engine"
            subtitle="Context-aware orchestration and deterministic natural language generation."
            textData={[]} // Custom rendering below
            codeSnippet={ENGINE_CODE}
            githubPath="lib/narrative-engine.ts"
        >
            <div className="flex flex-col gap-12 pb-12">

                {/* --- PARAGRAPH 1: THE SYNTHESIS ENGINE --- */}
                <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <BrainCircuit size={20} className="text-blue-400" />
                        Intelligence Orchestration
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        The <strong>Synthesis Engine</strong> acts as the dashboard’s central cortex, functioning as both a state synchronizer and a context-aware filter. It orchestrates the connection between the map, charts, and data grids, ensuring that when a user focuses on a specific node, every component updates in unison. Crucially, it applies a <em>semantic lens</em> to the data based on the active tab; for example, analyzing "Credits" through an operational efficiency lens in the <em>Overview</em> tab, versus a wealth concentration lens in the <em>Market Share</em> tab. This ensures insights are always specific to the user's current goal.
                    </p>
                </div>

                {/* --- SIMULATION 1: CONTEXT LENS --- */}
                <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GitMerge size={100} />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative z-10">
                        
                        {/* Input Node */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Raw Telemetry</span>
                            <div className="w-28 h-28 md:w-32 md:h-32 bg-zinc-900 border border-zinc-700 rounded-xl flex flex-col items-center justify-center shadow-lg relative">
                                <span className="text-3xl md:text-4xl font-bold text-white mb-1">High</span>
                                <span className="text-[10px] md:text-xs font-mono text-zinc-400">CREDITS</span>
                                <div className="absolute -bottom-2 w-full flex justify-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Arrows */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 md:h-12 md:w-24">
                            <ArrowRight className="text-zinc-600 hidden md:block" />
                            <ArrowRight className="text-zinc-600 md:hidden rotate-90" />
                        </div>

                        {/* The Processor */}
                        <div className="flex-1 w-full max-w-xl flex flex-col gap-4">
                            {/* Controls */}
                            <div className="flex flex-wrap md:flex-nowrap gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                                <button 
                                    onClick={() => setActiveLens('OVERVIEW')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all whitespace-nowrap ${activeLens === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Activity size={12} className="hidden sm:block" /> Overview
                                </button>
                                <button 
                                    onClick={() => setActiveLens('MARKET SHARE')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all whitespace-nowrap ${activeLens === 'MARKET SHARE' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <PieChart size={12} className="hidden sm:block" /> Market Share
                                </button>
                                <button 
                                    onClick={() => setActiveLens('TOPOLOGY')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all whitespace-nowrap ${activeLens === 'TOPOLOGY' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <MapIcon size={12} className="hidden sm:block" /> Topology
                                </button>
                            </div>

                            {/* Output Box */}
                            <div className="bg-black border border-zinc-800 rounded-xl p-6 min-h-[110px] flex items-center justify-center relative overflow-hidden transition-all duration-300">
                                <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${activeLens === 'OVERVIEW' ? 'bg-blue-500' : activeLens === 'MARKET SHARE' ? 'bg-pink-500' : 'bg-emerald-500'}`}></div>
                                
                                {activeLens === 'OVERVIEW' && (
                                    <p className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <span className="text-blue-400 font-mono text-[10px] md:text-xs block mb-2 tracking-widest">INTERPRETATION: EFFICIENCY</span>
                                        <span className="text-zinc-200 font-medium text-sm md:text-base">"Hardware configuration is optimal. Throughput is at maximum capacity."</span>
                                    </p>
                                )}
                                {activeLens === 'MARKET SHARE' && (
                                    <p className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <span className="text-pink-400 font-mono text-[10px] md:text-xs block mb-2 tracking-widest">INTERPRETATION: CENTRALIZATION</span>
                                        <span className="text-zinc-200 font-medium text-sm md:text-base">"Risk detected. Revenue concentration suggests an oligarchy structure."</span>
                                    </p>
                                )}
                                {activeLens === 'TOPOLOGY' && (
                                    <p className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <span className="text-emerald-400 font-mono text-[10px] md:text-xs block mb-2 tracking-widest">INTERPRETATION: GEOPOLITICAL</span>
                                        <span className="text-zinc-200 font-medium text-sm md:text-base">"Strategic Asset. This node is a primary economic anchor for the regional cluster."</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PARAGRAPH 2: THE NARRATIVE ENGINE --- */}
                <div className="prose prose-invert max-w-none mt-4">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Sparkles size={20} className="text-pink-400" />
                        Narrative Generation
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        Working in tandem is the <strong>Narrative Engine</strong>, a deterministic linguist that converts raw statistical variance—such as Standard Deviation and Gini Coefficients—into human-readable situation reports. Rather than using static templates, it employs a <em>"Combinatorial Weave"</em> technique. This logic stitches precise technical telemetry (e.g., <em>"Positive delta of +14%"</em>) with simplified semantic bridges (e.g., <em>"indicating that..."</em>), allowing the system to autonomously toggle between distinct personalities—Executive, Analyst, or Strategist—without sounding robotic.
                    </p>
                </div>

                {/* --- SIMULATION 2: THE TERMINAL --- */}
                <div className="bg-black border border-zinc-800 rounded-xl p-6 md:p-8 font-mono text-sm relative overflow-hidden shadow-2xl min-h-[240px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-4">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <span className="text-zinc-600 text-xs ml-2">narrative-engine — v2.0.4</span>
                    </div>

                    {/* Terminal Body */}
                    <div className="flex-1 flex flex-col gap-3">
                        {/* STEP 0: FETCH */}
                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${termStep >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-zinc-500">{'>'}</span>
                            <span className="text-blue-400">FETCHING_TELEMETRY...</span>
                        </div>

                        {/* STEP 1: ANALYZE */}
                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${termStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-zinc-500">{'>'}</span>
                            <div className="flex gap-4 text-xs">
                                <span className="text-zinc-300">GINI: <span className="text-yellow-400">0.65 (HIGH)</span></span>
                                <span className="text-zinc-300">TOP_3_SHARE: <span className="text-yellow-400">55%</span></span>
                            </div>
                        </div>

                        {/* STEP 2: SELECT */}
                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${termStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-zinc-500">{'>'}</span>
                            <span className="text-purple-400">SELECTING_MODE: <span className="text-white bg-purple-500/20 px-1 rounded">ANALYST_WARNING</span></span>
                        </div>

                        {/* STEP 3: OUTPUT */}
                        <div className={`mt-4 border-l-2 border-pink-500 pl-4 py-1 transition-all duration-500 ${termStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                            <p className="text-zinc-100 leading-relaxed">
                                <span className="text-pink-500 font-bold mr-2">root@pulse:~$</span>
                                "Oligarchy detected. The top 3 nodes control 55% of network resources, which indicates a high centralization risk."
                                <span className="inline-block w-2 h-4 bg-pink-500 ml-2 animate-pulse align-middle"></span>
                            </p>
                        </div>
                    </div>

                    {/* Footer Progress */}
                    <div className="mt-auto pt-4 flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-widest">
                        <span>Status: {termStep === 3 ? 'IDLE' : 'PROCESSING'}</span>
                        <div className="flex gap-1">
                             {[0,1,2,3].map(s => (
                                 <div key={s} className={`w-8 h-1 rounded-full transition-colors duration-300 ${termStep >= s ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
                             ))}
                        </div>
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}
