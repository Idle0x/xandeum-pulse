import React from 'react';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; // Configurable length (e.g. 15 for Compare, 30 for Inspector)
}

export const StabilityRibbon = ({ history, loading, days = 30 }: StabilityRibbonProps) => {
  // Create an array of size 'days' to represent the timeline slots
  const slots = Array.from({ length: days });

  // 1. Loading State: A row of pulsing blocks
  if (loading) {
    return (
      <div className="flex gap-0.5 w-full animate-pulse">
        {slots.map((_, i) => (
          <div key={i} className="flex-1 h-2 bg-zinc-800 rounded-sm" />
        ))}
      </div>
    );
  }

  // 2. Logic: Normalize history to slots
  // We take the last N snapshots. 
  // (In a future polish, this could map specific dates to handle missing days more strictly)
  const displayData = history.slice(-days);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{days}-Day Stability Map</span>
         <span className="text-[9px] font-mono text-zinc-600">{displayData.length} Snapshots</span>
      </div>
      <div className="flex gap-[2px] w-full h-3">
        {slots.map((_, i) => {
          // Fill from the end backwards (Right is "Now", Left is "Past")
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          
          let color = 'bg-zinc-900'; // Default / Empty (No Data)
          
          if (point) {
            if (point.health >= 80) color = 'bg-green-500';      // Excellent
            else if (point.health >= 50) color = 'bg-yellow-500'; // Warning
            else if (point.health >= 0) color = 'bg-red-500';     // Critical/Offline
          }

          return (
            <div 
              key={i} 
              className={`flex-1 rounded-[1px] ${color} opacity-80 hover:opacity-100 hover:scale-y-125 transition-all duration-200 cursor-help`} 
              title={point ? `Date: ${new Date(point.date).toLocaleDateString()} | Health: ${point.health}` : 'No Data'}
            />
          );
        })}
      </div>
    </div>
  );
};
