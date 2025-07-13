module guard::bounty {
    // === Imports ===
    use sui::coin::{Self, Coin};
    use sui::balance::Balance;
    use sui::sui::SUI;
    use sui::event;
    use guard::badge;

    // === Error Constants ===
    const E_BAD_CAP: u64 = 1;
    const E_ALREADY_CLAIMED: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_EMPTY_POOL: u64 = 4;
    const E_INVALID_HASH: u64 = 5;

    // === Structs ===
    
    /// Escrow vault for a single AI-safety bounty.
    public struct BountyPool has key {
        id: UID,
        balance: Balance<SUI>,       // jackpot in SUI
        attempt_fee: u64,            // fee each hunter must pay
        spec_uri: vector<u8>,        // IPFS / HTTP describing the challenge
        oracle_cap_id: ID            // ID of the OracleCap that can approve wins
    }

    /// One prompt submission by a hunter.
    public struct Submission has key {
        id: UID,
        pool_id: ID,                 // which pool this submission belongs to
        hunter: address,
        hash: vector<u8>,            // keccak256 of full prompt
        status: u8                   // 0 = pending, 1 = win
    }

    /// Capability object proving the signer is the trusted oracle.
    public struct OracleCap has key {
        id: UID,
        pool_id: ID                  // which pool this oracle can approve
    }

    // === Events ===
    
    public struct Submitted has copy, drop {
        submission_id: ID,
        pool_id: ID,
        hunter: address
    }

    public struct Success has copy, drop {
        submission_id: ID,
        pool_id: ID,
        hunter: address,
        reward: u64
    }

    public struct PoolCreated has copy, drop {
        pool_id: ID,
        creator: address,
        initial_balance: u64,
        attempt_fee: u64
    }

    // === Entry Functions ===

    /// Model owner seeds a new bounty pool with initial SUI and gets an OracleCap.
    public entry fun create_pool(
        initial_fund: Coin<SUI>,
        attempt_fee: u64,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        let pool_uid = sui::object::new(ctx);
        let pool_id = sui::object::uid_to_inner(&pool_uid);
        
        let oracle_cap_uid = sui::object::new(ctx);
        let oracle_cap_id = sui::object::uid_to_inner(&oracle_cap_uid);
        
        let initial_balance = coin::value(&initial_fund);
        
        // Create the bounty pool
        let pool = BountyPool {
            id: pool_uid,
            balance: coin::into_balance(initial_fund),
            attempt_fee,
            spec_uri,
            oracle_cap_id
        };
        
        // Create the oracle capability
        let oracle_cap = OracleCap {
            id: oracle_cap_uid,
            pool_id
        };
        
        // Emit pool creation event
        event::emit(PoolCreated {
            pool_id,
            creator: tx_context::sender(ctx),
            initial_balance,
            attempt_fee
        });
        
        // Transfer objects to the creator
        sui::transfer::share_object(pool);
        sui::transfer::transfer(oracle_cap, tx_context::sender(ctx));
    }

    /// Add more funds to an existing bounty pool.
    public entry fun deposit(
        pool: &mut BountyPool,
        extra_funds: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        sui::balance::join(&mut pool.balance, coin::into_balance(extra_funds));
    }

    /// Anyone pays `attempt_fee` and registers a prompt hash.
    public entry fun submit(
        pool: &mut BountyPool,
        prompt_hash: vector<u8>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Validate payment amount
        assert!(coin::value(&payment) >= pool.attempt_fee, E_INSUFFICIENT_PAYMENT);
        
        // Validate hash is not empty
        assert!(!std::vector::is_empty(&prompt_hash), E_INVALID_HASH);
        
        // Add payment to pool balance
        sui::balance::join(&mut pool.balance, coin::into_balance(payment));
        
        // Create submission
        let submission_uid = sui::object::new(ctx);
        let submission_id = sui::object::uid_to_inner(&submission_uid);
        let pool_id = sui::object::uid_to_inner(&pool.id);
        
        let submission = Submission {
            id: submission_uid,
            pool_id,
            hunter: tx_context::sender(ctx),
            hash: prompt_hash,
            status: 0  // pending
        };
        
        // Emit submission event
        event::emit(Submitted {
            submission_id,
            pool_id,
            hunter: tx_context::sender(ctx)
        });
        
        // Transfer submission to hunter
        sui::transfer::transfer(submission, tx_context::sender(ctx));
    }

    /// Oracle marks a submission as WIN and triggers payout.
    public entry fun record_success(
        pool: &mut BountyPool,
        submission: &mut Submission,
        cap: &OracleCap,
        ctx: &mut TxContext
    ) {
        // Verify oracle capability matches this pool
        assert!(sui::object::uid_to_inner(&cap.id) == pool.oracle_cap_id, E_BAD_CAP);
        
        // Verify submission hasn't already been claimed
        assert!(submission.status == 0, E_ALREADY_CLAIMED);
        
        // Verify submission belongs to this pool
        assert!(submission.pool_id == sui::object::uid_to_inner(&pool.id), E_BAD_CAP);
        
        // Verify pool has balance to pay out
        let reward_amount = sui::balance::value(&pool.balance);
        assert!(reward_amount > 0, E_EMPTY_POOL);
        
        // Mark submission as won
        submission.status = 1;
        
        // Transfer entire pool balance to hunter
        let reward_coin = coin::from_balance(sui::balance::split(&mut pool.balance, reward_amount), ctx);
        sui::transfer::public_transfer(reward_coin, submission.hunter);
        
        // Emit success event
        event::emit(Success {
            submission_id: sui::object::uid_to_inner(&submission.id),
            pool_id: sui::object::uid_to_inner(&pool.id),
            hunter: submission.hunter,
            reward: reward_amount
        });
    }

    /// Oracle marks a submission as WIN, triggers payout, and mints commemorative badge
    public entry fun record_success_with_badge(
        pool: &mut BountyPool,
        submission: &mut Submission,
        cap: &OracleCap,
        ctx: &mut TxContext
    ) {
        // Verify oracle capability matches this pool
        assert!(sui::object::uid_to_inner(&cap.id) == pool.oracle_cap_id, E_BAD_CAP);
        
        // Verify submission hasn't already been claimed
        assert!(submission.status == 0, E_ALREADY_CLAIMED);
        
        // Verify submission belongs to this pool
        assert!(submission.pool_id == sui::object::uid_to_inner(&pool.id), E_BAD_CAP);
        
        // Verify pool has balance to pay out
        let reward_amount = sui::balance::value(&pool.balance);
        assert!(reward_amount > 0, E_EMPTY_POOL);
        
        // Mark submission as won
        submission.status = 1;
        
        // Transfer entire pool balance to hunter
        let reward_coin = coin::from_balance(sui::balance::split(&mut pool.balance, reward_amount), ctx);
        sui::transfer::public_transfer(reward_coin, submission.hunter);
        
        // Mint commemorative badge with the actual reward amount
        badge::mint_winner_badge(
            sui::object::uid_to_inner(&pool.id),
            submission.hunter,
            reward_amount,
            submission.hash,
            pool.spec_uri,
            ctx
        );
        
        // Emit success event
        event::emit(Success {
            submission_id: sui::object::uid_to_inner(&submission.id),
            pool_id: sui::object::uid_to_inner(&pool.id),
            hunter: submission.hunter,
            reward: reward_amount
        });
    }

    // === View Functions ===

    /// Get pool balance amount
    public fun pool_balance(pool: &BountyPool): u64 {
        sui::balance::value(&pool.balance)
    }

    /// Get pool attempt fee
    public fun pool_attempt_fee(pool: &BountyPool): u64 {
        pool.attempt_fee
    }

    /// Get pool spec URI
    public fun pool_spec_uri(pool: &BountyPool): vector<u8> {
        pool.spec_uri
    }

    /// Get submission status
    public fun submission_status(submission: &Submission): u8 {
        submission.status
    }

    /// Get submission hunter
    public fun submission_hunter(submission: &Submission): address {
        submission.hunter
    }

    /// Get submission hash
    public fun submission_hash(submission: &Submission): vector<u8> {
        submission.hash
    }

    // === Test-Only Functions ===

    #[test_only]
    public fun test_create_pool_for_testing(
        initial_fund: Coin<SUI>,
        attempt_fee: u64,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ): (BountyPool, OracleCap) {
        let pool_uid = sui::object::new(ctx);
        let pool_id = sui::object::uid_to_inner(&pool_uid);
        
        let oracle_cap_uid = sui::object::new(ctx);
        let oracle_cap_id = sui::object::uid_to_inner(&oracle_cap_uid);
        
        let pool = BountyPool {
            id: pool_uid,
            balance: coin::into_balance(initial_fund),
            attempt_fee,
            spec_uri,
            oracle_cap_id
        };
        
        let oracle_cap = OracleCap {
            id: oracle_cap_uid,
            pool_id
        };
        
        (pool, oracle_cap)
    }
} 