import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DEMO_MODE: z.string().transform((v) => v === 'true').default('true'),
  JWT_SECRET: z.string().min(16).default('guardianpay-super-secure-jwt-secret-key-32chars-min!'),
  INTEGRITY_HMAC_KEY: z.string().default('guardianpay-hmac-sha256-integrity-key-32chars!'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
  STORAGE_ENGINE: z.enum(['supabase', 'memory', 'auto']).default('auto'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SECRET_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  MAX_TXN_PAISE: z.coerce.number().default(5000000), // 50,000 INR
  MAX_DAILY_PAISE: z.coerce.number().default(10000000), // 1,00,000 INR
});

export const env = envSchema.parse(process.env);
