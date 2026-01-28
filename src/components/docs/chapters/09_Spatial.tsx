import { useState } from 'react';
import { Globe, Database, Zap, Activity, MapPin, X, ChevronUp, BarChart3, Search } from 'lucide-react';
import { ChapterLayout } from '../layout/ChapterLayout';

// --- TEXT CONTENT ---
const SPATIAL_TEXT = [
    {
        title: "Global Mesh Topology",
        content: "The Map Interface is a full-spectrum command center for visualizing the physical distribution of the Xandeum network. Operators can toggle between three distinct view modes—Storage (Capacity), Health (Stability), and Credits (Earnings)—to analyze the grid's performance across different vectors."
    },
    {
        title: "Interactive Regional Intelligence",
        content: "Data is aggregated into interactive regional clusters. Clicking a region triggers a deep-dive analysis, opening a detail drawer that reveals X-Ray statistics, public/private node ratios, and the specific 'King Node'—the top-performing validator for that region based on the current active metric."
    },
    {
        title: "Network Segmentation",
        content: "The system supports instant filtering between Mainnet, Devnet, and All Networks. Combined with the Country Breakdown modal, this allows for granular inspection of jurisdictional density and centralization risks."
    }
];

// --- CODE SNIPPET (From your pages/api/geo.ts) ---
const SPATIAL_CODE = `
// pages/api/geo.ts - Regional Tournament Logic

// 1. Storage King
if (storageGB > existing.bestNodes.storageVal) {
    existing.bestNodes.storageVal = storageGB;
    existing.bestNodes.storagePk = node.pubkey;
    existing.bestNodes.storageAddr = node.address;
}

// 2. Credits King (Smart Filtering)
// We prefer nodes that are actively tracked over untracked ones
const isBetter = (!isUntracked && currentKingUntracked) || 
                 ((node.credits || 0) >= existing.bestNodes.creditsVal);

if (isBetter) {
    existing.bestNodes.creditsVal = node.credits;
    existing.bestNodes.creditsPk = node.pubkey;
}

// 3. Health King
if (node.health > existing.bestNodes.healthVal) {
    existing.bestNodes.healthVal = node.health;
    existing.bestNodes.healthPk = node.pubkey;
}
`;

// --- SIMULATOR DATA ---
const MOCK_REGIONS = [
    { 
        id: 'tokyo', name: 'Tokyo, JP', x: 80, y: 35, 
        stats: { nodes: 12, storage: '4.5 PB', health: '98%', credits: '5.2M Cr' },
        king: { pk: '8x...9A', label: 'ELITE TIER' }
    },
    { 
        id: 'london', name: 'London, GB', x: 48, y: 25, 
        stats: { nodes: 8, storage: '2.1 PB', health: '94%', credits: '3.1M Cr' },
        king: { pk: '3y...B2', label: 'STANDARD' }
    },
    { 
        id: 'nyc', name: 'New York, US', x: 28, y: 32, 
        stats: { nodes: 15, storage: '3.8 PB', health: '96%', credits: '4.8M Cr' },
        king: { pk: '7q...L9', label: 'ELITE TIER' }
    }
];

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

export function SpatialChapter() {
    return (
        <ChapterLayout
            chapterNumber="07"
            title="Spatial Topology"
            subtitle="Geographic clustering, regional tournaments, and mesh analysis."
            textData={SPATIAL_TEXT}
            codeSnippet={SPATIAL_CODE}
            githubPath="src/pages/api/geo.ts"
        >
            <MapSimulator />
        </ChapterLayout>
    );
}

