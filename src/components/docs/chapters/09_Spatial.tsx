import { useState } from 'react';
import { Globe, Target, MapPin, ChevronLeft } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const SPATIAL_TEXT = [
    {
        title: "Spatial Intelligence",
        content: "Pulse maps the physical infrastructure of the Xandeum network by clustering nodes into city-level regions. This helps operators visualize the Mesh Topology—ensuring no single geographic 'hub' holds a disproportionate amount of the network's power."
    },
    {
        title: "The King Node",
        content: "In every regional cluster, the system identifies a 'King Node'—a representative validator that currently leads that specific city in the selected metric. This helps users quickly spot Regional Anchors."
    }
];

const SPATIAL_CODE = `
// Tournament Logic
const resolveKing = (cluster) => {
  return cluster.nodes.reduce((king, challenger) => 
    (challenger.score > king.score) ? challenger : king
  );
};
`;

export function SpatialChapter() {
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <ChapterLayout
            chapterNumber="07"
            title="Spatial Topology"
            subtitle="Geographic clustering and King Node tournament logic."
            textData={SPATIAL_TEXT}
            codeSnippet={SPATIAL_CODE}
            githubPath="src/logic/spatial-resolver.ts"
        >
            <div className="h-full bg-[#080808] relative overflow-hidden flex flex-col shadow-inner">
                
                {/* 1. MAP CONTAINER */}
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-in-out ${selected ? 'scale-150 opacity-50' : 'scale-100 opacity-100'}`}>
                    {/* Abstract Globe */}
                    <div className="relative w-80 h-80 rounded-full border border-zinc-800/50 flex items-center justify-center">
                         <div className="absolute inset-0 border border-zinc-800/30 rounded-full scale-125"></div>
                         <Globe size={100} className="text-zinc-800"/>
                         
                         {/* City Pins */}
                         <button onClick={() => setSelected('TOKYO')} className="absolute top-1/4 right-1/4 group">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse group-hover:scale-150 transition-transform"></div>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Tokyo</div>
                         </button>
                         <button onClick={() => setSelected('LONDON')} className="absolute top-1/3 left-1/3 group">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse group-hover:scale-150 transition-transform"></div>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">London</div>
                         </button>
                    </div>
                </div>

                {/* 2. TARGET LOCK HUD (Visible on Selection) */}
                {selected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 duration-500">
                        <Target size={240} strokeWidth={0.5} className="text-cyan-500/40"/>
                    </div>
                )}

                {/* 3. DRAWER (Details) */}
                <div className={`absolute bottom-0 left-0 right-0 bg-zinc-900/90 border-t border-zinc-800 transition-all duration-500 ease-out backdrop-blur-xl ${selected ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="p-8">
                        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest mb-6">
                            <ChevronLeft size={12}/> Return to Orbit
                        </button>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-white">{selected}</h3>
                                <div className="text-xs font-mono text-cyan-400">Cluster #829A</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase">King Node</div>
                                <div className="font-mono text-white">0x3...A9</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subconscious Cue for Default View */}
                {!selected && (
                    <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] bg-black/50 px-3 py-1 rounded-full border border-zinc-800">
                            Select a cluster to Zoom
                        </span>
                    </div>
                )}
            </div>
        </ChapterLayout>
    );
}
