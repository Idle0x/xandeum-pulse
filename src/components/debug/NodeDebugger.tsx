import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Node } from '../../types';

export const NodeDebugger = ({ node }: { node: Node }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [generatedId, setGeneratedId] = useState<string>('');

  useEffect(() => {
    async function runDiagnostics() {
      if (!node) return;

      // 1. REPLICATE THE ID GENERATION LOGIC EXACTLY
      // We need to see if this matches what is in your Database
      const versionSafe = node.version || '0.0.0';
      const stableId = `${node.pubkey}-${node.address}-${versionSafe}-${node.is_public}`;
      setGeneratedId(stableId);

      // 2. FETCH WITHOUT TIME FILTERS
      // We want to see if ANY data exists for this ID at all.
      const response = await supabase
        .from('node_snapshots')
        .select('*')
        .eq('node_id', stableId)
        .limit(3); // Just get top 3

      if (response.error) {
        setError(response.error);
      } else {
        setData(response.data);
      }
    }
    runDiagnostics();
  }, [node]);

  return (
    <div className="mt-4 p-4 bg-black/90 border-2 border-fuchsia-500 rounded-lg text-[10px] font-mono shadow-2xl overflow-hidden">
      <h3 className="text-fuchsia-400 font-bold text-sm mb-2">🕵️ NODE DEBUGGER</h3>
      
      {/* 1. INPUTS CHECK */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-b border-zinc-800 pb-2">
        <div>
           <span className="text-zinc-500 block">Node Version Input:</span>
           <span className={`text-lg font-bold ${node.version ? 'text-green-400' : 'text-red-500'}`}>
             {node.version ? `"${node.version}"` : 'UNDEFINED'}
           </span>
           {/* If this is undefined, your ID generation is falling back to 0.0.0 */}
        </div>
        <div>
           <span className="text-zinc-500 block">Generated Search ID:</span>
           <span className="text-xs break-all text-yellow-200 bg-zinc-900 p-1 rounded block">
             {generatedId}
           </span>
        </div>
      </div>

      {/* 2. ERROR CHECK */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 p-2 mb-2 text-red-200">
          <strong>CRITICAL ERROR:</strong> {JSON.stringify(error)}
        </div>
      )}

      {/* 3. DATA CHECK */}
      {!error && (
        <div>
          {data && data.length > 0 ? (
             <div className="text-green-400">
               <strong>✅ SUCCESS: Found {data.length} snapshots.</strong>
               <div className="mt-2 text-zinc-400 border-t border-zinc-800 pt-2">
                 First Row Credits: <span className="text-white">{data[0].credits}</span><br/>
                 First Row CreatedAt: <span className="text-white">{data[0].created_at}</span>
               </div>
             </div>
          ) : (
             <div className="text-red-400 font-bold text-lg">
               ❌ NO DATA FOUND
               <p className="text-xs font-normal text-zinc-400 mt-1">
                 Supabase returned 0 rows for this ID. <br/>
                 Likely Cause: The Backend saved the ID with a different Version/Address than the Frontend is requesting.
               </p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
