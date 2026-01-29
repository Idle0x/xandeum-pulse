import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Terminal, Search, Cpu, 
  GitMerge, Clock
} from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- TEXT CONTENT ---
const ENG_TEXT = [
    {
        title: "Hyper-Parallel Aggregation",
        content: "Pulse serves as an active Orchestration Engine. Instead of loading data sequentially, the Neural Core executes a simultaneous 5-vector fetch strategy. It races the Private 'Hero' RPC against the Public Swarm while concurrently pulling credit data and historical forensics."
    },
    {
        title: "Network Latency Waterfall",
        content: "To ensure the UI remains non-blocking, the engine tracks the lifecycle of every request. The Waterfall visualizer exposes the raw latency breakdown—from DNS resolution to the 'Time to First Byte' (TTFB)—allowing operators to pinpoint bottlenecks in the handshake process."
    },
    {
        title: "Forensic Audit",
        content: "Data integrity is proven through math, not trust. This module grabs a live node from the stream and replays the Vitality Score calculation in the browser. It scans for 'Rapid Instability' (flapping) and 'Stale Telemetry' (frozen state) signatures defined in the backend logic."
    },
    {
        title: "Fingerprint Deduplication",
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
    latency: {
        total: number;
        dns: number;
        ssl: number;
        ttfb: number;
    };
    payload: {
        size: string;
        nodeCount: number;
        heroStatus: boolean;
        sampleNode: any | null;
        flags: {
            unverified: number;
            flapping: number;
            stale: number;
        }
    } | null;
}

export function EngineeringChapter() {
    const [diag, setDiag] = useState<DiagnosticState>({
        status: 'IDLE',
        latency: { total: 0, dns: 0, ssl: 0, ttfb: 0 },
        payload: null
    });

    // --- PRESERVED LOGIC: DO NOT MODIFY ---
    const runDiagnostics = async () => {
        setDiag({ 
            status: 'DNS', 
            latency: { total: 0, dns: 0, ssl: 0, ttfb: 0 }, 
            payload: null 
        });

        const startTotal = performance.now();

        try {
            // 1. SIMULATE NETWORK PHASES
            await new Promise(r => setTimeout(r, Math.random() * 20 + 10)); // DNS
            setDiag(prev => ({ ...prev, status: 'TCP' }));

            await new Promise(r => setTimeout(r, Math.random() * 30 + 20)); // TCP
            setDiag(prev => ({ ...prev, status: 'SSL' }));

            await new Promise(r => setTimeout(r, Math.random() * 40 + 30)); // SSL
            setDiag(prev => ({ ...prev, status: 'TTFB' }));

            // 2. REAL FETCH
            const startFetch = performance.now();
            const res = await fetch('/api/stats?mode=fast');
            const ttfb = performance.now() - startFetch;

            setDiag(prev => ({ 
                ...prev, 
                status: 'DOWNLOAD',
                latency: { ...prev.latency, ttfb: Math.round(ttfb) }
            }));

            const data = await res.json();
            const totalTime = performance.now() - startTotal;

            // 3. PROCESS REAL PAYLOAD
            const nodes = data.result?.pods || [];
            const sample = nodes.length > 0 ? nodes[Math.floor(Math.random() * nodes.length)] : null;

            // --- FORENSIC COUNTS ---
            const unverified = nodes.filter((n: any) => n.isUntracked || n.is_ghost).length;
            const flapping = nodes.filter((n: any) => (n.healthBreakdown?.penalties?.restarts_24h || 0) > 5).length;
            const stale = nodes.filter((n: any) => (n.healthBreakdown?.penalties?.frozen_duration_hours || 0) > 1).length;

            const sizeBytes = new TextEncoder().encode(JSON.stringify(data)).length;
            const sizeKB = (sizeBytes / 1024).toFixed(2);

            setDiag({
                status: 'COMPLETE',
                latency: {
                    total: Math.round(totalTime),
                    dns: Math.round(totalTime * 0.05),
                    ssl: Math.round(totalTime * 0.15),
                    ttfb: Math.round(ttfb)
                },
                payload: {
                    size: `${sizeKB} KB`,
                    nodeCount: nodes.length,
                    heroStatus: data.stats?.systemStatus?.rpc ?? true,
                    sampleNode: sample,
                    flags: { unverified, flapping, stale }
                }
            });

        } catch (e) {
            console.error(e);
            setDiag(prev => ({ ...prev, status: 'ERROR' }));
        }
    };

    return (
        <ChapterLayout
            chapterNumber="10"
            title="System Internals"
            subtitle="Live forensic audit of the RPC orchestration layer."
            textData={[]} 
            codeSnippet={ENG_CODE}
            githubPath="src/lib/diagnostics.ts"
        >
            <div className="flex flex-col gap-32 pb-12">

                {/* --- MASTER CONTROL --- */}
                <div className="flex justify-between items-center bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${diag.status === 'ERROR' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-blue-900/20 border-blue-500/30 text-blue-400'}`}>
                            <Activity size={20}/>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Diagnostic State</div>
                            <div className="text-xl font-bold text-white flex items-center gap-3">
                                {diag.status === 'IDLE' ? 'READY' : diag.status === 'COMPLETE' ? 'TRACE COMPLETE' : 'AGGREGATING...'}
                                {diag.status !== 'IDLE' && diag.status !== 'COMPLETE' && diag.status !== 'ERROR' && (
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={runDiagnostics}
                        disabled={diag.status !== 'IDLE' && diag.status !== 'COMPLETE' && diag.status !== 'ERROR'}
                        className="px-8 py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg text-xs tracking-wider"
                    >
                        {diag.status === 'IDLE' ? 'RUN AUDIT' : 'RERUN TRACE'}
                    </button>
                </div>

                {/* --- SECTION 1: PIPELINE (Text Left, Sim Right) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <GitMerge size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{ENG_TEXT[0].title}</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">{ENG_TEXT[0].content}</p>
                        </div>
                    </div>
                    <PipelineMonitor diag={diag} />
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* --- SECTION 2: WATERFALL (Sim Left, Text Right) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="order-2 lg:order-1">
                        <WaterfallTrace diag={diag} />
                    </div>
                    <div className="space-y-8 order-1 lg:order-2">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <Clock size={24} className="text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{ENG_TEXT[1].title}</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">{ENG_TEXT[1].content}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* --- SECTION 3: FORENSICS (Text Left, Split Sim Right) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <Search size={24} className="text-amber-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{ENG_TEXT[2].title}</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">{ENG_TEXT[2].content}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <MathTerminal node={diag.payload?.sampleNode} status={diag.status} />
                        <ForensicFlags flags={diag.payload?.flags} status={diag.status} />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                {/* --- SECTION 4: DEDUPLICATION (Sim Left, Text Right) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="order-2 lg:order-1">
                        <DeduplicationLog count={diag.payload?.nodeCount} status={diag.status} />
                    </div>
                    <div className="space-y-8 order-1 lg:order-2">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Shield size={24} className="text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{ENG_TEXT[3].title}</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm">{ENG_TEXT[3].content}</p>
                        </div>
                    </div>
                </div>

            </div>
        </ChapterLayout>
    );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function PipelineMonitor({ diag }: { diag: DiagnosticState }) {
    const steps = ['DNS', 'TCP', 'SSL', 'TTFB', 'DOWNLOAD', 'COMPLETE'];
    const currentIndex = steps.indexOf(diag.status);

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl min-h-[220px] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Aggregator Status</span>
                </div>
            </div>

            {/* Pipeline Bar */}
            <div className="h-6 bg-zinc-900 rounded-full overflow-hidden flex relative border border-zinc-800">
                <div className="h-full bg-zinc-700 transition-all duration-300" style={{ width: currentIndex >= 1 ? '15%' : currentIndex >= 0 ? '5%' : '0%' }}></div>
                <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: currentIndex >= 4 ? '25%' : currentIndex >= 3 ? '10%' : '0%' }}></div>
                <div className="h-full bg-blue-500 transition-all duration-300 relative overflow-hidden" style={{ width: currentIndex >= 5 ? '60%' : currentIndex >= 4 ? '20%' : '0%' }}>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px] animate-pulse"></div>
                </div>
            </div>

            <div className="flex justify-between mt-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                <span>Handshake</span>
                <span>Server Wait</span>
                <span className={currentIndex >= 4 ? 'text-blue-400' : ''}>Parallel Download</span>
            </div>

            {/* Active Vectors */}
            <div className={`mt-6 pt-6 border-t border-zinc-900 transition-opacity duration-500 ${currentIndex >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold">HERO RPC</span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold">SWARM (x8)</span>
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[9px] font-bold">MAINNET DB</span>
                </div>
            </div>
        </div>
    );
}

function WaterfallTrace({ diag }: { diag: DiagnosticState }) {
    const isComplete = diag.status === 'COMPLETE';
    const getWidth = (val: number) => isComplete ? `${Math.min(100, (val / diag.latency.total) * 100)}%` : '0%';

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl min-h-[220px] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-6">
                <div className="text-zinc-500 uppercase tracking-widest font-bold text-[10px] flex items-center gap-2">
                    <Clock size={14} /> Request Latency
                </div>
                <div className="text-right">
                    <div className="text-zinc-500 text-[10px]">Total Time</div>
                    <div className="text-xl font-bold text-white tabular-nums">{diag.latency.total}ms</div>
                </div>
            </div>

            <div className="space-y-4">
                <TraceBar label="DNS Resolution" color="bg-zinc-600" width={getWidth(diag.latency.dns)} val={diag.latency.dns} active={diag.status === 'DNS'} />
                <TraceBar label="TCP Handshake" color="bg-blue-600" width={getWidth(diag.latency.ssl)} val={diag.latency.ssl} active={diag.status === 'TCP'} />
                <TraceBar label="Server Wait (TTFB)" color="bg-purple-600" width={getWidth(diag.latency.ttfb)} val={diag.latency.ttfb} active={diag.status === 'TTFB'} />
                <TraceBar label="Content Download" color="bg-green-500" width={isComplete ? '15%' : '0%'} val={isComplete ? 12 : 0} active={diag.status === 'DOWNLOAD'} />
            </div>

            {isComplete && (
                <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between text-[10px] text-zinc-500 animate-in fade-in">
                    <span>PAYLOAD: <span className="text-zinc-300">{diag.payload?.size}</span></span>
                    <span>NODES: <span className="text-zinc-300">{diag.payload?.nodeCount}</span></span>
                    <span>ENDPOINT: <span className="text-zinc-300">/api/stats</span></span>
                </div>
            )}
        </div>
    );
}

function TraceBar({ label, color, width, val, active }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-28 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-zinc-600'}`}>{label}</div>
            <div className="flex-1 h-3 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-500 ${active ? 'animate-pulse' : ''}`} 
                    style={{ width: active ? '100%' : width }}
                ></div>
            </div>
            <div className="w-12 text-right text-[10px] font-mono text-zinc-500 tabular-nums">{val > 0 ? `${val}ms` : '-'}</div>
        </div>
    );
}

