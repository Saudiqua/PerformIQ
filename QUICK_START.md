# Quick Start: Add Service Role Key

## You're 95% done! Just one step remaining:

### 1. Go to Supabase Dashboard
https://supabase.com/dashboard/project/brnaxuizukscigenouyd/settings/api

### 2. Copy the "service_role" Key
- Scroll to "Project API keys"
- Find key labeled `service_role` (marked `secret`)
- Click eye icon (👁️) to reveal
- Copy the entire key

### 3. Add to .env File
Edit `/tmp/cc-agent/62018284/project/.env` line 10:
```bash
SUPABASE_SERVICE_ROLE_KEY=paste-your-key-here
```

### 4. Restart
Server should auto-restart. If not:
```bash
npm run dev
```

### 5. Verify
- Dashboard loads without errors
- Dev Diagnostics panel shows green checkmarks
- API calls return 200 OK

---

**Full details:** See `AUTH_SETUP_STATUS.md`

**Get service key:** See `GET_SERVICE_ROLE_KEY.md`
