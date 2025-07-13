-- ================================
--  SCHEMA: zkLogin Authentication System
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Salts Storage (Critical for zkLogin)
CREATE TABLE public.user_salts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT UNIQUE NOT NULL, -- hash of iss+aud+sub
    salt_value TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'twitch', etc.
    app_id TEXT NOT NULL,
    iss TEXT NOT NULL, -- OAuth issuer
    aud TEXT NOT NULL, -- OAuth audience
    sub_hash TEXT NOT NULL, -- hashed subject identifier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT valid_provider CHECK (provider IN ('google', 'facebook', 'twitch', 'apple', 'slack', 'kakao', 'microsoft'))
);

-- 2. User Sessions (Ephemeral Key Management)
CREATE TABLE public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_identifier TEXT NOT NULL,
    ephemeral_public_key TEXT NOT NULL,
    ephemeral_private_key_encrypted TEXT NOT NULL, -- encrypted storage
    max_epoch BIGINT NOT NULL, -- Sui epoch when session expires
    jwt_token_encrypted TEXT, -- encrypted JWT storage
    jwt_randomness TEXT NOT NULL,
    zk_proof TEXT, -- cached ZK proof
    proof_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- 3. User Addresses (Derived zkLogin addresses)
CREATE TABLE public.user_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    address_derivation_data JSONB NOT NULL, -- kc_name, kc_value, aud_F, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    UNIQUE(user_identifier, sui_address)
);

-- 4. User Preferences and Settings
CREATE TABLE public.user_preferences (
    user_identifier TEXT PRIMARY KEY,
    preferred_provider VARCHAR(50),
    settings JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- 5. Audit Log (Security monitoring)
CREATE TABLE public.auth_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'salt_generated', 'login', 'logout', 'session_expired', etc.
    provider VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'salt_generated', 'salt_retrieved', 'login_started', 'login_completed', 
        'session_created', 'session_expired', 'logout', 'proof_generated', 
        'transaction_signed', 'error_occurred'
    ))
);

-- 6. Provider JWKs Cache (for JWT validation)
CREATE TABLE public.provider_jwks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    kid TEXT NOT NULL, -- key identifier
    jwk_data JSONB NOT NULL, -- complete JWK data
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, kid)
);

-- ================================
--  INDEXES FOR PERFORMANCE
-- ================================

-- User Salts indexes
CREATE INDEX idx_user_salts_identifier ON public.user_salts(user_identifier);
CREATE INDEX idx_user_salts_provider ON public.user_salts(provider);
CREATE INDEX idx_user_salts_active ON public.user_salts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_salts_last_used ON public.user_salts(last_used);

-- User Sessions indexes
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_identifier ON public.user_sessions(user_identifier);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_max_epoch ON public.user_sessions(max_epoch);

-- User Addresses indexes
CREATE INDEX idx_user_addresses_identifier ON public.user_addresses(user_identifier);
CREATE INDEX idx_user_addresses_sui_address ON public.user_addresses(sui_address);
CREATE INDEX idx_user_addresses_last_used ON public.user_addresses(last_used);

-- Audit Log indexes
CREATE INDEX idx_auth_audit_log_user_identifier ON public.auth_audit_log(user_identifier);
CREATE INDEX idx_auth_audit_log_event_type ON public.auth_audit_log(event_type);
CREATE INDEX idx_auth_audit_log_created_at ON public.auth_audit_log(created_at);
CREATE INDEX idx_auth_audit_log_provider ON public.auth_audit_log(provider);

-- Provider JWKs indexes
CREATE INDEX idx_provider_jwks_provider ON public.provider_jwks(provider);
CREATE INDEX idx_provider_jwks_kid ON public.provider_jwks(kid);
CREATE INDEX idx_provider_jwks_expires_at ON public.provider_jwks(expires_at);

-- ================================
--  ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE public.user_salts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_jwks ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS automatically in Supabase)
-- Create policies for authenticated users to access their own data

-- User Salts policies
CREATE POLICY "Users can access their own salts" ON public.user_salts
    FOR ALL USING (auth.uid()::text = user_identifier);

-- User Sessions policies
CREATE POLICY "Users can access their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid()::text = user_identifier);

-- User Addresses policies
CREATE POLICY "Users can access their own addresses" ON public.user_addresses
    FOR ALL USING (auth.uid()::text = user_identifier);

-- User Preferences policies
CREATE POLICY "Users can access their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid()::text = user_identifier);

-- Audit Log policies (read-only for users)
CREATE POLICY "Users can read their own audit logs" ON public.auth_audit_log
    FOR SELECT USING (auth.uid()::text = user_identifier);

-- Provider JWKs policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read JWKs" ON public.provider_jwks
    FOR SELECT USING (auth.role() = 'authenticated');

-- ================================
--  TRIGGERS FOR AUTOMATED TASKS
-- ================================

-- Update last_used timestamp for user_salts
CREATE OR REPLACE FUNCTION update_salt_last_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_salts 
    SET last_used = NOW() 
    WHERE user_identifier = NEW.user_identifier;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salt_last_used
    AFTER INSERT ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_salt_last_used();

-- Update last_activity for sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW() OR max_epoch < extract(epoch from now());
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs periodically (you'll need to set up pg_cron or similar)
-- For now, we'll create a function you can call manually or via cron

-- ================================
--  UTILITY VIEWS
-- ================================

-- Active sessions view
CREATE VIEW public.active_sessions AS
SELECT 
    s.session_id,
    s.user_identifier,
    s.ephemeral_public_key,
    s.max_epoch,
    s.created_at,
    s.expires_at,
    s.last_activity,
    us.provider,
    us.app_id
FROM public.user_sessions s
JOIN public.user_salts us ON s.user_identifier = us.user_identifier
WHERE s.is_active = TRUE 
  AND s.expires_at > NOW()
  AND s.max_epoch > extract(epoch from now());

-- User summary view
CREATE VIEW public.user_summary AS
SELECT 
    us.user_identifier,
    us.provider,
    us.created_at as registered_at,
    us.last_used,
    COUNT(s.id) as active_sessions,
    ua.sui_address,
    up.preferred_provider,
    up.settings
FROM public.user_salts us
LEFT JOIN public.user_sessions s ON us.user_identifier = s.user_identifier 
    AND s.is_active = TRUE 
    AND s.expires_at > NOW()
LEFT JOIN public.user_addresses ua ON us.user_identifier = ua.user_identifier
LEFT JOIN public.user_preferences up ON us.user_identifier = up.user_identifier
WHERE us.is_active = TRUE
GROUP BY us.user_identifier, us.provider, us.created_at, us.last_used, 
         ua.sui_address, up.preferred_provider, up.settings; 