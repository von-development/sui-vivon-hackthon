module vivon::vivon;

use sui::coin::{Self, TreasuryCap};
use sui::balance::{Balance};
use sui::clock::{Clock};
use sui::url::new_unsafe_from_bytes;



const EInvalidAmount: u64 = 0;
const ESupplyExceeded: u64 = 1;
const ETokenLocked: u64 = 2;

public struct VIVON has drop {}

public struct MintCapability has key {
    id: UID,
    treasury: TreasuryCap<VIVON>,
    total_minted: u64,
}

public struct Locker has key, store {
    id: UID,
    unlock_date: u64,
    balance: Balance<VIVON>,
}

const TOTAL_SUPPLY: u64 = 10_000_000_000_000_000;  // 10 million VIVON
const INITIAL_SUPPLY: u64 = 8_000_000_000_000_000;   // 8 million VIVON

fun init(otw: VIVON, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        otw,
        9,
        b"VIVON",
        b"VIVON",
        b"Meet VIVON the revolutionary blockchain token driving innovation and community engagement in the decentralized ecosystem!",
        std::option::some(new_unsafe_from_bytes(b"https://vivon.com/assets/vivon-logo.png")),
        ctx
    );

    let mut mint_cap = MintCapability {
        id: sui::object::new(ctx),
        treasury,
        total_minted: 0,
    };

    mint(&mut mint_cap, INITIAL_SUPPLY, ctx.sender(), ctx);

    sui::transfer::public_freeze_object(metadata);
    sui::transfer::transfer(mint_cap, ctx.sender());
}

public fun mint(
    mint_cap: &mut MintCapability,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
) {
    let coin = mint_internal(mint_cap, amount, ctx);
    sui::transfer::public_transfer(coin, recipient);
}

public fun mint_locked(
    mint_cap: &mut MintCapability,
    amount: u64,
    recipient: address,
    duration: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let coin = mint_internal(mint_cap, amount, ctx);
    let start_date = clock.timestamp_ms();
    let unlock_date = start_date + duration;

    let locker = Locker {
        id: sui::object::new(ctx),
        unlock_date,
        balance: coin::into_balance(coin)
    };

    sui::transfer::public_transfer(locker, recipient);
}

entry fun withdraw_locked(locker: Locker, clock: &Clock, ctx: &mut TxContext): u64 {
    let Locker { id, mut balance, unlock_date} = locker;

    assert!(clock.timestamp_ms() >= unlock_date, ETokenLocked);

    let locked_balance_value = balance.value();

    sui::transfer::public_transfer(
        coin::take(&mut balance, locked_balance_value, ctx),
        ctx.sender()
    );

    balance.destroy_zero();
    sui::object::delete(id);

    locked_balance_value
}



fun mint_internal(
    mint_cap: &mut MintCapability,
    amount: u64,
    ctx: &mut TxContext
): coin::Coin<VIVON> {
    assert!(amount > 0, EInvalidAmount);
    assert!(mint_cap.total_minted + amount <= TOTAL_SUPPLY, ESupplyExceeded);

    let treasury = &mut mint_cap.treasury;
    let coin = coin::mint(treasury, amount, ctx);

    mint_cap.total_minted = mint_cap.total_minted + amount;
    coin
}

#[test_only]
use sui::test_scenario;
#[test_only]
use sui::clock;

#[test]
fun test_init() {
    let publisher = @0x11;

    let mut scenario = test_scenario::begin(publisher);
    {
        let otw = VIVON{};
        init(otw, scenario.ctx());
    };

    scenario.next_tx(publisher);
    {
        let mint_cap = scenario.take_from_sender<MintCapability>();
        let vivon_coin = scenario.take_from_sender<coin::Coin<VIVON>>();

        assert!(mint_cap.total_minted == INITIAL_SUPPLY, EInvalidAmount);
        assert!(vivon_coin.balance().value() == INITIAL_SUPPLY, EInvalidAmount);

        scenario.return_to_sender(vivon_coin);
        scenario.return_to_sender(mint_cap);
    };

    scenario.next_tx(publisher);
    {
        let mut mint_cap = scenario.take_from_sender<MintCapability>();

        mint(
            &mut mint_cap,
            2_000_000_000_000_000,
            scenario.ctx().sender(),
            scenario.ctx()
        );

        assert!(mint_cap.total_minted == TOTAL_SUPPLY, EInvalidAmount);

        scenario.return_to_sender(mint_cap);
    };

    scenario.end();
}

