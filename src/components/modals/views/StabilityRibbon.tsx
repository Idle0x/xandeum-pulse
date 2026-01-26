import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

  const displayData = history.slice(-days);

  // --- SMART FORMATTERS ---
  const formatHealth = (val: number) => Number(val.toFixed(2)); // Strips trailing zeros (98.50 -> 98.5)

  const getDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
          return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // --- RENDER SELECTED TOOLTIP ---
  const renderTooltip = () => {
      if (selectedIdx === null) return null;

      // Map loop index to data index
      // The loop goes 0..days-1 (Left to Right)
      // The data array might be smaller than 'days', so we align to the end
      const dataIndex = displayData.length - (days - selectedIdx);
      const point = displayData[dataIndex];
      const prevPoint = displayData[dataIndex - 1]; // For trend

      if (!point) return null;

      // Trend Logic
      const diff = prevPoint ? point.health - prevPoint.health : 0;
      const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
      const trendColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-500';

      // Edge Detection for Positioning
      // If close to left edge (index < 3), align left. If right edge, align right.
      let positionClass = "-translate-x-1/2 left-1/2"; // Default Center
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0"; // Left Align
      if (selectedIdx > days - 5) positionClass = "right-0 translate-x-0"; // Right Align

      return (
          <div className={`absolute bottom-full mb-2 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 w-48 relative">
                  {/* Arrow Pointer */}
                  <div className={`absolute -bottom-1.5 w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 transform rotate-45 ${selectedIdx < 4 ? 'left-4' : selectedIdx > days - 5 ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>
                  
                  <div className="relative z-10 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SNAPSHOT</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(null); }} className="text-zinc-500 hover:text-white"><X size={12}/></button>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-2xl font-black ${point.health >= 80 ? 'text-green-400' : point.health >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {formatHealth(point.health)}
                          </span>
                          <span className="text-xs font-bold text-zinc-500">%</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-1">
                          <div className={`flex items-center gap-1 text-[9px] font-bold ${trendColor} bg-white/5 px-1.5 py-0.5 rounded`}>
                              <TrendIcon size={10} />
                              {diff > 0 ? '+' : ''}{formatHealth(diff)}
                          </div>
                          <span className="text-[9px] font-mono text-zinc-400 ml-auto">
                              {getDateLabel(point.date)}
                          </span>
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
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          const isSelected = selectedIdx === i;

          let classNameColor = 'bg-zinc-800/50'; 
          const style: React.CSSProperties = {};

          if (point) {
            if (customColor) {
               style.backgroundColor = customColor;
            } else {
               if (point.health >= 80) classNameColor = 'bg-green-500';      
               else if (point.health >= 50) classNameColor = 'bg-yellow-500'; 
               else if (point.health >= 0) classNameColor = 'bg-red-500';     
            }
          }

          return (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); point && setSelectedIdx(isSelected ? null : i); }}
              className={`
                  flex-1 rounded-[1px] transition-all duration-200 relative group
                  ${!customColor ? classNameColor : ''} 
                  ${point ? 'cursor-pointer hover:opacity-100 hover:scale-y-150 origin-bottom' : 'opacity-30 cursor-default'}
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
