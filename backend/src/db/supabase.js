import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

/**
 * Normalizes the Supabase URL by stripping any accidental trailing paths
 * such as /rest/v1 or trailing slashes.
 */
export function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

/**
 * Checks if Supabase credentials are validly configured.
 */
export function isSupabaseConfigured() {
  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return Boolean(url && key && url.startsWith('http') && key.length >= 20);
}

/**
 * Initializes and returns the singleton Supabase client.
 * Returns null if Supabase is not configured (allowing in-memory test fallback in dev/test mode).
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    if (env.NODE_ENV === 'production') {
      throw new Error('FATAL: Supabase configuration missing (SUPABASE_URL or SUPABASE_SECRET_KEY) in production environment.');
    }
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    logger.info(`Supabase client initialized successfully for target: ${url}`);
    return supabaseClient;
  } catch (err) {
    logger.error(`Failed to initialize Supabase client: ${err.message}`);
    if (env.NODE_ENV === 'production') {
      throw err;
    }
    return null;
  }
}
