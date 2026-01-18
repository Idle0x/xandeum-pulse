import axios from 'axios';
import pino from 'pino';

// Setup pretty logging for development
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// --- CONFIGURATION ---
const HERO_PUBLIC_RPC = '173.212.203.145';
const BACKUP_RPCS = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 5000;
const BACKGROUND_REFRESH_RATE = 30000; 
const ERROR_THRESHOLD = 3; // Circuit breaker: trip after 3 fails
const CIRCUIT_RESET_MS = 60000; // Wait 1 minute before retrying a dead node

interface RpcStats {
  failureCount: number;
  lastFailureTime: number;
  lastLatency: number;
  isOpen: boolean; // Is the circuit breaker open (dead)?
}

export class PublicRpcOrchestrator {
  private cache: { pods: any[]; timestamp: number } | null = null;
  private discoveryCache: Map<string, any> = new Map();
  private stats: Map<string, RpcStats> = new Map();
  private activeInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initStats();
    this.startBackgroundDiscovery();
    logger.info("Public RPC Orchestrator initialized with Circuit Breaker.");
  }

  private initStats() {
    [HERO_PUBLIC_RPC, ...BACKUP_RPCS].forEach(ip => {
      this.stats.set(ip, { failureCount: 0, lastFailureTime: 0, lastLatency: 0, isOpen: false });
    });
  }

  /**
   * MAIN FETCH LOGIC
   */
  async fetchPublicNodes(): Promise<any[]> {
    let resultNodes: any[] = [];

    // 1. Check if Hero is healthy
    if (this.isNodeHealthy(HERO_PUBLIC_RPC)) {
      try {
        resultNodes = await this.fetchFromNode(HERO_PUBLIC_RPC);
        this.cache = { pods: resultNodes, timestamp: Date.now() };
      } catch (e) {
        logger.warn(`Hero RPC ${HERO_PUBLIC_RPC} failed. Tripping circuit.`);
      }
    }

    // 2. Failover if Hero failed or was already "Open"
    if (resultNodes.length === 0) {
      resultNodes = await this.raceBackups();
    }

    // 3. Last Resort: Cache
    if (resultNodes.length === 0 && this.cache) {
      logger.error("All Public RPCs failed. Serving stale cache.");
      resultNodes = this.cache.pods;
    }

    // 4. Merge background discovered nodes
    return this.mergeDiscoveredNodes(resultNodes);
  }

  /**
   * CIRCUIT BREAKER & NETWORK LOGIC
   */
  private async fetchFromNode(ip: string): Promise<any[]> {
    const start = Date.now();
    const stat = this.stats.get(ip)!;

    try {
      const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
      const res = await axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC });
      
      const latency = Date.now() - start;
      this.updateStats(ip, false, latency);
      
      return res.data?.result?.pods || [];
    } catch (e) {
      this.updateStats(ip, true, -1);
      throw e;
    }
  }

  private isNodeHealthy(ip: string): boolean {
    const stat = this.stats.get(ip);
    if (!stat) return false;
    
    if (stat.isOpen) {
      // Check if it's time to reset the circuit
      if (Date.now() - stat.lastFailureTime > CIRCUIT_RESET_MS) {
        stat.isOpen = false;
        stat.failureCount = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  private updateStats(ip: string, isError: boolean, latency: number) {
    const stat = this.stats.get(ip)!;
    if (isError) {
      stat.failureCount++;
      stat.lastFailureTime = Date.now();
      if (stat.failureCount >= ERROR_THRESHOLD) {
        stat.isOpen = true;
        logger.error(`Circuit OPEN for ${ip}. Node suspended.`);
      }
    } else {
      stat.failureCount = 0;
      stat.lastLatency = latency;
    }
  }

  private async raceBackups(): Promise<any[]> {
    const healthyBackups = BACKUP_RPCS.filter(ip => this.isNodeHealthy(ip));
    // Try the 3 fastest (or random if no latency data)
    const candidates = healthyBackups.sort((a, b) => 
      (this.stats.get(a)?.lastLatency || 999) - (this.stats.get(b)?.lastLatency || 999)
    ).slice(0, 3);

    try {
      return await Promise.any(candidates.map(ip => this.fetchFromNode(ip)));
    } catch (e) {
      return [];
    }
  }

  private mergeDiscoveredNodes(baseNodes: any[]): any[] {
    const pubkeys = new Set(baseNodes.map(n => n.pubkey || n.public_key));
    const merged = [...baseNodes];
    
    this.discoveryCache.forEach((node) => {
      const pk = node.pubkey || node.public_key;
      if (!pubkeys.has(pk)) merged.push(node);
    });
    
    return merged;
  }

  /**
   * BACKGROUND DISCOVERY
   */
  private startBackgroundDiscovery() {
    this.activeInterval = setInterval(async () => {
      // Pick one backup node that isn't currently blocked
      const pool = BACKUP_RPCS.filter(ip => this.isNodeHealthy(ip));
      if (pool.length === 0) return;

      const target = pool[Math.floor(Math.random() * pool.length)];
      try {
        const nodes = await this.fetchFromNode(target);
        nodes.forEach(n => {
          const pk = n.pubkey || n.public_key;
          if (pk) this.discoveryCache.set(pk, n);
        });
        logger.debug({ target, nodesFound: nodes.length }, "Background discovery sync complete.");
      } catch (e) {
        // Silent fail for background tasks
      }
    }, BACKGROUND_REFRESH_RATE);
  }

  /**
   * GRACEFUL SHUTDOWN
   */
  public shutdown() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      logger.info("Background intervals cleared.");
    }
  }

  public getTelemetry() {
    return Object.fromEntries(this.stats);
  }
}

// Export singleton
export const publicSwarm = new PublicRpcOrchestrator();

if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => publicSwarm.shutdown());
  process.on('SIGINT', () => publicSwarm.shutdown());
}