function MapSimulator() {
    const [mode, setMode] = useState<ViewMode>('STORAGE');
    const [network, setNetwork] = useState('ALL');
    const [activeRegion, setActiveRegion] = useState<typeof MOCK_REGIONS[0] | null>(null);

    // Dynamic Colors based on Mode
    const getColor = () => {
        if (mode === 'STORAGE') return 'text-purple-500 bg-purple-500';
        if (mode === 'HEALTH') return 'text-green-500 bg-green-500';
        return 'text-orange-500 bg-orange-500';
    };

    const getMetric = (r: typeof MOCK_REGIONS[0]) => {
        if (mode === 'STORAGE') return r.stats.storage;
        if (mode === 'HEALTH') return r.stats.health;
        return r.stats.credits;
    };

    return (
        <div className="h-full bg-[#050505] relative overflow-hidden flex flex-col font-sans">
            
            {/* 1. HEADER CONTROL BAR */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                {/* View Toggles */}
                <div className="flex bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 pointer-events-auto shadow-xl">
                    <ModeBtn icon={Database} label="STORAGE" active={mode === 'STORAGE'} onClick={() => setMode('STORAGE')} color="text-purple-400" />
                    <ModeBtn icon={Activity} label="HEALTH" active={mode === 'HEALTH'} onClick={() => setMode('HEALTH')} color="text-green-400" />
                    <ModeBtn icon={Zap} label="CREDITS" active={mode === 'CREDITS'} onClick={() => setMode('CREDITS')} color="text-orange-400" />
                </div>

                {/* Region Trigger (Visual Only) */}
                <div className="hidden md:flex bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-800 items-center gap-2 pointer-events-auto cursor-pointer hover:border-zinc-600 transition-colors">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-900"></div>
                        <div className="w-4 h-4 rounded-full bg-zinc-600 border border-zinc-900"></div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300">+24 Regions</span>
                    <BarChart3 size={12} className="text-zinc-500"/>
                </div>
            </div>

            {/* 2. NETWORK SWITCHER (Bottom Right) */}
            <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
                <div className="flex bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800 shadow-xl">
                    {['ALL', 'MAINNET', 'DEVNET'].map(n => (
                        <button 
                            key={n}
                            onClick={() => setNetwork(n)}
                            className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all ${network === n ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. THE MAP VISUAL */}
            <div className={`
                absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out
                ${activeRegion ? 'scale-125 opacity-40' : 'scale-100 opacity-100'}
            `}>
                <div className="relative w-full h-full max-w-2xl aspect-video opacity-80">
                    {/* Abstract Grid Map */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent"></div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>
                    
                    {/* Render Pins */}
                    {MOCK_REGIONS.map(region => (
                        <button 
                            key={region.id}
                            onClick={() => setActiveRegion(region)}
                            className="absolute group z-10"
                            style={{ left: `${region.x}%`, top: `${region.y}%` }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* Ping Animation */}
                                <div className={`absolute w-8 h-8 rounded-full opacity-20 animate-ping ${getColor()}`}></div>
                                {/* Core Pin */}
                                <div className={`w-3 h-3 rounded-full border-2 border-[#050505] shadow-lg transition-transform group-hover:scale-125 ${getColor()}`}></div>
                                {/* Label */}
                                <div className="absolute top-4 px-2 py-1 bg-black/80 border border-zinc-800 rounded text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {region.name}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. DETAIL DRAWER (Simulating LocationDrawer) */}
            <div className={`
                absolute bottom-0 left-0 right-0 bg-[#09090b] border-t border-zinc-800 transition-transform duration-500 ease-out z-30
                ${activeRegion ? 'translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'translate-y-full'}
            `}>
                {activeRegion && (
                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-zinc-900 border border-zinc-800 ${getColor().split(' ')[0]}`}>
                                    {mode === 'STORAGE' ? <Database size={18}/> : mode === 'HEALTH' ? <Activity size={18}/> : <Zap size={18}/>}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {activeRegion.name}
                                    </h3>
                                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                                        <Globe size={10}/> {activeRegion.stats.nodes} NODES ACTIVE
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setActiveRegion(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                                <X size={16}/>
                            </button>
                        </div>

                        {/* X-Ray Stats Grid */}
                        <div className="grid grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800">
                            <StatBox label="Density" val={activeRegion.stats.nodes} />
                            <StatBox label={mode} val={getMetric(activeRegion)} highlight />
                            <StatBox label="Latency" val="12ms" />
                        </div>

                        {/* King Node Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between group hover:border-zinc-700 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                                    <Search size={14}/>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Region's Top Performer</span>
                                        <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">{activeRegion.king.label}</span>
                                    </div>
                                    <div className="font-mono text-sm text-white font-bold">{activeRegion.king.pk}</div>
                                </div>
                            </div>
                            <div className="hidden md:block text-[9px] font-bold text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details &rarr;
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

// --- SUB-COMPONENTS ---

function ModeBtn({ icon: Icon, label, active, onClick, color }: any) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                ${active ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
            `}
        >
            <Icon size={14} className={active ? color.replace('text-', 'text-') : ''} />
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </button>
    )
}

function StatBox({ label, val, highlight }: any) {
    return (
        <div className="bg-[#09090b] p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</span>
            <span className={`text-sm font-bold font-mono ${highlight ? 'text-white' : 'text-zinc-400'}`}>{val}</span>
        </div>
    )
}
