import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Copy, CheckCircle, AlertTriangle, Wifi, WifiOff, RefreshCw, Calendar, Activity } from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, getSafeVersion, compareVersions } from '../../../utils/nodeHelpers';
import { formatUptime } from '../../../utils/formatters';
import { supabase } from '../../../lib/supabase';

interface IdentityViewProps {
  node: Node;
  nodes: Node[]; 
  zenMode: boolean;
  onBack: () => void;
  mostCommonVersion: string;
}

export const IdentityView = ({ node, zenMode, onBack, mostCommonVersion }: IdentityViewProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // New State for "Identity Metadata"
  const [firstSeen, setFirstSeen] = useState<string>('Loading...');
  const [resetCount, setResetCount] = useState<number | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  // --- 1. FETCH METADATA (Tracking & Resets) ---
  useEffect(() => {
      async function fetchIdentityMeta() {
          if (!node || !node.pubkey) return;

          // --- GHOST LOGIC REPLICATION ---
          const targetAddress = node.address || '0.0.0.0';
          const network = node.network || 'MAINNET';
          
          let ipOnly = '0.0.0.0';
          if (targetAddress.toLowerCase().includes('private')) {
             ipOnly = 'private';
          } else {
             ipOnly = targetAddress.includes(':') ? targetAddress.split(':')[0] : targetAddress;
          }
          if (!ipOnly || ipOnly === '0.0.0.0' || ipOnly === '') {
              ipOnly = 'private';
          }
          
          const stableId = `${node.pubkey}-${ipOnly}-${network}`;
          // -------------------------------

          try {
              // A. FETCH FIRST SEEN (Tracking Since)
              const { data: firstData, error: firstError } = await supabase
                  .from('node_snapshots')
                  .select('created_at')
                  .eq('node_id', stableId)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .single();

              if (!firstError && firstData) {
                  setFirstSeen(new Date(firstData.created_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                  }));
              } else {
                  setFirstSeen('Unknown');
              }

              // B. FETCH RESET METRICS (Last 30 Days)
              // We look for significant drops in uptime
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

              const { data: uptimeData, error: uptimeError } = await supabase
                  .from('node_snapshots')
                  .select('created_at, uptime')
                  .eq('node_id', stableId)
                  .gte('created_at', thirtyDaysAgo.toISOString())
                  .order('created_at', { ascending: true }); // Chronological

              if (!uptimeError && uptimeData && uptimeData.length > 1) {
                  let resets = 0;
                  let lastReset = null;

                  for (let i = 1; i < uptimeData.length; i++) {
                      const prev = uptimeData[i-1].uptime || 0;
                      const curr = uptimeData[i].uptime || 0;

                      // Logic: If uptime drops by more than 50% or goes to near 0, it's a reset
                      // We use a threshold (e.g. drop > 1000 seconds) to avoid noise
                      if (curr < prev && (prev - curr) > 600) {
                          resets++;
                          lastReset = uptimeData[i].created_at;
                      }
                  }

                  setResetCount(resets);
                  if (lastReset) {
                      setLastResetDate(new Date(lastReset).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                  }
              } else {
                  setResetCount(0);
              }

          } catch (err) {
              console.error("Identity Fetch Error:", err);
              setFirstSeen('Error');
          }
      }

      fetchIdentityMeta();
  }, [node]);


  // --- STATUS LOGIC ---
  const getStatus = (lastSeen: number) => {
    if (!lastSeen) return 'OFFLINE';
    const now = Date.now();
    const diffMs = now - (lastSeen * 1000); 

    if (diffMs < 20 * 60 * 1000) return 'ONLINE';
    if (diffMs < 3 * 24 * 60 * 60 * 1000) return 'SYNCING';
    return 'OFFLINE';
  };

  const status = getStatus(node.last_seen_timestamp || 0);

  const statusConfig = {
      ONLINE: { color: 'text-green-500', icon: Wifi, bg: 'bg-green-500/10 border-green-500/20' },
      SYNCING: { color: 'text-orange-500', icon: RefreshCw, bg: 'bg-orange-500/10 border-orange-500/20' },
      OFFLINE: { color: 'text-zinc-500', icon: WifiOff, bg: 'bg-zinc-900 border-zinc-800' }
  }[status];

  // Helper Card Component
  const FieldCard = ({ 
      label, val, id, color, icon: Icon, fullWidth = false, statusBadge, subVal 
  }: { 
      label: string, val: string, id?: string, color?: string, icon?: any, fullWidth?: boolean, statusBadge?: React.ReactNode, subVal?: string
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
                <div className="flex flex-col">
                    <div className={`font-mono text-xs md:text-sm font-bold truncate ${zenMode ? 'text-zinc-200' : (color || 'text-zinc-200')}`}>
                        {val}
                    </div>
                    {/* Sub Value for Metadata (e.g., Last Reset Date) */}
                    {subVal && (
                        <div className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5">{subVal}</div>
                    )}
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

             {/* ROW 2: IP & Version */}
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

             {/* ROW 3: Tracking Since & Uptime */}
             <FieldCard 
                label="Tracking Since" 
                val={firstSeen} 
                icon={Calendar}
                color={zenMode ? 'text-zinc-400' : 'text-blue-400'}
             />
             <FieldCard 
                label="Current Session" 
                val={formatUptime(node?.uptime)} 
                color="text-zinc-300"
                id="uptime"
             />

             {/* ROW 4: Session Resets & Status */}
             <FieldCard 
                label="Session Resets (30d)" 
                val={resetCount === null ? '...' : `${resetCount} Events`}
                subVal={lastResetDate ? `Last: ${lastResetDate}` : resetCount === 0 ? 'No interruptions' : ''}
                icon={Activity}
                color={resetCount === 0 ? 'text-green-400' : resetCount && resetCount > 5 ? 'text-orange-400' : 'text-zinc-300'}
             />
             
             {/* Status Card */}
             <div className={`relative group p-3 rounded-xl border transition-all duration-300 col-span-1 flex flex-col justify-between ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'}`}>
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Status</span>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border w-fit ${zenMode ? 'bg-zinc-800 border-zinc-700 text-white' : statusConfig.bg}`}>
                    <statusConfig.icon size={12} className={zenMode ? 'text-white' : statusConfig.color} />
                    <span className={`text-[10px] font-bold uppercase ${zenMode ? 'text-white' : statusConfig.color}`}>{status}</span>
                </div>
             </div>

             {/* ROW 5: RPC (Full Width) */}
             <FieldCard 
                label="RPC Endpoint" 
                val={`http://${getSafeIp(node)}:6000`} 
                id="rpc" 
                fullWidth
             />
        </div>

        {/* STATUS FOOTER */}
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
