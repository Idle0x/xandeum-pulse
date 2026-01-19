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
  intensity: 'neutral' | 'mild' | 'high' | 'critical';
  tier: 'positive' | 'neutral' | 'negative';
  stdDev: number;
  gini: number;
  countries: number;
  medianHealth: number;
  medianStorage: number;
  top3Share: number;
  top3Volume: number;
  isCentralized: boolean;
  countryCounts: Record<string, number>;
  dominantRegion: string;
  dominanceScore: number;
};

// --- SESSION MEMORY ---
const NARRATIVE_CACHE = new Map<string, string>();

// --- 1. THE COMBINATORIAL MATRIX (Expanded) ---
const MATRIX = {
  generic: {
    openers: [
      "Analysis suggests", "Telemetry confirms", "Data reveals", 
      "Current modeling indicates", "Our audit shows", "Diagnostic scans highlight",
      "System performance audit reveals:", "Cluster Health Telemetry:"
    ],
    bridges: [
      "which essentially means", "indicating that", "signifying a state where", 
      "effectively translating to", "which points toward", "translating to", 
      "suggesting a trend where"
    ],
    connectors: [
      "Furthermore,", "In addition,", "Additionally,", "Looking deeper,", 
      "On top of that,", "Crucially,"
    ],
  },
  intensity: {
    neutral: ["nominal", "stable", "consistent", "standard", "expected", "baseline"],
    mild: ["slight", "noticeable", "marginal", "minor", "subtle"],
    high: ["significant", "substantial", "evident", "pronounced", "clear", "elevated"],
    critical: ["extreme", "critical", "severe", "acute", "heavy", "urgent"]
  },
  // BRAIN 1: THE PERFORMANCE EXECUTIVE
  executive: { 
    verbs_up: [
      "outperforming", "surpassing", "exceeding", "lifting", "stabilizing",
      "operating at higher efficiency than"
    ],
    verbs_down: [
      "trailing", "lagging", "dragging", "suppressing", "compromising",
      "operating at degraded efficiency compared to"
    ],
    drivers: {
      variance: [
        "variance is high; inconsistent hardware is causing stability jitter",
        "the gap between strong and weak nodes is too wide",
        "standard deviation indicates a mix of high-end and legacy hardware",
        "hardware consistency is degraded"
      ],
      stable: [
        "variance is minimal, indicating a highly synchronized fleet",
        "hardware capability appears uniform across the cluster",
        "deviation is within nominal limits"
      ]
    },
    actions: {
      fix: [
        "Recommendation: Isolate underperforming nodes to restore the baseline.", 
        "Action: Investigate the bottom 10% for hardware faults.",
        "Action: Immediate reboot or reconfiguration recommended."
      ],
      praise: [
        "Recommendation: Maintain current configuration.", 
        "Action: No intervention required. System nominal.",
        "Action: Monitor for drift."
      ]
    }
  },
  // BRAIN 2: THE RISK ANALYST (Expanded for Multi-Metric Context)
  analyst: { 
    // Default Storage Vocab (Preserved)
    structures: {
      oligarchy: [
        "Market Structure Warning: Oligarchy detected",
        "High Concentration Risk: A few actors dominate the grid",
        "Centralization Alert: Power is heavily skewed to the top"
      ],
      democracy: [
        "Market Structure: Healthy Democratic Distribution",
        "Decentralization Status: Optimal. No single point of failure",
        "Market power is fragmented across many small stakeholders"
      ]
    },
    // New: Specific Vocabularies for Metrics
    market_verticals: {
      credits: {
        centralized: [
          "Economic Structure: Plutocracy detected. Wealth is highly concentrated",
          "Revenue Warning: A small minority controls the majority of earnings",
          "Inequality Alert: The Gini coefficient for revenue is critically high"
        ],
        decentralized: [
          "Economic Structure: Inclusive Commonwealth. Earnings are well distributed",
          "Revenue Status: Balanced. Incentives are reaching the wider fleet",
          "Equality Check: Healthy spread of economic rewards across the grid"
        ],
        risks: "If the top earners migrate, the economic incentive model may destabilize.",
        action_fix: "Strategy: Review incentive algorithms to support mid-tier providers.",
        action_keep: "Strategy: Current reward distribution encourages broad participation."
      },
      health: {
        centralized: [
          "Quality Structure: Stratified. Only a few nodes maintain elite standards",
          "Performance Gap: The network relies on a small 'Meritocratic Elite'",
          "Integrity Warning: High-quality hardware is concentrated in too few hands"
        ],
        decentralized: [
          "Quality Structure: Standardized Excellence. High health is ubiquitous",
          "Performance Status: Uniform. The fleet operates as a cohesive unit",
          "Integrity Check: Consistent hardware quality across the board"
        ],
        risks: "Reliance on a few 'Super Nodes' for quality assurance creates fragility.",
        action_fix: "Strategy: Launch hardware upgrade campaigns for the bottom 50%.",
        action_keep: "Strategy: Maintenance protocols are effectively standardized."
      },
      uptime: {
        centralized: [
          "Stability Structure: Anchored. Network relies on a few ancient nodes",
          "Reliability Warning: Uptime is not distributed; it is monopolized",
          "Persistence Gap: Most nodes are transient; only a few are permanent"
        ],
        decentralized: [
          "Stability Structure: Resilient Mesh. High uptime is the norm",
          "Reliability Status: Distributed. The grid is immune to individual churn",
          "Persistence Check: Strong retention rates across the entire population"
        ],
        risks: "If the 'Stability Anchors' go offline, the network average will plummet.",
        action_fix: "Strategy: Incentivize longer node retention to broaden the stability base.",
        action_keep: "Strategy: Churn rates are low. Network persistence is optimal."
      }
    },
    whales: {
      high: [
        "Whale activity detected; top players have oversized influence",
        "Significant leverage is held by the top stakeholders",
        "This node acts as a 'Market Maker'"
      ],
      low: [
        "No whales detected; influence is evenly diluted",
        "Market power is distributed among minor participants"
      ]
    },
    risks: {
      critical: [
        "Critical Risk: If the top 3 nodes fail, the network loses consensus capability",
        "Fragility Assessment: High. The network relies too heavily on these leaders"
      ],
      stable: [
        "Resiliency Assessment: High. The network can survive the loss of its top actors",
        "Robustness Confirmed: Individual failures will not impact global capacity"
      ]
    }
  },
  // BRAIN 3: THE GEOPOLITICAL STRATEGIST
  strategist: { 
    geo_verbs: ["clustered", "concentrated", "distributed", "spread", "anchored"],
    spreads: {
      good: [
        "Global Footprint: Excellent. The fleet spans diverse jurisdictions",
        "Geo-Diversity: High. Nodes are physically resilient to local events"
      ],
      bad: [
        "Global Footprint: Constrained. The fleet is geographically clustered",
        "Geo-Diversity: Low. High physical proximity detected"
      ]
    },
    threats: {
      legal: [
        "Regulatory Risk: Critical. A single legislative change in this region could halt the network",
        "Jurisdictional Trap: Too many assets are bound by the same laws"
      ],
      latency: [
        "Latency Risk: Physical clustering creates speed of light bottlenecks for global users",
        "Availability Risk: A regional power outage would devastate availability"
      ]
    },
    assets: {
      loneWolf: [
        "Strategic Asset: This is a 'Lone Wolf' node, providing critical bridge access",
        "High Value: It is the only gateway in this entire region",
        "Edge Anchor: This unit drastically reduces latency for local users"
      ],
      redundant: [
        "Asset Value: Nominal. It is one of many nodes in this region",
        "Redundancy: High. Losing this node has minimal impact on regional coverage"
      ]
    }
  }
};

