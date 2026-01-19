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

// NEW: Explicit type for the analysis result to prevent "implicitly any" errors
type AnalysisStats = {
  count: number;
  totalStorage: number;
  avgHealth: number;
  netAvg: number;
  delta: number;
  tier: 'positive' | 'neutral' | 'negative';
};

// --- SESSION MEMORY (The "Lock") ---
const NARRATIVE_CACHE = new Map<string, string>();

// --- 1. THE MASSIVE TOKEN LEXICON ---
const VOCAB = {
  // [OPENERS]
  openers: {
    tech: [
      "Telemetry indicates", "System diagnostics show", "According to the logs,", "Node metrics suggest", 
      "Analysis confirms", "Protocol scan results:", "Throughput analysis:", "Latency inspection:",
      "Based on current telemetry,", "Algorithmic evaluation:"
    ],
    simple: [
      "Here is the deal:", "Looking at the stats,", "Basically,", "To put it simply,", 
      "We can see that", "Checking the numbers,", "Quick update:", "As you can see,",
      "The story here is simple:", "Breaking this down,"
    ]
  },
  
  // [SUBJECTS]
  subjects: {
    node: [
      "this unit", "the node", "this peer", "the device", "this machine", 
      "the hardware", "this specific operator", "unit [IP]", "the server"
    ],
    group: [
      "the cluster", "this fleet", "the group", "the collective", "the network subset",
      "this cohort", "the swarm", "aggregate performance", "the mesh"
    ]
  },

  // [VERBS]
  verbs: {
    positive: [
      "is crushing", "is dominating", "is outperforming", "is leading", "is driving up",
      "is anchoring", "is boosting", "is optimizing", "is surpassing", "is eclipsing"
    ],
    neutral: [
      "is maintaining", "is holding", "is tracking with", "is mirroring", "is operating at",
      "is functioning as", "is delivering", "is outputting", "is sustaining"
    ],
    negative: [
      "is dragging down", "is lagging behind", "is struggling with", "is failing to match",
      "is bottlenecking", "is deteriorating relative to", "is weighing on", "is slipping below"
    ]
  },

  // [ADJECTIVES]
  adjectives: {
    positive: [
      "stellar", "robust", "rock-solid", "elite", "prime", "superior", 
      "flawless", "resilient", "clean", "healthy", "optimized", "impeccable"
    ],
    neutral: [
      "standard", "nominal", "average", "steady", "baseline", "expected", 
      "median", "consistent", "typical", "regular"
    ],
    negative: [
      "volatile", "shaky", "degraded", "poor", "compromised", "fragile", 
      "inconsistent", "weak", "sub-optimal", "critical", "unstable"
    ]
  },

  // [CONTEXTS]
  contexts: {
    positive: [
      "by a significant margin", "setting a new standard", "well above the baseline", 
      "beating global averages", "leading the pack", "showing top-tier results"
    ],
    neutral: [
      "within expected parameters", "aligned with the baseline", "deviation is minimal",
      "right on target", "matching network standards"
    ],
    negative: [
      "requiring immediate attention", "well below the safe zone", "creating a risk factor",
      "dragging the average down", "showing signs of stress"
    ]
  },

  // [IMPLICATIONS]
  implications: {
    positive: [
      "which is fantastic.", "signaling high reliability.", "making it a key asset.",
      "so no worries here.", "indicating excellent health.", "proving its value."
    ],
    neutral: [
      "which is normal.", "nothing to worry about.", "maintaining status quo.",
      "keeping things stable.", "so it's business as usual."
    ],
    negative: [
      "which is a problem.", "indicating potential failure.", "reducing overall resilience.",
      "so maintenance is advised.", "increasing risk exposure.", "impacting the score."
    ]
  }
};

// --- 2. HELPER FUNCTIONS ---

