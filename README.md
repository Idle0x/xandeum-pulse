# Xandeum Pulse

Real-time network monitor and analytics dashboard for the Xandeum gossip protocol.

**Live Demo:** https://xandeum-pulse.vercel.app

## Overview

Xandeum Pulse is a serverless analytics platform for monitoring pNode health, storage consensus, and network reputation. It connects directly to the Xandeum mesh network via pRPC to provide real-time metrics without relying on centralized indexers.

Built for node operators and network validators who need accurate, up-to-date visibility into network status.

## Core Architecture

### Failover System

The dashboard implements a resilient failover strategy to maintain uptime even when individual nodes are unreachable:

1. **Primary Request:** Attempts connection to a known high-performance seed node
2. **Backup Race:** If primary fails or times out (>4s), simultaneously queries 3 random seed nodes
3. **First Response Wins:** Returns the first valid payload using Promise.any

This ensures the dashboard remains functional even during network instability.

*Implementation: `pages/api/stats.ts`*

### Client-Side Metrics

Several key metrics are computed client-side from raw pRPC data:

- **Health Score:** Algorithmic score (0-100) based on uptime, version consensus, storage utilization, and network visibility
- **Network Stability:** Percentage of nodes with >24h uptime
- **Consensus Version:** Most common software version across active nodes
- **Storage Utilization:** Ratio of used vs. committed storage with byte-level precision

*Implementation: `pages/index.tsx` (see `getHealthScore` function)*

### Reputation Ranking

The leaderboard uses a dual-fetch architecture to correlate reputation credits with live node status:

1. Fetches credit balances from the Xandeum rewards oracle
2. Simultaneously fetches live node stats via pRPC
3. Maps public keys to IP addresses, allowing operators to trace top earners to their physical nodes

Olympic-style tie handling ensures accurate ranking when nodes have equal credits.

*Implementation: `pages/leaderboard.tsx`*

## Features

**Network Monitoring**
- Real-time node grid with search and filtering (IP, public key, version)
- Deep inspection modal with raw JSON export
- Automatic background refresh on tab focus

**Operator Tools**
- Watchlist: Star and pin specific nodes for monitoring
- Deep linking: Share node states via URL parameters
- Export formats: CSV (full network dump), JSON (raw data), formatted text (social sharing)

**Analytics**
- Total network storage committed
- Version distribution and consensus tracking
- Uptime stability metrics
- Global reputation leaderboard

## API Endpoints

### GET /api/stats

Proxies pRPC `get-pods-with-stats` method with failover logic.

Returns array of active pNodes:

```json
{
  "result": {
    "pods": [
      {
        "address": "173.212.203.145:9001",
        "pubkey": "8x...",
        "version": "1.0.4",
        "uptime": 86400,
        "storage_used": 52428800,
        "storage_committed": 1099511627776,
        "is_public": true
      }
    ]
  }
}
```

### GET /api/credits

Proxies the Xandeum rewards oracle.

Returns credit balances for all registered public keys.

## Running Locally

```bash
# Clone repository
git clone https://github.com/Idle0x/xandeum-pulse.git
cd xandeum-pulse

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

No environment variables required - the pRPC proxy configuration is self-contained.

## Project Structure

```
xandeum-pulse/
├── pages/
│   ├── index.tsx           # Main dashboard (grid, search, modals)
│   ├── leaderboard.tsx     # Reputation ranking
│   └── api/
│       ├── stats.ts        # pRPC proxy with failover
│       └── credits.ts      # Credits API proxy
├── styles/
│   └── globals.css         # Tailwind configuration
└── package.json
```

## Tech Stack

- **Framework:** Next.js 16 (React)
- **Styling:** Tailwind CSS
- **Networking:** Axios with Promise.any for failover
- **Icons:** Lucide React
- **Deployment:** Vercel (Serverless Functions)

## License

MIT

## Author

Developed by riot'

- Twitter: [@33xp_](https://twitter.com/33xp_)
- Discord: @idle0x

Built for the Xandeum ecosystem.
