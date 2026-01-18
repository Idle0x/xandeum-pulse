import axios from 'axios';
import pino from 'pino';
import http from 'http';

// --- CONFIGURATION ---
const HERO_PUBLIC_RPC = '173.212.203.145';
const BACKUP_RPCS = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 8000;

/**
 * FIXED LOGGER: 
 * Vercel cannot handle pino-pretty in production.
 */
const logger = pino({
  level: 'info',
  // Only use pretty printing in development
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } } 
    : undefined
});

const httpAgent = new http.Agent({ family: 4 });

export class PublicRpcOrchestrator {
  constructor() {
    logger.info("Orchestrator initialized (Production Safe Logging)");
  }

  async fetchPublicNodes(): Promise<any[]> {
    // 1. Priority: Hero RPC
    try {
      const heroData = await this.fetchFromNode(HERO_PUBLIC_RPC);
      if (heroData.length > 0) return heroData;
    } catch (e) {
      logger.warn(`Hero RPC failed: ${HERO_PUBLIC_RPC}`);
    }

    // 2. Swarm Race: Fire all requests at once, take the first to finish
    try {
      logger.info("Racing all backup RPCs...");
      const winner = await Promise.any(
        BACKUP_RPCS.map(ip => this.fetchFromNode(ip))
      );
      return winner;
    } catch (aggregateError) {
      logger.error("All RPCs in swarm failed or timed out.");
      return [];
    }
  }

  private async fetchFromNode(ip: string): Promise<any[]> {
    const url = `http://${ip}:6000/rpc`;
    try {
      const res = await axios.post(
        url,
        { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 },
        { 
          timeout: TIMEOUT_RPC,
          httpAgent: httpAgent // Force IPv4 to prevent connection resets
        }
      );

      const pods = res.data?.result?.pods;
      if (Array.isArray(pods) && pods.length > 0) {
        return pods;
      }
      throw new Error("No data");
    } catch (err: any) {
      // Log failure for debugging in Vercel console
      logger.debug(`Node ${ip} failed: ${err.message}`);
      throw err; 
    }
  }
}

// Global Singleton for Next.js to prevent memory leaks/multiple instances
const globalForSwarm = global as unknown as { swarmInstance: PublicRpcOrchestrator };
export const publicSwarm = globalForSwarm.swarmInstance || new PublicRpcOrchestrator();
if (process.env.NODE_ENV !== 'production') globalForSwarm.swarmInstance = publicSwarm;
