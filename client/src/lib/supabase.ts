import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (import.meta.env.DEV) {
  console.log('[Supabase Init]', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
    key: supabaseAnonKey ? 'Present' : 'MISSING',
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Init] Missing required environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'MISSING',
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
