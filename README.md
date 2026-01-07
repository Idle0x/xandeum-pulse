# Xandeum Pulse

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Live-green?style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/Idle0x/xandeum-pulse/ci.yml?branch=main&label=Engineering%20Tests&style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-100%25-success?style=flat-square&logo=jest)

Real-time network monitor and analytics dashboard for the Xandeum distributed storage protocol.

**check it out:** https://xandeum-pulse.vercel.app

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

## License

MIT

---

## Author

Built by riot (@33xp_) for the Xandeum ecosystem.

For questions or contributions, open an issue on GitHub.
