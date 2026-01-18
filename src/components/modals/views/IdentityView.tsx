import { useState } from 'react';
import { ArrowLeft, Check, Copy, CheckCircle, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, getSafeVersion, compareVersions } from '../../../utils/nodeHelpers';
import { formatUptime } from '../../../utils/formatters';

interface IdentityViewProps {
  node: Node;
  nodes: Node[]; 
  zenMode: boolean;
  onBack: () => void;
  mostCommonVersion: string;
}

export const IdentityView = ({ node, zenMode, onBack, mostCommonVersion }: IdentityViewProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  // --- STATUS LOGIC ---
  const getStatus = (lastSeen: number) => {
    if (!lastSeen) return 'OFFLINE';
    const now = Date.now();
    const diffMs = now - (lastSeen * 1000); // last_seen is usually seconds
    
    // < 20 Minutes = ONLINE
    if (diffMs < 20 * 60 * 1000) return 'ONLINE';
    // < 3 Days = SYNCING
    if (diffMs < 3 * 24 * 60 * 60 * 1000) return 'SYNCING';
    // > 3 Days = OFFLINE
    return 'OFFLINE';
  };

  const status = getStatus(node.last_seen_timestamp || 0);

  // Status Styling
  const statusConfig = {
      ONLINE: { color: 'text-green-500', icon: Wifi, bg: 'bg-green-500/10 border-green-500/20' },
      SYNCING: { color: 'text-orange-500', icon: RefreshCw, bg: 'bg-orange-500/10 border-orange-500/20' },
      OFFLINE: { color: 'text-zinc-500', icon: WifiOff, bg: 'bg-zinc-900 border-zinc-800' }
  }[status];

  // Helper Card Component
  const FieldCard = ({ 
      label, val, id, color, icon: Icon, fullWidth = false, statusBadge 
  }: { 
      label: string, val: string, id?: string, color?: string, icon?: any, fullWidth?: boolean, statusBadge?: React.ReactNode 
  }) => (
    <div className={`relative group p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${fullWidth ? 'col-span-2' : 'col-span-1'} ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/60'}`}>
        <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">{label}</span>
            {Icon && <Icon size={12} className="text-zinc-600" />}
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
             {statusBadge ? (
                 statusBadge
             ) : (
                <div className={`font-mono text-xs md:text-sm font-bold truncate ${zenMode ? 'text-zinc-200' : (color || 'text-zinc-200')}`}>
                    {val}
                </div>
             )}
             
             {id && (
                 <button 
                    onClick={() => copyToClipboard(val, id)} 
                    className={`p-1.5 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        copiedField === id 
                        ? (zenMode ? 'bg-white text-black border-white' : 'bg-green-500/10 border-green-500/50 text-green-500') 
                        : (zenMode ? 'bg-black border-zinc-800 text-zinc-500 hover:text-white' : 'bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')
                    }`}
                 >
                    {copiedField === id ? <Check size={12} /> : <Copy size={12} />}
                 </button>
             )}
        </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col ${zenMode ? '' : 'animate-in fade-in slide-in-from-right-2 duration-300'}`}>

      <div className="flex justify-end items-center mb-4 shrink-0 md:hidden">
        <button onClick={onBack} className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-800'}`}>
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col justify-between overflow-y-auto custom-scrollbar pr-1">

        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-2 gap-3">
             
             {/* ROW 1: Public Key (Full Width) */}
             <FieldCard 
                label="Public Key" 
                val={node?.pubkey || 'Unknown'} 
                id="pubkey" 
                fullWidth 
             />

             {/* ROW 2: IP Address & Version */}
             <FieldCard 
                label="IP Address" 
                val={getSafeIp(node)} 
                id="ip" 
             />
             <FieldCard 
                label="Node Version" 
                val={getSafeVersion(node)} 
                color={isLatest ? 'text-green-400' : 'text-orange-400'}
                id="version" 
             />

             {/* ROW 3: Uptime & Status */}
             <FieldCard 
                label="Current Uptime" 
                val={formatUptime(node?.uptime)} 
                color="text-zinc-300"
                id="uptime"
             />
             
             {/* Custom Status Card */}
             <div className={`relative group p-3 rounded-xl border transition-all duration-300 col-span-1 flex flex-col justify-between ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'}`}>
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Status</span>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border w-fit ${zenMode ? 'bg-zinc-800 border-zinc-700 text-white' : statusConfig.bg}`}>
                    <statusConfig.icon size={12} className={zenMode ? 'text-white' : statusConfig.color} />
                    <span className={`text-[10px] font-bold uppercase ${zenMode ? 'text-white' : statusConfig.color}`}>{status}</span>
                </div>
             </div>
             
             {/* Extra: RPC (Full Width at bottom if needed, or omit if you want cleaner look. I kept it separate or we can remove it) */}
             <FieldCard 
                label="RPC Endpoint" 
                val={`http://${getSafeIp(node)}:6000`} 
                id="rpc" 
                fullWidth
             />
        </div>

        {/* STATUS FOOTER (Version Consensus) */}
        <div className={`mt-4 p-4 rounded-xl border flex items-center gap-4 relative overflow-hidden ${zenMode ? 'bg-black border-zinc-700' : (isLatest ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30')}`}>
          {!zenMode && <div className={`absolute inset-0 opacity-10 ${isLatest ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500 to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 to-transparent'}`}></div>}

          <div className={`p-2 rounded-full ${zenMode ? 'bg-zinc-800 text-zinc-200' : (isLatest ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500')}`}>
              {isLatest ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="relative z-10">
            <div className={`text-xs font-black uppercase tracking-wide ${zenMode ? 'text-white' : (isLatest ? 'text-green-400' : 'text-orange-400')}`}>
                {isLatest ? 'System Up to Date' : 'Update Recommended'}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Network Consensus: <span className="font-mono text-zinc-300 bg-black/30 px-1.5 rounded">{mostCommonVersion}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};
