import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const TACTIC_PATTERNS = [
  {
    key: 'otp_request',
    regex: /\b(share|send|tell|give|enter|provide|verify)\b.{0,40}\b(otp|one[-\s]time\s+password|code)\b|\b(otp|one[-\s]time\s+password)\b/gi,
  },
  {
    key: 'pin_request',
    regex: /\b(upi[-\s]?pin|enter\s+pin|atm\s+pin|secret\s+pin|\bpin\b)\b/gi,
  },
  {
    key: 'urgency',
    regex: /\b(immediate(ly)?|urgent(ly)?|within\s+\d+\s*(mins?|hours?)|account\s+(blocked|suspended)|deactivate(d)?|expire(s)?\s+today)\b/gi,
  },
  {
    key: 'fake_reward',
    regex: /\b(congratulations|won\s+(a\s+)?(lottery|cashback|reward|prize)|claim\s+(your\s+)?(money|cashback|prize)|exclusive\s+gift)\b/gi,
  },
  {
    key: 'refund_scam',
    regex: /\b(refund|overpaid|cashback\s+credited|reverse\s+charge|claim\s+refund)\b/gi,
  },
  {
    key: 'impersonation',
    regex: /\b(rbi|bank\s+manager|income\s+tax|police|customs|customer\s+care|support\s+desk|security\s+team)\b/gi,
  },
  {
    key: 'payment_request',
    regex: /\b(click\s+to\s+pay|scan\s+qr|send\s+money\s+to\s+receive|pay\s+processing\s+fee)\b/gi,
  },
  {
    key: 'suspicious_link',
    regex: /(https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+|t\.me\/[^\s]+)/gi,
  },
];

const scamVerdictSchema = z.object({
  verdict: z.enum(['likely_scam', 'suspicious', 'likely_safe']),
  reasons: z.array(z.string()),
  safeActions: z.array(z.string()),
});

export class ScamAnalyzer {
  async analyzeMessage(message) {
    const rawText = String(message || '').slice(0, 1000);

    // Step 1: Rule-based tactic detection with character offsets
    const { tactics, highlights, extractedIndicators } = this._extractRuleBasedTactics(rawText);

    // Step 2: Determine baseline rule verdict
    const baselineVerdict = this._computeRuleVerdict(tactics);

    // Step 3: AI Review (Groq -> Gemini -> deterministic rule verdict fallback)
    let aiVerdict = null;
    let aiStatus = 'fallback';
    let aiSource = 'rules';

    if (env.GROQ_API_KEY) {
      try {
        const aiResult = await this._callGroqScamReview({
          tactics,
          extractedIndicators,
          redactedExcerpt: this._redactExcerpt(rawText),
        });
        aiVerdict = scamVerdictSchema.parse(aiResult);
        aiStatus = 'completed';
        aiSource = 'groq';
      } catch (err) {
        logger.warn(`Groq scam review fell back: ${err.message}`);
      }
    }

    if (!aiVerdict && env.GEMINI_API_KEY) {
      try {
        const aiResult = await this._callGeminiScamReview({
          tactics,
          extractedIndicators,
          redactedExcerpt: this._redactExcerpt(rawText),
        });
        aiVerdict = scamVerdictSchema.parse(aiResult);
        aiStatus = 'completed';
        aiSource = 'gemini';
      } catch (err) {
        logger.warn(`Gemini scam review fell back to rules: ${err.message}`);
      }
    }

    if (!aiVerdict) {
      aiVerdict = baselineVerdict;
    }

    return {
      verdict: aiVerdict.verdict,
      reasons: aiVerdict.reasons,
      safeActions: aiVerdict.safeActions,
      tactics,
      highlights,
      extractedIndicators,
      aiStatus,
      aiSource,
    };
  }

  // --- Private Extraction & Classification Helpers ---

  _extractRuleBasedTactics(text) {
    const tacticsMap = new Map();
    const highlights = [];

    // Extract links
    const linkMatches = text.match(/(https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+)/gi) || [];
    // Extract phone numbers
    const phoneMatches = text.match(/(\+91[\-\s]?)?[6-9]\d{9}/g) || [];
    // Extract UPI IDs
    const upiMatches = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g) || [];

