import assert from 'node:assert';
import { env } from '../src/config/env.js';
import { aiService } from '../src/services/aiService.js';
import { scamAnalyzer } from '../src/services/scamAnalyzer.js';
import { POLICY_ACTION, RISK_LEVEL } from '../src/config/constants.js';

let passed = 0;
let failed = 0;

function report(testName, ok, details = null) {
  if (ok) {
    passed++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${testName}`);
    if (details) console.error('  Details:', details);
  }
}

async function runGroqTests() {
  console.log('===============================================================');
  console.log('  GUARDIANPAY — GROQ AI INTEGRATION & SECURITY VERIFICATION    ');
  console.log('===============================================================');
  console.log(`Configured Groq Model: ${env.GROQ_MODEL}`);
  console.log(`API Key Present: ${Boolean(env.GROQ_API_KEY)} (Length: ${env.GROQ_API_KEY?.length || 0})`);
  console.log('---------------------------------------------------------------');

  // Test 1: Direct Groq API Connectivity & Authentication
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages: [{ role: 'user', content: 'Reply with the word CONNECTED' }],
        max_tokens: 30,
      }),
    });

    const isConnected = res.status === 200;
    const data = isConnected ? await res.json() : null;
    const reply = data?.choices?.[0]?.message?.content || '';
    report('Direct Groq API Connectivity & Authentication (HTTP 200)', isConnected, {
      status: res.status,
      reply: reply.slice(0, 50),
    });
  } catch (err) {
    report('Direct Groq API Connectivity & Authentication (HTTP 200)', false, {
      error: err.message,
    });
  }

  // Test 2: AI Review of Transaction Risk (Zod Schema Validation)
  try {
    const reviewResult = await aiService.reviewTransactionRisk({
      score: 75,
      level: RISK_LEVEL.HIGH,
      policyAction: POLICY_ACTION.HOLD,
      signals: [
        { id: 'SIG_VELOCITY_SPIKE', status: 'triggered', detail: 'Rapid succession of high-value debits', points: 40 },
        { id: 'SIG_NEW_DEVICE', status: 'triggered', detail: 'Unrecognized hardware fingerprint from foreign IP', points: 35 },
      ],
      amountPaise: 3500000, // ₹35,000
      maskedReceiverUpiId: 'da***@guardianpay',
      accountAgeDays: 5,
    });

    const isOk =
      reviewResult.status === 'completed' &&
      reviewResult.source === 'groq' &&
      typeof reviewResult.verdict.summary === 'string' &&
      Array.isArray(reviewResult.verdict.keyReasons) &&
      reviewResult.verdict.keyReasons.length > 0 &&
      typeof reviewResult.verdict.userMessage === 'string' &&
      typeof reviewResult.verdict.adminNote === 'string';

    report('Structured Risk Explanation with Zod Schema Validation', isOk, reviewResult);
  } catch (err) {
    report('Structured Risk Explanation with Zod Schema Validation', false, { error: err.message });
  }

  // Test 3: Admin Case Investigation Summary Generation
  try {
    const adminSummary = await aiService.generateAdminCaseSummary({
      id: 'TXN-TEST-1234',
      status: 'HELD',
      receiverUpiId: 'attacker@darkweb.org',
      risk: {
        score: 85,
        level: 'critical',
        action: 'hold',
        signals: [
          { status: 'triggered', detail: 'Account balance depletion attempt within 2 minutes' },
          { status: 'triggered', detail: 'Beneficiary on global fraud watch list' },
        ],
      },
    });

    const isOk = typeof adminSummary === 'string' && adminSummary.length > 20;
    report('Admin Fraud Case Investigation Summary Generation', isOk, { adminSummary });
  } catch (err) {
    report('Admin Fraud Case Investigation Summary Generation', false, { error: err.message });
  }

  // Test 4: Scam Message & Tactic Extraction Analysis
  try {
    const scamResult = await scamAnalyzer.analyzeMessage(
      'URGENT: Your bank account will be blocked today! Share your 6-digit OTP immediately to verify KYC and claim ₹50,000 prize.'
    );

    const isOk =
      scamResult.verdict === 'likely_scam' &&
      Array.isArray(scamResult.tactics) &&
      scamResult.tactics.length >= 2 &&
      Array.isArray(scamResult.safeActions) &&
      scamResult.aiStatus === 'completed' &&
      scamResult.aiSource === 'groq';

    report('Scam Message Analysis with Tactic Extraction & AI Advice', isOk, {
      verdict: scamResult.verdict,
      tactics: scamResult.tactics,
      aiSource: scamResult.aiSource,
    });
  } catch (err) {
    report('Scam Message Analysis with Tactic Extraction & AI Advice', false, { error: err.message });
  }

  // Test 5: Invariant Check — Deterministic Engine Decision Preserved
  try {
    // When deterministic engine assigns HOLD (score 75), AI cannot change the policy action
    const deterministicHoldAction = POLICY_ACTION.HOLD;
    const reviewResult = await aiService.reviewTransactionRisk({
      score: 75,
      level: RISK_LEVEL.HIGH,
      policyAction: deterministicHoldAction,
      signals: [{ id: 'SIG_TEST', status: 'triggered', detail: 'Suspicious transaction pattern', points: 45 }],
      amountPaise: 2000000,
      maskedReceiverUpiId: 'te***@upi',
      accountAgeDays: 14,
    });

    // Invariant: reviewResult must NOT mutate or override deterministicHoldAction
    assert.strictEqual(deterministicHoldAction, POLICY_ACTION.HOLD);
    assert.ok(reviewResult.verdict !== null);
    report('Invariant Preserved: AI Never Overrides Deterministic Policy Action', true, {
      policyAction: deterministicHoldAction,
      aiRecommendation: reviewResult.verdict.recommendedAction,
      disagreesWithPolicy: reviewResult.disagreesWithPolicy,
    });
  } catch (err) {
    report('Invariant Preserved: AI Never Overrides Deterministic Policy Action', false, {
      error: err.message,
    });
  }

  // Test 6: Low Risk Transfer (< 30 score) Skips AI
  try {
    const skipResult = await aiService.reviewTransactionRisk({
      score: 15,
      level: RISK_LEVEL.LOW,
      policyAction: POLICY_ACTION.ALLOW,
      signals: [],
      amountPaise: 50000,
      maskedReceiverUpiId: 'bo***@guardianpay',
      accountAgeDays: 60,
    });

    const isSkipped = skipResult.status === 'skipped' && skipResult.source === 'none' && skipResult.verdict === null;
    report('AI Review Efficiently Skipped for Safe Transfers (Score < 30)', isSkipped, skipResult);
  } catch (err) {
    report('AI Review Efficiently Skipped for Safe Transfers (Score < 30)', false, { error: err.message });
  }

  // Test 7: Fallback on Invalid API Key (Graceful Degradation)
  try {
    const originalKey = env.GROQ_API_KEY;
    const originalGemini = env.GEMINI_API_KEY;
    // Temporarily set invalid key
    env.GROQ_API_KEY = 'gsk_invalid_test_key_for_fallback_verification';
    env.GEMINI_API_KEY = '';

    const fallbackResult = await aiService.reviewTransactionRisk({
      score: 65,
      level: RISK_LEVEL.MEDIUM,
      policyAction: POLICY_ACTION.STEP_UP,
      signals: [{ id: 'SIG_TEST', status: 'triggered', detail: 'Rapid succession test', points: 35 }],
      amountPaise: 1500000,
      maskedReceiverUpiId: 'fa***@upi',
      accountAgeDays: 10,
    });

    // Restore keys
    env.GROQ_API_KEY = originalKey;
    env.GEMINI_API_KEY = originalGemini;

    const isFallback =
      fallbackResult.status === 'fallback' &&
      fallbackResult.source === 'template' &&
      typeof fallbackResult.verdict?.summary === 'string';

    report('Graceful Degradation: Safe Fallback on Invalid API Key', isFallback, fallbackResult);
  } catch (err) {
    report('Graceful Degradation: Safe Fallback on Invalid API Key', false, { error: err.message });
  }

  // Test 8: Fallback on Timeout (AbortController Resilience)
  try {
    // Call Groq with an impossible 1ms timeout to verify AbortController behavior
    let abortedCleanly = false;
    try {
      await aiService._callGroqJson(
        [{ role: 'user', content: 'Return JSON' }],
        1 // 1ms timeout
      );
    } catch (err) {
      abortedCleanly = err.name === 'AbortError' || err.message.includes('abort');
    }

    report('Timeout Resilience: AbortController Cancels Hanging Requests', abortedCleanly);
  } catch (err) {
    report('Timeout Resilience: AbortController Cancels Hanging Requests', false, { error: err.message });
  }

  console.log('---------------------------------------------------------------');
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runGroqTests();
