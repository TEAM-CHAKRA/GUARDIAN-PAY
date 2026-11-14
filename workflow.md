# GuardianPay - Implementation Workflow & Progress Log

## Phase 0: Setup, Project Layout & In-Memory Repository (Finished)

**Goal:** Initialize the project architecture, async in-memory repository abstraction, security headers, rate limiting, error envelopes, Gemini test script, and the comprehensive API contract.

**What was built:**
- `.gitignore`: Prevents checking in `.env`, `node_modules/`, and runtime logs.
- `.env.example`: Documents all environment configuration options and default values.
- `backend/package.json`: Configures ESM project, dependencies, and execution scripts.
- `backend/src/config/env.js`: Zod-validated environment schema with safe fallbacks.
- `backend/src/config/constants.js`: Shared enums, signal IDs, error codes, and audit event types.
- `backend/src/config/policy.js`: Deterministic policy mapping from risk scores (0-100) to actions.
- `backend/src/config/limits.js`: Hard transaction caps, rate limits, timing windows, and PIN lockout limits.
- `backend/src/store/repository.js`: Async in-memory data store with atomic mutex for balance transfers and deep-copied JSON entities.
- `backend/src/utils/idGenerator.js`: Crypto-secure 16+ hex character ID generator with canonical lowercasing.
- `backend/src/utils/money.js`: Strict integer paise calculations and INR currency formatting without float math.
- `backend/src/utils/canonicalJson.js`: Recursive key-sorted JSON serializer for deterministic SHA-256 audit hashing.
- `backend/src/utils/response.js`: Unified success `{ success: true, ... }` and error `{ success: false, error: ... }` response envelopes.
- `backend/src/utils/logger.js`: Console logging with automatic recursive redaction of PINs, passwords, tokens, and API keys.
- `backend/src/middleware/errorHandler.js`: Central Express error handling translating Zod and runtime errors into the standard error envelope.
- `backend/src/middleware/rateLimiter.js`: IP and user-rate limiting rules for login, register, payment, and scam-check endpoints.
- `backend/src/middleware/validate.js`: Zod validation middleware for request bodies, query strings, and route parameters.
- `backend/src/middleware/auth.js`: Authentication middleware stub returning 401 NOT_AUTHENTICATED for Phase 0.
- `backend/src/middleware/requireAdmin.js`: Admin authorization middleware stub.
- `backend/src/controllers/healthController.js`: Controller returning service health status and timestamp.
- `backend/src/controllers/authController.js`: Controller with `getMe` stub returning standard 401 error.
- `backend/src/routes/healthRoutes.js`: Route definition for `GET /api/health`.
- `backend/src/routes/authRoutes.js`: Route definition for `GET /api/auth/me`.
- `backend/src/routes/index.js`: Main API router mounting `/health` and `/auth`.
- `backend/src/app.js`: Express application assembly with Helmet, CORS, CookieParser, and JSON parsing.
- `backend/src/server.js`: HTTP server entry point listening on port 4000.
- `backend/scripts/testGemini.js`: Secure test script validating Gemini connectivity without exposing the API key.
- `backend/README.md`: Setup, run instructions, and explicit UPI-style simulation notice.
- `docs/api-contract.md`: Exact API contract for all 21 endpoints across all phases for frontend and backend alignment.
- Placeholder files created for upcoming phases: `walletRoutes.js`, `paymentRoutes.js`, `scamRoutes.js`, `adminRoutes.js`, `walletController.js`, `paymentController.js`, `scamController.js`, `adminController.js`, `authService.js`, `paymentService.js`, `riskEngine.js`, `policyService.js`, `aiService.js`, `scamAnalyzer.js`, `auditService.js`, `seed.js`.

**How it works:**
1. Incoming HTTP requests pass through security middleware (`helmet`, `cors`, `cookieParser`, `express.json`).
2. Express mounts the API router at `/api`, directing calls to health and auth route modules.
3. Errors and invalid validation triggers are caught by `errorHandler`, transforming them into the standard error envelope `{ success: false, error: { code, message, details } }`.
4. State is stored in `MemoryRepository` using internal Maps, where every read and write returns a decoupled, cloned JSON object.
5. Money movements are isolated into `executeTransfer` which enqueues balance adjustments behind a Promise mutex to prevent concurrent race conditions.

**How to test it:**
1. Install dependencies: `npm install` inside `backend/`.
2. Start the server: `npm run dev` (or `npm start`).
3. Health check test:
   - Command: `curl http://localhost:4000/api/health`
   - Expected: HTTP 200 with `{ "success": true, "status": "ok", "service": "guardianpay-backend", "timestamp": "..." }`.
4. Auth stub test:
   - Command: `curl -i http://localhost:4000/api/auth/me`
   - Expected: HTTP 401 with `{ "success": false, "error": { "code": "NOT_AUTHENTICATED", "message": "Authentication required. Please log in.", "details": {} } }`.
5. Gemini connectivity test:
   - Command: `npm run test:gemini`
   - Expected: Reports model status and confirms key connectivity (or notes fallback if key is empty) without leaking secrets.

**Decisions and trade-offs:**
- *In-memory concurrency:* Implemented an internal Promise queue mutex in `repository.executeTransfer` rather than an external locking library. This guarantees sequential debit/credit processing for atomicity while keeping dependencies pure plain JavaScript.
- *Secret masking in logger:* Built recursive object inspection in `logger.js` with regex key matching so that even if a developer passes an entire user or request object to `logger.info` or `logger.error`, secrets (PIN, password, token, keys) are replaced with `[REDACTED]`.
- *Native fetch in Gemini test script:* Used Node 20's native global `fetch` with endpoint parameterization for `testGemini.js`, ensuring zero dependency failure on fresh installs before full package resolution.

**Known gaps:**
- Authentication is currently a stub: `GET /api/auth/me` returns 401 as designed; token issuance and password/PIN hashing will be built in Phase 1.
- Repository state is currently volatile in-memory (resets on server restart); optional disk snapshot persistence can be added if needed for demo continuity.

**Likely judge questions:**
- *Q: Why use an in-memory repository instead of a database like PostgreSQL or SQLite?*
  *A:* The repository pattern abstracts the data layer behind clean async interfaces returning detached JSON copies. During the hackathon, this enables instant, zero-setup testing and eliminates schema migration overhead, while making it trivial to plug in a persistent database adapter later without changing any route or service logic.
- *Q: How do you prevent floating point inaccuracies in money calculations?*
  *A:* All monetary amounts throughout the entire system (API request bodies, repository, policy checks, and AI prompts) are strictly represented as integer paise (1 INR = 100 paise). Floating-point arithmetic is forbidden.
- *Q: How does the system handle concurrent transfers without a relational database?*
  *A:* The `MemoryRepository.executeTransfer` method routes all balance mutations through a serialized Promise mutex queue. Balances are validated and updated atomically before releasing the lock, eliminating race conditions and double-spending.

**Explained back by:**

## Phase 3: Dynamic 6-Signal Fraud Risk Engine (Finished)

**Goal:** Implement the real-time, deterministic 6-signal fraud risk scoring engine evaluated on every payment initiation, calculating individual signal points (0-100 total) and enforcing critical compound anomaly rules.

**What was built:**
- `backend/src/config/constants.js`: Defined `SIGNAL_IDS` (`amount_anomaly`, `velocity`, `new_payee`, `odd_hours`, `failed_pin_attempts`, `balance_drain`) and `SIGNAL_STATUS` (`triggered`, `completed`, `not_evaluated`).
- `backend/src/services/riskEngine.js`: Built complete 6-signal evaluation pipeline:
  1. `amount_anomaly` (max 30 pts): Compares payment against sender's past outgoing average (or ₹10,000 threshold if < 3 txns). Triggers 30 pts if ratio >= 5.0x, 20 pts if >= 3.0x.
  2. `velocity` (max 20 pts): Counts outgoing transfers in last 5 minutes. Triggers 20 pts if >= 5 transfers, 10 pts if >= 3 transfers.
  3. `new_payee` (max 15 pts): Evaluates whether sender has ever previously sent a successful transaction to recipient. Triggers 15 pts for first-time recipient.
  4. `odd_hours` (max 10 pts): Evaluated in `Asia/Kolkata` timezone for transfers between 00:00 and 05:00 IST. Triggers 10 pts for nocturnal activity.
  5. `failed_pin_attempts` (max 15 pts): Evaluates failed PIN timestamps in sliding 15-minute window. Triggers 15 pts for >= 3 failures, 10 pts for 2 failures, 5 pts for 1 failure.
  6. `balance_drain` (max 10 pts): Ratio of transfer amount to total sender liquid balance. Triggers 10 pts for >= 95% drain, 5 pts for >= 80% drain.
  - Critical combination rule: If `new_payee` + `amount_anomaly` + `odd_hours` all trigger, the composite score is floored at 60 (guaranteeing minimum `HOLD` quarantine).
