import { useState, useEffect } from 'react';
import { Terminal, Cpu } from 'lucide-react';

export function BootChapter({ onStart }: { onStart: () => void }) {
    const [bootText, setBootText] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const sequence = [
            "INITIALIZING KERNEL...",
            "LOADING NEURAL CORE...",
            "CHECKING INTEGRITY...",
            "ESTABLISHING UPLINK...",
            "SYSTEM READY."
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
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            <div className="relative">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10">
                    {/* BIOS Text */}
                    <div className="font-mono text-[10px] text-blue-400 mb-8 h-20 flex flex-col justify-end opacity-70">
                        {bootText.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>

                    {isComplete && (
                        <div className="animate-in fade-in zoom-in duration-1000">
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                                <Cpu size={12} className="text-blue-500" /> v3.0 Hybrid Architecture
                            </div>
                            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-tight">
                                PULSE <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">OPERATOR MANUAL</span>
                            </h1>
                            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light mb-12">
                                Welcome to the Command Deck. This is not a static document. It is an interactive training simulation for the 
                                <span className="text-white font-bold"> Xandeum Pulse Analytics Engine</span>.
                            </p>
                            
                            <button 
                                onClick={onStart}
                                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden hover:scale-105 transition-transform"
                            >
                                <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative flex items-center gap-3">
                                    <Terminal size={16} /> Initialize Flight School
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
