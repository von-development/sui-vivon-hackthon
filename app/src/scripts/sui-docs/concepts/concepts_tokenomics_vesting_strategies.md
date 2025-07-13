# https://docs.sui.io/concepts/tokenomics/vesting-strategies

[Skip to main content](https://docs.sui.io/concepts/tokenomics/vesting-strategies#__docusaurus_skipToContent_fallback)

On this page

If you plan to launch a token on Sui, then you might consider implementing a vesting strategy to strengthen the long-term outlook of your token. A vesting strategy typically releases your tokens to team members, investors, or other early stakeholders over time, rather than releasing them all at once.

Implementing and publishing the details of your vesting strategy helps to:

- Ensure long-term commitment of your token.
- Prevent market dumps.
- Allay fears of rug pulls (immediate withdraw of a large amount of early tokens that hurts token value).
- Align stakeholder incentives with the project's success.

## Vesting options [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#vesting-options "Direct link to Vesting options")

There are different vesting strategies available for your token launch. The best option for your project depends on a number of factors unique to your project and its goals.

The following sections highlight some available options to consider when launching a token on the Sui network.

### Cliff vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#cliff-vesting "Direct link to Cliff vesting")

Cliff vesting refers to a situation where the entire amount of tokens or assets becomes available after a specific period (the “cliff”). Until the cliff period is met, no tokens are released.

Example scenario

Each of the ten employees of a project are granted 1,000 tokens with a one-year cliff. After one year, they receive the full 1,000 tokens. Before the year is up, they have no access to the tokens.

The following smart contract implements a cliff vesting schedule for token releases. The module includes a `new_wallet` function that you pass the total sum of coins to vest and the cliff date as a timestamp. You can then call the `claim` function to retrieve the tokens from the wallet if the cliff date is in the past.

Considering the example scenario, you would call `new_wallet` ten times so that a separate wallet existed for each employee. You would include 1,000 tokens in each call to load the wallet with the necessary funds. Subsequent calls to `claim` using the relevant wallet would compare the cliff time ( `cliff_time` in the `Wallet` object) against the current time, returning tokens from the wallet if the cliff time is later than the current time.

Click to open

`cliff.move`

[examples/vesting/sources/cliff.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/sources/cliff.move)

```codeBlockLines_p187
/// ===========================================================================================
/// Module: cliff
/// Description:
/// This module defines a vesting strategy in which the entire amount is vested after
/// a specific time has passed.
///
/// Functionality:
/// - Defines a cliff vesting schedule.
/// ===========================================================================================
module vesting::cliff;

use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::{Self, Coin};

// === Errors ===
#[error]
const EInvalidCliffTime: vector<u8> = b"Cliff time must be in the future.";

// === Structs ===

/// [Owned] Wallet contains coins that are available for claiming over time.
public struct Wallet<phantom T> has key, store {
		id: UID,
		// Amount of coins remaining in the wallet
		balance: Balance<T>,
		// Cliff time when the entire amount is vested
		cliff_time: u64,
		// Amount of coins that have been claimed
		claimed: u64,
}

// === Public Functions ===

/// Create a new wallet with the given coins and cliff time.
/// Note that full amount of coins is stored in the wallet when it is created;
/// it is just that the coins need to be claimable after the cliff time.
///
/// @aborts with `EInvalidCliffTime` if the cliff time is not in the future.
public fun new_wallet<T>(
		coins: Coin<T>,
		clock: &Clock,
		cliff_time: u64,
		ctx: &mut TxContext,
): Wallet<T> {
		assert!(cliff_time > clock.timestamp_ms(), EInvalidCliffTime);
		Wallet {
				id: object::new(ctx),
				balance: coins.into_balance(),
				cliff_time,
				claimed: 0,
		}
}

/// Claim the coins that are available for claiming at the current time.
public fun claim<T>(self: &mut Wallet<T>, clock: &Clock, ctx: &mut TxContext): Coin<T> {
		let claimable_amount = self.claimable(clock);
		self.claimed = self.claimed + claimable_amount;
		coin::from_balance(self.balance.split(claimable_amount), ctx)
}

/// Calculate the amount of coins that can be claimed at the current time.
public fun claimable<T>(self: &Wallet<T>, clock: &Clock): u64 {
		let timestamp = clock.timestamp_ms();
		if (timestamp < self.cliff_time) return 0;
		self.balance.value()
}

/// Delete the wallet if it is empty.
public fun delete_wallet<T>(self: Wallet<T>) {
		let Wallet { id, balance, cliff_time: _, claimed: _ } = self;
		id.delete();
		balance.destroy_zero();
}

// === Accessors ===

/// Get the balance of the wallet.
public fun balance<T>(self: &Wallet<T>): u64 {
		self.balance.value()
}

/// Get the cliff time of the vesting schedule.
public fun cliff_time<T>(self: &Wallet<T>): u64 {
		self.cliff_time
}

```

### Graded vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#graded-vesting "Direct link to Graded vesting")

Graded vesting allows tokens to be gradually released over time, often in equal portions, during the vesting period.

Example scenario

An employee receives 1,200 tokens, with 300 tokens vesting every year over four years. At the end of each year, 300 tokens become available.

The following [Hybrid vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#hybrid-vesting) section includes a smart contract that demonstrates how to perform graded vesting.

### Hybrid vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#hybrid-vesting "Direct link to Hybrid vesting")

Hybrid vesting combines different vesting models, such as cliff and graded vesting. This allows flexibility in how tokens are released over time.

Example scenario

50% of tokens are released after a one-year cliff, and the rest are distributed linearly over the next three years.

The following smart contract creates a hybrid vesting model. Like the cliff vesting smart contract, the hybrid model defines a `Wallet` struct to hold all the tokens for each stakeholder. This wallet, however, actually contains two different wallets that each follow a different set of vesting rules. When you call the `new_wallet` method for this contract, you provide the cliff cutoff timestamp, the timestamp for when the linear schedule begins, and a timestamp for when the linear vesting should end. Calls to `claim` then return the sum of tokens that fall within those parameters.

Click to open

`hybrid.move`

[examples/vesting/sources/hybrid.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/sources/hybrid.move)

```codeBlockLines_p187
/// ===========================================================================================
/// Module: hybrid
/// Description:
/// This module defines a vesting strategy in which half of the tokens are cliff vested,
/// and the other half are linearly vested.
///
/// Functionality:
/// - Defines a hybrid vesting schedule.
/// ===========================================================================================
module vesting::hybrid;

use sui::clock::Clock;
use sui::coin::{Self, Coin};
use vesting::cliff;
use vesting::linear;

// === Structs ===

/// [Owned] Wallet contains coins that are available for claiming over time.
public struct Wallet<phantom T> has key, store {
		id: UID,
		// A wallet that uses cliff vesting for the first half of the balance
		cliff_vested: cliff::Wallet<T>,
		// A wallet that uses linear vesting for the second half of the balance
		linear_vested: linear::Wallet<T>,
}

// === Public Functions ===

/// Create a new wallet with the given coins and vesting duration.
/// Note that full amount of coins is stored in the wallet when it is created;
/// it is just that the coins need to be claimed over time.
/// The first half of the coins are cliff vested, which takes start_cliff time to vest.
/// The second half of the coins are linearly vested, which starts at start_linear time
public fun new_wallet<T>(
		coins: Coin<T>,
		clock: &Clock,
		start_cliff: u64,
		start_linear: u64,
		duration_linear: u64,
		ctx: &mut TxContext,
): Wallet<T> {
		let mut balance = coins.into_balance();
		let balance_cliff = balance.value() * 50 / 100;
		Wallet {
				id: object::new(ctx),
				cliff_vested: cliff::new_wallet(
						coin::from_balance(balance.split(balance_cliff), ctx),
						clock,
						start_cliff,
						ctx,
				),
				linear_vested: linear::new_wallet(
						coin::from_balance(balance, ctx),
						clock,
						start_linear,
						duration_linear,
						ctx,
				),
		}
}

/// Claim the coins that are available for claiming at the current time.
public fun claim<T>(self: &mut Wallet<T>, clock: &Clock, ctx: &mut TxContext): Coin<T> {
		let mut coin_cliff = self.cliff_vested.claim(clock, ctx);
		let coin_linear = self.linear_vested.claim(clock, ctx);
		coin_cliff.join(coin_linear);
		coin_cliff
}

/// Calculate the amount of coins that can be claimed at the current time.
public fun claimable<T>(self: &Wallet<T>, clock: &Clock): u64 {
		self.cliff_vested.claimable(clock) + self.linear_vested.claimable(clock)
}

/// Delete the wallet if it is empty.
public fun delete_wallet<T>(self: Wallet<T>) {
		let Wallet {
				id,
				cliff_vested,
				linear_vested,
		} = self;
		cliff_vested.delete_wallet();
		linear_vested.delete_wallet();
		id.delete();
}

// === Accessors ===

/// Get the balance of the wallet.
public fun balance<T>(self: &Wallet<T>): u64 {
		self.cliff_vested.balance() + self.linear_vested.balance()
}

```

### Backloaded vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#backloaded-vesting "Direct link to Backloaded vesting")

Backloaded vesting distributes the majority of tokens near the end of the vesting period, rather than evenly over time. This approach can help an ecosystem become more mature before large amounts of tokens become unlocked. Team members and stakeholders can be rewarded early but save the biggest rewards for those that remain with the project for a greater length of time.

Example scenario

An employee's tokens release under the following schedule:

- 10% in the first three years
- 90% in the fourth year

The smart contract for backloaded vesting creates two `Wallet` objects inside a parent wallet, which contains all the tokens to be vested. Each of the child wallets is responsible for its own vesting schedule. You call `new_wallet` with the coins to vest and `start_front`, `start_back`, `duration`, and `back_percentage` values. Based on the values you provide, the contract determines how many tokens to return when the wallet owner calls the `claim` function.

For the example scenario, you could pass the start timestamp for the frontload and the start timestamp for the backload (three years after the frontload start). You would also pass the duration of four years ( `126230400000`) and `90` for the `back_percentage` value.

Click to open

`backloaded.move`

[examples/vesting/sources/backloaded.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/sources/backloaded.move)

```codeBlockLines_p187
/// ===========================================================================================
/// Module: backloaded
/// Description:
/// This module defines a vesting strategy in which the majority amount is vested
/// near the end of a vesting period.
/// The vesting schedule is split into two portions: the front portion and the back portion.
/// Each portion is implemented using linear vesting schedules.
///
/// Functionality:
/// - Defines a backloaded vesting schedule.
/// ===========================================================================================
module vesting::backloaded;

use sui::clock::Clock;
use sui::coin::{Self, Coin};
use vesting::linear;

// === Errors ===
#[error]
const EInvalidBackStartTime: vector<u8> =
		b"Start time of back portion must be after front portion.";
#[error]
const EInvalidPercentageRange: vector<u8> = b"Percentage range must be between 50 to 100.";
#[error]
const EInsufficientBalance: vector<u8> = b"Not enough balance for vesting.";
#[error]
const EInvalidDuration: vector<u8> = b"Duration must be long enough to complete back portion.";

// === Structs ===

/// [Owned] Wallet contains coins that are available for claiming over time.
public struct Wallet<phantom T> has key, store {
		id: UID,
		// A wallet that stores the front (first) portion of the balance
		front: linear::Wallet<T>,
		// A wallet that stores the back (last) portion of the balance
		back: linear::Wallet<T>,
		// Time when the vesting started
		start_front: u64,
		// Time when the back portion of the vesting started; start_front < start_back
		start_back: u64,
		// Total duration of the vesting schedule
		duration: u64,
		// Percentage of balance that is vested in the back portion; value is between 50 and 100
		back_percentage: u8,
}

// === Public Functions ===

/// Create a new wallet with the given coins and vesting duration.
/// Full amount of coins is stored in the wallet when it is created;
/// but the coins are claimed over time.
///
/// When the front portion is vested over a short period of time
/// such that `duration - start_back > start_back - start_front`, then
/// more coins might be claimed in the front portion than the back portion.
/// To prevent this case, make sure that the back portion has higher percentage of the balance
/// via `back_percentage`.
///
/// @aborts with `EInvalidBackStartTime` if the back start time is before the front start time.
/// @aborts with `EInvalidPercentageRange` if the percentage range is not between 50 to 100.
/// @aborts with `EInvalidDuration` if the duration is not long enough to complete the back portion.
/// @aborts with `EInsufficientBalance` if the balance is not enough to split into front and back portions.
public fun new_wallet<T>(
		coins: Coin<T>,
		clock: &Clock,
		start_front: u64,
		start_back: u64,
		duration: u64,
		back_percentage: u8,
		ctx: &mut TxContext,
): Wallet<T> {
		assert!(start_back > start_front, EInvalidBackStartTime);
		assert!(back_percentage > 50 && back_percentage <= 100, EInvalidPercentageRange);
		assert!(duration > start_back - start_front, EInvalidDuration);
		let mut balance = coins.into_balance();
		let balance_back = balance.value() * (back_percentage as u64) / 100;
		let balance_front = balance.value() - balance_back;
		assert!(balance_front > 0 && balance_back > 0, EInsufficientBalance);
		Wallet {
				id: object::new(ctx),
				front: linear::new_wallet(
						coin::from_balance(balance.split(balance_front), ctx),
						clock,
						start_front,
						start_back - start_front,
						ctx,
				),
				back: linear::new_wallet(
						coin::from_balance(balance, ctx),
						clock,
						start_back,
						duration - (start_back - start_front),
						ctx,
				),
				start_front,
				start_back,
				duration,
				back_percentage,
		}
}

/// Claim the coins that are available for claiming at the current time.
public fun claim<T>(self: &mut Wallet<T>, clock: &Clock, ctx: &mut TxContext): Coin<T> {
		let mut coin_front = self.front.claim(clock, ctx);
		let coin_back = self.back.claim(clock, ctx);
		coin_front.join(coin_back);
		coin_front
}

/// Calculate the amount of coins that can be claimed at the current time.
public fun claimable<T>(self: &Wallet<T>, clock: &Clock): u64 {
		self.front.claimable(clock) + self.back.claimable(clock)
}

/// Delete the wallet if it is empty.
public fun delete_wallet<T>(self: Wallet<T>) {
		let Wallet {
				id,
				front,
				back,
				start_front: _,
				start_back: _,
				duration: _,
				back_percentage: _,
		} = self;
		front.delete_wallet();
		back.delete_wallet();
		id.delete();
}

// === Accessors ===

/// Get the balance of the wallet.
public fun balance<T>(self: &Wallet<T>): u64 {
		self.front.balance() + self.back.balance()
}

/// Get the start time of the vesting schedule.
public fun start<T>(self: &Wallet<T>): u64 {
		self.start_front
}

/// Get the duration of the vesting schedule.
public fun duration<T>(self: &Wallet<T>): u64 {
		self.duration
}

```

### Milestone- or performance-based vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#milestone "Direct link to Milestone- or performance-based vesting")

With performance-based vesting, achieving specific goals or metrics trigger vest events, such as hitting revenue targets or progressing through project stages.

Example scenario

A team's tokens vest in relation to the number of monthly active users (MAUs). All tokens become vested after the platform reaches its goal of 10 million MAUs.

Similarly, milestone-based vesting creates vest events when specific project or personal milestones are achieved, rather than being tied to time-based conditions.

Example scenario

Tokens unlock when the mainnet of a blockchain project launches.

Like the other examples, the following smart contract creates a wallet to hold the coins to be distributed. Unlike the others, however, this `Wallet` object includes a `milestone_controller` field that you set to the address of the account that has the authority to update the milestone progress. The call to the `new_wallet` function aborts with an error if the wallet has the same address as the entity with milestone update privileges as an integrity check.

The milestone update authority can call `update_milestone_percentage` to update the percentage-to-complete value. The owner of the vested token wallet can call `claim` to retrieve the tokens that are unlocked based on the current percentage-to-complete value. Considering the first example scenario, you could update the milestone value by ten percent for every million MAUs the project achieves. You could use the same contract for the second scenario, updating the percentage one time to 100 only after mainnet launches.

Click to open

`milestone.move`

[examples/vesting/sources/milestone.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/sources/milestone.move)

```codeBlockLines_p187
/// ===========================================================================================
/// Module: milestone
/// Description:
/// This module defines a vesting strategy that allows users to claim coins
/// as the milestones are achieved.
///
/// Functionality:
/// - Defines a milestone-based vesting schedule.
/// ===========================================================================================
module vesting::milestone;

use sui::balance::Balance;
use sui::coin::{Self, Coin};

// === Errors ===
#[error]
const EOwnerIsController: vector<u8> = b"Owner cannot be the milestone controller.";
#[error]
const EUnauthorizedOwner: vector<u8> = b"Unauthorized owner.";
#[error]
const EUnauthorizedMilestoneController: vector<u8> = b"Unauthorized milestone controller.";
#[error]
const EMilestonePercentageRange: vector<u8> = b"Invalid milestone percentage.";
#[error]
const EInvalidNewMilestone: vector<u8> =
		b"New milestone must be greater than the current milestone.";

// === Structs ===

/// [Shared] Wallet contains coins that are available for claiming.
public struct Wallet<phantom T> has key, store {
		id: UID,
		// Amount of coins remaining in the wallet
		balance: Balance<T>,
		// Amount of coins that have been claimed
		claimed: u64,
		// Achieved milestone in percentage from 0 to 100
		milestone_percentage: u8,
		// Owner of the wallet
		owner: address,
		// Milestone controller of the wallet
		milestone_controller: address,
}

// === Public Functions ===

/// Create a new wallet with the given coins and vesting duration.
/// Note that full amount of coins is stored in the wallet when it is created;
/// it is just that the coins need to be claimed as the milestones are achieved.
///
/// @aborts with `EOwnerIsController` if the owner is same as the milestone controller.
public fun new_wallet<T>(
		coins: Coin<T>,
		owner: address,
		milestone_controller: address,
		ctx: &mut TxContext,
) {
		assert!(owner != milestone_controller, EOwnerIsController);
		let wallet = Wallet {
				id: object::new(ctx),
				balance: coins.into_balance(),
				claimed: 0,
				milestone_percentage: 0,
				owner,
				milestone_controller,
		};
		transfer::share_object(wallet);
}

/// Claim the coins that are available based on the current milestone.
///
/// @aborts with `EUnauthorizedUser` if the sender is not the owner of the wallet.
public fun claim<T>(self: &mut Wallet<T>, ctx: &mut TxContext): Coin<T> {
		assert!(self.owner == ctx.sender(), EUnauthorizedOwner);
		let claimable_amount = self.claimable();
		self.claimed = self.claimed + claimable_amount;
		coin::from_balance(self.balance.split(claimable_amount), ctx)
}

/// Calculate the current amount of coins that can be claimed.
public fun claimable<T>(self: &Wallet<T>): u64 {
		// Convert the balance to u128 to account for overflow in the calculation
		let claimable: u128 =
				(self.balance.value() + self.claimed as u128) * (self.milestone_percentage as u128) / 100;
		// Adjust the claimable amount by subtracting the already claimed amount
		(claimable as u64) - self.claimed
}

/// Update the milestone percentage of the wallet.
///
/// @aborts with `EUnauthorizedMilestoneController` if the sender is not the milestone controller.
/// @aborts with `EMilestonePercentageRange` if the new milestone percentage is invalid.
/// @aborts with `EInvalidNewMilestone` if the new milestone is not greater than the current milestone.
public fun update_milestone_percentage<T>(
		self: &mut Wallet<T>,
		percentage: u8,
		ctx: &mut TxContext,
) {
		assert!(self.milestone_controller == ctx.sender(), EUnauthorizedMilestoneController);
		assert!(percentage > 0 && percentage <= 100, EMilestonePercentageRange);
		assert!(percentage > self.milestone_percentage, EInvalidNewMilestone);
		self.milestone_percentage = percentage;
}

/// Delete the wallet if it is empty.
public fun delete_wallet<T>(self: Wallet<T>) {
		let Wallet {
				id,
				balance,
				claimed: _,
				milestone_percentage: _,
				owner: _,
				milestone_controller: _,
		} = self;
		id.delete();
		balance.destroy_zero();
}

// === Accessors ===

/// Get the remaining balance of the wallet.
public fun balance<T>(self: &Wallet<T>): u64 {
		self.balance.value()
}

/// Get the start time of the vesting schedule.
public fun milestone<T>(self: &Wallet<T>): u8 {
		self.milestone_percentage
}

/// Get the owner of the wallet.
public fun get_owner<T>(self: &Wallet<T>): address {
		self.owner
}

/// Get the milestone controller of the wallet.
public fun get_milestone_controller<T>(self: &Wallet<T>): address {
		self.milestone_controller
}

```

### Linear vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#linear-vesting "Direct link to Linear vesting")

With linear vesting, tokens are released gradually over a set time period.

Example scenario

An employee is granted 1,000 tokens to be gradually released over a one-year period.

The linear vesting smart contract creates a `Wallet` object with `start` and `duration` fields. The contract uses those values along with the current time to determine the number of tokens that are vested. The current time, in this case, is the time at which the wallet owner calls the `claim` function.

For the example scenario, you create the wallet (call `new_wallet`) with 1,000 tokens, the timestamp for the employee start date, and one year ( `31557600000`) as the duration.

Click to open

`linear.move`

[examples/vesting/sources/linear.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/sources/linear.move)

```codeBlockLines_p187
/// ===========================================================================================
/// Module: linear
/// Description:
/// This module defines a vesting strategy that allows users to claim coins linearly over time.
///
/// Functionality:
/// - Defines a linear vesting schedule.
/// ===========================================================================================
module vesting::linear;

use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::{Self, Coin};

// === Errors ===
#[error]
const EInvalidStartTime: vector<u8> = b"Start time must be in the future.";

// === Structs ===

/// [Owned] Wallet contains coins that are available for claiming over time.
public struct Wallet<phantom T> has key, store {
		id: UID,
		// Amount of coins remaining in the wallet
		balance: Balance<T>,
		// Time when the vesting started
		start: u64,
		// Amount of coins that have been claimed
		claimed: u64,
		// Total duration of the vesting schedule
		duration: u64,
}

// === Public Functions ===

/// Create a new wallet with the given coins and vesting duration.
/// Note that full amount of coins is stored in the wallet when it is created;
/// it is just that the coins need to be claimed over time.
///
/// @aborts with `EInvalidStartTime` if the start time is not in the future.
public fun new_wallet<T>(
		coins: Coin<T>,
		clock: &Clock,
		start: u64,
		duration: u64,
		ctx: &mut TxContext,
): Wallet<T> {
		assert!(start > clock.timestamp_ms(), EInvalidStartTime);
		Wallet {
				id: object::new(ctx),
				balance: coins.into_balance(),
				start,
				claimed: 0,
				duration,
		}
}

/// Claim the coins that are available for claiming at the current time.
public fun claim<T>(self: &mut Wallet<T>, clock: &Clock, ctx: &mut TxContext): Coin<T> {
		let claimable_amount = self.claimable(clock);
		self.claimed = self.claimed + claimable_amount;
		coin::from_balance(self.balance.split(claimable_amount), ctx)
}

/// Calculate the amount of coins that can be claimed at the current time.
public fun claimable<T>(self: &Wallet<T>, clock: &Clock): u64 {
		let timestamp = clock.timestamp_ms();
		if (timestamp < self.start) return 0;
		if (timestamp >= self.start + self.duration) return self.balance.value();
		let elapsed = timestamp - self.start;
		// Convert the balance to u128 to account for overflow in the calculation
		// Note that the division by zero is not possible because when duration is zero, the balance is returned above
		let claimable: u128 =
				(self.balance.value() + self.claimed as u128) * (elapsed as u128) / (self.duration as u128);
		// Adjust the claimable amount by subtracting the already claimed amount
		(claimable as u64) - self.claimed
}

/// Delete the wallet if it is empty.
public fun delete_wallet<T>(self: Wallet<T>) {
		let Wallet { id, start: _, balance, claimed: _, duration: _ } = self;
		id.delete();
		balance.destroy_zero();
}

// === Accessors ===

/// Get the remaining balance of the wallet.
public fun balance<T>(self: &Wallet<T>): u64 {
		self.balance.value()
}

/// Get the start time of the vesting schedule.
public fun start<T>(self: &Wallet<T>): u64 {
		self.start
}

/// Get the duration of the vesting schedule.
public fun duration<T>(self: &Wallet<T>): u64 {
		self.duration
}

```

### Immediate vesting [​](https://docs.sui.io/concepts/tokenomics/vesting-strategies\#immediate-vesting "Direct link to Immediate vesting")

All tokens vest immediately, meaning they are fully available as soon as they are allocated.

Example scenario

An early investor receives their full allocation of tokens at the time of purchase.

With immediate investing, you could always just transfer tokens to an address. Opting for a smart contract approach provides several advantages over a manual transfer, however.

- Enhanced transparency and accountability because the transaction is stored on chain for any interested parties to verify. The smart contract logic identifies the exact purpose of the transaction.
- Possible to enforce specific conditions. For example, you could create a [milestone-based vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#milestone) contract that you update to 100% complete only after some conditions are met, like accepting terms of an agreement.
- Provides an auditable record for compliance and reporting.
- Allows flexibility to perform other actions as the terms of an agreement change, like conversion to another token before claiming.

The following test leverages the [linear vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#linear-vesting) smart contract example to demonstrate how to use one of the other vesting strategy smart contracts to support immediate vesting. The test uses the `Wallet` object and `new_wallet` function from `vesting::linear` to perform (or test) an immediate vest scenario. The test accomplishes this by setting the `duration` value to 0.

Click to open

`immediate_tests.move`

[examples/vesting/tests/immediate\_tests.move](https://github.com/MystenLabs/sui/tree/main/examples/vesting/tests/immediate_tests.move)

```codeBlockLines_p187
#[test_only]
module vesting::immediate_tests;

use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario as ts;
use vesting::linear::{new_wallet, Wallet};

public struct Token has key, store { id: UID }

const OWNER_ADDR: address = @0xAAAA;
const CONTROLLER_ADDR: address = @0xBBBB;
const FULLY_VESTED_AMOUNT: u64 = 10_000;
const VESTING_DURATION: u64 = 0;
const START_TIME: u64 = 1;

fun test_setup(): ts::Scenario {
		let mut ts = ts::begin(CONTROLLER_ADDR);
		let coins = coin::mint_for_testing<SUI>(FULLY_VESTED_AMOUNT, ts.ctx());
		let now = clock::create_for_testing(ts.ctx());
		let wallet = new_wallet(coins, &now, START_TIME, VESTING_DURATION, ts.ctx());
		transfer::public_transfer(wallet, OWNER_ADDR);
		now.destroy_for_testing();
		ts
}

#[test]
fun test_immediate_vesting() {
		let mut ts = test_setup();
		ts.next_tx(OWNER_ADDR);
		let mut now = clock::create_for_testing(ts.ctx());
		let mut wallet = ts.take_from_sender<Wallet<SUI>>();

		// vest immediately
		now.set_for_testing(START_TIME);
		assert!(wallet.claimable(&now) == FULLY_VESTED_AMOUNT);
		assert!(wallet.balance() == FULLY_VESTED_AMOUNT);
		let coins = wallet.claim(&now, ts.ctx());
		transfer::public_transfer(coins, OWNER_ADDR);
		assert!(wallet.claimable(&now) == 0);
		assert!(wallet.balance() == 0);

		ts.return_to_sender(wallet);
		now.destroy_for_testing();
		let _end = ts::end(ts);
}

```

- [Vesting options](https://docs.sui.io/concepts/tokenomics/vesting-strategies#vesting-options)
  - [Cliff vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#cliff-vesting)
  - [Graded vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#graded-vesting)
  - [Hybrid vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#hybrid-vesting)
  - [Backloaded vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#backloaded-vesting)
  - [Milestone- or performance-based vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#milestone)
  - [Linear vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#linear-vesting)
  - [Immediate vesting](https://docs.sui.io/concepts/tokenomics/vesting-strategies#immediate-vesting)