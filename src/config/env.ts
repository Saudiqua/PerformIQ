import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  APP_BASE_URL: z.string().default('http://localhost:5000'),
  ENCRYPTION_KEY_BASE64: z.string().optional(),
  
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().optional(),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_REDIRECT_URI: z.string().optional(),
  
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_REDIRECT_URI: z.string().optional(),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  return result.success ? result.data : envSchema.parse({});
}

export const env = loadEnv();

export function isSupabaseConfigured(): boolean {
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isEncryptionConfigured(): boolean {
  return !!(env.ENCRYPTION_KEY_BASE64 && env.ENCRYPTION_KEY_BASE64.length > 0);
}
