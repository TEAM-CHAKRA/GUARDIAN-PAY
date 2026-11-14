# GUARDIANPAY — Full System Architecture & Engineering Blueprint

> **System:** GUARDIANPAY (Intelligent Digital Wallet with AI Fraud Protection)  
> **Release Candidate:** 1.0.0 (HackMatrix 2026 Finals)  
> **Target Runtimes:** Frontend: Next.js 16.4.6 (Port 3000) | Backend: Node.js 24.12.0 ESM (Port 4000)  
> **Author:** Hackathon Architecture & Security Engineering Team

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client & Presentation Layer (Next.js 16 / Port 3000)"]
        UI_Land["Landing & Public Web<br/>'/' · '/about'"]
        UI_Auth["Auth Flow<br/>'/login' · '/register' · '/verify-otp' · '/set-pin'"]
        UI_User["User Wallet Cockpit<br/>'/dashboard' · '/send' · '/receive' · '/transactions'"]
        UI_Sec["Security Centre & Link Scanner<br/>'/security' · '/verify-link'"]
        UI_Admin["SecOps Command Centre<br/>'/admin' · '/admin/transactions' · '/admin/audit'"]
    end

    subgraph ProxyLayer ["2. Reverse Proxy & Network Boundary"]
        Rewrites["Next.js Proxy Rewrites<br/>'/api/:path*' -> 'http://localhost:4000/api/:path*'"]
        CORS["CORS & Cookie Exchange<br/>httpOnly · SameSite=Lax · Credentials: true"]
    end

    subgraph BackendCore ["3. GUARDIANPAY Backend Core (Node.js 24 ESM / Port 4000)"]
        SecMiddleware["Security Middleware Stack<br/>Helmet · 16kb Body Parser · Error Boundary"]
        AuthSvc["Auth & Identity Service<br/>Argon2id Hashing · JWT Sign/Verify · 5-Fail Lockout"]
        WalletSvc["Atomic Wallet Service<br/>Integer Paise Math · Zero Floats · Mutex Concurrency"]
        
        subgraph FraudPipeline ["Pre-Settlement Fraud Pipeline"]
            RiskEng["6-Signal Risk Scoring Engine<br/>Deterministic 0-100 · Critical Combination Floor"]
            PolicyEng["4-Tier Policy Enforcement<br/>ALLOW (0-29) · STEP_UP (30-59) · HOLD (60-84) · BLOCK (85-100)"]
            GeminiSvc["Gemini 2.0 Flash AI Copilot<br/>Human-readable Explanations · SecOps Triage Briefs"]
        end

        LinkSec["Payment Link Security Gateway<br/>Levenshtein Typosquatting · SSRF Shield · HMAC Redirection"]
        AuditSvc["Cryptographic Audit Ledger<br/>SHA-256 Hash-Chained Blocks · Tamper Verification"]
    end

    subgraph DataStore ["4. Data & Concurrency Layer"]
        Repo["In-Memory Async Repository<br/>Deep-Clone Isolation · Idempotency Store"]
        MutexQ["Promise-Based Wallet Mutex Queue<br/>Race Serialization · Zero Double-Spending"]
    end

    UI_Land --> Rewrites
    UI_Auth --> Rewrites
    UI_User --> Rewrites
    UI_Sec --> Rewrites
    UI_Admin --> Rewrites

    Rewrites --> CORS --> SecMiddleware
    SecMiddleware --> AuthSvc
    SecMiddleware --> WalletSvc
    SecMiddleware --> LinkSec
    SecMiddleware --> AuditSvc

    WalletSvc --> RiskEng --> PolicyEng
    PolicyEng -.->|Telemetry| GeminiSvc
    WalletSvc --> MutexQ --> Repo
    AuditSvc --> Repo
```

---

## 2. Component Architecture Breakdown

### 2.1 Client & Presentation Layer (Frontend)
- **Framework**: Next.js 16.4.6 App Router, React 19, TypeScript 5.
- **Styling Architecture**: Tailwind CSS v4, Framer Motion for hardware-accelerated transitions, Lucide React icons.
- **Brand Palette**:
  - `Black Pearl` (`#1A2C30`): Primary dark background and structural card fill.
  - `Blue Lagoon` (`#0E6873`): Primary brand teal, accents, and horizon glow.
  - `Burnt Orange` (`#FE7E3C`): Attention accents, active cursor spotlights, and high-priority action buttons.
  - `Lust` (`#E4201B`): Critical fraud indicators, block badges, and security alerts.
  - `Copper` (`#61413C`): Subtle metallic borders and card dividers.
  - `Emerald` (`#10B981`): Verified settlement confirmations and integrity pass indicators.
- **State Management & Communication**: Native React Hooks with centralized `src/lib/api.ts` client wrapper enforcing credentials exchange and typed error extraction.

