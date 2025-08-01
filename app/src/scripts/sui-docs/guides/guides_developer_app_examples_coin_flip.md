# https://docs.sui.io/guides/developer/app-examples/coin-flip

[Skip to main content](https://docs.sui.io/guides/developer/app-examples/coin-flip#__docusaurus_skipToContent_fallback)

On this page

This example walks you through building a coin flip dApp, covering the full end-to-end flow of building your Sui Move module and connecting it to your React Sui dApp. This coin flip dApp utilizes verifiable random functions (VRFs) to create a fair coin game on the Sui blockchain. The user (human) plays against the house (module) and places a bet on either heads or tails. The user then either receives double their bet, or gets nothing, depending on the outcome of the game.

The guide is split into two parts:

1. [Smart Contracts](https://docs.sui.io/guides/developer/app-examples/coin-flip#smart-contracts): The Move code that sets up the coin flip logic.
2. [Frontend](https://docs.sui.io/guides/developer/app-examples/coin-flip#frontend): A UI that enables the players to place bets and take profits, and the admin to manage the house.

Additional resources

Source code locations for the smart contracts and frontend:

- [Move package repository](https://github.com/MystenLabs/satoshi-coin-flip)
- [Frontend repository](https://github.com/sui-foundation/satoshi-coin-flip-frontend-example)

## What the guide teaches [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#what-the-guide-teaches "Direct link to What the guide teaches")

- **Shared objects:** The guide teaches you how to use [shared objects](https://docs.sui.io/concepts/object-ownership/shared), in this case to create a globally accessible `HouseData` object.
- **One-time witnesses:** The guide teaches you how to use [one-time witnesses](https://docs.sui.io/concepts/sui-move-concepts#one-time-witness) to ensure only a single instance of the `HouseData` object ever exists.
- **Asserts:** The guide teaches you how to use [asserts](https://move-book.com/move-basics/assert-and-abort.html?highlight=asserts#assert) to abort functions due to certain conditions not being met.
- **Address-owned objects:** The guide teaches you how to use [address-owned objects](https://docs.sui.io/concepts/object-ownership/address-owned) when necessary.
- **Events:** The guide teaches you how to emit events in your contracts, which can be used to track on-chain activity. For more information on events, see [Using Events](https://docs.sui.io/guides/developer/sui-101/using-events) for practical usage of events on Sui or [Events in The Move Book](https://move-book.com/programmability/events.html) to learn about event structure and how to emit them in Move.
- **Storage rebates:** The guide shows you best practices regarding [storage fee rebates](https://docs.sui.io/concepts/tokenomics#storage-fund-rewards).
- **MEV attack protection:** The guide introduces you to [MEV attacks](https://github.com/MystenLabs/satoshi-coin-flip?tab=readme-ov-file#mev-attack-resistant-single-player-satoshi-smart-contract-flow), how to make your contracts MEV-resistant, and the trade-offs between protection and user experience.

## What you need [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#what-you-need "Direct link to What you need")

Before getting started, make sure you have:

- [Installed the latest version of Sui](https://docs.sui.io/guides/developer/getting-started/sui-install).

## Smart contracts [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#smart-contracts "Direct link to Smart contracts")

In this part of the guide, you write the Move contracts that manage the house and set up the coin-flip logic. The first step is to [set up a Move package](https://docs.sui.io/guides/developer/first-app/write-package) for storing your Move modules.

info

To follow along with this guide, set your new Move package to `satoshi_flip`.

### House module [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#house-module "Direct link to House module")

This example uses several modules to create a package for the Satoshi Coin Flip game. The first module is `house_data.move`. You need to store the game's data somewhere, and in this module you create a [shared object](https://docs.sui.io/concepts/object-ownership/shared) for all house data.

Create a new file in the `sources` directory with the name `house_data.move` and populate the file with the following code:

[house\_data.move](https://github.com/MystenLabs/sui/tree/main/house_data.move)

```codeBlockLines_p187
module satoshi_flip::house_data {

  use sui::balance::{Self, Balance};
  use sui::sui::SUI;
  use sui::coin::{Self, Coin};
  use sui::package::{Self};

  // Error codes
  const ECallerNotHouse: u64 = 0;
  const EInsufficientBalance: u64 = 1;

```

There are few details to take note of in this code:

1. The first line declares the module name as `house_data` within the package `satoshi_flip`.
2. Seven lines begin with the `use` keyword, which enables this module to use types and functions declared in other modules (in this case, they are all coming from the Sui standard library).
3. Two error codes. These codes are used in assertions and unit tests to ensure that the program is running as intended.

Next, add some more code to this module:

[house\_data.move](https://github.com/MystenLabs/sui/tree/main/house_data.move)

```codeBlockLines_p187
  /// Configuration and Treasury object, managed by the house.
  public struct HouseData has key {
    id: UID,
    balance: Balance<SUI>,
    house: address,
    public_key: vector<u8>,
    max_stake: u64,
    min_stake: u64,
    fees: Balance<SUI>,
    base_fee_in_bp: u16
  }

  /// A one-time use capability to initialize the house data; created and sent
  /// to sender in the initializer.
  public struct HouseCap has key {
    id: UID
  }

  /// Used as a one time witness to generate the publisher.
  public struct HOUSE_DATA has drop {}

  fun init(otw: HOUSE_DATA, ctx: &mut TxContext) {
    // Creating and sending the Publisher object to the sender.
    package::claim_and_keep(otw, ctx);

    // Creating and sending the HouseCap object to the sender.
    let house_cap = HouseCap {
      id: object::new(ctx)
    };

    transfer::transfer(house_cap, ctx.sender());
  }

```

- The first struct, `HouseData`, stores the most essential information pertaining to the game.
- The second struct, `HouseCap`, is a capability that initializes the house data.
- The third struct, `HOUSE_DATA`, is a one-time witness that ensures only a single instance of this `HouseData` ever exists.
- The `init` function creates and sends the `Publisher` and `HouseCap` objects to the sender. See [Module Initializer](https://move-book.com/programmability/module-initializer.html) in The Move Book for more information.

So far, you've set up the data structures within the module. Now, create a function that initializes the house data and shares the `HouseData` object:

[house\_data.move](https://github.com/MystenLabs/sui/tree/main/house_data.move)

```codeBlockLines_p187
  public fun initialize_house_data(house_cap: HouseCap, coin: Coin<SUI>, public_key: vector<u8>, ctx: &mut TxContext) {
    assert!(coin.value() > 0, EInsufficientBalance);

    let house_data = HouseData {
      id: object::new(ctx),
      balance: coin.into_balance(),
      house: ctx.sender(),
      public_key,
      max_stake: 50_000_000_000, // 50 SUI, 1 SUI = 10^9.
      min_stake: 1_000_000_000, // 1 SUI.
      fees: balance::zero(),
      base_fee_in_bp: 100 // 1% in basis points.
    };

    let HouseCap { id } = house_cap;
    object::delete(id);

    transfer::share_object(house_data);
  }

```

With the house data initialized, you also need to add some functions that enable some important administrative tasks for the house to perform:

[house\_data.move](https://github.com/MystenLabs/sui/tree/main/house_data.move)

```codeBlockLines_p187
  public fun top_up(house_data: &mut HouseData, coin: Coin<SUI>, _: &mut TxContext) {
    coin::put(&mut house_data.balance, coin)
  }

  public fun withdraw(house_data: &mut HouseData, ctx: &mut TxContext) {
    // Only the house address can withdraw funds.
    assert!(ctx.sender() == house_data.house(), ECallerNotHouse);

    let total_balance = balance(house_data);
    let coin = coin::take(&mut house_data.balance, total_balance, ctx);
    transfer::public_transfer(coin, house_data.house());
  }

  public fun claim_fees(house_data: &mut HouseData, ctx: &mut TxContext) {
    // Only the house address can withdraw fee funds.
    assert!(ctx.sender() == house_data.house(), ECallerNotHouse);

    let total_fees = fees(house_data);
    let coin = coin::take(&mut house_data.fees, total_fees, ctx);
    transfer::public_transfer(coin, house_data.house());
  }

  public fun update_max_stake(house_data: &mut HouseData, max_stake: u64, ctx: &mut TxContext) {
    // Only the house address can update the base fee.
    assert!(ctx.sender() == house_data.house(), ECallerNotHouse);

    house_data.max_stake = max_stake;
  }

  public fun update_min_stake(house_data: &mut HouseData, min_stake: u64, ctx: &mut TxContext) {
    // Only the house address can update the min stake.
    assert!(ctx.sender() == house_data.house(), ECallerNotHouse);

    house_data.min_stake = min_stake;
  }

```

All of these functions contain an `assert!` call that ensures only the house can call them:

- `top_up`: Add to the balance of the house to ensure that there is enough SUI for future games.
- `withdraw`: Withdraw the entire balance of the house object.
- `claim_fees`: Withdraw the accumulated fees of the house object.
- `update_max_stake`, `update_min_stake`: Update the maximum and minimum stake allowed in the game, respectively.

You have established the data structure of this module, but without the appropriate functions this data is not accessible. Now add helper functions that return mutable references, read-only references, and test-only functions:

[house\_data.move](https://github.com/MystenLabs/sui/tree/main/house_data.move)

```codeBlockLines_p187
  // --------------- Mutable References ---------------

  public(package) fun borrow_balance_mut(house_data: &mut HouseData): &mut Balance<SUI> {
    &mut house_data.balance
  }

  public(package) fun borrow_fees_mut(house_data: &mut HouseData): &mut Balance<SUI> {
    &mut house_data.fees
  }

  public(package) fun borrow_mut(house_data: &mut HouseData): &mut UID {
    &mut house_data.id
  }

  // --------------- Read-only References ---------------

  /// Returns a reference to the house id.
  public(package) fun borrow(house_data: &HouseData): &UID {
    &house_data.id
  }

  /// Returns the balance of the house.
  public fun balance(house_data: &HouseData): u64 {
    house_data.balance.value()
  }

  /// Returns the address of the house.
  public fun house(house_data: &HouseData): address {
    house_data.house
  }

  /// Returns the public key of the house.
  public fun public_key(house_data: &HouseData): vector<u8> {
    house_data.public_key
  }

  /// Returns the max stake of the house.
  public fun max_stake(house_data: &HouseData): u64 {
    house_data.max_stake
  }

  /// Returns the min stake of the house.
  public fun min_stake(house_data: &HouseData): u64 {
    house_data.min_stake
  }

  /// Returns the fees of the house.
  public fun fees(house_data: &HouseData): u64 {
    house_data.fees.value()
  }

  /// Returns the base fee.
  public fun base_fee_in_bp(house_data: &HouseData): u16 {
    house_data.base_fee_in_bp
  }

  // --------------- Test-only Functions ---------------

  #[test_only]
  public fun init_for_testing(ctx: &mut TxContext) {
    init(HOUSE_DATA {}, ctx);
  }
}

```

And with that, your `house_data.move` code is complete.

### Counter module [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#counter-module "Direct link to Counter module")

In the same `sources` directory, now create a file named `counter_nft.move`. A `Counter` object is used as the VRF input for every game that a player plays. First, populate the file with the following:

[counter\_nft.move](https://github.com/MystenLabs/sui/tree/main/counter_nft.move)

```codeBlockLines_p187
module satoshi_flip::counter_nft {

  use sui::bcs::{Self};

  public struct Counter has key {
    id: UID,
    count: u64,
  }

  entry fun burn(self: Counter) {
    let Counter { id, count: _ } = self;
    object::delete(id);
  }

  public fun mint(ctx: &mut TxContext): Counter {
    Counter {
      id: object::new(ctx),
      count: 0
    }
  }

  public fun transfer_to_sender(counter: Counter, ctx: &mut TxContext) {
    transfer::transfer(counter, tx_context::sender(ctx));
  }

```

This might look familiar from the house module. You set the module name, import functions from the standard library, and initialize the `Counter` object. The `Counter` object has the `key` ability, but does not have `store` \- this prevents the object from being transferable.

In addition, you create `mint` and `transfer_to_sender` functions used when the game is set up to create the `Counter` object (with an initial count of `0`) and transfer the object to the sender of the transaction. And finally a `burn` function to allow deletion of the `Counter`.

You have a `Counter` object, as well as functions that initialize and burn the object, but you need a way to increment the counter. Add the following code to the module:

[counter\_nft.move](https://github.com/MystenLabs/sui/tree/main/counter_nft.move)

```codeBlockLines_p187
  public fun get_vrf_input_and_increment(self: &mut Counter): vector<u8> {
    let mut vrf_input = object::id_bytes(self);
    let count_to_bytes = bcs::to_bytes(&count(self));
    vrf_input.append(count_to_bytes);
    self.increment();
    vrf_input
  }

  public fun count(self: &Counter): u64 {
    self.count
  }

  fun increment(self: &mut Counter) {
    self.count = self.count + 1;
  }

  #[test_only]
  public fun burn_for_testing(self: Counter) {
    self.burn();
  }
}

```

The `get_vrf_input_and_increment` function is the core of this module. The function takes a mutable reference to the `Counter` object that the `mint` function creates, then appends the `Counter` object's current count to its ID and returns the result as a `vector<u8>`. The function then calls the internal `increment` function to increment the count by one.

This code also adds a `count` function that returns the current count, and a test-only function that calls the `burn` function.

### Game module [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#game-module "Direct link to Game module")

Lastly, you need a game module and object that can create a new game, distribute funds after the game, and potentially cancel games. Because this is a one-player game, create an [address-owned object](https://docs.sui.io/concepts/object-ownership/address-owned) rather than a [shared object](https://docs.sui.io/concepts/object-ownership/shared).

Create the game module. In the `sources` directory, create a new file called `single_player_satoshi.move` and populate with the following:

[single\_player\_satoshi.move](https://github.com/MystenLabs/sui/tree/main/single_player_satoshi.move)

```codeBlockLines_p187
module satoshi_flip::single_player_satoshi {
  use std::string::String;

  use sui::coin::{Self, Coin};
  use sui::balance::Balance;
  use sui::sui::SUI;
  use sui::bls12381::bls12381_min_pk_verify;
  use sui::event::emit;
  use sui::hash::{blake2b256};
  use sui::dynamic_object_field::{Self as dof};

  use satoshi_flip::counter_nft::Counter;
  use satoshi_flip::house_data::HouseData;

  const EPOCHS_CANCEL_AFTER: u64 = 7;
  const GAME_RETURN: u8 = 2;
  const PLAYER_WON_STATE: u8 = 1;
  const HOUSE_WON_STATE: u8 = 2;
  const CHALLENGED_STATE: u8 = 3;
  const HEADS: vector<u8> = b"H";
  const TAILS: vector<u8> = b"T";

  const EStakeTooLow: u64 = 0;
  const EStakeTooHigh: u64 = 1;
  const EInvalidBlsSig: u64 = 2;
  const ECanNotChallengeYet: u64 = 3;
  const EInvalidGuess: u64 = 4;
  const EInsufficientHouseBalance: u64 = 5;
  const EGameDoesNotExist: u64 = 6;

  public struct NewGame has copy, drop {
    game_id: ID,
    player: address,
    vrf_input: vector<u8>,
    guess: String,
    user_stake: u64,
    fee_bp: u16
  }

  public struct Outcome has copy, drop {
    game_id: ID,
    status: u8
  }

```

This code follows the same pattern as the others. First, you include the respective imports, although this time the imports are not only from the standard library but also include modules created previously in this example. You also create several constants (in upper case), as well as constants used for errors (Pascal case prefixed with `E`).

Lastly in this section, you also create structs for two events to emit. Indexers consume emitted events, which enables you to track these events through API services, or your own indexer. In this case, the events are for when a new game begins ( `NewGame`) and for the outcome of a game when it has finished ( `Outcome`).

Add a struct to the module:

[single\_player\_satoshi.move](https://github.com/MystenLabs/sui/tree/main/single_player_satoshi.move)

```codeBlockLines_p187
  public struct Game has key, store {
    id: UID,
    guess_placed_epoch: u64,
    total_stake: Balance<SUI>,
    guess: String,
    player: address,
    vrf_input: vector<u8>,
    fee_bp: u16
  }

```

The `Game` struct represents a single game and all its information, including the epoch the player placed the bet ( `guess_placed_epoch`), bet ( `total_stake`), `guess`, address of the `player`, `vrf_input`, and the fee the house collects ( `fee_bp`).

Now take a look at the main function in this game, `finish_game`:

[single\_player\_satoshi.move](https://github.com/MystenLabs/sui/tree/main/single_player_satoshi.move)

```codeBlockLines_p187
  public fun finish_game(game_id: ID, bls_sig: vector<u8>, house_data: &mut HouseData, ctx: &mut TxContext) {
    // Ensure that the game exists.
    assert!(game_exists(house_data, game_id), EGameDoesNotExist);

    let Game {
      id,
      guess_placed_epoch: _,
      mut total_stake,
      guess,
      player,
      vrf_input,
      fee_bp
    } = dof::remove<ID, Game>(house_data.borrow_mut(), game_id);

    object::delete(id);

    // Step 1: Check the BLS signature, if its invalid abort.
    let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key(), &vrf_input);
    assert!(is_sig_valid, EInvalidBlsSig);

    // Hash the beacon before taking the 1st byte.
    let hashed_beacon = blake2b256(&bls_sig);
    // Step 2: Determine winner.
    let first_byte = hashed_beacon[0];
    let player_won = map_guess(guess) == (first_byte % 2);

    // Step 3: Distribute funds based on result.
    let status = if (player_won) {
      // Step 3.a: If player wins transfer the game balance as a coin to the player.
      // Calculate the fee and transfer it to the house.
      let stake_amount = total_stake.value();
      let fee_amount = fee_amount(stake_amount, fee_bp);
      let fees = total_stake.split(fee_amount);
      house_data.borrow_fees_mut().join(fees);

      // Calculate the rewards and take it from the game stake.
      transfer::public_transfer(total_stake.into_coin(ctx), player);
      PLAYER_WON_STATE
    } else {
      // Step 3.b: If house wins, then add the game stake to the house_data.house_balance (no fees are taken).
      house_data.borrow_balance_mut().join(total_stake);
      HOUSE_WON_STATE
    };

    emit(Outcome {
      game_id,
      status
    });
  }

```

- First, the function makes sure the `Game` object exists, then deletes it, as after the game concludes the metadata is no longer needed. Freeing up unnecessary storage is not only recommended, but [incentivized through rebates on storage fees](https://docs.sui.io/concepts/tokenomics#storage-fund-rewards).
- In step 1, the function checks to see if the BLS signature is valid. This is to ensure the game is truly random.
- In step 2, the function checks to see if the player's guess, heads ( `0`) or tails ( `1`), is the same as that of the house. This is done by taking the first byte of the randomized vector and checking to see if it's divisible by two. If it is, it is heads, if it is not, it is tails.
- In step 3, if the player won, meaning the player's guess matched the results of the house, the logic transfers fees from the stake to the house, then distributes the rest of the principle plus an equal amount from the house's balance back to the player. If the player loses, the logic transfers the entire stake to the house, and takes no fees.
- Lastly, the game emits its outcome as an event.

Now add a function that handles game disputes:

[single\_player\_satoshi.move](https://github.com/MystenLabs/sui/tree/main/single_player_satoshi.move)

```codeBlockLines_p187
  public fun dispute_and_win(house_data: &mut HouseData, game_id: ID, ctx: &mut TxContext) {
    // Ensure that the game exists.
    assert!(game_exists(house_data, game_id), EGameDoesNotExist);

    let Game {
      id,
      guess_placed_epoch,
      total_stake,
      guess: _,
      player,
      vrf_input: _,
      fee_bp: _
    } = dof::remove(house_data.borrow_mut(), game_id);

    object::delete(id);

    let caller_epoch = ctx.epoch();
    let cancel_epoch = guess_placed_epoch + EPOCHS_CANCEL_AFTER;
    // Ensure that minimum epochs have passed before user can cancel.
    assert!(cancel_epoch <= caller_epoch, ECanNotChallengeYet);

    transfer::public_transfer(total_stake.into_coin(ctx), player);

    emit(Outcome {
      game_id,
      status: CHALLENGED_STATE
    });
  }

```

This function, `dispute_and_win`, ensures that no bet can live in “purgatory”. After a certain amount of time passes, the player can call this function and get all of their funds back.

The rest of the functions are accessors and helper functions used to retrieve values, check if values exist, initialize the game, and so on:

[single\_player\_satoshi.move](https://github.com/MystenLabs/sui/tree/main/single_player_satoshi.move)

```codeBlockLines_p187
  // --------------- Read-only References ---------------

  public fun guess_placed_epoch(game: &Game): u64 {
    game.guess_placed_epoch
  }

  public fun stake(game: &Game): u64 {
    game.total_stake.value()
  }

  public fun guess(game: &Game): u8 {
    map_guess(game.guess)
  }

  public fun player(game: &Game): address {
    game.player
  }

  public fun vrf_input(game: &Game): vector<u8> {
    game.vrf_input
  }

  public fun fee_in_bp(game: &Game): u16 {
    game.fee_bp
  }

  // --------------- Helper functions ---------------

  /// Public helper function to calculate the amount of fees to be paid.
  public fun fee_amount(game_stake: u64, fee_in_bp: u16): u64 {
    ((((game_stake / (GAME_RETURN as u64)) as u128) * (fee_in_bp as u128) / 10_000) as u64)
  }

  /// Helper function to check if a game exists.
  public fun game_exists(house_data: &HouseData, game_id: ID): bool {
    dof::exists_(house_data.borrow(), game_id)
  }

  /// Helper function to check that a game exists and return a reference to the game Object.
  /// Can be used in combination with any accessor to retrieve the desired game field.
  public fun borrow_game(game_id: ID, house_data: &HouseData): &Game {
    assert!(game_exists(house_data, game_id), EGameDoesNotExist);
    dof::borrow(house_data.borrow(), game_id)
  }

  /// Internal helper function used to create a new game.
  fun internal_start_game(guess: String, counter: &mut Counter, coin: Coin<SUI>, house_data: &mut HouseData, fee_bp: u16, ctx: &mut TxContext): (ID, Game) {
    // Ensure guess is valid.
    map_guess(guess);
    let user_stake = coin.value();
    // Ensure that the stake is not higher than the max stake.
    assert!(user_stake <= house_data.max_stake(), EStakeTooHigh);
    // Ensure that the stake is not lower than the min stake.
    assert!(user_stake >= house_data.min_stake(), EStakeTooLow);
    // Ensure that the house has enough balance to play for this game.
    assert!(house_data.balance() >= user_stake, EInsufficientHouseBalance);

    // Get the house's stake.
    let mut total_stake = house_data.borrow_balance_mut().split(user_stake);
    coin::put(&mut total_stake, coin);

    let vrf_input = counter.get_vrf_input_and_increment();

    let id = object::new(ctx);
    let game_id = object::uid_to_inner(&id);

    let new_game = Game {
      id,
      guess_placed_epoch: ctx.epoch(),
      total_stake,
      guess,
      player: ctx.sender(),
      vrf_input,
      fee_bp
    };

    emit(NewGame {
      game_id,
      player: ctx.sender(),
      vrf_input,
      guess,
      user_stake,
      fee_bp
    });

    (game_id, new_game)
  }

  /// Helper function to map (H)EADS and (T)AILS to 0 and 1 respectively.
  /// H = 0
  /// T = 1
  fun map_guess(guess: String): u8 {
    let heads = HEADS;
    let tails = TAILS;
    assert!(guess.bytes() == heads || guess.bytes() == tails, EInvalidGuess);

    if (guess.bytes() == heads) {
      0
    } else {
      1
    }
  }
}

```

## Finished package [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#finished-package "Direct link to Finished package")

This represents a basic example of a coin flip backend in Move. The game module, `single_player_satoshi`, is prone to MEV attacks, but the user experience for the player is streamlined. Another example game module, `mev_attack_resistant_single_player_satoshi`, exists that is MEV-resistant, but has a slightly downgraded user experience (two player-transactions per game).

You can read more about both versions of the game, and view the full source code for all the modules in the [Satoshi Coin Flip repository](https://github.com/MystenLabs/satoshi-coin-flip).

Now that you have written our contracts, it's time to deploy them.

### Deployment [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#deployment "Direct link to Deployment")

info

See [Publish a Package](https://docs.sui.io/guides/developer/first-app/publish) for a more detailed guide on publishing packages or [Sui Client CLI](https://docs.sui.io/references/cli/client) for a complete reference of `client` commands in the Sui CLI.

Before publishing your code, you must first initialize the Sui Client CLI, if you haven't already. To do so, in a terminal or console at the root directory of the project enter `sui client`. If you receive the following response, complete the remaining instructions:

```codeBlockLines_p187
Config file ["<FILE-PATH>/.sui/sui_config/client.yaml"] doesn't exist, do you want to connect to a Sui Full node server [y/N]?

```

Enter `y` to proceed. You receive the following response:

```codeBlockLines_p187
Sui Full node server URL (Defaults to Sui Testnet if not specified) :

```

Leave this blank (press Enter). You receive the following response:

```codeBlockLines_p187
Select key scheme to generate keypair (0 for ed25519, 1 for secp256k1, 2: for secp256r1):

```

Select `0`. Now you should have a Sui address set up.

Next, configure the Sui CLI to use `testnet` as the active environment, as well. If you haven't already set up a `testnet` environment, do so by running the following command in a terminal or console:

```codeBlockLines_p187
$ sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

```

Run the following command to activate the `testnet` environment:

```codeBlockLines_p187
$ sui client switch --env testnet

```

Before being able to publish your package to Testnet, you need Testnet SUI tokens. To get some, visit the online faucet at [https://faucet.sui.io/](https://faucet.sui.io/). For other ways to get SUI in your Testnet account, see [Get SUI Tokens](https://docs.sui.io/guides/developer/getting-started/get-coins).

Now that you have an account with some Testnet SUI, you can deploy your contracts. To publish your package, use the following command in the same terminal or console:

```codeBlockLines_p187
sui client publish --gas-budget <GAS-BUDGET>

```

For the gas budget, use a standard value such as `20000000`.

The output of this command contains a `packageID` value that you need to save to use the package.

Partial snippet of CLI deployment output.

```codeBlockLines_p187
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                                         │
│  ┌──                                                                                                     │
│  │ ObjectID: 0x17e9468127384cfff5523940586f5617a75fac8fd93f143601983523ae9c9f31                          │
│  │ Sender: 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654                            │
│  │ Owner: Account Address ( 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654 )         │
│  │ ObjectType: 0x2::package::UpgradeCap                                                                  │
│  │ Version: 75261540                                                                                     │
│  │ Digest: 9ahkhuGYTNYi5GucCqmUHyBuWoV2R3rRqBu553KBPVv8                                                  │
│  └──                                                                                                     │
│  ┌──                                                                                                     │
│  │ ObjectID: 0xa01d8d5ba121e7771547e749a787b4dd9ff8cc32e341c898bab5d12c46412a23                          │
│  │ Sender: 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654                            │
│  │ Owner: Account Address ( 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654 )         │
│  │ ObjectType: 0x2::package::Publisher                                                                   │
│  │ Version: 75261540                                                                                     │
│  │ Digest: Ba9VU2dUqg3NHkwQ4t5AKDLJQuiFZnnxvty2xREQKWm9                                                  │
│  └──                                                                                                     │
│  ┌──                                                                                                     │
│  │ ObjectID: 0xfa1f6edad697afca055749fedbdee420b6cdba3edc2f7fd4927ed42f98a7e63a                          │
│  │ Sender: 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654                            │
│  │ Owner: Account Address ( 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654 )         │
│  │ ObjectType: 0x4120b39e5d94845aa539d4b830743a7433fd8511bdcf3841f98080080f327ca8::house_data::HouseCap  │
│  │ Version: 75261540                                                                                     │
│  │ Digest: 5326hf6zWgdiNgr63wvwKkhUNtnTFkp82e9vfS5QHy3n                                                  │
│  └──                                                                                                     │
│ Mutated Objects:                                                                                         │
│  ┌──                                                                                                     │
│  │ ObjectID: 0x0e4eb516f8899e116a26f927c8aaddae8466c8cdc3822f05c15159e3a8ff8006                          │
│  │ Sender: 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654                            │
│  │ Owner: Account Address ( 0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654 )         │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                            │
│  │ Version: 75261540                                                                                     │
│  │ Digest: Ezmi94kWCfjRzgGTwnXehv9ipPvYQ7T6Z4wefPLRQPPY                                                  │
│  └──                                                                                                     │
│ Published Objects:                                                                                       │
│  ┌──                                                                                                     │
│  │ PackageID: 0x4120b39e5d94845aa539d4b830743a7433fd8511bdcf3841f98080080f327ca8                         │
│  │ Version: 1                                                                                            │
│  │ Digest: 5XbJkgx8RSccxaHoP3xinY2fMMhwKJ7qoWfp349cmZBg                                                  │
│  │ Modules: counter_nft, house_data, single_player_satoshi                                               │
│  └──                                                                                                     │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────╯

```

Save the `PackageID` and the `ObjectID` of the `HouseCap` object you receive in your own response to [connect to your frontend](https://docs.sui.io/guides/developer/app-examples/coin-flip#connecting-your-package).

In this case, the `PackageID` is `0x4120b39e5d94845aa539d4b830743a7433fd8511bdcf3841f98080080f327ca8` and the `HouseCap` ID is `0xfa1f6edad697afca055749fedbdee420b6cdba3edc2f7fd4927ed42f98a7e63a`.

### Next steps [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#next-steps "Direct link to Next steps")

Well done. You have written and deployed the Move package! 🚀

To turn this into a complete dApp, you need to [create a frontend](https://docs.sui.io/guides/developer/app-examples/coin-flip#frontend).

## Frontend [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#frontend "Direct link to Frontend")

In this final part of the dApp example, you build a frontend (UI) that allows end users to place bets and take profits, and lets the admin manage the house.

info

To skip building the frontend and test out your newly deployed package, use the provided [Satoshi Coin Flip Frontend Example repository](https://github.com/sui-foundation/satoshi-coin-flip-frontend-example) and follow the instructions in the example's `README.md` file

### Prerequisites [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#prerequisites "Direct link to Prerequisites")

Before getting started, make sure you have:

- [Deployed the complete `satoshi_flip` Move package](https://docs.sui.io/guides/developer/app-examples/coin-flip#smart-contracts) and understand its design.
- Installed [`pnpm`](https://pnpm.io/installation) or [`yarn`](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable) to use as the package manager.

Additional resources

- Tooling: [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript) for basic usage on how to interact with Sui using TypeScript.
- Tooling: [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit) to learn basic building blocks for developing a dApp in the Sui ecosystem with React.js.
- Tooling: [`@mysten/dapp`](https://sdk.mystenlabs.com/dapp-kit/create-dapp), used within this project to quickly scaffold a React-based Sui dApp.

### Overview [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#overview "Direct link to Overview")

The UI of this example demonstrates how to use the dApp Kit instead of serving as a production-grade product, so the Player and the House features are in the same UI to simplify the process. In a production solution, your frontend would only contain functionality dedicated to the Player, with a backend service carrying out the interactions with House functions in the smart contracts.

The UI has two columns:

- First column is dedicated to the Player, and all Player-related features live there
- Second column is dedicated to the House, and all House-related features live there

### Scaffold a new app [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#scaffold-a-new-app "Direct link to Scaffold a new app")

The first step is to set up the client app. Run the following command to scaffold a new app.

```codeBlockLines_p187
$ pnpm create @mysten/dapp --template react-client-dapp

```

or

```codeBlockLines_p187
$ yarn create @mysten/dapp --template react-client-dapp

```

### Project folder structure [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#project-folder-structure "Direct link to Project folder structure")

Structure the project folder according to the UI layout, meaning that all Player-related React components reside in the `containers/Player` folder, while all House-related React components reside in the `containers/House` folder.

### Connecting your deployed package [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#connecting-your-package "Direct link to Connecting your deployed package")

Add the `packageId` value you saved from [deploying your package](https://docs.sui.io/guides/developer/app-examples/coin-flip#deployment) to a new `src/constants.ts` file in your project:

```codeBlockLines_p187
export const PACKAGE_ID =
  "0x4120b39e5d94845aa539d4b830743a7433fd8511bdcf3841f98080080f327ca8";
export const HOUSECAP_ID =
  "0xfa1f6edad697afca055749fedbdee420b6cdba3edc2f7fd4927ed42f98a7e63a";

```

### Exploring the code [​](https://docs.sui.io/guides/developer/app-examples/coin-flip\#exploring-the-code "Direct link to Exploring the code")

The UI interacts with the [Single Player smart contract](https://docs.sui.io/guides/developer/app-examples/coin-flip#game-module) variant of the game. This section walks you through each step in the smart contract flow and the corresponding frontend code.

info

The following frontend code snippets include only the most relevant sections. Refer to the [Satoshi Coin Flip Frontend Example repository](https://github.com/sui-foundation/satoshi-coin-flip-frontend-example) for complete source code.

As is common in other React projects, `App.tsx` is where you implement the outer layout:

[App.tsx](https://github.com/MystenLabs/sui/tree/main/App.tsx)

```codeBlockLines_p187
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Box, Callout, Container, Flex, Grid, Heading } from '@radix-ui/themes';

import { HOUSECAP_ID, PACKAGE_ID } from './constants';
import { HouseSesh } from './containers/House/HouseSesh';
import { PlayerSesh } from './containers/Player/PlayerSesh';

function App() {
  const account = useCurrentAccount();
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: '1px solid var(--gray-a2)',
        }}
      >
        <Box>
          <Heading>Satoshi Coin Flip Single Player</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Heading size="4" m={'2'}>
          Package ID: {PACKAGE_ID}
        </Heading>
        <Heading size="4" m={'2'}>
          HouseCap ID: {HOUSECAP_ID}
        </Heading>

        <Callout.Root mb="2">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            You need to connect to wallet that publish the smart contract package
          </Callout.Text>
        </Callout.Root>

        {!account ? (
          <Heading size="4" align="center">
            Please connect wallet to continue
          </Heading>
        ) : (
          <Grid columns="2" gap={'3'} width={'auto'}>
            <PlayerSesh />
            <HouseSesh />
          </Grid>
        )}
      </Container>
    </>
  );
}

export default App;

```

Like other dApps, you need a "connect wallet" button to enable connecting users' wallets. dApp Kit contains a pre-made `ConnectButton` React component that you can reuse to help users onboard.

`useCurrentAccount()` is a React hook the dApp Kit also provides to query the current connected wallet; returning `null` if there isn't a wallet connection. Leverage this behavior to prevent a user from proceeding further if they haven't connected their wallet yet.

After ensuring that the user has connected their wallet, you can display the two columns described in the previous section: `PlayerSesh` and `HouseSesh` components.

Okay, that's a good start to have an overview of the project. Time to move to initializing the `HouseData` object. All the frontend logic for calling this lives in the `HouseInitialize.tsx` component. The component includes UI code, but the logic that executes the transaction follows:

[containers/House/HouseInitialize.tsx](https://github.com/MystenLabs/sui/tree/main/containers/House/HouseInitialize.tsx)

```codeBlockLines_p187
<form
  onSubmit={(e) => {
    e.preventDefault();

    // Create new transaction
    const txb = new Transaction();
    // Split gas coin into house stake coin
    // SDK will take care for us abstracting away of up-front coin selections
    const [houseStakeCoin] = txb.splitCoins(txb.gas, [\
      MIST_PER_SUI * BigInt(houseStake),\
    ]);
    // Calling smart contract function
    txb.moveCall({
      target: `${PACKAGE_ID}::house_data::initialize_house_data`,
      arguments: [\
        txb.object(HOUSECAP_ID),\
        houseStakeCoin,\
        // This argument is not an on-chain object, hence, we must serialize it using `bcs`\
        // https://sdk.mystenlabs.com/typescript/transaction-building/basics#pure-values\
        txb.pure(\
          bcs\
            .vector(bcs.U8)\
            .serialize(curveUtils.hexToBytes(getHousePubHex())),\
        ),\
      ],
    });

    execInitializeHouse(
      {
        transaction: txb,
        options: {
          showObjectChanges: true,
        },
      },
      {
        onError: (err) => {
          toast.error(err.message);
        },
        onSuccess: (result: SuiTransactionBlockResponse) => {
          let houseDataObjId;

          result.objectChanges?.some((objCh) => {
            if (
              objCh.type === "created" &&
              objCh.objectType === `${PACKAGE_ID}::house_data::HouseData`
            ) {
              houseDataObjId = objCh.objectId;
              return true;
            }
          });

          setHouseDataId(houseDataObjId!);

          toast.success(`Digest: ${result.digest}`);
        },
      },
    );
  }}

```

To use a [programmable transaction block](https://docs.sui.io/concepts/transactions/prog-txn-blocks) (PTB) in Sui, create a `Transaction`. To initiate a Move call, you must know the global identifier of a public function in your smart contract. The global identifier usually takes the following form:

```codeBlockLines_p187
${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}

```

In this example, it is:

```codeBlockLines_p187
${PACKAGE_ID}::house_data::initialize_house_data

```

There are a few parameters that you need to pass into `initialize_house_data()` Move function: the `HouseCap` ID, the House stake, and the House BLS public key:

- Import the `HouseCap` ID from `constants.ts`, which you set up in the previous section.
- Use `Transaction::splitCoin` for the House stake to create a new coin with a defined amount split from the Gas Coin `txb.gas`. Think of the gas coin as one singular coin available for gas payment from your account (which might cover the entire remaining balance of your account). This is useful for Sui payments - instead of manually selecting the coins for gas payment or manually splitting/merging to have the coin with correct amount for your Move call, the gas coin is the single entry point for this, with all the heavy lifting delegated to the SDK behind the scenes.
- Pass the BLS public key as bytes `vector<u8>`. When providing inputs that are not on-chain objects, serialize them as BCS using a combination of `txb.pure` and `bcs` imported from `@mysten/sui/bcs`.

Now sign and execute the transaction block. dApp Kit provides a React hook `useSignAndExecuteTransaction()` to streamline this process. This hook, when executed, prompts the UI for you to approve, sign, and execute the transaction block. You can configure the hook with the `showObjectChanges` option to return the newly-created `HouseData` shared object as the result of the transaction block. This `HouseData` object is important as you use it as input for later Move calls, so save its ID somewhere.

Great, now you know how to initialize the `HouseData` shared object. Move to the next function call.

In this game, the users must create a `Counter` object to start the game. So there should be a place in the Player column UI to list the existing `Counter` object information for the player to choose. It seems likely that you will reuse the fetching logic for the `Counter` object in several places in your UI, so it's good practice to isolate this logic into a React hook, which you call `useFetchCounterNft()` in `useFetchCounterNft.ts`:

[containers/Player/useFetchCounterNft.ts](https://github.com/MystenLabs/sui/tree/main/containers/Player/useFetchCounterNft.ts)

```codeBlockLines_p187
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

import 'react';

import { PACKAGE_ID } from '../../constants';

// React hook to fetch CounterNFT owned by connected wallet
// This hook is to demonstrate how to use `@mysten/dapp-kit` React hook to query data
// besides using SuiClient directly
export function useFetchCounterNft() {
  const account = useCurrentAccount();

  if (!account) {
    return { data: [] };
  }

  // Fetch CounterNFT owned by current connected wallet
  // Only fetch the 1st one
  const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account.address,
      limit: 1,
      filter: {
        MatchAll: [\
          {\
            StructType: `${PACKAGE_ID}::counter_nft::Counter`,\
          },\
          {\
            AddressOwner: account.address,\
          },\
        ],
      },
      options: {
        showOwner: true,
        showType: true,
      },
    },
    { queryKey: ['CounterNFT'] },
  );

  return {
    data: data && data.data.length > 0 ? data?.data : [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

```

This hook logic is very basic: if there is no current connected wallet, return empty data; otherwise, fetch the `Counter` object and return it. dApp Kit provides a React hook, `useSuiClientQuery()`, that enables interaction with [Sui RPC](https://docs.sui.io/references/sui-api) methods. Different RPC methods require different parameters. To fetch the object owned by a known address, use the [`getOwnedObjects` query](https://docs.sui.io/sui-api-ref#suix_getownedobjects).

Now, pass the address of the connected wallet, as well as the global identifier for the `Counter`. This is in similar format to the global identifier type for function calls:

`${PACKAGE_ID}::counter_nft::Counter`

That's it, now put the hook into the UI component `PlayerListCounterNft.tsx` and display the data:

[containers/Player/PlayerListCounterNft.tsx](https://github.com/MystenLabs/sui/tree/main/containers/Player/PlayerListCounterNft.tsx)

```codeBlockLines_p187
export function PlayerListCounterNft() {
  const { data, isLoading, error, refetch } = useFetchCounterNft();
  const { mutate: execCreateCounterNFT } = useSignAndExecuteTransaction();

  return (
    <Container mb={'4'}>
      <Heading size="3" mb="2">
        Counter NFTs
      </Heading>

      {error && <Text>Error: {error.message}</Text>}

      <Box mb="3">
        {data.length > 0 ? (
          data.map((it) => {
            return (
              <Box key={it.data?.objectId}>
                <Text as="div" weight="bold">
                  Object ID:
                </Text>
                <Text as="div">{it.data?.objectId}</Text>
                <Text as="div" weight="bold">
                  Object Type:
                </Text>
                <Text as="div">{it.data?.type}</Text>
              </Box>
            );
          })
        ) : (
          <Text>No CounterNFT Owned</Text>
        )}
      </Box>
    </Container>
  );
}

```

For the case when there is no existing `Counter` object, mint a new `Counter` for the connected wallet. Also add the minting logic into `PlayerListCounterNft.tsx` when the user clicks the button. You already know how to build and execute a Move call with `TransactionBlock` and `initialize_house_data()`, you can implement a similar call here.

As you might recall with `Transaction`, outputs from the transaction can be inputs for the next transaction. Call `counter_nft::mint()`, which returns the newly created `Counter` object, and use it as input for `counter_nft::transfer_to_sender()` to transfer the `Counter` object to the caller wallet:

[containers/Player/PlayerListCounterNft.tsx](https://github.com/MystenLabs/sui/tree/main/containers/Player/PlayerListCounterNft.tsx)

```codeBlockLines_p187
const txb = new Transaction();
const [counterNft] = txb.moveCall({
  target: `${PACKAGE_ID}::counter_nft::mint`,
});
txb.moveCall({
  target: `${PACKAGE_ID}::counter_nft::transfer_to_sender`,
  arguments: [counterNft],
});

execCreateCounterNFT(
  {
    transaction: txb,
  },
  {
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: (result) => {
      toast.success(`Digest: ${result.digest}`);
      refetch?.();
    },
  },
);

```

Great, now you can create the game with the created `Counter` object. Isolate the game creation logic into `PlayerCreateGame.tsx`. There is one more thing to keep in mind - to flag an input as an on-chain object, you should use `txb.object()` with the corresponding object ID.

[containers/Player/PlayerCreateGame.tsx](https://github.com/MystenLabs/sui/tree/main/containers/Player/PlayerCreateGame.tsx)

```codeBlockLines_p187
// Create new transaction
const txb = new Transaction();

// Player stake
const [stakeCoin] = txb.splitCoins(txb.gas, [MIST_PER_SUI * BigInt(stake)]);

// Create the game with CounterNFT
txb.moveCall({
  target: `${PACKAGE_ID}::single_player_satoshi::start_game`,
  arguments: [\
    txb.pure.string(guess),\
    txb.object(counterNFTData[0].data?.objectId!),\
    stakeCoin,\
    txb.object(houseDataId),\
  ],
});

execCreateGame(
  {
    transaction: txb,
  },
  {
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: (result: SuiTransactionBlockResponse) => {
      toast.success(`Digest: ${result.digest}`);
    },
  },
);

```

One final step remains: settle the game. There are a couple of ways you can use the UI to settle the game:

1. Create a Settle Game button and pass all the necessary arguments to the `single_player_satoshi::finish_game()` Move call.
2. Settle the game automatically through an events subscription. This example uses this path to teach good practices on events and how to subscribe to them.

info

Event subscriptions are deprecated. To learn future-safe methods to work with events, see [Using Events](https://docs.sui.io/guides/developer/sui-101/using-events).

All of this logic is in `HouseFinishGame.tsx`:

[containers/House/HouseFinishGame.tsx](https://github.com/MystenLabs/sui/tree/main/containers/House/HouseFinishGame.tsx)

```codeBlockLines_p187
// This component will help the House to automatically finish the game whenever new game is started
export function HouseFinishGame() {
  const suiClient = useSuiClient();
  const { mutate: execFinishGame } = useSignAndExecuteTransactionBlock();

  const [housePrivHex] = useContext(HouseKeypairContext);
  const [houseDataId] = useContext(HouseDataContext);

  useEffect(() => {
    // Subscribe to NewGame event
    const unsub = suiClient.subscribeEvent({
      filter: {
        MoveEventType: `${PACKAGE_ID}::single_player_satoshi::NewGame`,
      },
      onMessage(event) {
        console.log(event);
        const { game_id, vrf_input } = event.parsedJson as {
          game_id: string;
          vrf_input: number[];
        };

        toast.info(`NewGame started ID: ${game_id}`);

        console.log(housePrivHex);

        try {
          const houseSignedInput = bls.sign(
            new Uint8Array(vrf_input),
            curveUtils.hexToBytes(housePrivHex),
          );

          // Finish the game immediately after new game started
          const txb = new Transaction();
          txb.moveCall({
            target: `${PACKAGE_ID}::single_player_satoshi::finish_game`,
            arguments: [\
              txb.pure.id(game_id),\
              txb.pure(bcs.vector(bcs.U8).serialize(houseSignedInput)),\
              txb.object(houseDataId),\
            ],
          });
          execFinishGame(
            {
              transaction: txb,
            },
            {
              onError: (err) => {
                toast.error(err.message);
              },
              onSuccess: (result: SuiTransactionBlockResponse) => {
                toast.success(`Digest: ${result.digest}`);
              },
            },
          );
        } catch (err) {
          console.error(err);
        }
      },
    });

    return () => {
      (async () => (await unsub)())();
    };
  }, [housePrivHex, houseDataId, suiClient]);

  return null;
}

```

To get the underlying `SuiClient` instance from the SDK, use `useSuiClient()`. You want to subscribe to events whenever the `HouseFinishGame` component loads. To do this, use the React hook `useEffect()` from the core React library.

`SuiClient` exposes a method called `subscribeEvent()` that enables you to subscribe to a variety of event types. `SuiClient::subscribeEvent()` is actually a thin wrapper around the RPC method [`suix_subscribeEvent`](https://docs.sui.io/sui-api-ref#suix_subscribeevent).

The logic is that whenever a new game starts, you want to settle the game immediately. The necessary event to achieve this is the Move event type called `single_player_satoshi::NewGame`. If you inspect the parsed payload of the event through `event.parsedJson`, you can see the corresponding event fields declared in the smart contract. In this case, you just need to use two fields, the Game ID and the VRF input.

The next steps are similar to the previous Move calls, but you have to use the BLS private key to sign the VRF input and then pass the Game ID, signed VRF input and `HouseData` ID to the `single_player_satoshi::finish_game()` Move call.

Last but not least, remember to unsubscribe from the event whenever the `HouseFinishGame` component dismounts. This is important as you might not want to subscribe to the same event multiple times.

Congratulations, you completed the frontend. You can carry the lessons learned here forward when using the dApp Kit to build your next Sui project.

- [What the guide teaches](https://docs.sui.io/guides/developer/app-examples/coin-flip#what-the-guide-teaches)
- [What you need](https://docs.sui.io/guides/developer/app-examples/coin-flip#what-you-need)
- [Smart contracts](https://docs.sui.io/guides/developer/app-examples/coin-flip#smart-contracts)
  - [House module](https://docs.sui.io/guides/developer/app-examples/coin-flip#house-module)
  - [Counter module](https://docs.sui.io/guides/developer/app-examples/coin-flip#counter-module)
  - [Game module](https://docs.sui.io/guides/developer/app-examples/coin-flip#game-module)
- [Finished package](https://docs.sui.io/guides/developer/app-examples/coin-flip#finished-package)
  - [Deployment](https://docs.sui.io/guides/developer/app-examples/coin-flip#deployment)
  - [Next steps](https://docs.sui.io/guides/developer/app-examples/coin-flip#next-steps)
- [Frontend](https://docs.sui.io/guides/developer/app-examples/coin-flip#frontend)
  - [Prerequisites](https://docs.sui.io/guides/developer/app-examples/coin-flip#prerequisites)
  - [Overview](https://docs.sui.io/guides/developer/app-examples/coin-flip#overview)
  - [Scaffold a new app](https://docs.sui.io/guides/developer/app-examples/coin-flip#scaffold-a-new-app)
  - [Project folder structure](https://docs.sui.io/guides/developer/app-examples/coin-flip#project-folder-structure)
  - [Connecting your deployed package](https://docs.sui.io/guides/developer/app-examples/coin-flip#connecting-your-package)
  - [Exploring the code](https://docs.sui.io/guides/developer/app-examples/coin-flip#exploring-the-code)