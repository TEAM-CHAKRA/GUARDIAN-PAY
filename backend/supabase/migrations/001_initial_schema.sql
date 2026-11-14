-- ==============================================================================
-- GUARDIANPAY — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Creates persistent storage tables, constraints, indexes, and RLS.
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(30),
  upi_id VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'frozen')),
  pin_failed_at JSONB DEFAULT '[]'::jsonb,
  pin_locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_upi_id ON public.users(upi_id);

-- 2. WALLETS TABLE (Safe creation / migration)
CREATE TABLE IF NOT EXISTS public.wallets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  upi_id VARCHAR(100) UNIQUE NOT NULL,
  balance_paise BIGINT NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  held_paise BIGINT NOT NULL DEFAULT 0 CHECK (held_paise >= 0),
  daily_spent_paise BIGINT NOT NULL DEFAULT 0 CHECK (daily_spent_paise >= 0),
  daily_reset_date VARCHAR(10) NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure newly required columns exist even if wallets table pre-existed
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS held_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS daily_spent_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS daily_reset_date VARCHAR(10) NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_upi_id ON public.wallets(upi_id);

-- 3. TRANSACTIONS TABLE (Safe creation / migration)
CREATE TABLE IF NOT EXISTS public.transactions (
  id VARCHAR(64) PRIMARY KEY,
  utr VARCHAR(64) UNIQUE NOT NULL,
  sender_user_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_upi_id VARCHAR(100) NOT NULL,
  receiver_user_id VARCHAR(64) NOT NULL,
  receiver_name VARCHAR(150) NOT NULL,
  receiver_upi_id VARCHAR(100) NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  note TEXT DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  step_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  step_up_completed BOOLEAN NOT NULL DEFAULT FALSE,
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  idempotency_key VARCHAR(100) UNIQUE,
  block_hash VARCHAR(100),
  previous_block_hash VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure newly required columns exist if transactions table pre-existed
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utr VARCHAR(64);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sender_user_id VARCHAR(64);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sender_upi_id VARCHAR(100);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receiver_user_id VARCHAR(64);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receiver_upi_id VARCHAR(100);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS step_up_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS step_up_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS block_hash VARCHAR(100);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS previous_block_hash VARCHAR(100);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_transactions_sender ON public.transactions(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON public.transactions(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 4. LEDGER ENTRIES TABLE (Dual-entry financial accounting)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  wallet_id VARCHAR(64) NOT NULL,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  balance_after_paise BIGINT NOT NULL CHECK (balance_after_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(64);
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10);
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS amount_paise BIGINT;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS balance_after_paise BIGINT;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_ledger_tx ON public.ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON public.ledger_entries(wallet_id);

-- 5. BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  beneficiary_name VARCHAR(150) NOT NULL,
  beneficiary_upi_id VARCHAR(100) NOT NULL,
  trust_score INTEGER DEFAULT 95 CHECK (trust_score >= 0 AND trust_score <= 100),
  is_verified BOOLEAN DEFAULT TRUE,
  category VARCHAR(30) DEFAULT 'TRUSTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, beneficiary_upi_id)
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON public.beneficiaries(user_id);

-- 6. FRAUD ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.fraud_assessments (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL,
  decision VARCHAR(20) NOT NULL,
  triggered_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_review JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS decision VARCHAR(20);
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS triggered_signals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS reasons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS ai_review JSONB;
ALTER TABLE public.fraud_assessments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_fraud_assessments_tx ON public.fraud_assessments(transaction_id);

-- 7. PAYMENT LINK SCANS TABLE
CREATE TABLE IF NOT EXISTS public.payment_link_scans (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES public.users(id),
  submitted_url TEXT NOT NULL,
  normalized_domain VARCHAR(255) NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  decision VARCHAR(20) NOT NULL,
  scan_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_scans_user ON public.payment_link_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_link_scans_domain ON public.payment_link_scans(normalized_domain);

-- 8. AUDIT LOGS TABLE (Cryptographic SHA-256 hash chained)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  seq BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash VARCHAR(64) NOT NULL,
  current_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_seq ON public.audit_logs(seq);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- 9. IDEMPOTENCY RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.idempotency_records (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id),
  idempotency_key VARCHAR(100) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_status INTEGER NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON public.idempotency_records(user_id, idempotency_key);

-- 10. SESSIONS TABLE (For timing-safe revocation checking)
CREATE TABLE IF NOT EXISTS public.sessions (
  jti VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_link_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Backend Service Role Bypass: The backend uses SUPABASE_SECRET_KEY which has full authorized administrative bypass.
-- Standard public access is blocked by default across all tables to enforce strict Express backend mediation.
CREATE POLICY "Deny unauthenticated public access to users" ON public.users FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to wallets" ON public.wallets FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to transactions" ON public.transactions FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to ledger_entries" ON public.ledger_entries FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to beneficiaries" ON public.beneficiaries FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to fraud_assessments" ON public.fraud_assessments FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to payment_link_scans" ON public.payment_link_scans FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to audit_logs" ON public.audit_logs FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to idempotency_records" ON public.idempotency_records FOR ALL USING (false);
CREATE POLICY "Deny unauthenticated public access to sessions" ON public.sessions FOR ALL USING (false);
