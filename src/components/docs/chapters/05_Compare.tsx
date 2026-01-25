import { useState } from 'react';
import { Swords, Layers, RefreshCw, FileImage } from 'lucide-react';

export function CompareChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-16">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Swords size={12}/> Comparative Intelligence
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Pivot & Spotlight</h2>
                <p className="text-zinc-500 max-w-2xl mx-auto">
                    The Compare module allows head-to-head analysis. Use the <span className="text-purple-400 font-bold">Ghost Canvas Engine</span> to render high-resolution reports off-screen.
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
        setTimeout(() => setScanning(false), 2000);
    };

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Layers className="text-purple-500" size={20}/>
                    <h3 className="font-bold text-white">Ghost Canvas</h3>
                </div>
                <button onClick={handleScan} className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-colors">
                    {scanning ? 'RENDERING...' : 'GENERATE REPORT'}
                </button>
            </div>
            
            <div className="relative border border-zinc-800 bg-zinc-900/50 rounded-lg h-40 flex items-center justify-center overflow-hidden">
                {scanning && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-[scan_2s_linear]"></div>
                )}
                {scanning ? (
                    <div className="text-xs font-mono text-purple-400 animate-pulse">CAPTURING PIXELS...</div>
                ) : (
                    <FileImage className="text-zinc-700" size={48} />
                )}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
                The engine renders a 5000px wide hidden table to capture all columns, bypassing browser scrollbars.
            </p>
        </div>
    )
}

function PivotLogicSimulator() {
    const [mode, setMode] = useState<'AVG' | 'LEADER'>('AVG');

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-6">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <RefreshCw className="text-pink-500" size={20}/>
                    <h3 className="font-bold text-white">Pivot Logic</h3>
                </div>
                <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
                    <button onClick={() => setMode('AVG')} className={`px-2 py-0.5 text-[9px] font-bold rounded ${mode==='AVG' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>VS AVG</button>
                    <button onClick={() => setMode('LEADER')} className={`px-2 py-0.5 text-[9px] font-bold rounded ${mode==='LEADER' ? 'bg-pink-600 text-white' : 'text-zinc-500'}`}>VS LEADER</button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-zinc-900/30 rounded border border-zinc-800">
                    <span className="text-xs text-zinc-400">Your Storage</span>
                    <span className="text-sm font-bold text-white">12 TB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-900/30 rounded border border-zinc-800">
                    <span className="text-xs text-zinc-400">{mode === 'AVG' ? 'Network Average' : 'Leader (8x..2A)'}</span>
                    <span className="text-sm font-bold text-zinc-500">{mode === 'AVG' ? '8 TB' : '150 TB'}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded border ${mode === 'AVG' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <span className="text-xs font-bold uppercase">{mode === 'AVG' ? 'Advantage' : 'Deficit'}</span>
                    <span className={`text-lg font-black ${mode === 'AVG' ? 'text-green-500' : 'text-red-500'}`}>
                        {mode === 'AVG' ? '+4 TB' : '-138 TB'}
                    </span>
                </div>
            </div>
        </div>
    )
}
