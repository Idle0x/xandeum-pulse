import axios from 'axios';
import http from 'http';
import https from 'https';

// --- CONFIGURATION ---
const PUBLIC_HERO_IP = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

// 15 Seconds: We give the Hero plenty of time to reply.
const TIMEOUT_RPC = 15000; 
const BACKGROUND_POLL_INTERVAL = 30000;
const CACHE_TTL = 10000;

// Optimised Axios for Keep-Alive (Faster repeated connections)
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

interface RpcNodeStatus {
  ip: string;
  isHero: boolean;
  consecutiveFails: number;
}

export class PublicSwarmOrchestrator {
  private hero: RpcNodeStatus;
  private backups: RpcNodeStatus[];
  private activeNode: RpcNodeStatus;

  private cachedData: any[] = [];
  private lastFetchTime: number = 0;

  // Request Deduplication
  private fetchPromise: Promise<any[]> | null = null;
  private passiveDiscoveryCache: Map<string, any> = new Map();

  constructor() {
    this.hero = { ip: PUBLIC_HERO_IP, isHero: true, consecutiveFails: 0 };
    this.backups = BACKUP_NODES.map(ip => ({ ip, isHero: false, consecutiveFails: 0 }));
    this.activeNode = this.hero;

    if (typeof window === 'undefined') {
      this.startPassiveDiscovery();
    }
  }

  public async fetchNodes(): Promise<any[]> {
    // 1. Serve Cache if fresh (Speed)
    if (Date.now() - this.lastFetchTime < CACHE_TTL && this.cachedData.length > 0) {
      return this.mergeWithPassiveDiscovery(this.cachedData);
    }

    // 2. Request Deduplication (Stability)
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = this.executeFetchStrategy();
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async executeFetchStrategy(): Promise<any[]> {
    // STRATEGY: "Obsessive Hero"
    // We try the Active Node. If it works, great.
    // If the Active Node is NOT the Hero, we ping the Hero immediately after.

    try {
      const data = await this.rpcCall(this.activeNode.ip);
      
      // Success!
      this.activeNode.consecutiveFails = 0;
      this.cachedData = data;
      this.lastFetchTime = Date.now();

      // OBSESSION: If we are using a backup, check if Hero is back.
      if (!this.activeNode.isHero) {
         this.attemptHeroRecovery();
      }

      return this.mergeWithPassiveDiscovery(data);

    } catch (e) {
      // Failure!
      this.activeNode.consecutiveFails++;
      console.warn(`[Orchestrator] Active node ${this.activeNode.ip} failed.`);
      
      // Immediate Failover
      return this.failoverFetch();
    }
  }

  private async failoverFetch(): Promise<any[]> {
    // Sort backups by least failures (find the healthiest one)
    const candidates = this.backups.sort((a, b) => a.consecutiveFails - b.consecutiveFails);

    for (const node of candidates) {
      try {
        console.log(`[Orchestrator] Failover Attempt: ${node.ip}`);
        const data = await this.rpcCall(node.ip);

        // Success - Make this the temporary Active Node
        this.activeNode = node;
        node.consecutiveFails = 0;

        this.cachedData = data;
        this.lastFetchTime = Date.now();

        // OBSESSION: Check Hero immediately
        this.attemptHeroRecovery(); 

        return this.mergeWithPassiveDiscovery(data);
      } catch (e) {
        node.consecutiveFails++;
      }
    }

    console.error("[Orchestrator] ALL PUBLIC RPCS FAILED. Serving Stale Cache.");
    return this.cachedData;
  }

  private async attemptHeroRecovery() {
    // We silently try the Hero.
    try {
      await this.rpcCall(this.hero.ip);
      // It worked! Switch back instantly.
      console.log(`[Orchestrator] HERO RECOVERED. Switching back to ${this.hero.ip}`);
      this.activeNode = this.hero;
      this.hero.consecutiveFails = 0;
    } catch (e) {
      // Hero still sleeping. We'll try again next time.
    }
  }

  private async rpcCall(ip: string): Promise<any[]> {
    const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
    const res = await axios.post(`http://${ip}:6000/rpc`, payload, { 
        timeout: TIMEOUT_RPC,
        httpAgent,
        httpsAgent 
    });
    return res.data?.result?.pods || [];
  }

  // Background Discovery (Unchanged)
  private startPassiveDiscovery() {
    setInterval(async () => {
      const randomBackups = this.backups.sort(() => 0.5 - Math.random()).slice(0, 2);
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
      if (!heroKeys.has(key)) combined.push(pod);
    });
    return combined;
  }
}

export const publicOrchestrator = new PublicSwarmOrchestrator();