- `backend/src/services/paymentService.js`: Wired `riskEngine.evaluateTransactionRisk()` into step 8 of payment pipeline.
- `backend/scripts/testFullBackend.js`: Integration suite testing individual signal calculations, composite summation, and critical compound anomaly rules.

**How it works:**
1. When a payment is initiated, the engine gathers historical context: past outgoing transactions, recent velocity window (5m), counterparty history, nocturnal time in `Asia/Kolkata`, failed PIN counts, and sender liquid wallet balance.
2. Each of the 6 signals executes independently and deterministically, returning `{ id, status, points, detail }`.
3. Points are summed (0-100). If compound conditions are met, score flooring applies.
4. The output includes individual signal reports, total risk score, risk level, policy action, and analysis timestamp.

**How to test it:**
1. Run `npm test` or `node scripts/testFullBackend.js` inside `backend/`.
2. Inspect test logs verifying each signal's points and triggering conditions.

**Decisions and trade-offs:**
- *Deterministic scoring before AI:* Zero AI is used to compute the risk score. Mathematical and statistical scoring guarantees 100% reproducible, audit-compliant outcomes without hallucination or latency.

---

## Phase 4: Automated Transaction Protection Policies & Step-Up Verification (Finished)

**Goal:** Enforce the four deterministic policy outcomes based on risk score tiers: `ALLOW` (0-29), `STEP_UP` (30-59), `HOLD` (60-84), and `BLOCK` (85-100), including step-up challenges and held capital quarantine.

**What was built:**
- `backend/src/config/policy.js`: Fixed score tier mappings:
  - 0-29: `allow` (`low` risk) -> Instant settlement.
  - 30-59: `step_up` (`medium` risk) -> Transaction status `pending_verification`. Zero money moves until confirmed with PIN.
  - 60-84: `hold` (`high` risk) -> Transaction status `held`. Capital quarantined from sender's liquid balance into `heldPaise`; recipient not credited.
  - 85-100: `block` (`critical` risk) -> Transaction status `blocked`. Zero funds move.
- `backend/src/services/paymentService.js`: Implemented policy branching in `createPayment`:
  - `allow`: Immediate atomic transfer via `repository.executeTransfer`.
  - `step_up`: Transaction created with status `pending_verification`, no debits.
  - `hold`: Atomic transfer with `mode: 'hold'`, moving amount from `balancePaise` to `heldPaise`.
  - `block`: Transaction recorded as `blocked` without touching balances.
- `backend/src/controllers/paymentController.js` & `backend/src/routes/paymentRoutes.js`: Implemented `POST /api/payments/:id/confirm` for verifying step-up transactions with PIN re-entry, settling held/pending amounts upon valid authentication.

**How it works:**
1. Based on the risk engine score, the payment service selects the policy action.
2. For `step_up`, the user must call `POST /api/payments/:id/confirm` with their PIN to release and settle the transaction.
3. For `hold`, funds are safely quarantined in `heldPaise` under administrative custody until released or refunded.
4. For `block`, the malicious transaction is logged and halted instantly.

---

## Phase 5: Scam Message Analyzer & AI Explanations (Finished)

**Goal:** Implement suspicious SMS/chat message analysis with rule-based pattern extraction, non-overlapping character highlights, safe action guidance, and privacy-safe Google Gemini review with deterministic fallback.

**What was built:**
- `backend/src/services/scamAnalyzer.js`: Multi-layered message analyzer:
  - Detects 8 tactic patterns: `otp_request`, `pin_request`, `urgency`, `fake_reward`, `refund_scam`, `impersonation`, `payment_request`, `suspicious_link`.
  - Calculates non-overlapping highlight character spans `[start, end]` for frontend UI rendering.
  - Deterministic rule verdict computation: `likely_scam` (if PIN/OTP or >= 2 tactics), `suspicious` (1 tactic), `likely_safe` (0 tactics).
  - Integrates Gemini API when `GEMINI_API_KEY` is present (with 5s timeout and Zod JSON schema validation).
  - Deterministic template fallback when API key is unset or external call times out.
- `backend/src/services/aiService.js`: Privacy-preserving explanation service that passes only anonymized, derived features (never raw PII, PINs, or card data) to generate natural language explanations for payments with risk >= 30.
- `backend/src/controllers/scamController.js` & `backend/src/routes/scamRoutes.js`: Exposed `POST /api/scam-check` with rate limiting.

**How it works:**
1. Input text is validated and scanned against regex tactic dictionaries.
2. Matches are mapped to highlighted character ranges.
3. If configured, Gemini reviews the tactics and outputs reasoning and defensive recommendations.
4. If Gemini is unreachable or unconfigured, the deterministic rule engine produces immediate, reliable verdicts.

---

## Phase 6: Cryptographic Transaction Integrity Chain & Tamper Detection (Finished)

**Goal:** Implement a verifiable, immutable SHA-256 hash-chained audit log with canonical JSON serialization, genesis block anchoring, and real-time tamper detection.

**What was built:**
- `backend/src/utils/canonicalJson.js`: Deterministic JSON stringifier with recursive object key sorting.
- `backend/src/services/auditService.js`: Cryptographic audit service:
  - Formats entries with sequential sequence numbers, UTC timestamps, domain prefix `guardianpay-audit/v1`, and previous entry hash.
  - Computes entry hash: `SHA-256("guardianpay-audit/v1:" + previousHash + ":" + canonicalPayload)`.
  - Genesis entry hash anchored to 64 zeros (`0000000000000000000000000000000000000000000000000000000000000000`).
  - Full chain validator `verifyChain()` that recomputes every block hash and checks sequence continuity.
- `backend/src/store/repository.js`: Added `tamperAudit(seq, alterations)` allowing deliberate modification of audit records for live hackathon demonstration of tamper detection.
- `backend/src/controllers/adminController.js` & `backend/src/routes/adminRoutes.js`:
  - `GET /api/admin/audit`: Lists audit trail.
  - `GET /api/admin/audit/verify`: Returns verification report `{ valid: boolean, entriesCount, firstBrokenSeq }`.
  - `POST /api/admin/dev/tamper`: Simulates tampering on a specific sequence block.

**How it works:**
1. Every critical event (login, payment, hold, lockout) logs an audit entry.
2. Each block includes the SHA-256 hash of the preceding block, creating an unbroken cryptographic chain.
3. If an attacker modifies any historical block (amount, user, or timestamp), `verifyChain` detects the hash mismatch and immediately flags the exact sequence number where integrity was breached.

---

## Phase 6B: Payment Link Security & SSRF Protection (Finished)

**Goal:** Implement institutional-grade protected payment link verification with syntactic validation, protocol enforcement, complete SSRF protection (localhost, RFC1918, cloud metadata), brand typosquatting detection, cryptographic HMAC verification tokens, and open-redirect prevention.

**What was built:**
- `backend/src/services/linkSecurityService.js`:
  - Syntactic validation and protocol restriction (HTTP/HTTPS only).
  - SSRF engine blocking `127.0.0.1`, `localhost`, `0.0.0.0`, `::1`, RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), cloud metadata (`169.254.169.254`, `metadata.google.internal`), and integer/hex IP encodings.
  - Phishing detection: Brand typosquatting (`guardianpay`, `paytm`, `phonepe`, `sbi`, etc. combined with `login`, `verify`, `kyc`, `refund`), suspicious TLDs (`.top`, `.xyz`, etc.), URL shorteners (`bit.ly`, `tinyurl.com`), and dangerous executable downloads (`.apk`, `.exe`, `.sh`).
  - Scoring and tiered action: `ALLOW` (0–29), `WARN` (30–69), `BLOCK` (70–100).
  - Cryptographic HMAC-SHA256 verification tokens (5-minute expiry).
  - Safe redirect validator preventing open redirects.
- `backend/src/controllers/linkController.js`:
  - `POST /api/links/verify`: Analyzes URL and returns structured security report + token.
  - `GET /api/links/redirect`: Validates cryptographic token, enforces warning acknowledgments, and performs secure redirection.
- `backend/src/routes/linkRoutes.js`: Mounted at `/api/links` and `/api/v1/links`.
- `backend/scripts/testLinkSecurity.js`: Automated test suite covering clean URLs, malformed URLs, prohibited schemes, SSRF targets, brand typosquatting, malware APKs, URL shorteners, token validity, and open-redirect prevention.
- `frontend/src/app/verify-link/page.tsx`: Interactive, responsive user-facing scanner page with demo scenarios, risk score gauge, threat indicators list, and safe redirection flow.
- `frontend/src/components/layout/Sidebar.tsx`: Added "Link Scanner" to the navigation menu.