#[test]
fun test_lock_tokens() {
    let publisher = @0x11;
    let bob = @0xB0B;

    let mut scenario = test_scenario::begin(publisher);
    {
        let otw = VIVON{};
        init(otw, scenario.ctx());
    };

    scenario.next_tx(publisher);
    {
        let mut mint_cap = scenario.take_from_sender<MintCapability>();
        let duration = 5000;
        let test_clock = clock::create_for_testing(scenario.ctx()); // 0 + 5000

        mint_locked(
            &mut mint_cap,
            2_000_000_000_000_000,
            bob,
            duration,
            &test_clock,
            scenario.ctx()
        );

        assert!(mint_cap.total_minted == TOTAL_SUPPLY, EInvalidAmount);
        scenario.return_to_sender(mint_cap);
        test_clock.destroy_for_testing();
    };

    scenario.next_tx(bob);
    {
        let locker = scenario.take_from_sender<Locker>();
        let duration = 5000;
        let mut test_clock = clock::create_for_testing(scenario.ctx()); // 0
        test_clock.set_for_testing(duration);

        let amount = withdraw_locked(
            locker,
            &test_clock,
            scenario.ctx()
        );

        assert!(amount == 2_000_000_000_000_000, EInvalidAmount);
        test_clock.destroy_for_testing();
    };

    scenario.next_tx(bob);
    {
        let coin = scenario.take_from_sender<coin::Coin<VIVON>>();
        assert!(coin.balance().value() == 2_000_000_000_000_000, EInvalidAmount);
        scenario.return_to_sender(coin);
    };

    scenario.end();
}

#[test]
#[expected_failure(abort_code = ESupplyExceeded)]
fun test_lock_overflow() {
    let publisher = @0x11;
    let bob = @0xB0B;

    let mut scenario = test_scenario::begin(publisher);
    {
        let otw = VIVON{};
        init(otw, scenario.ctx());
    };

    scenario.next_tx(publisher);
    {
        let mut mint_cap = scenario.take_from_sender<MintCapability>();
        let duration = 5000;
        let test_clock = clock::create_for_testing(scenario.ctx()); // 0 + 5000

        mint_locked(
            &mut mint_cap,
            2_000_000_000_000_001,
            bob,
            duration,
            &test_clock,
            scenario.ctx()
        );

        scenario.return_to_sender(mint_cap);
        test_clock.destroy_for_testing();
    };

    scenario.end();
}

#[test]
#[expected_failure(abort_code = ESupplyExceeded)]
fun test_mint_overflow() {
    let publisher = @0x11;

    let mut scenario = test_scenario::begin(publisher);
    {
        let otw = VIVON{};
        init(otw, scenario.ctx());
    };

    scenario.next_tx(publisher);
    {
        let mut mint_cap = scenario.take_from_sender<MintCapability>();

        mint(
            &mut mint_cap,
            2_000_000_000_000_001,
            scenario.ctx().sender(),
            scenario.ctx()
        );

        scenario.return_to_sender(mint_cap);
    };

    scenario.end();
}

#[test]
#[expected_failure(abort_code = ETokenLocked)]
fun test_withdraw_locked_before_unlock() {
    let publisher = @0x11;
    let bob = @0xB0B;

    let mut scenario = test_scenario::begin(publisher);
    {
        let otw = VIVON{};
        init(otw, scenario.ctx());
    };

    scenario.next_tx(publisher);
    {
        let mut mint_cap = scenario.take_from_sender<MintCapability>();
        let duration = 5000;
        let test_clock = clock::create_for_testing(scenario.ctx()); // 0 + 5000

        mint_locked(
            &mut mint_cap,
            2_000_000_000_000_000,
            bob,
            duration,
            &test_clock,
            scenario.ctx()
        );

        assert!(mint_cap.total_minted == TOTAL_SUPPLY, EInvalidAmount);
        scenario.return_to_sender(mint_cap);
        test_clock.destroy_for_testing();
    };

    scenario.next_tx(bob);
    {
        let locker = scenario.take_from_sender<Locker>();
        let duration = 4999;
        let mut test_clock = clock::create_for_testing(scenario.ctx()); // 0
        test_clock.set_for_testing(duration);

        withdraw_locked(
            locker,
            &test_clock,
            scenario.ctx()
        );

        test_clock.destroy_for_testing();
    };

    scenario.end();
} 