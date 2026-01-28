import { useState, useEffect, useRef } from 'react';
import { TrendingUp, BarChart2, Code2, Terminal } from 'lucide-react';

const STOINC_CODE = `
// lib/xandeum-economics.ts

export function calculateStoinc(inputs: StoincInputs) {
  // 1. GEOMETRIC STACKING: Compound multipliers instead of adding
  let product = 1;
  Object.entries(inputs.boosts).forEach(([name, count]) => {
      const val = ERA_BOOSTS[name] || 1;
      for(let i=0; i<count; i++) product *= val; // Multiply 'count' times
  });

  // 2. NORMALIZE: Root based on fleet size prevents 'whale' dominance
  // If you run 10 nodes, we take the 10th root of your total boost
  const geoMean = Math.pow(product, 1 / Math.max(1, inputs.nodeCount));
  
  // 3. FINAL YIELD POWER
  return inputs.userBaseCredits * geoMean;
}
`;

export function EconomicsChapter() {
    return (
        <section className="min-h-screen w-full bg-[#050505] border-b border-zinc-900/50 py-24 relative">
            <div className="max-w-4xl mx-auto px-6 flex flex-col gap-20">
                
                {/* 1. HEADER */}
                <div className="space-y-4 text-center mb-8">
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border border-blue-900/30 bg-blue-500/10 px-3 py-1 rounded-full">
                            Chapter 08
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                        Economics Engine
                    </h2>
                    <p className="text-xl text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
                        Geometric stacking, wealth accumulation, and yield velocity tracking.
                    </p>
                </div>

                {/* 2. WEALTH ACCUMULATION */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={24}/> Wealth Accumulation
                        </h3>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            The platform distinguishes between 'Accumulation' (Total Wealth) and 'Yield Velocity' (Growth Rate). 
                            The Accumulation chart visualizes every credit ever earned by the node's stable identity, 
                            providing a macro view of long-term holding. This metric serves as the primary indicator of 
                            legacy reputation within the consensus layer.
                        </p>
                    </div>
                    
                    {/* Full Width Chart: 40% Height */}
                    <AnimatedChart 
                        type="ACCUMULATION" 
                        value="5.2M" 
                        label="Total Wealth Accumulated" 
                        color="blue" 
                        delay={0}
                    />
                </div>

                {/* 3. YIELD VELOCITY */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <BarChart2 className="text-yellow-500" size={24}/> Yield Velocity
                        </h3>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Simultaneously, 'Yield Velocity' tracks your earning rate per session. This metric is processed 
                            by the Neural Core to identify whether your node is maintaining its competitive edge or 
                            experiencing dilution relative to the network mean. A drop in velocity often precedes 
                            a drop in rank, acting as an early warning system for hardware upgrades.
                        </p>
                    </div>

                    {/* Full Width Chart: 40% Height */}
                    <AnimatedChart 
                        type="VELOCITY" 
                        value="180/hr" 
                        label="Current Earning Rate" 
                        color="yellow" 
                        delay={200}
                    />
                </div>

                {/* 4. STOINC SIMULATOR (Code Context) */}
                <div className="space-y-8 pt-12 border-t border-zinc-900">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight">STOINC Simulator</h3>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Pulse utilizes a Geometric Mean strategy for calculating boosts. Unlike traditional linear rewards 
                            where multipliers strictly add up, the STOINC engine compounds Era boosts, NFT power, and 
                            hardware tier. This ensures that high-commitment operators—those optimizing across all 
                            verticals—are rewarded exponentially rather than linearly. The simulator normalizes these 
                            inputs into a single <code>geoMean</code> coefficient that drives the final yield share.
                        </p>
                    </div>

                    <CodeBlock 
                        code={STOINC_CODE} 
                        path="src/xandeum-economics.ts" 
                    />
                </div>

            </div>
            
            {/* Global Styles for Chart Animations */}
            <style>{`
                @keyframes drawGraph { to { stroke-dashoffset: 0; } }
                @keyframes fadeFill { to { opacity: 1; } }
            `}</style>
        </section>
    );
}

// --- SUB-COMPONENTS ---

function AnimatedChart({ type, value, label, color, delay }: any) {
    const isBlue = color === 'blue';
    const stroke = isBlue ? '#60a5fa' : '#eab308';
    
    // Smooth Curve vs Volatile Spikes
    const pathD = type === 'ACCUMULATION' 
        ? "M0 100 Q 150 90, 300 80 T 600 60 T 900 10" 
        : "M0 80 Q 100 100, 200 50 T 400 70 T 600 30 T 800 60 T 1000 20";

    return (
        <div 
            className="w-full h-40 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
                    <div className={`text-3xl font-black tracking-tighter ${isBlue ? 'text-blue-400' : 'text-yellow-500'}`}>{value}</div>
                </div>
            </div>

            {/* The Animated Graph */}
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-60">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* The Line */}
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke={stroke} 
                        strokeWidth="3"
                        strokeDasharray="1200"
                        strokeDashoffset="1200"
                        className="animate-[drawGraph_2.5s_ease-out_forwards]"
                        style={{ animationDelay: `${delay + 200}ms` }}
                    />
                    {/* The Area Fill */}
                    <path 
                        d={`${pathD} V 200 H 0 Z`} 
                        fill={`url(#grad-${color})`} 
                        className="opacity-0 animate-[fadeFill_2s_ease-out_forwards]"
                        style={{ animationDelay: `${delay + 800}ms` }}
                    />
                    <defs>
                        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function CodeBlock({ code, path }: { code: string, path: string }) {
    const [displayedCode, setDisplayedCode] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for Typewriter Trigger
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isTyping && displayedCode.length === 0) {
                setIsTyping(true);
            }
        }, { threshold: 0.2 });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isTyping, displayedCode]);

    // Typewriter Logic
    useEffect(() => {
        if (!isTyping) return;
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedCode(code.slice(0, i + 1)); // Single character typing
            i += 1;
            if (i > code.length) clearInterval(interval);
        }, 10);
        return () => clearInterval(interval);
    }, [isTyping, code]);

    return (
        <div ref={containerRef} className="rounded-3xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden shadow-2xl relative group">
            {/* Window Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <Code2 size={12} className="text-blue-500"/> {path}
                </div>
            </div>

            {/* Code Content */}
            <div className="p-6 overflow-x-auto">
                <pre className="font-mono text-[11px] leading-relaxed text-blue-300/90 whitespace-pre-wrap">
                    {displayedCode}
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                </pre>
            </div>
        </div>
    );
}
