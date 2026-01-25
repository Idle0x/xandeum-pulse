import { useState, useEffect } from 'react';
import { RotateCcw, Fingerprint, History, Database, AlertCircle } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const TEMPORAL_LOGIC_SNIPPET = `
const fetchHistoricalSnapshot = async (nodeId, timestamp) => {
  // Accesses the Supabase Shadow Database for 30-min interval records
  const { data } = await supabase
    .from('node_snapshots')
    .select('credits, storage, vitality')
    .eq('stable_id', nodeId)
    .lte('created_at', timestamp)
    .order('created_at', { ascending: false })
    .limit(1);
    
  return data[0]; // Returns the exact state of the node at that moment
};
`;

export function TemporalChapter() {
    return (
        <LogicWrapper 
            title="Temporal_Persistence.ts" 
            code={TEMPORAL_LOGIC_SNIPPET} 
            githubPath="src/logic/temporal-persistence.ts"
        >
            <div className="flex flex-col gap-16">
                {/* Header: Professional Explanation */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <History size={12}/> Temporal Intelligence
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Time Travel & Persistence</h2>
                    
                    <div className="max-w-4xl mx-auto text-left space-y-6">
                        <p className="text-zinc-300 text-base leading-relaxed">
                            In a decentralized environment, real-time data is ephemeral—it can vanish the moment a node drops its connection or updates its software. Pulse solves this through <strong>Temporal Persistence</strong>: a dual-layer system that utilizes <strong>Persistent Identity (Stable ID v2)</strong> to ensure your node's history remains anchored to the physical hardware, regardless of version changes or IP rotations.
                        </p>
                        <p className="text-zinc-300 text-base leading-relaxed">
                            Every 30 minutes, the <strong>Neural Core</strong> pushes a comprehensive network state to the <strong>Supabase Shadow Database</strong>. This creates a high-resolution ledger of your node's story. By leveraging the Time Machine simulator below, operators can "travel back" to any 30-minute interval to audit historical health, verify past credit accumulations, and analyze long-term performance trends that would otherwise be lost to the network's constant state of flux.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* 1. STABLE ID DIFF VIEWER */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Fingerprint size={20} />
                                </div>
                                <h3 className="font-bold text-white text-lg">Stable ID v2</h3>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                                Standard IDs often include volatile data like version strings. When you upgrade your node, the ID changes and your history resets. Pulse strips volatile markers to keep your identity rock solid across software lifecycles.
                            </p>
                            <StableID_Diff_Simulator />
                        </div>
                    </div>

                    {/* 2. TIME MACHINE SLIDER */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] h-full flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                    <RotateCcw size={20} />
                                </div>
                                <h3 className="font-bold text-white text-lg">Snapshot Time Machine</h3>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-10">
                                Use the slider to query the <strong>Shadow Database</strong>. This demonstrates how the frontend pulls the closest indexed snapshot to reconstruct the dashboard as it appeared in the past.
                            </p>
                            <TimeMachine_Simulator />
                        </div>
                    </div>
                </div>
            </div>
        </LogicWrapper>
    )
}

function StableID_Diff_Simulator() {
    const [ver, setVer] = useState("v1.2.0");

    useEffect(() => {
        const interval = setInterval(() => {
            const versions = ["v1.2.1", "v1.3.0", "v1.3.5", "v1.4.0"];
            setVer(versions[Math.floor(Math.random() * versions.length)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            <div className="p-5 bg-red-900/10 border border-red-500/20 rounded-2xl relative overflow-hidden transition-all">
                <div className="text-[9px] font-black text-red-500 uppercase mb-2 tracking-widest">Volatile Identity (Reset Risk)</div>
                <code className="text-xs text-red-300 font-mono block truncate">8x...2A-{ver}-ONLINE</code>
                <div className="absolute top-3 right-4 animate-pulse text-red-500"><AlertCircle size={14}/></div>
            </div>
            
            <div className="flex justify-center py-2">
                <div className="h-4 w-px bg-zinc-800"></div>
            </div>

            <div className="p-5 bg-green-900/10 border border-green-500/20 rounded-2xl relative overflow-hidden transition-all">
                <div className="text-[9px] font-black text-green-500 uppercase mb-2 tracking-widest">Pulse Stable ID (Persistent)</div>
                <code className="text-xs text-green-300 font-mono block uppercase">8x...2A-MAINNET-ANCHOR</code>
                <div className="absolute top-3 right-4 text-green-500"><Fingerprint size={14}/></div>
            </div>
        </div>
    );
}

function TimeMachine_Simulator() {
    const [days, setDays] = useState(0);
    const score = days === 0 ? 98 : Math.max(40, 98 - (days * 1.5));

    return (
        <div className="p-8 bg-black rounded-3xl border border-zinc-800 shadow-inner">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <div className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-widest">Snapshot Vitality</div>
                    <div className="text-5xl font-black text-white tracking-tighter transition-all duration-500">
                        {score.toFixed(0)}%
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-blue-400 font-black uppercase mb-2 tracking-widest">Temporal Offset</div>
                    <div className="text-sm font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                        {days === 0 ? "LIVE_UPLINK" : `T - \${days} DAYS`}
                    </div>
                </div>
            </div>

            <div className="relative group">
                <input 
                    type="range" min="0" max="30" 
                    value={days} onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-6 relative z-10"
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded">
                    QUERYING SNAPSHOT_DB
                </div>
            </div>
            
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono font-bold tracking-tighter">
                <span>PRESENT_DAY</span>
                <span>HISTORICAL_AUDIT (30D)</span>
            </div>
        </div>
    )
}
