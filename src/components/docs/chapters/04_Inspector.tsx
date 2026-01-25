import { useState, useEffect, useMemo } from 'react';
import { Activity, Database, Hash, Hand, Search, Info, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

export function InspectorChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
            {/* Header: Professional Explanation */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Search size={12}/> Diagnostics Suite
                </div>
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Granular Diagnostics</h2>
                
                <div className="max-w-4xl mx-auto text-left space-y-6">
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The <strong>Inspector System</strong> operates as the platform's investigative core. It fetches raw telemetry via the <code>useNetworkData</code> hook and translates it into three distinct perspectives: <strong>Health</strong>, <strong>Storage</strong>, and <strong>Identity</strong>. By utilizing non-linear algorithms, it filters out ephemeral network noise to provide a definitive "Ground Truth" for every node in the fleet.
                    </p>
                    <p className="text-zinc-300 text-base leading-relaxed">
                        The simulation below replicates the actual <strong>Vitality Engine</strong> logic. It demonstrates how the system reacts when upstream APIs go offline, triggering a failover to optimistic caching. In this state, the engine re-prioritizes hardware commitment (Storage) over live reputation, ensuring that the dashboard remains functional even during total network desynchronization.
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Visual Feature Breakdown */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 group hover:border-green-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><Activity size={20}/></div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Health</h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">Combines uptime sigmoid curves with version consensus. If the node version is outdated, the vitality score is slashed by 15%.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 group hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><Database size={20}/></div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Storage</h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">The heaviest weight in the vitality formula. High commitment relative to the network average triggers a multiplier bonus.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800 group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Hash size={20}/></div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Identity</h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">Unique node fingerprinting. It ensures the 30-day history remains linked to the hardware, even if the IP or Version changes.</p>
                    </div>
                </div>
                
                {/* The 4-Pillar Simulation Widget */}
                <div className="lg:col-span-8 h-full">
                    <VitalitySimulator />
                </div>
            </div>
        </div>
    )
}

function VitalitySimulator() {
    // 1. STATE MACHINE
    const [isOnline, setIsOnline] = useState(true);
    const [uptime, setUptime] = useState(14);
    const [storage, setStorage] = useState(60); // 0-100 scale
    const [credits, setCredits] = useState(45); // 0-100 scale
    const [version, setVersion] = useState('v3.2.0');

    // 2. VITALITY FORMULA RESTORATION
    const totalScore = useMemo(() => {
        // Sigmoid for Uptime
        const uScore = Math.min(100, Math.round(100 / (1 + Math.exp(-0.2 * (uptime - 7)))));
        
        // Base weightings
        let sWeight = storage * 0.40;
        let cWeight = isOnline ? (credits * 0.30) : 0; // Reputation disabled if offline
        let uWeight = uScore * 0.30;
        
        let raw = sWeight + cWeight + uWeight;

        // Offline Penalty/Adjustment
        if (!isOnline) {
            raw = (sWeight * 1.5) + (uWeight * 1.0); // Boost hardware importance if API is dark
        }

        // Version Penalty
        if (version !== 'v3.2.0') raw *= 0.85;

        return Math.min(100, Math.round(raw));
    }, [uptime, storage, credits, version, isOnline]);

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden h-full flex flex-col">
            
            {/* API STATUS TOGGLE */}
            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        API STATUS: {isOnline ? 'ONLINE (UPLINK ACTIVE)' : 'OFFLINE (CACHE MODE)'}
                    </span>
                </div>
                <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold border transition-all active:scale-95
                    ${isOnline ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400' : 'bg-red-500/10 border-red-500 text-red-500'}`}
                >
                    {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>}
                    {isOnline ? 'FORCE FAILOVER' : 'RECONNECT API'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* PILLAR CONTROLS */}
                <div className="space-y-6">
                    <SimulatorSlider label="Uptime Stability" val={uptime} setVal={setUptime} unit="Days" color="text-blue-400" accent="accent-blue-500" />
                    <SimulatorSlider label="Storage Commitment" val={storage} setVal={setStorage} unit="%" color="text-purple-400" accent="accent-purple-500" />
                    <SimulatorSlider label="Network Credits" val={credits} setVal={setCredits} unit="Cr" color="text-yellow-500" accent="accent-yellow-500" disabled={!isOnline} />
                    
                    <div>
                        <div className="text-[9px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Protocol Version</div>
                        <div className="grid grid-cols-3 gap-2">
                            {['v3.0.1', 'v3.1.2', 'v3.2.0'].map(v => (
                                <button 
                                    key={v}
                                    onClick={() => setVersion(v)}
                                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all
                                    ${version === v ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* THE GAUGE */}
                <div className="flex flex-col items-center">
                    <div className="relative flex flex-col items-center justify-center w-56 h-56 rounded-full border-8 border-zinc-900 shadow-2xl group">
                         {/* Dynamic Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900" />
                            <circle 
                                cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={653}
                                strokeDashoffset={653 - (653 * totalScore) / 100}
                                className={`transition-all duration-1000 ease-out ${totalScore > 80 ? 'text-green-500' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                            />
                        </svg>

                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-6xl font-black text-white tracking-tighter">{totalScore}</span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Vitality Score</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-[9px] font-mono text-zinc-600">
                        <CheckCircle2 size={12} className={totalScore > 80 ? 'text-green-500' : 'text-zinc-800'} />
                        {totalScore > 80 ? 'CONSENSUS ALIGNED' : 'UNDERPERFORMING'}
                    </div>
                </div>
            </div>

            {/* LOGIC ANNOTATION */}
            <div className="mt-12 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 flex items-start gap-4">
                <Info size={18} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                    {!isOnline 
                        ? "CRASH PROTECTION ACTIVE: Reputation-based credits are being ignored to prevent data corruption. The score now reflects pure hardware reliability + cache persistence." 
                        : "LIVE SYNC ACTIVE: The Neural Core is currently merging RPC telemetry with historical reputation credits to generate a complete Vitality profile."
                    }
                </p>
            </div>
        </div>
    )
}

function SimulatorSlider({ label, val, setVal, unit, color, accent, disabled = false }: any) {
    return (
        <div className={`transition-opacity duration-300 ${disabled ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className={color}>{label}</span>
                <span className="text-white font-mono">{val}{unit}</span>
            </div>
            <input 
                type="range" min="0" max={unit === 'Days' ? 30 : 100} 
                value={val} onChange={(e) => setVal(Number(e.target.value))}
                className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accent}`}
            />
        </div>
    )
}
