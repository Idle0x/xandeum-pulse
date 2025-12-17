# Xandeum Pulse

> Real-time pNode Monitor & Network Dashboard for the Xandeum Gossip Protocol.
> 
Live Demo: https://xandeum-pulse.vercel.app

## Overview

Xandeum Pulse is a serverless analytics dashboard designed to monitor the health, storage consensus, and stability of the Xandeum network. It connects directly to pNodes via pRPC to fetch live stats without relying on centralized indexers or databases.

The platform focuses on operator utility, providing real-time storage metrics, uptime tracking, and network reputation rankings.

## Key Features

 * Direct pRPC Integration: Fetches live data using the get-pods-with-stats method via a resilient proxy.
 * Failover Architecture: Implements a "Hero Node" priority system with a backup race condition to ensure high availability.
 * Network Analytics: Real-time calculation of Total Storage Committed, Network Stability, and Consensus Version.
 * Operator Tools:
   * Smart Watchlist: Local persistence for tracking specific nodes.
   * Deep Inspection: View raw JSON data, precise timestamps, and RPC endpoints.
   * Status Reporting: One-click generation of formatted status reports for community sharing.
 * Reputation Leaderboard: Global ranking based on network credits with Olympic-style tie handling.
 * Responsive Interface: Adaptive grid layout optimized for mobile and desktop viewing.

## Architecture & Data Logic

### Failover API System

To ensure reliability during network instability, the backend (/api/stats) utilizes a hybrid failover strategy:

 * Primary Attempt: Requests data from a known high-performance "Hero Node" (173.212.203.145).
 * Backup Race: If the primary fails or times out (4s), the system simultaneously queries 3 random seed nodes.
 * Resolution: The first successful response is returned to the client (Promise.any).

### Derived Metrics

The following metrics are computed client-side to provide actionable insights:

 * Health Score: A heuristic based on uptime, version consensus (vs. majority), visibility, and storage utilization.
 * Network Stability: The percentage of nodes with >24h uptime.
 * Consensus Version: The software version currently running on the majority of the network.

## API Documentation

### 1. Network Stats

Endpoint: GET /api/stats

Source: Direct pRPC (get-pods-with-stats)

Returns a list of all active pNodes in the gossip protocol.

```json
{
  "result": {
    "pods": [
      {
        "address": "173.212.203.145:9001",
        "pubkey": "8x...",
        "version": "0.8.0",
        "uptime": 86400,
        "storage_used": 1048576,
        "storage_committed": 1099511627776,
        "is_public": true
      }
    ]
  }
}
```

### 2. Reputation Credits

Endpoint: GET /api/credits

Source: https://podcredits.xandeum.network/api/pods-credits

Returns the accumulated credit balance for reward distribution.

## Installation

```bash
# 1. Clone repository
git clone https://github.com/Idle0x/xandeum-pulse.git
cd xandeum-pulse

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open http://localhost:3000 to view the dashboard.

## Project Structure

```
xandeum-pulse/
├── pages/
│   ├── index.tsx           # Main dashboard (Grid, Search, Modal)
│   ├── leaderboard.tsx     # Credits ranking table
│   └── api/
│       ├── stats.ts        # RPC proxy with failover logic
│       └── credits.ts      # Credits API proxy
├── styles/
│   └── globals.css         # Tailwind directives & custom scrollbar
└── package.json
```

## Tech Stack

 * Framework: Next.js 16 (React)
 * Styling: Tailwind CSS
 * Networking: Axios
 * Icons: Lucide React
 * Deployment: Vercel (Serverless Functions)

## License

MIT

## Credits

Developed by riot'

 * X (Twitter): @33xp_
 * Discord: @idle0x

Built for the Xandeum Ecosystem.
