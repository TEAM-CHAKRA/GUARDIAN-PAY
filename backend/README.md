# GUARDIANPAY — Backend Architecture & API Specification

> **IMPORTANT DISCLAIMER**: GUARDIANPAY is a financial security simulation platform built for fintech hackathon demonstrations. It simulates UPI-style account handles, PIN verifications, wallet balances, fraud scoring, and payment settlements. **Zero real bank, NPCI, UPI, or card networks are connected.** All monetary amounts are handled strictly in simulated integer paise.

---

## 1. System Overview

GUARDIANPAY delivers an institutional-grade payment protection and fraud analytics engine. Built on pure Node.js 24 (ESM) and Express, the platform enforces:

- **Strict Integer Paise Math**: Zero floating-point arithmetic. 1 INR = 100 paise.
- **Argon2id Authentication**: Hardware-resistant password and PIN hashing with 5-attempt sliding window lockout.
- **Decoupled In-Memory State**: Deep-copied async repository (`repository.js`) with an atomic Promise mutex queue for money movements.
- **Deterministic 6-Signal Fraud Engine**: Mathematical scoring (0–100) independent of AI latency or hallucinations.
- **4-Tier Automated Protection**: `ALLOW` (0–29), `STEP_UP` (30–59), `HOLD` (60–84), and `BLOCK` (85–100).
- **Cryptographic Audit Chain**: SHA-256 hash-chained audit log with canonical JSON serialization and tamper detection.
- **Privacy-Safe AI Integration**: Groq API (`openai/gpt-oss-20b`) with secondary Google Gemini fallback and deterministic template heuristics. Explains risk using derived telemetry only without ever overriding deterministic fraud scores.

---

## 2. Quick Start

### Prerequisites
- Node.js 20+ (Node.js 24 recommended)
- npm 10+

### Installation & Execution
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server (Port 4000)
npm run dev

# Run comprehensive integration test suite (All 8 Phases)
npm test
```

The server starts at `http://localhost:4000`. Health check is accessible at `http://localhost:4000/api/health`.

---

## 3. Pre-Seeded Demo Accounts

The backend automatically seeds 6 pre-configured demo personas with realistic balances and transaction baselines:

| Persona | Name | Email | UPI Handle | Password | PIN | Initial Balance | Role | Notes |
|---|---|---|---|---|---|---|---|---|
| **Primary User** | Alice Sharma | `alice@example.com` | `alice@guardianpay` | `Password123!` | `1234` | ₹84,250 (8,425,000 paise) | `user` | Has 12 historical baseline payments (~₹1,500 avg) |
| **Friend** | Bob Smith | `bob@example.com` | `bobsmith@guardianpay` | `PasswordBob123!` | `5678` | ₹50,000 (5,000,000 paise) | `user` | Frequent counterparty for Alice |
| **Colleague** | Carol Danvers | `carol@example.com` | `carol@guardianpay` | `PasswordCarol123!` | `1122` | ₹30,000 (3,000,000 paise) | `user` | First-time payee for anomaly testing |
| **Merchant** | Aegis Supermart | `merchant@example.com` | `aegismerchant@guardianpay` | `PasswordMerchant123!` | `9988` | ₹1,50,000 (15,000,000 paise) | `user` | Retail payment recipient |
| **Attacker** | Rogue Actor | `darknet@guardianpay` | `darknet@guardianpay` | `DarknetHack2026!` | `0000` | ₹10,000 (1,000,000 paise) | `user` | Used in attack simulation & scam testing |
| **Admin** | Security Ops | `admin@guardianpay.internal` | `admin@guardianpay` | `AdminPassword123!` | `4321` | ₹1,00,000 (10,000,000 paise) | `admin` | Full RBAC permissions for SOC dashboard |

---

## 4. API Endpoints Specification

All endpoints are mounted under `/api` and `/api/v1`. Responses follow the unified standard envelope:
- **Success**: `{ "success": true, ...data }`
- **Error**: `{ "success": false, "error": { "code": "STRING", "message": "STRING", "details": {} } }`

### Authentication & Wallet
- `POST /api/auth/register` — Create new account with unique UPI handle and 1,000,000 paise wallet.
- `POST /api/auth/login` — Timing-safe login issuing httpOnly `session_token` cookie and JWT.
- `POST /api/auth/logout` — Revokes session `jti` in repository and clears cookie.
- `GET /api/auth/me` — Retrieves current sanitized user profile.
- `GET /api/wallet` — Retrieves sender wallet balance, held funds, and daily limits.
- `GET /api/wallet/lookup/:upiId` — Privacy-masked recipient verification (e.g., `Bo* S****`).

### Payment Processing
- `POST /api/payments` — Initiates transfer with mandatory `Idempotency-Key` (8-64 chars), PIN verification, 6-signal fraud evaluation, and policy enforcement.
- `GET /api/payments` — Retrieves authenticated user's transaction history with risk badges.
- `GET /api/payments/:id` — Retrieves transaction detail with signal breakdown and audit trace.
- `POST /api/payments/:id/confirm` — Completes step-up authentication challenge with PIN re-entry.

