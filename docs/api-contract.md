# GUARDIANPAY API Contract (v1.0.0 — Unified Specification)

> **Base Path:** `/api`  
> **Default Port:** `4000` (In local development: `http://localhost:4000/api`)  
> **Format:** REST JSON (strict ESM)  
> **Simulation Notice:** All monetary operations, account balances, and UPI transfers in GUARDIANPAY are simulated. No real-world banking rails, UPI switches, or card networks are connected.

---

## 1. Global Conventions

### 1.1 Success Envelope
Every successful response returns HTTP 200 (or 201 for resource creation) with:
```json
{
  "success": true,
  "...": "payload fields"
}
```

### 1.2 Error Envelope
Every non-2xx error returns the standard structured error envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation of error",
    "details": {}
  }
}
```
`details` is always guaranteed to be an object (never null or undefined).

### 1.3 Standard Error Codes
| Error Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body, query string, or route parameter failed Zod schema |
| `NOT_AUTHENTICATED` | 401 | Missing or invalid session JWT cookie / Bearer token |
| `FORBIDDEN` | 403 | Caller does not possess the required role (e.g. `admin`) |
| `NOT_FOUND` | 404 | Targeted resource (user, transaction, audit entry) not found |
| `RATE_LIMITED` | 429 | Exceeded maximum allowed requests in the time window |
| `INVALID_PIN` | 400 | Supplied transaction PIN does not match hash |
| `PIN_LOCKED` | 423 | 5 failed PIN attempts recorded; locked for 15 minutes |
| `INSUFFICIENT_FUNDS` | 400 | Sender balance is lower than `amountPaise` |
| `LIMIT_EXCEEDED` | 400 | Transfer exceeds ₹50,000 per-txn cap or ₹1,00,000 daily cap |
| `SELF_TRANSFER` | 400 | Sender and receiver UPI identifiers are identical |
| `RECEIVER_NOT_FOUND` | 404 | Payee UPI ID does not correspond to an existing account |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | `Idempotency-Key` header missing from `POST /api/payments` |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency key reused with different payload parameters |
| `REQUEST_IN_PROGRESS` | 409 | An identical idempotency key is currently processing |
| `INVALID_STATE` | 400 | Operation not valid for the current transaction status |
| `EMAIL_TAKEN` | 409 | Attempted registration with an existing email address |

### 1.4 Core Enums & Data Types
- **Money**: Integer Paise (1 INR = 100 paise).
- **Transaction Status**: `'initiated'` | `'pending_verification'` | `'held'` | `'success'` | `'failed'` | `'blocked'` | `'reversed'`
- **Risk Level**: `'low'` | `'medium'` | `'high'` | `'critical'`
- **Policy Action**: `'allow'` | `'step_up'` | `'hold'` | `'block'`
- **Signal Status**: `'completed'` | `'triggered'` | `'not_evaluated'`
- **Signal IDs (6 fixed)**:
  1. `amount_anomaly` (max 30 pts)
  2. `velocity` (max 20 pts)
  3. `new_payee` (max 15 pts)
  4. `odd_hours` (max 10 pts)
  5. `failed_pin_attempts` (max 15 pts)
  6. `balance_drain` (max 10 pts)
- **User Role**: `'user'` | `'admin'`

---

## 2. Complete Endpoint Inventory (All 21 Endpoints)

### Phase 0: Foundation
1. `GET /api/health` — System status & timestamp.

### Phase 1: Authentication & Wallet
2. `POST /api/auth/register` — Register new user, seed wallet with 1,000,000 paise (₹10,000).
3. `POST /api/auth/login` — Rate-limited login; sets httpOnly `session_token` cookie; returns user.
4. `POST /api/auth/logout` — Revokes session `jti` and clears cookie.
5. `GET /api/auth/me` — Returns current authenticated user (without passwords/PINs).
6. `GET /api/wallet` — Returns current balance, held funds, and daily spending tallies.
7. `GET /api/wallet/lookup/:upiId` — Validates payee and returns privacy-masked display name (`Bo* S****`).

### Phase 2, 3, 4: Payments, Risk & Automated Protection
8. `POST /api/payments` — Main payment pipeline. Requires `Idempotency-Key` header, 6-signal risk evaluation, and automated policy action (`allow`, `step_up`, `hold`, `block`).
9. `GET /api/payments` — Lists caller's transaction history with optional status filter.
10. `GET /api/payments/:id` — Retrieves transaction detail (caller must be sender, receiver, or admin).
11. `POST /api/payments/:id/confirm` — Completes step-up challenge for `pending_verification` transactions using PIN.

### Phase 5: Gemini AI Intelligence
12. `POST /api/scam-check` — Scam message analyzer with heuristic tactics + Gemini review.
13. `GET /api/admin/transactions/:id/summary` — Generates AI case summary for reviewer.

### Phase 6: Cryptographic Integrity Chain & Payment Link Security
14. `GET /api/admin/audit` — Lists recent SHA-256 hash-chained audit entries.
15. `GET /api/admin/audit/verify` — Verifies the entire cryptographic hash chain; reports first broken sequence if tampered.
16. `POST /api/admin/dev/tamper` — Development demo endpoint to simulate ledger tampering (mounted only in `NODE_ENV=development` + `DEMO_MODE=true`).
17. `POST /api/links/verify` — Evaluates external payment links for SSRF, cloud metadata probing, typosquatting, and dangerous downloads. Issues HMAC verification token.
18. `GET /api/links/redirect` — Protected redirect endpoint validating cryptographic token and blocking malicious destinations.

### Phase 7: Admin Monitoring & Investigation
19. `GET /api/admin/transactions` — Review queue with status filters (`held`, `blocked`, `pending_verification`).
20. `GET /api/admin/transactions/:id` — Full transaction inspection with signals, audit entries, and AI telemetry.
21. `GET /api/admin/transactions/:id/summary` — Generates AI case summary for reviewer.
22. `POST /api/admin/transactions/:id/approve` — Approves held transaction (`release_to_receiver`).
23. `POST /api/admin/transactions/:id/reject` — Rejects held transaction (`return_to_sender` refund).
24. `GET /api/admin/stats` — Aggregate metrics: fraud counts, held/blocked totals, risk distributions, signal occurrences.
