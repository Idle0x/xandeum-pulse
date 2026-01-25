import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function TopRail({ activeChapter, chapters }: { activeChapter: string, chapters: any[] }) {
    const currentIndex = chapters.findIndex(c => c.id === activeChapter);
    const progress = ((currentIndex + 1) / chapters.length) * 100;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 group-hover:border-blue-500/50 transition-all">
                <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400" />
                </div>
                <span className="text-xs font-bold text-zinc-500 group-hover:text-white uppercase tracking-widest">
                    Terminating Session
                </span>
            </Link>
            
            <div className="text-[10px] font-mono text-zinc-600 uppercase hidden md:block">
                PULSE_OS // v3.2.0 // OPERATOR_MANUAL
            </div>
            
            {/* Neon Progress Line */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-zinc-800 w-full">
                <div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </header>
    );
}
