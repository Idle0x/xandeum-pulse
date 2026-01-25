import { useState } from 'react';
import { Globe, Database, HeartPulse, Wallet, ChevronRight, User, MousePointer2, Share2 } from 'lucide-react';

export function SpatialChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Plain English Context Header */}
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Globe size={12}/> Global Topology
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Spatial Intelligence</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
                    This section visualizes where physical nodes are located globally. Use the split-screen tool below to explore regional performance. 
                    Click on a city in the list to see its <strong>King Node</strong>—the highest-performing representative for that cluster.
                </p>
            </div>

            {/* The Map & Drawer Simulation Container */}
            <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-black relative h-[800px] flex flex-col animate-in zoom-in-95 duration-700">
                <MapDrawer_Simulator />
            </div>
        </div>
    )
}

function MapDrawer_Simulator() {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'STORAGE' | 'HEALTH' | 'CREDITS'>('STORAGE');

    // Simulated regional data based on screenshots
    const cities = [
        { name: 'Amsterdam, The Netherlands', nodes: 8, val: '290 GB', share: '0.3%', rank: '48.89%', king: '7Q2qbwu...j6', tier: 'STANDARD TIER', color: 'bg-green-500' },
        { name: 'Tokyo, Japan', nodes: 12, val: '4.5 PB', share: '12.5%', rank: 'Top 5%', king: '3yX9...B2', tier: 'ELITE TIER', color: 'bg-yellow-500' },
        { name: 'Los Angeles, USA', nodes: 5, val: '291 GB', share: '0.4%', rank: '52.1%', king: '1pZk...9L', tier: 'STANDARD TIER', color: 'bg-blue-500' },
    ];

    const currentCityData = cities.find(c => c.name === selectedCity);

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            
            {/* TOP: MAP CANVAS (45% Height) */}
            <div className={`transition-all duration-700 ease-in-out w-full bg-[#050505] relative flex items-center justify-center overflow-hidden border-b border-zinc-800 ${selectedCity ? 'h-[40%]' : 'h-[55%]'}`}>
                {/* Abstract D3 Mesh Representation */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_70%)]"></div>
                <Globe size={80} className="text-zinc-800 animate-pulse z-0"/>
                
                {/* Floating Map Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col">
                        <button className="p-2 text-zinc-500 hover:text-white border-b border-zinc-800">+</button>
                        <button className="p-2 text-zinc-500 hover:text-white">-</button>
                    </div>
                    <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-red-500 hover:bg-zinc-800 transition-colors">
                        <RotateCcw size={16}/>
                    </button>
                </div>

                {/* View Mode Switcher Header */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 border border-zinc-800 rounded-full">
                        <Database size={12} className="text-purple-500"/>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Data</span>
                    </div>
                    <div className="flex bg-zinc-900/80 backdrop-blur-md rounded-xl p-1 border border-zinc-700 shadow-xl">
                        <button onClick={() => setViewMode('STORAGE')} className={`px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='STORAGE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}><Database size={12}/> STORAGE</button>
                        <button onClick={() => setViewMode('HEALTH')} className={`px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='HEALTH' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500'}`}><HeartPulse size={12}/> HEALTH</button>
                        <button onClick={() => setViewMode('CREDITS')} className={`px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='CREDITS' ? 'bg-yellow-600 text-white shadow-lg' : 'text-zinc-500'}`}><Wallet size={12}/> CREDITS</button>
                    </div>
                </div>
            </div>

            {/* BOTTOM: DRAWER SYSTEM (Scrollable List or Deep Dive) */}
            <div className={`transition-all duration-700 ease-in-out flex-1 bg-[#09090b] flex flex-col relative ${selectedCity ? 'h-[60%]' : 'h-[45%]'}`}>
                
                {selectedCity && currentCityData ? (
                    /* SCENARIO A: DEEP DIVE (City Detail) */
                    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-bottom duration-700">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-full ${currentCityData.color} flex items-center justify-center text-[10px] text-black font-bold ring-4 ring-white/5`}>
                                        {currentCityData.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{currentCityData.name}</h3>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono pl-11 uppercase tracking-widest">
                                    {currentCityData.nodes} NODES ACTIVE • Region ID: pulse-eu-1
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedCity(null)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-[10px] font-bold border border-zinc-700 transition-all active:scale-95"
                            >
                                BACK TO LIST
                            </button>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Avg Density</div>
                                <div className="text-lg font-black text-white">{currentCityData.val} <span className="text-[10px] text-zinc-600 font-medium">/Node</span></div>
                             </div>
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Global Share</div>
                                <div className="text-lg font-black text-white">{currentCityData.share}</div>
                             </div>
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Tier Rank</div>
                                <div className="text-lg font-black text-cyan-400">{currentCityData.rank}</div>
                             </div>
                        </div>

                        {/* King Node Indicator */}
                        <div className="mt-auto bg-zinc-900/80 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-16 bg-cyan-500/5 blur-3xl rounded-full"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                        <User size={24}/>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Region's Top Performer</div>
                                        <div className="text-sm font-mono text-white tracking-tight">{currentCityData.king}...</div>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all">
                                    DETAILS <ChevronRight size={12}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* SCENARIO B: BROWSE (City List) */
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 bg-zinc-900/20 border-b border-zinc-800/50 flex items-center justify-center gap-4">
                            <div className="bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-full animate-bounce flex items-center gap-2">
                                <MousePointer2 size={10} fill="currentColor"/> CLICK A CITY TO INSPECT
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {cities.map((city, idx) => (
                                <div 
                                    key={city.name} 
                                    onClick={() => setSelectedCity(city.name)}
                                    className="p-5 border-b border-zinc-800/50 hover:bg-zinc-900 cursor-pointer flex justify-between items-center group transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-mono text-zinc-600">0{idx + 1}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{city.name}</span>
                                            <span className="text-[9px] font-mono text-zinc-600">{city.nodes} Nodes</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`text-sm font-mono font-bold ${viewMode === 'STORAGE' ? 'text-indigo-400' : viewMode === 'HEALTH' ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {city.val}
                                        </span>
                                        <ChevronRight size={14} className="text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
