# PerformIQ - Multi-Tenant SaaS Integration Platform

## Overview
PerformIQ is a production-ready multi-tenant SaaS backend for communication platform integrations (Slack, Gmail, Outlook, Teams, Zoom). It provides OAuth-based connections, encrypted token storage, scheduled data syncing, and normalized event APIs.

## Current State
- **Status**: Development - Core infrastructure complete
- **Server**: Running on port 5000
- **Database**: Supabase (PostgreSQL) with 10-table schema
- **Auth**: JWT-based via Supabase Auth
- **Providers**: Slack & Gmail fully functional; Outlook/Teams/Zoom OAuth scaffolded

## Technology Stack

### Backend
- Node.js with TypeScript
- Express.js server
- Supabase (PostgreSQL + Auth)
- Zod for validation
- Pino for logging (with token redaction)
- node-cron for scheduled jobs
- undici for HTTP requests

### Security
- AES-256-GCM encryption for OAuth tokens at rest
- JWT authentication on protected routes
- Organization-level data isolation
- Rate limiting (100 requests/minute)
- Graceful degradation when not configured

## Architecture

### Database Schema (10 tables)
- `orgs` - Organizations with Stripe integration fields
- `app_users` - User accounts
- `org_members` - Organization membership (with roles)
- `integrations` - Connected integrations per org
- `integration_accounts` - OAuth tokens (encrypted)
- `external_identities` - External user mapping
- `raw_events` - Raw provider payloads (JSONB)
- `events` - Normalized events with unified schema
- `sync_state` - Sync progress tracking per provider
- `audit_log` - Audit trail for changes

### API Endpoints

#### Public
- GET `/health` - Health check

#### OAuth (rate limited)
- GET `/oauth/:provider/callback` - OAuth callback handler

#### Protected (JWT + Org required)
- GET `/api/integrations` - List connected integrations (includes oauthEnabled flag)
- POST `/api/integrations/:provider/connect` - Get OAuth URL (503 if not configured)
- POST `/api/integrations/:provider/disconnect` - Disconnect integration
- GET `/api/events` - Query normalized events (with filters/pagination)
- POST `/api/admin/jobs/run` - Trigger manual sync
- GET `/api/admin/jobs/status` - Get sync status

### Providers

| Provider | OAuth | Sync | Status |
|----------|-------|------|--------|
| Slack | ✅ | ✅ | Fully functional |
| Gmail | ✅ | ✅ | Fully functional |
| Outlook | ✅ | ❌ | OAuth only |
| Teams | ✅ | ❌ | OAuth only |
| Zoom | ✅ | ❌ | OAuth only |

## Project Structure

```
src/
├── index.ts                 # Entry point
├── app.ts                   # Express app setup
├── config/
│   ├── env.ts              # Environment validation (Zod) with helper functions
│   ├── logger.ts           # Pino logger with redaction
│   └── supabase.ts         # Supabase client (with mock fallback)
├── middleware/
│   ├── auth.ts             # JWT authentication
│   ├── org.ts              # Organization validation
│   ├── rateLimit.ts        # Rate limiting
│   └── errorHandler.ts     # Centralized error handling
├── routes/
│   ├── health.ts           # Health check endpoint
│   ├── integrations.ts     # Integration management (with preflight checks)
│   ├── oauth.ts            # OAuth callbacks (with preflight checks)
│   ├── events.ts           # Event queries
│   └── admin.ts            # Admin operations
├── integrations/
│   ├── common/
│   │   ├── providerTypes.ts    # Type definitions
│   │   └── normalizeCommon.ts  # Shared normalization helpers
│   ├── oauthState.ts       # In-memory OAuth state
│   └── providers/
│       ├── slack/
│       │   ├── slackOAuth.ts
│       │   ├── slackSync.ts
│       │   └── slackNormalize.ts
│       ├── gmail/
│       │   ├── gmailOAuth.ts
│       │   ├── gmailSync.ts
│       │   └── gmailNormalize.ts
│       ├── msgraph/
│       │   ├── msgraphOAuth.ts
│       │   └── msgraphSync.ts (placeholder)
│       └── zoom/
│           ├── zoomOAuth.ts
│           └── zoomSync.ts (placeholder)
├── jobs/
│   ├── jobRunner.ts        # Cron scheduler (15-min intervals)
│   └── jobs.ts             # Sync job orchestration
├── db/
│   └── schema.sql          # Complete database schema
└── utils/
    ├── crypto.ts           # AES-256-GCM encryption with canEncrypt() check
    ├── http.ts             # HTTP client wrapper
    └── time.ts             # Time/date utilities
```

