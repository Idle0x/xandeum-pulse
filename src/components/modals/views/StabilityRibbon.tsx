import React from 'react';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
}

export const StabilityRibbon = ({ history, loading, days = 30 }: StabilityRibbonProps) => {
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

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-[2px] w-full h-2 md:h-3">
        {slots.map((_, i) => {
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];

          let color = 'bg-zinc-800/50'; // Default / Empty

          if (point) {
            if (point.health >= 80) color = 'bg-green-500';      
            else if (point.health >= 50) color = 'bg-yellow-500'; 
            else if (point.health >= 0) color = 'bg-red-500';     
          }

          return (
            <div 
              key={i} 
              className={`flex-1 rounded-[1px] ${color} ${point ? 'opacity-80 hover:opacity-100 hover:scale-y-125 hover:shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-30'} transition-all duration-200 cursor-help relative group`} 
            >
               {/* Tooltip purely via CSS/HTML title for now, ensuring 0 dependencies */}
               {point && <title>{`${new Date(point.date).toLocaleDateString()}: ${point.health}% Health`}</title>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
