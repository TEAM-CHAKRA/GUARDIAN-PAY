import { getKolkataDateString } from '../config/limits.js';
import { ERROR_CODES, TRANSACTION_STATUS } from '../config/constants.js';
import { env } from '../config/env.js';
import { isSupabaseConfigured } from '../db/supabase.js';
import { SupabaseRepository } from './supabaseRepository.js';
import { logger } from '../utils/logger.js';

function deepClone(data) {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

export class MemoryRepository {
  constructor() {
    this.users = new Map(); // id -> user
    this.usersByEmail = new Map(); // email.toLowerCase() -> id
    this.usersByUpiId = new Map(); // upiId.toLowerCase() -> id

    this.wallets = new Map(); // userId -> wallet
    this.transactions = new Map(); // id -> transaction
    this.idempotency = new Map(); // `${userId}:${key}` -> record
    this.auditLog = []; // array of sequential audit entries
    this.revokedSessions = new Set(); // set of jti strings

    // Concurrency mutex queue for atomic transfers
    this.transferMutex = Promise.resolve();
  }

  // ================= USERS & SESSIONS =================

  async createUser(user) {
    const cloned = deepClone(user);
    this.users.set(cloned.id, cloned);
    this.usersByEmail.set(cloned.email.toLowerCase(), cloned.id);
    this.usersByUpiId.set(cloned.upiId.toLowerCase(), cloned.id);
    return deepClone(cloned);
  }

  async getUserById(id) {
    const user = this.users.get(id);
    return user ? deepClone(user) : null;
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.getUserById(id) : null;
  }

  async getUserByUpiId(upiId) {
    if (!upiId) return null;
    const id = this.usersByUpiId.get(upiId.toLowerCase());
    return id ? this.getUserById(id) : null;
  }

  async listUsers() {
    return Array.from(this.users.values()).map(deepClone);
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...deepClone(updates) };
    this.users.set(id, updated);
    return deepClone(updated);
  }

  async createSession(jti, data = {}) {
    // Session is active unless revoked
    return true;
  }

  async isSessionRevoked(jti) {
    return this.revokedSessions.has(jti);
  }

  async revokeSession(jti) {
    this.revokedSessions.add(jti);
    return true;
  }

  // ================= WALLETS =================

  async createWallet(wallet) {
    const cloned = deepClone(wallet);
    this.wallets.set(cloned.userId, cloned);
    return deepClone(cloned);
  }

  async getWallet(userId) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;

    // Check Kolkata midnight daily rollover
    const todayKolkata = getKolkataDateString();
    if (wallet.dailyResetDate !== todayKolkata) {
      wallet.dailySpentPaise = 0;
      wallet.dailyResetDate = todayKolkata;
      this.wallets.set(userId, wallet);
    }

    return deepClone(wallet);
  }

  async updateWallet(userId, updates) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;
    const updated = { ...wallet, ...deepClone(updates) };
    this.wallets.set(userId, updated);
    return deepClone(updated);
  }

  // ================= ATOMIC TRANSFER MUTEX =================

  async executeTransfer({ transaction, mode }) {
    // Queue atomic operation behind promise chain to serialize concurrent writes
    return new Promise((resolve, reject) => {
      this.transferMutex = this.transferMutex
        .then(async () => {
          try {
            const result = await this._executeTransferLocked({ transaction, mode });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async _executeTransferLocked({ transaction, mode }) {
    const senderWallet = this.wallets.get(transaction.senderUserId);
    const receiverWallet = transaction.receiverUserId
      ? this.wallets.get(transaction.receiverUserId)
      : null;

    const amount = transaction.amountPaise;
    const todayKolkata = getKolkataDateString();

    // Ensure daily reset
    if (senderWallet && senderWallet.dailyResetDate !== todayKolkata) {
      senderWallet.dailySpentPaise = 0;
      senderWallet.dailyResetDate = todayKolkata;
    }

    if (mode === 'settle') {
      if (!senderWallet) {
        throw new Error(ERROR_CODES.NOT_FOUND);
      }
      if (senderWallet.balancePaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }
      if (!receiverWallet) {
        throw new Error(ERROR_CODES.RECEIVER_NOT_FOUND);
      }

      // Atomic Balance Mutation
      senderWallet.balancePaise -= amount;
      senderWallet.dailySpentPaise += amount;
      receiverWallet.balancePaise += amount;

      // Update Transaction
      transaction.status = TRANSACTION_STATUS.SUCCESS;
      transaction.updatedAt = new Date().toISOString();
      this.transactions.set(transaction.id, deepClone(transaction));

      return {
        transaction: deepClone(transaction),
        senderWallet: deepClone(senderWallet),
        receiverWallet: deepClone(receiverWallet),
      };
    }

    if (mode === 'hold') {
      if (!senderWallet) {
        throw new Error(ERROR_CODES.NOT_FOUND);
      }
      if (senderWallet.balancePaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }

      // Reserve funds in held bucket
      senderWallet.balancePaise -= amount;
      senderWallet.heldPaise += amount;
      senderWallet.dailySpentPaise += amount;

      transaction.status = TRANSACTION_STATUS.HELD;
      transaction.updatedAt = new Date().toISOString();
      this.transactions.set(transaction.id, deepClone(transaction));

      return {
        transaction: deepClone(transaction),
        senderWallet: deepClone(senderWallet),
      };
    }

    if (mode === 'release_to_receiver') {
      if (!senderWallet || !receiverWallet) {
        throw new Error(ERROR_CODES.NOT_FOUND);
      }
      if (senderWallet.heldPaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }

      // Release reserved funds to recipient
      senderWallet.heldPaise -= amount;
      receiverWallet.balancePaise += amount;

      transaction.status = TRANSACTION_STATUS.SUCCESS;
      transaction.updatedAt = new Date().toISOString();
      this.transactions.set(transaction.id, deepClone(transaction));

      return {
        transaction: deepClone(transaction),
        senderWallet: deepClone(senderWallet),
        receiverWallet: deepClone(receiverWallet),
      };
    }

    if (mode === 'return_to_sender') {
      if (!senderWallet) {
        throw new Error(ERROR_CODES.NOT_FOUND);
      }
      if (senderWallet.heldPaise < amount) {
        throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
      }

      // Refund held funds back to sender balance
      senderWallet.heldPaise -= amount;
      senderWallet.balancePaise += amount;
      // Reverse from daily spent
      senderWallet.dailySpentPaise = Math.max(0, senderWallet.dailySpentPaise - amount);

      transaction.status = TRANSACTION_STATUS.REVERSED;
      transaction.updatedAt = new Date().toISOString();
      this.transactions.set(transaction.id, deepClone(transaction));

      return {
        transaction: deepClone(transaction),
        senderWallet: deepClone(senderWallet),
      };
    }

    throw new Error(`Invalid transfer mode: ${mode}`);
  }

  // ================= TRANSACTIONS =================

  async createTransaction(record) {
    const cloned = deepClone(record);
    this.transactions.set(cloned.id, cloned);
    return deepClone(cloned);
  }

  async getTransaction(id) {
    const txn = this.transactions.get(id);
    return txn ? deepClone(txn) : null;
  }

  async updateTransaction(id, updates) {
    const txn = this.transactions.get(id);
    if (!txn) return null;
    const updated = { ...txn, ...deepClone(updates), updatedAt: new Date().toISOString() };
    this.transactions.set(id, updated);
    return deepClone(updated);
  }

  async listTransactionsByUser(userId, { limit = 50, status } = {}) {
    const list = Array.from(this.transactions.values()).filter(
      (t) => t.senderUserId === userId || t.receiverUserId === userId
    );

    let filtered = list;
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deepClone(filtered.slice(0, limit));
  }

  async listTransactions({ status, limit = 50 } = {}) {
    let list = Array.from(this.transactions.values());
    if (status) {
      list = list.filter((t) => t.status === status);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deepClone(list.slice(0, limit));
  }

  // ================= IDEMPOTENCY =================

  async getIdempotencyRecord(userId, key) {
    const compositeKey = `${userId}:${key}`;
    const record = this.idempotency.get(compositeKey);
    if (!record) return null;

    // Check 24hr TTL
    if (Date.now() - record.createdAt > 24 * 60 * 60 * 1000) {
      this.idempotency.delete(compositeKey);
      return null;
    }
    return deepClone(record);
  }

  async saveIdempotencyRecord(userId, key, { payloadHash, response, status = 'completed' }) {
    const compositeKey = `${userId}:${key}`;
    const record = {
      userId,
      key,
      payloadHash,
      response: deepClone(response),
      status,
      createdAt: Date.now(),
    };
    this.idempotency.set(compositeKey, record);
    return deepClone(record);
  }

  async deleteIdempotencyRecord(userId, key) {
    const compositeKey = `${userId}:${key}`;
    this.idempotency.delete(compositeKey);
    return true;
  }

  // ================= AUDIT CHAIN =================

  async appendAudit(entry) {
    const cloned = deepClone(entry);
    this.auditLog.push(cloned);
    return deepClone(cloned);
  }

  async listAudit({ limit = 50 } = {}) {
    return deepClone(this.auditLog.slice(-limit));
  }

  async getLastAudit() {
    if (this.auditLog.length === 0) return null;
    return deepClone(this.auditLog[this.auditLog.length - 1]);
  }

  async tamperAudit(seq, fakeData = { tampered: true }) {
    const entry = this.auditLog.find((e) => e.seq === seq);
    if (!entry) return null;
    entry.data = { ...entry.data, ...fakeData };
    return deepClone(entry);
  }
}

export { SupabaseRepository };

export class AdaptiveRepository {
  constructor() {
    this.memoryRepo = new MemoryRepository();
    this.supabaseRepo = isSupabaseConfigured() ? new SupabaseRepository() : null;
    this.strictMode = env.STORAGE_ENGINE === 'supabase';
    this._tablesMissingWarned = false;
    this._tablesNotYetDeployed = false;

    // Expose memory structures for demo seed resets and test assertions
    this.users = this.memoryRepo.users;
    this.usersByEmail = this.memoryRepo.usersByEmail;
    this.usersByUpiId = this.memoryRepo.usersByUpiId;
    this.wallets = this.memoryRepo.wallets;
    this.transactions = this.memoryRepo.transactions;
    this.idempotency = this.memoryRepo.idempotency;
    this.auditLog = this.memoryRepo.auditLog;
    this.revokedSessions = this.memoryRepo.revokedSessions;
  }

  get isUsingSupabase() {
    return Boolean(this.supabaseRepo && env.STORAGE_ENGINE !== 'memory');
  }

  async _execute(opName, supabaseAction, memoryAction) {
    if (this._tablesNotYetDeployed && !this.strictMode) {
      return await memoryAction();
    }

    if (this.isUsingSupabase && this.supabaseRepo) {
      try {
        const result = await supabaseAction();
        return result;
      } catch (err) {
        const isTableMissing =
          err.message?.includes('PGRST205') ||
          err.message?.includes('schema cache') ||
          err.message?.includes('relation') ||
          err.message?.includes('does not exist');

        if (this.strictMode && !isTableMissing) {
          throw err;
        }

        if (isTableMissing) {
          this._tablesNotYetDeployed = true;
          if (!this._tablesMissingWarned) {
            this._tablesMissingWarned = true;
            logger.warn(
              `[Supabase] Database table missing for ${opName}. ` +
              'Please execute backend/supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor. ' +
              'Serving operation using in-memory store fallback.'
            );
          }
        }

        if (this.strictMode && isTableMissing) {
          throw new Error(`Supabase table missing for ${opName}. Please run migrations: ${err.message}`);
        }

        // Graceful fallback to memory repository
        return await memoryAction();
      }
    }
    return await memoryAction();
  }

  // ================= USERS & SESSIONS =================

  async createUser(user) {
    // Keep memory cache populated
    await this.memoryRepo.createUser(user);
    return this._execute(
      'createUser',
      () => this.supabaseRepo.createUser(user),
      () => this.memoryRepo.getUserById(user.id)
    );
  }

  async getUserById(id) {
    return this._execute(
      'getUserById',
      async () => {
        const user = await this.supabaseRepo.getUserById(id);
        if (user) return user;
        // Check memory if not found in DB
        return this.memoryRepo.getUserById(id);
      },
      () => this.memoryRepo.getUserById(id)
    );
  }

  async getUserByEmail(email) {
    return this._execute(
      'getUserByEmail',
      async () => {
        const user = await this.supabaseRepo.getUserByEmail(email);
        if (user) return user;
        return this.memoryRepo.getUserByEmail(email);
      },
      () => this.memoryRepo.getUserByEmail(email)
    );
  }

  async getUserByUpiId(upiId) {
    return this._execute(
      'getUserByUpiId',
      async () => {
        const user = await this.supabaseRepo.getUserByUpiId(upiId);
        if (user) return user;
        return this.memoryRepo.getUserByUpiId(upiId);
      },
      () => this.memoryRepo.getUserByUpiId(upiId)
    );
  }

  async listUsers() {
    return this._execute(
      'listUsers',
      async () => {
        const users = await this.supabaseRepo.listUsers();
        if (users && users.length > 0) return users;
        return this.memoryRepo.listUsers();
      },
      () => this.memoryRepo.listUsers()
    );
  }

  async updateUser(id, updates) {
    await this.memoryRepo.updateUser(id, updates);
    return this._execute(
      'updateUser',
      () => this.supabaseRepo.updateUser(id, updates),
      () => this.memoryRepo.getUserById(id)
    );
  }

  async createSession(jti, data = {}) {
    await this.memoryRepo.createSession(jti, data);
    return this._execute(
      'createSession',
      () => this.supabaseRepo.createSession(jti, data),
      () => true
    );
  }

  async isSessionRevoked(jti) {
    return this._execute(
      'isSessionRevoked',
      () => this.supabaseRepo.isSessionRevoked(jti),
      () => this.memoryRepo.isSessionRevoked(jti)
    );
  }

  async revokeSession(jti) {
    await this.memoryRepo.revokeSession(jti);
    return this._execute(
      'revokeSession',
      () => this.supabaseRepo.revokeSession(jti),
      () => true
    );
  }

  // ================= WALLETS =================

  async createWallet(wallet) {
    await this.memoryRepo.createWallet(wallet);
    return this._execute(
      'createWallet',
      () => this.supabaseRepo.createWallet(wallet),
      () => this.memoryRepo.getWallet(wallet.userId)
    );
  }

  async getWallet(userId) {
    return this._execute(
      'getWallet',
      async () => {
        const wallet = await this.supabaseRepo.getWallet(userId);
        if (wallet) return wallet;
        return this.memoryRepo.getWallet(userId);
      },
      () => this.memoryRepo.getWallet(userId)
    );
  }

  async updateWallet(userId, updates) {
    await this.memoryRepo.updateWallet(userId, updates);
    return this._execute(
      'updateWallet',
      () => this.supabaseRepo.updateWallet(userId, updates),
      () => this.memoryRepo.getWallet(userId)
    );
  }

  // ================= ATOMIC TRANSFER =================

  async executeTransfer({ transaction, mode }) {
    return this._execute(
      'executeTransfer',
      () => this.supabaseRepo.executeTransfer({ transaction, mode }),
      () => this.memoryRepo.executeTransfer({ transaction, mode })
    );
  }

  // ================= TRANSACTIONS =================

  async createTransaction(record) {
    await this.memoryRepo.createTransaction(record);
    return this._execute(
      'createTransaction',
      () => this.supabaseRepo.createTransaction(record),
      () => this.memoryRepo.getTransaction(record.id)
    );
  }

  async getTransaction(id) {
    return this._execute(
      'getTransaction',
      async () => {
        const txn = await this.supabaseRepo.getTransaction(id);
        if (txn) return txn;
        return this.memoryRepo.getTransaction(id);
      },
      () => this.memoryRepo.getTransaction(id)
    );
  }

  async updateTransaction(id, updates) {
    await this.memoryRepo.updateTransaction(id, updates);
    return this._execute(
      'updateTransaction',
      () => this.supabaseRepo.updateTransaction(id, updates),
      () => this.memoryRepo.getTransaction(id)
    );
  }

  async listTransactionsByUser(userId, options = {}) {
    return this._execute(
      'listTransactionsByUser',
      async () => {
        const list = await this.supabaseRepo.listTransactionsByUser(userId, options);
        if (list && list.length > 0) return list;
        return this.memoryRepo.listTransactionsByUser(userId, options);
      },
      () => this.memoryRepo.listTransactionsByUser(userId, options)
    );
  }

  async listTransactions(options = {}) {
    return this._execute(
      'listTransactions',
      async () => {
        const list = await this.supabaseRepo.listTransactions(options);
        if (list && list.length > 0) return list;
        return this.memoryRepo.listTransactions(options);
      },
      () => this.memoryRepo.listTransactions(options)
    );
  }

  // ================= IDEMPOTENCY =================

  async getIdempotencyRecord(userId, key) {
    return this._execute(
      'getIdempotencyRecord',
      async () => {
        const rec = await this.supabaseRepo.getIdempotencyRecord(userId, key);
        if (rec) return rec;
        return this.memoryRepo.getIdempotencyRecord(userId, key);
      },
      () => this.memoryRepo.getIdempotencyRecord(userId, key)
    );
  }

  async saveIdempotencyRecord(userId, key, data) {
    await this.memoryRepo.saveIdempotencyRecord(userId, key, data);
    return this._execute(
      'saveIdempotencyRecord',
      () => this.supabaseRepo.saveIdempotencyRecord(userId, key, data),
      () => this.memoryRepo.getIdempotencyRecord(userId, key)
    );
  }

  async deleteIdempotencyRecord(userId, key) {
    await this.memoryRepo.deleteIdempotencyRecord(userId, key);
    return this._execute(
      'deleteIdempotencyRecord',
      () => this.supabaseRepo.deleteIdempotencyRecord(userId, key),
      () => true
    );
  }

  // ================= AUDIT CHAIN =================

  async appendAudit(entry) {
    await this.memoryRepo.appendAudit(entry);
    return this._execute(
      'appendAudit',
      () => this.supabaseRepo.appendAudit(entry),
      () => entry
    );
  }

  async listAudit(options = {}) {
    return this.memoryRepo.listAudit(options);
  }

  async getLastAudit() {
    return this.memoryRepo.getLastAudit();
  }

  async tamperAudit(seq, fakeData = { tampered: true }) {
    return this.memoryRepo.tamperAudit(seq, fakeData);
  }
}

export function createRepository() {
  if (env.STORAGE_ENGINE === 'memory') {
    return new MemoryRepository();
  }
  return new AdaptiveRepository();
}

export const repository = createRepository();
