import { useState } from 'react';
import { Layers, Swords, ArrowRight, FileImage, MousePointer2 } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const COMPARE_TEXT = [
    {
        title: "Comparative Intelligence",
        content: "This suite moves beyond basic head-to-head metrics. Built on a Pivot & Spotlight philosophy, it allows operators to dynamically swap their 'Baseline'—comparing selected nodes against the real-time Network Average or specific high-performance leaders (Apex Nodes)."
    },
    {
        title: "Ghost Canvas Export",
        content: "Standard screenshots cut off scrollable data. Pulse renders a hidden, full-width copy of the dashboard off-screen (Ghost Canvas) to capture every node in the fleet, generating a pixel-perfect 5000px PNG report."
    }
];

const COMPARE_CODE = `
// Ghost Canvas Renderer
const captureTopology = async () => {
  setScanning(true);
  
  // 1. Mount Hidden DOM
  const ghost = <HiddenTable data={fullFleet} />;
  
  // 2. Vectorize & Rasterize
  const png = await htmlToImage(ghost, {
    width: 5000,
    quality: 1.0
  });
  
  return download(png);
};
`;

export function CompareChapter() {
    const [scanning, setScanning] = useState(false);
    const [mode, setMode] = useState<'AVG' | 'APEX'>('AVG');

    const triggerScan = () => {
        setScanning(true);
        setTimeout(() => setScanning(false), 2000);
    };

    return (
        <ChapterLayout
            chapterNumber="05"
            title="Analytics Suite"
            subtitle="Pivoting baselines and high-fidelity reporting engines."
            textData={COMPARE_TEXT}
            codeSnippet={COMPARE_CODE}
            githubPath="src/logic/compare-engine.ts"
        >
            <div className="flex flex-col h-full bg-[#080808] p-8 gap-8">
                
                {/* 1. GHOST CANVAS SIMULATOR */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Layers size={18} className="text-purple-400"/>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ghost Canvas</span>
                        </div>
                        <button 
                            onClick={triggerScan}
                            disabled={scanning}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-4 py-2 rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {scanning ? 'Rendering...' : 'Export Report'}
                        </button>
                    </div>

                    {/* Preview Area */}
                    <div className="h-32 bg-black border border-zinc-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                        <FileImage size={32} className="text-zinc-700"/>
                        
                        {/* The Laser */}
                        {scanning && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_30px_#a855f7] animate-[scan_2s_ease-in-out]"></div>
                        )}
                        {/* Progress */}
                        {scanning && (
                            <div className="absolute bottom-4 w-1/2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 animate-[progress_2s_linear]"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. PIVOT TABLE SIMULATOR */}
                <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Swords size={18} className="text-pink-400"/>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pivot Logic</span>
                        </div>
                        {/* Toggle */}
                        <div className="flex bg-black p-1 rounded-lg border border-zinc-800 relative">
                             {/* Hint Dot */}
                             {mode === 'AVG' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>}
                             <button onClick={() => setMode('AVG')} className={`px-3 py-1 rounded text-[9px] font-bold transition-all ${mode==='AVG' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>VS AVG</button>
                             <button onClick={() => setMode('APEX')} className={`px-3 py-1 rounded text-[9px] font-bold transition-all ${mode==='APEX' ? 'bg-pink-600 text-white shadow' : 'text-zinc-500'}`}>VS APEX</button>
                        </div>
                    </div>

                    {/* Animated Bars */}
                    <div className="space-y-6 flex-1 justify-center flex flex-col">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                <span>Your Node</span>
                                <span className="text-white">1.2 PB</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full w-[40%] bg-zinc-500 rounded-full"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                <span className={mode==='APEX'?'text-pink-500 transition-colors':'transition-colors'}>{mode==='AVG' ? 'Network Avg' : 'Shard Apex'}</span>
                                <span className="text-white transition-all key={mode}">{mode==='AVG' ? '290 GB' : '4.5 PB'}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${mode==='AVG' ? 'w-[10%] bg-zinc-700' : 'w-[95%] bg-pink-600'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes scan { 0% { left: 0%; } 100% { left: 100%; } }`}</style>
        </ChapterLayout>
    );
}
