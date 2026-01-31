import { useState, useEffect } from 'react';
import { 
  Fingerprint, Activity, Search, ShieldCheck, 
  RefreshCw, Clock, ArrowRight, Terminal 
} from 'lucide-react';

// --- CODE SNIPPET ---
const FORENSIC_CODE = `
// FORENSIC LOGIC: Detecting "Zombie" Processes
// We compare real-time clock drift vs. reported uptime.
const analyzeVitality = (current, history) => {
  const timePassed = Date.now() - history.timestamp;
  const uptimeGained = current.uptime - history.uptime;

  // PATTERN 1: THE ZOMBIE
  // If 1 hour passed in reality, but uptime grew < 1 minute
  // The process is technically "online" but frozen internally.
  if (timePassed > ONE_HOUR && uptimeGained < ONE_MINUTE) {
     return { 
       status: 'STAGNANT', 
       reason: 'Process hung: Uptime counter frozen',
       confidence: 95 
     };
  }

  // PATTERN 2: VOLATILITY
  // If current uptime is less than previous, a reboot occurred.
  if (current.uptime < history.uptime) {
    return { status: 'UNSTABLE', reason: 'High volatility detected' };
  }
};
`;

export function TemporalChapter() {
    return (
        <section className="max-w-6xl mx-auto px-6 py-24 space-y-32">

            {/* --- GLOBAL HEADER --- */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                        Chapter 06
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Temporal Engine</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                    Forensic continuity and heuristic vitality analysis. This engine anchors identity to cryptographic proofs rather than ephemeral IP addresses, ensuring that a node's reputation survives physical migration.
                </p>
            </div>

            {/* ===================================================
                SECTION 1: STABLE ID (Sim Left, Text Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Simulation */}
                <div className="order-2 lg:order-1">
                    <StableIdSimulator />
                </div>

                {/* RIGHT: Text */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Fingerprint size={24} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">The Stable ID Protocol</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Identity in a decentralized network is fluid. IPs change, versions upgrade, and hardware migrates.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            The Temporal Engine solves the "Ship of Theseus" problem using a composite <strong>Stable ID Protocol</strong>. It anchors a node's reputation to a cryptographic hash of its public key, ensuring that its historical performance ledger survives physical relocation.
                        </p>
                    </div>

                    {/* Visual Tags */}
                    <div className="flex gap-2 items-center">
                         <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                            PubKey_Hash
                         </div>
                         <ArrowRight size={14} className="text-zinc-600"/>
                         <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                            Immutable_Ledger
                         </div>
                    </div>
                </div>

            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            {/* ===================================================
                SECTION 2: FORENSICS (Text Left, Sim Right)
               =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* LEFT: Text */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <Search size={24} className="text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Heuristic Forensics</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            We don't just record time; we analyze it. The engine performs deep-scan forensics on the node's timeline to distinguish between healthy reboots and dangerous states.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-sm mt-4">
                            It automatically flags anomalies like <strong>Zombie Processes</strong> (where the uptime counter freezes despite the clock moving) or <strong>Volatility Loops</strong> (rapid restart cycles) by comparing real-time clock drift against reported metrics.
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-zinc-500 border-t border-zinc-900 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-sm shadow-[0_0_10px_#3b82f6]"></div> Nominal
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-sm"></div> Stagnant
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-sm"></div> Restart
                        </div>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <ForensicSimulator />

            </div>

            {/* ===================================================
                SECTION 3: SOURCE CODE (Bottom)
               =================================================== */}
            <div className="border-t border-zinc-900 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Terminal size={20} className="text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Underlying Logic</h3>
                </div>
                
                <div className="bg-[#0D1117] border border-zinc-800 rounded-2xl p-6 overflow-x-auto custom-scrollbar shadow-2xl relative group">
                     <div className="absolute top-4 right-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded bg-[#0D1117]">
                           lib/vitality-forensics.ts
                     </div>
                    <pre className="font-mono text-xs md:text-sm leading-relaxed">
                        <code className="text-orange-300/90">{FORENSIC_CODE.trim()}</code>
                    </pre>
                </div>
            </div>

        </section>
    );
}


// --- SIMULATION 1: STABLE ID ---
function StableIdSimulator() {
    const [nodeState, setNodeState] = useState({ ip: '192.168.1.1', ver: 'v1.0.4' });
    const [stableIdColor, setStableIdColor] = useState('text-emerald-500');

    useEffect(() => {
        const ips = ['10.0.0.5', '172.16.0.1', '192.168.1.1', '8.8.4.4'];
        const vers = ['v1.0.4', 'v1.0.5', 'v1.1.0-beta', 'v1.1.2'];

        const interval = setInterval(() => {
            setNodeState({
                ip: ips[Math.floor(Math.random() * ips.length)],
                ver: vers[Math.floor(Math.random() * vers.length)]
            });
            setStableIdColor('text-white scale-110');
            setTimeout(() => setStableIdColor('text-emerald-500 scale-100'), 300);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col items-center justify-between gap-8 min-h-[260px] group">

            {/* CHAOS BLOCK */}
            <div className="w-full relative z-10">
                <div className="flex justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Physical Hardware (Mutable)</span>
                    <RefreshCw size={10} className="text-zinc-600 animate-spin" />
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4 backdrop-blur-sm">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-zinc-600 font-bold mb-1">IP Address</span>
                        <span className="font-mono text-xs text-orange-400">{nodeState.ip}</span>
                    </div>
                    <div className="h-8 w-px bg-zinc-800"></div>
                    <div className="flex flex-col text-right">
                        <span className="text-[9px] uppercase text-zinc-600 font-bold mb-1">Version</span>
                        <span className="font-mono text-xs text-blue-400">{nodeState.ver}</span>
                    </div>
                </div>
            </div>

            {/* CONNECTOR ARROW */}
            <div className="relative z-10">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-gradient-to-b from-zinc-800 to-emerald-900/50"></div>
                 <div className="p-1.5 rounded-full bg-zinc-900 border border-zinc-700 relative z-20">
                    <ArrowRight size={14} className="text-zinc-500 rotate-90" />
                 </div>
            </div>

            {/* ANCHOR BLOCK */}
            <div className="w-full relative z-10">
                <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest block mb-2 text-right">Ledger Identity (Immutable)</span>
                <div className="bg-black border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Verified</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="font-mono text-sm font-bold text-zinc-200">
                            8x92...AF2
                        </div>
                        <div className={`text-[9px] font-mono transition-all duration-300 ${stableIdColor}`}>
                            ● Persisting
                        </div>
                    </div>
                </div>
            </div>

             {/* Background Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        </div>
    );
}

// --- SIMULATION 2: FORENSIC SCRUBBER ---
function ForensicSimulator() {
    const [scanIndex, setScanIndex] = useState(0);
    const [scannedSnap, setScannedSnap] = useState<any>(null);

    const snapshots = [
        { id: 1, type: 'OK', uptime: 100, label: '09:00' },
        { id: 2, type: 'OK', uptime: 200, label: '09:15' },
        { id: 3, type: 'ZOMBIE', uptime: 205, label: '09:30' }, 
        { id: 4, type: 'ZOMBIE', uptime: 210, label: '09:45' }, 
        { id: 5, type: 'RESTART', uptime: 10, label: '10:00' }, 
        { id: 6, type: 'OK', uptime: 110, label: '10:15' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setScanIndex(prev => (prev + 1) % snapshots.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setScannedSnap(snapshots[scanIndex]);
    }, [scanIndex]);

    const currentSnap = snapshots[scanIndex];
    const prevSnap = snapshots[scanIndex - 1] || { uptime: 0 };
    const uptimeDelta = currentSnap.uptime - prevSnap.uptime;

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden h-[340px]">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-zinc-800 pb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Live Forensics</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    <Clock size={10} /> 1H_WINDOW
                </div>
            </div>

            {/* Timeline Vis */}
            <div className="relative flex-1 flex items-end gap-2 z-10 pb-4 px-2">
                {snapshots.map((snap, i) => {
                    const isCurrent = i === scanIndex;
                    const isPast = i < scanIndex;
                    const height = Math.min(100, snap.uptime / 2.5); 

                    let barColor = 'bg-zinc-800';
                    let glow = '';

                    if (isCurrent) {
                        if (snap.type === 'OK') { barColor = 'bg-blue-500'; glow = 'shadow-[0_0_15px_#3b82f6]'; }
                        if (snap.type === 'ZOMBIE') { barColor = 'bg-yellow-500'; glow = 'shadow-[0_0_15px_#eab308]'; }
                        if (snap.type === 'RESTART') { barColor = 'bg-red-500'; glow = 'shadow-[0_0_15px_#ef4444]'; }
                    } else if (isPast) {
                        barColor = 'bg-zinc-700/50';
                    }

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full gap-2 group relative">
                            {/* The Bar */}
                            <div 
                                className={`w-full rounded-sm transition-all duration-500 ${barColor} ${glow}`}
                                style={{ height: `${Math.max(10, height)}%` }}
                            ></div>
                            {/* Axis Label */}
                             <div className={`text-[8px] font-mono text-center transition-colors ${isCurrent ? 'text-white font-bold' : 'text-zinc-600'}`}>
                                {snap.label}
                             </div>
                        </div>
                    );
                })}

                {/* Scanner Line Overlay */}
                <div 
                    className="absolute top-0 bottom-6 w-[2px] bg-white/50 blur-[1px] transition-all duration-500 ease-in-out z-20"
                    style={{ left: `${(scanIndex / (snapshots.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                ></div>
            </div>

            {/* Terminal Output (Fixed > characters) */}
            <div className="bg-zinc-900/50 rounded-xl p-4 font-mono text-[10px] border border-zinc-800/50 min-h-[80px] flex items-center relative z-10">
                {currentSnap.type === 'OK' && (
                    <div className="text-zinc-400 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between mb-2 pb-2 border-b border-zinc-800/50">
                            <span className="text-blue-500 font-bold">✓ STATUS: NOMINAL</span>
                            <span>Δt: +15m</span>
                        </div>
                        <span className="opacity-60 block">{'>'} Uptime incrementing normally (+{uptimeDelta}s).</span>
                        <span className="opacity-60 block">{'>'} Heartbeat verified.</span>
                    </div>
                )}
                {currentSnap.type === 'ZOMBIE' && (
                    <div className="text-zinc-300 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex justify-between mb-2 pb-2 border-b border-zinc-800/50">
                            <span className="text-yellow-500 font-bold">⚠ STATUS: STAGNANT</span>
                            <span className="text-yellow-500/50">ANOMALY_DETECTED</span>
                        </div>
                        <span className="opacity-80 block">{'>'} Clock advanced 15m.</span>
                        <span className="text-yellow-500 block">{'>'} CRITICAL: Uptime delta only {uptimeDelta}s.</span>
                    </div>
                )}
                {currentSnap.type === 'RESTART' && (
                    <div className="text-zinc-300 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex justify-between mb-2 pb-2 border-b border-zinc-800/50">
                            <span className="text-red-500 font-bold">⚠ STATUS: REBOOT</span>
                            <span className="text-red-500/50">VOLATILITY_SPIKE</span>
                        </div>
                        <span className="opacity-80 block">{'>'} Uptime reset detected (10s).</span>
                        <span className="text-red-400 block">{'>'} Penalty counter incremented.</span>
                    </div>
                )}
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        </div>
    );
}
