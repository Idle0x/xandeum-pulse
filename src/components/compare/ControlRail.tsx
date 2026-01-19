import { Settings2, Shield, Activity, Database, Zap } from 'lucide-react';
import { SectionHeader } from './MicroComponents';

// Interface simplified: No more 'leaderMetric' or 'leader' data props needed
interface ControlRailProps {
  showNetwork: boolean;
  benchmarks: any;
}

export const ControlRail = ({ showNetwork, benchmarks }: ControlRailProps) => {
  
  // Cleaned up Benchmark component: Removes the secondary "subVal" logic
  const Benchmark = ({ label, val, netLabel }: { label: string, val: string, netLabel?: string }) => (
    <div className="flex flex-col justify-center h-[36px] md:h-[72px] border-b border-white/5 px-2 md:px-4">
      <div className="flex justify-between md:items-center">
        <span className="text-[6px] md:text-xs text-zinc-500 font-bold uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1 md:gap-2">
            {showNetwork && netLabel && (
                <span className="text-[5px] md:text-[9px] font-bold text-pink-500/70 uppercase tracking-wider">{netLabel}</span>
            )}
            <span className={`text-[6px] md:text-xs font-mono ${showNetwork ? 'text-pink-500/70' : 'text-zinc-300'}`}>{showNetwork ? val : '-'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b] border-r border-white/10 w-[100px] md:w-[200px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)] rounded-tl-xl rounded-bl-xl">
      {/* Top Header */}
      <div className="h-24 md:h-32 border-b border-white/5 p-2 md:p-4 flex flex-col justify-end bg-black rounded-tl-xl">
        <div className="text-[6px] md:text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 md:gap-2"><Settings2 size={8} className="md:w-3 md:h-3" /> METRICS</div>
      </div>

      <div className="bg-transparent">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <Benchmark label="Version" val={benchmarks.network.version} netLabel="LATEST" />
        <Benchmark label="Network" val="-" />

        <SectionHeader label="VITALITY" icon={Activity} />
        <Benchmark label="Health Score" val={benchmarks.network.health} netLabel="AVG" />
        <Benchmark label="Uptime" val={benchmarks.network.uptime} netLabel="AVG" />

        <SectionHeader label="HARDWARE" icon={Database} />
        <Benchmark label="Capacity" val={benchmarks.network.storage} netLabel="MED" />
        <Benchmark label="Used Space" val="-" />

        <SectionHeader label="ECONOMY" icon={Zap} />
        <Benchmark label="Credits" val={benchmarks.network.credits} netLabel="MED" />
        <Benchmark label="Global Rank" val="-" />

        {/* Bottom Spacer to match the trashcan height in NodeColumn */}
        <div className="h-[28px] md:h-[32px] border-t border-white/5 bg-black/50 rounded-bl-xl"></div>
      </div>
    </div>
  );
};