## Environment Variables

All variables are optional in development (graceful degradation):

Required for full functionality:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ENCRYPTION_KEY_BASE64` - 32-byte encryption key (base64)

Optional:
- `APP_BASE_URL` - Application base URL (default: http://localhost:5000)
- `PORT` - Server port (default: 5000)

Provider credentials (at least one pair for testing):
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_REDIRECT_URI`
- `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`

## Key Implementation Details

### Development Mode
- Server starts without credentials using mock Supabase client
- OAuth endpoints return 503 with clear messages when not configured
- Job runner only starts when Supabase is configured
- GET /api/integrations includes `oauthEnabled` flag

### OAuth Flow
1. Client calls POST `/api/integrations/:provider/connect`
2. Server validates encryption/Supabase are configured (503 if not)
3. Server generates state token (10-min expiry, in-memory)
4. Server returns provider OAuth URL with state
5. User completes OAuth in browser
6. Provider redirects to `/oauth/:provider/callback`
7. Server exchanges code for tokens
8. Tokens encrypted and stored in `integration_accounts`
9. `integrations` table updated with status

### Sync Jobs
- Cron runs every 15 minutes (only when Supabase configured)
- Queries all `integration_accounts`
- For each account, runs provider-specific sync
- Stores raw events, normalizes to `events` table
- Updates `sync_state` with progress/errors

### Token Security
- AES-256-GCM encryption with random IV per encryption
- 32-byte key from base64 environment variable
- Tokens never logged (pino redaction patterns)
- Decrypt only when making API calls
- canEncrypt() helper for preflight checks

## Development Notes

### Running the Application
```bash
npm run dev
```

Server starts on port 5000. Without Supabase credentials, uses mock client (logs warning).

### Database Setup
1. Create Supabase project
2. Run `src/db/schema.sql` in SQL editor
3. Configure environment variables

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Recent Changes
*Last updated: December 27, 2025*

### Complete Architectural Rebuild
- Removed previous AI analytics MVP (React dashboards, AI features)
- Built new integration platform architecture from scratch
- Implemented Supabase client with mock fallback for development
- Created 10-table database schema with proper constraints and indexes
- Built OAuth flows for all 5 providers
- Implemented AES-256-GCM encryption for token storage
- Created Slack sync job (7-day backfill with normalization)
- Created Gmail sync job (7-day backfill with normalization)
- Scaffolded Outlook/Teams/Zoom OAuth (sync not yet implemented)
- Deployed scheduled job runner (15-minute cron)
- Created admin API for manual sync triggers
- Created events API with filtering and pagination
- Added rate limiting and centralized error handling

### Configuration Improvements
- Made all env variables optional in development
- Added preflight checks in OAuth routes (503 responses)
- Added isSupabaseConfigured() and canEncrypt() helpers
- Added oauthEnabled flag in integrations response
- Graceful degradation when not fully configured

## Future Enhancements
- Implement Outlook, Teams, and Zoom sync jobs
- Move OAuth state to database for multi-instance support
- Add token refresh handling for expiring tokens
- Implement webhook endpoints for real-time updates
- Add retry logic with exponential backoff for failed syncs
- Database performance optimization with additional indexes
- Frontend admin dashboard to display oauthEnabled status
