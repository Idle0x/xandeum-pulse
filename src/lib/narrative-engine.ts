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

// Explicit type for the analysis result
type AnalysisStats = {
  count: number;
  totalStorage: number;
  avgHealth: number;
  netAvg: number;
  delta: number;
  tier: 'positive' | 'neutral' | 'negative';
  gini: number;
  countries: number;
};

// --- SESSION MEMORY ---
const NARRATIVE_CACHE = new Map<string, string>();

// --- 1. THE EXPANDED LEXICON ---
const VOCAB = {
  // === GENERAL (Shared) ===
  common: {
    subjects: {
      node: ["this unit", "the node", "this peer", "the device", "this machine", "the hardware", "unit [IP]", "the server"],
      group: ["the cluster", "this fleet", "the group", "the collective", "the swarm", "aggregate performance", "the mesh"]
    },
    openers: {
      tech: ["Telemetry indicates", "System diagnostics show", "According to logs,", "Metric evaluation:", "Analysis confirms"],
      simple: ["Here is the deal:", "Looking at the stats,", "Basically,", "To put it simply,", "Checking the numbers,"]
    }
  },

  // === OVERVIEW SPECIFIC ===
  overview: {
    verbs: {
      positive: ["is crushing", "is dominating", "is outperforming", "is driving up", "is optimizing"],
      neutral: ["is maintaining", "is holding", "is tracking with", "is operating at", "is sustaining"],
      negative: ["is dragging down", "is lagging behind", "is struggling with", "is bottlenecking", "is weighing on"]
    },
    adjectives: {
      positive: ["stellar", "robust", "elite", "superior", "flawless", "resilient"],
      neutral: ["standard", "nominal", "average", "steady", "baseline", "consistent"],
      negative: ["volatile", "shaky", "degraded", "compromised", "fragile", "inconsistent"]
    }
  },

  // === MARKET SPECIFIC (Metric Aware) ===
  market: {
    // 1. STORAGE VOCAB
    storage: {
      tech: {
        verbs: ["allocating capacity for", "provisioning shards for", "retaining data for", "anchoring state for"],
        adjectives: ["high-density", "distributed", "redundant", "centralized", "archival-grade"],
        nouns: ["data gravity", "storage throughput", "capacity load", "shard distribution"]
      },
      simple: {
        verbs: ["holding files for", "saving data for", "keeping records for", "storing stuff for"],
        adjectives: ["heavy", "full", "empty", "big", "reliable"],
        nouns: ["total space", "file room", "data load", "storage size"]
      }
    },
    // 2. CREDITS VOCAB
    credits: {
      tech: {
        verbs: ["accruing yield from", "generating rewards via", "mining blocks for", "validating transactions for"],
        adjectives: ["highly profitable", "yield-optimized", "incentivized", "reward-dominant"],
        nouns: ["token generation", "economic throughput", "mining efficiency", "reward vectors"]
      },
      simple: {
        verbs: ["earning points from", "getting paid by", "making money from", "collecting rewards from"],
        adjectives: ["rich", "profitable", "valuable", "top-earning"],
        nouns: ["earnings", "paycheck", "wallet size", "income"]
      }
    },
    // 3. UPTIME VOCAB
    uptime: {
      tech: {
        verbs: ["maintaining persistency for", "guaranteeing availability of", "sustaining connection to"],
        adjectives: ["highly available", "fault-tolerant", "persistent", "always-on"],
        nouns: ["system reliability", "connection stability", "session persistence"]
      },
      simple: {
        verbs: ["staying online for", "keeping the lights on for", "running without stopping for"],
        adjectives: ["dependable", "reliable", "steady", "non-stop"],
        nouns: ["uptime streak", "reliability score", "online time"]
      }
    },
    // 4. HEALTH VOCAB (Fallback to Overview styles usually, but specific here)
    health: {
      tech: { verbs: ["optimizing logic for"], adjectives: ["clinical", "performant"], nouns: ["integrity score"] },
      simple: { verbs: ["running smoothly for"], adjectives: ["healthy", "fit"], nouns: ["health check"] }
    }
  },

  // === TOPOLOGY SPECIFIC ===
  topology: {
    tech: {
      verbs: ["routing traffic via", "anchoring the mesh in", "bridging latency across", "serving requests from"],
      adjectives: ["geospatially distinct", "jurisdictionally isolated", "physically redundant", "latency-optimized"],
      implications: ["minimizing hop count.", "diversifying legal risk.", "reducing propagation delay.", "enhancing censorship resistance."]
    },
    simple: {
      verbs: ["sitting in", "running out of", "located in", "sending data from"],
      adjectives: ["far away", "alone", "well placed", "spread out"],
      implications: ["which is good for safety.", "making it hard to block.", "helping speed things up.", "so it's safer."]
    }
  }
};

// --- 2. HELPER FUNCTIONS ---

const roll = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const getSafeTone = () => Math.random() > 0.5 ? 'tech' : 'simple';

// --- 3. ANALYTICS ENGINE ---
const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75;
  const delta = avgHealth - netAvg;
  
  // Gini Calculation
  const sortedStorage = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  let giniNumerator = 0;
  sortedStorage.forEach((val, i) => { giniNumerator += (i + 1) * val; });
  const gini = (2 * giniNumerator) / (count * totalStorage) - (count + 1) / count;
  const countries = new Set(nodes.map(n => n.location?.countryName)).size;

  let tier: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (delta > 5) tier = 'positive';
  if (delta < -5) tier = 'negative';

  return { count, totalStorage, avgHealth, netAvg, delta, tier, gini, countries };
};

