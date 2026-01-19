import { Node } from '../types';
import { formatBytes } from '../utils/formatters';
import { getSafeIp } from '../utils/nodeHelpers';

// --- TYPES ---
type NarrativeContext = {
  tab: 'OVERVIEW' | 'MARKET' | 'TOPOLOGY';
  metric?: string; // 'storage', 'credits', 'health', 'uptime'
  focusKey?: string | null; // The clicked node
  hoverKey?: string | null; // The hovered node
  nodes: Node[];
  benchmarks: any;
  chartSection?: string | null; // Specific to Overview tab (clicked chart)
};

// --- LEXICON (The Building Blocks) ---
const LEXICON = {
  openers: {
    neutral: ["Analyzing the dataset,", "Upon review of the cluster,", "Current telemetry indicates", "The data suggests", "Cluster diagnostics reveal"],
    positive: ["Impressively,", "Optimized performance detected:", "High-efficiency indicators found:", "Excellent signals:", "Superior metrics observed:"],
    negative: ["Attention required:", "Critical variance detected:", "Performance alert:", "Sub-optimal configurations found:", "Warning:"],
  },
  connectors: {
    contrast: ["however,", "in contrast,", "conversely,", "despite this,", "although,"],
    addition: ["furthermore,", "additionally,", "moreover,", "integrated with this,", "coupled with"],
    causality: ["resulting in", "driving", "causing", "leading to", "facilitating"],
  },
  adjectives: {
    good: ["robust", "stellar", "resilient", "optimal", "elite", "superior", "impeccable"],
    bad: ["degraded", "volatile", "fragile", "inconsistent", "compromised", "lagging", "unstable"],
    big: ["massive", "dominant", "substantial", "significant", "overwhelming"],
    small: ["marginal", "negligible", "fractional", "minor", "minimal"]
  },
  verbs: {
    rising: ["outperforming", "surpassing", "exceeding", "eclipsing", "dominating"],
    falling: ["trailing", "dragging", "underperforming", "lagging behind", "failing"],
    holding: ["anchoring", "stabilizing", "maintaining", "sustaining", "supporting"]
  }
};

// --- HELPER: Randomizer (FIXED: NOW GENERIC) ---
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// FIXED: Typed the templates argument correctly as an array of functions returning strings
const pickTemplate = (templates: ((data: any) => string)[], data: any) => pick(templates)(data);

// --- STATISTICAL ENGINE ---
const analyzeContext = (nodes: Node[], benchmark: any) => {
  const count = nodes.length;
  if (count === 0) return null;

  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75;
  
  // Calculate Standard Deviation (Volatility)
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Gini Coefficient (Inequality) for Storage
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
    gini, // High gini (>0.6) means centralization risk
    whales: nodes.filter(n => (n.storage_committed || 0) / totalStorage > 0.3), // Nodes with >30% share
    isElite: avgHealth > netAvg + 8,
    isCritical: avgHealth < 50
  };
};

// --- SCENARIO GENERATORS ---

// 1. OVERVIEW: DEFAULT (Global Context)
const generateOverviewDefault = (stats: any) => {
  const healthStatus = stats.delta > 0 ? "positive" : "negative";
  const consistency = stats.stdDev < 10 ? "highly consistent" : "highly volatile";
  
  const t1 = (s: any) => `${pick(LEXICON.openers[healthStatus])} this fleet of ${s.count} nodes is ${s.delta > 0 ? pick(LEXICON.verbs.rising) : pick(LEXICON.verbs.falling)} the global benchmark by ${Math.abs(s.delta).toFixed(1)} points.`;
  const t2 = (s: any) => `Global Context: This group represents a ${s.delta > 0 ? pick(LEXICON.adjectives.good) : pick(LEXICON.adjectives.bad)} segment of the network. Vitality scores are ${consistency} across the board.`;
  const t3 = (s: any) => `Performance Synthesis: Collectively managing ${formatBytes(s.totalStorage)}, this cluster exhibits ${s.delta > 0 ? 'elite' : 'sub-standard'} reliability metrics relative to the network average.`;

  return pickTemplate([t1, t2, t3], stats) + ` ${stats.stdDev > 15 ? "However, internal variance suggests distinct performance tiers exist within the group." : "The tight deviation indicates a uniform hardware configuration."}`;
};

// 2. OVERVIEW: CHART FOCUSED (Metric Context)
const generateOverviewChart = (stats: any, section: string) => {
  // section is 'storage', 'health', 'credits', 'uptime'
  if (section === 'health') {
    return `${pick(LEXICON.openers.neutral)} the Health Score distribution reveals the group's reliability. With an average of ${stats.avgHealth.toFixed(0)}/100, the group is ${stats.delta > 0 ? 'stable' : 'at risk'}. ${stats.stdDev > 20 ? "Caution: The wide spread indicates some nodes are critically failing while others succeed." : "The narrow spread proves consistent software versions."}`;
  }
  if (section === 'storage') {
    return `Capacity Analysis: This chart visualizes the ${formatBytes(stats.totalStorage)} pledge. ${stats.gini > 0.6 ? `WARNING: High inequality detected (Gini: ${stats.gini.toFixed(2)}). The group relies too heavily on a few large nodes.` : "Distribution is democratic, reducing the risk of data loss from single-node failures."}`;
  }
  return `Deep Dive (${section}): Analyzing the aggregate performance of ${section}. This metric correlates directly with the group's potential rewards. ${stats.isElite ? "The trajectory is upward." : "Optimization is recommended."}`;
};

