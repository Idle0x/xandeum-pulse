import { useState, useEffect } from 'react';
import { Cpu, Github, Twitter, FileCode } from 'lucide-react';

export function BootChapter({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-col items-center justify-between min-h-[85vh] px-6 text-center animate-in fade-in duration-1000">
            {/* Spacer for vertical centering logic */}
            <div className="flex-1" />

            <div className="relative flex flex-col items-center">
                {/* Background Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                        <Cpu size={12} className="text-blue-500" /> v3.0 Documentation
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-tight">
                        PULSE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase">Manual</span>
                    </h1>

                    <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-lg mx-auto font-light mb-12">
                        Comprehensive technical guide for the Xandeum Pulse dashboard. 
                        Audit validator health, synchronize regional topology, and verify economic yield.
                    </p>

                    {/* Primary Call to Action */}
                    <button 
                        onClick={onStart}
                        className="group relative px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.15)] active:scale-95"
                    >
                        <span className="relative flex items-center gap-3">
                            Open Operator Manual
                        </span>
                    </button>
                </div>
            </div>

            {/* Minimalist Footer Links */}
            <div className="flex-1 flex items-end w-full">
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 w-full py-12 border-t border-zinc-900/50">
                    <a 
                        href="https://github.com/Idle0x/xandeum-pulse" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-all uppercase tracking-widest group"
                    >
                        <Github size={12} className="group-hover:rotate-12 transition-transform"/>
                        Source
                    </a>

                    <a 
                        href="https://twitter.com/riot_sh" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-all uppercase tracking-widest group"
                    >
                        <Twitter size={12} className="group-hover:scale-110 transition-transform"/>
                        Riot
                    </a>

                    <a 
                        href="https://github.com/Idle0x/xandeum-pulse/blob/main/DOCUMENTATION.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-all uppercase tracking-widest group"
                    >
                        <FileCode size={12} />
                        Documentation.md
                    </a>

                    <div className="hidden md:block h-3 w-px bg-zinc-800 mx-2" />

                    <div className="text-[10px] font-mono text-zinc-700 select-none uppercase tracking-tighter">
                        Xandeum Network // Fleet Intelligence
                    </div>
                </div>
            </div>
        </div>
    );
}
