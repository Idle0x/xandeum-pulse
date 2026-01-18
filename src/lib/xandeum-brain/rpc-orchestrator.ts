import axios from 'axios';
import pino from 'pino';
import http from 'http';
import https from 'https';

// --- CONFIGURATION ---
const HERO_PUBLIC_RPC = '173.212.203.145';
const BACKUP_RPCS = [
  '161.97.97.41', '192.190.136.36', '192.190.136.38',
  '207.244.255.1', '192.190.136.28', '192.190.136.29', 
  '159.195.4.138', '152.53.155.30'
];

const TIMEOUT_RPC = 8000;

const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

// Force IPv4 agents to prevent dual-stack DNS delays/errors
const httpAgent = new http.Agent({ family: 4 });
const httpsAgent = new https.Agent({ family: 4 });

export class PublicRpcOrchestrator {
  
  constructor() {
    logger.info("Public RPC Orchestrator initialized.");
  }

  /**
   * MAIN ENTRY POINT
   */
  async fetchPublicNodes(): Promise<any[]> {
    let resultNodes: any[] = [];

    // 1. Try Hero
    try {
      logger.info(`Attempting Hero RPC: ${HERO_PUBLIC_RPC}`);
      resultNodes = await this.fetchFromNode(HERO_PUBLIC_RPC);
      if (resultNodes.length > 0) return resultNodes;
    } catch (e: any) {
      logger.warn(`Hero RPC failed: ${e.message}`);
    }

    // 2. Try Swarm (Race)
    try {
        logger.info("Engaging Swarm Race...");
        resultNodes = await this.raceSwarm();
        if (resultNodes.length > 0) return resultNodes;
    } catch (e: any) {
        logger.error(`Swarm Race Critical Failure: ${e.message}`);
    }

    // 3. LAST STAND: Linear Fallback
    // If racing failed instantly (network issues), try one by one slowly.
    logger.warn("Racing failed. Attempting Linear Fallback (One-by-One).");
    for (const ip of BACKUP_RPCS) {
        try {
            resultNodes = await this.fetchFromNode(ip);
            if (resultNodes.length > 0) {
                logger.info(`Linear fallback saved us on IP: ${ip}`);
                return resultNodes;
            }
        } catch (e) {
            continue; 
        }
    }

    return [];
  }

  /**
   * RACE LOGIC (Simplified & Robust)
   */
  private async raceSwarm(): Promise<any[]> {
    // Shuffle to avoid hitting the same bad node first every time
    const candidates = [...BACKUP_RPCS].sort(() => 0.5 - Math.random());

    // Map promises but capturing individual errors
    const promises = candidates.map(async (ip) => {
        try {
            return await this.fetchFromNode(ip);
        } catch (err: any) {
            // Throwing here is required for Promise.any to count it as a failure
            throw new Error(`${ip}: ${err.message}`);
        }
    });

    try {
      // Wait for the FIRST success
      const winner = await Promise.any(promises);
      return winner;
    } catch (aggregateError: any) {
        // Log all errors to see WHY it failed instantly
        if (aggregateError.errors) {
            aggregateError.errors.forEach((e: Error) => logger.warn(e.message));
        }
        throw new Error("All Swarm nodes rejected.");
    }
  }

  private async fetchFromNode(ip: string): Promise<any[]> {
    try {
      const payload = { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 };
      
      // Explicitly set httpAgent to force IPv4
      const res = await axios.post(`http://${ip}:6000/rpc`, payload, { 
          timeout: TIMEOUT_RPC,
          httpAgent: httpAgent,
          httpsAgent: httpsAgent
      });
      
      const pods = res.data?.result?.pods;
      if (Array.isArray(pods) && pods.length > 0) {
          return pods;
      }
      throw new Error("Empty/Invalid Data");
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}

// Global Singleton for Next.js
const globalForSwarm = global as unknown as { swarmInstance: PublicRpcOrchestrator };
export const publicSwarm = globalForSwarm.swarmInstance || new PublicRpcOrchestrator();
if (process.env.NODE_ENV !== 'production') globalForSwarm.swarmInstance = publicSwarm;
