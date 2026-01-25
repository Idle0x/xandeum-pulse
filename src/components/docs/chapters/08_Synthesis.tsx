import { useState } from 'react';
import { MessageSquare, FileJson, Cpu, Zap, Layers, MousePointer2 } from 'lucide-react';
import { LogicWrapper } from '../layout/LogicWrapper';

const SYNTHESIS_LOGIC_SNIPPET = `
const syncSynthesis = (hoveredNodeId) => {
  // Bi-Directional Spotlight: Highlights node across 4 separate UI layers
  const spotlight = CHAPTER_DATA.find(n => n.id === hoveredNodeId);
  
  updateMapFocus(spotlight.coords);    // Panning Map Logic
  updateTableScroll(spotlight.index);  // Pre-emptive Scrolling
  updateLegend(spotlight.id);          // UI Highlighting
  
  // Handshake with Narrative Engine
  return generateNarrative(spotlight.metrics, spotlight.history);
};

// Narrative Weave Logic
const weave = (tech, simple, history) => {
  const bridge = roll(MATRIX.generic.bridges);
  return history 
    ? \`\${tech}, \${history}. \${bridge} \${simple}.\` 
    : \`\${tech}. \${bridge} \${simple}.\`;
};
`;

export function SynthesisChapter() {
    return (
        <LogicWrapper 
            title="Synthesis_Engine.ts" 
            code={SYNTHESIS_LOGIC_SNIPPET} 
            githubPath="src/logic/synthesis-orchestrator.ts"
        >
            <div className="flex flex-col gap-16">
                {/* Header: Professional Explanation */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Layers size={12}/> Intelligence Orchestration
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Synthesis & Narrative Engine</h2>

                    <div className="max-w-4xl mx-auto text-left space-y-6">
                        <p className="text-zinc-300 text-base leading-relaxed">
                            The <strong>Synthesis Engine</strong> serves as the central orchestrator for the entire analytical footer, seamlessly unifying the Overview, Market Share, and Topology modules. It performs the heavy lifting of mapping specific nodes from the comparison table directly to their corresponding data points across all charts and map markers. By calculating real-time deltas and historical trends, the Synthesis Engine ensures that when you focus on a node, the entire dashboard responds in unison—highlighting legends, panning map views, and extracting relevant context to provide a singular, cohesive picture of a validator's role within the network.
                        </p>
                        <p className="text-zinc-300 text-base leading-relaxed">
                            Working in tandem with this orchestration is the <strong>Narrative Engine</strong>, a specialized linguistic layer that transforms raw statistical outputs into human-readable intelligence. While the Synthesis Engine identifies <i>what</i> is happening through its 7-scenario logic, the Narrative Engine determines <i>how</i> to communicate it, fetching and arranging a combinatorial matrix of technical and simple English terms into meaningful sentences. Together, they bridge the gap between complex blockchain telemetry and actionable insight, using seeded randomness to ensure that every node report feels unique, organic, and strategically grounded.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* 1. The Interactive Simulation */}
                    <div className="lg:col-span-7">
                        <Narrative_Builder_Simulator />
                    </div>

                    {/* 2. Feature Callouts */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl group hover:border-pink-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Cpu size={18} /></div>
                                <h4 className="font-bold text-white uppercase tracking-tighter">Bi-Directional Sync</h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                The Synthesis Engine tracks your cursor. Hovering a chart bar instantly spotlights the node in the table, the map, and the narrative log simultaneously.
                            </p>
                        </div>

                        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl group hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Zap size={18} /></div>
                                <h4 className="font-bold text-white uppercase tracking-tighter">Combinatorial Matrix</h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                The Narrative Engine uses "Seeded Randomness" to assemble sentences from technical and simple English banks, ensuring organic variety.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </LogicWrapper>
    );
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
        <div className="bg-[#09090b] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 right-6 text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Synthesis Engine Active</div>

            {/* Header Controls */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                    <button onClick={() => setPerformance('HIGH')} className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all \${performance === 'HIGH' ? 'bg-green-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>LEADER</button>
                    <button onClick={() => setPerformance('LOW')} className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all \${performance === 'LOW' ? 'bg-red-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>LAGGARD</button>
                </div>
                <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                    <button onClick={() => setTone('TECH')} className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all \${tone === 'TECH' ? 'bg-pink-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>TECHNICAL</button>
                    <button onClick={() => setTone('SIMPLE')} className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all \${tone === 'SIMPLE' ? 'bg-blue-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>SIMPLE</button>
                </div>
            </div>

            {/* AI Console Area */}
            <div className="p-10 bg-black min-h-[260px] relative text-left">
                <div className="flex gap-6 items-start">
                    <div className={`p-4 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 \${tone === 'TECH' ? 'bg-pink-500 text-black shadow-pink-500/20' : 'bg-blue-500 text-black shadow-blue-500/20'}`}>
                        <MessageSquare size={24} />
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Narrative Output</span>
                            <div className="h-[1px] flex-1 bg-zinc-800 opacity-30"></div>
                        </div>
                        <div className="text-white font-mono text-sm md:text-base leading-relaxed min-h-[5rem]">
                            {getReportText()}
                            <span className="inline-block w-2 h-5 bg-pink-500 ml-2 animate-pulse align-middle"></span>
                        </div>
                    </div>
                </div>

                {/* Simulator Visual Cues */}
                <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-zinc-900 pt-8">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> TABLE SYNC
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div> LEGEND MAPPING
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div> TOPOLOGY LINK
                    </div>
                </div>
            </div>
        </div>
    );
}
