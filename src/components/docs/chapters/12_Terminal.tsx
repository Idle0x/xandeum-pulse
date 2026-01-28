import { Terminal, Github, Twitter, ArrowUp } from 'lucide-react';

export function TerminalChapter() {
    return (
        <div className="min-h-[60vh] bg-[#050505] border-t border-zinc-900 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
             
             {/* Ambient Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

             <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-10">
                    <Terminal size={12} /> System_Log_End
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-tight">
                    Protocol <span className="text-zinc-600">Signed.</span>
                </h2>

                <p className="text-lg text-zinc-400 font-light leading-relaxed mb-12">
                    Pulse solves the "Visibility Gap" in decentralized hosting. 
                    From Sigmoid Vitality to Geometric Stacking, every line of code is optimized for hardware preservation.
                    <br/><br/>
                    <span className="text-white font-medium">Transparency is the sovereign standard.</span>
                </p>

                <div className="flex flex-wrap justify-center gap-8 border-t border-zinc-900/50 pt-10">
                    <a href="#" className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-colors uppercase tracking-widest group">
                        <Github size={12}/> Source
                    </a>
                    <a href="#" className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-colors uppercase tracking-widest group">
                        <Twitter size={12}/> @Riot_sh
                    </a>
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-widest group"
                    >
                        <ArrowUp size={12} className="group-hover:-translate-y-1 transition-transform"/> Return to Top
                    </button>
                </div>
            </div>

            <div className="mt-20 text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] animate-pulse">
                Ad Astra Per Aspera
            </div>
        </div>
    );
}
