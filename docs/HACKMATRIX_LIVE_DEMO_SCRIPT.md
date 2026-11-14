# GUARDIANPAY — HackMatrix Offline Round Live Demo Script

> **Event:** HackMatrix Offline Finals — 14 November 2026  
> **Demo Type:** Step-by-Step Offline Judge Walkthrough (10 Steps)  
> **Target Ports:** Frontend: `http://localhost:3000` | Backend: `http://localhost:4000`  
> **Demo Operator:** Lead Developer / Demonstrator  
> **Audience:** HackMatrix Technical Judging Panel

---

## 1. Pre-Flight Setup & Environment Verification

Before inviting the judges to watch the screen, execute these commands in your terminals:

```bash
# Terminal 1: Backend Daemon (Node.js 24 ESM)
npm run dev:backend
# Expected: "GUARDIANPAY Backend listening on http://localhost:4000"
# Expected: "Demo seed data populated successfully."

# Terminal 2: Frontend Website (Next.js 16.4.6)
npm run dev
# Expected: "Ready on http://localhost:3000"

# Terminal 3: Automated Sanity Verification (Runs in 300ms)
npm test
# Expected: "QA AUDIT COMPLETE: 30 PASSED, 0 FAILED"
```

> **Demo Browser Setup:**
> - Browser Window A: Normal Chrome window at `http://localhost:3000` (User Persona: Alice Sharma).
> - Browser Window B: Incognito Chrome window at `http://localhost:3000/login` (Admin Persona: SecOps Director).

---

## 2. Step-by-Step Judging Walkthrough (10 Steps)

---

### Step 1: User Login & Session Persistence
- **Action**: Open `http://localhost:3000/login`.
- **Click**: Click the quick-fill badge for **Alice Sharma** (`alice@example.com`).
- **Click**: Click **Secure Sign In**.
- **What to Explain**:
  > *"We begin by logging in as Alice Sharma, our primary demo user. Notice that upon sign in, the backend issues a signed, httpOnly, SameSite=Lax JWT cookie. No tokens are stored in unencrypted localStorage, defending against XSS credential harvesting."*
- **Expected Frontend Result**: Redirects cleanly to `/dashboard` with greeting and Alice's balance.
- **Expected Backend Behavior**: `POST /api/auth/login` returns 200 OK, sets `Set-Cookie: token=...; HttpOnly; Path=/; SameSite=Lax`.
- **What Judges Should Observe**: Instant authentication, zero console warnings, privacy-safe token handling.

---

### Step 2: Wallet Cockpit & Integer Paise Balances
- **Action**: View `http://localhost:3000/dashboard`.
- **What to Explain**:
  > *"Alice's dashboard displays a current liquid balance of ₹84,250.00 and held capital of ₹0.00. Under the hood, this is stored strictly as `8,425,000` integer paise. Floating-point math is banned across our entire codebase to eliminate IEEE-754 precision drift. Notice Alice's Security Health Score of 94% and her recent 12 baseline grocery transfers averaging ~₹1,500."*
- **Expected Frontend Result**: Real-time balance cards, quick send/receive shortcuts, ledger activity list, and security score.
- **What Judges Should Observe**: Data is actively loaded from `GET /api/wallet` and `GET /api/payments` (not hardcoded static values).

---

### Step 3: SCENARIO 1 — Clean Payment (`ALLOW` Policy, Instant Settlement)
- **Action**: Click **Send Money** (navigate to `http://localhost:3000/send`).
- **Input**:
  - Enter Recipient UPI ID: `bobsmith@guardianpay`
  - Observe payee lookup: System automatically displays masked name **`Bo* S****`**.
  - Enter Amount: `₹1,500` (150,000 paise).
  - Enter Note: `Lunch split with Bob`.
  - Enter UPI PIN: `1234`.
- **Click**: Click **Verify & Pay ₹1,500**.
- **What to Explain**:
  > *"Watch our pre-settlement 6-signal fraud engine in action. Bob is an established counterparty Alice has paid 6 times before. ₹1,500 aligns with her rolling baseline. The engine scores this transaction at 12 out of 100, triggering the **ALLOW** policy. The payment settles immediately within 50ms, debiting Alice ₹1,500 and crediting Bob ₹1,500."*