// --- 4. ASSEMBLERS (The "Sentence Builders") ---

// OVERVIEW ASSEMBLER (Subject + General Verb + General Adjective)
const buildOverviewSentence = (stats: AnalysisStats, activeNode: Node | null) => {
  const tone = getSafeTone();
  const sentiment = stats.tier; // positive, neutral, negative

  const opener = roll(VOCAB.common.openers[tone]);
  const verb = roll(VOCAB.overview.verbs[sentiment]);
  const adj = roll(VOCAB.overview.adjectives[sentiment]);
  const subject = activeNode ? roll(VOCAB.common.subjects.node).replace('[IP]', getSafeIp(activeNode)) : roll(VOCAB.common.subjects.group);

  // Structures
  const s1 = () => `${opener} ${subject} ${verb} expectations. The current status is ${adj}.`;
  const s2 = () => `${capitalize(adj)}. That describes ${subject} right now. It ${verb} the baseline.`;
  const s3 = () => `${capitalize(subject)} ${verb} the network average, ${sentiment === 'positive' ? 'setting a high bar' : 'which requires attention'}.`;

  return roll([s1, s2, s3])();
};

// MARKET ASSEMBLER (Metric Specific Vocab)
const buildMarketSentence = (stats: AnalysisStats, activeNode: Node | null, metric: string) => {
  const tone = getSafeTone();
  const mKey = (metric === 'storage_committed' ? 'storage' : metric) as keyof typeof VOCAB.market;
  // Fallback if metric key is weird (default to storage)
  const vocab = VOCAB.market[mKey] || VOCAB.market.storage; 
  
  const vList = vocab[tone].verbs;
  const aList = vocab[tone].adjectives;
  const nList = vocab[tone].nouns;

  const subject = activeNode ? roll(VOCAB.common.subjects.node).replace('[IP]', getSafeIp(activeNode)) : roll(VOCAB.common.subjects.group);
  const verb = roll(vList);
  const noun = roll(nList);
  const adj = roll(aList);

  // Context Logic
  let context = "";
  if (metric === 'credits') context = stats.delta > 0 ? "generating massive value" : "earning below average";
  if (metric === 'storage') context = stats.gini > 0.5 ? "leading to centralization" : "keeping data decentralized";
  if (metric === 'uptime') context = "ensuring maximum availability";
  if (metric === 'health') context = "operating at peak efficiency";

  // Structures
  const s1 = () => `${capitalize(noun)} Update: ${subject} is ${verb} the network, ${context}.`;
  const s2 = () => `${capitalize(adj)} performance detected. ${capitalize(subject)} is currently ${verb} the cluster.`;
  const s3 = () => `Economic Analysis: ${subject} contributes to ${noun} by ${verb} the system.`;

  return roll([s1, s2, s3])();
};

// TOPOLOGY ASSEMBLER (Spatial Vocab)
const buildTopologySentence = (stats: AnalysisStats, activeNode: Node | null) => {
  const tone = getSafeTone();
  const vocab = VOCAB.topology[tone];
  
  const subject = activeNode ? roll(VOCAB.common.subjects.node).replace('[IP]', getSafeIp(activeNode)) : roll(VOCAB.common.subjects.group);
  const country = activeNode?.location?.countryName || "Unknown Region";
  const verb = roll(vocab.verbs);
  const adj = roll(vocab.adjectives);
  const implication = roll(vocab.implications);

  // Structures
  if (activeNode) {
    // Node Focus
    const s1 = () => `Geo-Point: ${subject} is ${verb} ${country}. This makes it ${adj}, ${implication}`;
    const s2 = () => `${capitalize(adj)} placement. ${capitalize(subject)} is ${verb} ${country}, ${implication}`;
    return roll([s1, s2])();
  } else {
    // Global Focus
    const s1 = () => `Mesh Audit: The fleet is ${adj}. We are ${verb} ${stats.countries} unique countries, ${implication}`;
    const s2 = () => `${capitalize(adj)} distribution detected. The group is ${verb} multiple jurisdictions, ${implication}`;
    return roll([s1, s2])();
  }
};


// --- 5. MAIN EXPORT ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Initializing...";

  // 1. CACHE KEY GENERATION
  const activeKey = ctx.focusKey || ctx.hoverKey || 'default';
  const sectionKey = ctx.chartSection || 'none';
  const metricKey = ctx.metric || 'storage';
  const cacheKey = `${ctx.tab}::${activeKey}::${sectionKey}::${metricKey}`;

  // 2. CHECK CACHE
  if (NARRATIVE_CACHE.has(cacheKey)) {
    return NARRATIVE_CACHE.get(cacheKey)!;
  }

  // 3. ANALYZE
  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating...";

  const activeNode = activeKey !== 'default' ? ctx.nodes.find(n => n.pubkey === activeKey) || null : null;
  let narrative = "";

  // 4. ROUTE TO ASSEMBLERS
  if (ctx.tab === 'OVERVIEW') {
    // Chart click override
    if (ctx.chartSection) {
       narrative = buildMarketSentence(stats, null, ctx.chartSection); // Reuse market logic for chart clicks as they are metric based
    } else {
       narrative = buildOverviewSentence(stats, activeNode);
    }
  } 
  else if (ctx.tab === 'MARKET') {
    narrative = buildMarketSentence(stats, activeNode, metricKey);
  } 
  else if (ctx.tab === 'TOPOLOGY') {
    narrative = buildTopologySentence(stats, activeNode);
  }

  // 5. SAVE & RETURN
  NARRATIVE_CACHE.set(cacheKey, narrative);
  return narrative;
};
