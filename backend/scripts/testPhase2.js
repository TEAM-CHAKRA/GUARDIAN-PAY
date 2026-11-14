import assert from 'node:assert';
import { repository } from '../src/store/repository.js';
import { paymentService } from '../src/services/paymentService.js';
import { hashSecret } from '../src/services/authService.js';
import { generateId } from '../src/utils/idGenerator.js';
import { ERROR_CODES, USER_ROLE } from '../src/config/constants.js';

async function runPhase2Tests() {
  console.log('=== Starting Phase 2: Reliable Payment Engine Tests ===');

  // Setup Sender (Alice) and Receiver (Bob)
  const pin = '1234';
  const pinHash = await hashSecret(pin);

  const alice = {
    id: generateId('USR'),
    name: 'Alice Phase2',
    email: 'alice.p2@example.com',
    role: USER_ROLE.USER,
    upiId: 'alice.p2@guardianpay',
    passwordHash: 'hash',
    pinHash,
    pinFailedAt: [],
    pinLockedUntil: null,
    createdAt: new Date().toISOString(),
  };

  const bob = {
    id: generateId('USR'),
    name: 'Bob Phase2',
    email: 'bob.p2@example.com',
    role: USER_ROLE.USER,
    upiId: 'bob.p2@guardianpay',
    passwordHash: 'hash',
    pinHash,
    pinFailedAt: [],
    pinLockedUntil: null,
    createdAt: new Date().toISOString(),
  };

  await repository.createUser(alice);
  await repository.createUser(bob);

  await repository.createWallet({
    userId: alice.id,
    upiId: alice.upiId,
    balancePaise: 500000, // ₹5,000
    heldPaise: 0,
    dailySpentPaise: 0,
    dailyResetDate: new Date().toISOString().slice(0, 10),
  });

  await repository.createWallet({
    userId: bob.id,
    upiId: bob.upiId,
    balancePaise: 200000, // ₹2,000
    heldPaise: 0,
    dailySpentPaise: 0,
    dailyResetDate: new Date().toISOString().slice(0, 10),
  });

  const initialTotalPaise = 500000 + 200000;

  // 1. Successful Transfer (₹1,000 = 100,000 paise)
  console.log('Test 1: Normal Atomic Transfer...');
  const key1 = 'IDEMP-TEST-KEY-001';
  const res1 = await paymentService.createPayment({
    senderUser: alice,
    idempotencyKey: key1,
    receiverUpiId: bob.upiId,
    amountPaise: 100000,
    note: 'Dinner bill split',
    pin,
  });

  assert.strictEqual(res1.transaction.status, 'success');
  const aliceW1 = await repository.getWallet(alice.id);
  const bobW1 = await repository.getWallet(bob.id);
  assert.strictEqual(aliceW1.balancePaise, 400000, 'Alice balance should be debited to 400,000');
  assert.strictEqual(bobW1.balancePaise, 300000, 'Bob balance should be credited to 300,000');
  console.log('✓ Normal transfer completed atomically.');

  // 2. Idempotency Replay
  console.log('Test 2: Idempotency Key Replay...');
  const res1Replay = await paymentService.createPayment({
    senderUser: alice,
    idempotencyKey: key1,
    receiverUpiId: bob.upiId,
    amountPaise: 100000,
    note: 'Dinner bill split',
    pin,
  });

  assert.strictEqual(res1Replay.replayed, true, 'Replay must be flagged');
  const aliceWReplay = await repository.getWallet(alice.id);
  assert.strictEqual(aliceWReplay.balancePaise, 400000, 'Replay must NOT deduct balance a second time');
  console.log('✓ Idempotency replay prevented double-charge.');

  // 3. Idempotency Conflict (different payload)
  console.log('Test 3: Idempotency Payload Conflict (409)...');
  try {
    await paymentService.createPayment({
      senderUser: alice,
      idempotencyKey: key1,
      receiverUpiId: bob.upiId,
      amountPaise: 200000, // Different amount!
      note: 'Dinner bill split',
      pin,
    });
    assert.fail('Should throw IDEMPOTENCY_CONFLICT');
  } catch (err) {
    assert.strictEqual(err.message, ERROR_CODES.IDEMPOTENCY_CONFLICT);
  }
  console.log('✓ Idempotency conflict detected and rejected.');

  // 4. Overdraft Rejection
  console.log('Test 4: Overdraft / Insufficient Balance...');
  try {
    await paymentService.createPayment({
      senderUser: alice,
      idempotencyKey: 'IDEMP-TEST-KEY-002',
      receiverUpiId: bob.upiId,
      amountPaise: 900000, // Exceeds balance
      note: 'Overdraft test',
      pin,
    });
    assert.fail('Should throw INSUFFICIENT_FUNDS');
  } catch (err) {
    assert.strictEqual(err.message, ERROR_CODES.INSUFFICIENT_FUNDS);
  }
  console.log('✓ Insufficient funds rejected cleanly.');

  // 5. Wrong PIN Rejection
  console.log('Test 5: Wrong PIN Rejection...');
  try {
    await paymentService.createPayment({
      senderUser: alice,
      idempotencyKey: 'IDEMP-TEST-KEY-003',
      receiverUpiId: bob.upiId,
      amountPaise: 50000,
      note: 'Wrong pin test',
      pin: '9999',
    });
    assert.fail('Should throw INVALID_PIN');
  } catch (err) {
    assert.strictEqual(err.message, ERROR_CODES.INVALID_PIN);
  }
  console.log('✓ Invalid PIN rejected.');

  // 6. Concurrent Transfer Race Condition (Promise Mutex Test)
  console.log('Test 6: Concurrent Race Condition Mutex Test...');
  // Alice has 400,000 paise left. Attempt 5 simultaneous transfers of 100,000 paise (Total 500,000 > 400,000).
  // Exactly 4 must succeed, and exactly 1 must fail with INSUFFICIENT_FUNDS. Zero negative balance!
  const concurrentTransfers = Array.from({ length: 5 }).map((_, i) =>
    paymentService
      .createPayment({
        senderUser: alice,
        idempotencyKey: `IDEMP-CONCURRENT-${Date.now()}-${i}`,
        receiverUpiId: bob.upiId,
        amountPaise: 100000,
        note: `Concurrent split #${i}`,
        pin,
      })
      .then(() => ({ success: true }))
      .catch((err) => ({ success: false, error: err.message }))
  );

  const results = await Promise.all(concurrentTransfers);
  const successes = results.filter((r) => r.success).length;
  const failures = results.filter((r) => !r.success && r.error === ERROR_CODES.INSUFFICIENT_FUNDS).length;

  assert.strictEqual(successes, 4, 'Exactly 4 concurrent transfers must succeed');
  assert.strictEqual(failures, 1, 'Exactly 1 concurrent transfer must fail with INSUFFICIENT_FUNDS');

  const aliceWFinal = await repository.getWallet(alice.id);
  const bobWFinal = await repository.getWallet(bob.id);

  assert.strictEqual(aliceWFinal.balancePaise, 0, 'Alice final balance must be exactly 0 paise (no negative balances)');
  assert.strictEqual(bobWFinal.balancePaise, 700000, 'Bob final balance must be exactly 700,000 paise');

  // Total Money Conservation
  const finalTotalPaise = aliceWFinal.balancePaise + bobWFinal.balancePaise;
  assert.strictEqual(finalTotalPaise, initialTotalPaise, 'Total money in system must be strictly conserved');
  console.log('✓ Concurrent race conditions prevented; total money strictly conserved.');

  console.log('\n========================================');
  console.log('✓ ALL PHASE 2 INTEGRATION TESTS PASSED!');
  console.log('========================================\n');
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});
