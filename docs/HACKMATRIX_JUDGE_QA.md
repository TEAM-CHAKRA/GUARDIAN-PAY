# GUARDIANPAY — HackMatrix Offline Round Judge Q&A Guide

> **Event:** HackMatrix Offline Finals — 14 November 2026  
> **Audience:** Technical Judges, Security Auditors & Fintech Evaluators  
> **Objective:** Authoritative, technically rigorous, unvarnished responses to all potential technical, security, financial, and product questions.

---

## Quick Navigation Index

1. [Strategic & Problem Motivation (Q1–Q4)](#1-strategic--problem-motivation)
2. [Algorithmic Fraud Scoring & Signals (Q5–Q9)](#2-algorithmic-fraud-scoring--signals)
3. [Decision Policies & Capital Protection (Q10–Q13)](#3-decision-policies--capital-protection)
4. [AI Integration & Deterministic Boundaries (Q14–Q16)](#4-ai-integration--deterministic-boundaries)
5. [Payment Link Security & SSRF Hardening (Q17–Q20)](#5-payment-link-security--ssrf-hardening)
6. [Ledger Integrity & Cryptographic Auditing (Q21–Q23)](#6-ledger-integrity--cryptographic-auditing)
7. [Production Roadmap & Real-World Limitations (Q24–Q28)](#7-production-roadmap--real-world-limitations)

---

## 1. Strategic & Problem Motivation

### Q1: Why did you build GUARDIANPAY when major payment apps (Google Pay, PhonePe, Paytm) already exist?
**Answer:**
Existing payment apps are fundamentally engineered as **high-speed transaction pipes**. Their core objective is minimizing friction to maximize transaction volume across the NPCI switch. Fraud detection in the current banking ecosystem is almost entirely **post-mortem**—occurring via chargebacks, cyber-cell FIRs, or AML batch jobs hours or days after settlement. Once funds settle in a fraudster’s account, they are layered through mule networks within minutes. GUARDIANPAY re-architects this model by inserting a **deterministic, pre-settlement risk evaluation and capital quarantine layer** right before irreversible ledger debit occurs.

### Q2: What is the single most innovative aspect of GUARDIANPAY?
**Answer:**
The **pre-settlement capital quarantine architecture (`HOLD` policy)** combined with **deterministic risk flooring**. Traditional wallets either allow a transaction or block it. GUARDIANPAY introduces an asynchronous quarantine where liquid funds are held on the sender's account in `heldPaise`, but **zero money is credited to the receiver**. This halts the attacker's cash-out cycle while keeping the funds recoverable without complex cross-bank chargeback litigation.

### Q3: How does GUARDIANPAY differ from standard banking SMS or OTP alerts?
**Answer:**
SMS and OTPs only verify **possession of a SIM card or device**; they do not verify **intent or context**. In modern social engineering (electricity bill scams, digital arrest coercion, APK screen-share trojans), the victim willingly enters their OTP or PIN under duress. GUARDIANPAY evaluates behavioral context (baseline anomaly, nocturnal odd hours, account drain ratios, counterparty novelty) rather than credential possession alone.

### Q4: Is GUARDIANPAY designed to replace UPI or build on top of it?
**Answer:**
GUARDIANPAY is designed as a **smart application-layer PSP (Payment Service Provider) wallet** that sits on top of existing rail infrastructure (UPI/NPCI in India, FedNow in the US, Pix in Brazil). It operates at the PSP client-and-switch layer, performing risk adjudication before dispatching the final payment order to the underlying core banking system (CBS).

---

## 2. Algorithmic Fraud Scoring & Signals

### Q5: How exactly does the fraud scoring engine calculate risk?
**Answer:**
Every payment payload is evaluated against six deterministic signals yielding a composite score from 0 to 100:
$$\text{RawScore} = \sum_{i=1}^6 S_i$$
1. **Amount Anomaly** ($S_1 \in [0, 30]$): Computed against the sender's trailing 10 successful transactions. If $\text{Ratio} \ge 5.0$, points = 30; if $\text{Ratio} \ge 3.0$, points = 20. For profiles with $<3$ baseline transactions, an absolute threshold of $\ge ₹10,000$ assigns 15 points.
2. **Transaction Velocity** ($S_2 \in [0, 20]$): Measures outgoing frequency over the trailing 5 minutes. If count $\ge 5$, points = 20.
3. **New Payee Value** ($S_3 \in [0, 15]$): Flags counterparties not present in trailing 50 successful payments. If amount $\ge ₹5,000$, points = 15; else 5.
4. **Odd Hours Anomaly** ($S_4 \in [0, 10]$): Active between 01:00 AM and 05:00 AM local time (common window for nocturnal panic transfers), points = 10.
5. **Failed PIN Attempts** ($S_5 \in [0, 15]$): Sliding window tracking authentication failures in trailing 15 minutes. If failures $\ge 3$, points = 15; if $\ge 1$, points = 5.
6. **Balance Drain Ratio** ($S_6 \in [0, 10]$): $\text{Ratio} = \frac{\text{Amount}}{\text{Balance}}$. If $\ge 85\%$, points = 10; if $\ge 50\%$, points = 5.

### Q6: Why choose these specific six signals instead of dozens of minor telemetry points?
**Answer:**
These six signals represent the highest-leverage, mathematically independent indicators of coerced or automated fraud in real-time payments. Excessive telemetry (e.g. gyroscope tilt, battery percentage) introduces non-deterministic noise and latency. Our 6 signals evaluate three orthogonal dimensions: **Value Divergence** (Amount & Drain), **Temporal/Behavioral Context** (Odd Hours & PIN Failures), and **Counterparty Novelty** (New Payee & Velocity Burst).

### Q7: What is the "Critical Combination Rule"?
**Answer:**
Certain fraud patterns are lethal even if individual signals score modestly. Specifically, if a transaction combines:
1. `new_payee` triggered, AND
2. `amount_anomaly` triggered, AND
3. `odd_hours` triggered,
the engine enforces a hard mathematical floor:
$$\text{Score} = \max(\text{RawScore}, 60)$$
This guarantees that any high-value first-time transfer occurring in the middle of the night is automatically subjected to `HOLD` or `BLOCK`, regardless of clean PIN entry.

### Q8: What prevents a fraudster from doing 10 small transfers of ₹500 to stay under the radar?
**Answer:**
The **Velocity Burst signal ($S_2$)** combined with **Daily Cumulative Aggregation**. Rapid successive micro-transfers immediately trigger $S_2$ (+20 points). Furthermore, our wallet enforces a hard platform limit (`MAX_DAILY_PAISE = 10,000,000` or ₹1,00,000), which rejects cumulative overages before fraud scoring is even invoked.

### Q9: Can an attacker manipulate the baseline by making fake transactions to themselves?
**Answer:**
No. `PaymentService` enforces a strict self-transfer ban (`cleanReceiverUpi === senderUser.upiId` throws `SELF_TRANSFER`). Furthermore, baseline calculations only evaluate **outbound transfers to verified third-party counterparties** with successful status.

---

## 3. Decision Policies & Capital Protection

### Q10: What are the exact thresholds for the four policy decisions?
**Answer:**
- **`ALLOW` (0–29 points)**: Low risk. Immediate settlement. Money moves from sender to receiver in single atomic step.
- **`STEP_UP` (30–59 points)**: Moderate risk. Transaction created with status `pending_verification`. Zero ledger debit occurs. Sender must complete secondary PIN or biometric verification to clear the step-up challenge.
- **`HOLD` (60–84 points)**: High risk. Sender's liquid balance is decremented into `heldPaise`. Zero funds are credited to the receiver. A SecOps incident ticket is dispatched to `/admin/transactions`.
- **`BLOCK` (85–100 points)**: Critical threat. Immediate hard rejection. 0 paise debited; incident logged in security audit ledger.

### Q11: In the `HOLD` state, where does the money actually sit?
**Answer:**
The money resides in the sender's own wallet under a segregated accounting state:
$$\text{TotalEquity} = \text{balancePaise} + \text{heldPaise}$$
- `balancePaise`: Liquid capital available for spending.
- `heldPaise`: Escrowed capital quarantined pending SecOps clearance.
Because the money has **not been credited to the recipient's wallet balance**, the counterparty cannot transfer it out, cash it out at an ATM, or move it to a mule wallet. If the SecOps analyst rejects the transaction, `heldPaise` is simply credited back to `balancePaise`.

### Q12: How does GUARDIANPAY handle concurrent payments and race conditions?
**Answer:**
Every wallet mutation is routed through a **Promise-based per-wallet asynchronous mutex queue** (`backend/src/store/repository.js`). If a user or automated script attempts 6 simultaneous requests of ₹2,500 from a ₹10,000 balance, the mutex serializes the operations:
- Request 1: Balance 10,000 -> 7,500 (Success)
- Request 2: Balance 7,500 -> 5,000 (Success)
- Request 3: Balance 5,000 -> 2,500 (Success)
- Request 4: Balance 2,500 -> 0 (Success)
- Request 5: Balance 0 < 2,500 -> Throws `INSUFFICIENT_FUNDS`
- Request 6: Balance 0 < 2,500 -> Throws `INSUFFICIENT_FUNDS`
Zero double-spending is mathematically guaranteed.

### Q13: How does your idempotency mechanism work?
**Answer:**
Clients provide an `Idempotency-Key` header with payment requests. The backend records a SHA-256 hash of the payload:
1. If the key is seen for the first time: Process payment and cache the full response.
2. If the identical key is replayed with identical payload: Return cached response with `replayed: true` (no duplicate debit).
3. If an identical key is replayed with a *modified* payload (e.g. tampering amount): Return `409 IDEMPOTENCY_CONFLICT`.

---

## 4. AI Integration & Deterministic Boundaries

### Q14: What is Gemini’s exact role in GUARDIANPAY?
**Answer:**
Google Gemini 2.0 Flash operates as a **Specialized SecOps & Consumer Copilot**. Its responsibilities are:
1. **Consumer Risk Explanations**: Translating abstract signal telemetry into clear, reassuring guidance (e.g. *"We noticed this payment is 4x your normal spend to someone you've never paid before"*).
2. **SecOps Triage Summaries**: Synthesizing the 6 signals, account velocity, and counterparty data into structured incident briefs for human security analysts.
3. **Scam Message Tactic Breakdown**: Extracting psychological manipulation patterns (urgency, authority impersonation, fear) from raw text.

### Q15: Can Gemini ever override a deterministic fraud decision?
**Answer:**
**ABSOLUTELY NOT.** This is an immutable architectural boundary in GUARDIANPAY:
- Risk scores ($0–100$) and policy decisions (`ALLOW`, `STEP_UP`, `HOLD`, `BLOCK`) are calculated strictly by the deterministic JavaScript `RiskEngine`.
- Gemini is never given the authority to alter a score, downgrade a `HOLD`, or approve a transaction.
- This prevents hallucination attacks, prompt injection exploits, and non-deterministic financial loss.

### Q16: What happens if Gemini’s API is slow, rate-limited, or completely offline?
**Answer:**
The system features **deterministic fallback templates** (`backend/src/services/aiService.js`). If `GEMINI_API_KEY` is missing or the external API call exceeds 2,500ms, the service immediately generates pre-compiled, signal-derived explanations. **The transaction pipeline never halts, fails, or delays due to external AI downtime.**

---

## 5. Payment Link Security & SSRF Hardening

### Q17: How does your Payment Link Security Gateway work?
**Answer:**
Before a user interacts with an external payment or verification link, the URL is submitted to `POST /api/links/verify`. The link scanner performs a 5-stage heuristic inspection:
1. **Protocol & Port Validation**: Rejects non-HTTP/HTTPS protocols (`javascript:`, `data:`, `file:`).
2. **Levenshtein Typosquatting**: Measures string edit distance against official domains (e.g. `npci.org.in`, `guardianpay.internal`). Detects `npcl.org.in`, `guardian-pay.top`, `paytm-kyc.xyz`.
3. **Malicious TLD & Pattern Detection**: Flags suspicious TLDs (`.top`, `.xyz`, `.fit`, `.kim`) and dangerous extensions (`.apk`, `.exe`, `.scr`).
4. **IP-Literal Endpoint Detection**: Flags raw IP URLs (`http://192.168.1.1/pay`).
5. **Cryptographic Redirection Signing**: If clean, issues an HMAC-SHA256 signature binding the verified URL.

### Q18: What is SSRF and how does GUARDIANPAY prevent it?
**Answer:**
**Server-Side Request Forgery (SSRF)** occurs when an attacker tricks a backend server into making requests to internal or private endpoints (such as `http://localhost:4000/api/admin` or `http://169.254.169.254/latest/meta-data`).
GUARDIANPAY implements defense-in-depth:
- Hostnames are resolved and evaluated against forbidden IP ranges:
  - Localhost: `127.0.0.0/8`, `::1`, `localhost`
  - RFC 1918 Private Subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - Link-Local & Cloud Metadata: `169.254.169.254`, `metadata.google.internal`
- Any target resolving to these ranges is assigned **Risk Score 100 (BLOCK)**, and outbound HTTP requests are strictly aborted.

### Q19: How do you prevent Open-Redirect vulnerabilities?
**Answer:**
When a link is verified as clean, the backend signs a payload with an HMAC-SHA256 secret:
$$\text{Token} = \text{HMAC-SHA256}(\text{URL} + \text{Timestamp}, \text{Secret})$$
When the user clicks **Continue to External Site**, `/api/links/redirect` re-verifies the HMAC signature and timestamp (valid for 10 minutes). If an attacker tampers with the destination query parameter, the HMAC check fails with `403 FORBIDDEN`.

### Q20: Does GUARDIANPAY claim to intercept links inside WhatsApp or SMS?
**Answer:**
No. As a web application, GUARDIANPAY cannot modify the user's mobile OS kernel or intercept third-party apps without OS-level permissions. We are completely transparent about this: GUARDIANPAY provides a **Payment Link Security Portal** where users, merchants, or integrations pass URLs for real-time risk verification.

---

## 6. Ledger Integrity & Cryptographic Auditing

### Q21: How does the SHA-256 Audit Ledger work?
**Answer:**
The audit service maintains an append-only cryptographic hash chain:
$$H_n = \text{SHA256}(H_{n-1} + \text{Seq}_n + \text{Action}_n + \text{Timestamp}_n + \text{CanonicalJSON}(\text{Payload}_n))$$
- Genesis Block has $H_0 = \text{"0000000000000000000000000000000000000000000000000000000000000000"}$.
- Every ledger record references the hash of its immediate predecessor.
- This creates an immutable audit trail of every state transition (`TXN_CREATED`, `RISK_EVALUATED`, `HELD_FOR_REVIEW`, `ADMIN_APPROVED`, `SETTLED`).

### Q22: How does the system detect database tampering?
**Answer:**
The `verifyLedgerIntegrity()` method traverses the chain from sequence 1 to $N$, re-computing each block's expected SHA-256 hash using the stored previous block's hash. If a rogue DBA alters any field in record #2, its computed hash will differ from record #3's `prevHash`. The validator halts and pinpoints the exact compromised sequence number.

### Q23: Why did you build an interactive tampering simulation in the Admin Panel?
**Answer:**
Because in hackathons, judges are often told "we have a blockchain or immutable ledger," but are never shown evidence. Our `/api/admin/dev/tamper` endpoint intentionally alters block #2's payload, allowing judges to click "Verify Integrity" and witness real-time cryptographic failure detection live.

---

## 7. Production Roadmap & Real-World Limitations

### Q24: What are the primary technical limitations of the current implementation?
**Answer:**
1. **In-Memory Volatility**: To ensure zero external database configuration for judges, the current backend runs on an in-memory repository with async mutexes. In production, this would be backed by PostgreSQL with row-level locking (`SELECT ... FOR UPDATE`) and Redis for distributed locks.
2. **Platform Context**: Operates as a responsive web application rather than an Android/iOS system service with hardware security enclave (TEE) access.
3. **Simulated NPCI Switch**: The core payment rails are simulated in local Node.js rather than connected to live bank ISO 8583 / UPI switches.

### Q25: How would GUARDIANPAY scale to handle 10,000 transactions per second?
**Answer:**
1. **Sharded Mutex Queues**: Distribute wallet locks across a Redis cluster using Redlock partitioned by `userId`.
2. **Stateless Risk Scoring**: The 6-signal risk engine is purely mathematical and runs in $<5\text{ms}$; it can be horizontally scaled across containerized Node.js workers behind an Envoy load balancer.
3. **Read Replicas**: Baseline calculations (`listTransactionsByUser`) can be served from read-optimized Redis cache stores.

### Q26: What is the regulatory compliance posture for a system like this?
**Answer:**
GUARDIANPAY aligns with:
- **RBI Digital Payment Security Controls (2021)**: Mandating automated anomaly detection and velocity monitoring.
- **NPCI Risk Management Framework**: Fulfilling pre-authorization risk scoring directives.
- **DPDP Act (2023)**: Minimizing PII storage; payee lookup endpoints return masked names (`Bo* S****`).

### Q27: How long did this take to build and what was the division of labor?
**Answer:**
The project was designed, developed, audited, and hardened over the hackathon development cycle, spanning full frontend architectural redesign, Next.js 16 App Router implementation, Node.js 24 backend engineering, security test harness construction, and automated CI validation.

### Q28: If you had 3 more months of full-time development, what would you build next?
**Answer:**
1. Hardware Biometric WebAuthn / Passkey integration for step-up challenges.
2. Graph-based mule account ring detection across multi-hop counterparties.
3. Open Banking Account Aggregator (AA) integration for enriched financial baselines.
