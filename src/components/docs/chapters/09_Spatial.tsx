import { useState } from 'react';
import { Globe, Database, HeartPulse, Wallet, ChevronRight, User } from 'lucide-react';

export function SpatialChapter() {
    return (
        <div className="h-[80vh] flex flex-col">
            <div className="px-6 py-8 text-center shrink-0">
                <h2 className="text-3xl font-bold text-white">Spatial Topology</h2>
                <p className="text-zinc-500 text-sm">Dual-Simulation: Split Map & City Drawer. Click a city to reveal the <span className="text-cyan-400 font-bold">King Node</span>.</p>
            </div>
            
            <div className="flex-1 bg-zinc-900/20 border-y border-zinc-800 relative">
                <MapDrawer_Simulator />
            </div>
        </div>
    )
}

function MapDrawer_Simulator() {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [mode, setMode] = useState<'STORAGE' | 'HEALTH' | 'CREDITS'>('STORAGE');

    const cities = [
        { name: 'Amsterdam', nodes: 8, val: '2.1 PB', king: '8x...2A' },
        { name: 'Tokyo', nodes: 12, val: '4.5 PB', king: '3y...9B' },
        { name: 'New York', nodes: 5, val: '1.2 PB', king: '7z...1C' },
    ];

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-black">
            {/* TOP: MAP (Placeholder for D3 Viz) */}
            <div className={`transition-all duration-700 w-full bg-[#050505] relative flex items-center justify-center ${selectedCity ? 'h-[40%]' : 'h-[60%]'}`}>
                <Globe size={64} className="text-zinc-800 animate-pulse"/>
                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setMode('STORAGE')} className={`p-2 rounded border ${mode==='STORAGE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Database size={14}/></button>
                    <button onClick={() => setMode('HEALTH')} className={`p-2 rounded border ${mode==='HEALTH' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><HeartPulse size={14}/></button>
                    <button onClick={() => setMode('CREDITS')} className={`p-2 rounded border ${mode==='CREDITS' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Wallet size={14}/></button>
                </div>
            </div>

            {/* BOTTOM: DRAWER */}
            <div className="flex-1 bg-[#09090b] border-t border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Regions</span>
                    <span className="text-[10px] text-zinc-600">3 DETECTED</span>
                </div>
                
                {selectedCity ? (
                    // SELECTED CITY DETAIL (King Node)
                    <div className="p-6 animate-in slide-in-from-bottom-4">
                        <button onClick={() => setSelectedCity(null)} className="text-[10px] text-zinc-500 mb-4 hover:text-white flex items-center gap-1">&larr; BACK TO LIST</button>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{selectedCity}</h3>
                                <div className="text-xs text-cyan-400">Top 12% Region</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-mono font-bold text-white">
                                    {cities.find(c => c.name === selectedCity)?.val}
                                </div>
                                <div className="text-[10px] text-zinc-500">Total {mode}</div>
                            </div>
                        </div>

                        {/* King Node Card */}
                        <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><User size={20}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-cyan-500 uppercase">Regional King Node</div>
                                <div className="text-sm font-mono text-white">{cities.find(c => c.name === selectedCity)?.king}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // CITY LIST
                    <div className="overflow-y-auto">
                        {cities.map(city => (
                            <div key={city.name} onClick={() => setSelectedCity(city.name)} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900 cursor-pointer flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white">{city.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-zinc-500">{city.val}</span>
                                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-white"/>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
