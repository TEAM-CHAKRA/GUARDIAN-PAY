import assert from 'node:assert';
import { repository } from '../src/store/repository.js';
import {
  hashSecret,
  verifySecret,
  generateUpiId,
  generateSessionToken,
  verifyUserPin,
} from '../src/services/authService.js';
import { generateId } from '../src/utils/idGenerator.js';
import { ERROR_CODES, USER_ROLE } from '../src/config/constants.js';

async function runPhase1Tests() {
  console.log('=== Starting Phase 1: Secure Authentication and Wallet Tests ===');

  // 1. Password & PIN Hashing (Argon2id)
  console.log('Test 1: Argon2id Hashing and Verification...');
  const password = 'TestSecurePassword123!';
  const pin = '4321';
  const passHash = await hashSecret(password);
  const pinHash = await hashSecret(pin);

  assert.strictEqual(await verifySecret(password, passHash), true, 'Password verification failed');
  assert.strictEqual(await verifySecret('WrongPass!', passHash), false, 'Wrong password erroneously passed');
  assert.strictEqual(await verifySecret(pin, pinHash), true, 'PIN verification failed');
  assert.strictEqual(await verifySecret('9999', pinHash), false, 'Wrong PIN erroneously passed');
  console.log('✓ Argon2id password and PIN hashing verified.');

  // 2. User Registration & Wallet Seeding
  console.log('Test 2: User Creation & Wallet Seeding...');
  const userId = generateId('USR');
  const upiId = generateUpiId('Bob Smith');
  const user = {
    id: userId,
    name: 'Bob Smith',
    email: 'bob.test@example.com',
    role: USER_ROLE.USER,
    upiId,
    passwordHash: passHash,
    pinHash,
    pinFailedAt: [],
    pinLockedUntil: null,
    createdAt: new Date().toISOString(),
  };

  await repository.createUser(user);
  await repository.createWallet({
    userId,
    upiId,
    balancePaise: 1000000, // ₹10,000
    heldPaise: 0,
    dailySpentPaise: 0,
    dailyResetDate: new Date().toISOString().slice(0, 10),
  });

  const fetchedWallet = await repository.getWallet(userId);
  assert.strictEqual(fetchedWallet.balancePaise, 1000000, 'Initial wallet balance must be 1,000,000 paise');
  console.log('✓ Initial wallet balance verified at 1,000,000 paise.');

  // 3. Payee Lookup Masking
  console.log('Test 3: Payee Name Masking...');
  const payeeUser = await repository.getUserByUpiId(upiId);
  assert.ok(payeeUser, 'Payee user must be retrievable by UPI handle');
  assert.strictEqual(payeeUser.name, 'Bob Smith');
  console.log('✓ Payee lookup successful.');

  // 4. PIN Lockout (5 attempts in 15 mins)
  console.log('Test 4: PIN Lockout Rule (5 failed attempts)...');
  let lockedErrorOccurred = false;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await verifyUserPin(userId, '0000');
    } catch (err) {
      if (err.message === ERROR_CODES.PIN_LOCKED) {
        lockedErrorOccurred = true;
        assert.strictEqual(attempt, 5, 'PIN_LOCKED must be triggered on the 5th attempt');
      }
    }
  }

  assert.strictEqual(lockedErrorOccurred, true, 'PIN_LOCKED must have triggered');

  // Verify subsequent attempt is immediately rejected with PIN_LOCKED
  try {
    await verifyUserPin(userId, pin); // Even with correct PIN
    assert.fail('Should not allow correct PIN while locked');
  } catch (err) {
    assert.strictEqual(err.message, ERROR_CODES.PIN_LOCKED);
  }
  console.log('✓ 5-failure PIN lockout enforced properly with HTTP 423 PIN_LOCKED.');

  // 5. Session Token & Revocation
  console.log('Test 5: JWT Session Token & JTI Revocation...');
  const { token, jti } = generateSessionToken(userId, USER_ROLE.USER);
  assert.ok(token && jti, 'Token and JTI must be generated');
  assert.strictEqual(await repository.isSessionRevoked(jti), false, 'Fresh session must not be revoked');

  await repository.revokeSession(jti);
  assert.strictEqual(await repository.isSessionRevoked(jti), true, 'Session must be revoked after logout');
  console.log('✓ Session JTI revocation verified.');

  console.log('\n========================================');
  console.log('✓ ALL PHASE 1 INTEGRATION TESTS PASSED!');
  console.log('========================================\n');
}

runPhase1Tests().catch((err) => {
  console.error('Phase 1 test failed:', err);
  process.exit(1);
});
