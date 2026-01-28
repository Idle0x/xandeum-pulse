import { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, RefreshCw, AlignLeft } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const SYNTHESIS_TEXT = [
    {
        title: "Intelligence Orchestration",
        content: "The Synthesis Engine serves as the central orchestrator. It performs the heavy lifting of mapping specific nodes from the comparison table directly to their corresponding data points across all charts and map markers. When you focus on a node, the entire dashboard responds in unison."
    },
    {
        title: "Narrative Generation",
        content: "Working in tandem is the Narrative Engine, a linguistic layer that transforms raw statistical outputs into human-readable intelligence. It fetches and arranges a combinatorial matrix of technical and simple English terms to ensure every node report feels unique and organic."
    }
];

const SYNTHESIS_CODE = `
// Linguistic Matrix
const generate = (metrics, tone) => {
  const template = tone === 'TECH' 
    ? MATRIX.technical 
    : MATRIX.simple;
    
  // Inject variables into string templates
  return template.replace(
    '{{delta}}', 
    metrics.performanceDelta
  );
};
`;

export function SynthesisChapter() {
    const [tone, setTone] = useState<'TECH' | 'SIMPLE'>('TECH');
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // The Content Source
    const getContent = () => tone === 'TECH' 
        ? "Optimal variance detected. Node is exerting a +14.2% lift on global mean health, acting as a primary stability anchor."
        : "Great performance! This node is doing better than most and is actively helping make the whole network stronger.";

    // Typewriter Logic
    useEffect(() => {
        setText('');
        setIsTyping(true);
        let i = 0;
        const target = getContent();
        
        const interval = setInterval(() => {
            setText(target.slice(0, i));
            i++;
            if (i > target.length) setIsTyping(false);
        }, 30);
        
        return () => clearInterval(interval);
    }, [tone]);

    return (
        <ChapterLayout
            chapterNumber="09"
            title="Synthesis Engine"
            subtitle="Orchestration and natural language generation."
            textData={SYNTHESIS_TEXT}
            codeSnippet={SYNTHESIS_CODE}
            githubPath="src/logic/narrative-engine.ts"
        >
            <div className="h-full bg-[#080808] p-8 flex flex-col gap-8">
                
                {/* 1. CONTROLS */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-pink-500">
                        <Sparkles size={18}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Natural Language</span>
                    </div>

                    <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                        <button onClick={() => setTone('TECH')} className={`px-4 py-1.5 rounded text-[9px] font-bold transition-all ${tone==='TECH' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Technical</button>
                        <button onClick={() => setTone('SIMPLE')} className={`px-4 py-1.5 rounded text-[9px] font-bold transition-all ${tone==='SIMPLE' ? 'bg-pink-600 text-white shadow' : 'text-zinc-500'}`}>Simple</button>
                    </div>
                </div>

                {/* 2. TERMINAL OUTPUT */}
                <div className="flex-1 bg-black border border-zinc-800 rounded-3xl p-8 relative shadow-inner flex flex-col">
                    {/* Status Lights */}
                    <div className="flex gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>

                    {/* The Text */}
                    <div className="font-mono text-sm text-zinc-300 leading-relaxed">
                        <span className="text-pink-500 mr-2">root@pulse:~$</span>
                        {text}
                        <span className="inline-block w-2 h-4 bg-pink-500 ml-1 animate-pulse align-middle"></span>
                    </div>

                    {/* Footer Status */}
                    <div className="mt-auto pt-6 border-t border-zinc-900 flex gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Table Sync
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Map Sync
                        </div>
                    </div>
                </div>
            </div>
        </ChapterLayout>
    );
}
