import { Github, Twitter, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function TerminalChapter() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-black border-t border-zinc-900 pb-32 px-6">
            <div className="font-mono text-zinc-500 text-sm mb-12 text-center space-y-2">
                <div className="animate-in fade-in slide-in-from-top-1 duration-500">&gt; ANALYTICS SESSION TERMINATED...</div>
                <div className="animate-in fade-in slide-in-from-top-1 duration-700 delay-200">&gt; LOGS PERSISTED TO PERSISTENCE LAYER.</div>
                <div className="animate-in fade-in slide-in-from-top-1 duration-1000 delay-500">&gt; STANDING BY FOR OPERATOR COMMAND<span className="animate-pulse">_</span></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mb-16">
                <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:bg-white hover:text-black transition-all flex flex-col items-center gap-4 group">
                    <Github className="group-hover:scale-110 transition-transform" size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">Source Code</span>
                </a>
                <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:bg-[#1DA1F2] hover:text-white transition-all flex flex-col items-center gap-4 group">
                    <Twitter className="group-hover:scale-110 transition-transform" size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">Project Updates</span>
                </a>
                <Link href="/" className="p-6 bg-blue-600 border border-blue-500 rounded-3xl hover:bg-blue-500 transition-all flex flex-col items-center gap-4 group">
                    <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" size={32} />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Main Dashboard</span>
                </Link>
            </div>
            
            <div className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em] text-center">
                PULSE OS v3.2.0 • BUILT BY RIOT' FOR THE XANDEUM ECOSYSTEM
            </div>
        </div>
    )
}
