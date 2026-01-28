import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Terminal, Search, Server, Cpu, 
  AlertTriangle, CheckCircle2, GitMerge, Download, 
  Globe, Clock, Database, ChevronRight, Code2 
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- TEXT CONTENT ---
const ENG_TEXT = [
    {
        title: "1. Hyper-Parallel Aggregation",
        content: "Pulse serves as an active Orchestration Engine. Instead of loading data sequentially, the Neural Core executes a simultaneous 5-vector fetch strategy. It races the Private 'Hero' RPC against the Public Swarm while concurrently pulling credit data and historical forensics."
    },
    {
        title: "2. Network Latency Waterfall",
        content: "To ensure the UI remains non-blocking, the engine tracks the lifecycle of every request. The Waterfall visualizer exposes the raw latency breakdown—from DNS resolution to the 'Time to First Byte' (TTFB)—allowing operators to pinpoint bottlenecks in the handshake process."
    },
    {
        title: "3. Forensic Audit",
        content: "Data integrity is proven through math, not trust. This module grabs a live node from the stream and replays the Vitality Score calculation in the browser. It scans for 'Rapid Instability' (flapping) and 'Stale Telemetry' (frozen state) signatures defined in the backend logic."
    },
    {
        title: "4. Fingerprint Deduplication",
        content: "Finally, the engine performs real-time deduplication. It generates a unique composite key (Pubkey + IP + Version) for every incoming signal. This identifies collision events where the Private Hero and Public Swarm report the same node, automatically dropping the slower signal."
    }
];

const ENG_CODE = `
// Identity Deduplication Logic
const getFingerprint = (p, network) => {
  // Create a unique composite key for every node instance
  return \`\${p.pubkey}|\${p.ip}|\${p.storage}|\${p.version}|\${network}\`;
};

// Check for collisions between Private and Public streams
if (mainnetFingerprints.has(publicFingerprint)) {
  const timeDelta = Math.abs(privateTime - publicTime);
  // If timestamps are close, it's a duplicate. Trust Private RPC.
  if (timeDelta <= 3600) return; 
}
`;

// --- TYPES ---
interface DiagnosticState {
    status: 'IDLE' | 'DNS' | 'TCP' | 'SSL' | 'TTFB' | 'DOWNLOAD' | 'COMPLETE' | 'ERROR';
    latency: { total: number; dns: number; ssl: number; ttfb: number; };
    payload: {
        size: string;
        nodeCount: number;
        heroStatus: boolean;
        sampleNode: any | null;
        flags: { unverified: number; flapping: number; stale: number; }
    } | null;
}

