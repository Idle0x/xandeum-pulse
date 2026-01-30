import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// --- 1. BYPASS CACHE & SETUP DIRECT CONNECTION ---
// We use a fresh client to ensure we aren't seeing stale cached data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic'; // Disable Next.js Caching for this route

export async function GET() {
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
    // 1. Fetch RAW Snapshots (Last 7 Days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Selecting minimal fields needed for calculation
    const { data: snapshots, error } = await supabase
      .from('node_snapshots')
      .select('node_id, created_at, uptime, credits')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({ error: "CRITICAL: Database returned 0 rows for the last 7 days." });
    }

    // 2. Group by Node ID
    const grouped: Record<string, any[]> = {};
    snapshots.forEach((s) => {
      if (!grouped[s.node_id]) grouped[s.node_id] = [];
      grouped[s.node_id].push(s);
    });

    report.summary.total_nodes_found = Object.keys(grouped).length;

    // 3. RUN SIMULATION ON EVERY NODE
    Object.entries(grouped).forEach(([nodeId, history]) => {
      
      // --- THE DIAGNOSTIC LOGIC ---
      const firstPoint = history[0];
      const lastPoint = history[history.length - 1];
      
      const firstTime = new Date(firstPoint.created_at).getTime();
      const lastTime = new Date(lastPoint.created_at).getTime();
      
      // Metric 1: True Lifespan (Hours)
      const lifespanMs = lastTime - firstTime;
      const lifespanHours = lifespanMs / (1000 * 60 * 60);

      // Metric 2: Data Density
      const snapshotCount = history.length;
      
      // Metric 3: The "Old" Expectation (Hardcoded 168h)
      const expectedOld = 168;
      const consistencyOld = Math.min(1, snapshotCount / (expectedOld * 0.8));

      // Metric 4: The "New" Expectation (Age Aware)
      // Standard expectation: 1 snapshot per hour (based on 168 in 7 days)
      // If your cron runs every 5 mins, this expectation needs to be higher (e.g., 12 per hour)
      // DETECT CRON FREQUENCY:
      let estimatedIntervalMinutes = 60; // Default
      if (snapshotCount > 1) {
          const avgDiffMs = lifespanMs / (snapshotCount - 1);
          estimatedIntervalMinutes = avgDiffMs / (1000 * 60);
      }
      
      // Calculate how many we SHOULD have for this lifespan
      const snapshotsPerHour = 60 / Math.max(1, estimatedIntervalMinutes);
      const expectedNew = Math.min(168 * snapshotsPerHour, lifespanHours * snapshotsPerHour);
      
      // Safety to prevent division by zero
      const safeExpected = Math.max(1, expectedNew);
      const consistencyNew = Math.min(1, snapshotCount / (safeExpected * 0.8));

      // --- FAILURE ANALYSIS ---
      let failureReason = "NONE";
      let isZero = false;

      // Why is it zero?
      if (snapshotCount === 0) {
          failureReason = "NO_DATA";
          isZero = true;
      } else if (snapshotCount === 1) {
          failureReason = "SINGLE_POINT_FAILURE"; // Cannot calculate span with 1 point
          isZero = true;
      } else if (lifespanHours < 0.05) {
          failureReason = "MICRO_LIFESPAN"; // Less than 3 minutes of history
          isZero = true; // Often results in math errors
      } else if (consistencyNew < 0.01) {
          failureReason = "EXTREME_SPARSITY"; // We have history, but HUGE gaps
          isZero = true;
      }

      // Special Check for the user's specific 0.00 issue
      // If the OLD math gives ~0 but NEW math gives > 0, we identify the fix works.
      const wouldFixWork = consistencyOld < 0.01 && consistencyNew > 0.1;

      // Add to Report ONLY if it's failing or interesting
      if (consistencyNew < 0.1 || failureReason !== "NONE") {
        if (isZero) report.summary.nodes_with_zero_score++;
        
        // Track reasons
        report.summary.common_failure_reasons[failureReason] = (report.summary.common_failure_reasons[failureReason] || 0) + 1;

        report.failures.push({
          node_id: nodeId,
          status: failureReason,
          metrics: {
            snapshots_found: snapshotCount,
            lifespan_hours: parseFloat(lifespanHours.toFixed(4)),
            first_seen: firstPoint.created_at,
            last_seen: lastPoint.created_at,
            cron_interval_est_minutes: Math.round(estimatedIntervalMinutes),
          },
          math_diagnosis: {
            old_formula_score: parseFloat(consistencyOld.toFixed(4)),
            new_formula_expected_snapshots: parseFloat(safeExpected.toFixed(2)),
            new_formula_score: parseFloat(consistencyNew.toFixed(4)),
            is_fix_effective: wouldFixWork
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
