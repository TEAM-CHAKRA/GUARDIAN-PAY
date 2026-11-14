## AMENDMENTS (these override anything below that conflicts)

1. Storage: use an async in-memory repository (`src/store/repository.js`) for now.
   Do NOT add Prisma, SQLite, Mongo or any database yet. Optional: persist a JSON
   snapshot to `data/snapshot.json` on every write so a server restart does not
   wipe the demo. Routes and services must only call the repository, never a
   database or a file directly, so a teammate can swap the implementation later.
2. Priorities: Phases 0, 1, 2, 3, 4, 5 and 8 are P0. The integrity chain (Phase 6)
   and the admin dashboard API (Phase 7) are P1. If time runs short, cut from
   Phase 7 first, then Phase 6. Never cut Phases 0 to 4.
3. IDs: transaction, audit and user IDs use at least 16 random hex characters
   (crypto.randomBytes), e.g. TXN-20261114-<16hex>, USR-<16hex>, AUD-<16hex>.
   IDs are looked up case-insensitively (one canonical case internally).
4. Money: all amounts are INTEGER PAISE (1 INR = 100 paise). Never use floats for
   money anywhere (API, repository, risk engine, Gemini input). Currency is
   always "INR". All money is simulated.
5. Atomic transfer: the repository exposes ONE method, `executeTransfer`, that
   validates and applies debit + credit + transaction record + audit entry as a
   single all-or-nothing operation (serialize with a per-wallet or global mutex;
   validate first, then apply; roll back fully on any error). Routes must never
   debit and credit in two separate calls.
6. Idempotency: `POST /api/payments` requires an `Idempotency-Key` header
   (8 to 64 chars). Scope keys per user. Same key + same payload returns the
   stored result with no second charge. Same key + different payload returns
   409 IDEMPOTENCY_CONFLICT. Keys expire after 24 hours.
7. Auth: prefer argon2; use bcryptjs if the native build fails on Windows.
   Session is a JWT in an httpOnly, SameSite=Lax cookie (Secure in production),
   30-minute expiry, with logout revocation via `jti` stored in the repository.
   The transaction PIN (4 to 6 digits) is a separate secret, hashed the same way,
   and never returned or logged. 5 failed PINs in 15 minutes locks payments for
   15 minutes (423 PIN_LOCKED).
8. Rate limiting applies to: login, register, `POST /api/payments`,
   `POST /api/payments/:id/confirm`, and `POST /api/scam-check`.
9. Risk signals (6 total, fixed IDs for coverage): amount_anomaly, velocity,
   new_payee, odd_hours, failed_pin_attempts, balance_drain. A signal that cannot
   be evaluated (for example not enough history) reports `not_evaluated`.
   `not_evaluated` never counts as completed and is never treated as clean.
10. Policy table is fixed and lives in `src/config/policy.js` (see Phase 4).
    The RULES decide the action. Gemini never changes the action, never moves
    money and never sets the score.
11. AI rules: Gemini receives structured, derived evidence only (signal names,
    bucketed values, masked UPI IDs). Never send PINs, tokens, passwords, emails,
    full names or full raw UPI IDs. Treat all user text (notes, pasted messages)
    as untrusted. Request JSON via responseMimeType + responseSchema AND validate
    the output with zod. On timeout (5s), error or schema failure, use the
    template fallback and set `ai.source = "template"`. Read the model name from
    `GEMINI_MODEL` in .env, never hardcode it.
12. Held funds: when a payment is HELD, debit the sender into a `heldPaise`
    bucket immediately and do NOT credit the receiver. Admin approve credits the
    receiver. Admin reject returns funds to the sender (status `reversed`).
    BLOCKED payments move no money at all.
13. Step-up: a `pending_verification` payment moves no money until the user
    calls `POST /api/payments/:id/confirm` with the correct PIN. Pending step-ups
    expire after 5 minutes (status `failed`, reason `STEP_UP_EXPIRED`).
14. Integrity chain: audit entries are hash-chained (SHA-256 over the previous
    hash + canonical JSON of the entry). Store the exact canonical string that
    was hashed. Canonical JSON sorts keys recursively. Never put PINs, tokens or
    full message text in an audit entry.
15. Hard limits (independent of risk score, configurable in `src/config/limits.js`):
    max per transaction 50,000 INR, max per day 1,00,000 INR. Exceeding returns
    LIMIT_EXCEEDED and is not scored.
16. Odd hours are evaluated in Asia/Kolkata time (00:00 to 05:00). All stored
    timestamps are UTC ISO strings.
