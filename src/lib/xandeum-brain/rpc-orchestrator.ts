import axios from 'axios';

// --- CONFIGURATION ---
const PUBLIC_HERO_IP = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 5000; // Reduced to 5s for faster failover
const BACKGROUND_POLL_INTERVAL = 30000;
const CACHE_TTL = 10000;

// CIRCUIT BREAKER CONFIG
const MAX_FAILURES = 3; // Trip after 3 fails
const COOLDOWN_MS = 60000; // Ban for 60s

interface RpcNodeStatus {
  ip: string;
  isHero: boolean;
  isOnline: boolean;
  lastSeen: number;
  consecutiveFails: number;
  cooldownUntil: number; // [NEW] Timestamp until this node is allowed to be called again
}

export class PublicSwarmOrchestrator {
  private hero: RpcNodeStatus;
  private backups: RpcNodeStatus[];
  private activeNode: RpcNodeStatus;

  private cachedData: any[] = [];
  private lastFetchTime: number = 0;
  
  // [NEW] Request Deduplication Lock
  private fetchPromise: Promise<any[]> | null = null;

  // Storage for nodes found by backups (Passive Discovery)
  // Note: Will be upgraded to LRU in Batch 3
  private passiveDiscoveryCache: Map<string, any> = new Map();

  constructor() {
    this.hero = this.createNodeStatus(PUBLIC_HERO_IP, true);
    this.backups = BACKUP_NODES.map(ip => this.createNodeStatus(ip, false));
    this.activeNode = this.hero;

    if (typeof window === 'undefined') {
      this.startPassiveDiscovery();
    }
  }

  private createNodeStatus(ip: string, isHero: boolean): RpcNodeStatus {
    return { ip, isHero, isOnline: true, lastSeen: 0, consecutiveFails: 0, cooldownUntil: 0 };
  }

  /**
   * Main entry point.
   * Includes Request Deduplication to prevent "Thundering Herd".
   */
  public async fetchNodes(): Promise<any[]> {
    // 1. Return fresh cache immediately
    if (Date.now() - this.lastFetchTime < CACHE_TTL && this.cachedData.length > 0) {
      return this.mergeWithPassiveDiscovery(this.cachedData);
    }

    // 2. If a fetch is already running, wait for it (Deduplication)
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // 3. Start new fetch
    this.fetchPromise = this.executeFetchStrategy();
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null; // Release lock
    }
  }

  /**
   * The Strategy: Active Node -> Failover -> Cache Fallback
   */
  private async executeFetchStrategy(): Promise<any[]> {
    // Check if Active Node is in cooldown (Circuit Breaker)
    if (this.isCoolingDown(this.activeNode)) {
      console.warn(`[Orchestrator] Active node ${this.activeNode.ip} is cooling down. Forcing failover.`);
      return this.failoverFetch();
    }

    try {
      const data = await this.rpcCall(this.activeNode.ip);
      this.reportSuccess(this.activeNode);
      
      this.cachedData = data;
      this.lastFetchTime = Date.now();

      // If we are on a backup, try to go back to Hero
      if (!this.activeNode.isHero) this.attemptHeroRecovery();

      return this.mergeWithPassiveDiscovery(data);

    } catch (e) {
      this.reportFailure(this.activeNode);
      console.warn(`[Orchestrator] Active node ${this.activeNode.ip} failed.`);
      return this.failoverFetch();
    }
  }

  /**
   * Smart Failover: Only tries nodes that are NOT in cooldown.
   */
  private async failoverFetch(): Promise<any[]> {
    // 1. Filter out nodes that are cooling down
    const availableCandidates = this.backups.filter(n => !this.isCoolingDown(n));
    
    // 2. Sort by least failures to find the healthiest backup
    const candidates = availableCandidates.sort((a, b) => a.consecutiveFails - b.consecutiveFails);

    if (candidates.length === 0) {
      console.error("[Orchestrator] ALL BACKUPS EXHAUSTED OR COOLING DOWN.");
      return this.cachedData; // Absolute fallback
    }

    for (const node of candidates) {
      try {
        console.log(`[Orchestrator] Failover Attempt: ${node.ip}`);
        const data = await this.rpcCall(node.ip);

        // Success!
        this.reportSuccess(node);
        this.activeNode = node; // Promote to Active
        
        this.cachedData = data;
        this.lastFetchTime = Date.now();

        this.attemptHeroRecovery(); 
        return this.mergeWithPassiveDiscovery(data);

      } catch (e) {
        this.reportFailure(node);
      }
    }

    console.error("[Orchestrator] FAILOVER SEQUENCE FAILED.");
    return this.cachedData;
  }

  // --- HELPERS ---

  private isCoolingDown(node: RpcNodeStatus): boolean {
    if (node.cooldownUntil > Date.now()) return true;
    return false;
  }

  private reportSuccess(node: RpcNodeStatus) {
    node.isOnline = true;
    node.consecutiveFails = 0;
    node.cooldownUntil = 0;
    node.lastSeen = Date.now();
  }

  private reportFailure(node: RpcNodeStatus) {
    node.isOnline = false;
    node.consecutiveFails++;
    
    // TRIP THE CIRCUIT BREAKER
    if (node.consecutiveFails >= MAX_FAILURES) {
      node.cooldownUntil = Date.now() + COOLDOWN_MS;
      console.warn(`[Orchestrator] 🛑 CIRCUIT OPENED for ${node.ip}. Banned for 60s.`);
    }
  }

  private async attemptHeroRecovery() {
    if (this.isCoolingDown(this.hero)) return; // Don't bother if Hero is banned

    try {
      await this.rpcCall(this.hero.ip);
      console.log(`[Orchestrator] HERO RECOVERED. Switching back to ${this.hero.ip}`);
      this.activeNode = this.hero;
      this.reportSuccess(this.hero);
    } catch (e) {
      this.reportFailure(this.hero);
    }
  }

  private startPassiveDiscovery() {
    setInterval(async () => {
      // Only pick backups that are NOT cooling down
      const validBackups = this.backups.filter(n => !this.isCoolingDown(n));
      const randomBackups = validBackups.sort(() => 0.5 - Math.random()).slice(0, 2);

      for (const node of randomBackups) {
        try {
          const pods = await this.rpcCall(node.ip);
          pods.forEach((pod: any) => {
            const pubkey = pod.pubkey || pod.public_key;
            if (pubkey && !this.cachedData.find(p => (p.pubkey || p.public_key) === pubkey)) {
               this.passiveDiscoveryCache.set(pubkey, pod);
            }
          });
        } catch (e) { /* Ignore */ }
      }
    }, BACKGROUND_POLL_INTERVAL);
  }

  private mergeWithPassiveDiscovery(heroData: any[]): any[] {
    const combined = [...heroData];
    const heroKeys = new Set(heroData.map(p => p.pubkey || p.public_key));

    this.passiveDiscoveryCache.forEach((pod, key) => {
      if (!heroKeys.has(key)) {
        combined.push(pod);
      }
    });
    return combined;
  }

  private async rpcCall(ip: string): Promise<any[]> {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    // Short timeout (5s) to fail fast
    const res = await axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC });
    return res.data?.result?.pods || [];
  }
}

export const publicOrchestrator = new PublicSwarmOrchestrator();