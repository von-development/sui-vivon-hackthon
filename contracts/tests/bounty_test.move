#[test_only]
module guard::bounty_test {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_scenario::{Self as test, next_tx};
    use guard::bounty::{Self, BountyPool, Submission, OracleCap};

    // Test constants
    const ADMIN: address = @0xA11CE;
    const HUNTER: address = @0xB0B;
    const ORACLE: address = @0xC0FFEE;
    const HUNTER2: address = @0xDEADBEEF;
    
    const INITIAL_BALANCE: u64 = 1000000000; // 1 SUI
    const ATTEMPT_FEE: u64 = 100000000; // 0.1 SUI
    const SPEC_URI: vector<u8> = b"https://ipfs.io/ipfs/QmExample";
    const PROMPT_HASH: vector<u8> = b"keccak256_hash_of_prompt";
    const WRONG_HASH: vector<u8> = b"wrong_hash";

    // === Test Helpers ===

    fun create_sui_coin(value: u64, ctx: &mut sui::tx_context::TxContext): Coin<SUI> {
        coin::mint_for_testing<SUI>(value, ctx)
    }

    // === Happy Path Tests ===

    #[test]
    fun test_happy_path() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Step 1: Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Step 2: Hunter submits attempt
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                PROMPT_HASH,
                payment,
                test::ctx(&mut scenario)
            );
            
            // Verify pool balance increased
            assert!(bounty::pool_balance(&pool) == INITIAL_BALANCE + ATTEMPT_FEE, 0);
            
            test::return_shared(pool);
        };
        
        // Step 3: Oracle records success
        next_tx(&mut scenario, ORACLE);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let mut submission = test::take_from_address<Submission>(&scenario, HUNTER);
            let oracle_cap = test::take_from_address<OracleCap>(&scenario, ADMIN);
            
            // Verify initial state
            assert!(bounty::submission_status(&submission) == 0, 0);
            
            bounty::record_success(
                &mut pool,
                &mut submission,
                &oracle_cap,
                test::ctx(&mut scenario)
            );
            
            // Verify submission marked as won
            assert!(bounty::submission_status(&submission) == 1, 0);
            
            // Verify pool balance is now zero
            assert!(bounty::pool_balance(&pool) == 0, 0);
            
            test::return_shared(pool);
            test::return_to_address(HUNTER, submission);
            test::return_to_address(ADMIN, oracle_cap);
        };
        
        // Step 4: Verify hunter received reward
        next_tx(&mut scenario, HUNTER);
        {
            let reward_coin = test::take_from_address<Coin<SUI>>(&scenario, HUNTER);
            assert!(coin::value(&reward_coin) == INITIAL_BALANCE + ATTEMPT_FEE, 0);
            test::return_to_address(HUNTER, reward_coin);
        };
        
        test::end(scenario);
    }

    // === Error Tests ===

    #[test]
    #[expected_failure(abort_code = bounty::E_INSUFFICIENT_PAYMENT)]
    fun test_wrong_fee() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Hunter tries to submit with insufficient payment
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let insufficient_payment = create_sui_coin(ATTEMPT_FEE - 1, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                PROMPT_HASH,
                insufficient_payment,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
        };
        
        test::end(scenario);
    }

    // TODO: Implement test_bad_cap - the test framework for multiple shared objects is complex
    // This test would verify that using wrong oracle cap fails with E_BAD_CAP

    #[test]
    #[expected_failure(abort_code = bounty::E_ALREADY_CLAIMED)]
    fun test_double_win() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Hunter submits attempt
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                PROMPT_HASH,
                payment,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
        };
        
        // Oracle records success (first time)
        next_tx(&mut scenario, ORACLE);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let mut submission = test::take_from_address<Submission>(&scenario, HUNTER);
            let oracle_cap = test::take_from_address<OracleCap>(&scenario, ADMIN);
            
            bounty::record_success(
                &mut pool,
                &mut submission,
                &oracle_cap,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
            test::return_to_address(HUNTER, submission);
            test::return_to_address(ADMIN, oracle_cap);
        };
        
        // Oracle tries to record success again (should fail)
        next_tx(&mut scenario, ORACLE);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let mut submission = test::take_from_address<Submission>(&scenario, HUNTER);
            let oracle_cap = test::take_from_address<OracleCap>(&scenario, ADMIN);
            
            // This should fail with E_ALREADY_CLAIMED
            bounty::record_success(
                &mut pool,
                &mut submission,
                &oracle_cap,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
            test::return_to_address(HUNTER, submission);
            test::return_to_address(ADMIN, oracle_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = bounty::E_INVALID_HASH)]
    fun test_empty_hash() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Hunter tries to submit with empty hash
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                vector::empty<u8>(), // empty hash
                payment,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
        };
        
        test::end(scenario);
    }

    // === Integration Tests ===

    #[test]
    fun test_multiple_submissions() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Hunter1 submits
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                PROMPT_HASH,
                payment,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
        };
        
        // Hunter2 submits
        next_tx(&mut scenario, HUNTER2);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                WRONG_HASH,
                payment,
                test::ctx(&mut scenario)
            );
            
            // Pool should now have original balance + 2 fees
            assert!(bounty::pool_balance(&pool) == INITIAL_BALANCE + (2 * ATTEMPT_FEE), 0);
            
            test::return_shared(pool);
        };
        
        // Oracle awards Hunter1 (first submission wins all)
        next_tx(&mut scenario, ORACLE);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let mut submission = test::take_from_address<Submission>(&scenario, HUNTER);
            let oracle_cap = test::take_from_address<OracleCap>(&scenario, ADMIN);
            
            bounty::record_success(
                &mut pool,
                &mut submission,
                &oracle_cap,
                test::ctx(&mut scenario)
            );
            
            // Pool should be empty now
            assert!(bounty::pool_balance(&pool) == 0, 0);
            
            test::return_shared(pool);
            test::return_to_address(HUNTER, submission);
            test::return_to_address(ADMIN, oracle_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_deposit_functionality() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Admin adds more funds
        next_tx(&mut scenario, ADMIN);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let extra_fund = create_sui_coin(INITIAL_BALANCE, test::ctx(&mut scenario));
            
            bounty::deposit(
                &mut pool,
                extra_fund,
                test::ctx(&mut scenario)
            );
            
            // Pool should have double the initial balance
            assert!(bounty::pool_balance(&pool) == 2 * INITIAL_BALANCE, 0);
            
            test::return_shared(pool);
        };
        
        test::end(scenario);
    }

    // === View Function Tests ===

    #[test]
    fun test_view_functions() {
        let mut scenario = test::begin(ADMIN);
        let ctx = test::ctx(&mut scenario);
        
        // Admin creates pool
        let initial_fund = create_sui_coin(INITIAL_BALANCE, ctx);
        bounty::create_pool(
            initial_fund,
            ATTEMPT_FEE,
            SPEC_URI,
            ctx
        );
        
        // Test pool view functions
        next_tx(&mut scenario, HUNTER);
        {
            let pool = test::take_shared<BountyPool>(&scenario);
            
            assert!(bounty::pool_balance(&pool) == INITIAL_BALANCE, 0);
            assert!(bounty::pool_attempt_fee(&pool) == ATTEMPT_FEE, 0);
            assert!(bounty::pool_spec_uri(&pool) == SPEC_URI, 0);
            
            test::return_shared(pool);
        };
        
        // Hunter submits and test submission view functions
        next_tx(&mut scenario, HUNTER);
        {
            let mut pool = test::take_shared<BountyPool>(&scenario);
            let payment = create_sui_coin(ATTEMPT_FEE, test::ctx(&mut scenario));
            
            bounty::submit(
                &mut pool,
                PROMPT_HASH,
                payment,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(pool);
        };
        
        next_tx(&mut scenario, HUNTER);
        {
            let submission = test::take_from_address<Submission>(&scenario, HUNTER);
            
            assert!(bounty::submission_status(&submission) == 0, 0);
            assert!(bounty::submission_hunter(&submission) == HUNTER, 0);
            assert!(bounty::submission_hash(&submission) == PROMPT_HASH, 0);
            
            test::return_to_address(HUNTER, submission);
        };
        
        test::end(scenario);
    }
} 