import { useState } from 'react';
import { Globe, Database, HeartPulse, Wallet, ChevronRight, User, MousePointer2, RotateCcw, MapPin } from 'lucide-react';

export function SpatialChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
            {/* Header: Professional Explanation */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Globe size={12}/> Network Topology
                </div>
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Spatial Intelligence</h2>
                
                <div className="max-w-4xl mx-auto text-left space-y-6">
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The <strong>Spatial Intelligence</strong> module maps the physical infrastructure of the Xandeum network, transforming anonymous IP addresses into a live geographic topology. By utilizing high-precision geolocation batching, the platform clusters nodes into city-level regions to identify jurisdictional risks and hardware centralization. This view is critical for operators to understand the <strong>Mesh Topology</strong>—visualizing how data is distributed across the globe and ensuring that no single geographic "hub" holds a disproportionate amount of the network's storage or reputation power.
                    </p>
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The engine handles data across three primary layers: <strong>Storage</strong>, <strong>Health</strong>, and <strong>Credits</strong>. In every regional cluster, the system identifies a <strong>King Node</strong>—a representative validator that currently leads that specific city in the selected metric. This helps users quickly spot "Regional Anchors" and understand the <strong>Economic Share</strong> of each territory. Whether you are analyzing data density in Tokyo or yield velocity in Amsterdam, the split-screen simulator below demonstrates how the drawer system provides granular regional audits while maintaining the global context.
                    </p>
                </div>
            </div>

            {/* The Map & Drawer Simulation Container */}
            <div className="border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black relative h-[800px] flex flex-col animate-in zoom-in-95 duration-700">
                <MapDrawer_Simulator />
            </div>

            {/* Logic Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-cyan-500/30 transition-colors">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 w-fit"><MapPin size={18}/></div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Geolocation Batching</div>
                    <div className="text-xs text-zinc-500 leading-relaxed">To protect privacy and performance, IPs are resolved in batches of 100 using a server-side cache, ensuring 85%+ accuracy without slowing down the UI.</div>
                </div>
                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-indigo-500/30 transition-colors">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit"><Database size={18}/></div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Density Metrics</div>
                    <div className="text-xs text-zinc-500 leading-relaxed">Calculates "Average Density" per city, revealing whether a region is composed of community home-nodes or institutional datacenters.</div>
                </div>
                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col gap-3 group hover:border-yellow-500/30 transition-colors">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 w-fit"><User size={18}/></div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Tournament Logic</div>
                    <div className="text-xs text-zinc-500 leading-relaxed">The King Node is selected via a live tournament logic: the node with the highest metric in that specific city cluster represents the group.</div>
                </div>
            </div>
        </div>
    )
}

function MapDrawer_Simulator() {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'STORAGE' | 'HEALTH' | 'CREDITS'>('STORAGE');

    const cities = [
        { name: 'Amsterdam, The Netherlands', nodes: 8, val: '290 GB', share: '0.3%', rank: '48.89%', king: '7Q2qbwu...j6', tier: 'STANDARD TIER', color: 'bg-green-500' },
        { name: 'Tokyo, Japan', nodes: 12, val: '4.5 PB', share: '12.5%', rank: 'Top 5%', king: '3yX9...B2', tier: 'ELITE TIER', color: 'bg-yellow-500' },
        { name: 'Los Angeles, USA', nodes: 5, val: '291 GB', share: '0.4%', rank: '52.1%', king: '1pZk...9L', tier: 'STANDARD TIER', color: 'bg-blue-500' },
    ];

    const currentCityData = cities.find(c => c.name === selectedCity);

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className={`transition-all duration-700 ease-in-out w-full bg-[#050505] relative flex items-center justify-center overflow-hidden border-b border-zinc-800 ${selectedCity ? 'h-[40%]' : 'h-[55%]'}`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_70%)]"></div>
                <Globe size={80} className="text-zinc-800 animate-pulse z-0"/>
                
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden">
                        <button className="p-2 text-zinc-500 hover:text-white border-b border-zinc-800 transition-colors">+</button>
                        <button className="p-2 text-zinc-500 hover:text-white transition-colors">-</button>
                    </div>
                    <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-red-500 hover:bg-zinc-800 transition-all active:scale-90">
                        <RotateCcw size={16}/>
                    </button>
                </div>

                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 border border-zinc-800 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Topology Active</span>
                    </div>
                    <div className="flex bg-zinc-900/80 backdrop-blur-md rounded-xl p-1 border border-zinc-700 shadow-xl">
                        <button onClick={() => setViewMode('STORAGE')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='STORAGE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}><Database size={12}/> STORAGE</button>
                        <button onClick={() => setViewMode('HEALTH')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='HEALTH' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}><HeartPulse size={12}/> HEALTH</button>
                        <button onClick={() => setViewMode('CREDITS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode==='CREDITS' ? 'bg-yellow-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}><Wallet size={12}/> CREDITS</button>
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-700 ease-in-out flex-1 bg-[#09090b] flex flex-col relative ${selectedCity ? 'h-[60%]' : 'h-[45%]'}`}>
                {selectedCity && currentCityData ? (
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
                                    {currentCityData.nodes} NODES ACTIVE • Region ID: pulse-cluster-01
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedCity(null)}
                                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-[10px] font-bold border border-zinc-700 transition-all active:scale-95"
                            >
                                RETURN TO LIST
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-8">
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Avg Density</div>
                                <div className="text-lg font-black text-white">{currentCityData.val}</div>
                             </div>
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Global Share</div>
                                <div className="text-lg font-black text-white">{currentCityData.share}</div>
                             </div>
                             <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Tier Rank</div>
                                <div className="text-lg font-black text-cyan-400">{currentCityData.rank}</div>
                             </div>
                        </div>

                        <div className="mt-auto bg-zinc-900/80 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-16 bg-cyan-500/5 blur-3xl rounded-full"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                        <User size={24}/>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Region's King Node</div>
                                        <div className="text-sm font-mono text-white tracking-tight">{currentCityData.king}...</div>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all">
                                    NODE AUDIT <ChevronRight size={12}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 bg-zinc-900/20 border-b border-zinc-800/50 flex items-center justify-center gap-4">
                            <div className="bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-full animate-bounce flex items-center gap-2">
                                <MousePointer2 size={10} fill="currentColor"/> SELECT REGION FOR X-RAY
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
                                            <span className="text-[9px] font-mono text-zinc-600 uppercase">{city.nodes} pNodes</span>
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
