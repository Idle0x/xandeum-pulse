import { useState } from 'react';
import { Shield, RotateCw, CheckCircle2 } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

const ENG_TEXT = [
    {
        title: "Engineering Standards",
        content: "Pulse maintains sub-second responsiveness via optimized RPC orchestration. This section monitors active data streams, ensuring our High-Availability Architecture meets the sovereign standards required for 24/7 network participation."
    },
    {
        title: "Forensic Context",
        content: "Every diagnostic run includes a full forensic context payload: restart counts, yield velocity deltas, and consistency scores. This allows operators to debug network desynchronization issues instantly."
    }
];

const ENG_CODE = `
// Diagnostic Probe
const probe = async () => {
  const start = Date.now();
  const res = await fetch('/api/health');
  
  return {
    latency: Date.now() - start,
    status: res.status
  };
};
`;

export function EngineeringChapter() {
    const [scanning, setScanning] = useState(false);
    const [latency, setLatency] = useState(45);

    const runProbe = () => {
        setScanning(true);
        setTimeout(() => {
            setLatency(Math.floor(Math.random() * 20) + 20);
            setScanning(false);
        }, 1000);
    };

    return (
        <ChapterLayout
            chapterNumber="10"
            title="System Audit"
            subtitle="Latency probes and integrity verification."
            textData={ENG_TEXT}
            codeSnippet={ENG_CODE}
            githubPath="src/lib/diagnostics.ts"
        >
            <div className="h-full bg-[#080808] p-8 flex flex-col justify-between relative overflow-hidden">
                
                {/* 1. HEADER */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-green-500">
                        <Shield size={18}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">System Integrity</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                        <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-yellow-500 animate-bounce' : 'bg-green-500'}`}></div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{scanning ? 'Probing...' : 'Operational'}</span>
                    </div>
                </div>

                {/* 2. SPEEDOMETER */}
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative w-64 h-32 overflow-hidden mb-6">
                         {/* Dial Background */}
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border-[16px] border-zinc-900 border-t-zinc-800"></div>
                         {/* Needle */}
                         <div 
                            className="absolute bottom-0 left-1/2 w-1.5 h-32 bg-green-500 origin-bottom transition-transform duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)"
                            style={{ transform: `translateX(-50%) rotate(${scanning ? -90 : (latency - 45) * 2}deg)` }}
                         ></div>
                    </div>
                    <div className="text-6xl font-black text-white tracking-tighter tabular-nums">
                        {scanning ? '--' : latency}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Milliseconds</div>
                </div>

                {/* 3. ACTION BUTTON */}
                <button 
                    onClick={runProbe}
                    disabled={scanning}
                    className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 group relative"
                >
                    <RotateCw size={14} className={`group-hover:rotate-180 transition-transform ${scanning ? 'animate-spin' : ''}`}/>
                    {scanning ? 'Running Diagnostics...' : 'Ping Neural Core'}
                    
                    {/* Visual Cue */}
                    {!scanning && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>}
                </button>
            </div>
        </ChapterLayout>
    );
}
