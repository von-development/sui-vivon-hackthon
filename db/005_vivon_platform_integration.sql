-- ================================
--  VIVON PLATFORM INTEGRATION: zkLogin + Bounty Platform + Smart Contracts
-- ================================

-- ================================
--  USER PROFILES & BLOCKCHAIN INTEGRATION
-- ================================

-- Extended user profiles linking zkLogin to on-chain activities
CREATE TABLE public.vivon_user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL, -- from zkLogin
    sui_address TEXT NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    github_username VARCHAR(39), -- for AI safety researchers
    twitter_handle VARCHAR(15),
    discord_id TEXT,
    reputation_score INTEGER DEFAULT 0,
    ai_safety_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, expert, researcher
    specializations TEXT[], -- AI safety areas: ['jailbreaking', 'prompt_injection', 'alignment', etc.]
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "discord": false}',
    privacy_settings JSONB DEFAULT '{"profile_public": true, "stats_public": true, "leaderboard": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level VARCHAR(20) DEFAULT 'basic', -- basic, researcher, expert, institution
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    UNIQUE(user_identifier, sui_address)
);

-- User achievements and progression
CREATE TABLE public.user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL, -- 'bounty_hunter', 'ai_researcher', 'token_holder', etc.
    achievement_level INTEGER DEFAULT 1, -- progression level
    title TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    requirements JSONB NOT NULL, -- conditions needed for achievement
    progress JSONB DEFAULT '{}', -- current progress toward next level
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    CONSTRAINT valid_achievement_type CHECK (achievement_type IN (
        'bounty_hunter', 'ai_researcher', 'token_holder', 'nft_collector', 
        'quest_master', 'community_contributor', 'early_adopter', 'security_expert'
    ))
);

-- ================================
--  BLOCKCHAIN ASSET TRACKING
-- ================================

-- Track user's VIVON token holdings and history
CREATE TABLE public.vivon_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    balance_vivon NUMERIC(20, 9) DEFAULT 0, -- Current VIVON balance
    locked_vivon NUMERIC(20, 9) DEFAULT 0, -- Time-locked tokens
    balance_sui NUMERIC(20, 9) DEFAULT 0, -- SUI balance for gas
    total_earned_vivon NUMERIC(20, 9) DEFAULT 0, -- Lifetime earnings
    total_spent_vivon NUMERIC(20, 9) DEFAULT 0, -- Lifetime spending
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    network VARCHAR(20) DEFAULT 'testnet',
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- Track user's NFT collection
CREATE TABLE public.user_nfts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    nft_object_id TEXT NOT NULL UNIQUE, -- On-chain NFT object ID
    nft_type VARCHAR(50) NOT NULL, -- 'vivon_collectible', 'special_edition', 'achievement_nft'
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    edition_number INTEGER,
    max_supply INTEGER,
    rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'
    attributes JSONB DEFAULT '{}',
    mint_transaction TEXT, -- Transaction hash when minted
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    acquired_method VARCHAR(50), -- 'minted', 'purchased', 'earned', 'transferred'
    current_value_vivon NUMERIC(20, 9),
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    CONSTRAINT valid_nft_type CHECK (nft_type IN ('vivon_collectible', 'special_edition', 'achievement_nft')),
    CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- Track user's winner badges from bounties
CREATE TABLE public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    badge_object_id TEXT NOT NULL UNIQUE, -- On-chain badge object ID
    bounty_pool_id TEXT NOT NULL, -- Reference to bounty pool
    bounty_title TEXT,
    reward_amount NUMERIC(20, 9) NOT NULL, -- Amount won
    prompt_hash TEXT, -- Hash of winning submission
    vulnerability_type VARCHAR(50), -- Type of AI vulnerability found
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    mint_transaction TEXT,
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- Track locked token positions
CREATE TABLE public.locked_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    locker_object_id TEXT NOT NULL UNIQUE, -- On-chain Locker object ID
    amount NUMERIC(20, 9) NOT NULL,
    lock_duration_days INTEGER NOT NULL,
    unlock_date TIMESTAMPTZ NOT NULL,
    lock_reason VARCHAR(50), -- 'vesting', 'staking', 'governance', 'penalty'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    lock_transaction TEXT,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlock_transaction TEXT,
    unlocked_at TIMESTAMPTZ,
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- ================================
--  BOUNTY SYSTEM INTEGRATION
-- ================================