17. Simulation honesty: no real UPI, bank, card or personal financial data
    anywhere. UPI IDs use the fake format `name@guardianpay` and are validated by
    regex. The UI and README must say "UPI-style simulation".
18. Repository is async: every method in `src/store/repository.js` returns a
    Promise and every caller must await it. Returned records are plain JSON-safe
    data (dates as ISO strings, no Map/Set/class instances) and are copies, not
    references. Not-found returns null.
19. Secrets: never commit `.env`. `GEMINI_API_KEY` stays on the backend only. Never
    log PINs, passwords, tokens, API keys or full request bodies of auth routes.
20. Stub `GET /api/auth/me` in Phase 0: return 401 NOT_AUTHENTICATED in the
    standard error envelope until real auth exists. The frontend calls it on
    every page load.
21. After finishing EVERY phase, append an entry to `workflow.md` using the
    template in section 6, before starting the next phase.
22. Demo-only tamper route: `POST /api/admin/dev/tamper` exists only when
    `NODE_ENV=development` AND `DEMO_MODE=true`. It must not be mounted otherwise.

# GuardianPay Backend Implementation Specification & Roadmap

> **Document Version:** 1.0.0 (Harmonized with Architecture Amendments)
> **Project name:** GuardianPay (repo: github.com/TEAM-CHAKRA/GUARDIAN-PAY)
> **Target Base Path:** `/api` (Port: `4000`, proxied via the Vite dev server `http://localhost:5173/api`)
> **Source Contract:** `docs/api-contract.md` (written jointly by backend and frontend in Phase 0)
> **Assigned To:** Backend owners (see section 7 for the team split)
> **Status:** Template. Adapt scope once the on-site problem statement is released.

---

## 1. Executive Summary & Architecture Overview

GuardianPay is a UPI-style payment simulation with a security and fraud-protection layer. Every payment is authenticated, validated, risk-scored by deterministic rules, acted on automatically (allow, step-up, hold or block), explained by Gemini, and recorded in a tamper-evident audit chain. Admins review held payments from a monitoring dashboard.

It is a **simulation**. No real banks, UPI rails or card data are used. The pitch is: "this is the trust layer that sits between a payment app and the banking rails."

### Architectural Core Principles (incorporating Amendments)
- **Zero Database Direct Access (In-Memory Repository):** All state lives behind `src/store/repository.js`. Routes and services call the repository only. A teammate can replace the implementation later without touching business logic.
- **Atomic, Idempotent Money Movement:** One `executeTransfer` repository operation moves money all-or-nothing. Idempotency keys make retries and double-clicks safe. Amounts are integer paise.
- **Rules Decide, AI Explains:** The rules engine produces the score and the action. Gemini receives derived evidence and returns an explanation. If Gemini fails, the template fallback produces the explanation and nothing else changes.
- **Coverage Integrity:** The risk engine has **6 fixed signals** (`amount_anomaly`, `velocity`, `new_payee`, `odd_hours`, `failed_pin_attempts`, `balance_drain`). `not_evaluated` signals never count as completed and are never treated as clean.
- **Tamper-Evident Audit:** Security-relevant events form a SHA-256 hash chain. `GET /api/admin/audit/verify` recomputes the chain and reports the first broken entry.
- **Secure ID Generation:** IDs use at least 16 cryptographically secure random hex characters, e.g. `TXN-YYYYMMDD-<16hex>`.

```
                         +----------------------------------+
                         |   GuardianPay Frontend (React)   |
                         +----------------+-----------------+
                                          | /api (Vite proxy)
                                          v
+----------------------------------------------------------------------------------+
|                          Node.js / Express API Server                            |
|  +----------------+   +--------------------+   +-------------------------------+ |
|  | Auth + Session |   | Payment Pipeline   |   | Admin + Monitoring            | |
|  | (hash, JWT,PIN)|   | validate > score > |   | (review queue, stats, audit)  | |
|  +-------+--------+   | decide > execute   |   +---------------+---------------+ |
|          |            +---------+----------+                   |                 |
|          |                      |                              |                 |
|          v                      v                              v                 |
|  +--------------------------------------------------------------------------+    |
|  |          Async In-Memory Repository (src/store/repository.js)            |    |
|  | [users] [wallets] [transactions] [idempotency] [auditLog] [sessions]      |    |
|  +--------------------------------------------------------------------------+    |
+-----------------------------+---------------------------------+------------------+
                              |                                 |
                  +-----------+-----------+         +-----------+-------------+
                  | Rules Engine          |         | Gemini Layer            |
                  | 6 signals > score >   |         | verdict JSON, scam      |
                  | policy action         |         | check, admin summary    |
                  +-----------------------+         | (+ template fallback)   |
                                                    +-------------------------+
```

