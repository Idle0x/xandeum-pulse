import { useState } from 'react';
import { Swords, Layers, RefreshCw, FileImage, MousePointer2 } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const COMPARE_LOGIC_SNIPPET = `
const leaderColumns = useMemo(() => {
  return activeLeaderMetrics.map(metric => {
    // Finds the 'Apex' node for the specific category dynamically
    const node = availableNodes.reduce((p, c) => 
      (p[metric.toLowerCase()] || 0) > (c[metric.toLowerCase()] || 0) ? p : c
    );
    return { metric, node };
  });
}, [activeLeaderMetrics, availableNodes]);

// Ghost Canvas: Render hidden 5000px DOM for pixel-perfect PNG
const exportReport = async () => {
  const ghost = renderToStaticMarkup(<GhostTable data={fullFleet} />);
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
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Swords size={12}/> Analysis Suite
                </div>
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Comparative Intelligence</h2>
                
                <div className="max-w-4xl mx-auto text-left space-y-6">
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The <strong>Comparative Intelligence</strong> suite is the most complex module in the platform, moving beyond basic head-to-head metrics to provide high-precision benchmarking for massive fleets of 30 or even 50+ nodes. Built on a <strong>Pivot & Spotlight</strong> philosophy, the system allows operators to dynamically swap their "Baseline"—comparing selected nodes against the real-time Network Average or specific high-performance leaders (Apex Nodes). This creates a "War Room" environment where users can evaluate their hardware commitment and earnings efficiency through live, multi-dimensional charts.
                    </p>
                    <p className="text-zinc-300 text-base leading-relaxed">
                        This suite acts as the primary data provider for the <strong>Synthesis Engine</strong>, which constantly monitors the state of the comparison table to compile relevant analytical context. Using the <code>useNetworkData</code> hook, the system fetches a global snapshot of the Xandeum network, performing real-time math to calculate deltas and historical reliability via 30-day stability ribbons. When a user interacts with the charts or map, the Synthesis Engine instantly synchronizes the visuals—highlighting the specific node in the legend and table while updating the narrative log.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <GhostCanvasSimulator />
                <PivotLogicSimulator />
            </div>
        </LogicWrapper>
    )
}

function GhostCanvasSimulator() {
    const [scanning, setScanning] = useState(false);
    const handleScan = () => {
        setScanning(true);
        setTimeout(() => setScanning(false), 2500);
    };

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Layers size={20}/></div>
                    <h3 className="font-bold text-white text-lg tracking-tight">Ghost Canvas</h3>
                </div>
                <button onClick={handleScan} disabled={scanning} className="text-[10px] bg-purple-600 text-white px-4 py-2 rounded-full font-bold transition-all disabled:opacity-50">
                    {scanning ? 'RENDERING...' : 'EXPORT PNG'}
                </button>
            </div>
            <div className="relative border border-zinc-800 bg-zinc-900/30 rounded-2xl h-48 flex items-center justify-center overflow-hidden">
                {scanning && <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,1)] z-20 animate-[scan_2.5s_linear]"></div>}
                <div className="flex flex-col items-center gap-3 text-zinc-600">
                    <FileImage size={48} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Capturing 5000px Expanded DOM</span>
                </div>
            </div>
        </div>
    )
}

function PivotLogicSimulator() {
    const [mode, setMode] = useState<'AVG' | 'LEADER'>('AVG');
    return (
        <div className="bg-black border border-zinc-800 rounded-3xl p-8 h-full flex flex-col shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 text-pink-500"><RefreshCw size={20}/> <h3 className="font-bold text-white text-lg">Pivot Logic</h3></div>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button onClick={() => setMode('AVG')} className={`px-3 py-1.5 text-[10px] font-bold rounded ${mode==='AVG' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>VS AVG</button>
                    <button onClick={() => setMode('LEADER')} className={`px-3 py-1.5 text-[10px] font-bold rounded ${mode==='LEADER' ? 'bg-pink-600 text-white' : 'text-zinc-500'}`}>VS LEADER</button>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-zinc-900/30 rounded-xl border border-zinc-800"><span className="text-xs text-zinc-400 font-bold">Node 8x...2A</span><span className="text-sm font-mono font-bold text-white">1.2 PB</span></div>
                <div className="flex justify-between items-center p-4 bg-zinc-900/30 rounded-xl border border-zinc-800 relative">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${mode === 'AVG' ? 'bg-zinc-500' : 'bg-pink-500'}`}></div>
                    <span className="text-xs text-zinc-400 font-bold">{mode === 'AVG' ? 'Network Average' : 'Apex Node'}</span>
                    <span className="text-sm font-mono font-bold text-zinc-500">{mode === 'AVG' ? '290 GB' : '4.5 PB'}</span>
                </div>
            </div>
        </div>
    )
}
