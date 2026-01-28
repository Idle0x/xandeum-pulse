import { useState, useEffect } from 'react';
import { History, Fingerprint } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const TEMPORAL_TEXT = [
    {
        title: "Temporal Persistence",
        content: "Real-time data is ephemeral. Pulse solves this through a dual-layer system. First, the Stable ID protocol ensures your node's history remains anchored to physical hardware, regardless of version changes."
    },
    {
        title: "Time Travel",
        content: "Every 30 minutes, the Neural Core pushes a network state to the Supabase Shadow Database. This creates a high-resolution ledger. Operators can 'travel back' to any interval to audit historical health."
    }
];

const TEMPORAL_CODE = `
// Shadow DB Query
const fetchSnapshot = async (id, time) => {
  const { data } = await supabase
    .from('snapshots')
    .eq('stable_id', id)
    .lte('created_at', time)
    .single();
    
  return data; 
};
`;

export function TemporalChapter() {
    const [active, setActive] = useState(0);
    const [glitch, setGlitch] = useState('v1.0.0');

    // Glitch Effect
    useEffect(() => {
        const i = setInterval(() => {
            setGlitch(`v1.${Math.floor(Math.random()*9)}.${Math.floor(Math.random()*9)}`);
        }, 150);
        return () => clearInterval(i);
    }, []);

    return (
        <ChapterLayout
            chapterNumber="06"
            title="Temporal Engine"
            subtitle="Time travel debugging and stable identity persistence."
            textData={TEMPORAL_TEXT}
            codeSnippet={TEMPORAL_CODE}
            githubPath="src/logic/temporal.ts"
        >
            <div className="h-full bg-[#080808] p-8 flex flex-col gap-8">
                
                {/* 1. TIME MACHINE */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-orange-500">
                        <History size={18}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Snapshot Player</span>
                    </div>

                    <div className="flex justify-between items-center relative z-10">
                        {['NOW', '-24H', '-7D'].map((label, i) => (
                            <button 
                                key={i}
                                onClick={() => setActive(i)}
                                className={`flex flex-col items-center gap-3 transition-all ${active === i ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                            >
                                <div className={`w-3 h-3 rounded-full border-2 ${active === i ? 'bg-orange-500 border-orange-500' : 'bg-black border-zinc-500'}`}></div>
                                <span className="text-[10px] font-bold font-mono text-zinc-400">{label}</span>
                            </button>
                        ))}
                        {/* Connecting Line */}
                        <div className="absolute top-[5px] left-4 right-4 h-px bg-zinc-800 -z-10"></div>
                    </div>
                </div>

                {/* 2. STABLE ID GLITCH */}
                <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 flex items-center justify-between gap-4">
                    <div className="space-y-2">
                         <div className="flex items-center gap-2 text-indigo-400">
                            <Fingerprint size={18}/>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Stable ID</span>
                         </div>
                         <p className="text-[10px] text-zinc-500 max-w-[150px]">Identity persists even during software upgrades.</p>
                    </div>

                    <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] w-40 shadow-inner">
                        <div className="text-zinc-600 mb-1">ID_HASH</div>
                        <div className="text-green-500 font-bold mb-3">8x92...AF2</div>
                        <div className="text-zinc-600 mb-1">VERSION</div>
                        <div className="text-red-500 font-bold animate-pulse">{glitch}</div>
                    </div>
                </div>
            </div>
        </ChapterLayout>
    );
}
