-- ================================
--  UTILITY FUNCTIONS: zkLogin System
-- ================================

-- ================================
--  SECURITY AND VALIDATION FUNCTIONS
-- ================================

-- Generate secure user identifier
CREATE OR REPLACE FUNCTION public.generate_user_identifier(
    p_iss TEXT,
    p_aud TEXT,
    p_sub TEXT
)
RETURNS TEXT AS $$
BEGIN
    -- Create deterministic but secure user identifier
    RETURN encode(
        digest(
            p_iss || '|' || p_aud || '|' || encode(digest(p_sub, 'sha256'), 'hex'),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Validate OAuth provider
CREATE OR REPLACE FUNCTION public.validate_oauth_provider(
    p_provider VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_provider IN ('google', 'facebook', 'twitch', 'apple', 'slack', 'kakao', 'microsoft');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Validate JWT format (basic validation)
CREATE OR REPLACE FUNCTION public.validate_jwt_format(
    p_jwt TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_parts TEXT[];
BEGIN
    -- JWT should have 3 parts separated by dots
    v_parts := string_to_array(p_jwt, '.');
    
    IF array_length(v_parts, 1) != 3 THEN
        RETURN FALSE;
    END IF;
    
    -- Basic length validation (each part should be non-empty)
    IF length(v_parts[1]) = 0 OR length(v_parts[2]) = 0 OR length(v_parts[3]) = 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Validate Sui address format
CREATE OR REPLACE FUNCTION public.validate_sui_address(
    p_address TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Sui addresses are 32 bytes hex (64 characters) with 0x prefix
    IF p_address IS NULL OR length(p_address) != 66 THEN
        RETURN FALSE;
    END IF;
    
    IF substring(p_address, 1, 2) != '0x' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if remaining characters are valid hex
    IF substring(p_address, 3) !~ '^[0-9a-fA-F]+$' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Check if epoch is valid (not too far in future)
CREATE OR REPLACE FUNCTION public.validate_epoch(
    p_epoch BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_epoch BIGINT;
    v_max_future_epoch BIGINT;
BEGIN
    v_current_epoch := extract(epoch from now());
    v_max_future_epoch := v_current_epoch + (30 * 24 * 60 * 60); -- 30 days in future
    
    RETURN p_epoch > v_current_epoch AND p_epoch <= v_max_future_epoch;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- ================================
--  ENCRYPTION/DECRYPTION FUNCTIONS
-- ================================

-- Encrypt sensitive data (requires pgp_sym_encrypt from pgcrypto)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
    p_data TEXT,
    p_key TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(p_data, p_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(
    p_encrypted_data TEXT,
    p_key TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(p_encrypted_data, 'base64'), p_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  RATE LIMITING FUNCTIONS
-- ================================

-- Check rate limit for operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_operation VARCHAR(50),
    p_limit_count INTEGER,
    p_time_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_time_window INTERVAL;
BEGIN
    v_time_window := (p_time_window_minutes || ' minutes')::INTERVAL;
    
    SELECT COUNT(*) INTO v_count
    FROM public.auth_audit_log
    WHERE (user_identifier = p_identifier OR ip_address::TEXT = p_identifier)
      AND event_type = p_operation
      AND created_at >= NOW() - v_time_window;
    
    RETURN v_count < p_limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  MAINTENANCE AND MONITORING FUNCTIONS
-- ================================

-- Get system health statistics
CREATE OR REPLACE FUNCTION public.get_system_health_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users_24h BIGINT,
    active_sessions BIGINT,
    failed_logins_24h BIGINT,
    avg_session_duration_hours NUMERIC,
    top_provider VARCHAR(50),
    system_uptime_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(DISTINCT us.user_identifier) as total_users,
            COUNT(DISTINCT CASE WHEN us.last_used >= NOW() - INTERVAL '24 hours' THEN us.user_identifier END) as active_users_24h,
            COUNT(DISTINCT CASE WHEN s.is_active = TRUE AND s.expires_at > NOW() THEN s.id END) as active_sessions,
            COUNT(CASE WHEN al.event_type = 'error_occurred' AND al.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as failed_logins_24h,
            AVG(EXTRACT(EPOCH FROM (COALESCE(s.expires_at, NOW()) - s.created_at)) / 3600) as avg_session_duration_hours,
            mode() WITHIN GROUP (ORDER BY us.provider) as top_provider
        FROM public.user_salts us
        LEFT JOIN public.user_sessions s ON us.user_identifier = s.user_identifier
        LEFT JOIN public.auth_audit_log al ON us.user_identifier = al.user_identifier
        WHERE us.is_active = TRUE
    )
    SELECT 
        s.total_users,
        s.active_users_24h,
        s.active_sessions,
        s.failed_logins_24h,
        ROUND(s.avg_session_duration_hours, 2) as avg_session_duration_hours,
        s.top_provider,
        ROUND(EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(created_at) FROM public.user_salts))) / 3600, 2) as system_uptime_hours
    FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(
    p_user_identifier TEXT
)
RETURNS TABLE(
    total_sessions BIGINT,
    active_sessions BIGINT,
    total_logins BIGINT,
    last_login TIMESTAMPTZ,
    avg_session_duration_hours NUMERIC,
    preferred_provider VARCHAR(50),
    account_age_days INTEGER,
    security_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(s.id) as total_sessions,
        COUNT(CASE WHEN s.is_active = TRUE AND s.expires_at > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN al.event_type = 'login_completed' THEN 1 END) as total_logins,
        MAX(CASE WHEN al.event_type = 'login_completed' THEN al.created_at END) as last_login,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(s.expires_at, NOW()) - s.created_at)) / 3600), 2) as avg_session_duration_hours,
        us.provider as preferred_provider,
        EXTRACT(DAYS FROM (NOW() - us.created_at))::INTEGER as account_age_days,
        CASE 
            WHEN COUNT(CASE WHEN al.event_type = 'error_occurred' THEN 1 END) = 0 THEN 100
            WHEN COUNT(CASE WHEN al.event_type = 'error_occurred' THEN 1 END) < 5 THEN 80
            WHEN COUNT(CASE WHEN al.event_type = 'error_occurred' THEN 1 END) < 10 THEN 60
            ELSE 40
        END as security_score
    FROM public.user_salts us
    LEFT JOIN public.user_sessions s ON us.user_identifier = s.user_identifier
    LEFT JOIN public.auth_audit_log al ON us.user_identifier = al.user_identifier
    WHERE us.user_identifier = p_user_identifier
      AND us.is_active = TRUE
    GROUP BY us.provider, us.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  BACKUP AND RECOVERY FUNCTIONS
-- ================================

-- Export user data for backup
CREATE OR REPLACE FUNCTION public.export_user_data(
    p_user_identifier TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_salts', (
            SELECT jsonb_agg(row_to_json(us))
            FROM public.user_salts us
            WHERE us.user_identifier = p_user_identifier
        ),
        'user_sessions', (
            SELECT jsonb_agg(row_to_json(s))
            FROM public.user_sessions s
            WHERE s.user_identifier = p_user_identifier
        ),
        'user_addresses', (
            SELECT jsonb_agg(row_to_json(ua))
            FROM public.user_addresses ua
            WHERE ua.user_identifier = p_user_identifier
        ),
        'user_preferences', (
            SELECT row_to_json(up)
            FROM public.user_preferences up
            WHERE up.user_identifier = p_user_identifier
        ),
        'audit_log', (
            SELECT jsonb_agg(row_to_json(al))
            FROM public.auth_audit_log al
            WHERE al.user_identifier = p_user_identifier
            ORDER BY al.created_at DESC
            LIMIT 100 -- Last 100 audit entries
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  ANALYTICS AND REPORTING FUNCTIONS
-- ================================

-- Get provider usage statistics
CREATE OR REPLACE FUNCTION public.get_provider_usage_stats(
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    provider VARCHAR(50),
    total_users BIGINT,
    active_users BIGINT,
    new_users BIGINT,
    total_sessions BIGINT,
    avg_session_duration_hours NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.provider,
        COUNT(DISTINCT us.user_identifier) as total_users,
        COUNT(DISTINCT CASE WHEN us.last_used >= NOW() - (p_days_back || ' days')::INTERVAL THEN us.user_identifier END) as active_users,
        COUNT(DISTINCT CASE WHEN us.created_at >= NOW() - (p_days_back || ' days')::INTERVAL THEN us.user_identifier END) as new_users,
        COUNT(s.id) as total_sessions,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(s.expires_at, NOW()) - s.created_at)) / 3600), 2) as avg_session_duration_hours,
        ROUND(
            (COUNT(CASE WHEN al.success = TRUE THEN 1 END))::NUMERIC / 
            NULLIF(COUNT(al.id), 0) * 100, 2
        ) as success_rate
    FROM public.user_salts us
    LEFT JOIN public.user_sessions s ON us.user_identifier = s.user_identifier
        AND s.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    LEFT JOIN public.auth_audit_log al ON us.user_identifier = al.user_identifier
        AND al.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    WHERE us.is_active = TRUE
    GROUP BY us.provider
    ORDER BY total_users DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get daily activity report
