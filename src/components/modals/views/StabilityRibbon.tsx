import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { 
  X, TrendingUp, TrendingDown, Minus, RefreshCw, Activity, 
  WifiOff, Wifi, ThermometerSun, AlertTriangle, Database, Coins, Clock 
} from 'lucide-react';
import { analyzePointVitality } from '../../../utils/vitalityHelpers';
import { formatBytes, formatUptime } from '../../../utils/formatters';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string; 
}

// --- SUB-COMPONENT: VITALITY SNAPSHOT CARD (The Forensic Tooltip) ---
const VitalitySnapshotCard = ({ 
  point, 
  prevPoint, 
  oneHourAgoPoint, 
  onClose,
  positionClass 
}: { 
  point: NodeHistoryPoint, 
  prevPoint: NodeHistoryPoint | undefined, 
  oneHourAgoPoint: NodeHistoryPoint | undefined,
  onClose: () => void,
  positionClass: string
}) => {
    // 1. Forensic Analysis
    const vitality = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
    
    // 2. Calculations & Trends
    const health = point.health || 0;
    const prevHealth = prevPoint?.health || 0;
    const healthDelta = health - prevHealth;

    const credits = point.credits || 0;
    const prevCredits = prevPoint?.credits || 0;
    const creditDelta = credits - prevCredits; // Velocity

    const storage = point.storage_committed || 0;
    const prevStorage = prevPoint?.storage_committed || 0;
    const storageDelta = storage - prevStorage;

    const Icon = {
        OFFLINE: WifiOff,
        STAGNANT: Activity,
        UNSTABLE: AlertTriangle,
        WARMUP: ThermometerSun,
        ONLINE: Wifi
    }[vitality.state] || Wifi;

    // Helper for Trend Rendering
    const Trend = ({ val, unit = '', inverse = false }: { val: number, unit?: string, inverse?: boolean }) => {
        if (val === 0) return <span className="text-zinc-600 ml-1"><Minus size={8} /></span>;
        const isPos = val > 0;
        const isGood = inverse ? !isPos : isPos; // For uptime/restarts, logic might differ, but generally + is green
        const color = isGood ? 'text-emerald-400' : 'text-rose-400';
        const Icon = isPos ? TrendingUp : TrendingDown;
        return (
            <span className={`flex items-center gap-0.5 ml-1.5 text-[9px] font-bold ${color}`}>
                <Icon size={8} />
                {Math.abs(val).toLocaleString()}{unit}
            </span>
        );
    };

    return (
        <div className={`absolute bottom-full mb-2.5 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-3 w-64 relative backdrop-blur-xl">
                 {/* Pointer Arrow */}
                 <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#09090b] border-b border-r border-zinc-800 transform rotate-45 ${positionClass.includes('left-4') ? 'left-4' : positionClass.includes('right-4') ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>

                 {/* Header: Date & Close */}
                 <div className="flex justify-between items-start mb-3 pb-2 border-b border-zinc-800/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">HISTORICAL SNAPSHOT</span>
                        <span className="text-xs font-mono text-zinc-300 font-medium">
                            {new Date(point.date).toLocaleString(undefined, { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                        </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-600 hover:text-zinc-300 transition-colors"><X size={12}/></button>
                 </div>

                 {/* VITALITY SCORE HEADER */}
                 <div className="flex items-center justify-between mb-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${vitality.color} bg-opacity-20 border border-white/5`}>
                            <Icon size={14} className={vitality.textColor} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase ${vitality.textColor}`}>{vitality.label}</span>
                            <span className="text-[8px] text-zinc-500 font-medium">System Status</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className={`text-xl font-black ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {health}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500">/100</span>
                        </div>
                        {healthDelta !== 0 && (
                            <div className={`text-[8px] font-bold text-right ${healthDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {healthDelta > 0 ? '+' : ''}{healthDelta} pts
                            </div>
                        )}
                    </div>
                 </div>

                 {/* VECTOR GRID */}
                 <div className="grid grid-cols-2 gap-2">
                    
                    {/* 1. ECONOMY (Credits) */}
                    <div className="p-2 rounded bg-zinc-900/30 border border-zinc-800/50 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
                            <Coins size={10} />
                            <span className="text-[8px] font-bold uppercase tracking-wide">Economy</span>
                        </div>
                        <div>
                            <div className="text-[11px] font-mono font-bold text-zinc-200">
                                {credits.toLocaleString()}
                            </div>
                            <div className="flex items-center mt-0.5">
                                <span className="text-[8px] text-zinc-600 font-medium uppercase">Delta</span>
                                <Trend val={creditDelta} />
                            </div>
                        </div>
                    </div>

                    {/* 2. STORAGE (Committed) */}
                    <div className="p-2 rounded bg-zinc-900/30 border border-zinc-800/50 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
                            <Database size={10} />
                            <span className="text-[8px] font-bold uppercase tracking-wide">Storage</span>
                        </div>
                        <div>
                            <div className="text-[11px] font-mono font-bold text-zinc-200">
                                {formatBytes(storage)}
                            </div>
                            <div className="flex items-center mt-0.5">
                                <span className="text-[8px] text-zinc-600 font-medium uppercase">Delta</span>
                                <Trend val={storageDelta} />
                            </div>
                        </div>
                    </div>

                    {/* 3. OPERATIONS (Uptime) */}
                    <div className="col-span-2 p-2 rounded bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between">
                         <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
                                <Clock size={10} />
                                <span className="text-[8px] font-bold uppercase tracking-wide">Session Uptime</span>
                            </div>
                            <div className="text-[11px] font-mono font-bold text-zinc-200">
                                {formatUptime(point.uptime)}
                            </div>
                         </div>
                         {/* Restart Indicator */}
                         {vitality.state === 'UNSTABLE' || vitality.state === 'WARMUP' ? (
                             <div className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase flex items-center gap-1">
                                <RefreshCw size={8} /> Restart Detected
                             </div>
                         ) : (
                             <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase flex items-center gap-1">
                                <Activity size={8} /> Stable Pulse
                             </div>
                         )}
                    </div>

                 </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export const StabilityRibbon = ({ history, loading, days = 30, timeRange = '30D', color: customColor }: StabilityRibbonProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Dismissal
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

  if (loading) {
    return (
      <div className="flex gap-[2px] w-full animate-pulse h-2 md:h-3">
        {slots.map((_, i) => (
          <div key={i} className="flex-1 bg-zinc-800 rounded-[1px] opacity-20" />
        ))}
      </div>
    );
  }

  // Sort Chronologically
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Slice for View Window
  const startIndex = Math.max(0, sortedHistory.length - days);
  const displayData = sortedHistory.slice(startIndex);

  // Render Tooltip Logic
  const renderTooltip = () => {
      if (selectedIdx === null) return null;
      const pointIndex = selectedIdx; 
      const point = displayData[pointIndex];
      
      const absoluteIndex = startIndex + pointIndex;
      const prevPoint = sortedHistory[absoluteIndex - 1];

      // Context Lookups
      const pointTime = new Date(point.date).getTime();
      const oneHourAgoPoint = sortedHistory.find(p => {
          const t = new Date(p.date).getTime();
          return (pointTime - t) > 3600000 && (pointTime - t) < 4000000;
      });

      if (!point) return null;

      // Smart Positioning
      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0 left-4"; 
      if (selectedIdx > displayData.length - 5) positionClass = "right-0 translate-x-0 right-4"; 

      return (
          <VitalitySnapshotCard 
             point={point} 
             prevPoint={prevPoint} 
             oneHourAgoPoint={oneHourAgoPoint}
             onClose={() => setSelectedIdx(null)}
             positionClass={positionClass}
          />
      );
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      
      {/* TOOLTIP LAYER */}
      {renderTooltip()}

      {/* INTERACTIVE RIBBON */}
      <div className="flex gap-[2px] w-full h-2 md:h-3 items-end">
        {slots.map((_, i) => {
          // Right-Align Logic
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          const isSelected = selectedIdx === dataIndex;

          let finalColor = 'bg-zinc-800/30';
          let heightClass = 'h-full';
          let isEvent = false;

          if (point) {
             const absoluteIndex = startIndex + dataIndex;
             const prevPoint = sortedHistory[absoluteIndex - 1];
             const pointTime = new Date(point.date).getTime();
             const oneHourAgoPoint = sortedHistory.find(p => (pointTime - new Date(p.date).getTime()) > 3600000);

             const vitality = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
             finalColor = vitality.color;

             // Visual Height Variation based on Score (Vitality Density)
             // Score < 50 = 60% height, Score > 80 = 100% height
             // This gives a subtle "skyline" effect where dips are visible
             if (point.health < 50) heightClass = 'h-[60%]';
             else if (point.health < 80) heightClass = 'h-[80%]';

             // Event Marker Logic
             if (vitality.state === 'UNSTABLE' || vitality.state === 'WARMUP') isEvent = true;

             if (customColor) finalColor = customColor; 
          }

          const style: React.CSSProperties = {};
          if (customColor && point) style.backgroundColor = customColor;

          return (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); point && setSelectedIdx(isSelected ? null : dataIndex); }}
              className={`
                  flex-1 rounded-[1px] transition-all duration-300 relative group
                  ${!customColor ? finalColor : ''} 
                  ${heightClass}
                  ${point ? 'cursor-pointer hover:opacity-100 hover:scale-y-125 origin-bottom' : 'opacity-20 cursor-default'}
                  ${isSelected ? 'opacity-100 scale-y-125 ring-1 ring-white/50 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-80'}
              `} 
              style={style}
            >
                {/* Micro Event Dot */}
                {isEvent && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-[2px] h-[2px] bg-white rounded-full shadow-sm animate-pulse"></div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
