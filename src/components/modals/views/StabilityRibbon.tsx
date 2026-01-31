import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { 
  X, Clock, Coins, Zap, Activity, AlertTriangle, 
  CheckCircle, ThermometerSun, Crown, Info, Flame 
} from 'lucide-react';
import { analyzePointVitality } from '../../../utils/vitalityHelpers';
import { formatUptime } from '../../../utils/formatters';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string;
  globalConsensusVersion: string;
  globalSortedVersions: string[];
  // NEW: Accept Live Penalties from Parent
  currentPenalties?: { restarts: number; consistency: number };
}

// --- SUB-COMPONENT: VITALITY SNAPSHOT CARD ---
const VitalitySnapshotCard = ({ 
  point, 
  historyWindow,
  refPoint24H,
  globalConsensusVersion,
  globalSortedVersions,
  firstSeenDate, 
  onClose,
  positionClass 
}: { 
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[],
  refPoint24H: NodeHistoryPoint | undefined,
  globalConsensusVersion: string, 
  globalSortedVersions: string[], 
  firstSeenDate: string, 
  onClose: () => void,
  positionClass: string
}) => {
    const analysis = analyzePointVitality(
        point, 
        historyWindow, 
        refPoint24H, 
        globalSortedVersions, 
        globalConsensusVersion, 
        firstSeenDate
    );
    const health = point.health || 0;

    // SAFE EXTRACTION OF PENALTIES
    const penalties = (point as any).healthBreakdown?.penalties || { restarts: 0, consistency: 1 };
    const restartPenalty = penalties.restarts || 0;
    const consistencyScore = penalties.consistency !== undefined ? penalties.consistency : 1;
    const hasPenalty = restartPenalty > 0 || consistencyScore < 0.95;

    // Icon Selection
    const Icon = {
        CRITICAL: AlertTriangle,
        TRAUMA: Zap,
        DRIFT: Activity,
        INCUBATION: ThermometerSun,
        ELITE: Crown,
        ACTIVE: CheckCircle
    }[analysis.archetype] || Activity;

    const displayIssues = analysis.issues.slice(0, 3);
    const hasIssues = displayIssues.length > 0;

    return (
        <div className={`absolute bottom-full mb-2 md:mb-3 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
            {/* CONTAINER 
                Mobile: w-52, max-h-[320px], overflow-y-auto (scrolls if too tall)
                Desktop: w-64, max-h-none, overflow-hidden (expands naturally)
            */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-52 md:w-64 relative flex flex-col backdrop-blur-xl max-h-[320px] overflow-y-auto md:max-h-none md:overflow-hidden">

                 {/* Pointer Arrow */}
                 <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#09090b] border-b border-r border-zinc-800 transform rotate-45 ${positionClass.includes('left-4') ? 'left-4' : positionClass.includes('right-4') ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>

                 {/* --- ZONE A: HEADER --- */}
                 {/* Added shrink-0 so header never collapses when scrolling body */}
                 <div className="p-2 md:p-3 border-b border-zinc-800/50 bg-zinc-900/30 shrink-0">
                     <div className="flex justify-between items-start mb-1.5 md:mb-2">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-0.5">SNAPSHOT</span>
                            <span className="text-[10px] md:text-xs font-mono text-zinc-300 font-medium leading-none">
                                {new Date(point.date).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-600 hover:text-zinc-300 -mt-1 -mr-1 p-1">
                            <X size={12} className="md:w-3.5 md:h-3.5" />
                        </button>
                     </div>

                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <div className={`p-1 md:p-1.5 rounded-md bg-black/40 border border-white/5`}>
                                <Icon className={`${analysis.textColor} w-3 h-3 md:w-3.5 md:h-3.5`} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[9px] md:text-[10px] font-black uppercase ${analysis.textColor} leading-tight`}>{analysis.label}</span>
                                <span className="text-[7px] md:text-[8px] text-zinc-500 leading-tight">System State</span>
                            </div>
                        </div>
                        <span className={`text-lg md:text-xl font-black leading-none ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {health}
                        </span>
                     </div>
                 </div>

                 {/* --- ZONE B: METRICS --- */}
                 <div className="p-2 md:p-3 bg-[#09090b]">
                     <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
                        <div className="p-1.5 md:p-2 rounded bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                            <div className="flex items-center gap-1 md:gap-1.5 text-zinc-500 mb-0.5 md:mb-1">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                <span className="text-[7px] md:text-[8px] font-bold uppercase">Uptime</span>
                            </div>
                            <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-300 leading-none">{formatUptime(point.uptime)}</div>
                        </div>
                        <div className="p-1.5 md:p-2 rounded bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                            <div className="flex items-center gap-1 md:gap-1.5 text-zinc-500 mb-0.5 md:mb-1">
                                <Coins className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                <span className="text-[7px] md:text-[8px] font-bold uppercase">Credits</span>
                            </div>
                            <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-300 leading-none">{(point.credits || 0).toLocaleString()}</div>
                        </div>
                     </div>

                     {/* --- ZONE B2: PENALTY LOG (RED ZONE) --- */}
                     {hasPenalty && (
                        <div className="mb-2 md:mb-3 p-1.5 md:p-2 rounded bg-rose-950/20 border border-rose-900/50 flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-rose-400 mb-0.5">
                                <Flame className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-wider">Penalty Log</span>
                            </div>

                            {restartPenalty > 0 && (
                                <div className="flex justify-between items-center text-[8px] md:text-[9px] pl-1 border-l border-rose-800/50">
                                    <span className="text-zinc-400">Trauma Impact</span>
                                    <span className="font-mono font-bold text-rose-400">-{restartPenalty} pts</span>
                                </div>
                            )}

                            {consistencyScore < 0.95 && (
                                <div className="flex justify-between items-center text-[8px] md:text-[9px] pl-1 border-l border-rose-800/50">
                                    <span className="text-zinc-400">Consistency</span>
                                    <span className="font-mono font-bold text-amber-500">
                                        {(consistencyScore * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                     )}

                     {/* --- ZONE B3: ISSUES OR OK --- */}
                     {hasIssues ? (
                        <div className="flex flex-wrap gap-1 md:gap-1.5">
                            {displayIssues.map((issue) => (
                                <div key={issue.code} className={`
                                    flex items-center gap-1 px-1.5 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-medium border leading-tight
                                    ${issue.severity === 'critical' ? 'bg-rose-950/30 border-rose-900 text-rose-400' : 
                                      issue.severity === 'warning' ? 'bg-amber-950/30 border-amber-900 text-amber-400' : 
                                      issue.severity === 'success' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 
                                      'bg-blue-950/30 border-blue-900 text-blue-400'}
                                `}>
                                    {issue.severity === 'critical' ? <AlertTriangle className="w-2.5 h-2.5" /> : 
                                     issue.severity === 'success' ? <CheckCircle className="w-2.5 h-2.5" /> : 
                                     <Info className="w-2.5 h-2.5" />}
                                    {issue.title}
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/50 text-emerald-500 text-[8px] md:text-[9px] font-medium leading-tight">
                            <CheckCircle className="w-2.5 h-2.5" />
                            All Systems Operational
                        </div>
                     )}
                 </div>

                 {/* --- ZONE C: CONTEXT FOOTER --- */}
                 {/* Added shrink-0 here too */}
                 <div className="px-2 py-1.5 md:px-3 md:py-2 bg-zinc-900/80 border-t border-zinc-800 shrink-0">
                    {hasIssues ? (
                        <div className="flex flex-col gap-1">
                            {displayIssues.map(issue => (
                                <div key={issue.code} className="flex gap-1.5 items-start">
                                    <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${
                                        issue.severity === 'critical' ? 'bg-rose-500' : 
                                        issue.severity === 'success' ? 'bg-emerald-500' : 
                                        'bg-zinc-500'
                                    }`} />
                                    <span className="text-[8px] md:text-[9px] text-zinc-400 leading-tight">
                                        <span className="text-zinc-300 font-semibold">{issue.title}:</span> {issue.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-1.5 items-start">
                             <span className="mt-1 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                             <span className="text-[8px] md:text-[9px] text-zinc-400 leading-tight">
                                Node is following consensus and earning rewards optimally.
                             </span>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const StabilityRibbon = ({ 
  history, 
  loading, 
  days = 30, 
  timeRange = '30D', 
  color: customColor,
  globalConsensusVersion, 
  globalSortedVersions,
  currentPenalties 
}: StabilityRibbonProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedIdx(null);
      }
    };
    if (selectedIdx !== null) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIdx]);

  const slots = Array.from({ length: days });

  if (loading) return <div className="flex gap-[2px] w-full animate-pulse h-2 md:h-3">{slots.map((_, i) => <div key={i} className="flex-1 bg-zinc-800 rounded-[1px] opacity-20" />)}</div>;

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // First Seen Date
  const firstSeenDate = sortedHistory.length > 0 ? sortedHistory[0].date : new Date().toISOString();

  const startIndex = Math.max(0, sortedHistory.length - days);
  const displayData = sortedHistory.slice(startIndex);

  // --- HELPER: ENRICH POINT WITH LIVE DATA ---
  const enrichPoint = (point: NodeHistoryPoint, index: number, total: number) => {
      if (!point) return point;

      // If this is the very last point in the history array...
      // AND we have current penalties passed down from parent...
      if (index === total - 1 && currentPenalties) {
          return {
              ...point,
              healthBreakdown: {
                  ...(point as any).healthBreakdown,
                  penalties: currentPenalties // <--- INJECTION
              }
          };
      }
      return point;
  };

  const renderTooltip = () => {
      if (selectedIdx === null) return null;
      let point = displayData[selectedIdx];
      if (!point) return null;

      // ENRICH THE POINT BEFORE RENDERING TOOLTIP
      point = enrichPoint(point, selectedIdx, displayData.length);

      const absoluteIndex = startIndex + selectedIdx;
      const startWindow = Math.max(0, absoluteIndex - 5);
      const historyWindow = sortedHistory.slice(startWindow, absoluteIndex);
      const targetTime = new Date(point.date).getTime() - 86400000;
      const refPoint24H = sortedHistory.find(p => {
           const t = new Date(p.date).getTime();
           return t >= targetTime - 3600000 && t <= targetTime + 3600000; 
      });

      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0 left-4"; 
      if (selectedIdx > displayData.length - 5) positionClass = "right-0 translate-x-0 right-4"; 

      return (
        <VitalitySnapshotCard 
            point={point} 
            historyWindow={historyWindow} 
            refPoint24H={refPoint24H}
            globalConsensusVersion={globalConsensusVersion}
            globalSortedVersions={globalSortedVersions}
            firstSeenDate={firstSeenDate} 
            onClose={() => setSelectedIdx(null)} 
            positionClass={positionClass} 
        />
      );
  };

  return (
    <div className="flex flex-col gap-2 w-full relative h-2 md:h-3" ref={containerRef}>
      {renderTooltip()}
      <div className="flex gap-[2px] w-full h-full items-end">
        {slots.map((_, i) => {
          const dataIndex = displayData.length - (days - i);
          let point = displayData[dataIndex];
          const isSelected = selectedIdx === dataIndex;

          let baseColor = '#06b6d4'; 
          let topPin = { show: false, color: '' };
          let bottomPin = { show: false, color: '' };

          if (point) {
             // ENRICH POINT FOR PIN LOGIC
             point = enrichPoint(point, dataIndex, displayData.length);

             const absoluteIndex = startIndex + dataIndex;
             const startWindow = Math.max(0, absoluteIndex - 5);
             const historyWindow = sortedHistory.slice(startWindow, absoluteIndex);
             const targetTime = new Date(point.date).getTime() - 86400000;
             const refPoint24H = sortedHistory.find(p => {
                 const t = new Date(p.date).getTime();
                 return t >= targetTime - 3600000 && t <= targetTime + 3600000;
             });

             const analysis = analyzePointVitality(
                 point, 
                 historyWindow, 
                 refPoint24H, 
                 globalSortedVersions, 
                 globalConsensusVersion, 
                 firstSeenDate
             );

             baseColor = analysis.baseColor;
             topPin = analysis.topPin;
             bottomPin = analysis.bottomPin;

             if (customColor) baseColor = customColor; 
          }

          return (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); point && setSelectedIdx(isSelected ? null : dataIndex); }}
              className={`
                  flex-1 rounded-[1px] relative group h-full transition-all duration-100
                  ${point ? 'cursor-pointer hover:brightness-125' : 'cursor-default opacity-20 bg-zinc-800'}
                  ${isSelected ? 'brightness-125 ring-1 ring-white/50 z-10' : ''}
              `} 
              style={point ? { backgroundColor: baseColor } : {}}
            >
                {topPin.show && <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full shadow-sm ${topPin.color} ring-1 ring-black/10`}></div>}
                {bottomPin.show && <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full shadow-sm ${bottomPin.color} ring-1 ring-black/20`}></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