-- Enhanced bounty pools with zkLogin integration
CREATE TABLE public.vivon_bounty_pools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_object_id TEXT NOT NULL UNIQUE, -- On-chain BountyPool object ID
    creator_user_identifier TEXT NOT NULL, -- zkLogin user who created it
    creator_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    spec_uri TEXT NOT NULL, -- Technical specification URL
    vulnerability_category VARCHAR(50), -- 'prompt_injection', 'jailbreaking', 'alignment', etc.
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    total_pool_sui NUMERIC(20, 9) NOT NULL,
    attempt_fee_sui NUMERIC(20, 9) NOT NULL,
    oracle_cap_id TEXT NOT NULL, -- Oracle capability ID
    max_submissions INTEGER DEFAULT 1000,
    submission_deadline TIMESTAMPTZ,
    reward_distribution JSONB DEFAULT '{"winner": 100}', -- percentage breakdown
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_transaction TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'expired'
    winner_user_identifier TEXT,
    winner_address TEXT,
    winning_submission_hash TEXT,
    completed_at TIMESTAMPTZ,
    completion_transaction TEXT,
    
    -- Connect to existing metadata table
    metadata_ref UUID REFERENCES public.bounty_pools_metadata(pool_id),
    
    FOREIGN KEY (creator_user_identifier) REFERENCES public.user_salts(user_identifier),
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert'))
);

-- Enhanced submissions with user tracking
CREATE TABLE public.bounty_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_object_id TEXT NOT NULL UNIQUE, -- On-chain Submission object ID
    pool_object_id TEXT NOT NULL,
    hunter_user_identifier TEXT NOT NULL, -- zkLogin user who submitted
    hunter_address TEXT NOT NULL,
    submission_hash TEXT NOT NULL, -- Hash of the actual prompt/attack
    submission_method VARCHAR(50), -- 'manual', 'automated', 'llm_assisted'
    submission_title TEXT,
    submission_summary TEXT, -- Brief description of the attack
    confidence_score INTEGER, -- 1-100, hunter's confidence in success
    estimated_severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    status INTEGER DEFAULT 0, -- 0=pending, 1=approved, 2=rejected
    fee_paid NUMERIC(20, 9) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submission_transaction TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    oracle_address TEXT, -- Who reviewed it
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (hunter_user_identifier) REFERENCES public.user_salts(user_identifier),
    FOREIGN KEY (pool_object_id) REFERENCES public.vivon_bounty_pools(pool_object_id),
    CONSTRAINT valid_status_submission CHECK (status IN (0, 1, 2))
);

-- ================================
--  QUEST SYSTEM INTEGRATION  
-- ================================

-- User progress on learn quests
CREATE TABLE public.user_quest_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    quest_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'claimed'
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reward_claimed_at TIMESTAMPTZ,
    reward_transaction TEXT, -- Transaction where VIVON was claimed
    xp_earned INTEGER DEFAULT 0,
    vivon_earned NUMERIC(20, 9) DEFAULT 0,
    nft_earned TEXT, -- NFT object ID if earned
    completion_data JSONB DEFAULT '{}', -- Quest-specific completion data
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES public.learn_quests(quest_id) ON DELETE CASCADE,
    UNIQUE(user_identifier, quest_id),
    CONSTRAINT valid_quest_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'claimed'))
);