const PERSONALITIES: Record<string, any> = {
  health: { simple: "vitality", tech: "composite integrity", action: "hardware check" },
  storage: { simple: "capacity", tech: "consensus volume", action: "provisioning" },
  uptime: { simple: "reliability", tech: "temporal persistence", action: "reboot cycle" },
  credits: { simple: "earnings", tech: "economic throughput", action: "revenue audit" }
};

// --- 2. THE WEAVING ENGINE ---

const roll = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const weave = (tech: string, simple: string) => {
  const pattern = Math.random();
  if (pattern > 0.66) return `${tech}. ${roll(MATRIX.generic.bridges)} ${simple}.`;
  if (pattern > 0.33) return `${simple}. This is driven by ${tech.toLowerCase()}.`;
  return `${tech}; specifically, ${simple}.`;
};

const getIntensity = (delta: number): AnalysisStats['intensity'] => {
  const abs = Math.abs(delta);
  if (abs > 25) return 'critical';
  if (abs > 10) return 'high';
  if (abs > 3) return 'mild';
  return 'neutral';
};

// --- 3. THE ANALYTICS ENGINE ---

// Helper: Dynamic Distribution Calculation for any metric
const getMetricDistribution = (nodes: Node[], metricKey: string) => {
  const values = nodes.map(n => (n as any)[metricKey] || 0).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0) || 1; // avoid divide by zero
  const count = values.length;
  
  // Top 3 Share
  const top3Sum = values.slice(-3).reduce((a, b) => a + b, 0);
  const top3Share = (top3Sum / sum) * 100;

  // Gini
  let giniNumerator = 0;
  values.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * sum) - (count + 1) / count;

  // Concentration Thresholds (Slightly looser for non-storage metrics)
  const isConcentrated = top3Share > 40 || gini > 0.55;

  return { sum, top3Sum, top3Share, gini, isConcentrated, count };
};