### AI Scam Detection & Payment Link Security
- `POST /api/scam-check` — Scans SMS/chat text for 8 fraud tactics with character spans, defensive recommendations, and Gemini review.
- `POST /api/links/verify` — Inspects destination URL for SSRF, localhost/private subnet targets, brand typosquatting, suspicious TLDs, and binary downloads. Returns risk score, threat indicators, and cryptographic HMAC token.
- `GET /api/links/redirect` — Protected redirect endpoint validating cryptographic HMAC token and blocking malicious destinations.

### Administrative Control Centre (RBAC Required)
- `GET /api/admin/transactions` — Review queue of all system transactions.
- `GET /api/admin/transactions/:id` — In-depth risk investigation view.
- `GET /api/admin/transactions/:id/summary` — Natural language executive summary combining signals & AI.
- `POST /api/admin/transactions/:id/approve` — Releases quarantined `heldPaise` to recipient wallet.
- `POST /api/admin/transactions/:id/reject` — Returns quarantined `heldPaise` to sender wallet.
- `GET /api/admin/stats` — Platform metrics (volume, active holds, blocked attacks, ledger status).
- `GET /api/admin/audit` — Immutable audit trail of platform events.
- `GET /api/admin/audit/verify` — Validates complete SHA-256 cryptographic chain integrity.
- `POST /api/admin/dev/tamper` — Simulates unauthorized database record alteration for live tamper demo.

---

## 5. Hackathon Demonstration Scenarios

### Scenario A: Clean Low-Risk Payment (`ALLOW`)
1. Log in as Alice (`alice@example.com` / `Password123!`).
2. Transfer ₹1,500 (`150000` paise) to Bob (`bobsmith@guardianpay`) with PIN `1234`.
3. Risk Engine evaluates 6 signals: within historical baseline, established counterparty, normal hours. Total score: ~12.
4. Action: **Instant Settlement** (`status: success`). Both wallet balances reflect immediately.

### Scenario B: Moderate Risk (`STEP_UP` Challenge)
1. Alice initiates transfer of ₹6,000 to a new counterparty with 1 prior failed PIN attempt.
2. Risk Engine triggers `new_payee` (15 pts) + `amount_anomaly` (20 pts) + `failed_pin_attempts` (5 pts) = 40 pts.
3. Action: **Step-Up Verification** (`status: pending_verification`).
4. Alice confirms with PIN `1234` on `/api/payments/:id/confirm`. Transaction transitions to `success` and settles.

### Scenario C: High-Risk Capital Quarantine (`HOLD` & Admin Release)
1. Alice attempts to send ₹19,000 (95% of liquid balance) to Carol with 3 prior failed PIN attempts.
2. Risk Engine calculates score 70 (`HOLD`).
3. Action: **Capital Quarantined**. Alice's liquid balance drops by ₹19,000, but Carol is NOT credited. Funds move to `heldPaise`.
4. Log in as Admin (`admin@guardianpay.internal` / `AdminPassword123!`).
5. Open `/api/admin/transactions`: The transaction is pending in the review queue.
6. Admin inspects 6-signal telemetry and triggers `POST /api/admin/transactions/:id/approve`.
7. Held funds are released and credited to Carol's wallet.

### Scenario D: Critical Attack Interception (`BLOCK`)
1. Rapid bot attack: 5 transfers in 2 minutes + 98% balance drain + new attacker handle + nocturnal hours.
2. Risk Engine scores 90+ (`BLOCK`).
3. Action: **Hard Rejection**. Transaction is saved as `blocked`. Zero paise move.

### Scenario E: Cryptographic Audit Verification & Tamper Detection
1. Call `GET /api/admin/audit/verify`: Returns `{ valid: true, entriesCount: 22 }`.
2. Simulate a malicious insider modifying entry #3: `POST /api/admin/dev/tamper` with `{"seq": 3, "field": "amount", "value": 999999}`.
3. Call `GET /api/admin/audit/verify`: Immediately detects mismatch, returning `{ valid: false, firstBrokenSeq: 3 }`.

### Scenario F: Payment Link Security & SSRF Protection
1. Open the Link Scanner at `http://localhost:3000/verify-link`.
2. Test an attack URL: `https://guardianpay-kyc-verify.top/claim`.
3. Link Scanner evaluates: SSRF checks, brand impersonation, deceptive string detection, and high-risk `.top` TLD.
4. Returns: Score `100` (`CRITICAL`), Action `BLOCK`. Navigation is permanently forbidden.
5. Test an SSRF probe: `http://169.254.169.254/latest/meta-data` or `http://127.0.0.1:4000/api/admin`.
6. Intercepted instantly with score `100` (`BLOCK`). Localhost and private cloud hypervisor endpoints are shielded.
7. Test a legitimate URL: `https://npci.org.in/what-we-do/upi`.
8. Returns: Score `0` (`ALLOW`), generates a short-lived cryptographic verification token. User can safely click "Continue to Destination" via `/api/links/redirect?token=...`.
