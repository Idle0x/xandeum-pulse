import { Node } from '../types';
import { formatBytes } from '../utils/formatters';
import { getSafeIp } from '../utils/nodeHelpers';

// --- TYPES ---
type NarrativeContext = {
  tab: 'OVERVIEW' | 'MARKET' | 'TOPOLOGY';
  metric?: string; 
  focusKey?: string | null; 
  hoverKey?: string | null; 
  nodes: Node[];
  benchmarks: any;
  chartSection?: string | null;
};

// --- LEXICON (The "Mad Libs" Dictionary) ---
const LEXICON = {
  // OPENERS
  openers: {
    analysis: [
      // Tech
      "Analyzing the dataset,", "Upon review of the cluster,", "Current telemetry indicates", "The data suggests", "Cluster diagnostics reveal", "System scan shows", "Reviewing aggregate logs,",
      // Simple
      "Looking at the numbers,", "Here is the summary:", "A quick check shows", "Basically,", "To put it simply,", "We can see that", "The main takeaway is", "Checking the details,"
    ],
    positive: [
      // Tech
      "Impressively,", "Optimized performance detected:", "High-efficiency indicators found:", "Excellent signals:", "Superior metrics observed:", "Healthy patterns detected:", "Top-tier performance:",
      // Simple
      "Good news:", "Things look good:", "Great job:", "Working well:", "Strong results:", "Nice work:", "This looks solid:", "All clear:"
    ],
    negative: [
      // Tech
      "Attention required:", "Critical variance detected:", "Performance alert:", "Sub-optimal configurations found:", "Warning:", "Degradation detected:", "Stability concern:",
      // Simple
      "Watch out:", "Not good:", "Problem here:", "Needs fixing:", "Bad sign:", "Check this:", "Something is wrong:", "Heads up:"
    ],
    spatial: [
      // Tech
      "Geospatial audit:", "Topology scan:", "Network geometry:", "Map analysis:", "Physical distribution check:",
      // Simple
      "Looking at the map:", "Where they are:", "Location check:", "On the ground:", "Physical spots:"
    ],
    market: [
      // Tech
      "Market structure:", "Economic spread:", "Resource allocation:", "Dominance check:", "Share distribution:",
      // Simple
      "Who owns what:", "The pie chart shows:", "Breaking it down:", "Share check:", "The split:"
    ],
  },
  
  // CONNECTORS
  connectors: {
    contrast: [
      // Tech
      "however,", "in contrast,", "conversely,", "despite this,", "although,", "yet,", "on the other hand,",
      // Simple
      "but,", "still,", "even so,", "mind you,", "though,", "except,"
    ],
    addition: [
      // Tech
      "furthermore,", "additionally,", "moreover,", "integrated with this,", "coupled with", "alongside this,",
      // Simple
      "plus,", "and,", "also,", "on top of that,", "besides,", "too,"
    ],
    causality: [
      // Tech
      "resulting in", "driving", "facilitating", "creating", "generating",
      // Simple
      "making", "causing", "meaning", "which means", "leading to", "so"
    ],
  },
  
  // ADJECTIVES
  adjectives: {
    good: [
      // Tech
      "robust", "stellar", "resilient", "optimal", "elite", "superior", "impeccable", "rock-solid", "efficient",
      // Simple
      "good", "great", "solid", "nice", "clean", "fine", "strong", "happy"
    ],
    bad: [
      // Tech
      "degraded", "volatile", "fragile", "inconsistent", "compromised", "lagging", "unstable", "shaky",
      // Simple
      "bad", "weak", "poor", "messy", "low", "sad", "broken", "rough"
    ],
    big: [
      // Tech
      "massive", "dominant", "substantial", "significant", "overwhelming", "hefty", "controlling",
      // Simple
      "big", "huge", "large", "giant", "fat", "major", "heavy"
    ],
    small: [
      // Tech
      "marginal", "negligible", "fractional", "minor", "minimal", "insignificant",
      // Simple
      "small", "tiny", "little", "bit of", "light", "slim"
    ],
    diverse: [
      // Tech
      "distributed", "decentralized", "scattered", "widespread",
      // Simple
      "spread out", "all over", "everywhere", "mixed"
    ],
    clumped: [
      // Tech
      "centralized", "clustered", "localized", "concentrated", "dense",
      // Simple
      "bunched up", "clumped", "too close", "stuck together"
    ]
  },
  
  // VERBS
  verbs: {
    rising: [
      // Tech
      "outperforming", "surpassing", "exceeding", "eclipsing", "dominating", "outpacing",
      // Simple
      "beating", "winning", "passing", "topping", "rising above", "doing better than"
    ],
    falling: [
      // Tech
      "trailing", "dragging", "underperforming", "lagging behind", "dropping below",
      // Simple
      "losing", "dropping", "failing", "falling behind", "missing", "doing worse than"
    ],
    holding: [
      // Tech
      "anchoring", "stabilizing", "maintaining", "sustaining", "reinforcing",
      // Simple
      "keeping", "holding", "saving", "helping", "staying", "supporting"
    ]
  }
};

