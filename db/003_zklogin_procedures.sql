-- ================================
--  STORED PROCEDURES: zkLogin Operations
-- ================================

-- ================================
--  SALT MANAGEMENT PROCEDURES
-- ================================

-- Generate or retrieve user salt
CREATE OR REPLACE FUNCTION public.get_or_create_user_salt(
    p_iss TEXT,
    p_aud TEXT,
    p_sub TEXT,
    p_provider VARCHAR(50),
    p_app_id TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    salt_value TEXT,
    user_identifier TEXT,
    is_new_user BOOLEAN
) AS $$
DECLARE
    v_user_identifier TEXT;
    v_salt_value TEXT;
    v_sub_hash TEXT;
    v_is_new_user BOOLEAN := FALSE;
BEGIN
    -- Create user identifier from iss+aud+sub
    v_sub_hash := encode(digest(p_sub, 'sha256'), 'hex');
    v_user_identifier := encode(digest(p_iss || '|' || p_aud || '|' || v_sub_hash, 'sha256'), 'hex');
    
    -- Try to get existing salt
    SELECT us.salt_value INTO v_salt_value
    FROM public.user_salts us
    WHERE us.user_identifier = v_user_identifier
      AND us.is_active = TRUE;
    
    -- If not found, create new salt
    IF v_salt_value IS NULL THEN
        v_salt_value := encode(gen_random_bytes(32), 'hex');
        v_is_new_user := TRUE;
        
        INSERT INTO public.user_salts (
            user_identifier, salt_value, provider, app_id, 
            iss, aud, sub_hash, created_at, last_used
        ) VALUES (
            v_user_identifier, v_salt_value, p_provider, p_app_id,
            p_iss, p_aud, v_sub_hash, NOW(), NOW()
        );
        
        -- Log salt generation
        INSERT INTO public.auth_audit_log (
            user_identifier, event_type, provider, ip_address, user_agent,
            success, metadata
        ) VALUES (
            v_user_identifier, 'salt_generated', p_provider, p_ip_address, p_user_agent,
            TRUE, jsonb_build_object('is_new_user', v_is_new_user)
        );
    ELSE
        -- Update last_used timestamp
        UPDATE public.user_salts 
        SET last_used = NOW() 
        WHERE user_identifier = v_user_identifier;
        
        -- Log salt retrieval
        INSERT INTO public.auth_audit_log (
            user_identifier, event_type, provider, ip_address, user_agent,
            success, metadata
        ) VALUES (
            v_user_identifier, 'salt_retrieved', p_provider, p_ip_address, p_user_agent,
            TRUE, jsonb_build_object('is_new_user', v_is_new_user)
        );
    END IF;
    
    RETURN QUERY SELECT v_salt_value, v_user_identifier, v_is_new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  SESSION MANAGEMENT PROCEDURES
-- ================================

-- Create new user session
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_identifier TEXT,
    p_ephemeral_public_key TEXT,
    p_ephemeral_private_key_encrypted TEXT,
    p_max_epoch BIGINT,
    p_jwt_token_encrypted TEXT,
    p_jwt_randomness TEXT,
    p_session_duration_hours INTEGER DEFAULT 24,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    session_id TEXT,
    expires_at TIMESTAMPTZ,
    success BOOLEAN
) AS $$
DECLARE
    v_session_id TEXT;
    v_expires_at TIMESTAMPTZ;
    v_provider VARCHAR(50);
BEGIN
    -- Generate session ID
    v_session_id := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + (p_session_duration_hours || ' hours')::INTERVAL;
    
    -- Get provider for logging
    SELECT us.provider INTO v_provider
    FROM public.user_salts us
    WHERE us.user_identifier = p_user_identifier;
    
    -- Create session
    INSERT INTO public.user_sessions (
        session_id, user_identifier, ephemeral_public_key, ephemeral_private_key_encrypted,
        max_epoch, jwt_token_encrypted, jwt_randomness, expires_at, created_at, last_activity
    ) VALUES (
        v_session_id, p_user_identifier, p_ephemeral_public_key, p_ephemeral_private_key_encrypted,
        p_max_epoch, p_jwt_token_encrypted, p_jwt_randomness, v_expires_at, NOW(), NOW()
    );
    
    -- Log session creation
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, ip_address, user_agent,
        success, metadata
    ) VALUES (
        p_user_identifier, 'session_created', v_provider, p_ip_address, p_user_agent,
        TRUE, jsonb_build_object('session_id', v_session_id, 'max_epoch', p_max_epoch)
    );
    
    RETURN QUERY SELECT v_session_id, v_expires_at, TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO public.auth_audit_log (
            user_identifier, event_type, provider, ip_address, user_agent,
            success, error_message, metadata
        ) VALUES (
            p_user_identifier, 'error_occurred', v_provider, p_ip_address, p_user_agent,
            FALSE, SQLERRM, jsonb_build_object('function', 'create_user_session')
        );
        
        RETURN QUERY SELECT NULL::TEXT, NULL::TIMESTAMPTZ, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate and retrieve session
