// src/components/layout/LogicWrapper.tsx
import { Code2, Terminal } from 'lucide-react';

export function LogicWrapper({ title, code, children, githubPath }: any) {
    return (
        <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left: The Visual Simulator (Takes up 7 cols) */}
                <div className="lg:col-span-7 order-2 lg:order-1">
                    {children}
                </div>

                {/* Right: The Logic/Code (Takes up 5 cols) */}
                <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-500 mb-4">
                            <Terminal size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Logic Core</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-4">{title}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 border border-zinc-800 bg-zinc-900/50 w-fit px-3 py-1 rounded-full">
                            <Code2 size={12}/> {githubPath}
                        </div>
                    </div>

                    {/* The Code Block */}
                    <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-2xl relative group">
                        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <pre className="text-[10px] leading-relaxed font-mono text-blue-300">
                                {code}
                            </pre>
                        </div>
                        {/* Fader at bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0c0c0e] to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
