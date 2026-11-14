export const APP_CONFIG = {
  name: 'GUARDIANPAY',
  tagline: 'Every rupee, verified.',
  description:
    'Smart digital wallet with AI-powered fraud detection, transaction risk scoring, secure payment simulation, and cryptographic ledger verification.',
  hackathonDisclaimer:
    'GUARDIANPAY is a hackathon payment simulation. No real money is transferred.',
  version: '1.0.0-PROD',
  consensusEngine: 'AegisGuard v4.2 SHA-256 Chain',
};

export const NAV_LINKS = [
  { name: 'Platform', href: '#platform' },
  { name: 'Security', href: '#security' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Trust & Integrity', href: '#trust' },
];

export const TRUST_METRICS = [
  {
    label: 'Verified Transactions',
    value: 1248590,
    prefix: '',
    suffix: '+',
    detail: 'Cryptographically hashed on SHA-256 chain',
  },
  {
    label: 'Average AI Evaluation',
    value: 14,
    prefix: '< ',
    suffix: 'ms',
    detail: 'Sub-millisecond dynamic risk scoring',
  },
  {
    label: 'Fraud Detection Rate',
    value: 99.94,
    prefix: '',
    suffix: '%',
    detail: 'Trained on 42M simulated anomaly vectors',
  },
  {
    label: 'Simulated Protected Vol.',
    value: 480,
    prefix: '₹',
    suffix: 'Cr+',
    detail: 'Simulated ledger volume secured',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'INITIATE',
    summary: 'Payment request received.',
    description:
      'Payer initiates payment via VPA handle, QR code, or contact. Contextual device telemetry and timestamp are captured.',
    tag: 'Payload Telemetry',
  },
  {
    step: '02',
    title: 'RISK SCORE',
    summary: 'Transaction behavior evaluated.',
    description:
      'AI neural engine parses 180+ behavioral indicators, velocity spikes, geofencing, and account history in under 15ms.',
    tag: 'ML Anomaly Check',
  },
  {
    step: '03',
    title: 'PROTECT',
    summary: 'Allow, step-up, hold or block.',
    description:
      'Autonomous policy engine enacts deterministic rules: direct clearance, step-up MFA challenge, analyst quarantine, or hard block.',
    tag: 'Decision Matrix',
  },
  {
    step: '04',
    title: 'SETTLE',
    summary: 'Wallet balances updated safely.',
    description:
      'Atomic balance debit and credit executed with dual-entry ledger reconciliation and zero balance drift guarantee.',
    tag: 'Atomic Settlement',
  },
  {
    step: '05',
    title: 'SEAL',
    summary: 'Transaction added to hash chain.',
    description:
      'Immutable SHA-256 block hash created containing previous hash pointer, timestamp, and audit merkle proof.',
    tag: 'Cryptographic Hash',
  },
];

export const FEATURES = [
  {
    id: 'smart-wallet',
    title: 'Smart Digital Wallet',
    description:
      'Zero-custodial simulation wallet with real-time balance tracking, spend limits, and instant lock/freeze mechanisms.',
    meta: 'Dual-Entry Micro-Ledger',
    badge: 'Core Wallet',
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
  {
    id: 'upi-payments',
    title: 'UPI-Style Payments',
    description:
      'Frictionless peer-to-peer and merchant transfers using custom @aegis VPA addresses and encrypted QR manifests.',
    meta: 'Sub-200ms Routing',
    badge: 'Instant Transfer',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'intelligent-fraud',
    title: 'Intelligent Fraud Detection',
    description:
      'Continuous neural analysis scoring velocity anomalies, bot-like timing patterns, and mismatched geolocation jumps.',
    meta: '180+ Behavioral Signals',
    badge: 'Neural Engine',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'dynamic-risk-scoring',
    title: 'Dynamic Risk Scoring',
    description:
      'Every transaction receives a normalized 0–100 risk rating with explainable audit factor breakdowns and confidence scores.',
    meta: 'Explainable AI Breakdown',
    badge: 'Risk Engine',
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
  {
    id: 'automated-protection',
    title: 'Automated Payment Protection',
    description:
      'Granular decisions: automated instant clears, adaptive step-up OTP challenge triggers, analyst holds, and hard blocks.',
    meta: 'Adaptive Policy Tiering',
    badge: 'Defense Protocol',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'secure-auth',
    title: 'Secure Authentication',
    description:
      'Encrypted PIN pad with scrambling keypads, timed one-time passwords, and zero plaintext transmission.',
    meta: 'Zero-Knowledge Display',
    badge: 'Auth Perimeter',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'tx-management',
    title: 'Transaction Management',
    description:
      'Comprehensive searchable history with state tracing from INITIATED through SUCCESS, REVERSED, or FAILED.',
    meta: 'Real-Time State Machine',
    badge: 'Lifecycle Trace',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'crypto-integrity',
    title: 'Cryptographic Integrity',
    description:
      'Every settlement block contains the previous block hash and Merkle root, making historical tampering immediately detectable.',
    meta: 'SHA-256 Immutable Audit',
    badge: 'Verification',
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
  {
    id: 'admin-intelligence',
    title: 'Admin Fraud Intelligence',
    description:
      'Live threat feed with synthetic fraud simulations, attack vectors (credential stuffing, rapid drains), and instant freeze controls.',
    meta: 'SecOps Command Center',
    badge: 'Admin Intelligence',
    gridSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
];
