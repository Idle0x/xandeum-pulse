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

// --- TUNING KNOBS (MAXIMUM TENACITY) ---
const TIMEOUT_RPC = 15000; // 15s Patience
const BACKGROUND_POLL_INTERVAL = 30000;
const CACHE_TTL = 10000;

// CIRCUIT BREAKER CONFIG
// We keep this for BACKUPS, but we will ignore it for the HERO.
const MAX_FAILURES = 10; 
const COOLDOWN_MS = 10000; 

// Optimised Axios Instance (Keep-Alive)
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

interface RpcNodeStatus {
  ip: string;
  isHero: boolean;
  isOnline: boolean;
  lastSeen: number;
  consecutiveFails: number;
  cooldownUntil: number; 
}

export class PublicSwarmOrchestrator {
  private hero: RpcNodeStatus;
  private backups: RpcNodeStatus[];
  private activeNode: RpcNodeStatus;

  private cachedData: any[] = [];
  private lastFetchTime: number = 0;

  private fetchPromise: Promise<any[]> | null = null;
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

  public async fetchNodes(): Promise<any[]> {
    // 1. Always try to switch back to Hero if it's not the active node
    // This ensures we don't get stuck on a backup if the Hero is actually fine.
    if (!this.activeNode.isHero) {
        // We don't await this, we just ensure the Hero object is ready to be tried next time
        this.hero.cooldownUntil = 0; 
    }

    if (Date.now() - this.lastFetchTime < CACHE_TTL && this.cachedData.length > 0) {
      return this.mergeWithPassiveDiscovery(this.cachedData);
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.executeFetchStrategy();

    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null; 
    }
  }

  private async executeFetchStrategy(): Promise<any[]> {
    // FORCE HERO: If the Active Node is the Hero, ignore cooldowns.
    // We ALWAYS try the Hero.
    if (this.activeNode.isHero) {
        this.activeNode.cooldownUntil = 0; // Force Reset
    } else if (this.isCoolingDown(this.activeNode)) {
        // Logic for Backups: If backup is banned, find another.
        console.warn(`[Orchestrator] Backup node ${this.activeNode.ip} is cooling down. Switching.`);
        return this.failoverFetch();
    }

    try {
      const data = await this.rpcCall(this.activeNode.ip);
      this.reportSuccess(this.activeNode);

      this.cachedData = data;
      this.lastFetchTime = Date.now();

      // If we successfully used a backup, try to promote Hero for next time immediately
      if (!this.activeNode.isHero) this.attemptHeroRecovery();

      return this.mergeWithPassiveDiscovery(data);

    } catch (e) {
      this.reportFailure(this.activeNode);
      // Hero failed? Instant failover for THIS request, but Hero stays ready for next.
      return this.failoverFetch();
    }
  }

  private async failoverFetch(): Promise<any[]> {
    const availableCandidates = this.backups.filter(n => !this.isCoolingDown(n));
    const candidates = availableCandidates.sort((a, b) => a.consecutiveFails - b.consecutiveFails);

    if (candidates.length === 0) {
      console.error("[Orchestrator] ALL BACKUPS EXHAUSTED OR COOLING DOWN.");
      return this.cachedData; 
    }

    for (const node of candidates) {
      try {
        console.log(`[Orchestrator] Failover Attempt: ${node.ip}`);
        const data = await this.rpcCall(node.ip);

        this.reportSuccess(node);
        this.activeNode = node; 

        this.cachedData = data;
        this.lastFetchTime = Date.now();

        // Check if Hero is back immediately
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
    if (node.isHero) return false; // HERO NEVER COOLS DOWN
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

    if (node.isHero) {
        // SPECIAL HERO LOGIC: Log warning, but DO NOT BAN.
        // We reset cooldown so it is eligible immediately for the next tick.
        console.warn(`[Orchestrator] Hero ${node.ip} failed. Will retry next tick (No Ban).`);
        node.cooldownUntil = 0; 
    } else {
        // Normal Backup Logic: Ban if too many failures
        if (node.consecutiveFails >= MAX_FAILURES) {
            node.cooldownUntil = Date.now() + COOLDOWN_MS;
            console.warn(`[Orchestrator] 🛑 CIRCUIT OPENED for Backup ${node.ip}. Banned for 10s.`);
        }
    }
  }

  private async attemptHeroRecovery() {
    // Always try. Hero is never cooling down.
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
    const res = await axios.post(`http://${ip}:6000/rpc`, payload, { 
        timeout: TIMEOUT_RPC,
        httpAgent,
        httpsAgent,
        headers: { 'User-Agent': 'XandeumPulse/1.0' } // Be polite to the RPC
    });
    return res.data?.result?.pods || [];
  }
}

export const publicOrchestrator = new PublicSwarmOrchestrator();
