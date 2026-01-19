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
  gini: number;
  countries: number;
  medianHealth: number;
  top3Share: number;
  isCentralized: boolean;
  countryCounts: Record<string, number>;
  dominantRegion: string;
};

type Tone = 'tech' | 'simple';

// --- SESSION MEMORY ---
const NARRATIVE_CACHE = new Map<string, string>();

// --- 1. THE STRATEGIC LEXICON (Strictly Typed by Tone) ---
const VOCAB = {
  overview: {
    headlines: {
      tech: ["System Status Update:", "Performance Audit:", "Telemetry Report:", "Cluster Health Check:"],
      simple: ["Here is the latest:", "Quick check:", "Status Report:", "Looking at the numbers:"]
    },
    vectors: {
      up: ["is lifting the average", "is driving performance up", "is acting as a stabilizer"],
      down: ["is dragging the average down", "is weighing heavily on the group", "is a performance bottleneck"]
    },
    consistency: {
      tight: ["Variance is minimal; hardware is uniform.", "High synchronization detected."],
      loose: ["High variance suggests mixed hardware quality.", "Significant gaps exist between top and bottom performers."]
    },
    actions: {
      tech: {
        positive: "Configuration stable. No intervention required.",
        negative: "Optimization vector identified. Investigate outlier nodes."
      },
      simple: {
        positive: "Everything looks good. Keep it up.",
        negative: "You should check the weak nodes to fix the score."
      }
    }
  },

  market: {
    structures: {
      tech: {
        oligarchy: "Oligarchic Structure detected. High centralization risk.",
        democracy: "Democratic Structure confirmed. Decentralization optimal."
      },
      simple: {
        oligarchy: "It looks like a few big players own everything.",
        democracy: "The market is nicely spread out among everyone."
      }
    },
    risks: {
      tech: {
        high: "Critical single-point-of-failure vectors identified.",
        low: "Resiliency protocols effective against individual node failure."
      },
      simple: {
        high: "If the big guys go down, the whole network stops.",
        low: "Even if a few nodes crash, the network will be fine."
      }
    }
  },

  topology: {
    spreads: {
      tech: {
        global: "Geospatial diversity confirmed. Latency vectors optimized.",
        local: "Geospatial clustering detected. Redundancy compromise likely."
      },
      simple: {
        global: "Nodes are everywhere. Great global coverage.",
        local: "Most nodes are stuck in one place. That's risky."
      }
    },
    threats: {
      tech: {
        legal: "Regulatory single-point-of-failure detected.",
        latency: "High censorship risk due to physical proximity."
      },
      simple: {
        legal: "One bad law in this country could kill the network.",
        latency: "They are too close together to be safe."
      }
    }
  }
};

// --- 2. HELPER FUNCTIONS ---
const roll = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// INTELLIGENCE: Root Cause Detector
const findRootCause = (node: Node, groupAvg: number) => {
  if (!node) return "unknown anomalies";
  if ((node.uptime || 0) < 50) return "critical uptime instability";
  if ((node.health || 0) < groupAvg - 15) return "severe hardware degradation";
  if ((node.credits || 0) === 0) return "zero economic output";
  return "sub-optimal configuration";
};

// --- 3. ANALYTICS ENGINE ---
const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75; 
  const delta = avgHealth - netAvg;

  // Stats
  const healths = nodes.map(n => n.health || 0).sort((a, b) => a - b);
  const mid = Math.floor(healths.length / 2);
  const medianHealth = healths.length % 2 !== 0 ? healths[mid] : (healths[mid - 1] + healths[mid]) / 2;
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Market Stats
  const sortedStorage = nodes.map(n => n.storage_committed || 0).sort((a, b) => b - a);
  const top3Sum = sortedStorage.slice(0, 3).reduce((a, b) => a + b, 0);
  const top3Share = (top3Sum / totalStorage) * 100;
  
  let giniNumerator = 0;
  sortedStorage.reverse().forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  // Topology Stats
  const countryCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const c = n.location?.countryName || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countries = Object.keys(countryCounts).length;
  const dominantRegion = Object.keys(countryCounts).reduce((a, b) => countryCounts[a] > countryCounts[b] ? a : b);

  let tier: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (delta > 5) tier = 'positive';
  if (delta < -5) tier = 'negative';

  return { 
    count, totalStorage, avgHealth, netAvg, delta, tier, stdDev, 
    gini, countries, medianHealth, top3Share, isCentralized: top3Share > 50,
    countryCounts, dominantRegion
  };
};

