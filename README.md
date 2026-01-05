# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/Idle0x/xandeum-pulse/ci.yml?branch=main&label=Engineering%20Tests&style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-100%25-success?style=flat-square&logo=jest)

Real-time network monitor and analytics dashboard for the Xandeum distributed storage protocol.

**check it out:** https://xandeum-pulse.vercel.app

![Main Dashboard](https://private-user-images.githubusercontent.com/140549997/529937748-e5f273fc-8468-4da1-a01b-fa1dcf6f81b2.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY1NjUxOTcsIm5iZiI6MTc2NjU2NDg5NywicGF0aCI6Ii8xNDA1NDk5OTcvNTI5OTM3NzQ4LWU1ZjI3M2ZjLTg0NjgtNGRhMS1hMDFiLWZhMWRjZjZmODFiMi5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNFQwODI4MTdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02OTZiZmEzYTYzYmJkZjlhMjMxYTZhMTdiNDI5OTI0NTk0Mzk5NWExNzA0M2NlNzU4NzAwMGRjZWVmMjdjNjU0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.jBVP9vuR60L4GwKjjklkGX2Y-8yKA-hbR5mRa-CpBXc)

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

**Code:** [`pages/index.tsx`](pages/index.tsx)
- See `renderZenCard()` - [Lines 1049-1097](pages/index.tsx#L1049-L1097) - (zen mode toggle)

### 2. Deep Node Inspection

Clicking any node opens a granular diagnostic modal designed for detailed analysis.
 * Health Diagnostics: Breaks down the Vitality Score into its weighted components, overlaid with network average benchmarks.
 * Storage Analytics: Visualizes committed capacity against the network median, highlighting surplus or deficit gaps.
 * Head to Head Comparison: Evaluates two nodes side-by-side to identify performance differentials.
 * Proof of Pulse: Generates a PNG snapshot of the node's current metrics for social sharing.
 * Identity Panel: Exposes full metadata including RPC endpoints, public keys, and version consensus status.

**Code:** [`pages/index.tsx`](pages/index.tsx)
- See `renderComparisonRow` - [Line 900-933](pages/index.tsx#L900-L933) - (versus Mode)
- See `handleDownloadProof()` - [Lines 800-814](pages/index.tsx#L800-L814) - (proof generation)
- See renderStorageAnalysis - [Line 1395-1521](pages/index.tsx#L1395-L1521) - (storage calculation)

![Inspector Modal](https://private-user-images.githubusercontent.com/140549997/529940088-cae31cd7-fd73-46b6-8868-92895a72db3b.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY1NjU2OTcsIm5iZiI6MTc2NjU2NTM5NywicGF0aCI6Ii8xNDA1NDk5OTcvNTI5OTQwMDg4LWNhZTMxY2Q3LWZkNzMtNDZiNi04ODY4LTkyODk1YTcyZGIzYi5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNFQwODM2MzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1lYzkzYjQxMWE2YWI4ODUxMTYyNDdjMTFhN2Q5MTE5YWQ3NDAyZWNhOGQ3YmY4NjQ2OTVmMzk2NGRhYWQ0OWU4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.aiY7lezl-qh0GWDWKj2wSEQfOrPdceLwnLdWce9Xezk)

### 3. Geographic Map

Visualizes the physical distribution of network infrastructure.

- **Dynamic thresholds:** Color tiers are calculated from live percentiles rather than hardcoded values, so the map remains meaningful as the network grows
- **Context-aware inspector:** Clicking a region shows different metrics depending on the selected view mode (Storage Density vs. Economic Share)
- **Marker density:** Pin sizes scale with the number of nodes in each city

**Code:** [`pages/map.tsx`](pages/map.tsx)
- See `useEffect()` - [Lines 103-172](pages/map.tsx#L103-L172) - (percentile calculation & spatial intelligence)
- See `getXRayStats()` - [Lines 301-365](pages/map.tsx#L301-L365) - (region inspector)

![Network Topology](https://private-user-images.githubusercontent.com/140549997/529941528-4a440bb3-8981-466e-b850-64db2f44891f.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY1NjYzMTUsIm5iZiI6MTc2NjU2NjAxNSwicGF0aCI6Ii8xNDA1NDk5OTcvNTI5OTQxNTI4LTRhNDQwYmIzLTg5ODEtNDY2ZS1iODUwLTY0ZGIyZjQ0ODkxZi5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNFQwODQ2NTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0yOGQ0NzllZTEzMDgzZmVlYTkwNTY4ZmViMmUyMmY3YTM2NDJlMjExZmUyNmE5YzMwYjE3NmMxY2U4NjBlOWQyJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Wh_7b4VEuvbKOtC1zTLzoqI9-ik4Yc2m-xzi90d2Nls)

### 4. Leaderboard

Reputation tracking and earnings forecasting.

- **Rank history:** Tracks position changes over time using `localStorage` to show momentum (rising/falling)
- **Earnings simulator:** Input hardware specs to estimate rewards based on geometric stacking of multipliers (Era boosts × NFT boosts)
- **Identity bridging:** Merges anonymous blockchain addresses with physical node IPs by cross-referencing two separate APIs

**Code:** [`pages/leaderboard.tsx`](pages/leaderboard.tsx)
- See `calculateFinal()` - [Lines 197-201](pages/leaderboard.tsx#L163-L167) – (simulator logic)
- See `useEffect()` - [Lines 61-151](pages/leaderboard.tsx#L61-L151) – (logic & algorithm)

![Credits & Reputation](https://private-user-images.githubusercontent.com/140549997/529942809-728163b2-79be-42ae-8ce8-1325ad83072e.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY1NjYzMjksIm5iZiI6MTc2NjU2NjAyOSwicGF0aCI6Ii8xNDA1NDk5OTcvNTI5OTQyODA5LTcyODE2M2IyLTc5YmUtNDJhZS04Y2U4LTEzMjVhZDgzMDcyZS5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNFQwODQ3MDlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1jNzA1ZjMwMWNiZjZjNjdhNDUwNWVjZjNmZTkxMzNjZmY4MWJlOTYzODk0ZmE0MzQzODQ5Njc3ZDY1M2VmMGIzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.YnFpWMvtKkELo-ryBjzwjjs_dJndwDNj0dcNcV8Bdj0)

---

## Engineering Standards & Quality Assurance

This project implements a rigorous testing suite to ensure financial accuracy, crash resistance, and system cohesion.

### 🛡️ Crash Protocols (Resilience)
We explicitly test for network failures using Mock Service Workers. If the Xandeum RPC or Credits API goes offline, the UI is verified to gracefully degrade to "Cached Mode" or display specific error badges rather than crashing (White Screen of Death).

### 📐 Geometric Precision (Economics)
The **Stoinc Simulator** uses verified geometric stacking logic (`__tests__/lib/xandeum-economics.test.ts`) for NFT boosts. Unit tests confirm that multipliers compound correctly and that edge cases (like 0 storage or negative values) are clamped to prevent financial calculation errors.

### 👻 Ghost Node Handling (Privacy)
Integration tests verify that "Ghost Nodes" (Private/VPN IPs) are tracked in global statistics but correctly masked on the geospatial map to prevent rendering errors (`lat: 0, lon: 0`) and privacy leaks.

### 🔗 Deep Link Integrity
Navigation tests ensure that cross-module links (e.g., clicking a node in the Leaderboard to view it on the Map) correctly preserve state and focus context.

---

## Project Structure


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

GET /api/geo
Returns city-level aggregations for map rendering.
Response structure:
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

GET /api/credits
Proxies the upstream rewards oracle with a strict timeout to prevent UI blocking.
Running Locally
git clone [https://github.com/Idle0x/xandeum-pulse.git](https://github.com/Idle0x/xandeum-pulse.git)
cd xandeum-pulse
npm install
npm run dev     # Start development server
npm test        # Run the full engineering test suite

Open http://localhost:3000
No environment variables required – RPC endpoints are configured in lib/xandeum-brain.ts.
Tech Stack
 * Framework: Next.js 14 (App Router)
 * Styling: Tailwind CSS
 * Testing: Jest + React Testing Library (Unit & Integration)
 * CI/CD: GitHub Actions
 * Maps: React Simple Maps + D3 Scale
 * Charts: Recharts
 * Imaging: html-to-image (Snapshot generation)
 * Data fetching: Axios with Promise-based failover
 * Deployment: Vercel (serverless functions)
Design Decisions
Why client-side geolocation instead of backend?
Initially, all geocoding happened in API routes. This caused two problems:
 * Vercel's 10-second function timeout would fail on large node lists
 * IP-based rate limits applied to the server IP, not per-user
Moving geocoding to the client (with deduplication) distributed the rate limit across users and removed the timeout constraint.
Why not use a database?
The network state changes every ~10 seconds. A database would add:
 * Sync lag (data is stale the moment it's written)
 * Infrastructure cost (hosting + backups)
 * Another failure point
Direct RPC queries mean the UI always shows the current network state, and the serverless architecture scales to zero when idle.
Why calculate scores client-side?
The Vitality Score requires contextual data (median storage, consensus version) that changes with every fetch. Doing this calculation in the API route would require:
 * Fetch all nodes
 * Calculate context
 * Rescan all nodes to apply scores
 * Return result
This doubles the processing time. Instead, the API returns raw data + context, and the client calculates scores during rendering. The work still happens, but it's parallelized across users' devices.
Graceful Degradation
When external dependencies fail, the UI adapts rather than breaking:
 * Credits API failure detection: Instead of showing stale data or "N/A", the interface displays "CREDITS API OFFLINE" with a warning icon, making it clear the issue is upstream, not with Pulse itself
 * Automatic score re-weighting: When credits data is unavailable, the Vitality Score algorithm redistributes the 20% reputation weight to other components, ensuring nodes aren't penalized for API downtime
Known Limitations
 * No historical data: All metrics are point-in-time snapshots (by design – shows current network state)
 * IP geolocation accuracy: ~50-100km margin of error for most providers
 * No authentication: Anyone can view any node's data (intentional for network transparency)
License
MIT
Author
Built by riot (@33xp_) for the Xandeum ecosystem.
For questions or contributions, open an issue on GitHub.