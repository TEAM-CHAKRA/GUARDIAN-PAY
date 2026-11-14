# GUARDIANPAY — HackMatrix Project Video Demo Outline (2–3 Minutes)

> **Target Duration:** 2 minutes 45 seconds  
> **Format:** Screen Recording with Voiceover & Live Technical Overlay  
> **Resolution:** 1080p 60fps (16:9)  
> **Audio:** Clear vocal track, subtle ambient synth bed in key of D minor  
> **Video File Deliverable:** `GUARDIANPAY_HACKMATRIX_DEMO.mp4`

---

## 1. Video Production Rundown

```
[0:00 - 0:25] ── Scene 1: The ₹70,000 Crore Blind Spot (Problem)
[0:25 - 0:50] ── Scene 2: Introducing GUARDIANPAY (Solution Architecture)
[0:50 - 1:30] ── Scene 3: Live Payment Demo: Instant ALLOW vs Risk HOLD
[1:30 - 1:55] ── Scene 4: Pre-Settlement 6-Signal Engine & Gemini AI Triage
[1:55 - 2:20] ── Scene 5: Payment Link Security Gateway & SSRF Defense
[2:20 - 2:35] ── Scene 6: Cryptographic Audit Ledger & Tamper Detection
[2:35 - 2:45] ── Scene 7: Impact & Closing Call to Action
```

---

## 2. Detailed Scene-by-Scene Storyboard & Script

---

### Scene 1: The ₹70,000 Crore Blind Spot (0:00 – 0:25)
- **Visuals**:
  - Dramatic fast-cut montage of news headlines highlighting UPI payment fraud, electricity bill SMS scams, and digital arrest coercion.
  - Text overlay: *"15 Billion Monthly Transactions. 3 Seconds to Settle. 0 Seconds to Stop Fraud."*
- **Audio / Voiceover**:
  > *"Every day, UPI moves over ₹70,000 Crores across India. But in 2026, digital payment fraud surged by over 300%. Today's wallet apps are dumb pipes: you enter your PIN, and within three seconds, your money is gone irreversibly. Post-mortem cyber cell complaints cannot recover stolen funds once mule accounts cash out. We need protection **before** settlement."*

---

### Scene 2: Introducing GUARDIANPAY (0:25 – 0:50)
- **Visuals**:
  - Smooth pan onto the GUARDIANPAY landing page (`http://localhost:3000`).
  - Showing the brand palette: Black Pearl (`#1A2C30`), Blue Lagoon (`#0E6873`), Burnt Orange (`#FE7E3C`).
  - Highlight the 5-layer canvas background with live animated ledger threads and glass cubes.
  - Cut to Alice's dashboard showing her ₹84,250 balance and Security Health Score.
- **Audio / Voiceover**:
  > *"Meet GUARDIANPAY: an intelligent digital wallet that evaluates transaction risk before money ever leaves your account. Built with a deterministic 6-signal fraud engine, integer-paise financial precision, and an AI security copilot, it introduces four-tier risk-proportionate policies: ALLOW, STEP_UP, HOLD, and BLOCK."*

---

### Scene 3: Live Payment Demo — Instant ALLOW vs Risk HOLD (0:50 – 1:30)
- **Visuals**:
  - **Part A (Clean Payment)**: Alice sends ₹1,500 to Bob. Screen shows payee masking (`Bo* S****`), PIN entry `1234`, and an instant green clearance badge (`Score: 12 - ALLOW`).
  - **Part B (Risk HOLD)**: Alice attempts an emergency transfer of ₹19,000 to an unfamiliar account. The UI flags `Score: 70 — HELD FOR SECOPS REVIEW`.
  - Zoom into the balance counter: Liquid balance drops by ₹19,000 and moves into `Held Capital`. Zero paise credited to the scammer.
- **Audio / Voiceover**:
  > *"Watch it live. When Alice sends ₹1,500 to an established friend, the engine scores it at 12—clearing in milliseconds. But when she tries to transfer ₹19,000 to an unverified counterparty, the engine triggers our signature HOLD policy.*
  > *Notice the escrow mechanism: the money is quarantined in held capital on Alice's wallet, but zero funds reach the scammer. The theft is halted in its tracks."*

---

### Scene 4: Pre-Settlement 6-Signal Engine & Gemini AI Triage (1:30 – 1:55)
- **Visuals**:
  - Switch to SecOps Admin Window (`/admin/transactions`).
  - Click Alice's held payment. Show the radar telemetry and the 6 deterministic signals:
    - Amount Anomaly (+30 pts)
    - Velocity (+20 pts)
    - Balance Drain (+10 pts)
  - Highlight the Gemini 2.0 Flash AI Triage Brief explaining the threat in structured plain English.
  - Click **Approve Payment** or **Reject Payment**.
- **Audio / Voiceover**:
  > *"In the SecOps Command Centre, security analysts inspect the exact mathematical signal breakdown. Google Gemini 2.0 Flash acts as an explanation copilot—synthesizing raw telemetry into clear incident briefs. Crucially, AI never makes the financial decision; our deterministic rule engine controls the money. The analyst can safely release the funds or return them to Alice."*

---

### Scene 5: Payment Link Security Gateway & SSRF Defense (1:55 – 2:20)
- **Visuals**:
  - Navigate to `/verify-link`.
  - Enter typosquatting URL: `https://guardianpay-kyc-verify.top/claim`.
  - Click **Analyze Link Security**. Result displays **SCORE 100 — BLOCKED** with typosquatting badge. Redirection button is disabled.
  - Enter SSRF URL: `http://169.254.169.254/latest/meta-data/`.
  - Click **Analyze**. Result displays **SCORE 100 — SSRF EXPLOIT BLOCKED**.
  - Click verified URL (`https://npci.org.in`). Result generates HMAC-SHA256 signature and enables safe navigation.
- **Audio / Voiceover**:
  > *"Phishing links in SMS and WhatsApp are the #1 source of UPI fraud. Our Payment Link Security Gateway inspects URLs for brand typosquatting, malicious TLDs, and executable APKs. It even defends against advanced Server-Side Request Forgery—blocking localhost and cloud metadata targets—and cryptographically signs legitimate redirects with HMAC-SHA256."*

---

### Scene 6: Cryptographic Audit Ledger & Tamper Detection (2:20 – 2:35)
- **Visuals**:
  - Open `/admin/audit`.
  - Click **Verify Ledger Cryptographic Integrity** -> Green badge: All 49 blocks verified.
  - Click **Simulate Tampering (Block #2)** and re-verify.
  - Red warning box immediately pops up: `TAMPER DETECTED: Hash mismatch at Block #2`.
- **Audio / Voiceover**:
  > *"To ensure complete financial accountability, every transaction state transition is sealed in a SHA-256 hash-chained audit ledger. Here, we simulate a malicious database edit on block #2. The cryptographic validator immediately identifies the altered record and pinpoints the compromise."*

---

### Scene 7: Impact & Closing Call to Action (2:35 – 2:45)
- **Visuals**:
  - Full-screen summary card showing code quality metrics:
    - `30/30 Automated Tests Passing`
    - `0 TypeScript Errors`
    - `0 ESLint Errors`
    - `20 Live Web Routes`
    - `23 Backend REST Endpoints`
  - Logo and GitHub repository URL.
- **Audio / Voiceover**:
  > *"20 routes, 23 endpoints, zero floating-point math, and 100% test coverage. GUARDIANPAY doesn't just detect fraud after the money is gone. We protect your capital before settlement. Thank you."*