### 2.2 Network & Security Middleware Stack
- **Helmet.js**: Sets security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`).
- **Body Parser Limits**: Strict 16kb payload ceiling (`express.json({ limit: '16kb' })`) guarding against payload memory exhaustion and denial-of-service.
- **CORS Configuration**: Restricts origin to `http://localhost:3000` with `credentials: true`.
- **Next.js Reverse Proxy**: Rewrites all `/api/*` requests internally to port 4000, eliminating browser cross-origin preflight overhead in production deployments.

### 2.3 Authentication & Session Subsystem
- **Password & PIN Hashing**: Uses **Argon2id** (`argon2.hash(val, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })`).
- **JWT Cookies**: Issues signed JSON Web Tokens inside `httpOnly`, `SameSite=Lax` cookies with 24-hour expiration.
- **Sliding Lockout Engine**: Tracks failed PIN attempts in an in-memory sliding window. After 5 consecutive failures within 15 minutes, authentication is locked for 15 minutes (`PIN_LOCKED`).

---

## 3. The Pre-Settlement Fraud Pipeline

### 3.1 Six-Signal Algorithmic Architecture

```mermaid
flowchart LR
    P[Payment Payload] --> S1["1. Amount Anomaly<br/>(Max 30)"]
    P --> S2["2. Velocity Burst<br/>(Max 20)"]
    P --> S3["3. New Payee Value<br/>(Max 15)"]
    P --> S4["4. Odd Hours (1-5 AM)<br/>(Max 10)"]
    P --> S5["5. Failed PINs<br/>(Max 15)"]
    P --> S6["6. Balance Drain<br/>(Max 10)"]

    S1 --> Sum["Raw Sum<br/>(0 to 100)"]
    S2 --> Sum
    S3 --> Sum
    S4 --> Sum
    S5 --> Sum
    S6 --> Sum

    Sum --> CritCheck{"Critical Combination?<br/>(New Payee + Amount + Odd Hours)"}
    CritCheck -- Yes --> Floor["Floor at 60 (HOLD)"]
    CritCheck -- No --> ScoreFinal["Final Score (0 - 100)"]
    Floor --> ScoreFinal

    ScoreFinal --> PolDecision{"Policy Threshold"}
    PolDecision -- "0 - 29" --> P_Allow["ALLOW<br/>(Instant Settlement)"]
    PolDecision -- "30 - 59" --> P_Step["STEP_UP<br/>(Challenge Sender)"]
    PolDecision -- "60 - 84" --> P_Hold["HOLD<br/>(Quarantine to Escrow)"]
    PolDecision -- "85 - 100" --> P_Block["BLOCK<br/>(Hard Rejection)"]
```

### 3.2 Signal Computation Details

1. **Amount Anomaly ($S_1$)**:
   $$\bar{A} = \frac{1}{\min(N, 10)} \sum_{k=1}^{\min(N, 10)} A_k$$
   - $\text{Ratio} = \frac{\text{CurrentAmount}}{\bar{A}}$
   - $\text{Ratio} \ge 5.0 \implies 30\text{ pts}$
   - $\text{Ratio} \ge 3.0 \implies 20\text{ pts}$
   - For profiles with $<3$ baseline transactions: $\text{CurrentAmount} \ge ₹10,000 \implies 15\text{ pts}$.

2. **Velocity ($S_2$)**:
   Counts outgoing transactions in $[T - 5\text{ min}, T]$. If $\text{count} \ge 5 \implies 20\text{ pts}$.

3. **New Payee ($S_3$)**:
   Checks whether receiver UPI ID exists in trailing 50 successful transactions.
   - First-time recipient with amount $\ge ₹5,000 \implies 15\text{ pts}$.
   - First-time recipient with amount $< ₹5,000 \implies 5\text{ pts}$.

4. **Odd Hours ($S_4$)**:
   Local time $\in [01:00, 05:00] \implies 10\text{ pts}$.

5. **Failed PIN Attempts ($S_5$)**:
   Failures in past 15 min: $\ge 3 \implies 15\text{ pts}$; $\ge 1 \implies 5\text{ pts}$.

6. **Balance Drain ($S_6$)**:
   $$\text{DrainRatio} = \frac{\text{Amount}}{\text{Balance}}$$
   - $\text{DrainRatio} \ge 0.85 \implies 10\text{ pts}$.
   - $\text{DrainRatio} \ge 0.50 \implies 5\text{ pts}$.

---

## 4. Atomic Payment Settlement & Concurrency Model

### 4.1 Strict Financial Invariants
- **Zero Floats**: Stored strictly in integer paise ($1\text{ INR} = 100\text{ paise}$).
- **Conservation of Money**: In any successful transfer:
  $$\Delta \text{SenderBalance} + \Delta \text{ReceiverBalance} = 0$$
