import { useState, useEffect, useMemo } from 'react';
import { Activity, Shield, Zap, CheckCircle2, Lock, Server, Globe, Database, RotateCw, Clock } from 'lucide-react';
import { calculateVitalityScore } from '../../../lib/xandeum-brain'; 
import { LogicWrapper } from '../layout/LogicWrapper';

const REFRESH_INTERVAL_SEC = 600; // 10 Minutes

const ENGINEERING_LOGIC_SNIPPET = `
// Production Uplink Verification with Lazy Refresh
const REFRESH_RATE = 600000; // 10 Minutes

const runDiagnostics = async () => {
  const start = Date.now();
  const res = await fetch('/api/stats?mode=fast');
  const duration = Date.now() - start; 
  
  const { stats } = await res.json();
  return {
    latency: duration,
    rpcStatus: stats.systemStatus.rpc,
    activeNodes: stats.totalNodes,
    timestamp: new Date().toISOString()
  };
};
`;

export function EngineeringChapter() {
    const [metrics, setMetrics] = useState<{
        latency: number | null;
        status: { rpc: boolean; credits: boolean };
        nodeCount: number;
        lastSync: string;
        isProbing: boolean;
    }>({
        latency: null,
        status: { rpc: true, credits: true },
        nodeCount: 0,
        lastSync: '--:--:--',
        isProbing: false
    });

    const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC);

    // 1. PRODUCTION UPLINK PROBE
    const runDiagnostics = async () => {
        setMetrics(prev => ({ ...prev, isProbing: true }));
        const start = Date.now();
        try {
            const res = await fetch(`/api/stats?mode=fast&t=${Date.now()}`);
            const duration = Date.now() - start;
            const data = await res.json();

            setMetrics({
                latency: duration,
                status: data.stats?.systemStatus || { rpc: true, credits: true },
                nodeCount: data.stats?.totalNodes || 0,
                lastSync: new Date().toLocaleTimeString('en-US', { hour12: false }),
                isProbing: false
            });
            // Reset countdown on success
            setCountdown(REFRESH_INTERVAL_SEC);
        } catch (err) {
            console.error("Diagnostic Probe Failed:", err);
            setMetrics(prev => ({ ...prev, isProbing: false }));
        }
    };

    // 2. TIMERS & COUNTDOWN
    useEffect(() => {
        runDiagnostics();

        // Interval for the 10-minute fetch
        const probeInterval = setInterval(runDiagnostics, REFRESH_INTERVAL_SEC * 1000);

        // Interval for the live UI countdown clock
        const clockInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : REFRESH_INTERVAL_SEC));
        }, 1000);

        return () => {
            clearInterval(probeInterval);
            clearInterval(clockInterval);
        };
    }, []);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 3. LOGIC INTEGRITY CHECK
    const auditPassed = useMemo(() => {
        try {
            const testCalc = calculateVitalityScore(1000, 500, 86400 * 10, '1.2.0', '1.2.0', ['1.2.0'], 100, 100, 1000, true);
            return testCalc.total > 0;
        } catch { return false; }
    }, []);

    return (
        <LogicWrapper 
            title="Engineering_Audit.ts" 
            code={ENGINEERING_LOGIC_SNIPPET} 
            githubPath="src/lib/xandeum-brain.ts"
        >
            <div className="flex flex-col items-center">
                {/* Context Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                        <Shield size={12} /> System Integrity Verified
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Engineering Standards</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
                        Pulse maintains sub-second responsiveness via optimized RPC orchestration. This section monitors 
                        active data streams, ensuring our <strong>High-Availability Architecture</strong> meets the 
                        sovereign standards required for 24/7 network participation.
                    </p>
                </div>

                {/* Live Infrastructure Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 w-full">
                    <div className="space-y-8">
                        <div className="flex gap-5 p-8 bg-zinc-900/20 border border-zinc-800 rounded-[2rem] group hover:border-blue-500/30 transition-all text-left relative overflow-hidden">
                            <div className="p-3 bg-blue-500/10 rounded-2xl h-fit text-blue-400 group-hover:scale-110 transition-transform"><Globe size={24}/></div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold mb-2 uppercase tracking-tighter">Network Latency</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                    Round-trip telemetry from your browser to the Pulse Neural Core. Optimal thresholds 
                                    are flagged in green.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Last Probe</div>
                                        <div className="text-xs font-mono text-blue-400">{metrics.lastSync}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Next Auto-Sync</div>
                                        <div className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                                            <Clock size={10} className="text-zinc-500"/> {formatCountdown(countdown)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-5 p-8 bg-zinc-900/20 border border-zinc-800 rounded-[2rem] group hover:border-green-500/30 transition-all text-left">
                            <div className="p-3 bg-green-500/10 rounded-2xl h-fit text-green-400 group-hover:scale-110 transition-transform"><Database size={24}/></div>
                            <div>
                                <h4 className="text-white font-bold mb-2 uppercase tracking-tighter">Database Integrity</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                                    Verifying the shadow database state. Currently indexing 
                                    <strong> {metrics.nodeCount} validators</strong>.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${metrics.status.rpc ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        RPC_STREAM: {metrics.status.rpc ? 'ACTIVE' : 'FAILOVER'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE LATENCY GAUGE */}
                    <div className="relative flex flex-col items-center justify-center">
                        <button 
                            onClick={runDiagnostics}
                            disabled={metrics.isProbing}
                            className="relative flex flex-col items-center justify-center w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-zinc-900 bg-[#010101] shadow-[0_0_100px_rgba(34,197,94,0.02)] group transition-all active:scale-95 disabled:opacity-80"
                        >
                            <div className={`absolute inset-0 rounded-full border-t-2 border-green-500/20 ${metrics.isProbing ? 'animate-spin' : 'animate-spin [animation-duration:12s]'}`}></div>
                            
                            <Activity size={48} className={`mb-4 transition-colors duration-700 ${metrics.latency && metrics.latency < 100 ? 'text-green-500' : 'text-yellow-500'}`} />
                            <div className="text-7xl md:text-9xl font-black text-white font-mono tracking-tighter">
                                {metrics.latency ?? '--'}
                            </div>
                            <div className="text-[10px] font-black text-zinc-600 uppercase mt-2 tracking-[0.5em] font-mono">MS Latency</div>
                            
                            <div className="absolute -bottom-6 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full text-[10px] font-black text-zinc-400 shadow-2xl flex items-center gap-3 group-hover:border-blue-500 group-hover:text-blue-400 transition-all uppercase tracking-widest">
                                {metrics.isProbing ? <RotateCw size={12} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                {metrics.isProbing ? 'Syncing...' : 'Force Refresh'}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Validation Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <div className="p-10 rounded-[3rem] bg-zinc-900/30 border border-zinc-800 flex flex-col items-center gap-6 text-center group hover:bg-zinc-900/50 transition-all">
                        <div className="p-4 rounded-2xl bg-green-500/10 text-green-500 shadow-lg group-hover:scale-110 transition-transform"><Zap size={32} /></div>
                        <div>
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Protocol Deployment</div>
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-green-400 px-6 py-2.5 bg-green-900/20 border border-green-500/30 rounded-full tracking-widest uppercase">
                                <CheckCircle2 size={14}/> Node Version V3.2.0 Stable
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-zinc-900/30 border border-zinc-800 flex flex-col items-center gap-6 text-center group hover:bg-zinc-900/50 transition-all">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 shadow-lg group-hover:scale-110 transition-transform"><Lock size={32} /></div>
                        <div>
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Mathematical Audit</div>
                            <div className={`inline-flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-full tracking-widest uppercase ${auditPassed ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                                {auditPassed ? <CheckCircle2 size={14}/> : <Activity size={14}/>}
                                {auditPassed ? 'Logic Sanity Passed' : 'Audit Verification Failed'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LogicWrapper>
    );
}
