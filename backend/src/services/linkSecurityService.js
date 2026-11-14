import crypto from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const SUSPICIOUS_TLDS = new Set([
  'top',
  'xyz',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'work',
  'click',
  'buzz',
  'fit',
  'surf',
  'loan',
  'date',
  'racing',
  'download',
  'link',
]);

const BRAND_KEYWORDS = [
  'guardianpay',
  'paytm',
  'phonepe',
  'googlepay',
  'gpay',
  'bhim',
  'sbi',
  'hdfc',
  'icici',
  'axis',
  'rbi',
  'npci',
];

const PHISHING_SUBSTRINGS = [
  'login',
  'verify',
  'kyc',
  'update',
  'secure',
  'account',
  'support',
  'claim',
  'reward',
  'refund',
  'cashback',
  'lottery',
  'pin',
  'otp',
];

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'ow.ly',
  'buff.ly',
]);

const DANGEROUS_EXTENSIONS = new Set([
  '.apk',
  '.exe',
  '.msi',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.scr',
  '.jar',
  '.pif',
]);

export class LinkSecurityService {
  constructor() {
    this.hmacSecret = env.INTEGRITY_HMAC_KEY || env.JWT_SECRET || 'guardianpay-link-secret-2026';
  }

  /**
   * Evaluates security posture of a destination URL
   * @param {string} rawUrl - Untrusted URL input
   * @returns {Promise<Object>} Detailed risk result and verification token
   */
  async analyzeLink(rawUrl) {
    const analysisTime = new Date().toISOString();
    const cleanUrl = String(rawUrl || '').trim();

    // 1. Syntactic Validation
    let parsed;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      return {
        url: cleanUrl,
        isValid: false,
        riskScore: 100,
        riskLevel: 'critical',
        action: 'block',
        indicators: [
          {
            key: 'invalid_url_syntax',
            severity: 'critical',
            label: 'Malformed URL Syntax',
            description: 'The supplied destination cannot be parsed as a valid uniform resource locator.',
          },
        ],
        explanation: 'Invalid URL formatting indicates a potentially obfuscated or broken malicious address.',
        safeMessage: 'Do not click or open this link. The address is corrupted and unsafe.',
        analyzedAt: analysisTime,
        verificationToken: null,
      };
    }