// --- 4. THE INTELLIGENT ASSEMBLERS (Tone Enforced) ---

/** SCENARIO 1: OVERVIEW - DEFAULT */
const buildOverviewDefault = (stats: AnalysisStats, tone: Tone) => {
  // 1. Headline
  const headline = roll(VOCAB.overview.headlines[tone]);
  const s1 = `${headline} Average health is ${stats.avgHealth.toFixed(1)}/100 (Global: ${stats.netAvg.toFixed(0)}).`;
  
  // 2. Context
  const diff = Math.abs(stats.delta).toFixed(1);
  const direction = stats.delta > 0 ? "outperforming" : "trailing";
  const s2 = `This group is ${direction} the network by ${diff} points.`;

  // 3. Deep Dive
  const s3 = stats.stdDev < 10 ? roll(VOCAB.overview.consistency.tight) : roll(VOCAB.overview.consistency.loose);

  // 4. Action (Tone Enforced)
  const action = stats.delta > -5 ? VOCAB.overview.actions[tone].positive : VOCAB.overview.actions[tone].negative;

  return `${s1} ${s2} ${s3} ${action}`;
};

/** SCENARIO 2: OVERVIEW - CHART CLICK */
const buildOverviewChart = (stats: AnalysisStats, section: string, tone: Tone) => {
  const metricName = section.charAt(0).toUpperCase() + section.slice(1);
  const s1 = tone === 'tech' ? `Metric Audit: ${metricName}.` : `Let's look at ${metricName}.`;
  
  const s2 = section === 'health' 
    ? `Group median is ${stats.medianHealth}.`
    : `This metric drives the overall score.`;
  
  const s3 = stats.delta > 0 
    ? `Trendlines are positive.` 
    : `Efficiency gaps detected.`;

  return `${s1} ${s2} ${s3}`;
};

/** SCENARIO 3: OVERVIEW - NODE FOCUS (Metric Blindness Fix) */
const buildOverviewNode = (stats: AnalysisStats, node: Node, tone: Tone) => {
  const score = node.health || 0;
  const diff = score - stats.avgHealth;
  const safeIp = getSafeIp(node).replace('unit ', '');

  // 1. Headline
  const s1 = `Node Audit [${safeIp}]: Health Score ${score}/100.`;

  // 2. Vector & Root Cause (INTELLIGENCE)
  let s2 = "";
  if (diff < -5) {
      const cause = findRootCause(node, stats.avgHealth);
      s2 = `It is dragging the average down, primarily driven by ${cause}.`;
  } else if (diff > 5) {
      s2 = `It is lifting the group average, acting as a stabilizer.`;
  } else {
      s2 = `It matches the group average.`;
  }

  // 3. Context
  const netDiff = score - stats.netAvg;
  const s3 = netDiff > 0 
    ? (tone === 'tech' ? "Performance exceeds global baseline." : "It's doing better than most nodes worldwide.") 
    : (tone === 'tech' ? "Performance sub-optimal vs global." : "It's lagging behind the world average.");

  return `${s1} ${s2} ${s3}`;
};

/** SCENARIO 4: MARKET - DEFAULT (Real Simulation Fix) */
const buildMarketDefault = (stats: AnalysisStats, tone: Tone) => {
  const s1 = stats.isCentralized ? VOCAB.market.structures[tone].oligarchy : VOCAB.market.structures[tone].democracy;
  const s2 = `Top 3 nodes control ${stats.top3Share.toFixed(1)}% of capacity.`;
  
  // Real Calculation Simulation
  const lossImpact = (stats.totalStorage * (stats.top3Share / 100));
  const s3 = `Simulation: Loss of top actors removes ${formatBytes(lossImpact)} from the grid.`;

  const s4 = stats.isCentralized ? VOCAB.market.risks[tone].high : VOCAB.market.risks[tone].low;

  return `${s1} ${s2} ${s3} ${s4}`;
};

