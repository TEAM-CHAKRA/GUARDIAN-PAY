# GUARDIANPAY — Smart Digital Wallet with AI Fraud Protection

[![HackMatrix Finals 2026](https://img.shields.io/badge/HackMatrix-Offline_Finals_2026-FE7E3C?style=for-the-badge&logo=shield)](https://github.com)
[![Next.js 16.4](https://img.shields.io/badge/Next.js-16.4.6_App_Router-0E6873?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Node.js 24 ESM](https://img.shields.io/badge/Node.js-24.12.0_ESM-10B981?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0_Strict-1A2C30?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Security Audited](https://img.shields.io/badge/Security_Audit-30%2F30_Tests_Passed-E4201B?style=for-the-badge&logo=securityscorecard)](docs/HACKMATRIX_FINAL_TEST_REPORT.md)

> **GUARDIANPAY** is an intelligent digital wallet that re-engineers payment safety by performing **pre-settlement deterministic risk scoring**, **4-tier risk-proportionate policy enforcement**, and **SSRF-hardened payment link security**, combined with **Google Gemini 2.0 Flash** for human-readable triage explanations and an **immutable SHA-256 hash-chained audit ledger**.

---

## 1. Problem Statement

In India alone, the Unified Payments Interface (UPI) processes over **15 billion transactions every month**, settling more than ₹70,000 Crores per day. While real-time settlement provides unprecedented consumer convenience, it has introduced a catastrophic vulnerability:

1. **Instant, Irreversible Settlement**: Traditional digital wallets act as *unintelligent pipes*. Once a user authenticates with a 4- or 6-digit PIN, funds are debited and credited in $<3$ seconds.
2. **The Social Engineering Epidemic**: Over 85% of modern payment fraud bypasses device security entirely. Victims are coerced through fake electricity disconnection notices, digital arrest scams, impersonation phone calls, or malicious APK downloads.
3. **Post-Mortem Failure**: Current fraud detection occurs *after* settlement via cyber cell complaints or bank chargebacks. By the time an investigation opens, stolen funds have been laundered across multi-layered mule accounts.

**Post-settlement detection is too late. Payment security must occur *before* money leaves the sender's account.**

---

## 2. The GUARDIANPAY Solution

GUARDIANPAY introduces a **pre-settlement defense-in-depth architecture** that inspects every transaction against personal behavioral baselines and threat vectors *before* committing ledger state:

```
[Payment Initiated by User]
            │
            ▼
[Pre-Settlement 6-Signal Fraud Engine]
├── 1. Amount Anomaly (Max 30 pts)
├── 2. Velocity Burst (Max 20 pts)
├── 3. New Payee Substantial Value (Max 15 pts)
├── 4. Odd Nocturnal Hours (Max 10 pts)
├── 5. Sliding PIN Failure Lockout (Max 15 pts)
└── 6. Balance Drain Ratio (Max 10 pts)
            │
            ▼
[Deterministic Policy Enforcement (0 - 100)]
├── 0 - 29   ──> ALLOW    (Instant settlement in <50ms)
├── 30 - 59  ──> STEP_UP  (Quarantines action; requires enhanced PIN challenge)
├── 60 - 84  ──> HOLD     (Debits liquid capital to heldPaise escrow; routes to SecOps)
└── 85 - 100 ──> BLOCK    (Hard rejection; logs incident; zero money movement)
            │
            ▼
[AI Explanation & SecOps Triage (Gemini 2.0 Flash)]
Translates raw signals into consumer advice & SecOps analyst incident briefs.
(AI never decides financial outcomes — deterministic rule engine governs all money).
```

---

## 3. Key Features

- **Pre-Settlement Capital Escrow (`HOLD`)**: Quarantines funds on the sender's account in `heldPaise`, but **credits zero paise to the receiver**. Scammers cannot cash out, and funds are safely returned if rejected by SecOps.
- **Strict Integer Paise Precision**: 100% IEEE-754 floating-point math ban. Every balance, transaction, and calculation is denominated in integer paise ($1\text{ INR} = 100\text{ paise}$).
- **Promise-Mutex Concurrency**: Serializes per-wallet balance mutations, completely eliminating double-spending under concurrent automated burst attacks.
- **Argon2id Cryptography**: Passwords and PINs hashed with 19 MiB memory cost, 2 iterations, and sliding 5-failure lockout over a 15-minute window.
- **Payment Link Security Gateway**: Pre-scans raw URLs for brand typosquatting (Levenshtein distance), executable downloads (`.apk`, `.exe`), and Server-Side Request Forgery (SSRF) targeting `127.0.0.1`, RFC 1918 private subnets, and AWS/GCP cloud metadata (`169.254.169.254`).
- **Cryptographic SHA-256 Audit Ledger**: Every transaction state transition is sealed in a hash-chained block ($H_n = \text{SHA256}(H_{n-1} + \text{data})$). Interactive tampering simulation pinpoints compromised blocks live.
- **SecOps Command Centre**: Live administrative console featuring real-time transaction review queues, anomaly radar telemetry, automated attack simulators, and ledger integrity verification.

---

## 4. Official Brand Palette

| Color Name | Hex Code | Purpose |
|---|:---:|---|
| **Black Pearl** | `#1A2C30` | Deep background tone & cockpit card fill |
| **Blue Lagoon** | `#0E6873` | Brand teal, primary accents, active glow |
| **Burnt Orange** | `#FE7E3C` | Highlight accents, spotlights, high-priority actions |
| **Lust** | `#E4201B` | Critical fraud alerts, block indicators, emergency stops |
| **Copper** | `#61413C` | Subtle metallic dividers, borders, and glass accents |
| **Emerald** | `#10B981` | Instant settlement confirmation & integrity pass indicators |

---

## 5. Technology Stack

### Frontend Website (`frontend/`)
- **Runtime & Framework**: Next.js 16.4.6 (App Router), React 19, TypeScript 5.
- **Styling & Motion**: Tailwind CSS v4, Framer Motion, Lucide React icons.
- **Visual Engineering**: 5-layer fixed canvas background with GPU-accelerated cursor spotlight and drifting ledger threads.
- **Port**: `http://localhost:3000`

### Backend Server (`backend/`)
- **Runtime**: Node.js 24.12.0 (Native ECMAScript Modules).
- **Web Framework**: Express.js with Helmet security headers, 16kb body limits, cookie parser, and CORS.
- **Data & Concurrency**: In-memory async mock repository with Promise mutex queue for zero-setup demo reliability.
- **Cryptography**: Argon2id for credentials, HMAC-SHA256 for redirect tokens, SHA-256 for audit chaining.
- **AI Integration**: Google Gemini 2.0 Flash (`@google/genai`) with offline deterministic fallback templates.
- **Port**: `http://localhost:4000`

---

## 6. Installation & Quick Start

### Prerequisites
- **Node.js**: v20.0.0 or higher (v24.x recommended)
- **npm**: v10.x or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/guardianpay.git
cd guardianpay

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEMO_MODE=true
JWT_SECRET=guardianpay-super-secret-jwt-key-minimum-32-chars-long-2026
INTEGRITY_HMAC_KEY=guardianpay-sha256-hmac-chain-integrity-key-32-chars
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
MAX_TXN_PAISE=5000000
MAX_DAILY_PAISE=10000000
```
*(Note: If `GEMINI_API_KEY` is left blank, high-quality deterministic rule templates automatically provide seamless offline explanations).*

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run the Complete Project

Open two terminal windows:

```bash
# Terminal 1: Backend Server (Port 4000)
npm run dev:backend

# Terminal 2: Frontend Website (Port 3000)
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) in your web browser.

---

## 7. Automated Test Suite Execution

Run all verification suites directly from the project root:

```bash
# Run Comprehensive 30-Assertion Integration & Security Audit
npm test

# Run Strict TypeScript Compilation Check (0 Errors)
npm run typecheck

# Run Frontend ESLint Check (0 Errors)
npm run lint

# Run Individual Phase Verifications
npm run test:phase1
npm run test:phase2
npm run test:links
```

---

## 8. Seeded Demo Accounts

The project includes pre-seeded accounts configured with realistic baselines for judging demonstrations:

| Role | Persona | Email | Password | UPI PIN | Seed Balance | Baseline Context |
|---|---|---|---|:---:|:---:|---|
| **Primary User** | Alice Sharma | `alice@example.com` | `Password123!` | `1234` | ₹84,250 | 12 baseline grocery transfers (~₹1,500 avg) |
| **Established Friend** | Bob Smith | `bob@example.com` | `PasswordBob123!` | `5678` | ₹25,000 | Frequent counterparty for Alice |
| **New Counterparty** | Carol Danvers | `carol@example.com` | `PasswordCarol123!` | `4321` | ₹10,000 | Brand-new payee (Triggers `STEP_UP` / `HOLD`) |
| **SecOps Administrator**| SecOps Lead | `admin@guardianpay.internal` | `AdminPassword123!` | `9999` | N/A | Full access to `/admin` Command Centre |

---

## 9. Hackathon Judging Documentation Suite

Complete technical and presentation documentation is available in the `docs/` folder:

- [docs/HACKMATRIX_JUDGING_AUDIT.md](docs/HACKMATRIX_JUDGING_AUDIT.md): Official judging rubric self-audit with evidence-based score estimates.
- [docs/HACKMATRIX_PITCH_SCRIPT.md](docs/HACKMATRIX_PITCH_SCRIPT.md): 5-minute timed pitch script with word-for-word talking points.
- [docs/HACKMATRIX_LIVE_DEMO_SCRIPT.md](docs/HACKMATRIX_LIVE_DEMO_SCRIPT.md): 10-step click-by-click live judge walkthrough.
- [docs/HACKMATRIX_JUDGE_QA.md](docs/HACKMATRIX_JUDGE_QA.md): 28 deep technical, architectural, and security Q&As.
- [docs/HACKMATRIX_ARCHITECTURE.md](docs/HACKMATRIX_ARCHITECTURE.md): Complete architectural blueprint with Mermaid diagrams.
- [docs/HACKMATRIX_VIDEO_OUTLINE.md](docs/HACKMATRIX_VIDEO_OUTLINE.md): 3-minute video production script and storyboard.
- [docs/HACKMATRIX_FINAL_TEST_REPORT.md](docs/HACKMATRIX_FINAL_TEST_REPORT.md): Empirical test evidence spanning all 97 checks.

---

## 10. Known Limitations & Production Roadmap

1. **In-Memory Store**: Currently utilizes an in-memory repository with Promise mutexes to eliminate external database installation requirements during offline hackathon judging. Production migration targets PostgreSQL with row-level locks and Redis distributed locking.
2. **Web Context**: Operates as a responsive web application; does not claim mobile OS-level app interception without device management permissions.
3. **Switch Simulation**: Simulates core banking switch settlement locally rather than connecting to live NPCI/ISO 8583 banking switches.

---

## 11. License

MIT License © 2026 GUARDIANPAY Team. Built for HackMatrix Offline Finals 2026.
