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

![Homepage]([https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FPulse%20Home.png)

---

<details open>
<summary><strong>What is this?</strong></summary>

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

</details>

---

<details open>
<summary><strong>System Architecture</strong></summary>

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

</details>

---

<details open>
<summary><strong>Key Features</strong></summary>

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

![Inspector Modal](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FInspection%20Modal.png)

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

![Credits & Reputation](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FReputation%20Statistics%20%26%20History.png)

### 5. Node Comparison – Competitive Intelligence

Side-by-side fleet evaluation featuring the "Ghost Canvas" export system.

- **Multi-Node Analysis:** Compare up to 30 nodes against the network's "Metric Leaders."
- **Ghost Canvas Export:** A dedicated off-screen engine that renders pixel-perfect PNG reports, bypassing browser scrollbar truncation.
- **Synthesis Engine:** Provides a multi-sentence "War Room" summary of performance differentials.

**Components:** [`src/components/compare/`](src/components/compare/)

![Credits & Reputation](https://github.com/Idle0x/xandeum-pulse/blob/main/Screenshots%2FComparative%20Intelligence.png)

</details>

---

<details open>
<summary><strong>Engineering Standards & Quality Assurance</strong></summary>

## Engineering Standards & Quality Assurance

### Test Suite & Coverage

The Xandeum Pulse codebase is governed by a suite of 36 automated tests across 7 core domains, ensuring mathematical accuracy and UI stability.

* **Spatial Intelligence API** – Validates backend GeoJSON aggregation, node grouping by city/country, and "King Node" selection logic.
* **Component Visual Logic** – Ensures modal views (Health, Storage, Identity) correctly render conditional UI states and health breakdowns.
* **Inspector Integration** – Tests end-to-end dashboard flows, including navigation to the reputation leaderboard and API offline error handling.
* **Unit Logic** – Verifies the core Vitality Algorithm, including sigmoid uptime penalties and version distance scoring.
* **Economics Logic** – Hardens the Stoinc reward simulator, specifically testing geometric NFT boost stacking and fleet-wide scaling math.
* **Map UI & Deep Linking** – Validates interactive map markers, data-view toggles (Storage/Credits), and focus-locking via URL parameters.
* **Utility Formatters** – Ensures precision in human-readable data conversion for bytes, uptime durations, and SemVer comparisons.

**CI/CD Pipeline:**

- **CI Pipeline:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (Validation on Push/PR)
- **Temporal Monitor:** [`.github/workflows/monitor.yml`](.github/workflows/monitor.yml) (30-min snapshots)

</details>

---

<details>
<summary><strong>Project Structure</strong></summary>

## Project Structure

```
/
├── .github/workflows/
│   ├── ci.yml                    # Test pipeline
│   └── monitor.yml               # 30-min Snapshots (Temporal Watchman)
├── __tests__/                    # 31 tests
│   ├── api/                      # geo.test.ts
│   ├── integration/              # navigation.test.tsx
│   ├── lib/                      # xandeum-economics.test.ts, xandeum-brain.test.ts
│   └── pages/                    # map.test.tsx
├── Screenshots/
├── public/
├── scripts/
│   └── health-check.ts           # Network Watchman
├── src/
│   ├── components/
│   │   ├── common/               # RadialProgress, Loaders, NetworkSwitcher, WelcomeCurtain
│   │   ├── compare/              # ComparisonUI, CompareControls, SynthesisEngine, GhostCanvas
│   │   ├── dashboard/            # NodeCard, ZenCard, StatsOverview
│   │   │   ├── cards/            # CapacityModal, VitalsModal, ConsensusModal
│   │   │   └── stats/            # CapacityEvolutionChart, VersionDistributionChart
│   │   ├── layout/               # Header, Footer
│   │   ├── leaderboard/          # NodeTable, StoincSimulator, GrowthChart, VelocityRibbon
│   │   ├── map/                  # MapVisuals, MapHeader, LocationDrawer, CountryBreakdown
│   │   └── modals/               # InspectorModal, ShareProofModal
│   │       └── views/            # HealthView, StorageView, IdentityView
│   ├── hooks/                    # useNetworkData, useNodeFilter, useDashboardStats, useCardCycle, useStoincSimulator
│   ├── lib/                      # rpc-orchestrator, xandeum-brain, xandeum-economics, narrative-engine, supabase
│   ├── pages/
│   │   ├── api/                  # stats.ts, geo.ts, credits.ts, debug.ts, hello.ts, proxy.ts
│   │   ├── index.tsx             # Dashboard
│   │   ├── map.tsx               # Geographic map
│   │   ├── leaderboard.tsx       # Reputation rankings
│   │   └── compare.tsx           # Node comparison
│   ├── types/                    # Type definitions
│   └── utils/                    # formatters, nodeHelpers, mapConstants, historyAggregator
├── .gitignore
├── DOCUMENTATION.md
├── README.md
├── package.json
└── (configs)
```

</details>

---

<details>
<summary><strong>API Endpoints</strong></summary>

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

</details>

---

<details>
<summary><strong>Running Locally</strong></summary>

## Running Locally

```bash
git clone https://github.com/Idle0x/xandeum-pulse.git
cd xandeum-pulse
npm install
npm run dev     # http://localhost:3000
npm test        # Run 31 tests
```

**Optional env vars** (`.env.local`):

```env
NEXT_PUBLIC_CUSTOM_RPC_URL=https://your-node.example.com:6000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DEBUG=true
```

</details>

---

<details>
<summary><strong>Tech Stack</strong></summary>

## Tech Stack

- **Core:** [Next.js](https://nextjs.org/) 16 (Pages), [React](https://react.dev/) 18, [TypeScript](https://www.typescriptlang.org/) 5.0
- **Styling:** [Tailwind](https://tailwindcss.com/) 3.4, [Lucide React](https://lucide.dev/)
- **Data Visualization:** [Recharts](https://recharts.org/) 2.5, [React Simple Maps](https://www.react-simple-maps.io/) 3.0, [D3 Scale](https://d3js.org/)
- **Data Handling:** [Axios](https://axios-http.com/) 1.6, [geoip-lite](https://github.com/geoip-lite/node-geoip), [Supabase](https://supabase.com/) 2.38
- **Utilities:** [html-to-image](https://github.com/bubkoo/html-to-image), [Zod](https://zod.dev/), [Pino](https://getpino.io/)
- **Testing:** [Jest](https://jestjs.io/) 29, [React Testing Library](https://testing-library.com/react)

</details>

---

<details>
<summary><strong>Strategic Design Decisions</strong></summary>

## Strategic Design Decisions

- **Hybrid Persistence:** RPC provides "Live Truth"; Supabase serves as "Network Memory" (ribbons/history). No infrastructure costs.
- **Distributed Compute:** Scoring and narrative synthesis are performed Client-Side to parallelize load and maintain zero serverless cost.
- **Physical Fingerprinting:** A 7-point matching protocol isolates physical hardware from volatile metadata, ensuring node history remains persistent across software migrations.
- **OLED-First Engineering:** Zen Mode is a professional standard for reduced power consumption and burn-in prevention on 24/7 monitoring hardware.
- **Client-Side Geolocation:** Distributes limits and avoids timeouts with local fallbacks.

</details>

---

<details>
<summary><strong>Graceful Degradation</strong></summary>

## Graceful Degradation

- **RPC Failure:** Circuit Breaker bans the node for 60s, instantly switching to the backup Swarm.
- **API Outage:** If the Credits API fails, the Vitality Score algorithm redistributes weights to prevent artificial score drops.
- **Cached Memory:** If all external sources fail, the UI falls back to the last known 15s RAM snapshot or 30m Supabase record.
- **Geolocation Limits:** Falls back to `geoip-lite` local database; toasts warn of VPNs.

</details>

---

<details>
<summary><strong>Known Limitations</strong></summary>

## Known Limitations

- **Snapshot Frequency:** Trends are captured every 30 minutes; sub-minute spikes may be smoothed.
- **Geo-Accuracy:** Static IPs; VPNs are flagged and excluded from topology meshes.
- **No Websockets:** 15-30s polling is used to maintain a scalable, stateless serverless architecture.
- **Mobile:** Responsive but features limited hover capabilities.

</details>

---

<details>
<summary><strong>Contributing</strong></summary>

## Contributing

1. Fork → Clone.
2. Branch → `git checkout -b feature/your-feature`.
3. Develop → Ensure strict TypeScript compliance and 100% test coverage.
4. Test → `npm test && npm run lint`.
5. Commit → Follow [Conventional Commits](https://www.conventionalcommits.org/).
6. PR → Push and create.

</details>

---

<details>
<summary><strong>FAQ</strong></summary>

## FAQ

**Q: Geolocation accuracy?**  
A: ~85% static IPs. VPNs flagged/excluded.

**Q: N/A credits?**  
A: API offline or zero.

**Q: Customize RPC?**  
A: Edit file or env.

**Q: Share details?**  
A: Links, PNG, exports.

**Q: Mobile?**  
A: Responsive, touch-friendly.

**Q: Debug scoring?**  
A: Enable DEBUG, `/api/debug`, logs.

**Q: Real-time vs. historical?**  
A: RPC (15s cache) vs. Supabase (30-min snapshots).

</details>

---

## Further Reading

**[DOCUMENTATION.md](DOCUMENTATION.md)** – Technical deep-dive covering math models (sigmoid curves), synthesis logic, database schema, and optimization principles.

**Related:**
- [Xandeum Docs](https://docs.xandeum.network)
- [STOINC](https://www.xandeum.network/stoinc)

---

## License

MIT

---

## Author

**Built by riot** ([@33xp_](https://twitter.com/33xp_)) for Xandeum.

*Last updated: January 2026 (v2.0 – Full Coverage Release)*
