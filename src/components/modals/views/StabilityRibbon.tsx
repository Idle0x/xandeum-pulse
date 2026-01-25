import React from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string; // NEW: Optional override for thematic coloring
}

export const StabilityRibbon = ({ history, loading, days = 30, timeRange = '30D', color: customColor }: StabilityRibbonProps) => {
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

  const getTooltipLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      // For hourly resolutions, show time
      if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
          return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-[2px] w-full h-2 md:h-3">
        {slots.map((_, i) => {
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];

          let classNameColor = 'bg-zinc-800/50'; 
          const style: React.CSSProperties = {};

          if (point) {
            if (customColor) {
               // If a custom theme color is passed, use it directly
               style.backgroundColor = customColor;
            } else {
               // Default Modal Logic (Red/Yellow/Green)
               if (point.health >= 80) classNameColor = 'bg-green-500';      
               else if (point.health >= 50) classNameColor = 'bg-yellow-500'; 
               else if (point.health >= 0) classNameColor = 'bg-red-500';     
            }
          }

          return (
            <div 
              key={i} 
              className={`flex-1 rounded-[1px] ${!customColor ? classNameColor : ''} ${point ? 'opacity-80 hover:opacity-100 hover:scale-y-125 hover:shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-30'} transition-all duration-200 cursor-help relative group`} 
              style={style}
            >
               {point && <title>{`${getTooltipLabel(point.date)}: ${point.health}% Health`}</title>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
