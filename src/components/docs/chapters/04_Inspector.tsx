import { useState, useMemo } from 'react';
import { 
  Activity, Search, Wifi, WifiOff, Database, Server, Info, 
  Crown, Zap, ThermometerSun, AlertTriangle, ShieldCheck, 
  GitBranch, TrendingUp, CheckCircle 
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const VITALITY_CODE = `
// Dynamic Reweighting: Handling Network Partial Failure
const computeVitality = (metrics, isApiOnline) => {
  // 1. Calculate Base Pillars
  const uptimeScore = getSigmoidScore(metrics.uptime);
  const storageScore = getElasticScore(metrics.storage);
  const versionScore = getVersionGate(metrics.version);

  // 2. Define Weight Matrix
  // If API is offline, void reputation and boost hardware reliance
  const weights = isApiOnline 
    ? { uptime: 0.35, storage: 0.30, rep: 0.20, ver: 0.15 }  // Standard
    : { uptime: 0.45, storage: 0.35, rep: 0.00, ver: 0.20 }; // Failover

  // 3. Compute Composite
  return (
    (uptimeScore * weights.uptime) + 
    (storageScore * weights.storage) + 
    (isApiOnline ? (metrics.rep * weights.rep) : 0) + 
    (versionScore * weights.ver)
  );
};
`;

// --- SIMULATION 1: VITALITY CALCULATOR ---
function VitalitySimulator() {
    const [isOnline, setIsOnline] = useState(true);
    const [uptime, setUptime] = useState(14); // Days
    const [storage, setStorage] = useState(100); // % of Median
    const [reputation, setReputation] = useState(80); // Percentile
    const [verRank, setVerRank] = useState(0); // 0=Latest, 1=N-1, 2=N-2, 3=Obs

    // Math Logic
    const { score, weights, subScores } = useMemo(() => {
        // 1. Sigmoid Uptime (0-30 days)
        const uScore = 100 / (1 + Math.exp(-0.2 * (uptime - 7))); // Steep curve around day 7

        // 2. Elastic Storage (Diminishing Returns)
        // Logarithmic growth: Fast to 100%, slow to 200%
        let sScore = 0;
        if (storage <= 100) sScore = 50 * Math.log2((storage / 100) + 1); // 0 -> 50
        else sScore = 50 + (50 * Math.log10(storage / 10)); // Diminishing returns after median
        sScore = Math.min(100, sScore * 2); // Boost for demo feel

        // 3. Version Gate
        const vScore = verRank === 0 ? 100 : verRank === 1 ? 80 : verRank === 2 ? 40 : 0;

        // 4. Weights
        const w = isOnline 
            ? { u: 0.35, s: 0.30, r: 0.20, v: 0.15 }
            : { u: 0.45, s: 0.35, r: 0.00, v: 0.20 };

        const final = (uScore * w.u) + (sScore * w.s) + (isOnline ? reputation * w.r : 0) + (vScore * w.v);
        
        return { 
            score: Math.round(final), 
            weights: w,
            subScores: { u: Math.round(uScore), s: Math.round(sScore), v: vScore }
        };
    }, [uptime, storage, reputation, verRank, isOnline]);

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            {/* Header / Network Toggle */}
            <div className="flex justify-between items-center z-10">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-zinc-500" /> Scoring Engine
                </h4>
                <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${isOnline ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-500' : 'bg-red-900/10 border-red-500/30 text-red-500 animate-pulse'}`}
                >
                    {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
                    {isOnline ? 'API ONLINE' : 'API SEVERED'}
                </button>
            </div>

            {/* Main Interface */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
                {/* Sliders */}
                <div className="space-y-6">
                    <SimulatorSlider label="Uptime" val={uptime} setVal={setUptime} max={30} unit="d" color="text-blue-400" />
                    
                    {/* Storage with Micro-Graph */}
                    <div className="relative">
                        <SimulatorSlider label="Storage" val={storage} setVal={setStorage} max={200} unit="%" color="text-purple-400" />
                        <div className="absolute -right-2 -top-1 opacity-30 pointer-events-none">
                            <TrendingUp size={16} className="text-purple-500" />
                        </div>
                    </div>

                    <SimulatorSlider label="Reputation" val={reputation} setVal={setReputation} max={100} unit="pts" color="text-yellow-500" disabled={!isOnline} />
                    
                    {/* Version Toggles */}
                    <div className="flex gap-1 pt-1">
                        {['LATEST', 'N-1', 'N-2', 'OLD'].map((l, i) => (
                            <button key={l} onClick={() => setVerRank(i)} className={`flex-1 py-1 text-[8px] font-bold rounded border ${verRank === i ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-600 border-zinc-800'}`}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* The Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90 transform">
                            <circle cx="64" cy="64" r="56" stroke="#18181b" strokeWidth="8" fill="transparent" />
                            <circle 
                                cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={351}
                                strokeDashoffset={351 - (351 * score) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-500 ${score > 80 ? 'text-emerald-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{score}</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">SCORE</span>
                        </div>
                    </div>
                    {/* Weights Log */}
                    <div className="mt-4 text-[9px] font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded border border-zinc-800/50">
                        Formula: (Uptime × {weights.u}) + (Storage × {weights.s})...
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SIMULATION 2: ARCHETYPE CARDS ---
function ArchetypeSimulator() {
    const [type, setType] = useState<'ACTIVE' | 'ZOMBIE' | 'TRAUMA' | 'ELITE'>('ACTIVE');

    const config = {
        ACTIVE: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: CheckCircle, label: 'OPERATIONAL' },
        ZOMBIE: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: ThermometerSun, label: 'ZOMBIE STATE' },
        TRAUMA: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: Zap, label: 'TRAUMA STATE' },
        ELITE: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Crown, label: 'ELITE STATUS' }
    }[type];

    const Icon = config.icon;

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl h-full min-h-[240px] relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Search size={14} className="text-zinc-500" /> Forensics
                </div>
                <div className="flex gap-1">
                    {['ACTIVE', 'ZOMBIE', 'TRAUMA', 'ELITE'].map(t => (
                        <button 
                            key={t} onClick={() => setType(t as any)}
                            className={`w-2 h-2 rounded-full transition-all ${type === t ? 'bg-white scale-125' : 'bg-zinc-800 hover:bg-zinc-600'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 z-10">
                <button onClick={() => setType('ACTIVE')} className={`p-2 rounded border text-[9px] font-bold uppercase transition ${type==='ACTIVE'?'bg-cyan-900/20 border-cyan-500/50 text-cyan-400':'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}>Healthy</button>
                <button onClick={() => setType('ZOMBIE')} className={`p-2 rounded border text-[9px] font-bold uppercase transition ${type==='ZOMBIE'?'bg-amber-900/20 border-amber-500/50 text-amber-400':'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}>Zombie</button>
                <button onClick={() => setType('TRAUMA')} className={`p-2 rounded border text-[9px] font-bold uppercase transition ${type==='TRAUMA'?'bg-violet-900/20 border-violet-500/50 text-violet-400':'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}>Trauma</button>
                <button onClick={() => setType('ELITE')} className={`p-2 rounded border text-[9px] font-bold uppercase transition ${type==='ELITE'?'bg-emerald-900/20 border-emerald-500/50 text-emerald-400':'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}>Elite</button>
            </div>

            <div className={`mt-auto p-4 rounded-xl border ${config.bg} ${config.border} flex items-center gap-4 transition-all duration-300 relative z-10`}>
                <div className="p-2 rounded-full bg-black/20">
                    <Icon size={20} className={config.color} />
                </div>
                <div>
                    <div className={`text-sm font-black ${config.color} tracking-tight`}>{config.label}</div>
                    <div className="text-[10px] text-zinc-400 opacity-80 leading-tight mt-0.5">
                        {type === 'ZOMBIE' && "Uptime frozen but clock active. Yield voided."}
                        {type === 'TRAUMA' && "Rapid restart cycles (>5 in 24h). Penalty applied."}
                        {type === 'ELITE' && "Perfect uptime & version match. Max rewards."}
                        {type === 'ACTIVE' && "System nominal. Standard yield rate."}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Slider
function SimulatorSlider({ label, val, setVal, max, unit, color, disabled }: any) {
    return (
        <div className={`transition-all duration-300 ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between items-end mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${disabled ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</span>
                <span className={`text-[10px] font-mono font-bold ${color}`}>{val}{unit}</span>
            </div>
            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-800">
                <div className={`absolute top-0 left-0 h-full ${disabled ? 'bg-zinc-700' : 'bg-white'} transition-all`} style={{ width: `${Math.min(100, (val/max)*100)}%` }}></div>
                <input type="range" min="0" max={max} value={val} onChange={(e) => setVal(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
        </div>
    );
}

export function InspectorChapter() {
    return (
        <ChapterLayout
            chapterNumber="07"
            title="Inspector Engine"
            subtitle="Forensic diagnostics and multi-variate vitality scoring."
            textData={[]} // Custom Grid Render
            codeSnippet={VITALITY_CODE}
            githubPath="src/logic/xandeum-math.ts"
        >
            <div className="flex flex-col gap-16 pb-8">

                {/* ===================================================
                    ROW 1: SCORING & FAILOVER
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="prose prose-invert">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <ShieldCheck size={20} className="text-emerald-400" />
                            The Vitality Matrix
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                            The Inspector isn't just a passive viewer; it's a diagnostic engine. It utilizes a multi-variate <strong>Vitality Matrix</strong> to score node health. Instead of linear averages, it employs an <strong>Elastic Scoring</strong> model for storage (giving smaller nodes a fair shot via logarithmic curves) and a <strong>Sigmoid Curve</strong> for uptime (punishing recent downtime heavily).
                        </p>
                        <p className="text-zinc-400 leading-relaxed mt-4 text-sm md:text-base">
                            Crucially, the scoring engine is network-aware. If the Reputation API goes offline, the system detects the outage and triggers a <strong>Dynamic Reweighting Protocol</strong>. It instantly voids the "Reputation" metric to prevent stale data corruption, redistributing weight to hardware constants like Storage and Uptime.
                        </p>
                    </div>
                    
                    {/* SIMULATOR 1 */}
                    <VitalitySimulator />
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* ===================================================
                    ROW 2: FORENSIC ARCHETYPES
                   =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="prose prose-invert order-2 lg:order-1">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                            <Activity size={20} className="text-amber-400" />
                            Forensic Archetypes
                        </h3>
                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                            Beyond raw scores, the engine performs forensic analysis to classify nodes into behavioral <strong>Archetypes</strong>. It scans the timeline for specific vectors: "Zombies" (stagnant uptime), "Trauma" (rapid restart cycles), or "Incubation" (healthy new nodes). This classification allows operators to diagnose <em>why</em> a node is underperforming—whether it's hardware instability, software drift, or simple economic stagnation.
                        </p>
                    </div>

                    {/* SIMULATOR 2 */}
                    <div className="order-1 lg:order-2">
                        <ArchetypeSimulator />
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}
