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
                fixed bottom-4 left-0 right-0  /* Mobile: Fixed at bottom with slightly less margin */
                md:relative md:bottom-auto md:mt-20 md:mb-24 md:px-0 md:w-full md:max-w-5xl md:mx-auto /* Desktop: Static, Large, Centered */
            ">

                {/* GLASS MENU POPUP */}
                {menuOpen && (
                    <div ref={menuRef} className="absolute bottom-16 md:bottom-28 z-50 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_40px_rgba(8,145,178,0.2)] backdrop-blur-xl w-64 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
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

                {/* NAVIGATION BAR 
                    Mobile Height Fix: Reduced padding (p-1), reduced gap.
                    Desktop: Kept larger (md:p-3, md:gap-2).
                */}
                <div className="flex items-center justify-between gap-1 md:gap-2 p-1 md:p-3 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl w-full relative">

                    {/* PREVIOUS BUTTON 
                        Mobile: h-10 (40px)
                        Desktop: h-14 (56px)
                    */}
                    <button 
                        onClick={onPrev}
                        disabled={!prevChap}
                        className={`flex-1 flex flex-col justify-center items-start px-3 md:px-4 rounded-xl transition-all h-10 md:h-14
                        ${prevChap ? 'hover:bg-zinc-900 group cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                    >
                        {prevChap && (
                            <>
                                <div className="flex items-center gap-1 text-zinc-300 font-black text-xs md:text-lg group-hover:-translate-x-1 transition-transform">
                                    <ChevronLeft size={14} className="md:w-4 md:h-4" /> <span>PREV</span>
                                </div>
                                <span className="text-[8px] md:text-[9px] text-zinc-600 font-mono uppercase truncate w-full text-left pl-4 md:pl-5 leading-none mt-0.5 md:mt-0">
                                    {prevChap.title}
                                </span>
                            </>
                        )}
                    </button>

                    {/* CENTER: CURRENT CHAPTER (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-col items-center justify-center px-12 border-x border-zinc-800/50 h-10">
                        <div className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest mb-1">Current Section</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-${currentChap.color}-500 animate-pulse`}></span>
                            {currentChap.title}
                        </div>
                    </div>

                    {/* MENU TRIGGER 
                        Changes:
                        1. Wider (w-14 mobile / w-20 desktop)
                        2. Stacked Layout (flex-col)
                        3. Added "MENU" label
                        4. Adjusted height to match buttons (h-10 mobile / h-14 desktop)
                    */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="w-14 md:w-20 h-10 md:h-14 shrink-0 rounded-xl bg-cyan-900/10 border border-zinc-800 flex flex-col items-center justify-center gap-0.5 md:gap-1 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all active:scale-95 mx-1 md:mx-2"
                    >
                        {menuOpen ? <X size={16} className="md:w-5 md:h-5"/> : <Grid size={16} className="md:w-5 md:h-5"/>}
                        <span className="text-[8px] md:text-[9px] font-bold tracking-wider leading-none">MENU</span>
                    </button>

                    {/* NEXT BUTTON 
                        Mobile: h-10 (40px)
                        Desktop: h-14 (56px)
                    */}
                    <button 
                        onClick={onNext}
                        disabled={!nextChap}
                        className={`flex-1 flex flex-col justify-center items-end px-3 md:px-4 rounded-xl transition-all h-10 md:h-14 bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]
                        ${!nextChap ? 'opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500' : ''}`}
                    >
                        {nextChap ? (
                            <>
                                <div className="flex items-center gap-1 font-black text-xs md:text-lg">
                                    <span>NEXT</span> <ChevronRight size={14} className="md:w-4 md:h-4" />
                                </div>
                                <span className="text-[8px] md:text-[9px] text-zinc-500 font-bold font-mono uppercase truncate w-full text-right pr-4 md:pr-5 leading-none mt-0.5 md:mt-0">
                                    {nextChap.title}
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] md:text-xs font-bold">END MANUAL</span>
                        )}
                    </button>

                </div>
            </div>
        </>
    )
}
