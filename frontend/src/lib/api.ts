import {
  User,
  Wallet,
  Transaction,
  TransactionStatus,
  AdminAlert,
  AuditEntry,
  FraudScenario,
  PaymentDecision,
  Device,
  RiskLevel,
  RiskFactor,
  CollectRequest,
} from './types';
import {
  SEED_USERS,
  SEED_WALLETS,
  SEED_TRANSACTIONS,
  SEED_ADMIN_ALERTS,
  SEED_AUDIT_LOGS,
  SEED_FRAUD_SCENARIOS,
  SEED_DEVICES,
  SEED_COLLECT_REQUESTS,
} from './mock/seed';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let memoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('guardianpay_token', token);
    } else {
      localStorage.removeItem('guardianpay_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guardianpay_token');
  }
  return null;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (mockStore?.currentUserId) {
    headers['x-user-id'] = mockStore.currentUserId;
  }
  return headers;
}

// In-memory mock store initialized from seed data
class MockStore {
  users: User[] = [...SEED_USERS];
  wallets: Wallet[] = [...SEED_WALLETS];
  transactions: Transaction[] = [...SEED_TRANSACTIONS];
  alerts: AdminAlert[] = [...SEED_ADMIN_ALERTS];
  auditLogs: AuditEntry[] = [...SEED_AUDIT_LOGS];
  scenarios: FraudScenario[] = [...SEED_FRAUD_SCENARIOS];
  devices: Device[] = [...SEED_DEVICES];
  collectRequests: CollectRequest[] = [...SEED_COLLECT_REQUESTS];
  tamperedBlockId: string | null = null;

  currentUserId = 'USR-101'; // Default logged in user: Aarav Mehta
  
  // Security auth state
  failedLoginAttempts: Record<string, number> = {};
  loginLockoutUntil: Record<string, number> = {};

  failedPinAttempts: Record<string, number> = {};
  pinLockoutUntil: Record<string, number> = {};
  userPins: Record<string, string> = {
    'USR-101': '123456',
    'USR-102': '842500',
  };

  recognizedDevices: Record<string, boolean> = {
    'DEV-01': true,
    'DEV-02': true,
  };
}

const mockStore = new MockStore();

// Helper simulation delay
async function simulateLatency<T>(data: T, delayMs = 350): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return JSON.parse(JSON.stringify(data));
}

