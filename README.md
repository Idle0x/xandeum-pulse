# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Recharts](https://img.shields.io/badge/Recharts-2.5-22b5bf?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/Idle0x/xandeum-pulse/ci.yml?branch=main&label=Engineering%20Tests&style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-100%25-success?style=flat-square&logo=jest)

Real-time network monitor and high-fidelity analytics dashboard for the Xandeum distributed storage protocol.

**Live Dashboard:** https://xandeum-pulse.vercel.app  
**Technical Documentation:** [DOCUMENTATION.md](DOCUMENTATION.md)

![Homepage](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2Fhomepage.png)

---

## What is this?

Xandeum Pulse is a professional-grade monitoring and temporal intelligence platform for node operators. It transitions from a simple real-time fetcher to a comprehensive analytics suite, querying nodes directly via RPC for unfiltered network health, storage evolution, and financial performance without reliance on centralized databases for real-time truth.

**The core problem:** Node operators needed a way to:
- Monitor their node's performance relative to the network
- Identify geographic centralization risks
- Track reputation earnings without vendor lock-in
- Diagnose health issues before they impact rewards

**The solution:** A serverless Next.js application that aggregates data from multiple RPC endpoints, calculates normalized health scores, and presents actionable insights through an interactive UI.

**Core capabilities:**
- **Temporal Tracking:** 30-day historical trends for health, storage, and rank.
- **Resilient Telemetry:** Multi-layered RPC failover with a dedicated Circuit Breaker.
- **Financial Intelligence:** STOINC yield forecasting and hardware-based reward simulations.
- **Spatial Awareness:** Geographic distribution analysis with "King Node" selection and centralization risk detection.
- **Narrative Synthesis:** Algorithmic reporting that converts raw data into strategic insights.

