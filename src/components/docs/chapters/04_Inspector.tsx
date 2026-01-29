import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Activity, Search, Wifi, WifiOff, Crown, Zap, 
  ThermometerSun, ShieldCheck, TrendingUp, CheckCircle, 
  Calculator, Fingerprint, Power 
} from 'lucide-react';

export function InspectorChapter() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-32">
            
            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                        Chapter 03
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Inspector Engine</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    The Inspector is a forensic diagnostic engine. It utilizes a multi-variate scoring matrix to grade node health and classifies behavior into distinct operational archetypes.
                </p>
            </div>

            {/* --- SECTION 1: VITALITY MATRIX --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <ShieldCheck size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">The Vitality Matrix</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            The Inspector utilizes a <strong>Dynamic Reweighting Protocol</strong>. Instead of linear averages, it employs an <strong>Elastic Scoring</strong> model that adapts to network conditions.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <Calculator size={12} /> Scoring Algorithm
                        </div>
                        <div className="font-mono text-xs text-zinc-300 bg-black p-3 rounded-lg border border-zinc-800 overflow-x-auto">
                            Score = (Uptime × <span className="text-blue-400">W.u</span>) + (Storage × <span className="text-purple-400">W.s</span>) + (Rep × <span className="text-yellow-400">W.r</span>)
                        </div>
                    </div>
                </div>
                <VitalitySimulator />
            </div>

            {/* --- SECTION 2: FORENSICS ENGINE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1">
                    <ForensicsEngine />
                </div>
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Fingerprint size={24} className="text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Forensic Timeline</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            The Inspector generates a <strong>State Heatmap</strong> to visualize stability over time.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            Complex behaviors trigger specific states. A node in "Trauma" (Purple) eventually locks into "Critical" (Red). Recovering from a critical failure isn't instant—it requires a manual reset and a mandatory <strong>Warmup Sequence</strong> (Blue) before the node is recertified as "Elite" (Green).
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Zombie State', 'Trauma Loop', 'Incubation', 'Elite'].map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold uppercase text-zinc-500">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

        </section>
    );
}

// ==========================================
// 1. VITALITY SIMULATOR (Unchanged)
// ==========================================
function VitalitySimulator() {
    const [isOnline, setIsOnline] = useState(true);
    const [uptime, setUptime] = useState(14); 
    const [storage, setStorage] = useState(100); 
    const [reputation, setReputation] = useState(80); 
    const [verRank, setVerRank] = useState(0); 

    const { score } = useMemo(() => {
        const uScore = 100 / (1 + Math.exp(-0.2 * (uptime - 7))); 
        let sScore = storage <= 100 ? 50 * Math.log2((storage / 100) + 1) : 50 + (50 * Math.log10(storage / 10));
        sScore = Math.min(100, sScore * 2);
        const vScore = verRank === 0 ? 100 : verRank === 1 ? 80 : verRank === 2 ? 40 : 0;
        
        const w = isOnline 
            ? { u: 0.35, s: 0.30, r: 0.20, v: 0.15 }
            : { u: 0.45, s: 0.35, r: 0.00, v: 0.20 };

        const final = (uScore * w.u) + (sScore * w.s) + (isOnline ? reputation * w.r : 0) + (vScore * w.v);

        return { score: Math.round(final) };
    }, [uptime, storage, reputation, verRank, isOnline]);

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center z-10">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Scoring Engine
                </h4>
                <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}
                >
                    {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
                    {isOnline ? 'API ONLINE' : 'API SEVERED'}
                </button>
            </div>

            <div className="space-y-6 z-10">
                <SimulatorSlider label="Uptime" val={uptime} setVal={setUptime} max={30} unit="d" color="text-blue-400" />
                <div className="relative">
                    <SimulatorSlider label="Storage" val={storage} setVal={setStorage} max={200} unit="%" color="text-purple-400" />
                    <TrendingUp size={14} className="text-purple-500 absolute top-0 right-0 opacity-50" />
                </div>
                <SimulatorSlider label="Reputation" val={reputation} setVal={setReputation} max={100} unit="pts" color="text-yellow-500" disabled={!isOnline} />
                
                <div className="pt-2">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase mb-2">Software Version</div>
                    <div className="grid grid-cols-4 gap-1">
                        {['LATEST', 'N-1', 'N-2', 'OLD'].map((l, i) => (
                            <button 
                                key={l} onClick={() => setVerRank(i)} 
                                className={`py-1.5 text-[8px] font-bold rounded border transition-all ${verRank === i ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-zinc-900/50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-6 right-6 flex flex-col items-end">
                <span className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${score > 80 ? 'text-white' : score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {score}
                </span>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Composite Score</span>
            </div>
        </div>
    );
}

// ==========================================
// 2. FORENSICS ENGINE (New Logic)
// ==========================================

const COLORS = {
    ELITE: 'bg-emerald-500',
    TRAUMA: 'bg-purple-500',
    ZOMBIE: 'bg-yellow-500',
    WARMUP: 'bg-blue-500',
    CRITICAL: 'bg-red-500',
    OFFLINE: 'bg-zinc-700'
};

function ForensicsEngine() {
    const [timeline, setTimeline] = useState<Array<{color: string, type: string}>>([]);
    
    // States: 'NORMAL' | 'CRITICAL' | 'WARMUP' | 'OFFLINE'
    const [status, setStatus] = useState<'NORMAL' | 'CRITICAL' | 'WARMUP' | 'OFFLINE'>('NORMAL');
    
    // Counters
    const [traumaCount, setTraumaCount] = useState(0);      // Tracks consecutive purple clicks
    const [recoveryAttempts, setRecoveryAttempts] = useState(0); // Tracks clicks on Elite while in Critical
    const [warmupProgress, setWarmupProgress] = useState(0);  // Tracks blue blocks (0 to 5)

    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [timeline]);

    // Initial fill
    useEffect(() => {
        setTimeline(Array(24).fill({ color: 'bg-zinc-900', type: 'EMPTY' }));
    }, []);

    // --- GAME LOGIC ENGINE ---
    const handleAction = (action: 'ELITE' | 'TRAUMA' | 'ZOMBIE' | 'OFFLINE') => {
        let nextBlock = { color: '', type: '' };

        // --- RULE 1: OFFLINE OVERRIDE ---
        // Offline works immediately regardless of current state
        if (action === 'OFFLINE') {
            setStatus('OFFLINE');
            setTraumaCount(0);
            setRecoveryAttempts(0);
            setWarmupProgress(0);
            nextBlock = { color: COLORS.OFFLINE, type: 'SYSTEM OFFLINE' };
            setTimeline(prev => [...prev, nextBlock]);
            return;
        }

        // --- RULE 2: STATE MACHINE ---

        // A. OFFLINE STATE
        if (status === 'OFFLINE') {
            if (action === 'ELITE') {
                // Elite triggers restart (Warmup)
                setStatus('WARMUP');
                setWarmupProgress(1);
                nextBlock = { color: COLORS.WARMUP, type: 'BOOT SEQUENCE 1/5' };
            } else {
                // Trauma/Zombie in offline just stays offline/gray
                nextBlock = { color: COLORS.OFFLINE, type: 'OFFLINE' };
            }
        }

        // B. CRITICAL STATE (Red Lock)
        else if (status === 'CRITICAL') {
            if (action === 'ELITE') {
                // Elite Attempt 1: Fail (Stay Red)
                if (recoveryAttempts === 0) {
                    setRecoveryAttempts(1);
                    nextBlock = { color: COLORS.CRITICAL, type: 'RECOVERY FAILED' };
                } 
                // Elite Attempt 2: Success (Switch to Warmup)
                else {
                    setStatus('WARMUP');
                    setWarmupProgress(1);
                    setRecoveryAttempts(0); // Reset for next time
                    nextBlock = { color: COLORS.WARMUP, type: 'RECOVERY INIT 1/5' };
                }
            } else {
                // Clicking Trauma/Zombie keeps it Critical
                nextBlock = { color: COLORS.CRITICAL, type: 'CRITICAL FAILURE' };
            }
        }
        
        // C. WARMUP STATE (Blue Sequence)
        else if (status === 'WARMUP') {
             // Any click (except Offline, handled above) advances warmup
             // but we paint Blue regardless of what button was clicked
             if (warmupProgress < 5) {
                 const current = warmupProgress + 1;
                 setWarmupProgress(current);
                 nextBlock = { color: COLORS.WARMUP, type: `WARMUP SEQ ${current}/5` };
                 
                 // If we just hit 5, next click will be Normal
                 if (current >= 5) {
                     setStatus('NORMAL');
                     setTraumaCount(0);
                 }
             }
        }

        // D. NORMAL OPERATIONS
        else {
            if (action === 'ELITE') {
                nextBlock = { color: COLORS.ELITE, type: 'ELITE STATUS' };
                setTraumaCount(0); 
            } 
            else if (action === 'TRAUMA') {
                // Check Trauma Threshold
                if (traumaCount + 1 >= 3) {
                    setStatus('CRITICAL');
                    nextBlock = { color: COLORS.CRITICAL, type: 'CRITICAL LOCK' };
                } else {
                    setTraumaCount(t => t + 1);
                    nextBlock = { color: COLORS.TRAUMA, type: 'TRAUMA RESTART' };
                }
            }
            else if (action === 'ZOMBIE') {
                // Random chance for Missing Credits
                if (Math.random() > 0.7) {
                    const temp = [...timeline, { color: COLORS.ZOMBIE, type: 'ZOMBIE STATE' }];
                    setTimeline([...temp, { color: COLORS.WARMUP, type: 'MISSING CREDITS' }]);
                    return; 
                } else {
                    nextBlock = { color: COLORS.ZOMBIE, type: 'ZOMBIE STATE' };
                }
            }
        }

        setTimeline(prev => [...prev, nextBlock]);
    };

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl min-h-[400px] relative overflow-hidden">
            
            {/* Header / Status Display */}
            <div className="flex justify-between items-start mb-6 z-10">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Search size={12} /> Pattern Matcher
                </div>
                {/* Dynamic Status Pill */}
                <div className={`px-3 py-1 rounded-full border flex items-center gap-2 transition-all duration-300 ${status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : status === 'WARMUP' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : status === 'OFFLINE' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'CRITICAL' ? 'bg-red-500' : status === 'WARMUP' ? 'bg-blue-500' : status === 'OFFLINE' ? 'bg-zinc-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-[9px] font-bold uppercase">
                        {status === 'CRITICAL' ? 'SYSTEM LOCK' : status === 'WARMUP' ? `WARMING UP ${warmupProgress}/5` : status === 'OFFLINE' ? 'SIGNAL LOST' : 'NOMINAL'}
                    </span>
                </div>
            </div>

            {/* --- THE CONTROLS --- */}
            <div className="grid grid-cols-2 gap-3 mb-6 z-10">
                <ForensicButton 
                    label="Elite" 
                    icon={Crown} 
                    color="text-emerald-400" 
                    borderColor="border-emerald-500/20" 
                    hoverBg="hover:bg-emerald-500/10"
                    onClick={() => handleAction('ELITE')} 
                />
                <ForensicButton 
                    label="Trauma" 
                    icon={Zap} 
                    color="text-purple-400" 
                    borderColor="border-purple-500/20" 
                    hoverBg="hover:bg-purple-500/10"
                    onClick={() => handleAction('TRAUMA')} 
                />
                <ForensicButton 
                    label="Zombie" 
                    icon={ThermometerSun} 
                    color="text-yellow-400" 
                    borderColor="border-yellow-500/20" 
                    hoverBg="hover:bg-yellow-500/10"
                    onClick={() => handleAction('ZOMBIE')} 
                />
                <ForensicButton 
                    label="Offline" 
                    icon={Power} 
                    color="text-zinc-400" 
                    borderColor="border-zinc-700" 
                    hoverBg="hover:bg-zinc-800"
                    onClick={() => handleAction('OFFLINE')} 
                />
            </div>

            {/* --- THE HEATMAP --- */}
            <div className="flex-1 bg-black/40 rounded-xl border border-zinc-800 p-3 relative flex flex-col z-10">
                <div className="text-[8px] font-bold text-zinc-600 uppercase mb-2 flex justify-between">
                    <span>Timeline Log</span>
                    <span>{timeline.filter(t => t.type !== 'EMPTY').length} Epochs</span>
                </div>
                
                {/* Scrolling Grid */}
                <div ref={logRef} className="flex-1 overflow-y-auto custom-scrollbar content-start grid grid-cols-8 gap-1.5 auto-rows-min max-h-[140px]">
                    {timeline.map((block, i) => (
                        <div 
                            key={i} 
                            className={`aspect-square rounded-sm transition-all duration-300 ${block.color} ${block.type === 'EMPTY' ? 'opacity-20' : 'opacity-100 hover:scale-110'}`}
                            title={`Epoch ${i}: ${block.type}`}
                        ></div>
                    ))}
                    {/* Blinking Cursor */}
                    <div className="aspect-square rounded-sm bg-zinc-800 animate-pulse"></div>
                </div>
            </div>

             {/* Background Gradient */}
             <div className={`absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none transition-colors duration-500 bg-gradient-to-bl ${status === 'CRITICAL' ? 'from-red-600' : status === 'WARMUP' ? 'from-blue-600' : 'from-emerald-600'} to-transparent`}></div>
        </div>
    );
}

function ForensicButton({ label, icon: Icon, color, borderColor, hoverBg, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`h-12 rounded-lg border bg-zinc-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 ${borderColor} ${color} ${hoverBg}`}
        >
            <Icon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    )
}

function SimulatorSlider({ label, val, setVal, max, unit, color, disabled }: any) {
    return (
        <div className={`transition-all duration-300 ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between items-end mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${disabled ? 'text-zinc-600' : 'text-zinc-500'}`}>{label}</span>
                <span className={`text-[10px] font-mono font-bold ${color}`}>{val}{unit}</span>
            </div>
            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-800">
                <div className={`absolute top-0 left-0 h-full ${disabled ? 'bg-zinc-700' : 'bg-white'} transition-all`} style={{ width: `${Math.min(100, (val/max)*100)}%` }}></div>
                <input type="range" min="0" max={max} value={val} onChange={(e) => setVal(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
        </div>
    );
}
