import { repository } from '../src/store/repository.js';
import { hashSecret } from '../src/services/authService.js';
import { auditService } from '../src/services/auditService.js';
import { generateId, generateUtr } from '../src/utils/idGenerator.js';
import { USER_ROLE, TRANSACTION_STATUS, AUDIT_EVENT_TYPE } from '../src/config/constants.js';

export async function seedDemoData() {
  // Clear any existing store state
  repository.users.clear();
  repository.usersByEmail.clear();
  repository.usersByUpiId.clear();
  repository.wallets.clear();
  repository.transactions.clear();
  repository.idempotency.clear();
  repository.auditLog.length = 0;
  repository.revokedSessions.clear();

  const now = new Date();
  const todayKolkata = now.toISOString().slice(0, 10);

  // 1. Seed Demo Users
  const demoUsersConfig = [
    {
      id: 'USR-101',
      name: 'Aarav Mehta',
      email: 'aarav.mehta@guardian.secure',
      password: 'Password@2026',
      pin: '123456',
      upiId: 'aarav@aegis',
      role: USER_ROLE.USER,
      balancePaise: 8425000, // ₹84,250
    },
    {
      id: 'USR-102',
      name: 'Alice Sharma',
      email: 'alice@example.com',
      password: 'Password123!',
      pin: '1234',
      upiId: 'alice@guardianpay',
      role: USER_ROLE.USER,
      balancePaise: 8425000, // ₹84,250
    },
    {
      id: 'USR-103',
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'PasswordBob123!',
      pin: '5678',
      upiId: 'bobsmith@guardianpay',
      role: USER_ROLE.USER,
      balancePaise: 5000000, // ₹50,000
    },
    {
      id: 'USR-104',
      name: 'Carol Danvers',
      email: 'carol@example.com',
      password: 'PasswordCarol123!',
      pin: '1122',
      upiId: 'carol@guardianpay',
      role: USER_ROLE.USER,
      balancePaise: 3000000, // ₹30,000
    },
    {
      id: 'USR-105',
      name: 'Aegis Supermart',
      email: 'merchant@example.com',
      password: 'PasswordMerchant123!',
      pin: '9988',
      upiId: 'aegismerchant@guardianpay',
      role: USER_ROLE.USER,
      balancePaise: 15000000, // ₹1,50,000
    },
    {
      id: 'USR-106',
      name: 'Rogue Actor',
      email: 'attacker@example.com',
      password: 'PasswordAttacker123!',
      pin: '0000',
      upiId: 'darknet@guardianpay',
      role: USER_ROLE.USER,
      balancePaise: 1000000, // ₹10,000
    },
    {
      id: 'USR-107',
      name: 'Diya Sharma',
      email: 'diya.sharma@aegis.secure',
      password: 'Password@2026',
      pin: '123456',
      upiId: 'diya@aegis',
      role: USER_ROLE.USER,
      balancePaise: 5000000, // ₹50,000
    },
    {
      id: 'USR-108',
      name: 'Vikramaditya Roy',
      email: 'vikram.roy@aegis.secure',
      password: 'Password@2026',
      pin: '123456',
      upiId: 'vikram@aegis',
      role: USER_ROLE.USER,
      balancePaise: 7500000, // ₹75,000
    },
    {
      id: 'USR-109',
      name: 'Ananya Verma',
      email: 'ananya.verma@aegis.secure',
      password: 'Password@2026',
      pin: '123456',
      upiId: 'ananya@aegis',
      role: USER_ROLE.USER,
      balancePaise: 4000000, // ₹40,000
    },
    {
      id: 'USR-110',
      name: 'Secure Cloud Labs Ltd',
      email: 'cloudlabs@aegis.secure',
      password: 'Password@2026',
      pin: '123456',
      upiId: 'cloudlabs@aegis',
      role: USER_ROLE.USER,
      balancePaise: 50000000, // ₹5,00,000
    },
    {
      id: 'USR-111',
      name: 'Shadow Crypto Liquidity',
      email: 'shadow@dark.network',
      password: 'PasswordAttacker123!',
      pin: '000000',
      upiId: 'shadow-crypto@dark',
      role: USER_ROLE.USER,
      balancePaise: 1000000,
    },
    {
      id: 'USR-112',
      name: 'International Lottery Claim',
      email: 'claim@lottery-winner.scam',
      password: 'PasswordAttacker123!',
      pin: '000000',
      upiId: 'phish-lottery@scam',
      role: USER_ROLE.USER,
      balancePaise: 1000000,
    },
    {
      id: 'USR-ADMIN',
      name: 'SecOps Administrator',
      email: 'admin@guardianpay.internal',
      password: 'AdminPassword123!',
      pin: '4321',
      upiId: 'admin@guardianpay',
      role: USER_ROLE.ADMIN,
      balancePaise: 10000000, // ₹1,00,000
    },
  ];

  const seededUsers = [];

  for (const cfg of demoUsersConfig) {
    const userId = cfg.id || generateId('USR');
    const passwordHash = await hashSecret(cfg.password);
    const pinHash = await hashSecret(cfg.pin);

    const user = {
      id: userId,
      name: cfg.name,
      email: cfg.email,
      role: cfg.role,
      upiId: cfg.upiId,
      passwordHash,
      pinHash,
      pinFailedAt: [],
      pinLockedUntil: null,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await repository.createUser(user);

    const wallet = {
      userId,
      upiId: cfg.upiId,
      balancePaise: cfg.balancePaise,
      heldPaise: 0,
      dailySpentPaise: 0,
      dailyResetDate: todayKolkata,
      createdAt: user.createdAt,
    };

    await repository.createWallet(wallet);

    seededUsers.push({ ...user, wallet });
  }

  const alice = seededUsers.find((u) => u.email === 'alice@example.com');
  const bob = seededUsers.find((u) => u.email === 'bob@example.com');
  const merchant = seededUsers.find((u) => u.email === 'merchant@example.com');

  // 2. Seed 12 Historical Successful Payments for Alice (Average ~ ₹1,500 = 150,000 paise)
  // This provides realistic baseline for amount_anomaly (e.g. ₹10,000 triggers 5x anomaly)
  const historicalAmounts = [
    120000, 150000, 80000, 200000, 140000, 95000, 180000, 110000, 160000, 130000,
    175000, 150000,
  ];

  for (let i = 0; i < historicalAmounts.length; i++) {
    const daysAgo = 15 - i;
    const txnTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + i * 3600000).toISOString();
    const txnId = generateId('TXN');

    const pastTxn = {
      id: txnId,
      utr: generateUtr(),
      senderUserId: alice.id,
      senderName: alice.name,
      senderUpiId: alice.upiId,
      receiverUserId: i % 2 === 0 ? bob.id : merchant.id,
      receiverName: i % 2 === 0 ? bob.name : merchant.name,
      receiverUpiId: i % 2 === 0 ? bob.upiId : merchant.upiId,
      amountPaise: historicalAmounts[i],
      currency: 'INR',
      note: `Historical groceries split #${i + 1}`,
      status: TRANSACTION_STATUS.SUCCESS,
      risk: {
        score: 12,
        level: 'low',
        action: 'allow',
        signals: [
          { id: 'amount_anomaly', status: 'completed', points: 0, detail: 'Within baseline envelope' },
          { id: 'velocity', status: 'completed', points: 0, detail: 'Velocity normal' },
          { id: 'new_payee', status: 'completed', points: 0, detail: 'Established counterparty' },
          { id: 'odd_hours', status: 'completed', points: 0, detail: 'Normal business hours' },
          { id: 'failed_pin_attempts', status: 'completed', points: 0, detail: 'Clean authentication' },
          { id: 'balance_drain', status: 'completed', points: 0, detail: 'Preserves reserve' },
        ],
        coverage: { completed: 6, total: 6 },
      },
      ai: { status: 'skipped', source: 'none', verdict: null },
      createdAt: txnTime,
      updatedAt: txnTime,
    };

    await repository.createTransaction(pastTxn);

    // Append chained audit entry
    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.TXN_SUCCESS,
      actorId: alice.id,
      subjectId: txnId,
      data: { amountPaise: historicalAmounts[i], receiverUpiId: pastTxn.receiverUpiId },
    });
  }

  // 3. Seed One HELD transaction for Alice -> Bob for Admin Review Queue demo
  const heldTxnId = generateId('TXN');
  const heldTxn = {
    id: heldTxnId,
    utr: generateUtr(),
    senderUserId: alice.id,
    senderName: alice.name,
    senderUpiId: alice.upiId,
    receiverUserId: bob.id,
    receiverName: bob.name,
    receiverUpiId: bob.upiId,
    amountPaise: 1250000, // ₹12,500
    currency: 'INR',
    note: 'Demo Held Payment - High Anomaly Trigger',
    status: TRANSACTION_STATUS.HELD,
    risk: {
      score: 72,
      level: 'high',
      action: 'hold',
      signals: [
        { id: 'amount_anomaly', status: 'triggered', points: 30, detail: 'Amount is 8.5x greater than sender average' },
        { id: 'velocity', status: 'completed', points: 0, detail: 'Velocity normal' },
        { id: 'new_payee', status: 'completed', points: 0, detail: 'Counterparty known' },
        { id: 'odd_hours', status: 'triggered', points: 10, detail: 'Initiated during nocturnal window (02:15 IST)' },
        { id: 'failed_pin_attempts', status: 'completed', points: 0, detail: 'Clean PIN' },
        { id: 'balance_drain', status: 'completed', points: 0, detail: 'Reserve intact' },
      ],
      coverage: { completed: 6, total: 6 },
    },
    ai: {
      status: 'fallback',
      source: 'template',
      verdict: {
        summary: 'Automated risk scoring flagged this transfer with a score of 72/100 due to extreme velocity/amount anomalies.',
        keyReasons: ['Amount is 8.5x greater than sender average', 'Initiated during nocturnal window (02:15 IST)'],
        recommendedAction: 'hold',
        userMessage: 'Your payment was held under security quarantine for compliance verification.',
        adminNote: 'Deterministic heuristics scored 72 points. Review sender velocity before releasing capital.',
      },
    },
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  };

  await repository.createTransaction(heldTxn);
  // Reflect in Alice's held funds
  alice.wallet.heldPaise += 1250000;
  alice.wallet.balancePaise -= 1250000;
  await repository.updateWallet(alice.id, alice.wallet);

  await auditService.appendAudit({
    type: AUDIT_EVENT_TYPE.TXN_HELD,
    actorId: alice.id,
    subjectId: heldTxnId,
    data: { amountPaise: 1250000, reason: 'High fraud score quarantine' },
  });

  return {
    usersCount: seededUsers.length,
    historicalTxnCount: historicalAmounts.length + 1,
    alice,
    bob,
  };
}

// Allow standalone CLI execution: `node scripts/seed.js`
if (process.argv[1]?.endsWith('seed.js')) {
  seedDemoData().then((res) => {
    console.log(`✓ Seeded ${res.usersCount} users and ${res.historicalTxnCount} transactions successfully.`);
    process.exit(0);
  });
}