// --- HELPER: Randomizer ---
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickTemplate = (templates: ((data: any) => string)[], data: any) => pick(templates)(data);

// --- STATISTICAL ENGINE ---
const analyzeContext = (nodes: Node[], benchmark: any) => {
  const count = nodes.length;
  if (count === 0) return null;

  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75;
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  
  // Gini Calculation
  const sortedStorage = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  let giniNumerator = 0;
  sortedStorage.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  return {
    count,
    totalStorage,
    avgHealth,
    delta: avgHealth - netAvg,
    stdDev,
    gini,
    whales: nodes.filter(n => (n.storage_committed || 0) / totalStorage > 0.3),
    isElite: avgHealth > netAvg + 8,
    isHeterogeneous: stdDev > 15
  };
};

// --- SCENARIO 1: OVERVIEW (DEFAULT) ---
const generateOverviewDefault = (s: any) => {
  const status = s.delta > 0 ? "positive" : "negative";
  const perfVerb = s.delta > 0 ? pick(LEXICON.verbs.rising) : pick(LEXICON.verbs.falling);
  const adj = s.delta > 0 ? pick(LEXICON.adjectives.good) : pick(LEXICON.adjectives.bad);
  
  // Template A: Formal Analysis
  const t1 = () => `${pick(LEXICON.openers[status])} this cluster is ${perfVerb} the network baseline. With ${s.count} active nodes, the aggregate health score is ${adj}.`;
  
  // Template B: Comparative
  const t2 = () => `Global Synthesis: Compared to the wider network, this group is ${s.delta > 0 ? "stronger" : "weaker"}. The average vitality is ${Math.abs(s.delta).toFixed(1)} points ${s.delta > 0 ? "above" : "below"} the benchmark.`;
  
  // Template C: Internal consistency focus
  const t3 = () => `${pick(LEXICON.openers.analysis)} internal variance is ${s.stdDev < 10 ? "low" : "high"}. This indicates the group is ${s.stdDev < 10 ? "operating as a synchronized unit" : "fragmented in terms of hardware quality"}.`;

  // Template D: Data focus
  const t4 = () => `Capacity Report: Managing ${formatBytes(s.totalStorage)}, this fleet demonstrates ${adj} reliability traits. ${s.isElite ? "It qualifies as a Top-Tier cluster." : "Optimization is possible."}`;

  return pickTemplate([t1, t2, t3, t4], s);
};