- **Quarantined Escrow (`HOLD`)**:
  $$\text{SenderBalance}_{\text{new}} = \text{SenderBalance}_{\text{old}} - \text{Amount}$$
  $$\text{SenderHeld}_{\text{new}} = \text{SenderHeld}_{\text{old}} + \text{Amount}$$
  $$\text{ReceiverBalance}_{\text{new}} = \text{ReceiverBalance}_{\text{old}} \quad (\text{Zero credit})$$

### 4.2 Mutex Serialization Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Sender (Alice)
    participant API as Payment Controller
    participant Mutex as Per-Wallet Mutex Queue
    participant Engine as 6-Signal Fraud Engine
    participant Repo as Atomic Store

    Alice->>API: POST /api/payments (Amount: ₹19,000, PIN: 1234)
    API->>Mutex: acquireLock(AliceUserId)
    activate Mutex
    Mutex->>Repo: Validate PIN (Argon2id)
    Mutex->>Repo: Check Overdraft & Platform Limits
    Mutex->>Engine: evaluateTransactionRisk(context)
    Engine-->>Mutex: Result: Score 70 -> HOLD Policy
    
    alt Policy == ALLOW
        Mutex->>Repo: Atomic: Debit Alice, Credit Receiver
    else Policy == HOLD
        Mutex->>Repo: Atomic: Debit Alice Liquid, Credit Alice Held
        Mutex->>Repo: Create Held Transaction Record
    else Policy == STEP_UP
        Mutex->>Repo: Create Pending Verification Record (Zero Debit)
    else Policy == BLOCK
        Mutex->>Repo: Record Blocked Security Incident (Zero Debit)
    end

    Mutex-->>API: Response Payload
    API-->>Alice: 201 Created (Status: HELD, Score: 70)
    API->>Mutex: releaseLock(AliceUserId)
    deactivate Mutex
```

---

## 5. Payment Link Security Gateway & SSRF Defense

### 5.1 Verification Logic Flow

```mermaid
flowchart TD
    URL_In[Submitted URL] --> P1{"Protocol Valid?<br/>(http/https only)"}
    P1 -- No --> B1["BLOCK: Score 100<br/>Invalid Protocol Scheme"]
    
    P1 -- Yes --> P2{"Hostname resolves to<br/>Private Subnet / Localhost / Metadata?<br/>(127.0.0.1, 10.0.0.0/8, 169.254.169.254)"}
    P2 -- Yes --> B2["BLOCK: Score 100<br/>SSRF Exploit Intercepted"]
    
    P2 -- No --> P3{"Brand Typosquatting?<br/>(Levenshtein Distance <= 2 against npci/guardianpay)"}
    P3 -- Yes --> B3["BLOCK: Score 100<br/>Brand Impersonation Detected"]
    
    P3 -- No --> P4{"Malicious TLD / Executable?<br/>(.top, .xyz, .apk, .exe)"}
    P4 -- Yes --> B4["BLOCK / WARN: Score 75-100"]
    
    P4 -- No --> P5["ALLOW: Score 0<br/>Generate HMAC-SHA256 Token"]
    P5 --> SafeRedirect["Safe Redirection Enabled<br/>(Valid for 10 minutes)"]
```

---

## 6. Cryptographic SHA-256 Audit Ledger

### 6.1 Block Chaining Specification

Each audit block $B_n$ has the schema:

$$\text{CanonicalString}_n = \text{Seq}_n \parallel B_{n-1}.\text{hash} \parallel \text{Timestamp}_n \parallel \text{Action}_n \parallel \text{ActorId}_n \parallel \text{CanonicalJSON}(\text{Details}_n)$$

$$B_n.\text{hash} = \text{SHA-256}(\text{CanonicalString}_n)$$

```
Block #1 (Genesis)              Block #2 (Alice Transfer)          Block #3 (Admin Approval)
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│ Seq: 1                │       │ Seq: 2                │       │ Seq: 3                │
│ PrevHash: "00000..."  │◄──────┤ PrevHash: "a4f89..."  │◄──────┤ PrevHash: "9e12c..."  │
│ Action: WALLET_SEEDED │       │ Action: TXN_HELD      │       │ Action: ADMIN_APPROVE │
│ Hash: "a4f89..."      │       │ Hash: "9e12c..."      │       │ Hash: "3b77a..."      │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

If an attacker alters any field in Block #2:
1. $B_2.\text{hash}$ changes to $H_{\text{altered}}$.
2. Block #3 expects $B_3.\text{prevHash} = H_{\text{original}}$.
3. Validator traverses from Genesis to tip; detects $H_{\text{altered}} \neq B_3.\text{prevHash}$ and immediately raises `TAMPER_DETECTED` at sequence #2.
