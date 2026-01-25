import { useState, useEffect } from 'react';
import { Github, Twitter, ExternalLink, Zap, ShieldCheck, Cpu, Code2 } from 'lucide-react';

export function TerminalChapter() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center min-h-[80vh] justify-center">
            {/* Glassmorphic Outro Card */}
            <div className="w-full bg-[#09090b]/40 backdrop-blur-xl border border-zinc-800/50 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
                {/* Playful Background Visuals */}
                <div className="absolute top-0 right-0 p-40 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 p-32 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-10">
                        <Code2 size={12} className="text-indigo-400"/> Documentation Conclusion
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                        The Pulse <span className="text-zinc-500">Protocol.</span>
                    </h2>

                    {/* Summary Paragraphs */}
                    <div className="max-w-2xl mx-auto space-y-6 text-zinc-400 text-base leading-relaxed text-center mb-16">
                        <p>
                            Pulse was engineered to solve the "Visibility Gap" in decentralized hosting. By merging high-speed 
                            <strong> Neural Core</strong> failover logic with <strong>Spatial Intelligence</strong>, we have 
                            transformed raw RPC telemetry into a human-readable, actionable map of the network’s physical 
                            and economic health.
                        </p>
                        <p>
                            From the <strong>Sigmoid Vitality</strong> curves to the <strong>Geometric Stacking</strong> of 
                            the STOINC engine, every line of code is optimized for hardware preservation and professional 
                            reporting. This documentation serves as the blueprint for an ecosystem where transparency 
                            isn't just a feature—it is the sovereign standard for every validator in the fleet.
                        </p>
                    </div>

                    {/* Playful Outro Animation (SVG Micro-Simulation) */}
                    <div className="flex items-center justify-center gap-8 mb-16">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-500 shadow-lg animate-bounce [animation-duration:3s]">
                                <Cpu size={24}/>
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Logic</span>
                        </div>
                        <div className="h-px w-12 bg-zinc-800"></div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-500 shadow-lg animate-bounce [animation-duration:4s]">
                                <Zap size={24}/>
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Power</span>
                        </div>
                        <div className="h-px w-12 bg-zinc-800"></div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 shadow-lg animate-bounce [animation-duration:5s]">
                                <ShieldCheck size={24}/>
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Trust</span>
                        </div>
                    </div>

                    {/* Minimalist Footer Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 border-t border-zinc-800/50 pt-10 w-full">
                        <a 
                            href="https://github.com/Idle0x/xandeum-pulse" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 hover:text-white transition-all group tracking-widest uppercase"
                        >
                            <Github size={14} className="group-hover:rotate-12 transition-transform"/>
                            Repository Source
                        </a>
                        
                        <a 
                            href="https://twitter.com/riot_sh" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 hover:text-white transition-all group tracking-widest uppercase"
                        >
                            <Twitter size={14} className="group-hover:scale-110 transition-transform"/>
                            riot'
                        </a>

                        <div className="text-[11px] font-mono text-zinc-700 select-none">
                            V3.0.0 // PROTOCOL_SIGNED
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Subtle Tagline */}
            <div className="mt-12 text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em] animate-pulse">
                Ad Astra Per Aspera
            </div>
        </div>
    );
}