    // 2. Protocol Validation (HTTP/HTTPS only)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        url: cleanUrl,
        isValid: false,
        riskScore: 100,
        riskLevel: 'critical',
        action: 'block',
        indicators: [
          {
            key: 'unsupported_protocol',
            severity: 'critical',
            label: 'Prohibited Protocol Scheme',
            description: `Scheme '${parsed.protocol}' is forbidden. Only secure HTTP/HTTPS destinations are permitted.`,
          },
        ],
        explanation: `Non-web schemes like '${parsed.protocol}' can trigger remote script execution or local protocol handlers.`,
        safeMessage: 'Blocked prohibited URL protocol.',
        analyzedAt: analysisTime,
        verificationToken: null,
      };
    }

    const indicators = [];
    let score = 0;

    // 3. SSRF & Internal IP / Localhost Checks
    const ssrfCheck = this._checkSsrf(parsed);
    if (ssrfCheck.isSsrf) {
      indicators.push(ssrfCheck.indicator);
      score = 100;
    }

    // 4. Embedded Credentials Check (e.g. http://admin:pass@evil.com)
    if (parsed.username || parsed.password) {
      indicators.push({
        key: 'embedded_credentials',
        severity: 'critical',
        label: 'Embedded Authentication Credentials',
        description: 'URL contains embedded username or password credentials designed to deceive browsers.',
      });
      score = Math.max(score, 90);
    }

    // 5. Dangerous Executable / Package Download Check
    const pathnameLower = parsed.pathname.toLowerCase();
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (pathnameLower.endsWith(ext)) {
        indicators.push({
          key: 'dangerous_extension',
          severity: 'critical',
          label: 'Direct Dangerous Binary Download',
          description: `URL points directly to an executable binary or installation package (${ext}).`,
        });
        score = Math.max(score, 95);
        break;
      }
    }

    // 6. Brand Impersonation & Typosquatting Check
    const hostnameLower = parsed.hostname.toLowerCase();
    const brandImp = this._checkBrandImpersonation(hostnameLower);
    if (brandImp) {
      indicators.push(brandImp);
      score = Math.max(score, 85);
    }

    // 7. Suspicious Top-Level Domain (TLD)
    const tld = hostnameLower.split('.').pop();
    if (SUSPICIOUS_TLDS.has(tld)) {
      indicators.push({
        key: 'suspicious_tld',
        severity: 'high',
        label: `High-Risk Top-Level Domain (.${tld})`,
        description: `The top-level domain '.${tld}' is statistically associated with high rates of phishing and malware delivery.`,
      });
      score += 25;
    }

    // 8. URL Shorteners
    if (URL_SHORTENERS.has(hostnameLower)) {
      indicators.push({
        key: 'url_shortener',
        severity: 'medium',
        label: 'URL Redirection Shortener',
        description: 'URL utilizes a shortening service that deliberately obscures the destination server.',
      });
      score += 40;
    }

    // 9. Phishing Keywords in Path or Query
    const fullPathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
    const matchedPathKeywords = PHISHING_SUBSTRINGS.filter((k) => fullPathAndQuery.includes(k));
    if (matchedPathKeywords.length >= 2) {
      indicators.push({
        key: 'phishing_path_keywords',
        severity: 'high',
        label: 'Phishing Keywords in Path',
        description: `Path/query contains multiple high-risk credential solicitation tokens: [${matchedPathKeywords.join(', ')}].`,
      });
      score += 35;
    } else if (matchedPathKeywords.length === 1) {
      score += 15;
    }

    // 10. Excessive Subdomain / Depth Check
    const hostParts = hostnameLower.split('.');
    if (hostParts.length >= 5) {
      indicators.push({
        key: 'excessive_subdomains',
        severity: 'medium',
        label: 'Excessive Subdomain Depth',
        description: 'Deeply nested subdomains are commonly employed to evade reputation scanners.',
      });
      score += 20;
    }

    // Cap score at 100
    const finalScore = Math.min(100, score);

    // Map to Policy Action
    let riskLevel = 'low';
    let action = 'allow';
    if (finalScore >= 70) {
      riskLevel = 'critical';
      action = 'block';
    } else if (finalScore >= 30) {
      riskLevel = finalScore >= 50 ? 'high' : 'medium';
      action = 'warn';
    }

    // Generate Safe User-Facing Message and Explanation
    const { explanation, safeMessage } = this._generateExplanation(cleanUrl, finalScore, action, indicators);

    // Generate short-lived cryptographic verification token (valid for 5 minutes)
    const verificationToken = this._generateVerificationToken(cleanUrl, finalScore, action);

    return {
      url: cleanUrl,
      isValid: true,
      normalizedUrl: parsed.toString(),
      hostname: parsed.hostname,
      protocol: parsed.protocol,
      riskScore: finalScore,
      riskLevel,
      action,
      indicators,
      explanation,
      safeMessage,
      analyzedAt: analysisTime,
      verificationToken,
    };
  }

  /**
   * SSRF & Private Network / Cloud Metadata Detection
   */
  _checkSsrf(parsed) {
    const host = parsed.hostname.toLowerCase();

    // Localhost / Loopback / Wildcard
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost')
    ) {
      return {
        isSsrf: true,
        indicator: {
          key: 'ssrf_localhost_target',
          severity: 'critical',
          label: 'Loopback / Localhost Target (SSRF Blocked)',
          description: 'URL targets the local machine loopback address. Internal navigation blocked.',
        },
      };
    }

    // Cloud Metadata Services
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host === 'instance-data' ||
      host.includes('metadata.google')
    ) {
      return {
        isSsrf: true,
        indicator: {
          key: 'ssrf_cloud_metadata',
          severity: 'critical',
          label: 'Cloud Metadata Infrastructure Target (SSRF Blocked)',
          description: 'URL attempts to probe hypervisor cloud instance metadata.',
        },
      };
    }

    // IPv4 Decimal / Octal / Hex representations (e.g. 2130706433 or 0177.0.0.1)
    if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
      return {
        isSsrf: true,
        indicator: {
          key: 'ssrf_obfuscated_ip',
          severity: 'critical',
          label: 'Obfuscated Integer/Hex IP Format (SSRF Blocked)',
          description: 'URL uses raw numeric or hexadecimal IP representation to bypass filters.',
        },
      };
    }

    // IPv4 Private CIDR Blocks
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (octet1 === 10) {
        return {
          isSsrf: true,
          indicator: {
            key: 'ssrf_private_class_a',
            severity: 'critical',
            label: 'Private RFC 1918 Class A Subnet (10.0.0.0/8)',
            description: 'URL targets an unroutable private corporate intranet network.',
          },
        };
      }

      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return {
          isSsrf: true,
          indicator: {
            key: 'ssrf_private_class_b',
            severity: 'critical',
            label: 'Private RFC 1918 Class B Subnet (172.16.0.0/12)',
            description: 'URL targets an unroutable private intranet network.',
          },
        };
      }

      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) {
        return {
          isSsrf: true,
          indicator: {
            key: 'ssrf_private_class_c',
            severity: 'critical',
            label: 'Private RFC 1918 Class C Subnet (192.168.0.0/16)',
            description: 'URL targets a local router or residential private network.',
          },
        };
      }

      // 127.0.0.0/8 loopback subnet
      if (octet1 === 127) {
        return {
          isSsrf: true,
          indicator: {
            key: 'ssrf_loopback_subnet',
            severity: 'critical',
            label: 'Loopback Subnet (127.0.0.0/8)',
            description: 'URL targets internal loopback space.',
          },
        };
      }

      // 169.254.0.0/16 Link-Local
      if (octet1 === 169 && octet2 === 254) {
        return {
          isSsrf: true,
          indicator: {
            key: 'ssrf_link_local',
            severity: 'critical',
            label: 'Link-Local Address (169.254.0.0/16)',
            description: 'URL targets link-local configuration space.',
          },
        };
      }
    }

    return { isSsrf: false };
  }

  /**
   * Deceptive Brand Impersonation / Typosquatting Detection
   */
  _checkBrandImpersonation(hostname) {
    // Whitelisted official domains
    const officialDomains = ['guardianpay.internal', 'guardianpay.in', 'npci.org.in'];
    if (officialDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return null;
    }

    for (const brand of BRAND_KEYWORDS) {
      if (hostname.includes(brand)) {
        for (const sub of PHISHING_SUBSTRINGS) {
          if (hostname.includes(sub)) {
            return {
              key: 'brand_impersonation',
              severity: 'critical',
              label: `Deceptive Brand Typosquatting (${brand.toUpperCase()})`,
              description: `Domain '${hostname}' combines trusted financial trademark '${brand}' with suspicious credential solicitation string '${sub}'.`,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Generates Human-Readable Security Explanation and Guidance
   */
  _generateExplanation(url, score, action, indicators) {
    if (action === 'block') {
      const topIssue = indicators[0]?.label || 'Severe security violation';
      return {
        explanation: `GUARDIANPAY Shield intercepted this link due to critical threat detection: ${topIssue}.`,
        safeMessage: 'DANGER: Access to this destination has been blocked to protect your credentials and assets.',
      };
    }

    if (action === 'warn') {
      const reasons = indicators.map((i) => i.label).join(', ');
      return {
        explanation: `GUARDIANPAY Shield flagged suspicious characteristics on this destination: ${reasons}. Proceed with caution.`,
        safeMessage: 'WARNING: This payment link exhibits deceptive or obscured traits. Verify recipient identity before proceeding.',
      };
    }

    return {
      explanation: 'No malicious indicators or spoofing patterns were detected. Destination conforms to baseline web standards.',
      safeMessage: 'VERIFIED: Destination passed automated structural threat checks.',
    };
  }

  /**
   * Generates a Cryptographic HMAC Verification Token (valid for 5 minutes)
   */
  _generateVerificationToken(url, score, action) {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const payload = JSON.stringify({
      url,
      score,
      action,
      expiresAt,
    });

    const b64Payload = Buffer.from(payload).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(b64Payload)
      .digest('hex');

    return `${b64Payload}.${signature}`;
  }

  /**
   * Validates a Verification Token for Safe Redirection
   */
  validateVerificationToken(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is missing or malformed' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token structure' };
    }

    const [b64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(b64Payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return { valid: false, error: 'Token signature verification failed' };
    }

    let payload;
    try {
      const decoded = Buffer.from(b64Payload, 'base64url').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return { valid: false, error: 'Token payload cannot be parsed' };
    }

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Token has expired' };
    }

    if (payload.action === 'block') {
      return { valid: false, error: 'Navigation to blocked destinations is strictly prohibited' };
    }

    return {
      valid: true,
      url: payload.url,
      score: payload.score,
      action: payload.action,
    };
  }
}

export const linkSecurityService = new LinkSecurityService();
