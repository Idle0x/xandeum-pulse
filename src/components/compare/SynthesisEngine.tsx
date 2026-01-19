import { Node } from '../types';
import { formatBytes } from '../utils/formatters';
import { getSafeIp } from '../utils/nodeHelpers';

// --- TYPES ---
export type NarrativeContext = {
  tab: 'OVERVIEW' | 'MARKET' | 'TOPOLOGY';
  metric?: string; 
  focusKey?: string | null; 
  hoverKey?: string | null; 
  nodes: Node[];
  benchmarks: any;
  chartSection?: string | null;
};

type AnalysisStats = {
  count: number;
  totalStorage: number;
  avgHealth: number;
  netAvg: number;
  delta: number;
  tier: 'positive' | 'neutral' | 'negative';
  stdDev: number;
  gini: number;             // 0 = perfectly equal, 1 = perfectly unequal
  countries: number;
  medianHealth: number;     // Better for spotting outliers
  medianStorage: number;
  top3Share: number;        // Percentage held by top 3
  top3Volume: number;       // Raw volume held by top 3
  isCentralized: boolean;   // Logic flag
  countryCounts: Record<string, number>;
  dominantRegion: string;
  dominanceScore: number;   // % of network in dominant region
};

type Tone = 'tech' | 'simple' | 'hybrid';

// --- SESSION MEMORY (Prevents flickering on re-renders) ---
const NARRATIVE_CACHE = new Map<string, string>();

// --- 1. THE "BIG DATA" LEXICON ---
// Organized by "Brain" Type to ensure distinct personalities.

const VOCAB = {
  // BRAIN 1: THE PERFORMANCE EXECUTIVE (Overview)
  overview: {
    headlines: [
      "System Performance Audit:", "Cluster Health Telemetry:", "Operational Efficiency Report:", 
      "Network Vitality Check:", "Aggregate Status Update:"
    ],
    vectors: {
      positive: [
        "The group is currently outperforming the global benchmark",
        "This cluster is operating at higher efficiency than the network average",
        "Telemetry indicates this group is a net-positive contributor"
      ],
      negative: [
        "The group is trailing behind the global benchmark",
        "Performance is degraded relative to the wider network",
        "This cluster is currently a drag on the global average"
      ]
    },
    drivers: {
      variance: [
        "Variance is high; inconsistent hardware is causing stability jitter.",
        "The gap between strong and weak nodes is too wide.",
        "Standard deviation indicates a mix of high-end and legacy hardware."
      ],
      stable: [
        "Variance is minimal, indicating a highly synchronized fleet.",
        "Hardware capability appears uniform across the cluster."
      ]
    },
    actions: {
      fix: ["Recommendation: Isolate underperforming nodes to restore the baseline.", "Action: Investigate the bottom 10% for hardware faults."],
      praise: ["Recommendation: Maintain current configuration.", "Action: No intervention required. System nominal."]
    }
  },

  // BRAIN 2: THE RISK ANALYST (Market)
  market: {
    structures: {
      oligarchy: [
        "Market Structure Warning: Oligarchy detected.",
        "High Concentration Risk: A few actors dominate the grid.",
        "Centralization Alert: Power is heavily skewed to the top."
      ],
      democracy: [
        "Market Structure: Healthy Democratic Distribution.",
        "Decentralization Status: Optimal. No single point of failure.",
        "The grid shows a healthy spread of resources."
      ]
    },
    whales: {
      high: [
        "Whale activity detected. The top players have oversized influence.",
        "Significant leverage is held by the top 3 stakeholders."
      ],
      low: [
        "No whales detected. Influence is evenly diluted.",
        "Market power is fragmented across many small stakeholders."
      ]
    },
    risks: {
      critical: [
        "Critical Risk: If the top 3 nodes fail, the network loses consensus capability.",
        "Fragility Assessment: High. The network relies too heavily on these leaders."
      ],
      stable: [
        "Resiliency Assessment: High. The network can survive the loss of its top actors.",
        "Robustness Confirmed: Individual failures will not impact global capacity."
      ]
    }
  },

  // BRAIN 3: THE GEOPOLITICAL STRATEGIST (Topology)
  topology: {
    spreads: {
      good: [
        "Global Footprint: Excellent. The fleet spans diverse jurisdictions.",
        "Geo-Diversity: High. Nodes are physically resilient to local events."
      ],
      bad: [
        "Global Footprint: Constrained. The fleet is geographically clustered.",
        "Geo-Diversity: Low. High physical proximity detected."
      ]
    },
    threats: {
      legal: [
        "Regulatory Risk: Critical. A single legislative change in this region could halt the network.",
        "Jurisdictional Trap: Too many assets are bound by the same laws."
      ],
      latency: [
        "Latency Risk: Physical clustering creates speed of light bottlenecks for global users.",
        "Availability Risk: A regional power outage would devastate availability."
      ]
    },
    assets: {
      loneWolf: [
        "Strategic Asset: This is a 'Lone Wolf' node, providing critical bridge access.",
        "High Value: It is the only gateway in this entire region.",
        "Edge Anchor: This unit drastically reduces latency for local users."
      ],
      redundant: [
        "Asset Value: Nominal. It is one of many nodes in this region.",
        "Redundancy: High. Losing this node has minimal impact on regional coverage."
      ]
    }
  }
};

