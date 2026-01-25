import { useState } from 'react';
import { FileJson, MessageSquare, Sliders } from 'lucide-react';

export function SynthesisChapter() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-16">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <FileJson size={12}/> Dual Engine Architecture
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Synthesis & Narrative</h2>
                <p className="text-zinc-500 max-w-xl mx-auto">
                    A dual-layer system. <span className="text-pink-400 font-bold">Synthesis</span> calculates relative impact (Drag vs. Lift), while <span className="text-pink-400 font-bold">Narrative</span> weaves the text using combinatorial logic.
                </p>
            </div>

            <Narrative_Builder_Simulator />
        </div>
    )
}

function Narrative_Builder_Simulator() {
    const [mode, setMode] = useState<'TECH' | 'SIMPLE'>('TECH');
    const [scenario, setScenario] = useState<'LAG' | 'LEAD'>('LEAD');

    const getText = () => {
        if (mode === 'TECH') {
            return scenario === 'LEAD' 
                ? "Optimal variance detected. Node is exerting a +14% lift on the global mean, acting as a primary stability anchor."
                : "Latency deviation detected (>400ms). Node is inducing statistical drag on the shard consensus layer.";
        }
        return scenario === 'LEAD'
            ? "Great performance. This node is leading the pack and helping stabilize the entire network."
            : "Needs attention. This node is slowing down the group average due to connection delays.";
    };

    return (
        <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                    <button onClick={() => setScenario('LEAD')} className={`px-4 py-1.5 rounded text-[10px] font-bold ${scenario === 'LEAD' ? 'bg-green-500/20 text-green-400' : 'text-zinc-500'}`}>SCENARIO: LEADER</button>
                    <button onClick={() => setScenario('LAG')} className={`px-4 py-1.5 rounded text-[10px] font-bold ${scenario === 'LAG' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500'}`}>SCENARIO: LAGGARD</button>
                </div>
                <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                     <button onClick={() => setMode('TECH')} className={`px-4 py-1.5 rounded text-[10px] font-bold ${mode === 'TECH' ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500'}`}>MODE: TECHNICAL</button>
                    <button onClick={() => setMode('SIMPLE')} className={`px-4 py-1.5 rounded text-[10px] font-bold ${mode === 'SIMPLE' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500'}`}>MODE: SIMPLE</button>
                </div>
            </div>

            {/* AI Output */}
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'TECH' ? 'bg-pink-500 shadow-pink-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
                    <MessageSquare size={16} className="text-white"/>
                </div>
                <div className="bg-black border border-zinc-800 rounded-2xl rounded-tl-none p-6 flex-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20"></div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Pulse AI • Just Now</div>
                    <div className="text-white font-mono text-sm leading-relaxed typing-cursor">
                        {getText()}
                    </div>
                </div>
            </div>
        </div>
    )
}
