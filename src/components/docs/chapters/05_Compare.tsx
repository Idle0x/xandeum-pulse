import { useState, useEffect } from 'react';
import { 
  Layers, Swords, FileImage, ScanLine, BarChart3, 
  Terminal, ArrowRight, Download, FileSpreadsheet, 
  CheckCircle2, Grid
} from 'lucide-react';

// --- CODE SNIPPET ---
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
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-24">

            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 bg-pink-500/10 px-2 py-1 rounded">
                        Chapter 05
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Analytics Suite</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    Pivoting baselines and high-fidelity reporting engines. The Analytics Suite moves beyond simple dashboards, offering forensic-grade comparisons and high-resolution export tools that capture the full topology of the network.
                </p>
            </div>

            {/* ===================================================
                SECTION 1: COMPARATIVE INTELLIGENCE (Text Left, Sim Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* LEFT: Text */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                <Swords size={24} className="text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Comparative Intelligence</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                             This suite moves beyond basic head-to-head metrics. Built on a <strong>Pivot & Spotlight</strong> philosophy, the dashboard allows operators to dynamically swap their "Baseline"—comparing selected nodes against the real-time Network Average or specific high-performance leaders (Apex Nodes).
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            When a baseline is shifted, the Synthesis Engine recalculates the <code className="text-pink-400 bg-pink-500/10 px-1 py-0.5 rounded text-xs">performanceDelta</code> for every active node in real-time, instantly re-contextualizing the fleet's performance against the new standard.
                        </p>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <PivotSimulator />

            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            {/* ===================================================
                SECTION 2: GHOST CANVAS EXPORT (Sim Left, Text Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* LEFT: Simulation */}
                <div className="order-2 lg:order-1">
                    <GhostExportSimulator />
                </div>

                {/* RIGHT: Text */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Layers size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Ghost Canvas Export</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Standard browser screenshots fail to capture scrollable data tables. Pulse solves this by mounting a <strong>Ghost Canvas</strong>—a hidden, full-width DOM replication of the dashboard that lives off-screen.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            When an export is triggered, the engine vectorizes this ghost element into a <strong>5000px pixel-perfect PNG report</strong>. It reconstructs every column, sparkline, and metric with zero artifacting, ensuring forensic-grade clarity regardless of the user's screen size.
                        </p>
                    </div>

                    <div className="flex gap-4 text-[10px] font-bold uppercase text-zinc-500 border-t border-zinc-900 pt-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-purple-500 rounded-sm"></div> 
                             Vectorized Data
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-zinc-600 rounded-sm"></div> 
                             Hidden DOM
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
                           src/logic/compare-engine.ts
                     </div>
                     <TypewriterCode code={COMPARE_CODE.trim()} />
                </div>
            </div>

        </section>
    );
}


// --- SIMULATION 1: PIVOT LOGIC ---
function PivotSimulator() {
    const [mode, setMode] = useState<'AVG' | 'APEX'>('AVG');

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden min-h-[300px] justify-center">
             
             {/* Header */}
             <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-pink-500" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Pivot Logic</span>
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
            <div className="flex flex-col gap-6 relative z-10">
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
                <div className="mt-2 text-center bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50 flex items-center justify-center gap-2">
                    <ArrowRight size={12} className={`transition-transform duration-500 ${mode === 'AVG' ? '-rotate-45 text-green-400' : 'rotate-45 text-red-400'}`}/>
                    <p className={`text-[10px] font-mono transition-all duration-500 ${mode === 'AVG' ? 'text-green-400' : 'text-red-400'}`}>
                        {mode === 'AVG' 
                            ? "RESULT: OUTPERFORMING BASELINE BY +200%" 
                            : "RESULT: TRAILING LEADER BY -73%"
                        }
                    </p>
                </div>
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        </div>
    )
}