CREATE OR REPLACE FUNCTION public.validate_user_session(
    p_session_id TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    user_identifier TEXT,
    ephemeral_public_key TEXT,
    ephemeral_private_key_encrypted TEXT,
    max_epoch BIGINT,
    jwt_token_encrypted TEXT,
    jwt_randomness TEXT,
    zk_proof TEXT,
    is_valid BOOLEAN
) AS $$
DECLARE
    v_user_identifier TEXT;
    v_provider VARCHAR(50);
    v_session_record RECORD;
BEGIN
    -- Get session details
    SELECT s.*, us.provider INTO v_session_record, v_provider
    FROM public.user_sessions s
    JOIN public.user_salts us ON s.user_identifier = us.user_identifier
    WHERE s.session_id = p_session_id
      AND s.is_active = TRUE
      AND s.expires_at > NOW()
      AND s.max_epoch > extract(epoch from now());
    
    IF v_session_record IS NULL THEN
        -- Log invalid session attempt
        INSERT INTO public.auth_audit_log (
            user_identifier, event_type, provider, ip_address, user_agent,
            success, metadata
        ) VALUES (
            NULL, 'error_occurred', NULL, p_ip_address, p_user_agent,
            FALSE, jsonb_build_object('error', 'invalid_session', 'session_id', p_session_id)
        );
        
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
    ELSE
        -- Update last activity
        UPDATE public.user_sessions 
        SET last_activity = NOW() 
        WHERE session_id = p_session_id;
        
        RETURN QUERY SELECT 
            v_session_record.user_identifier,
            v_session_record.ephemeral_public_key,
            v_session_record.ephemeral_private_key_encrypted,
            v_session_record.max_epoch,
            v_session_record.jwt_token_encrypted,
            v_session_record.jwt_randomness,
            v_session_record.zk_proof,
            TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update ZK proof in session
