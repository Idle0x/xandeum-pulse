import { useState, useMemo } from 'react';
import { Activity, Search, Wifi, WifiOff, Database, Server, Info } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const VITALITY_LOGIC_SNIPPET = `
const computeVitality = (uptime, storage, credits, isOnline) => {
  // 1. Sigmoid Curve for Uptime (Non-linear trust)
  // Penalizes recent downtime heavily
  const uScore = 100 / (1 + Math.exp(-0.2 * (uptime - 7)));
  
  // 2. Weighted Matrix
  // Hardware (40%), Reputation (30%), Stability (30%)
  let score = (storage * 0.40) + 
              (isOnline ? credits * 0.30 : 0) + 
              (uScore * 0.30);
  
  // 3. Failover Protocol
  // If API offline, ignore reputation, boost hardware weight
  if (!isOnline) {
      score = (storage * 0.65) + (uScore * 0.35);
  }
  
  return Math.min(100, Math.round(score));
};
`;

export function InspectorChapter() {
    return (
        <LogicWrapper 
            title="Vitality_Engine.ts" 
            code={VITALITY_LOGIC_SNIPPET} 
            githubPath="src/logic/vitality-engine.ts"
        >
            <VitalitySimulator />
        </LogicWrapper>
    )
}

function VitalitySimulator() {
    // State
    const [isOnline, setIsOnline] = useState(true);
    const [uptime, setUptime] = useState(14); // Days
    const [storage, setStorage] = useState(60); // % vs Leader
    const [credits, setCredits] = useState(45); // % vs Avg

    // Live Calculation
    const totalScore = useMemo(() => {
        const uScore = 100 / (1 + Math.exp(-0.2 * (uptime - 7)));
        let raw = (storage * 0.40) + (isOnline ? credits * 0.30 : 0) + (uScore * 0.30);
        
        if (!isOnline) {
            raw = (storage * 0.65) + (uScore * 0.35);
        }
        return Math.min(100, Math.round(raw));
    }, [uptime, storage, credits, isOnline]);

    return (
        <div className="h-full bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Top Bar: Network Status */}
            <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 text-red-400 mb-2">
                        <Search size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Diagnostics Suite</span>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">Vitality Inspector</h3>
                </div>

                {/* API Toggle Button */}
                <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`
                        flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-bold border transition-all active:scale-95
                        ${isOnline 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600' 
                            : 'bg-red-500/10 border-red-500 text-red-500 animate-pulse'}
                    `}
                >
                    {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>}
                    {isOnline ? 'NETWORK: ONLINE' : 'NETWORK: SEVERED'}
                </button>
            </div>

            {/* Main Control Deck */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                
                {/* Left: The Faders */}
                <div className="space-y-8">
                    <SimulatorSlider 
                        label="Uptime Consistency" 
                        val={uptime} setVal={setUptime} max={30} unit="Days" 
                        icon={Activity} color="text-blue-400" accent="bg-blue-500"
                    />
                    <SimulatorSlider 
                        label="Storage Commitment" 
                        val={storage} setVal={setStorage} max={100} unit="%" 
                        icon={Database} color="text-purple-400" accent="bg-purple-500"
                    />
                    <SimulatorSlider 
                        label="Reputation Credits" 
                        val={credits} setVal={setCredits} max={100} unit="Cr" 
                        icon={Server} color="text-yellow-500" accent="bg-yellow-500"
                        disabled={!isOnline}
                    />
                </div>

                {/* Right: The Gauge */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64">
                        {/* Gauge BG */}
                        <svg className="w-full h-full -rotate-90 transform">
                            <circle cx="128" cy="128" r="110" stroke="#18181b" strokeWidth="12" fill="transparent" />
                            <circle 
                                cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                strokeDasharray={691}
                                strokeDashoffset={691 - (691 * totalScore) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${totalScore > 80 ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : totalScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                            />
                        </svg>
                        
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-7xl font-black text-white tracking-tighter tabular-nums">
                                {totalScore}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">
                                Health Score
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Alert */}
            <div className={`
                mt-12 p-4 rounded-xl border flex items-start gap-4 transition-all duration-500
                ${!isOnline ? 'bg-red-900/10 border-red-500/20' : 'bg-zinc-900/30 border-zinc-800'}
            `}>
                <Info size={16} className={!isOnline ? 'text-red-500' : 'text-zinc-500'} />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {!isOnline 
                        ? <span className="text-red-400 font-bold">FAILOVER ACTIVE: </span> 
                        : <span className="text-blue-400 font-bold">LIVE SYNC: </span>
                    }
                    {!isOnline 
                        ? "Upstream RPC unresponsive. Scoring logic has voided 'Reputation' credits to prevent stale data corruption. Relying purely on hardware metrics."
                        : "Neural Core is actively merging RPC telemetry with historical credit data."
                    }
                </p>
            </div>

        </div>
    )
}

function SimulatorSlider({ label, val, setVal, max, unit, icon: Icon, color, accent, disabled }: any) {
    return (
        <div className={`transition-all duration-300 ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={14} className={color}/>
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    {val}{unit}
                </span>
            </div>
            
            {/* Custom Range Input Styling */}
            <div className="relative h-2 bg-zinc-900 rounded-full border border-zinc-800 group">
                <div 
                    className={`absolute top-0 left-0 h-full rounded-full ${accent} transition-all duration-150`} 
                    style={{ width: `${(val / max) * 100}%` }}
                ></div>
                <input 
                    type="range" min="0" max={max} 
                    value={val} onChange={(e) => setVal(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        </div>
    )
}
