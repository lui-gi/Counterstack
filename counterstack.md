# CounterStack — Complete Technical Reference

> Exhaustive documentation for rebuilding CounterStack from scratch.
> Every screen, every route, every prompt, every state variable, every config file.

---

## Table of Contents

1. [What the App Is — Full Tech Stack](#1-what-the-app-is--full-tech-stack)
2. [How the App Boots](#2-how-the-app-boots)
3. [Every Screen and Component](#3-every-screen-and-component)
4. [Analyze Mode — Deep Dive](#4-analyze-mode--deep-dive)
5. [Simulate Mode — Deep Dive](#5-simulate-mode--deep-dive)
6. [Every Backend Route](#6-every-backend-route)
7. [Every Gemini Call](#7-every-gemini-call)
8. [Full Data Flow ASCII Diagrams](#8-full-data-flow-ascii-diagrams)
9. [All State Management](#9-all-state-management)
10. [Annotated Folder/File Tree](#10-annotated-folderfile-tree)
11. [Every Environment Variable and Config File](#11-every-environment-variable-and-config-file)

---

## 1. What the App Is — Full Tech Stack

### What It Is

CounterStack is a **poker-themed cybersecurity posture dashboard**. Organizations upload their NIST CSF (Cybersecurity Framework) profile or answer a security questionnaire; the backend uses **Google Gemini AI** to score the organization across four security domains (called "suits") on a 1–13 scale. The frontend evaluates these four ranks as a **poker hand** to produce an overall posture score and label (High Card → Royal Flush).

The app has two primary modes:
- **Analyze Mode (SOC Dashboard):** Real-world posture display. Shows live CISA KEV CVEs, AI-powered threat analysis, suit-level recommendations, magician readings, and a 5-year roadmap.
- **Simulate Mode:** A card-based game where the player uses security action cards to defeat cybersecurity threats, with a posture dial showing the organization's health in real-time.

### The Four Suits (Security Domains)

| Suit Key | Symbol | Display Name | Sub-label | Domain | NIST Mapping |
|---|---|---|---|---|---|
| `clover` | ♣ | RESOURCES | Baseline Health | Asset visibility, patching, hygiene | Identify + Detect |
| `spade` | ♠ | OFFENSIVE | Detection & Contain | Detection maturity, SOC ops, containment | Respond |
| `diamond` | ♦ | HARDEN | Hardening & Access | Access control, hardening, zero trust | Protect |
| `heart` | ♥ | RESILIENCE | Backup & Continuity | Backup, DR, business continuity | Recover |

### Account Tiers

| Tier Key | Display Name | Features |
|---|---|---|
| `dealers` | Dealer's House | Basic posture dashboard |
| `underground` | Underground Table | + Historical data |
| `convention` | Convention Floor | + Splunk & CrowdStrike integrations panel |

### Full Tech Stack

#### Backend
| Technology | Version | Role |
|---|---|---|
| Node.js | 20+ (ESM) | Runtime |
| TypeScript | 5.9.x | Language |
| Express | 5.2.1 | HTTP framework |
| PostgreSQL | 16 | Primary database |
| `pg` | 8.20.0 | PostgreSQL client |
| bcrypt | 6.0.0 | Password hashing (12 rounds) |
| jsonwebtoken | 9.0.3 | JWT auth (7-day expiry) |
| multer | 1.4.5 | File upload middleware |
| cors | 2.8.6 | CORS headers |
| dotenv | 17.3.1 | Environment variable loading |
| Google Gemini API | `gemini-3.1-flash-lite-preview` | AI analysis |

#### Frontend
| Technology | Version | Role |
|---|---|---|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Language |
| Vite | 8.0.0-beta.13 | Build tool + dev server (:5173) |
| Tailwind CSS | 4.2.1 | Utility CSS framework |
| framer-motion | 12.x | Animations |
| FontAwesome | 7.2.0 | Icons (shuffle, magnifying glass) |
| Custom CSS (`counterstack.css`) | — | Cyberpunk theme, glassmorphism |

#### Infrastructure
| Component | Details |
|---|---|
| Database | PostgreSQL 16 installed locally |
| Port | 5432 |
| Credentials | user: `counterstack` / pass: `counterstack_dev` / db: `counterstack` |
| Backend port | 4000 |
| Frontend port | 5173 (dev) |

---

## 2. How the App Boots

### Backend Boot Sequence

1. **Entry point:** `backend/src/index.ts`
2. `dotenv.config()` loads `backend/.env`
3. Express app created
4. CORS middleware configured — origin from `FRONTEND_URL` (default `http://localhost:5173`)
5. JSON body parser mounted with 5MB limit
6. All routes mounted under `/api` via `src/routes/index.ts`
7. Server starts listening on `PORT` (default 4000)
8. Console log: `CounterStack API running on http://localhost:4000`

**Database is NOT auto-connected on boot.** The PostgreSQL pool (`src/db/pool.ts`) creates a `pg.Pool` from `DATABASE_URL` — it connects lazily on first query. Run `npm run db:migrate` separately to create tables.

**Services connected on first use:**
- PostgreSQL: on first route that hits the DB
- Gemini API: on first `/api/posture/*` request

```bash
# Full boot sequence
cd backend && npm run db:migrate  # Create tables (one-time)
cd backend && npm run dev         # Start API with hot reload
cd frontend && npm run dev        # Start Vite dev server
```

### Frontend Boot Sequence

1. **Entry point:** `frontend/index.html` → loads `src/main.tsx`
2. React 19 `createRoot` mounts `<App />` into `#root`
3. `App.tsx` renders: checks `onboarded` state
4. On first load, `onboarded = false` → renders `<SOCDashboard onboarded={false} …/>`
5. `SOCDashboard` immediately renders the `<Onboarding />` overlay
6. Background effects start: noise, scanlines, gridbg, ambience divs render
7. CISA KEV fetch fires in `useEffect` on `SOCDashboard` mount (50 CVEs from GitHub)
8. Clock ticks every second
9. Jira mock stats update every 30 seconds
10. Port percentages update every 10 seconds

### Startup Screen

The startup screen is the **Onboarding overlay** rendered inside `SOCDashboard` when `onboarded === false`. It shows 4 large cards:
- **GUEST** — skip account creation, go straight to Simulation Mode with tutorial
- **CREATE ACCOUNT** — full registration flow
- **LOG IN** — existing account login
- **🃏 JOKER** — random entry (picks random path)

The dark background shows the full SOCDashboard behind a semi-transparent overlay, giving users a preview of the app.

---

## 3. Every Screen and Component

### Screens

#### `App.tsx` — Root Router
Single-file state machine. No router library — switching modes is pure React state.

**State:**
| Variable | Type | Default | Purpose |
|---|---|---|---|
| `onboarded` | boolean | false | Has onboarding been completed? |
| `mode` | `'soc' \| 'simulation'` | `'soc'` | Which mode is active |
| `orgProfile` | `Record<string, unknown> \| null` | null | Org security profile data |
| `accountData` | `AccountData \| null` | null | User + org metadata from auth |
| `socRanks` | `Record<string, number>` | `{}` | The four suit ranks |
| `isTutorial` | boolean | false | Whether to show tutorial overlay |

**Routing logic:**
```
!onboarded || mode === 'soc'  →  <SOCDashboard>
mode === 'simulation'         →  <SimulationMode>
```

When `handleOnboarded` is called with no `account` (guest), mode is set to `'simulation'` automatically.

---

#### `pages/SOCDashboard.tsx` — Analyze Mode Main Page

The largest component (~500 lines). Renders the full cyberpunk dashboard grid.

**Layout structure (CSS Grid):**
```
┌─────────────────────────────────────────────────────────┐
│                      TOP BAR                            │
├──────────────┬──────────────────────┬───────────────────┤
│  LEFT COL    │     CENTER HUB       │    RIGHT COL      │
│ (Integrations│  (4 suit cards +     │ (Joker Analysis + │
│  Panel —     │   Joker card center) │  Magician Reading │
│  convention  │                      │  + active panel)  │
│  tier only)  │                      │                   │
└──────────────┴──────────────────────┴───────────────────┘
```

**All state variables:**

| Variable | Type | Purpose |
|---|---|---|
| `ranks` | `Record<string,number>` | Current {clover,spade,diamond,heart} ranks |
| `prevPostureHand` | `string\|null` | For detecting hand upgrade animation |
| `postureAnimate` | boolean | Triggers "POSTURE UPGRADE" CSS animation |
| `activeSuit` | `string\|null` | Which suit card is expanded |
| `flippingSuits` | `Record<string,boolean>` | Cards currently mid-flip animation |
| `showIR` | boolean | Incident Room modal visible |
| `showPostureExplainer` | boolean | PostureExplainer panel visible |
| `showMagicianReading` | boolean | MagicianReading panel visible |
| `selectedHandCards` | `string[]` | Hand card highlight selection |
| `showFiveYearPlan` | boolean | FiveYearPlan panel visible |
| `showAnalyzeIntro` | boolean | AnalyzeIntro default panel visible |
| `time` | string | Live clock HH:MM:SS |
| `cveList` | `ScoredCve[]` | All 50 scored CVEs |
| `activeCve` | `ScoredCve\|null` | Currently selected CVE |
| `cveLoading` | boolean | CVE fetch in progress |
| `jokerFlipped` | boolean | Joker card expanded state |
| `cveSearchInput` | string | Text in CVE search box |
| `showCveInput` | boolean | CVE search dropdown visible |
| `geminiThreatPct` | `number\|null` | Gemini-analyzed threat % for active CVE |
| `geminiReasoning` | string | Gemini reasoning text |
| `geminiAnalyzing` | boolean | Gemini CVE analysis in-flight |
| `suitAnalysisCache` | `Record<string, SuitAnalysisCache>` | Cached Gemini recs per suit |
| `hoveredPort` | `string\|null` | Hovered port in mock data |
| `jiraUnresolved` | number | Mock Jira ticket counter (starts 24) |
| `jiraInProgress` | number | Mock Jira in-progress counter (starts 11) |
| `portPcts` | `number[]` | 7 port traffic percentages |
| `updatedPortIdxs` | `number[]` | Recently updated ports (for flash animation) |

**Computed values (not state, derived on render):**
- `posture = computePosture(ranks)` → `{hand, tier, score, royal, desc}`
- `optimalHand = computeOptimalHand(ranks)` → `{targetRanks, targetHand, targetScore, isAlreadyOptimal}`
- `avgRank` → average of 4 ranks
- `threatPressure = max(18, 92 - (avgRank-5)×6)` → background threat animation intensity
- `cveSearchResults` → filtered CVE list based on search input (memoized)

**Effects:**
1. CISA KEV fetch on mount → `fetchCisaKevData(50)` → scores all CVEs → sets `cveList`
2. Gemini CVE analysis when `activeCve` or `orgProfile` changes → calls `analyzeCveThreat`
3. Click-outside handler for Joker card collapse
4. Clock tick: `setInterval(1000)` → updates `time`
5. Jira mock: `setInterval(30000)` → random ticket events
6. Port pcts: `setInterval(10000)` → random 2-port redistribution
7. Threat pressure animation: `setTimeout(40ms)` spring animation loop
8. Posture hand change detection → triggers upgrade animation

---

#### `app/SimulationMode.tsx` — Simulate Mode Wrapper

Thin wrapper. Two child components swap on `started` state:

```
started=false  →  <SimulationIntro onStart={() => setStarted(true)} />
started=true   →  <SimulationTable onBack={() => onModeChange('soc')} />
```

On unmount (leaving simulation), `MusicManager.stop()` is called to kill all audio.

---

### Components

#### `components/SuitCard.tsx`
Renders one of the four suit cards in the hub.

**Props:**
- `suitKey` — `'clover'|'spade'|'diamond'|'heart'`
- `cfg` — `SuitConfig` object (sym, name, sub, color, dark, glow, pos)
- `rank` — 1–13
- `active` — boolean (expanded/highlighted state)
- `dimmed` — boolean (other suit is active, this one fades)
- `flipping` — boolean (card flip animation)
- `onClick` — click handler

**What it renders:**
- Styled card div with suit color glow
- `<CardArt>` SVG overlay (rank-specific art)
- Hologram shimmer layer (`jc-holo`)
- Rank display and suit symbol
- Active state border highlight

---

#### `components/SuitDashboard.tsx`
Expanded suit detail panel. Appears in the right column when a suit card is clicked.

**Props:** suitKey, cfg, rank, onClose, allRanks, aiAnalysis, onRequestAnalysis, hasOrgProfile

**Sections:**
1. **Header** — suit symbol, name, rank badge (A/2-10/J/Q/K), progress bar
2. **Metrics row** — 4 `SuitMetric` cards (key, value, raw %, trend arrow)
3. **AI Recommendations** — "MAGICIAN" label with ✨ icon; shows loading state or 4 bulleted recommendations + reasoning paragraph
4. **Three columns:**
   - **Capabilities** — static list of security controls in this domain
   - **Risk Exposure** — risks with color-coded severity (high=`#f72585`, medium=`#ff9f1c`, low=`#39d353`)
   - **Upgrade Path** — steps to reach next rank
5. **Posture History** — `<PostureChart>` sparkline for all 4 suits

If `!hasOrgProfile`, the AI Recommendations section shows a "Connect org profile to unlock Magician analysis" prompt instead of recommendations.

---

#### `components/CardArt.tsx`
SVG renderer for suit art. Each suit has rank-specific artwork variants. Pure visual component, no state.

---

#### `components/JokerCardSVG.tsx`
Animated SVG Joker card. Used in the hub center. Handles the glitch animation when threat level exceeds 80%.

---

#### `components/PostureChart.tsx`
Sparkline chart component. Shows trend lines for all 4 suits using historical rank data from `HISTORY` in `gameData.ts`. Color-coded per suit.

---

#### `components/CrowdStrikeIdentityChart.tsx`
Bar/gauge visualization for CrowdStrike Identity mock data. Rendered inside IntegrationsPanel for convention tier.

---

#### `components/layout/Onboarding.tsx`
Multi-phase wizard. The first thing users see.

**Phases in order:**

| Phase | Description |
|---|---|
| `landing` | 4 entry cards: Guest / Create Account / Log In / Joker |
| `tier` | Tier selector: Dealer's House / Underground Table / Convention Floor |
| `account` | Form: name, email, password |
| `org` | Org name, industry, employee count, infra type |
| `integrations` | Integration toggle (Splunk, CrowdStrike) — convention tier only |
| `confirm` | Review summary before submit |
| `posture` | Choose posture method: Upload NIST JSON or Answer Questionnaire |
| `uploading` | Shows spinner while Gemini analyzes uploaded file |

**Auth flow from onboarding:**
1. `POST /api/auth/register` → get JWT token
2. `POST /api/orgs` → create org (with Bearer token)
3. `POST /api/orgs/:orgId/profiles/upload` or `/onboarding` → save profile
4. `GET /api/orgs/:orgId/profiles/latest` → fetch ranks
5. Call `onDone(ranks, profile, accountData)`

**Guest path:** Calls `onDone` immediately with `INIT_RANKS` and no profile/account, which routes to Simulation Mode.

---

#### `components/layout/IncidentRoom.tsx`
Full-screen modal for CVE deep dive.

**What it shows:**
- CVE ID, name, CVSS score badge
- Affected vendor / product
- Threat % progress bar (Gemini `geminiThreatPct` if available, else formula-based)
- CWE tags mapped to color-coded attack surface labels
- Gemini reasoning (3 sentences)
- Containment checklist

---

#### `components/layout/MagicianReading.tsx`
Right-column panel showing the holistic Gemini assessment. Renders:
- 2–3 sentence executive summary
- 3 strengths (green bullets)
- 3 weaknesses (red bullets)

Triggered by "MAGICIAN'S READING" button in the right sidebar. Calls `analyzeMagicianReading` API.

---

#### `components/layout/FiveYearPlan.tsx`
Right-column panel displaying the Gemini-generated 5-year ASCII roadmap timeline. Pre-formatted monospace text with Unicode box-drawing characters. Triggered via "5-YEAR PLAN" button.

---

#### `components/layout/PostureExplainer.tsx`
Modal/panel explaining how poker hands map to posture scores. Shows the full hand hierarchy with multipliers.

---

#### `components/layout/AnalyzeIntro.tsx`
Default right-panel state shown after onboarding when no suit is selected. Intro text explaining the dashboard.

---

#### `components/layout/AlertsFeed.tsx`
Live-updating mock alerts display. Simulates incoming security events with timestamps.

---

#### `components/layout/IntegrationsPanel.tsx`
Left column panel, convention tier only. Shows:
- Splunk mock data (event counts, log sources)
- CrowdStrike mock data (`MOCK_CROWDSTRIKE_DATA`) including identity chart
- Integration health status badges

---

#### `components/layout/Icons.tsx`
Shared SVG icon components used across the app.

---

#### `simulation/ui/SimulationIntro.tsx`
Pre-game intro screen showing:
- Imported ranks from Analyze Mode (each suit displayed as a card)
- Tutorial overlay (step-by-step instructions) if `isTutorial=true`
- `[ SIMULATE ]` button to start the game

---

#### `simulation/ui/SimulationTable.tsx`
The main simulation game UI. Full-screen cyberpunk game board.

**What it renders:**
- **Posture dial** (5-level gauge: SECURE/STABLE/STRAINED/CRITICAL/BREACHED)
- **Resource bars** — Health (0–100), Mana (0–100), Strength (0–100, decays −10/turn)
- **Active threat card** — name, description, HP bar, evasion %, behavior badge, CVE tag
- **Player's hand** — 5 cards, each showing suit symbol, rank, action name, mana cost
- **Combat log** — scrollable list of turn events with severity colors
- **FOLD button** — discard hand, redraw (limited uses)
- **Black Hat Jackpot button** — visible but locked until turn 13, one-time use
- **Back to Analyze** button

---

#### `simulation/audio/MusicManager.ts`, `AudioEngine.ts`, `SfxPlayer.ts`
Audio subsystem. `MusicManager` manages background tracks per game phase. `SfxPlayer` plays one-shot effects for card plays, damage, victory. `AudioEngine` wraps the Web Audio API context. All stopped when leaving simulation mode.

---

## 4. Analyze Mode — Deep Dive

### How It Starts

1. Onboarding completes → `handleOnboarded(ranks, profile, account)` called
2. `App.tsx` sets `onboarded=true`, mode stays `'soc'`
3. `SOCDashboard` re-renders with `onboarded=true`
4. Onboarding overlay disappears
5. If profile was uploaded: `showAnalyzeIntro = true` (shows AnalyzeIntro panel in right col)
6. CISA KEV fetch fires immediately (if not already running)

### Every UI Element in Analyze Mode

**Top Bar (`.topbar`, 3-column grid):**
- Left: CounterStack logo icon + tier badge (color-coded) + POSTURE label + hand name + score — clicking POSTURE opens PostureExplainer
- Center: ANALYZE / SIMULATE toggle buttons
- Right: "SOC ONLINE" status dot + "1 CRITICAL ACTIVE" pulsing indicator + live clock + "⬡ INCIDENT ROOM" button

**Left Column (`.left-col`):**
- `IntegrationsPanel` if `accountData.tier === 'convention'` and integrations are configured
- Empty otherwise

**Center Hub (`.hub panel`):**
- 3 concentric ring divs (`.hub-ring-outer/mid/inner`) — CSS animation creates orbit effect
- 4 suit card slots positioned at top/left/right/bottom
- Each slot: suit label + `SuitCard` component
- Center: Joker card container (`.joker-container`)
  - Side buttons appear when Joker is expanded: SHUFFLE (random CVE) + SELECT (search dropdown)
  - Joker card itself: clicking toggles `jokerFlipped` state
  - When `jokerFlipped=true`: card expands, side buttons slide in
  - Search dropdown: filters `cveList` client-side by CVE ID or name, max 8 results
  - Threat level label below card (color transitions lavender→red based on threat %)
  - CSS glitch animation when threat > 80%

**Right Column (`.right-col`):**
- **Joker Analysis panel** — active CVE details (ID, name, CVSS, vendor, product, threat bar, risk label, reasoning hint)
- **Magician's Reading panel** — org metadata display + "OPEN MAGICIAN'S READING" button
- **Active panel** (mutually exclusive):
  - `SuitDashboard` when a suit is selected
  - `MagicianReading` when showMagicianReading=true
  - `FiveYearPlan` when showFiveYearPlan=true
  - `PostureExplainer` when showPostureExplainer=true
  - `IncidentRoom` when showIR=true
  - `AnalyzeIntro` when showAnalyzeIntro=true (default after onboarding)

### Data Fetched

1. **CISA KEV** — on mount, `fetchCisaKevData(50)`:
   - URL: GitHub raw content at `known_exploited_vulnerabilities.json`
   - Sorted by `dateAdded` DESC, top 50 entries
   - Normalized from CISA format to app format
   - CVSS estimated via `estimateCvssScore()` (base 7.5, +1.5 ransomware, +1.5 RCE, etc.)
   - All 50 scored locally via `scoreAllCves(cves, DEFAULT_ORG_PROFILE)`
   - First CVE auto-selected as `activeCve`
   - Falls back to 5 hardcoded CVEs (Log4Shell, PAN-OS, etc.) on network error

2. **Gemini CVE threat** — on `activeCve` or `orgProfile` change:
   - Only fires if both `activeCve` AND `orgProfile` are non-null
   - If guest (no orgProfile): formula-based score shown, no Gemini call

3. **Gemini suit analysis** — lazy, on-demand per suit:
   - Fires when user clicks a suit card AND hasn't been fetched yet for this CVE
   - Cache keyed by suit key, cleared when `activeCve` changes

### How Gemini Is Called (Analyze Mode)

#### CVE Threat Analysis
Triggered by: `activeCve` + `orgProfile` both non-null

Frontend → `analyzeCveThreat(cve, orgProfile)` in `services/geminiPosture.ts`
→ `POST http://localhost:4000/api/posture/cve-threat`
→ Backend `analyzeCveThreatLevel` controller
→ `gemini.analyzeCveThreat(cve, orgProfile)`
→ Gemini API

#### Suit Analysis
Triggered by: user opens SuitDashboard AND `!suitAnalysisCache[suitKey]`

Frontend → `analyzeSuitDomain(suit, orgProfile)` in `services/geminiPosture.ts`
→ `POST http://localhost:4000/api/posture/suit-analysis`
→ Backend `analyzeSuitDomain` controller
→ `gemini.analyzeSuit(suit, orgProfile)`
→ Gemini API

#### Magician Reading
Triggered by: user clicks "OPEN MAGICIAN'S READING" button

Frontend → `analyzeMagicianReading(orgProfile, ranks)` in `services/geminiPosture.ts`
→ `POST http://localhost:4000/api/posture/magician-reading`
→ Backend `analyzeMagicianReadingHandler` controller
→ `gemini.analyzeMagicianReading({orgProfile, ranks})`
→ Gemini API

#### Five Year Plan
Triggered by: user clicks "5-YEAR PLAN" button in FiveYearPlan component

Frontend → `analyzeFiveYearPlan(input)` in `services/geminiPosture.ts`
→ `POST http://localhost:4000/api/posture/five-year-plan`
→ Backend `analyzeFiveYearPlanHandler` controller
→ `gemini.analyzeFiveYearPlan(input)`
→ Gemini API

### How Responses Are Displayed

- **CVE threat %**: Updates `geminiThreatPct` state → Joker card label + Joker Analysis panel + IncidentRoom
- **Suit analysis**: Updates `suitAnalysisCache[suitKey]` → SuitDashboard AI Recommendations section
- **Magician reading**: Passed as props to `<MagicianReading>` component
- **5-year plan**: Passed as props to `<FiveYearPlan>` component (rendered as pre-formatted monospace)

---

## 5. Simulate Mode — Deep Dive

### How It Starts

1. User clicks `○ SIMULATE` in the top bar toggle
2. `App.tsx` `onModeChange('simulation')` → `mode = 'simulation'`
3. `App.tsx` renders `<SimulationMode>` with `initialRanks` from Analyze Mode
4. `SimulationMode` renders `<SimulationIntro>` (started=false)
5. User clicks `[ SIMULATE ]` in the intro → `setStarted(true)`
6. `MusicManager` starts background audio
7. `<SimulationTable>` mounts with `initialRanks`

### User Controls

| Control | Action |
|---|---|
| Click a hand card | Play that card (execute its effect) |
| FOLD button | Discard current hand, draw 5 new cards (limited uses) |
| BLACK HAT JACKPOT | One-time use at turn ≥13. Spin for random effect |
| Back to Analyze | `onBack()` → `onModeChange('soc')`, stops music |

### How the Simulation Runs Step by Step

The simulation is a state machine driven by `SimPhase`. Each phase transitions to the next:

```
threat-appears → draw → choose → resolve → enemy-respond → posture-update
      ↑                                                              ↓
      └──────────────────────── (next turn) ────────────────────────┘
                                                    ↓ (if health=0)
                                                 defeat
                                                    ↓ (if threat hp=0)
                                                 victory → next threat
```

**Phase details:**

**`threat-appears`**
- `difficultyForTurn(turn)` → `easy` (≤3) / `medium` (≤7) / `hard` (≤12) / `elite` (13+)
- `selectThreat(difficulty)` picks from `THREAT_CATALOG`
  - 30% chance at hard/elite to spawn a special boss threat
- Threat set as `activeThreat`
- Log entry added

**`draw`**
- `fillHand(state)` draws cards from deck until hand has 5
- If deck runs out: `discardPile` is shuffled back into deck (full deck = 52 cards: 4 suits × 13 ranks)
- Each card has `manaCost` (Diamonds always cost mana; Spades rank ≥10 cost mana)

**`choose`**
- Player sees their hand (5 cards)
- Clicks a card → transitions to `resolve`
- Has `extraTurnAvailable`: can play second card if Diamond procs

**`resolve`**
- Dispatches to the correct resolution function based on active threat's `specialMechanic`:
  - No special mechanic → normal `resolveCardPlay(state, card)`
  - `system-patch` → `resolveSystemPatch(state, card)` — only Spades allowed
  - `rootkit-trojan` → `resolveRootkit(state, card)` — need 7 Diamonds to expose
  - `ai-adapter` → `resolveAiAdapter(state, card)` — Spades do 0 damage

**Normal card effects by suit:**

| Suit | Effect | Formula |
|---|---|---|
| ♠ Spades | Attack threat | `damage = power × (1 − evasion)` |
| ♣ Clubs | Restore mana | `manaGained = power × 0.8` |
| ♥ Hearts | Heal health + restore mana | `healthGained = power × 1.5`, `+mana bonus` |
| ♦ Diamonds | +strength, 10% block next attack, 20% extra turn | `strength += power / 4` |

**`enemy-respond`**
- `chooseThreatBehavior(threat, resources)` selects behavior:
  - If mana < 20 and can Escalate → Escalate
  - If health < 30 and can Exploit → Exploit
  - Otherwise weighted random: Exploit 40%, Escalate 25%, Spread 20%, Hide 15%
- `executeThreatBehavior()` applies the chosen behavior:
  - **Exploit** — deal `attackPower` damage (Strength absorbs first, then Health)
  - **Escalate** — permanently increase `attackPower` by 5
  - **Spread** — spawn secondary threat in `threatQueue` (easy/hard severity down one tier)
  - **Hide** — increase evasion by 0.15, max 0.8
- AI Adapter special: regen 8 HP after behavior (`applyAiAdapterRegen`)

**`posture-update`**
- `applyTurnDecay(resources)` → Strength −10 (min 0)
- Jackpot check: if turn ≥ 13 → `jackpotAvailable = true`
- Win check: if `activeThreat.hp === 0` → `victory` phase
- Lose check: if `resources.health === 0` → `defeat` phase
- Spawned threat from queue? → becomes next `activeThreat`
- Otherwise: `turn++`, back to `threat-appears`

### Special Boss Mechanics

**System Patch Window (hard/elite, 30% chance)**
- HP: 45, Attack: 14, Evasion: 0
- Mechanic: Playing any non-Spade card → immediate `compromised` game over
- Strategy: Only play Spades until this threat is killed

**Rootkit Trojan (elite)**
- HP: 90, Attack: 16, Evasion: 1.0 (fully immune to Spades while hidden)
- Mechanic: Play 7 Diamond cards to expose → evasion drops to 0 → Spades deal 3× damage
- Strategy: Stack Diamonds first, then unleash Spades

**AI Adapter (elite)**
- HP: 60, Attack: 18, Regen: +8 HP/turn
- Mechanic: Completely immune to Spades. Hearts/Clubs/Diamonds still work for resources.
- Only kill: Black Hat Jackpot `instant-disruption` or `massive-attack`

### Black Hat Jackpot (Turn 13)

Unlocks at turn 13. One-time use. Spinning randomly selects from 5 effects:

| Effect | Description |
|---|---|
| `massive-attack` | 40 damage to active threat, ignores evasion |
| `instant-disruption` | Fully neutralize current threat (HP → 0) |
| `resource-recovery` | Restore all resources to 80 (Health, Mana, Strength) |
| `double-turn` | Player takes two card actions this turn |
| `backfire` ⚠️ | Threat escalates twice (+10 attackPower), player takes damage |

### No Gemini Calls in Simulate Mode

Simulate Mode has **no Gemini API calls**. It is entirely deterministic/algorithmic.

---

## 6. Every Backend Route

All routes are prefixed with `/api`. File: `backend/src/routes/index.ts`.

### Authentication Routes — `backend/src/routes/auth.ts`

#### `POST /api/auth/register`
**Purpose:** Create a new user account.
**Auth:** None (public)

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Jane Doe"
}
```

**Response 201:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "created_at": "2026-03-26T..."
  },
  "token": "eyJhbGci..."
}
```

**Errors:** 400 (missing fields, email taken), 500 (DB error)

---

#### `POST /api/auth/login`
**Purpose:** Authenticate and receive JWT.
**Auth:** None (public)

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response 200:**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "token": "eyJhbGci..."
}
```

**Errors:** 400 (missing fields), 401 (invalid credentials), 500

---

#### `GET /api/auth/me`
**Purpose:** Get currently authenticated user.
**Auth:** Required (Bearer JWT)

**Response 200:**
```json
{
  "id": "uuid",
  "email": "...",
  "name": "...",
  "created_at": "..."
}
```

**Errors:** 401 (no/invalid token), 404 (user not found)

---

### Organization Routes — `backend/src/routes/orgs.ts`

All require `Authorization: Bearer <token>`.

#### `POST /api/orgs`
**Purpose:** Create a new organization.

**Request body:**
```json
{
  "name": "Acme Corp"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "owner_id": "user-uuid",
  "name": "Acme Corp",
  "created_at": "..."
}
```

---

#### `GET /api/orgs`
**Purpose:** List all orgs owned by the authenticated user.

**Response 200:**
```json
[
  { "id": "uuid", "name": "Acme Corp", "created_at": "..." }
]
```

---

#### `GET /api/orgs/:id`
**Purpose:** Get a specific org (must be owner).

**Response 200:** Single org object
**Errors:** 403 (not owner), 404 (not found)

---

#### `DELETE /api/orgs/:id`
**Purpose:** Delete org (must be owner). Cascades to all org_profiles.

**Response 200:** `{ "message": "Organization deleted" }`
**Errors:** 403, 404

---

### Profile Routes — `backend/src/routes/profiles.ts`

All require `Authorization: Bearer <token>`.

#### `POST /api/orgs/:orgId/profiles/upload`
**Purpose:** Upload a NIST CSF JSON file → Gemini analyzes → stores ranks.
**Content-Type:** `multipart/form-data`
**File field:** `profile` (JSON file)

**Process:**
1. Verify `req.user.userId` owns the org
2. Parse uploaded JSON file
3. Call `gemini.analyzeOrgProfile(json)`
4. INSERT into `org_profiles` with `source='upload'`, `ranks`, `summary`

**Response 201:**
```json
{
  "id": "profile-uuid",
  "org_id": "org-uuid",
  "source": "upload",
  "ranks": { "clover": 9, "diamond": 11, "heart": 8, "spade": 10 },
  "summary": "Your org has strong access controls..."
}
```

**Errors:** 400 (no file, invalid JSON), 403, 500 (Gemini error)

---

#### `POST /api/orgs/:orgId/profiles/onboarding`
**Purpose:** Save questionnaire answers as a profile (no Gemini call — ranks from client).

**Request body:**
```json
{
  "answers": { "mfaEnabled": true, "patchingCycle": "weekly", ... },
  "ranks": { "clover": 7, "diamond": 8, "heart": 6, "spade": 9 }
}
```

**Response 201:** Profile object with `source='onboarding'`

---

#### `GET /api/orgs/:orgId/profiles`
**Purpose:** List all profiles for an org, newest first.

**Response 200:** Array of profile objects

---

#### `GET /api/orgs/:orgId/profiles/latest`
**Purpose:** Get most recent profile for org.

**Response 200:** Single profile object
**Response 404:** `{ "error": "No profiles found" }`

---

### Posture Analysis Routes — `backend/src/routes/posture.ts`

**No authentication required.** All public endpoints.

#### `POST /api/posture/analyze`
**Purpose:** Analyze org profile → return 4 suit ranks.

**Request body:**
```json
{
  "profile": { /* NIST CSF JSON or any org security data */ }
}
```

**Response 200:**
```json
{
  "clover": 9,
  "diamond": 11,
  "heart": 8,
  "spade": 10,
  "summary": "Your organization has strong hardening controls..."
}
```

**Errors:** 400 (`profile` missing), 500 (Gemini error)

---

#### `POST /api/posture/cve-threat`
**Purpose:** Calculate how vulnerable this specific org is to a specific CVE.

**Request body:**
```json
{
  "cve": {
    "cveId": "CVE-2021-44228",
    "name": "Log4Shell",
    "description": "Apache Log4j2 JNDI remote code execution...",
    "cvssScore": 10.0,
    "affectedVendor": "Apache",
    "affectedProduct": "Log4j2",
    "knownRansomware": true
  },
  "orgProfile": { /* org security profile */ }
}
```

**Response 200:**
```json
{
  "threatPct": 73,
  "reasoning": "Your organization uses Apache infrastructure, increasing exposure. The 73% threat level reflects strong MFA but incomplete EDR coverage. However, Log4Shell's JNDI injection vector bypasses network perimeter controls entirely."
}
```

**Required CVE fields:** `cveId`, `name`, `description`, `cvssScore`, `affectedVendor`, `affectedProduct`
**Errors:** 400 (missing fields), 500 (Gemini error)

---

#### `POST /api/posture/suit-analysis`
**Purpose:** Get 4 actionable recommendations for a specific security domain.

**Request body:**
```json
{
  "suit": {
    "suitKey": "clover",
    "suitName": "RESOURCES",
    "currentRank": 7,
    "activeCve": { /* optional CVE object */ }
  },
  "orgProfile": { /* org security profile */ }
}
```

**Response 200:**
```json
{
  "recommendations": [
    "Deploy automated patch management for all 47 legacy endpoints",
    "Expand EDR coverage to subnet 10.0.4.x",
    "Schedule bi-weekly vulnerability scans",
    "Implement continuous compliance monitoring for CIS benchmarks"
  ],
  "reasoning": "RESOURCES is your weakest domain with 12 unpatched critical CVEs creating immediate exposure."
}
```

**Required suit fields:** `suitKey`, `suitName`, `currentRank`
**Errors:** 400, 500

---

#### `POST /api/posture/magician-reading`
**Purpose:** Holistic executive-level assessment across all 4 domains.

**Request body:**
```json
{
  "orgProfile": { /* org security profile */ },
  "ranks": { "clover": 7, "spade": 9, "diamond": 8, "heart": 6 }
}
```

**Response 200:**
```json
{
  "summary": "Your organization demonstrates strong detection capability but faces critical gaps in resilience and resource hygiene...",
  "strengths": [
    "OFFENSIVE domain shows mature SOC operations with 94% containment rate",
    "HARDEN domain benefits from 96% MFA enforcement and active zero trust rollout",
    "Backup infrastructure achieves 99.4% success rate with tested DR procedures"
  ],
  "weaknesses": [
    "RESILIENCE recovery time (99min RTO) exceeds industry targets by 2×",
    "RESOURCES has 12 unpatched critical CVEs outstanding for >30 days",
    "No 24/7 SOC coverage creates detection gaps during off-hours windows"
  ]
}
```

**Errors:** 400 (missing/invalid ranks), 500

---

#### `POST /api/posture/five-year-plan`
**Purpose:** Generate ASCII 5-year security roadmap.

**Request body:**
```json
{
  "ranks": { "clover": 7, "spade": 9, "diamond": 8, "heart": 6 },
  "targetRanks": { "clover": 11, "spade": 11, "diamond": 11, "heart": 11 },
  "currentHand": "ONE PAIR",
  "targetHand": "ROYAL FLUSH",
  "currentScore": 52,
  "targetScore": 100,
  "orgName": "Acme Corp",
  "industry": "Healthcare"
}
```

**Response 200:**
```json
{
  "timeline": "YEAR 1: FOUNDATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ♣  Deploy automated patch management...\n..."
}
```

**Errors:** 400 (missing required fields), 500

---

#### `GET /api/health`
**Purpose:** Simple health check.
**Response 200:** `{ "status": "ok" }`

---

## 7. Every Gemini Call

All calls use the same model and endpoint:
- **Model:** `gemini-3.1-flash-lite-preview`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent`
- **Auth:** API key as URL query param `?key=<GEMINI_API_KEY>`
- **Request format:** `POST` with `Content-Type: application/json`, body: `{ contents: [{ parts: [{ text: prompt }] }] }`

---

### Call 1: `analyzeOrgProfile`
**File:** `backend/src/services/gemini.ts`
**Called from:** Upload profile route, `/api/posture/analyze`

**Exact prompt template:**
```
You are a cybersecurity posture analyst. Given the following NIST CSF organization profile, score each of these four security domains on a scale of 1 (critical risk) to 13 (excellent):
- resources: visibility and detection maturity (NIST Identify + Detect)
- harden: access control and defense depth (NIST Protect)
- resilience: backup and continuity readiness (NIST Recover)
- offsec: incident response capability and threat containment (NIST Respond — higher score = BETTER response)

Respond ONLY with a JSON object like:
{"resources": 9, "harden": 11, "resilience": 8, "offsec": 10, "summary": "...one sentence..."}

Profile:
${JSON.stringify(json, null, 2)}
```

**Response parsing:**
1. Extract `data.candidates[0].content.parts[0].text`
2. Try regex matches in order:
   - ` ```json\s*([\s\S]*?)``` `
   - ` ```\s*([\s\S]*?)``` `
   - `(\{[\s\S]*?\})`
3. Strip trailing commas: `.replace(/,(\s*[}\]])/g, '$1')`
4. `JSON.parse(cleaned)`
5. Clamp each value: `Math.max(1, Math.min(13, Math.round(Number(v))))`
6. Map: `resources→clover`, `harden→diamond`, `resilience→heart`, `offsec→spade`

**Error handling:** Throws if no JSON block found. Controller returns 500.

**Returns:** `{ clover, diamond, heart, spade, summary }`

---

### Call 2: `analyzeCveThreat`
**File:** `backend/src/services/gemini.ts`
**Called from:** `/api/posture/cve-threat`

**Exact prompt template:**
```
You are a cybersecurity threat analyst. Given a specific CVE and an organization's security profile, calculate how vulnerable this organization is to this specific CVE.

CVE Details:
- ID: ${cve.cveId}
- Name: ${cve.name}
- Description: ${cve.description}
- CVSS Score: ${cve.cvssScore}/10
- Affected Vendor: ${cve.affectedVendor}
- Affected Product: ${cve.affectedProduct}
${cve.knownRansomware ? '- WARNING: Known to be used in ransomware campaigns' : ''}

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Analyze:
1. Does this organization use the affected vendor/product?
2. How well do their security controls mitigate this type of vulnerability?
3. What is their detection and response capability for this threat?
4. How critical would this vulnerability be to their business?

Respond ONLY with a JSON object:
{"threatPct": <0-100>, "reasoning": "<2-3 sentences>"}

Where threatPct is how vulnerable THIS organization is to THIS CVE:
- 0-30: Low threat (don't use affected product, or strong mitigations)
- 31-60: Medium threat (partial exposure or decent controls)
- 61-80: High threat (uses affected product with gaps in controls)
- 81-100: Critical threat (direct exposure with weak defenses)

For the reasoning field, provide exactly 3 sentences:
1. First sentence: Brief assessment of the organization's exposure to this CVE
2. Second sentence: Explain WHY the specific threat percentage was assigned based on the organization's security posture
3. Third sentence: Explain why the threat level cannot be 0% (or lower than the assigned percentage). What characteristic of this vulnerability, attack vector, or inherent risk prevents full mitigation?
```

**Response parsing:** Same regex chain as Call 1.
**Post-processing:** `Math.max(0, Math.min(100, Math.round(Number(parsed.threatPct))))`

**Returns:** `{ threatPct: number, reasoning: string }`

---

### Call 3: `analyzeSuit`
**File:** `backend/src/services/gemini.ts`
**Called from:** `/api/posture/suit-analysis`

**Suit descriptions injected into prompt:**
```
clover  → "RESOURCES - Baseline visibility, asset hygiene, patch compliance, vulnerability management"
spade   → "OFFSEC - Detection capability, SOC operations, containment, threat hunting"
diamond → "HARDEN - Hardening, access control, zero trust, privileged access management"
heart   → "RESILIENCE - Backup readiness, disaster recovery, business continuity, RTO/RPO"
```

**Exact prompt template:**
```
You are a cybersecurity analyst specializing in ${suitDescriptions[suit.suitKey]}.

Given this organization's security profile and their current ${suit.suitName} rank of ${suit.currentRank}/13, provide 4 specific, actionable recommendations to improve this domain.
${cveContext}  ← injected if activeCve present

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Respond ONLY with a JSON object:
{
  "recommendations": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3",
    "Specific action 4"
  ],
  "reasoning": "One sentence explaining the overall priority for this domain"
}

Make recommendations specific to the organization's actual gaps. Reference specific metrics from their profile. If there's an active CVE, consider how it relates to this domain.
```

**CVE context block (when activeCve present):**
```
Active Threat Context:
- CVE: ${suit.activeCve.cveId}
- Name: ${suit.activeCve.name}
- Description: ${suit.activeCve.description}
- CVSS: ${suit.activeCve.cvssScore}/10
- Vendor: ${suit.activeCve.affectedVendor}
- Product: ${suit.activeCve.affectedProduct}
```

**Response parsing:** Same regex chain.
**Post-processing:** `slice(0, 4)`, stringify each recommendation.

**Returns:** `{ recommendations: string[], reasoning: string }`

---

### Call 4: `analyzeMagicianReading`
**File:** `backend/src/services/gemini.ts`
**Called from:** `/api/posture/magician-reading`

**Exact prompt template:**
```
You are a senior cybersecurity strategist providing a holistic assessment of an organization's security posture across all four domains.

Current Domain Ranks (1=critical risk, 13=excellent):
- RESOURCES (asset visibility, patching, hygiene): ${ranks.clover}/13
- OFFSEC (detection maturity, SOC coverage, containment): ${ranks.spade}/13
- HARDEN (access control, hardening, zero trust): ${ranks.diamond}/13
- RESILIENCE (backup, disaster recovery, business continuity): ${ranks.heart}/13

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Provide a holistic executive-level reading of this organization's overall security posture. Identify the 3 most significant strengths and 3 most significant weaknesses across ALL domains combined.

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence executive overview of the overall security posture",
  "strengths": [
    "Specific strength 1 referencing domain and evidence from the profile",
    "Specific strength 2 referencing domain and evidence from the profile",
    "Specific strength 3 referencing domain and evidence from the profile"
  ],
  "weaknesses": [
    "Specific weakness 1 with actionable insight",
    "Specific weakness 2 with actionable insight",
    "Specific weakness 3 with actionable insight"
  ]
}
```

**Response parsing:** Same regex chain.
**Post-processing:** `slice(0, 3)` on strengths and weaknesses.

**Returns:** `{ summary: string, strengths: string[], weaknesses: string[] }`

---

### Call 5: `analyzeFiveYearPlan`
**File:** `backend/src/services/gemini.ts`
**Called from:** `/api/posture/five-year-plan`

**Exact prompt template:**
```
You are a senior cybersecurity strategist${orgLabel}${industryLabel}. Generate a 5-year roadmap to improve security posture from [${currentHand} | ${currentScore}/100] to [${targetHand} | ${targetScore}/100].

Current domain ranks:
♣ RESOURCES (Asset visibility, patching): ${ranks.clover}/13
♠ OFFSEC (Detection, SOC coverage): ${ranks.spade}/13
♦ HARDEN (Access control, hardening): ${ranks.diamond}/13
♥ RESILIENCE (Backup, DR, continuity): ${ranks.heart}/13

Target domain ranks:
♣ RESOURCES: ${targetRanks.clover}/13
♠ OFFSEC: ${targetRanks.spade}/13
♦ HARDEN: ${targetRanks.diamond}/13
♥ RESILIENCE: ${targetRanks.heart}/13

Output a text-based 5-year timeline. Use Unicode arrows and box-drawing characters (→, ─, │, ▼, ►, ━) to visually connect steps between years. Each year has 2-4 concrete initiatives. Show how each year's work feeds the next using vertical arrows. Output ONLY the plain text timeline — no JSON, no markdown fences, no backticks.

Format:
YEAR 1: THEME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ♣  [initiative]
  ♠  [initiative]
                          │
                          ▼
YEAR 2: THEME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ...continue for all 5 years
```

**Response parsing (different from others):**
Raw text is stripped of markdown fences directly:
```typescript
const timeline = raw.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
```
No JSON parsing needed — returns plain text directly.

**Returns:** `{ timeline: string }`

---

## 8. Full Data Flow ASCII Diagrams

### Analyze Mode — Profile Upload Flow

```
Browser                  Frontend              Backend              Gemini
  │                          │                    │                    │
  │ Upload NIST JSON          │                    │                    │
  │──────────────────────────>│                    │                    │
  │                          │ POST /api/orgs/     │                    │
  │                          │ :orgId/profiles/    │                    │
  │                          │ upload              │                    │
  │                          │────────────────────>│                    │
  │                          │                    │ analyzeOrgProfile() │
  │                          │                    │────────────────────>│
  │                          │                    │                    │ Score 4 domains
  │                          │                    │<────────────────────│
  │                          │                    │ {resources,harden,  │
  │                          │                    │  resilience,offsec} │
  │                          │                    │ INSERT org_profiles  │
  │                          │<────────────────────│                    │
  │                          │ {clover,diamond,    │                    │
  │                          │  heart,spade,summary}                   │
  │                          │                    │                    │
  │ setRanks(result)          │                    │                    │
  │ computePosture(ranks)     │                    │                    │
  │ → hand, score, tier       │                    │                    │
  │──────────────────────────>│                    │                    │
  │                          │                    │                    │
  │ Render SOCDashboard       │                    │                    │
  │ with scored suit cards    │                    │                    │
  │<──────────────────────────│                    │                    │
```

### Analyze Mode — CVE Threat Analysis Flow

```
Browser (SOCDashboard)       Frontend Services     Backend              Gemini
  │                              │                   │                    │
  │ Mount (useEffect)             │                   │                    │
  │──────────────────────────────>│                   │                    │
  │                              │ fetchCisaKevData() │                    │
  │                              │ → GitHub raw JSON  │                    │
  │                              │──────────────────────────────────────>  │
  │                              │ 50 CVE entries     │                    │
  │                              │<──────────────────────────────────────  │
  │                              │ scoreAllCves(cves, DEFAULT_ORG_PROFILE) │
  │                              │ → formula-based scores                  │
  │ setCveList(scored)            │                   │                    │
  │ setActiveCve(scored[0])       │                   │                    │
  │<──────────────────────────────│                   │                    │
  │                              │                   │                    │
  │ activeCve+orgProfile changed  │                   │                    │
  │──────────────────────────────>│                   │                    │
  │                              │ analyzeCveThreat() │                    │
  │                              │ POST /api/posture/ │                    │
  │                              │ cve-threat         │                    │
  │                              │──────────────────>│                    │
  │                              │                   │ analyzeCveThreat() │
  │                              │                   │──────────────────>│
  │                              │                   │                   │ Analyze exposure
  │                              │                   │<──────────────────│
  │                              │                   │ {threatPct, reason}│
  │                              │<──────────────────│                    │
  │ setGeminiThreatPct(n)         │                   │                    │
  │ setGeminiReasoning(text)      │                   │                    │
  │<──────────────────────────────│                   │                    │
  │ Update Joker card color       │                   │                    │
  │ Update Joker Analysis panel   │                   │                    │
```

### Analyze Mode — Suit Analysis Flow (Lazy)

```
User                   SOCDashboard          Backend              Gemini
  │                         │                   │                    │
  │ Click suit card          │                   │                    │
  │────────────────────────>│                   │                    │
  │                         │ setActiveSuit(k)   │                    │
  │                         │ Open SuitDashboard │                    │
  │                         │                   │                    │
  │ SuitDashboard mounts     │                   │                    │
  │ → onRequestAnalysis()    │                   │                    │
  │ (if !cache[suitKey])     │                   │                    │
  │────────────────────────>│                   │                    │
  │                         │ setSuitAnalysisCache │                  │
  │                         │ {loading: true}    │                    │
  │                         │ analyzeSuitDomain()│                    │
  │                         │ POST /api/posture/ │                    │
  │                         │ suit-analysis      │                    │
  │                         │──────────────────>│                    │
  │                         │                   │ analyzeSuit()      │
  │                         │                   │──────────────────>│
  │                         │                   │                   │ 4 recommendations
  │                         │                   │<──────────────────│
  │                         │<──────────────────│                    │
  │                         │ setSuitAnalysisCache│                   │
  │                         │ {recs, reasoning, loading:false}       │
  │                         │ Render in SuitDashboard AI section     │
  │<────────────────────────│                   │                    │
```

### Simulate Mode — Turn Flow

```
SimulationTable (useSimulation hook)
  │
  ├─ turn starts
  │     │
  │     ├─ difficultyForTurn(turn) → ThreatDifficulty
  │     ├─ selectThreat(difficulty) → SimThreat
  │     │     30% chance boss at hard/elite
  │     └─ phase: 'threat-appears'
  │
  ├─ 'draw' phase
  │     ├─ fillHand() → draw cards to 5
  │     └─ deck empty? shuffle discardPile back
  │
  ├─ 'choose' phase
  │     └─ player clicks card → dispatch
  │
  ├─ 'resolve' phase
  │     ├─ activeThreat.specialMechanic?
  │     │     'system-patch'   → resolveSystemPatch()
  │     │     'rootkit-trojan' → resolveRootkit()
  │     │     'ai-adapter'     → resolveAiAdapter()
  │     │     null             → resolveCardPlay()
  │     │
  │     └─ card effects:
  │           ♠ Spades  → damage = power × (1 − evasion)
  │           ♣ Clubs   → mana += power × 0.8
  │           ♥ Hearts  → health += power × 1.5
  │           ♦ Diamonds→ strength += power/4, 10% block, 20% extraTurn
  │
  ├─ 'enemy-respond' phase
  │     ├─ chooseThreatBehavior() → behavior
  │     │     mana<20 && can escalate → escalate
  │     │     health<30 && can exploit → exploit
  │     │     else → weighted random
  │     │
  │     ├─ executeThreatBehavior()
  │     │     exploit   → deal attackPower dmg (strength absorbs first)
  │     │     escalate  → attackPower += 5
  │     │     spread    → spawn secondary threat in queue
  │     │     hide      → evasion += 0.15 (max 0.8)
  │     │
  │     └─ AI Adapter? → applyAiAdapterRegen() → hp += 8
  │
  ├─ 'posture-update' phase
  │     ├─ strength -= 10 (decay)
  │     ├─ turn >= 13? jackpotAvailable = true
  │     ├─ health <= 0? → 'defeat'
  │     ├─ threat.hp <= 0? → 'victory' → next threat
  │     └─ else → turn++, back to 'threat-appears'
  │
  └─ terminal states
        defeat     → game over screen
        victory    → all threats cleared → win screen
        compromised→ system patch violated → game over
```

---

## 9. All State Management

### Frontend State Architecture

There is no Redux, Zustand, or Context API. All state is local React `useState` hooks. State flows downward via props. There are no global stores.

#### `App.tsx` — Root State
```typescript
onboarded: boolean                          // Has user completed onboarding?
mode: 'soc' | 'simulation'                 // Active mode
orgProfile: Record<string, unknown> | null  // Raw org security data (NIST JSON or questionnaire)
accountData: AccountData | null             // {userId, orgId, orgName, tier, integrations, industry, employeeCount, infraType, token}
socRanks: Record<string, number>            // {clover, spade, diamond, heart} — 1–13 each
isTutorial: boolean                         // Show tutorial in simulation intro?
```

**AccountData interface:**
```typescript
interface AccountData {
  userId: string;
  orgId: string;
  orgName: string;
  tier: 'dealers' | 'underground' | 'convention';
  integrations: string[];   // ['splunk', 'crowdstrike']
  token: string;            // JWT
  industry?: string;
  employeeCount?: string;
  infraType?: string;
}
```

#### `SOCDashboard.tsx` — Analyze Mode State
All state listed in Section 3. Key derived state:
- `posture` — computed every render from `ranks`
- `optimalHand` — computed every render from `ranks`
- `cveSearchResults` — memoized filtered CVE list

**SuitAnalysisCache structure:**
```typescript
interface SuitAnalysisCache {
  recommendations: string[];
  reasoning: string;
  loading: boolean;
}
// Keyed by suitKey: 'clover' | 'spade' | 'diamond' | 'heart'
// Cleared entirely when activeCve changes
```

#### Simulation Engine State — `SimulationState`
```typescript
interface SimulationState {
  phase: SimPhase;              // Current state machine phase
  turn: number;                 // Current turn number (starts 1)
  resources: PlayerResources;   // {health, mana, strength} all 0-100
  activeThreat: SimThreat | null;
  threatQueue: SimThreat[];     // Spread-spawned threats waiting
  hand: SimCard[];              // Player's current hand (up to 5)
  deck: SimCard[];              // Remaining undrawn cards
  discardPile: SimCard[];       // Played/discarded cards
  posture: PostureState;        // {level: PostureLevel, score: 0-100}
  log: SimLogEntry[];           // Combat log entries
  jackpotAvailable: boolean;    // Turn >= 13?
  jackpotUsed: boolean;         // One-time flag
  attackBlocked: boolean;       // Diamond proc: block next attack
  extraTurnAvailable: boolean;  // Diamond proc: extra card play
  foldCount: number;            // How many times player has folded
}
```

Initial resources: `{ health: 80, mana: 70, strength: 0 }`

**PostureLevel thresholds:**
```
secure:   score >= 80
stable:   score >= 60
strained: score >= 40
critical: score >= 20
breached: score >= 0
```

### Backend State Architecture

The backend is **stateless**. All state lives in PostgreSQL. No in-memory caches, no session storage. JWT tokens are stateless (no revocation list).

#### Database Schema

```sql
-- Users
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,   -- bcrypt 12 rounds
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
)

-- Organizations
organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
-- Index: idx_orgs_owner ON organizations(owner_id)

-- Security profiles
org_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('upload', 'onboarding')),
  raw_profile  JSONB,      -- Original NIST JSON or questionnaire answers
  ranks        JSONB,      -- {clover, diamond, heart, spade, summary}
  summary      TEXT,       -- Gemini one-sentence summary
  created_at   TIMESTAMPTZ DEFAULT now()
)
-- Index: idx_profiles_org ON org_profiles(org_id)
```

**Cascade behavior:** Deleting a user cascades to all their organizations. Deleting an org cascades to all its profiles.

### Poker Hand Scoring Logic

**Location:** `frontend/src/engine/computePosture.ts`

```typescript
computePosture(ranks: Record<string, number>) → PostureHandResult

// Step 1: Count rank frequencies
counts = { [rank]: occurrences }
freq = Object.values(counts).sort(desc)

// Step 2: Check straight (must be 4 consecutive unique ranks)
sorted = [...vals].sort(asc)
isStr = (sorted[3] - sorted[0] === 3) && (new Set(sorted).size === 4)

// Step 3: Base score
baseScore = (sum_of_all_ranks / 52) × 100

// Step 4: Detect hand and multiplier
Royal Flush (all >= 11):        multiplier = 1.00  tier = 7
Four of a Kind (freq[0] === 4): multiplier = 1.00  tier = 6
Straight (isStr):               multiplier = 0.95  tier = 4
Three of a Kind (freq[0]===3):  multiplier = 0.90  tier = 3
Two Pair (freq[0]===2,
          freq[1]===2):         multiplier = 0.85  tier = 2
One Pair (freq[0] === 2):       multiplier = 0.80  tier = 1
High Card (all different):      multiplier = 0.75  tier = 0

// Note: Full House is NOT implemented — 3+1 is treated as Three of a Kind

// Step 5: Final score
score = Math.round(Math.min(100, Math.max(0, baseScore × multiplier)))
```

**Example:** ranks = {clover:9, spade:9, diamond:9, heart:9}
→ Four of a Kind, baseScore = 36/52×100 = 69.2, score = 69

**`computeOptimalHand(ranks)`** — suggests the minimum rank change to reach the next poker hand tier. Used by FiveYearPlan to determine target ranks.

### Formula-Based CVE Scoring (Frontend)

**Location:** `frontend/src/engine/cveScorer.ts`
Used when `orgProfile` is null (guest mode) or as fallback if Gemini fails.

```
Base score = CVSS × 10

Deductions (org has these controls):
  MFA >= 95%:                -8
  Endpoint hardening:        -7
  Patch cycle <= 7 days:    -10
  Zero Trust complete:      -10
  EDR >= 90%:                -8
  SIEM active:               -5
  Threat hunting weekly:     -6
  IR plan tested:            -7
  Backups tested:            -5

Additions (org is missing these):
  Patch cycle > 30 days:    +10
  IR plan stale:             +7
  No asset inventory:        +8
  EDR coverage < 50%:        +8
  Slow detection (MTTD>24h): +6
  Untested backups:          +5
  Known ransomware campaign: +10

Result clamped to 0–100
```

`DEFAULT_ORG_PROFILE` has all protections at minimum (worst-case scenario for guest scoring).

---

## 10. Annotated Folder/File Tree

```
CounterStack2/
│
├── CLAUDE.md                     # Claude Code instructions for this project
├── SYSTEM_AUDIT.md               # Full system audit document
├── README.md                     # User-facing project documentation
├── package-lock.json             # Root lock file (unused — backend/frontend have own)
│
├── backend/
│   ├── package.json              # ESM module, ts-node/tsx dev, express 5.x
│   ├── tsconfig.json             # ES2022 target, Node16 module, strict mode
│   └── src/
│       ├── index.ts              # Express entry point — CORS, body parser, /api mount
│       │
│       ├── db/
│       │   ├── pool.ts           # pg.Pool from DATABASE_URL env var
│       │   └── migrate.ts        # CREATE TABLE IF NOT EXISTS for users/orgs/profiles
│       │
│       ├── middleware/
│       │   └── auth.ts           # JWT Bearer token verify → req.user = {userId, email}
│       │
│       ├── routes/
│       │   ├── index.ts          # Router hub: /auth, /orgs, /posture, /health
│       │   ├── auth.ts           # POST register/login, GET me
│       │   ├── orgs.ts           # CRUD for organizations (all protected)
│       │   ├── profiles.ts       # Upload/onboarding/list/latest (all protected)
│       │   └── posture.ts        # AI analysis endpoints (all public)
│       │
│       ├── controllers/
│       │   ├── auth.controller.ts    # register, login, me — bcrypt + JWT
│       │   ├── orgs.controller.ts    # createOrg, listOrgs, getOrg, deleteOrg
│       │   ├── profiles.controller.ts # uploadProfile, onboardingProfile, list, latest
│       │   └── posture.controller.ts  # analyzePosture, analyzeCveThreatLevel, etc.
│       │
│       ├── services/
│       │   └── gemini.ts         # ALL Gemini API calls — 5 functions, prompts, parsing
│       │
│       └── interfaces/
│           ├── index.ts          # Barrel export
│           ├── AuthPayload.interface.ts  # {userId, email}
│           └── GeminiRanks.interface.ts  # {clover,diamond,heart,spade,summary}
│
└── frontend/
    ├── package.json              # React 19, Vite 8 beta, Tailwind 4, TS 5.9
    ├── tsconfig.json             # References app + node configs
    ├── tsconfig.app.json         # App-specific TS config
    ├── tsconfig.node.json        # Node-specific TS config (vite.config)
    ├── vite.config.ts            # Vite config with @vitejs/plugin-react
    ├── tailwind.config.ts        # Custom colors, shadows, animations, fonts
    ├── index.html                # HTML shell with #root div
    │
    └── src/
        ├── main.tsx              # createRoot → <App />
        ├── App.tsx               # Root state machine: onboarded, mode, ranks
        ├── index.css             # Tailwind v4 imports
        │
        ├── pages/
        │   └── SOCDashboard.tsx  # Analyze Mode — the entire SOC dashboard
        │
        ├── app/
        │   └── SimulationMode.tsx # Wrapper: intro → game table
        │
        ├── components/
        │   ├── SuitCard.tsx          # Individual suit playing card
        │   ├── SuitDashboard.tsx     # Expanded suit panel with AI recs
        │   ├── CardArt.tsx           # SVG card artwork by suit/rank
        │   ├── JokerCardSVG.tsx      # Animated Joker SVG card
        │   ├── PostureChart.tsx      # Historical rank sparkline chart
        │   ├── CrowdStrikeIdentityChart.tsx  # Integration data viz
        │   │
        │   └── layout/
        │       ├── Onboarding.tsx        # Multi-phase wizard (landing → posture method)
        │       ├── IncidentRoom.tsx      # CVE deep-dive modal
        │       ├── MagicianReading.tsx   # Holistic Gemini assessment panel
        │       ├── FiveYearPlan.tsx      # ASCII roadmap display panel
        │       ├── PostureExplainer.tsx  # Poker hand → score explainer
        │       ├── AnalyzeIntro.tsx      # Default right-panel state
        │       ├── AlertsFeed.tsx        # Mock live alerts display
        │       ├── IntegrationsPanel.tsx # Splunk/CrowdStrike mock data
        │       └── Icons.tsx             # Shared SVG icons
        │
        ├── simulation/
        │   ├── audio/
        │   │   ├── AudioEngine.ts    # Web Audio API context manager
        │   │   ├── MusicManager.ts   # Background track management
        │   │   └── SfxPlayer.ts      # One-shot sound effects
        │   │
        │   ├── engine/
        │   │   ├── types.ts          # All simulation types: SimCard, SimThreat, SimulationState, etc.
        │   │   ├── deck.ts           # 52-card deck creation + Fisher-Yates shuffle
        │   │   ├── resources.ts      # applySpadeCardCost, applyClubCard, applyHeartCard, applyDiamondCard, applyIncomingDamage, applyTurnDecay
        │   │   ├── combat.ts         # resolveCardPlay — normal card resolution
        │   │   ├── threats.ts        # THREAT_CATALOG (7 threats), selectThreat, difficultyForTurn, chooseThreatBehavior, executeThreatBehavior, applySpadeAttack
        │   │   ├── specialThreats.ts # System Patch, Rootkit Trojan, AI Adapter — definitions + resolution functions
        │   │   ├── cardActions.ts    # CARD_ACTIONS lookup (all 52 action names per suit×rank)
        │   │   ├── posture.ts        # computeSimPosture — resources → posture level
        │   │   ├── State.ts          # State updater utilities
        │   │   └── index.ts          # Barrel export
        │   │
        │   ├── ui/
        │   │   ├── SimulationIntro.tsx  # Pre-game intro with imported ranks + tutorial
        │   │   ├── SimulationTable.tsx  # Full game UI: dial, bars, threats, hand, log
        │   │   └── MagicianSprite.tsx   # Animated character sprite
        │   │
        │   └── gameplay/
        │       └── useSimulation.ts     # Main simulation hook — state machine driver
        │
        ├── engine/
        │   ├── computePosture.ts  # computePosture() + computeOptimalHand() — poker evaluation
        │   ├── cveScorer.ts       # scoreAllCves(), calculateThreatPct(), DEFAULT_ORG_PROFILE
        │   ├── posture.ts         # Formula-based posture from resources (backup system)
        │   ├── State.ts           # State type definitions
        │   ├── types.ts           # Additional types
        │   ├── deck.ts            # Card types
        │   ├── combat.ts          # Combat resolution
        │   ├── threats.ts         # Threat types
        │   ├── resources.ts       # Resource management
        │   ├── cardActions.ts     # Card action definitions
        │   ├── specialThreats.ts  # Special threat types
        │   └── index.ts           # Barrel export
        │
        ├── data/
        │   ├── gameData.ts            # SUITS, SUIT_DATA, RANK_NAMES, INIT_RANKS, MOCK_INCIDENTS, HISTORY, etc.
        │   ├── cisaKev.ts             # fetchCisaKevData(), estimateCvssScore(), FALLBACK_KEV_DATA
        │   └── integrationMockData.ts # MOCK_SPLUNK_DATA, MOCK_CROWDSTRIKE_DATA
        │
        ├── services/
        │   └── geminiPosture.ts   # Frontend API client — 5 fetch functions to backend
        │
        ├── hooks/
        │   └── usePostureHistory.ts  # Hook for posture history state
        │
        ├── styles/
        │   └── counterstack.css   # Cyberpunk theme: CSS vars, card styles, animations, layout
        │
        └── interfaces/            # 60+ TypeScript interface files
            ├── index.ts           # Barrel export of all interfaces
            ├── AccountData.interface.ts
            ├── SuitConfig.interface.ts
            ├── SuitMetric.interface.ts
            ├── SuitRisk.interface.ts
            ├── SuitDataEntry.interface.ts
            ├── ScoredCve.interface.ts
            ├── SuitDashboardProps.interface.ts
            ├── SOCDashboardProps.interface.ts
            ├── MockIncident.interface.ts
            ├── MockEngineer.interface.ts
            ├── JokerThreat.interface.ts
            ├── CommMessage.interface.ts
            ├── AIRec.interface.ts
            └── ... (50+ more)
```

---

## 11. Every Environment Variable and Config File

### Backend — `backend/.env`

```env
# PostgreSQL connection string (required)
DATABASE_URL=postgresql://counterstack:counterstack_dev@localhost:5432/counterstack

# JWT signing secret — must be random, long, and kept secret (required)
JWT_SECRET=<64-char random hex>

# Google Gemini API key (required for all /api/posture/* routes)
GEMINI_API_KEY=<your-gemini-api-key>

# Express server port (optional, default 4000)
PORT=4000

# Frontend URL for CORS allow-origin (optional, default http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

**How each is used:**

| Variable | Used In | Behavior if Missing |
|---|---|---|
| `DATABASE_URL` | `src/db/pool.ts` → `new Pool({connectionString})` | Pool creation fails on first query |
| `JWT_SECRET` | `src/middleware/auth.ts` → `jwt.verify()`, `src/controllers/auth.controller.ts` → `jwt.sign()` | Throws on any auth operation |
| `GEMINI_API_KEY` | `src/services/gemini.ts` → all 5 functions | Throws `'GEMINI_API_KEY not set'` |
| `PORT` | `src/index.ts` → `app.listen(PORT)` | Defaults to 4000 |
| `FRONTEND_URL` | `src/index.ts` → `cors({origin})` | Defaults to `http://localhost:5173` |

---

### Frontend — `frontend/.env.local`

```env
# Backend API base URL (optional, default http://localhost:4000)
VITE_API_URL=http://localhost:4000

# Google Gemini API key (optional — only used if frontend directly calls Gemini)
# Currently all Gemini calls go through the backend
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

**How each is used:**

| Variable | Used In | Behavior if Missing |
|---|---|---|
| `VITE_API_URL` | `src/services/geminiPosture.ts` → `const API_URL = import.meta.env.VITE_API_URL \|\| 'http://localhost:4000'` | Falls back to localhost:4000 |
| `VITE_GEMINI_API_KEY` | Not currently active in production code (backend handles all Gemini calls) | No effect |

---

### PostgreSQL — Local Setup

CounterStack uses a **locally installed PostgreSQL 16** instance. No containers are used.

**Create the database and user:**

```sql
-- Run as a PostgreSQL superuser (e.g. psql -U postgres)
CREATE USER counterstack WITH PASSWORD 'counterstack_dev';
CREATE DATABASE counterstack OWNER counterstack;
GRANT ALL PRIVILEGES ON DATABASE counterstack TO counterstack;
```

**Connection string used by the backend:**

```
postgresql://counterstack:counterstack_dev@localhost:5432/counterstack
```

---

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Key: `"module": "Node16"` + `"type": "module"` in package.json means all imports must use `.js` extensions even for `.ts` source files.

---

### `backend/package.json` — Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "tsx src/db/migrate.ts"
  }
}
```

---

### `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

No proxy, no custom ports. Dev server defaults to `:5173`.

---

### `frontend/tailwind.config.ts`

Custom design tokens:

```typescript
// Custom colors
colors: {
  clubs:    '#10B981',   // emerald green (overridden by CSS vars in practice)
  diamonds: '#3B82F6',   // blue
  hearts:   '#EC4899',   // pink
  spades:   '#EF4444',   // red
  surface:  '#0F172A',   // dark blue-gray background
}

// Custom box shadows (glow effects)
boxShadow: {
  'glow-clubs':    '0 0 20px rgba(16,185,129,0.5)',
  'glow-diamonds': '0 0 20px rgba(59,130,246,0.5)',
  'glow-hearts':   '0 0 20px rgba(236,72,153,0.5)',
  'glow-spades':   '0 0 20px rgba(239,68,68,0.5)',
}

// Custom animations
animation: {
  'crt-flicker': 'crtFlicker 0.15s infinite',
}

// Custom fonts
fontFamily: {
  mono: ['JetBrains Mono', ...],
  header: ['Space Mono', ...],
}
```

---

### `frontend/src/styles/counterstack.css` — CSS Design Tokens

```css
:root {
  --cyan:  #00d4ff;   /* Spade / OFFENSIVE suit color */
  --pink:  #f72585;   /* Heart / RESILIENCE suit color */
  --gold:  #ffd700;   /* Underground tier accent */
  --green: #39d353;   /* Clover / RESOURCES suit color */
  --dim:   rgba(205,217,229,0.55);  /* Dimmed text */
  --fh:    'Space Mono', monospace; /* Header font */
  --fm:    'JetBrains Mono', monospace; /* Mono font */
}
```

Key CSS classes:
- `.app` — main grid layout (topbar / left-col / hub / right-col)
- `.topbar` — top navigation bar
- `.panel` — glassmorphism card panel
- `.hub` — center circular card arrangement
- `.suit-slot` — individual suit card positioning
- `.joker-container` / `.joker-card-wrapper` — Joker card and expansion behavior
- `.noise` / `.scanlines` / `.gridbg` / `.ambience` — background texture layers
- `.fade-in` — entry animation
- `@keyframes threatFlash` — pulsing animation at high threat levels
- `@keyframes crtFlicker` — CRT screen flicker effect

---

### `frontend/src/data/gameData.ts` — Key Constants

```typescript
RANK_NAMES = ["","A","2","3","4","5","6","7","8","9","10","J","Q","K"]
RANK_FULL  = ["","Ace","Two",...,"King"]

INIT_RANKS = { clover: 7, spade: 9, diamond: 8, heart: 6 }  // Default starting ranks

SUITS = {
  clover:  { sym:"♣", name:"RESOURCES",  sub:"Baseline Health",     color:"#39d353", pos:"top"    },
  spade:   { sym:"♠", name:"OFFENSIVE",  sub:"Detection & Contain", color:"#00d4ff", pos:"left"   },
  diamond: { sym:"♦", name:"HARDEN",     sub:"Hardening & Access",  color:"#a78bfa", pos:"right"  },
  heart:   { sym:"♥", name:"RESILIENCE", sub:"Backup & Continuity", color:"#f72585", pos:"bottom" },
}

HAND_ORDER = ["HIGH CARD","ONE PAIR","TWO PAIR","THREE OF A KIND","STRAIGHT","FULL HOUSE","FOUR OF A KIND","ROYAL FLUSH"]
```

`SUIT_DATA` contains mock display data for each suit (metrics, risks, capabilities, upgrade steps, AI recommendations, baseScore). This is used when no live org profile is loaded.

---

### `frontend/src/data/cisaKev.ts` — CISA KEV Config

```typescript
CISA_KEV_URL = 'https://raw.githubusercontent.com/cisagov/kev-catalog/main/...'
// (GitHub raw URL to known_exploited_vulnerabilities.json)

// estimateCvssScore() scoring modifiers:
// Base: 7.5 (all CISA KEV = actively exploited)
// + 1.5 if knownRansomwareUse === 'Known'
// + 1.5 if description contains 'remote code execution' / 'RCE'
// + 1.0 if description contains 'authentication bypass'
// + 1.0 if description contains 'injection'
// + 0.8 if description contains 'privilege escalation'
// + 0.7 if description contains 'unauthenticated'
// capped at 10.0

FALLBACK_KEV_DATA: 5 hardcoded CVEs used when GitHub fetch fails:
  - CVE-2021-44228  Log4Shell (Apache Log4j2)
  - CVE-2023-28121  PAN-OS Authentication Bypass
  - CVE-2024-21887  Ivanti Connect Secure RCE
  - CVE-2022-30190  Follina MSDT RCE
  - CVE-2020-1472   Zerologon
```

---

---

## 12. Developer Build Guide — Step-by-Step

> This section instructs Claude (or any developer) on how to develop CounterStack from scratch. Follow these phases in order. Each phase builds on the last.

---

### Phase 0 — Prerequisites

Before writing a single line of code, verify the following tools are installed:

```bash
node --version      # Must be 20+
npm --version       # 10+
psql --version      # PostgreSQL 16 client (confirms local PG is installed)
```

Install global tooling:

```bash
npm install -g tsx          # TypeScript runner for backend dev + migrations
```

---

### Phase 1 — Scaffold the Monorepo

Create the top-level folder and two sub-packages:

```
counterstack/
├── backend/
└── frontend/
```

**1a. Create the local PostgreSQL database** (one-time setup, from Section 11):

```sql
-- Run as postgres superuser
CREATE USER counterstack WITH PASSWORD 'counterstack_dev';
CREATE DATABASE counterstack OWNER counterstack;
GRANT ALL PRIVILEGES ON DATABASE counterstack TO counterstack;
```

**1b. Scaffold the backend:**

```bash
mkdir backend && cd backend
npm init -y
# Set "type": "module" in package.json
npm install express cors dotenv pg bcrypt jsonwebtoken multer
npm install -D typescript tsx @types/node @types/express @types/cors \
              @types/pg @types/bcrypt @types/jsonwebtoken @types/multer
```

Copy `tsconfig.json` from Section 11. Add the `scripts` block from Section 11 (`dev`, `build`, `start`, `db:migrate`).

**1c. Scaffold the frontend:**

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install
npm install framer-motion @fortawesome/fontawesome-svg-core \
            @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
npm install -D tailwindcss @tailwindcss/vite
```

Copy `vite.config.ts` and `tailwind.config.ts` from Section 11.

---

### Phase 2 — Database Layer

**2a. Ensure PostgreSQL is running locally:**

```bash
# macOS (Homebrew)
brew services start postgresql@16

# Ubuntu/Debian
sudo systemctl start postgresql

# Verify connection
psql postgresql://counterstack:counterstack_dev@localhost:5432/counterstack -c "SELECT 1;"
```

**2b. Create `backend/src/db/pool.ts`:**

```typescript
import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**2c. Create `backend/src/db/migrate.ts`:**

Write SQL `CREATE TABLE IF NOT EXISTS` statements for all three tables:
- `users` — id (UUID), email (unique), password_hash, name, created_at
- `organizations` — id, user_id (FK), name, industry, size, infra_type, tier, integrations (JSONB), created_at
- `posture_profiles` — id, org_id (FK), ranks (JSONB), profile_data (JSONB), method, created_at

**2d. Run the migration:**

```bash
cd backend
DATABASE_URL=postgresql://counterstack:counterstack_dev@localhost:5432/counterstack \
  npm run db:migrate
```

---

### Phase 3 — Backend Entry Point & Middleware

**3a. Create `backend/src/index.ts`:**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));
app.use('/api', router);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`CounterStack API running on http://localhost:${PORT}`));
```

**3b. Create `backend/.env`:**

```env
DATABASE_URL=postgresql://counterstack:counterstack_dev@localhost:5432/counterstack
GEMINI_API_KEY=<your-key>
PORT=4000
FRONTEND_URL=http://localhost:5173
```

---

### Phase 4 — Auth Routes

Implement `backend/src/routes/auth.ts` with two routes as documented in Section 6:

- `POST /api/auth/register` — hash password with `bcrypt` (12 rounds), insert user row, return JWT signed with `JWT_SECRET` (7-day expiry).
- `POST /api/auth/login` — look up user by email, `bcrypt.compare`, return JWT on match.

Create `backend/src/middleware/auth.ts` — a middleware function that reads `Authorization: Bearer <token>`, verifies it with `jsonwebtoken`, and attaches `req.userId` to the request.

Wire routes into `backend/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import authRoutes from './auth.js';
export const router = Router();
router.use('/auth', authRoutes);
```

---

### Phase 5 — Org & Profile Routes

Add `backend/src/routes/orgs.ts` implementing all routes from Section 6:

- `POST /api/orgs` — create org (auth required)
- `GET /api/orgs/:orgId` — fetch org (auth required)
- `POST /api/orgs/:orgId/profiles/upload` — accept multipart file via `multer`, read JSON, call `gemini.scorePosture(fileContent)`, save ranks to DB
- `POST /api/orgs/:orgId/profiles/onboarding` — accept questionnaire JSON, call `gemini.scorePosture(answers)`, save ranks
- `GET /api/orgs/:orgId/profiles/latest` — return most recent posture profile row

Mount under the root router: `router.use('/orgs', orgRoutes)`.

---

### Phase 6 — Gemini Service

Create `backend/src/services/gemini.ts`. This file exports five async functions. Each constructs a prompt string and calls the Gemini REST API (`gemini-2.5-flash` or whichever model is configured):

| Function | Prompt goal | Returns |
|---|---|---|
| `scorePosture(input)` | Score org across 4 domains → ranks 1–13 | `{ clover, spade, diamond, heart }` |
| `analyzeCveThreat(cve, orgProfile)` | Estimate threat % for a specific CVE given org context | `{ threatPct, reasoning }` |
| `analyzeSuit(suit, orgProfile)` | Generate 4 bullet recommendations for a security domain | `{ recommendations[], reasoning }` |
| `analyzeMagicianReading(input)` | Holistic posture assessment: summary, 3 strengths, 3 weaknesses | `{ summary, strengths[], weaknesses[] }` |
| `analyzeFiveYearPlan(input)` | ASCII timeline roadmap in monospace | `{ plan: string }` |

All functions throw `'GEMINI_API_KEY not set'` if the env var is missing.

Add `backend/src/routes/posture.ts` with the five routes from Section 6, each calling the corresponding Gemini service function. Mount: `router.use('/posture', postureRoutes)`.

---

### Phase 7 — Frontend Data Layer

**7a. Create `frontend/src/data/gameData.ts`** with all constants from Section 11:
- `RANK_NAMES`, `RANK_FULL`, `INIT_RANKS`, `SUITS`, `HAND_ORDER`
- `SUIT_DATA` — mock metrics, risks, capabilities, upgrade steps per suit
- `HISTORY` — hardcoded historical rank arrays for the sparkline chart
- `computePosture(ranks)` — evaluates four ranks as a poker hand, returns `{ hand, tier, score, royal, desc }`
- `computeOptimalHand(ranks)` — finds which rank changes would improve the hand the most

**7b. Create `frontend/src/data/cisaKev.ts`** with:
- `CISA_KEV_URL` pointing to the GitHub raw JSON
- `estimateCvssScore(cve)` scoring function (base 7.5 + modifiers, capped at 10)
- `FALLBACK_KEV_DATA` — 5 hardcoded CVEs
- `fetchCisaKevData(limit)` — fetch + score + sort

**7c. Create `frontend/src/services/geminiPosture.ts`** with five frontend service functions, each `POST`ing to the backend routes with `VITE_API_URL` as the base.

---

### Phase 8 — CSS & Theme

**8a. Create `frontend/src/styles/counterstack.css`** with all design tokens, layout classes, background texture layers, and keyframe animations from Section 11.

**8b. Import the CSS** in `frontend/src/main.tsx`:
```typescript
import './styles/counterstack.css';
```

**8c. Add Google Fonts** to `frontend/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

---

### Phase 9 — Core UI Components

Build these components in order, each depending on the last:

1. **`components/layout/Icons.tsx`** — shared SVG icons (no deps)
2. **`components/CardArt.tsx`** — SVG suit art by rank (no deps)
3. **`components/JokerCardSVG.tsx`** — animated Joker SVG with glitch animation
4. **`components/PostureChart.tsx`** — sparkline chart for rank history
5. **`components/SuitCard.tsx`** — single suit card (uses CardArt)
6. **`components/SuitDashboard.tsx`** — expanded suit detail panel (uses PostureChart)
7. **`components/layout/PostureExplainer.tsx`** — hand hierarchy explainer modal
8. **`components/layout/AnalyzeIntro.tsx`** — default right-panel intro text
9. **`components/layout/AlertsFeed.tsx`** — mock live alerts feed
10. **`components/layout/IncidentRoom.tsx`** — CVE deep-dive modal
11. **`components/layout/MagicianReading.tsx`** — Gemini holistic assessment panel
12. **`components/layout/FiveYearPlan.tsx`** — Gemini 5-year roadmap panel
13. **`components/CrowdStrikeIdentityChart.tsx`** — mock CrowdStrike bar chart
14. **`components/layout/IntegrationsPanel.tsx`** — convention-tier left column panel
15. **`components/layout/Onboarding.tsx`** — multi-phase onboarding wizard (uses auth routes)

---

### Phase 10 — Simulation Subsystem

Build simulation components in this order:

1. **`simulation/audio/AudioEngine.ts`** — Web Audio API context wrapper
2. **`simulation/audio/SfxPlayer.ts`** — one-shot sound effects
3. **`simulation/audio/MusicManager.ts`** — background track management
4. **`simulation/engine/gameData.ts`** — `THREAT_CATALOG`, card deck logic, `HAND_ORDER`
5. **`simulation/engine/gameEngine.ts`** — pure state-machine functions:
   - `difficultyForTurn(turn)`
   - `selectThreat(difficulty)`
   - `fillHand(state)`
   - `resolveCardPlay(state, card)`
   - `resolveSystemPatch`, `resolveRootkit`, `resolveAiAdapter`
   - `chooseThreatBehavior`, `executeThreatBehavior`
   - `applyTurnDecay`
6. **`simulation/ui/SimulationIntro.tsx`** — pre-game screen with rank display
7. **`simulation/ui/SimulationTable.tsx`** — main game board (imports engine, audio)
8. **`app/SimulationMode.tsx`** — thin wrapper switching between intro and table

---

### Phase 11 — SOC Dashboard & App Root

**11a. Build `pages/SOCDashboard.tsx`:**

This is the largest file (~500 lines). Build it in this sub-order:
1. Set up all state variables from Section 3
2. Add all `useEffect` hooks (CISA fetch, clock, Jira, port pcts, threat animation, posture change detection)
3. Render top bar (logo, mode toggle, tier badge, clock)
4. Render center hub (4 `<SuitCard>` positioned top/left/right/bottom + `<JokerCardSVG>` center)
5. Render right column (conditionally swap between AnalyzeIntro, SuitDashboard, MagicianReading, FiveYearPlan, PostureExplainer, IncidentRoom)
6. Render left column (IntegrationsPanel — convention tier only)
7. Connect `activeSuit` click → suit analysis Gemini call
8. Connect CVE search → `analyzeCveThreat` Gemini call
9. Add posture-upgrade animation detection

**11b. Build `App.tsx`** with the state machine from Section 3:
- `onboarded`, `mode`, `orgProfile`, `accountData`, `socRanks`, `isTutorial`
- Render `<SOCDashboard>` when `!onboarded || mode === 'soc'`
- Render `<SimulationMode>` when `mode === 'simulation'`
- Pass `handleOnboarded` down to `<Onboarding>` via `SOCDashboard`

---

### Phase 12 — Environment Files & Final Wiring

**12a. Create `frontend/.env.local`:**

```env
VITE_API_URL=http://localhost:4000
```

**12b. Verify all route mounting** in `backend/src/routes/index.ts`:

```typescript
router.use('/auth', authRoutes);
router.use('/orgs', orgRoutes);
router.use('/posture', postureRoutes);
```

**12c. Full local dev startup:**

```bash
# Terminal 1 — Ensure PostgreSQL is running (macOS example)
brew services start postgresql@16

# Terminal 2 — Backend
cd backend
npm run db:migrate    # First time only
npm run dev

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173`. The Onboarding overlay should appear over the darkened SOC Dashboard.

---

### Phase 13 — Verification Checklist

Use this checklist to confirm the app is working end-to-end:

- [ ] PostgreSQL is running locally and `psql` connects with the `counterstack` user
- [ ] `npm run db:migrate` creates `users`, `organizations`, `posture_profiles` tables
- [ ] `POST /api/auth/register` returns a JWT
- [ ] `POST /api/auth/login` returns a JWT for registered user
- [ ] Guest entry routes directly to Simulation Mode with `INIT_RANKS`
- [ ] Account creation + org creation flow completes without error
- [ ] Uploading a NIST JSON file calls Gemini and returns 4 integer ranks
- [ ] SOC Dashboard renders with 4 suit cards and the Joker in the center
- [ ] CISA KEV CVEs load in the Joker panel (or fallback CVEs appear)
- [ ] Clicking a suit card opens `SuitDashboard` and triggers a Gemini suit analysis call
- [ ] Clicking "OPEN MAGICIAN'S READING" calls Gemini and renders the reading panel
- [ ] Clicking "5-YEAR PLAN" calls Gemini and renders the monospace roadmap
- [ ] Switching to Simulate Mode shows `SimulationIntro`, then `SimulationTable` on click
- [ ] Playing a card resolves damage/heal correctly per suit rules in Section 5
- [ ] Black Hat Jackpot button appears at turn 13 and spins to one of 5 effects
- [ ] Leaving Simulation Mode stops all audio and returns to SOC Dashboard

---

*This document was generated from a complete read of all source files in CounterStack2 as of 2026-03-26.*