CREATE OR REPLACE FUNCTION public.get_daily_activity_report(
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
    activity_date DATE,
    new_users BIGINT,
    active_users BIGINT,
    total_sessions BIGINT,
    successful_logins BIGINT,
    failed_logins BIGINT,
    avg_session_duration_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(al.created_at) as activity_date,
        COUNT(DISTINCT CASE WHEN al.event_type = 'salt_generated' THEN al.user_identifier END) as new_users,
        COUNT(DISTINCT CASE WHEN al.event_type IN ('login_completed', 'session_created') THEN al.user_identifier END) as active_users,
        COUNT(CASE WHEN al.event_type = 'session_created' THEN 1 END) as total_sessions,
        COUNT(CASE WHEN al.event_type = 'login_completed' AND al.success = TRUE THEN 1 END) as successful_logins,
        COUNT(CASE WHEN al.event_type = 'error_occurred' THEN 1 END) as failed_logins,
        ROUND(AVG(CASE WHEN al.event_type = 'session_created' THEN 
            EXTRACT(EPOCH FROM (s.expires_at - s.created_at)) / 3600 
        END), 2) as avg_session_duration_hours
    FROM public.auth_audit_log al
    LEFT JOIN public.user_sessions s ON al.metadata->>'session_id' = s.session_id
    WHERE al.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY DATE(al.created_at)
    ORDER BY activity_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  SECURITY MONITORING FUNCTIONS
-- ================================

-- Detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    user_identifier TEXT,
    provider VARCHAR(50),
    suspicious_events BIGINT,
    different_ips BIGINT,
    failed_attempts BIGINT,
    risk_score INTEGER,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.user_identifier,
        us.provider,
        COUNT(*) as suspicious_events,
        COUNT(DISTINCT al.ip_address) as different_ips,
        COUNT(CASE WHEN al.success = FALSE THEN 1 END) as failed_attempts,
        CASE 
            WHEN COUNT(CASE WHEN al.success = FALSE THEN 1 END) > 10 THEN 100
            WHEN COUNT(CASE WHEN al.success = FALSE THEN 1 END) > 5 THEN 80
            WHEN COUNT(DISTINCT al.ip_address) > 3 THEN 60
            WHEN COUNT(*) > 50 THEN 40
            ELSE 20
        END as risk_score,
        MAX(al.created_at) as last_activity
    FROM public.auth_audit_log al
    LEFT JOIN public.user_salts us ON al.user_identifier = us.user_identifier
    WHERE al.created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
      AND al.user_identifier IS NOT NULL
    GROUP BY al.user_identifier, us.provider
    HAVING COUNT(CASE WHEN al.success = FALSE THEN 1 END) > 3
        OR COUNT(DISTINCT al.ip_address) > 2
        OR COUNT(*) > 30
    ORDER BY risk_score DESC, suspicious_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  AUTOMATED CLEANUP SCHEDULER
-- ================================

-- Schedule cleanup tasks (to be called by cron or scheduler)
CREATE OR REPLACE FUNCTION public.run_scheduled_cleanup()
RETURNS JSONB AS $$
DECLARE
    v_cleanup_result RECORD;
    v_jwk_cleanup INTEGER;
    v_result JSONB;
BEGIN
    -- Run main cleanup
    SELECT * FROM public.cleanup_expired_data() INTO v_cleanup_result;
    
    -- Clean up expired JWKs
    DELETE FROM public.provider_jwks 
    WHERE expires_at < NOW();
    GET DIAGNOSTICS v_jwk_cleanup = ROW_COUNT;
    
    -- Build result
    v_result := jsonb_build_object(
        'cleanup_timestamp', NOW(),
        'expired_sessions', v_cleanup_result.expired_sessions,
        'expired_proofs', v_cleanup_result.expired_proofs,
        'old_audit_logs', v_cleanup_result.old_audit_logs,
        'expired_jwks', v_jwk_cleanup,
        'success', TRUE
    );
    
    -- Log cleanup activity
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, success, metadata
    ) VALUES (
        NULL, 'system_cleanup', 'system', TRUE, v_result
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log cleanup failure
        INSERT INTO public.auth_audit_log (
            user_identifier, event_type, provider, success, error_message, metadata
        ) VALUES (
            NULL, 'system_cleanup', 'system', FALSE, SQLERRM, 
            jsonb_build_object('cleanup_timestamp', NOW(), 'error', SQLERRM)
        );
        
        RETURN jsonb_build_object(
            'cleanup_timestamp', NOW(),
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 