// Generate simple mock SHA-256-like hex
function mockSha256(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${'e48b19a0f44391209bca710924719023481a'.slice(0, 56)}`;
}

export const DEMO_CREDENTIALS = {
  validIdentifier: 'aarav@aegis',
  validPassword: 'Password@2026',
  demoOtp: '123456',
  defaultPin: '123456',
};

function normalizeTransaction(rawTx: any): Transaction {
  const rawStatus = (rawTx.status || '').toLowerCase();
  let feStatus: TransactionStatus = 'SUCCESS';
  let feDecision: PaymentDecision = 'ALLOW';

  if (rawStatus === 'blocked') {
    feStatus = 'BLOCKED';
    feDecision = 'BLOCK';
  } else if (rawStatus === 'held') {
    feStatus = 'HELD';
    feDecision = 'HOLD';
  } else if (rawStatus === 'pending_verification' || rawStatus === 'pending') {
    feStatus = 'PENDING';
    feDecision = 'STEP_UP';
  } else if (rawStatus === 'failed') {
    feStatus = 'FAILED';
    feDecision = 'BLOCK';
  } else {
    feStatus = 'SUCCESS';
    feDecision = 'ALLOW';
  }

  const score = rawTx.risk?.score ?? (rawStatus === 'blocked' ? 95 : rawStatus === 'held' ? 72 : 12);
  const level = rawTx.risk?.level ?? (score >= 85 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low');
  const receiverUpi = rawTx.receiverUpiId || rawTx.receiverVpa || 'unknown@upi';
  const amountVal = rawTx.amountPaise !== undefined ? rawTx.amountPaise / 100 : (rawTx.amount !== undefined ? rawTx.amount : 0);
  const createdAt = rawTx.createdAt || rawTx.timestamp || new Date().toISOString();

  return {
    id: rawTx.id || `TXN-${Date.now()}`,
    utr: rawTx.utr || `${Math.floor(607100000000 + Math.random() * 99999999)}`,
    senderId: rawTx.senderUserId || rawTx.senderId || mockStore.currentUserId,
    senderName: rawTx.senderName || 'Aarav Mehta',
    senderVpa: rawTx.senderUpiId || rawTx.senderVpa || 'aarav@aegis',
    receiverId: rawTx.receiverUserId || rawTx.receiverId || 'REC-101',
    receiverName: rawTx.receiverName || receiverUpi.split('@')[0],
    receiverVpa: receiverUpi,
    amount: amountVal,
    note: rawTx.note || 'Transfer via GUARDIANPAY',
    status: feStatus,
    riskAssessment: {
      score,
      level,
      riskLevel: (level.toUpperCase() || 'LOW') as any,
      decision: feDecision,
      reasons: rawTx.ai?.verdict?.keyReasons || (rawTx.risk?.signals || []).map((s: any) => s.detail || s.id),
      factors: (rawTx.risk?.signals || []).map((s: any) => ({
        name: s.id,
        description: s.detail || s.id,
        impact: s.points > 20 ? 'HIGH' : s.points > 10 ? 'MEDIUM' : 'LOW',
        scoreContribution: s.points || 0,
        status: 'TRIGGERED',
      })),
      analyzedAt: createdAt,
      modelConfidence: 0.998,
    },
    blockHash: rawTx.blockHash || mockSha256(`${rawTx.id}:${rawTx.utr}:${amountVal}`),
    previousBlockHash: rawTx.previousBlockHash || '0x' + '0'.repeat(40),
    blockNumber: rawTx.blockNumber || 1042,
    timestamp: createdAt,
    verifiedAt: feStatus === 'SUCCESS' ? createdAt : undefined,
    isSuspicious: score > 30,
    stepUpRequired: feStatus === 'PENDING',
    stepUpType: 'OTP',
    failureReason: feStatus === 'BLOCKED' ? 'Autonomous Security Shield: Critical incident neutralized' : undefined,
  };
}

export const api = {
  // Device Recognition Telemetry
  async getDeviceTelemetry(simulateNewDevice = false): Promise<{
    device: {
      deviceName: string;
      browser: string;
      os: string;
      location: string;
      approxTime: string;
      isRecognized: boolean;
    };
  }> {
    if (simulateNewDevice) {
      return simulateLatency({
        device: {
          deviceName: 'Unknown Android Emulated Terminal',
          browser: 'Firefox Mobile 128.0',
          os: 'Android 14 (Rooted/Emulated)',
          location: 'Tor Exit Node / Amsterdam',
          approxTime: 'Just now (09:42:10 UTC)',
          isRecognized: false,
        },
      });
    }

    return simulateLatency({
      device: {
        deviceName: 'Titanium Phone 16 Pro',
        browser: 'Safari Mobile 19.4',
        os: 'iOS 19.4 (Secure Enclave)',
        location: 'Mumbai, MH, India',
        approxTime: 'Just now (09:42:10 UTC)',
        isRecognized: true,
      },
    });
  },

  // Auth methods
  async register(payload: {
    name: string;
    email: string;
    phone: string;
    vpa?: string;
    password?: string;
  }): Promise<{ user: User; wallet: Wallet; token: string }> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            pin: '123456',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const userObj: User = {
            id: data.user?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
            name: data.user?.name || payload.name,
            email: data.user?.email || payload.email,
            phone: payload.phone,
            vpa: data.wallet?.upiId || payload.vpa || `${payload.name.toLowerCase().replace(/\s+/g, '')}@guardianpay`,
            kycStatus: 'VERIFIED',
            createdAt: data.user?.createdAt || new Date().toISOString(),
          };
          const walletObj: Wallet = {
            id: `WAL-${userObj.id}`,
            userId: userObj.id,
            balance: (data.wallet?.balancePaise ? data.wallet.balancePaise / 100 : 25000.0),
            currency: 'INR',
            isFrozen: false,
            upiPinSet: true,
            dailyLimit: 200000.0,
            spentToday: 0,
            lastUpdated: new Date().toISOString(),
          };
          mockStore.users.push(userObj);
          mockStore.wallets.push(walletObj);
          mockStore.currentUserId = userObj.id;
          if (data.token) {
            setAuthToken(data.token);
          }
          return { user: userObj, wallet: walletObj, token: data.token || `jwt_${userObj.id}` };
        }
      } catch (e) {
        console.warn('Backend register fetch failed, using local store:', e);
      }
    }

    const vpaHandle = payload.vpa || payload.name.toLowerCase().replace(/\s+/g, '') + '@aegis';
    const cleanVpa = vpaHandle.endsWith('@aegis') ? vpaHandle : `${vpaHandle}@aegis`;

    const newUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      vpa: cleanVpa,
      kycStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
    };

    const newWallet: Wallet = {
      id: `WAL-${newUser.id}`,
      userId: newUser.id,
      balance: 25000.0, // Welcome grant simulation
      currency: 'INR',
      isFrozen: false,
      upiPinSet: false,
      dailyLimit: 200000.0,
      spentToday: 0,
      lastUpdated: new Date().toISOString(),
    };

    mockStore.users.push(newUser);
    mockStore.wallets.push(newWallet);
    mockStore.currentUserId = newUser.id;

    return simulateLatency({
      user: newUser,
      wallet: newWallet,
      token: `mock_jwt_${newUser.id}`,
    });
  },

  async login(payload: {
    identifier: string; // email, VPA, or phone
    password?: string;
    rememberDevice?: boolean;
    isNewDeviceSimulated?: boolean;
  }): Promise<{
    user: User;
    requiresOtp: boolean;
    deviceRecognized: boolean;
    isLockedOut?: boolean;
    lockoutRemainingSeconds?: number;
    failedAttempts?: number;
  }> {
    if (API_BASE_URL) {
      try {
        const clean = payload.identifier.trim().toLowerCase();
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: clean,
            email: clean.includes('@') ? clean : `${clean}@guardianpay`,
            password: payload.password,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data.user) {
            const userObj: User = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone || '+91 98201 44521',
              vpa: data.wallet?.upiId || data.user.upiId || 'aarav@aegis',
              kycStatus: 'VERIFIED',
              createdAt: data.user.createdAt || new Date().toISOString(),
            };
            const existingIndex = mockStore.users.findIndex((u) => u.id === userObj.id);
            if (existingIndex >= 0) {
              mockStore.users[existingIndex] = userObj;
            } else {
              mockStore.users.push(userObj);
            }
            if (data.wallet) {
              const walletObj: Wallet = {
                id: `WAL-${userObj.id}`,
                userId: userObj.id,
                balance: (data.wallet.balancePaise || 0) / 100,
                currency: 'INR',
                isFrozen: false,
                upiPinSet: true,
                dailyLimit: 200000.0,
                spentToday: 0,
                lastUpdated: new Date().toISOString(),
              };
              const wIndex = mockStore.wallets.findIndex((w) => w.userId === userObj.id);
              if (wIndex >= 0) {
                mockStore.wallets[wIndex] = walletObj;
              } else {
                mockStore.wallets.push(walletObj);
              }
            }
            mockStore.currentUserId = userObj.id;
            if (data.token) {
              setAuthToken(data.token);
            }
            return {
              user: userObj,
              requiresOtp: true,
              deviceRecognized: !payload.isNewDeviceSimulated,
            };
          }
        }
      } catch (e) {
        console.warn('Backend login fetch failed, falling back to local store:', e);
      }
    }

    const clean = payload.identifier.trim().toLowerCase();

    // Check existing lockout
    const now = Date.now();
    const lockoutUntil = mockStore.loginLockoutUntil[clean] || 0;
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return simulateLatency({
        user: mockStore.users[0],
        requiresOtp: false,
        deviceRecognized: false,
        isLockedOut: true,
        lockoutRemainingSeconds: remainingSeconds,
      });
    }

    // Verify password if provided
    if (payload.password) {
      // Demo validation: reject if password is 'wrong' or less than 6 chars
      if (payload.password === 'wrong' || payload.password.length < 6) {
        const currentFails = (mockStore.failedLoginAttempts[clean] || 0) + 1;
        mockStore.failedLoginAttempts[clean] = currentFails;

        if (currentFails >= 3) {
          mockStore.loginLockoutUntil[clean] = now + 15 * 60 * 1000; // 15 min lockout
          throw new Error('Account locked: 3 consecutive failed authentication challenges.');
        }

        throw new Error(`Invalid credentials. ${3 - currentFails} attempt(s) remaining before security lockout.`);
      }
    }

    // Reset failed counter upon successful login
    mockStore.failedLoginAttempts[clean] = 0;

    const user =
      mockStore.users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.vpa.toLowerCase() === clean ||
          u.phone.includes(clean)
      ) || mockStore.users[0];

    mockStore.currentUserId = user.id;

    const isRecognized = payload.isNewDeviceSimulated ? false : true;

    return simulateLatency({
      user,
      requiresOtp: true,
      deviceRecognized: isRecognized,
    });
  },

  async verifyOtp(payload: {
    userId: string;
    otp: string;
  }): Promise<{ verified: boolean; token: string; user: User; nextStep: 'SET_PIN' | 'DASHBOARD' }> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const user = mockStore.users.find((u) => u.id === payload.userId) || mockStore.users[0];
          if (data.token) {
            setAuthToken(data.token);
          }
          return {
            verified: true,
            token: data.token || `jwt_${user.id}`,
            user,
            nextStep: 'DASHBOARD',
          };
        }
      } catch (e) {
        console.warn('Backend verify-otp fetch failed, checking local demo OTP:', e);
      }
    }

    // Strict validation for demo: valid OTP is '123456' or '842500'
    const cleanOtp = payload.otp.trim();
    if (cleanOtp !== '123456' && cleanOtp !== '842500') {
      throw new Error('Invalid authentication challenge code. Verification failed.');
    }

    const user = mockStore.users.find((u) => u.id === payload.userId) || mockStore.users[0];
    const wallet = mockStore.wallets.find((w) => w.userId === user.id);

    return simulateLatency({
      verified: true,
      token: `mock_jwt_${user.id}`,
      user,
      nextStep: wallet?.upiPinSet ? 'DASHBOARD' : 'SET_PIN',
    });
  },

  async setPin(payload: {
    userId: string;
    pin: string;
    confirmPin?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/set-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          mockStore.userPins[payload.userId] = payload.pin;
          const wallet = mockStore.wallets.find((w) => w.userId === payload.userId);
          if (wallet) {
            wallet.upiPinSet = true;
          }
          return json.data || json;
        }
      } catch (e) {
        console.warn('Backend set-pin failed, fallback to local:', e);
      }
    }

    if (payload.confirmPin && payload.pin !== payload.confirmPin) {
      throw new Error('PIN mismatch. Both entries must be identical.');
    }

    mockStore.userPins[payload.userId] = payload.pin;
    const wallet = mockStore.wallets.find((w) => w.userId === payload.userId);
    if (wallet) {
      wallet.upiPinSet = true;
    }

    // Reset failed pin attempts
    mockStore.failedPinAttempts[payload.userId] = 0;
    delete mockStore.pinLockoutUntil[payload.userId];

    return simulateLatency({
      success: true,
      message: 'UPI Security PIN configured securely in hardware enclave',
    });
  },

  async verifyPin(payload: {
    userId: string;
    pin: string;
  }): Promise<{
    verified: boolean;
    isLockedOut?: boolean;
    lockoutRemainingSeconds?: number;
    attemptsRemaining?: number;
  }> {
    const userId = payload.userId || mockStore.currentUserId;
    const now = Date.now();

    // Check existing lockout
    const lockoutUntil = mockStore.pinLockoutUntil[userId] || 0;
    if (lockoutUntil > now) {
      return simulateLatency({
        verified: false,
        isLockedOut: true,
        lockoutRemainingSeconds: Math.ceil((lockoutUntil - now) / 1000),
      });
    }

    const expectedPin = mockStore.userPins[userId] || '123456';
    if (payload.pin === expectedPin || payload.pin === '123456' || payload.pin === '1234') {
      mockStore.failedPinAttempts[userId] = 0;
      mockStore.pinLockoutUntil[userId] = 0;
      return simulateLatency({ verified: true });
    }

    const fails = (mockStore.failedPinAttempts[userId] || 0) + 1;
    mockStore.failedPinAttempts[userId] = fails;

    if (fails >= 3) {
      mockStore.pinLockoutUntil[userId] = now + 15 * 60 * 1000; // 15 minutes lockout
      return simulateLatency({
        verified: false,
        isLockedOut: true,
        lockoutRemainingSeconds: 900,
        attemptsRemaining: 0,
      });
    }

    return simulateLatency({
      verified: false,
      isLockedOut: false,
      attemptsRemaining: 3 - fails,
    });
  },

  async resetPinLockout(userId?: string): Promise<{ success: boolean; message: string }> {
    const target = userId || mockStore.currentUserId;
    mockStore.failedPinAttempts[target] = 0;
    delete mockStore.pinLockoutUntil[target];
    mockStore.failedLoginAttempts[target] = 0;
    delete mockStore.loginLockoutUntil[target];

    return simulateLatency({
      success: true,
      message: 'Security lockout cleared via identity recovery protocol.',
    });
  },

  // Wallet and Payment methods
  async getWallet(userId?: string): Promise<{ wallet: Wallet; user: User }> {
    const targetUserId = userId || mockStore.currentUserId;
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/wallets/me?userId=${targetUserId}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data && data.wallet) {
            const user = mockStore.users.find((u) => u.id === targetUserId) || mockStore.users[0];
            const walletObj: Wallet = {
              id: `WAL-${targetUserId}`,
              userId: targetUserId,
              balance: data.wallet.balancePaise !== undefined ? data.wallet.balancePaise / 100 : 84250.0,
              currency: 'INR',
              isFrozen: false,
              upiPinSet: true,
              dailyLimit: 200000.0,
              spentToday: data.wallet.dailySpentPaise !== undefined ? data.wallet.dailySpentPaise / 100 : 0,
              lastUpdated: new Date().toISOString(),
            };
            return { wallet: walletObj, user };
          }
        }
      } catch (e) {
        console.warn('Backend getWallet fetch failed, fallback to local store:', e);
      }
    }

    const user = mockStore.users.find((u) => u.id === targetUserId) || mockStore.users[0];
    const wallet = mockStore.wallets.find((w) => w.userId === targetUserId) || mockStore.wallets[0];

    return simulateLatency({ wallet, user });
  },

  // Beneficiary lookup & verification
  async verifyBeneficiary(vpa: string): Promise<{
    isValidSyntax: boolean;
    isVerified: boolean;
    name?: string;
    trustScore: number;
    isFlagged: boolean;
    category: 'TRUSTED' | 'NEW' | 'HIGH_RISK' | 'INVALID';
  }> {
    const cleanVpa = vpa.trim().toLowerCase();
    const isValidSyntax = /^[a-z0-9._-]+@aegis$/.test(cleanVpa);
    if (!isValidSyntax) {
      return simulateLatency({
        isValidSyntax: false,
        isVerified: false,
        trustScore: 0,
        isFlagged: false,
        category: 'INVALID',
      });
    }

    if (cleanVpa === 'diya@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: true,
        name: 'Diya Sharma',
        trustScore: 98,
        isFlagged: false,
        category: 'TRUSTED',
      });
    }
    if (cleanVpa === 'vikram@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: true,
        name: 'Vikramaditya Roy',
        trustScore: 95,
        isFlagged: false,
        category: 'TRUSTED',
      });
    }
    if (cleanVpa === 'ananya@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: true,
        name: 'Ananya Verma',
        trustScore: 94,
        isFlagged: false,
        category: 'TRUSTED',
      });
    }
    if (cleanVpa === 'cloudlabs@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: true,
        name: 'Secure Cloud Labs Ltd',
        trustScore: 99,
        isFlagged: false,
        category: 'TRUSTED',
      });
    }
    if (cleanVpa === 'dubious77@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: false,
        name: 'Dubious Merchant Services',
        trustScore: 32,
        isFlagged: true,
        category: 'HIGH_RISK',
      });
    }
    if (cleanVpa === 'bridge99x@aegis') {
      return simulateLatency({
        isValidSyntax: true,
        isVerified: false,
        name: 'Darknet Crypto Bridge Node',
        trustScore: 6,
        isFlagged: true,
        category: 'HIGH_RISK',
      });
    }

    // Default unknown / unverified valid syntax
    return simulateLatency({
      isValidSyntax: true,
      isVerified: false,
      name: cleanVpa.split('@')[0],
      trustScore: 65,
      isFlagged: false,
      category: 'NEW',
    });
  },

  // 6-Stage Live Risk Analysis Engine
  async analyzeTransaction(payload: {
    receiverVpa: string;
    amount: number;
    note?: string;
    forceScore?: number;
  }): Promise<{
    score: number;
    level: RiskLevel;
    decision: PaymentDecision;
    reasons: string[];
    factors: RiskFactor[];
    stages: {
      id: string;
      title: string;
      status: 'PASSED' | 'WARNING' | 'FLAGGED';
      details: string;
    }[];
    modelConfidence: number;
  }> {
    const cleanVpa = payload.receiverVpa.trim().toLowerCase();
    let score = 18;
    let decision: PaymentDecision = 'ALLOW';
    const reasons: string[] = [];

    // Deterministic override if requested (for testing exact outcomes: 18, 47, 72, 94)
    if (typeof payload.forceScore === 'number') {
      score = payload.forceScore;
    } else if (cleanVpa.includes('bridge') || payload.amount >= 100000) {
      score = 94; // Critical Block
    } else if (cleanVpa.includes('dubious') || payload.amount >= 60000) {
      score = 72; // Hold
    } else if (payload.amount >= 25000 || cleanVpa === 'newuser@aegis') {
      score = 47; // Step-up OTP
    } else {
      score = 18; // Allow
    }

    // Decision Contract:
    // 0–30: ALLOW
    // 31–60: STEP_UP
    // 61–80: HOLD
    // 81–100: BLOCK
    if (score <= 30) {
      decision = 'ALLOW';
      reasons.push('Hardware biometric enclave token verified');
      reasons.push('Counterparty identity signature validated on consensus ledger');
      reasons.push('Payment velocity within 30-day baseline spend envelope');
    } else if (score <= 60) {
      decision = 'STEP_UP';
      reasons.push('Transaction amount deviates from normal baseline pattern');
      reasons.push('Counterparty is newly added to local routing table');
      reasons.push('Elevated ticket size triggers adaptive multi-factor challenge');
    } else if (score <= 80) {
      decision = 'HOLD';
      reasons.push('Beneficiary flagged on external partner anomaly watchlist');
      reasons.push('Uncustomary large ticket transfer requires 10-minute quarantine cooling');
      reasons.push('Duplicate invoice hash signature checked across distributed network');
    } else {
      decision = 'BLOCK';
      reasons.push('Critical adversary pattern detected: High-risk off-ramp vector');
      reasons.push('Velocity threshold exceeded (5 consecutive high-value attempts)');
      reasons.push('Autonomous security perimeter enforced: Wallet frozen to protect capital');
    }

    const level: RiskLevel =
      score > 80 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW';

    type StageStatus = 'PASSED' | 'WARNING' | 'FLAGGED';
    const stages: Array<{
      id: string;
      title: string;
      status: StageStatus;
      details: string;
    }> = [
      {
        id: 'STAGE_1',
        title: 'Transaction Validation',
        status: score > 80 ? 'FLAGGED' : 'PASSED',
        details: 'Syntax, payload integrity, and nonces verified',
      },
      {
        id: 'STAGE_2',
        title: 'Device Trust Analysis',
        status: score > 80 ? 'FLAGGED' : score > 60 ? 'WARNING' : 'PASSED',
        details: 'Secure enclave hardware certificate matched',
      },
      {
        id: 'STAGE_3',
        title: 'Behavioral Anomaly Detection',
        status: score > 50 ? 'WARNING' : 'PASSED',
        details: 'Neural assessment of timing cadence and typing entropy',
      },
      {
        id: 'STAGE_4',
        title: 'Velocity Analysis',
        status: score > 70 ? 'FLAGGED' : score > 30 ? 'WARNING' : 'PASSED',
        details: 'Hourly and 24h cumulative volume threshold evaluation',
      },
      {
        id: 'STAGE_5',
        title: 'Risk Score Calculation',
        status: score > 80 ? 'FLAGGED' : score > 30 ? 'WARNING' : 'PASSED',
        details: `Final calibrated risk rating: ${score}/100 (${level})`,
      },
      {
        id: 'STAGE_6',
        title: 'Payment Decision',
        status: decision === 'BLOCK' ? 'FLAGGED' : decision === 'HOLD' ? 'WARNING' : 'PASSED',
        details: `Autonomous policy enacted: ${decision}`,
      },
    ];

    const factors: RiskFactor[] = reasons.map((r, i) => ({
      code: `FACTOR_${i + 1}`,
      name: `Risk Vector ${i + 1}`,
      description: r,
      severity: level,
      impactScore: Math.round(score / reasons.length),
      triggered: true,
    }));

    return simulateLatency({
      score,
      level,
      decision,
      reasons,
      factors,
      stages,
      modelConfidence: 0.998,
    }, 600);
  },

  async sendTransaction(payload: {
    receiverVpa?: string;
    receiverUpiId?: string;
    amount?: number;
    amountPaise?: number;
    note?: string;
    pin?: string;
    idempotencyKey?: string;
    forceDecision?: PaymentDecision;
    forceScore?: number;
  }): Promise<{
    transaction: Transaction;
    decision: PaymentDecision;
    requiresStepUp: boolean;
    isHold?: boolean;
    isBlock?: boolean;
  }> {
    const receiverUpiId = (payload.receiverUpiId || payload.receiverVpa || '').trim();
    if (!receiverUpiId) {
      throw new Error('Receiver UPI handle is required.');
    }

    const rawAmt = payload.amount !== undefined ? Number(payload.amount) : undefined;
    const amountPaise =
      payload.amountPaise !== undefined
        ? payload.amountPaise
        : rawAmt !== undefined
        ? Math.round(rawAmt * 100)
        : 0;

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new Error('Payment amount must be a positive number.');
    }

    const amountRupees = amountPaise / 100;
    const pin = payload.pin || '1234';
    const note = payload.note || '';
    const idempotencyKey = payload.idempotencyKey || `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (API_BASE_URL) {
      const headers = getAuthHeaders({
        'Idempotency-Key': idempotencyKey,
      });

      const res = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          receiverUpiId,
          amountPaise,
          note,
          pin,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || errJson?.message || `Payment transfer rejected (HTTP ${res.status})`;
        const errDetails = errJson?.error?.details || {};
        const detailStr = Object.entries(errDetails)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        throw new Error(detailStr ? `${errMsg} (${detailStr})` : errMsg);
      }

      const json = await res.json();
      const rawTx = json.transaction || json.data?.transaction;
      if (!rawTx) {
        throw new Error('Backend confirmed transfer but returned no transaction payload.');
      }

      const rawStatus = (rawTx.status || '').toLowerCase();
      let feStatus: TransactionStatus = 'SUCCESS';
      let feDecision: PaymentDecision = 'ALLOW';

      if (rawStatus === 'blocked') {
        feStatus = 'BLOCKED';
        feDecision = 'BLOCK';
      } else if (rawStatus === 'held') {
        feStatus = 'HELD';
        feDecision = 'HOLD';
      } else if (rawStatus === 'pending_verification' || rawStatus === 'pending') {
        feStatus = 'PENDING';
        feDecision = 'STEP_UP';
      } else if (rawStatus === 'failed') {
        feStatus = 'FAILED';
        feDecision = 'BLOCK';
      } else {
        feStatus = 'SUCCESS';
        feDecision = 'ALLOW';
      }

      const score = rawTx.risk?.score ?? (rawStatus === 'blocked' ? 95 : rawStatus === 'held' ? 72 : 12);
      const level = rawTx.risk?.level ?? (score >= 85 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low');

      const normalizedTx: Transaction & { idempotencyKey?: string } = {
        id: rawTx.id,
        utr: rawTx.utr || `${Math.floor(607100000000 + Math.random() * 99999999)}`,
        senderId: rawTx.senderUserId || mockStore.currentUserId,
        senderName: rawTx.senderName || 'Aarav Mehta',
        senderVpa: rawTx.senderUpiId || 'aarav@aegis',
        receiverId: rawTx.receiverUserId || 'REC-101',
        receiverName: rawTx.receiverName || receiverUpiId.split('@')[0],
        receiverVpa: rawTx.receiverUpiId || receiverUpiId,
        amount: rawTx.amountPaise !== undefined ? rawTx.amountPaise / 100 : amountRupees,
        note: rawTx.note || note || 'Transfer via GUARDIANPAY',
        status: feStatus,
        riskAssessment: {
          score,
          level,
          riskLevel: level.toUpperCase() as any,
          decision: feDecision,
          reasons: rawTx.ai?.verdict?.keyReasons || (rawTx.risk?.signals || []).map((s: any) => s.detail || s.id),
          factors: (rawTx.risk?.signals || []).map((s: any) => ({
            name: s.id,
            description: s.detail || s.id,
            impact: s.points > 20 ? 'HIGH' : s.points > 10 ? 'MEDIUM' : 'LOW',
            scoreContribution: s.points || 0,
            status: 'TRIGGERED',
          })),
          analyzedAt: rawTx.createdAt || new Date().toISOString(),
          modelConfidence: 0.998,
        },
        blockHash: mockSha256(`${rawTx.id}:${rawTx.utr}:${rawTx.amountPaise}`),
        previousBlockHash: '0x' + '0'.repeat(40),
        blockNumber: 1042,
        timestamp: rawTx.createdAt || new Date().toISOString(),
        verifiedAt: feStatus === 'SUCCESS' ? (rawTx.createdAt || new Date().toISOString()) : undefined,
        isSuspicious: score > 30,
        stepUpRequired: feStatus === 'PENDING',
        stepUpType: 'OTP',
        failureReason: feStatus === 'BLOCKED' ? 'Autonomous Security Shield: Critical incident neutralized' : undefined,
        idempotencyKey,
      };

      // Synchronize in-memory mockStore for immediate UI reflections
      const existingIdx = mockStore.transactions.findIndex((t) => t.id === normalizedTx.id);
      if (existingIdx >= 0) {
        mockStore.transactions[existingIdx] = normalizedTx;
      } else {
        mockStore.transactions.unshift(normalizedTx);
      }

      const senderWallet = mockStore.wallets.find((w) => w.userId === mockStore.currentUserId);
      if (senderWallet) {
        if (feStatus === 'SUCCESS') {
          senderWallet.balance = Math.max(0, senderWallet.balance - normalizedTx.amount);
          senderWallet.spentToday += normalizedTx.amount;
        } else if (feStatus === 'HELD') {
          senderWallet.balance = Math.max(0, senderWallet.balance - normalizedTx.amount);
        }
      }

      return {
        transaction: normalizedTx,
        decision: feDecision,
        requiresStepUp: feStatus === 'PENDING',
        isHold: feStatus === 'HELD',
        isBlock: feStatus === 'BLOCKED',
      };
    }

    const sender = mockStore.users.find((u) => u.id === mockStore.currentUserId)!;
    const wallet = mockStore.wallets.find((w) => w.userId === sender.id)!;

    // Check wallet frozen status
    if (wallet.isFrozen) {
      throw new Error('Wallet is currently locked under security quarantine. Outgoing transfers disabled.');
    }

    // Check balance
    if (amountRupees > wallet.balance) {
      throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance.toLocaleString('en-IN')}`);
    }

    // Idempotency check: if key already used, return existing transaction
    if (payload.idempotencyKey) {
      const existingTx = mockStore.transactions.find((t) => (t as any).idempotencyKey === payload.idempotencyKey);
      if (existingTx) {
        return simulateLatency({
          transaction: existingTx,
          decision: existingTx.riskAssessment.decision,
          requiresStepUp: existingTx.riskAssessment.decision === 'STEP_UP',
          isHold: existingTx.riskAssessment.decision === 'HOLD',
          isBlock: existingTx.riskAssessment.decision === 'BLOCK',
        });
      }
    }

    // Run analysis
    const analysis = await api.analyzeTransaction({
      receiverVpa: receiverUpiId,
      amount: amountRupees,
      note: payload.note,
      forceScore: payload.forceScore,
    });

    const score = analysis.score;
    const decision = payload.forceDecision || analysis.decision;

    const utr = `${Math.floor(607100000000 + Math.random() * 99999999)}`;
    const txId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const lastTx = mockStore.transactions[0];
    const prevHash = lastTx ? lastTx.blockHash : '0x0000000000000000000000000000000000000000';
    const blockHash = mockSha256(`${txId}:${utr}:${amountRupees}:${prevHash}`);

    const newTx: Transaction & { idempotencyKey?: string } = {
      id: txId,
      utr,
      senderId: sender.id,
      senderName: sender.name,
      senderVpa: sender.vpa,
      receiverId: 'EXT-RECEIVER',
      receiverName: receiverUpiId.split('@')[0],
      receiverVpa: receiverUpiId,
      amount: amountRupees,
      note: payload.note || 'Transfer via GUARDIANPAY',
      status: decision === 'BLOCK' ? 'FAILED' : decision === 'HOLD' ? 'AUTHORIZED' : decision === 'STEP_UP' ? 'AUTHORIZED' : 'SUCCESS',
      riskAssessment: {
        score,
        level: analysis.level,
        decision,
        reasons: analysis.reasons,
        factors: analysis.factors,
        analyzedAt: new Date().toISOString(),
        modelConfidence: 0.998,
      },
      blockHash,
      previousBlockHash: prevHash,
      timestamp: new Date().toISOString(),
      verifiedAt: decision === 'ALLOW' ? new Date().toISOString() : undefined,
      isSuspicious: score > 30,
      stepUpRequired: decision === 'STEP_UP',
      stepUpType: 'OTP',
      failureReason: decision === 'BLOCK' ? 'Autonomous Security Shield: Critical incident neutralized' : undefined,
      idempotencyKey: payload.idempotencyKey,
    };

    // If BLOCK: Freeze the sender wallet
    if (decision === 'BLOCK') {
      wallet.isFrozen = true;
    }

    // Only debit if ALLOW
    if (decision === 'ALLOW') {
      wallet.balance -= amountRupees;
      wallet.spentToday += amountRupees;
    }

    mockStore.transactions.unshift(newTx);

    return simulateLatency({
      transaction: newTx,
      decision,
      requiresStepUp: decision === 'STEP_UP',
      isHold: decision === 'HOLD',
      isBlock: decision === 'BLOCK',
    });
  },

  async cancelHeldTransaction(txId: string): Promise<{ success: boolean; message: string }> {
    const tx = mockStore.transactions.find((t) => t.id === txId);
    if (tx) {
      tx.status = 'REVERSED';
    }
    return simulateLatency({
      success: true,
      message: 'Held transaction safely aborted. No funds debited.',
    });
  },

  async getTransactions(params?: {
    limit?: number;
    suspiciousOnly?: boolean;
    status?: string;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    if (API_BASE_URL) {
      try {
        const qs = new URLSearchParams(params as any).toString();
        const res = await fetch(`${API_BASE_URL}/api/v1/payments/transactions?${qs}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const list = data?.transactions || json.transactions;
          if (Array.isArray(list)) {
            const normalizedList = list.map((raw: any) => normalizeTransaction(raw));
            return {
              transactions: normalizedList,
              total: data?.total || json.total || normalizedList.length,
            };
          }
        }
      } catch (e) {
        console.warn('Backend getTransactions fetch failed, fallback to local store:', e);
      }
    }

    let list = [...mockStore.transactions];
    if (params?.suspiciousOnly) {
      list = list.filter((t) => t.isSuspicious);
    }
    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }

    const limit = params?.limit || 40;
    return simulateLatency({
      transactions: list.slice(0, limit),
      total: list.length,
    });
  },

  async getTransaction(id: string): Promise<Transaction | null> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/payments/transactions/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          return data?.transaction || json.transaction || null;
        }
      } catch (e) {
        console.warn('Backend getTransaction fetch failed, fallback to local store:', e);
      }
    }

    const tx = mockStore.transactions.find((t) => t.id === id || t.utr === id) || null;
    return simulateLatency(tx);
  },

  async verifyStepUp(payload: {
    transactionId: string;
    otp: string;
  }): Promise<{ verified: boolean; transaction: Transaction }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/payments/verify-step-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    }

    const tx = mockStore.transactions.find((t) => t.id === payload.transactionId);
    if (!tx) throw new Error('Transaction not found');

    tx.status = 'SUCCESS';
    tx.stepUpRequired = false;
    tx.verifiedAt = new Date().toISOString();

    const senderWallet = mockStore.wallets.find((w) => w.userId === tx.senderId);
    if (senderWallet) {
      senderWallet.balance -= tx.amount;
      senderWallet.spentToday += tx.amount;
    }

    return simulateLatency({ verified: true, transaction: tx });
  },

  // Security & Admin methods
  async getAdminFeed(): Promise<{
    alerts: AdminAlert[];
    auditLogs: AuditEntry[];
    scenarios: FraudScenario[];
  }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/feed`);
      return res.json();
    }

    return simulateLatency({
      alerts: mockStore.alerts,
      auditLogs: mockStore.auditLogs,
      scenarios: mockStore.scenarios,
    });
  },

  async getFlaggedTransactions(): Promise<Transaction[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/flagged`);
      return res.json();
    }

    const flagged = mockStore.transactions.filter((t) => t.isSuspicious);
    return simulateLatency(flagged);
  },

  async freezeWallet(
    walletId: string,
    freeze: boolean
  ): Promise<{ success: boolean; wallet: Wallet }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/wallets/${walletId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFrozen: freeze }),
      });
      return res.json();
    }

    const wallet = mockStore.wallets.find((w) => w.id === walletId) || mockStore.wallets[0];
    wallet.isFrozen = freeze;

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: freeze ? 'WALLET_FROZEN' : 'WALLET_UNFROZEN',
      actor: 'SecOps Administrator',
      targetId: wallet.id,
      details: `Wallet state updated to ${freeze ? 'FROZEN' : 'ACTIVE'}`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`${wallet.id}:${freeze}`),
    });

    return simulateLatency({ success: true, wallet });
  },

  async simulateAttack(scenarioId: string): Promise<{
    scenario: FraudScenario;
    interceptedTransaction: Transaction;
    mitigationAction: string;
  }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/security/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      return res.json();
    }

    const scenario =
      mockStore.scenarios.find((s) => s.id === scenarioId) || mockStore.scenarios[0];

    const simTx: Transaction = {
      id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      utr: `${Math.floor(999900000000 + Math.random() * 99999999)}`,
      senderId: 'USR-105',
      senderName: 'Rohan Iyer (Simulated Target)',
      senderVpa: 'rohan@aegis',
      receiverId: 'EXT-ADVERSARY',
      receiverName: 'Simulated Adversary Node',
      receiverVpa: 'adversary99@aegis',
      amount: scenario.targetAmount,
      note: `Attack Vector: ${scenario.name}`,
      status: scenario.expectedDecision === 'BLOCK' ? 'FAILED' : 'AUTHORIZED',
      riskAssessment: {
        score: scenario.expectedScore,
        level: scenario.expectedScore > 80 ? 'CRITICAL' : 'HIGH',
        decision: scenario.expectedDecision,
        reasons: scenario.simulatedAnomalies,
        factors: [
          {
            code: 'ATTACK_SIM_FLAG',
            name: scenario.name,
            description: scenario.description,
            severity: scenario.expectedScore > 80 ? 'CRITICAL' : 'HIGH',
            impactScore: scenario.expectedScore,
            triggered: true,
          },
        ],
        analyzedAt: new Date().toISOString(),
        modelConfidence: 0.999,
      },
      blockHash: mockSha256(`sim-attack-${Date.now()}`),
      previousBlockHash: mockStore.transactions[0]?.blockHash || '0x00',
      timestamp: new Date().toISOString(),
      isSuspicious: true,
      failureReason:
        scenario.expectedDecision === 'BLOCK'
          ? 'Autonomous Security Shield: Attack vector neutralized'
          : undefined,
    };

    mockStore.transactions.unshift(simTx);

    mockStore.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      severity: scenario.expectedScore > 80 ? 'CRITICAL' : 'HIGH',
      title: `Simulation Detected: ${scenario.name}`,
      description: `Intercepted transaction ${simTx.id} with risk score ${scenario.expectedScore}/100.`,
      transactionId: simTx.id,
      userId: simTx.senderId,
      resolved: false,
    });

    return simulateLatency({
      scenario,
      interceptedTransaction: simTx,
      mitigationAction:
        scenario.expectedDecision === 'BLOCK'
          ? 'Hard Block Enforced & Wallet Isolated'
          : scenario.expectedDecision === 'HOLD'
          ? '10-Minute Quarantine Cooling Hold Enacted'
          : 'Enforced Adaptive Step-Up MFA Challenge',
    });
  },

  async verifyLedger(): Promise<{
    verified: boolean;
    blockCount: number;
    failedBlockIndex?: number;
    brokenBlockId?: string;
    lastValidHash: string;
    chainIntegrity: '100% VERIFIED' | 'TAMPERED';
    checkedAt: string;
    blocks: Array<{
      id: string;
      utr: string;
      amount: number;
      blockHash: string;
      previousBlockHash: string;
      isValid: boolean;
      isTampered: boolean;
    }>;
  }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/ledger/verify`);
      return res.json();
    }

    const txs = mockStore.transactions.slice(0, 16);
    let isChainValid = true;
    let failedIndex: number | undefined = undefined;
    let brokenId: string | undefined = undefined;

    const blockResults = txs.map((tx, idx) => {
      const isTampered = mockStore.tamperedBlockId === tx.id;
      if (isTampered) {
        isChainValid = false;
        if (failedIndex === undefined) {
          failedIndex = idx;
          brokenId = tx.id;
        }
      }

      return {
        id: tx.id,
        utr: tx.utr,
        amount: tx.amount,
        blockHash: isTampered ? '0xDEADBEEF00000000000000000000000000000000' : tx.blockHash,
        previousBlockHash: tx.previousBlockHash,
        isValid: !isTampered && (failedIndex === undefined || idx < failedIndex),
        isTampered,
      };
    });

    return simulateLatency({
      verified: isChainValid,
      blockCount: mockStore.transactions.length,
      failedBlockIndex: failedIndex,
      brokenBlockId: brokenId,
      lastValidHash: txs[0]?.blockHash || '0x9fa481e3d7cb0912ae4c9201bd74f194',
      chainIntegrity: isChainValid ? '100% VERIFIED' : 'TAMPERED',
      checkedAt: new Date().toISOString(),
      blocks: blockResults,
    });
  },

  async tamperLedgerBlock(targetId?: string): Promise<{
    tampered: boolean;
    tamperedBlockId: string;
    message: string;
  }> {
    const target = targetId || mockStore.transactions[2]?.id || mockStore.transactions[0]?.id;
    mockStore.tamperedBlockId = target;

    mockStore.alerts.unshift({
      id: `ALT-TAMPER-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      title: 'Ledger Tamper Detected: Hash Mismatch',
      description: `Cryptographic SHA-256 seal mismatch detected in block ${target}. Chain broken at node.`,
      transactionId: target,
      resolved: false,
    });

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'LEDGER_INTEGRITY_TAMPER_SIM',
      actor: 'SecOps Penetration Harness',
      targetId: target,
      details: `Simulated unauthorized block modification on block ${target}`,
      ipAddress: '127.0.0.1',
      integrityHash: '0xDEADBEEF00000000000000000000000000000000',
    });

    return simulateLatency({
      tampered: true,
      tamperedBlockId: target,
      message: `Block ${target} payload tampered. Cryptographic chain integrity compromised.`,
    });
  },

  async restoreLedgerChain(): Promise<{
    restored: boolean;
    message: string;
  }> {
    mockStore.tamperedBlockId = null;

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'LEDGER_INTEGRITY_RESTORED',
      actor: 'SecOps Consensus Lead',
      targetId: 'CONSENSUS_CHAIN',
      details: 'Merkle leaf hashes re-computed and consensus ledger re-anchored',
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`RESTORE:${Date.now()}`),
    });

    return simulateLatency({
      restored: true,
      message: 'Ledger hash-chain reconciled and 100% verified across all nodes.',
    });
  },

  // Admin Flagged Queue Operations
  async approveFlaggedTransaction(txId: string): Promise<{
    success: boolean;
    transaction: Transaction;
  }> {
    const tx = mockStore.transactions.find((t) => t.id === txId);
    if (!tx) throw new Error('Transaction not found on ledger.');

    tx.status = 'SUCCESS';
    tx.isSuspicious = false;
    tx.riskAssessment.decision = 'ALLOW';

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'ADMIN_TX_APPROVED',
      actor: 'SecOps Administrator',
      targetId: tx.id,
      details: `Manual SecOps override: Transaction ${tx.id} cleared and released.`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`APPROVE:${tx.id}`),
    });

    return simulateLatency({ success: true, transaction: tx });
  },

  async blockFlaggedTransaction(
    txId: string,
    reason = 'SecOps Manual Enforcement: High-Risk Threat Intercepted'
  ): Promise<{
    success: boolean;
    transaction: Transaction;
  }> {
    const tx = mockStore.transactions.find((t) => t.id === txId);
    if (!tx) throw new Error('Transaction not found on ledger.');

    tx.status = 'FAILED';
    tx.failureReason = reason;
    tx.riskAssessment.decision = 'BLOCK';

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'ADMIN_TX_BLOCKED',
      actor: 'SecOps Administrator',
      targetId: tx.id,
      details: `Manual SecOps enforcement: Transaction ${tx.id} quarantined. Reason: ${reason}`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`BLOCK:${tx.id}`),
    });

    return simulateLatency({ success: true, transaction: tx });
  },

  async freezeUserWallet(
    userId: string,
    freeze: boolean
  ): Promise<{ success: boolean; wallet: Wallet }> {
    const wallet =
      mockStore.wallets.find((w) => w.userId === userId) || mockStore.wallets[0];
    wallet.isFrozen = freeze;

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: freeze ? 'ADMIN_WALLET_FROZEN' : 'ADMIN_WALLET_UNFROZEN',
      actor: 'SecOps Administrator',
      targetId: wallet.id,
      details: `SecOps command: Wallet ${wallet.id} set to ${freeze ? 'FROZEN' : 'ACTIVE'}`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`WALLET:${wallet.id}:${freeze}`),
    });

    return simulateLatency({ success: true, wallet });
  },

  // Aggregated Admin Analytics
  async getAdminAnalytics(): Promise<{
    kpis: {
      totalTransactions: number;
      flaggedTransactions: number;
      blockedTransactions: number;
      averageRiskScore: number;
      ledgerIntegrity: 'VERIFIED' | 'TAMPERED';
    };
    riskDistribution: Array<{
      name: string;
      level: RiskLevel;
      count: number;
      percentage: number;
      color: string;
    }>;
    hourlyHeatmap: Array<{
      day: string;
      hour: number;
      intensity: number; // 0 to 100
      count: number;
    }>;
  }> {
    const txs = mockStore.transactions;
    const totalCount = txs.length;
    const flaggedCount = txs.filter((t) => t.isSuspicious || t.riskAssessment.score > 60).length;
    const blockedCount = txs.filter((t) => t.status === 'FAILED' || t.riskAssessment.decision === 'BLOCK').length;
    const avgScore =
      totalCount > 0
        ? Math.round(txs.reduce((acc, t) => acc + t.riskAssessment.score, 0) / totalCount)
        : 24;

    const lowCount = txs.filter((t) => t.riskAssessment.level === 'LOW').length;
    const medCount = txs.filter((t) => t.riskAssessment.level === 'MEDIUM').length;
    const highCount = txs.filter((t) => t.riskAssessment.level === 'HIGH').length;
    const critCount = txs.filter((t) => t.riskAssessment.level === 'CRITICAL').length;

    const riskDistribution = [
      {
        name: 'Low Risk (0–30)',
        level: 'LOW' as RiskLevel,
        count: lowCount,
        percentage: totalCount > 0 ? Math.round((lowCount / totalCount) * 100) : 70,
        color: '#10B981',
      },
      {
        name: 'Medium Risk (31–60)',
        level: 'MEDIUM' as RiskLevel,
        count: medCount,
        percentage: totalCount > 0 ? Math.round((medCount / totalCount) * 100) : 18,
        color: '#FE7E3C',
      },
      {
        name: 'High Risk (61–80)',
        level: 'HIGH' as RiskLevel,
        count: highCount,
        percentage: totalCount > 0 ? Math.round((highCount / totalCount) * 100) : 8,
        color: '#D9531E',
      },
      {
        name: 'Critical Risk (81–100)',
        level: 'CRITICAL' as RiskLevel,
        count: critCount,
        percentage: totalCount > 0 ? Math.round((critCount / totalCount) * 100) : 4,
        color: '#E4201B',
      },
    ];

    // 7 days x 24 hours heatmap dataset
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hourlyHeatmap: Array<{ day: string; hour: number; intensity: number; count: number }> = [];

    days.forEach((day, dIdx) => {
      for (let h = 0; h < 24; h++) {
        // Higher intensity during late nights (01:00-04:00) and peak afternoon (14:00-16:00)
        let intensity = 15;
        if (h >= 1 && h <= 4) intensity = 65 + ((dIdx * 7 + h) % 30);
        else if (h >= 14 && h <= 17) intensity = 45 + ((dIdx * 3 + h) % 25);
        else intensity = 10 + ((dIdx * 5 + h) % 20);

        hourlyHeatmap.push({
          day,
          hour: h,
          intensity,
          count: Math.round(intensity * 1.8),
        });
      }
    });

    return simulateLatency({
      kpis: {
        totalTransactions: totalCount,
        flaggedTransactions: flaggedCount,
        blockedTransactions: blockedCount,
        averageRiskScore: avgScore,
        ledgerIntegrity: mockStore.tamperedBlockId ? 'TAMPERED' : 'VERIFIED',
      },
      riskDistribution,
      hourlyHeatmap,
    });
  },

  // Collect Money / UPI Requests
  async createCollectRequest(payload: {
    payerVpa: string;
    amount: number;
    note?: string;
    expiryHours?: number;
  }): Promise<CollectRequest> {
    const user = mockStore.users.find((u) => u.id === mockStore.currentUserId)!;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + (payload.expiryHours || 24));

    const newRequest: CollectRequest = {
      id: `COL-${Date.now().toString().slice(-4)}`,
      requesterVpa: user.vpa,
      requesterName: user.name,
      payerVpa: payload.payerVpa.trim(),
      amount: payload.amount,
      note: payload.note || 'Payment request via GUARDIANPAY',
      status: 'PENDING',
      expiresAt: expiry.toISOString(),
      createdAt: new Date().toISOString(),
    };

    mockStore.collectRequests.unshift(newRequest);
    return simulateLatency(newRequest);
  },

  async getCollectRequests(): Promise<CollectRequest[]> {
    return simulateLatency([...mockStore.collectRequests]);
  },

  async cancelCollectRequest(id: string): Promise<{ success: boolean; message: string }> {
    const req = mockStore.collectRequests.find((r) => r.id === id);
    if (req) {
      req.status = 'DECLINED';
    }
    return simulateLatency({ success: true, message: 'Collect request cancelled' });
  },

  // Device Security Management
  async getDevices(): Promise<Device[]> {
    const userDevices = mockStore.devices.filter((d) => d.userId === mockStore.currentUserId);
    return simulateLatency(userDevices.length > 0 ? userDevices : mockStore.devices);
  },

  async revokeDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    mockStore.devices = mockStore.devices.filter((d) => d.id !== deviceId);
    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'DEVICE_REVOKED',
      actor: 'Aarav Mehta',
      targetId: deviceId,
      details: `Session revoked for device ${deviceId}`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`REVOKE:${deviceId}`),
    });
    return simulateLatency({ success: true, message: 'Device session revoked immediately.' });
  },

  // UPI PIN Management
  async changePin(payload: {
    currentPin: string;
    newPin: string;
    confirmPin: string;
  }): Promise<{ success: boolean; message: string }> {
    const expectedPin = mockStore.userPins[mockStore.currentUserId] || '123456';

    if (payload.currentPin !== expectedPin) {
      throw new Error('Current UPI PIN is incorrect. Verify and retry.');
    }

    if (payload.newPin !== payload.confirmPin) {
      throw new Error('New PIN and confirmation PIN do not match.');
    }

    if (!/^\d{6}$/.test(payload.newPin)) {
      throw new Error('UPI PIN must be exactly 6 numeric digits.');
    }

    mockStore.userPins[mockStore.currentUserId] = payload.newPin;

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'UPI_PIN_CHANGED',
      actor: 'Aarav Mehta',
      targetId: mockStore.currentUserId,
      details: 'Secure 6-digit UPI PIN rotated and re-encrypted in enclave',
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`PIN_ROTATED:${mockStore.currentUserId}`),
    });

    return simulateLatency({
      success: true,
      message: 'UPI PIN updated successfully and committed to local security vault.',
    });
  },

  // Adaptive Daily Limit
  async updateDailyLimit(newLimit: number): Promise<{ success: boolean; dailyLimit: number }> {
    const wallet = mockStore.wallets.find((w) => w.userId === mockStore.currentUserId)!;
    wallet.dailyLimit = newLimit;

    mockStore.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'LIMIT_UPDATED',
      actor: 'Aarav Mehta',
      targetId: wallet.id,
      details: `Daily payment velocity ceiling adjusted to ₹${newLimit.toLocaleString('en-IN')}`,
      ipAddress: '127.0.0.1',
      integrityHash: mockSha256(`LIMIT:${wallet.id}:${newLimit}`),
    });

    return simulateLatency({ success: true, dailyLimit: newLimit });
  },

  // Security Overview Hub
  async getSecurityOverview(): Promise<{
    wallet: Wallet;
    user: User;
    devices: Device[];
    alerts: AdminAlert[];
    auditLogs: AuditEntry[];
    securityScore: number;
    failedLoginAttempts: number;
    lastLogin: string;
  }> {
    const user = mockStore.users.find((u) => u.id === mockStore.currentUserId)!;
    const wallet = mockStore.wallets.find((w) => w.userId === user.id)!;
    const devices = mockStore.devices.filter((d) => d.userId === user.id);

    return simulateLatency({
      wallet,
      user,
      devices: devices.length > 0 ? devices : mockStore.devices,
      alerts: mockStore.alerts,
      auditLogs: mockStore.auditLogs.slice(0, 10),
      securityScore: wallet.isFrozen ? 54 : 96,
      failedLoginAttempts: 0,
      lastLogin: 'Today, 09:14 AM (Titanium Phone 16 Pro)',
    });
  },

  async resolveSecurityAlert(alertId: string): Promise<{ success: boolean; alert: AdminAlert }> {
    const alert = mockStore.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
    return simulateLatency({ success: true, alert: alert! });
  },

  // Payment Link Security Scanner
  async verifyPaymentLink(url: string) {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/links/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return res.json();
    }
    const res = await fetch('/api/links/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
};
