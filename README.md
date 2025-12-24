# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)

Real-time network monitor and analytics dashboard for the Xandeum distributed storage protocol.

**check it out:** https://xandeum-pulse.vercel.app

---

## What is this?

Xandeum Pulse is a monitoring tool for node operators running on the Xandeum network. Unlike traditional blockchain explorers that rely on centralized databases, Pulse queries nodes directly via RPC to provide unfiltered visibility into network health, storage capacity, and consensus status.

**The core problem:** Node operators needed a way to:
- Monitor their node's performance relative to the network
- Identify geographic centralization risks
- Track reputation earnings without vendor lock-in
- Diagnose health issues before they impact rewards

**The solution:** A serverless Next.js application that aggregates data from multiple RPC endpoints, calculates normalized health scores, and presents actionable insights through an interactive UI.

---

## Architecture

### 1. Resilient Data Fetching

The platform uses a failover strategy to maintain availability when individual nodes go offline:

- **Primary attempt:** Connect to a known high-performance seed node (4-second timeout)
- **Backup race:** If primary fails, query 3 random backup nodes simultaneously
- **First wins:** Return the first valid response using `Promise.any`

This prevents the UI from hanging on slow or dead endpoints while maintaining data freshness.

**Implementation:** [`lib/xandeum-brain.ts`](lib/xandeum-brain.ts#L160-L174) – `fetchRawData()`

---

### 2. Vitality Score Algorithm

Node health is scored 0-100 using four weighted components. The challenge was making diverse metrics (storage bytes, uptime seconds, version strings) directly comparable.

#### Standard Weights

| Component | Weight | Calculation Method | Why This Approach? |
|-----------|--------|-------------------|-------------------|
| **Uptime** | 35% | Sigmoid curve centered at 7 days | Linear scoring doesn't reflect that 99.9% uptime is dramatically better than 99% |
| **Storage** | 30% | Logarithmic scale vs. network median | A node with 2x median capacity isn't twice as valuable as one at 1x |
| **Reputation** | 20% | Normalized against median credits | Economic contribution should influence health |
| **Version** | 15% | Rank-based penalty for outdated software | Being 1 version behind is acceptable; 3+ versions is critical |

#### Crash-Resistant Re-Weighting

When the Credits API is unreachable, the Reputation weight (20%) is redistributed proportionally to prevent artificial score drops:

| Component | Fallback Weight |
|-----------|-----------------|
| Uptime | 45% (+10%) |
| Storage | 35% (+5%) |
| Reputation | 0% (excluded) |
| Version | 20% (+5%) |

The system detects API failures by checking for `null` responses, then recalculates all scores using the adjusted weights.

**Implementation:** [`lib/xandeum-brain.ts`](lib/xandeum-brain.ts#L95-L155) – `calculateVitalityScore()`

---

### 3. Geographic Resolution & Caching

Displaying 1000+ nodes on a map without rate-limiting requires careful API management:

#### Request Deduplication
When 500 concurrent users load the map, they might all request the same IP address. Instead of firing 500 geocoding requests, we group them into a single promise that all callers await.

#### LRU Cache
Previously resolved locations are stored in a `Map` with O(1) lookup. When the cache exceeds its limit, the least-recently-used entries are evicted to maintain stable memory usage.

#### Private IP Handling
Nodes behind VPNs or CGNAT return non-routable addresses. These are assigned coordinates `(0, 0)` and flagged so they contribute to statistics but don't render invalid map pins.

**Implementation:** [`lib/xandeum-brain.ts`](lib/xandeum-brain.ts#L185-L200) – `resolveLocations()`

---

## Key Features

### 1. Dashboard

The primary monitoring interface for node operators.

- **Cyclic metrics:** Cards rotate between Storage → Uptime → Health every 5 seconds to maximize data density without clutter
- **Visual mode toggle:** "Zen Mode" strips gradients/animations for OLED displays in 24/7 monitoring environments
- **Head-to-head comparison:** Select two nodes to see side-by-side performance differentials

**Code:** [`pages/index.tsx`](pages/index.tsx)
- See `renderZenCard()` - [Lines 833-875](pages/index.tsx#L833-L875) - (zen mode toggle)
- See `handleDownloadProof()` - [Lines 622-636](pages/index.tsx#L622-L636) - (proof generation)

### 2. Geographic Map

Visualizes the physical distribution of network infrastructure.

- **Dynamic thresholds:** Color tiers are calculated from live percentiles rather than hardcoded values, so the map remains meaningful as the network grows
- **Context-aware inspector:** Clicking a region shows different metrics depending on the selected view mode (Storage Density vs. Economic Share)
- **Marker density:** Pin sizes scale with the number of nodes in each city

**Code:** [`pages/map.tsx`](pages/map.tsx)
- See `useEffect()` - [Lines 150-175](pages/map.tsx#L150-L175) - (percentile calculation)
- See `getXRayStats()` - [Lines 265-315](pages/map.tsx#L265-L315) - (region inspector)

### 3. Leaderboard

Reputation tracking and earnings forecasting.

- **Rank history:** Tracks position changes over time using `localStorage` to show momentum (rising/falling)
- **Earnings simulator:** Input hardware specs to estimate rewards based on geometric stacking of multipliers (Era boosts × NFT boosts)
- **Identity bridging:** Merges anonymous blockchain addresses with physical node IPs by cross-referencing two separate APIs

**Code:** [`pages/leaderboard.tsx`](pages/leaderboard.tsx)
- See `calculateFinal()` - [Lines 163-167](pages/leaderboard.tsx#L163-L167) – (simulator logic)
- See `useEffect()` - [Lines 117-124](pages/leaderboard.tsx#L117-L124) – (multiplier staking)

---

## Project Structure

```
/
├── pages/
│   ├── index.tsx          # Dashboard UI
│   ├── map.tsx            # Geographic visualizer
│   ├── leaderboard.tsx    # Reputation rankings
│   └── docs.tsx           # Interactive documentation
│
├── pages/api/
│   ├── stats.ts           # Main data aggregation endpoint
│   ├── geo.ts             # Geographic clustering logic
│   └── credits.ts         # Reputation API proxy
│
├── lib/
│   └── xandeum-brain.ts   # Core scoring + failover logic
│
└── public/                # Static assets
```

---

## API Endpoints

### `GET /api/stats`

Returns an enriched list of all nodes with calculated health scores.

**Response structure:**
```json
{
  "result": {
    "pods": [
      {
        "pubkey": "8x...2A",
        "address": "192.168.1.1:6000",
        "health": 81,
        "healthBreakdown": {
          "uptime": 92,
          "storage": 78,
          "reputation": 65,
          "version": 100
        },
        "credits": 5200000,
        "rank": 3
      }
    ]
  },
  "stats": {
    "consensusVersion": "1.2.3",
    "totalNodes": 1247,
    "avgBreakdown": { ... }
  }
}
```

---

### `GET /api/geo`

Returns city-level aggregations for map rendering.

**Response structure:**
```json
{
  "locations": [
    {
      "name": "Lisbon",
      "country": "Portugal",
      "lat": 38.7223,
      "lon": -9.1393,
      "count": 42,
      "totalStorage": 1200000000000,
      "avgHealth": 87
    }
  ]
}
```

---

### `GET /api/credits`

Proxies the upstream rewards oracle with a strict timeout to prevent UI blocking.

---

## Running Locally

```bash
git clone https://github.com/Idle0x/xandeum-pulse.git
cd xandeum-pulse
npm install
npm run dev
```

Open http://localhost:3000

No environment variables required – RPC endpoints are configured in `lib/xandeum-brain.ts`.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Maps:** React Simple Maps + D3 Scale
- **Charts:** Recharts
- **Imaging:** html-to-image (Snapshot generation)
- **Data fetching:** Axios with Promise-based failover
- **Deployment:** Vercel (serverless functions)

---

## Design Decisions

### Why client-side geolocation instead of backend?

Initially, all geocoding happened in API routes. This caused two problems:
1. Vercel's 10-second function timeout would fail on large node lists
2. IP-based rate limits applied to the *server* IP, not per-user

Moving geocoding to the client (with deduplication) distributed the rate limit across users and removed the timeout constraint.

### Why not use a database?

The network state changes every ~10 seconds. A database would add:
- Sync lag (data is stale the moment it's written)
- Infrastructure cost (hosting + backups)
- Another failure point

Direct RPC queries mean the UI always shows the current network state, and the serverless architecture scales to zero when idle.

### Why calculate scores client-side?

The Vitality Score requires contextual data (median storage, consensus version) that changes with every fetch. Doing this calculation in the API route would require:
1. Fetch all nodes
2. Calculate context
3. Rescan all nodes to apply scores
4. Return result

This doubles the processing time. Instead, the API returns raw data + context, and the client calculates scores during rendering. The work still happens, but it's parallelized across users' devices.

---

## Features

### Graceful Degradation

When external dependencies fail, the UI adapts rather than breaking:

- **Credits API failure detection:** Instead of showing stale data or "N/A", the interface displays "CREDITS API OFFLINE" with a warning icon, making it clear the issue is upstream, not with Pulse itself
- **Automatic score re-weighting:** When credits data is unavailable, the Vitality Score algorithm redistributes the 20% reputation weight to other components, ensuring nodes aren't penalized for API downtime

### Known Limitations

- **No historical data:** All metrics are point-in-time snapshots (by design – shows current network state)
- **IP geolocation accuracy:** ~50-100km margin of error for most providers
- **No authentication:** Anyone can view any node's data (intentional for network transparency)

---

## License

MIT

---

## Author

Built by **riot** ([@33xp_](https://twitter.com/33xp_)) for the Xandeum ecosystem.

For questions or contributions, open an issue on GitHub.
