# PerformIQ Setup Guide

This guide will help you set up the PerformIQ integration platform from scratch.

## Prerequisites

- Node.js 20+
- A Supabase account (free tier works)
- OAuth credentials for the integrations you want to use (Slack, Gmail, etc.)

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and wait for setup to complete

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `src/db/schema.sql`
3. Paste into the SQL Editor and click "Run"
4. Wait for all tables, indexes, and triggers to be created

### 1.3 Get Your Credentials

1. Go to Project Settings > API
2. Copy your Project URL (e.g., `https://xxxxx.supabase.co`)
3. Copy your `anon` `public` key
4. Copy your `service_role` `secret` key

## Step 2: Environment Configuration

### 2.1 Backend Environment (.env in root)

Create a `.env` file in the project root:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
APP_BASE_URL=http://localhost:5000
PORT=5000

# Encryption Key (generate with command below)
ENCRYPTION_KEY_BASE64=your-32-byte-key-base64-encoded
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2.2 Frontend Environment (client/.env)

Create a `client/.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: OAuth Provider Setup (Optional)

Configure the integrations you want to use:

### 3.1 Slack

1. Create app at https://api.slack.com/apps
2. Add OAuth scopes: `channels:history`, `channels:read`, `groups:history`, `groups:read`, `im:history`, `im:read`, `mpim:history`, `mpim:read`, `users:read`, `team:read`
3. Set redirect URL to `http://localhost:5000/oauth/slack/callback`
4. Add to `.env`:
```bash
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_REDIRECT_URI=http://localhost:5000/oauth/slack/callback
```

### 3.2 Gmail

1. Create project at https://console.cloud.google.com
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add scope: `https://www.googleapis.com/auth/gmail.readonly`
5. Set redirect URL to `http://localhost:5000/oauth/gmail/callback`
6. Add to `.env`:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/oauth/gmail/callback
```

### 3.3 Microsoft (Outlook/Teams)

1. Register app at https://portal.azure.com
2. Add API permissions for Mail.Read and/or Chat.Read
3. Set redirect URL to `http://localhost:5000/oauth/outlook/callback`
4. Add to `.env`:
```bash
MS_CLIENT_ID=your-client-id
MS_CLIENT_SECRET=your-client-secret
MS_REDIRECT_URI=http://localhost:5000/oauth/outlook/callback
```

### 3.4 Zoom

1. Create app at https://marketplace.zoom.us
2. Configure OAuth
3. Set redirect URL to `http://localhost:5000/oauth/zoom/callback`
4. Add to `.env`:
```bash
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
ZOOM_REDIRECT_URI=http://localhost:5000/oauth/zoom/callback
```

## Step 4: Create Test Organization and User

### 4.1 Create Organization

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO orgs (id, name) VALUES
('your-org-uuid', 'Test Organization')
RETURNING *;
```

Copy the returned UUID for use in Step 5.

### 4.2 Create User Account

1. Start the dev server (see Step 5)
2. Go to http://localhost:5000
3. Click "Sign Up"
4. Create an account with your email and password
5. Check the `app_users` table in Supabase to get your user ID

### 4.3 Add User to Organization

Run this SQL in Supabase:

```sql
-- First, get your user ID from Supabase Auth
-- Go to Authentication > Users and copy the UUID

INSERT INTO app_users (id, email, full_name)
VALUES ('user-uuid-from-auth', 'your-email@example.com', 'Your Name');

INSERT INTO org_members (org_id, user_id, role)
VALUES ('your-org-uuid', 'user-uuid-from-auth', 'admin');
```

## Step 5: Run the Application

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This starts both the backend API (port 5001) and frontend (port 5000).

### Production Build

```bash
npm run build
npm start
```

## Step 6: Use the Application

1. Open http://localhost:5000
2. Sign in with your credentials
3. Enter your organization UUID when prompted
4. You'll see the dashboard with all integrations
5. Click "Connect" on any integration to start OAuth flow
6. Once connected, click "Sync All" to pull data

## Architecture Overview

### Backend (Express + TypeScript)
- `/api/integrations` - List and manage integrations
- `/api/events` - Query normalized events
- `/api/admin/jobs/run` - Trigger manual sync
- `/oauth/:provider/callback` - OAuth callback handler

### Frontend (React + TanStack Query)
- Dashboard with integration cards
- OAuth popup flow
- Real-time event display
- Theme toggle (light/dark)

### Database Tables
- `orgs` - Organizations
- `app_users` - User accounts
- `org_members` - Organization membership
- `integrations` - Connected integrations
- `integration_accounts` - OAuth tokens (encrypted)
- `events` - Normalized events
- `raw_events` - Original provider payloads
- `sync_state` - Sync progress tracking

## Troubleshooting

### OAuth Not Working
- Ensure `ENCRYPTION_KEY_BASE64` is set
- Check Supabase credentials are correct
- Verify OAuth redirect URLs match exactly

### API Returns 401
- Check JWT token is valid
- Ensure user is logged in
- Verify X-Org-Id header is being sent

### No Events Syncing
- Check provider OAuth tokens are valid
- View sync_state table for errors
- Check backend logs for API errors

### Database Connection Failed
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check network connectivity
- Ensure database schema is applied

## Next Steps

- Set up automated sync jobs (every 15 minutes by default)
- Add more team members to your organization
- Connect multiple integration accounts
- Query events via the API
- Build custom dashboards on top of the normalized events