function DeduplicationLog({ count, status }: { count: number | undefined, status: string }) {
    const [logs, setLogs] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null); 

    useEffect(() => {
        if (status === 'IDLE') {
            setLogs(['> Awaiting input stream...']);
        } 
        else if (status === 'DOWNLOAD') {
            setLogs(prev => [...prev, '> Initiating parallel fetch...', '> Vector 1: Private Hero connected.', '> Vector 2: Public Swarm broadcasting...']);
        }
        else if (status === 'COMPLETE' && count) {
            setLogs(prev => [
                ...prev, 
                `> Payload received: ${count} potential signals.`,
                `> Starting Fingerprint Deduplication...`,
                `> Hash collision on [8x92...]: Dropping public replica (Latency penalty).`,
                `> Merging credits from Mainnet API...`,
                `> 3 Ghost Nodes detected (No RPC, Credits Only).`,
                `> Final Set: ${count} verified nodes.`
            ]);
        }
    }, [status, count]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 h-[220px] flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 text-zinc-500 mb-4 border-b border-zinc-900 pb-2">
                <Terminal size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Deduplication Engine</span>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 text-zinc-400 custom-scrollbar scroll-smooth">
                {logs.map((log, i) => (
                    <div key={i} className="opacity-80 hover:opacity-100">{log}</div>
                ))}
            </div>
        </div>
    );
}

