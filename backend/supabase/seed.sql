-- ==============================================================================
-- GUARDIANPAY — SUPABASE DEMO SEED DATA
-- File: backend/supabase/seed.sql
-- Description: Seeds baseline demo accounts, wallets, beneficiaries, and audit records.
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO public.users (id, name, email, phone, upi_id, password_hash, pin_hash, role, account_status)
VALUES
  (
    'USR-101', 'Aarav Mehta', 'aarav.mehta@guardian.secure', '+91 98201 44521', 'aarav@aegis',
    '$argon2id$v=19$m=19456,t=2,p=1$bdEUQ9J5M9NDMmR7l7DBvw$epk1ttnxtt+L3C4BWR9bAjGyak5KSOE/fSvitBkXSpg',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-102', 'Alice Sharma', 'alice@example.com', '+91 98000 11111', 'alice@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$TVf2xzUZNxrLLY2kJEw8Ow$6fFmtiUm9XOBBVXMYV+2fkbU+OywJ8RZ33q1rHHP6eo',
    '$argon2id$v=19$m=19456,t=2,p=1$jjw3ASgstYDGVZX/X4qJDA$qsBl/jgXfKImbE3s1wB71p4WHofQAORFHr76hHYYUmo',
    'user', 'active'
  ),
  (
    'USR-103', 'Bob Smith', 'bob@example.com', '+91 98000 22222', 'bobsmith@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$TVf2xzUZNxrLLY2kJEw8Ow$6fFmtiUm9XOBBVXMYV+2fkbU+OywJ8RZ33q1rHHP6eo',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-104', 'Carol Danvers', 'carol@example.com', '+91 98000 33333', 'carol@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$TVf2xzUZNxrLLY2kJEw8Ow$6fFmtiUm9XOBBVXMYV+2fkbU+OywJ8RZ33q1rHHP6eo',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-105', 'Aegis Supermart', 'merchant@example.com', '+91 98000 44444', 'aegismerchant@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$TVf2xzUZNxrLLY2kJEw8Ow$6fFmtiUm9XOBBVXMYV+2fkbU+OywJ8RZ33q1rHHP6eo',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-106', 'Rogue Actor', 'attacker@example.com', '+91 98000 55555', 'darknet@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$TVf2xzUZNxrLLY2kJEw8Ow$6fFmtiUm9XOBBVXMYV+2fkbU+OywJ8RZ33q1rHHP6eo',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-107', 'Diya Sharma', 'diya.sharma@aegis.secure', '+91 98000 66666', 'diya@aegis',
    '$argon2id$v=19$m=19456,t=2,p=1$bdEUQ9J5M9NDMmR7l7DBvw$epk1ttnxtt+L3C4BWR9bAjGyak5KSOE/fSvitBkXSpg',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-108', 'Vikramaditya Roy', 'vikram.roy@aegis.secure', '+91 98000 77777', 'vikram@aegis',
    '$argon2id$v=19$m=19456,t=2,p=1$bdEUQ9J5M9NDMmR7l7DBvw$epk1ttnxtt+L3C4BWR9bAjGyak5KSOE/fSvitBkXSpg',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-109', 'Ananya Verma', 'ananya.verma@aegis.secure', '+91 98000 88888', 'ananya@aegis',
    '$argon2id$v=19$m=19456,t=2,p=1$bdEUQ9J5M9NDMmR7l7DBvw$epk1ttnxtt+L3C4BWR9bAjGyak5KSOE/fSvitBkXSpg',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-110', 'Secure Cloud Labs Ltd', 'cloudlabs@aegis.secure', '+91 98000 99999', 'cloudlabs@aegis',
    '$argon2id$v=19$m=19456,t=2,p=1$bdEUQ9J5M9NDMmR7l7DBvw$epk1ttnxtt+L3C4BWR9bAjGyak5KSOE/fSvitBkXSpg',
    '$argon2id$v=19$m=19456,t=2,p=1$uEup8rTaBszkizA+FLsplw$Iy/RLKCg3ruzGuQd2oWzu2Yu4sxtFx2uuTYZuqVT33w',
    'user', 'active'
  ),
  (
    'USR-ADMIN', 'SecOps Administrator', 'admin@guardianpay.internal', '+91 99999 00000', 'admin@guardianpay',
    '$argon2id$v=19$m=19456,t=2,p=1$dfs38Kf6bnwa7j9Vb79TtQ$H90PENSkPiap3+tDFBz3IigVWAmZbW6CQymKr4sGXt8',
    '$argon2id$v=19$m=19456,t=2,p=1$jjw3ASgstYDGVZX/X4qJDA$qsBl/jgXfKImbE3s1wB71p4WHofQAORFHr76hHYYUmo',
    'admin', 'active'
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    pin_hash = EXCLUDED.pin_hash,
    role = EXCLUDED.role,
    account_status = EXCLUDED.account_status;

-- 2. SEED WALLETS
INSERT INTO public.wallets (id, user_id, upi_id, balance_paise, held_paise, daily_spent_paise, daily_reset_date, currency, is_frozen)
VALUES
  ('WAL-USR-101', 'USR-101', 'aarav@aegis', 8425000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-102', 'USR-102', 'alice@guardianpay', 8425000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-103', 'USR-103', 'bobsmith@guardianpay', 5000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-104', 'USR-104', 'carol@guardianpay', 3000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-105', 'USR-105', 'aegismerchant@guardianpay', 15000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-106', 'USR-106', 'darknet@guardianpay', 1000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-107', 'USR-107', 'diya@aegis', 5000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-108', 'USR-108', 'vikram@aegis', 7500000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-109', 'USR-109', 'ananya@aegis', 4000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-110', 'USR-110', 'cloudlabs@aegis', 50000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE),
  ('WAL-USR-ADMIN', 'USR-ADMIN', 'admin@guardianpay', 10000000, 0, 0, TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), 'INR', FALSE)
ON CONFLICT (id) DO UPDATE
SET balance_paise = EXCLUDED.balance_paise,
    held_paise = EXCLUDED.held_paise,
    upi_id = EXCLUDED.upi_id;

-- 3. SEED TRUSTED BENEFICIARIES FOR AARAV MEHTA
INSERT INTO public.beneficiaries (id, user_id, beneficiary_name, beneficiary_upi_id, trust_score, is_verified, category)
VALUES
  ('BEN-101-1', 'USR-101', 'Diya Sharma', 'diya@aegis', 98, TRUE, 'TRUSTED'),
  ('BEN-101-2', 'USR-101', 'Vikramaditya Roy', 'vikram@aegis', 95, TRUE, 'TRUSTED'),
  ('BEN-101-3', 'USR-101', 'Ananya Verma', 'ananya@aegis', 94, TRUE, 'TRUSTED'),
  ('BEN-101-4', 'USR-101', 'Secure Cloud Labs Ltd', 'cloudlabs@aegis', 99, TRUE, 'TRUSTED')
ON CONFLICT (user_id, beneficiary_upi_id) DO NOTHING;
