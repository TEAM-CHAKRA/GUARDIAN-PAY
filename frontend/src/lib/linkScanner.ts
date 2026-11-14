// GUARDIANPAY - Link Security & Threat Analysis Engine (Universal: Node.js & Browser)

export interface ThreatIndicator {
  key: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

export interface LinkAnalysisResult {
  success: boolean;
  url: string;
  isValid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'warn' | 'block';
  indicators: ThreatIndicator[];
  explanation: string;
  safeMessage: string;
  analyzedAt: string;
  verificationToken: string | null;
}

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

function checkSsrf(parsed: URL): { isSsrf: boolean; indicator?: ThreatIndicator } {
  const host = parsed.hostname.toLowerCase();

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

  const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const octet1 = parseInt(ipMatch[1], 10);
    const octet2 = parseInt(ipMatch[2], 10);

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

function checkBrandImpersonation(hostname: string): ThreatIndicator | null {
  const officialDomains = ['guardianpay.internal', 'guardianpay.in', 'npci.org.in', 'rzp.io', 'razorpay.com'];
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

function generateExplanation(url: string, score: number, action: string, indicators: ThreatIndicator[]) {
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

function generateVerificationToken(url: string, score: number, action: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = JSON.stringify({ url, score, action, expiresAt });
  if (typeof btoa !== 'undefined') {
    return `${btoa(payload)}.v2_${Math.random().toString(36).slice(2, 10)}`;
  }
  return `${Buffer.from(payload).toString('base64url')}.v2_${Math.random().toString(36).slice(2, 10)}`;
}

export function analyzeLink(rawUrl: string): LinkAnalysisResult {
  const analysisTime = new Date().toISOString();
  const cleanUrl = String(rawUrl || '').trim();

  let parsed: URL;
  try {
    parsed = new URL(cleanUrl);
  } catch {
    return {
      success: true,
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

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      success: true,
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

  const indicators: ThreatIndicator[] = [];
  let score = 0;

  // SSRF check
  const ssrfCheck = checkSsrf(parsed);
  if (ssrfCheck.isSsrf && ssrfCheck.indicator) {
    indicators.push(ssrfCheck.indicator);
    score = 100;
  }

  // Embedded credentials check
  if (parsed.username || parsed.password) {
    indicators.push({
      key: 'embedded_credentials',
      severity: 'critical',
      label: 'Embedded Authentication Credentials',
      description: 'URL contains embedded username or password credentials designed to deceive browsers.',
    });
    score = Math.max(score, 90);
  }

  // Dangerous extension check
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

  // Brand Impersonation Check
  const hostnameLower = parsed.hostname.toLowerCase();
  const brandImp = checkBrandImpersonation(hostnameLower);
  if (brandImp) {
    indicators.push(brandImp);
    score = Math.max(score, 85);
  }

  // Suspicious TLD
  const tld = hostnameLower.split('.').pop() || '';
  if (SUSPICIOUS_TLDS.has(tld)) {
    indicators.push({
      key: 'suspicious_tld',
      severity: 'high',
      label: `High-Risk Top-Level Domain (.${tld})`,
      description: `The top-level domain '.${tld}' is statistically associated with high rates of phishing and malware delivery.`,
    });
    score += 25;
  }

  // URL Shorteners
  if (URL_SHORTENERS.has(hostnameLower)) {
    indicators.push({
      key: 'url_shortener',
      severity: 'medium',
      label: 'URL Redirection Shortener',
      description: 'URL utilizes a shortening service that deliberately obscures the destination server.',
    });
    score += 40;
  }

  // Phishing keywords in path or query
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

  // Excessive subdomain depth
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

  const finalScore = Math.min(100, score);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let action: 'allow' | 'warn' | 'block' = 'allow';
  if (finalScore >= 70) {
    riskLevel = 'critical';
    action = 'block';
  } else if (finalScore >= 30) {
    riskLevel = finalScore >= 50 ? 'high' : 'medium';
    action = 'warn';
  }

  const { explanation, safeMessage } = generateExplanation(cleanUrl, finalScore, action, indicators);
  const verificationToken = generateVerificationToken(cleanUrl, finalScore, action);

  return {
    success: true,
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

export function validateVerificationToken(token: string): { valid: boolean; url?: string; action?: string; score?: number; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is missing' };
  }
  try {
    const parts = token.split('.');
    const b64 = parts[0];
    let jsonStr = '';
    if (typeof atob !== 'undefined') {
      jsonStr = atob(b64);
    } else {
      jsonStr = Buffer.from(b64, 'base64url').toString('utf8');
    }
    const data = JSON.parse(jsonStr);
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return { valid: false, error: 'Verification token has expired. Please rescan the link.' };
    }
    return { valid: true, url: data.url, action: data.action, score: data.score };
  } catch {
    return { valid: false, error: 'Invalid verification token signature' };
  }
}