- **Expected Frontend Result**: Green clearance screen with UTR number, 6-signal breakdown pill (`Score: 12 - Low Risk`), and updated balance (₹82,750).
- **Expected Backend Behavior**: `POST /api/payments` returns 201 Created with `status: "success"` and `risk: { score: 12, action: "allow" }`.
- **What Judges Should Observe**: Instant payment completion without unnecessary friction for legitimate behavior.

---

### Step 4: SCENARIO 2 — Moderate Anomaly (`STEP_UP` Verification Challenge)
- **Action**: From Send Money page (`http://localhost:3000/send`):
- **Input**:
  - Enter Recipient UPI ID: `carol@guardianpay`
  - Enter Amount: `₹5,500` (550,000 paise).
  - Enter Note: `First time transfer to Carol`.
  - Enter UPI PIN: `1234`.
- **Click**: Click **Verify & Pay ₹5,500**.
- **What to Explain**:
  > *"Notice what happened! The transaction did NOT settle immediately. Carol is a brand-new payee Alice has never paid before (+15 pts), and ₹5,500 is 3.7x higher than Alice's recent ₹1,500 baseline (+20 pts). The engine calculates a risk score of **35**, triggering the **STEP_UP** policy.*
  > *Notice the capital status: **Zero paise have been moved.** The transaction is quarantined in `pending_verification` until the sender completes secondary biometric / PIN step-up confirmation."*
- **Action**: Enter PIN `1234` in the Step-Up Challenge modal and click **Confirm Authorization**.
- **Expected Frontend Result**: Transaction shifts from pending verification to settled (`SUCCESS`).
- **Expected Backend Behavior**: `POST /api/payments` returns `status: "pending_verification"`, followed by `POST /api/payments/:id/confirm` returning 200 OK and settling funds.
- **What Judges Should Observe**: Clear distinction between immediate clearance and risk-proportionate challenge before funds move.

---

### Step 5: SCENARIO 3 — High-Risk Account Drain (`HOLD` Policy & Capital Quarantine)
- **Action**: From Send Money page (`http://localhost:3000/send`):
- **Input**:
  - Enter Recipient UPI ID: `carol@guardianpay`
  - Enter Amount: `₹19,000` (1,900,000 paise).
  - Note: `Emergency payment urgent`.
  - Enter UPI PIN: `1234`.
- **Click**: Click **Verify & Pay ₹19,000**.
- **What to Explain**:
  > *"Here is the most critical innovation in GUARDIANPAY. ₹19,000 represents a massive 12.6x amount anomaly and a high-ratio account drain. The engine scores this at **70**, triggering our **HOLD** policy.*
  > *Watch the balances closely: Alice's liquid balance drops by ₹19,000, and moves into **Held Capital** (`heldPaise`). **Zero funds are credited to Carol.** The money is locked in escrow quarantine, preventing the scammer from cashing out, and an incident ticket is dispatched to SecOps."*
- **Expected Frontend Result**: Amber badge: `STATUS: HELD FOR SECOPS REVIEW (Score 70)`. Liquid balance reflects ₹63,750, with ₹19,000 shown under Held Capital.
- **What Judges Should Observe**: Proof that fraud detection prevents loss *before* money reaches the attacker.

---

### Step 6: SCENARIO 4 — SecOps Admin Command Centre (Investigation & Resolution)
- **Action**: Switch to **Browser Window B (Incognito)** and open `http://localhost:3000/admin`.
- **Sign In**: `admin@guardianpay.internal` / `AdminPassword123!`.
- **Action**: Navigate to `/admin/transactions`.
- **Click**: Click on Alice's held ₹19,000 transaction.
- **What to Explain**:
  > *"We are now in the GUARDIANPAY SecOps Command Centre. The security analyst sees the exact 6-signal breakdown that triggered the hold: Amount Anomaly (+30), Balance Drain (+10), Velocity (+20). Notice our AI Triage Summary generated by Gemini—it provides an instant, plain-English synthesis of why this pattern indicates coercion or account takeover.*
  > *The analyst has two choices: **Approve** or **Reject**."*
