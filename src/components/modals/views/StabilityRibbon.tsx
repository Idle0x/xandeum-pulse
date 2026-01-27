// --- SUB-COMPONENT: VITALITY SNAPSHOT CARD (The Forensic Tooltip) ---
const VitalitySnapshotCard = ({ 
  point, 
  prevPoint, 
  oneHourAgoPoint, 
  onClose,
  positionClass 
}: { 
  point: NodeHistoryPoint, 
  prevPoint: NodeHistoryPoint | undefined, 
  oneHourAgoPoint: NodeHistoryPoint | undefined,
  onClose: () => void,
  positionClass: string
}) => {
    const analysis = analyzePointVitality(point, prevPoint, oneHourAgoPoint);
    const health = point.health || 0;
    
    // Icon Selection based on Archetype
    const Icon = {
        CRITICAL: AlertTriangle,
        TRAUMA: Zap,
        DRIFT: Activity,
        INCUBATION: ThermometerSun,
        PRISTINE: CheckCircle,
        ONLINE: CheckCircle
    }[analysis.archetype] || Activity;

    return (
        <div className={`absolute bottom-full mb-2 md:mb-3 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
            {/* CONTAINER: w-52 on Mobile, w-64 on Desktop */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 md:p-3 w-52 md:w-64 relative backdrop-blur-xl">
                 
                 {/* Pointer Arrow */}
                 <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#09090b] border-b border-r border-zinc-800 transform rotate-45 ${positionClass.includes('left-4') ? 'left-4' : positionClass.includes('right-4') ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>

                 {/* HEADER: Compact Margins */}
                 <div className="flex justify-between items-start mb-1.5 md:mb-3 pb-1.5 md:pb-2 border-b border-zinc-800/50">
                    <div className="flex flex-col">
                        <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-0.5">SNAPSHOT</span>
                        <span className="text-[10px] md:text-xs font-mono text-zinc-300 font-medium leading-none">{new Date(point.date).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-600 hover:text-zinc-300 transition-colors -mt-1 -mr-1 p-1"><X size={12} className="md:w-3.5 md:h-3.5"/></button>
                 </div>

                 {/* ARCHETYPE BANNER: Compact Padding */}
                 <div className="flex items-center justify-between mb-1.5 md:mb-3 bg-zinc-900/50 p-1.5 md:p-2 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className={`p-1 md:p-1.5 rounded-md ${analysis.baseColor} bg-opacity-20 border border-white/5`}>
                            {/* Responsive Icon Size */}
                            <Icon className={`${analysis.textColor} w-3 h-3 md:w-3.5 md:h-3.5`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] md:text-[10px] font-black uppercase ${analysis.textColor} leading-tight`}>{analysis.label}</span>
                            <span className="text-[7px] md:text-[8px] text-zinc-500 leading-tight">System State</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-lg md:text-xl font-black leading-none ${health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{health}</span>
                    </div>
                 </div>

                 {/* EVENTS: Tiny Tags */}
                 {(analysis.topPin.show || analysis.bottomPin.show) && (
                     <div className="mb-1.5 md:mb-3 flex flex-wrap gap-1">
                         {analysis.topPin.show && (
                             <span className="px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">{analysis.topPin.label || 'Issue'}</span>
                         )}
                         {analysis.bottomPin.show && (
                             <span className="px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">{analysis.bottomPin.label || 'Event'}</span>
                         )}
                     </div>
                 )}

                 {/* METRICS: Denser Grid */}
                 <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    <div className="p-1.5 md:p-2 rounded bg-zinc-900/30 border border-zinc-800/50">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1 text-zinc-500">
                             <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                             <span className="text-[7px] md:text-[8px] font-bold uppercase">Uptime</span>
                        </div>
                        <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-200">{formatUptime(point.uptime)}</div>
                    </div>
                    <div className="p-1.5 md:p-2 rounded bg-zinc-900/30 border border-zinc-800/50">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1 text-zinc-500">
                             <Coins className="w-2.5 h-2.5 md:w-3 md:h-3" />
                             <span className="text-[7px] md:text-[8px] font-bold uppercase">Credits</span>
                        </div>
                        <div className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-200">{(point.credits || 0).toLocaleString()}</div>
                    </div>
                 </div>
            </div>
        </div>
    );
};
