import React from 'react';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number;
}

export const StabilityRibbon = ({ history, loading, days = 30 }: StabilityRibbonProps) => {
  // Create an array of size 'days' to represent the timeline slots
  const slots = Array.from({ length: days });

  if (loading) {
    return (
      <div className="flex gap-0.5 w-full animate-pulse">
        {slots.map((_, i) => (
          <div key={i} className="flex-1 h-2 bg-zinc-800 rounded-sm" />
        ))}
      </div>
    );
  }

  // Normalize history to slots (simplified logic: take the last N snapshots)
  // In a real prod app, you might map exact dates. Here we just take the recent sequence.
  const displayData = history.slice(-days);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">30-Day Stability Map</span>
         <span className="text-[9px] font-mono text-zinc-600">{displayData.length} Snapshots</span>
      </div>
      <div className="flex gap-[2px] w-full h-3">
        {slots.map((_, i) => {
          // Fill from the end backwards
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          
          let color = 'bg-zinc-900'; // Default / Empty
          
          if (point) {
            if (point.health >= 80) color = 'bg-green-500';
            else if (point.health >= 50) color = 'bg-yellow-500';
            else if (point.health >= 0) color = 'bg-red-500';
          }

          return (
            <div 
              key={i} 
              className={`flex-1 rounded-[1px] ${color} opacity-80 hover:opacity-100 hover:scale-y-125 transition-all duration-200`} 
              title={point ? `Date: ${new Date(point.date).toLocaleDateString()} | Health: ${point.health}` : 'No Data'}
            />
          );
        })}
      </div>
    </div>
  );
};
