import { 
  Server, Activity, HardDrive, Zap, Hash, Globe, Cpu, Clock 
} from 'lucide-react';

interface ControlRailProps {
  showNetwork: boolean;
  benchmarks: any;
}

export const ControlRail = ({ showNetwork, benchmarks }: ControlRailProps) => {

  // Helper to match NodeColumn spacing exactly
  const RowLabel = ({ icon: Icon, label, value }: any) => (
    <div className="h-[36px] md:h-[72px] flex flex-col justify-center px-4 relative group">
      <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
        {Icon && <Icon size={10} className="md:w-3.5 md:h-3.5" />}
        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>
      
      {/* UPDATED PILL DESIGN:
          - Color: Cyan (Neutral Data / System Metric)
          - Font: Larger (md:text-sm) for readability
          - Background: Subtle Cyan Tint
      */}
      {showNetwork && value && (
        <div className="flex items-center mt-1 md:mt-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
           <div className="flex items-center gap-2 px-2 py-0.5 md:py-1 rounded bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <span className="text-[6px] md:text-[10px] font-black text-cyan-700 uppercase tracking-wider">AVG</span>
              <span className="text-[9px] md:text-sm font-mono font-bold text-cyan-400">{value}</span>
           </div>
        </div>
      )}
    </div>
  );

  const SectionSpacer = ({ label }: { label?: string }) => (
    <div className="h-5 md:h-8 flex items-center px-4 mt-1">
      {label && <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{label}</span>}
    </div>
  );

  return (
    <div className="sticky left-0 z-30 flex flex-col min-w-[140px] md:min-w-[200px] border-r border-white/5 bg-[#020202] shadow-[10px_0_30px_rgba(0,0,0,0.5)]">

      {/* HEADER ALIGNMENT */}
      <div className="h-24 md:h-32 p-4 flex flex-col justify-end border-b border-white/5 bg-zinc-900/10 backdrop-blur-md">
         <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Server size={14} />
            <span className="text-xs font-bold uppercase tracking-widest">Metrics</span>
         </div>
      </div>

      {/* METRICS GRID */}
      <div className="relative z-10 bg-[#020202]">
        <SectionSpacer label="Identity" />
        <RowLabel icon={Hash} label="Version" />
        <RowLabel icon={Globe} label="Network" />

        <SectionSpacer label="Vitality" />
        {/* Explicitly passing values to ensure they render */}
        <RowLabel icon={Activity} label="Health Score" value={benchmarks.network?.health} />
        <RowLabel icon={Clock} label="Uptime" value={benchmarks.network?.uptime} />
        
        {/* Stability Label Block */}
        <div className="h-[36px] md:h-[72px] flex flex-col justify-center px-4 relative group">
           <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Activity size={10} className="md:w-3.5 md:h-3.5" />
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">30-Day Stability</span>
           </div>
        </div>

        <SectionSpacer label="Hardware" />
        <RowLabel icon={HardDrive} label="Capacity" value={benchmarks.network?.storage} />
        <RowLabel icon={Cpu} label="Used Space" />

        <SectionSpacer label="Economy" />
        <RowLabel icon={Zap} label="Credits" value={benchmarks.network?.credits} />
        <RowLabel icon={Hash} label="Global Rank" />

        {/* Footer Alignment */}
        <div className="h-[28px] md:h-[32px] border-t border-white/5 bg-[#020202]"></div>
      </div>
    </div>
  );
};
