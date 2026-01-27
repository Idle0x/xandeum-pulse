import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { 
  X, Clock, Coins, Minus, Zap, 
  Activity, AlertTriangle, CheckCircle, ThermometerSun
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

// --- SUB-COMPONENT: VITALITY SNAPSHOT CARD (Mobile Optimized) ---
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
    const analysis = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
    const health = point.health || 0;
    
    // Icon Selection based on Archetype
    const Icon = {
        CRITICAL: AlertTriangle,
        TRAUMA: Zap,
        DRIFT: Activity,
        INCUBATION: ThermometerSun,
        PRISTINE: CheckCircle,
        ONLINE: CheckCircle
    }[analysis.archetype] || Activity;

    return (
        <div className={`absolute bottom-full mb-2 md:mb-3 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
            {/* CONTAINER: w-52 on Mobile, w-64 on Desktop */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 md:p-3 w-52 md:w-64 relative backdrop-blur-xl">
                 
                 {/* Pointer Arrow */}
                 <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#09090b] border-b border-r border-zinc-800 transform rotate-45 ${positionClass.includes('left-4') ? 'left-4' : positionClass.includes('right-4') ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>

                 {/* HEADER: Compact Margins */}
                 <div className="flex justify-between items-start mb-1.5 md:mb-3 pb-1.5 md:pb-2 border-b border-zinc-800/50">
                    <div className="flex flex-col">
                        <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-0.5">SNAPSHOT</span>
                        <span className="text-[10px] md:text-xs font-mono text-zinc-300 font-medium leading-none">{new Date(point.date).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-600 hover:text-zinc-300 transition-colors -mt-1 -mr-1 p-1"><X size={12} className="md:w-3.5 md:h-3.5"/></button>
                 </div>

                 {/* ARCHETYPE BANNER: Compact Padding */}
                 <div className="flex items-center justify-between mb-1.5 md:mb-3 bg-zinc-900/50 p-1.5 md:p-2 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className={`p-1 md:p-1.5 rounded-md ${analysis.baseColor} bg-opacity-20 border border-white/5`}>
                            {/* Responsive Icon Size */}
                            <Icon className={`${analysis.textColor} w-3 h-3 md:w-3.5 md:h-3.5`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] md:text-[10px] font-black uppercase ${analysis.textColor} leading-tight`}>{analysis.label}</span>
                            <span className="text-[7px] md:text-[8px] text-zinc-500 leading-tight">System State</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-lg md:text-xl font-black leading-none ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{health}</span>
                    </div>
                 </div>

                 {/* EVENTS: Tiny Tags */}
                 {(analysis.topPin.show || analysis.bottomPin.show) && (
                     <div className="mb-1.5 md:mb-3 flex flex-wrap gap-1">
                         {analysis.topPin.show && (
                             <span className="px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">{analysis.topPin.label || 'Issue'}</span>
                         )}
                         {analysis.bottomPin.show && (
                             <span className="px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">{analysis.bottomPin.label || 'Event'}</span>
                         )}
                     </div>
                 )}

                 {/* METRICS: Denser Grid */}
                 <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    <div className="p-1.5 md:p-2 rounded bg-zinc-900/30 border border-zinc-800/50">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1 text-zinc-500">
                             <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                             <span className="text-[7px] md:text-[8px] font-bold uppercase">Uptime</span>
                        </div>
                        <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-200">{formatUptime(point.uptime)}</div>
                    </div>
                    <div className="p-1.5 md:p-2 rounded bg-zinc-900/30 border border-zinc-800/50">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1 text-zinc-500">
                             <Coins className="w-2.5 h-2.5 md:w-3 md:h-3" />
                             <span className="text-[7px] md:text-[8px] font-bold uppercase">Credits</span>
                        </div>
                        <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-200">{(point.credits || 0).toLocaleString()}</div>
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

  // RESTORED DIMENSIONS: h-2 on mobile (8px), h-3 on desktop (12px)
  if (loading) return <div className="flex gap-[2px] w-full animate-pulse h-2 md:h-3">{slots.map((_, i) => <div key={i} className="flex-1 bg-zinc-800 rounded-[1px] opacity-20" />)}</div>;

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startIndex = Math.max(0, sortedHistory.length - days);
  const displayData = sortedHistory.slice(startIndex);

  const renderTooltip = () => {
      if (selectedIdx === null) return null;
      const point = displayData[selectedIdx];
      if (!point) return null;
      
      const absoluteIndex = startIndex + selectedIdx;
      const prevPoint = sortedHistory[absoluteIndex - 1];
      const oneHourAgoPoint = sortedHistory.find(p => (new Date(point.date).getTime() - new Date(p.date).getTime()) > 3600000);

      // Smart Positioning
      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0 left-4"; 
      if (selectedIdx > displayData.length - 5) positionClass = "right-0 translate-x-0 right-4"; 

      return <VitalitySnapshotCard point={point} prevPoint={prevPoint} oneHourAgoPoint={oneHourAgoPoint} onClose={() => setSelectedIdx(null)} positionClass={positionClass} />;
  };

  return (
    // RESTORED DIMENSIONS: h-2 on mobile (8px), h-3 on desktop (12px)
    <div className="flex flex-col gap-2 w-full relative h-2 md:h-3" ref={containerRef}>
      {renderTooltip()}
      <div className="flex gap-[2px] w-full h-full items-end">
        {slots.map((_, i) => {
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          const isSelected = selectedIdx === dataIndex;
          
          let baseColor = 'bg-zinc-800/30';
          let topPin = { show: false, color: '' };
          let bottomPin = { show: false, color: '' };

          if (point) {
             const absoluteIndex = startIndex + dataIndex;
             const prevPoint = sortedHistory[absoluteIndex - 1];
             const oneHourAgoPoint = sortedHistory.find(p => (new Date(point.date).getTime() - new Date(p.date).getTime()) > 3600000);

             const analysis = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
             
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
                  flex-1 rounded-[1px] relative group h-full transition-all duration-200
                  ${!customColor ? baseColor : ''} 
                  ${point ? 'cursor-pointer hover:opacity-100 hover:scale-y-125 origin-bottom' : 'opacity-20 cursor-default'}
                  ${isSelected ? 'opacity-100 scale-y-125 ring-1 ring-white/50 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-80'}
              `} 
              style={customColor && point ? { backgroundColor: customColor } : {}}
            >
                {/* TOP PIN (Consistency/Reliability) - Floats above */}
                {topPin.show && (
                    <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full shadow-sm ${topPin.color} ring-1 ring-black/10`}></div>
                )}

                {/* BOTTOM PIN (Events) - Floats below */}
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