// --- 2. INTELLIGENCE: THE MATH UPGRADE ---
const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  
  // Basic Sums
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75; 
  const delta = avgHealth - netAvg;

  // 1. Median Calculation (Better for outliers)
  const healths = nodes.map(n => n.health || 0).sort((a, b) => a - b);
  const storages = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const medianHealth = count % 2 !== 0 ? healths[mid] : (healths[mid - 1] + healths[mid]) / 2;
  const medianStorage = count % 2 !== 0 ? storages[mid] : (storages[mid - 1] + storages[mid]) / 2;

  // 2. Variance & Deviation
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // 3. Market Structure (Gini & Whales)
  // Gini Calculation: 0 = perfect equality, 1 = max inequality
  let giniNumerator = 0;
  storages.forEach((val, i) => { giniNumerator += (i + 1) * val; }); // Assuming sorted ascending
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  const top3Volume = storages.slice(-3).reduce((a, b) => a + b, 0); // Last 3 are largest
  const top3Share = (top3Volume / totalStorage) * 100;

  // 4. Topology Logic
  const countryCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const c = n.location?.countryName || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countries = Object.keys(countryCounts).length;
  const dominantRegion = Object.keys(countryCounts).reduce((a, b) => countryCounts[a] > countryCounts[b] ? a : b);
  const dominanceScore = ((countryCounts[dominantRegion] || 0) / count) * 100;

  let tier: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (delta > 5) tier = 'positive';
  if (delta < -5) tier = 'negative';

  return { 
    count, totalStorage, avgHealth, netAvg, delta, tier, stdDev, 
    gini, countries, medianHealth, medianStorage, top3Share, top3Volume, 
    isCentralized: top3Share > 50 || gini > 0.6,
    countryCounts, dominantRegion, dominanceScore
  };
};

// Helper: Root Cause Detector
const findRootCause = (node: Node, groupAvg: number) => {
  if (!node) return "unknown anomalies";
  if ((node.uptime || 0) < 50) return "critical uptime instability";
  if ((node.health || 0) < groupAvg - 15) return "severe hardware degradation";
  if ((node.credits || 0) === 0) return "zero economic output (misconfiguration)";
  return "sub-optimal latency or outdated software";
};

const roll = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


// --- 3. THE 7 STRATEGIC SCENARIOS ---

