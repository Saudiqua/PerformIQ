# PerformIQ - Multi-Tenant SaaS Backend

A production-ready Node.js + TypeScript Express backend for a multi-tenant SaaS application with Slack and Gmail integrations.

## Features

- **Multi-tenant architecture** with organization-based data isolation
- **Supabase Auth** integration for JWT-based authentication
- **Slack integration** - OAuth connect, message sync from channels (7-day backfill)
- **Gmail integration** - OAuth connect, email sync (7-day backfill)
- **Outlook/Teams/Zoom** - OAuth scaffolded, sync not yet implemented
- **AES-256-GCM encryption** for all OAuth tokens at rest
- **Scheduled sync jobs** - runs every 15 minutes via node-cron
- **Rate limiting** and centralized error handling
- **Pino logging** with token redaction

## Tech Stack

- Node.js 20+
- Express 4.x
- TypeScript 5.x
- Supabase (Postgres + Auth)
- Zod for validation
- Pino for logging
- node-cron for scheduled jobs
- undici for HTTP requests

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor
3. Copy the contents of `src/db/schema.sql` and execute it
4. Copy your project URL and service role key to `.env`

### 4. Configure OAuth Apps

**Slack:**
1. Create an app at https://api.slack.com/apps
2. Add OAuth scopes: `channels:history`, `channels:read`, `groups:history`, `groups:read`, `im:history`, `im:read`, `mpim:history`, `mpim:read`, `users:read`, `team:read`
3. Set redirect URL to `{APP_BASE_URL}/oauth/slack/callback`

**Gmail:**
1. Create a project at https://console.cloud.google.com
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add scope: `https://www.googleapis.com/auth/gmail.readonly`
5. Set redirect URL to `{APP_BASE_URL}/oauth/gmail/callback`

### 5. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add the output to `ENCRYPTION_KEY_BASE64` in your `.env` file.

### 6. Run the Server

```bash
npm run dev
```

## API Endpoints

### Health Check

```bash
curl http://localhost:5000/health
# Response: {"ok":true}
```

### List Integrations

```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     http://localhost:5000/api/integrations
```

### Connect Slack

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     http://localhost:5000/api/integrations/slack/connect
# Response: {"url":"https://slack.com/oauth/v2/authorize?..."}
```

### OAuth Callback (handled by browser redirect)

```
GET /oauth/slack/callback?code=XXX&state=YYY
```

### Trigger Manual Sync

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     http://localhost:5000/api/admin/jobs/run
```

### Get Sync Status

```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     http://localhost:5000/api/admin/jobs/status
```

### Query Events

```bash
# Basic query
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     "http://localhost:5000/api/events"

# With filters
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     "http://localhost:5000/api/events?provider=slack&type=message_event&limit=20"

# With date range
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "X-Org-Id: YOUR_ORG_UUID" \
     "http://localhost:5000/api/events?from=2024-01-01T00:00:00Z&to=2024-12-31T23:59:59Z"
```

## Project Structure

```
src/
├── index.ts                 # Entry point
├── app.ts                   # Express app setup
├── config/
│   ├── env.ts              # Environment validation
│   ├── logger.ts           # Pino logger
│   └── supabase.ts         # Supabase client
├── middleware/
│   ├── auth.ts             # JWT authentication
│   ├── org.ts              # Organization validation
│   ├── rateLimit.ts        # Rate limiting
│   └── errorHandler.ts     # Error handling
├── routes/
│   ├── health.ts           # Health check
│   ├── integrations.ts     # Integration management
│   ├── oauth.ts            # OAuth callbacks
│   ├── events.ts           # Event queries
│   └── admin.ts            # Admin operations
├── integrations/
│   ├── common/
│   │   ├── providerTypes.ts
│   │   └── normalizeCommon.ts
│   ├── oauthState.ts       # OAuth state management
│   └── providers/
│       ├── slack/
│       ├── gmail/
│       ├── msgraph/
│       └── zoom/
├── jobs/
│   ├── jobRunner.ts        # Cron scheduler
│   └── jobs.ts             # Sync job logic
├── db/
│   ├── schema.sql          # Database schema
│   └── migrations.md       # Migration history
└── utils/
    ├── crypto.ts           # AES-256-GCM encryption
    ├── http.ts             # HTTP client
    └── time.ts             # Time utilities
```

## Database Tables

- `orgs` - Organizations
- `app_users` - User accounts
- `org_members` - Organization membership
- `integrations` - Connected integrations per org
- `integration_accounts` - OAuth tokens (encrypted)
- `external_identities` - External user mapping
- `raw_events` - Raw provider payloads
- `events` - Normalized events
- `sync_state` - Sync progress tracking
- `audit_log` - Audit trail

## Security

- All OAuth tokens encrypted with AES-256-GCM
- Tokens never logged (pino redaction)
- JWT validation on all protected routes
- Organization-level data isolation
- Rate limiting on API endpoints

## Development

```bash
# Start with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## License

ISC
