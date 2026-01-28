import { useState, useEffect } from 'react';
import { Cpu, Github, Twitter, FileCode, ArrowRight, Terminal } from 'lucide-react';

export function BootChapter({ onStart }: { onStart: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#050505] overflow-hidden text-center selection:bg-blue-500/30">
            
            {/* 1. Cinematic Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                {/* Radial Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#00000000, #050505)]"></div>
                {/* The "Aurora" Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-duration:4s]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-4xl px-6">
                
                {/* 2. The Badge */}
                <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8
                    transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                `}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    v3.0 Documentation
                </div>

                {/* 3. Hero Typography */}
                <h1 className={`
                    text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]
                    transition-all duration-1000 delay-100 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                `}>
                    PULSE <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-blue-600 to-zinc-900">
                        MANUAL
                    </span>
                </h1>

                <p className={`
                    text-base md:text-xl text-zinc-400 leading-relaxed max-w-lg mx-auto font-light mb-12 tracking-wide
                    transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                `}>
                    The comprehensive technical doctrine for the Xandeum Pulse dashboard. 
                    <span className="text-zinc-200 font-medium"> Audit. Synchronize. Verify.</span>
                </p>

                {/* 4. Primary Call to Action (HUD Style) */}
                <div className={`
                    transition-all duration-1000 delay-500 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                `}>
                    <button 
                        onClick={onStart}
                        className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-[0.15em] uppercase overflow-hidden hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <span className="relative flex items-center gap-3">
                            Initialize Operator Manual <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </span>
                    </button>
                    <div className="mt-4 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                        Press Enter or Click to Begin
                    </div>
                </div>
            </div>

            {/* 5. Footer Topology */}
            <div className="absolute bottom-10 w-full px-6">
                <div className="flex flex-wrap items-center justify-center gap-8 py-6 border-t border-zinc-900/80">
                    <FooterLink href="https://github.com/Idle0x/xandeum-pulse" icon={Github} label="Source" />
                    <FooterLink href="https://twitter.com/riot_sh" icon={Twitter} label="Riot" />
                    <FooterLink href="#" icon={Terminal} label="System_Logs" />
                    
                    <div className="hidden md:block h-3 w-px bg-zinc-900 mx-2" />
                    
                    <div className="text-[10px] font-mono text-zinc-600 select-none uppercase tracking-widest">
                        Xandeum Network // Fleet Intelligence
                    </div>
                </div>
            </div>
        </div>
    );
}

function FooterLink({ href, icon: Icon, label }: any) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-colors uppercase tracking-widest group"
        >
            <Icon size={12} className="group-hover:-translate-y-0.5 transition-transform"/>
            {label}
        </a>
    )
}