// --- SIMULATION 2: GHOST CANVAS EXPORT (REIMAGINED) ---
function GhostExportSimulator() {
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'GENERATING' | 'READY'>('IDLE');
    const [rows, setRows] = useState<number>(0);

    const triggerScan = () => {
        if (status !== 'IDLE') return;
        setStatus('SCANNING');
        
        // Sequence
        setTimeout(() => {
            setStatus('GENERATING');
            // Generate rows effect
            let r = 0;
            const interval = setInterval(() => {
                r += 1;
                setRows(r);
                if(r >= 6) clearInterval(interval);
            }, 300);
        }, 1500);

        setTimeout(() => {
            setStatus('READY');
        }, 4000);

        setTimeout(() => {
            setStatus('IDLE');
            setRows(0);
        }, 7000);
    };

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl h-[340px] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <ScanLine size={16} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Ghost Renderer</span>
                </div>
                <button 
                    onClick={triggerScan}
                    disabled={status !== 'IDLE'}
                    className={`
                        text-[10px] font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-wide
                        ${status === 'IDLE' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-zinc-800 text-zinc-500'}
                    `}
                >
                    {status === 'IDLE' ? 'Trigger Export' : status === 'READY' ? 'Download Ready' : 'Processing...'}
                </button>
            </div>

            {/* REPORT CANVAS */}
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4">
                
                {/* IDLE STATE */}
                {status === 'IDLE' && (
                    <div className="text-center opacity-50 animate-pulse">
                        <FileSpreadsheet size={48} className="text-zinc-600 mx-auto mb-2" />
                        <span className="text-[10px] font-mono text-zinc-500">AWAITING_TRIGGER_EVENT</span>
                    </div>
                )}

                {/* SCANNING STATE (Laser) */}
                {status === 'SCANNING' && (
                    <div className="absolute inset-0 z-20">
                         <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_50px_#a855f7] animate-[scanY_1.5s_infinite]"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="bg-black/80 px-4 py-2 rounded border border-purple-500/30 text-purple-400 font-mono text-xs">
                                 CAPTURING_HIDDEN_DOM...
                             </div>
                         </div>
                    </div>
                )}

                {/* GENERATING STATE (Building Table) */}
                {(status === 'GENERATING' || status === 'READY') && (
                    <div className="w-full h-full bg-white rounded shadow-2xl p-4 flex flex-col gap-2 scale-90 origin-center transition-all duration-500">
                        {/* Fake Header */}
                        <div className="h-6 w-full bg-zinc-100 rounded flex gap-2 px-2 items-center">
                            <div className="w-16 h-2 bg-zinc-300 rounded"></div>
                            <div className="w-16 h-2 bg-zinc-300 rounded"></div>
                            <div className="w-16 h-2 bg-zinc-300 rounded"></div>
                        </div>
                        {/* Fake Rows */}
                        {[...Array(6)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-4 w-full border-b border-zinc-100 flex gap-2 px-2 items-center transition-all duration-300 ${i < rows ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                            >
                                <div className="w-12 h-1.5 bg-zinc-200 rounded"></div>
                                <div className="w-8 h-1.5 bg-purple-100 rounded"></div>
                                <div className="w-24 h-1.5 bg-zinc-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* READY STATE OVERLAY */}
                {status === 'READY' && (
                    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in">
                         <div className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl shadow-2xl text-center">
                             <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                             <div className="text-white font-bold text-sm mb-1">Report Generated</div>
                             <div className="text-zinc-500 text-[10px] font-mono mb-3">report_full_topology.png (4.2MB)</div>
                             <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-[10px] font-bold mx-auto">
                                 <Download size={12} /> SAVE TO DISK
                             </button>
                         </div>
                    </div>
                )}

            </div>

             <style>{`
                @keyframes scanY { 
                    0% { top: 0%; opacity: 0; } 
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; } 
                }
            `}</style>
        </div>
    );
}

// --- TYPEWRITER COMPONENT ---
function TypewriterCode({ code }: { code: string }) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplay('');
        const interval = setInterval(() => {
            setDisplay(prev => prev + code.charAt(i));
            i++;
            if (i > code.length) clearInterval(interval);
        }, 3); 
        return () => clearInterval(interval);
    }, [code]);

    return (
        <pre className="font-mono text-xs md:text-sm leading-relaxed text-pink-300/90 whitespace-pre-wrap">
            {display}
            <span className="animate-pulse inline-block w-2 h-4 bg-pink-500 align-middle ml-1"></span>
        </pre>
    );
}
