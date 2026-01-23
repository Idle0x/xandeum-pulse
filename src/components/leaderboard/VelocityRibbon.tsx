import { useMemo } from 'react';
import { Tooltip } from 'recharts'; // We can reuse Recharts tooltip or simple title

export const VelocityRibbon = ({ history, loading }: { history: any[], loading: boolean }) => {
  
  // Calculate earnings delta day-over-day
  const deltas = useMemo(() => {
      if (!history || history.length < 2) return [];
      
      const earnings = history.map((snap, i) => {
          if (i === 0) return 0; // First point has no delta
          return Math.max(0, snap.credits - history[i-1].credits);
      }).slice(1); // Remove the first "0" point

      // Find max to normalize colors (opacity based on performance)
      const maxEarning = Math.max(...earnings, 1);
      
      return earnings.map(val => ({
          val,
          intensity: val / maxEarning
      }));
  }, [history]);

  if (loading) return (
      <div className="flex gap-[1px] h-full w-full animate-pulse opacity-50">
          {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-1 max-w-[6px] h-full bg-zinc-800 rounded-[1px]"></div>
          ))}
      </div>
  );

  if (deltas.length === 0) return <div className="text-[9px] text-zinc-600 font-mono">No trend data</div>;

  return (
    <div className="flex items-end gap-[1px] h-full w-full overflow-hidden">
        {deltas.map((item, i) => (
            <div 
                key={i}
                className="flex-1 max-w-[6px] rounded-[1px] transition-all hover:scale-y-110 hover:brightness-150 relative group"
                style={{
                    height: '100%', 
                    backgroundColor: item.val > 0 ? '#22c55e' : '#3f3f46', // Green or Zinc
                    opacity: item.val > 0 ? 0.3 + (item.intensity * 0.7) : 0.2 // Variable opacity
                }}
                title={`Day ${i+1}: +${item.val.toLocaleString()} Credits`}
            >
            </div>
        ))}
    </div>
  );
};
