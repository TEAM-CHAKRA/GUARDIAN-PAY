import crypto from 'node:crypto';
import { repository } from '../store/repository.js';
import { generateId } from '../utils/idGenerator.js';
import { canonicalJson } from '../utils/canonicalJson.js';
import { env } from '../config/env.js';

const GENESIS_HASH = '0'.repeat(64);

class AuditService {
  constructor() {
    this.appendMutex = Promise.resolve();
  }

  /**
   * Serialized audit entry creation with SHA-256 hash chaining.
   */
  async appendAudit({ type, actorId = 'system', subjectId = null, data = {} }) {
    return new Promise((resolve, reject) => {
      this.appendMutex = this.appendMutex
        .then(async () => {
          try {
            const lastEntry = await repository.getLastAudit();
            const seq = lastEntry ? lastEntry.seq + 1 : 1;
            const prevHash = lastEntry ? lastEntry.recordHash : GENESIS_HASH;

            const id = generateId('AUD');
            const ts = new Date().toISOString();

            // Construct entry fields for hashing (excluding calculated hashes)
            const entryPayload = {
              actorId,
              data,
              id,
              prevHash,
              seq,
              subjectId,
              ts,
              type,
            };

            const canonical = canonicalJson(entryPayload);

            // Compute SHA-256 hash over domain separation tag, prevHash, and canonical JSON
            const recordHash = crypto
              .createHash('sha256')
              .update(`guardianpay-audit/v1${prevHash}${canonical}`)
              .digest('hex');

            // Optional HMAC signature for defense-in-depth
            const hmacSignature = env.INTEGRITY_HMAC_KEY
              ? crypto
                  .createHmac('sha256', env.INTEGRITY_HMAC_KEY)
                  .update(recordHash)
                  .digest('hex')
              : null;

            const fullEntry = {
              ...entryPayload,
              canonical,
              recordHash,
              hmacSignature,
            };

            const saved = await repository.appendAudit(fullEntry);
            resolve(saved);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => reject(err));
    });
  }

  async listAudit({ limit = 50 } = {}) {
    return repository.listAudit({ limit });
  }

  /**
   * Recomputes every hash from stored canonical strings and verifies linkage.
   */
  async verifyChain() {
    const entries = await repository.listAudit({ limit: 10000 });
    let prevHash = GENESIS_HASH;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // 1. Check sequence ordering
      if (entry.seq !== i + 1) {
        return {
          valid: false,
          entriesCount: entries.length,
          firstBrokenSeq: entry.seq,
          reason: `Sequence break at entry ${entry.seq}`,
          checkedAt: new Date().toISOString(),
        };
      }

      // 2. Check previous hash linkage
      if (entry.prevHash !== prevHash) {
        return {
          valid: false,
          entriesCount: entries.length,
          firstBrokenSeq: entry.seq,
          reason: `Previous hash mismatch at entry ${entry.seq}`,
          checkedAt: new Date().toISOString(),
        };
      }

      // 3. Recompute canonical hash from entry payload
      const entryPayload = {
        actorId: entry.actorId,
        data: entry.data,
        id: entry.id,
        prevHash: entry.prevHash,
        seq: entry.seq,
        subjectId: entry.subjectId,
        ts: entry.ts,
        type: entry.type,
      };

      const recomputedCanonical = canonicalJson(entryPayload);
      const recomputedHash = crypto
        .createHash('sha256')
        .update(`guardianpay-audit/v1${entry.prevHash}${recomputedCanonical}`)
        .digest('hex');

      if (recomputedHash !== entry.recordHash) {
        return {
          valid: false,
          entriesCount: entries.length,
          firstBrokenSeq: entry.seq,
          reason: `Hash mismatch at entry ${entry.seq} (tampering detected)`,
          checkedAt: new Date().toISOString(),
        };
      }

      // Update chain tracker
      prevHash = entry.recordHash;
    }

    return {
      valid: true,
      entriesCount: entries.length,
      firstBrokenSeq: null,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const auditService = new AuditService();
