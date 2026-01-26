import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Client-side connection
import { getNodeHistoryAction } from '../../app/actions/getHistory'; 
import { Node } from '../../types';

export const NodeDebugger = ({ node }: { node: Node }) => {
  // Client DB State
  const [dbData, setDbData] = useState<any>(null);
  const [dbError, setDbError] = useState<any>(null);

  // Server Action (Cache) State
  const [cacheData, setCacheData] = useState<any>(null);
  const [cacheStatus, setCacheStatus] = useState<string>('Idle'); // 'Loading', 'Success', 'Error'
  const [cacheError, setCacheError] = useState<string | null>(null);

  // ID Debugging State
  const [generatedId, setGeneratedId] = useState<string>('');
  const [resolvedIp, setResolvedIp] = useState<string>('');
  const [isGhost, setIsGhost] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runDiagnostics() {
      if (!node) return;
      setLoading(true);
      setDbError(null);
      setCacheError(null);
      setCacheStatus('Loading');

      // ---------------------------------------------------------
      // 1. CRITICAL: EXACT ID MATCHING LOGIC
      // This must match runMonitor.ts and useNodeHistory.ts 1:1
      // ---------------------------------------------------------
      const targetAddress = node.address || '0.0.0.0';
      const network = node.network || 'MAINNET';
      
      let ipOnly = '0.0.0.0';
      let ghostDetected = false;

      if (targetAddress.toLowerCase().includes('private')) {
         ipOnly = 'private';
         ghostDetected = true;
      } else {
         ipOnly = targetAddress.includes(':') 
           ? targetAddress.split(':')[0] 
           : targetAddress;
         
         // Fallback safety
         if (!ipOnly || ipOnly === '0.0.0.0') {
            ipOnly = 'private'; // Treat unknown IPs as private/ghosts
            ghostDetected = true;
         }
      }

      const stableId = `${node.pubkey}-${ipOnly}-${network}`;
      
      // Update local state for visualization
      setGeneratedId(stableId);
      setResolvedIp(ipOnly);
      setIsGhost(ghostDetected);

      // ---------------------------------------------------------
      // TEST 1: DIRECT DB LOOKUP (Client Side)
      // ---------------------------------------------------------
      const { data: directData, error: directError } = await supabase
        .from('node_snapshots')
        .select('created_at, credits, health, node_id, network') 
        .eq('node_id', stableId)
        .order('created_at', { ascending: false }) 
        .limit(5);

      if (directError) setDbError(directError);
      else setDbData(directData);

      // ---------------------------------------------------------
      // TEST 2: SERVER ACTION (Cached)
      // ---------------------------------------------------------
      try {
        const actionResult = await getNodeHistoryAction(stableId, network, 7); // Request 7 Days

        if (Array.isArray(actionResult)) {
           setCacheData(actionResult);
           setCacheStatus('Success');
        } else {
           setCacheStatus('Error');
           setCacheError("Server returned non-array data");
        }
      } catch (err: any) {
        setCacheStatus('Error');
        setCacheError(err.message || "Unknown Server Action Error");
      }

      setLoading(false);
    }

    runDiagnostics();
  }, [node]);

  return (
    <div className="mx-2 mt-2 mb-4 p-3 bg-black/90 border border-fuchsia-500/50 rounded-lg text-[10px] font-mono shadow-2xl animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      
      {/* Background Warning Stripe */}
      <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none text-9xl font-bold text-fuchsia-500 rotate-12">
        DEBUG
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2 relative z-10">
        <h3 className="text-white font-bold flex items-center gap-2 text-xs">
           🕵️ DIAGNOSTIC MODE
        </h3>
        {loading && <span className="text-fuchsia-400 animate-pulse">Running Diagnostics...</span>}
      </div>

      {/* 1. IDENTITY MATRIX */}
      <div className="mb-4 bg-zinc-900/50 p-2 rounded border border-zinc-800 relative z-10">
           <div className="grid grid-cols-2 gap-2 mb-2">
               <div>
                   <span className="text-zinc-500 block">Detected Type:</span>
                   <span className={`font-bold ${isGhost ? 'text-purple-400' : 'text-blue-400'}`}>
                       {isGhost ? '👻 GHOST (Private)' : '🌐 PUBLIC (Rpc)'}
                   </span>
               </div>
               <div>
                   <span className="text-zinc-500 block">Resolved IP Segment:</span>
                   <span className="text-zinc-300">{resolvedIp}</span>
               </div>
           </div>

           <span className="text-zinc-500 block mb-1">Generated Stable ID (Key):</span>
           <code className="block w-full bg-black text-yellow-500 p-2 rounded break-all border border-zinc-700 select-all cursor-text">
             {generatedId}
           </code>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">

        {/* --- LEFT COLUMN: DIRECT DB (Truth) --- */}
        <div className="border border-zinc-700/50 rounded bg-zinc-900/20 p-2">
            <h4 className="font-bold text-blue-400 mb-2 border-b border-blue-500/20 pb-1">1. DATABASE (Supabase)</h4>

            {dbError ? (
                <div className="text-red-400 break-words">DB Error: {JSON.stringify(dbError)}</div>
            ) : dbData ? (
                <div>
                    <div className={`text-lg font-bold mb-1 ${dbData.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dbData.length} Records Found
                    </div>
                    {dbData.length > 0 ? (
                        <div className="space-y-1">
                            <div className="text-zinc-500">
                                Latest: <span className="text-zinc-300">{new Date(dbData[0].created_at).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-zinc-500">
                                Credits: <span className="text-zinc-300">{dbData[0].credits}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-400 text-[9px] leading-tight">
                            The script has not saved any rows with the ID above. Check "runMonitor.ts".
                        </div>
                    )}
                </div>
            ) : (
                <span className="text-zinc-600">Waiting...</span>
            )}
        </div>

        {/* --- RIGHT COLUMN: SERVER ACTION (Cache) --- */}
        <div className="border border-zinc-700/50 rounded bg-zinc-900/20 p-2">
            <h4 className="font-bold text-fuchsia-400 mb-2 border-b border-fuchsia-500/20 pb-1">2. SERVER CACHE</h4>

            {cacheStatus === 'Loading' && <span className="text-zinc-500 animate-pulse">Fetching...</span>}

            {cacheStatus === 'Error' && (
                <div className="text-red-300 bg-red-900/20 p-1 rounded">
                    <strong>FAILED:</strong> {cacheError}
                </div>
            )}

            {cacheStatus === 'Success' && cacheData && (
                <div>
                    <div className={`text-lg font-bold mb-1 ${cacheData.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {cacheData.length} Records Found
                    </div>

                    {cacheData.length === 0 ? (
                        <div className="text-orange-300 mt-1 leading-tight">
                            ⚠️ CACHE IS EMPTY
                            <br/><span className="text-zinc-500 text-[9px]">Server returned 0 rows.</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                             {/* Show the LAST item in the array (usually the latest in cache logic depending on sort) */}
                             <div className="text-zinc-500">
                                Credits: <span className="text-white">{cacheData[cacheData.length-1]?.credits || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --- CONCLUSION BOX --- */}
      {!loading && dbData && cacheData && (
          <div className="mt-3 pt-2 border-t border-zinc-800 relative z-10">
              <span className="text-zinc-500 font-bold">DIAGNOSIS: </span>
              {dbData.length > 0 && cacheData.length === 0 ? (
                  <div className="text-red-400 font-bold bg-red-900/20 p-1 rounded mt-1">
                      CRITICAL: DB has data, but Server Action returns 0.
                      <br/><span className="text-[9px] font-normal text-red-300">Potential Cause: Server Action logic mismatch or Cache Stale.</span>
                  </div>
              ) : dbData.length === 0 && cacheData.length === 0 ? (
                  <div className="text-yellow-500 font-bold mt-1">
                      NO DATA: This ID does not exist in the DB yet. 
                      <br/><span className="text-[9px] font-normal text-yellow-300">Wait for the next cron job run.</span>
                  </div>
              ) : (
                  <span className="text-green-400 font-bold">
                      SUCCESS: Cache matches Database.
                  </span>
              )}
          </div>
      )}

    </div>
  );
};
