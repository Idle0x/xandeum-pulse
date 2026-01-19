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

// --- 1. THE COMBINATORIAL MATRIX (The "Muscle") ---
// We break sentences into components to multiply total possible variations.

const MATRIX = {
  generic: {
    openers: ["Analysis suggests", "Telemetry confirms", "Data reveals", "Current modeling indicates", "Our audit shows", "Diagnostic scans highlight"],
    bridges: ["which essentially means", "indicating that", "signifying a state where", "effectively translating to", "which points toward"],
    connectors: ["Furthermore,", "In addition,", "Additionally,", "Looking deeper,", "On top of that,"],
  },
  intensity: {
    neutral: ["nominal", "stable", "consistent", "standard", "expected"],
    mild: ["slight", "noticeable", "marginal", "minor", "subtle"],
    high: ["significant", "substantial", "evident", "pronounced", "clear"],
    critical: ["extreme", "critical", "severe", "acute", "heavy"]
  },
  executive: { // Overview Tab
    verbs_up: ["outperforming", "surpassing", "exceeding", "lifting", "stabilizing"],
    verbs_down: ["trailing", "lagging", "dragging", "suppressing", "compromising"],
    drivers: ["hardware variance", "configuration drift", "sync latency", "resource contention"],
  },
  analyst: { // Market Tab
    structures: ["oligarchic", "monopolistic", "centralized", "democratic", "distributed"],
    impacts: ["systemic fragility", "consensus risk", "network leverage", "market volatility"],
  },
  strategist: { // Topology Tab
    geo_verbs: ["clustered", "concentrated", "distributed", "spread", "anchored"],
    threats: ["jurisdictional risk", "regulatory capture", "physical bottleneck", "latency lag"],
  }
};

const PERSONALITIES: Record<string, any> = {
  health: { simple: "vitality", tech: "composite integrity", action: "hardware check" },
  storage: { simple: "capacity", tech: "consensus volume", action: "provisioning" },
  uptime: { simple: "reliability", tech: "temporal persistence", action: "reboot cycle" },
  credits: { simple: "earnings", tech: "economic throughput", action: "revenue audit" }
};

// --- 2. THE WEAVING ENGINE (The "Brain") ---

const roll = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * HYBRID TONE MIXER
 * Combines a Tech observation with a Simple translation.
 */
const weave = (tech: string, simple: string) => {
  const pattern = Math.random();
  if (pattern > 0.66) return `${tech}. ${roll(MATRIX.generic.bridges)} ${simple}.`;
  if (pattern > 0.33) return `${simple}. This is driven by ${tech.toLowerCase()}.`;
  return `${tech}; specifically, ${simple}.`;
};

/**
 * INTENSITY CALCULATOR (Gradient Logic)
 */
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
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
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
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  const top3Volume = storages.slice(-3).reduce((a, b) => a + b, 0);
  const top3Share = (top3Volume / totalStorage) * 100;

  const countryCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const c = n.location?.countryName || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countries = Object.keys(countryCounts).length;
  const dominantRegion = Object.keys(countryCounts).reduce((a, b) => countryCounts[a] > countryCounts[b] ? a : b);
  const dominanceScore = ((countryCounts[dominantRegion] || 0) / count) * 100;

  return { 
    count, totalStorage, avgHealth, netAvg, delta, intensity: getIntensity(delta), stdDev, 
    gini, countries, medianHealth, medianStorage, top3Share, top3Volume, 
    isCentralized: top3Share > 50 || gini > 0.6,
    countryCounts, dominantRegion, dominanceScore
  };
};

const findRootCause = (node: Node, groupAvg: number) => {
  if (!node) return "anomalous data";
  if ((node.uptime || 0) < 50) return "uptime instability";
  if ((node.health || 0) < groupAvg - 15) return "hardware degradation";
  return "configuration drift";
};

// --- 4. THE 7 SCENARIO STRATEGIES ---