-- Daily quest completions
CREATE TABLE public.daily_quest_completions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    quest_date DATE NOT NULL,
    quest_id UUID NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    bonus_vivon_earned NUMERIC(20, 9) DEFAULT 0,
    streak_count INTEGER DEFAULT 1,
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    FOREIGN KEY (quest_date, quest_id) REFERENCES public.daily_quests(quest_date, quest_id) ON DELETE CASCADE,
    UNIQUE(user_identifier, quest_date, quest_id)
);

-- ================================
--  MARKETPLACE & ECONOMY
-- ================================

-- Powerup purchases and usage
CREATE TABLE public.user_powerup_inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    powerup_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_cost_vivon NUMERIC(20, 9) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    purchase_transaction TEXT,
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    FOREIGN KEY (powerup_id) REFERENCES public.powerups(powerup_id) ON DELETE CASCADE
);

-- Transaction history for VIVON ecosystem
CREATE TABLE public.vivon_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    sui_address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL UNIQUE,
    transaction_type VARCHAR(50) NOT NULL, -- 'bounty_submission', 'quest_reward', 'nft_mint', etc.
    amount_vivon NUMERIC(20, 9) DEFAULT 0,
    amount_sui NUMERIC(20, 9) DEFAULT 0,
    direction VARCHAR(10) NOT NULL, -- 'in', 'out'
    related_object_id TEXT, -- Related bounty, NFT, etc.
    description TEXT,
    block_height BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    gas_used BIGINT,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    CONSTRAINT valid_direction CHECK (direction IN ('in', 'out')),
    CONSTRAINT valid_transaction_status CHECK (status IN ('success', 'failed', 'pending'))
);

-- ================================
--  ANALYTICS & LEADERBOARDS
-- ================================

-- User statistics summary (updated via triggers)
CREATE TABLE public.user_stats_summary (
    user_identifier TEXT PRIMARY KEY,
    -- Bounty Stats
    total_bounties_created INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,
    total_bounty_winnings NUMERIC(20, 9) DEFAULT 0,
    -- Quest Stats  
    total_quests_completed INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    daily_streak_count INTEGER DEFAULT 0,
    max_daily_streak INTEGER DEFAULT 0,
    -- Asset Stats
    total_vivon_earned NUMERIC(20, 9) DEFAULT 0,
    total_vivon_spent NUMERIC(20, 9) DEFAULT 0,
    current_vivon_balance NUMERIC(20, 9) DEFAULT 0,
    nft_collection_count INTEGER DEFAULT 0,
    badge_collection_count INTEGER DEFAULT 0,
    -- Platform Stats
    reputation_score INTEGER DEFAULT 0,
    trust_rating NUMERIC(3, 2) DEFAULT 5.00, -- 1.00-5.00 rating
    total_transactions INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    account_age_days INTEGER DEFAULT 0,
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE
);

-- Leaderboard rankings (refreshed periodically)
CREATE TABLE public.leaderboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL, -- 'bounty_hunters', 'quest_masters', 'token_holders', etc.
    period_type VARCHAR(20) NOT NULL, -- 'all_time', 'monthly', 'weekly', 'daily'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    user_identifier TEXT NOT NULL,
    rank_position INTEGER NOT NULL,
    score NUMERIC(20, 9) NOT NULL, -- Score used for ranking
    score_details JSONB DEFAULT '{}', -- Breakdown of score calculation
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_identifier) REFERENCES public.user_salts(user_identifier) ON DELETE CASCADE,
    UNIQUE(leaderboard_type, period_type, period_start, user_identifier)
);

-- ================================
--  INDEXES FOR PERFORMANCE
-- ================================

-- User Profiles indexes
CREATE INDEX idx_vivon_user_profiles_user_identifier ON public.vivon_user_profiles(user_identifier);
CREATE INDEX idx_vivon_user_profiles_sui_address ON public.vivon_user_profiles(sui_address);
CREATE INDEX idx_vivon_user_profiles_username ON public.vivon_user_profiles(username);
CREATE INDEX idx_vivon_user_profiles_reputation ON public.vivon_user_profiles(reputation_score DESC);

