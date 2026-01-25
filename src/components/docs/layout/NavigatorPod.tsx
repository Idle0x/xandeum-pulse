import { useState } from 'react';
import { Grid, ChevronRight, X } from 'lucide-react';

export function NavigatorPod({ activeChapter, chapters, onChange, onNext }: any) {
    const [menuOpen, setMenuOpen] = useState(false);
    const currentIndex = chapters.findIndex((c: any) => c.id === activeChapter);
    const currentChap = chapters[currentIndex];
    const nextChapter = chapters[currentIndex + 1];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center w-full px-4 md:w-auto">
            
            {/* HOLO MENU (Popup) */}
            {menuOpen && (
                <div className="mb-4 bg-[#09090b]/90 border border-zinc-700 rounded-xl p-2 shadow-2xl backdrop-blur-xl w-64 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 gap-1 max-h-[50vh] overflow-y-auto scrollbar-hide">
                        {chapters.map((c: any, i: number) => (
                            <button
                                key={c.id}
                                onClick={() => { onChange(c.id); setMenuOpen(false); }}
                                className={`text-left px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between
                                ${activeChapter === c.id ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                            >
                                <span>{i < 10 ? `0${i}` : i} // {c.title}</span>
                                {activeChapter === c.id && <div className={`w-1.5 h-1.5 rounded-full bg-${c.color}-500 animate-pulse`}></div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN BAR */}
            <div className="flex items-center gap-2 p-1.5 bg-[#09090b] border border-zinc-800 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-full">
                
                {/* Menu Toggle */}
                <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-10 h-10 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
                >
                    {menuOpen ? <X size={16}/> : <Grid size={16}/>}
                </button>

                {/* Current Status Display */}
                <div className="px-4 md:px-6 h-10 flex flex-col justify-center bg-zinc-900/50 border border-zinc-800/50 rounded-full min-w-[140px] md:min-w-[200px]">
                    <div className="text-[8px] text-zinc-600 font-mono uppercase">Current Protocol</div>
                    <div className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full bg-${currentChap.color}-500 animate-pulse shrink-0`}></span>
                        {currentChap.title}
                    </div>
                </div>

                {/* Next Button */}
                {nextChapter ? (
                    <button 
                        onClick={onNext}
                        className="h-10 px-4 md:px-6 rounded-full bg-white text-black font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 group whitespace-nowrap"
                    >
                        <span className="hidden md:inline">Initialize {nextChapter.title.split(' ')[0]}</span>
                        <span className="md:hidden">Next</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                ) : (
                    <button className="h-10 px-6 rounded-full bg-zinc-800 text-zinc-500 font-bold text-xs uppercase cursor-not-allowed">
                        End of Manual
                    </button>
                )}
            </div>
        </div>
    )
}
