-- PerformIQ Multi-Tenant SaaS Database Schema
-- Provider enum check constraint values: slack, gmail, outlook, teams, zoom
-- Event type enum check constraint values: message_event, email_event, meeting_event, call_event

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App users (Supabase auth users synced here)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS org_members (
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- Integrations (org-level integration settings)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider)
);

-- Integration accounts (individual connected accounts with tokens)
CREATE TABLE IF NOT EXISTS integration_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    external_account_id VARCHAR(255) NOT NULL,
    external_account_email VARCHAR(255),
    token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    refresh_token_present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, external_account_id)
);

-- External identities (mapping external users to internal users)
CREATE TABLE IF NOT EXISTS external_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    external_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, external_user_id)
);

-- Raw events (original payloads from providers)
CREATE TABLE IF NOT EXISTS raw_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    event_type VARCHAR(255) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    external_id VARCHAR(512) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, external_id)
);

-- Normalized events (unified event format)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('message_event', 'email_event', 'meeting_event', 'call_event')),
    occurred_at TIMESTAMPTZ NOT NULL,
    actor_external_id VARCHAR(255),
    actor_email VARCHAR(255),
    channel_or_thread_id VARCHAR(512),
    external_id VARCHAR(512) NOT NULL,
    subject VARCHAR(1000),
    body_preview VARCHAR(2000),
    participants JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, external_id)
);

-- Sync state (tracks cursor/progress for each provider sync)
CREATE TABLE IF NOT EXISTS sync_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'gmail', 'outlook', 'teams', 'zoom')),
    integration_account_id UUID REFERENCES integration_accounts(id) ON DELETE CASCADE,
    cursor TEXT,
    last_synced_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, integration_account_id)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org_provider ON integrations(org_id, provider);
CREATE INDEX IF NOT EXISTS idx_integration_accounts_org ON integration_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_org_provider_occurred ON raw_events(org_id, provider, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_provider_occurred ON events(org_id, provider, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_type_occurred ON events(org_id, type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_state_org_provider ON sync_state(org_id, provider);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_identities_org_provider ON external_identities(org_id, provider);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_orgs_updated_at ON orgs;
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_members_updated_at ON org_members;
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON org_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_accounts_updated_at ON integration_accounts;
CREATE TRIGGER update_integration_accounts_updated_at BEFORE UPDATE ON integration_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_identities_updated_at ON external_identities;
CREATE TRIGGER update_external_identities_updated_at BEFORE UPDATE ON external_identities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_state_updated_at ON sync_state;
CREATE TRIGGER update_sync_state_updated_at BEFORE UPDATE ON sync_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
