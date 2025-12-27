# Database Migrations

## How to Apply Schema

1. Open Supabase Dashboard for your project
2. Go to SQL Editor
3. Copy the contents of `schema.sql`
4. Execute the SQL

## Migration History

### v1.0.0 - Initial Schema (2024-12-27)
- Created all initial tables:
  - `orgs` - Organizations
  - `app_users` - Application users
  - `org_members` - Organization membership
  - `integrations` - Provider integrations at org level
  - `integration_accounts` - Individual account tokens
  - `external_identities` - Map external users
  - `raw_events` - Raw provider payloads
  - `events` - Normalized events
  - `sync_state` - Sync progress tracking
  - `audit_log` - Audit trail

- Created indexes for performance
- Added CHECK constraints for provider enum (slack, gmail, outlook, teams, zoom)
- Added CHECK constraints for event type enum (message_event, email_event, meeting_event, call_event)
- Added updated_at triggers

## Notes

- All IDs are UUIDs
- All tables have created_at timestamps
- Most tables have updated_at with automatic trigger updates
- Provider enum ensures only valid providers are stored
- Event type enum ensures only valid event types are stored