**How it works:**
1. User receives a protected link or inputs a URL into the scanner.
2. The backend analyzes the destination through syntactic, SSRF, threat intelligence, and brand reputation layers.
3. For low-risk links, an HMAC verification token is issued allowing safe redirection.
4. For medium-risk links, warning confirmation is required before redirection.
5. For high-risk or SSRF targets, the destination is quarantined with `BLOCK`, and redirection is disabled.

---

## Phase 7: Administrative Review Queue & Security Operations Centre (Finished)

**Goal:** Implement role-based administrative capabilities (RBAC) to inspect live transactions, query high-risk alerts, generate executive summaries, and manually approve or reject held payments.

**What was built:**
- `backend/src/middleware/requireAdmin.js`: RBAC middleware verifying `req.user.role === 'admin'`, rejecting non-admins with HTTP 403 `FORBIDDEN`.
- `backend/src/controllers/adminController.js`: Complete administrative control suite:
  - `GET /api/admin/transactions`: Lists all system transactions with filtering by status and risk level.
  - `GET /api/admin/transactions/:id`: Retrieves full risk signals, audit trails, and payment breakdown.
  - `GET /api/admin/transactions/:id/summary`: Natural language executive summary combining signals and AI reasoning.
  - `POST /api/admin/transactions/:id/approve`: Releases quarantined `heldPaise` to recipient wallet, marks transaction `success`, and logs `TXN_APPROVED`.
  - `POST /api/admin/transactions/:id/reject`: Returns quarantined `heldPaise` to sender wallet, marks transaction `rejected`, and logs `TXN_REJECTED`.
  - `GET /api/admin/stats`: Aggregates platform statistics: total volume, active holds, blocked attacks, and ledger verification status.
- `backend/src/routes/adminRoutes.js`: Protected admin route tree mounted at `/api/admin`.

**How it works:**
1. Administrators authenticate via standard credentials (`admin@guardianpay.internal`).
2. High-risk transactions quarantined under `hold` appear in the admin review queue.
3. The administrator reviews the 6 risk signals and AI explanation, then submits either `approve` (crediting receiver) or `reject` (refunding sender).
4. All administrative overrides are cryptographically sealed in the audit chain.

---

## Phase 8: Production Polish, Demonstration Scenarios & Seed Data (Finished)

**Goal:** Populate realistic demo accounts, establish baseline transaction patterns for anomaly detection, deliver complete test suites, and configure frontend proxy integration.

**What was built:**
- `backend/scripts/seed.js`: Pre-populates 6 diverse demo accounts:
  1. `Alice Sharma` (`alice@example.com` / `alice@guardianpay`, balance ₹84,250, 12 historical baseline payments).
  2. `Bob Smith` (`bob@example.com` / `bobsmith@guardianpay`, balance ₹50,000).
  3. `Carol Danvers` (`carol@example.com` / `carol@guardianpay`, balance ₹30,000).
  4. `Aegis Supermart` (`merchant@example.com` / `aegismerchant@guardianpay`, balance ₹1,50,000).
  5. `Rogue Actor` (`darknet@guardianpay`, attacker demo persona).
  6. `Security Admin` (`admin@guardianpay.internal` / `admin@guardianpay`, balance ₹1,00,000, role: `admin`).
  - Pre-seeds 1 quarantined `held` transaction for immediate review queue demonstration.
