import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function TopRail({ activeChapter, chapters }: { activeChapter: string, chapters: any[] }) {
    const currentIndex = chapters.findIndex(c => c.id === activeChapter);
    // Progress calculation based on current index vs total chapters
    const progress = ((currentIndex + 1) / chapters.length) * 100;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6 transition-all">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 group-hover:border-red-500/50 transition-all">
                    <ArrowLeft size={16} className="text-zinc-400 group-hover:text-red-400" />
                </div>
                <span className="text-xs font-bold text-zinc-500 group-hover:text-red-500 uppercase tracking-widest transition-colors">
                    Back to Dashboard
                </span>
            </Link>
            
            {/* Desktop-only System Version Label */}
            <div className="hidden md:block text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                PULSE_OS // v3.2.0 // MANUAL
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
