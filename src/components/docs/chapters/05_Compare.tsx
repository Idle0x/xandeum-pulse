import { useState } from 'react';
import { Layers, Swords, FileImage, ScanLine, BarChart3 } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const COMPARE_CODE = `
// Ghost Canvas Renderer: Capturing the Unseen
const captureTopology = async () => {
  // 1. Mount the Hidden DOM (The Ghost)
  // We render the full dataset into an off-screen container
  const ghost = <HiddenTable data={fullFleet} mode="FULL_WIDTH" />;
  
  // 2. Vectorize & Rasterize
  // We force a specific pixel ratio to ensure 4k+ quality
  const png = await htmlToImage(ghost, {
    width: 5000, // Force 5k width to capture all columns
    pixelRatio: 2.0,
    quality: 1.0
  });
  
  return download(png);
};
`;

export function CompareChapter() {
    // --- SIMULATION 1: GHOST CANVAS ---
    const [scanning, setScanning] = useState(false);

    // --- SIMULATION 2: PIVOT LOGIC ---
    const [mode, setMode] = useState<'AVG' | 'APEX'>('AVG');

    const triggerScan = () => {
        if (scanning) return;
        setScanning(true);
        setTimeout(() => setScanning(false), 2500);
    };

    return (
        <ChapterLayout
            chapterNumber="05"
            title="Analytics Suite"
            subtitle="Pivoting baselines and high-fidelity reporting engines."
            textData={[]} // Rendering manual content below
            codeSnippet={COMPARE_CODE}
            githubPath="src/logic/compare-engine.ts"
        >
            <div className="flex flex-col gap-16 pb-8">

                {/* ===================================================
                    FEATURE 1: COMPARATIVE INTELLIGENCE (PIVOT)
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* LEFT COLUMN: TEXT */}
                    <div className="prose prose-invert">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <Swords size={20} className="text-pink-400" />
                            Comparative Intelligence
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                             This suite moves beyond basic head-to-head metrics. Built on a <strong>Pivot & Spotlight</strong> philosophy, the dashboard allows operators to dynamically swap their "Baseline"—comparing selected nodes against the real-time Network Average or specific high-performance leaders (Apex Nodes).
                        </p>
                        <p className="text-zinc-400 leading-relaxed mt-4 text-sm md:text-base">
                            When a baseline is shifted, the Synthesis Engine recalculates the <code className="text-pink-400 bg-pink-500/10 px-1 py-0.5 rounded">performanceDelta</code> for every active node in real-time, instantly re-contextualizing the fleet's performance against the new standard.
                        </p>
                    </div>

                    {/* RIGHT COLUMN: SIMULATION */}
                    <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden h-full min-h-[280px] justify-center">
                         <div className="flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-pink-500" />
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Pivot Logic</span>
                            </div>
                            {/* Toggle */}
                            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 relative">
                                 <button 
                                    onClick={() => setMode('AVG')} 
                                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='AVG' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                 >
                                    VS AVG
                                 </button>
                                 <button 
                                    onClick={() => setMode('APEX')} 
                                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${mode==='APEX' ? 'bg-pink-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                 >
                                    VS APEX
                                 </button>
                            </div>
                        </div>

                        {/* Animated Bars */}
                        <div className="flex flex-col gap-6 py-2 px-2 relative z-10">
                            {/* BAR 1: YOUR NODE (CONSTANT) */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <span>Your Node</span>
                                    <span className="text-white">1.2 PB</span>
                                </div>
                                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <div className="h-full w-[60%] bg-zinc-500 rounded-full shadow-[0_0_10px_rgba(113,113,122,0.3)]"></div>
                                </div>
                            </div>

                            {/* BAR 2: REFERENCE (DYNAMIC) */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <span className={`transition-colors duration-500 ${mode==='AVG' ? 'text-cyan-400' : 'text-pink-500'}`}>
                                        {mode==='AVG' ? 'Network Average' : 'Shard Apex Leader'}
                                    </span>
                                    <span className="text-white transition-all duration-500">{mode==='AVG' ? '0.4 PB' : '4.5 PB'}</span>
                                </div>
                                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                                    <div 
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2
                                            ${mode==='AVG' ? 'w-[20%] bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'w-[95%] bg-pink-600 shadow-[0_0_15px_#db2777]'}
                                        `}
                                    >
                                    </div>
                                </div>
                            </div>

                            {/* Synthesis Output */}
                            <div className="mt-2 text-center bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                                <p className={`text-[10px] font-mono transition-all duration-500 ${mode === 'AVG' ? 'text-green-400' : 'text-red-400'}`}>
                                    {mode === 'AVG' 
                                        ? ">> RESULT: OUTPERFORMING BASELINE BY +200%" 
                                        : ">> RESULT: TRAILING LEADER BY -73%"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* ===================================================
                    FEATURE 2: GHOST CANVAS EXPORT
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* LEFT COLUMN: TEXT */}
                    <div className="prose prose-invert">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <Layers size={20} className="text-purple-400" />
                            Ghost Canvas Export
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                            Standard browser screenshots fail to capture scrollable data tables. Pulse solves this by mounting a <strong>Ghost Canvas</strong>—a hidden, full-width DOM replication of the dashboard that lives off-screen.
                        </p>
                        <p className="text-zinc-400 leading-relaxed mt-4 text-sm md:text-base">
                            When an export is triggered, the engine vectorizes this ghost element into a <span className="text-white font-bold">5000px pixel-perfect PNG</span>, ensuring that every column, sparkline, and metric is captured with zero artifacting, regardless of the user's actual screen size.
                        </p>
                    </div>

                    {/* RIGHT COLUMN: SIMULATION */}
                    <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-2xl h-full min-h-[280px] flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-2">
                                <ScanLine size={16} className="text-purple-400" />
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Ghost Renderer</span>
                            </div>
                            <button 
                                onClick={triggerScan}
                                disabled={scanning}
                                className={`
                                    text-[10px] font-bold px-4 py-2 rounded-full transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-wide
                                    ${scanning ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'}
                                `}
                            >
                                {scanning ? 'Vectorizing...' : 'Trigger Export'}
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="h-40 bg-zinc-900/30 border border-zinc-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                            {/* The Document Icon */}
                            <div className={`transition-all duration-500 ${scanning ? 'scale-90 opacity-50 blur-[2px]' : 'scale-100 opacity-100'}`}>
                                 <FileImage size={48} className="text-zinc-700"/>
                            </div>

                            {/* Success Message */}
                            {scanning && (
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="font-mono text-purple-400 text-xs bg-black/80 px-3 py-1 rounded border border-purple-500/30 animate-pulse">
                                        RENDERING_PIXELS...
                                    </div>
                                </div>
                            )}

                            {/* The Laser */}
                            {scanning && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_40px_#a855f7] z-10 animate-scan"></div>
                            )}

                            {/* Grid Lines (Background) */}
                            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        </div>

                        {/* Status Footer */}
                        <div className="mt-6 flex items-center justify-between">
                             <div className="text-[9px] font-mono text-zinc-500">CANVAS_SIZE: 5000px × 3200px</div>
                             <div className="flex gap-1">
                                 <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-purple-500 animate-bounce' : 'bg-zinc-800'}`}></div>
                                 <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-purple-500 animate-bounce delay-100' : 'bg-zinc-800'}`}></div>
                                 <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-purple-500 animate-bounce delay-200' : 'bg-zinc-800'}`}></div>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
            <style>{`
                @keyframes scan { 
                    0% { left: -10%; opacity: 0; } 
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 110%; opacity: 0; } 
                }
                .animate-scan { animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            `}</style>
        </ChapterLayout>
    );
}
