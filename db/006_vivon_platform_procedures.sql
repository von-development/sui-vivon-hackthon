-- ================================
--  VIVON PLATFORM PROCEDURES: Smart Contract Integration
-- ================================

-- ================================
--  USER ONBOARDING & PROFILE MANAGEMENT
-- ================================

-- Create complete user profile after zkLogin authentication
CREATE OR REPLACE FUNCTION public.create_vivon_user_profile(
    p_user_identifier TEXT,
    p_sui_address TEXT,
    p_username VARCHAR(50) DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL,
    p_provider VARCHAR(50) DEFAULT 'google'
)
RETURNS TABLE(
    profile_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_profile_id UUID;
    v_existing_username VARCHAR(50);
BEGIN
    -- Check if username is already taken
    IF p_username IS NOT NULL THEN
        SELECT username INTO v_existing_username
        FROM public.vivon_user_profiles
        WHERE username = p_username;
        
        IF v_existing_username IS NOT NULL THEN
            RETURN QUERY SELECT NULL::UUID, FALSE, 'Username already taken';
            RETURN;
        END IF;
    END IF;
    
    -- Create user profile
    INSERT INTO public.vivon_user_profiles (
        user_identifier, sui_address, username, display_name, created_at
    ) VALUES (
        p_user_identifier, p_sui_address, p_username, p_display_name, NOW()
    ) RETURNING id INTO v_profile_id;
    
    -- Initialize user balances
    INSERT INTO public.vivon_balances (
        user_identifier, sui_address, balance_vivon, locked_vivon, balance_sui
    ) VALUES (
        p_user_identifier, p_sui_address, 0, 0, 0
    );
    
    -- Initialize user stats
    INSERT INTO public.user_stats_summary (
        user_identifier, reputation_score, current_level
    ) VALUES (
        p_user_identifier, 0, 1
    );
    
    -- Grant beginner achievement
    INSERT INTO public.user_achievements (
        user_identifier, achievement_type, title, description, requirements
    ) VALUES (
        p_user_identifier, 'early_adopter', 'Welcome to VIVON!', 
        'Joined the VIVON AI Safety Platform', 
        jsonb_build_object('action', 'signup', 'completed', true)
    );
    
    -- Log profile creation
    INSERT INTO public.auth_audit_log (
        user_identifier, event_type, provider, success, metadata
    ) VALUES (
        p_user_identifier, 'profile_created', p_provider, TRUE,
        jsonb_build_object('profile_id', v_profile_id, 'sui_address', p_sui_address)
    );
    
    RETURN QUERY SELECT v_profile_id, TRUE, 'Profile created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user balance from blockchain data
CREATE OR REPLACE FUNCTION public.sync_user_balance(
    p_user_identifier TEXT,
    p_vivon_balance NUMERIC(20, 9),
    p_locked_vivon NUMERIC(20, 9),
    p_sui_balance NUMERIC(20, 9)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.vivon_balances
    SET 
        balance_vivon = p_vivon_balance,
        locked_vivon = p_locked_vivon,
        balance_sui = p_sui_balance,
        last_updated = NOW()
    WHERE user_identifier = p_user_identifier;
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET current_vivon_balance = p_vivon_balance
    WHERE user_identifier = p_user_identifier;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  BOUNTY SYSTEM PROCEDURES
-- ================================

-- Create bounty pool with zkLogin integration
CREATE OR REPLACE FUNCTION public.create_bounty_pool(
    p_creator_user_identifier TEXT,
    p_pool_object_id TEXT,
    p_title TEXT,
    p_description TEXT,
    p_spec_uri TEXT,
    p_vulnerability_category VARCHAR(50),
    p_difficulty_level VARCHAR(20),
    p_total_pool_sui NUMERIC(20, 9),
    p_attempt_fee_sui NUMERIC(20, 9),
    p_oracle_cap_id TEXT,
    p_transaction_hash TEXT
)
RETURNS TABLE(
    bounty_id UUID,
    success BOOLEAN
) AS $$
DECLARE
    v_bounty_id UUID;
    v_creator_address TEXT;
BEGIN
    -- Get creator address
    SELECT sui_address INTO v_creator_address
    FROM public.vivon_user_profiles
    WHERE user_identifier = p_creator_user_identifier;
    
    -- Create bounty pool
    INSERT INTO public.vivon_bounty_pools (
        pool_object_id, creator_user_identifier, creator_address,
        title, description, spec_uri, vulnerability_category, difficulty_level,
        total_pool_sui, attempt_fee_sui, oracle_cap_id, created_transaction
    ) VALUES (
        p_pool_object_id, p_creator_user_identifier, v_creator_address,
        p_title, p_description, p_spec_uri, p_vulnerability_category, p_difficulty_level,
        p_total_pool_sui, p_attempt_fee_sui, p_oracle_cap_id, p_transaction_hash
    ) RETURNING id INTO v_bounty_id;
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET total_bounties_created = total_bounties_created + 1
    WHERE user_identifier = p_creator_user_identifier;
    
    -- Record transaction
    INSERT INTO public.vivon_transactions (
        user_identifier, sui_address, transaction_hash, transaction_type,
        amount_sui, direction, related_object_id, description
    ) VALUES (
        p_creator_user_identifier, v_creator_address, p_transaction_hash, 'bounty_creation',
        p_total_pool_sui, 'out', p_pool_object_id, 'Created bounty pool: ' || p_title
    );
    
    RETURN QUERY SELECT v_bounty_id, TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::UUID, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit to bounty pool
CREATE OR REPLACE FUNCTION public.submit_to_bounty(
    p_hunter_user_identifier TEXT,
    p_pool_object_id TEXT,
    p_submission_object_id TEXT,
    p_submission_hash TEXT,
    p_submission_title TEXT,
    p_submission_summary TEXT,
    p_confidence_score INTEGER,
    p_estimated_severity VARCHAR(20),
    p_fee_paid NUMERIC(20, 9),
    p_transaction_hash TEXT
)
RETURNS TABLE(
    submission_id UUID,
    success BOOLEAN
) AS $$
DECLARE
    v_submission_id UUID;
    v_hunter_address TEXT;
BEGIN
    -- Get hunter address
    SELECT sui_address INTO v_hunter_address
    FROM public.vivon_user_profiles
    WHERE user_identifier = p_hunter_user_identifier;
    
    -- Create submission
    INSERT INTO public.bounty_submissions (
        submission_object_id, pool_object_id, hunter_user_identifier, hunter_address,
        submission_hash, submission_title, submission_summary, confidence_score,
        estimated_severity, fee_paid, submission_transaction
    ) VALUES (
        p_submission_object_id, p_pool_object_id, p_hunter_user_identifier, v_hunter_address,
        p_submission_hash, p_submission_title, p_submission_summary, p_confidence_score,
        p_estimated_severity, p_fee_paid, p_transaction_hash
    ) RETURNING id INTO v_submission_id;
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET total_submissions = total_submissions + 1
    WHERE user_identifier = p_hunter_user_identifier;
    
    -- Record transaction
    INSERT INTO public.vivon_transactions (
        user_identifier, sui_address, transaction_hash, transaction_type,
        amount_sui, direction, related_object_id, description
    ) VALUES (
        p_hunter_user_identifier, v_hunter_address, p_transaction_hash, 'bounty_submission',
        p_fee_paid, 'out', p_pool_object_id, 'Bounty submission fee'
    );
    
    RETURN QUERY SELECT v_submission_id, TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::UUID, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award bounty to winner
CREATE OR REPLACE FUNCTION public.award_bounty(
    p_pool_object_id TEXT,
    p_winner_user_identifier TEXT,
    p_winning_submission_hash TEXT,
    p_reward_amount NUMERIC(20, 9),
    p_badge_object_id TEXT,
    p_transaction_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_winner_address TEXT;
    v_bounty_title TEXT;
BEGIN
    -- Get winner address and bounty title
    SELECT vup.sui_address, vbp.title INTO v_winner_address, v_bounty_title
    FROM public.vivon_user_profiles vup
    JOIN public.vivon_bounty_pools vbp ON vbp.pool_object_id = p_pool_object_id
    WHERE vup.user_identifier = p_winner_user_identifier;
    
    -- Update bounty pool status
    UPDATE public.vivon_bounty_pools
    SET 
        status = 'completed',
        winner_user_identifier = p_winner_user_identifier,
        winner_address = v_winner_address,
        winning_submission_hash = p_winning_submission_hash,
        completed_at = NOW(),
        completion_transaction = p_transaction_hash
    WHERE pool_object_id = p_pool_object_id;
    
    -- Update submission status
    UPDATE public.bounty_submissions
    SET status = 1, reviewed_at = NOW()
    WHERE pool_object_id = p_pool_object_id AND submission_hash = p_winning_submission_hash;
    
    -- Create winner badge
    INSERT INTO public.user_badges (
        user_identifier, sui_address, badge_object_id, bounty_pool_id,
        bounty_title, reward_amount, prompt_hash, mint_transaction
    ) VALUES (
        p_winner_user_identifier, v_winner_address, p_badge_object_id, p_pool_object_id,
        v_bounty_title, p_reward_amount, p_winning_submission_hash, p_transaction_hash
    );
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET 
        successful_submissions = successful_submissions + 1,
        total_bounty_winnings = total_bounty_winnings + p_reward_amount,
        badge_collection_count = badge_collection_count + 1,
        reputation_score = reputation_score + 100 -- Base bounty win points
    WHERE user_identifier = p_winner_user_identifier;
    
    -- Record reward transaction
    INSERT INTO public.vivon_transactions (
        user_identifier, sui_address, transaction_hash, transaction_type,
        amount_sui, direction, related_object_id, description
    ) VALUES (
        p_winner_user_identifier, v_winner_address, p_transaction_hash, 'bounty_reward',
        p_reward_amount, 'in', p_pool_object_id, 'Bounty reward: ' || v_bounty_title
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  ASSET MANAGEMENT PROCEDURES
-- ================================

-- Record NFT mint
CREATE OR REPLACE FUNCTION public.record_nft_mint(
    p_user_identifier TEXT,
    p_nft_object_id TEXT,
    p_nft_type VARCHAR(50),
    p_name TEXT,
    p_description TEXT,
    p_image_url TEXT,
    p_edition_number INTEGER,
    p_max_supply INTEGER,
    p_rarity VARCHAR(20),
    p_transaction_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_sui_address TEXT;
BEGIN
    -- Get user address
    SELECT sui_address INTO v_sui_address
    FROM public.vivon_user_profiles
    WHERE user_identifier = p_user_identifier;
    
    -- Record NFT
    INSERT INTO public.user_nfts (
        user_identifier, sui_address, nft_object_id, nft_type,
        name, description, image_url, edition_number, max_supply,
        rarity, mint_transaction, acquired_method
    ) VALUES (
        p_user_identifier, v_sui_address, p_nft_object_id, p_nft_type,
        p_name, p_description, p_image_url, p_edition_number, p_max_supply,
        p_rarity, p_transaction_hash, 'minted'
    );
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET nft_collection_count = nft_collection_count + 1
    WHERE user_identifier = p_user_identifier;
    
    -- Record transaction
    INSERT INTO public.vivon_transactions (
        user_identifier, sui_address, transaction_hash, transaction_type,
        direction, related_object_id, description
    ) VALUES (
        p_user_identifier, v_sui_address, p_transaction_hash, 'nft_mint',
        'in', p_nft_object_id, 'Minted NFT: ' || p_name
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record token lock
CREATE OR REPLACE FUNCTION public.record_token_lock(
    p_user_identifier TEXT,
    p_locker_object_id TEXT,
    p_amount NUMERIC(20, 9),
    p_lock_duration_days INTEGER,
    p_lock_reason VARCHAR(50),
    p_transaction_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_sui_address TEXT;
    v_unlock_date TIMESTAMPTZ;
BEGIN
    -- Get user address
    SELECT sui_address INTO v_sui_address
    FROM public.vivon_user_profiles
    WHERE user_identifier = p_user_identifier;
    
    -- Calculate unlock date
    v_unlock_date := NOW() + (p_lock_duration_days || ' days')::INTERVAL;
    
    -- Record locked tokens
    INSERT INTO public.locked_tokens (
        user_identifier, sui_address, locker_object_id, amount,
        lock_duration_days, unlock_date, lock_reason, lock_transaction
    ) VALUES (
        p_user_identifier, v_sui_address, p_locker_object_id, p_amount,
        p_lock_duration_days, v_unlock_date, p_lock_reason, p_transaction_hash
    );
    
    -- Update balance
    UPDATE public.vivon_balances
    SET 
        locked_vivon = locked_vivon + p_amount,
        balance_vivon = balance_vivon - p_amount
    WHERE user_identifier = p_user_identifier;
    
    -- Record transaction
    INSERT INTO public.vivon_transactions (
        user_identifier, sui_address, transaction_hash, transaction_type,
        amount_vivon, direction, related_object_id, description
    ) VALUES (
        p_user_identifier, v_sui_address, p_transaction_hash, 'token_lock',
        p_amount, 'out', p_locker_object_id, 'Locked VIVON tokens for ' || p_lock_duration_days || ' days'
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  QUEST SYSTEM PROCEDURES  
-- ================================

-- Complete quest and award rewards
CREATE OR REPLACE FUNCTION public.complete_quest(
    p_user_identifier TEXT,
    p_quest_id UUID,
    p_vivon_reward NUMERIC(20, 9) DEFAULT 0,
    p_xp_reward INTEGER DEFAULT 0,
    p_nft_object_id TEXT DEFAULT NULL,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS TABLE(
    level_up BOOLEAN,
    new_level INTEGER,
    success BOOLEAN
) AS $$
DECLARE
    v_current_level INTEGER;
    v_total_xp INTEGER;
    v_new_level INTEGER;
    v_level_up BOOLEAN := FALSE;
    v_sui_address TEXT;
BEGIN
    -- Get user info
    SELECT vup.sui_address, uss.current_level, uss.total_xp_earned 
    INTO v_sui_address, v_current_level, v_total_xp
    FROM public.vivon_user_profiles vup
    JOIN public.user_stats_summary uss ON vup.user_identifier = uss.user_identifier
    WHERE vup.user_identifier = p_user_identifier;
    
    -- Update quest progress
    UPDATE public.user_quest_progress
    SET 
        status = 'completed',
        progress_percentage = 100,
        completed_at = NOW(),
        xp_earned = p_xp_reward,
        vivon_earned = p_vivon_reward,
        nft_earned = p_nft_object_id
    WHERE user_identifier = p_user_identifier AND quest_id = p_quest_id;
    
    -- Calculate new level (every 1000 XP = 1 level)
    v_total_xp := v_total_xp + p_xp_reward;
    v_new_level := GREATEST(1, v_total_xp / 1000);
    
    IF v_new_level > v_current_level THEN
        v_level_up := TRUE;
    END IF;
    
    -- Update user stats
    UPDATE public.user_stats_summary
    SET 
        total_quests_completed = total_quests_completed + 1,
        total_xp_earned = v_total_xp,
        current_level = v_new_level,
        total_vivon_earned = total_vivon_earned + p_vivon_reward
    WHERE user_identifier = p_user_identifier;
    
    -- Update VIVON balance if reward given
    IF p_vivon_reward > 0 THEN
        UPDATE public.vivon_balances
        SET balance_vivon = balance_vivon + p_vivon_reward
        WHERE user_identifier = p_user_identifier;
        
        -- Record transaction
        INSERT INTO public.vivon_transactions (
            user_identifier, sui_address, transaction_hash, transaction_type,
            amount_vivon, direction, description
        ) VALUES (
            p_user_identifier, v_sui_address, p_transaction_hash, 'quest_reward',
            p_vivon_reward, 'in', 'Quest completion reward'
        );
    END IF;
    
    RETURN QUERY SELECT v_level_up, v_new_level, TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, v_current_level, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
--  ANALYTICS & LEADERBOARD PROCEDURES
-- ================================

-- Update leaderboards (call periodically)
CREATE OR REPLACE FUNCTION public.update_leaderboards(
    p_period_type VARCHAR(20) DEFAULT 'weekly'
)
RETURNS JSONB AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
    v_updated_count INTEGER := 0;
BEGIN
    -- Calculate period dates
    CASE p_period_type
        WHEN 'daily' THEN
            v_period_start := CURRENT_DATE;
            v_period_end := CURRENT_DATE;
        WHEN 'weekly' THEN
            v_period_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
            v_period_end := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
        WHEN 'monthly' THEN
            v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
            v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
        ELSE -- all_time
            v_period_start := '2024-01-01'::DATE;
            v_period_end := CURRENT_DATE;
    END CASE;
    
    -- Clear existing leaderboard for this period
    DELETE FROM public.leaderboards
    WHERE period_type = p_period_type AND period_start = v_period_start;
    
    -- Bounty Hunters Leaderboard (by winnings)
    INSERT INTO public.leaderboards (leaderboard_type, period_type, period_start, period_end, user_identifier, rank_position, score)
    SELECT 
        'bounty_hunters', p_period_type, v_period_start, v_period_end,
        user_identifier,
        ROW_NUMBER() OVER (ORDER BY total_bounty_winnings DESC) as rank_position,
        total_bounty_winnings as score
    FROM public.user_stats_summary
    WHERE total_bounty_winnings > 0
    ORDER BY total_bounty_winnings DESC
    LIMIT 100;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Token Holders Leaderboard
    INSERT INTO public.leaderboards (leaderboard_type, period_type, period_start, period_end, user_identifier, rank_position, score)
    SELECT 
        'token_holders', p_period_type, v_period_start, v_period_end,
        uss.user_identifier,
        ROW_NUMBER() OVER (ORDER BY vb.balance_vivon DESC) as rank_position,
        vb.balance_vivon as score
    FROM public.user_stats_summary uss
    JOIN public.vivon_balances vb ON uss.user_identifier = vb.user_identifier
    WHERE vb.balance_vivon > 0
    ORDER BY vb.balance_vivon DESC
    LIMIT 100;
    
    -- Quest Masters Leaderboard
    INSERT INTO public.leaderboards (leaderboard_type, period_type, period_start, period_end, user_identifier, rank_position, score)
    SELECT 
        'quest_masters', p_period_type, v_period_start, v_period_end,
        user_identifier,
        ROW_NUMBER() OVER (ORDER BY total_quests_completed DESC) as rank_position,
        total_quests_completed as score
    FROM public.user_stats_summary
    WHERE total_quests_completed > 0
    ORDER BY total_quests_completed DESC
    LIMIT 100;
    
    RETURN jsonb_build_object(
        'period_type', p_period_type,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'updated_records', v_updated_count,
        'success', TRUE
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user dashboard data
CREATE OR REPLACE FUNCTION public.get_user_dashboard(
    p_user_identifier TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', (
            SELECT row_to_json(vup)
            FROM public.vivon_user_profiles vup
            WHERE vup.user_identifier = p_user_identifier
        ),
        'balances', (
            SELECT row_to_json(vb)
            FROM public.vivon_balances vb
            WHERE vb.user_identifier = p_user_identifier
        ),
        'stats', (
            SELECT row_to_json(uss)
            FROM public.user_stats_summary uss
            WHERE uss.user_identifier = p_user_identifier
        ),
        'recent_achievements', (
            SELECT jsonb_agg(ua ORDER BY ua.earned_at DESC)
            FROM public.user_achievements ua
            WHERE ua.user_identifier = p_user_identifier
            ORDER BY ua.earned_at DESC
            LIMIT 5
        ),
        'active_quests', (
            SELECT jsonb_agg(uqp)
            FROM public.user_quest_progress uqp
            WHERE uqp.user_identifier = p_user_identifier
              AND uqp.status = 'in_progress'
        ),
        'recent_transactions', (
            SELECT jsonb_agg(vt ORDER BY vt.timestamp DESC)
            FROM public.vivon_transactions vt
            WHERE vt.user_identifier = p_user_identifier
            ORDER BY vt.timestamp DESC
            LIMIT 10
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 