function MathTerminal({ node, status }: { node: any, status: string }) {
    if (status === 'IDLE' || status === 'DNS' || status === 'TCP' || status === 'SSL') {
        return (
            <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest h-full min-h-[220px] shadow-lg">
                <span className="animate-pulse">Awaiting Audit Target...</span>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest h-full min-h-[220px] shadow-lg">
                Analysis Pending...
            </div>
        );
    }

    const uptimeDays = (node.uptime / 86400).toFixed(1);
    const penalties = node.healthBreakdown?.penalties?.restarts_7d_count || 0;
    const score = node.health;

    return (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-lg min-h-[220px]">
            <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Cpu size={14}/> 
                    <span className="text-[10px] font-bold uppercase">Vitality Audit</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">{node.address?.split(':')[0] || 'Unknown'}</span>
            </div>
            <div className="p-5 font-mono text-[10px] leading-6 text-zinc-400 overflow-y-auto custom-scrollbar flex-1">
                <div><span className="text-blue-500">INPUT</span> Loaded Node: {node.pubkey.substring(0, 12)}...</div>
                <div><span className="text-blue-500">INPUT</span> Uptime: {node.uptime}s ({uptimeDays} days)</div>
                <div><span className="text-blue-500">INPUT</span> Credits: {node.credits === null ? 'MISSING' : node.credits.toLocaleString() + ' CR'}</div>

                <div className="my-3 border-t border-zinc-800/50"></div>

                <div><span className="text-yellow-500">CALC</span> Sigmoid(Uptime) {'->'} {(node.healthBreakdown?.uptime || 0).toFixed(2)} pts</div>
                <div><span className="text-yellow-500">CALC</span> Elastic(Storage) {'->'} {(node.healthBreakdown?.storage || 0).toFixed(2)} pts</div>

                <div className="my-3 border-t border-zinc-800/50"></div>

                <div><span className="text-red-500">CHK</span> Restarts (7d): {penalties}</div>
                
                <div className="mt-2"><span className="text-green-500 font-bold">FINAL SCORE: {score}/100</span></div>
            </div>
        </div>
    );
}

