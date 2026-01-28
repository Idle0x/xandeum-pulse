import { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Calculator, Zap } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const ECON_TEXT = [
    {
        title: "Geometric Stacking",
        content: "Pulse uses Geometric Stacking logic. Unlike traditional linear rewards, Pulse compounds multipliers (Era boosts, NFT power, and hardware tier) to reward optimized setups exponentially. A 1.5x multiplier and a 1.2x multiplier result in 1.8x total yield, not 1.7x."
    },
    {
        title: "Wealth Accumulation",
        content: "The platform distinguishes between 'Accumulation' (Total Wealth) and 'Yield Velocity' (Growth Rate). The Accumulation chart visualizes every credit ever earned by the node's stable identity, providing a macro view of long-term holding."
    },
    {
        title: "Yield Velocity",
        content: "Simultaneously, 'Yield Velocity' tracks your earning rate per session. This metric is processed by the Neural Core to identify whether your node is maintaining its competitive edge or experiencing dilution relative to the network mean."
    }
];

const ECON_CODE = `
const calcYield = (base, multipliers) => {
  // Geometric Stacking Logic
  // Multipliers compound (multiply) rather than add
  // Example: 100 * 1.5 * 1.2 = 180 (vs Linear 170)
  
  return multipliers.reduce(
    (acc, m) => acc * m.val, 
    base
  );
};
`;

export function EconomicsChapter() {
    return (
        <ChapterLayout
            chapterNumber="08"
            title="Economics Engine"
            subtitle="Geometric stacking, wealth accumulation, and yield velocity tracking."
            textData={ECON_TEXT}
            codeSnippet={ECON_CODE}
            githubPath="src/logic/economics-engine.ts"
        >
            <div className="h-full bg-[#080808] p-8 flex flex-col gap-6">
                
                {/* 1. DUAL ANIMATED CHARTS */}
                <div className="grid grid-cols-2 gap-4 h-48">
                    <AnimatedChart 
                        type="ACCUMULATION" 
                        value="5.2M" 
                        label="Total Wealth" 
                        color="blue" 
                        delay={0}
                    />
                    <AnimatedChart 
                        type="VELOCITY" 
                        value="180/hr" 
                        label="Earning Rate" 
                        color="yellow" 
                        delay={200}
                    />
                </div>

                {/* 2. STOINC CALCULATOR */}
                <StoincSimulator />
            </div>
            {/* Global Keyframes for the drawing effect */}
            <style>{`
                @keyframes drawGraph { to { stroke-dashoffset: 0; } }
                @keyframes fadeFill { to { opacity: 1; } }
            `}</style>
        </ChapterLayout>
    );
}

function AnimatedChart({ type, value, label, color, delay }: any) {
    const isBlue = color === 'blue';
    const stroke = isBlue ? '#60a5fa' : '#eab308';
    
    // Different paths for different data types
    const pathD = type === 'ACCUMULATION' 
        ? "M0 100 Q 50 90, 100 80 T 200 60 T 300 10" // Smooth curve up
        : "M0 80 Q 30 100, 60 50 T 120 70 T 180 30 T 240 60 T 300 20"; // Volatile spikes

    return (
        <div 
            className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition-colors animate-in fade-in zoom-in-95 duration-700"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    {isBlue ? <TrendingUp size={14} className="text-blue-400"/> : <BarChart2 size={14} className="text-yellow-500"/>}
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
                </div>
                <div className={`text-xl font-black tracking-tighter ${isBlue ? 'text-blue-400' : 'text-yellow-500'}`}>{value}</div>
            </div>

            {/* The Animated Graph */}
            <div className="absolute bottom-0 left-0 right-0 h-20 opacity-60">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* The Line */}
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke={stroke} 
                        strokeWidth="3"
                        strokeDasharray="500"
                        strokeDashoffset="500"
                        className="animate-[drawGraph_2.5s_ease-out_forwards]"
                        style={{ animationDelay: `${delay + 200}ms` }}
                    />
                    {/* The Area Fill (Fades in) */}
                    <path 
                        d={`${pathD} V 150 H 0 Z`} 
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

function StoincSimulator() {
    const [boost, setBoost] = useState(false);
    const [displayVal, setDisplayVal] = useState(100);

    // Ticker Effect Logic
    useEffect(() => {
        const target = boost ? 180 : 100;
        if (displayVal === target) return;

        // Speed depends on distance to target
        const interval = setInterval(() => {
            setDisplayVal(prev => {
                const diff = target - prev;
                // Snap to target if close
                if (Math.abs(diff) < 2) return target;
                // Accelerate the count
                return prev + (diff > 0 ? Math.ceil(diff / 5) : Math.floor(diff / 5));
            });
        }, 30);
        return () => clearInterval(interval);
    }, [boost, displayVal]);

    return (
        <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            
            {/* Header Icon */}
            <div className={`
                p-3 rounded-full mb-6 border transition-all duration-500
                ${boost ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 scale-110' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}
            `}>
                <Calculator size={24}/>
            </div>
            
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Projected Session Yield</div>
            
            {/* Ticker Number */}
            <div className={`text-6xl font-black tracking-tighter mb-8 tabular-nums transition-colors duration-300 ${boost ? 'text-yellow-400' : 'text-zinc-600'}`}>
                {displayVal}
            </div>

            {/* Interaction Button */}
            <button 
                onClick={() => setBoost(!boost)}
                className={`
                    relative px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 group
                    ${boost 
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'}
                `}
            >
                <span className="flex items-center gap-2">
                    {boost ? <Zap size={14} fill="currentColor"/> : <Zap size={14}/>}
                    {boost ? 'Reset Matrix' : 'Apply Geometric Boost'}
                </span>

                {/* Subconscious Cue (The Ping) */}
                {!boost && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping pointer-events-none"></span>
                )}
            </button>

            {/* Background Flair when Boosted */}
            <div className={`absolute inset-0 bg-yellow-500/5 transition-opacity duration-700 pointer-events-none ${boost ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>
    );
}
