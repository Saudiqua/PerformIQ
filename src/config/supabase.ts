import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from './logger.js';

let supabase: SupabaseClient;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
} else {
  logger.warn('Supabase credentials not configured - using mock client');
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Not configured' } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Not configured' } }) }), limit: async () => ({ data: [], error: null }) }) }),
      insert: async () => ({ data: null, error: { message: 'Not configured' } }),
      update: async () => ({ data: null, error: { message: 'Not configured' } }),
      upsert: async () => ({ data: null, error: { message: 'Not configured' } }),
      delete: async () => ({ data: null, error: { message: 'Not configured' } }),
    }),
  } as unknown as SupabaseClient;
}

export { supabase };

export async function testConnection(): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Supabase not configured - skipping connection test');
    return false;
  }
  
  try {
    const { error } = await supabase.from('orgs').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, 'Supabase connection test failed');
      return false;
    }
    logger.info('Supabase connection successful');
    return true;
  } catch (err) {
    logger.error({ err }, 'Supabase connection error');
    return false;
  }
}
