import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getNodeHistoryAction } from '../../app/actions/getHistory'; 
import { Node } from '../../types';

// --- TYPES ---
type CheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'INFO';

interface DiagnosticCheck {
  id: string;
  category: 'INPUT' | 'LOGIC' | 'DATABASE' | 'DATA_INTEGRITY' | 'CHART';
  label: string;
  status: CheckStatus;
  message: string;
  value?: string | number | boolean;
}

export const NodeDebugger = ({ node }: { node: Node }) => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runAllScenarios() {
      if (!node) return;
      setLoading(true);
      setError(null);
      
      const results: DiagnosticCheck[] = [];
      const addCheck = (cat: DiagnosticCheck['category'], label: string, status: CheckStatus, msg: string, val?: any) => {
        results.push({ id: label.toLowerCase().replace(/\s/g, '_'), category: cat, label, status, message: msg, value: val });
      };

      try {
        // =====================================================================
        // CATEGORY 1: INPUT INTEGRITY (React Props)
        // =====================================================================
        
        // 1. Node Object Existence
        addCheck('INPUT', 'Node Exists', node ? 'PASS' : 'FAIL', node ? 'Node object received' : 'Node object is null/undefined');

        // 2. Pubkey Presence
        addCheck('INPUT', 'Pubkey Valid', node?.pubkey ? 'PASS' : 'FAIL', node?.pubkey ? 'Pubkey found' : 'Missing Pubkey', node?.pubkey);

        // 3. Network Prop
        const net = node?.network;
        addCheck('INPUT', 'Network Defined', net ? 'PASS' : 'WARN', net ? `Network is "${net}"` : 'Network prop is undefined (Defaulting to MAINNET)');

        // 4. Address State
        const addr = node?.address;
        if (addr === null) addCheck('INPUT', 'Address State', 'INFO', 'Address is explicitly NULL');
        else if (addr === undefined) addCheck('INPUT', 'Address State', 'INFO', 'Address is UNDEFINED');
        else if (addr === '') addCheck('INPUT', 'Address State', 'WARN', 'Address is EMPTY STRING');
        else addCheck('INPUT', 'Address State', 'PASS', 'Address string present', addr);


        // =====================================================================
        // CATEGORY 2: LOGIC & IDENTITY (The Translation Layer)
        // =====================================================================

        // 5. Logic: Private Keyword Detection
        const isExplicitPrivate = addr?.toLowerCase().includes('private');
        addCheck('LOGIC', 'Private Keyword', isExplicitPrivate ? 'INFO' : 'INFO', isExplicitPrivate ? 'Found "private" in address' : 'No "private" keyword found');

        // 6. Logic: Port Stripping
        let ipSegment = '0.0.0.0';
        if (addr) {
             ipSegment = addr.includes(':') ? addr.split(':')[0] : addr;
        }
        addCheck('LOGIC', 'IP Parsing', 'INFO', `Parsed IP segment: ${ipSegment}`);

        // 7. Logic: Ghost Fallback Trigger
        let finalIp = ipSegment;
        if (isExplicitPrivate || !addr || addr === '0.0.0.0') {
            finalIp = 'private';
        }
        const usedFallback = finalIp === 'private' && !isExplicitPrivate;
        addCheck('LOGIC', 'Ghost Fallback', usedFallback ? 'WARN' : 'PASS', usedFallback ? 'Triggered Ghost Fallback (Address was null/empty)' : 'Standard logic used', finalIp);

        // 8. Logic: Stable ID Generation
        const targetNet = net || 'MAINNET';
        const stableId = `${node?.pubkey}-${finalIp}-${targetNet}`;
        addCheck('LOGIC', 'Stable ID', 'PASS', 'Generated ID successfully', stableId);


        // =====================================================================
        // CATEGORY 3: DATABASE FETCH (The Server Action)
        // =====================================================================

        const startTime = performance.now();
        const data = await getNodeHistoryAction(stableId, targetNet, 7); // 7 Days fetch
        const duration = performance.now() - startTime;

        // 9. Fetch Success
        addCheck('DATABASE', 'Fetch Status', Array.isArray(data) ? 'PASS' : 'FAIL', Array.isArray(data) ? 'Returned Array' : 'Returned non-array or error');

        // 10. Fetch Latency
        addCheck('DATABASE', 'Latency', duration < 1000 ? 'PASS' : 'WARN', `${Math.round(duration)}ms`, Math.round(duration));

        // 11. Row Count
        const count = Array.isArray(data) ? data.length : 0;
        addCheck('DATABASE', 'Row Count', count > 0 ? 'PASS' : 'FAIL', `${count} records found`, count);


        if (count > 0) {
            const first = data[0];
            const last = data[data.length - 1];

            // =====================================================================
            // CATEGORY 4: DATA INTEGRITY (The Rows)
            // =====================================================================

            // 12. Network Column Match
            const networkMatch = first.network === targetNet;
            addCheck('DATA_INTEGRITY', 'Network Col Match', networkMatch ? 'PASS' : 'FAIL', `DB Network "${first.network}" vs Prop "${targetNet}"`);

            // 13. ID Match
            const idMatch = first.node_id === stableId;
            addCheck('DATA_INTEGRITY', 'ID Col Match', idMatch ? 'PASS' : 'FAIL', idMatch ? 'IDs match' : `DB ID "${first.node_id}" mismatch`);

            // 14. Credits Type Check
            const creditType = typeof first.credits;
            addCheck('DATA_INTEGRITY', 'Credits Type', creditType === 'number' ? 'PASS' : 'WARN', `Type is ${creditType} (Chart expects number)`);

            // 15. Credits Value Check
            const hasCredits = first.credits > 0;
            addCheck('DATA_INTEGRITY', 'Credits Value', hasCredits ? 'PASS' : 'WARN', `Value: ${first.credits}`);

            // 16. Health Check
            addCheck('DATA_INTEGRITY', 'Health Value', 'INFO', `Health: ${first.health}`);

            // 17. Date Parsing
            const parsedDate = new Date(first.created_at);
            const validDate = !isNaN(parsedDate.getTime());
            addCheck('DATA_INTEGRITY', 'Date Parsing', validDate ? 'PASS' : 'FAIL', validDate ? 'Date parses correctly' : 'Invalid Date format');

            
            // =====================================================================
            // CATEGORY 5: CHART READINESS (Visualization)
            // =====================================================================

            // 18. Minimum Points
            addCheck('CHART', 'Min Points', count >= 2 ? 'PASS' : 'FAIL', count >= 2 ? 'Enough points for line' : 'Need 2+ points for line');

            // 19. Time Span
            const timeSpanMs = new Date(last.created_at).getTime() - new Date(first.created_at).getTime();
            const minutes = timeSpanMs / 1000 / 60;
            addCheck('CHART', 'Time Span', minutes > 1 ? 'PASS' : 'FAIL', `${minutes.toFixed(2)} mins span`, minutes);

            // 20. Variance (Flatline Check)
            const variance = last.credits - first.credits;
            addCheck('CHART', 'Variance', variance !== 0 ? 'PASS' : 'WARN', variance === 0 ? 'Flatline (0 Growth)' : `Growth: ${variance}`);

            // 21. Monotonicity (Does it go down?)
            let isMonotonic = true;
            for(let i=1; i<data.length; i++) {
                if(data[i].credits < data[i-1].credits) isMonotonic = false;
            }
            addCheck('CHART', 'Monotonic', isMonotonic ? 'PASS' : 'WARN', isMonotonic ? 'Credits always increase' : 'Credits decrease at some point');

            // 22. Ghost Logic Consistency
            if (finalIp === 'private') {
                const healthZero = Number(first.health) === 0;
                addCheck('CHART', 'Ghost Logic', healthZero ? 'PASS' : 'WARN', healthZero ? 'Ghost has 0 Health (Correct)' : 'Ghost has >0 Health (Unusual)');
            }

        } else {
            // Fail all data checks if no data
            addCheck('DATA_INTEGRITY', 'Data Missing', 'FAIL', 'Cannot check integrity on 0 rows');
            addCheck('CHART', 'Impossible', 'FAIL', 'Cannot render chart with 0 rows');
        }

      } catch (err: any) {
        console.error("Debug Fatal", err);
        setError(err.message);
        addCheck('DATABASE', 'Exception', 'FAIL', err.message);
      }

      setChecks(results);
      setLoading(false);
    }

    runAllScenarios();
  }, [node]);

  if (loading) return <div className="text-xs text-fuchsia-500 animate-pulse p-4">Running 24-Point Comprehensive Audit...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-800 bg-red-900/20 rounded">Fatal Error: {error}</div>;

  return (
    <div className="mx-2 mt-2 mb-4 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden font-mono text-[10px]">
      <div className="bg-zinc-900 p-2 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-zinc-300 font-bold">🛠 COMPREHENSIVE DIAGNOSTICS</h3>
          <span className="text-zinc-500">{checks.length} Checks Run</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {['INPUT', 'LOGIC', 'DATABASE', 'DATA_INTEGRITY', 'CHART'].map((cat) => (
              <div key={cat} className="p-2">
                  <h4 className="text-zinc-500 font-bold mb-2 border-b border-zinc-800/50 pb-1">{cat} LAYER</h4>
                  <div className="space-y-1.5">
                      {checks.filter(c => c.category === cat).map((check, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                              <span className="text-zinc-400 shrink-0">{check.label}:</span>
                              <div className="text-right">
                                  <span className={`font-bold px-1 rounded ${
                                      check.status === 'PASS' ? 'text-green-400 bg-green-900/20' : 
                                      check.status === 'FAIL' ? 'text-red-400 bg-red-900/20' : 
                                      check.status === 'WARN' ? 'text-yellow-400 bg-yellow-900/20' : 
                                      'text-blue-400'
                                  }`}>
                                      {check.status}
                                  </span>
                                  <div className="text-[9px] text-zinc-600 leading-tight mt-0.5 max-w-[150px] ml-auto break-words">
                                      {check.message}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
