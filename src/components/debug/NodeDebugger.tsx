import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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

      // 1. REPLICATE THE NEW ID LOGIC EXACTLY
      // Logic: [PublicKey]-[IP]-[IsPublic]-[Network]
      const ipOnly = node.address && node.address.includes(':') 
        ? node.address.split(':')[0] 
        : (node.address || '0.0.0.0');
      
      const network = node.network || 'MAINNET';
      
      // Note: We intentionally exclude Version here
      const stableId = `${node.pubkey}-${ipOnly}-${node.is_public}-${network}`;
      setGeneratedId(stableId);

      // 2. FETCH DATA (Strict Check)
      const response = await supabase
        .from('node_snapshots')
        .select('created_at, credits, health, node_id') // Select specific fields
        .eq('node_id', stableId)
        .eq('network', network)
        .order('created_at', { ascending: false }) // Get latest first
        .limit(5);

      if (response.error) {
        setError(response.error);
      } else {
        setData(response.data);
      }
      setLoading(false);
    }
    runDiagnostics();
  }, [node]);

  return (
    <div className="mt-2 mb-2 p-3 bg-black/80 border border-fuchsia-500/50 rounded-lg text-[10px] font-mono shadow-xl animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-1">
        <h3 className="text-fuchsia-400 font-bold">🕵️ ID MATCH DEBUGGER</h3>
        {loading && <span className="text-zinc-500 animate-pulse">Running Diagnostics...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <div>
           <span className="text-zinc-500 block mb-0.5">Target ID (Frontend Generated):</span>
           <code className="block w-full bg-zinc-900 text-yellow-500 p-1.5 rounded break-all select-all border border-zinc-800">
             {generatedId}
           </code>
        </div>
        <div>
           <span className="text-zinc-500 block mb-0.5">Raw Variables:</span>
           <div className="grid grid-cols-2 gap-1 text-zinc-300">
             <span>IP: <span className="text-white">{node.address?.split(':')[0]}</span></span>
             <span>Net: <span className="text-white">{node.network}</span></span>
             <span>Public: <span className={node.is_public ? 'text-green-400' : 'text-red-400'}>{String(node.is_public)}</span></span>
             {/* Show Version just to prove we aren't using it for ID */}
             <span className="opacity-50 strike-through decoration-zinc-500">Ver: {node.version} (Ignored)</span>
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-200 rounded">
          <strong>DB ERROR:</strong> {JSON.stringify(error)}
        </div>
      )}

      {!error && !loading && (
        <div>
          {data && data.length > 0 ? (
             <div className="bg-green-900/10 border border-green-500/30 p-2 rounded">
               <div className="text-green-400 font-bold mb-1 flex items-center gap-2">
                 ✅ MATCH FOUND: {data.length} Recent Snapshots
               </div>
               <div className="space-y-1">
                 {data.map((row: any, i: number) => (
                   <div key={i} className="flex justify-between border-b border-green-500/10 last:border-0 pb-0.5">
                      <span className="text-zinc-400">{new Date(row.created_at).toLocaleTimeString()}</span>
                      <span className="text-yellow-500 font-bold">{row.credits.toLocaleString()} Cr</span>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
             <div className="bg-red-900/10 border border-red-500/30 p-2 rounded text-red-400">
               <strong>❌ NO MATCH FOUND</strong>
               <p className="text-zinc-500 mt-1">
                 The database contains 0 rows for this ID.
                 <br/>
                 1. Check if the backend script has run since the ID logic update.
                 <br/>
                 2. Verify if the database `node_id` column includes the version or port.
               </p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
