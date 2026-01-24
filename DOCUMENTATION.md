# Xandeum Pulse - Technical Documentation

**Version:** 2.0 (Live Architecture)  
**Last Updated:** January 2026  
**System:** Xandeum Pulse Analytics Platform

This document serves as the definitive "Master Reference" for the [Xandeum Pulse](https://github.com/Idle0x/xandeum-pulse) architecture. It covers the data ingestion pipelines, mathematical scoring models, database schema, and the algorithmic "Synthesis Engine" used for narrative generation.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Component Breakdown](#2-architecture--component-breakdown)
3. [Data Pipeline (The "Dual Hero" Strategy)](#3-data-pipeline-the-dual-hero-strategy)
4. [Consensus & Identity Protocols](#4-consensus--identity-protocols)
5. [Vitality Score Model](#5-vitality-score-model)
6. [Core Mathematics](#6-core-mathematics)
7. [The Synthesis Engine (Narrative Logic)](#7-the-synthesis-engine-narrative-logic)
8. [Database Schema](#8-database-schema)
9. [Quality Assurance & Auditing](#9-quality-assurance--auditing)
10. [API Reference](#10-api-reference)
11. [UI/UX Design Principles](#11-uiux-design-principles)
12. [Platform Walkthrough](#12-platform-walkthrough)
13. [Advanced Features](#13-advanced-features)
14. [Performance & Optimization](#14-performance--optimization)
15. [Operations, Error Handling & Resilience](#15-operations-error-handling--resilience)
16. [Troubleshooting](#16-troubleshooting)
17. [Future Enhancements](#17-future-enhancements)
18. [Contributing](#18-contributing)
19. [Credits](#19-credits)

---

<details open>
<summary><strong>1. System Overview</strong></summary>

## 1. System Overview


Xandeum Pulse is a real-time network monitoring dashboard and temporal intelligence platform for the Xandeum blockchain's physical node (pNode) infrastructure.

It operates on a **Hybrid-Live Persistence Model**, balancing the need for real-time telemetry (via direct RPC) with the requirement for long-term trend analysis (via a historical database).

### 1.1 Key Features

* **Crash-Proof Design:** Handles API failures gracefully with automatic failover via Circuit Breaker.
* **Hybrid Persistence:** Balances real-time RPC streams with a historical "Shadow Database" (Supabase).
* **Dynamic Thresholds:** Percentile-based tiering adapts to network growth.
* **Deep Linking:** Share direct links to specific nodes or map regions.
* **Continuous Auditing:** Automated scripts verify network data integrity every 30-60 minutes.

</details>

---

<details open>
<summary><strong>2. Architecture & Component Breakdown</strong></summary>

## 2. Architecture & Component Breakdown


### 2.1 System Diagram

```ascii
┌─────────────────────────────────────────────────────────────┐
│                     XANDEUM PULSE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │   Next.js   │────▶│  API Routes  │◀───│  Xandeum RPC │ │
│  │  Frontend   │     │  (/api/*)    │    │   Network    │ │
│  └─────────────┘     └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │   React     │     │  Brain Logic │    │   Credits    │ │
│  │ Components  │◀────│ (xandeum-    │◀───│     API      │ │
│  │             │     │  brain.ts)   │    │              │ │
│  └─────────────┘     └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         │                    ▼                    ▼         │
│         │            ┌──────────────┐    ┌──────────────┐ │
│         │            │  Geolocation │    │  Persistence │ │
│         └───────────▶│   Services   │    │  (Supabase)  │ │
│                      └──────────────┘    └──────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

#### 2.2.1 Frontend Layer

* **[Next.js](https://nextjs.org/) 16+:** Server-side rendering for SEO, client-side reactivity for real-time updates.
* **[Tailwind CSS](https://tailwindcss.com/):** Utility-first styling with custom animations (e.g., scanning lights, pulse effects).
* **[React Simple Maps](https://www.react-simple-maps.io/):** D3-powered geographic visualization with deterministic mesh topology.
* **Modular Components:** Critical UI elements like [`RadialProgress.tsx`](./components/RadialProgress.tsx) are isolated for performance.

#### 2.2.2 API Layer (`/pages/api/`)

* **[`stats.ts`](./pages/api/stats.ts):** Main telemetry endpoint, returns enriched node data + network statistics.
* **[`geo.ts`](./pages/api/geo.ts):** Geographic aggregation for map view with "King Node" selection logic.
* **[`credits.ts`](./pages/api/credits.ts):** Proxy for reputation data with strict timeout handling.

#### 2.2.3 Brain (`/lib/xandeum-brain.ts`)

* **Data Fetching:** Multi-source failover (Hero Primary + Swarm Backup).
* **Enrichment Pipeline:** Geolocation, health scoring, rank calculation.
* **Mathematical Engine:** Implements all scoring algorithms (Sigmoid, Logarithmic).

#### 2.2.4 The Temporal Watchman (Database Persistence)

While the dashboard UI fetches live data, a standalone backend engine captures the network's "Memory."

* **Frequency:** Every 30 Minutes (Triggered via [GitHub Actions](https://github.com/features/actions) cron).
* **Storage:** [PostgreSQL](https://www.postgresql.org/) ([Supabase](https://supabase.com/)).
* **Logic:** The [`health-check.ts`](./scripts/health-check.ts) script fetches the entire network state, calculates all scores, and commits a snapshot. This data feeds the Stability Ribbons and Growth Velocity charts.

</details>

---

<details open>
<summary><strong>3. Data Pipeline (The "Dual Hero" Strategy)</strong></summary>

## 3. Data Pipeline (The "Dual Hero" Strategy)


The platform aggregates data from three distinct sources to ensure 100% network visibility, even during partial outages.

### 3.1 Fetch Sequence (Every 30 Seconds)

1.  **ORCHESTRATION LAYER (Dual Hero Strategy)**
    * **Hero A (Private RPC):** A dedicated, high-performance node acts as the "Source of Truth" for Mainnet. It utilizes a **15-second RAM cache** to prevent UI "blips" during micro-outages.
    * **Hero B (Public Swarm):** A `Promise.any` race condition targets **5+ random public nodes** simultaneously. This layer is responsible for the passive discovery of "Ghost Nodes" (pods not yet indexed by the private RPC).

2.  **CREDITS API (Parallel)**
    * **URL:**
    - [`https://podcredits.xandeum.network/api/mainnet-pod-credits`](https://podcredits.xandeum.network/api/mainnet-pod-credits)
    - [`https://podcredits.xandeum.network/api/pods-credits`](https://podcredits.xandeum.network/api/pods-credits)
    * **Decoupling:** This stream is strictly decoupled. If it fails (returns 500/404), `creditsSystemOnline` is set to `false`, and the dashboard remains functional (Graceful Degradation).

3.  **GEOLOCATION (Batching)**
    * **Cache:** Checks `geoCache` (Map<IP, Location>).
    * **External:** Missing IPs → [`ip-api.com`](https://ip-api.com/) (100 IPs/batch).
    * **Fallback:** [`geoip-lite`](https://github.com/geoip-lite/node-geoip) (local DB) if rate limits are hit.

4.  **ENRICHMENT (Brain)**
    * **Deduplicate:** Filter Public Swarm against Private RPC.
    * **Fingerprint:** Generate Stable ID v2.
    * **Score:** Apply Vitality Algorithm.
    * **Rank:** Assign competitive positioning.

### 3.2 Caching Strategy

* **Client-Side:** `localStorage.xandeum_favorites` (persistent) and `localStorage.xandeum_rank_history` (trend calculation).
* **Server-Side:** RAM Cache (15s short-term) and Persistence (Supabase 30-minute snapshots).

</details>

---

<details open>
<summary><strong>4. Consensus & Identity Protocols</strong></summary>

## 4. Consensus & Identity Protocols


### 4.1 Multi-Network Identity Resolution ("Identity Crisis")

In distributed systems, a single operator may run multiple node instances (e.g., one Mainnet, one Devnet) using the same Public Key. A naive dashboard would merge these into a single corrupted entry.

Pulse implements a 3-Factor Matching Logic to ensure atomic precision:

1.  **Primary Match (Key):** Public Key
2.  **Context Match (Network):** Mainnet vs. Devnet
3.  **Physical Match (Origin):** IP Address / Port

This ensures that "Sibling Nodes" are treated as distinct entities with their own metrics, ranking, and history.

### 4.2 Stable ID v2 (Historical Persistence)

To maintain historical continuity (e.g., Stability Ribbons), the system generates a Stable ID that survives software upgrades. Volatile attributes (like Software Version or Public Status) are strictly excluded from this key.

```typescript
// Volatile data (Version, Public Status) is STRIPPED from the fingerprint
const stableId = `${PubKey}-${IP_Address}-${NetworkID}`;
```

### 4.3 Deduplication Logic

When aggregating data from multiple RPC sources (Private vs. Public), duplicate reporting is inevitable. Pulse applies a rigorous filter:

* **Fingerprinting:** A 7-point matching protocol isolates physical hardware from volatile metadata.
* **Priority Rule:** If a fingerprint match is found between the Private RPC (Trusted) and the Public Swarm (Untrusted), the **Public entry is discarded immediately**.

</details>

---

<details open>
<summary><strong>5. Vitality Score Model</strong></summary>

## 5. Vitality Score Model


The "Vitality Score" (0-100) is not arbitrary. It is a weighted composite of four non-linear metrics designed to penalize instability while rewarding consistency.

### 5.1 Vitality Weights Table

| Metric | Standard Weight | Fallback Weight (API Offline) |
|---|---|---|
| **Uptime** | 35% | 45% |
| **Storage** | 30% | 35% |
| **Reputation** | 20% | 0% (Excluded) |
| **Version** | 15% | 20% |

### 5.2 Uptime Score — Stability & Reliability

**Goal:** Measure node stability using a smooth, trust-building curve.

* **Metric:** `node.uptime` (seconds → days)
* **Logic (Sigmoid Curve):**
    * Uses a smooth S-curve (logistic function) centered at 7 days.
    * **Constraint:** If $t < 1.0$ day, the score is **hard-capped at 20/100**.
    * > 14 days → Rapidly approaches 100 points.

### 5.3 Storage Score — Capacity + Utilization

**Goal:** Reward both promised utility (commitment) and real usage (data stored).

* **Logic (Logarithmic Growth):**
    * **Base Score:** Calculated using a logarithmic scale relative to the **Network Median**.
    * **Utilization Bonus:** Additional points (up to +15) based on actual data stored (`storage_used`).
    * **Whale Protection:** Uses Median instead of Average to prevent "Storage Whales" from skewing the curve.

### 5.4 Reputation Score — Historical Contribution

**Goal:** Measure proven contribution relative to the network's middle standard.

* **Logic:**
    * `min(100, (Credits / (MedianCredits * 2)) * 100)`
    * If the Credits API is offline, this weight (20%) is redistributed to Uptime (+10%), Storage (+5%), and Version (+5%).

### 5.5 Version Score — Security & Consensus Alignment

**Goal:** Measure protocol safety and consensus participation.

* **Logic (Distance-Based Decay):**
    * Distance 0 (Consensus): **100 pts**
    * Distance 1 (Lagging): **90 pts**
    * Distance 2: **70 pts**
    * Distance 3: **50 pts**
    * Distance 4+: **< 30 pts**

### 5.6 Gatekeeper Rule (Hard Constraint)

**IF** `storage_committed <= 0` **THEN** `Vitality Score = 0`.

*Reason:* Xandeum is a storage network. A node that commits 0 GB provides zero utility, regardless of uptime, version, or historical performance. It is therefore considered non-participatory.

</details>

---

<details open>
<summary><strong>6. Core Mathematics</strong></summary>

## 6. Core Mathematics


### 6.1 Uptime Scoring (Sigmoid Function)

Linear scoring is flawed for uptime (the difference between 99% and 100% is significant). We use a Sigmoid Function:

$$S(t) = \frac{100}{1 + e^{-k(t - t_0)}}$$

* $t$: Uptime in days.
* $t_0$: Midpoint (7 days).
* $k$: Steepness factor (0.2).

### 6.2 Economic Simulation (STOINC Protocol)

The Leaderboard includes a hardware-based reward forecaster. This simulation applies the Geometric Stacking rules of the STOINC protocol.

* **BaseRate:** Derived from global network difficulty and total emission pool.
* **$M_{era}$:** Era Multiplier (1.0x - 4.0x depending on network age).
* **$M_{nft}$:** NFT Utility Boost (1.1x - 2.0x).
* **$M_{stake}$:** Staking Weight Multiplier.
* **Precision:** All calculations use floating-point arithmetic verified to 8 decimal places.

</details>

---

<details open>
<summary><strong>7. The Synthesis Engine (Narrative Logic)</strong></summary>

## 7. The Synthesis Engine (Narrative Logic)


Pulse replaces static labels with an Algorithmic Narrative Engine. This system generates context-aware sentences based on the user's specific interaction state.

### 7.1 The 7-Scenario Logic

The engine detects the active context and routes the logic to one of 7 generators:

1.  **Overview (Default):** Compares Global Health vs. 30-Day Moving Average.
2.  **Overview (Chart Focus):** Analyzes volatility ($\sigma$) of the selected metric.
3.  **Overview (Node Focus):** "Drag vs. Lift" analysis (e.g., "Node X is dragging the average down due to poor uptime").
4.  **Market (Default):** Gini Coefficient analysis (Centralization Risk).
5.  **Market (Slice Focus):** Wealth dominance and Shareholder leverage.
6.  **Topology (Default):** Geographic clustering and jurisdictional risk.
7.  **Topology (Pin Focus):** "King Node" status and regional connectivity.

### 7.2 Seeded Randomness

To prevent the text from "flickering" or feeling robotic, the engine uses a hashing algorithm based on the Node ID.

* **Input:** Node ID + Date (Day).
* **Output:** A stable "Random" seed.
* **Result:** A specific node will always have the same "Personality" (report style) for the entire day.

</details>

---

<details open>
<summary><strong>8. Database Schema</strong></summary>

## 8. Database Schema


The persistence layer is built on PostgreSQL (Supabase).

### 8.1 network_snapshots

Captures the global heartbeat.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary Key |
| `created_at` | timestamptz | Snapshot timestamp |
| `total_nodes` | int4 | Active node count |
| `avg_health` | numeric | Global vitality average |
| `consensus_version` | text | Current network consensus |
| `total_capacity` | int8 | Total storage (Bytes) |

### 8.2 node_snapshots

The high-volume table driving the Stability Ribbons.

| Column | Type | Description |
|---|---|---|
| `node_id` | text | Stable ID (PubKey-IP-Net) |
| `snapshot_id` | uuid | FK to `network_snapshots` |
| `is_online` | bool | RPC reachability status |
| `credits` | int8 | Cumulative earnings |
| `health_score` | int2 | Calculated Vitality (0-100) |
| `rank` | int4 | Network rank at time of snapshot |

</details>

---

<details open>
<summary><strong>9. Quality Assurance & Auditing</strong></summary>

## 9. Quality Assurance & Auditing


The platform's reliability is guaranteed by a multi-layered testing strategy comprising 31 automated tests across 5 suites.

### 9.1 Mathematical Verification

* **Focus:** [`lib/xandeum-economics.ts`](./lib/xandeum-economics.ts), [`lib/xandeum-brain.ts`](./lib/xandeum-brain.ts)
* **Method:** Unit tests verify that:
    * Geometric stacking of NFT boosts calculates correctly to the 8th decimal.
    * Vitality scores clamp correctly (0-100) even with negative inputs.
    * Fallback weights trigger automatically when API simulates failure.

### 9.2 Spatial Logic Verification

* **Focus:** [`api/geo.ts`](./pages/api/geo.ts)
* **Method:** Backend tests confirm:
    * **Ghost Node Filtering:** VPN/Private IPs (lat: 0) are excluded from map rendering.
    * **King Selection:** The aggregation engine correctly picks the highest-value node to represent a city cluster.

### 9.3 UI & Integration Tests

* **Focus:** [`pages/map.tsx`](./pages/map.tsx), [`integration/navigation.test.tsx`](./tests/integration/navigation.test.tsx)
* **Method:** Simulates user journeys:
    * Clicking a deep link (`?focus=1.2.3.4`) correctly zooms the map.
    * Switching view modes updates D3 render layers without crashing.

### 9.4 The Pulse Monitor (Continuous Auditing)

Beyond tests, a live Health Check Script ([`scripts/health-check.ts`](./scripts/health-check.ts)) runs hourly via [GitHub Actions](https://github.com/features/actions).

* **Scope:** Pings 100% of network nodes.
* **Rule:** If any node returns corrupted schema (e.g., credits: null), alerts are triggered immediately.

</details>

---

<details open>
<summary><strong>10. API Reference</strong></summary>

## 10. API Reference


### `/api/stats`

**Method:** `GET`

**Endpoint:** [`/api/stats`](./pages/api/stats.ts)

**Response Schema:**

```typescript
{
  result: {
    pods: EnrichedNode[]
  },
  stats: {
    consensusVersion: string,
    medianCredits: number,
    medianStorage: number,
    totalNodes: number,
    systemStatus: {
      credits: boolean,
      rpc: boolean
    },
    avgBreakdown: {
      uptime: number,
      version: number,
      reputation: number | null,
      storage: number,
      total: number
    }
  }
}
```

**Error Codes:**

- `503 Service Unavailable`: RPC network unreachable

---

### `/api/geo`

**Method:** `GET`

**Endpoint:** [`/api/geo`](./pages/api/geo.ts)

**Response Schema:**

```typescript
{
  locations: LocationData[],
  stats: {
    totalNodes: number,
    countries: number,
    topRegion: string,
    topRegionMetric: number
  }
}
```

**LocationData Fields:**

- `totalCredits`: **Nullable** if no valid credit data exists for region
- `topPerformers`: Object mapping `{ STORAGE, CREDITS, HEALTH }` to "King" node metadata

---

### `/api/credits`

**Method:** `GET`

**Endpoint:** [`/api/credits`](./pages/api/credits.ts)

**Timeout:** 8 seconds

**Response:** Raw passthrough from upstream API

**Error Codes:**

- `503`: Upstream API offline or timeout

</details>

---

<details open>
<summary><strong>11. UI/UX Design Principles</strong></summary>

## 11. UI/UX Design Principles


### 11.1 Visual Hierarchy

* **Color-Coded Modes:** Each view mode has a dedicated color scheme.
    * Storage: Indigo (`#6366f1`)
    * Health: Emerald (`#10b981`)
    * Credits: Orange (`#f97316`)
* **Progressive Disclosure:** Cards start collapsed, expand on click.
    * Overview → Detailed Breakdown → Raw Data.
* **Micro-Animations:** Every state change has a 300ms transition (Fade-ins, Slide-ins).

### 11.2 Responsive Breakpoints

* **Base:** 375px (iPhone SE)
* **sm:** 640px (Tablets)
* **md:** 768px (Landscape Tablets)
* **lg:** 1024px (Laptops)
* **xl:** 1280px (Desktops)
* **2xl:** 1536px (Wide Monitors)

See [Tailwind's responsive design documentation](https://tailwindcss.com/docs/responsive-design) for more details.

### 11.3 User Feedback

**Loading States:**

- Skeleton screens (cards with pulsing gray bars)
- Progress indicators (spinning circles)
- Animated text ("Calculating Fortunes...")

**Error States:**

- Inline alerts (red border + icon)
- Toast notifications (auto-dismiss after 6s)
- Full-screen fallbacks (when entire page fails)

**Success States:**

- Green checkmarks (copy actions)
- Confetti animation (achievements, future)
- Haptic feedback (mobile, future)

</details>

---

<details open>
<summary><strong>12. Platform Walkthrough</strong></summary>

## 12. Platform Walkthrough


### 12.1 Dashboard (/)

* **Primary View:** Grid of node cards with rotating metrics.
* **Card Cycle (5 Steps, 5-Second Rotation):**
    1. Storage Used
    2. Storage Committed
    3. Health Score
    4. Uptime
    5. Last Seen
* **Smart Jump-to-View:** Sorting by Storage locks cycle to step 2; Sorting by Health locks cycle to step 3.
* **Zen Mode:** Minimalist OLED-black theme for 24/7 monitoring walls.

See the [Dashboard implementation](./pages/index.tsx).

### 12.2 Node Inspector Modal

* **HealthView:** Breakdown of 4 pillars + 30-Day Stability Ribbon.
* **StorageView:** Distribution curve + Utilization bonus.
* **IdentityView:** Fleet Topology + RPC Endpoints.
* **Versus Mode:** Side-by-side comparison with green checkmarks for superiority.
* **Proof of Pulse:** PNG generation for social sharing.

See the [Node Inspector component](./components/NodeInspector.tsx).

### 12.3 Global Map (/map)

* **Three View Modes:**
    * Storage: Pin size = total committed capacity.
    * Health: Pin shape = diamond (vs square/circle).
    * Credits: Pin size = total earnings.
* **Regional X-Ray Stats:** Avg Density, Global Share, Tier Rank.

See the [Map page implementation](./pages/map.tsx).

### 12.4 Leaderboard (/leaderboard)

* **Sorting:** Always by credits (descending).
* **STOINC Simulator:**
    * Hardware Calculator Mode: Input nodes, storage, stake → calculates base credits.
    * Boost Selector: Apply NFT/Era multipliers.
    * Live Preview: Shows projected earnings and network share.
* **Trend Tracking:** Compares current rank to previous session via `localStorage`.

See the [Leaderboard page implementation](./pages/leaderboard.tsx).

</details>

---

<details open>
<summary><strong>13. Advanced Features</strong></summary>

## 13. Advanced Features


### 13.1 Smart Card Rotation

Cards cycle through 5 metrics every 5 seconds, but **sorting locks the cycle** to the relevant step:

```typescript
useEffect(() => {
  let targetStep = -1;
  if (sortBy === 'storage') targetStep = 1; // Jump to "Committed"
  else if (sortBy === 'health') targetStep = 2; // Jump to "Health"
  else if (sortBy === 'uptime') targetStep = 3; // Jump to "Uptime"
  
  if (targetStep !== -1) setCycleStep(targetStep);
}, [sortBy]);
```

### 13.2 Whale Watch (Trend Tracking)

Rank changes are calculated by comparing:

- **Current Rank**: From live API data
- **Previous Rank**: From `localStorage.xandeum_rank_history`

**Storage Schema:**

```json
{
  "xHdG3...": 12,
  "kP9mZ...": 45,
  "qW2nL...": 3
}
```

**Trend Calculation:**

```typescript
const prevRank = history[node.pubkey];
if (prevRank) {
  node.trend = prevRank - currentRank; // Positive = moved up
}
```

### 13.3 Deep Linking

All major views support URL-based state:

| URL | Effect |
|-----|--------|
| `/?open=<pubkey>` | Opens node inspector |
| `/map?focus=<IP>` | Zooms to location |
| `/leaderboard?highlight=<pubkey>` | Scrolls to row + expands |

**Implementation:**

```typescript
useEffect(() => {
  if (router.isReady && router.query.open && !hasDeepLinked.current) {
    const targetNode = nodes.find(n => n.pubkey === router.query.open);
    if (targetNode) {
      setSelectedNode(targetNode);
      hasDeepLinked.current = true; // Prevent re-trigger
    }
  }
}, [router.isReady, router.query.open, nodes]);
```

</details>

---

<details open>
<summary><strong>14. Performance & Optimization</strong></summary>

## 14. Performance & Optimization


### 14.1 Bundle Size

* **Target:** < 500KB initial load (gzipped).
* **Techniques:** [Tree Shaking](https://webpack.js.org/guides/tree-shaking/), [Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading) (Lazy-load map libraries), [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) (WebP), Font Subsetting.

### 14.2 Rendering Strategy

* **Static Generation (SSG):** Documentation page, About/FAQ pages.
* **Server-Side Rendering (SSR):** Dashboard (for SEO), Leaderboard.
* **Client-Side Rendering (CSR):** Map (data-heavy), Modals (ephemeral state).

Learn more about [Next.js rendering strategies](https://nextjs.org/docs/app/building-your-application/rendering).

### 14.3 Memory Management

* **Large Datasets:** Node list capped at 100 visible in leaderboard; virtualized scrolling planned for 1000+ nodes.
* **Map:** Pins limited to 200 simultaneous renders.

</details>

---

<details open>
<summary><strong>15. Operations, Error Handling & Resilience</strong></summary>

## 15. Operations, Error Handling & Resilience


### 15.1 Circuit Breaker & Failover

To prevent "Lag Cascades" where slow nodes hang the UI, the [`RpcOrchestrator`](./lib/rpc-orchestrator.ts) implements a strict Circuit Breaker pattern:

* **Threshold:** 3 consecutive failures or timeouts (>4000ms).
* **Penalty:** The offending node is "Banned" from rotation for 60 seconds.
* **Recovery:** A background worker passively tests banned nodes; successful pings restore them to the active pool.

Learn more about the [Circuit Breaker pattern](https://martinfowler.com/bliki/CircuitBreaker.html).

### 15.2 Fail-Safe Hierarchy

1.  **Network Unreachable:** Show "Syncing..." → Retry with exponential backoff.
2.  **Partial Data Loss (Credits API down):** Re-weight health scores dynamically (Fallback Weighting).
3.  **Geolocation Failure:** Fallback to `geoip-lite` (local DB).
4.  **Invalid Data:** Replace with safe defaults; log to console.
5.  **Storage Quota Exceeded:** Clear oldest `localStorage` entries (rank history) and notify user.

</details>

---

<details open>
<summary><strong>16. Troubleshooting</strong></summary>

## 16. Troubleshooting


### 16.1 Common Error Codes

* `ERR_RPC_ALL_FAIL`: The Circuit Breaker has tripped for the Hero node, and all Swarm backups timed out.
    * **Action:** Check global internet connectivity or Xandeum Status Page.
* `WARN_CREDITS_OFFLINE`: The Credits API returned 500/404.
    * **Action:** Dashboard automatically switches to "Fallback Weighting" mode.
* `GEO_RATE_LIMIT`: The IP-API batch limit was reached.
    * **Action:** System falls back to local `geoip-lite` database.

### 16.2 More

**1. "Node not found on map"**

- **Cause**: Node uses VPN/CGNAT (private IP)
- **Solution**: IP geolocation returns (0, 0) → hidden on map
- **Workaround**: View in [Dashboard](./pages/index.tsx) or [Leaderboard](./pages/leaderboard.tsx) instead

**2. "Credits show as 0"**

- **Cause**: Node hasn't earned rewards yet, OR Credits API offline
- **Indicator**: Check for "API OFFLINE" badge vs plain "0 Cr"

**3. "Health score dropped suddenly"**

- **Cause**: Credits API went offline → re-weighting shifted balance
- **Solution**: Score will stabilize when API returns

**4. "Map pins overlap"**

- **Cause**: Multiple nodes in same city
- **Solution**: Click any pin → Split view shows full list

**5. "Favorites disappeared"**

- **Cause**: localStorage cleared by browser/extension
- **Prevention**: Export favorites (future feature)

### 16.3 To force a network snapshot outside the 30-minute cron schedule (e.g., after a deployment), dispatch the GitHub Action manually:

```bash
gh workflow run monitor.yml
```

Learn more about [manually running GitHub Actions workflows](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow).

</details>

---

## 17. Future Enhancements

### Planned Features

1. **Alerts**: Email/SMS when node goes offline
2. **API Keys**: Rate-limited access for third-party apps
3. **Mobile App**: Native iOS/Android ([React Native](https://reactnative.dev/))

### Open Research Questions

1. **Optimal Re-Weighting**: Should Uptime get 45% or 40% during outages?
2. **Version Decay Curve**: Linear vs exponential penalty?
3. **Storage Bonus Cap**: 15 points or 20 points?
4. **Map Clustering**: Aggregate overlapping pins?

---

## 18. Contributing

### Code Standards

- **[TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)**: Enabled
- **[ESLint](https://eslint.org/)**: `next/core-web-vitals` ruleset
- **[Prettier](https://prettier.io/)**: 2-space indent, single quotes

### Testing Protocol

1. **Unit Tests**: Full coverage for `lib/` mathematics
2. **Integration Tests**: Navigation & Deep-linking coverage
3. **Automated Audits**: Hourly network integrity checks via CI/CD

### Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) Score | > 90 |

---

## 19. Credits

**Built by:** riot' ([@33xp_](https://twitter.com/33xp_))  
**Powered by:** Xandeum pRPC Network  
**License:** [MIT](./LICENSE)  
**Repository:** [github.com/Idle0x/xandeum-pulse](https://github.com/Idle0x/xandeum-pulse)

---

*Documentation is actively maintained. For code-level implementation details, refer to the source files linked within the README.*

*Documentation last updated: January 2026 (v2.0 Architecture)*

*For questions, [open an issue on GitHub](https://github.com/Idle0x/xandeum-pulse/issues) or reach out on [X](https://twitter.com/33xp_).*