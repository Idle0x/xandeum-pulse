import { useState, useEffect, useRef } from 'react';
import { Terminal, Code2, ArrowDown } from 'lucide-react';

interface ChapterLayoutProps {
    title: string;
    subtitle: string;
    chapterNumber: string;
    textData: { title?: string; content: string }[]; // Array of paragraphs/sections
    codeSnippet: string; // The backend logic to type out
    githubPath: string;
    children: React.ReactNode; // The Interactive Simulator
}

export function ChapterLayout({ 
    title, subtitle, chapterNumber, textData, codeSnippet, githubPath, children 
}: ChapterLayoutProps) {
    
    // Typewriter Logic
    const [displayedCode, setDisplayedCode] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const codeRef = useRef<HTMLDivElement>(null);

    // Intersection Observer to trigger typing when code comes into view
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isTyping && displayedCode.length === 0) {
                setIsTyping(true);
            }
        }, { threshold: 0.3 });

        if (codeRef.current) observer.observe(codeRef.current);
        return () => observer.disconnect();
    }, [isTyping, displayedCode]);

    // The Typing Effect
    useEffect(() => {
        if (!isTyping) return;
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedCode(codeSnippet.slice(0, i));
            i++;
            if (i > codeSnippet.length) clearInterval(interval);
        }, 20); // Typing speed
        return () => clearInterval(interval);
    }, [isTyping, codeSnippet]);

    return (
        <section className="min-h-screen w-full bg-[#050505] border-b border-zinc-900/50 py-24 relative">
            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                
                {/* LEFT COLUMN: The Manual (Scrolls) */}
                <div className="space-y-12 lg:pb-32">
                    {/* Chapter Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border border-blue-900/30 bg-blue-500/10 px-3 py-1 rounded-full">
                                Chapter {chapterNumber}
                            </span>
                            <div className="h-px flex-1 bg-zinc-900"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                            {title}
                        </h2>
                        <p className="text-xl text-zinc-400 font-light leading-relaxed">
                            {subtitle}
                        </p>
                    </div>

                    {/* Restored Prose Content */}
                    <div className="space-y-10">
                        {textData.map((block, idx) => (
                            <div key={idx} className="group">
                                {block.title && (
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        {block.title}
                                        <ArrowDown size={12} className="opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-zinc-500"/>
                                    </h3>
                                )}
                                <p className="text-zinc-400 leading-8 text-[15px] font-medium tracking-wide">
                                    {block.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Live Backend Logic Display */}
                    <div ref={codeRef} className="mt-16 space-y-4">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                            <span className="flex items-center gap-2"><Code2 size={12}/> Backend Logic</span>
                            <span className="font-mono text-zinc-600">{githubPath}</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-zinc-800 shadow-inner overflow-hidden relative group/code hover:border-zinc-700 transition-colors">
                            <div className="absolute top-4 right-4 flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                                <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                            </div>
                            <pre className="font-mono text-[10px] leading-relaxed text-blue-300/90 whitespace-pre-wrap">
                                {displayedCode}
                                <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                            </pre>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: The Interactive Simulator (Sticky) */}
                <div className="hidden lg:block sticky top-24 h-fit min-h-[600px] bg-[#080808] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    {children}
                </div>
                
                {/* Mobile Fallback (Just render children normally) */}
                <div className="lg:hidden block bg-[#080808] border border-zinc-800 rounded-[2rem] overflow-hidden">
                    {children}
                </div>

            </div>
        </section>
    );
}
