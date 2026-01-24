import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Client-side connection
import { getNodeHistoryAction } from '../../app/actions/getHistory'; // <--- IMPORT SERVER ACTION
import { Node } from '../../types';

export const NodeDebugger = ({ node }: { node: Node }) => {
  // Client DB State
  const [dbData, setDbData] = useState<any>(null);
  const [dbError, setDbError] = useState<any>(null);
  
  // Server Action (Cache) State
  const [cacheData, setCacheData] = useState<any>(null);
  const [cacheStatus, setCacheStatus] = useState<string>('Idle'); // 'Loading', 'Success', 'Error'
  const [cacheError, setCacheError] = useState<string | null>(null);

  const [generatedId, setGeneratedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runDiagnostics() {
      if (!node) return;
      setLoading(true);
      setDbError(null);
      setCacheError(null);
      setCacheStatus('Loading');

      // 1. GENERATE ID
      const ipOnly = node.address && node.address.includes(':') 
        ? node.address.split(':')[0] 
        : (node.address || '0.0.0.0');
      const network = node.network || 'MAINNET';
      const stableId = `${node.pubkey}-${ipOnly}-${network}`;
      setGeneratedId(stableId);

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
        const actionResult = await getNodeHistoryAction(stableId, network, 1); // Request 1 Day
        
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
    <div className="mx-2 mt-2 mb-4 p-3 bg-black/80 border border-fuchsia-500/30 rounded-lg text-[10px] font-mono shadow-xl animate-in fade-in slide-in-from-top-2">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
        <h3 className="text-white font-bold flex items-center gap-2 text-xs">
           🕵️ CACHE vs. DB COMPARISON
        </h3>
        {loading && <span className="text-fuchsia-400 animate-pulse">Running Diagnostics...</span>}
      </div>

      {/* ID DISPLAY */}
      <div className="mb-4">
           <span className="text-zinc-500 block mb-1">Target ID:</span>
           <code className="block w-full bg-zinc-900 text-zinc-300 p-2 rounded break-all border border-zinc-800">
             {generatedId}
           </code>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        {/* --- LEFT COLUMN: DIRECT DB (Truth) --- */}
        <div className="border border-zinc-700/50 rounded bg-zinc-900/20 p-2">
            <h4 className="font-bold text-blue-400 mb-2 border-b border-blue-500/20 pb-1">1. DIRECT DB (Truth)</h4>
            
            {dbError ? (
                <div className="text-red-400">DB Error: {JSON.stringify(dbError)}</div>
            ) : dbData ? (
                <div>
                    <div className={`text-lg font-bold mb-1 ${dbData.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dbData.length} Records
                    </div>
                    {dbData.length > 0 && (
                        <div className="text-zinc-500">
                            Last: {new Date(dbData[0].created_at).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            ) : (
                <span className="text-zinc-600">Waiting...</span>
            )}
        </div>

        {/* --- RIGHT COLUMN: SERVER ACTION (Cache) --- */}
        <div className="border border-zinc-700/50 rounded bg-zinc-900/20 p-2">
            <h4 className="font-bold text-fuchsia-400 mb-2 border-b border-fuchsia-500/20 pb-1">2. SERVER ACTION</h4>
            
            {cacheStatus === 'Loading' && <span className="text-zinc-500 animate-pulse">Fetching...</span>}
            
            {cacheStatus === 'Error' && (
                <div className="text-red-300 bg-red-900/20 p-1 rounded">
                    <strong>FAILED:</strong> {cacheError}
                </div>
            )}

            {cacheStatus === 'Success' && cacheData && (
                <div>
                    <div className={`text-lg font-bold mb-1 ${cacheData.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {cacheData.length} Records
                    </div>
                    
                    {cacheData.length === 0 ? (
                        <div className="text-orange-300 mt-1 leading-tight">
                            ⚠️ CACHE IS EMPTY
                            <br/><span className="text-zinc-500 text-[9px]">(Server fetched 0 rows)</span>
                        </div>
                    ) : (
                        <div className="text-zinc-500">
                           First Item Credits: <span className="text-white">{cacheData[0]?.credits || 'N/A'}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      {/* --- CONCLUSION BOX --- */}
      {!loading && dbData && cacheData && (
          <div className="mt-3 pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 font-bold">DIAGNOSIS: </span>
              {dbData.length > 0 && cacheData.length === 0 ? (
                  <span className="text-red-400 font-bold bg-red-900/20 px-1 rounded">
                      CRITICAL: DB has data, but Server Action returns 0.
                  </span>
              ) : dbData.length === cacheData.length ? (
                  <span className="text-green-400 font-bold">
                      SUCCESS: Cache matches Database.
                  </span>
              ) : (
                  <span className="text-yellow-500 font-bold">
                      MISMATCH: DB has {dbData.length}, Cache has {cacheData.length}.
                  </span>
              )}
          </div>
      )}

    </div>
  );
};
