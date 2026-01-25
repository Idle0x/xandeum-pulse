import { useState, useEffect, useRef } from 'react';
import { Grid, ChevronRight, ChevronLeft, X } from 'lucide-react';

export function NavigatorPod({ activeChapter, chapters, onChange, onNext, onPrev }: any) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const currentIndex = chapters.findIndex((c: any) => c.id === activeChapter);
    const currentChap = chapters[currentIndex];
    const nextChap = chapters[currentIndex + 1];
    const prevChap = chapters[currentIndex - 1];

    // Dismiss menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Hide navigation on the Boot screen to keep the "Hero" clean
    if (activeChapter === 'BOOT') return null; 

    return (
        <>
            {/* SPACER: Pushes content up on Desktop so the static footer doesn't overlap */}
            <div className="hidden md:block w-full h-32"></div>

            <div className="
                z-50 flex flex-col items-center w-full px-4
                fixed bottom-6 left-0 right-0  /* Mobile: Fixed at bottom */
                md:relative md:bottom-auto md:mt-20 md:mb-24 md:px-0 md:w-full md:max-w-5xl md:mx-auto /* Desktop: Static, Large, Centered */
            ">
                
                {/* GLASS MENU POPUP */}
                {menuOpen && (
                    <div ref={menuRef} className="absolute bottom-20 md:bottom-28 z-50 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_40px_rgba(8,145,178,0.2)] backdrop-blur-xl w-64 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                        <div className="grid grid-cols-1 gap-1 max-h-[50vh] overflow-y-auto scrollbar-hide">
                            {chapters.map((c: any, i: number) => (
                                <button
                                    key={c.id}
                                    onClick={() => { onChange(c.id); setMenuOpen(false); }}
                                    className={`text-left px-3 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between
                                    ${activeChapter === c.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span>{i < 10 ? `0${i}` : i} // {c.title}</span>
                                    {activeChapter === c.id && <div className={`w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse`}></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* NAVIGATION BAR */}
                <div className="flex items-center justify-between gap-2 p-1.5 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl w-full md:py-3 md:px-3 relative">
                    
                    {/* PREVIOUS BUTTON */}
                    <button 
                        onClick={onPrev}
                        disabled={!prevChap}
                        className={`flex-1 flex flex-col justify-center items-start px-4 py-2 rounded-xl transition-all h-14
                        ${prevChap ? 'hover:bg-zinc-900 group cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                    >
                        {prevChap && (
                            <>
                                <div className="flex items-center gap-1 text-zinc-300 font-black text-sm md:text-lg group-hover:-translate-x-1 transition-transform">
                                    <ChevronLeft size={16} /> <span>PREV</span>
                                </div>
                                <span className="text-[9px] text-zinc-600 font-mono uppercase truncate w-full text-left pl-5">
                                    {prevChap.title}
                                </span>
                            </>
                        )}
                    </button>

                    {/* CENTER: CURRENT CHAPTER */}
                    <div className="hidden md:flex flex-col items-center justify-center px-12 border-x border-zinc-800/50 h-10">
                        <div className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest mb-1">Current Section</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-${currentChap.color}-500 animate-pulse`}></span>
                            {currentChap.title}
                        </div>
                    </div>

                    {/* MENU TRIGGER (Mobile Center / Desktop Center-Right) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="w-12 h-12 shrink-0 rounded-xl bg-cyan-900/10 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all active:scale-95 mx-2"
                    >
                        {menuOpen ? <X size={20}/> : <Grid size={20}/>}
                    </button>

                    {/* NEXT BUTTON */}
                    <button 
                        onClick={onNext}
                        disabled={!nextChap}
                        className={`flex-1 flex flex-col justify-center items-end px-4 py-2 rounded-xl transition-all h-14 bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]
                        ${!nextChap ? 'opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500' : ''}`}
                    >
                        {nextChap ? (
                            <>
                                <div className="flex items-center gap-1 font-black text-sm md:text-lg">
                                    <span>NEXT</span> <ChevronRight size={16} />
                                </div>
                                <span className="text-[9px] text-zinc-500 font-bold font-mono uppercase truncate w-full text-right pr-5">
                                    {nextChap.title}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs font-bold">END MANUAL</span>
                        )}
                    </button>

                </div>
            </div>
        </>
    )
}