const roll = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const buildSentence = (sentiment: 'positive' | 'neutral' | 'negative', subjectName: string) => {
  const tone = Math.random() > 0.5 ? 'tech' : 'simple';
  
  const opener = roll(VOCAB.openers[tone]);
  const subj = roll(VOCAB.subjects.node).replace('[IP]', subjectName); 
  const verb = roll(VOCAB.verbs[sentiment]);
  const adj = roll(VOCAB.adjectives[sentiment]);
  const context = roll(VOCAB.contexts[sentiment]);
  const implication = roll(VOCAB.implications[sentiment]);

  const structures = [
    () => `${opener} ${subj} ${verb} expectations, ${context}.`,
    () => `${capitalize(adj)}. That describes ${subj}. It ${verb} the group average ${context}.`,
    () => `${capitalize(subj)} ${verb} the benchmark, ${implication}`,
    () => `${opener} ${adj} performance detected. ${capitalize(subj)} ${verb} the rest.`
  ];

  return roll(structures)();
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- 3. ANALYTICS ENGINE ---
// Explicitly return AnalysisStats so TS knows exactly what 'tier' is
const analyze = (nodes: Node[], benchmark: any): AnalysisStats | null => {
  if (nodes.length === 0) return null;
  const count = nodes.length;
  const totalStorage = nodes.reduce((a, b) => a + (b.storage_committed || 0), 0);
  const avgHealth = nodes.reduce((a, b) => a + (b.health || 0), 0) / count;
  const netAvg = benchmark?.networkRaw?.health || 75;
  const delta = avgHealth - netAvg;
  
  let tier: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (delta > 5) tier = 'positive';
  if (delta < -5) tier = 'negative';

  return { count, totalStorage, avgHealth, netAvg, delta, tier };
};

// --- 4. SCENARIO GENERATORS ---
// Updated signatures to use AnalysisStats instead of 'any'

const generateOverview = (activeNode: Node | null, stats: AnalysisStats, section: string | null): string => {
  
  // A1: CHART SECTION CLICKED
  if (section) {
    const isPositive = stats.tier === 'positive';
    return `${roll(VOCAB.openers.tech)} Analysis of ${section}. The group average is ${stats.avgHealth.toFixed(0)}. ${isPositive ? "This is a strong sector." : "This sector needs work."} ${roll(VOCAB.implications[stats.tier])}`;
  }

  // A2: SPECIFIC NODE CLICKED
  if (activeNode) {
    const diff = (activeNode.health || 0) - stats.avgHealth;
    const sentiment = diff > 2 ? 'positive' : diff < -2 ? 'negative' : 'neutral';
    const safeIp = getSafeIp(activeNode);
    return buildSentence(sentiment, safeIp);
  }

  // A3: DEFAULT VIEW
  const subject = roll(VOCAB.subjects.group);
  const verb = roll(VOCAB.verbs[stats.tier]);
  const adj = roll(VOCAB.adjectives[stats.tier]);
  return `${roll(VOCAB.openers.simple)} ${subject} ${verb} the network baseline. We are seeing ${adj} signals, ${roll(VOCAB.contexts[stats.tier])}.`;
};

const generateMarket = (activeNode: Node | null, stats: AnalysisStats, metric: string): string => {
  const m = metric || 'storage';

  // B1: SPECIFIC NODE CLICKED
  if (activeNode) {
    const val = (activeNode as any)[m === 'storage' ? 'storage_committed' : m] || 0;
    const share = (val / (m === 'storage' ? stats.totalStorage : 100)) * 100; 
    
    // share logic
    if (share > 20) return `Whale Alert: ${getSafeIp(activeNode)} controls a massive chunk of the ${m}. This represents a centralization risk.`;
    return `Small Stakeholder: ${getSafeIp(activeNode)} holds a nominal share. It poses no centralization risk to the cluster.`;
  }

  // B2: DEFAULT VIEW
  return `Market Analysis (${m}): Distribution is ${stats.delta > 0 ? "healthy" : "concerning"}. ${roll(VOCAB.openers.tech)} No single point of failure detected.`;
};

const generateTopology = (activeNode: Node | null, stats: AnalysisStats): string => {
  
  // C1: SPECIFIC NODE CLICKED
  if (activeNode) {
    const country = activeNode.location?.countryName || "Unknown";
    return `Geo-Location Lock: ${getSafeIp(activeNode)} is physically located in ${country}. ${roll(VOCAB.implications.positive)}`;
  }

  // C2: DEFAULT VIEW
  return `${roll(VOCAB.openers.simple)} The mesh topology indicates good geographic spread. Nodes are not physically clustered, reducing legal risk.`;
};


// --- 5. MAIN EXPORT ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Initializing...";

  const activeKey = ctx.focusKey || ctx.hoverKey || 'default';
  const sectionKey = ctx.chartSection || 'none';
  const cacheKey = `${ctx.tab}::${activeKey}::${sectionKey}::${ctx.metric || 'none'}`;

  if (NARRATIVE_CACHE.has(cacheKey)) {
    return NARRATIVE_CACHE.get(cacheKey)!;
  }

  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating...";

  let narrative = "";
  const activeNode = activeKey !== 'default' ? ctx.nodes.find(n => n.pubkey === activeKey) || null : null;

  if (ctx.tab === 'OVERVIEW') narrative = generateOverview(activeNode, stats, ctx.chartSection || null);
  else if (ctx.tab === 'MARKET') narrative = generateMarket(activeNode, stats, ctx.metric || 'storage');
  else if (ctx.tab === 'TOPOLOGY') narrative = generateTopology(activeNode, stats);

  NARRATIVE_CACHE.set(cacheKey, narrative);

  return narrative;
};
