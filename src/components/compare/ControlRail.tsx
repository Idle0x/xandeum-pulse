import { Settings2, Shield, Activity, Database, Zap } from 'lucide-react';
import { SectionHeader } from './MicroComponents';

export const ControlRail = ({ showNetwork, leaderMetric, benchmarks }: any) => {
  const Benchmark = ({ label, val, subVal, netLabel }: { label: string, val: string, subVal?: string, netLabel?: string }) => (
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
      {leaderMetric && subVal && (
          <div className="flex justify-between md:justify-start items-center gap-1.5 mt-0.5 md:mt-1 text-yellow-600/80">
              <span className="text-[6px] md:text-[8px] uppercase font-bold border border-yellow-900/40 px-0.5 md:px-1 rounded bg-yellow-900/10">TOP</span>
              <span className="text-[6px] md:text-[9px] font-mono">{subVal}</span>
          </div>
      )}
    </div>
  );

  return (
    <div className="sticky left-0 z-40 bg-[#09090b] border-r border-white/10 w-[100px] md:w-[200px] shrink-0 flex flex-col shadow-[4px_0_24px_-4px_rgba(0,0,0,0.8)] rounded-tl-xl rounded-bl-xl">
      <div className="h-24 md:h-32 border-b border-white/5 p-2 md:p-4 flex flex-col justify-end bg-black rounded-tl-xl">
        <div className="text-[6px] md:text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 md:gap-2"><Settings2 size={8} className="md:w-3 md:h-3" /> METRICS</div>
      </div>

      <div className="bg-transparent">
        <SectionHeader label="IDENTITY" icon={Shield} />
        <Benchmark label="Version" val={benchmarks.network.version} subVal={benchmarks.leader.version} netLabel="LATEST" />
        <Benchmark label="Network" val="-" />

        <SectionHeader label="VITALITY" icon={Activity} />
        <Benchmark label="Health Score" val={benchmarks.network.health} subVal={benchmarks.leader.health} netLabel="AVG" />
        <Benchmark label="Uptime" val={benchmarks.network.uptime} subVal={benchmarks.leader.uptime} netLabel="AVG" />

        <SectionHeader label="HARDWARE" icon={Database} />
        <Benchmark label="Capacity" val={benchmarks.network.storage} subVal={benchmarks.leader.storage} netLabel="MED" />
        <Benchmark label="Used Space" val="-" />

        <SectionHeader label="ECONOMY" icon={Zap} />
        <Benchmark label="Credits" val={benchmarks.network.credits} subVal={benchmarks.leader.credits} netLabel="MED" />
        <Benchmark label="Global Rank" val="-" />

        <div className="h-[28px] md:h-[32px] border-t border-white/5 bg-black/50 rounded-bl-xl"></div>
      </div>
    </div>
  );
};
