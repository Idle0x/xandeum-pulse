import axios from 'axios';

// --- CONFIGURATION ---
const PUBLIC_HERO_IP = '173.212.203.145';
const BACKUP_NODES = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 8000;
const BACKGROUND_POLL_INTERVAL = 30000; // 30 seconds
const CACHE_TTL = 10000; // 10 seconds validity for cache

interface RpcNodeStatus {
  ip: string;
  isHero: boolean;
  isOnline: boolean;
  lastSeen: number;
  consecutiveFails: number;
}

export class PublicSwarmOrchestrator {
  private hero: RpcNodeStatus;
  private backups: RpcNodeStatus[];
  private activeNode: RpcNodeStatus; // The node we are currently routing traffic to
  
  // Cache to store the latest raw pods list
  private cachedData: any[] = [];
  private lastFetchTime: number = 0;
  
  // Storage for nodes found by backups (Passive Discovery)
  private passiveDiscoveryCache: Map<string, any> = new Map();

  constructor() {
    this.hero = { ip: PUBLIC_HERO_IP, isHero: true, isOnline: true, lastSeen: 0, consecutiveFails: 0 };
    this.backups = BACKUP_NODES.map(ip => ({ ip, isHero: false, isOnline: true, lastSeen: 0, consecutiveFails: 0 }));
    this.activeNode = this.hero;

    // Start the background silent discovery
    if (typeof window === 'undefined') { // Only run on server side
      this.startPassiveDiscovery();
    }
  }

  /**
   * Main entry point to get Public Swarm nodes.
   * Logic: Try Hero -> If Fail, Try Active Backup -> If Success, keep backup but ping Hero.
   */
  async fetchNodes(): Promise<any[]> {
    // 1. Return cache if fresh
    if (Date.now() - this.lastFetchTime < CACHE_TTL && this.cachedData.length > 0) {
      return this.mergeWithPassiveDiscovery(this.cachedData);
    }

    // 2. Attempt fetch from Active Node (Hero prefers)
    try {
      const data = await this.rpcCall(this.activeNode.ip);
      
      // Success! Update stats
      this.activeNode.isOnline = true;
      this.activeNode.consecutiveFails = 0;
      this.activeNode.lastSeen = Date.now();
      
      // If we are currently on a backup, check if Hero is back online
      if (!this.activeNode.isHero) {
        this.attemptHeroRecovery();
      }

      this.cachedData = data;
      this.lastFetchTime = Date.now();
      
      return this.mergeWithPassiveDiscovery(data);

    } catch (e) {
      // Failure!
      this.activeNode.isOnline = false;
      this.activeNode.consecutiveFails++;
      console.warn(`[Orchestrator] Active node ${this.activeNode.ip} failed.`);

      // If Hero failed, switch to a backup immediately
      if (this.activeNode.isHero) {
        console.warn(`[Orchestrator] HERO DOWN. Switching to Failover.`);
        return this.failoverFetch();
      } else {
        // If a backup failed, try another backup
        return this.failoverFetch();
      }
    }
  }

  /**
   * Recursively try backups until one works
   */
  private async failoverFetch(): Promise<any[]> {
    // Sort backups by least failures
    const candidates = this.backups.sort((a, b) => a.consecutiveFails - b.consecutiveFails);

    for (const node of candidates) {
      try {
        console.log(`[Orchestrator] Attempting Failover: ${node.ip}`);
        const data = await this.rpcCall(node.ip);
        
        // Success - Set this as the new Active Node (temporary)
        this.activeNode = node;
        node.isOnline = true;
        node.consecutiveFails = 0;
        
        this.cachedData = data;
        this.lastFetchTime = Date.now();

        // Start checking for Hero recovery in background
        this.attemptHeroRecovery(); 

        return this.mergeWithPassiveDiscovery(data);
      } catch (e) {
        node.consecutiveFails++;
      }
    }
    
    // If all fail, return stale cache (Better than crash)
    console.error("[Orchestrator] ALL PUBLIC RPCS FAILED.");
    return this.cachedData; 
  }

  /**
   * Silently pings the Hero. If it works, switch activeNode back to Hero.
   */
  private async attemptHeroRecovery() {
    try {
      await this.rpcCall(this.hero.ip);
      console.log(`[Orchestrator] HERO RECOVERED. Switching back to ${this.hero.ip}`);
      this.activeNode = this.hero;
      this.hero.consecutiveFails = 0;
      this.hero.isOnline = true;
    } catch (e) {
      // Hero still down, stay on backup
    }
  }

  /**
   * Background Process:
   * Randomly polls backup nodes to find "hidden" nodes that the Hero might miss.
   * Does NOT affect the main connection flow.
   */
  private startPassiveDiscovery() {
    setInterval(async () => {
      // Pick 2 random backups
      const randomBackups = this.backups.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      for (const node of randomBackups) {
        try {
          const pods = await this.rpcCall(node.ip);
          pods.forEach((pod: any) => {
            const pubkey = pod.pubkey || pod.public_key;
            // If this is a new pod we haven't seen in the main list, cache it
            if (pubkey && !this.cachedData.find(p => (p.pubkey || p.public_key) === pubkey)) {
               this.passiveDiscoveryCache.set(pubkey, pod);
            }
          });
        } catch (e) { /* Ignore background errors */ }
      }
      
      // Clean up old passive nodes (optional logic could go here)
    }, BACKGROUND_POLL_INTERVAL);
  }

  /**
   * Merges the official Hero list with any unique nodes found by backups
   */
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
    const res = await axios.post(`http://${ip}:6000/rpc`, payload, { timeout: TIMEOUT_RPC });
    return res.data?.result?.pods || [];
  }
}

// Singleton Export
export const publicOrchestrator = new PublicSwarmOrchestrator();