CREATE OR REPLACE FUNCTION public.update_session_zk_proof(
    p_session_id TEXT,
    p_zk_proof TEXT,
    p_proof_expires_at TIMESTAMPTZ,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_identifier TEXT;
    v_provider VARCHAR(50);
BEGIN
    -- Get user identifier and provider
    SELECT s.user_identifier, us.provider INTO v_user_identifier, v_provider
    FROM public.user_sessions s
    JOIN public.user_salts us ON s.user_identifier = us.user_identifier
    WHERE s.session_id = p_session_id
      AND s.is_active = TRUE;
    
    IF v_user_identifier IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update ZK proof
    UPDATE public.user_sessions 
    SET zk_proof = p_zk_proof, 
        proof_expires_at = p_proof_expires_at,
        last_activity = NOW()
    WHERE session_id = p_session_id;
    
    -- Log proof generation
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, ip_address, user_agent,
        success, metadata
    ) VALUES (
        v_user_identifier, 'proof_generated', v_provider, p_ip_address, p_user_agent,
        TRUE, jsonb_build_object('session_id', p_session_id, 'proof_expires_at', p_proof_expires_at)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  ADDRESS MANAGEMENT PROCEDURES
-- ================================

-- Store derived zkLogin address
CREATE OR REPLACE FUNCTION public.store_user_address(
    p_user_identifier TEXT,
    p_sui_address TEXT,
    p_address_derivation_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.user_addresses (
        user_identifier, sui_address, address_derivation_data, created_at, last_used
    ) VALUES (
        p_user_identifier, p_sui_address, p_address_derivation_data, NOW(), NOW()
    )
    ON CONFLICT (user_identifier, sui_address) 
    DO UPDATE SET 
        last_used = NOW(),
        address_derivation_data = p_address_derivation_data;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user address
CREATE OR REPLACE FUNCTION public.get_user_address(
    p_user_identifier TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_sui_address TEXT;
BEGIN
    SELECT sui_address INTO v_sui_address
    FROM public.user_addresses
    WHERE user_identifier = p_user_identifier
    ORDER BY last_used DESC
    LIMIT 1;
    
    -- Update last_used if found
    IF v_sui_address IS NOT NULL THEN
        UPDATE public.user_addresses 
        SET last_used = NOW() 
        WHERE user_identifier = p_user_identifier 
          AND sui_address = v_sui_address;
    END IF;
    
    RETURN v_sui_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  CLEANUP AND MAINTENANCE PROCEDURES
-- ================================

-- Cleanup expired sessions and data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS TABLE(
    expired_sessions INTEGER,
    expired_proofs INTEGER,
    old_audit_logs INTEGER
) AS $$
DECLARE
    v_expired_sessions INTEGER;
    v_expired_proofs INTEGER;
    v_old_audit_logs INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW() OR max_epoch < extract(epoch from now());
    GET DIAGNOSTICS v_expired_sessions = ROW_COUNT;
    
    -- Clear expired ZK proofs
    UPDATE public.user_sessions 
    SET zk_proof = NULL, proof_expires_at = NULL
    WHERE proof_expires_at < NOW();
    GET DIAGNOSTICS v_expired_proofs = ROW_COUNT;
    
    -- Delete old audit logs (older than 90 days)
    DELETE FROM public.auth_audit_log 
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_old_audit_logs = ROW_COUNT;
    
    RETURN QUERY SELECT v_expired_sessions, v_expired_proofs, v_old_audit_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deactivate user account
CREATE OR REPLACE FUNCTION public.deactivate_user_account(
    p_user_identifier TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_provider VARCHAR(50);
BEGIN
    -- Get provider for logging
    SELECT provider INTO v_provider
    FROM public.user_salts
    WHERE user_identifier = p_user_identifier;
    
    IF v_provider IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Deactivate user salt
    UPDATE public.user_salts 
    SET is_active = FALSE 
    WHERE user_identifier = p_user_identifier;
    
    -- Deactivate all sessions
    UPDATE public.user_sessions 
    SET is_active = FALSE 
    WHERE user_identifier = p_user_identifier;
    
    -- Log deactivation
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, success, metadata
    ) VALUES (
        p_user_identifier, 'account_deactivated', v_provider, TRUE,
        jsonb_build_object('reason', p_reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  JWK MANAGEMENT PROCEDURES
-- ================================

-- Update provider JWK
CREATE OR REPLACE FUNCTION public.update_provider_jwk(
    p_provider VARCHAR(50),
    p_kid TEXT,
    p_jwk_data JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.provider_jwks (
        provider, kid, jwk_data, expires_at, created_at, updated_at
    ) VALUES (
        p_provider, p_kid, p_jwk_data, p_expires_at, NOW(), NOW()
    )
    ON CONFLICT (provider, kid) 
    DO UPDATE SET 
        jwk_data = p_jwk_data,
        expires_at = p_expires_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get provider JWK
CREATE OR REPLACE FUNCTION public.get_provider_jwk(
    p_provider VARCHAR(50),
    p_kid TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_jwk_data JSONB;
BEGIN
    SELECT jwk_data INTO v_jwk_data
    FROM public.provider_jwks
    WHERE provider = p_provider
      AND kid = p_kid
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_jwk_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  AUDIT AND MONITORING PROCEDURES
-- ================================

-- Log authentication event
CREATE OR REPLACE FUNCTION public.log_auth_event(
    p_user_identifier TEXT,
    p_event_type VARCHAR(50),
    p_provider VARCHAR(50),
    p_ip_address INET,
    p_user_agent TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, ip_address, user_agent,
        success, error_message, metadata, created_at
    ) VALUES (
        p_user_identifier, p_event_type, p_provider, p_ip_address, p_user_agent,
        p_success, p_error_message, p_metadata, NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(
    p_user_identifier TEXT,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    event_type VARCHAR(50),
    event_count BIGINT,
    last_occurrence TIMESTAMPTZ,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.event_type,
        COUNT(*) as event_count,
        MAX(al.created_at) as last_occurrence,
        ROUND(
            (COUNT(*) FILTER (WHERE al.success = TRUE))::NUMERIC / COUNT(*) * 100, 2
        ) as success_rate
    FROM public.auth_audit_log al
    WHERE al.user_identifier = p_user_identifier
      AND al.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY al.event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 