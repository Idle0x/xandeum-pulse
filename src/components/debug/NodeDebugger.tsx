import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getNodeHistoryAction } from '../../app/actions/getHistory'; 
import { Node } from '../../types';
import { consolidateHistory } from '../../utils/historyAggregator'; 

export const NodeDebugger = ({ node }: { node: Node }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runDeepDiagnostics() {
      if (!node) return;
      setLoading(true);

      const log = {
        step1_ids: { status: 'PENDING', details: '' },
        step2_fetch: { status: 'PENDING', count: 0, sample: null },
        step3_mapping: { status: 'PENDING', validDates: 0, invalidDates: 0 },
        step4_filtering: { status: 'PENDING', kept: 0, dropped: 0, reason: '' },
        step5_consolidation: { status: 'PENDING', input: 0, output: 0 },
        // FIX: Initialize as string '0' so toFixed(2) is accepted later
        final_chart_ready: { status: 'PENDING', points: 0, spanMinutes: '0' }
      };

      try {
        // --- STEP 1: ID GENERATION ---
        const targetAddress = node.address || '0.0.0.0';
        const defaultNetwork = node.network || 'MAINNET';
        
        let ipOnly = '0.0.0.0';
        if (targetAddress.toLowerCase().includes('private')) {
           ipOnly = 'private';
        } else {
           ipOnly = targetAddress.includes(':') ? targetAddress.split(':')[0] : targetAddress;
           if (!ipOnly || ipOnly === '0.0.0.0') ipOnly = 'private';
        }

        const stableId = `${node.pubkey}-${ipOnly}-${defaultNetwork}`;
        
        log.step1_ids = { 
            status: 'OK', 
            details: `ID: ${stableId}\nNode Network Prop: ${JSON.stringify(node.network)}` 
        };

        // --- STEP 2: RAW FETCH (Simulate Server Action) ---
        // We use the 24H logic (days=1) because that's the default view
        const rawData = await getNodeHistoryAction(stableId, defaultNetwork, 1); 

        if (!Array.isArray(rawData)) {
            throw new Error("Server returned non-array");
        }

        log.step2_fetch = { 
            status: rawData.length > 0 ? 'OK' : 'EMPTY', 
            count: rawData.length,
            sample: rawData.length > 0 ? rawData[0] : null
        };

        if (rawData.length > 0) {
            // --- STEP 3: MAPPING SIMULATION ---
            // This mimics exactly what useNodeHistory does
            const mappedData = rawData.map((row: any) => {
                const dateObj = new Date(row.created_at);
                const isValidDate = !isNaN(dateObj.getTime());
                return {
                    ...row,
                    dateObj,
                    isValidDate,
                    network: row.network || defaultNetwork
                };
            });

            const validCount = mappedData.filter(d => d.isValidDate).length;
            log.step3_mapping = {
                status: validCount === mappedData.length ? 'OK' : 'WARNING',
                validDates: validCount,
                invalidDates: mappedData.length - validCount
            };

            // --- STEP 4: NETWORK FILTERING SIMULATION ---
            const filteredData = mappedData.filter((h: any) => {
                // strict check against prop
                if (node.network) return h.network === node.network;
                return true; 
            });

            log.step4_filtering = {
                status: filteredData.length > 0 ? 'OK' : 'FAIL',
                kept: filteredData.length,
                dropped: mappedData.length - filteredData.length,
                reason: filteredData.length === 0 ? `Mismatch: Row '${mappedData[0]?.network}' !== Prop '${node.network}'` : 'Match'
            };

            // --- STEP 5: CONSOLIDATION SIMULATION ---
            const preConsolidate = filteredData.map(d => ({
                date: d.created_at, // strictly mimic the hook
                health: Number(d.health || 0),
                credits: Number(d.credits || 0),
                network: d.network
            }));

            const consolidated = consolidateHistory(preConsolidate, '24H');
            
            log.step5_consolidation = {
                status: consolidated.length > 0 ? 'OK' : 'FAIL',
                input: preConsolidate.length,
                output: consolidated.length
            };

            // --- STEP 6: CHART READINESS ---
            if (consolidated.length > 0) {
                const firstTime = new Date(consolidated[0].date).getTime();
                const lastTime = new Date(consolidated[consolidated.length - 1].date).getTime();
                const spanMinutes = (lastTime - firstTime) / 1000 / 60;
                
                let chartStatus = 'OK';
                if (consolidated.length < 2) chartStatus = 'INSUFFICIENT_POINTS';
                
                log.final_chart_ready = {
                    status: chartStatus,
                    points: consolidated.length,
                    spanMinutes: spanMinutes.toFixed(2) // Now valid because initial type is string
                };
            }
        }

        setReport(log);

      } catch (err: any) {
        console.error("Debug Error", err);
        setReport({ error: err.message });
      } finally {
        setLoading(false);
      }
    }

    runDeepDiagnostics();
  }, [node]);

  if (!report && loading) return <div className="text-[10px] animate-pulse text-fuchsia-400 p-2">Running Pipeline Trace...</div>;
  if (!report) return null;

  return (
    <div className="mx-2 mt-2 mb-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono shadow-xl relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
        <h3 className="text-white font-bold flex items-center gap-2 text-xs">
           🧬 DATA PIPELINE INSPECTOR
        </h3>
      </div>

      {report.error ? (
          <div className="text-red-400 font-bold p-2 bg-red-900/20 rounded">
              CRITICAL FAIL: {report.error}
          </div>
      ) : (
          <div className="space-y-3">
              
              {/* 1. FETCH */}
              <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                  <div className={`font-bold ${report.step2_fetch.count > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      1. FETCH
                  </div>
                  <div>
                      <div className="text-zinc-300">Found {report.step2_fetch.count} raw records.</div>
                      {report.step2_fetch.sample && (
                          <div className="mt-1 p-1 bg-zinc-900 rounded border border-zinc-800 text-[9px] text-zinc-500 break-all">
                              SAMPLE: {JSON.stringify(report.step2_fetch.sample).slice(0, 100)}...
                          </div>
                      )}
                  </div>
              </div>

              {/* 2. FILTERING (Common Fail Point) */}
              <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                  <div className={`font-bold ${report.step4_filtering.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                      2. FILTER
                  </div>
                  <div>
                      <div className="text-zinc-300">
                          Kept {report.step4_filtering.kept} / Dropped {report.step4_filtering.dropped}
                      </div>
                      {report.step4_filtering.dropped > 0 && (
                          <div className="text-orange-400 italic">
                             Warning: {report.step4_filtering.reason}
                          </div>
                      )}
                      <div className="text-[9px] text-zinc-600 mt-1">
                          (Checks if DB 'network' matches UI Node 'network')
                      </div>
                  </div>
              </div>

              {/* 3. CHART READY (The Output) */}
              <div className="grid grid-cols-[80px_1fr] gap-2 items-start border-t border-zinc-800 pt-2">
                  <div className={`font-bold ${report.final_chart_ready.status === 'OK' ? 'text-blue-400' : 'text-yellow-400'}`}>
                      3. CHART
                  </div>
                  <div>
                      <div className="text-white font-bold">
                          Final Points: {report.final_chart_ready.points}
                      </div>
                      {report.final_chart_ready.status === 'INSUFFICIENT_POINTS' && (
                          <div className="text-yellow-400 font-bold bg-yellow-900/20 p-1 rounded mt-1">
                              ⚠️ INSUFFICIENT DATA
                              <div className="font-normal text-yellow-200/70 mt-1">
                                  Charts need at least 2 distinct points to draw a line. 
                                  You currently have {report.final_chart_ready.points}.
                              </div>
                          </div>
                      )}
                      <div className="text-zinc-500 mt-1">
                          Time Span: {report.final_chart_ready.spanMinutes} minutes
                      </div>
                  </div>
              </div>

          </div>
      )}
    </div>
  );
};
