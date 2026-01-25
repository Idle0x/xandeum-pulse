import { useState } from 'react';
import { MessageSquare, FileJson, Cpu, Zap, ArrowRight } from 'lucide-react';

export function SynthesisChapter() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <FileJson size={12}/> AI Narrative
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Synthesis Engine</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                    Pulse replaces static numbers with context. Our dual engine calculates <strong>Synthesis</strong> (relative impact) 
                    and <strong>Narrative</strong> (natural reporting) to explain the <i>why</i> behind the data.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* 1. The Narrative Builder (Simulator) */}
                <div className="lg:col-span-7">
                    <Narrative_Builder_Simulator />
                </div>

                {/* 2. Scenario Explanation */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="text-pink-500" size={18} />
                            <h4 className="font-bold text-white">7-Scenario Logic</h4>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The engine detects your active view (Overview, Market, or Map) and adjusts its "voice." 
                            It calculates <strong>Standard Deviation</strong> to see if a node is "Leading the pack" 
                            or "Dragging the average."
                        </p>
                    </div>

                    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="text-blue-400" size={18} />
                            <h4 className="font-bold text-white">Seeded Randomness</h4>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            To prevent robotic repetition, every node gets a unique "personality" based on its ID. 
                            The report stays consistent for that node but varies across the fleet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Narrative_Builder_Simulator() {
    const [performance, setPerformance] = useState<'HIGH' | 'LOW'>('HIGH');
    const [tone, setTone] = useState<'TECH' | 'SIMPLE'>('TECH');

    const getReportText = () => {
        if (performance === 'HIGH') {
            return tone === 'TECH' 
                ? "Optimal variance detected. Node is exerting a +14.2% lift on global mean health, acting as a primary stability anchor for this shard."
                : "Great performance! This node is doing better than most and is actively helping make the whole network stronger.";
        } else {
            return tone === 'TECH'
                ? "Sub-optimal throughput. Node is inducing a -8.4% drag on regional averages due to persistent latency spikes in the consensus layer."
                : "This node is struggling. It is currently slowing down the group average because its connection speed is below the required baseline.";
        }
    };

    return (
        <div className="bg-[#09090b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header Controls */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
                    <button onClick={() => setPerformance('HIGH')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${performance === 'HIGH' ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}>LEADER</button>
                    <button onClick={() => setPerformance('LOW')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${performance === 'LOW' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>LAGGARD</button>
                </div>
                <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
                    <button onClick={() => setTone('TECH')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${tone === 'TECH' ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500 hover:text-zinc-300'}`}>TECHNICAL</button>
                    <button onClick={() => setTone('SIMPLE')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${tone === 'SIMPLE' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}>SIMPLE</button>
                </div>
            </div>

            {/* AI Console Area */}
            <div className="p-8 bg-black min-h-[220px] relative">
                <div className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${tone === 'TECH' ? 'bg-pink-500 shadow-pink-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
                        <MessageSquare size={18} className="text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pulse Synthesis Engine</span>
                            <div className="h-[1px] flex-1 bg-zinc-800"></div>
                        </div>
                        <div className="text-white font-mono text-sm leading-relaxed typing-effect">
                            {getReportText()}
                            <span className="inline-block w-1.5 h-4 bg-pink-500 ml-1 animate-pulse align-middle"></span>
                        </div>
                    </div>
                </div>
                
                {/* Visual Math Feed Footer */}
                <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center opacity-40">
                    <div className="flex gap-4">
                        <div className="text-[8px] font-mono text-zinc-500">σ_VARIANCE: {performance === 'HIGH' ? '0.02' : '0.48'}</div>
                        <div className="text-[8px] font-mono text-zinc-500">μ_DELTA: {performance === 'HIGH' ? '+14%' : '-8%'}</div>
                    </div>
                    <div className="text-[8px] font-mono text-zinc-500 uppercase">Status: Analysis Complete</div>
                </div>
            </div>
        </div>
    )
}