/** SCENARIO 1: OVERVIEW - DEFAULT (The Executive) */
const buildOverviewDefault = (stats: AnalysisStats) => {
  const h1 = `${roll(MATRIX.generic.openers)} the cluster health is at ${stats.avgHealth.toFixed(1)}%.`;
  
  const tech = `${stats.delta > 0 ? roll(MATRIX.executive.verbs_up) : roll(MATRIX.executive.verbs_down)} the network benchmark by ${Math.abs(stats.delta).toFixed(1)} points`;
  const simple = `this means the group is ${stats.delta > 0 ? 'performing better' : 'struggling compared'} to the world average`;
  const h2 = weave(tech, simple);

  const h3 = stats.stdDev > 10 
    ? `Internal ${roll(MATRIX.executive.drivers)} is creating ${roll(MATRIX.intensity.high)} variance.`
    : `The fleet is showing ${roll(MATRIX.intensity.neutral)} synchronization.`;

  const h4 = stats.delta > -5 ? "Recommendation: Maintain current status." : "Action: Audit underperforming assets.";
  
  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 2: OVERVIEW - CHART CLICK (Metric Personality) */
const buildOverviewChart = (stats: AnalysisStats, section: string) => {
  const p = PERSONALITIES[section] || PERSONALITIES.health;
  const h1 = `Targeted audit on ${p.tech} (${section}).`;
  
  const tech = `The median value is ${stats.medianHealth} vs the average of ${stats.avgHealth.toFixed(1)}`;
  const simple = `which tells us the ${p.simple} is generally ${stats.medianHealth > stats.avgHealth ? 'good, but skewed by bad nodes' : 'consistent across the board'}`;
  const h2 = weave(tech, simple);

  const h3 = `This specific metric drives the overall ${roll(MATRIX.intensity.high)} score.`;
  const h4 = `Focusing on ${p.action} will yield the highest ROI for this group.`;

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 3: OVERVIEW - NODE FOCUS (Contribution Vector) */
const buildOverviewNode = (stats: AnalysisStats, node: Node) => {
  const score = node.health || 0;
  const diff = score - stats.avgHealth;
  const safeIp = getSafeIp(node).replace('unit ', '');

  const h1 = `Node Performance Review [${safeIp}]: ${score}/100.`;
  
  const tech = `This asset is ${diff > 0 ? roll(MATRIX.executive.verbs_up) : roll(MATRIX.executive.verbs_down)} the group average by ${Math.abs(diff).toFixed(1)}%`;
  const simple = `making it a ${diff > 0 ? 'strong anchor' : 'liability'} for the local cluster`;
  const h2 = weave(tech, simple);

  const h3 = score < 70 ? `Primary driver identified as ${findRootCause(node, stats.avgHealth)}.` : "Operational stability is within optimal parameters.";
  const h4 = score < 60 ? "Warning: Critical intervention required to prevent health decay." : "Status: Optimal performance.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 4: MARKET - DEFAULT (Risk Analyst) */
const buildMarketDefault = (stats: AnalysisStats) => {
  const h1 = `${roll(MATRIX.generic.openers)} a ${stats.isCentralized ? roll(MATRIX.intensity.critical) : roll(MATRIX.intensity.neutral)} ${roll(MATRIX.analyst.structures)} market state.`;
  
  const tech = `The top 3 stakeholders aggregate ${stats.top3Share.toFixed(1)}% of total grid volume`;
  const simple = `meaning if just three people leave, ${stats.top3Share > 50 ? 'the network breaks' : 'the network is fine'}`;
  const h2 = weave(tech, simple);

  const h3 = `This configuration creates ${stats.isCentralized ? roll(MATRIX.intensity.high) : roll(MATRIX.intensity.mild)} ${roll(MATRIX.analyst.impacts)}.`;
  const h4 = stats.isCentralized ? "Strategy: Incentivize smaller nodes to dilute power." : "Strategy: Current distribution is resilient.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 5: MARKET - NODE FOCUS (Shareholder) */
const buildMarketNode = (stats: AnalysisStats, node: Node, metric: string) => {
  const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
  const total = metric === 'storage' ? stats.totalStorage : 100;
  const share = (val / total) * 100;

  const h1 = `Asset Leverage Audit: Node holds ${share.toFixed(2)}% of the market.`;
  
  const tech = `This represents a ${roll(MATRIX.intensity.high)} delta relative to the median node size of ${stats.medianStorage}`;
  const simple = `it's effectively a ${share > 10 ? 'whale that controls the market' : 'small participant with low risk'}`;
  const h2 = weave(tech, simple);

  const h3 = share > 10 ? "Consensus Simulation: Highly critical to network finality." : "Consensus Simulation: Low systemic importance.";
  const h4 = share > 15 ? "Warning: Excessive concentration in a single node." : "Status: Nominal holding.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 6: TOPOLOGY - DEFAULT (Strategist) */
const buildTopologyDefault = (stats: AnalysisStats) => {
  const h1 = `Global Footprint Analysis: Cluster is ${roll(MATRIX.strategist.geo_verbs)} across ${stats.countries} regions.`;
  
  const tech = `Regional dominance is concentrated in ${stats.dominantRegion} at ${stats.dominanceScore.toFixed(0)}%`;
  const simple = `which is risky because a single country's laws could ${roll(MATRIX.intensity.critical)}ly hit the grid`;
  const h2 = weave(tech, simple);

  const h3 = `Primary vulnerability: ${roll(MATRIX.intensity.high)} ${roll(MATRIX.strategist.threats)}.`;
  const h4 = stats.countries < 3 ? "Action: Urgently expand to APAC or Americas." : "Action: Continue diversifying jurisdictions.";

  return `${h1} ${h2} ${h3} ${h4}`;
};

/** SCENARIO 7: TOPOLOGY - NODE FOCUS (Strategic Asset) */
const buildTopologyNode = (stats: AnalysisStats, node: Node) => {
  const country = node.location?.countryName || "Unknown";
  const countInCountry = stats.countryCounts[country] || 1;
  const isLoneWolf = countInCountry === 1;

  const h1 = `Strategic Valuation: Asset deployed in ${country}.`;
  
  const tech = `Regional saturation for this jurisdiction is ${countInCountry > 1 ? roll(MATRIX.intensity.high) : roll(MATRIX.intensity.neutral)}`;
  const simple = isLoneWolf ? "it's the only node there, making it super important for speed" : "there are plenty of others here, so it's not a big loss if it goes down";
  const h2 = weave(tech, simple);

  const h3 = isLoneWolf ? roll(MATRIX.strategist.threats) : "Low regional unique value.";
  const h4 = isLoneWolf ? "Verdict: High-value 'Lone Wolf' asset. Maintain priority uptime." : "Verdict: Redundant asset. Standard priority.";

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
  if (!stats) return "Calculating Physics...";

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
