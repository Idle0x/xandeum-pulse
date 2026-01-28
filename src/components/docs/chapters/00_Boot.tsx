import { useState, useEffect } from 'react';
import { Cpu, Github, Twitter, ArrowRight } from 'lucide-react';

export function BootChapter({ onStart }: { onStart: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#050505] overflow-hidden text-center">
            {/* Cinematic BG */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_800px_at_50%_0%,#1e1b4b_0%,transparent_100%)] opacity-40"></div>
            </div>

            <div className="relative z-10 max-w-5xl px-6">
                {/* Badge */}
                <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 shadow-xl">
                        <Cpu size={12} className="text-blue-500" /> 
                        <span className="text-zinc-200">System v3.0</span>
                        <span className="text-zinc-600"> // </span>
                        <span>Docs</span>
                    </div>
                </div>

                {/* Typography */}
                <h1 className={`text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.85] transition-all duration-1000 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    PULSE <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-blue-600 to-zinc-900">
                        MANUAL
                    </span>
                </h1>

                <p className={`text-lg md:text-xl text-zinc-400 leading-relaxed max-w-xl mx-auto font-light mb-16 tracking-wide transition-all duration-1000 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    Comprehensive technical guide for the Xandeum Pulse dashboard. 
                    <span className="text-zinc-100 font-medium block mt-2">Audit validator health. Synchronize topology. Verify yield.</span>
                </p>

                {/* Interactive Start Button */}
                <div className={`transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <button 
                        onClick={onStart}
                        className="group relative px-10 py-5 bg-white text-black rounded-full font-bold text-sm tracking-[0.15em] uppercase overflow-hidden hover:scale-105 transition-all duration-500 shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] active:scale-95"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <span className="relative flex items-center gap-3">
                            Initialize Operator Manual <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 w-full px-6 flex justify-center gap-10 opacity-50 hover:opacity-100 transition-opacity">
                <a href="#" className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white tracking-widest flex items-center gap-2"><Github size={12}/> Source</a>
                <a href="#" className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white tracking-widest flex items-center gap-2"><Twitter size={12}/> @Riot_sh</a>
            </div>
        </div>
    );
}
