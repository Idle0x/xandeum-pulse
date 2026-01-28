import { useState, useEffect } from 'react';
import { 
  History, 
  Fingerprint, 
  Activity, 
  Search, 
  AlertTriangle, 
  Database, 
  GitCommit,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- CODE SNIPPET FROM YOUR useNodeVitality.ts ---
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
    // --- SIMULATION 1: STABLE ID ANCHOR ---
    const [nodeState, setNodeState] = useState({ ip: '192.168.1.1', ver: 'v1.0.4' });
    const [stableIdColor, setStableIdColor] = useState('text-emerald-500');

    // Randomize Node Attributes
    useEffect(() => {
        const ips = ['10.0.0.5', '172.16.0.1', '192.168.1.1', '8.8.4.4'];
        const vers = ['v1.0.4', 'v1.0.5', 'v1.1.0-beta', 'v1.1.2'];
        
        const interval = setInterval(() => {
            setNodeState({
                ip: ips[Math.floor(Math.random() * ips.length)],
                ver: vers[Math.floor(Math.random() * vers.length)]
            });
            // Flash the lock to show it held active
            setStableIdColor('text-white');
            setTimeout(() => setStableIdColor('text-emerald-500'), 300);
        }, 2000);
        return () => clearInterval(interval);
    }, []);


    // --- SIMULATION 2: FORENSIC SCRUBBER ---
    const [scanIndex, setScanIndex] = useState(0);
    
    // The Timeline Data (Mocking your history array)
    const snapshots = [
        { id: 1, type: 'OK', uptime: 100, label: '09:00' },
        { id: 2, type: 'OK', uptime: 200, label: '09:15' },
        { id: 3, type: 'ZOMBIE', uptime: 205, label: '09:30' }, // Uptime barely moved
        { id: 4, type: 'ZOMBIE', uptime: 210, label: '09:45' }, // Still stuck
        { id: 5, type: 'RESTART', uptime: 10, label: '10:00' }, // Reset
        { id: 6, type: 'OK', uptime: 110, label: '10:15' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setScanIndex(prev => (prev + 1) % snapshots.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const currentSnap = snapshots[scanIndex];
    const prevSnap = snapshots[scanIndex - 1] || { uptime: 0 };
    const uptimeDelta = currentSnap.uptime - prevSnap.uptime;

    return (
        <ChapterLayout
            chapterNumber="06"
            title="Temporal Engine"
            subtitle="Forensic continuity and heuristic vitality analysis."
            textData={[]} // Custom render below
            codeSnippet={FORENSIC_CODE}
            githubPath="lib/vitality-forensics.ts"
        >
            <div className="flex flex-col gap-12 pb-12">

                {/* --- SECTION 1: STABLE ID --- */}
                <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Fingerprint size={20} className="text-blue-400" />
                        The Stable ID Protocol
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        Identity in a decentralized network is fluid. IPs change, versions upgrade, and hardware migrates. The Temporal Engine solves the "Ship of Theseus" problem using a composite <strong>Stable ID Protocol</strong>. It anchors a node's reputation to a cryptographic hash of its public key and network context, ensuring that its historical performance ledger survives physical relocation or software updates.
                    </p>
                </div>

                {/* --- SIMULATION 1: IDENTITY ANCHOR --- */}
                <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                    
                    {/* LEFT: THE CHAOS (Fluctuating Node) */}
                    <div className="flex flex-col gap-2 w-full md:w-1/3 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest text-center md:text-left">Physical Hardware</span>
                        <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-xl flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-xs text-zinc-400">IP Address</span>
                                <span className="font-mono text-xs text-orange-400 animate-pulse">{nodeState.ip}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-400">Version</span>
                                <span className="font-mono text-xs text-blue-400 animate-pulse">{nodeState.ver}</span>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE: THE CONNECTION */}
                    <div className="flex items-center justify-center text-zinc-600">
                         <div className="h-px w-8 md:w-16 bg-zinc-700"></div>
                         <div className="p-2 rounded-full bg-zinc-800 border border-zinc-700">
                            <RefreshCw size={16} className="animate-spin duration-[3000ms]" />
                         </div>
                         <div className="h-px w-8 md:w-16 bg-zinc-700"></div>
                    </div>

                    {/* RIGHT: THE ANCHOR (Stable ID) */}
                    <div className="flex flex-col gap-2 w-full md:w-1/3 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest text-center md:text-right">Ledger Identity</span>
                        <div className="bg-black border border-emerald-500/30 p-4 rounded-xl flex flex-col gap-1 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Identity Verified</span>
                            </div>
                            <div className="font-mono text-sm font-bold text-zinc-200">
                                8x92...AF2
                            </div>
                            <div className={`text-[10px] transition-colors duration-300 ${stableIdColor}`}>
                                ● Persisting History
                            </div>
                        </div>
                    </div>

                    {/* Background Graphic */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                         <Database size={200} className="absolute -right-10 -bottom-10" />
                    </div>
                </div>

                {/* --- SECTION 2: FORENSICS --- */}
                <div className="prose prose-invert max-w-none mt-4">
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Search size={20} className="text-orange-400" />
                        Heuristic Vitality Analysis
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        We don't just record time; we analyze it. The engine performs deep-scan forensics on the node's timeline to distinguish between a healthy "Warmup" (fresh boot) and a "Zombie State" (frozen process). It automatically flags anomalies like <strong>Ghosting</strong> (missing snapshots) or <strong>Volatility</strong> (rapid restart cycles) by comparing real-time clock drift against reported uptime counters.
                    </p>
                </div>

                {/* --- SIMULATION 2: FORENSIC SCRUBBER --- */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Forensic Scanner</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                            SCANNING_WINDOW: 1 HR
                        </div>
                    </div>

                    {/* Timeline Vis */}
                    <div className="relative h-24 flex items-end gap-1 md:gap-2">
                        {snapshots.map((snap, i) => {
                            const isCurrent = i === scanIndex;
                            const isPast = i < scanIndex;
                            // Visualizing Uptime Height
                            const height = Math.min(100, snap.uptime / 2.5); 
                            
                            let barColor = 'bg-zinc-800';
                            if (isCurrent) {
                                if (snap.type === 'OK') barColor = 'bg-blue-500 shadow-[0_0_15px_#3b82f6]';
                                if (snap.type === 'ZOMBIE') barColor = 'bg-yellow-500 shadow-[0_0_15px_#eab308]';
                                if (snap.type === 'RESTART') barColor = 'bg-red-500 shadow-[0_0_15px_#ef4444]';
                            } else if (isPast) {
                                barColor = 'bg-zinc-700';
                            }

                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end h-full gap-2 group relative">
                                    {/* Tooltip Label */}
                                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-500 transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0'}`}>
                                        {snap.label}
                                    </div>
                                    {/* The Bar */}
                                    <div 
                                        className={`w-full rounded-t-sm transition-all duration-300 ${barColor}`}
                                        style={{ height: `${Math.max(10, height)}%` }}
                                    ></div>
                                </div>
                            );
                        })}
                        
                        {/* The Moving Scanner Line */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] transition-all duration-500 ease-in-out z-20"
                            style={{ left: `${(scanIndex / (snapshots.length - 1)) * 100}%` }}
                        ></div>
                    </div>

                    {/* The Terminal Output */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 font-mono text-xs border border-zinc-800/50 min-h-[80px] flex items-center">
                        {currentSnap.type === 'OK' && (
                            <div className="text-zinc-400">
                                <span className="text-blue-500 font-bold mr-2">✓ NOMINAL:</span>
                                Uptime incrementing normally. (Delta: +{uptimeDelta}s)
                            </div>
                        )}
                        {currentSnap.type === 'ZOMBIE' && (
                            <div className="text-zinc-300">
                                <span className="text-yellow-500 font-bold mr-2">⚠ STAGNANT DETECTED:</span>
                                <span className="opacity-80">Clock advanced 15m but uptime delta is {uptimeDelta}s.</span>
                                <div className="text-[10px] text-yellow-500/70 mt-1">{`>> Flagging as ZOMBIE process.`}</div>
                            </div>
                        )}
                        {currentSnap.type === 'RESTART' && (
                            <div className="text-zinc-300">
                                <span className="text-red-500 font-bold mr-2">⚠ RESTART DETECTED:</span>
                                <span className="opacity-80">Current uptime ({currentSnap.uptime}s) {'<'} Previous ({prevSnap.uptime}s).</span>
                                <div className="text-[10px] text-red-500/70 mt-1">{`>> Incrementing Volatility Counter.`}</div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}
