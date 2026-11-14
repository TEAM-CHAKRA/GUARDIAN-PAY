import { getSupabaseClient } from '../db/supabase.js';
import { getKolkataDateString } from '../config/limits.js';
import { ERROR_CODES, TRANSACTION_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

function deepClone(data) {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

export class SupabaseRepository {
  constructor(client = null) {
    this._client = client;
  }

  get client() {
    if (!this._client) {
      this._client = getSupabaseClient();
    }
    if (!this._client) {
      throw new Error('Supabase client unavailable. Please check SUPABASE_URL and SUPABASE_SECRET_KEY.');
    }
    return this._client;
  }

  // ================= USERS =================

  async createUser(user) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      phone: user.phone || null,
      upi_id: user.upiId.toLowerCase().trim(),
      password_hash: user.passwordHash,
      pin_hash: user.pinHash,
      role: user.role || 'user',
      account_status: user.accountStatus || 'active',
      pin_failed_at: user.pinFailedAt || [],
      pin_locked_until: user.pinLockedUntil || null,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logger.error(`Supabase createUser failed: ${error.message}`);
      throw new Error(error.message);
    }

    return this._mapUserFromDb(data);
  }

  async getUserById(id) {
    if (!id) return null;
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Supabase getUserById failed: ${error.message}`);
      return null;
    }
    return data ? this._mapUserFromDb(data) : null;
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      logger.error(`Supabase getUserByEmail failed: ${error.message}`);
      return null;
    }
    return data ? this._mapUserFromDb(data) : null;
  }

  async getUserByUpiId(upiId) {
    if (!upiId) return null;
    const cleanUpi = upiId.toLowerCase().trim();
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('upi_id', cleanUpi)
      .maybeSingle();

    if (error) {
      logger.error(`Supabase getUserByUpiId failed: ${error.message}`);
      return null;
    }
    return data ? this._mapUserFromDb(data) : null;
  }

  async listUsers() {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(`Supabase listUsers failed: ${error.message}`);
      return [];
    }
    return (data || []).map((u) => this._mapUserFromDb(u));
  }

  async updateUser(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.upiId !== undefined) payload.upi_id = updates.upiId.toLowerCase().trim();
    if (updates.passwordHash !== undefined) payload.password_hash = updates.passwordHash;
    if (updates.pinHash !== undefined) payload.pin_hash = updates.pinHash;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.accountStatus !== undefined) payload.account_status = updates.accountStatus;
    if (updates.pinFailedAt !== undefined) payload.pin_failed_at = updates.pinFailedAt;
    if (updates.pinLockedUntil !== undefined) payload.pin_locked_until = updates.pinLockedUntil;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await this.client
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Supabase updateUser failed: ${error.message}`);
      throw new Error(error.message);
    }
    return data ? this._mapUserFromDb(data) : null;
  }

  // ================= SESSIONS =================

  async createSession(jti, data = {}) {
    const payload = {
      jti,
      user_id: data.userId || 'USR-101',
      is_revoked: false,
      created_at: new Date().toISOString(),
    };
    await this.client.from('sessions').upsert(payload, { onConflict: 'jti' });
    return true;
  }

  async isSessionRevoked(jti) {
    const { data, error } = await this.client
      .from('sessions')
      .select('is_revoked')
      .eq('jti', jti)
      .maybeSingle();

    if (error || !data) return false;
    return Boolean(data.is_revoked);
  }

  async revokeSession(jti) {
    await this.client
      .from('sessions')
      .update({ is_revoked: true })
      .eq('jti', jti);
    return true;
  }

  // ================= WALLETS =================

  async createWallet(wallet) {
    const payload = {
      id: wallet.id || `WAL-${wallet.userId}`,
      user_id: wallet.userId,
      upi_id: wallet.upiId,
      balance_paise: wallet.balancePaise,
      held_paise: wallet.heldPaise || 0,
      daily_spent_paise: wallet.dailySpentPaise || 0,
      daily_reset_date: wallet.dailyResetDate || getKolkataDateString(),
      currency: wallet.currency || 'INR',
      is_frozen: Boolean(wallet.isFrozen),
      created_at: wallet.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('wallets')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      logger.error(`Supabase createWallet failed: ${error.message}`);
      throw new Error(error.message);
    }
    return this._mapWalletFromDb(data);
  }

  async getWallet(userId) {
    if (!userId) return null;
    const { data, error } = await this.client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const wallet = this._mapWalletFromDb(data);

    // Daily Kolkata midnight rollover check
    const todayKolkata = getKolkataDateString();
    if (wallet.dailyResetDate !== todayKolkata) {
      wallet.dailySpentPaise = 0;
      wallet.dailyResetDate = todayKolkata;
      await this.updateWallet(userId, {
        dailySpentPaise: 0,
        dailyResetDate: todayKolkata,
      });
    }

    return wallet;
  }

  async updateWallet(userId, updates) {
    const payload = {};
    if (updates.balancePaise !== undefined) payload.balance_paise = updates.balancePaise;
    if (updates.heldPaise !== undefined) payload.held_paise = updates.heldPaise;
    if (updates.dailySpentPaise !== undefined) payload.daily_spent_paise = updates.dailySpentPaise;
    if (updates.dailyResetDate !== undefined) payload.daily_reset_date = updates.dailyResetDate;
    if (updates.isFrozen !== undefined) payload.is_frozen = updates.isFrozen;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await this.client
      .from('wallets')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Supabase updateWallet failed: ${error.message}`);
      throw new Error(error.message);
    }
    return data ? this._mapWalletFromDb(data) : null;
  }

  // ================= ATOMIC PAYMENT TRANSFER =================

  async executeTransfer({ transaction, mode }) {
    // 1. Try atomic database function (RPC)
    try {
      const { data, error } = await this.client.rpc('transfer_payment_atomic', {
        p_sender_user_id: transaction.senderUserId,
        p_receiver_upi_id: transaction.receiverUpiId,
        p_amount_paise: transaction.amountPaise,
        p_transaction_id: transaction.id,
        p_utr: transaction.utr,
        p_note: transaction.note || '',
        p_decision: transaction.status === 'success' ? 'allow' : transaction.status,
        p_risk_score: transaction.risk?.score || 0,
        p_risk_data: transaction.risk || {},
        p_idempotency_key: transaction.idempotencyKey || null,
        p_block_hash: transaction.blockHash || null,
        p_prev_block_hash: transaction.previousBlockHash || null,
      });

      if (!error && data && data.success) {
        const senderWallet = await this.getWallet(transaction.senderUserId);
        const receiverUser = await this.getUserByUpiId(transaction.receiverUpiId);
        const receiverWallet = receiverUser ? await this.getWallet(receiverUser.id) : null;
        const txRecord = await this.getTransaction(transaction.id);

        return {
          transaction: txRecord || transaction,
          senderWallet,
          receiverWallet,
        };
      }
    } catch (rpcErr) {
      logger.warn(`Atomic RPC transfer attempt fell back to direct balance mutation: ${rpcErr.message}`);
    }

    // 2. Direct Database Mutation Fallback
    const senderWallet = await this.getWallet(transaction.senderUserId);
    const receiverUser = await this.getUserByUpiId(transaction.receiverUpiId);
    const receiverWallet = receiverUser ? await this.getWallet(receiverUser.id) : null;

    if (!senderWallet) throw new Error(ERROR_CODES.NOT_FOUND);
    if (!receiverWallet) throw new Error(ERROR_CODES.RECEIVER_NOT_FOUND);

    const amount = transaction.amountPaise;

    if (mode === 'settle') {
      if (senderWallet.balancePaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }

      const updatedSenderBal = senderWallet.balancePaise - amount;
      const updatedReceiverBal = receiverWallet.balancePaise + amount;

      await this.updateWallet(senderWallet.userId, {
        balancePaise: updatedSenderBal,
        dailySpentPaise: senderWallet.dailySpentPaise + amount,
      });

      await this.updateWallet(receiverWallet.userId, {
        balancePaise: updatedReceiverBal,
      });

      transaction.status = TRANSACTION_STATUS.SUCCESS;
      await this.createTransaction(transaction);

      return {
        transaction: deepClone(transaction),
        senderWallet: { ...senderWallet, balancePaise: updatedSenderBal },
        receiverWallet: { ...receiverWallet, balancePaise: updatedReceiverBal },
      };
    } else if (mode === 'hold') {
      if (senderWallet.balancePaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }

      const updatedSenderBal = senderWallet.balancePaise - amount;
      const updatedHeld = senderWallet.heldPaise + amount;

      await this.updateWallet(senderWallet.userId, {
        balancePaise: updatedSenderBal,
        heldPaise: updatedHeld,
      });

      transaction.status = TRANSACTION_STATUS.HELD;
      await this.createTransaction(transaction);

      return {
        transaction: deepClone(transaction),
        senderWallet: { ...senderWallet, balancePaise: updatedSenderBal, heldPaise: updatedHeld },
        receiverWallet: deepClone(receiverWallet),
      };
    } else if (mode === 'release_held' || mode === 'release_to_receiver') {
      const updatedHeld = Math.max(0, senderWallet.heldPaise - amount);
      const updatedReceiverBal = receiverWallet.balancePaise + amount;

      await this.updateWallet(senderWallet.userId, {
        heldPaise: updatedHeld,
        dailySpentPaise: senderWallet.dailySpentPaise + amount,
      });

      await this.updateWallet(receiverWallet.userId, {
        balancePaise: updatedReceiverBal,
      });

      transaction.status = TRANSACTION_STATUS.SUCCESS;
      await this.updateTransaction(transaction.id, { status: TRANSACTION_STATUS.SUCCESS });

      return {
        transaction: deepClone(transaction),
        senderWallet: { ...senderWallet, heldPaise: updatedHeld },
        receiverWallet: { ...receiverWallet, balancePaise: updatedReceiverBal },
      };
    } else if (mode === 'return_to_sender') {
      const updatedHeld = Math.max(0, senderWallet.heldPaise - amount);
      const updatedSenderBal = senderWallet.balancePaise + amount;

      await this.updateWallet(senderWallet.userId, {
        heldPaise: updatedHeld,
        balancePaise: updatedSenderBal,
        dailySpentPaise: Math.max(0, senderWallet.dailySpentPaise - amount),
      });

      transaction.status = TRANSACTION_STATUS.REVERSED;
      await this.updateTransaction(transaction.id, { status: TRANSACTION_STATUS.REVERSED });

      return {
        transaction: deepClone(transaction),
        senderWallet: { ...senderWallet, heldPaise: updatedHeld, balancePaise: updatedSenderBal },
        receiverWallet: deepClone(receiverWallet),
      };
    }

    throw new Error(`Unsupported transfer mode: ${mode}`);
  }

  // ================= TRANSACTIONS =================

  async createTransaction(record) {
    const payload = {
      id: record.id,
      utr: record.utr,
      sender_user_id: record.senderUserId,
      sender_name: record.senderName,
      sender_upi_id: record.senderUpiId,
      receiver_user_id: record.receiverUserId,
      receiver_name: record.receiverName,
      receiver_upi_id: record.receiverUpiId,
      amount_paise: record.amountPaise,
      currency: record.currency || 'INR',
      note: record.note || '',
      status: (record.status || 'pending').toLowerCase(),
      step_up_required: Boolean(record.stepUpRequired),
      step_up_completed: Boolean(record.stepUpCompleted),
      held_at: record.heldAt || null,
      released_at: record.releasedAt || null,
      idempotency_key: record.idempotencyKey || null,
      block_hash: record.blockHash || null,
      previous_block_hash: record.previousBlockHash || null,
      created_at: record.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('transactions')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logger.error(`Supabase createTransaction failed: ${error.message}`);
      throw new Error(error.message);
    }
    return this._mapTransactionFromDb(data, record);
  }

  async getTransaction(id) {
    if (!id) return null;
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this._mapTransactionFromDb(data);
  }

  async updateTransaction(id, updates) {
    const payload = {};
    if (updates.status !== undefined) payload.status = updates.status.toLowerCase();
    if (updates.stepUpCompleted !== undefined) payload.step_up_completed = updates.stepUpCompleted;
    if (updates.heldAt !== undefined) payload.held_at = updates.heldAt;
    if (updates.releasedAt !== undefined) payload.released_at = updates.releasedAt;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await this.client
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Supabase updateTransaction failed: ${error.message}`);
      throw new Error(error.message);
    }
    return data ? this._mapTransactionFromDb(data) : null;
  }

  async listTransactionsByUser(userId, { limit = 50, status } = {}) {
    let query = this.client
      .from('transactions')
      .select('*')
      .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status.toLowerCase());
    }

    const { data, error } = await query;
    if (error) {
      logger.error(`Supabase listTransactionsByUser failed: ${error.message}`);
      return [];
    }
    return (data || []).map((t) => this._mapTransactionFromDb(t));
  }

  async listTransactions({ status, limit = 50 } = {}) {
    let query = this.client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status.toLowerCase());
    }

    const { data, error } = await query;
    if (error) {
      logger.error(`Supabase listTransactions failed: ${error.message}`);
      return [];
    }
    return (data || []).map((t) => this._mapTransactionFromDb(t));
  }

  // ================= IDEMPOTENCY =================

  async getIdempotencyRecord(userId, key) {
    const { data, error } = await this.client
      .from('idempotency_records')
      .select('*')
      .eq('user_id', userId)
      .eq('idempotency_key', key)
      .maybeSingle();

    if (error || !data) return null;
    return {
      payloadHash: data.request_hash,
      response: data.response_data,
      status: 'completed',
    };
  }

  async saveIdempotencyRecord(userId, key, { payloadHash, response, status = 'completed' }) {
    const payload = {
      id: `${userId}:${key}`,
      user_id: userId,
      idempotency_key: key,
      request_hash: payloadHash,
      response_status: response?.success === false ? 400 : 201,
      response_data: response,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    await this.client
      .from('idempotency_records')
      .upsert(payload, { onConflict: 'user_id,idempotency_key' });
    return true;
  }

  async deleteIdempotencyRecord(userId, key) {
    await this.client
      .from('idempotency_records')
      .delete()
      .eq('user_id', userId)
      .eq('idempotency_key', key);
    return true;
  }

  // ================= AUDIT LOG =================

  async appendAudit(entry) {
    const payload = {
      seq: entry.seq,
      event_type: entry.type,
      actor_id: entry.actorId,
      subject_id: entry.subjectId || null,
      data: entry.data || {},
      previous_hash: entry.previousHash,
      current_hash: entry.currentHash,
      created_at: entry.timestamp || new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error(`Supabase appendAudit failed: ${error.message}`);
      throw new Error(error.message);
    }
    return entry;
  }

  async listAudit({ limit = 50 } = {}) {
    const { data, error } = await this.client
      .from('audit_logs')
      .select('*')
      .order('seq', { ascending: true })
      .limit(limit);

    if (error) return [];
    return (data || []).map((row) => ({
      seq: Number(row.seq),
      type: row.event_type,
      actorId: row.actor_id,
      subjectId: row.subject_id,
      data: row.data,
      previousHash: row.previous_hash,
      currentHash: row.current_hash,
      timestamp: row.created_at,
    }));
  }

  async getLastAudit() {
    const { data, error } = await this.client
      .from('audit_logs')
      .select('*')
      .order('seq', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      seq: Number(data.seq),
      type: data.event_type,
      actorId: data.actor_id,
      subjectId: data.subject_id,
      data: data.data,
      previousHash: data.previous_hash,
      currentHash: data.current_hash,
      timestamp: data.created_at,
    };
  }

  async tamperAudit(seq, fakeData = { tampered: true }) {
    await this.client
      .from('audit_logs')
      .update({ data: fakeData })
      .eq('seq', seq);
    return true;
  }

  // ================= PRIVATE DATA MAPPERS =================

  _mapUserFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      upiId: row.upi_id,
      passwordHash: row.password_hash,
      pinHash: row.pin_hash,
      pinFailedAt: row.pin_failed_at || [],
      pinLockedUntil: row.pin_locked_until,
      createdAt: row.created_at,
    };
  }

  _mapWalletFromDb(row) {
    return {
      id: row.id,
      userId: row.user_id,
      upiId: row.upi_id,
      balancePaise: Number(row.balance_paise || 0),
      heldPaise: Number(row.held_paise || 0),
      dailySpentPaise: Number(row.daily_spent_paise || 0),
      dailyResetDate: row.daily_reset_date,
      currency: row.currency || 'INR',
      isFrozen: Boolean(row.is_frozen),
      createdAt: row.created_at,
    };
  }

  _mapTransactionFromDb(row, originalTx = {}) {
    return {
      id: row.id,
      utr: row.utr,
      senderUserId: row.sender_user_id,
      senderName: row.sender_name,
      senderUpiId: row.sender_upi_id,
      receiverUserId: row.receiver_user_id,
      receiverName: row.receiver_name,
      receiverUpiId: row.receiver_upi_id,
      amountPaise: Number(row.amount_paise || 0),
      currency: row.currency || 'INR',
      note: row.note,
      status: row.status,
      stepUpRequired: row.step_up_required,
      stepUpCompleted: row.step_up_completed,
      heldAt: row.held_at,
      releasedAt: row.released_at,
      idempotencyKey: row.idempotency_key,
      blockHash: row.block_hash,
      previousBlockHash: row.previous_block_hash,
      risk: originalTx.risk || {
        score: row.status === 'blocked' ? 95 : row.status === 'held' ? 72 : 5,
        level: row.status === 'blocked' ? 'critical' : row.status === 'held' ? 'high' : 'low',
        action: row.status === 'blocked' ? 'block' : row.status === 'held' ? 'hold' : 'allow',
      },
      ai: originalTx.ai || { status: 'skipped', source: 'none', verdict: null },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
