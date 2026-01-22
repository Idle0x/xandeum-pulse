import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Make sure this path matches your project

export const SupabaseDebug = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    async function debugFetch() {
      // 1. Attempt to fetch just 1 row to check permissions & data structure
      const response = await supabase
        .from('network_snapshots')
        .select('*')
        .limit(1);

      if (response.error) {
        setError(response.error);
      } else {
        setData(response.data);
        if (response.data && response.data.length > 0) {
          setColumns(Object.keys(response.data[0]));
        }
      }
    }
    debugFetch();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-black/95 text-green-400 p-6 font-mono text-xs border-b-2 border-green-500 shadow-2xl max-h-[50vh] overflow-auto">
      <h2 className="text-lg font-bold text-white mb-2">⚡ SUPABASE CONNECTION DEBUGGER</h2>
      
      {/* 1. CHECKING FOR ERRORS */}
      {error && (
        <div className="mb-4 p-2 bg-red-900/30 border border-red-500 rounded">
          <strong className="text-red-400 text-lg">❌ FETCH ERROR:</strong>
          <pre className="mt-1 text-white">{JSON.stringify(error, null, 2)}</pre>
          <p className="mt-2 text-yellow-300">
            <strong>Hint:</strong> If code is "42501", you need to enable <strong>RLS Policies</strong> in Supabase.
          </p>
        </div>
      )}

      {/* 2. CHECKING FOR DATA */}
      {!error && data && data.length === 0 && (
        <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-500 rounded">
          <strong className="text-yellow-400 text-lg">⚠️ EMPTY DATA:</strong>
          <p className="text-white mt-1">
            Supabase returned an empty array <code>[]</code>.
          </p>
          <p className="mt-2 text-zinc-400">
            <strong>Cause 1:</strong> The table <code>network_snapshots</code> is actually empty.<br/>
            <strong>Cause 2:</strong> RLS is enabled but no policy allows "Select" for anonymous users.
          </p>
        </div>
      )}

      {/* 3. SUCCESS - SHOW COLUMNS */}
      {data && data.length > 0 && (
        <div className="space-y-4">
          <div className="p-2 bg-blue-900/30 border border-blue-500 rounded">
            <strong className="text-blue-300">✅ SUCCESS! Data Found.</strong>
            <p className="mt-1 text-zinc-400">Your hook might be looking for wrong column names. Compare these:</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-white mb-1">ACTUAL DB COLUMNS:</h3>
              <ul className="list-disc pl-4 space-y-1 text-yellow-300">
                {columns.map(col => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">RAW ROW DATA:</h3>
              <pre className="bg-zinc-900 p-2 rounded border border-zinc-700 text-zinc-300 overflow-x-auto">
                {JSON.stringify(data[0], null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
