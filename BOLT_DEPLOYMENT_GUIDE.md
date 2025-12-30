# Bolt.new Deployment Guide - PerformIQ

## CURRENT STATUS
✅ Build process: Working
✅ Error handling: Implemented
✅ Environment variables: Configured
⚠️ Bolt hosting: Needs verification

## ENVIRONMENT VARIABLE SETUP

### Method 1: Vite Config Injection (CURRENT)
The app now uses `vite.config.mjs` to load env vars from the parent `.env` file and inject them into the build.

**Files:**
- `/client/vite.config.mjs` - Loads vars from parent `/project/.env`
- `/client/.env` - Local override (gitignore exception added)
- `/project/.env` - Main source of truth

**How it works:**
1. Vite's `loadEnv()` reads from parent directory
2. `define` config injects values at build time
3. Values are baked into the JS bundle as static strings

### Method 2: Bolt Environment Variables (RECOMMENDED)
If Bolt.new provides environment variable configuration:

1. Go to Project Settings → Environment Variables
2. Add these variables:
   ```
   VITE_SUPABASE_URL=https://brnaxuizukscigenouyd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybmF4dWl6dWtzY2lnZW5vdXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUzMTUsImV4cCI6MjA4MjY2MTMxNX0.cOXPjF_JZOarfjtQeSfNrNXV1CpL_1V9wF8fJ8ucVlA
   ```
3. Trigger rebuild

## VERIFICATION CHECKLIST

### 1. Check Browser Console (F12)
**Expected output:**
```
[Supabase Init] { url: 'https://brnaxuizuks...', key: 'Present' }
```

**If you see error:**
```
[Supabase Init] Missing required environment variables: { VITE_SUPABASE_URL: 'MISSING' }
```
→ Environment variables not loaded at build time

### 2. Check Network Tab
**Expected:**
- Requests to `brnaxuizukscigenouyd.supabase.co/auth/v1/`
- Response: 200 or 401 (both OK - means connection works)

**If you see:**
- Requests to `placeholder.supabase.co` → Env vars not injected
- CORS errors → Supabase URL or RLS misconfigured
- No requests → App crashed before init

### 3. Check Bundle Contents
Run this in browser console:
```javascript
// Should show the Supabase URL (baked in at build time)
fetch('/assets/index-CfXLCJw5.js')
  .then(r => r.text())
  .then(js => console.log('Env in bundle:', js.includes('brnaxuizuks')))
```

Expected: `Env in bundle: true`

### 4. Visual Check
- ❌ Blank white screen → Check error boundary (shouldn't happen now)
- ✅ "Authentication Error" panel → Env vars not loaded (shows our error UI)
- ✅ Login page → Everything working!

## TROUBLESHOOTING

### "Supabase is not configured" Error

**Cause:** Environment variables not available at build time or runtime

**Solutions:**

1. **Verify build includes env vars:**
   ```bash
   npm run build
   grep -o "brnaxuizuks" dist/public/assets/*.js
   ```
   Should output: `brnaxuizuks`

2. **Check Vite config:**
   - Open `client/vite.config.mjs`
   - Verify `define` section has env var injections
   - Verify `loadEnv(mode, path.resolve(__dirname, '..'), 'VITE_')` loads from parent

3. **Verify parent .env exists:**
   ```bash
   cat .env | grep VITE_SUPABASE
   ```
   Should show both URL and KEY

4. **Manual override:**
   Create `client/.env` with vars (gitignore has exception)

### Blank Screen (Should Not Happen)

If you still see a blank screen:

1. Open DevTools Console → Check for React errors
2. Error boundary should catch and display errors
3. If you see red errors, report them
4. Check Network tab for failed JS bundle loads (404)

### Authentication Fails After Login

**Symptoms:** Login button works, but returns to login page

**Causes:**
1. Supabase RLS policies blocking user read
2. Organizations table missing or empty
3. Auth callback URL misconfigured

**Solutions:**
1. Check Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://your-bolt-domain.bolt.new`
   - Redirect URLs: `https://your-bolt-domain.bolt.new/**`

2. Check Supabase Dashboard → Table Editor:
   - Verify `organizations` table exists
   - Verify `organization_users` table exists
   - Check RLS policies allow authenticated reads

## BUILD COMMANDS

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Manual Client Build (for testing)
```bash
cd client && npx vite build
```

## FILE STRUCTURE
```
/project
├── .env                          # Parent env vars (main source)
├── client/
│   ├── .env                      # Client override (tracked via gitignore exception)
│   ├── vite.config.mjs          # Loads parent .env and injects into build
│   └── src/
│       ├── lib/supabase.ts      # Validates env vars, never crashes
│       ├── components/ErrorBoundary.tsx  # Catches all React errors
│       └── contexts/AuthContext.tsx      # Safe auth initialization
└── dist/public/                 # Built frontend (served by Express)
```

## MONITORING IN PRODUCTION

Watch for these patterns in console/logs:

### Critical Errors
- `[Supabase Init] Missing required environment variables` 🔴
- `[AuthContext] Error in getSession` 🔴
- Multiple error boundary activations 🔴

### Expected Logs (Development Only)
- `[Supabase Init] { url: '...', key: 'Present' }` ✅
- `[AuthContext] Failed to get session: User not found` ⚠️ (OK if not logged in)

### User Experience
- Should NEVER see blank white screen ✅
- Should see error panels with clear messages ✅
- Should see loading states ✅
- Should be able to retry on errors ✅

## NEXT STEPS IF STILL BROKEN

1. **Check Bolt build logs**
   - Look for "VITE_SUPABASE_URL" in logs
   - Verify build succeeds
   - Check for environment variable warnings

2. **Verify Supabase project status**
   - Dashboard: https://supabase.com/dashboard
   - Check project isn't paused
   - Verify URL matches: `https://brnaxuizukscigenouyd.supabase.co`

3. **Test locally**
   ```bash
   npm run dev
   # Should work perfectly if .env files are present
   ```

4. **Check Bolt.new documentation**
   - Look for "Environment Variables" section
   - May need to configure via Bolt UI instead of .env files

5. **Hard refresh browser**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)
   - Clears cached JS bundles

## CONTACT INFO

If issues persist, provide:
1. Screenshot of browser console (F12 → Console tab)
2. Screenshot of Network tab showing failed requests
3. Error message from error boundary
4. Bolt build logs (if accessible)