// --- SCENARIO 2: OVERVIEW (CHART CLICKED) ---
const generateOverviewChart = (s: any, section: string) => {
  const metricName = section.charAt(0).toUpperCase() + section.slice(1);
  const isGood = s.delta > 0; // rough approximation for general sentiment
  
  if (section === 'health') {
    const t1 = () => `Vitality Deep Dive: The group averages ${s.avgHealth.toFixed(0)}/100. ${s.stdDev > 15 ? "However, this average hides significant disparity between best and worst performers." : "This score is consistent across almost all members."}`;
    const t2 = () => `${pick(LEXICON.openers.analysis)} health is the primary indicator of longevity. This group is ${isGood ? "resilient" : "fragile"}, ${pick(LEXICON.verbs.driving)} the network average ${isGood ? "up" : "down"}.`;
    const t3 = () => `Score Breakdown: A ${s.avgHealth.toFixed(0)} avg suggests ${isGood ? "excellent maintenance" : "deferred maintenance"}. ${pick(LEXICON.connectors.addition)} standard deviation is ${s.stdDev.toFixed(1)}.`;
    return pickTemplate([t1, t2, t3], s);
  }
  
  if (section === 'storage') {
    const t1 = () => `Capacity Audit: Total pledged storage is ${formatBytes(s.totalStorage)}. ${s.gini > 0.5 ? "Distribution is unequal (Gini > 0.5)." : "Load is evenly balanced."}`;
    const t2 = () => `${pick(LEXICON.openers.market)} ${s.whales.length} node(s) carry the bulk of the data. ${s.whales.length > 0 ? "Risk of data loss is concentrated." : "Risk is well-distributed."}`;
    return pickTemplate([t1, t2], s);
  }
  
  // Fallback for credits/uptime
  return `Metric Focus (${metricName}): ${pick(LEXICON.openers.neutral)} this metric correlates with node seniority. ${s.isElite ? "The trend is highly positive." : "Gaps in performance are visible."}`;
};

// --- SCENARIO 3: OVERVIEW (NODE CLICKED) ---
const generateOverviewNode = (node: Node, stats: any) => {
  const diff = (node.health || 0) - stats.avgHealth;
  const isDriver = diff > 0;
  const safeName = getSafeIp(node);
  
  const t1 = () => `Node Diagnostics [${safeName}]: This unit is ${isDriver ? pick(LEXICON.verbs.rising) : pick(LEXICON.verbs.falling)} the group average by ${Math.abs(diff).toFixed(1)} points.`;
  const t2 = () => `Impact Assessment: ${safeName} acts as ${isDriver ? "a stabilizer" : "a drag"} on the cluster. ${isDriver ? "It is a model node." : "Maintenance recommended."}`;
  const t3 = () => `Comparative Stat: With a health of ${node.health}, it sits in the ${isDriver ? "upper" : "lower"} percentile of this specific group.`;
  
  return pickTemplate([t1, t2, t3], stats);
};

// --- SCENARIO 4: MARKET (DEFAULT) ---
const generateMarketDefault = (s: any, metric: string) => {
  const shape = s.gini > 0.5 ? "Centralized (Oligarchic)" : "Decentralized (Democratic)";
  const concern = s.gini > 0.5 ? "High dependence on top nodes." : "No single point of failure.";
  
  const t1 = () => `${pick(LEXICON.openers.market)} The ${metric} distribution is ${shape}. ${concern}`;
  const t2 = () => `Inequality Index: The Gini coefficient is ${s.gini.toFixed(2)}. ${s.gini > 0.6 ? pick(LEXICON.openers.negative) + " Wealth/Load is too concentrated." : "This is a healthy, flat hierarchy."}`;
  const t3 = () => `Pie Chart Analysis: Visually, a balanced pie indicates resilience. Here, we see ${s.gini > 0.5 ? "large dominating slices" : "equal slices"}.`;
  
  return pickTemplate([t1, t2, t3], s);
};

