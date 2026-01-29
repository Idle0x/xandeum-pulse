import { useState, useEffect } from 'react';
import { Monitor, Eye, LayoutGrid, LayoutList, RefreshCw, Wifi, EyeOff, Zap } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const TELEMETRY_TEXT = [
    {
        title: "Hybrid-Density Topology",
        content: "The Pulse interface is built on a Hybrid-Density Topology designed to adapt to different operator needs. Whether you are performing a macro-audit of 1,000+ nodes or deep-diving into a single validator's vitals, the dashboard manages data density through intelligent metric rotation."
    },
    {
        title: "OLED Preservation Protocol",
        content: "Beyond visualization, the platform incorporates a Hardware Preservation Protocol (Zen Mode). 24/7 monitoring leads to screen burn-in. Engaging Zen Mode strips the UI of all blurs, gradients, and animations, rendering the entire dashboard in high-contrast OLED black to minimize light emission."
    }
];

const TELEMETRY_CODE = `
// Layout State Manager
const [layout, setLayout] = useLocalStorage('view_mode', 'GRID');

// OLED "Zen Mode" Injector
const toggleZen = () => {
  document.body.classList.toggle('zen-mode');
  // Disables all blur filters and CSS animations
  // Forces #000000 background for pixel-off savings
  if (active) disableReactSpring();
};
`;

export function TelemetryChapter() {
    const [zenMode, setZenMode] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
    const [metricIndex, setMetricIndex] = useState(0);
    const [hasSwitchedLayout, setHasSwitchedLayout] = useState(false);

    // Cyclic Metric Logic
    useEffect(() => {
        const i = setInterval(() => setMetricIndex(p => (p + 1) % 3), 4000);
        return () => clearInterval(i);
    }, []);

    const handleLayoutSwitch = (mode: 'GRID' | 'LIST') => {
        setLayoutMode(mode);
        setHasSwitchedLayout(true);
    };

    return (
        <ChapterLayout
            chapterNumber="02"
            title="Telemetry & UX"
            subtitle="Adapting data density for macro-audits and hardware preservation."
            textData={TELEMETRY_TEXT}
            codeSnippet={TELEMETRY_CODE}
            githubPath="src/components/ui/telemetry-engine.tsx"
        >
            <div className={`h-full p-8 transition-colors duration-1000 flex flex-col relative overflow-hidden ${zenMode ? 'bg-black' : 'bg-[#09090b]'}`}>

                {/* 1. Header Controls */}
                <div className="flex flex-col gap-6 mb-10 border-b border-zinc-800 pb-8 relative z-20">
                    {/* Zen Toggle */}
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${zenMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            {zenMode ? 'OLED Protection Active' : 'Pixel Burn Risk Detected'}
                        </span>

                        <button 
                            onClick={() => setZenMode(!zenMode)}
                            className={`
                                group relative px-6 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500
                                ${zenMode 
                                    ? 'bg-zinc-900 border-zinc-800 text-green-500 hover:bg-zinc-800' // Active (Safe) State
                                    : 'bg-red-500/10 border-red-500 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500/20' // Alert State
                                }
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {zenMode ? <Eye size={14}/> : <EyeOff size={14}/>} 
                                {zenMode ? 'SYSTEM SAFE' : 'ENGAGE ZEN MODE'}
                            </span>
                        </button>
                    </div>

                    {/* Layout Toggle with Visual Aid */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-fit">

                            {/* The Visual Aid (Blue Dot) */}
                            {!hasSwitchedLayout && (
                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full animate-ping z-30 pointer-events-none"></span>
                            )}

                            <button 
                                onClick={() => handleLayoutSwitch('GRID')}
                                className={`p-2 rounded-md transition-all ${layoutMode === 'GRID' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <LayoutGrid size={16}/>
                            </button>
                            <button 
                                onClick={() => handleLayoutSwitch('LIST')}
                                className={`p-2 rounded-md transition-all ${layoutMode === 'LIST' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <LayoutList size={16}/>
                            </button>
                        </div>
                        <span className={`text-[9px] font-bold text-zinc-600 uppercase tracking-widest transition-opacity ${hasSwitchedLayout ? 'opacity-0' : 'opacity-100'}`}>
                            &larr; Switch Topology
                        </span>
                    </div>
                </div>

                {/* 2. The Content Area */}
                <div className="flex-1 relative z-10">
                    {layoutMode === 'GRID' ? (
                        // GRID MODE: Cyclic Cards
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className={`p-6 rounded-2xl border transition-all duration-1000 ${zenMode ? 'bg-black border-zinc-900' : 'bg-black border-zinc-700 shadow-xl'}`}>
                                    <div className="flex justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${zenMode ? 'bg-zinc-800' : 'bg-green-500 animate-pulse'}`}></div>
                                            <span className={`font-bold text-sm ${zenMode ? 'text-zinc-600' : 'text-zinc-300'}`}>Validator 0x82...9A</span>
                                        </div>
                                        <Wifi size={14} className="text-zinc-600"/>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase font-bold text-zinc-600">Region</div>
                                            <div className={`font-mono text-xs ${zenMode ? 'text-zinc-700' : 'text-zinc-400'}`}>Tokyo, JP</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase font-bold text-zinc-600">Status</div>
                                            <div className={`font-mono text-xs ${zenMode ? 'text-zinc-700' : 'text-green-500'}`}>Active</div>
                                        </div>
                                        {/* Cycling Metric */}
                                        <div className="space-y-1 relative overflow-hidden">
                                            <div className={`text-[9px] uppercase font-bold flex items-center gap-1 ${zenMode ? 'text-zinc-700' : 'text-blue-500'}`}>
                                                <RefreshCw size={8} className={zenMode ? '' : 'animate-spin'}/> Cycling
                                            </div>
                                            <div className="h-4 relative">
                                                <div className={`absolute transition-all duration-500 ${metricIndex === 0 ? 'top-0 opacity-100' : '-top-4 opacity-0'}`}>
                                                    <span className={`font-mono text-xs ${zenMode ? 'text-zinc-500' : 'text-white'}`}>Health: 98%</span>
                                                </div>
                                                <div className={`absolute transition-all duration-500 ${metricIndex === 1 ? 'top-0 opacity-100' : '-top-4 opacity-0'}`}>
                                                    <span className={`font-mono text-xs ${zenMode ? 'text-zinc-500' : 'text-white'}`}>Stor: 1.2PB</span>
                                                </div>
                                                <div className={`absolute transition-all duration-500 ${metricIndex === 2 ? 'top-0 opacity-100' : '-top-4 opacity-0'}`}>
                                                    <span className={`font-mono text-xs ${zenMode ? 'text-zinc-500' : 'text-white'}`}>Up: 14d 2h</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // LIST MODE: High Density
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${zenMode ? 'border-zinc-900 text-zinc-700' : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400'}`}>
                                    <span className="text-xs font-mono">0x82...9A</span>
                                    <span className="text-xs font-mono">Tokyo</span>
                                    <span className={`text-xs font-mono ${zenMode ? 'text-zinc-700' : 'text-green-500'}`}>98%</span>
                                    <span className="text-xs font-mono">1.2PB</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. ZEN OVERLAY (The Dimmer) */}
                {/* This covers the content to simulate screen dimming, but keeps controls clickable via z-index */}
                <div className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none z-15 ${zenMode ? 'opacity-90' : 'opacity-0'}`}></div>

            </div>
        </ChapterLayout>
    );
}

