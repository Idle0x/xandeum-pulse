import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { 
  X, Clock, Coins, Zap, Activity, AlertTriangle, 
  CheckCircle, ThermometerSun, Crown, Info 
} from 'lucide-react';
import { analyzePointVitality } from '../../../utils/vitalityHelpers';
import { formatUptime } from '../../../utils/formatters';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string; 
}

// --- SUB-COMPONENT: VITALITY SNAPSHOT CARD (Redesigned) ---
const VitalitySnapshotCard = ({ 
  point, 
  historyWindow,
  refPoint24H,
  versionContext,
  onClose,
  positionClass 
}: { 
  point: NodeHistoryPoint, 
  historyWindow: NodeHistoryPoint[],
  refPoint24H: NodeHistoryPoint | undefined,
  versionContext: { allSorted: string[], consensus: string },
  onClose: () => void,
  positionClass: string
}) => {
    const analysis = analyzePointVitality(point, historyWindow, refPoint24H, versionContext);
    const health = point.health || 0;

    // Icon Selection based on Archetype
    const Icon = {
        CRITICAL: AlertTriangle,
        TRAUMA: Zap,
        DRIFT: Activity,
        INCUBATION: ThermometerSun,
        ELITE: Crown,
        ACTIVE: CheckCircle
    }[analysis.archetype] || Activity;

    // Filter issues for display (Max 3 lines to keep it short)
    const displayIssues = analysis.issues.slice(0, 3);
    const hasIssues = displayIssues.length > 0;

    return (
        <div className={`absolute bottom-full mb-3 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
            {/* CONTAINER: Slightly wider for better text fit (w-64 mobile, w-72 desktop) */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-64 md:w-72 relative overflow-hidden flex flex-col">

                 {/* Pointer Arrow */}
                 <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#09090b] border-b border-r border-zinc-800 transform rotate-45 ${positionClass.includes('left-4') ? 'left-4' : positionClass.includes('right-4') ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>

                 {/* --- ZONE A: HEADER --- */}
                 <div className="p-3 border-b border-zinc-800/50 bg-zinc-900/30">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SNAPSHOT</span>
                            <span className="text-xs font-mono text-zinc-300 font-medium">
                                {new Date(point.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-600 hover:text-zinc-300 -mt-1 -mr-1 p-1">
                            <X size={14} />
                        </button>
                     </div>

                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md bg-black/40 border border-white/5`}>
                                <Icon className={`${analysis.textColor} w-4 h-4`} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-xs font-black uppercase ${analysis.textColor} leading-tight`}>{analysis.label}</span>
                                <span className="text-[9px] text-zinc-500">System State</span>
                            </div>
                        </div>
                        <span className={`text-xl font-black ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {health}
                        </span>
                     </div>
                 </div>

                 {/* --- ZONE B: METRICS & DETECTED ISSUES --- */}
                 <div className="p-3 bg-[#09090b]">
                     {/* Basic Metrics Grid */}
                     <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                                <Clock size={10} />
                                <span className="text-[9px] font-bold uppercase">Uptime</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-zinc-300">{formatUptime(point.uptime)}</div>
                        </div>
                        <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                                <Coins size={10} />
                                <span className="text-[9px] font-bold uppercase">Credits</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-zinc-300">{(point.credits || 0).toLocaleString()}</div>
                        </div>
                     </div>

                     {/* The "Middle" Section: List of Technical Titles */}
                     {hasIssues ? (
                        <div className="flex flex-wrap gap-1.5">
                            {displayIssues.map((issue) => (
                                <div key={issue.code} className={`
                                    flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border
                                    ${issue.severity === 'critical' ? 'bg-rose-950/30 border-rose-900 text-rose-400' : 
                                      issue.severity === 'warning' ? 'bg-amber-950/30 border-amber-900 text-amber-400' : 
                                      'bg-blue-950/30 border-blue-900 text-blue-400'}
                                `}>
                                    {issue.severity === 'critical' ? <AlertTriangle size={10} /> : <Info size={10} />}
                                    {issue.title}
                                </div>
                            ))}
                        </div>
                     ) : (
                        // If no issues, show "All Systems Normal"
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-950/20 border border-emerald-900/50 text-emerald-500 text-[10px] font-medium">
                            <CheckCircle size={10} />
                            All Systems Operational
                        </div>
                     )}
                 </div>

                 {/* --- ZONE C: CONTEXT FOOTER (New Requirement) --- */}
                 {/* This explains "What it means" in plain English */}
                 <div className="px-3 py-2 bg-zinc-900/80 border-t border-zinc-800">
                    {hasIssues ? (
                        <div className="flex flex-col gap-1">
                            {displayIssues.map(issue => (
                                <div key={issue.code} className="flex gap-2 items-start">
                                    <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${issue.severity === 'critical' ? 'bg-rose-500' : 'bg-zinc-500'}`} />
                                    <span className="text-[10px] text-zinc-400 leading-tight">
                                        <span className="text-zinc-300 font-semibold">{issue.title}:</span> {issue.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-2 items-start">
                             <span className="mt-1 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                             <span className="text-[10px] text-zinc-400 leading-tight">
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
export const StabilityRibbon = ({ history, loading, days = 30, timeRange = '30D', color: customColor }: StabilityRibbonProps) => {
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

  // --- 1. PRE-CALCULATE VERSION CONTEXT ---
  const versionContext = useMemo(() => {
    if (!history.length) return { allSorted: [], consensus: '' };
    // Extract unique versions from history
    const uniqueVersions = Array.from(new Set(history.map((h: any) => h.healthBreakdown?.version).filter(Boolean)));
    // Sort descending (assuming simple string sort works for your version scheme, otherwise use semver)
    const sorted = uniqueVersions.sort((a: any, b: any) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
    return { allSorted: sorted, consensus: sorted[0] || '' };
  }, [history]);

  const slots = Array.from({ length: days });

  if (loading) return <div className="flex gap-[2px] w-full animate-pulse h-2 md:h-3">{slots.map((_, i) => <div key={i} className="flex-1 bg-zinc-800 rounded-[1px] opacity-20" />)}</div>;

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startIndex = Math.max(0, sortedHistory.length - days);
  const displayData = sortedHistory.slice(startIndex);

  const renderTooltip = () => {
      if (selectedIdx === null) return null;
      const point = displayData[selectedIdx];
      if (!point) return null;

      const absoluteIndex = startIndex + selectedIdx;
      
      // Calculate Window (Last 5 points)
      const startWindow = Math.max(0, absoluteIndex - 5);
      const historyWindow = sortedHistory.slice(startWindow, absoluteIndex);
      
      // Calculate 24H Reference Point
      const targetTime = new Date(point.date).getTime() - 86400000; // 24 hours ago
      const refPoint24H = sortedHistory.find(p => {
           const t = new Date(p.date).getTime();
           return t >= targetTime - 3600000 && t <= targetTime + 3600000; // +/- 1 hour tolerance
      });

      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0 left-4"; 
      if (selectedIdx > displayData.length - 5) positionClass = "right-0 translate-x-0 right-4"; 

      return (
        <VitalitySnapshotCard 
            point={point} 
            historyWindow={historyWindow} 
            refPoint24H={refPoint24H}
            versionContext={versionContext}
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
          const point = displayData[dataIndex];
          const isSelected = selectedIdx === dataIndex;

          let baseColor = '#06b6d4'; 
          let topPin = { show: false, color: '' };
          let bottomPin = { show: false, color: '' };

          if (point) {
             const absoluteIndex = startIndex + dataIndex;
             
             // --- LOGIC PREPARATION ---
             const startWindow = Math.max(0, absoluteIndex - 5);
             const historyWindow = sortedHistory.slice(startWindow, absoluteIndex);
             
             const targetTime = new Date(point.date).getTime() - 86400000;
             const refPoint24H = sortedHistory.find(p => {
                 const t = new Date(p.date).getTime();
                 return t >= targetTime - 3600000 && t <= targetTime + 3600000;
             });

             const analysis = analyzePointVitality(point, historyWindow, refPoint24H, versionContext);

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
                {/* TOP PIN */}
                {topPin.show && (
                    <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full shadow-sm ${topPin.color} ring-1 ring-black/10`}></div>
                )}

                {/* BOTTOM PIN */}
                {bottomPin.show && (
                    <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full shadow-sm ${bottomPin.color} ring-1 ring-black/20`}></div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
