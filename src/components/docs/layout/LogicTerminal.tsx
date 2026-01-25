import { useState, useEffect, useRef } from 'react';
import { Terminal, Github, ExternalLink, Code2 } from 'lucide-react';

interface LogicTerminalProps {
    title: string;
    code: string;
    githubPath: string;
    isVisible: boolean;
}

export function LogicTerminal({ title, code, githubPath, isVisible }: LogicTerminalProps) {
    const [displayedCode, setDisplayedCode] = useState('');
    const [hasTyped, setHasTyped] = useState(false);

    useEffect(() => {
        if (isVisible && !hasTyped) {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedCode(code.slice(0, i));
                i++;
                if (i > code.length) {
                    clearInterval(interval);
                    setHasTyped(true);
                }
            }, 10); // Fast typing speed
            return () => clearInterval(interval);
        }
    }, [isVisible, code, hasTyped]);

    return (
        <div className="w-full mt-10 rounded-2xl border border-zinc-800 bg-[#020202] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                    </div>
                    <div className="h-4 w-px bg-zinc-800 mx-2" />
                    <div className="flex items-center gap-2">
                        <Code2 size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</span>
                    </div>
                </div>
                <a 
                    href={`https://github.com/Idle0x/xandeum-pulse/blob/main/${githubPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group"
                >
                    <Github size={12} />
                    <span className="text-[9px] font-black uppercase">View on GitHub</span>
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
            </div>

            {/* Code Body */}
            <div className="p-6 font-mono text-[11px] leading-relaxed relative min-h-[120px]">
                <div className="absolute top-4 right-6 opacity-20 pointer-events-none uppercase text-[8px] font-black tracking-[0.5em] text-zinc-600">
                    Logic_Kernel_v3
                </div>
                <pre className="text-indigo-300 overflow-x-auto scrollbar-hide">
                    <code>{displayedCode}</code>
                    <span className="inline-block w-1.5 h-3 bg-indigo-500 animate-pulse ml-1 align-middle" />
                </pre>
            </div>
        </div>
    );
}
