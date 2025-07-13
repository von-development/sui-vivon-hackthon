AI-Safety Bounty on Sui

A proof-of-concept dApp that lets model owners escrow prize funds on the Sui blockchain and automatically pay hunters who demonstrate a successful LLM jailbreak.

# JailbreakGuard  
_On-chain bounty vault for LLM jailbreaks (Sui testnet PoC)_

## 1. What it solves  
Today, AI-safety bounty programs (Anthropic, Microsoft, etc.) run on Web 2 sites.  
Hunters must trust the host to pay and can’t audit payouts. JailbreakGuard moves the
prize vault to the **Sui** blockchain:

* **Immutable escrow** – funds can’t be frozen or mis-spent.  
* **Automatic payout** – oracle signs a “WIN” → contract releases the jackpot.  
* **Public history** – every attempt and reward is traceable in the explorer.

## 2. High-level flow

## Folder structure for contracts

contracts/ # all Move code
├── sources/ # .move modules (bounty.move, badge.move …)
├── tests/ # unit tests
└── Move.toml # package manifest
README.md # this file

 Move work plan

 File	What it defines	Why you need it
bounty.move (main module)	BountyPool, Submission, OracleCap structs + all entry functions + two events.	Core escrow + payout logic (100 % required).
badge.move (optional)	WinnerBadge NFT struct + mint_badge() helper.	Nice-to-have proof of victory, ~20 lines.
bounty_test.move	Unit tests for happy path, bad cap, bad fee, double-payout.	Covers “Implementation” scoring; tie-breaks.

1. bounty.move – minimal skeleton
move
Copy
Edit
module guard::bounty {
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::tx_context::TxContext;

    /// ========  structs  ========
    struct BountyPool has key {
        id: UID,
        balance: Coin<USDC>,
        attempt_fee: u64,
        spec_uri: vector<u8>,
        oracle_cap_id: ID        // address of OracleCap object
    }

    struct Submission has key {
        id: UID,
        hunter: address,
        hash: vector<u8>,
        status: u8               // 0=pending 1=win
    }

    struct OracleCap has key {}   // empty marker object

    /// ========  events  ========
    struct Submitted  has copy, drop { id: ID, hunter: address }
    struct Success    has copy, drop { id: ID, hunter: address, reward: u64 }

    /// ========  entry functions  ========
    public entry fun create_pool(
        initial_fund: Coin<USDC>,
        attempt_fee: u64,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ): (BountyPool, OracleCap) { /* mint pool + cap */ }

    public entry fun deposit(
        pool: &mut BountyPool,
        extra: Coin<USDC>
    ) { /* add to balance */ }

    public entry fun submit(
        pool: &mut BountyPool,
        prompt_hash: vector<u8>,
        payment: Coin<USDC>,
        ctx: &mut TxContext
    ): Submission { /* fee check, emit Submitted */ }

    public entry fun record_success(
        pool: &mut BountyPool,
        sub: &mut Submission,
        cap: &OracleCap,
        ctx: &mut TxContext
    ) { /* verify cap, pay hunter, emit Success */ }
}
Only 3 entry points are mandatory: create_pool, submit, record_success.
deposit is convenience; skip if time is tight.

2. badge.move – optional NFT
move
Copy
Edit
module guard::badge {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;

    struct WinnerBadge has key {
        id: UID,
        pool: ID,
        hunter: address
    }

    public fun mint(pool: ID, hunter: address, ctx: &mut TxContext): WinnerBadge {
        let uid = object::new(ctx);
        WinnerBadge { id: uid, pool, hunter }
    }
}
Call badge::mint() inside record_success() after the payout.

3. bounty_test.move – suggested cases
move
Copy
Edit
#[test] fun happy_path() { /* create → submit → success → assert balances */ }
#[test] fun wrong_fee()  { /* expect failure */ }
#[test] fun bad_cap()    { /* expect abort */ }
#[test] fun double_win() { /* second success tx should fail */ }

| File | Must-have structs / functions | Status |
|------|------------------------------|--------|
| **`bounty.move`** | `BountyPool`, `Submission`, `OracleCap`<br>`create_pool`, `submit`, `record_success`<br>Events: `Submitted`, `Success` | ⬜ TODO |
| **`bounty_test.move`** | Unit tests: happy path, wrong fee, bad cap, double payout | ⬜ TODO |
| **`badge.move`** _(optional)_ | `WinnerBadge` NFT + `mint_badge()` | ⬜ Later |