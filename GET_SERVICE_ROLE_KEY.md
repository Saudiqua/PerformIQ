# 🔑 How to Get Your Supabase Service Role Key

## The Issue

Your API authentication is failing because the backend needs the **service role key** to validate user tokens.

## Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
Go to: **https://supabase.com/dashboard/project/brnaxuizukscigenouyd/settings/api**

### Step 2: Copy the Service Role Key
- Scroll to the **Project API keys** section
- Find the key labeled **`service_role`** with tag `secret`
- Click the copy icon (👁️ eye icon to reveal, then copy)
- ⚠️ **This is a secret key** - don't share it publicly!

### Step 3: Add to .env File
Open `/tmp/cc-agent/62018284/project/.env` and update this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-key-here
```

### Step 4: Restart Dev Server
The server should auto-restart, or manually restart it.

## What This Key Does

- **Anon Key** (already configured): Used by the frontend, has limited RLS permissions
- **Service Role Key** (missing): Used by the backend to validate user tokens, bypasses RLS

The backend uses the service role key to call `supabase.auth.getUser(token)` to verify that the Bearer token sent by the frontend is valid.

## Expected Result

After adding the key:
- ✅ Dashboard loads without "API Authentication Required" error
- ✅ Integration cards show connection status
- ✅ Events display correctly
- ✅ Network tab shows API requests returning 200 instead of 401

## Diagnostic

Run this to check configuration:
```bash
node verify-env.cjs
```

Current status:
- Frontend env vars: ✅ Configured
- Backend Supabase URL: ✅ Configured
- Backend service role key: ❌ **MISSING**

## Security Note

The service role key should **NEVER** be exposed to the frontend or committed to public repositories. It's only used server-side in the backend API.
