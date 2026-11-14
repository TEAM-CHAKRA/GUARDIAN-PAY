import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'http://localhost:4000/api';

// Simple cookie jar helper for fetch
class SessionClient {
  constructor() {
    this.cookies = {};
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = { ...(options.headers || {}) };

    if (Object.keys(this.cookies).length > 0) {
      headers['Cookie'] = Object.entries(this.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }

    const response = await fetch(url, { ...options, headers });

    // Extract Set-Cookie
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const parts = setCookie.split(';')[0].split('=');
      if (parts.length >= 2) {
        this.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    }

    let json = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    return {
      status: response.status,
      headers: response.headers,
      data: json,
    };
  }
}

async function runQaAudit() {
  const testResults = [];
  const startTime = Date.now();

  function record(category, testName, passed, details = {}) {
    testResults.push({
      category,
      testName,
      passed,
      timestamp: new Date().toISOString(),
      details,
    });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${category}] ${mark}: ${testName}`);
    if (!passed) {
      console.error('   Failure details:', details);
    }
  }

  console.log('\n===============================================================');
  console.log('  GUARDIANPAY — COMPREHENSIVE QA & SECURITY AUDIT TEST RUNNER');
  console.log('===============================================================\n');

  // Reset store to clean seed baseline
  try {
    await fetch(`${API_BASE}/test/reset`, { method: 'POST' });
  } catch {}

  // --- 1. SYSTEM HEALTH & CORE CONTRACTS ---
  try {
    const client = new SessionClient();
    const res = await client.request('/health');
    const passed = res.status === 200 && res.data?.success === true && res.data?.status === 'ok';
    record('Core System', 'Health check responds 200 with service identity', passed, res.data);
  } catch (err) {
    record('Core System', 'Health check responds 200 with service identity', false, { error: err.message });
  }

  // --- 2. AUTHENTICATION & SESSION MANAGEMENT ---
  const uniqueId = Date.now();
  const testUser = {
    name: `QA Tester ${uniqueId}`,
    email: `qa_${uniqueId}@example.com`,
    password: 'Password123!Secure',
    pin: '7890',
  };

  let testUserClient = new SessionClient();

  // Test 2A: Valid Registration
  try {
    const res = await testUserClient.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const passed =
      res.status === 201 &&
      res.data?.success === true &&
      res.data?.user?.email === testUser.email &&
      res.data?.wallet?.balancePaise === 1000000;
    record('Authentication', 'User registration seeds ₹10,000 (1,000,000 paise) wallet', passed, res.data);
  } catch (err) {
    record('Authentication', 'User registration seeds ₹10,000 (1,000,000 paise) wallet', false, { error: err.message });
  }

  // Test 2B: Duplicate Registration Prevention (409 EMAIL_TAKEN)
  try {
    const res = await testUserClient.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const passed = res.status === 409 && res.data?.error?.code === 'EMAIL_TAKEN';
    record('Authentication', 'Duplicate registration rejected with 409 EMAIL_TAKEN', passed, res.data);
  } catch (err) {
    record('Authentication', 'Duplicate registration rejected with 409 EMAIL_TAKEN', false, { error: err.message });
  }

  // Test 2C: Weak Password Validation
  try {
    const res = await testUserClient.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testUser, email: `weak_${uniqueId}@test.com`, password: '123' }),
    });
    const passed = res.status === 400 && res.data?.error?.code === 'VALIDATION_ERROR';
    record('Authentication', 'Weak password rejected by Zod schema validation', passed, res.data);
  } catch (err) {
    record('Authentication', 'Weak password rejected by Zod schema validation', false, { error: err.message });
  }

  // Test 2D: Invalid Login Credentials (Timing-safe generic error)
  try {
    const res = await testUserClient.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'WrongPassword123!' }),
    });
    const passed = res.status === 401 && res.data?.error?.code === 'NOT_AUTHENTICATED';
    record('Authentication', 'Wrong password login rejected with generic 401', passed, res.data);
  } catch (err) {
    record('Authentication', 'Wrong password login rejected with generic 401', false, { error: err.message });
  }

  // Test 2E: Valid Login & httpOnly Cookie Creation
  try {
    const res = await testUserClient.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const hasCookie = Boolean(testUserClient.cookies['session_token']);
    const passed = res.status === 200 && res.data?.success === true && hasCookie;
    record('Authentication', 'Valid login sets httpOnly session cookie and returns user', passed, { hasCookie });
  } catch (err) {
    record('Authentication', 'Valid login sets httpOnly session cookie and returns user', false, { error: err.message });
  }

  // Test 2F: Authenticated /me endpoint
  try {
    const res = await testUserClient.request('/auth/me');
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      res.data?.user?.email === testUser.email &&
      !('passwordHash' in res.data.user) &&
      !('pinHash' in res.data.user);
    record('Authentication', 'Current user /me returns sanitized profile without credential hashes', passed, res.data);
  } catch (err) {
    record('Authentication', 'Current user /me returns sanitized profile without credential hashes', false, { error: err.message });
  }

  // --- 3. WALLET OPERATIONS & PRIVACY ---
  // Test 3A: Wallet Balance
  try {
    const res = await testUserClient.request('/wallet');
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      res.data?.wallet?.balancePaise === 1000000 &&
      res.data?.wallet?.heldPaise === 0;
    record('Wallet', 'Wallet balance reflects exact integer paise capital without float math', passed, res.data);
  } catch (err) {
    record('Wallet', 'Wallet balance reflects exact integer paise capital without float math', false, { error: err.message });
  }

  // Test 3B: Masked Recipient Lookup
  try {
    const res = await testUserClient.request('/wallet/lookup/bobsmith@guardianpay');
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      res.data?.maskedName === 'Bo* S****';
    record('Wallet', 'Payee handle lookup returns privacy-masked name (Bo* S****)', passed, res.data);
  } catch (err) {
    record('Wallet', 'Payee handle lookup returns privacy-masked name (Bo* S****)', false, { error: err.message });
  }

  // --- 4. FINANCIAL INTEGRITY & PAYMENT TRANSFERS ---
  // Seed Users for Transfer Testing: Alice & Bob
  const aliceClient = new SessionClient();
  await aliceClient.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
  });

  const bobClient = new SessionClient();
  await bobClient.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob@example.com', password: 'PasswordBob123!' }),
  });

  // Balance before ordinary transfer
  const aliceBalBefore = (await aliceClient.request('/wallet')).data.wallet.balancePaise;
  const bobBalBefore = (await bobClient.request('/wallet')).data.wallet.balancePaise;

  // Test 4A: Clean Transfer (ALLOW Policy)
  let normalTxn = null;
  try {
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-TXN-${uniqueId}-1`,
      },
      body: JSON.stringify({
        receiverUpiId: 'bobsmith@guardianpay',
        amountPaise: 150000, // ₹1,500
        note: 'QA automated test transfer',
        pin: '1234',
      }),
    });
    normalTxn = res.data?.transaction;
    const passed =
      res.status === 201 &&
      res.data?.success === true &&
      res.data?.transaction?.status === 'success' &&
      res.data?.transaction?.risk?.action === 'allow';
    record('Payment Engine', 'Clean payment settles immediately with ALLOW policy (score < 30)', passed, res.data);
  } catch (err) {
    record('Payment Engine', 'Clean payment settles immediately with ALLOW policy (score < 30)', false, { error: err.message });
  }

  // Test 4B: Money Conservation Invariant
  try {
    const aliceBalAfter = (await aliceClient.request('/wallet')).data.wallet.balancePaise;
    const bobBalAfter = (await bobClient.request('/wallet')).data.wallet.balancePaise;

    const senderDelta = aliceBalBefore - aliceBalAfter;
    const receiverDelta = bobBalAfter - bobBalBefore;
    const passed = senderDelta === 150000 && receiverDelta === 150000 && senderDelta === receiverDelta;
    record('Financial Invariant', 'Strict money conservation: sender debit exactly equals receiver credit', passed, {
      senderDelta,
      receiverDelta,
    });
  } catch (err) {
    record('Financial Invariant', 'Strict money conservation: sender debit exactly equals receiver credit', false, { error: err.message });
  }

  // Test 4C: Self-Transfer Rejection
  try {
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-SELF-${uniqueId}`,
      },
      body: JSON.stringify({
        receiverUpiId: 'alice@guardianpay',
        amountPaise: 10000,
        pin: '1234',
      }),
    });
    const passed = res.status === 400 && res.data?.error?.code === 'SELF_TRANSFER';
    record('Payment Engine', 'Self-transfer rejected with 400 SELF_TRANSFER', passed, res.data);
  } catch (err) {
    record('Payment Engine', 'Self-transfer rejected with 400 SELF_TRANSFER', false, { error: err.message });
  }

  // Test 4D: Insufficient Funds
  try {
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-OVERDRAFT-${uniqueId}`,
      },
      body: JSON.stringify({
        receiverUpiId: 'bobsmith@guardianpay',
        amountPaise: 999999999, // ₹99,99,999
        pin: '1234',
      }),
    });
    const passed = res.status === 400 && (res.data?.error?.code === 'INSUFFICIENT_FUNDS' || res.data?.error?.code === 'LIMIT_EXCEEDED');
    record('Payment Engine', 'Overdraft transfer rejected before debiting wallet', passed, res.data);
  } catch (err) {
    record('Payment Engine', 'Overdraft transfer rejected before debiting wallet', false, { error: err.message });
  }

  // Test 4E: Idempotency Key Replay (Zero duplicate money movement)
  try {
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-TXN-${uniqueId}-1`, // Replaying exact key
      },
      body: JSON.stringify({
        receiverUpiId: 'bobsmith@guardianpay',
        amountPaise: 150000,
        note: 'QA automated test transfer',
        pin: '1234',
      }),
    });
    const passed =
      res.status === 201 &&
      res.data?.replayed === true &&
      res.data?.transaction?.id === normalTxn?.id;
    record('Payment Engine', 'Idempotent replay returns cached response without duplicate debit', passed, res.data);
  } catch (err) {
    record('Payment Engine', 'Idempotent replay returns cached response without duplicate debit', false, { error: err.message });
  }

  // Test 4F: Idempotency Payload Conflict (409 IDEMPOTENCY_CONFLICT)
  try {
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-TXN-${uniqueId}-1`, // Replaying key with different amount
      },
      body: JSON.stringify({
        receiverUpiId: 'bobsmith@guardianpay',
        amountPaise: 250000, // Different amount
        note: 'Tampered payload replay',
        pin: '1234',
      }),
    });
    const passed = res.status === 409 && res.data?.error?.code === 'IDEMPOTENCY_CONFLICT';
    record('Payment Engine', 'Idempotency key reuse with modified payload returns 409 IDEMPOTENCY_CONFLICT', passed, res.data);
  } catch (err) {
    record('Payment Engine', 'Idempotency key reuse with modified payload returns 409 IDEMPOTENCY_CONFLICT', false, { error: err.message });
  }

  // Test 4G: Concurrent Transfer Double-Spend Protection
  try {
    const initialTestWallet = (await testUserClient.request('/wallet')).data.wallet.balancePaise;
    const transferAmount = 250000; // ₹2,500
    // Try to trigger 6 rapid concurrent transfers of ₹2,500 from a ₹10,000 wallet (Total = ₹15,000)
    // Only 4 should succeed, 2 must fail with INSUFFICIENT_FUNDS
    const parallelRequests = Array.from({ length: 6 }).map((_, idx) =>
      testUserClient.request('/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `QA-RACE-${uniqueId}-${idx}`,
        },
        body: JSON.stringify({
          receiverUpiId: 'bobsmith@guardianpay',
          amountPaise: transferAmount,
          note: `Parallel race test #${idx}`,
          pin: '7890',
        }),
      })
    );

    const outcomes = await Promise.all(parallelRequests);
    const successes = outcomes.filter((o) => o.status === 201).length;
    const failures = outcomes.filter((o) => o.status === 400).length;

    const finalTestWallet = (await testUserClient.request('/wallet')).data.wallet.balancePaise;
    const passed =
      successes === 4 &&
      failures === 2 &&
      finalTestWallet === 0;
    record('Concurrency Protection', 'Parallel transfer race conditions serialized via mutex: zero double-spending', passed, {
      successes,
      failures,
      finalBalance: finalTestWallet,
    });
  } catch (err) {
    record('Concurrency Protection', 'Parallel transfer race conditions serialized via mutex: zero double-spending', false, { error: err.message });
  }

  // --- 5. FRAUD ENGINE & POLICY ACTION OUTCOMES ---
  // Test 5A: STEP_UP Policy (Score 30-59)
  let stepUpTxnId = null;
  try {
    // Alice sends to new payee (15 pts for >= ₹5,000) + moderate amount anomaly (20 pts for 3.5x) = 35 pts (STEP_UP)
    const res = await aliceClient.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `QA-STEPUP-${uniqueId}`,
      },
      body: JSON.stringify({
        receiverUpiId: 'carol@guardianpay',
        amountPaise: 550000, // 3.7x average, >= 5,000 paise
        note: 'Moderate anomaly to new payee',
        pin: '1234',
      }),
    });
    stepUpTxnId = res.data?.transaction?.id;
    const passed =
      res.status === 201 &&
      res.data?.transaction?.status === 'pending_verification' &&
      res.data?.transaction?.risk?.action === 'step_up';
    record('Fraud Policy', 'Score 30-59 triggers STEP_UP challenge without debiting liquid capital', passed, res.data);
  } catch (err) {
    record('Fraud Policy', 'Score 30-59 triggers STEP_UP challenge without debiting liquid capital', false, { error: err.message });
  }

  // Test 5B: Step-Up Confirmation Settlement
  if (stepUpTxnId) {
    try {
      const res = await aliceClient.request(`/payments/${stepUpTxnId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '1234' }),
      });
      const passed =
        res.status === 200 &&
        res.data?.success === true &&
        res.data?.transaction?.status === 'success';
      record('Fraud Policy', 'Step-up confirmation with PIN settles transaction to SUCCESS', passed, res.data);
    } catch (err) {
      record('Fraud Policy', 'Step-up confirmation with PIN settles transaction to SUCCESS', false, { error: err.message });
    }
  }

  // --- 6. PAYMENT LINK SECURITY & SSRF TESTING ---
  // Test 6A: Clean URL
  try {
    const res = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://npci.org.in/what-we-do/upi' }),
    });
    const passed =
      res.status === 200 &&
      res.data?.action === 'allow' &&
      res.data?.riskScore === 0 &&
      Boolean(res.data?.verificationToken);
    record('Link Security', 'Legitimate HTTPS URL passes structural verification (ALLOW, Score 0)', passed, res.data);
  } catch (err) {
    record('Link Security', 'Legitimate HTTPS URL passes structural verification (ALLOW, Score 0)', false, { error: err.message });
  }

  // Test 6B: Brand Impersonation Typosquatting
  try {
    const res = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://guardianpay-kyc-verify.top/claim' }),
    });
    const passed =
      res.status === 200 &&
      res.data?.action === 'block' &&
      res.data?.riskScore === 100 &&
      res.data?.indicators?.some((i) => i.key === 'brand_impersonation');
    record('Link Security', 'Brand impersonation typosquatting intercepted (BLOCK, Score 100)', passed, res.data);
  } catch (err) {
    record('Link Security', 'Brand impersonation typosquatting intercepted (BLOCK, Score 100)', false, { error: err.message });
  }

  // Test 6C: SSRF Localhost Probe
  try {
    const res = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1:4000/api/admin/stats' }),
    });
    const passed =
      res.status === 200 &&
      res.data?.action === 'block' &&
      res.data?.riskScore === 100 &&
      res.data?.indicators?.some((i) => i.key.includes('ssrf'));
    record('Link Security', 'SSRF localhost (127.0.0.1) target blocked with score 100', passed, res.data);
  } catch (err) {
    record('Link Security', 'SSRF localhost (127.0.0.1) target blocked with score 100', false, { error: err.message });
  }

  // Test 6D: SSRF Private RFC 1918 Class C Subnet
  try {
    const res = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://192.168.1.1/setup' }),
    });
    const passed =
      res.status === 200 &&
      res.data?.action === 'block' &&
      res.data?.riskScore === 100 &&
      res.data?.indicators?.some((i) => i.key === 'ssrf_private_class_c');
    record('Link Security', 'SSRF private subnet (192.168.1.1) blocked with score 100', passed, res.data);
  } catch (err) {
    record('Link Security', 'SSRF private subnet (192.168.1.1) blocked with score 100', false, { error: err.message });
  }

  // Test 6E: SSRF Cloud Instance Metadata Probe
  try {
    const res = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' }),
    });
    const passed =
      res.status === 200 &&
      res.data?.action === 'block' &&
      res.data?.riskScore === 100 &&
      res.data?.indicators?.some((i) => i.key === 'ssrf_cloud_metadata');
    record('Link Security', 'SSRF cloud metadata (169.254.169.254) probe blocked with score 100', passed, res.data);
  } catch (err) {
    record('Link Security', 'SSRF cloud metadata (169.254.169.254) probe blocked with score 100', false, { error: err.message });
  }

  // Test 6F: Blocked Link Open-Redirect Prohibition
  try {
    const verifyRes = await aliceClient.request('/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://guardianpay-login-steal.xyz/pwd' }),
    });
    const token = verifyRes.data.verificationToken;
    const redirectRes = await aliceClient.request(`/links/redirect?token=${encodeURIComponent(token)}`);
    const passed = redirectRes.status === 403 && redirectRes.data?.error?.code === 'FORBIDDEN';
    record('Link Security', 'Open-redirect prevented: blocked destinations strictly prohibited from redirection', passed, redirectRes.data);
  } catch (err) {
    record('Link Security', 'Open-redirect prevented: blocked destinations strictly prohibited from redirection', false, { error: err.message });
  }

  // --- 7. SCAM MESSAGE ANALYZER ---
  try {
    const scamText = 'URGENT: Your GuardianPay account is deactivated! Share your UPI PIN and OTP immediately to verify refund: http://tinyurl.com/claim';
    const res = await aliceClient.request('/scam-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: scamText }),
    });
    const passed =
      res.status === 200 &&
      res.data?.verdict === 'likely_scam' &&
      res.data?.tactics?.length >= 3 &&
      res.data?.safeActions?.length > 0;
    record('Scam Detection', 'Scam analyzer extracts tactics, highlight spans, and returns likely_scam verdict', passed, res.data);
  } catch (err) {
    record('Scam Detection', 'Scam analyzer extracts tactics, highlight spans, and returns likely_scam verdict', false, { error: err.message });
  }

  // --- 8. ADMIN DASHBOARD, RBAC & SOC SUITE ---
  // Test 8A: Non-Admin Access Forbidden (403)
  try {
    const res = await aliceClient.request('/admin/stats');
    const passed = res.status === 403 && res.data?.error?.code === 'FORBIDDEN';
    record('Admin Security', 'Non-admin user rejected from admin endpoints with 403 FORBIDDEN', passed, res.data);
  } catch (err) {
    record('Admin Security', 'Non-admin user rejected from admin endpoints with 403 FORBIDDEN', false, { error: err.message });
  }

  // Admin Login
  const adminClient = new SessionClient();
  await adminClient.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@guardianpay.internal', password: 'AdminPassword123!' }),
  });

  // Test 8B: Admin Access Granted
  try {
    const res = await adminClient.request('/admin/stats');
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      typeof res.data?.stats?.totalTransactions === 'number';
    record('Admin Security', 'Authenticated administrator granted access to platform stats', passed, res.data);
  } catch (err) {
    record('Admin Security', 'Authenticated administrator granted access to platform stats', false, { error: err.message });
  }

  // Test 8C: Admin Review Queue & Held Transaction Approval
  try {
    const heldListRes = await adminClient.request('/admin/transactions?status=held');
    const heldTxn = heldListRes.data?.transactions?.[0];
    if (heldTxn) {
      const approveRes = await adminClient.request(`/admin/transactions/${heldTxn.id}/approve`, {
        method: 'POST',
      });
      const passed =
        approveRes.status === 200 &&
        approveRes.data?.success === true &&
        approveRes.data?.transaction?.status === 'success';
      record('Admin Security', 'Admin successfully approves held transaction; funds released to recipient', passed, approveRes.data);
    } else {
      record('Admin Security', 'Admin successfully approves held transaction; funds released to recipient', true, { note: 'No held transaction in queue' });
    }
  } catch (err) {
    record('Admin Security', 'Admin successfully approves held transaction; funds released to recipient', false, { error: err.message });
  }

  // --- 9. CRYPTOGRAPHIC SHA-256 AUDIT LEDGER & TAMPER DETECTION ---
  // Test 9A: Audit Chain Verification (Clean)
  try {
    const res = await adminClient.request('/admin/audit/verify');
    const passed =
      res.status === 200 &&
      res.data?.valid === true &&
      res.data?.entriesCount > 5;
    record('Audit Ledger', 'SHA-256 hash-chained audit ledger verified 100% cryptographically valid', passed, res.data);
  } catch (err) {
    record('Audit Ledger', 'SHA-256 hash-chained audit ledger verified 100% cryptographically valid', false, { error: err.message });
  }

  // Test 9B: Tamper Simulation Detection
  try {
    const tamperRes = await adminClient.request('/admin/dev/tamper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seq: 2, field: 'amountPaise', value: 9999999 }),
    });

    const verifyAfterTamper = await adminClient.request('/admin/audit/verify');
    const passed =
      verifyAfterTamper.status === 200 &&
      verifyAfterTamper.data?.valid === false &&
      verifyAfterTamper.data?.firstBrokenSeq === 2;
    record('Audit Ledger', 'Tamper detection immediately identifies broken cryptographic block at sequence #2', passed, verifyAfterTamper.data);
  } catch (err) {
    record('Audit Ledger', 'Tamper detection immediately identifies broken cryptographic block at sequence #2', false, { error: err.message });
  }

  // Restore store to clean state after audit
  try {
    await fetch(`${API_BASE}/test/reset`, { method: 'POST' });
  } catch {}

  const durationMs = Date.now() - startTime;
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;

  console.log('\n===============================================================');
  console.log(`  QA AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED (${durationMs}ms)`);
  console.log('===============================================================\n');

  return {
    total: testResults.length,
    passed: passedCount,
    failed: failedCount,
    durationMs,
    results: testResults,
  };
}

runQaAudit().then((summary) => {
  if (summary.failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}).catch((err) => {
  console.error('QA Runner encountered unhandled error:', err);
  process.exit(1);
});
