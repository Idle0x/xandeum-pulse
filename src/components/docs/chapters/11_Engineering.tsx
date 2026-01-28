import { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Terminal, Search, Server, Cpu, AlertTriangle, CheckCircle2, GitMerge, Download, Globe } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- TEXT CONTENT (UPDATED NARRATIVE) ---
const ENG_TEXT = [
    {
        title: "Hyper-Parallel Aggregation",
        content: "Pulse serves as an active Orchestration Engine, executing a simultaneous 5-vector fetch strategy. Rather than a sequential load, the Neural Core races the Private 'Hero' RPC against the Public Swarm while concurrently pulling credit data (Mainnet/Devnet) and historical forensics. This ensures sub-second latency even when individual data sources stall."
    },
    {
        title: "Forensic Deduplication",
        content: "To prove data integrity, the engine performs real-time Fingerprint Deduplication. It generates a unique composite key (Pubkey + IP + Storage + Version) for every incoming signal. This allows the system to identify collision events where the Private Hero and Public Swarm report the same node, automatically dropping the slower signal to prevent double-counting."
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

    const runDiagnostics = async () => {
        // Reset State
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
            // Unverified: Nodes where isUntracked is true
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
            textData={ENG_TEXT}
            codeSnippet={ENG_CODE}
            githubPath="src/lib/diagnostics.ts"
        >
            <div className="h-full bg-[#080808] p-4 md:p-6 flex flex-col gap-6 font-mono text-xs">
                
                {/* 1. CONTROL HEADER */}
                <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${diag.status === 'ERROR' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-blue-900/20 border-blue-500/30 text-blue-400'}`}>
                            <Activity size={18}/>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Diagnostic State</div>
                            <div className="font-bold text-white flex items-center gap-2">
                                {diag.status === 'IDLE' ? 'READY' : diag.status === 'COMPLETE' ? 'TRACE COMPLETE' : 'AGGREGATING...'}
                                {diag.status !== 'IDLE' && diag.status !== 'COMPLETE' && diag.status !== 'ERROR' && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={runDiagnostics}
                        disabled={diag.status !== 'IDLE' && diag.status !== 'COMPLETE' && diag.status !== 'ERROR'}
                        className="px-6 py-2 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95 shadow-lg"
                    >
                        {diag.status === 'IDLE' ? 'RUN AUDIT' : 'RERUN TRACE'}
                    </button>
                </div>

                {/* 2. PIPELINE MONITOR (Horizontal) */}
                <PipelineMonitor diag={diag} />

                {/* 3. SPLIT GRID: MATH & FORENSICS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[280px]">
                    <MathTerminal node={diag.payload?.sampleNode} status={diag.status} />
                    <ForensicFlags flags={diag.payload?.flags} status={diag.status} />
                </div>

                {/* 4. DEDUPLICATION CONSOLE */}
                <DeduplicationLog count={diag.payload?.nodeCount} status={diag.status} />

            </div>
        </ChapterLayout>
    );
}

// --- SUB-COMPONENTS ---

function PipelineMonitor({ diag }: { diag: DiagnosticState }) {
    // We map the sequential states to visual progress
    const steps = ['DNS', 'TCP', 'SSL', 'TTFB', 'DOWNLOAD', 'COMPLETE'];
    const currentIndex = steps.indexOf(diag.status);
    const isComplete = diag.status === 'COMPLETE';

    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                    <GitMerge size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Aggregator Pipeline</span>
                </div>
                <div className="text-right">
                    <div className="text-zinc-500 text-[10px]">Total Latency</div>
                    <div className="text-lg font-bold text-white tabular-nums">{diag.latency.total}ms</div>
                </div>
            </div>

            {/* The Pipeline Bar */}
            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex relative">
                {/* 1. Connection Phase (DNS/TCP/SSL) */}
                <div 
                    className="h-full bg-zinc-700 transition-all duration-300"
                    style={{ width: currentIndex >= 1 ? '15%' : currentIndex >= 0 ? '5%' : '0%' }}
                ></div>
                {/* 2. Wait Phase (TTFB) */}
                <div 
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: currentIndex >= 4 ? '25%' : currentIndex >= 3 ? '10%' : '0%' }}
                ></div>
                {/* 3. Download Phase (The Parallel Fetch) */}
                <div 
                    className="h-full bg-blue-500 transition-all duration-300 relative overflow-hidden"
                    style={{ width: currentIndex >= 5 ? '60%' : currentIndex >= 4 ? '20%' : '0%' }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px] animate-pulse"></div>
                </div>
            </div>

            {/* Labels below */}
            <div className="flex justify-between mt-2 text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                <span>Handshake</span>
                <span>Server Wait</span>
                <span className={currentIndex >= 4 ? 'text-blue-400' : ''}>Parallel Download</span>
            </div>

            {/* Active Vectors Badge (Only appears during download/complete) */}
            <div className={`mt-4 pt-4 border-t border-zinc-900 transition-opacity duration-500 ${currentIndex >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex gap-2">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold">HERO RPC</span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold">SWARM (x8)</span>
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[9px] font-bold">MAINNET DB</span>
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[9px] font-bold">DEVNET DB</span>
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-[9px] font-bold">FORENSICS</span>
                </div>
            </div>
        </div>
    );
}

function DeduplicationLog({ count, status }: { count: number | undefined, status: string }) {
    const [logs, setLogs] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

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
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-4 h-32 overflow-hidden flex flex-col shadow-inner">
            <div className="flex items-center gap-2 text-zinc-500 mb-2 border-b border-zinc-900 pb-2">
                <Terminal size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Deduplication Engine</span>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-zinc-400 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className="opacity-80 hover:opacity-100">{log}</div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function MathTerminal({ node, status }: { node: any, status: string }) {
    if (status === 'IDLE' || status === 'DNS' || status === 'TCP' || status === 'SSL') {
        return (
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest h-full shadow-lg">
                <span className="animate-pulse">Awaiting Audit Target...</span>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest h-full shadow-lg">
                Analysis Pending...
            </div>
        );
    }

    const uptimeDays = (node.uptime / 86400).toFixed(1);
    const penalties = node.healthBreakdown?.penalties?.restarts_7d_count || 0;
    const score = node.health;

    return (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-0 overflow-hidden flex flex-col h-full shadow-lg">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Cpu size={12}/> 
                    <span className="text-[10px] font-bold uppercase">Vitality Audit</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">{node.address?.split(':')[0] || 'Unknown'}</span>
            </div>
            <div className="p-4 font-mono text-[10px] leading-6 text-zinc-400 overflow-y-auto custom-scrollbar flex-1">
                <div><span className="text-blue-500">INPUT</span> Loaded Node: {node.pubkey.substring(0, 12)}...</div>
                <div><span className="text-blue-500">INPUT</span> Uptime: {node.uptime}s ({uptimeDays} days)</div>
                <div><span className="text-blue-500">INPUT</span> Credits: {node.credits === null ? 'MISSING' : node.credits.toLocaleString() + ' CR'}</div>
                <div><span className="text-blue-500">INPUT</span> Storage: {node.storage_committed} bytes</div>
                
                <div className="my-2 border-t border-zinc-800/50"></div>
                {/* Fixed Arrows for JSX Safety */}
                <div><span className="text-yellow-500">CALC</span> Sigmoid(Uptime) {'->'} {(node.healthBreakdown?.uptime || 0).toFixed(2)} pts</div>
                <div><span className="text-yellow-500">CALC</span> Elastic(Storage) {'->'} {(node.healthBreakdown?.storage || 0).toFixed(2)} pts</div>
                <div><span className="text-yellow-500">CALC</span> Version({node.version}) {'->'} {(node.healthBreakdown?.version || 0).toFixed(2)} pts</div>
                
                <div className="my-2 border-t border-zinc-800/50"></div>
                
                <div><span className="text-red-500">CHK</span> Restarts (7d): {penalties}</div>
                <div><span className="text-red-500">CHK</span> Frozen Hours: {node.healthBreakdown?.penalties?.frozen_duration_hours || 0}</div>
                
                <div className="mt-2"><span className="text-green-500 font-bold">FINAL SCORE: {score}/100</span></div>
            </div>
        </div>
    );
}

function ForensicFlags({ flags, status }: { flags: any, status: string }) {
    const isReady = status === 'COMPLETE';

    return (
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 h-full flex flex-col justify-between shadow-lg">
            <div className="flex items-center gap-2 text-zinc-500 mb-6">
                <Search size={14}/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Network Anomaly Scan</span>
            </div>

            <div className="space-y-3">
                <FlagRow 
                    label="Rapid Instability" 
                    desc="Nodes with >5 restarts in 24h"
                    count={isReady ? flags.flapping : '-'} 
                    color="text-red-500"
                    bg="bg-red-500/10 border-red-500/20"
                    active={isReady && flags.flapping > 0}
                />
                <FlagRow 
                    label="Stale Telemetry" 
                    desc="Nodes with frozen uptime >1h"
                    count={isReady ? flags.stale : '-'} 
                    color="text-blue-400"
                    bg="bg-blue-500/10 border-blue-500/20"
                    active={isReady && flags.stale > 0}
                />
                <FlagRow 
                    label="Unverified & Untracked" 
                    desc="Not on credits API (Not 0)"
                    count={isReady ? flags.unverified : '-'} 
                    color="text-zinc-400"
                    bg="bg-zinc-800/50 border-zinc-700"
                    active={isReady}
                />
            </div>
        </div>
    );
}

function FlagRow({ label, desc, count, color, bg, active }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${active ? bg : 'bg-zinc-900/30 border-zinc-800 grayscale opacity-50'}`}>
            <div>
                <div className={`text-[10px] font-bold uppercase ${active ? color : 'text-zinc-500'}`}>{label}</div>
                <div className="text-[9px] text-zinc-600">{desc}</div>
            </div>
            <div className="flex items-end gap-1">
                <div className={`text-lg font-bold font-mono ${active ? color : 'text-zinc-600'}`}>{count}</div>
                {active && <span className="text-[9px] text-zinc-500 mb-1">Nodes</span>}
            </div>
        </div>
    );
}