// 3. OVERVIEW: NODE FOCUSED (Specific Context)
const generateOverviewNode = (node: Node, stats: any, section: string | null) => {
  const nVal = node.health || 0;
  const diff = nVal - stats.avgHealth;
  const isDrag = diff < -10;
  const isLift = diff > 10;
  const safeName = getSafeIp(node);

  const role = isDrag ? "a liability" : isLift ? "a champion" : "a standard peer";
  
  const t1 = () => `Node Focus [${safeName}]: Currently acting as ${role}. Its health (${nVal}) is ${Math.abs(diff).toFixed(1)} points ${diff > 0 ? 'above' : 'below'} the group average.`;
  const t2 = () => `Impact Analysis: ${safeName} is ${diff > 0 ? pick(LEXICON.verbs.holding) : pick(LEXICON.verbs.falling)} the cluster's reputation. ${isDrag ? "Removing or fixing this node would significantly boost the group average." : ""}`;
  
  return `${pick([t1, t2])()} ${section ? `Specifically in ${section}, it ranks in the ${diff > 0 ? 'top' : 'bottom'} percentile.` : "It is a key driver of the current group dynamics."}`;
};

// 4. MARKET: DEFAULT (Distribution Context)
const generateMarketDefault = (stats: any, metric: string) => {
  const context = metric === 'storage' ? "capacity" : metric === 'credits' ? "rewards" : "vitality";
  const shape = stats.gini > 0.5 ? "Oligarchic (Centralized)" : "Democratic (Decentralized)";
  
  return `Market Structure (${context}): The distribution shape is ${shape}. ${stats.whales.length > 0 ? `Dominance Alert: ${stats.whales.length} node(s) control a massive share.` : "Resources are perfectly balanced."} This visualization helps identify single-points-of-failure within the group.`;
};

// 5. MARKET: NODE FOCUSED (Slice Context)
const generateMarketNode = (node: Node, stats: any, metric: string) => {
  const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
  const total = metric === 'storage' ? stats.totalStorage : 1; // Simplify for non-sum metrics
  const share = metric === 'storage' || metric === 'credits' ? (val / total) * 100 : 0;
  
  if (metric === 'health') return `Relative Vitality: This node sits at ${node.health}/100. In a competitive market, it is ${node.health && node.health > stats.avgHealth ? "winning" : "losing"} against its peers.`;

  return `Share Analysis [${getSafeIp(node)}]: This node commands ${share.toFixed(1)}% of the ${metric} market. ${share > 30 ? "It is a Whale. The group is heavily dependent on it." : "It is a minor contributor, easily replaceable if it goes offline."}`;
};

// 6. MAP: DEFAULT (Spatial Context)
const generateMapDefault = (nodes: Node[]) => {
  const countries = new Set(nodes.map(n => n.location?.countryName)).size;
  const density = nodes.length / (countries || 1);
  const topology = density > 3 ? "Clustered" : "Dispersed";

  return `Geo-Spatial Audit: The fleet forms a ${topology} topology spanning ${countries} jurisdictions. ${countries < 2 ? "CRITICAL RISK: Geographic centralization detected. A regional outage could wipe out the group." : "High Resilience: The geographic spread minimizes jurisdiction risk."} P2P latency is estimated based on these physical distances.`;
};

// 7. MAP: NODE FOCUSED (Location Context)
const generateMapNode = (node: Node, nodes: Node[]) => {
  const peers = nodes.filter(n => n.pubkey !== node.pubkey);
  // Find closest peer
  let minDst = 99999;
  peers.forEach(p => {
    if(node.location && p.location) {
        const d = Math.sqrt(Math.pow(node.location.lat - p.location.lat, 2) + Math.pow(node.location.lon - p.location.lon, 2));
        if (d < minDst) minDst = d;
    }
  });

  const isolation = minDst > 20 ? "Isolated Outpost" : "Cluster Component";
  return `Location Intelligence [${getSafeIp(node)}]: Operating from ${node.location?.countryName || 'Unknown'}, this node acts as an ${isolation}. ${isolation === 'Isolated Outpost' ? "It provides critical reach to the network edge." : "It benefits from low-latency sync with nearby peers."}`;
};


// --- MAIN EXPORT ---
export const generateNarrative = ({ tab, metric, focusKey, hoverKey, nodes, benchmarks, chartSection }: NarrativeContext): string => {
  // 1. Resolve State
  if (!nodes || nodes.length === 0) return "Initialize selection...";
  
  const activeKey = focusKey || hoverKey; // Priority to click, then hover
  const activeNode = activeKey ? nodes.find(n => n.pubkey === activeKey) : null;
  const stats = analyzeContext(nodes, benchmarks);

  if (!stats) return "Calculating...";

  // 2. Route to Scenario
  // SCENARIO 1, 2, 3: OVERVIEW
  if (tab === 'OVERVIEW') {
    if (activeNode) return generateOverviewNode(activeNode, stats, chartSection || null); // Scenario 3: Overview + Node
    if (chartSection) return generateOverviewChart(stats, chartSection); // Scenario 2: Overview + Chart
    return generateOverviewDefault(stats); // Scenario 1: Overview Default
  }

  // SCENARIO 4, 5: MARKET
  if (tab === 'MARKET') {
    const m = metric || 'storage';
    if (activeNode) return generateMarketNode(activeNode, stats, m); // Scenario 5: Market + Node
    return generateMarketDefault(stats, m); // Scenario 4: Market Default
  }

  // SCENARIO 6, 7: MAP
  if (tab === 'TOPOLOGY') {
    if (activeNode) return generateMapNode(activeNode, nodes); // Scenario 7: Map + Node
    return generateMapDefault(nodes); // Scenario 6: Map Default
  }

  return "System Ready.";
};
