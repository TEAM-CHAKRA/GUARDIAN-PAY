-- ==============================================================================
-- GUARDIANPAY — ATOMIC DUAL-ENTRY PAYMENT SETTLEMENT RPC
-- Migration: 002_atomic_transfer_rpc.sql
-- Description: Executes atomic wallet locking, balance verification, dual-entry
--              ledger insertion, and status mutation in a single Postgres transaction.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.transfer_payment_atomic(
  p_sender_user_id VARCHAR(64),
  p_receiver_upi_id VARCHAR(100),
  p_amount_paise BIGINT,
  p_transaction_id VARCHAR(64),
  p_utr VARCHAR(64),
  p_note TEXT,
  p_decision VARCHAR(20),
  p_risk_score INTEGER,
  p_risk_data JSONB,
  p_idempotency_key VARCHAR(100) DEFAULT NULL,
  p_block_hash VARCHAR(100) DEFAULT NULL,
  p_prev_block_hash VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_wallet RECORD;
  v_receiver_wallet RECORD;
  v_receiver_user RECORD;
  v_sender_user RECORD;
  v_today_kolkata VARCHAR(10);
  v_tx_status VARCHAR(30);
  v_new_sender_bal BIGINT;
  v_new_receiver_bal BIGINT;
  v_result JSONB;
BEGIN
  -- 1. Input Sanity Validations
  IF p_amount_paise <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: Transfer amount must be positive integer paise';
  END IF;

  v_today_kolkata := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  -- 2. Fetch & Validate Users
  SELECT * INTO v_sender_user FROM public.users WHERE id = p_sender_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SENDER_NOT_FOUND: Sender user account does not exist';
  END IF;

  SELECT * INTO v_receiver_user FROM public.users WHERE LOWER(upi_id) = LOWER(TRIM(p_receiver_upi_id));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RECEIVER_NOT_FOUND: Payee UPI ID is not registered';
  END IF;

  IF v_sender_user.id = v_receiver_user.id THEN
    RAISE EXCEPTION 'SELF_TRANSFER: Cannot transfer capital to self';
  END IF;

  -- 3. Lock Wallets in Deterministic Order to Prevent Deadlocks
  IF v_sender_user.id < v_receiver_user.id THEN
    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = v_sender_user.id FOR UPDATE;
    SELECT * INTO v_receiver_wallet FROM public.wallets WHERE user_id = v_receiver_user.id FOR UPDATE;
  ELSE
    SELECT * INTO v_receiver_wallet FROM public.wallets WHERE user_id = v_receiver_user.id FOR UPDATE;
    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = v_sender_user.id FOR UPDATE;
  END IF;

  IF v_sender_wallet IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: Sender wallet not found';
  END IF;
  IF v_receiver_wallet IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: Receiver wallet not found';
  END IF;

  -- 4. Check Wallet Quarantine Status
  IF v_sender_wallet.is_frozen THEN
    RAISE EXCEPTION 'WALLET_FROZEN: Sender wallet is quarantined under autonomous security freeze';
  END IF;

  -- 5. Handle Daily Kolkata Limit Rollover
  IF v_sender_wallet.daily_reset_date <> v_today_kolkata THEN
    v_sender_wallet.daily_spent_paise := 0;
    v_sender_wallet.daily_reset_date := v_today_kolkata;
  END IF;

  -- 6. Evaluate Decision Pipeline
  IF LOWER(p_decision) = 'allow' OR LOWER(p_decision) = 'success' THEN
    -- Verify Sufficient Capital
    IF v_sender_wallet.balance_paise < p_amount_paise THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Available capital is less than requested transfer';
    END IF;

    -- Apply Dual-Entry Debit and Credit
    v_new_sender_bal := v_sender_wallet.balance_paise - p_amount_paise;
    v_new_receiver_bal := v_receiver_wallet.balance_paise + p_amount_paise;
    v_tx_status := 'success';

    UPDATE public.wallets
    SET balance_paise = v_new_sender_bal,
        daily_spent_paise = v_sender_wallet.daily_spent_paise + p_amount_paise,
        daily_reset_date = v_today_kolkata,
        updated_at = NOW()
    WHERE id = v_sender_wallet.id;

    UPDATE public.wallets
    SET balance_paise = v_new_receiver_bal,
        updated_at = NOW()
    WHERE id = v_receiver_wallet.id;

    -- Create Ledger Double-Entries
    INSERT INTO public.ledger_entries (id, transaction_id, wallet_id, entry_type, amount_paise, balance_after_paise, created_at)
    VALUES
      ('LED-DR-' || p_transaction_id, p_transaction_id, v_sender_wallet.id, 'DEBIT', p_amount_paise, v_new_sender_bal, NOW()),
      ('LED-CR-' || p_transaction_id, p_transaction_id, v_receiver_wallet.id, 'CREDIT', p_amount_paise, v_new_receiver_bal, NOW());

  ELSIF LOWER(p_decision) = 'hold' THEN
    -- Hold Escrow: Reserve funds from balance into held_paise
    IF v_sender_wallet.balance_paise < p_amount_paise THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Available capital is less than requested transfer';
    END IF;

    v_new_sender_bal := v_sender_wallet.balance_paise - p_amount_paise;
    v_tx_status := 'held';

    UPDATE public.wallets
    SET balance_paise = v_new_sender_bal,
        held_paise = v_sender_wallet.held_paise + p_amount_paise,
        updated_at = NOW()
    WHERE id = v_sender_wallet.id;

    INSERT INTO public.ledger_entries (id, transaction_id, wallet_id, entry_type, amount_paise, balance_after_paise, created_at)
    VALUES ('LED-HOLD-' || p_transaction_id, p_transaction_id, v_sender_wallet.id, 'DEBIT', p_amount_paise, v_new_sender_bal, NOW());

  ELSIF LOWER(p_decision) = 'block' THEN
    v_tx_status := 'blocked';
    -- Block Action: Freeze sender wallet for security quarantine
    UPDATE public.wallets
    SET is_frozen = TRUE,
        updated_at = NOW()
    WHERE id = v_sender_wallet.id;

  ELSE -- Step-up or pending
    v_tx_status := 'pending_verification';
  END IF;

  -- 7. Insert Transaction Record
  INSERT INTO public.transactions (
    id, utr, sender_user_id, sender_name, sender_upi_id,
    receiver_user_id, receiver_name, receiver_upi_id,
    amount_paise, currency, note, status,
    step_up_required, step_up_completed,
    held_at, idempotency_key, block_hash, previous_block_hash,
    created_at, updated_at
  ) VALUES (
    p_transaction_id, p_utr, v_sender_user.id, v_sender_user.name, v_sender_user.upi_id,
    v_receiver_user.id, v_receiver_user.name, v_receiver_user.upi_id,
    p_amount_paise, 'INR', COALESCE(p_note, ''), v_tx_status,
    (LOWER(p_decision) = 'step_up'), FALSE,
    CASE WHEN v_tx_status = 'held' THEN NOW() ELSE NULL END,
    p_idempotency_key, p_block_hash, p_prev_block_hash,
    NOW(), NOW()
  );

  -- 8. Insert Fraud Assessment Record
  INSERT INTO public.fraud_assessments (
    id, transaction_id, risk_score, risk_level, decision,
    triggered_signals, reasons, factors, created_at
  ) VALUES (
    'FA-' || p_transaction_id, p_transaction_id, p_risk_score,
    COALESCE(p_risk_data->>'level', 'LOW'), p_decision,
    COALESCE(p_risk_data->'signals', '[]'::jsonb),
    COALESCE(p_risk_data->'reasons', '[]'::jsonb),
    COALESCE(p_risk_data->'factors', '[]'::jsonb),
    NOW()
  );

  -- 9. Construct Final Settlement Response
  v_result := jsonb_build_object(
    'success', TRUE,
    'status', v_tx_status,
    'transaction_id', p_transaction_id,
    'utr', p_utr,
    'amount_paise', p_amount_paise,
    'sender_balance_paise', COALESCE(v_new_sender_bal, v_sender_wallet.balance_paise),
    'receiver_balance_paise', COALESCE(v_new_receiver_bal, v_receiver_wallet.balance_paise)
  );

  RETURN v_result;
END;
$$;
