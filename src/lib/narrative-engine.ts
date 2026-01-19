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
  totalCredits: number;
  avgHealth: number;
  avgUptime: number;
  netAvg: number;
  delta: number;
  intensity: 'neutral' | 'mild' | 'high' | 'critical';
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

// --- 1. THE COMBINATORIAL MATRIX (Expanded & Preserved) ---

const MATRIX = {
  generic: {
    openers: ["System Performance Audit:", "Cluster Health Telemetry:", "Operational Efficiency Report:", "Network Vitality Check:", "Aggregate Status Update:"],
    bridges: ["which effectively translates to", "indicating a state where", "signifying that", "demonstrating that"],
    connectors: ["Furthermore,", "Additionally,", "Consequently,", "In this context,"],
  },
  intensity: {
    neutral: ["nominal", "stable", "consistent", "balanced", "uniform"],
    mild: ["noticeable", "marginal", "minor", "slight"],
    high: ["significant", "substantial", "pronounced", "evident"],
    critical: ["critical", "severe", "acute", "extreme"]
  },
  executive: { // Overview Tab
    verbs_up: ["outperforming", "surpassing", "operating at higher efficiency than", "net-positive relative to"],
    verbs_down: ["trailing", "lagging behind", "operating at degraded efficiency vs", "dragging down"],
    drivers: ["inconsistent hardware capability", "configuration drift", "legacy hardware mixing", "resource contention"],
  },
  analyst: { // Market Tab (Preserved + Expanded)
    structures: ["Oligarchy", "Monopoly", "Centralized Cluster", "Democratic Distribution", "Decentralized Grid"],
    impacts: ["consensus capability loss", "systemic fragility", "high concentration risk", "market volatility"],
    // New metric-specific lexicons for Market Tab
    health_lex: ["Vitality Variance", "Quality-of-Service Spread", "Integrity Distribution"],
    uptime_lex: ["Temporal Persistence", "Reliability Equilibrium", "Availability Mesh"],
    credit_lex: ["Economic Yield Concentration", "Revenue Democratization", "Incentive Symmetry"]
  },
  strategist: { // Topology Tab
    geo_verbs: ["physically resilient", "geographically clustered", "jurisdictionally bound", "globally distributed"],
    threats_legal: ["Regulatory Risk: A single legislative change could halt the network", "Jurisdictional Trap: Assets are bound by the same laws"],
    threats_latency: ["Latency Risk: Physical clustering creates speed-of-light bottlenecks", "Availability Risk: Regional power outages would devastate uptime"],
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

const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const totalCredits = nodes.reduce((a, b) => a + (b.credits || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const avgUptime = nodes.reduce((a, b) => a + (b.uptime || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75; 
  const delta = avgHealth - netAvg;

  const healths = nodes.map(n => n.health || 0).sort((a, b) => a - b);
  const storages = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  
  const medianHealth = count % 2 !== 0 ? healths[mid] : (healths[mid - 1] + healths[mid]) / 2;
  const medianStorage = count % 2 !== 0 ? storages[mid] : (storages[mid - 1] + storages[mid]) / 2;

  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  let giniNumerator = 0;
  storages.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * (totalStorage || 1)) - (count + 1) / count;

  const top3Volume = storages.slice(-3).reduce((a, b) => a + b, 0);
  const top3Share = (top3Volume / (totalStorage || 1)) * 100;

  const countryCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const c = n.location?.countryName || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countries = Object.keys(countryCounts).length;
  const dominantRegion = Object.keys(countryCounts).reduce((a, b) => countryCounts[a] > countryCounts[b] ? a : b, "Unknown");
  const dominanceScore = ((countryCounts[dominantRegion] || 0) / count) * 100;

  return { 
    count, totalStorage, totalCredits, avgHealth, avgUptime, netAvg, delta, intensity: getIntensity(delta), stdDev, 
    gini, countries, medianHealth, medianStorage, top3Share, top3Volume, 
    isCentralized: top3Share > 50 || gini > 0.6,
    countryCounts, dominantRegion, dominanceScore
  };
};

const findRootCause = (node: Node, groupAvg: number) => {
  if (!node) return "unknown anomalies";
  if ((node.uptime || 0) < 50) return "critical uptime instability";
  if ((node.health || 0) < groupAvg - 15) return "severe hardware degradation";
  if ((node.credits || 0) === 0) return "zero economic output (misconfiguration)";
  return "sub-optimal latency or outdated software";
};

// --- 4. THE SCENARIO STRATEGIES ---

/** SCENARIO 1: OVERVIEW - DEFAULT */
const buildOverviewDefault = (stats: AnalysisStats) => {
  const h1 = `${roll(MATRIX.generic.openers)} Average score is ${stats.avgHealth.toFixed(1)}/100.`;
  const tech = `The group is ${stats.delta > 0 ? roll(MATRIX.executive.verbs_up) : roll(MATRIX.executive.verbs_down)} the global benchmark by ${Math.abs(stats.delta).toFixed(1)} points`;
  const simple = `this cluster is ${stats.delta > 0 ? 'a net-positive contributor' : 'currently a drag on the global average'}`;
  const h2 = weave(tech, simple);
  const h3 = stats.stdDev > 15 
    ? `Variance is high; ${roll(MATRIX.executive.drivers)} is causing stability jitter.`
    : `Variance is minimal, indicating a highly synchronized fleet.`;
  const h4 = stats.delta > -5 ? "Recommendation: Maintain current configuration." : "Action: Investigate the bottom 10% for hardware faults.";
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 2: OVERVIEW - CHART CLICK */
const buildOverviewChart = (stats: AnalysisStats, section: string) => {
  const p = PERSONALITIES[section] || PERSONALITIES.health;
  const h1 = `Metric Deep Dive: ${p.tech} (${section}).`;
  const tech = `The median value is ${stats.medianHealth} vs the average of ${stats.avgHealth.toFixed(1)}`;
  const simple = stats.medianHealth > stats.avgHealth 
    ? `indicating a few low-performing outliers are dragging down the score`
    : `indicating performance is consistent across the bell curve`;
  const h2 = weave(tech, simple);
  const h3 = `This specific metric is a primary driver of the group's ${roll(MATRIX.intensity[stats.intensity])} performance.`;
  const h4 = `Focusing on ${p.action} will yield the highest ROI for this group.`;
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 3: OVERVIEW - NODE FOCUS */
const buildOverviewNode = (stats: AnalysisStats, node: Node) => {
  const score = node.health || 0;
  const diff = score - stats.avgHealth;
  const safeIp = getSafeIp(node).replace('unit ', '');
  const h1 = `Node Audit [${safeIp}]: Health Score ${score}/100.`;
  const tech = `This unit is ${diff > 0 ? roll(MATRIX.executive.verbs_up) : roll(MATRIX.executive.verbs_down)} the peer group (Avg: ${stats.avgHealth.toFixed(0)})`;
  const simple = diff > 0 ? "it is a Top Performer, lifting the group average" : "it is underperforming relative to its peers";
  const h2 = weave(tech, simple);
  const h3 = score < 60 ? `Root Cause Analysis: The low score is likely driven by ${findRootCause(node, stats.avgHealth)}.` : "Stability Analysis: No significant anomalies detected.";
  const h4 = score < 70 ? "Action: Immediate reboot or reconfiguration recommended." : "Action: Monitor for drift.";
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 4: MARKET - DYNAMIC DEFAULT (The Fix) */
const buildMarketDefault = (stats: AnalysisStats, metric: string) => {
  // Logic Branching based on Metric
  if (metric === 'storage') {
    const h1 = `${roll(MATRIX.generic.openers)} ${stats.isCentralized ? "Market Structure Warning: Oligarchy detected." : "Market Structure: Healthy Democratic Distribution."}`;
    const tech = `The top 3 stakeholders control ${stats.top3Share.toFixed(1)}% of the entire network's storage capacity`;
    const simple = `centralization risk is ${stats.isCentralized ? 'high' : 'optimal'}`;
    const h2 = weave(tech, simple);
    const lossString = formatBytes(stats.top3Volume);
    const h3 = `Simulation: Hypothetically, if these top actors go offline simultaneously, the network loses ${lossString} of capacity instantly.`;
    const h4 = stats.isCentralized ? "Strategy: Onboarding smaller, distinct nodes is recommended." : "Strategy: Maintain decentralization incentives.";
    return `${h1} ${h2} ${h3} ${h4}`;
  }

  if (metric === 'health') {
    const h1 = `Market Analysis: ${roll(MATRIX.analyst.health_lex)}.`;
    const tech = `Quality distribution shows a standard deviation of ${stats.stdDev.toFixed(1)}`;
    const simple = stats.stdDev > 10 ? "indicating a tiered performance hierarchy" : "suggesting uniform hardware standards across the market";
    const h2 = weave(tech, simple);
    const h3 = `The market average vitality is ${stats.avgHealth.toFixed(0)}/100, meaning ${roll(MATRIX.analyst.impacts[0])} is a low risk factor.`;
    const h4 = "Strategy: Target low-vitality clusters for hardware upgrades.";
    return `${h1} ${h2} ${h3} ${h4}`;
  }

  if (metric === 'uptime') {
    const h1 = `Market Analysis: ${roll(MATRIX.analyst.uptime_lex)}.`;
    const tech = `Average temporal persistence is hovering at ${stats.avgUptime.toFixed(1)}%`;
    const simple = stats.avgUptime > 95 ? "representing a highly resilient mesh" : "indicating significant pockets of downtime";
    const h2 = weave(tech, simple);
    const h3 = `Uptime distribution suggests ${stats.avgUptime > 90 ? "robust reliability" : "systemic fragility"} across the participant pool.`;
    const h4 = "Strategy: Implement stricter slashing for nodes below 90% uptime.";
    return `${h1} ${h2} ${h3} ${h4}`;
  }

  if (metric === 'credits') {
    const h1 = `Market Analysis: ${roll(MATRIX.analyst.credit_lex)}.`;
    const tech = `Economic throughput shows a Gini Coefficient of ${stats.gini.toFixed(2)}`;
    const simple = stats.gini > 0.5 ? "wealth is heavily concentrated in top nodes" : "earnings are distributed equitably across the cluster";
    const h2 = weave(tech, simple);
    const h3 = `Total economic volume for this group is currently substantial, impacting ${roll(MATRIX.analyst.impacts[3])}.`;
    const h4 = "Strategy: Re-balance incentives to encourage smaller node profitability.";
    return `${h1} ${h2} ${h3} ${h4}`;
  }

  return "Analyzing Market Dynamics...";
};

/** SCENARIO 5: MARKET - NODE FOCUS */
const buildMarketNode = (stats: AnalysisStats, node: Node, metric: string) => {
  const p = PERSONALITIES[metric] || PERSONALITIES.storage;
  const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
  const total = metric === 'storage' ? stats.totalStorage : (metric === 'credits' ? stats.totalCredits : 100);
  const share = total > 0 ? (val / total) * 100 : 0;

  const h1 = `Shareholder Report: Node holds ${share.toFixed(2)}% of total ${p.simple} share.`;
  const multiple = (val / (metric === 'storage' ? (stats.medianStorage || 1) : (stats.avgHealth || 1))).toFixed(1);
  const tech = `This node is ${multiple}x the peer median in terms of ${p.tech}`;
  const simple = share > 10 ? "it acts as a 'Market Maker' with high leverage" : "it is a minor participant with minimal systemic risk";
  const h2 = weave(tech, simple);
  const h3 = share > 10 ? "Leverage Assessment: High. Its stability directly correlates to group stability." : "Leverage Assessment: Low. Failure would be absorbed by the mesh.";
  const h4 = share > 15 ? "Warning: High concentration detected." : "Status: Growth headroom available.";
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 6: TOPOLOGY - DEFAULT */
const buildTopologyDefault = (stats: AnalysisStats) => {
  const isClumped = stats.dominanceScore > 50;
  const h1 = `Global Footprint: ${isClumped ? "Constrained. The fleet is geographically clustered." : "Excellent. The fleet spans diverse jurisdictions."}`;
  const tech = `${stats.dominanceScore.toFixed(0)}% of resources are clumped within ${stats.dominantRegion}`;
  const simple = `the fleet is distributed across ${stats.countries} jurisdictions`;
  const h2 = weave(tech, simple);
  let threat = "No significant single-points-of-failure detected.";
  if (isClumped) threat = roll(Math.random() > 0.5 ? MATRIX.strategist.threats_legal : MATRIX.strategist.threats_latency);
  const h3 = threat;
  const h4 = isClumped ? "Advisory: Geographic expansion advised." : "Advisory: Continue global diversification strategy.";
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 7: TOPOLOGY - NODE FOCUS */
const buildTopologyNode = (stats: AnalysisStats, node: Node) => {
  const country = node.location?.countryName || "Unknown";
  const countInCountry = stats.countryCounts[country] || 1;
  const isLoneWolf = countInCountry === 1;
  const h1 = `Asset Deployment: Node is active in ${country}.`;
  const tech = isLoneWolf ? "It is currently the ONLY node serving this jurisdiction" : `It shares this region with ${countInCountry - 1} other peers`;
  const simple = isLoneWolf ? "providing critical bridge access" : "redundancy is high";
  const h2 = weave(tech, simple);
  const h3 = isLoneWolf ? "Strategic Asset: This is a 'Lone Wolf' node." : "Asset Value: Nominal. Losing this node has minimal impact on regional coverage.";
  const h4 = isLoneWolf ? "Verdict: Critical Asset. Maintain priority uptime." : "Verdict: Redundant Asset. Standard priority.";
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
      if (activeNode) narrative = buildMarketNode(stats, activeNode, metricKey);
      else narrative = buildMarketDefault(stats, metricKey); // Now passing metricKey for dynamic evaluation
      break;
    case 'TOPOLOGY':
      if (activeNode) narrative = buildTopologyNode(stats, activeNode);
      else narrative = buildTopologyDefault(stats);
      break;
  }

  NARRATIVE_CACHE.set(cacheKey, narrative);
  return narrative;
};