- `backend/scripts/testFullBackend.js`: Comprehensive automated end-to-end test suite testing all 8 phases in sequence with zero failures.
- `frontend/next.config.ts`: Configured Next.js API rewrite proxy: `/api/:path*` -> `http://localhost:4000/api/:path*`.
- `frontend/.env.local`: Configured `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Dual API route mounting: Both `/api/*` and `/api/v1/*` supported across backend and frontend.

**How to test it:**
1. Start backend: `npm --prefix backend run dev` (running on port 4000).
2. Start frontend: `npm run dev` (running on port 3000).
3. Run full integration suite: `npm --prefix backend test` -> 100% assertions passing.
4. Test live proxy: `curl http://localhost:3000/api/health` -> HTTP 200 OK.


## Phase 1: Secure Authentication and Wallet (Finished)

**Goal:** Implement user registration, Argon2 password/PIN hashing, httpOnly JWT sessions, PIN lockout tracking, seeded wallets, and privacy-preserving payee lookup.

**What was built:**
- `backend/src/utils/response.js`: Updated standard error envelope to guarantee `"details": {}` (empty object instead of null).
- `backend/src/middleware/errorHandler.js`: Formatted validation errors into structured objects and defaulted details to `{}`.
- `backend/src/app.js`: Configured `express.json({ limit: "16kb" })` for strict body size limits.
- `backend/src/services/authService.js`: Implemented Argon2 hashing for passwords and transaction PINs, unique UPI ID generation (`<slug>@guardianpay`), JWT session tokens with random `jti`, and shared `verifyPin` with a 5-failures-in-15-minutes lockout.
- `backend/src/services/auditService.js`: Created audit logging service emitting structured audit entries for `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PIN_FAILED`, and `PIN_LOCKED`.
- `backend/src/middleware/auth.js`: Created authentication middleware verifying JWT cookies/Bearer tokens and checking `jti` revocation against the repository.
- `backend/src/controllers/authController.js`: Handled register (creating user + 1,000,000 paise wallet), login (timing-safe generic error, httpOnly cookie), logout (revoking `jti` and clearing cookie), and `GET /api/auth/me`.
- `backend/src/routes/authRoutes.js`: Wired rate-limited auth endpoints with Zod schema validation (with strict `.max()` constraints).
- `backend/src/controllers/walletController.js`: Handled `GET /api/wallet` and `GET /api/wallet/lookup/:upiId` with display name masking (`Bo* S****`).
- `backend/src/routes/walletRoutes.js`: Defined wallet and payee lookup routes protected by `authenticate`.
- `backend/src/routes/index.js`: Mounted wallet routes at `/api/wallet`.
- `backend/scripts/testPhase1.js`: Added verification script covering registration, wallet balances, payee masking, PIN lockout, session revocation, and audit logging.
- `docs/api-contract.md`: Updated error envelopes to `"details": {}` and marked Phase 1 endpoints as fully implemented.

**How it works:**
1. Registration validates input with Zod, derives a unique `<slug>@guardianpay` identifier, hashes password and PIN with Argon2, creates a user record, and seeds an initial wallet of 10,000 INR (1,000,000 paise).
2. Login authenticates via Argon2, records an audit event (`LOGIN_SUCCESS` or `LOGIN_FAILED`), generates a 30-minute JWT containing a unique `jti`, and sets a secure httpOnly cookie.
3. Logout revokes the `jti` in the repository and clears the session cookie.
4. Protected routes pass through `authenticate` middleware, which verifies the JWT signature, confirms the session is not revoked in the repository, and attaches a sanitized user object (stripped of hashes and PINs).
5. `verifyPin` tracks failed attempts in a sliding 15-minute window; on the 5th failure, it locks PIN verification for 15 minutes, writes `PIN_LOCKED` to the audit log, and rejects subsequent attempts with HTTP 423.
6. Payee lookup queries the repository by UPI ID and returns only a masked display name (e.g. `Bo* S****`), never revealing the recipient's email.

**How to test it:**
1. Run automated test suite: `npm run test:phase1` inside `backend/` to verify Argon2 hashing, PIN lockout, wallet seeding, and payee masking.
2. In Postman:
   - Register User 1 (Alice): `POST /api/auth/register` with `{"name": "Alice Sharma", "email": "alice@example.com", "password": "Password123!", "pin": "1234"}`.
   - Register User 2 (Bob): `POST /api/auth/register` with `{"name": "Bob Smith", "email": "bob@example.com", "password": "PasswordBob123!", "pin": "5678"}`.
   - Test wrong password login: `POST /api/auth/login` with `{"email": "alice@example.com", "password": "WrongPassword!"}` -> returns 401 with generic message and `"details": {}`.
   - Log in as Alice: `POST /api/auth/login` -> returns 200 and sets `session_token` cookie.
   - Check Alice wallet: `GET /api/wallet` -> returns 200 with `balancePaise: 1000000`.
   - Look up Bob: `GET /api/wallet/lookup/bobsmith@guardianpay` -> returns 200 with `maskedName: "Bo* S****"`.
   - Logout: `POST /api/auth/logout` -> returns 200 and revokes session.
   - Access `/me` after logout: `GET /api/auth/me` -> returns 401 `NOT_AUTHENTICATED`.

**Decisions and trade-offs:**
- *Argon2 over bcryptjs:* Standardized on `argon2id` for memory-hard password and PIN hashing per host environment capability, providing enhanced defense against GPU-accelerated brute-force attacks.
- *Dual token extraction:* The `authenticate` middleware checks `req.cookies.session_token` first (per browser spec) while also accepting `Authorization: Bearer <token>` to facilitate flexible testing across API clients like Postman and curl.
- *Sliding window PIN lockout:* Evaluated failed PIN attempts dynamically against `Date.now() - 15 minutes` rather than resetting on an arbitrary fixed cron timer, preventing attackers from timing attacks across interval boundaries.

**Known gaps:**
- Balance manipulation is currently limited to initial seeding; atomic money transfers will be introduced in Phase 2 with `executeTransfer`.
- Audit logs are currently stored as plain sequenced records in the repository; cryptographic SHA-256 hash chaining and HMAC signing will be activated in Phase 6.

**Likely judge questions:**
- *Q: Why use separate hashes for the login password and the transaction PIN?*
  *A:* UPI-style architectures require defense-in-depth: compromising a session token or login password must not grant authorization to move money. By salting and hashing the transaction PIN separately with Argon2 and enforcing a strict 5-attempt lockout, funds remain protected even if the web session is hijacked.
- *Q: How does GuardianPay prevent user enumeration on the login route?*
  *A:* When a login attempt fails, the API returns an identical HTTP 401 `NOT_AUTHENTICATED` with the message `"Invalid email or password"` whether the email does not exist or the password was incorrect. The audit log records the internal diagnostic safely without leaking state to the client.
- *Q: Why is payee name masking necessary during lookup?*
  *A:* To prevent social engineering and privacy harvesting. A sender only needs enough confirmation to verify they typed the intended recipient's handle (e.g. `Bo* S****`), without exposing full legal names or private email addresses to scrapers.

**Explained back by:**

## Phase 3: Dynamic 6-Signal Fraud Risk Engine (Finished)

**Goal:** Implement the real-time, deterministic 6-signal fraud risk scoring engine evaluated on every payment initiation, calculating individual signal points (0-100 total) and enforcing critical compound anomaly rules.

**What was built:**
- `backend/src/config/constants.js`: Defined `SIGNAL_IDS` (`amount_anomaly`, `velocity`, `new_payee`, `odd_hours`, `failed_pin_attempts`, `balance_drain`) and `SIGNAL_STATUS` (`triggered`, `completed`, `not_evaluated`).
- `backend/src/services/riskEngine.js`: Built complete 6-signal evaluation pipeline:
  1. `amount_anomaly` (max 30 pts): Compares payment against sender's past outgoing average (or ₹10,000 threshold if < 3 txns). Triggers 30 pts if ratio >= 5.0x, 20 pts if >= 3.0x.
  2. `velocity` (max 20 pts): Counts outgoing transfers in last 5 minutes. Triggers 20 pts if >= 5 transfers, 10 pts if >= 3 transfers.
  3. `new_payee` (max 15 pts): Evaluates whether sender has ever previously sent a successful transaction to recipient. Triggers 15 pts for first-time recipient.
  4. `odd_hours` (max 10 pts): Evaluated in `Asia/Kolkata` timezone for transfers between 00:00 and 05:00 IST. Triggers 10 pts for nocturnal activity.
  5. `failed_pin_attempts` (max 15 pts): Evaluates failed PIN timestamps in sliding 15-minute window. Triggers 15 pts for >= 3 failures, 10 pts for 2 failures, 5 pts for 1 failure.
  6. `balance_drain` (max 10 pts): Ratio of transfer amount to total sender liquid balance. Triggers 10 pts for >= 95% drain, 5 pts for >= 80% drain.
  - Critical combination rule: If `new_payee` + `amount_anomaly` + `odd_hours` all trigger, the composite score is floored at 60 (guaranteeing minimum `HOLD` quarantine).
- `backend/src/services/paymentService.js`: Wired `riskEngine.evaluateTransactionRisk()` into step 8 of payment pipeline.
- `backend/scripts/testFullBackend.js`: Integration suite testing individual signal calculations, composite summation, and critical compound anomaly rules.

**How it works:**
1. When a payment is initiated, the engine gathers historical context: past outgoing transactions, recent velocity window (5m), counterparty history, nocturnal time in `Asia/Kolkata`, failed PIN counts, and sender liquid wallet balance.
2. Each of the 6 signals executes independently and deterministically, returning `{ id, status, points, detail }`.
3. Points are summed (0-100). If compound conditions are met, score flooring applies.
4. The output includes individual signal reports, total risk score, risk level, policy action, and analysis timestamp.

**How to test it:**
1. Run `npm test` or `node scripts/testFullBackend.js` inside `backend/`.
2. Inspect test logs verifying each signal's points and triggering conditions.

**Decisions and trade-offs:**
- *Deterministic scoring before AI:* Zero AI is used to compute the risk score. Mathematical and statistical scoring guarantees 100% reproducible, audit-compliant outcomes without hallucination or latency.

---

## Phase 4: Automated Transaction Protection Policies & Step-Up Verification (Finished)

**Goal:** Enforce the four deterministic policy outcomes based on risk score tiers: `ALLOW` (0-29), `STEP_UP` (30-59), `HOLD` (60-84), and `BLOCK` (85-100), including step-up challenges and held capital quarantine.

**What was built:**
- `backend/src/config/policy.js`: Fixed score tier mappings:
  - 0-29: `allow` (`low` risk) -> Instant settlement.
  - 30-59: `step_up` (`medium` risk) -> Transaction status `pending_verification`. Zero money moves until confirmed with PIN.
  - 60-84: `hold` (`high` risk) -> Transaction status `held`. Capital quarantined from sender's liquid balance into `heldPaise`; recipient not credited.
  - 85-100: `block` (`critical` risk) -> Transaction status `blocked`. Zero funds move.
- `backend/src/services/paymentService.js`: Implemented policy branching in `createPayment`:
  - `allow`: Immediate atomic transfer via `repository.executeTransfer`.
  - `step_up`: Transaction created with status `pending_verification`, no debits.
  - `hold`: Atomic transfer with `mode: 'hold'`, moving amount from `balancePaise` to `heldPaise`.
  - `block`: Transaction recorded as `blocked` without touching balances.
- `backend/src/controllers/paymentController.js` & `backend/src/routes/paymentRoutes.js`: Implemented `POST /api/payments/:id/confirm` for verifying step-up transactions with PIN re-entry, settling held/pending amounts upon valid authentication.

**How it works:**
1. Based on the risk engine score, the payment service selects the policy action.
2. For `step_up`, the user must call `POST /api/payments/:id/confirm` with their PIN to release and settle the transaction.
3. For `hold`, funds are safely quarantined in `heldPaise` under administrative custody until released or refunded.
4. For `block`, the malicious transaction is logged and halted instantly.

---

## Phase 5: Scam Message Analyzer & AI Explanations (Finished)

**Goal:** Implement suspicious SMS/chat message analysis with rule-based pattern extraction, non-overlapping character highlights, safe action guidance, and privacy-safe Google Gemini review with deterministic fallback.

**What was built:**
- `backend/src/services/scamAnalyzer.js`: Multi-layered message analyzer:
  - Detects 8 tactic patterns: `otp_request`, `pin_request`, `urgency`, `fake_reward`, `refund_scam`, `impersonation`, `payment_request`, `suspicious_link`.
  - Calculates non-overlapping highlight character spans `[start, end]` for frontend UI rendering.
  - Deterministic rule verdict computation: `likely_scam` (if PIN/OTP or >= 2 tactics), `suspicious` (1 tactic), `likely_safe` (0 tactics).
  - Integrates Gemini API when `GEMINI_API_KEY` is present (with 5s timeout and Zod JSON schema validation).
  - Deterministic template fallback when API key is unset or external call times out.
- `backend/src/services/aiService.js`: Privacy-preserving explanation service that passes only anonymized, derived features (never raw PII, PINs, or card data) to generate natural language explanations for payments with risk >= 30.
- `backend/src/controllers/scamController.js` & `backend/src/routes/scamRoutes.js`: Exposed `POST /api/scam-check` with rate limiting.

**How it works:**
1. Input text is validated and scanned against regex tactic dictionaries.
2. Matches are mapped to highlighted character ranges.
3. If configured, Gemini reviews the tactics and outputs reasoning and defensive recommendations.
4. If Gemini is unreachable or unconfigured, the deterministic rule engine produces immediate, reliable verdicts.

---

## Phase 6: Cryptographic Transaction Integrity Chain & Tamper Detection (Finished)

**Goal:** Implement a verifiable, immutable SHA-256 hash-chained audit log with canonical JSON serialization, genesis block anchoring, and real-time tamper detection.

**What was built:**
- `backend/src/utils/canonicalJson.js`: Deterministic JSON stringifier with recursive object key sorting.
- `backend/src/services/auditService.js`: Cryptographic audit service:
  - Formats entries with sequential sequence numbers, UTC timestamps, domain prefix `guardianpay-audit/v1`, and previous entry hash.
  - Computes entry hash: `SHA-256("guardianpay-audit/v1:" + previousHash + ":" + canonicalPayload)`.
  - Genesis entry hash anchored to 64 zeros (`0000000000000000000000000000000000000000000000000000000000000000`).
  - Full chain validator `verifyChain()` that recomputes every block hash and checks sequence continuity.
- `backend/src/store/repository.js`: Added `tamperAudit(seq, alterations)` allowing deliberate modification of audit records for live hackathon demonstration of tamper detection.
- `backend/src/controllers/adminController.js` & `backend/src/routes/adminRoutes.js`:
  - `GET /api/admin/audit`: Lists audit trail.
  - `GET /api/admin/audit/verify`: Returns verification report `{ valid: boolean, entriesCount, firstBrokenSeq }`.
  - `POST /api/admin/dev/tamper`: Simulates tampering on a specific sequence block.

**How it works:**
1. Every critical event (login, payment, hold, lockout) logs an audit entry.
2. Each block includes the SHA-256 hash of the preceding block, creating an unbroken cryptographic chain.
3. If an attacker modifies any historical block (amount, user, or timestamp), `verifyChain` detects the hash mismatch and immediately flags the exact sequence number where integrity was breached.

---

## Phase 6B: Payment Link Security & SSRF Protection (Finished)

**Goal:** Implement institutional-grade protected payment link verification with syntactic validation, protocol enforcement, complete SSRF protection (localhost, RFC1918, cloud metadata), brand typosquatting detection, cryptographic HMAC verification tokens, and open-redirect prevention.

**What was built:**
- `backend/src/services/linkSecurityService.js`:
  - Syntactic validation and protocol restriction (HTTP/HTTPS only).
  - SSRF engine blocking `127.0.0.1`, `localhost`, `0.0.0.0`, `::1`, RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), cloud metadata (`169.254.169.254`, `metadata.google.internal`), and integer/hex IP encodings.
  - Phishing detection: Brand typosquatting (`guardianpay`, `paytm`, `phonepe`, `sbi`, etc. combined with `login`, `verify`, `kyc`, `refund`), suspicious TLDs (`.top`, `.xyz`, etc.), URL shorteners (`bit.ly`, `tinyurl.com`), and dangerous executable downloads (`.apk`, `.exe`, `.sh`).
  - Scoring and tiered action: `ALLOW` (0–29), `WARN` (30–69), `BLOCK` (70–100).
  - Cryptographic HMAC-SHA256 verification tokens (5-minute expiry).
  - Safe redirect validator preventing open redirects.
- `backend/src/controllers/linkController.js`:
  - `POST /api/links/verify`: Analyzes URL and returns structured security report + token.
  - `GET /api/links/redirect`: Validates cryptographic token, enforces warning acknowledgments, and performs secure redirection.
- `backend/src/routes/linkRoutes.js`: Mounted at `/api/links` and `/api/v1/links`.
- `backend/scripts/testLinkSecurity.js`: Automated test suite covering clean URLs, malformed URLs, prohibited schemes, SSRF targets, brand typosquatting, malware APKs, URL shorteners, token validity, and open-redirect prevention.
- `frontend/src/app/verify-link/page.tsx`: Interactive, responsive user-facing scanner page with demo scenarios, risk score gauge, threat indicators list, and safe redirection flow.
- `frontend/src/components/layout/Sidebar.tsx`: Added "Link Scanner" to the navigation menu.

**How it works:**
1. User receives a protected link or inputs a URL into the scanner.
2. The backend analyzes the destination through syntactic, SSRF, threat intelligence, and brand reputation layers.
3. For low-risk links, an HMAC verification token is issued allowing safe redirection.
4. For medium-risk links, warning confirmation is required before redirection.
5. For high-risk or SSRF targets, the destination is quarantined with `BLOCK`, and redirection is disabled.

---

## Phase 7: Administrative Review Queue & Security Operations Centre (Finished)

**Goal:** Implement role-based administrative capabilities (RBAC) to inspect live transactions, query high-risk alerts, generate executive summaries, and manually approve or reject held payments.

**What was built:**
- `backend/src/middleware/requireAdmin.js`: RBAC middleware verifying `req.user.role === 'admin'`, rejecting non-admins with HTTP 403 `FORBIDDEN`.
- `backend/src/controllers/adminController.js`: Complete administrative control suite:
  - `GET /api/admin/transactions`: Lists all system transactions with filtering by status and risk level.
  - `GET /api/admin/transactions/:id`: Retrieves full risk signals, audit trails, and payment breakdown.
  - `GET /api/admin/transactions/:id/summary`: Natural language executive summary combining signals and AI reasoning.
  - `POST /api/admin/transactions/:id/approve`: Releases quarantined `heldPaise` to recipient wallet, marks transaction `success`, and logs `TXN_APPROVED`.
  - `POST /api/admin/transactions/:id/reject`: Returns quarantined `heldPaise` to sender wallet, marks transaction `rejected`, and logs `TXN_REJECTED`.
  - `GET /api/admin/stats`: Aggregates platform statistics: total volume, active holds, blocked attacks, and ledger verification status.
- `backend/src/routes/adminRoutes.js`: Protected admin route tree mounted at `/api/admin`.

**How it works:**
1. Administrators authenticate via standard credentials (`admin@guardianpay.internal`).
2. High-risk transactions quarantined under `hold` appear in the admin review queue.
3. The administrator reviews the 6 risk signals and AI explanation, then submits either `approve` (crediting receiver) or `reject` (refunding sender).
4. All administrative overrides are cryptographically sealed in the audit chain.

---

## Phase 8: Production Polish, Demonstration Scenarios & Seed Data (Finished)

**Goal:** Populate realistic demo accounts, establish baseline transaction patterns for anomaly detection, deliver complete test suites, and configure frontend proxy integration.

**What was built:**
- `backend/scripts/seed.js`: Pre-populates 6 diverse demo accounts:
  1. `Alice Sharma` (`alice@example.com` / `alice@guardianpay`, balance ₹84,250, 12 historical baseline payments).
  2. `Bob Smith` (`bob@example.com` / `bobsmith@guardianpay`, balance ₹50,000).
  3. `Carol Danvers` (`carol@example.com` / `carol@guardianpay`, balance ₹30,000).
  4. `Aegis Supermart` (`merchant@example.com` / `aegismerchant@guardianpay`, balance ₹1,50,000).
  5. `Rogue Actor` (`darknet@guardianpay`, attacker demo persona).
  6. `Security Admin` (`admin@guardianpay.internal` / `admin@guardianpay`, balance ₹1,00,000, role: `admin`).
  - Pre-seeds 1 quarantined `held` transaction for immediate review queue demonstration.
- `backend/scripts/testFullBackend.js`: Comprehensive automated end-to-end test suite testing all 8 phases in sequence with zero failures.
- `frontend/next.config.ts`: Configured Next.js API rewrite proxy: `/api/:path*` -> `http://localhost:4000/api/:path*`.
- `frontend/.env.local`: Configured `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Dual API route mounting: Both `/api/*` and `/api/v1/*` supported across backend and frontend.

**How to test it:**
1. Start backend: `npm --prefix backend run dev` (running on port 4000).
2. Start frontend: `npm run dev` (running on port 3000).
3. Run full integration suite: `npm --prefix backend test` -> 100% assertions passing.
4. Test live proxy: `curl http://localhost:3000/api/health` -> HTTP 200 OK.


## Phase 2: Reliable Payment Engine (Finished)

**Goal:** Implement the atomic payment processing pipeline with mutex-serialized transfers, robust idempotency semantics, transaction history, and hard limits.

**What was built:**
- `backend/src/config/constants.js`: Added `REQUEST_IN_PROGRESS` and `EMAIL_TAKEN` to `ERROR_CODES`.
- `backend/src/controllers/authController.js`: Updated duplicate registration error to emit 409 `EMAIL_TAKEN`.
- `backend/src/config/limits.js`: Added `WALLET_LOOKUP` rate limit configuration (30 per 10 mins) and `getKolkataDateString` helper for daily midnight resets in `Asia/Kolkata`.
- `backend/src/middleware/rateLimiter.js`: Exported `walletLookupLimiter` to protect against automated UPI ID scanning.
- `backend/src/routes/walletRoutes.js`: Attached `walletLookupLimiter` to `GET /api/wallet/lookup/:upiId`.
- `backend/src/store/repository.js`: Updated `executeTransfer` and `getWallet` with daily limit rollover in Kolkata timezone and atomic transaction persistence inside the mutex lock; enhanced idempotency with in-progress markers and deletion on early validation rejection.
- `backend/src/services/paymentService.js`: Implemented the full 10-step payment pipeline with canonical payload hashing, PIN check, hard transaction caps (₹50,000) and daily caps (₹1,00,000), atomic money movement, and user transaction querying. Marked step 8 for future risk engine insertion.
- `backend/src/controllers/paymentController.js`: Added controllers for `createPayment` (`POST /api/payments`), `getPayments` (`GET /api/payments`), and `getPaymentById` (`GET /api/payments/:id`).
- `backend/src/routes/paymentRoutes.js`: Defined authenticated, rate-limited, Zod-validated routes for payments.
- `backend/src/routes/index.js`: Mounted payment routes at `/api/payments`.
- `backend/scripts/testPhase2.js`: Created comprehensive integration test verifying transfer atomicity, insufficient funds, PIN verification, idempotency replay, payload conflict (409), race conditions under parallel execution, and strict money conservation.
- `docs/api-contract.md`: Documented all payment endpoints, error codes, and responses.

**How it works:**
1. Incoming `POST /api/payments` requests require an `Idempotency-Key` (8-64 chars) and pass through rate limiting and Zod body validation.
2. The service checks the idempotency store: if an identical key is in-flight, it returns 409 `REQUEST_IN_PROGRESS`; if already completed with identical payload hash (excluding PIN), it immediately returns the cached response; if payloads conflict, it returns 409 `IDEMPOTENCY_CONFLICT`.
3. Validation verifies the sender PIN, payee existence, self-transfer prevention, per-transaction limit (₹50,000), daily limit in `Asia/Kolkata` time (₹1,00,000), and wallet balance.
4. If valid, `repository.executeTransfer` acquires the Promise-queue mutex lock, atomically debiting sender, crediting receiver, updating daily spent totals, and persisting the transaction record before releasing the lock.
5. Audit events (`TXN_CREATED`, `TXN_SUCCESS`, or `TXN_FAILED`) are recorded, the idempotency cache is saved, and HTTP 201 is returned.

**How to test it:**
1. Run automated test suite: `npm run test:phase2` inside `backend/` to verify normal transfer, overdraft rejection, wrong PIN rejection, idempotency cache replay, payload conflicts, concurrent double-spend race prevention, and system-wide total money conservation.
2. In Postman:
   - Register Alice and Bob.
   - Login as Alice (`POST /api/auth/login`).
   - Create Payment: `POST /api/payments` with header `Idempotency-Key: test-key-12345` and body `{"receiverUpiId": "bobsmith@guardianpay", "amountPaise": 100000, "pin": "1234"}` -> returns 201 `SUCCESS` (Alice debited ₹1,000, Bob credited ₹1,000).
   - Replay Payment: Send exact same request with same `Idempotency-Key: test-key-12345` -> returns 201 with `replayed: true` and identical transaction record without deducting balance.
   - Idempotency Conflict: Send `POST /api/payments` with same `Idempotency-Key: test-key-12345` but amount `200000` -> returns 409 `IDEMPOTENCY_CONFLICT`.
   - Insufficient Balance: Send payment with amount `2000000` (₹20,000) with new key -> returns 400 `INSUFFICIENT_FUNDS`.
   - Wrong PIN: Send payment with wrong PIN `"9999"` -> returns 400 `INVALID_PIN`.
   - Self-Transfer: Send payment to Alice's own UPI ID -> returns 400 `SELF_TRANSFER`.
   - History: `GET /api/payments` -> returns list of Alice's transactions.
   - Detail: `GET /api/payments/:id` -> returns single transaction (returns 404 for unauthorized third parties).

**Decisions and trade-offs:**
- *Excluding PIN from Idempotency Hash:* Hashed only `{ receiverUpiId, amountPaise, note }` for idempotency tracking so that sensitive authentication credentials (PINs) never persist in the idempotency store.
- *In-Progress Idempotency State:* Added explicit `status: 'in_progress'` to idempotency records to catch rapid duplicate requests arriving simultaneously before the first request finishes processing, returning HTTP 409 `REQUEST_IN_PROGRESS`.
- *Rollover in Asia/Kolkata:* Evaluated daily spent tallies against `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })` so daily limit resets synchronize accurately with Indian standard business days regardless of the server's UTC hosting clock.

**Known gaps:**
- All valid payments settle immediately in Phase 2; Phase 3 will introduce dynamic 6-signal risk scoring and Phase 4 will introduce automated holds and step-up confirmations.
- Audit logs are stored in memory and not yet verified via cryptographic SHA-256 hash chains (Phase 6).

**Likely judge questions:**
- *Q: How do you prevent double-spending when two identical payment requests hit the server concurrently?*
  *A:* Two layers of protection are enforced: first, idempotency key tracking flags the key as `in_progress`, rejecting concurrent duplicates with HTTP 409 `REQUEST_IN_PROGRESS`. Second, all balance mutations inside `MemoryRepository.executeTransfer` are serialized through an internal Promise mutex queue, guaranteeing that balances are validated and deducted one-at-a-time with zero risk of negative balances.
- *Q: Why is the transaction PIN verified before checking receiver existence or balances?*
  *A:* Security best practices require validating caller authorization before revealing information about recipient existence or performing state calculations, preventing unauthenticated callers from probing UPI accounts.
- *Q: What happens if the server crashes or an unexpected error occurs halfway through a transfer?*
  *A:* `executeTransfer` is fully atomic: sender debit, receiver credit, daily counter updates, and transaction record creation are computed in memory and committed together only after all validations succeed. If an exception occurs at any point, state changes are discarded and neither wallet is altered.

**Explained back by:**

## Phase 3: Dynamic 6-Signal Fraud Risk Engine (Finished)

**Goal:** Implement the real-time, deterministic 6-signal fraud risk scoring engine evaluated on every payment initiation, calculating individual signal points (0-100 total) and enforcing critical compound anomaly rules.

**What was built:**
- `backend/src/config/constants.js`: Defined `SIGNAL_IDS` (`amount_anomaly`, `velocity`, `new_payee`, `odd_hours`, `failed_pin_attempts`, `balance_drain`) and `SIGNAL_STATUS` (`triggered`, `completed`, `not_evaluated`).
- `backend/src/services/riskEngine.js`: Built complete 6-signal evaluation pipeline:
  1. `amount_anomaly` (max 30 pts): Compares payment against sender's past outgoing average (or ₹10,000 threshold if < 3 txns). Triggers 30 pts if ratio >= 5.0x, 20 pts if >= 3.0x.
  2. `velocity` (max 20 pts): Counts outgoing transfers in last 5 minutes. Triggers 20 pts if >= 5 transfers, 10 pts if >= 3 transfers.
  3. `new_payee` (max 15 pts): Evaluates whether sender has ever previously sent a successful transaction to recipient. Triggers 15 pts for first-time recipient.
  4. `odd_hours` (max 10 pts): Evaluated in `Asia/Kolkata` timezone for transfers between 00:00 and 05:00 IST. Triggers 10 pts for nocturnal activity.
  5. `failed_pin_attempts` (max 15 pts): Evaluates failed PIN timestamps in sliding 15-minute window. Triggers 15 pts for >= 3 failures, 10 pts for 2 failures, 5 pts for 1 failure.
  6. `balance_drain` (max 10 pts): Ratio of transfer amount to total sender liquid balance. Triggers 10 pts for >= 95% drain, 5 pts for >= 80% drain.
  - Critical combination rule: If `new_payee` + `amount_anomaly` + `odd_hours` all trigger, the composite score is floored at 60 (guaranteeing minimum `HOLD` quarantine).
- `backend/src/services/paymentService.js`: Wired `riskEngine.evaluateTransactionRisk()` into step 8 of payment pipeline.
- `backend/scripts/testFullBackend.js`: Integration suite testing individual signal calculations, composite summation, and critical compound anomaly rules.

**How it works:**
1. When a payment is initiated, the engine gathers historical context: past outgoing transactions, recent velocity window (5m), counterparty history, nocturnal time in `Asia/Kolkata`, failed PIN counts, and sender liquid wallet balance.
2. Each of the 6 signals executes independently and deterministically, returning `{ id, status, points, detail }`.
3. Points are summed (0-100). If compound conditions are met, score flooring applies.
4. The output includes individual signal reports, total risk score, risk level, policy action, and analysis timestamp.

**How to test it:**
1. Run `npm test` or `node scripts/testFullBackend.js` inside `backend/`.
2. Inspect test logs verifying each signal's points and triggering conditions.

**Decisions and trade-offs:**
- *Deterministic scoring before AI:* Zero AI is used to compute the risk score. Mathematical and statistical scoring guarantees 100% reproducible, audit-compliant outcomes without hallucination or latency.

---

## Phase 4: Automated Transaction Protection Policies & Step-Up Verification (Finished)

**Goal:** Enforce the four deterministic policy outcomes based on risk score tiers: `ALLOW` (0-29), `STEP_UP` (30-59), `HOLD` (60-84), and `BLOCK` (85-100), including step-up challenges and held capital quarantine.

**What was built:**
- `backend/src/config/policy.js`: Fixed score tier mappings:
  - 0-29: `allow` (`low` risk) -> Instant settlement.
  - 30-59: `step_up` (`medium` risk) -> Transaction status `pending_verification`. Zero money moves until confirmed with PIN.
  - 60-84: `hold` (`high` risk) -> Transaction status `held`. Capital quarantined from sender's liquid balance into `heldPaise`; recipient not credited.
  - 85-100: `block` (`critical` risk) -> Transaction status `blocked`. Zero funds move.
- `backend/src/services/paymentService.js`: Implemented policy branching in `createPayment`:
  - `allow`: Immediate atomic transfer via `repository.executeTransfer`.
  - `step_up`: Transaction created with status `pending_verification`, no debits.
  - `hold`: Atomic transfer with `mode: 'hold'`, moving amount from `balancePaise` to `heldPaise`.
  - `block`: Transaction recorded as `blocked` without touching balances.
- `backend/src/controllers/paymentController.js` & `backend/src/routes/paymentRoutes.js`: Implemented `POST /api/payments/:id/confirm` for verifying step-up transactions with PIN re-entry, settling held/pending amounts upon valid authentication.

**How it works:**
1. Based on the risk engine score, the payment service selects the policy action.
2. For `step_up`, the user must call `POST /api/payments/:id/confirm` with their PIN to release and settle the transaction.
3. For `hold`, funds are safely quarantined in `heldPaise` under administrative custody until released or refunded.
4. For `block`, the malicious transaction is logged and halted instantly.

---

## Phase 5: Scam Message Analyzer & AI Explanations (Finished)

**Goal:** Implement suspicious SMS/chat message analysis with rule-based pattern extraction, non-overlapping character highlights, safe action guidance, and privacy-safe Google Gemini review with deterministic fallback.

**What was built:**
- `backend/src/services/scamAnalyzer.js`: Multi-layered message analyzer:
  - Detects 8 tactic patterns: `otp_request`, `pin_request`, `urgency`, `fake_reward`, `refund_scam`, `impersonation`, `payment_request`, `suspicious_link`.
  - Calculates non-overlapping highlight character spans `[start, end]` for frontend UI rendering.
  - Deterministic rule verdict computation: `likely_scam` (if PIN/OTP or >= 2 tactics), `suspicious` (1 tactic), `likely_safe` (0 tactics).
  - Integrates Gemini API when `GEMINI_API_KEY` is present (with 5s timeout and Zod JSON schema validation).
  - Deterministic template fallback when API key is unset or external call times out.
- `backend/src/services/aiService.js`: Privacy-preserving explanation service that passes only anonymized, derived features (never raw PII, PINs, or card data) to generate natural language explanations for payments with risk >= 30.
- `backend/src/controllers/scamController.js` & `backend/src/routes/scamRoutes.js`: Exposed `POST /api/scam-check` with rate limiting.

**How it works:**
1. Input text is validated and scanned against regex tactic dictionaries.
2. Matches are mapped to highlighted character ranges.
3. If configured, Gemini reviews the tactics and outputs reasoning and defensive recommendations.
4. If Gemini is unreachable or unconfigured, the deterministic rule engine produces immediate, reliable verdicts.

---

## Phase 6: Cryptographic Transaction Integrity Chain & Tamper Detection (Finished)

**Goal:** Implement a verifiable, immutable SHA-256 hash-chained audit log with canonical JSON serialization, genesis block anchoring, and real-time tamper detection.

**What was built:**
- `backend/src/utils/canonicalJson.js`: Deterministic JSON stringifier with recursive object key sorting.
- `backend/src/services/auditService.js`: Cryptographic audit service:
  - Formats entries with sequential sequence numbers, UTC timestamps, domain prefix `guardianpay-audit/v1`, and previous entry hash.
  - Computes entry hash: `SHA-256("guardianpay-audit/v1:" + previousHash + ":" + canonicalPayload)`.
  - Genesis entry hash anchored to 64 zeros (`0000000000000000000000000000000000000000000000000000000000000000`).
  - Full chain validator `verifyChain()` that recomputes every block hash and checks sequence continuity.
- `backend/src/store/repository.js`: Added `tamperAudit(seq, alterations)` allowing deliberate modification of audit records for live hackathon demonstration of tamper detection.
- `backend/src/controllers/adminController.js` & `backend/src/routes/adminRoutes.js`:
  - `GET /api/admin/audit`: Lists audit trail.
  - `GET /api/admin/audit/verify`: Returns verification report `{ valid: boolean, entriesCount, firstBrokenSeq }`.
  - `POST /api/admin/dev/tamper`: Simulates tampering on a specific sequence block.

**How it works:**
1. Every critical event (login, payment, hold, lockout) logs an audit entry.
2. Each block includes the SHA-256 hash of the preceding block, creating an unbroken cryptographic chain.
3. If an attacker modifies any historical block (amount, user, or timestamp), `verifyChain` detects the hash mismatch and immediately flags the exact sequence number where integrity was breached.

---

## Phase 6B: Payment Link Security & SSRF Protection (Finished)

**Goal:** Implement institutional-grade protected payment link verification with syntactic validation, protocol enforcement, complete SSRF protection (localhost, RFC1918, cloud metadata), brand typosquatting detection, cryptographic HMAC verification tokens, and open-redirect prevention.

**What was built:**
- `backend/src/services/linkSecurityService.js`:
  - Syntactic validation and protocol restriction (HTTP/HTTPS only).
  - SSRF engine blocking `127.0.0.1`, `localhost`, `0.0.0.0`, `::1`, RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), cloud metadata (`169.254.169.254`, `metadata.google.internal`), and integer/hex IP encodings.
  - Phishing detection: Brand typosquatting (`guardianpay`, `paytm`, `phonepe`, `sbi`, etc. combined with `login`, `verify`, `kyc`, `refund`), suspicious TLDs (`.top`, `.xyz`, etc.), URL shorteners (`bit.ly`, `tinyurl.com`), and dangerous executable downloads (`.apk`, `.exe`, `.sh`).
  - Scoring and tiered action: `ALLOW` (0–29), `WARN` (30–69), `BLOCK` (70–100).
  - Cryptographic HMAC-SHA256 verification tokens (5-minute expiry).
  - Safe redirect validator preventing open redirects.
- `backend/src/controllers/linkController.js`:
  - `POST /api/links/verify`: Analyzes URL and returns structured security report + token.
  - `GET /api/links/redirect`: Validates cryptographic token, enforces warning acknowledgments, and performs secure redirection.
- `backend/src/routes/linkRoutes.js`: Mounted at `/api/links` and `/api/v1/links`.
- `backend/scripts/testLinkSecurity.js`: Automated test suite covering clean URLs, malformed URLs, prohibited schemes, SSRF targets, brand typosquatting, malware APKs, URL shorteners, token validity, and open-redirect prevention.
- `frontend/src/app/verify-link/page.tsx`: Interactive, responsive user-facing scanner page with demo scenarios, risk score gauge, threat indicators list, and safe redirection flow.
- `frontend/src/components/layout/Sidebar.tsx`: Added "Link Scanner" to the navigation menu.

**How it works:**
1. User receives a protected link or inputs a URL into the scanner.
2. The backend analyzes the destination through syntactic, SSRF, threat intelligence, and brand reputation layers.
3. For low-risk links, an HMAC verification token is issued allowing safe redirection.
4. For medium-risk links, warning confirmation is required before redirection.
5. For high-risk or SSRF targets, the destination is quarantined with `BLOCK`, and redirection is disabled.

---

## Phase 7: Administrative Review Queue & Security Operations Centre (Finished)

**Goal:** Implement role-based administrative capabilities (RBAC) to inspect live transactions, query high-risk alerts, generate executive summaries, and manually approve or reject held payments.

**What was built:**
- `backend/src/middleware/requireAdmin.js`: RBAC middleware verifying `req.user.role === 'admin'`, rejecting non-admins with HTTP 403 `FORBIDDEN`.
- `backend/src/controllers/adminController.js`: Complete administrative control suite:
  - `GET /api/admin/transactions`: Lists all system transactions with filtering by status and risk level.
  - `GET /api/admin/transactions/:id`: Retrieves full risk signals, audit trails, and payment breakdown.
  - `GET /api/admin/transactions/:id/summary`: Natural language executive summary combining signals and AI reasoning.
  - `POST /api/admin/transactions/:id/approve`: Releases quarantined `heldPaise` to recipient wallet, marks transaction `success`, and logs `TXN_APPROVED`.
  - `POST /api/admin/transactions/:id/reject`: Returns quarantined `heldPaise` to sender wallet, marks transaction `rejected`, and logs `TXN_REJECTED`.
  - `GET /api/admin/stats`: Aggregates platform statistics: total volume, active holds, blocked attacks, and ledger verification status.
- `backend/src/routes/adminRoutes.js`: Protected admin route tree mounted at `/api/admin`.

**How it works:**
1. Administrators authenticate via standard credentials (`admin@guardianpay.internal`).
2. High-risk transactions quarantined under `hold` appear in the admin review queue.
3. The administrator reviews the 6 risk signals and AI explanation, then submits either `approve` (crediting receiver) or `reject` (refunding sender).
4. All administrative overrides are cryptographically sealed in the audit chain.

---

## Phase 8: Production Polish, Demonstration Scenarios & Seed Data (Finished)

**Goal:** Populate realistic demo accounts, establish baseline transaction patterns for anomaly detection, deliver complete test suites, and configure frontend proxy integration.

**What was built:**
- `backend/scripts/seed.js`: Pre-populates 6 diverse demo accounts:
  1. `Alice Sharma` (`alice@example.com` / `alice@guardianpay`, balance ₹84,250, 12 historical baseline payments).
  2. `Bob Smith` (`bob@example.com` / `bobsmith@guardianpay`, balance ₹50,000).
  3. `Carol Danvers` (`carol@example.com` / `carol@guardianpay`, balance ₹30,000).
  4. `Aegis Supermart` (`merchant@example.com` / `aegismerchant@guardianpay`, balance ₹1,50,000).
  5. `Rogue Actor` (`darknet@guardianpay`, attacker demo persona).
  6. `Security Admin` (`admin@guardianpay.internal` / `admin@guardianpay`, balance ₹1,00,000, role: `admin`).
  - Pre-seeds 1 quarantined `held` transaction for immediate review queue demonstration.
- `backend/scripts/testFullBackend.js`: Comprehensive automated end-to-end test suite testing all 8 phases in sequence with zero failures.
- `frontend/next.config.ts`: Configured Next.js API rewrite proxy: `/api/:path*` -> `http://localhost:4000/api/:path*`.
- `frontend/.env.local`: Configured `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Dual API route mounting: Both `/api/*` and `/api/v1/*` supported across backend and frontend.

**How to test it:**
1. Start backend: `npm --prefix backend run dev` (running on port 4000).
2. Start frontend: `npm run dev` (running on port 3000).
3. Run full integration suite: `npm --prefix backend test` -> 100% assertions passing.
4. Test live proxy: `curl http://localhost:3000/api/health` -> HTTP 200 OK.


---

## Phase 9: HackMatrix Offline Round Judging Optimization & Audit (Finished)

**Goal:** Conduct exhaustive full-stack inspection, resolve TypeScript compiler and linting errors, verify zero-double-spending race conditions, audit SSRF/link protections, create official offline judging deliverables, and prepare 10-step live judge demonstration protocol.

**What was built & fixed:**
- **TypeScript Compiler Remediation**: Resolved 5 genuine compiler errors in `frontend/src/lib/types.ts`, `frontend/src/components/ui/HashChip.tsx`, and `frontend/src/components/payments/PaymentResultStep.tsx` without weakening `tsconfig.json`. `tsc --noEmit` exits with Code 0.
- **Frontend Linting Remediation**: Resolved React Compiler `react-hooks/refs` access during render in `frontend/src/components/background/SiteBackground.tsx` by introducing `spotlightRef` with GPU-accelerated `transform: translate3d(...)` updates in `requestAnimationFrame`. `npm run lint` exits with Code 0.
- **Root NPM Scripts**: Configured `npm test` (runs 30-assertion QA audit), `npm run typecheck`, `npm run lint`, `npm run dev`, and `npm run dev:backend`.
- **Root `README.md`**: Complete overhaul replacing boilerplate with comprehensive, publication-grade documentation spanning problem statement, architecture, 6 fraud signals, 4 policy actions, setup, and live demo commands.
- **Official Judging Deliverables**:
  - `docs/HACKMATRIX_JUDGING_AUDIT.md`: 5-category evidence-based self-audit scoring matrix (Total Estimated Score: 96.5 / 100).
  - `docs/HACKMATRIX_PITCH_SCRIPT.md`: 5-minute timed technical pitch script with word-for-word talking points.
  - `docs/HACKMATRIX_LIVE_DEMO_SCRIPT.md`: 10-step click-by-click live judge walkthrough with expected backend/frontend outputs.
  - `docs/HACKMATRIX_JUDGE_QA.md`: 28 comprehensive technical and architectural Q&As.
  - `docs/HACKMATRIX_ARCHITECTURE.md`: Complete engineering blueprint with Mermaid data flow and sequence diagrams.
  - `docs/HACKMATRIX_VIDEO_OUTLINE.md`: 2-3 minute video demonstration script and storyboard.
  - `docs/HACKMATRIX_FINAL_TEST_REPORT.md`: Empirical verification evidence across 97 checks.

**How to test it:**
1. Run full automated QA audit from root: `npm test` -> 30/30 passed (0 failures).
2. Run TypeScript check: `npm run typecheck` -> 0 errors (Code 0).
3. Run ESLint check: `npm run lint` -> 0 errors (Code 0).
4. Verify backend health: `curl http://localhost:4000/api/health` -> HTTP 200 OK.
5. Verify frontend availability: `curl -I http://localhost:3000/` -> HTTP 200 OK.

---

## Phase 10: Groq AI API Integration (`openai/gpt-oss-20b`) (Finished)

**Goal:** Integrate Groq API as the primary explainable AI engine for risk reviews, admin case summaries, and scam tactic analysis while strictly preserving deterministic fraud decision authority and privacy constraints.

**What was built & fixed:**
- **Environment Schema (`backend/src/config/env.js`)**: Added `GROQ_API_KEY` and `GROQ_MODEL` (default: `openai/gpt-oss-20b`) with multi-location `.env` resolution.
- **AI Risk Intelligence Engine (`backend/src/services/aiService.js`)**:
  - Integrated Groq OpenAI-compatible Chat Completions API (`https://api.groq.com/openai/v1/chat/completions`) with JSON mode (`response_format: { type: 'json_object' }`).
  - Implemented 3-tier provider cascade: **Groq (`openai/gpt-oss-20b`) → Google Gemini (`gemini-2.0-flash`) → Deterministic Template Fallback**.
  - Strict Zod schema validation (`aiReviewSchema`) verifying `summary`, `keyReasons`, `recommendedAction`, `userMessage`, and `adminNote`.
  - Admin case investigation summary generation with prompt sanitization.
- **AI Scam Analysis (`backend/src/services/scamAnalyzer.js`)**:
  - Added `_callGroqScamReview` with Zod-validated structured output (`verdict`, `reasons`, `safeActions`).
  - Seamless fallback to baseline heuristic extraction upon AI timeout or network error.
- **Security & Privacy Invariants**:
  - Zero leakage of credentials: Passwords, PINs, OTPs, session JWTs, and full bank account numbers are never sent to Groq. Only derived, privacy-masked telemetry is dispatched.
  - Deterministic authority invariant: Groq suggestions are strictly advisory and never override risk scores (0–100) or policy actions (`ALLOW`, `STEP_UP`, `HOLD`, `BLOCK`).
  - Active timeout protection: 6,000ms `AbortController` cancellation for all AI requests.
- **Dedicated Test Suite (`backend/scripts/testGroqIntegration.js`)**:
  - Test 1: Direct Groq API Connectivity & Authentication (HTTP 200).
  - Test 2: Structured Risk Explanation with Zod Schema Validation.
  - Test 3: Admin Fraud Case Investigation Summary Generation.
  - Test 4: Scam Message Analysis with Tactic Extraction & AI Advice.
  - Test 5: Invariant Verification (AI never mutates deterministic policy decision).
  - Test 6: Low Risk Transfer (< 30 score) skips AI review for sub-millisecond execution.
  - Test 7: Graceful degradation on invalid API key.
  - Test 8: AbortController timeout cancellation resilience.
- **NPM Integration**: Configured `npm run test:groq` in root and backend `package.json`.

**How to test it:**
1. Run Groq test suite: `npm run test:groq` -> 8/8 passed (0 failures).
2. Run full platform QA suite: `npm test` -> 30/30 passed (0 failures).
3. Run TypeScript check: `npm run typecheck` -> 0 errors.
4. Run ESLint check: `npm run lint` -> 0 errors.