const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  
  // Basic Sums
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75; 
  const delta = avgHealth - netAvg;

  // Median Calculation
  const healths = nodes.map(n => n.health || 0).sort((a, b) => a - b);
  const storages = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  
  const medianHealth = count % 2 !== 0 ? healths[mid] : (healths[mid - 1] + healths[mid]) / 2;
  const medianStorage = count % 2 !== 0 ? storages[mid] : (storages[mid - 1] + storages[mid]) / 2;

  // Variance & Deviation
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Gini Calculation (Storage Default)
  let giniNumerator = 0;
  storages.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  // Whale Calculation (Storage Default)
  const top3Volume = storages.slice(-3).reduce((a, b) => a + b, 0);
  const top3Share = (top3Volume / totalStorage) * 100;

  // Topology Logic
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
    count, totalStorage, avgHealth, netAvg, delta, tier,
    intensity: getIntensity(delta), 
    stdDev, 
    gini, countries, medianHealth, medianStorage, top3Share, top3Volume, 
    isCentralized: top3Share > 50 || gini > 0.6,
    countryCounts, dominantRegion, dominanceScore
  };
};

const findRootCause = (node: Node, groupAvg: number) => {
  if (!node) return "unknown anomalies";
  if ((node.uptime || 0) < 50) return "critical uptime instability";
  if ((node.health || 0) < groupAvg - 15) return "severe hardware degradation";
  if ((node.credits || 0) === 0) return "zero economic output (possible misconfiguration)";
  return "sub-optimal latency or configuration drift";
};


// --- 4. THE SCENARIO STRATEGIES ---