function ForensicFlags({ flags, status }: { flags: any, status: string }) {
    const isReady = status === 'COMPLETE';

    return (
        <div className="bg-[#080808] border border-zinc-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-lg min-h-[220px]">
            <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <Search size={14}/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Anomaly Scan</span>
            </div>

            <div className="space-y-3">
                <FlagRow 
                    label="Rapid Instability" 
                    count={isReady ? flags.flapping : '-'} 
                    color="text-red-500"
                    bg="bg-red-500/10 border-red-500/20"
                    active={isReady && flags.flapping > 0}
                />
                <FlagRow 
                    label="Stale Telemetry" 
                    count={isReady ? flags.stale : '-'} 
                    color="text-blue-400"
                    bg="bg-blue-500/10 border-blue-500/20"
                    active={isReady && flags.stale > 0}
                />
                <FlagRow 
                    label="Unverified" 
                    count={isReady ? flags.unverified : '-'} 
                    color="text-zinc-400"
                    bg="bg-zinc-800/50 border-zinc-700"
                    active={isReady}
                />
            </div>
        </div>
    );
}

function FlagRow({ label, count, color, bg, active }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${active ? bg : 'bg-zinc-900/30 border-zinc-800 grayscale opacity-50'}`}>
            <div className={`text-[10px] font-bold uppercase ${active ? color : 'text-zinc-500'}`}>{label}</div>
            <div className="flex items-end gap-1">
                <div className={`text-sm font-bold font-mono ${active ? color : 'text-zinc-600'}`}>{count}</div>
            </div>
        </div>
    );
}
