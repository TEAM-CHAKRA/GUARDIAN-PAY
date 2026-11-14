export type TransactionStatus =
  | 'INITIATED'
  | 'RISK_CHECK'
  | 'AUTHORIZED'
  | 'DEBITED'
  | 'CREDITED'
  | 'SUCCESS'
  | 'FAILED'
  | 'REVERSED'
  | 'HELD'
  | 'BLOCKED'
  | 'PENDING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PaymentDecision = 'ALLOW' | 'STEP_UP' | 'HOLD' | 'BLOCK';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  vpa: string; // e.g. user@aegis
  avatarUrl?: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // in INR (Rupees)
  currency: 'INR';
  isFrozen: boolean;
  upiPinSet: boolean;
  dailyLimit: number;
  spentToday: number;
  lastUpdated: string;
}

export interface RiskFactor {
  code: string;
  name: string;
  description: string;
  severity: RiskLevel;
  impactScore: number; // contribution to 0-100 score
  triggered: boolean;
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: RiskLevel;
  riskLevel?: RiskLevel;
  decision: PaymentDecision;
  reasons: string[];
  factors: RiskFactor[];
  analyzedAt: string;
  modelConfidence: number; // e.g. 0.985
}

export interface Transaction {
  id: string; // TXN-YYYYMMDD-XXXX
  utr: string; // 12-digit UTR
  senderId: string;
  senderName: string;
  senderVpa: string;
  receiverId: string;
  receiverName: string;
  receiverVpa: string;
  amount: number;
  note?: string;
  category?: string;
  status: TransactionStatus;
  riskAssessment: RiskAssessment;
  blockHash: string; // SHA-256 hash of this transaction record
  previousBlockHash: string; // SHA-256 hash of previous block in chain
  blockNumber?: number;
  timestamp: string;
  verifiedAt?: string;
  stepUpRequired?: boolean;
  stepUpType?: 'OTP' | 'BIOMETRIC' | 'PIN';
  authMethodUsed?: string;
  isSuspicious: boolean;
  failureReason?: string;
}

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  os: string;
  ipAddress: string;
  location: string;
  isTrusted: boolean;
  lastActive: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetId: string;
  details: string;
  ipAddress: string;
  integrityHash: string;
}

export interface CollectRequest {
  id: string;
  requesterVpa: string;
  requesterName: string;
  payerVpa: string;
  amount: number;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface AdminAlert {
  id: string;
  timestamp: string;
  severity: RiskLevel;
  title: string;
  description: string;
  transactionId?: string;
  userId?: string;
  resolved: boolean;
}

export interface FraudScenario {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  expectedScore: number;
  expectedDecision: PaymentDecision;
  simulatedAnomalies: string[];
}
