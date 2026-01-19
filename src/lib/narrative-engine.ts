import { Node } from '../types';
import { formatBytes } from '../utils/formatters';
import { getSafeIp } from '../utils/nodeHelpers';

// --- TYPES & INTERFACES ---
export type NarrativeContext = {
  tab: 'OVERVIEW' | 'MARKET' | 'TOPOLOGY';
  metric?: string; 
  focusKey?: string | null; 
  hoverKey?: string | null; 
  nodes: Node[];
  benchmarks: any;
  chartSection?: string | null;
};

// --- 1. SEEDED RANDOM ENGINE (STABILITY) ---
const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const getSeededRandom = (seedString: string) => {
  const seed = cyrb53(seedString);
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

const pick = <T>(arr: T[], seedStr: string): T => {
  const uniqueSeed = `${seedStr}::${arr.length}`; 
  const index = Math.floor(getSeededRandom(uniqueSeed) * arr.length);
  return arr[index];
};

// --- 2. THE UPGRADED LEXICON MATRIX ---
const LEXICON = {
  openers: {
    neutral: {
      tech: [
        "Telemetry analysis:", "System diagnostics:", "Aggregated node report:", "Cluster synthesis:", 
        "Data stream analysis:", "Network probe results:", "Latency inspection:", "Protocol audit:",
        "Baseline comparison:", "Operational readout:"
      ],
      simple: [
        "Let's look at the numbers:", "Here is the breakdown:", "Checking the stats:", 
        "What we are seeing is this:", "The data tells us:", "A quick summary:", 
        "To get straight to the point:", "Here is the deal:", "Looking at the basics:", "Status check:"
      ]
    },
    positive: {
      tech: [
        "Optimization detected:", "High-efficiency signals:", "Superior performance metrics:", 
        "Healthy variance patterns:", "Optimal configuration confirmed:", "System stability at peak levels:",
        "Green metrics across the board:", "Capacity indexes are strong:", "High-fidelity throughput:"
      ],
      simple: [
        "Good news:", "Things are looking good:", "Strong results here:", 
        "We are seeing great signs:", "Best in class results:", "Top marks for this group:", 
        "Smooth sailing:", "This is working perfectly:", "Really solid numbers:"
      ]
    },
    negative: {
      tech: [
        "Anomaly detected:", "Critical variance alert:", "Sub-optimal throughput:", 
        "Degradation warning:", "Latency threshold breached:", "System stress indicated:",
        "Negative trend analysis:", "Resource bottleneck detected:", "Stability integrity compromised:"
      ],
      simple: [
        "Heads up:", "We have a problem:", "Not looking great:", 
        "Watch out:", "Red flags are showing:", "It is struggling a bit:", 
        "Performance is taking a hit:", "This needs fixing:", "We have a bit of a mess:"
      ]
    }
  },
  adjectives: {
    good: {
      tech: [
        "robust", "resilient", "optimal", "stabilized", "synchronized", 
        "calibrated", "streamlined", "high-fidelity", "latency-free"
      ],
      simple: [
        "solid", "strong", "happy", "clean", "smooth", 
        "trusty", "rock-solid", "sharp", "punchy"
      ]
    },
    bad: {
      tech: [
        "volatile", "degraded", "fragmented", "asynchronous", "compromised", 
        "congested", "misaligned", "erratic", "throttled"
      ],
      simple: [
        "shaky", "weak", "messy", "rough", "unstable", 
        "clunky", "slow", "confused", "laggy"
      ]
    },
    big: {
      tech: ["substantial", "dominant", "significant", "primary", "controlling"],
      simple: ["huge", "massive", "big", "heavy", "giant"]
    }
  },
  verbs: {
    rising: {
      tech: [
        "outperforming", "surpassing", "exceeding", "deviating positively from", 
        "accelerating past", "amplifying", "out-scaling"
      ],
      simple: [
        "beating", "doing better than", "topping", "winning against", 
        "leaving behind", "rising above", "passing"
      ]
    },
    falling: {
      tech: [
        "underperforming", "trailing", "lagging", "deviating negatively from", 
        "deteriorating relative to", "bottlenecking", "decelerating below"
      ],
      simple: [
        "losing to", "falling behind", "dropping below", "missing", 
        "struggling against", "slipping behind", "failing to match"
      ]
    }
  },
  connectors: {
    contrast: [
      "however,", "conversely,", "although,", "that said,", 
      "on the other hand,", "even so,", "despite this,"
    ],
    logic: [
      "resulting in", "which suggests", "indicating", "leading to", 
      "meaning", "which drives", "creating a scenario where"
    ]
  }
};

// --- 3. THE ANALYZER (THE BRAIN) ---
const analyzeContext = (nodes: Node[], benchmark: any) => {
  const count = nodes.length;
  if (count === 0) return null;

  // BASE STATS
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75; 
  const variance = nodes.reduce((a, b) => a + Math.pow((b.health || 0) - avgHealth, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // MARKET CALCS
  const sortedStorage = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  let giniNumerator = 0;
  sortedStorage.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;

  // TOPOLOGY CALCS
  const countries = new Set(nodes.map(n => n.location?.countryName)).size;
  
  // LOGIC BUCKETS
  const performanceTier = avgHealth > netAvg + 5 ? 'ELITE' : avgHealth > netAvg ? 'GOOD' : avgHealth > netAvg - 10 ? 'AVERAGE' : 'POOR';
  const consistency = stdDev < 5 ? 'TIGHT' : stdDev < 15 ? 'NORMAL' : 'CHAOTIC';
  const distribution = gini > 0.5 ? 'CENTRALIZED' : 'DECENTRALIZED';
  
  return {
    count,
    totalStorage,
    avgHealth,
    netAvg,
    delta: avgHealth - netAvg,
    stdDev,
    gini,
    countries,
    performanceTier,
    consistency,
    distribution,
    whales: nodes.filter(n => (n.storage_committed || 0) / totalStorage > 0.25)
  };
};

// --- 4. ATOMIC ASSEMBLERS (SCENARIOS) ---

/** SCENARIO A1: OVERVIEW - DEFAULT */
const scenarioOverviewDefault = (s: any, seed: string) => {
  const sentiment = s.delta >= 0 ? 'positive' : 'negative';
  const adjList = s.delta >= 0 ? LEXICON.adjectives.good : LEXICON.adjectives.bad;
  
  // Variation 1: The "Executive Summary" (Simple -> Tech)
  const v1 = () => {
    const opener = pick(LEXICON.openers[sentiment].simple, seed);
    const techFact = `Aggregate health is ${Math.abs(s.delta).toFixed(1)} points ${s.delta >= 0 ? "above" : "below"} the global baseline`;
    const conclusion = `indicating a ${pick(adjList.tech, seed)} cluster state.`;
    return `${opener} ${techFact}, ${conclusion}`;
  };

  // Variation 2: The "Technical Deep Dive" (Tech -> Simple)
  const v2 = () => {
    const opener = pick(LEXICON.openers[sentiment].tech, seed);
    const simpleFact = `this group is ${s.delta >= 0 ? pick(LEXICON.verbs.rising.simple, seed) : pick(LEXICON.verbs.falling.simple, seed)} the rest of the network`;
    const context = `(avg ${s.avgHealth.toFixed(0)} vs ${s.netAvg.toFixed(0)}).`;
    return `${opener} ${simpleFact} ${context}`;
  };

  // Variation 3: The "Consistency Focus"
  const v3 = () => {
    const isTight = s.consistency === 'TIGHT';
    return `Cluster Stability Analysis: The nodes are ${isTight ? "acting as a single unit" : "all over the place"}. ${isTight ? "Standard deviation is minimal" : "High variance detected"}, suggesting hardware quality is ${isTight ? "uniform" : "mixed"}.`;
  };

  return pick([v1, v2, v3], seed)();
};

/** SCENARIO A2: OVERVIEW - CHART FOCUS */
const scenarioOverviewChart = (s: any, section: string, seed: string) => {
  const mSeed = seed + section;
  
  if (section === 'health') {
    return pick([
      () => `Health Metric Deep Dive: This is the primary indicator of reliability. With an average of ${s.avgHealth.toFixed(0)}, this group is ${s.delta > 0 ? "a strong contributor" : "a drag"} on the global network.`,
      () => `Vitality Analysis: ${pick(LEXICON.openers.neutral.tech, mSeed)} Internal consistency is ${s.consistency}. ${s.stdDev > 10 ? "Some nodes are carrying the weight for others." : "Performance is evenly distributed."}`
    ], mSeed)();
  }
  
  if (section === 'storage') {
    return pick([
      () => `Capacity Context: This cluster contributes ${formatBytes(s.totalStorage)} to the network. ${s.gini > 0.4 ? "However, the load is not shared equally." : "The load is beautifully balanced."}`,
      () => `Data Audit: ${s.distribution === 'CENTRALIZED' ? "Warning:" : "Good sign:"} We are seeing ${s.distribution.toLowerCase()} storage patterns. ${s.whales.length} node(s) are holding the majority of data.`
    ], mSeed)();
  }

  return `Metric Focus (${section}): ${pick(LEXICON.openers.neutral.simple, mSeed)} Tracking this specific data point reveals the ${s.performanceTier.toLowerCase()} nature of the hardware involved.`;
};

/** SCENARIO A3: OVERVIEW - NODE FOCUS */
const scenarioOverviewNode = (node: Node, s: any, seed: string) => {
  const diff = (node.health || 0) - s.avgHealth; 
  const netDiff = (node.health || 0) - s.netAvg;
  const safeName = getSafeIp(node);
  const isLeader = diff > 5;
  const isLaggard = diff < -5;

  // Template A: The "Anchor" (Comparison to Group)
  const t1 = () => {
    const verb = diff > 0 ? pick(LEXICON.verbs.rising.tech, seed) : pick(LEXICON.verbs.falling.tech, seed);
    return `Node Diagnostic [${safeName}]: This specific unit is ${verb} the cluster average by ${Math.abs(diff).toFixed(1)} points.`;
  };

  // Template B: The "Global Context" (Comparison to Network)
  const t2 = () => {
    const sentiment = netDiff > 0 ? "positive" : "negative";
    return `Global Impact: ${pick(LEXICON.openers[sentiment].simple, seed)} Compared to the entire world computer, this node is ${netDiff > 0 ? "elite" : "struggling"}. It is ${netDiff > 0 ? "pulling the metrics up" : "weighing the metrics down"}.`;
  };

  // Template C: The "Role"
  const t3 = () => {
    let role = "Standard Contributor";
    if (isLeader) role = "Cluster Champion";
    if (isLaggard) role = "Performance Bottleneck";
    return `Role Assessment: ${role}. With a health of ${node.health}, it acts as a ${isLeader ? "stabilizing force" : "risk factor"} for the local group.`;
  };

  return pick([t1, t2, t3], seed)();
};

/** SCENARIO B1: MARKET - DEFAULT */
const scenarioMarketDefault = (s: any, metric: string, seed: string) => {
  const mSeed = seed + metric;
  
  if (s.gini > 0.5) {
    return pick([
      () => `Risk Assessment: High Centralization. The Gini coefficient is ${s.gini.toFixed(2)}, meaning a few "Whales" control the market. If they go offline, the cluster collapses.`,
      () => `${pick(LEXICON.openers.negative.simple, mSeed)} The pie chart is uneven. Wealth/Load is concentrated in the top ${(100/s.count).toFixed(0)}% of nodes.`
    ], mSeed)();
  }

  return pick([
    () => `Healthy Distribution: The Gini score of ${s.gini.toFixed(2)} indicates a democratic spread. No single point of failure exists based on ${metric}.`,
    () => `Market Structure: ${pick(LEXICON.adjectives.good.tech, mSeed)}. The slice sizes are roughly equal, which means the network is resilient to individual node failures.`
  ], mSeed)();
};

/** SCENARIO B2: MARKET - NODE FOCUS */
const scenarioMarketNode = (node: Node, s: any, metric: string, seed: string) => {
  const val = (node as any)[metric === 'storage' ? 'storage_committed' : metric] || 0;
  const total = metric === 'storage' ? s.totalStorage : 1; 
  const share = metric === 'storage' || metric === 'credits' ? (val / total) * 100 : 0;
  const safeName = getSafeIp(node);

  if (metric === 'health') {
    return `Competitive Analysis: ${safeName} has a health score of ${node.health}. In the "Market of Reliability", it is in the ${node.health && node.health > s.avgHealth ? "upper" : "lower"} percentile.`;
  }

  const riskLevel = share > 25 ? "Critical" : share > 10 ? "High" : "Low";
  
  return pick([
    () => `Stakeholder Report [${safeName}]: This node holds ${share.toFixed(1)}% of the total ${metric}. Influence Level: ${riskLevel}.`,
    () => `Impact Simulation: If this node goes dark, the cluster loses ${share.toFixed(1)}% of its ${metric} capacity instantly. ${share > 15 ? "That is a massive hit." : "The cluster would survive."}`,
    () => `${pick(LEXICON.openers.neutral.tech, seed)} Assessing dominance. This is a ${share < 5 ? "minority player" : "major stakeholder"} in the local economy.`
  ], seed)();
};

/** SCENARIO C1: TOPOLOGY - DEFAULT */
const scenarioTopologyDefault = (s: any, seed: string) => {
  const uniqueCount = s.countries;
  const isGlobal = uniqueCount > 3;

  return pick([
    () => `Geospatial Audit: The fleet spans ${uniqueCount} unique jurisdictions. ${isGlobal ? "Excellent censorship resistance." : "Risk: Physical centralization detected."}`,
    () => `Latency Map: Nodes are ${isGlobal ? "widely distributed" : "clumped together"}. This affects how fast they can gossip with the global network.`,
    () => `Network Geometry: ${pick(LEXICON.openers.neutral.simple, seed)} We are looking at a ${isGlobal ? "global" : "local"} operation. Physical redundancy is ${isGlobal ? "high" : "low"}.`
  ], seed)();
};

/** SCENARIO C2: TOPOLOGY - NODE FOCUS */
const scenarioTopologyNode = (node: Node, s: any, seed: string) => {
  const country = node.location?.countryName || "Unknown";
  const safeName = getSafeIp(node);

  return pick([
    () => `Strategic Outpost: ${safeName} is deployed in ${country}. It serves as a physical anchor for data in that region.`,
    () => `Routing Context: Located in ${country}, this node's value increases if it is far from the other ${s.count - 1} nodes (providing edge access).`,
    () => `Jurisdictional Check: This node operates under ${country}'s regulations. ${s.countries > 1 ? "It adds legal diversity to the group." : "It is part of a mono-jurisdiction cluster."}`
  ], seed)();
};


// --- 5. MAIN GENERATOR FUNCTION ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Awaiting telemetry...";

  const stats = analyzeContext(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating context...";

  // Seed generation (Tab + Hour + NodeCount or NodeID)
  const activeKey = ctx.focusKey || ctx.hoverKey;
  const activeNode = activeKey ? ctx.nodes.find(n => n.pubkey === activeKey) : null;
  const globalSeed = activeKey 
    ? activeKey 
    : `${ctx.tab}-${ctx.nodes.length}-${new Date().getHours()}`;

  // --- ROUTING LOGIC ---

  // OVERVIEW
  if (ctx.tab === 'OVERVIEW') {
    if (activeNode) return scenarioOverviewNode(activeNode, stats, globalSeed);
    if (ctx.chartSection) return scenarioOverviewChart(stats, ctx.chartSection, globalSeed);
    return scenarioOverviewDefault(stats, globalSeed);
  }

  // MARKET
  if (ctx.tab === 'MARKET') {
    const metric = ctx.metric || 'storage';
    if (activeNode) return scenarioMarketNode(activeNode, stats, metric, globalSeed);
    return scenarioMarketDefault(stats, metric, globalSeed);
  }

  // TOPOLOGY
  if (ctx.tab === 'TOPOLOGY') {
    if (activeNode) return scenarioTopologyNode(activeNode, stats, globalSeed);
    return scenarioTopologyDefault(stats, globalSeed);
  }

  return "System Ready.";
};