-- Assets indexes
CREATE INDEX idx_vivon_balances_user_identifier ON public.vivon_balances(user_identifier);
CREATE INDEX idx_user_nfts_user_identifier ON public.user_nfts(user_identifier);
CREATE INDEX idx_user_nfts_object_id ON public.user_nfts(nft_object_id);
CREATE INDEX idx_user_badges_user_identifier ON public.user_badges(user_identifier);
CREATE INDEX idx_locked_tokens_user_identifier ON public.locked_tokens(user_identifier);
CREATE INDEX idx_locked_tokens_unlock_date ON public.locked_tokens(unlock_date);

-- Bounty system indexes
CREATE INDEX idx_vivon_bounty_pools_creator ON public.vivon_bounty_pools(creator_user_identifier);
CREATE INDEX idx_vivon_bounty_pools_status ON public.vivon_bounty_pools(status);
CREATE INDEX idx_bounty_submissions_hunter ON public.bounty_submissions(hunter_user_identifier);
CREATE INDEX idx_bounty_submissions_pool ON public.bounty_submissions(pool_object_id);
CREATE INDEX idx_bounty_submissions_status ON public.bounty_submissions(status);

-- Quest system indexes
CREATE INDEX idx_user_quest_progress_user ON public.user_quest_progress(user_identifier);
CREATE INDEX idx_user_quest_progress_status ON public.user_quest_progress(status);
CREATE INDEX idx_daily_quest_completions_user ON public.daily_quest_completions(user_identifier);

-- Transactions indexes
CREATE INDEX idx_vivon_transactions_user ON public.vivon_transactions(user_identifier);
CREATE INDEX idx_vivon_transactions_hash ON public.vivon_transactions(transaction_hash);
CREATE INDEX idx_vivon_transactions_type ON public.vivon_transactions(transaction_type);
CREATE INDEX idx_vivon_transactions_timestamp ON public.vivon_transactions(timestamp DESC);

-- Leaderboards indexes
CREATE INDEX idx_leaderboards_type_period ON public.leaderboards(leaderboard_type, period_type, period_start);
CREATE INDEX idx_leaderboards_rank ON public.leaderboards(leaderboard_type, period_type, rank_position);

-- ================================
--  ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all new tables
ALTER TABLE public.vivon_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vivon_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vivon_bounty_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_powerup_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vivon_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Policies for user data access
CREATE POLICY "Users can access their own profile" ON public.vivon_user_profiles
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own assets" ON public.vivon_balances
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own NFTs" ON public.user_nfts
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own badges" ON public.user_badges
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own locked tokens" ON public.locked_tokens
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own quest progress" ON public.user_quest_progress
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own transactions" ON public.vivon_transactions
    FOR ALL USING (auth.uid()::text = user_identifier);

CREATE POLICY "Users can access their own stats" ON public.user_stats_summary
    FOR ALL USING (auth.uid()::text = user_identifier);

-- Public read access for bounty pools and leaderboards
CREATE POLICY "Public can read bounty pools" ON public.vivon_bounty_pools
    FOR SELECT USING (TRUE);

CREATE POLICY "Public can read leaderboards" ON public.leaderboards
    FOR SELECT USING (TRUE);

-- Creators can manage their bounty pools
CREATE POLICY "Creators can manage their bounty pools" ON public.vivon_bounty_pools
    FOR ALL USING (auth.uid()::text = creator_user_identifier);

-- Users can submit to bounty pools
CREATE POLICY "Users can create submissions" ON public.bounty_submissions
    FOR INSERT WITH CHECK (auth.uid()::text = hunter_user_identifier);

CREATE POLICY "Users can read their submissions" ON public.bounty_submissions
    FOR SELECT USING (auth.uid()::text = hunter_user_identifier); 