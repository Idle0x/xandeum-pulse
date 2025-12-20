# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)

Real-time network monitor, geographic visualizer, and analytics dashboard for the Xandeum gossip protocol.

**⚡ Live Demo:** [https://xandeum-pulse.vercel.app](https://xandeum-pulse.vercel.app)

> **Optional Note:** This project implements a custom **"Vitality Score" algorithm**, **RPC failover protection**, and a **3D geospatial engine** to provide deep analytics on network health.

---

## Overview

Xandeum Pulse is a serverless analytics platform designed to provide transparency into the Xandeum mesh network. Unlike traditional explorers that rely on centralized databases, Pulse connects directly to pNodes via pRPC to visualize health, consensus, and physical decentralization in real-time.

Built for node operators and validators who need accurate, unfiltered visibility into the network's physical and logical topology.

---

## Core Architecture

### 1. Resilient Failover System (The "Hero & Race" Strategy)
The platform implements a high-availability strategy to maintain uptime even if specific seed nodes go offline or time out.

- **Primary Request:** Attempts connection to a known high-performance seed node.
- **Backup Race:** If the primary times out (>4s), the system simultaneously queries 3 random backup nodes.
- **First Response Wins:** The first valid payload is returned using `Promise.any`, ensuring the fastest possible data path.

👉 **Code Implementation:** [`pages/api/stats.ts`](pages/api/stats.ts)

### 2. The "Vitality Score" Algorithm
We moved beyond simple uptime tracking to a comprehensive **Vitality Score (0-100)** that evaluates a node's true value to the network. This logic is computed server-side to ensure consistency across the dashboard and map.

- **Uptime (30%):** Heavily penalizes stability issues (<24h uptime).
- **Consensus (20%):** Penalizes nodes running outdated software versions relative to the network majority.
- **Reputation (25%):** Compares a node's accumulated credits against the network median to identify underperforming peers.
- **Capacity (25%):** Rewards storage commitment, with zero-storage nodes receiving a score of 0 regardless of other metrics.

👉 **Code Implementation:** [`pages/api/geo.ts`](pages/api/geo.ts) (See `calculateVitalityScore`)

### 3. Intelligent Geocoding & Caching
To visualize physical decentralization without hitting API rate limits or slowing down the client, we built a smart caching layer:

- **In-Flight Deduping:** Simultaneous requests for the same IP are merged into a single promise, preventing race conditions.
- **LRU Caching:** Frequently accessed locations are kept in memory, while older data is evicted to prevent memory leaks.
- **Batch Processing:** IPs are resolved in chunks to minimize external API calls.

👉 **Code Implementation:** [`pages/api/geo.ts`](pages/api/geo.ts)

---

## Key Features

### Global Topology Map
A cinematic, interactive visualization of the network's physical infrastructure.
* **Smart Aggregation:** Nodes are grouped by city to reduce visual clutter while preserving density data.
* **Multi-Dimensional Views:** Toggle between Storage (Capacity), Health (Stability), and Credits (Reputation).
* **Visual Logic:** Markers change shape and color intensity based on the active metric.

👉 **View Code:** [`pages/map.tsx`](pages/map.tsx)

### Network Dashboard
The command center for operational monitoring.
* **Real-time Grid:** Filter nodes by IP, Public Key, or Version.
* **Deep Inspection:** Click any node to view raw JSON data directly from the pRPC stream.
* **Operator Tools:** Watchlist (Star/Pin nodes) and deep linking for sharing specific node states.

👉 **View Code:** [`pages/index.tsx`](pages/index.tsx)

### Reputation Leaderboard
A dual-fetch system that correlates on-chain reputation with live node status.
* Fetches credit balances from the Xandeum rewards oracle.
* Merges data with live pRPC stats to map anonymous Public Keys to physical IP addresses.

👉 **View Code:** [`pages/leaderboard.tsx`](pages/leaderboard.tsx)

---

## API Endpoints

### `GET /api/geo`
The intelligence layer for the map. Returns aggregated city-level data with pre-calculated Vitality Scores and credit mapping.
* *Logic:* Merges RPC data + Credits API + Geocoding Cache

### `GET /api/stats`
Proxies the raw pRPC `get-pods-with-stats` method with failover protection.

```json
{
  "result": {
    "pods": [
      {
        "address": "173.212.203.145:9001",
        "version": "1.0.4",
        "storage_committed": 1099511627776,
        "is_public": true
      }
    ]
  }
}
```

### `GET /api/credits`
Proxies the Xandeum rewards oracle to retrieve the global credit ledger.

---

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

Open http://localhost:3000. No environment variables are required—the pRPC proxy configuration is self-contained.

---

## Project Structure

```
xandeum-pulse/
├── pages/
│   ├── index.tsx           # Main Dashboard (Grid, Search)
│   ├── map.tsx             # Global Topology (Visualizations, Drawer)
│   ├── leaderboard.tsx     # Reputation Ranking
│   └── api/
│       ├── geo.ts          # Aggregation, Caching & Health Logic
│       ├── stats.ts        # pRPC Proxy & Failover
│       └── credits.ts      # Oracle Proxy
├── styles/
│   └── globals.css         # Tailwind & Safe Area configs
└── package.json
```

---

## Tech Stack

* **Framework:** Next.js 16 (React)
* **Styling:** Tailwind CSS (Mobile-first, Dark Mode)
* **Visualization:** React Simple Maps + D3 Scale
* **Networking:** Axios (Promise.any failover)
* **Icons:** Lucide React

---

## License

MIT

---

## Author

Developed by riot'

* **X (Twitter):** [@33xp_](https://twitter.com/33xp_)
* **Discord:** @idle0x

Built for the Xandeum ecosystem.