/** SCENARIO 1: OVERVIEW - DEFAULT */
const buildOverviewDefault = (stats: AnalysisStats) => {
  const h1 = `${roll(MATRIX.generic.openers)} the cluster health is at ${stats.avgHealth.toFixed(1)}%.`;
  
  const tech = `${stats.delta > 0 ? roll(MATRIX.executive.verbs_up) : roll(MATRIX.executive.verbs_down)} the network benchmark by ${Math.abs(stats.delta).toFixed(1)} points`;
  const simple = `this means the group is ${stats.delta > 0 ? 'performing better' : 'struggling compared'} to the world average`;
  const h2 = weave(tech, simple);

  const h3 = stats.stdDev > 15 
    ? `Deep Dive: ${roll(MATRIX.executive.drivers.variance)}`
    : `Deep Dive: ${roll(MATRIX.executive.drivers.stable)}`;

  const h4 = stats.delta > -5 ? roll(MATRIX.executive.actions.praise) : roll(MATRIX.executive.actions.fix);
  
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 2: OVERVIEW - CHART CLICK */
const buildOverviewChart = (stats: AnalysisStats, section: string) => {
  const p = PERSONALITIES[section] || PERSONALITIES.health;
  const h1 = `Targeted audit on ${p.tech} (${section}).`;
  
  const skew = stats.medianHealth - stats.avgHealth; // Simplified skew proxy
  const tech = `The median value is ${stats.medianHealth.toFixed(1)} vs the average of ${stats.avgHealth.toFixed(1)}`;
  
  let simple = "";
  if (Math.abs(skew) > 5) {
      simple = `indicating that a few outliers are skewing the data ${skew > 0 ? 'negatively' : 'positively'}`;
  } else {
      simple = `indicating the ${p.simple} is consistent across the bell curve`;
  }
  const h2 = weave(tech, simple);

  const h3 = `This specific metric drives the overall ${stats.intensity} score interpretation.`;

  const h4 = skew > 5 
    ? "Recommendation: Review the bottom quartile to optimize this metric." 
    : `Focusing on ${p.action} will maintain this stability.`;

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 3: OVERVIEW - NODE FOCUS */
const buildOverviewNode = (stats: AnalysisStats, node: Node) => {
  const score = node.health || 0;
  const diff = score - stats.avgHealth;
  const safeIp = getSafeIp(node).replace('unit ', '');

  const h1 = `Node Performance Review [${safeIp}]: ${score}/100.`;
  
  let tech = "";
  let simple = "";
  
  if (diff > 5) {
      tech = "Telemetry places this unit in the upper percentile";
      simple = "it is a Top Performer lifting the group average";
  } else if (diff < -5) {
      tech = `Performance is trailing the group baseline by ${Math.abs(diff).toFixed(1)} points`;
      simple = "it is currently a liability for the local cluster";
  } else {
      tech = "Performance is nominal and aligned with peers";
      simple = "it is performing exactly in line with expectations";
  }
  const h2 = weave(tech, simple);

  let h3 = "";
  if (score < 60) {
      h3 = `Root Cause Analysis: The low score is likely driven by ${findRootCause(node, stats.avgHealth)}.`;
  } else {
      h3 = "Stability Analysis: No significant anomalies detected in telemetry.";
  }

  const h4 = score < 70 ? roll(MATRIX.executive.actions.fix) : roll(MATRIX.executive.actions.praise);

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 4A: MARKET - STORAGE (DEFAULT) */
const buildMarketStorage = (stats: AnalysisStats) => {
  const h1 = stats.isCentralized 
    ? roll(MATRIX.analyst.structures.oligarchy)
    : roll(MATRIX.analyst.structures.democracy);
  
  const tech = `The top 3 stakeholders aggregate ${stats.top3Share.toFixed(1)}% of total grid volume`;
  const simple = `meaning if just three actors leave, ${stats.top3Share > 50 ? 'the network consensus breaks' : 'the network remains stable'}`;
  const h2 = weave(tech, simple);

  const lossString = formatBytes(stats.top3Volume);
  const h3 = `Simulation: Hypothetically, if these top actors go offline simultaneously, the network loses ${lossString} of capacity instantly.`;

  const h4 = stats.isCentralized 
    ? "Strategy: Onboarding smaller, distinct nodes is recommended to dilute this centralization risk." 
    : "Strategy: Maintain current decentralization incentives.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 4B: MARKET - DYNAMIC METRICS (Credits, Health, Uptime) */
const buildMarketMetric = (nodes: Node[], metric: string) => {
  // Map metric name to node key and matrix key
  let nodeKey = metric;
  let matrixKey: 'credits' | 'health' | 'uptime' = 'credits'; // Default fallback
  
  if (metric === 'credits') { nodeKey = 'credits'; matrixKey = 'credits'; }
  if (metric === 'health') { nodeKey = 'health'; matrixKey = 'health'; }
  if (metric === 'uptime') { nodeKey = 'uptime'; matrixKey = 'uptime'; }

  const dist = getMetricDistribution(nodes, nodeKey);
  const vocab = MATRIX.analyst.market_verticals[matrixKey];

  // 1. Headline (Metric Specific Structure)
  const h1 = dist.isConcentrated ? roll(vocab.centralized) : roll(vocab.decentralized);

  // 2. Context (Statistical Reality)
  const tech = `The top 3 performers hold ${dist.top3Share.toFixed(1)}% of the total ${metric} value (Gini: ${dist.gini.toFixed(2)})`;
  const simple = dist.isConcentrated
    ? "indicating a heavy skew where a minority dictates the metrics"
    : "demonstrating a healthy curve where performance is broadly distributed";
  const h2 = weave(tech, simple);

  // 3. Deep Dive (Risks specific to metric)
  const h3 = `Deep Dive: ${vocab.risks}`;

  // 4. Action
  const h4 = dist.isConcentrated ? vocab.action_fix : vocab.action_keep;

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 5: MARKET - NODE FOCUS */
const buildMarketNode = (stats: AnalysisStats, node: Node, metric: string) => {
  const m = metric === 'storage' ? 'storage_committed' : metric;
  const val = (node as any)[m] || 0;
  // Dynamic total calculation for accurate share
  const total = metric === 'storage' 
    ? stats.totalStorage 
    : (stats.count * (metric === 'health' || metric === 'uptime' ? 100 : 100)); // approx base for % metrics

  // Use simple comparison for % based metrics if total is abstract
  const isPercentMetric = metric === 'health' || metric === 'uptime';
  const share = isPercentMetric ? val : (val / (total || 1)) * 100;

  const h1 = `Shareholder Report: Node holds ${val.toFixed(0)}${isPercentMetric ? ' pts' : ''} in ${metric}.`;
  
  const medianVal = stats.medianStorage || 1; 
  // Note: For non-storage, median calc is complex in this scope, simplifying to relative checks
  
  const tech = isPercentMetric 
    ? `This node is operating at ${val}% efficiency relative to theoretical max`
    : `This represents a significant chunk of the local ${metric} pool`;
    
  const simple = val > (isPercentMetric ? 90 : stats.medianStorage * 2)
    ? 'it is effectively a Market Leader' 
    : 'it is a standard participant';
  const h2 = weave(tech, simple);

  const h3 = val > (isPercentMetric ? 90 : stats.medianStorage * 4) 
    ? roll(MATRIX.analyst.whales.high) 
    : roll(MATRIX.analyst.whales.low);

  const h4 = "Status: Individual contribution analysis complete.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 6: TOPOLOGY - DEFAULT */
const buildTopologyDefault = (stats: AnalysisStats) => {
  const isClumped = stats.dominanceScore > 50;
  const h1 = isClumped ? roll(MATRIX.strategist.spreads.bad) : roll(MATRIX.strategist.spreads.good);
  
  const tech = `Regional dominance is concentrated in ${stats.dominantRegion} at ${stats.dominanceScore.toFixed(0)}%`;
  const simple = `which is risky because a single country's laws could ${roll(MATRIX.intensity.critical)}ly hit the grid`;
  const h2 = weave(tech, simple);

  const h3 = isClumped 
    ? `Primary Vulnerability: ${Math.random() > 0.5 ? roll(MATRIX.strategist.threats.legal) : roll(MATRIX.strategist.threats.latency)}` 
    : "No significant regulatory single-points-of-failure detected.";

  const h4 = isClumped 
    ? "Advisory: Geographic expansion into under-served regions (APAC/Americas) is advised." 
    : "Advisory: Continue global diversification strategy.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 7: TOPOLOGY - NODE FOCUS */
const buildTopologyNode = (stats: AnalysisStats, node: Node) => {
  const country = node.location?.countryName || "Unknown";
  const countInCountry = stats.countryCounts[country] || 1;
  const isLoneWolf = countInCountry === 1;

  const h1 = `Strategic Valuation: Asset deployed in ${country}.`;
  
  const tech = `Regional saturation for this jurisdiction is ${countInCountry > 1 ? roll(MATRIX.intensity.high) : 'minimal'}`;
  const simple = isLoneWolf 
    ? "it is currently the ONLY node serving this jurisdiction" 
    : `it shares this region with ${countInCountry - 1} other peers`;
  const h2 = weave(tech, simple);

  const h3 = isLoneWolf ? roll(MATRIX.strategist.assets.loneWolf) : roll(MATRIX.strategist.assets.redundant);

  const h4 = isLoneWolf 
    ? "Verdict: High-value 'Lone Wolf' asset. Maintain priority uptime." 
    : "Verdict: Failure of this node would be easily absorbed by local peers.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

// --- 5. MAIN ROUTER ---

export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Awaiting Telemetry...";

  const activeKey = ctx.focusKey || ctx.hoverKey || 'default';
  const sectionKey = ctx.chartSection || 'none';
  const metricKey = ctx.metric || 'storage';
  const cacheKey = `${ctx.tab}::${activeKey}::${sectionKey}::${metricKey}::${ctx.nodes.length}`;

  if (NARRATIVE_CACHE.has(cacheKey)) return NARRATIVE_CACHE.get(cacheKey)!;

  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating Cluster Physics...";

  const activeNode = activeKey !== 'default' ? ctx.nodes.find(n => n.pubkey === activeKey) || null : null;
  let narrative = "";

  switch (ctx.tab) {
    case 'OVERVIEW':
      if (activeNode) narrative = buildOverviewNode(stats, activeNode);
      else if (ctx.chartSection) narrative = buildOverviewChart(stats, ctx.chartSection);
      else narrative = buildOverviewDefault(stats);
      break;
    case 'MARKET':
      if (activeNode) {
        narrative = buildMarketNode(stats, activeNode, metricKey);
      } else {
        // Router: Logic Bifurcation for Multi-Metric Markets
        if (metricKey === 'storage' || !metricKey) {
            narrative = buildMarketStorage(stats);
        } else {
            // Handles Credits, Health, Uptime with unique persona logic
            narrative = buildMarketMetric(ctx.nodes, metricKey);
        }
      }
      break;
    case 'TOPOLOGY':
      if (activeNode) narrative = buildTopologyNode(stats, activeNode);
      else narrative = buildTopologyDefault(stats);
      break;
  }

  NARRATIVE_CACHE.set(cacheKey, narrative);
  return narrative;
};