---

## 2. Shared Enums & Data Types Reference

All enums must match `docs/api-contract.md` and `frontend/src/utils/constants.js`:

| Enum Name | Allowed Values |
|---|---|
| transaction `status` | `initiated`, `pending_verification`, `held`, `success`, `failed`, `blocked`, `reversed` |
| risk `level` | `low`, `medium`, `high`, `critical` |
| policy `action` | `allow`, `step_up`, `hold`, `block` |
| signal `status` | `completed`, `triggered`, `not_evaluated` |
| signal `id` | `amount_anomaly`, `velocity`, `new_payee`, `odd_hours`, `failed_pin_attempts`, `balance_drain` |
| `ai.status` | `completed`, `fallback`, `skipped` |
| `ai.source` | `gemini`, `template` |
| user `role` | `user`, `admin` |
| audit event `type` | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PIN_FAILED`, `PIN_LOCKED`, `TXN_CREATED`, `TXN_STEP_UP_REQUIRED`, `TXN_HELD`, `TXN_BLOCKED`, `TXN_SUCCESS`, `TXN_FAILED`, `TXN_REVERSED`, `ADMIN_APPROVED`, `ADMIN_REJECTED` |
| scam tactic keys | `urgency`, `impersonation`, `fake_reward`, `otp_request`, `pin_request`, `payment_request`, `suspicious_link`, `refund_scam`, `social_engineering` |
| error codes | `VALIDATION_ERROR`, `NOT_AUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `INVALID_PIN`, `PIN_LOCKED`, `INSUFFICIENT_FUNDS`, `LIMIT_EXCEEDED`, `SELF_TRANSFER`, `RECEIVER_NOT_FOUND`, `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE` |

### Core data shapes

```
User        { id, name, email, role, upiId, passwordHash, pinHash, pinFailedAt[], pinLockedUntil, createdAt }
Wallet      { userId, balancePaise, heldPaise, dailySpentPaise, dailyResetDate }
Transaction { id, senderUserId, senderUpiId, receiverUpiId, amountPaise, currency, note,
              status, statusReason, risk: { score, level, action, signals[], coverage },
              ai: { status, source, verdict }, createdAt, updatedAt }
Signal      { id, status, points, detail }
AuditEntry  { id, seq, type, actorId, subjectId, data, ts, prevHash, recordHash, canonical }
```

Error envelope (same as before): `{ success: false, error: { code, message, details } }`. Success: `{ success: true, ...data }`.

---

## 3. Step-by-Step Implementation Roadmap (By Phases)

---

### Phase 0: Setup, Project Layout & In-Memory Repository [P0] (target 0:00 to 1:30)

**Goal:** Express server on port 4000, repository abstraction, error envelopes, rate limiting, seed script skeleton, and the written API contract.

#### 1. Tech Stack
- **Runtime:** Node.js v20+ LTS, Express (ESM)
- **Data Layer:** in-memory repository only. No database or ORM.
- **Validation:** `zod`
- **Security:** `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `argon2` (or `bcryptjs`), `jsonwebtoken`
- **Crypto:** native `node:crypto`
- **AI:** official Google GenAI SDK (`@google/genai`) or plain REST. Check the current docs in Google AI Studio for the SDK and the model name.

#### 2. Project Directory Layout
```
backend/
  src/
    app.js                     # Express setup and middleware assembly
    server.js                  # Listens on port 4000
    config/
      env.js                   # zod-validated env vars
      constants.js             # enums, signal IDs, error codes
      policy.js                # score-to-action table
      limits.js                # per-txn and daily limits, rate-limit values
    store/
      repository.js            # IN-MEMORY REPOSITORY (all state)
    middleware/
      auth.js                  # JWT cookie validator
      requireAdmin.js
      errorHandler.js
      rateLimiter.js
      validate.js
    routes/                    # authRoutes, walletRoutes, paymentRoutes,
                               # scamRoutes, adminRoutes, healthRoutes
    controllers/               # one controller per route file
    services/
      authService.js           # hashing, JWT, PIN lockout
      paymentService.js        # the payment pipeline
      riskEngine.js            # 6 signals, scoring, level
      policyService.js         # score -> action
      aiService.js             # Gemini calls + template fallback
      scamAnalyzer.js          # rule-based indicators + Gemini review
      auditService.js          # hash chain append + verify
    utils/
      idGenerator.js
      money.js                 # paise helpers, formatting
      canonicalJson.js         # sorted-key serializer
      response.js              # sendSuccess / sendError
      logger.js                # redacts secrets
    seed/
      seed.js                  # demo users, balances, history
  .env.example
  package.json
  README.md
