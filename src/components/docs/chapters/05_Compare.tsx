import { useState } from 'react';
import { Swords, Layers, RefreshCw, FileImage, MousePointer2, ArrowRight, Trophy } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const COMPARE_LOGIC_SNIPPET = `
const leaderColumns = useMemo(() => {
  return activeLeaderMetrics.map(metric => {
    // Dynamic 'Apex' Node Discovery
    const node = availableNodes.reduce((p, c) => 
      (p[metric] > c[metric]) ? p : c
    );
    return { metric, node };
  });
}, [activeLeaderMetrics]);

// Ghost Canvas: Off-screen DOM rendering
const exportReport = async () => {
  const ghost = renderToStaticMarkup(<GhostTable data={fleet} />);
  return await htmlToImage(ghost, { width: 5000 });
};
`;

export function CompareChapter() {
    return (
        <LogicWrapper 
            title="Comparative_Intelligence.ts" 
            code={COMPARE_LOGIC_SNIPPET} 
            githubPath="src/logic/compare-engine.ts"
        >
            <div className="flex flex-col gap-8 h-full">
                <GhostCanvasSimulator />
                <PivotLogicSimulator />
            </div>
        </LogicWrapper>
    );
}

function GhostCanvasSimulator() {
    const [scanning, setScanning] = useState(false);

    const handleScan = () => {
        setScanning(true);
        setTimeout(() => setScanning(false), 2500);
    };

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-purple-400">
                        <Layers size={20}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-tight">Ghost Canvas</h3>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Off-Screen Renderer</div>
                    </div>
                </div>
                <button 
                    onClick={handleScan} 
                    disabled={scanning}
                    className="flex items-center gap-2 text-[10px] bg-purple-500/10 border border-purple-500/50 hover:bg-purple-500 hover:text-white text-purple-400 px-4 py-2 rounded-full font-bold transition-all disabled:opacity-50"
                >
                    {scanning ? 'CAPTURING DOM...' : 'EXPORT REPORT'}
                </button>
            </div>

            {/* The Canvas Simulation */}
            <div className="relative border border-zinc-800 bg-[#0a0a0a] rounded-xl h-40 flex items-center justify-center overflow-hidden">
                
                {/* The "Laser" Scanner */}
                {scanning && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,1)] z-20 animate-[scanVertical_2.5s_ease-in-out]"></div>
                )}

                {/* Content being scanned */}
                <div className={`transition-all duration-300 ${scanning ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    {scanning ? (
                        <div className="text-center">
                            <div className="text-xs font-mono text-purple-400 mb-2 uppercase tracking-widest animate-pulse">Rendering 5000px Topology...</div>
                            <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                                <div className="h-full bg-purple-500 animate-[progress_2.5s_linear]"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                            <FileImage size={32} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Canvas Idle</span>
                        </div>
                    )}
                </div>
            </div>

             <style>{`
                @keyframes scanVertical {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function PivotLogicSimulator() {
    const [mode, setMode] = useState<'AVG' | 'LEADER'>('AVG');

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2rem] p-8 h-full flex flex-col shadow-2xl relative overflow-hidden">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-pink-500">
                        <Swords size={20}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-tight">Pivot & Spotlight</h3>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Comparative Analytics</div>
                    </div>
                </div>
                
                {/* Tactile Switch */}
                <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                    <button onClick={() => setMode('AVG')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${mode==='AVG' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>VS AVG</button>
                    <button onClick={() => setMode('LEADER')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${mode==='LEADER' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>VS APEX</button>
                </div>
            </div>

            {/* The Chart */}
            <div className="space-y-6 flex-1 relative z-10">
                
                {/* Row 1: Your Node */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                        <span>Node 8x...2A (You)</span>
                        <span className="text-white">1.2 PB</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div className="h-full bg-zinc-400 w-[40%] rounded-full"></div>
                    </div>
                </div>

                {/* Row 2: Comparison Target (Animated) */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                        <span className={`transition-colors duration-500 ${mode === 'LEADER' ? 'text-pink-500' : 'text-zinc-500'}`}>
                            {mode === 'AVG' ? 'Network Average' : 'Shard Leader (Apex)'}
                        </span>
                        <span className="text-white transition-all key={mode}">
                            {mode === 'AVG' ? '290 GB' : '4.5 PB'}
                        </span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                        {/* The Bar Animates Width */}
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${mode === 'AVG' ? 'w-[10%] bg-zinc-600' : 'w-[95%] bg-pink-600'}`}
                        ></div>
                    </div>
                </div>

                {/* Result Pill */}
                <div className={`
                    mt-4 p-4 rounded-xl border flex items-center justify-between transition-all duration-500
                    ${mode === 'AVG' ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${mode === 'AVG' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                            {mode === 'AVG' ? <ArrowRight size={12} className="-rotate-45"/> : <ArrowRight size={12} className="rotate-45"/>}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${mode === 'AVG' ? 'text-green-500' : 'text-red-500'}`}>
                            {mode === 'AVG' ? 'Hardware Advantage' : 'Hardware Deficit'}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-lg ${mode === 'AVG' ? 'text-green-400' : 'text-red-400'}`}>
                        {mode === 'AVG' ? '+310%' : '-73%'}
                    </span>
                </div>
            </div>
        </div>
    );
}