// === SCENARIO 1: OVERVIEW (DEFAULT) ===
// Logic: Performance Executive -> Aggregate Health Check
const buildOverviewDefault = (stats: AnalysisStats) => {
  // 1. Headline (Hard Data)
  const headline = `${roll(VOCAB.overview.headlines)} Average score is ${stats.avgHealth.toFixed(1)}/100.`;
  
  // 2. Context (Relative Performance)
  const diff = Math.abs(stats.delta).toFixed(1);
  const vectorText = stats.delta > 0 ? roll(VOCAB.overview.vectors.positive) : roll(VOCAB.overview.vectors.negative);
  const context = `${vectorText} by ${diff} points.`;

  // 3. Deep Dive (Variance/Driver)
  // Use Standard Deviation to determine if the group is "Wild" or "Tame"
  const deepDive = stats.stdDev > 15 ? roll(VOCAB.overview.drivers.variance) : roll(VOCAB.overview.drivers.stable);

  // 4. Action (Recommendation)
  const action = stats.delta > -5 ? roll(VOCAB.overview.actions.praise) : roll(VOCAB.overview.actions.fix);

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 2: OVERVIEW (CHART CLICK) ===
// Logic: Performance Executive -> Specific Metric Audit
const buildOverviewChart = (stats: AnalysisStats, section: string) => {
  const metricName = section.charAt(0).toUpperCase() + section.slice(1);
  
  // 1. Headline
  const headline = `Metric Deep Dive: ${metricName}.`;
  
  // 2. Context (Personality based on metric)
  let context = "";
  if (section === 'health') context = `This metric represents the composite vitality of the hardware.`;
  else if (section === 'storage') context = `This metric tracks the raw capacity available for data consensus.`;
  else if (section === 'uptime') context = `This is the heartbeat of the cluster; consistency is key.`;
  else context = `This metric directly correlates to economic output.`;

  // 3. Deep Dive (Median vs Average check)
  // If Median is much higher than Average, it means a few bad nodes are dragging us down.
  const skew = stats.medianHealth - stats.avgHealth;
  let deepDive = "";
  if (skew > 5) deepDive = "The median is significantly higher than the average, indicating a few low-performing outliers are skewing the data.";
  else deepDive = "The data distribution is normal; performance is consistent across the bell curve.";

  // 4. Action
  const action = "Review the bottom quartile to optimize this metric.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 3: OVERVIEW (NODE FOCUS) ===
// Logic: Performance Executive -> Employee Review
const buildOverviewNode = (stats: AnalysisStats, node: Node) => {
  const score = node.health || 0;
  const diff = score - stats.avgHealth;
  const safeIp = getSafeIp(node).replace('unit ', '');

  // 1. Headline
  const headline = `Node Audit [${safeIp}]: Health Score ${score}/100.`;

  // 2. Context (Vector)
  let context = "";
  if (diff < -5) context = `This unit is underperforming relative to its peers (Group Avg: ${stats.avgHealth.toFixed(0)}).`;
  else if (diff > 5) context = `This unit is a Top Performer, lifting the group average.`;
  else context = `This unit is performing exactly in line with the group baseline.`;

  // 3. Deep Dive (Root Cause)
  let deepDive = "";
  if (score < 60) {
      deepDive = `Root Cause Analysis: The low score is likely driven by ${findRootCause(node, stats.avgHealth)}.`;
  } else {
      deepDive = "Stability Analysis: No significant anomalies detected in telemetry.";
  }

  // 4. Action
  const action = score < 70 ? "Action: Immediate reboot or reconfiguration recommended." : "Action: Monitor for drift.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 4: MARKET (DEFAULT) ===
// Logic: Risk Analyst -> Market Structure Audit
const buildMarketDefault = (stats: AnalysisStats) => {
  // 1. Headline (Structure)
  const isOligarchy = stats.gini > 0.6 || stats.top3Share > 50;
  const headline = isOligarchy ? roll(VOCAB.market.structures.oligarchy) : roll(VOCAB.market.structures.democracy);

  // 2. Context (Concentration Data)
  const context = `The top 3 nodes currently control ${stats.top3Share.toFixed(1)}% of the entire network's storage capacity.`;

  // 3. Deep Dive (Simulation - Bus Factor)
  const lossString = formatBytes(stats.top3Volume);
  const deepDive = `Simulation: Hypothetically, if these top actors go offline simultaneously, the network loses ${lossString} of capacity instantly.`;

  // 4. Action (Risk Mitigation)
  const action = isOligarchy 
    ? "Strategy: Onboarding smaller, distinct nodes is recommended to dilute this centralization risk." 
    : "Strategy: Maintain current decentralization incentives.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 5: MARKET (NODE FOCUS) ===
// Logic: Risk Analyst -> Shareholder Report
const buildMarketNode = (stats: AnalysisStats, node: Node, metric: string) => {
  const m = metric === 'storage' ? 'storage_committed' : metric;
  const val = (node as any)[m] || 0;
  const total = metric === 'storage' ? stats.totalStorage : 100; // Simplified for non-storage
  const share = (val / total) * 100;
  
  // 1. Headline
  const headline = `Shareholder Report: Node holds ${share.toFixed(2)}% of market share.`;

  // 2. Context (Vs Median)
  // Calculate how many times larger this node is than the median
  const medianVal = stats.medianStorage || 1;
  const multiple = (val / medianVal).toFixed(1);
  const context = `This node is ${multiple}x larger than the median node size in this cluster.`;

  // 3. Deep Dive (Leverage)
  let deepDive = "";
  if (share > 10) deepDive = "Leverage Assessment: High. This node acts as a 'Market Maker.' Its uptime directly correlates to group stability.";
  else deepDive = "Leverage Assessment: Low. This node is a minor participant with minimal systemic risk impact.";

  // 4. Action
  const action = share > 15 ? "Warning: Further accumulation of share by this node would trigger a centralization warning." : "Status: Growth headroom available.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 6: TOPOLOGY (DEFAULT) ===
// Logic: Geopolitical Strategist -> Footprint Analysis
const buildTopologyDefault = (stats: AnalysisStats) => {
  // 1. Headline (Spread Audit)
  const isClumped = stats.dominanceScore > 50;
  const headline = isClumped ? roll(VOCAB.topology.spreads.bad) : roll(VOCAB.topology.spreads.good);

  // 2. Context (Skew Data)
  const context = `The fleet is distributed across ${stats.countries} jurisdictions, but ${stats.dominanceScore.toFixed(0)}% of resources are clumped within ${stats.dominantRegion}.`;

  // 3. Deep Dive (The Threat)
  const deepDive = isClumped ? roll(VOCAB.topology.threats.legal) : "No significant regulatory single-points-of-failure detected.";

  // 4. Action
  const action = isClumped 
    ? "Advisory: Geographic expansion into under-served regions (APAC/Americas) is advised to improve censorship resistance."
    : "Advisory: Continue global diversification strategy.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// === SCENARIO 7: TOPOLOGY (NODE FOCUS) ===
// Logic: Geopolitical Strategist -> Asset Valuation
const buildTopologyNode = (stats: AnalysisStats, node: Node) => {
  const country = node.location?.countryName || "Unknown";
  const countInCountry = stats.countryCounts[country] || 1;
  const isLoneWolf = countInCountry === 1;

  // 1. Headline (Location)
  const headline = `Asset Deployment: Node is active in ${country}.`;

  // 2. Context (Uniqueness)
  const context = isLoneWolf 
    ? `Uniqueness: Critical. It is currently the ONLY node serving this jurisdiction.`
    : `Uniqueness: Low. It shares this region with ${countInCountry - 1} other peers.`;

  // 3. Deep Dive (Value)
  const deepDive = isLoneWolf ? roll(VOCAB.topology.assets.loneWolf) : roll(VOCAB.topology.assets.redundant);

  // 4. Action
  const action = isLoneWolf 
    ? "Verdict: Maintaining high uptime for this specific unit is critical for global accessibility."
    : "Verdict: Failure of this node would be easily absorbed by local peers.";

  return `${headline} ${context} ${deepDive} ${action}`;
};

// --- 4. MAIN EXPORT ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Awaiting Telemetry...";

  const activeKey = ctx.focusKey || ctx.hoverKey || 'default';
  const sectionKey = ctx.chartSection || 'none';
  const metricKey = ctx.metric || 'storage';
  
  // Cache Key to prevent jitter during React re-renders, but allow updates when focus changes
  const cacheKey = `${ctx.tab}::${activeKey}::${sectionKey}::${metricKey}::${ctx.nodes.length}`;

  if (NARRATIVE_CACHE.has(cacheKey)) {
    return NARRATIVE_CACHE.get(cacheKey)!;
  }

  // 1. Run the Math (The Intelligence Layer)
  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating Cluster Physics...";

  const activeNode = activeKey !== 'default' ? ctx.nodes.find(n => n.pubkey === activeKey) || null : null;
  let narrative = "";

  // 2. Select the Scenario (The Strategy Layer)
  switch (ctx.tab) {
    case 'OVERVIEW':
      if (activeNode) narrative = buildOverviewNode(stats, activeNode);
      else if (ctx.chartSection) narrative = buildOverviewChart(stats, ctx.chartSection);
      else narrative = buildOverviewDefault(stats);
      break;

    case 'MARKET':
      if (activeNode) narrative = buildMarketNode(stats, activeNode, metricKey);
      else narrative = buildMarketDefault(stats);
      break;

    case 'TOPOLOGY':
      if (activeNode) narrative = buildTopologyNode(stats, activeNode);
      else narrative = buildTopologyDefault(stats);
      break;
  }

  NARRATIVE_CACHE.set(cacheKey, narrative);
  return narrative;
};