docs/
  api-contract.md
workflow.md
```

#### 3. Repository Interface (`src/store/repository.js`)
All methods are async and return plain JSON-safe copies:
```javascript
export class MemoryRepository {
  // users and sessions
  async createUser(user) {}
  async getUserById(id) {}
  async getUserByEmail(email) {}
  async getUserByUpiId(upiId) {}
  async updateUser(id, updates) {}
  async createSession(jti, data) {}
  async isSessionRevoked(jti) {}
  async revokeSession(jti) {}

  // wallets
  async getWallet(userId) {}

  // money movement (ATOMIC, the only way to change balances)
  async executeTransfer({ transaction, mode }) {}
  // mode: "settle" (debit sender, credit receiver)
  //       "hold"   (debit sender into heldPaise)
  //       "release_to_receiver" (admin approve)
  //       "return_to_sender"    (admin reject)

  // transactions
  async createTransaction(record) {}
  async getTransaction(id) {}
  async updateTransaction(id, updates) {}
  async listTransactionsByUser(userId, { limit, status }) {}
  async listTransactions({ status, limit }) {}

  // idempotency
  async getIdempotencyRecord(userId, key) {}
  async saveIdempotencyRecord(userId, key, { payloadHash, response }) {}

  // audit chain
  async appendAudit(entry) {}
  async listAudit({ limit }) {}
  async getLastAudit() {}
}
export const repository = new MemoryRepository();
```

#### 4. Standard Helpers & Rate Limits
- `sendSuccess(res, data, status = 200)` and `sendError(res, { code, message, details }, status = 400)`.
- Rate limits (per IP, plus per user where authenticated):
  - `POST /api/auth/login`: 5 per 15 minutes
  - `POST /api/auth/register`: 10 per hour
  - `POST /api/payments`: 20 per 10 minutes
  - `POST /api/payments/:id/confirm`: 5 per 15 minutes
  - `POST /api/scam-check`: 15 per 10 minutes (protects Gemini quota)

#### 5. Deliverables
- Stub `GET /api/auth/me` returning 401 `NOT_AUTHENTICATED`.
- `docs/api-contract.md` with every endpoint in section 4 and the data shapes in section 2.
- `.env.example` (section 5) and an empty `workflow.md`.
- One test Gemini call confirming the key and model name work.

**Done when:** the server runs, `/api/health` returns ok, the stub `/me` returns the 401 envelope, and all three teammates can explain the data model and routes.

---

### Phase 1: Secure Authentication & Wallet [P0] (target 1:30 to 3:00)

**Goal:** Register, login, logout, session, PIN, wallet, and payee lookup.

#### 1. Auth Endpoints
- `POST /api/auth/register`: validate `{ name, email, password, pin }`. Password at least 8 characters, PIN 4 to 6 digits. Hash both. Generate a UPI ID `<slug>@guardianpay` (unique). Create the user and a wallet with a seeded starting balance (for example 10,000 INR = 1,000,000 paise).
- `POST /api/auth/login`: rate-limited. Verify password. Return a generic error for unknown email or wrong password (no user enumeration). Set the httpOnly cookie. Audit `LOGIN_SUCCESS` or `LOGIN_FAILED`.
- `POST /api/auth/logout`: revoke `jti`, clear cookie.
- `GET /api/auth/me`: current user without hashes.

#### 2. Wallet Endpoints
- `GET /api/wallet`: `{ upiId, balancePaise, heldPaise, dailySpentPaise }`.
- `GET /api/wallet/lookup/:upiId`: confirm a payee exists and return a **masked** display name (for example `Bo* S****`), never the email.

#### 3. PIN Handling
- PIN verification is a shared function in `authService` used by Phase 2.
- Track failed attempts in `pinFailedAt[]`. At 5 failures in 15 minutes set `pinLockedUntil` and audit `PIN_LOCKED`.

**Done when:** you can log in as two seeded users, see different balances, look up a payee, and a wrong password or PIN returns the correct error without leaking details.

---

### Phase 2: Reliable Payment Engine [P0] (target 3:00 to 4:30)

**Goal:** `POST /api/payments` with the full validation pipeline, atomic transfer, idempotency and history. At this phase every valid payment settles immediately (risk comes in Phase 3).

#### 1. Pipeline Order (do not reorder)
1. Authenticate and rate-limit.
2. Require the `Idempotency-Key` header, validate the body with zod: `{ receiverUpiId, amountPaise, note?, pin }`. `amountPaise` is a positive integer.
3. Idempotency check: replay the stored response or return 409 on a payload mismatch.
4. Verify PIN (lockout rules from Phase 1).
5. Receiver exists, is not the sender (`SELF_TRANSFER`).
6. Hard limits: per transaction and per day (`LIMIT_EXCEEDED`).
7. Balance check (`INSUFFICIENT_FUNDS`).
8. (Phase 3 inserts risk scoring here.)
9. Create the transaction record, call `executeTransfer`, set the final status, append audit entries.
10. Save the idempotency record and return `201`.

#### 2. Other Endpoints
- `GET /api/payments`: the caller's history, newest first, with status filter.
- `GET /api/payments/:id`: only the sender or receiver may read it. Admins use admin routes.

#### 3. Reliability Rules
- `executeTransfer` is all-or-nothing. If any step throws, balances and records are unchanged.
- A retry with the same idempotency key never creates a second transaction.
- Failures return a clear error code and leave no partial state.

**Done when:** a transfer works, insufficient balance fails cleanly, the same request sent twice charges once, concurrent requests cannot overdraw a wallet, and a wrong PIN is rejected.

---

### Phase 3: Dynamic Transaction Risk Scoring [P0] (target 4:30 to 5:45)

**Goal:** Score every payment 0 to 100 with explainable signals, inserted at step 8 of the pipeline.

#### 1. The 6 Fixed Signals (max points sum to 100)
| Signal ID | Max | Rule (defaults, keep in config) |
|---|---|---|
| `amount_anomaly` | 30 | Compare to the average of the sender's last 10 successful outgoing payments. Ratio >= 3x: 20 points. Ratio >= 5x: 30 points. With fewer than 3 past payments use absolute thresholds (>= 10,000 INR: 15 points) and mark the detail accordingly. |
| `velocity` | 20 | Payments created in the last 5 minutes: 3 or more: 10 points, 5 or more: 20 points. |
| `new_payee` | 15 | First payment to this receiver: 5 points. First payment and amount >= 5,000 INR: 15 points. |
| `odd_hours` | 10 | Current time 00:00 to 05:00 Asia/Kolkata: 10 points. |
| `failed_pin_attempts` | 15 | Failed PINs in the last 15 minutes: 1 to 2: 5 points, 3 or more: 15 points. |
| `balance_drain` | 10 | Amount >= 80% of balance: 5 points, >= 95%: 10 points. |

#### 2. Output Shape
```json
{
  "score": 72,
  "level": "high",
  "action": "hold",
  "signals": [
    { "id": "amount_anomaly", "status": "triggered", "points": 30, "detail": "Amount is 6.2x the recent average" }
  ],
  "coverage": { "completed": 6, "total": 6 }
}
```
- `coverage.completed` counts `completed` and `triggered` signals only. `not_evaluated` never counts and is never treated as clean.
- **Critical combination rule:** `new_payee` + `amount_anomaly` triggered + `odd_hours` triggered sets a minimum score of 60 (hold).
- Store the full `risk` object on the transaction. Return the signal list to the user in plain terms (no internal thresholds).

**Done when:** a normal small payment to a known payee scores low, a large payment to a new payee at night scores high, and every signal appears with a plain reason.

---

### Phase 4: Automated Transaction Protection [P0] (target 5:45 to 6:30)

**Goal:** Turn the score into an action that actually changes what happens to the money.

#### 1. Policy Table (`src/config/policy.js`)
| Score | Level | Action | Behavior |
|---|---|---|---|
| 0 to 29 | `low` | `allow` | Settle immediately. |
| 30 to 59 | `medium` | `step_up` | Status `pending_verification`. No money moves until `POST /api/payments/:id/confirm` with the correct PIN within 5 minutes. |
| 60 to 84 | `high` | `hold` | Debit the sender into `heldPaise`. Status `held`. Admin must approve or reject. |
| 85 to 100 | `critical` | `block` | Status `blocked`. No money moves. User sees the reason. |

#### 2. Endpoint
- `POST /api/payments/:id/confirm`: rate-limited. Accepts `{ pin }`. Valid only for `pending_verification`. On success settle the transfer (`success`). On wrong PIN return `INVALID_PIN` and count toward lockout. On expiry mark `failed` with `STEP_UP_EXPIRED`. Any other state returns `INVALID_STATE`.

#### 3. Rules
- The decision is computed from the score only. Nothing else may override it.
- Every outcome writes an audit entry (`TXN_STEP_UP_REQUIRED`, `TXN_HELD`, `TXN_BLOCKED`, `TXN_SUCCESS`).
- The response always includes a user-facing `message` explaining what happened and what to do next.

**Done when:** a low-risk payment settles instantly, a medium one requires PIN confirmation, a high one is held with funds reserved, and a critical one is blocked with no balance change.

---

### Phase 5: Gemini Intelligence Layer [P0] (target 6:30 to 8:00)

**Goal:** Use Gemini in several distinct, justified ways while keeping the rules in charge.

#### 1. Transaction Risk Review (structured output)
- Called after the decision is persisted, only when `score >= 30`.
- Input (derived evidence only): score, level, triggered signal IDs with their plain details, bucketed amount (for example `"5x to 10x usual"`), account-age bucket, masked receiver (`ra***@guardianpay`), time-of-day bucket. No PINs, tokens, emails, names or raw UPI IDs.
- Output JSON (validated with zod):
```json
{
  "summary": "string",
  "keyReasons": ["string"],
  "recommendedAction": "allow | step_up | hold | block",
  "userMessage": "string",
  "adminNote": "string"
}
```
- `recommendedAction` is stored for display and for the admin queue. **It never changes the real action.** If it disagrees with the policy, flag `ai.disagreesWithPolicy = true` for the admin dashboard.
- Timeout 5 seconds. On timeout, error or invalid JSON use the template fallback (`ai.status = "fallback"`, `ai.source = "template"`).

#### 2. Scam Message Analyzer (`POST /api/scam-check`)
- Body `{ message }`, max 1,000 characters, rate-limited.
- Step 1 (rules): extract links, phone numbers, UPI IDs, and match tactic keys (`urgency`, `otp_request`, `pin_request`, `fake_reward`, `refund_scam`, `impersonation`, `payment_request`, `suspicious_link`, `social_engineering`) with character offsets, non-overlapping.
- Step 2 (Gemini): send the extracted indicators and tactic list plus a redacted message excerpt (numbers and links masked). Return `{ verdict: "likely_scam" | "suspicious" | "likely_safe", reasons[], safeActions[] }`, validated with zod.
- The rule-based tactic list is always returned, even if Gemini fails.

#### 3. Admin Case Summary
- `GET /api/admin/transactions/:id/summary`: Gemini summarizes the held transaction plus the sender's recent activity pattern (derived evidence only) into 3 or 4 sentences for the reviewer. Template fallback applies.

#### 4. Optional Stretch (only if ahead of schedule)
- Gemini function calling with read-only tools scoped to the current user and returning derived data only (`get_recent_activity_summary`, `get_payee_history`). Maximum 3 tool calls per request. Tools can never move money or change state.

#### 5. Prompt Safety
- System prompt states that all user-provided text is untrusted data, not instructions.
- Never put raw notes or messages into the system prompt.

**Done when:** a held transaction shows a Gemini explanation, a pasted scam message is flagged with highlighted tactics, and with the API key removed everything still works using template output.

---

### Phase 6: Cryptographic Transaction Integrity [P1] (target 8:00 to 8:45)

**Goal:** A tamper-evident audit chain with a verification endpoint.

#### 1. Audit Entry Creation (`auditService.appendAudit`)
- Entry fields: `id, seq, type, actorId, subjectId, data, ts, prevHash`.
- Canonical string: `canonicalJson(entryWithoutHashes)` with keys sorted recursively.
- `recordHash = SHA-256("guardianpay-audit/v1" + prevHash + canonicalString)`.
- Genesis `prevHash` is 64 zeros. Store `canonical` and `recordHash` on the entry.
- Appends are serialized so `seq` and `prevHash` never race.

#### 2. Verification
- `GET /api/admin/audit/verify`: recompute every hash from the stored canonical strings and compare. Return `{ valid, entries, firstBrokenSeq, checkedAt }`.
- `GET /api/admin/audit?limit=50`: recent entries (no PINs, no secrets by construction).

#### 3. Demo Tamper Route (amendment 22)
- `POST /api/admin/dev/tamper { seq }` modifies one stored entry so verification fails. Mounted only when `NODE_ENV=development` and `DEMO_MODE=true`.

#### 4. Optional Bonus
- Add an HMAC-SHA256 signature using `INTEGRITY_HMAC_KEY` so an attacker with storage access but without the key cannot recompute a valid chain.

**Done when:** verify returns valid on clean data, and after the tamper route runs it reports the exact broken sequence number.

---

### Phase 7: Admin Fraud Monitoring Dashboard API [P1] (target 8:45 to 9:15)

**Goal:** Endpoints for the admin dashboard. Requires `role = admin`.

- `GET /api/admin/transactions?status=held|blocked|pending_verification&limit=`: review queue with risk objects and AI notes.
- `GET /api/admin/transactions/:id`: full detail with signals, AI output and the related audit trail.
- `POST /api/admin/transactions/:id/approve`: only for `held`. Calls `executeTransfer` with `release_to_receiver`. Status `success`. Audit `ADMIN_APPROVED`.
- `POST /api/admin/transactions/:id/reject`: only for `held`. Calls `executeTransfer` with `return_to_sender`. Status `reversed`. Audit `ADMIN_REJECTED`.
- `GET /api/admin/stats`: counts by status and level, total value held and blocked, top triggered signals, and the last 24 hours of activity as simple time buckets.
- Admins cannot edit amounts, receivers or scores. Every admin action is audited with the admin's user ID.
- Non-admin callers get `403 FORBIDDEN`.

**Done when:** an admin can see the held queue, approve one (receiver credited) and reject one (sender refunded), and the stats endpoint matches the data.

---

### Phase 8: Seed Data, Testing, Hardening & Demo Prep [P0] (target 9:15 to 11:00)

**Goal:** Prove everything works against `docs/api-contract.md` and prepare a reliable demo.

#### 1. Seed Script (`npm run seed`)
- Users: `alice`, `bob`, `carol`, `merchant`, and one `admin`.
- 10 to 15 past successful payments per user so `amount_anomaly` and `new_payee` have history.
- Documented demo scenarios in the README (the exact steps to trigger each outcome).

#### 2. Integration Test Matrix
- [ ] Concurrent payments from one wallet cannot overdraw it.
- [ ] Same idempotency key + same payload charges once. Different payload returns 409.
- [ ] Missing `Idempotency-Key` returns `IDEMPOTENCY_KEY_REQUIRED`.
- [ ] 5 wrong PINs lock payments for 15 minutes.
- [ ] Per-transaction and daily limits are enforced.
- [ ] Each of the 6 signals triggers independently and `not_evaluated` is reported when history is missing.
- [ ] Policy boundaries (29/30, 59/60, 84/85) map to the correct action.
- [ ] Held payments reserve funds, admin approve credits the receiver, admin reject refunds the sender.
- [ ] Blocked payments move no money.
- [ ] Step-up expires after 5 minutes and cannot be confirmed afterward.
- [ ] Gemini failure (invalid key, timeout, bad JSON) falls back to templates without changing any decision.
- [ ] Gemini input contains no PINs, tokens, emails, names or raw UPI IDs.
- [ ] Audit chain verifies on clean data and fails after tampering.
- [ ] Non-admin users get 403 on every admin route.
- [ ] Rate limits trigger on login, payments, confirm and scam-check.
- [ ] No `.env`, API key or secret appears in git or logs.

#### 3. Demo Script (3 minutes)
1. Normal payment settles instantly.
2. Large payment to a new payee at a risky time: held, with the Gemini explanation.
3. Pasted scam message: tactics highlighted and Gemini verdict.
4. Retry the same payment: idempotency prevents a double charge.
5. Admin approves or rejects the held payment.
6. Run audit verify (valid), tamper an entry, run verify again (broken at the exact sequence).

#### 4. Fallback Assets
- Record a backup demo video and take screenshots of every step.
- Keep one pre-seeded state and one fresh state ready.

**Feature freeze at about hour 9:00. After that, bug fixes only.**

---

## 4. API Endpoint Summary

| Method | Path | Auth | Phase |
|---|---|---|---|
| GET | `/api/health` | none | 0 |
| POST | `/api/auth/register` | none | 1 |
| POST | `/api/auth/login` | none | 1 |
| POST | `/api/auth/logout` | user | 1 |
| GET | `/api/auth/me` | user (stub until Phase 1) | 0 / 1 |
| GET | `/api/wallet` | user | 1 |
| GET | `/api/wallet/lookup/:upiId` | user | 1 |
| POST | `/api/payments` | user | 2 / 3 / 4 |
| GET | `/api/payments` | user | 2 |
| GET | `/api/payments/:id` | user | 2 |
| POST | `/api/payments/:id/confirm` | user | 4 |
| POST | `/api/scam-check` | user | 5 |
| GET | `/api/admin/transactions` | admin | 7 |
| GET | `/api/admin/transactions/:id` | admin | 7 |
| GET | `/api/admin/transactions/:id/summary` | admin | 5 |
| POST | `/api/admin/transactions/:id/approve` | admin | 7 |
| POST | `/api/admin/transactions/:id/reject` | admin | 7 |
| GET | `/api/admin/stats` | admin | 7 |
| GET | `/api/admin/audit` | admin | 6 |
| GET | `/api/admin/audit/verify` | admin | 6 |
| POST | `/api/admin/dev/tamper` | admin, dev only | 6 |

---

## 5. Environment Configuration Guide (`.env.example`)

```ini
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DEMO_MODE=false

