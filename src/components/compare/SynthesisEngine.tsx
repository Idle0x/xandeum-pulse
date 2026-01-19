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

// --- THE LEXICON MATRIX ---
// Categorized by "Intensity Bands" and "Metric Personalities"
const POOLS = {
  connectors: {
    simple: ["Basically,", "In plain English,", "Essentially,", "What this means is,", "To put it simply,"],
    tech: ["Telemetry indicates", "Diagnostic analysis confirms", "Algorithmic audit reveals", "Statistical modeling suggests", "Systemic assessment shows"],
    transition: ["resulting in", "leading to", "which triggers", "effectively creating", "consequently causing"]
  },
  intensity: {
    critical_low: {
      tech: ["severe degradation", "catastrophic variance", "acute performance collapse", "critical divergence"],
      simple: ["a major breakdown", "a huge problem", "a dangerous dip", "really bad performance"]
    },
    mild_low: {
      tech: ["minor oscillation", "nominal drift", "sub-optimal throughput", "slight performance lag"],
      simple: ["a small lag", "a tiny drop", "not quite perfect", "a bit slow"]
    },
    mild_high: {
      tech: ["marginal optimization", "positive drift", "stable throughput", "healthy elevation"],
      simple: ["a good boost", "looking solid", "doing well", "slightly above average"]
    },
    critical_high: {
      tech: ["elite performance", "optimal synchronization", "superior hardware efficiency", "peak telemetry"],
      simple: ["perfect performance", "top-tier status", "amazing speed", "the best in the group"]
    }
  },
  personalities: {
    health: ["vitality", "pulse", "hardware integrity", "system health", "operational life"],
    storage: ["capacity", "volume", "retention depth", "grid space", "storage density"],
    credits: ["economic output", "yield", "reward velocity", "financial weight", "earning power"],
    uptime: ["persistence", "reliability", "heartbeat", "availability", "temporal stability"]
  },
  topology: {
    lone: ["Strategic Edge Anchor", "Critical Bridge", "Unique Jurisdictional Asset", "Gateway Node"],
    clumped: ["Redundant Asset", "Clustered Peer", "Local Consensus Participant", "High-Density Unit"],
    risk: ["regulatory single-point-of-failure", "physical proximity bottleneck", "geopolitical concentration", "localized outage risk"]
  }
};

// --- THE ANALYTICS ENGINE (Nuance Layer) ---
const analyze = (nodes: Node[], benchmark: any) => {
  if (!nodes.length) return null;
  const count = nodes.length;
  const healths = nodes.map(n => n.health || 0).sort((a, b) => a - b);
  const storages = nodes.map(n => n.storage_committed || 0).sort((a, b) => a - b);
  
  const avgHealth = healths.reduce((a, b) => a + b, 0) / count;
  const totalStorage = storages.reduce((a, b) => a + b, 0);
  const netAvg = benchmark?.networkRaw?.health || 75;
  const delta = avgHealth - netAvg;
  
  // Median (Outlier detection)
  const mid = Math.floor(count / 2);
  const medianHealth = count % 2 !== 0 ? healths[mid] : (healths[mid - 1] + healths[mid]) / 2;
  
  // Gini (Centralization)
  let giniNum = 0;
  storages.forEach((v, i) => { giniNum += (i + 1) * v; });
  const gini = (2 * giniNum) / (count * totalStorage) - (count + 1) / count;
  
  // Topology
  const countryMap: Record<string, number> = {};
  nodes.forEach(n => { countryMap[n.location?.countryName || 'Unknown'] = (countryMap[n.location?.countryName || 'Unknown'] || 0) + 1; });
  const domRegion = Object.keys(countryMap).reduce((a, b) => countryMap[a] > countryMap[b] ? a : b);
  const domScore = (countryMap[domRegion] / count) * 100;

  return { avgHealth, medianHealth, totalStorage, delta, gini, countryMap, domRegion, domScore, count, top3: storages.slice(-3).reduce((a, b) => a + b, 0) };
};

// --- COMBINATORIAL GENERATOR ---
const roll = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const getIntensityKey = (delta: number): 'critical_low' | 'mild_low' | 'mild_high' | 'critical_high' => {
  if (delta < -15) return 'critical_low';
  if (delta < 0) return 'mild_low';
  if (delta < 15) return 'mild_high';
  return 'critical_high';
};

// --- SCENARIO ASSEMBLERS ---