- **Click**: Click **Approve Payment** (or Reject Payment).
- **Expected Frontend Result**: Real-time status update changes from `HOLD` to `APPROVED` (funds released) or `REJECTED` (funds returned to Alice's liquid balance).
- **What Judges Should Observe**: Seamless human-in-the-loop security operations workflow.

---

### Step 7: SCENARIO 5 — Severe Bot Threat (`BLOCK` Policy, Hard Interception)
- **Action**: In User Window A, navigate to `/send`.
- **Input**:
  - Enter Recipient UPI ID: `attacker@guardianpay`
  - Enter Amount: `₹48,000`
  - Enter PIN: `1234`
- **What to Explain**:
  > *"When a transaction hits a severe risk score of 85 or higher—such as attempting to transfer 95% of liquid capital to a flagged counterparty—the engine triggers **BLOCK**. The transaction is rejected instantly with zero balance movement, the session is flagged, and an incident report is generated."*
- **Expected Frontend Result**: Red security alert: `TRANSACTION REJECTED — CRITICAL RISK DETECTED (Score 92)`.
- **What Judges Should Observe**: Zero capital moved; wallet balance unchanged.

---

### Step 8: SCENARIO 6 — Protected Payment Link Security Gateway & SSRF Defense
- **Action**: Open `http://localhost:3000/verify-link`.
- **Test Case 1 (Brand Typosquatting Phishing)**:
  - Click demo preset: `https://guardianpay-kyc-verify.top/claim`
  - Click **Analyze Link Security**.
  - **Explain**: *"The engine checks brand Levenshtein distance, detects `.top` malicious TLD, and identifies keyword impersonation. Result: **SCORE 100 — BLOCK**. Redirection is disabled."*
- **Test Case 2 (SSRF & Cloud Metadata Exploit)**:
  - Enter URL: `http://169.254.169.254/latest/meta-data/`
  - Click **Analyze Link Security**.
  - **Explain**: *"Attacker tries to exploit our server to steal cloud IAM credentials. The backend's SSRF validator intercepts AWS/GCP metadata and private RFC 1918 subnets. Result: **SCORE 100 — BLOCKED**."*
- **Test Case 3 (Legitimate Verified URL)**:
  - Click demo preset: `https://npci.org.in/what-we-do/upi`
  - Click **Analyze Link Security**.
  - **Explain**: *"Clean URL passes structural checks. Result: **SCORE 0 — ALLOW**. The server signs a short-lived HMAC-SHA256 token, ensuring users cannot be redirected to a different destination via an open-redirect exploit."*

---

### Step 9: SCENARIO 7 — AI Scam Message Pattern Analyzer
- **Action**: Open `http://localhost:3000/security`.
- **Input**: Paste a typical phishing SMS:
  > *"URGENT: Your electricity bill is unpaid. Power will be disconnected tonight at 9:30 PM. Call our executive immediately or click http://bill-update-quick.in to avoid blackout."*
- **Click**: Click **Analyze Message Security**.
- **What to Explain**:
  > *"Our heuristic engine extracts high-urgency keywords ('URGENT', 'disconnected tonight', 'blackout'), identifies coercive psychological manipulation, highlights deceptive text spans, and outputs actionable consumer advice."*
- **Expected Frontend Result**: Verdict: `LIKELY_SCAM (Confidence: 94%)`, detected tactics list, and highlighted spans.

---

### Step 10: SCENARIO 8 — SHA-256 Hash-Chained Audit Ledger & Tamper Detection
- **Action**: Switch to Admin Window B, navigate to `http://localhost:3000/admin/audit`.
- **Click**: Click **Verify Ledger Cryptographic Integrity**.
- **Result**: Reports green badge: `LEDGER INTEGRITY VERIFIED (All 49 sequential SHA-256 blocks valid)`.
- **Action**: Click **Simulate Database Tampering (Block #2)**.
- **Click**: Click **Verify Ledger Cryptographic Integrity** again.
- **What to Explain**:
  > *"Look at this: a malicious database administrator tried to alter the amount in historic transaction block #2. The ledger validation algorithm immediately flags the broken cryptographic hash chain and pinpoints sequence #2 as compromised! This is the same tamper-evident cryptographic chain architecture used in immutable financial ledgers."*
- **What Judges Should Observe**: Immediate detection of simulated tampering with exact sequence number pinpointed.

---

## 3. Offline / API Fallback Protocol

If external internet is disconnected or the Gemini API quota is reached during judging:
1. **Zero Financial Impact**: The 6-signal fraud engine is **100% deterministic and runs in local Node.js memory**. It does not make any external HTTP requests to determine risk or move funds.
2. **AI Explanation Fallback**: In `backend/src/services/aiService.js`, deterministic rule templates automatically generate formatted triage explanations if Gemini is unreachable.
3. **No Setup Lag**: Everything runs on local ports 3000 and 4000.
