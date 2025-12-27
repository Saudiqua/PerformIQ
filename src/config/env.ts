import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  APP_BASE_URL: z.string().min(1),
  ENCRYPTION_KEY_BASE64: z.string().min(1),
  
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
    
    return {
      PORT: process.env.PORT || '5000',
      NODE_ENV: 'development' as const,
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:5000',
      ENCRYPTION_KEY_BASE64: process.env.ENCRYPTION_KEY_BASE64 || '',
      SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
      SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
      SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      MS_CLIENT_ID: process.env.MS_CLIENT_ID,
      MS_CLIENT_SECRET: process.env.MS_CLIENT_SECRET,
      MS_REDIRECT_URI: process.env.MS_REDIRECT_URI,
      ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
      ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
      ZOOM_REDIRECT_URI: process.env.ZOOM_REDIRECT_URI,
    };
  }
  
  return result.data;
}

export const env = loadEnv();
