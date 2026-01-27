import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Copy, CheckCircle, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, getSafeVersion, compareVersions } from '../../../utils/nodeHelpers';
import { formatUptime } from '../../../utils/formatters';
import { supabase } from '../../../lib/supabase';
import { useNodeVitality } from '../../../hooks/useNodeVitality';
import { NodeHistoryPoint } from '../../../hooks/useNodeHistory';

interface IdentityViewProps {
  node: Node;
  nodes: Node[]; 
  zenMode: boolean;
  onBack: () => void;
  mostCommonVersion: string;
}

export const IdentityView = ({ node, zenMode, onBack, mostCommonVersion }: IdentityViewProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Metadata State
  const [firstSeen, setFirstSeen] = useState<string>('Loading...');
  const [resetCount, setResetCount] = useState<number | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [historyBuffer, setHistoryBuffer] = useState<NodeHistoryPoint[]>([]); 

  // --- USE VITALITY HOOK ---
  const vitality = useNodeVitality(node, historyBuffer);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  // --- LOGIC: SMART CONTINUITY ENGINE ---
  const diagnostics = useMemo(() => {
    // 1. Calculate "Frozen Since" (Find earliest snapshot with same uptime)
    let frozenDate = '';
    const isStagnant = vitality.label === 'STAGNANT';
    const isWarmingUp = vitality.label === 'WARMING UP';
    const isActive = vitality.label === 'ACTIVE';

    if (isStagnant && historyBuffer.length > 0) {
        const currentUptime = node.uptime || 0;
        // Find the first snapshot in our buffer where uptime matches current (hung state start)
        const frozenPoint = historyBuffer.find(h => h.uptime === currentUptime);
        
        if (frozenPoint) {
            frozenDate = `Frozen since ${new Date(frozenPoint.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${new Date(frozenPoint.date).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })})`;
        } else {
            frozenDate = "Uptime counter frozen"; // Fallback
        }
    }

    // 2. Calculate Session Continuity Matrix
    let continuityLabel = "Loading...";
    let continuitySub = "";
    let continuityColor = "text-zinc-300";
    let continuityIconColor = "text-zinc-500";

    // Only proceed if we have a valid reset count (null means still loading)
    if (resetCount !== null) {
        if (isStagnant) {
            // SCENARIO: Frozen / Hung
            continuityLabel = "Suspended";
            continuitySub = frozenDate || "Process hung"; // Use the precise diagnostic calculated above
            continuityColor = "text-orange-400";
            continuityIconColor = "text-orange-500";
        } 
        else if (isWarmingUp) {
            if (resetCount === 0) {
                // SCENARIO: Fresh Boot
                continuityLabel = "Initializing";
                continuitySub = "System stabilizing";
                continuityColor = "text-blue-400";
                continuityIconColor = "text-blue-500";
            } else {
                // SCENARIO: Recovering from crash
                continuityLabel = "Rebooting";
                continuitySub = `Recovering (Resets: ${resetCount})`;
                continuityColor = "text-blue-400";
                continuityIconColor = "text-blue-500";
            }
        } 
        else if (isActive) {
            if (resetCount === 0) {
                // SCENARIO: Perfect Stability
                continuityLabel = "Seamless";
                continuitySub = "No interruptions (30d)";
                continuityColor = "text-green-400";
                continuityIconColor = "text-green-500";
            } else if (resetCount <= 4) {
                // SCENARIO: Normal Operation (Promoted to Green)
                continuityLabel = "Operational";
                continuitySub = `Minor resets detected (${resetCount})`;
                continuityColor = "text-green-400"; // Acceptable stability
                continuityIconColor = "text-green-500";
            } else {
                // SCENARIO: Volatile
                continuityLabel = "Volatile";
                continuitySub = `High frequency (${resetCount})`;
                continuityColor = "text-orange-400";
                continuityIconColor = "text-orange-500";
            }
        } 
        else {
            // SCENARIO: Offline / Unstable / Unknown
            continuityLabel = "Unverified";
            continuitySub = "Signal lost";
            continuityColor = "text-zinc-500"; // Dim
            continuityIconColor = "text-zinc-600";
        }
    }

    return { frozenDate, continuityLabel, continuitySub, continuityColor, continuityIconColor };
  }, [vitality.label, historyBuffer, resetCount, node.uptime]);


  useEffect(() => {
      async function fetchIdentityMeta() {
          if (!node || !node.pubkey) return;

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

          try {
              // A. FETCH FIRST SEEN
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

              // B. FETCH HISTORY FOR DIAGNOSTICS (Last 30 Days)
              const historyWindow = new Date();
              historyWindow.setDate(historyWindow.getDate() - 30); 

              const { data: recentHistory, error: histError } = await supabase
                  .from('node_snapshots')
                  .select('created_at, uptime, health')
                  .eq('node_id', stableId)
                  .gte('created_at', historyWindow.toISOString())
                  .order('created_at', { ascending: true });

              if (!histError && recentHistory) {
                  // 1. Pass to State
                  const mappedHistory = recentHistory.map((r: any) => ({
                      date: r.created_at,
                      uptime: r.uptime,
                      health: r.health,
                      credits: 0, 
                      storage_committed: 0, 
                      storage_used: 0, 
                      rank: 0, 
                      network: network,
                      reputation: 0 
                  }));
                  setHistoryBuffer(mappedHistory);

                  // 2. Calculate Resets
                  if (recentHistory.length > 1) {
                      let resets = 0;
                      let lastReset = null;
                      for (let i = 1; i < recentHistory.length; i++) {
                          const prev = recentHistory[i-1].uptime || 0;
                          const curr = recentHistory[i].uptime || 0;
                          // If current is less than prev by at least 10 mins (600s), it's a reset
                          if (curr < prev && (prev - curr) > 600) {
                              resets++;
                              lastReset = recentHistory[i].created_at;
                          }
                      }
                      setResetCount(resets);
                      if (lastReset) {
                          setLastResetDate(new Date(lastReset).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                      }
                  } else {
                      setResetCount(0);
                  }
              }

          } catch (err) {
              console.error("Identity Fetch Error:", err);
              setFirstSeen('Error');
          }
      }

      fetchIdentityMeta();
  }, [node]);

  // Helper Card Component
  const FieldCard = ({ 
      label, val, id, color, icon: Icon, fullWidth = false, statusBadge, subVal, iconColor
  }: { 
      label: string, val: string, id?: string, color?: string, icon?: any, fullWidth?: boolean, statusBadge?: React.ReactNode, subVal?: string, iconColor?: string
  }) => (
    <div className={`relative group p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${fullWidth ? 'col-span-2' : 'col-span-1'} ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/60'}`}>
        <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">{label}</span>
            {Icon && <Icon size={12} className={iconColor || "text-zinc-600"} />}
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
             {statusBadge ? (
                 statusBadge
             ) : (
                <div className="flex flex-col min-w-0">
                    <div className={`font-mono text-xs md:text-sm font-bold truncate ${zenMode ? 'text-zinc-200' : (color || 'text-zinc-200')}`}>
                        {val}
                    </div>
                    {subVal && (
                        <div className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5 truncate pr-2" title={subVal}>{subVal}</div>
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

             {/* ROW 1: Public Key */}
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

             {/* ROW 3: Tracking & Uptime */}
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

             {/* ROW 4: Session Continuity (Smart Matrix) */}
             <FieldCard 
                label="Session Continuity" 
                val={diagnostics.continuityLabel}
                subVal={diagnostics.continuitySub}
                icon={Activity}
                color={diagnostics.continuityColor}
                iconColor={diagnostics.continuityIconColor}
             />

             {/* VITALITY STATUS CARD */}
             <div className={`relative group p-3 rounded-xl border transition-all duration-300 col-span-1 flex flex-col justify-between ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'}`}>
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Status</span>
                </div>
                <div className="flex flex-col min-w-0">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border w-fit mb-1 ${zenMode ? 'bg-zinc-800 border-zinc-700 text-white' : vitality.bgColor}`}>
                        <vitality.icon size={12} className={zenMode ? 'text-white' : vitality.color} />
                        <span className={`text-[10px] font-bold uppercase ${zenMode ? 'text-white' : vitality.color}`}>{vitality.label}</span>
                    </div>
                    {/* Reason / Sub-value */}
                    <div className="text-[8px] font-bold text-zinc-600 truncate pr-1" title={vitality.reason}>
                        {/* If stagnant, we show the precise frozen date, else the vitality reason */}
                        {vitality.label === 'STAGNANT' ? diagnostics.frozenDate : vitality.reason}
                    </div>
                </div>
             </div>

             {/* ROW 5: RPC */}
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