**Quick Start:** Visit the [live site](https://xandeum-pulse.vercel.app), filter by network/IP/key, inspect nodes via deep-dive modals, and analyze fleet performance.

---

## System Architecture

### 1. Resilient RPC Orchestration (The "Hero-Swarm" Model)
Pulse employs a high-availability failover strategy to ensure 100% data visibility.
- **Hero Priority:** Targets a high-performance primary node with a 15-second patient timeout.
- **Circuit Breaker:** Automatically "trips" and bans dead or slow nodes for 60 seconds to prevent lag-cascades.
- **Swarm Race:** If the Hero fails, the system initiates a `Promise.any` race across 5+ backup nodes.
- **Passive Discovery:** Background worker constantly pings the swarm for new pods.

**Implementation:** [`src/lib/rpc-orchestrator.ts`](src/lib/rpc-orchestrator.ts)

### 2. Multi-Network Identity Resolution ("Identity Crisis" Protocol)

In distributed systems, a single operator may run multiple node instances (e.g., one Mainnet, one Devnet) using the same Public Key. A naive dashboard would merge these into a single corrupted entry.

Pulse implements a **3-System Matching Logic** to ensure atomic precision:
1.  **Primary Match:** Public Key
2.  **Context Match:** Network ID (Mainnet vs. Devnet)
3.  **Physical Match:** IP Address / Port

This ensures that "Sibling Nodes" are treated as distinct entities with their own metrics, ranking, and history.

**Test Verification:** [`__tests__/integration/navigation.test.tsx`](__tests__/integration/navigation.test.tsx) – *Scenario 5: Precision Targeting*

### 3. Stable ID v2
Solves the "identity paradox" of volatile network data using a Hybrid Persistence Layer.
- **3-Pillar Persistence:** Identity is calculated via Public Key + Network ID + IP.
- **Identity Hardening:** Strips volatile version strings to ensure history persists across node upgrades.
- **Result:** Sibling nodes are treated as distinct entities with independent rank and history.

**Test coverage:** [`__tests__/integration/navigation.test.tsx`](__tests__/integration/navigation.test.tsx)

### 4. Continuous Network Auditing (Temporal Watchman)
A standalone monitoring engine captures the network's state every 30 minutes via GitHub Actions.
- **Scope:** 100% of nodes on Mainnet and Devnet.
- **Hybrid Storage:** Real-time data remains volatile; snapshots persist to Supabase for 30-day trending.
- **Stability Ribbons:** Historical snapshots power a GitHub-style "DNA Strip" visualizing reliability.

**The Script:** [`scripts/health-check.ts`](scripts/health-check.ts)  
**The Workflow:** [`.github/workflows/monitor.yml`](.github/workflows/monitor.yml)

### 5. Vitality Score Algorithm

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

**Implementation:** [`lib/xandeum-brain.ts`](lib/xandeum-brain.ts) – `calculateVitalityScore()`

### 6. Data Enrichment & Narrative Pipeline
Transforms raw RPC telemetry into actionable intelligence.
- **Statistical Normalization:** Calculates Network Mean ($\mu$) and Standard Deviation ($\sigma$) for relative scoring.
- **Synthesis Engine:** Logic-driven narrative builder creating context-aware reports for 7 scenarios.
- **Geometric Economics:** Calculates STOINC stacking boosts (Era × NFT × Multiplier) to 8 decimal places.

**Implementation:** [`src/lib/xandeum-brain.ts`](src/lib/xandeum-brain.ts), [`src/lib/narrative-engine.ts`](src/lib/narrative-engine.ts)

### 7. Frontend State & Caching Architecture
Custom hooks manage the balance between real-time speed and historical depth using 15s server-side RAM caching, memoized filtering, and metric rotation.

**Supporting utilities:** [`src/utils/formatters.ts`](src/utils/formatters.ts), [`src/utils/nodeHelpers.ts`](src/utils/nodeHelpers.ts)

### 8. Geographic Resolution & Topological Selection

Displaying 1000+ nodes on a map requires smart aggregation.

#### Topological Representative Selection (The "King" Node)
When aggregating nodes by city (e.g., "Tokyo"), the system doesn't just pick a random node to represent the cluster. It runs a selection algorithm to identify the "King" node for that specific view mode:
* **Storage Mode:** Picks the node with the highest committed storage.
* **Credits Mode:** Picks the node with the highest lifetime earnings.

This ensures that clicking a map pin deep-links you to the *most relevant* node in that region, preserving the context of your investigation.

**Backend Logic:** [`pages/api/geo.ts`](pages/api/geo.ts)  
**Test Verification:** [`__tests__/api/geo.test.ts`](__tests__/api/geo.test.ts) – *See `KING SELECTION` test case*

#### Private IP Handling (Ghost Nodes)
Nodes behind VPNs or CGNAT return non-routable addresses. These are assigned coordinates `(0, 0)` and flagged so they contribute to global statistics but do not render as invalid map pins.

---

## Key Features

### 1. Dashboard – Executive Control Center
The primary interface for high-density fleet management.

- **Stats Overview:** Real-time capacity, vitality, and consensus with integrated 24h delta sparklines.
- **Cycle Logic:** Cards rotate metrics every 13s (Storage → Health → Uptime → Version → Last Seen) with Smart Rotation Lock on sort.
- **Zen Mode:** Minimalist OLED-black theme designed for 24/7 monitoring walls to reduce burn-in and CPU overhead.
- **Modals:** Deep-dive analytics for Capacity (Evolution), Vitals (Spectrum), and Consensus (Lifecycle buckets).
- **Dual view mode:** Toggles between grid or list display of nodes

**Components:** [`src/components/dashboard/`](src/components/dashboard/)

![Dashboard](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2Fdashboard.png)

### 2. Deep Node Inspection – Granular Diagnostics
Comprehensive diagnostic suite for individual node auditing.

- **Stability Ribbons:** 30-day "Barcode" visualization of historical health snapshots.
- **Spectra Analysis:** Real-time metrics overlaid against network-wide averages and medians.
- **Proof of Pulse:** Generates high-resolution PNG snapshots with QR codes for social verification.
- **Fleet Topology:** Visualizes where a node sits within its specific fleet.

**Components:** [`src/components/modals/InspectorModal.tsx`](src/components/modals/InspectorModal.tsx)

![Inspector Modal](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FInspector%20Modal.png)

### 3. Geographic Map – Spatial Intelligence
Visualizes physical infrastructure to identify centralization risks.

- **King Selection:** Automatically labels the "Dominant Node" in every city based on Storage, Credits, or Health.
- **D3 Mesh Topology:** Generates a deterministic network mesh showing peer-to-peer connectivity.
- **Split Drawer:** High-density list of all nodes within a selected region, including tier distribution.
- **Analytics:** Country-level breakdown and "Ghost" exclusion (VPN filtering).

**Backend:** [`pages/api/geo.ts`](pages/api/geo.ts)

![Network Topology](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FNetwork_Topology.png)

### 4. Leaderboard – Reputation & Earnings Forecasting
Tracks economic contribution and rank velocity.

- **Velocity Tracking:** 24-hour delta tracking with green/red rank momentum indicators.
- **Dual-Axis Growth:** Visualizes Total Credits (Accumulation) against Global Rank (Competition).
- **STOINC Simulator:** Step-by-step financial modeler for projecting credits based on hardware, Era, and NFT multipliers.
- **Historical Snapshot:** Recorded previous snapshots & data for the given node.

**Components:** [`src/components/leaderboard/`](src/components/leaderboard/)

![Credits & Reputation](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FCredits%20%26%20Reputation.png)

### 5. Node Comparison – Competitive Intelligence
Side-by-side fleet evaluation featuring the "Ghost Canvas" export system.

- **Multi-Node Analysis:** Compare up to 30 nodes against the network's "Metric Leaders."
- **Ghost Canvas Export:** A dedicated off-screen engine that renders pixel-perfect PNG reports, bypassing browser scrollbar truncation.
- **Synthesis Engine:** Provides a multi-sentence "War Room" summary of performance differentials.

**Components:** [`src/components/compare/`](src/components/compare/)

---

## Engineering Standards & Quality Assurance

**31 passing tests across 5 strategic suites:**

1.  **Economic Logic:** Verifies geometric stacking to 8 decimal places.
2.  **Identity Persistence:** Confirms Stable ID v2 logic across software version changes.
3.  **API Resilience:** Tests ghost node filtering and King node selection.
4.  **Resiliency Protocols:** Simulates RPC failures to verify Circuit Breaker logic.
5.  **Integration:** Validates navigation flows and deep linking.

**CI/CD Pipeline:**
- **CI Pipeline:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (Validation on Push/PR)
- **Temporal Monitor:** [`.github/workflows/monitor.yml`](.github/workflows/monitor.yml) (30-min snapshots)

---

## Project Structure

```
/
├── .github/workflows/            # CI (ci.yml) & 30-min Snapshots (monitor.yml)
├── __tests__/                    # 31 Tests (API, Integration, Lib, Pages)
│   ├── api/                      # geo.test.ts
│   ├── integration/              # navigation.test.tsx
│   └── lib/                      # Economics and Brain logic tests
├── scripts/
│   └── health-check.ts           # Network Watchman Engine
├── src/
│   ├── components/
│   │   ├── common/               # RadialProgress, Loaders, NetworkSwitcher
│   │   ├── compare/              # ComparisonUI, SynthesisEngine, GhostCanvas
│   │   ├── dashboard/            # StatsOverview, NodeCard, ZenCard
│   │   │   ├── cards/            # Capacity, Vitals, Consensus Modals
│   │   │   └── stats/            # Evolution & Distribution Charts
│   │   ├── leaderboard/          # NodeTable, StoincSimulator, GrowthChart
│   │   ├── map/                  # MapVisuals, LocationDrawer, KingSelection
│   │   └── modals/               # InspectorModal, ShareProofModal
│   ├── hooks/                    # useNetworkData, useNodeFilter, useDashboardStats
│   ├── lib/                      # rpc-orchestrator, narrative-engine, xandeum-brain
│   ├── pages/
│   │   ├── api/                  # stats.ts, geo.ts, credits.ts, debug.ts
│   │   ├── index.tsx             # Dashboard
│   │   ├── map.tsx               # Geographic map
│   │   ├── leaderboard.tsx       # Reputation rankings
│   │   └── compare.tsx           # Node comparison
│   ├── types/                    # EnrichedNode, NetworkHistory, Snapshot
│   └── utils/                    # formatters, nodeHelpers, mapConstants
├── DOCUMENTATION.md
├── package.json
└── README.md
```

---

## API Endpoints

### `GET /api/stats`
Enriched nodes + stats with 15s caching.
**Response:** `{ result: { pods: EnrichedNode[] }, stats: { ... } }`

### `GET /api/geo`
City-level aggregations with "King Node" metadata.
**Response:** `{ locations: LocationData[], stats: { ... } }`

### `GET /api/credits`
Proxied reputation data with strict 8s timeout handling.

### Other endpoints
- **`/api/debug`**: Developer-only diagnostics.
- **`/api/proxy`**: RPC forwarder.

---

## Running Locally

```bash
git clone [https://github.com/Idle0x/xandeum-pulse.git](https://github.com/Idle0x/xandeum-pulse.git)
cd xandeum-pulse
npm install
npm run dev     # http://localhost:3000
npm test        # Run 31 tests
```

**Optional env vars** (`.env.local`):
```env
NEXT_PUBLIC_CUSTOM_RPC_URL=[https://your-node.example.com:6000](https://your-node.example.com:6000)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DEBUG=true
```

---

## Tech Stack

- **Core:** Next.js 16 (Pages), React 18, TypeScript 5.0
- **Styling:** Tailwind 3.4, Lucide React
- **Data Visualization:** Recharts 2.5, React Simple Maps 3.0, D3 Scale
- **Data Handling:** Axios 1.6, geoip-lite, Supabase 2.38
- **Utilities:** html-to-image, Zod, Pino
- **Testing:** Jest 29, React Testing Library

---

## Strategic Design Decisions

- **Hybrid Persistence:** RPC provides "Live Truth"; Supabase serves as "Network Memory" (ribbons/history). No infrastructure costs.
- **Distributed Compute:** Scoring and narrative synthesis are performed Client-Side to parallelize load and maintain zero serverless cost.
- **Physical Fingerprinting:** A 7-point matching protocol isolates physical hardware from volatile metadata, ensuring node history remains persistent across software migrations.
- **OLED-First Engineering:** Zen Mode is a professional standard for reduced power consumption and burn-in prevention on 24/7 monitoring hardware.
- **Client-Side Geolocation:** Distributes limits and avoids timeouts with local fallbacks.

---

## Graceful Degradation

- **RPC Failure:** Circuit Breaker bans the node for 60s, instantly switching to the backup Swarm.
- **API Outage:** If the Credits API fails, the Vitality Score algorithm redistributes weights to prevent artificial score drops.
- **Cached Memory:** If all external sources fail, the UI falls back to the last known 15s RAM snapshot or 30m Supabase record.
- **Geolocation Limits:** Falls back to `geoip-lite` local database; toasts warn of VPNs.

---

## Known Limitations

- **Snapshot Frequency:** Trends are captured every 30 minutes; sub-minute spikes may be smoothed.
- **Geo-Accuracy:** Static IPs; VPNs are flagged and excluded from topology meshes.
- **No Websockets:** 15-30s polling is used to maintain a scalable, stateless serverless architecture.
- **Mobile:** Responsive but features limited hover capabilities.

---

## Contributing

1. Fork → Clone.
2. Branch → `git checkout -b feature/your-feature`.
3. Develop → Ensure strict TypeScript compliance and 100% test coverage.
4. Test → `npm test && npm run lint`.
5. Commit → Follow Conventional Commits.
6. PR → Push and create.

---

## FAQ

**Q: Geolocation accuracy?** A: ~85% static IPs. VPNs flagged/excluded.  
**Q: N/A credits?** A: API offline or zero.  
**Q: Customize RPC?** A: Edit file or env.  
**Q: Share details?** A: Links, PNG, exports.  
**Q: Mobile?** A: Responsive, touch-friendly.  
**Q: Debug scoring?** A: Enable DEBUG, /api/debug, logs.  
**Q: Real-time vs. historical?** A: RPC (15s cache) vs. Supabase (30-min snapshots).

---

## Further Reading

**[DOCUMENTATION.md](DOCUMENTATION.md)** – Technical deep-dive covering math models (sigmoid curves), synthesis logic, database schema, and optimization principles.

**Related:**
- [Xandeum Docs](https://docs.xandeum.com)
- [STOINC](https://xandeum.com/stoinc)

---

## License

MIT

---

## Author

**Built by riot** ([@33xp_](https://twitter.com/33xp_)) for Xandeum.

*Last updated: January 2026 (v2.0 – Full Coverage Release)*# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/Idle0x/xandeum-pulse/ci.yml?branch=main&label=Engineering%20Tests&style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-100%25-success?style=flat-square&logo=jest)

Real-time network monitor and analytics dashboard for the Xandeum distributed storage protocol.

**Live Dashboard:** https://xandeum-pulse.vercel.app  
**Documentation:** [Read the full DOCUMENTATION.md](DOCUMENTATION.md)

![Homepage](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2Fhomepage.png)

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

### 2. Multi-Network Identity Resolution ("Identity Crisis" Protocol)

In distributed systems, a single operator may run multiple node instances (e.g., one Mainnet, one Devnet) using the same Public Key. A naive dashboard would merge these into a single corrupted entry.

Pulse implements a **3-System Matching Logic** to ensure atomic precision:
1.  **Primary Match:** Public Key
2.  **Context Match:** Network ID (Mainnet vs. Devnet)
3.  **Physical Match:** IP Address / Port

This ensures that "Sibling Nodes" are treated as distinct entities with their own metrics, ranking, and history.

**Test Verification:** [`__tests__/integration/navigation.test.tsx`](__tests__/integration/navigation.test.tsx) – *Scenario 5: Precision Targeting*

---

### 3. Continuous Network Auditing (The Pulse Monitor)

Beyond a dashboard, this repository acts as an automated network watchdog. A standalone script runs hourly via GitHub Actions to audit the Xandeum API for data corruption.

- **Frequency:** Every 60 minutes (`0 * * * *`)
- **Scope:** Scans 100% of nodes on both Mainnet and Devnet
- **Checks:** Validates data schema integrity, non-null credit values, and API status codes

If the Xandeum data feed sends corrupted values (e.g., `credits: null` or negative storage), the system alerts maintainers immediately, preventing "silent failures" on the dashboard.

**The Script:** [`scripts/health-check.ts`](scripts/health-check.ts)  
**The Workflow:** [`.github/workflows/monitor.yml`](.github/workflows/monitor.yml)

---

### 4. Vitality Score Algorithm

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

**Implementation:** [`lib/xandeum-brain.ts`](lib/xandeum-brain.ts#L95-L155) – `calculateVitalityScore()`

---

### 5. Geographic Resolution & Topological Selection

Displaying 1000+ nodes on a map requires smart aggregation.

#### Topological Representative Selection (The "King" Node)
When aggregating nodes by city (e.g., "Tokyo"), the system doesn't just pick a random node to represent the cluster. It runs a selection algorithm to identify the "King" node for that specific view mode:
* **Storage Mode:** Picks the node with the highest committed storage.
* **Credits Mode:** Picks the node with the highest lifetime earnings.

This ensures that clicking a map pin deep-links you to the *most relevant* node in that region, preserving the context of your investigation.

**Backend Logic:** [`pages/api/geo.ts`](pages/api/geo.ts)  
**Test Verification:** [`__tests__/api/geo.test.ts`](__tests__/api/geo.test.ts) – *See `KING SELECTION` test case*

#### Private IP Handling (Ghost Nodes)
Nodes behind VPNs or CGNAT return non-routable addresses. These are assigned coordinates `(0, 0)` and flagged so they contribute to global statistics but do not render as invalid map pins.

---

## Key Features

### 1. Dashboard

The primary monitoring interface for node operators.

- **Cyclic metrics:** Cards rotate between Storage → Uptime → Health every 5 seconds to maximize data density without clutter
- **Visual mode toggle:** "Zen Mode" strips gradients/animations for OLED displays in 24/7 monitoring environments
- **Modular Components:** Critical UI elements like the [`RadialProgress`](components/RadialProgress.tsx) chart are abstracted for performance and isolated testing.

**Code:** [`pages/index.tsx`](pages/index.tsx)
- See `renderZenCard()` - [Lines 1049-1097](pages/index.tsx#L1049-L1097)

![Dashboard](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2Fdashboard.png)

### 2. Deep Node Inspection

Clicking any node opens a granular diagnostic modal designed for detailed analysis.
 * **Health Diagnostics:** Breaks down the Vitality Score into its weighted components.
 * **Storage Analytics:** Visualizes committed capacity against the network median.
 * **Head to Head Comparison:** Evaluates two nodes side-by-side to identify performance differentials.
 * **Proof of Pulse:** Generates a PNG snapshot of the node's current metrics for social sharing.
 * **Identity Panel:** Exposes full metadata including RPC endpoints and version consensus.

**Code:** [`pages/index.tsx`](pages/index.tsx)
- See `renderComparisonRow` - [Line 900-933](pages/index.tsx#L900-L933) - (Versus Mode)
- See `handleDownloadProof()` - [Lines 800-814](pages/index.tsx#L800-L814) - (Proof Generation)

![Inspector Modal](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FInspector%20Modal.png)

### 3. Geographic Map

Visualizes the physical distribution of network infrastructure.

- **Dynamic thresholds:** Color tiers are calculated from live percentiles rather than hardcoded values.
- **Deep Linking:** Supports direct navigation via URL parameters (e.g., `?focus=1.2.3.4`) to instantly lock onto a specific node's physical location.

**Code:** [`pages/map.tsx`](pages/map.tsx)  
**Test Verification:** [`__tests__/pages/map.test.tsx`](__tests__/pages/map.test.tsx) – *Verifies deep linking and D3 rendering*

![Network Topology](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FNetwork_Topology.png)

### 4. Leaderboard

Reputation tracking and earnings forecasting.

- **Earnings simulator:** Input hardware specs to estimate rewards based on geometric stacking of multipliers (Era boosts × NFT boosts).
- **Identity bridging:** Merges anonymous blockchain addresses with physical node IPs.

**Code:** [`pages/leaderboard.tsx`](pages/leaderboard.tsx)
- See `calculateFinal()` - [Lines 197-201](pages/leaderboard.tsx#L163-L167)

![Credits & Reputation](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FCredits%20%26%20Reputation.png)

---

## Engineering Standards & Quality Assurance

This project maintains a professional-grade testing environment with **31 passing tests** across 5 distinct suites, covering Logic, UI, API, and Integration layers.

### Crash Protocols (Resilience)
We explicitly test for network failures. If the Xandeum RPC or Credits API goes offline, the UI is verified to gracefully degrade to "Cached Mode" or display specific error badges rather than crashing.
- See [`__tests__/lib/xandeum-brain.test.ts`](__tests__/lib/xandeum-brain.test.ts)

### Geometric Precision (Economics)
The **Stoinc Simulator** uses verified geometric stacking logic for NFT boosts. Unit tests confirm that multipliers compound correctly and that edge cases are clamped to prevent financial calculation errors.
- See [`__tests__/lib/xandeum-economics.test.ts`](__tests__/lib/xandeum-economics.test.ts)

### Spatial Logic Verification
Backend tests ensure that the aggregation logic correctly identifies high-value nodes ("Kings") in a city while filtering out "Ghost Nodes" (VPNs) to prevent map corruption.
- See [`__tests__/api/geo.test.ts`](__tests__/api/geo.test.ts)

### UI & Integration
We simulate full user journeys, including clicking through from the Leaderboard to the Map and ensuring deep links preserve state.
- See [`__tests__/integration/navigation.test.tsx`](__tests__/integration/navigation.test.tsx)

---

## Project Structure

```
/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Automated Test Pipeline
│       └── monitor.yml      # Hourly Network Health Check
│
├── __tests__/               # Engineering Test Suite (31 Tests)
│   ├── integration/         # Deep-link & Routing verification
│   ├── lib/                 # Unit tests for Math & Logic
│   ├── api/                 # Backend logic verification
│   └── pages/               # UI rendering tests
│
├── components/              # Reusable UI Blocks
│   ├── RadialProgress.tsx   # Health score visualization
│   └── WelcomeCurtain.tsx   # Intro animation
│
├── scripts/
│   └── health-check.ts      # Standalone API Auditor
│
├── pages/
│   ├── index.tsx            # Dashboard UI
│   ├── map.tsx              # Geographic visualizer
│   ├── leaderboard.tsx      # Reputation rankings
│   └── api/                 # Serverless Functions
│
├── lib/
│   ├── xandeum-brain.ts     # Vitality scoring + failover logic
│   └── xandeum-economics.ts # Stoinc Simulator math engine
│
└── types/                   # Shared TypeScript Definitions
```

---

## API Endpoints

### `GET /api/stats`
Returns an enriched list of all nodes with calculated health scores.

### `GET /api/geo`
Returns city-level aggregations for map rendering with "King" node metadata.

### `GET /api/credits`
Proxies the upstream rewards oracle with a strict timeout to prevent UI blocking.

---

## Running Locally

```bash
git clone [https://github.com/Idle0x/xandeum-pulse.git](https://github.com/Idle0x/xandeum-pulse.git)
cd xandeum-pulse
npm install
npm run dev     # Start development server
npm test        # Run the full engineering test suite
```

Open http://localhost:3000

No environment variables required – RPC endpoints are configured in `lib/xandeum-brain.ts`.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library (Unit & Integration)
- **CI/CD:** GitHub Actions (CI + Cron Monitoring)
- **Maps:** React Simple Maps + D3 Scale
- **Charts:** Recharts
- **Imaging:** html-to-image (Snapshot generation)
- **Data fetching:** Axios with Promise-based failover
- **Deployment:** Vercel (serverless functions)

---

## Design Decisions

### Why client-side geolocation instead of backend?

Initially, all geocoding happened in API routes. This caused two problems:
- Vercel's 10-second function timeout would fail on large node lists
- IP-based rate limits applied to the server IP, not per-user

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

## Graceful Degradation

When external dependencies fail, the UI adapts rather than breaking:

- **Credits API failure detection:** Instead of showing stale data or "N/A", the interface displays "CREDITS API OFFLINE" with a warning icon, making it clear the issue is upstream, not with Pulse itself
- **Automatic score re-weighting:** When credits data is unavailable, the Vitality Score algorithm redistributes the 20% reputation weight to other components, ensuring nodes aren't penalized for API downtime

---

## Known Limitations

- **No historical data:** All metrics are point-in-time snapshots (by design – shows current network state)
- **IP geolocation accuracy:** ~50-100km margin of error for most providers
- **No authentication:** Anyone can view any node's data (intentional for network transparency)

---

## Further Reading

For a deep dive into the system's engineering—including the "Identity Crisis" resolution protocols, mathematical scoring models, automated auditing workflows, and version consensus algorithms—please check out the full technical documentation:

**[DOCUMENTATION.md](DOCUMENTATION.md)**

---

## License

MIT

---

## Author

Built by riot (@33xp_) for the Xandeum ecosystem.

For questions or contributions, open an issue on GitHub