# Session security
JWT_SECRET="replace-with-long-random-string"
INTEGRITY_HMAC_KEY="replace-with-another-long-random-string"

# AI engine (backend only, never expose to the frontend)
GEMINI_API_KEY=""
GEMINI_MODEL=""            # copy a current Flash-class model name from Google AI Studio

# Limits (paise)
MAX_TXN_PAISE=5000000
MAX_DAILY_PAISE=10000000
```

---

## 6. workflow.md Entry Template (append after EVERY phase)

```
## Phase <N>: <name>   (<time finished>)
**Goal:** one line.
**What was built:** files created or changed, one line each.
**How it works:** 3 to 5 plain-language lines (data flow, key functions).
**How to test it:** exact request(s) or steps and the expected result.
**Decisions and trade-offs:** anything non-obvious and why.
**Known gaps:** what is missing or fragile.
**Likely judge questions:** 2 or 3 questions this phase could raise, with short answers.
**Explained back by:** <teammate who did not build it> (initials/time)
```

---

## 7. Phase Delivery Timeline & Prioritization Matrix

| Phase | Milestone | Priority | Target time | Focus |
|---|---|---|---|---|
| **Phase 0** | Setup, Layout & Repository | **P0** | 0:00 - 1:30 | Repository, envelopes, contract, key test |
| **Phase 1** | Auth & Wallet | **P0** | 1:30 - 3:00 | Hashing, JWT cookie, PIN lockout, lookup |
| **Phase 2** | Payment Engine | **P0** | 3:00 - 4:30 | Atomic transfer, idempotency, limits |
| **Phase 3** | Risk Scoring | **P0** | 4:30 - 5:45 | 6 signals, score, coverage |
| **Phase 4** | Automated Protection | **P0** | 5:45 - 6:30 | Policy table, step-up, hold, block |
| **Phase 5** | Gemini Layer | **P0** | 6:30 - 8:00 | Verdict JSON, scam check, admin summary |
| **Phase 6** | Cryptographic Integrity | **P1** | 8:00 - 8:45 | Hash chain, verify, tamper demo |
| **Phase 7** | Admin Monitoring API | **P1** | 8:45 - 9:15 | Review queue, approve/reject, stats |
| **Phase 8** | Seed, Test, Demo Prep | **P0** | 9:15 - 11:00 | Test matrix, demo script, fallbacks |

**Safe product line:** Phases 0 to 4 form a complete, demo-able secure payment system. If behind schedule, cut Phase 7 first, then Phase 6, and trim Phase 5 to the transaction verdict only.

### Suggested team split
| Member | Owns | Also reads and explains |
|---|---|---|
| 1 | Phases 0, 1, 2, 6 (core, auth, engine, integrity) | Phase 3 and 4 |
| 2 | Phases 3, 4, 5 (risk, protection, Gemini) | Phase 2 |
| 3 | Frontend, Phase 7 integration, seed and demo script, pitch | Phase 5 flow |

---

## 8. Verification Checklist

Before declaring the backend ready for frontend integration without mocks:
1. [ ] No database, ORM or SQLite dependency. All state goes through `src/store/repository.js`.
2. [ ] All money is integer paise. No floats anywhere in money paths.
3. [ ] Every balance change goes through `executeTransfer` (atomic, no partial state).
4. [ ] `POST /api/payments` requires `Idempotency-Key` and is replay-safe.
5. [ ] The 6 fixed risk signals match the contract; `not_evaluated` never counts as completed.
6. [ ] The policy table decides the action and Gemini cannot change it.
7. [ ] Gemini receives derived evidence only; template fallback works with no API key.
8. [ ] The audit chain verifies, and a tampered entry is detected at the exact sequence.
9. [ ] Rate limits are on login, register, payments, confirm and scam-check.
10. [ ] Admin routes return 403 for non-admins and every admin action is audited.
11. [ ] No secrets in git or logs, and the UI states it is a simulation.
12. [ ] `workflow.md` has an entry for every completed phase, each explained back by a teammate.
