import { 
  Server, Activity, HardDrive, Zap, Hash, Globe, Cpu, Clock 
} from 'lucide-react';

interface ControlRailProps {
  showNetwork: boolean;
  benchmarks: any;
}

export const ControlRail = ({ showNetwork, benchmarks }: ControlRailProps) => {

  // Helper to match NodeColumn spacing exactly
  const RowLabel = ({ icon: Icon, label, subLabel }: any) => (
    <div className="h-[36px] md:h-[72px] flex flex-col justify-center px-4 relative group">
      <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
        {Icon && <Icon size={10} className="md:w-3.5 md:h-3.5" />}
        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {subLabel && <div className="text-[8px] text-zinc-600 font-mono pl-6 hidden md:block">{subLabel}</div>}
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
        <RowLabel icon={Activity} label="Health Score" subLabel={`AVG ${benchmarks.network?.health || '-'}`} />
        <RowLabel icon={Clock} label="Uptime" subLabel={`AVG ${benchmarks.network?.uptime || '-'}`} />

        <SectionSpacer label="Hardware" />
        <RowLabel icon={HardDrive} label="Capacity" subLabel={`MED ${benchmarks.network?.storage || '-'}`} />
        <RowLabel icon={Cpu} label="Used Space" />

        <SectionSpacer label="Economy" />
        <RowLabel icon={Zap} label="Credits" subLabel={`MED ${benchmarks.network?.credits || '-'}`} />
        <RowLabel icon={Hash} label="Global Rank" />

        {/* 👇 NEW: Stability Label (Matches the new 'cropped' cell in NodeColumn) */}
        <div className="h-[36px] md:h-[50px] flex items-center px-4 bg-zinc-900/20 backdrop-blur-sm mt-1">
           <div className="flex items-center gap-2 text-zinc-500">
              <Activity size={10} className="md:w-3.5 md:h-3.5" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400">30-Day Stability</span>
           </div>
        </div>

        {/* Footer Alignment */}
        <div className="h-[28px] md:h-[32px] border-t border-white/5 bg-[#020202]"></div>
      </div>
    </div>
  );
};
