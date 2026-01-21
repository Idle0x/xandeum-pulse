// ... (Imports and Config remain the same)

// --- MAIN EXPORT ---

export async function getNetworkPulse(mode: 'fast' | 'swarm' = 'fast'): Promise<{ nodes: EnrichedNode[], stats: any }> {

  // ---------------------------------------------------------
  // PHASE 1: COLLECTION (Dual Hero + Orchestrator)
  // ---------------------------------------------------------

  const [rawPrivateNodes, operatorNode, rawPublicNodes, creditsData] = await Promise.all([
    fetchPrivateMainnetNodes(),      // Hero A (Private)
    fetchOperatorNode(),             // Operator Injection
    publicOrchestrator.fetchNodes(), // Hero B + Passive Discovery (Public)
    fetchCredits()
  ]);

  // Inject Operator
  if (operatorNode) {
    const exists = rawPrivateNodes.find((p: any) => p.pubkey === operatorNode.pubkey);
    if (!exists) rawPrivateNodes.unshift(operatorNode);
  }

  if (rawPrivateNodes.length === 0 && rawPublicNodes.length === 0) {
    return { nodes: [], stats: { consensusVersion: '0.0.0', totalNodes: 0, systemStatus: { rpc: false, credits: false }, avgBreakdown: { total: 0, uptime: 0, version: 0, reputation: 0, storage: 0 } } };
  }

  const isCreditsApiOnline = creditsData.mainnet.length > 0 || creditsData.devnet.length > 0;

  const mainnetCreditMap = new Map<string, number>();
  const devnetCreditMap = new Map<string, number>();
  const mainnetValues: number[] = [];
  const devnetValues: number[] = [];

  creditsData.mainnet.forEach((c: any) => {
    const val = parseFloat(c.credits || c.amount || '0');
    const key = c.pod_id || c.pubkey || c.node;
    if (key && !isNaN(val)) { mainnetCreditMap.set(key, val); mainnetValues.push(val); }
  });
  creditsData.devnet.forEach((c: any) => {
    const val = parseFloat(c.credits || c.amount || '0');
    const key = c.pod_id || c.pubkey || c.node;
    if (key && !isNaN(val)) { devnetCreditMap.set(key, val); devnetValues.push(val); }
  });

  const medianMainnet = mainnetValues.sort((a, b) => a - b)[Math.floor(mainnetValues.length / 2)] || 0;
  const medianDevnet = devnetValues.sort((a, b) => a - b)[Math.floor(devnetValues.length / 2)] || 0;

  // ---------------------------------------------------------
  // PHASE 2: FINGERPRINTING & DEDUPLICATION (Updated)
  // ---------------------------------------------------------

  const processedNodes: EnrichedNode[] = [];

  const getFingerprint = (p: any, assumedNetwork: 'MAINNET' | 'DEVNET') => {
    const key = p.pubkey || p.public_key;
    const rawCredVal = assumedNetwork === 'MAINNET' ? mainnetCreditMap.get(key) : devnetCreditMap.get(key);
    const credits = rawCredVal !== undefined ? rawCredVal : 'NULL';
    return `${key}|${p.address}|${p.storage_committed}|${p.storage_used}|${p.version}|${p.is_public}|${credits}`;
  };

  // Changed to Set since we no longer need to store/compare uptime values
  const mainnetFingerprints = new Set<string>();

  // A. PROCESS PRIVATE RPC (ANCHOR) -> ALWAYS MAINNET
  rawPrivateNodes.forEach((pod: any) => {
    const pubkey = pod.pubkey || pod.public_key;
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    const rawCreds = mainnetCreditMap.get(pubkey);
    let credits: number | null = null;
    let isUntracked = false;
    if (rawCreds !== undefined) { credits = rawCreds; }
    else if (isCreditsApiOnline) { isUntracked = true; }

    const uptimeVal = Number(pod.uptime) || 0;
    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: 'MAINNET', credits: credits, isUntracked: isUntracked,
      is_operator: pod.is_operator || false,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: uptimeVal,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    processedNodes.push(node);
    
    // Add strict fingerprint
    const fingerprint = getFingerprint(pod, 'MAINNET');
    mainnetFingerprints.add(fingerprint);
  });

  // B. PROCESS PUBLIC SWARM (Strict Subtraction)
  rawPublicNodes.forEach((pod: any) => {
    const potentialMainnetFingerprint = getFingerprint(pod, 'MAINNET');
    const publicUptime = Number(pod.uptime) || 0;

    // 1. Check if this node is a duplicate Mainnet node
    // STRICT CHECK: If fingerprint matches, it is a duplicate. No uptime tie-breaking.
    if (mainnetFingerprints.has(potentialMainnetFingerprint)) {
      return; // DUPLICATE DETECTED -> Skip. Trust Private RPC.
    }

    // 2. It is either Devnet OR a Mainnet node that Private RPC missed
    const pubkey = pod.pubkey || pod.public_key;
    const ip = pod.address.split(':')[0];
    const loc = geoCache.get(ip) || { lat: 0, lon: 0, country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

    let network: 'MAINNET' | 'DEVNET' = 'DEVNET';
    let credits: number | null = null;
    let isUntracked = false;

    const mainnetVal = mainnetCreditMap.get(pubkey);
    const devnetVal = devnetCreditMap.get(pubkey);

    if (mainnetVal !== undefined && devnetVal === undefined) {
      network = 'MAINNET';
      credits = mainnetVal;
    } else if (devnetVal !== undefined) {
      network = 'DEVNET';
      credits = devnetVal;
    } else {
      network = 'DEVNET';
      if (isCreditsApiOnline) { isUntracked = true; }
    }

    const node: EnrichedNode = {
      ...pod, pubkey: pubkey, network: network, credits: credits, isUntracked: isUntracked,
      storage_committed: Number(pod.storage_committed) || 0,
      storage_used: Number(pod.storage_used) || 0,
      uptime: publicUptime,
      health: 0, healthBreakdown: { uptime: 0, version: 0, reputation: 0, storage: 0 },
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city }
    };
    processedNodes.push(node);
  });

  // ---------------------------------------------------------
  // PHASE 3: SCORING & STATS (UNCHANGED)
  // ---------------------------------------------------------
  
  // ... (Rest of logic remains identical)
  
  const rawVersionCounts: Record<string, number> = {};
  const uniqueCleanVersionsSet = new Set<string>();

  processedNodes.forEach(p => {
    const rawV = (p.version || '0.0.0');
    const cleanV = cleanSemver(rawV);
    rawVersionCounts[rawV] = (rawVersionCounts[rawV] || 0) + 1;
    uniqueCleanVersionsSet.add(cleanV);
  });

  const consensusVersion = Object.keys(rawVersionCounts).sort((a, b) => rawVersionCounts[b] - rawVersionCounts[a])[0] || '0.0.0';
  const sortedCleanVersions = Array.from(uniqueCleanVersionsSet).sort((a, b) => compareVersions(b, a));

  const storageArray = processedNodes.map(p => p.storage_committed).sort((a, b) => a - b);
  const medianStorage = storageArray.length ? storageArray[Math.floor(storageArray.length / 2)] : 1;

  await resolveLocations([...new Set(processedNodes.map(p => p.address.split(':')[0]))]);

  const finalNodes = processedNodes.map(node => {
    const ip = node.address.split(':')[0];
    const loc = geoCache.get(ip) || node.location;
    const medianCreditsForScore = node.network === 'MAINNET' ? medianMainnet : medianDevnet;

    const vitality = calculateVitalityScore(
      node.storage_committed, node.storage_used, node.uptime,
      node.version, consensusVersion, sortedCleanVersions,
      medianCreditsForScore, node.credits, medianStorage, isCreditsApiOnline
    );

    return {
      ...node,
      location: { lat: loc.lat, lon: loc.lon, countryName: (loc as any).country || (loc as any).countryName || 'Unknown', countryCode: loc.countryCode, city: loc.city },
      health: vitality.total,
      healthBreakdown: vitality.breakdown
    };
  });

  const mainnetList = finalNodes.filter(n => n.network === 'MAINNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const devnetList = finalNodes.filter(n => n.network === 'DEVNET').sort((a, b) => (b.credits || 0) - (a.credits || 0));

  const assignRank = (list: EnrichedNode[]) => {
    let r = 1;
    list.forEach((n, i) => {
      if (i > 0 && (n.credits || 0) < (list[i-1].credits || 0)) r = i + 1;
      n.rank = r;
    });
  };
  assignRank(mainnetList);
  assignRank(devnetList);

  const allSorted = [...mainnetList, ...devnetList];
  allSorted.sort((a, b) => b.health - a.health);
  let hr = 1;
  allSorted.forEach((n, i) => {
    if (i > 0 && n.health < allSorted[i-1].health) hr = i + 1;
    n.health_rank = hr;
  });

  let totalUptime = 0, totalVersion = 0, totalReputation = 0, reputationCount = 0, totalStorage = 0;
  allSorted.forEach(node => {
    totalUptime += node.healthBreakdown.uptime;
    totalVersion += node.healthBreakdown.version;
    totalStorage += node.healthBreakdown.storage;
    if (node.healthBreakdown.reputation !== null) { totalReputation += node.healthBreakdown.reputation; reputationCount++; }
  });

  const nodeCount = allSorted.length || 1;
  const avgHealth = Math.round(allSorted.reduce((a, b) => a + b.health, 0) / nodeCount);

  return {
    nodes: allSorted,
    stats: {
      consensusVersion,
      medianCredits: medianMainnet,
      medianStorage,
      totalNodes: allSorted.length,
      systemStatus: { credits: isCreditsApiOnline, rpc: true },
      avgBreakdown: {
        total: avgHealth,
        uptime: Math.round(totalUptime / nodeCount),
        version: Math.round(totalVersion / nodeCount),
        reputation: reputationCount > 0 ? Math.round(totalReputation / reputationCount) : null,
        storage: Math.round(totalStorage / nodeCount)
      }
    }
  };
}
