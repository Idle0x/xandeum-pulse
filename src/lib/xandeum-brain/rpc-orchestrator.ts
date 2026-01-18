import axios from 'axios';
import pino from 'pino';

// --- CONFIGURATION ---
const HERO_PUBLIC_RPC = '173.212.203.145';
const BACKUP_RPCS = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 5000;
const ERROR_THRESHOLD = 3; 
const CIRCUIT_RESET_MS = 60000; 

// Logger setup
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

interface RpcStats {
  failureCount: number;
  lastFailureTime: number;
  lastLatency: number;
  isOpen: boolean; 
  successCount: number;
}

export class PublicRpcOrchestrator {
  private stats: Map<string, RpcStats> = new Map();
  private discoveryCache: Map<string, any> = new Map();

  constructor() {
    this.initStats();
    logger.info("Public RPC Orchestrator initialized (Global Singleton).");
  }

  private initStats() {
    [HERO_PUBLIC_RPC, ...BACKUP_RPCS].forEach(ip => {
      // Initialize with optimistic values so we don't block nodes on startup
      this.stats.set(ip, { 
        failureCount: 0, 
        lastFailureTime: 0, 
        lastLatency: 0, 
        isOpen: false,
        successCount: 0
      });
    });
  }

  /**
   * MAIN ENTRY POINT
   */
  async fetchPublicNodes(): Promise<any[]> {
    let resultNodes: any[] = [];

    // 1. Try Hero (Primary)
    if (this.isNodeHealthy(HERO_PUBLIC_RPC)) {
      try {
        resultNodes = await this.fetchFromNode(HERO_PUBLIC_RPC);
      } catch (e) {
        logger.warn(`Hero RPC ${HERO_PUBLIC_RPC} failed. Failover engaged.`);
      }
    }

    // 2. Failover logic
    if (resultNodes.length === 0) {
      resultNodes = await this.smartRaceBackups();
    }

    // 3. Trigger a non-blocking background refresh to keep stats alive
    // This runs AFTER the user gets their data, keeping the lambda 'warm' with new stats
    this.triggerBackgroundRefresh();

    return this.mergeDiscoveredNodes(resultNodes);
  }

  /**
   * SMART RACE LOGIC
   * Handles both "Cold Start" (no stats) and "Warm Start" (using stats)
   */
  private async smartRaceBackups(): Promise<any[]> {
    const healthyBackups = BACKUP_RPCS.filter(ip => this.isNodeHealthy(ip));
    
    // Check if we have actual latency data (Warm Start)
    const hasStats = healthyBackups.some(ip => (this.stats.get(ip)?.lastLatency || 0) > 0);

    let candidates: string[];

    if (hasStats) {
      // WARM START: Pick top 3 fastest
      candidates = healthyBackups.sort((a, b) => 
        (this.stats.get(a)?.lastLatency || 9999) - (this.stats.get(b)?.lastLatency || 9999)
      ).slice(0, 3);
    } else {
      // COLD START: Randomize and pick 5 to ensure we hit a working one
      // We pick more nodes (5) because we don't know who is good yet.
      candidates = healthyBackups.sort(() => 0.5 - Math.random()).slice(0, 5);
      logger.info("Cold start detected: Racing 5 random nodes.");
    }

    try {
      // Promise.any races them and resolves with the FIRST success
      return await Promise.any(candidates.map(ip => this.fetchFromNode(ip)));
    } catch (e) {
      logger.error("All selected backup candidates failed.");
      return [];
    }
  }

  private async fetchFromNode(ip: string): Promise<any[]> {
    const start = Date.now();
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
      if (Date.now() - stat.lastFailureTime > CIRCUIT_RESET_MS) {
        stat.isOpen = false;
        stat.failureCount = 0;
        return true; // Half-open state: allow one try
      }
      return false;
    }
    return true;
  }

  private updateStats(ip: string, isError: boolean, latency: number) {
    const stat = this.stats.get(ip);
    if (!stat) return;

    if (isError) {
      stat.failureCount++;
      stat.lastFailureTime = Date.now();
      if (stat.failureCount >= ERROR_THRESHOLD) {
        stat.isOpen = true;
      }
    } else {
      stat.failureCount = 0; // Reset failures on success
      stat.lastLatency = latency;
      stat.successCount++;
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

  // Fire and forget - helps keep stats updated for the NEXT user request
  private triggerBackgroundRefresh() {
    const randomNode = BACKUP_RPCS[Math.floor(Math.random() * BACKUP_RPCS.length)];
    // We don't await this. We let it run in the background context of the lambda.
    this.fetchFromNode(randomNode).then(nodes => {
        nodes.forEach(n => {
            const pk = n.pubkey || n.public_key;
            if (pk) this.discoveryCache.set(pk, n);
        });
    }).catch(() => {});
  }
}

/**
 * SINGLETON PATTERN FOR NEXT.JS
 * Prevents re-creating the class on every hot-reload or function invocation
 * if the container is still warm.
 */
const globalForSwarm = global as unknown as { swarmInstance: PublicRpcOrchestrator };

export const publicSwarm = globalForSwarm.swarmInstance || new PublicRpcOrchestrator();

if (process.env.NODE_ENV !== 'production') globalForSwarm.swarmInstance = publicSwarm;
