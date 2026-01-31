import React, { useEffect } from 'react'; // <--- 1. Import useEffect
import Link from 'next/link';
import { 
  Activity, X, MapPin, Check, Share2, HelpCircle, ArrowRight, 
  Database, Zap, ChevronUp, Info 
} from 'lucide-react';
import { ViewMode, LocationData, MapStats } from '../../types/map';
import { TIER_COLORS, TIER_LABELS, MODE_COLORS } from '../../utils/mapConstants';
import { formatStorage, getDeepLink, getPerformerStats, getXRayStats } from '../../utils/mapHelpers';
import { ViewModeToggle } from './ViewModeToggle';

// Helper to get correct icon and color for headers
const getHeaderVisuals = (mode: ViewMode) => {
    switch (mode) {
        case 'STORAGE': return { icon: Database, color: 'text-purple-500' };
        case 'CREDITS': return { icon: Zap, color: 'text-orange-500' };
        case 'HEALTH': return { icon: Activity, color: 'text-green-500' };
    }
};

interface LocationDrawerProps {
  isSplitView: boolean;
  setIsSplitView: (val: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortedLocations: LocationData[];
  activeLocation: string | null;
  expandedLocation: string | null;
  toggleExpansion: (name: string, lat: number, lon: number) => void;
  handleCloseDrawer: () => void;
  handleCopyCoords: (lat: number, lon: number, name: string) => void;
  copiedCoords: string | null;
  handleShareLink: (e: React.MouseEvent, ip: string, name: string) => void;
  copiedLink: string | null;
  setToast: (toast: any) => void;
  getTierIndex: (loc: LocationData) => number;
  stats: MapStats;
  isGlobalCreditsOffline: boolean;
  getLegendLabels: () => string[];
  getLegendContext: () => string;
}

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  isSplitView, setIsSplitView, viewMode, setViewMode, sortedLocations,
  activeLocation, expandedLocation, toggleExpansion, handleCloseDrawer,
  handleCopyCoords, copiedCoords, handleShareLink, copiedLink, setToast,
  getTierIndex, stats, isGlobalCreditsOffline, getLegendLabels, getLegendContext
}) => {

  // --- NEW: AUTO-SCROLL FIX ---
  // When viewMode changes (re-sorting the list), find the active item and scroll to it.
  useEffect(() => {
    if (activeLocation && isSplitView) {
        // Short timeout allows React to render the new DOM order first
        const timer = setTimeout(() => {
            const element = document.getElementById(`list-item-${activeLocation}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [viewMode, sortedLocations, activeLocation, isSplitView]); 
  // ----------------------------

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Health`;
        case 'CREDITS': 
            if (loc.totalCredits === null) {
                return isGlobalCreditsOffline ? "API OFFLINE" : "UNTRACKED";
            }
            return `${loc.totalCredits.toLocaleString()} Cr`;
    }
  };

  const { icon: ModeIcon, color: modeColorClass } = getHeaderVisuals(viewMode);

  return (
      <div className={`shrink-0 bg-[#09090b] relative z-50 flex flex-col ${isSplitView ? 'h-[50vh]' : 'h-auto'}`}>
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 gap-4 ${isSplitView ? 'hidden' : 'flex'}`}>
                <div className="w-full md:w-auto flex justify-center md:justify-start"><ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} /></div>
                <div className="w-full md:w-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 max-w-xl">
                        <div className="flex items-start gap-2"><Info size={12} className="text-blue-400 mt-0.5 shrink-0" /><p className="text-[10px] text-zinc-400 leading-tight"><strong className="text-zinc-200">{getLegendContext()}</strong> {viewMode === 'STORAGE' || viewMode === 'CREDITS' ? "Thresholds are dynamic (percentile-based)." : "Thresholds are fixed."}</p></div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 w-full">
                        {getLegendLabels().map((label, idx) => (<div key={idx} className="flex flex-col items-center gap-1.5"><div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: TIER_COLORS[idx] }}></div><span className="text-[9px] font-mono text-zinc-500 font-bold whitespace-nowrap">{label}</span></div>))}
                    </div>
                </div>
            </div>

            <div className={`flex flex-col h-full overflow-hidden ${isSplitView ? 'flex' : 'hidden'}`}>
                 <div className="shrink-0 flex items-center justify-between px-3 py-2 md:px-6 md:py-3 border-b border-zinc-800/30 bg-[#09090b]">
                    <div className="flex items-center gap-2 md:gap-3">
                        <h2 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                            <ModeIcon size={14} className={modeColorClass} /> 
                            Live Data
                        </h2>
                        <div className="hidden md:block scale-90 origin-left"><ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="md:hidden scale-75 origin-right"><ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} /></div>
                        <button onClick={handleCloseDrawer} className="p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><X size={16} className="md:w-5 md:h-5" /></button>
                    </div>
                 </div>

                 <div className="flex-grow overflow-y-auto p-2 md:p-4 space-y-1 md:space-y-2 pb-safe custom-scrollbar bg-[#09090b]">
                    {sortedLocations.map((loc, i) => {
                        const tier = getTierIndex(loc);
                        const isMissingData = viewMode === 'CREDITS' && loc.totalCredits === null;
                        const tierColor = isMissingData ? '#71717a' : TIER_COLORS[tier];
                        const isExpanded = expandedLocation === loc.name;
                        const xray = getXRayStats(loc, i, tierColor, viewMode, stats, sortedLocations.length, isGlobalCreditsOffline);
                        const sampleIp = loc.ips && loc.ips.length > 0 ? loc.ips[0] : null;
                        const topData = loc.topPerformers ? loc.topPerformers[viewMode] : null;

                        return (
                            <div id={`list-item-${loc.name}`} key={loc.name} onClick={(e) => { e.stopPropagation(); toggleExpansion(loc.name, loc.lat, loc.lon); }} className={`group rounded-xl md:rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeLocation === loc.name ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800'}`}>
                                {/* Compact Row */}
                                <div className="p-1.5 md:p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className={`flex items-center justify-center w-5 h-5 md:w-8 md:h-8 rounded-full font-mono text-[9px] md:text-xs font-bold ${activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs md:text-sm font-bold text-zinc-200 group-hover:text-white flex items-center gap-1.5 md:gap-2">{loc.countryCode && <img src={`https://flagcdn.com/w20/${loc.countryCode.toLowerCase()}.png`} className="w-3 md:w-4 h-auto rounded-sm" />}{loc.name}, {loc.country}</span>
                                            <span onClick={(e) => { e.stopPropagation(); handleCopyCoords(loc.lat, loc.lon, loc.name); }} className="text-[9px] md:text-[10px] text-zinc-500 flex items-center gap-1 hover:text-blue-400 cursor-copy transition-colors"><MapPin size={8} className="md:w-[10px] md:h-[10px]" /> {copiedCoords === loc.name ? <span className="text-green-500 font-bold">Copied!</span> : `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs md:text-sm font-mono font-bold ${isMissingData ? (isGlobalCreditsOffline ? 'text-red-400' : 'text-zinc-500 italic') : ''}`} style={isMissingData ? {} : { color: tierColor }}>{getMetricText(loc)}</div>
                                        <div className="text-[9px] md:text-[10px] text-zinc-500">{loc.count} Nodes</div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    /* Expanded View */
                                    <div className="bg-black/30 border-t border-white/5 p-2 md:p-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-2 md:mb-4">
                                            <div className="text-[9px] md:text-sm font-bold uppercase tracking-widest px-2 py-0.5 md:px-3 md:py-1 rounded border bg-black/50" style={{ color: tierColor, borderColor: `${tierColor}40` }}>{isMissingData ? (isGlobalCreditsOffline ? 'API ERROR' : 'UNTRACKED') : TIER_LABELS[viewMode][tier]} TIER</div>
                                            <div className="flex gap-2">
                                                {sampleIp && (
                                                    <button onClick={(e) => handleShareLink(e, sampleIp, loc.name)} className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] md:text-[10px] font-bold hover:bg-blue-500/20 transition">
                                                        {copiedLink === loc.name ? <Check size={10} className="md:w-3 md:h-3" /> : <Share2 size={10} className="md:w-3 md:h-3" />}
                                                        {copiedLink === loc.name ? 'Copied' : 'Share'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm text-center mb-2 md:mb-4">
                                            <div className="flex flex-col items-center group/stat">
                                                <div className="text-zinc-500 text-[8px] md:text-[10px] uppercase mb-0.5 md:mb-1 flex items-center gap-1">
                                                    {xray.labelA}
                                                    <HelpCircle size={8} className="cursor-help opacity-50"/>
                                                    <div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descA}</div>
                                                </div>
                                                <div className="font-mono font-bold text-xs md:text-base">{xray.valA}</div>
                                            </div>

                                            <div className="flex flex-col items-center border-l border-zinc-800/50 group/stat">
                                                <div className="text-zinc-500 text-[8px] md:text-[10px] uppercase mb-0.5 md:mb-1 flex items-center gap-1">
                                                    {xray.labelB}
                                                    <HelpCircle size={8} className="cursor-help opacity-50"/>
                                                    <div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descB}</div>
                                                </div>
                                                <div className="text-white font-mono font-bold text-xs md:text-base">{xray.valB}</div>
                                            </div>

                                            <div className="flex flex-col items-center border-l border-zinc-800/50 group/stat">
                                                <div className="text-zinc-500 text-[8px] md:text-[10px] uppercase mb-0.5 md:mb-1 flex items-center gap-1">
                                                    {xray.labelC}
                                                    <HelpCircle size={8} className="cursor-help opacity-50"/>
                                                    <div className="absolute bottom-1/2 mb-2 hidden group-hover/stat:block bg-black border border-zinc-700 p-2 rounded text-[10px] text-zinc-300 z-50 w-32">{xray.descC}</div>
                                                </div>
                                                <div className="font-mono font-bold text-xs md:text-base">{xray.valC}</div>
                                            </div>
                                        </div>

                                        {topData && (() => {
                                            const isUntrackedKing = viewMode === 'CREDITS' && topData.isUntracked;
                                            const getCardStyle = () => {
                                                if (viewMode === 'CREDITS' && isGlobalCreditsOffline) return 'cursor-not-allowed border-red-500/30 bg-red-900/10 opacity-100';
                                                if (isUntrackedKing) return 'cursor-not-allowed opacity-70';
                                                return 'cursor-pointer hover:bg-zinc-800';
                                            };

                                            const CardContent = (
                                                <div className={`w-full border border-zinc-700/50 rounded-xl p-1.5 md:p-3 flex items-center justify-between transition-all group/card ${getCardStyle()} ${isGlobalCreditsOffline ? '' : 'bg-zinc-800/50'}`}>
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className={`p-1 md:p-2 rounded-lg ${MODE_COLORS[viewMode].bg} text-white`}>
                                                            {viewMode === 'STORAGE' ? <Database size={10} className="md:w-3.5 md:h-3.5" /> : viewMode === 'CREDITS' ? <Zap size={10} className="md:w-3.5 md:h-3.5" /> : <Activity size={10} className="md:w-3.5 md:h-3.5" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                <div className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Region's Top Performer</div>
                                                                {topData.network === 'MAINNET' && <span className="text-[7px] md:text-[8px] bg-green-500 text-black px-1 rounded font-bold uppercase">Mainnet</span>}
                                                                {topData.network === 'DEVNET' && <span className="text-[7px] md:text-[8px] bg-blue-500 text-white px-1 rounded font-bold uppercase">Devnet</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="text-[10px] md:text-xs font-mono text-white truncate w-24 md:w-32">{topData.pk.slice(0, 16)}...</div>
                                                                <div className="hidden md:block text-xs">
                                                                    {getPerformerStats(topData, viewMode)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-blue-400 group-hover/card:translate-x-1 transition-transform whitespace-nowrap">
                                                        DETAILS <ArrowRight size={10} className="md:w-3 md:h-3" />
                                                    </div>
                                                </div>
                                            );

                                            if (viewMode === 'CREDITS' && isGlobalCreditsOffline) {
                                                return (
                                                    <div onClick={(e) => {
                                                        e.stopPropagation();
                                                        setToast({ msg: "Credits API is currently offline.", type: 'error' });
                                                        setTimeout(() => setToast(null), 5000);
                                                    }}>{CardContent}</div>
                                                );
                                            }

                                            if (isUntrackedKing) {
                                                return (
                                                    <div onClick={(e) => {
                                                        e.stopPropagation();
                                                        setToast({ msg: "This node is currently not receiving rewards.", type: 'info' });
                                                        setTimeout(() => setToast(null), 8000);
                                                    }}>{CardContent}</div>
                                                )
                                            }

                                            return (
                                                <Link href={viewMode === 'CREDITS' ? getDeepLink(topData, 'LEADERBOARD') : getDeepLink(topData, 'DASHBOARD')}>
                                                    {CardContent}
                                                </Link>
                                            )
                                        })()}

                                        <div className="w-full h-0.5 md:h-1 bg-zinc-800 rounded-full mt-2 md:mt-4 overflow-hidden"><div className="h-full bg-white/20" style={{ width: `${(loc.count / stats.totalNodes) * 100}%` }}></div></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
            </div>

            {!isSplitView && (
                <div className="shrink-0 p-2 md:px-6 md:py-4 bg-[#09090b] border-t border-zinc-800/30 z-50">
                    <button onClick={() => setIsSplitView(true)} className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 bg-zinc-900/80 hover:bg-zinc-800 border border-blue-500/30 hover:border-blue-500/60 rounded-xl transition-all group shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-[pulse_3s_infinite]"><Activity size={14} className="md:w-4 md:h-4 text-blue-400 group-hover:scale-110 transition-transform animate-pulse" /><span className="text-xs md:text-sm font-bold uppercase tracking-widest text-blue-100 group-hover:text-white">Open Live Stats</span><ChevronUp size={14} className="md:w-4 md:h-4 text-blue-500/50 group-hover:-translate-y-1 transition-transform" /></button>
                </div>
            )}
      </div>
  );
};
