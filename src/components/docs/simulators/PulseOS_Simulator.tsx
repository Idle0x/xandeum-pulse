import { useState, useEffect } from 'react';
import { 
    Lock, RotateCcw, LayoutGrid, List, Activity, 
    RefreshCw, Globe, Swords, Camera, X, Database, 
    ChevronRight, Server, Shield, Zap
} from 'lucide-react';

type View = 'DASH' | 'MODAL' | 'MAP' | 'COMPARE' | 'PROOF' | 'HEALTH_SIM';

export function PulseOS_Simulator() {
    const [view, setView] = useState<View>('DASH');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
    const [url, setUrl] = useState('https://xandeum-pulse.vercel.app');
    const [isAnimating, setIsAnimating] = useState(false);
    const [cycleStep, setCycleStep] = useState(0);

    // Initial Typewriter Effect for URL bar
    useEffect(() => {
        let i = 0;
        const target = 'https://xandeum-pulse.vercel.app';
        const interval = setInterval(() => {
            if(i <= target.length) { 
                setUrl(target.slice(0,i)); 
                i++; 
            } else { 
                clearInterval(interval); 
            }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    // Metric Cycling Logic (Simulating the live dashboard)
    useEffect(() => {
        const interval = setInterval(() => {
            setCycleStep(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const navigate = (target: View) => {
        setIsAnimating(true);
        
        // Update URL based on route
        let newUrl = 'https://xandeum-pulse.vercel.app';
        if (target === 'MODAL') newUrl += '/inspector?node=8x...2A';
        if (target === 'MAP') newUrl += '/map';
        if (target === 'COMPARE') newUrl += '/compare';
        
        setUrl(newUrl);

        setTimeout(() => {
            setView(target);
            setIsAnimating(false);
        }, 600);
    };

    return (
        <div className="w-full h-full flex flex-col font-sans text-sm select-none bg-black text-zinc-300">
            {/* --- SIMULATED BROWSER BAR --- */}
            <div className="h-10 bg-[#18181b] border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500/50 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-yellow-500/50 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-green-500/50 rounded-full"></div>
                </div>
                <div className="flex-1 bg-black rounded border border-zinc-800 h-6 flex items-center px-3 text-[10px] font-mono text-zinc-400 justify-between group">
                    <div className="flex items-center truncate">
                        <Lock size={8} className="mr-2 text-green-500"/>
                        {url}
                    </div>
                    <RotateCcw 
                        size={10} 
                        className="cursor-pointer group-hover:text-white transition-colors" 
                        onClick={() => navigate('DASH')}
                    />
                </div>
            </div>

            {/* --- MAIN VIEWPORT --- */}
            <div className="flex-1 relative bg-black overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black">
                
                {/* 1. DASHBOARD VIEW */}
                {view === 'DASH' && (
                    <div className="absolute inset-0 p-6 md:p-8 animate-in fade-in duration-500 flex flex-col overflow-y-auto scrollbar-hide">
                        
                        {/* Header & Controls */}
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <div>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20}/> Network Overview
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                    MAINNET • 1,240 NODES
                                </div>
                            </div>

                            {/* Grid/List Toggle */}
                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                <button 
                                    onClick={() => setLayoutMode('GRID')}
                                    className={`p-2 rounded transition-all ${layoutMode === 'GRID' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={16}/>
                                </button>
                                <button 
                                    onClick={() => setLayoutMode('LIST')}
                                    className={`p-2 rounded transition-all ${layoutMode === 'LIST' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="List View"
                                >
                                    <List size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* GRID LAYOUT (Visual) */}
                        {layoutMode === 'GRID' && (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Hero Node (Active) */}
                                <div onClick={() => navigate('MODAL')} className="h-44 border border-blue-500 bg-zinc-900 rounded-xl p-5 flex flex-col justify-between cursor-pointer shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:scale-[1.02] transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-full">INSPECT</div>
                                    </div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xs font-bold text-blue-400 mb-1">NODE-8X...2A</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">Lisbon, PT</div>
                                        </div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                    </div>

                                    {/* Cyclic Data Display */}
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            {cycleStep === 0 ? 'Vitality Score' : cycleStep === 1 ? 'Storage Used' : 'Uptime'}
                                        </div>
                                        <div className="text-3xl font-black text-white">
                                            {cycleStep === 0 ? '98%' : cycleStep === 1 ? '1.2 PB' : '14d 2h'}
                                        </div>
                                    </div>
                                </div>

                                {/* Standard Nodes */}
                                {[2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-44 border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col justify-between opacity-60 hover:opacity-100 transition-all cursor-not-allowed">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-zinc-500">NODE-0{i}</span>
                                            <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase">Vitality Score</div>
                                            <div className="text-3xl font-bold text-zinc-400">{80 - (i*5)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* LIST LAYOUT (Density) */}
                        {layoutMode === 'LIST' && (
                             <div className="border border-zinc-800 rounded-xl bg-zinc-900/20 overflow-hidden flex flex-col">
                                <div className="grid grid-cols-5 gap-4 p-3 bg-zinc-900/50 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                                    <div className="col-span-2">Identity</div>
                                    <div>Health</div>
                                    <div>Storage</div>
                                    <div className="text-right">Status</div>
                                </div>
                                
                                {/* Hero Row */}
                                <div onClick={() => navigate('MODAL')} className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800 text-xs items-center bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition-colors group">
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="p-1.5 rounded bg-blue-500/20 text-blue-400"><Server size={12}/></div>
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">8x...2A (You)</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">192.168.1.1</div>
                                        </div>
                                    </div>
                                    <div className="text-green-400 font-bold">98%</div>
                                    <div className="text-zinc-300 font-mono">1.2 PB</div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30">ONLINE</span>
                                    </div>
                                </div>

                                {/* Standard Rows */}
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800/50 text-xs items-center hover:bg-zinc-900/50 opacity-60">
                                        <div className="col-span-2 flex items-center gap-3">
                                            <div className="p-1.5 rounded bg-zinc-800 text-zinc-600"><Server size={12}/></div>
                                            <div className="font-mono text-zinc-500">7z...9B{i}</div>
                                        </div>
                                        <div className="text-zinc-500">{70 - i}%</div>
                                        <div className="text-zinc-600 font-mono">12 TB</div>
                                        <div className="text-right">
                                            <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-600 text-[10px] font-bold border border-zinc-700">SYNCING</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. MODAL VIEW (Inspector) */}
                {view === 'MODAL' && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-300 backdrop-blur-sm">
                        <div className="w-full max-w-4xl bg-[#09090b] border border-zinc-700 rounded-2xl h-full flex flex-col shadow-2xl overflow-hidden relative">
                            
                            {/* Modal Header */}
                            <div className="p-4 border-b border-zinc-800 flex justify-between bg-zinc-900/50 shrink-0 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-bold text-white">Node Inspector</span>
                                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">ID: 8x...2A</span>
                                </div>
                                <button 
                                    onClick={() => navigate('DASH')}
                                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                                {/* Left Col: Stats */}
                                <div className="space-y-4">
                                    <div className="p-5 border border-green-500/30 rounded-xl bg-green-500/5 relative overflow-hidden group hover:bg-green-500/10 transition-colors">
                                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Activity className="text-green-500" size={24} />
                                        </div>
                                        <div className="text-xs font-bold text-green-500 mb-2 uppercase tracking-wider">Vitality Score</div>
                                        <div className="text-5xl font-black text-white tracking-tight">98 <span className="text-lg text-zinc-500 font-medium">/ 100</span></div>
                                        <div className="mt-4 flex gap-1">
                                            {[1,1,1,1,1,1,1,1,1,0.5].map((v, i) => (
                                                <div key={i} className={`h-1.5 flex-1 rounded-full ${v===1 ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                                            <div className="text-[10px] font-bold text-purple-400 mb-2 uppercase flex items-center gap-2"><Database size={12}/> Storage</div>
                                            <div className="text-2xl font-bold text-white">1.2 PB</div>
                                        </div>
                                        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                                            <div className="text-[10px] font-bold text-yellow-500 mb-2 uppercase flex items-center gap-2"><Zap size={12}/> Credits</div>
                                            <div className="text-2xl font-bold text-white">5.4M</div>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                                        <div className="text-[10px] font-bold text-zinc-500 mb-3 uppercase">Identity & Fleet</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-400">IP Address</span>
                                                <span className="text-white font-mono">192.168.1.1</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-400">Version</span>
                                                <span className="text-green-400 font-mono">v3.2.0 (Latest)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Actions */}
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2 ml-1">Quick Actions</div>
                                    
                                    <button 
                                        onClick={() => navigate('COMPARE')} 
                                        className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 hover:border-purple-500/50 text-left flex items-center gap-4 transition-all group"
                                    >
                                        <div className="p-2 bg-black rounded-lg border border-zinc-800 group-hover:border-purple-500 text-purple-500"><Swords size={20}/></div>
                                        <div>
                                            <div className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">Compare vs Network</div>
                                            <div className="text-[10px] text-zinc-500">Run head-to-head analysis</div>
                                        </div>
                                        <ChevronRight className="ml-auto text-zinc-600 group-hover:text-white" size={16}/>
                                    </button>

                                    <button 
                                        onClick={() => navigate('PROOF')} 
                                        className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 hover:border-green-500/50 text-left flex items-center gap-4 transition-all group"
                                    >
                                        <div className="p-2 bg-black rounded-lg border border-zinc-800 group-hover:border-green-500 text-green-500"><Camera size={20}/></div>
                                        <div>
                                            <div className="font-bold text-white text-sm group-hover:text-green-400 transition-colors">Proof of Pulse</div>
                                            <div className="text-[10px] text-zinc-500">Generate verified report card</div>
                                        </div>
                                        <ChevronRight className="ml-auto text-zinc-600 group-hover:text-white" size={16}/>
                                    </button>

                                    <button 
                                        onClick={() => navigate('MAP')} 
                                        className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 text-left flex items-center gap-4 transition-all group"
                                    >
                                        <div className="p-2 bg-black rounded-lg border border-zinc-800 group-hover:border-cyan-500 text-cyan-500"><Globe size={20}/></div>
                                        <div>
                                            <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">Locate on Map</div>
                                            <div className="text-[10px] text-zinc-500">View spatial topology</div>
                                        </div>
                                        <ChevronRight className="ml-auto text-zinc-600 group-hover:text-white" size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SUB-VIEWS (Placeholders for transition effect) */}
                {(view === 'COMPARE' || view === 'PROOF' || view === 'MAP') && (
                     <div className="absolute inset-0 bg-[#09090b] flex flex-col items-center justify-center p-8 animate-in slide-in-from-right duration-500 z-50">
                        {isAnimating ? (
                            <RefreshCw className="animate-spin text-zinc-500" size={32}/> 
                        ) : (
                            <div className="text-center">
                                <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-6 text-zinc-400">
                                    {view === 'COMPARE' && <Swords size={32}/>}
                                    {view === 'MAP' && <Globe size={32}/>}
                                    {view === 'PROOF' && <Shield size={32}/>}
                                </div>
                                <div className="text-2xl font-bold text-white mb-2">
                                    {view === 'COMPARE' ? 'COMPARISON ENGINE ACTIVE' : view === 'MAP' ? 'GEOLOCATION ACTIVE' : 'PROOF GENERATED'}
                                </div>
                                <p className="text-zinc-500 text-sm mb-8">
                                    Simulating transition to external module...
                                </p>
                                <button 
                                    onClick={() => navigate('MODAL')} 
                                    className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs hover:bg-zinc-200 transition-colors shadow-lg"
                                >
                                    RETURN TO INSPECTOR
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