    for (const tactic of TACTIC_PATTERNS) {
      let match;
      const regex = new RegExp(tactic.regex);
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const phrase = match[0];

        // Ensure non-overlapping highlights
        const overlaps = highlights.some((h) => !(end <= h.start || start >= h.end));
        if (!overlaps) {
          highlights.push({ start, end, phrase, tactic: tactic.key });
        }

        const currentCount = tacticsMap.get(tactic.key) || 0;
        tacticsMap.set(tactic.key, currentCount + 1);
      }
    }

    const tactics = Array.from(tacticsMap.entries()).map(([key, count]) => ({ key, count }));

    return {
      tactics,
      highlights,
      extractedIndicators: {
        links: linkMatches,
        phones: phoneMatches,
        upiIds: upiMatches,
      },
    };
  }

  _computeRuleVerdict(tactics) {
    const hasOtp = tactics.some((t) => t.key === 'otp_request');
    const hasPin = tactics.some((t) => t.key === 'pin_request');
    const hasUrgency = tactics.some((t) => t.key === 'urgency');
    const hasReward = tactics.some((t) => t.key === 'fake_reward');
    const hasLink = tactics.some((t) => t.key === 'suspicious_link');

    if (hasOtp || hasPin || (hasUrgency && hasLink) || (hasReward && hasLink)) {
      return {
        verdict: 'likely_scam',
        reasons: [
          hasOtp ? 'Direct request for secret One-Time Passwords (OTP)' : null,
          hasPin ? 'Direct solicitation of confidential transaction PIN' : null,
          hasUrgency ? 'Manufactured urgency demanding immediate action' : null,
          hasReward ? 'Unsolicited cash reward or prize claim link' : null,
          hasLink ? 'Contains unverified or shortened external hyperlinks' : null,
        ].filter(Boolean),
        safeActions: [
          'Never share your 4 or 6-digit transaction PIN with anyone.',
          'Never forward or paste bank OTP codes.',
          'Do not click shortened or unfamiliar links in unsolicited SMS or chats.',
          'Block the sender immediately and notify cyber crime reporting.',
        ],
      };
    }

    if (tactics.length > 0) {
      return {
        verdict: 'suspicious',
        reasons: tactics.map((t) => `Detected potential tactic indicator: ${t.key.replace(/_/g, ' ')}`),
        safeActions: [
          'Verify the sender identity directly through official published contact numbers.',
          'Do not authorize payment collect requests from unfamiliar sources.',
        ],
      };
    }

    return {
      verdict: 'likely_safe',
      reasons: ['No known social engineering or phishing tactics detected in text.'],
      safeActions: ['Maintain vigilance; verify payment handles before initiating any transfers.'],
    };
  }

  _redactExcerpt(text) {
    return text
      .replace(/(\+91[\-\s]?)?[6-9]\d{9}/g, '[PHONE_REDACTED]')
      .replace(/(https?:\/\/[^\s]+)/gi, '[LINK_REDACTED]')
      .replace(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g, '[UPI_REDACTED]')
      .slice(0, 300);
  }

  async _callGroqScamReview(input, timeoutMs = 6000) {
    const prompt = `You are a cybersecurity fraud detection system specialized in Indian UPI scams, fake prizes, and impersonation.
Analyze the following message metadata and tactics.
Return ONLY valid raw JSON matching this exact structure:
{
  "verdict": "likely_scam" | "suspicious" | "likely_safe",
  "reasons": ["reason 1", "reason 2"],
  "safeActions": ["action 1", "action 2"]
}

Tactics: ${JSON.stringify(input.tactics)}
Indicators: ${JSON.stringify(input.extractedIndicators)}
Redacted Excerpt: "${input.redactedExcerpt}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are an autonomous fraud detection cybersecurity assistant. Return valid raw JSON matching the requested structure only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Groq HTTP ${response.status}: ${errBody.slice(0, 100)}`);
      }

      const json = await response.json();
      const rawText = json?.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('Empty response from Groq');

      return JSON.parse(rawText);
    } finally {
      clearTimeout(timeout);
    }
  }

  async _callGeminiScamReview(input) {
    const prompt = `You are a cybersecurity fraud detection system.
Analyze the following message metadata and tactics.
Return ONLY valid JSON matching this exact structure:
{
  "verdict": "likely_scam" | "suspicious" | "likely_safe",
  "reasons": ["reason 1", "reason 2"],
  "safeActions": ["action 1", "action 2"]
}

Tactics: ${JSON.stringify(input.tactics)}
Indicators: ${JSON.stringify(input.extractedIndicators)}
Redacted Excerpt: "${input.redactedExcerpt}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawText);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const scamAnalyzer = new ScamAnalyzer();