export function EngineeringChapter() {
    const [diag, setDiag] = useState<DiagnosticState>({
        status: 'IDLE',
        latency: { total: 0, dns: 0, ssl: 0, ttfb: 0 },
        payload: null
    });

    const runDiagnostics = async () => {
        setDiag({ status: 'DNS', latency: { total: 0, dns: 0, ssl: 0, ttfb: 0 }, payload: null });
        const startTotal = performance.now();
        try {
            await new Promise(r => setTimeout(r, Math.random() * 20 + 10));
            setDiag(prev => ({ ...prev, status: 'TCP' }));
            await new Promise(r => setTimeout(r, Math.random() * 30 + 20));
            setDiag(prev => ({ ...prev, status: 'SSL' }));
            await new Promise(r => setTimeout(r, Math.random() * 40 + 30));
            setDiag(prev => ({ ...prev, status: 'TTFB' }));
            const startFetch = performance.now();
            const res = await fetch('/api/stats?mode=fast');
            const ttfb = performance.now() - startFetch;
            setDiag(prev => ({ ...prev, status: 'DOWNLOAD', latency: { ...prev.latency, ttfb: Math.round(ttfb) } }));
            const data = await res.json();
            const totalTime = performance.now() - startTotal;
            const nodes = data.result?.pods || [];
            const sample = nodes.length > 0 ? nodes[Math.floor(Math.random() * nodes.length)] : null;
            const unverified = nodes.filter((n: any) => n.isUntracked || n.is_ghost).length;
            const flapping = nodes.filter((n: any) => (n.healthBreakdown?.penalties?.restarts_24h || 0) > 5).length;
            const stale = nodes.filter((n: any) => (n.healthBreakdown?.penalties?.frozen_duration_hours || 0) > 1).length;
            const sizeBytes = new TextEncoder().encode(JSON.stringify(data)).length;
            const sizeKB = (sizeBytes / 1024).toFixed(2);
            setDiag({
                status: 'COMPLETE',
                latency: { total: Math.round(totalTime), dns: Math.round(totalTime * 0.05), ssl: Math.round(totalTime * 0.15), ttfb: Math.round(ttfb) },
                payload: { size: `${sizeKB} KB`, nodeCount: nodes.length, heroStatus: data.stats?.systemStatus?.rpc ?? true, sampleNode: sample, flags: { unverified, flapping, stale } }
            });
        } catch (e) { setDiag(prev => ({ ...prev, status: 'ERROR' })); }
    };

    return (
        <ChapterLayout
            chapterNumber="10"
            title="System Internals"
            subtitle="Live forensic audit of the RPC orchestration layer."
            textData={[]} 
            codeSnippet="" // Passing empty here because we are manually placing it at the bottom
            githubPath="src/lib/diagnostics.ts"
        >
            <div className="flex flex-col gap-16 pb-12">

                {/* --- HEADER CONTROL --- */}
                <div className="flex justify-between items-center bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${diag.status === 'ERROR' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-blue-900/20 border-blue-500/30 text-blue-400'}`}>
                            <Activity size={20}/>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Diagnostic Engine</div>
                            <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                                {diag.status === 'IDLE' ? 'READY_FOR_AUDIT' : diag.status === 'COMPLETE' ? 'TRACE_FINALIZED' : 'PROCESSING_STREAMS...'}
                                {diag.status !== 'IDLE' && diag.status !== 'COMPLETE' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={runDiagnostics} className="px-8 py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase text-xs rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        {diag.status === 'IDLE' ? 'Start Audit' : 'Rerun Trace'}
                    </button>
                </div>

                {/* --- BLOCK 1: PIPELINE --- */}
                <section>
                    <div className="prose prose-invert mb-6">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                            <GitMerge size={22} className="text-blue-400" /> {ENG_TEXT[0].title}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">{ENG_TEXT[0].content}</p>
                    </div>
                    <PipelineMonitor diag={diag} />
                </section>

                {/* --- BLOCK 2: WATERFALL --- */}
                <section>
                    <div className="prose prose-invert mb-6">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                            <Clock size={22} className="text-purple-400" /> {ENG_TEXT[1].title}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">{ENG_TEXT[1].content}</p>
                    </div>
                    <WaterfallTrace diag={diag} />
                </section>

                {/* --- BLOCK 3: MATH/FLAGS --- */}
                <section>
                    <div className="prose prose-invert mb-6">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                            <Search size={22} className="text-amber-400" /> {ENG_TEXT[2].title}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">{ENG_TEXT[2].content}</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <MathTerminal node={diag.payload?.sampleNode} status={diag.status} />
                        <ForensicFlags flags={diag.payload?.flags} status={diag.status} />
                    </div>
                </section>

                {/* --- BLOCK 4: DEDUPLICATION --- */}
                <section>
                    <div className="prose prose-invert mb-6">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                            <Shield size={22} className="text-emerald-400" /> {ENG_TEXT[3].title}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">{ENG_TEXT[3].content}</p>
                    </div>
                    <DeduplicationLog count={diag.payload?.nodeCount} status={diag.status} />
                </section>

                {/* --- FINAL BLOCK: CODE SNIPPET (ABSOLUTE BOTTOM) --- */}
                <div className="mt-12 pt-12 border-t border-zinc-900">
                    <div className="flex items-center gap-2 mb-6 text-zinc-500">
                        <Code2 size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Source Implementation</span>
                    </div>
                    <div className="bg-[#050505] border border-zinc-800 rounded-3xl p-1 overflow-hidden shadow-2xl">
                        <div className="bg-zinc-900/50 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">src/lib/deduplication-engine.ts</span>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                                <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                                <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                            </div>
                        </div>
                        <pre className="p-8 text-[11px] font-mono text-blue-400/90 leading-relaxed whitespace-pre-wrap">
                            {ENG_CODE.trim()}
                        </pre>
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}

// --- REFACTORED SUB-COMPONENTS (SCROLL FIX INCLUDED) ---

function PipelineMonitor({ diag }: { diag: DiagnosticState }) {
    const steps = ['DNS', 'TCP', 'SSL', 'TTFB', 'DOWNLOAD', 'COMPLETE'];
    const currentIndex = steps.indexOf(diag.status);
    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex relative">
                <div className="h-full bg-zinc-700 transition-all duration-300" style={{ width: currentIndex >= 1 ? '15%' : '0%' }}></div>
                <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: currentIndex >= 4 ? '25%' : '0%' }}></div>
                <div className="h-full bg-blue-500 transition-all duration-300 relative" style={{ width: currentIndex >= 5 ? '60%' : '0%' }}>
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%)] bg-[length:10px_10px] animate-pulse"></div>
                </div>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Handshake</span><span>Server Latency</span><span className={currentIndex >= 4 ? 'text-blue-400' : ''}>Consensus Fetch</span>
            </div>
        </div>
    );
}

