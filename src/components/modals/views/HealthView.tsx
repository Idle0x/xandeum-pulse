import { 
  Activity, Server, Database, Shield, 
  ArrowLeft, HelpCircle, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { Node } from '../../../types';
import { RadialProgress } from '../../RadialProgress';

interface HealthViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  avgNetworkHealth: number;
  medianStorage: number;
  networkStats: any; // This now receives our computed local stats
}

export const HealthView = ({ 
  node, 
  zenMode, 
  onBack, 
  avgNetworkHealth, 
  medianStorage,
  networkStats 
}: HealthViewProps) => {
  
  // Breakdown scores for the specific node
  const bd = node.healthBreakdown || { uptime: 0, version: 0, reputation: 0, storage: 0 };

  // --- SAFE ACCESS TO NETWORK AVERAGES ---
  // We use the new structure 'avgBreakdown' if available, otherwise fallback to 0
  const avgs = networkStats?.avgBreakdown || { 
    uptime: 0, 
    version: 0, 
    reputation: 0, 
    storage: 0,
    total: 0 
  };

  const categories = [
    { 
      id: 'uptime', 
      label: 'UPTIME', 
      score: bd.uptime ?? 0, // Add '?? 0' here
      avg: avgs.uptime, 
      icon: Activity,
      desc: 'Based on 24h heartbeat consistency'
    },
    { 
      id: 'version', 
      label: 'VERSION', 
      score: bd.version ?? 0, // Add '?? 0' here
      avg: avgs.version, 
      icon: Server,
      desc: 'Latest software version adoption'
    },
    { 
      id: 'storage', 
      label: 'STORAGE', 
      score: bd.storage ?? 0, // Add '?? 0' here
      avg: avgs.storage, 
      icon: Database,
      desc: 'Reliability of committed storage'
    },
    { 
      id: 'reputation', 
      label: 'REPUTATION', 
      score: bd.reputation ?? 0, // Add '?? 0' here
      avg: avgs.reputation, 
      icon: Shield,
      desc: 'Historical performance weight'
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button 
          onClick={onBack}
          className={`p-2 rounded-xl border transition ${
            zenMode 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' 
              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className={`text-lg font-black tracking-tight ${zenMode ? 'text-white' : 'text-zinc-100'}`}>
            DIAGNOSTICS BREAKDOWN
          </h3>
          <p className="text-xs text-zinc-500 font-mono">
            Detailed component analysis vs Network Average
          </p>
        </div>
      </div>

      {/* MAIN CONTENT - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        
        {/* TOP SUMMARY CARD */}
        <div className={`p-4 rounded-2xl border flex items-center gap-6 ${
          zenMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-green-900/10 border-green-500/20'
        }`}>
           <div className="relative">
             <RadialProgress score={node.health || 0} size={60} stroke={6} zenMode={zenMode} />
           </div>
           <div>
             <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
               Overall Health
             </div>
             <div className="flex items-baseline gap-2">
               <span className={`text-2xl font-black ${zenMode ? 'text-white' : 'text-green-400'}`}>
                 {node.health || 0}
               </span>
               <span className="text-[10px] font-mono text-zinc-500">
                 / 100
               </span>
             </div>
             <div className="text-[10px] text-zinc-600 mt-1">
               Network Avg: <span className="text-zinc-400">{Math.round(avgs.total)}</span>
             </div>
           </div>
        </div>

        {/* COMPONENT CARDS */}
        {categories.map((cat) => {
          const isAboveAvg = cat.score >= cat.avg;
          const diff = cat.score - cat.avg;
          
          return (
            <div 
              key={cat.id} 
              className={`p-4 rounded-2xl border ${
                zenMode 
                  ? 'bg-zinc-900/20 border-zinc-800' 
                  : 'bg-zinc-900/40 border-zinc-800/60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${zenMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <cat.icon size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase text-zinc-400">
                    {cat.label}
                  </span>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded border ${
                   cat.score >= 80 
                    ? (zenMode ? 'text-white border-zinc-700' : 'text-green-400 border-green-500/20 bg-green-500/10')
                    : (zenMode ? 'text-zinc-400 border-zinc-700' : 'text-orange-400 border-orange-500/20 bg-orange-500/10')
                }`}>
                  {cat.score}
                </div>
              </div>

              {/* Progress Bar Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Your Node</span>
                  <span>{cat.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${zenMode ? 'bg-white' : 'bg-blue-500'}`} 
                    style={{ width: `${cat.score}%` }} 
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-mono text-zinc-600 pt-1">
                  <span>Network Avg</span>
                  <span>{Math.round(cat.avg)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                   {/* Ghost bar for network avg */}
                   <div 
                    className="h-full bg-zinc-600/50 absolute top-0 left-0" 
                    style={{ width: `${cat.avg}%` }} 
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center gap-2">
                 {isAboveAvg ? (
                   <CheckCircle size={10} className={zenMode ? 'text-zinc-500' : 'text-green-500'} />
                 ) : (
                   <AlertTriangle size={10} className={zenMode ? 'text-zinc-500' : 'text-orange-500'} />
                 )}
                 <span className="text-[10px] text-zinc-500">
                   {isAboveAvg ? 'Performing above' : 'Performing below'} network average ({diff > 0 ? '+' : ''}{Math.round(diff)}%)
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
