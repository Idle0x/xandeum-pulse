import { useState } from 'react';
import { Swords, Layers, RefreshCw, FileImage, BarChart2 } from 'lucide-react';

export function CompareChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Swords size={12}/> Comparative Intelligence
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Pivot & Spotlight</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                    The Compare module allows head-to-head analysis of up to 30 nodes. 
                    It includes a <span className="text-purple-400 font-bold">Ghost Canvas Engine</span> to render high-resolution reports off-screen.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* 1. Ghost Canvas Sim */}
                <GhostCanvasSimulator />

                {/* 2. Pivot Logic Sim */}
                <PivotLogicSimulator />
            </div>
        </div>
    )
}

function GhostCanvasSimulator() {
    const [scanning, setScanning] = useState(false);
    
    const handleScan = () => {
        setScanning(true);
        setTimeout(() => setScanning(false), 2500);
    };

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Layers size={20}/></div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Ghost Canvas</h3>
                        <div className="text-[10px] text-zinc-500 font-mono">OFF-SCREEN RENDER ENGINE</div>
                    </div>
                </div>
                <button 
                    onClick={handleScan} 
                    disabled={scanning}
                    className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {scanning ? 'RENDERING...' : 'GENERATE REPORT'}
                </button>
            </div>
            
            <div className="relative border border-zinc-800 bg-zinc-900/30 rounded-xl h-48 flex items-center justify-center overflow-hidden">
                {scanning && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,1)] z-20 animate-[scan_2.5s_linear]"></div>
                )}
                
                {scanning ? (
                    <div className="text-center animate-pulse">
                        <div className="text-xs font-mono text-purple-400 mb-2">CAPTURING PIXELS (5000px WIDTH)...</div>
                        <div className="w-32 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-purple-500 animate-[progress_2.5s_linear]"></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-zinc-600 group-hover:text-zinc-500 transition-colors">
                        <FileImage size={48} />
                        <span className="text-xs font-bold">READY TO EXPORT</span>
                    </div>
                )}
            </div>
            
            <p className="mt-6 text-xs text-zinc-500 leading-relaxed">
                Browser scrollbars ruin screenshots. Ghost Canvas renders a <strong>hidden copy</strong> of your data table at full width, captures it, and destroys it in &lt; 200ms.
            </p>
        </div>
    )
}

function PivotLogicSimulator() {
    const [mode, setMode] = useState<'AVG' | 'LEADER'>('AVG');

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><RefreshCw size={20}/></div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Pivot Logic</h3>
                        <div className="text-[10px] text-zinc-500 font-mono">BASELINE COMPARISON</div>
                    </div>
                </div>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button onClick={() => setMode('AVG')} className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${mode==='AVG' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>VS AVG</button>
                    <button onClick={() => setMode('LEADER')} className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${mode==='LEADER' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]' : 'text-zinc-500 hover:text-zinc-300'}`}>VS LEADER</button>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-400 font-bold">Your Storage</span>
                    <span className="text-sm font-mono font-bold text-white">12 TB</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-zinc-900/30 rounded-xl border border-zinc-800 relative overflow-hidden transition-all duration-500">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${mode === 'AVG' ? 'bg-zinc-500' : 'bg-pink-500'}`}></div>
                    <span className="text-xs text-zinc-400 font-bold">{mode === 'AVG' ? 'Network Average' : 'Sector Leader (8x..2A)'}</span>
                    <span className="text-sm font-mono font-bold text-zinc-500 transition-all key={mode} animate-in fade-in slide-in-from-right-2">
                        {mode === 'AVG' ? '8 TB' : '150 TB'}
                    </span>
                </div>

                <div className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-500 ${mode === 'AVG' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <span className={`text-xs font-bold uppercase ${mode === 'AVG' ? 'text-green-500' : 'text-red-500'}`}>
                        {mode === 'AVG' ? 'Advantage' : 'Deficit'}
                    </span>
                    <span className={`text-xl font-black tracking-tight ${mode === 'AVG' ? 'text-green-400' : 'text-red-400'}`}>
                        {mode === 'AVG' ? '+4 TB' : '-138 TB'}
                    </span>
                </div>
            </div>
        </div>
    )
}
