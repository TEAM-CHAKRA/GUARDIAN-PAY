import assert from 'node:assert';
import { linkSecurityService } from '../src/services/linkSecurityService.js';

async function testLinkSecurity() {
  console.log('\n===============================================================');
  console.log('  GUARDIANPAY — PAYMENT LINK SECURITY TEST SUITE');
  console.log('===============================================================\n');

  // Test 1: Clean, valid HTTPS link
  console.log('Testing Clean HTTPS Destination (ALLOW)...');
  const cleanRes = await linkSecurityService.analyzeLink('https://npci.org.in/what-we-do/upi');
  assert.strictEqual(cleanRes.isValid, true);
  assert.strictEqual(cleanRes.action, 'allow');
  assert.ok(cleanRes.riskScore < 30);
  assert.ok(cleanRes.verificationToken, 'Must generate verification token');
  console.log(`✓ Clean destination passed with score ${cleanRes.riskScore} (${cleanRes.action}).`);

  // Test 2: Malformed URL syntax
  console.log('Testing Malformed Syntax (BLOCK)...');
  const malformedRes = await linkSecurityService.analyzeLink('ht!tp://::invalid-domain:::999');
  assert.strictEqual(malformedRes.isValid, false);
  assert.strictEqual(malformedRes.action, 'block');
  assert.strictEqual(malformedRes.riskScore, 100);
  console.log('✓ Malformed URL blocked with score 100.');

  // Test 3: Prohibited protocol scheme
  console.log('Testing Prohibited Protocol Scheme (BLOCK)...');
  const schemeRes = await linkSecurityService.analyzeLink('javascript:alert(document.cookie)');
  assert.strictEqual(schemeRes.action, 'block');
  assert.strictEqual(schemeRes.riskScore, 100);
  console.log('✓ Prohibited scheme blocked with score 100.');

  // Test 4: SSRF Localhost target
  console.log('Testing SSRF Localhost Target (BLOCK)...');
  const localhostRes = await linkSecurityService.analyzeLink('http://127.0.0.1:4000/api/admin/stats');
  assert.strictEqual(localhostRes.action, 'block');
  assert.strictEqual(localhostRes.riskScore, 100);
  assert.ok(localhostRes.indicators.some((i) => i.key.includes('ssrf')));
  console.log('✓ SSRF localhost blocked with score 100.');

  // Test 5: SSRF Private RFC1918 Class C subnet
  console.log('Testing SSRF Private Intranet (192.168.1.1) (BLOCK)...');
  const privateRes = await linkSecurityService.analyzeLink('http://192.168.1.1/admin-panel');
  assert.strictEqual(privateRes.action, 'block');
  assert.strictEqual(privateRes.riskScore, 100);
  assert.ok(privateRes.indicators.some((i) => i.key === 'ssrf_private_class_c'));
  console.log('✓ SSRF private RFC1918 subnet blocked with score 100.');

  // Test 6: SSRF Cloud Instance Metadata
  console.log('Testing SSRF Cloud Metadata Probe (BLOCK)...');
  const metadataRes = await linkSecurityService.analyzeLink('http://169.254.169.254/latest/meta-data/');
  assert.strictEqual(metadataRes.action, 'block');
  assert.strictEqual(metadataRes.riskScore, 100);
  assert.ok(metadataRes.indicators.some((i) => i.key === 'ssrf_cloud_metadata'));
  console.log('✓ SSRF cloud metadata endpoint blocked with score 100.');

  // Test 7: Embedded Credentials Deception
  console.log('Testing Embedded Credentials (BLOCK)...');
  const credsRes = await linkSecurityService.analyzeLink('https://admin:supersecret@attacker-domain.com');
  assert.strictEqual(credsRes.action, 'block');
  assert.ok(credsRes.riskScore >= 90);
  assert.ok(credsRes.indicators.some((i) => i.key === 'embedded_credentials'));
  console.log('✓ Embedded credentials blocked with score 90+.');

  // Test 8: Brand Impersonation / Typosquatting
  console.log('Testing Brand Typosquatting (BLOCK)...');
  const typosquatRes = await linkSecurityService.analyzeLink('https://guardianpay-kyc-verify.top/claim-refund');
  assert.strictEqual(typosquatRes.action, 'block');
  assert.ok(typosquatRes.riskScore >= 85);
  assert.ok(typosquatRes.indicators.some((i) => i.key === 'brand_impersonation'));
  console.log(`✓ Brand typosquatting blocked with score ${typosquatRes.riskScore}.`);

  // Test 9: Dangerous Binary / Android Package Download
  console.log('Testing Dangerous Binary Download (BLOCK)...');
  const binaryRes = await linkSecurityService.analyzeLink('https://bank-rewards-claim.xyz/update-banking-app.apk');
  assert.strictEqual(binaryRes.action, 'block');
  assert.ok(binaryRes.riskScore >= 95);
  assert.ok(binaryRes.indicators.some((i) => i.key === 'dangerous_extension'));
  console.log('✓ APK download blocked with score 95+.');

  // Test 10: URL Shortener
  console.log('Testing URL Shortener Obscuration (WARN)...');
  const shortenerRes = await linkSecurityService.analyzeLink('https://bit.ly/claim-promo-2026');
  assert.strictEqual(shortenerRes.action, 'warn');
  assert.ok(shortenerRes.riskScore >= 30 && shortenerRes.riskScore < 70);
  assert.ok(shortenerRes.indicators.some((i) => i.key === 'url_shortener'));
  console.log(`✓ URL shortener triggered warning with score ${shortenerRes.riskScore}.`);

  // Test 11: Cryptographic Verification Token & Redirect Protection
  console.log('Testing Verification Token Validation & Open Redirect Prevention...');
  // A. Clean token verification
  const validTokenValidation = linkSecurityService.validateVerificationToken(cleanRes.verificationToken);
  assert.strictEqual(validTokenValidation.valid, true);
  assert.strictEqual(validTokenValidation.url, 'https://npci.org.in/what-we-do/upi');

  // B. Tampered token verification
  const tamperedToken = cleanRes.verificationToken.slice(0, -6) + 'abcdef';
  const tamperedValidation = linkSecurityService.validateVerificationToken(tamperedToken);
  assert.strictEqual(tamperedValidation.valid, false, 'Tampered signature must be rejected');

  // C. Blocked destination token validation
  const blockedToken = typosquatRes.verificationToken;
  const blockedValidation = linkSecurityService.validateVerificationToken(blockedToken);
  assert.strictEqual(blockedValidation.valid, false, 'Blocked token navigation must be rejected');

  console.log('✓ Cryptographic token and open-redirect protection verified 100%.\n');
  console.log('===============================================================');
  console.log('  ALL PAYMENT LINK SECURITY TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

testLinkSecurity().catch((err) => {
  console.error('Link security test failed:', err);
  process.exit(1);
});
