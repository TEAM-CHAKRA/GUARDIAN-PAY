# GUARDIANPAY — Supabase PostgreSQL Database Integration Guide

This directory contains the production PostgreSQL schema migrations, atomic settlement RPC functions, and baseline seed data for GUARDIANPAY.

---

## Migration Architecture

| File | Purpose | Execution Location |
|---|---|---|
| `migrations/001_initial_schema.sql` | Creates all 10 core tables, constraints, indexes, and Row Level Security (RLS) policies. | Supabase Dashboard ➔ SQL Editor |
| `migrations/002_atomic_transfer_rpc.sql` | Creates the atomic `transfer_payment_atomic` PostgreSQL function with row-level locks (`FOR UPDATE`). | Supabase Dashboard ➔ SQL Editor |
| `seed.sql` | Populates demo accounts, wallets, beneficiaries, and audit hashes. | Supabase Dashboard ➔ SQL Editor |

---

## Step-by-Step Instructions

### Step 1: Open Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your GUARDIANPAY project (`fmvetvjeeropqcaydndp`).

### Step 2: Run Schema Migration
1. In the left navigation, click **SQL Editor**.
2. Click **New Query**.
3. Copy the entire content of `backend/supabase/migrations/001_initial_schema.sql` and paste it into the query editor.
4. Click **Run** (or `Cmd+Enter` / `Ctrl+Enter`).
5. Confirm that the query completes with `Success. No rows returned`.

### Step 3: Run Atomic RPC Function Migration
1. In the SQL Editor, click **New Query**.
2. Copy the entire content of `backend/supabase/migrations/002_atomic_transfer_rpc.sql` and paste it into the editor.
3. Click **Run**.
4. Confirm `Success. No rows returned`.

### Step 4: Seed Demo Accounts & Wallets
1. In the SQL Editor, click **New Query**.
2. Copy the content of `backend/supabase/seed.sql` and paste it into the editor.
3. Click **Run**.
4. Confirm `Success`.

---

## Verification

In your Supabase Dashboard:
1. Navigate to **Table Editor**.
2. Verify that `users`, `wallets`, `transactions`, `ledger_entries`, `beneficiaries`, and `audit_logs` are populated.
3. Verify that `USR-101` (Aarav Mehta) has a corresponding wallet with balance `8425000` paise (₹84,250.00).

---

## Environment Variables (`backend/.env`)

Ensure the backend `.env` contains:
```env
SUPABASE_URL=https://fmvetvjeeropqcaydndp.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```
*(The backend automatically sanitizes any trailing `/rest/v1/` paths).*
