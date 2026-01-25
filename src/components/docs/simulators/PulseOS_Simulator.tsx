import { useState, useEffect } from 'react';
import { 
    Lock, RotateCcw, LayoutGrid, List, Activity, 
    RefreshCw, Globe, Swords, Camera, X, Database
} from 'lucide-react';

type View = 'DASH' | 'MODAL' | 'MAP' | 'COMPARE' | 'PROOF';

export function PulseOS_Simulator() {
    const [view, setView] = useState<View>('DASH');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
    const [url, setUrl] = useState('https://xandeum-pulse.vercel.app');
    const [isAnimating, setIsAnimating] = useState(false);

    // Initial Typewriter Effect for URL
    useEffect(() => {
        let i = 0;
        const target = 'https://xandeum-pulse.vercel.app';
        const interval = setInterval(() => {
            if(i <= target.length) { setUrl(target.slice(0,i)); i++; }
            else { clearInterval(interval); }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const navigate = (target: View) => {
        setIsAnimating(true);
        setTimeout(() => {
            setView(target);
            setIsAnimating(false);
        }, 800);
    };

    return (
        <div className="w-full h-full flex flex-col font-sans text-sm select-none bg-black text-zinc-300">
            {/* Browser Bar */}
            <div className="h-10 bg-[#18181b] border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 bg-red-500/50 rounded-full"></div><div className="w-2.5 h-2.5 bg-yellow-500/50 rounded-full"></div><div className="w-2.5 h-2.5 bg-green-500/50 rounded-full"></div></div>
                <div className="flex-1 bg-black rounded border border-zinc-800 h-6 flex items-center px-3 text-[10px] font-mono text-zinc-400 justify-between">
                    <div className="flex items-center truncate"><Lock size={8} className="mr-2 text-green-500"/>{url}</div>
                    <RotateCcw size={10} className="cursor-pointer hover:text-white" onClick={() => navigate('DASH')}/>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 relative bg-black overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black">
                
                {/* DASHBOARD VIEW */}
                {view === 'DASH' && (
                    <div className="absolute inset-0 p-8 animate-in fade-in duration-500 flex flex-col">
                        
                        {/* Header with Mode Toggle */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-xl font-bold text-white">Dashboard</div>
                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                <button 
                                    onClick={() => setLayoutMode('GRID')}
                                    className={`p-1.5 rounded ${layoutMode === 'GRID' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <LayoutGrid size={14}/>
                                </button>
                                <button 
                                    onClick={() => setLayoutMode('LIST')}
                                    className={`p-1.5 rounded ${layoutMode === 'LIST' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <List size={14}/>
                                </button>
                            </div>
                        </div>

                        {/* GRID LAYOUT */}
                        {layoutMode === 'GRID' && (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1,2,3].map(i => (
                                    <div key={i} onClick={() => i===1 && navigate('MODAL')} className={`h-40 border rounded-xl p-4 flex flex-col justify-between transition-all hover:scale-[1.02] ${i===1 ? 'border-blue-500 bg-zinc-900 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-zinc-800 bg-zinc-900/30'}`}>
                                        <div className="flex justify-between"><span className="text-xs font-bold text-zinc-500">NODE-0{i}</span>{i===1 && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}</div>
                                        <div className="text-3xl font-bold text-white">{i===1 ? '98%' : '45%'}</div>
                                        {i===1 && <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-full w-fit animate-bounce shadow-lg">CLICK ME</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* LIST LAYOUT */}
                        {layoutMode === 'LIST' && (
                             <div className="border border-zinc-800 rounded-xl bg-zinc-900/20 overflow-hidden">
                                <div className="grid grid-cols-4 gap-4 p-3 bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase">
                                    <div>Node ID</div><div>Health</div><div>Storage</div><div>Status</div>
                                </div>
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} onClick={() => i===1 && navigate('MODAL')} className={`grid grid-cols-4 gap-4 p-3 border-t border-zinc-800 text-xs items-center hover:bg-zinc-900/50 cursor-pointer ${i===1 ? 'bg-blue-500/5' : ''}`}>
                                        <div className="font-mono text-zinc-400">8x...2A{i}</div>
                                        <div className={i===1 ? 'text-green-500 font-bold' : 'text-zinc-500'}>{i===1 ? '98%' : '45%'}</div>
                                        <div className="text-zinc-300">{i===1 ? '1.2 PB' : '12 TB'}</div>
                                        <div>
                                            {i===1 ? <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">ONLINE</span> : <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px]">SYNCING</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL VIEW */}
                {view === 'MODAL' && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 animate-in zoom-in-95">
                        <div className="w-full max-w-4xl bg-[#09090b] border border-zinc-700 rounded-2xl h-full flex flex-col shadow-2xl">
                            <div className="p-4 border-b border-zinc-800 flex justify-between bg-zinc-900/50"><span className="font-bold text-white">Node Inspector: 8x...2A</span><X size={18} className="cursor-pointer hover:text-white" onClick={() => navigate('DASH')}/></div>
                            <div className="flex-1 p-6 grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 border border-green-500/30 rounded-xl bg-green-500/5">
                                        <div className="text-xs font-bold text-green-500 mb-2 flex items-center gap-2"><Activity size={12}/> VITALITY SCORE</div>
                                        <div className="text-4xl font-black text-white">98 <span className="text-lg text-zinc-500 font-medium">/ 100</span></div>
                                    </div>
                                    <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                                        <div className="text-xs font-bold text-purple-500 mb-2 flex items-center gap-2"><Database size={12}/> STORAGE</div>
                                        <div className="text-2xl font-bold text-white">1.2 PB</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={() => navigate('COMPARE')} className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-left flex items-center gap-3 transition-all group"><Swords size={16} className="text-zinc-500 group-hover:text-white"/> <span className="font-bold">Compare vs Network</span></button>
                                    <button onClick={() => navigate('PROOF')} className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-left flex items-center gap-3 transition-all group"><Camera size={16} className="text-zinc-500 group-hover:text-white"/> <span className="font-bold">Proof of Pulse</span></button>
                                    <button onClick={() => navigate('MAP')} className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-left flex items-center gap-3 transition-all group"><Globe size={16} className="text-zinc-500 group-hover:text-white"/> <span className="font-bold">Locate on Map</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PLACEHOLDERS FOR OTHER VIEWS (Will be expanded in Batch 2/3) */}
                {(view === 'COMPARE' || view === 'PROOF' || view === 'MAP') && (
                     <div className="absolute inset-0 bg-[#09090b] flex flex-col items-center justify-center p-8 animate-in slide-in-from-right">
                        {isAnimating ? <RefreshCw className="animate-spin text-zinc-500" size={32}/> : (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-8">{view === 'COMPARE' ? 'VS MODE ACTIVE' : view === 'MAP' ? 'GEOLOCATION ACTIVE' : 'PROOF GENERATED'}</div>
                                <button onClick={() => navigate('MODAL')} className="px-6 py-2 bg-zinc-800 rounded-full font-bold text-xs hover:bg-zinc-700 text-white">RETURN TO INSPECTOR</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