/** SCENARIO 5: MARKET - NODE FOCUS */
const buildMarketNode = (stats: AnalysisStats, node: Node, metric: string, tone: Tone) => {
  const m = metric === 'storage' ? 'storage_committed' : metric;
  const val = (node as any)[m] || 0;
  const total = metric === 'storage' ? stats.totalStorage : 100;
  const share = (val / total) * 100;
  const safeIp = getSafeIp(node).replace('unit ', '');

  const s1 = `Shareholder Report: Node ${safeIp} holds ${share.toFixed(1)}% market share.`;
  const s2 = share > 15 
    ? (tone === 'tech' ? "Leverage Assessment: High. Market Maker status." : "This is a big player. It has a lot of influence.")
    : (tone === 'tech' ? "Leverage Assessment: Nominal." : "Just a small player.");

  return `${s1} ${s2}`;
};

/** SCENARIO 6: TOPOLOGY - DEFAULT (Tone Enforced) */
const buildTopologyDefault = (stats: AnalysisStats, tone: Tone) => {
  const s1 = `Footprint: ${stats.countries} unique jurisdictions.`;
  const percentDominant = ((stats.countryCounts[stats.dominantRegion] || 0) / stats.count) * 100;
  const s2 = `${percentDominant.toFixed(0)}% of resources are clumped in ${stats.dominantRegion}.`;
  
  const s3 = percentDominant > 50 ? VOCAB.topology.threats[tone].legal : VOCAB.topology.spreads[tone].global;
  return `${s1} ${s2} ${s3}`;
};

/** SCENARIO 7: TOPOLOGY - NODE FOCUS */
const buildTopologyNode = (stats: AnalysisStats, node: Node, tone: Tone) => {
  const country = node.location?.countryName || "Unknown";
  const countInCountry = stats.countryCounts[country] || 1;
  const isLoneWolf = countInCountry === 1;
  
  const s1 = `Deployment: ${country}.`;
  const s2 = isLoneWolf 
    ? `Uniqueness: Critical. It is the ONLY node in this region.` 
    : `Uniqueness: Low. It shares this region with ${countInCountry - 1} peers.`;
    
  return `${s1} ${s2}`;
};

// --- 5. MAIN ROUTER ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Initializing...";

  const activeKey = ctx.focusKey || ctx.hoverKey || 'default';
  const sectionKey = ctx.chartSection || 'none';
  const metricKey = ctx.metric || 'storage';
  const cacheKey = `${ctx.tab}::${activeKey}::${sectionKey}::${metricKey}`;

  if (NARRATIVE_CACHE.has(cacheKey)) {
    return NARRATIVE_CACHE.get(cacheKey)!;
  }

  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating...";

  const activeNode = activeKey !== 'default' ? ctx.nodes.find(n => n.pubkey === activeKey) || null : null;
  let narrative = "";
  
  // TONE LOCK: Determined once per generation, enforced across all steps.
  const tone: Tone = Math.random() > 0.5 ? 'tech' : 'simple';

  if (ctx.tab === 'OVERVIEW') {
    if (activeNode) narrative = buildOverviewNode(stats, activeNode, tone);
    else if (ctx.chartSection) narrative = buildOverviewChart(stats, ctx.chartSection, tone);
    else narrative = buildOverviewDefault(stats, tone);
  } 
  else if (ctx.tab === 'MARKET') {
    if (activeNode) narrative = buildMarketNode(stats, activeNode, metricKey, tone);
    else narrative = buildMarketDefault(stats, tone);
  } 
  else if (ctx.tab === 'TOPOLOGY') {
    if (activeNode) narrative = buildTopologyNode(stats, activeNode, tone);
    else narrative = buildTopologyDefault(stats, tone);
  }

  NARRATIVE_CACHE.set(cacheKey, narrative);
  return narrative;
};
