import { env } from '../src/config/env.js';

async function testGeminiConnectivity() {
  console.log('Testing Gemini API Connectivity...');
  console.log(`Configured Model: ${env.GEMINI_MODEL}`);

  if (!env.GEMINI_API_KEY) {
    console.log('⚠ GEMINI_API_KEY is not set in .env.');
    console.log('✓ System safely uses deterministic template fallback for all AI explanations.');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with exactly: {"status":"connected"}' }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (response.ok) {
      console.log('✓ Successfully connected to Google Gemini API! Model responded OK.');
    } else {
      console.log(`⚠ Gemini API returned HTTP ${response.status}. Fallback template will be used.`);
    }
  } catch (err) {
    console.log(`⚠ Error reaching Gemini endpoint: ${err.message}. Fallback template will be used.`);
  }
}

testGeminiConnectivity();
