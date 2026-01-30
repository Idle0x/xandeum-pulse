import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// =========================================================
// 🔒 SAFETY SWITCH
// Set this to TRUE only when you need to debug.
// When FALSE, this route is completely inaccessible.
// =========================================================
const DEBUG_MODE = false; 

export const dynamic = 'force-dynamic'; 

export async function GET() {
  // 1. THE GUARD: If debug mode is off, pretend this route doesn't exist.
  if (!DEBUG_MODE) {
    return NextResponse.json(
      { error: "Not Found", message: "Debug mode is currently disabled." }, 
      { status: 404 }
    );
  }

  // --- BELOW IS THE "NUCLEAR" DEBUGGER CODE (KEPT SAFE) ---
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      check_window_days: 7,
      note: "Bypassing all application caches. Querying Raw DB."
    },
    summary: {
      total_nodes_found: 0,
      nodes_with_zero_score: 0,
      common_failure_reasons: {} as Record<string, number>
    },
    failures: [] as any[]
  };

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const { data: snapshots, error } = await supabase
      .from('node_snapshots')
      .select('node_id, created_at, uptime, credits')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({ error: "CRITICAL: Database returned 0 rows for the last 7 days." });
    }

    const grouped: Record<string, any[]> = {};
    snapshots.forEach((s) => {
      if (!grouped[s.node_id]) grouped[s.node_id] = [];
      grouped[s.node_id].push(s);
    });

    report.summary.total_nodes_found = Object.keys(grouped).length;

    Object.entries(grouped).forEach(([nodeId, history]) => {
      const firstPoint = history[0];
      const lastPoint = history[history.length - 1];
      const firstTime = new Date(firstPoint.created_at).getTime();
      const lastTime = new Date(lastPoint.created_at).getTime();
      
      const lifespanMs = lastTime - firstTime;
      const lifespanHours = lifespanMs / (1000 * 60 * 60);
      const snapshotCount = history.length;
      
      // Calculate Expectation
      let estimatedIntervalMinutes = 60;
      if (snapshotCount > 1) {
          const avgDiffMs = lifespanMs / (snapshotCount - 1);
          estimatedIntervalMinutes = avgDiffMs / (1000 * 60);
      }
      
      const snapshotsPerHour = 60 / Math.max(1, estimatedIntervalMinutes);
      const expectedNew = Math.min(168 * snapshotsPerHour, lifespanHours * snapshotsPerHour);
      const safeExpected = Math.max(1, expectedNew);
      const consistencyNew = Math.min(1, snapshotCount / (safeExpected * 0.8));

      let failureReason = "NONE";
      let isZero = false;

      if (snapshotCount === 0) {
          failureReason = "NO_DATA";
          isZero = true;
      } else if (snapshotCount === 1) {
          failureReason = "SINGLE_POINT_FAILURE";
          isZero = true;
      } else if (lifespanHours < 0.05) {
          failureReason = "MICRO_LIFESPAN";
          isZero = true;
      } else if (consistencyNew < 0.01) {
          failureReason = "EXTREME_SPARSITY";
          isZero = true;
      }

      if (consistencyNew < 0.1 || failureReason !== "NONE") {
        if (isZero) report.summary.nodes_with_zero_score++;
        report.summary.common_failure_reasons[failureReason] = (report.summary.common_failure_reasons[failureReason] || 0) + 1;

        report.failures.push({
          node_id: nodeId,
          status: failureReason,
          metrics: {
            snapshots_found: snapshotCount,
            lifespan_hours: parseFloat(lifespanHours.toFixed(4)),
            cron_interval_est_minutes: Math.round(estimatedIntervalMinutes),
          },
          math_diagnosis: {
            new_formula_score: parseFloat(consistencyNew.toFixed(4)),
          }
        });
      }
    });

    return NextResponse.json(report, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({
      error: "INTERNAL_DEBUG_ERROR",
      message: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
