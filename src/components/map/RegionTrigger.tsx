import React from 'react';
import { BarChart3 } from 'lucide-react';
import { CountryAggregated } from '../../types/map';

interface RegionTriggerProps {
  countryBreakdown: CountryAggregated[];
  onClick: () => void;
  className?: string;
}

export const RegionTrigger: React.FC<RegionTriggerProps> = ({ countryBreakdown, onClick, className = "" }) => {
  const topFlags = countryBreakdown.slice(0, 3).map(c => c.code.toLowerCase());
  const count = Math.max(0, countryBreakdown.length - 3);

  return (
    <button 
      onClick={onClick}
      className={`relative overflow-hidden bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500/50 rounded-xl px-3 py-2 transition-all cursor-pointer group items-center gap-3 backdrop-blur-md shadow-lg ${className}`}
    >
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scanner pointer-events-none" />

      <div className="flex -space-x-2 relative z-10">
        {topFlags.map(code => (
          <div key={code} className="w-5 h-5 rounded-full border border-zinc-900 overflow-hidden relative z-0 group-hover:z-10 transition-all shadow-sm">
            <img src={`https://flagcdn.com/w40/${code}.png`} className="w-full h-full object-cover" alt="flag" />
          </div>
        ))}
      </div>
      <div className="text-xs font-bold text-zinc-300 group-hover:text-white flex items-center gap-1 relative z-10 whitespace-nowrap">
        <span>+{count} Regions Active</span>
        <BarChart3 size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
      </div>
    </button>
  );
};
