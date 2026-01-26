import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { X, TrendingUp, TrendingDown, Minus, RefreshCw, Activity, WifiOff, Wifi, ThermometerSun, AlertTriangle } from 'lucide-react';
import { analyzePointVitality } from '../../../utils/vitalityHelpers';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string; 
}

export const StabilityRibbon = ({ history, loading, days = 30, timeRange = '30D', color: customColor }: StabilityRibbonProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. GLOBAL DISMISSAL (Click Outside) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedIdx(null);
      }
    };

    if (selectedIdx !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  // Sort history chronologically (Oldest -> Newest) to iterate correctly
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // We need the last N days (slots), but we need the FULL history available to look up context (like 1 hour ago)
  // So we don't just slice the array yet. We calculate indices.
  const startIndex = Math.max(0, sortedHistory.length - days);
  const displayData = sortedHistory.slice(startIndex);

  // --- HELPERS ---
  const formatHealth = (val: number) => Number(val.toFixed(2));

  const getDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
          return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // --- ICON MAPPING ---
  const StateIcons = {
      OFFLINE: WifiOff,
      STAGNANT: Activity,
      UNSTABLE: AlertTriangle,
      WARMUP: ThermometerSun,
      ONLINE: Wifi
  };

  // --- RENDER SELECTED TOOLTIP ---
  const renderTooltip = () => {
      if (selectedIdx === null) return null;

      // Map ribbon slot index to the actual data point
      const pointIndex = selectedIdx; // displayData is already sliced to match slots
      const point = displayData[pointIndex];
      
      // We need to look up context from the FULL sortedHistory
      // The point in displayData[i] corresponds to sortedHistory[startIndex + i]
      const absoluteIndex = startIndex + pointIndex;
      const prevPoint = sortedHistory[absoluteIndex - 1];

      // Find ~1 hour ago point for stagnation check
      const pointTime = new Date(point.date).getTime();
      const oneHourAgoPoint = sortedHistory.find(p => {
          const t = new Date(p.date).getTime();
          return (pointTime - t) > 3600000 && (pointTime - t) < 4000000; // Look for approx 1h window
      });

      if (!point) return null;

      // Run Forensic Analysis
      const vitality = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
      const Icon = StateIcons[vitality.state as keyof typeof StateIcons];

      // Trend Calculation
      const diff = prevPoint ? point.health - prevPoint.health : 0;
      const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
      const trendColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-500';

      // Edge Positioning
      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0"; 
      if (selectedIdx > days - 5) positionClass = "right-0 translate-x-0"; 

      return (
          <div className={`absolute bottom-full mb-2 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 w-56 relative">
                  <div className={`absolute -bottom-1.5 w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 transform rotate-45 ${selectedIdx < 4 ? 'left-4' : selectedIdx > days - 5 ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>
                  
                  <div className="relative z-10 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SNAPSHOT</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(null); }} className="text-zinc-500 hover:text-white"><X size={12}/></button>
                      </div>

                      {/* Health Score */}
                      <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black ${point.health >= 80 ? 'text-green-400' : point.health >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {formatHealth(point.health)}
                          </span>
                          <span className="text-xs font-bold text-zinc-500">%</span>
                      </div>

                      {/* Forensic State Badge */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/5 bg-white/5 ${vitality.textColor}`}>
                              <Icon size={10} />
                              <span className="text-[9px] font-black uppercase">{vitality.label}</span>
                          </div>

                          <div className={`flex items-center gap-1 text-[9px] font-bold ${trendColor}`}>
                              <TrendIcon size={10} />
                              {diff > 0 ? '+' : ''}{formatHealth(diff)}
                          </div>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-500 text-right mt-0.5">
                          {getDateLabel(point.date)}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      
      {/* TOOLTIP LAYER */}
      {renderTooltip()}

      {/* INTERACTIVE RIBBON */}
      <div className="flex gap-[2px] w-full h-2 md:h-3">
        {slots.map((_, i) => {
          // Align slots to the END of the data array (Right Aligned)
          // If we have 10 data points and 30 slots, the first 20 slots are empty.
          // slot 0 -> data[length - 30] (undefined)
          // slot 29 -> data[length - 1] (last point)
          
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          const isSelected = selectedIdx === i;

          let finalColor = 'bg-zinc-800/30';
          
          if (point) {
             const absoluteIndex = startIndex + dataIndex;
             const prevPoint = sortedHistory[absoluteIndex - 1];
             
             // Look up 1-hour context for coloring logic
             const pointTime = new Date(point.date).getTime();
             const oneHourAgoPoint = sortedHistory.find(p => {
                  const t = new Date(p.date).getTime();
                  return (pointTime - t) > 3600000 && (pointTime - t) < 4000000;
             });

             const vitality = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
             
             finalColor = vitality.color;
             if (customColor) finalColor = customColor; 
          }

          const style: React.CSSProperties = {};
          if (customColor && point) style.backgroundColor = customColor;

          return (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); point && setSelectedIdx(isSelected ? null : i); }}
              className={`
                  flex-1 rounded-[1px] transition-all duration-200 relative group
                  ${!customColor ? finalColor : ''} 
                  ${point ? 'cursor-pointer hover:opacity-100 hover:scale-y-150 origin-bottom' : 'opacity-20 cursor-default'}
                  ${isSelected ? 'opacity-100 scale-y-150 ring-1 ring-white/50 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-80'}
              `} 
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
};
