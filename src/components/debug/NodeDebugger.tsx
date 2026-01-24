import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Client-side connection
import { Node } from '../../types';

export const NodeDebugger = ({ node }: { node: Node }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [generatedId, setGeneratedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runDiagnostics() {
      if (!node) return;
      setLoading(true);
      setError(null);

      // 1. REPLICATE THE ID LOGIC EXACTLY
      // Logic: [PublicKey]-[IP]-[Network]
      const ipOnly = node.address && node.address.includes(':') 
        ? node.address.split(':')[0] 
        : (node.address || '0.0.0.0');

      const network = node.network || 'MAINNET';
      
      // The specific ID we are looking for
      const stableId = `${node.pubkey}-${ipOnly}-${network}`;
      setGeneratedId(stableId);

      // 2. FETCH RAW DATA (Client-Side, No Cache)
      // We look for ANY snapshots for this ID to confirm existence
      const { data: dbData, error: dbError } = await supabase
        .from('node_snapshots')
        .select('created_at, credits, health, node_id, network') 
        .eq('node_id', stableId)
        .order('created_at', { ascending: false }) 
        .limit(5);

      if (dbError) {
        setError(dbError);
      } else {
        setData(dbData);
      }
      setLoading(false);
    }
    
    runDiagnostics();
  }, [node]);

  return (
    <div className="mx-2 mt-2 mb-4 p-3 bg-black/40 border border-fuchsia-500/30 rounded-lg text-[10px] font-mono shadow-xl animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-1">
        <h3 className="text-fuchsia-400 font-bold flex items-center gap-2">
           🕵️ DIRECT DATABASE LOOKUP
        </h3>
        {loading && <span className="text-zinc-500 animate-pulse">Scanning DB...</span>}
      </div>

      <div className="grid grid-cols-1 gap-2 mb-3">
        <div>
           <span className="text-zinc-500 block mb-0.5">Target ID (Being Searched):</span>
           <code className="block w-full bg-zinc-900/50 text-fuchsia-300 p-2 rounded break-all select-all border border-zinc-800">
             {generatedId}
           </code>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-200 rounded mb-2">
          <strong>DB ERROR:</strong> {JSON.stringify(error)}
        </div>
      )}

      {!error && !loading && (
        <div>
          {data && data.length > 0 ? (
             <div className="bg-green-900/10 border border-green-500/30 p-2 rounded">
               <div className="text-green-400 font-bold mb-2 flex items-center gap-2">
                 ✅ FOUND {data.length} RECORDS
               </div>
               <div className="space-y-1 max-h-32 overflow-y-auto">
                 {data.map((row: any, i: number) => (
                   <div key={i} className="flex justify-between border-b border-green-500/10 last:border-0 pb-1 mb-1">
                      <div className="flex flex-col">
                        <span className="text-zinc-300">{new Date(row.created_at).toLocaleString()}</span>
                        <span className="text-zinc-500 text-[8px]">{row.network}</span>
                      </div>
                      <span className="text-yellow-500 font-bold">{row.credits.toLocaleString()} Cr</span>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
             <div className="bg-red-900/10 border border-red-500/30 p-3 rounded text-red-400">
               <strong className="block mb-1">❌ NO RECORDS FOUND</strong>
               <p className="text-zinc-500 text-[9px]">
                 The database has 0 rows matching this specific ID.
                 <br/><br/>
                 Possible causes:
                 <br/>1. The monitor script hasn't run yet.
                 <br/>2. The monitor script is generating a different ID than the frontend.
                 <br/>3. The 'network' field doesn't match exactly.
               </p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
