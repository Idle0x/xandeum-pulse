import { useState, useEffect } from 'react';
import { RotateCcw, Fingerprint, History, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const TEMPORAL_LOGIC_SNIPPET = `
const fetchHistoricalSnapshot = async (nodeId, timestamp) => {
  // Shadow DB Query
  // Returns the exact state of the node at that moment in history
  const { data } = await supabase
    .from('node_snapshots')
    .eq('stable_id', nodeId)
    .lte('created_at', timestamp)
    .limit(1);
    
  return data[0]; // { vitality: 88, credits: 4000 }
};
`;

export function TemporalChapter() {
    return (
        <LogicWrapper 
            title="Temporal_Persistence.ts" 
            code={TEMPORAL_LOGIC_SNIPPET} 
            githubPath="src/logic/temporal-persistence.ts"
        >
            <div className="grid grid-cols-1 gap-8 h-full">
                <TimeMachineSimulator />
                <StableIDSimulator />
            </div>
        </LogicWrapper>
    )
}

function TimeMachineSimulator() {
    const [activeSnap, setActiveSnap] = useState(0);

    const snapshots = [
        { label: 'NOW', vitality: 98, color: 'text-green-500', date: 'Live Uplink' },
        { label: '-24H', vitality: 94, color: 'text-green-400', date: 'Yesterday, 14:00' },
        { label: '-7D', vitality: 82, color: 'text-yellow-500', date: 'Jan 18, 09:30' },
        { label: '-30D', vitality: 65, color: 'text-red-500', date: 'Dec 25, 11:15' },
    ];

    const current = snapshots[activeSnap];

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Display Area */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <History size={16} className="text-orange-500"/>
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Snapshot Player</span>
                    </div>
                    <div className="text-xs font-mono text-zinc-400">{current.date}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Recorded Health</div>
                    <div className={`text-4xl font-black tracking-tighter ${current.color} transition-all duration-300 transform scale-100`}>
                        {current.vitality}%
                    </div>
                </div>
            </div>

            {/* The Timeline Strip */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800 -translate-y-1/2 z-0"></div>
                <div className="flex justify-between relative z-10">
                    {snapshots.map((snap, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveSnap(idx)}
                            className={`
                                flex flex-col items-center gap-3 group transition-all duration-300
                                ${activeSnap === idx ? 'scale-110' : 'opacity-50 hover:opacity-100'}
                            `}
                        >
                            <div className={`
                                w-3 h-3 rounded-full border-2 transition-colors duration-300
                                ${activeSnap === idx ? 'bg-orange-500 border-orange-500' : 'bg-[#050505] border-zinc-600 group-hover:border-zinc-400'}
                            `}></div>
                            <span className={`text-[10px] font-black font-mono tracking-widest ${activeSnap === idx ? 'text-white' : 'text-zinc-600'}`}>
                                {snap.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StableIDSimulator() {
    const [glitchVer, setGlitchVer] = useState('v1.0.0');

    useEffect(() => {
        const interval = setInterval(() => {
             // Random version string generation
             const v = `v${Math.floor(Math.random()*4)}.${Math.floor(Math.random()*9)}.${Math.floor(Math.random()*9)}`;
             setGlitchVer(v);
        }, 300); // Fast glitch
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-[2rem] p-8 flex items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Fingerprint size={20} />
                    <h3 className="font-bold text-white tracking-tight">Stable ID v2</h3>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Identity persists even when software version rotates.
                </p>
            </div>

            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-[10px] w-48 shadow-inner">
                {/* The Stable Part */}
                <div className="text-zinc-500 uppercase font-bold mb-1 tracking-widest">ID Hash</div>
                <div className="text-green-400 font-bold mb-3">8x92...AF2</div>
                
                {/* The Glitching Part */}
                <div className="text-zinc-500 uppercase font-bold mb-1 tracking-widest">Protocol Ver</div>
                <div className="text-red-400 font-bold animate-pulse">{glitchVer}</div>
            </div>
        </div>
    )
}