const assembleOverview = (stats: any, node?: Node | null, section?: string | null) => {
  const intensity = getIntensityKey(node ? (node.health || 0) - stats.avgHealth : stats.delta);
  const p = section || 'health';
  const person = roll(POOLS.personalities[p as keyof typeof POOLS.personalities] || POOLS.personalities.health);

  // HYBRID WEAVE PATTERN
  const headline = `${roll(POOLS.connectors.tech)} a ${roll(POOLS.intensity[intensity].tech)} in ${person}.`;
  const translation = `${roll(POOLS.connectors.simple)} the ${person} is ${roll(POOLS.intensity[intensity].simple)}.`;
  
  let deepDive = "";
  if (node) {
    const root = node.health && node.health < 50 ? "hardware degradation" : "latency jitter";
    deepDive = `Specifically, Node [${getSafeIp(node).split(' ')[1]}] is exhibiting ${root}, ${roll(POOLS.connectors.transition)} the current score.`;
  } else {
    deepDive = stats.delta > 0 ? "This group is acting as a network stabilizer." : "This cluster is currently a performance bottleneck.";
  }

  const action = intensity.includes('low') ? "Recommendation: Optimize hardware configs." : "Status: Maintenance mode sufficient.";

  return `${headline} ${translation} ${deepDive} ${action}`;
};

const assembleMarket = (stats: any, node?: Node | null) => {
  const isCentralized = stats.gini > 0.5;
  const top3Share = (stats.top3 / stats.totalStorage) * 100;

  if (node) {
    const share = ((node.storage_committed || 0) / stats.totalStorage) * 100;
    const h = `${roll(POOLS.connectors.tech)} a market share of ${share.toFixed(1)}%.`;
    const s = `${roll(POOLS.connectors.simple)} this node is ${share > 10 ? 'a huge whale' : 'a small participant'}.`;
    const d = share > 10 ? "Its failure would trigger immediate capacity gaps." : "Its role is redundant and easily absorbed.";
    return `${h} ${s} ${d}`;
  }

  const headline = isCentralized ? "Warning: Market structure is currently an Oligarchy." : "Market structure appears Democratically distributed.";
  const context = `The top 3 entities control ${top3Share.toFixed(1)}% of total grid power.`;
  const simulation = `If these entities detach, the network loses ${formatBytes(stats.top3)} of storage.`;
  const action = isCentralized ? "Strategy: Incentivize smaller nodes to dilute power." : "Strategy: Continue current growth vector.";
  
  return `${headline} ${context} ${simulation} ${action}`;
};

const assembleTopology = (stats: any, node?: Node | null) => {
  if (node) {
    const country = node.location?.countryName || "Unknown";
    const isLone = stats.countryMap[country] === 1;
    const h = `${roll(POOLS.connectors.tech)} deployment in ${country}.`;
    const s = `${roll(POOLS.connectors.simple)} this node is ${isLone ? 'the only one here' : 'one of many'}.`;
    const d = isLone ? `It acts as a ${roll(POOLS.topology.lone)} for this region.` : `It is a ${roll(POOLS.topology.clumped)} contributing to local density.`;
    return `${h} ${s} ${d}`;
  }

  const isClumped = stats.domScore > 50;
  const h = `${roll(POOLS.connectors.tech)} nodes across ${Object.keys(stats.countryMap).length} regions.`;
  const s = `${roll(POOLS.connectors.simple)} most of the fleet is in ${stats.domRegion}.`;
  const d = isClumped ? `This creates a ${roll(POOLS.topology.risk)}.` : "This footprint offers excellent censorship resistance.";
  const a = isClumped ? "Action: Deploy to new jurisdictions to mitigate legal risk." : "Action: Nominal geo-stability confirmed.";
  
  return `${h} ${s} ${d} ${a}`;
};

// --- EXPORT ENGINE ---
export const generateNarrative = (ctx: NarrativeContext): string => {
  if (!ctx.nodes || ctx.nodes.length === 0) return "Synthesizing...";
  
  const stats = analyze(ctx.nodes, ctx.benchmarks);
  if (!stats) return "Calculating...";

  const activeNode = (ctx.focusKey || ctx.hoverKey) ? ctx.nodes.find(n => n.pubkey === (ctx.focusKey || ctx.hoverKey)) : null;

  switch (ctx.tab) {
    case 'OVERVIEW': return assembleOverview(stats, activeNode, ctx.chartSection);
    case 'MARKET': return assembleMarket(stats, activeNode);
    case 'TOPOLOGY': return assembleTopology(stats, activeNode);
    default: return "Ready.";
  }
};