// --- SCENARIO 5: MARKET (NODE CLICKED) ---
const generateMarketNode = (node: Node, s: any, metric: string) => {
  const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
  const total = metric === 'storage' ? s.totalStorage : 1;
  const share = metric === 'storage' || metric === 'credits' ? (val / total) * 100 : 0;
  const safeName = getSafeIp(node);

  if (metric === 'health') {
     return `Vitality Rank: ${safeName} holds a score of ${node.health}. In the market of reliability, it is ${node.health && node.health > s.avgHealth ? "a market leader" : "losing market share"}.`;
  }

  const t1 = () => `Shareholder Report [${safeName}]: This node controls ${share.toFixed(1)}% of the ${metric}. ${share > 25 ? "It is a major stakeholder." : "It is a minority participant."}`;
  const t2 = () => `dominance Check: ${share > 30 ? pick(LEXICON.adjectives.big) : pick(LEXICON.adjectives.small)} influence detected. If this node fails, ${share.toFixed(1)}% of the group's ${metric} vanishes.`;
  const t3 = () => `Slice Analysis: This specific slice represents ${formatBytes(val)} (if storage). It is ${share > (100/s.count) ? "larger" : "smaller"} than the average slice size.`;

  return pickTemplate([t1, t2, t3], s);
};

// --- SCENARIO 6: MAP (DEFAULT) ---
const generateMapDefault = (nodes: Node[]) => {
  const countries = new Set(nodes.map(n => n.location?.countryName)).size;
  const uniqueCount = countries;
  
  const t1 = () => `${pick(LEXICON.openers.spatial)} The fleet spans ${uniqueCount} unique jurisdictions. ${uniqueCount < 2 ? "Risk: Geographic redundancy is non-existent." : "Resilience: Good physical spread."}`;
  const t2 = () => `Topology Report: Nodes are ${uniqueCount > 3 ? pick(LEXICON.adjectives.diverse) : pick(LEXICON.adjectives.clumped)}. This affects latency and legal risk.`;
  const t3 = () => `Network Geometry: Analyzing the physical mesh. ${nodes.length} nodes across ${uniqueCount} regions suggests a ${uniqueCount > 2 ? "global" : "local"} operational footprint.`;

  return pickTemplate([t1, t2, t3], nodes);
};

// --- SCENARIO 7: MAP (NODE CLICKED) ---
const generateMapNode = (node: Node, nodes: Node[]) => {
  const safeName = getSafeIp(node);
  const country = node.location?.countryName || "Unknown";
  
  const t1 = () => `Location Intel [${safeName}]: Deployed in ${country}. ${pick(LEXICON.connectors.addition)} it serves as a physical anchor for the network in this region.`;
  const t2 = () => `Geo-Point Analysis: This node in ${country} contributes to the group's censorship resistance.`;
  const t3 = () => `Routing Context: Located in ${country}, this node's latency is determined by its distance to the cluster center of mass.`;

  return pickTemplate([t1, t2, t3], nodes);
};

// --- MAIN EXPORT ---
export const generateNarrative = ({ tab, metric, focusKey, hoverKey, nodes, benchmarks, chartSection }: NarrativeContext): string => {
  if (!nodes || nodes.length === 0) return "Initialize selection...";
  
  const activeKey = focusKey || hoverKey;
  const activeNode = activeKey ? nodes.find(n => n.pubkey === activeKey) : null;
  const stats = analyzeContext(nodes, benchmarks);

  if (!stats) return "Calculating...";

  // OVERVIEW
  if (tab === 'OVERVIEW') {
    if (activeNode) return generateOverviewNode(activeNode, stats);
    if (chartSection) return generateOverviewChart(stats, chartSection);
    return generateOverviewDefault(stats);
  }

  // MARKET
  if (tab === 'MARKET') {
    const m = metric || 'storage';
    if (activeNode) return generateMarketNode(activeNode, stats, m);
    return generateMarketDefault(stats, m);
  }

  // TOPOLOGY
  if (tab === 'TOPOLOGY') {
    if (activeNode) return generateMapNode(activeNode, nodes);
    return generateMapDefault(nodes);
  }

  return "System Ready.";
};