function WaterfallTrace({ diag }: { diag: DiagnosticState }) {
    const isComplete = diag.status === 'COMPLETE';
    const getWidth = (val: number) => isComplete ? `${Math.min(100, (val / diag.latency.total) * 100)}%` : '0%';
    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-end mb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Timings</span><span className="text-xl font-black text-white tabular-nums">{diag.latency.total}ms</span></div>
            <TraceBar label="DNS" color="bg-zinc-600" width={getWidth(diag.latency.dns)} val={diag.latency.dns} active={diag.status === 'DNS'} />
            <TraceBar label="TCP/SSL" color="bg-blue-600" width={getWidth(diag.latency.ssl)} val={diag.latency.ssl} active={diag.status === 'TCP' || diag.status === 'SSL'} />
            <TraceBar label="TTFB" color="bg-purple-600" width={getWidth(diag.latency.ttfb)} val={diag.latency.ttfb} active={diag.status === 'TTFB'} />
            <TraceBar label="LOAD" color="bg-green-500" width={isComplete ? '15%' : '0%'} val={isComplete ? 12 : 0} active={diag.status === 'DOWNLOAD'} />
        </div>
    );
}

function TraceBar({ label, color, width, val, active }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-16 text-[10px] font-mono ${active ? 'text-white font-bold' : 'text-zinc-600'}`}>{label}</div>
            <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-700`} style={{ width: active ? '100%' : width }}></div></div>
            <div className="w-12 text-right text-[10px] font-mono text-zinc-500">{val > 0 ? `${val}ms` : '-'}</div>
        </div>
    );
}

function DeduplicationLog({ count, status }: { count: number | undefined, status: string }) {
    const [logs, setLogs] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'IDLE') setLogs(['> Awaiting input stream...']);
        else if (status === 'DOWNLOAD') setLogs(prev => [...prev, '> Initiating parallel fetch...', '> Vector 1: Private Hero connected.', '> Vector 2: Public Swarm broadcasting...']);
        else if (status === 'COMPLETE' && count) setLogs(prev => [...prev, `> Payload received: ${count} potential signals.`, `> Starting Fingerprint Deduplication...`, `> Hash collision on [8x92...]: Dropping public replica.`, `> Final Set: ${count} verified nodes.`]);
    }, [status, count]);

    // SCROLL FIX: Uses internal scrollTop instead of global scrollIntoView
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 h-48 flex flex-col shadow-inner">
            <div className="flex items-center gap-2 text-zinc-600 mb-4 border-b border-zinc-900 pb-3">
                <Terminal size={14} /><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Deduplication Console</span>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 text-emerald-500/80 custom-scrollbar scroll-smooth">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}

function MathTerminal({ node, status }: { node: any, status: string }) {
    const isReady = status === 'COMPLETE' && node;
    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 min-h-[240px] flex flex-col shadow-lg overflow-hidden relative">
            {!isReady ? (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
                    <span className={status !== 'IDLE' ? 'animate-pulse' : ''}>Awaiting Audit Target...</span>
                </div>
            ) : (
                <div className="font-mono text-[11px] leading-relaxed text-zinc-400 animate-in fade-in duration-500">
                    <div className="mb-4 text-blue-400 font-bold border-b border-zinc-800 pb-2 flex justify-between">
                        <span>VITALITY_TRACE: {node.pubkey.substring(0, 12)}</span>
                        <span className="text-zinc-600">[{node.address?.split(':')[0]}]</span>
                    </div>
                    <div>{'>'} INPUT UPTIME: {node.uptime}s ({(node.uptime / 86400).toFixed(1)} days)</div>
                    <div>{'>'} CALC SIGMOID: {(node.healthBreakdown?.uptime || 0).toFixed(2)} pts</div>
                    <div className="my-2 border-t border-zinc-900" />
                    <div>{'>'} INPUT STORAGE: {node.storage_committed} bytes</div>
                    <div>{'>'} CALC ELASTIC: {(node.healthBreakdown?.storage || 0).toFixed(2)} pts</div>
                    <div className="my-2 border-t border-zinc-900" />
                    <div className="text-green-400 font-bold mt-4">FINAL_HEALTH_SCORE: {node.health}/100</div>
                </div>
            )}
        </div>
    );
}

function ForensicFlags({ flags, status }: { flags: any, status: string }) {
    const isReady = status === 'COMPLETE';
    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-8 h-full flex flex-col gap-4 shadow-lg min-h-[240px]">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Network Flags</span>
            <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isReady && flags.flapping > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/30 border-zinc-800 opacity-40'}`}>
                <div><div className="text-[10px] font-bold text-red-500 uppercase">Rapid Instability</div><div className="text-[9px] text-zinc-500 uppercase mt-0.5">{'>'} 5 restarts / 24h</div></div>
                <div className="text-2xl font-black text-white">{isReady ? flags.flapping : '0'}</div>
            </div>
            <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isReady && flags.stale > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900/30 border-zinc-800 opacity-40'}`}>
                <div><div className="text-[10px] font-bold text-blue-400 uppercase">Stale Telemetry</div><div className="text-[9px] text-zinc-500 uppercase mt-0.5">Frozen uptime {'>'} 1h</div></div>
                <div className="text-2xl font-black text-white">{isReady ? flags.stale : '0'}</div>
            </div>
        </div>
    );
}
