import { useState, useEffect } from 'react';
import { Terminal, Cpu } from 'lucide-react';

export function BootChapter({ onStart }: { onStart: () => void }) {
    const [bootText, setBootText] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    // BIOS Text Animation Sequence
    useEffect(() => {
        const sequence = [
            "CHECKING SYSTEM INTEGRITY...",
            "LOADING MODULES...",
            "CONNECTION ESTABLISHED."
        ];
        
        let step = 0;
        const interval = setInterval(() => {
            if (step < sequence.length) {
                setBootText(prev => [...prev, sequence[step]]);
                step++;
            } else {
                clearInterval(interval);
                setIsComplete(true);
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
            <div className="relative">
                {/* Background Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    {/* Retro BIOS Text Output */}
                    <div className="font-mono text-[10px] text-blue-400/60 mb-8 h-16 flex flex-col justify-end">
                        {bootText.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>

                    {isComplete && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                                <Cpu size={12} className="text-blue-500" /> v3.0 Documentation
                            </div>
                            
                            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-tight">
                                PULSE <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">MANUAL</span>
                            </h1>
                            
                            <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-lg mx-auto font-light mb-12">
                                This guide explains how to use the Xandeum Pulse dashboard. 
                                Learn how to track node health, compare performance, and export reports.
                            </p>
                            
                            {/* Primary Call to Action */}
                            <button 
                                onClick={onStart}
                                className="group relative px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <span className="relative flex items-center gap-3">
                                    OPEN OPERATOR MANUAL
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
