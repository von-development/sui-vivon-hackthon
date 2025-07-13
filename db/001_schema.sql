-- ================================
--  SCHEMA:  Non-User App Tables
-- ================================

-- 1.  AI-Security / Bounty pool catalog
create table public.bounty_pools_metadata (
    pool_id text primary key, -- on-chain BountyPool object ID
    title text not null,
    spec_uri text not null, -- markdown/pdf URL shown in UI
    description text,
    icon_url text,
    created_at timestamptz default now(),
    active boolean default true
);

-- 2.  Learn-and-Earn quest catalog
create table public.learn_quests (
    quest_id uuid primary key default gen_random_uuid (),
    title text not null,
    markdown_url text not null, -- lesson content (GitHub / IPFS)
    video_url text,
    reward_vivon numeric(20, 0) default 0, -- integer; 1e9 = 1 VIVON if 9-decimals
    reward_nft_ticker text, -- optional NFT type to mint
    xp_reward int default 0,
    created_at timestamptz default now(),
    active boolean default true
);

-- 3.  Power-up / merch catalog purchasable with VIVON
create table public.powerups (
    powerup_id uuid primary key default gen_random_uuid (),
    name text not null,
    description text,
    vivon_cost numeric(20, 0) not null,
    image_url text,
    created_at timestamptz default now(),
    active boolean default true
);

-- 4.  Daily quest schedule (one row per quest x day)
create table public.daily_quests (
    id serial primary key,
    quest_date date not null,
    quest_id uuid references public.learn_quests (quest_id) on delete cascade,
    bonus_vivon numeric(20, 0) default 0,
    unique (quest_date, quest_id)
);

-- ===================================================
--  Row-Level-Security (RLS) — read-only for anon role
-- ===================================================

alter table public.bounty_pools_metadata enable row level security;

alter table public.learn_quests enable row level security;

alter table public.powerups enable row level security;

alter table public.daily_quests enable row level security;

-- Public (anonymous) can SELECT everything
create policy "anon read bounty" on public.bounty_pools_metadata for
select using (true);

create policy "anon read learn" on public.learn_quests for
select using (true);

create policy "anon read powerup" on public.powerups for
select using (true);

create policy "anon read daily" on public.daily_quests for
select using (true);

-- Writes restricted to service-role key only
-- (In Supabase, service role bypasses RLS automatically)
-- No extra policy needed—by default other roles cannot insert/update.

-- =========================================
--  Convenience views for your React hooks
-- =========================================
create view public.active_bounties as
select
    pool_id,
    title,
    spec_uri,
    description,
    icon_url
from public.bounty_pools_metadata
where
    active = true;

create view public.active_quests as
select
    quest_id,
    title,
    markdown_url,
    xp_reward,
    reward_vivon
from public.learn_quests
where
    active = true;