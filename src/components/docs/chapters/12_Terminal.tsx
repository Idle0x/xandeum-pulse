import { Github, Twitter, ExternalLink } from 'lucide-react';

export function TerminalChapter() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-black border-t border-zinc-900 pb-32">
            <div className="font-mono text-zinc-500 text-sm mb-8 text-center leading-loose">
                <div>&gt; SYSTEM SHUTDOWN INITIATED...</div>
                <div>&gt; SESSION LOG SAVED.</div>
                <div>&gt; READY FOR INPUT<span className="animate-pulse">_</span></div>
            </div>
            
            <div className="flex gap-6 mb-12">
                <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900 rounded-full hover:bg-white hover:text-black transition-all group">
                    <Github className="group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900 rounded-full hover:bg-blue-400 hover:text-white transition-all group">
                    <Twitter className="group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="p-4 bg-zinc-900 rounded-full hover:bg-green-500 hover:text-white transition-all group">
                    <ExternalLink className="group-hover:scale-110 transition-transform" />
                </a>
            </div>
            
            <div className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
                Pulse OS v3.2.0 • Built by riot'
            </div>
        </div>
    )
}
