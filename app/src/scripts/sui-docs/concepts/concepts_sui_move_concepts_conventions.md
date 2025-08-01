# https://docs.sui.io/concepts/sui-move-concepts/conventions

[Skip to main content](https://docs.sui.io/concepts/sui-move-concepts/conventions#__docusaurus_skipToContent_fallback)

On this page

This guide outlines recommended conventions and best practices for writing Move smart contracts on Sui. Following these guidelines helps create more maintainable, secure, and composable code that aligns with ecosystem standards.

While these conventions are recommendations rather than strict rules, they represent patterns that have proven effective across many Sui projects. They help create consistency across the ecosystem and make code easier to understand and maintain.

## Organization principles [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#organization-principles "Direct link to Organization principles")

### Package [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#package "Direct link to Package")

A Sui package consists of:

- a `sources` directory containing the Move code to be uploaded to the blockchain
- a `Move.toml` manifest file that declares dependencies and other information about the package
- a `Move.lock` file that the Sui Move toolchain automatically generates to lock the versions of the dependencies and track the different published and upgraded versions of the package that exist on the different networks

For this reason, the `Move.lock` file should always be part of the package (don't add it to the `.gitignore` file). Use the [automated address management](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management) instead of the old `published-at` field in the manifest file.

Optionally, you can add a `tests` directory to contain the tests for the package and an `examples` directory to provide use cases for the package. Neither directory is uploaded on chain when you publish the package.

```codeBlockLines_p187
sources/
    my_module.move
    another_module.move
    ...
tests/
    my_module_tests.move
    ...
examples/
    using_my_module.move
Move.lock
Move.toml

```

In your package manifest, the package name should be in PascalCase: `name = "MyPackage"`. Ideally, the named address representing the package should be the same as the package name, but in snake\_case: `my_package = 0x0`.

### Modules [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#modules "Direct link to Modules")

Modules are the main building blocks of your Move code. They are used to organize and encapsulate related functionality. Design your modules around one object or data structure. A variant structure should have its own module to avoid complexity and bugs.

Module declarations don't need to use brackets anymore and the compiler provides default `use` statements for widely used modules, so you don't need to declare all of them.

```codeBlockLines_p187
module conventions::wallet;

public struct Wallet has key, store {
    id: UID,
    amount: u64
}

```

### Body [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#body "Direct link to Body")

Structure your code using comments to create sections for your Move code files. Structure your titles using `===` on either side of the title.

```codeBlockLines_p187
module conventions::comments;

// === Imports ===

// === Errors ===

// === Constants ===

// === Structs ===

// === Events ===

// === Method Aliases ===

// === Public Functions ===

// === View Functions ===

// === Admin Functions ===

// === Package Functions ===

// === Private Functions ===

// === Test Functions ===

```

Here, "public functions" are the functions modifying state, "view functions" are often on-chain getters or off-chain helpers. The latter are not necessary because you can query objects to read their data. The `init` function should be the first function in the module, if it exists.

Try to sort your functions by their purpose and according to the user flow to improve readability. You can also use explicit function names like `admin_set_fees` to make it clear what the function does.

Ideally, test functions should only consist of `[test_only]` helpers for the actual tests that are located in the `tests` directory.

Group imports by dependency, for example:

```codeBlockLines_p187
use std::string::String;
use sui::{
    coin::Coin,
    balance,
    table::Table
};
use my_dep::battle::{Battle, Score};

```

## Naming conventions [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#naming-conventions "Direct link to Naming conventions")

Adhering to naming conventions in your code helps readability and ultimately makes your codebase easier to maintain. The following sections outline the key naming conventions to follow when writing Move code.

### Constants [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#constants "Direct link to Constants")

Constants should be uppercase and formatted as snake case. Errors are specific constants that use PascalCase and start with an E. Make them descriptive.

```codeBlockLines_p187
module conventions::constants;

// correct non-error constant
const MAX_NAME_LENGTH: u64 = 64;

// correct error constant
const EInvalidName: u64 = 0;

// wrong error constant
const E_INVALID_NAME: u64 = 0;

```

### Structs [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#structs "Direct link to Structs")

Always declare struct abilities in this order: `key`, `copy`, `drop`, `store`.

Do not use 'potato' in the name of structs. The lack of abilities define it as a potato pattern.

Structs support positional fields that can be used for simple wrappers, dynamic field keys, or as tuples.

Use the `Event` suffix to name structs that emit events.

```codeBlockLines_p187
module conventions::request;

// dynamic field keys
public struct ReceiptKey(ID) has copy, drop, store;

// dynamic field
public struct Receipt<Data> has key, store {
    id: UID,
    data: Data
}

// right naming
public struct Request();

// wrong naming
public struct RequestPotato {}

```

### CRUD function names [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#crud-function-names "Direct link to CRUD function names")

The following functions follow standard CRUD (Create, Read, Update, Delete) naming conventions:

- `new`: Creates an empty object.
- `empty`: Creates an empty struct.
- `create`: Creates an initialized object or struct.
- `add`: Adds a value.
- `remove`: Removes a value.
- `exists`: Checks if a key exists.
- `contains`: Checks if a collection contains a value.
- `borrow`: Returns an immutable reference of a struct or object.
- `borrow_mut`: Returns a mutable reference of a struct or object.
- `property_name`: Returns an immutable reference or a copy of a field.
- `property_name_mut`: Returns a mutable reference of a field.
- `drop`: Drops a struct.
- `destroy`: Destroys an object or data structure that has values with the **drop** ability.
- `destroy_empty`: Destroys an empty object or data structure that has values with the **drop** ability.
- `to_name`: Transforms a Type X to Type Y.
- `from_name`: Transforms a Type Y to Type X.

### Generics [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#generics "Direct link to Generics")

Declare generics using single letter names or full names. By convention, developers use `T` and `U` for generic types, but you can use a more descriptive name if it is not confusing with other types. Always prioritize readability.

```codeBlockLines_p187
module conventions::generics;

// single letter name
public struct Receipt<T> has store { ... }

// full name
public struct Receipt<Data> has store { ... }

```

## Code Structure [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#code-structure "Direct link to Code Structure")

The following section covers common patterns and best practices specific to Move development on Sui, including object ownership models and function design principles.

### Shared objects [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#shared-objects "Direct link to Shared objects")

Library modules that share objects should provide two functions: one to instantiate and return the object, and another one to share it. It allows the caller to pass it to other functions and run custom functionality before sharing it.

```codeBlockLines_p187
module conventions::shop;

public struct Shop has key {
    id: UID
}

public fun new(ctx: &mut TxContext): Shop {
    Shop {
        id: object::new(ctx)
    }
}

public fun share(shop: Shop) {
    transfer::share_object(shop);
}

```

### Pure functions [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#pure-functions "Direct link to Pure functions")

Keep your functions pure to maintain composability. Do not use `transfer::transfer` or `transfer::public_transfer` inside core functions, except in specific cases where the object is not transferable and shouldn't be modified.

```codeBlockLines_p187
module conventions::amm;

use sui::coin::Coin;

public struct Pool has key {
    id: UID
}

// right -> returns the excess coins even if they have zero value.
public fun add_liquidity<CoinX, CoinY, LpCoin>(pool: &mut Pool, coin_x: Coin<CoinX>, coin_y: Coin<CoinY>): (Coin<LpCoin>, Coin<CoinX>, Coin<CoinY>) {
    // Implementation omitted.
    abort(0)
}

// right but not recommended
public fun add_liquidity_and_transfer<CoinX, CoinY, LpCoin>(pool: &mut Pool, coin_x: Coin<CoinX>, coin_y: Coin<CoinY>, recipient: address) {
    let (lp_coin, coin_x, coin_y) = add_liquidity<CoinX, CoinY, LpCoin>(pool, coin_x, coin_y);
    transfer::public_transfer(lp_coin, recipient);
    transfer::public_transfer(coin_x, recipient);
    transfer::public_transfer(coin_y, recipient);
}

// wrong
public fun impure_add_liquidity<CoinX, CoinY, LpCoin>(pool: &mut Pool, coin_x: Coin<CoinX>, coin_y: Coin<CoinY>, ctx: &mut TxContext): Coin<LpCoin> {
    let (lp_coin, coin_x, coin_y) = add_liquidity<CoinX, CoinY, LpCoin>(pool, coin_x, coin_y);
    transfer::public_transfer(coin_x, tx_context::sender(ctx));
    transfer::public_transfer(coin_y, tx_context::sender(ctx));

    lp_coin
}

```

### Coin argument [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#coin-argument "Direct link to Coin argument")

Pass the `Coin` object by value with the exact right amount directly to improve transaction readability from the frontend.

```codeBlockLines_p187
module conventions::amm;

use sui::coin::Coin;

public struct Pool has key {
    id: UID
}

// right
public fun swap<CoinX, CoinY>(coin_in: Coin<CoinX>): Coin<CoinY> {
    // Implementation omitted.
    abort(0)
}

// wrong
public fun exchange<CoinX, CoinY>(coin_in: &mut Coin<CoinX>, value: u64): Coin<CoinY> {
    // Implementation omitted.
    abort(0)
}

```

### Access control [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#access-control "Direct link to Access control")

To maintain composability, use capability objects instead of arrays of addresses for access control.

```codeBlockLines_p187
module conventions::access_control;

use sui::sui::SUI;
use sui::balance::Balance;
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};

public struct Account has key, store {
    id: UID,
    balance: u64
}

public struct State has key {
    id: UID,
    // field not necessary as the state lives in the Account objects
    accounts: Table<address, u64>,
    balance: Balance<SUI>
}

// right -> with this function, another protocol can hold the `Account` on behalf of a user.
public fun withdraw(state: &mut State, account: &mut Account, ctx: &mut TxContext): Coin<SUI> {
    let authorized_balance = account.balance;

    account.balance = 0;

    coin::take(&mut state.balance, authorized_balance, ctx)
}

// wrong -> this is less composable.
public fun wrong_withdraw(state: &mut State, ctx: &mut TxContext): Coin<SUI> {
    let sender = tx_context::sender(ctx);

    let authorized_balance = table::borrow_mut(&mut state.accounts, sender);
    let value = *authorized_balance;
    *authorized_balance = 0;
    coin::take(&mut state.balance, value, ctx)
}

```

### Data storage in owned vs shared objects [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#data-storage-in-owned-vs-shared-objects "Direct link to Data storage in owned vs shared objects")

If your dApp data has a one to one relationship, it's best to use owned objects.

```codeBlockLines_p187
module conventions::vesting_wallet;

use sui::sui::SUI;
use sui::coin::Coin;
use sui::table::Table;
use sui::balance::Balance;

public struct OwnedWallet has key {
    id: UID,
    balance: Balance<SUI>
}

public struct SharedWallet has key {
    id: UID,
    balance: Balance<SUI>,
    accounts: Table<address, u64>
}

// A vesting wallet releases a certain amount of coin over a period of time.
// If the entire balance belongs to one user and the wallet has no additional functionalities, it is best to store it in an owned object.
public fun new(deposit: Coin<SUI>, ctx: &mut TxContext): OwnedWallet {
    // Implementation omitted.
    abort(0)
}

// If you wish to add extra functionality to a vesting wallet, it is best to share the object.
// For example, if you wish the issuer of the wallet to be able to cancel the contract in the future.
public fun new_shared(deposit: Coin<SUI>, ctx: &mut TxContext) {
    // Implementation omitted.
    // shares the `SharedWallet`.
    abort(0)
}

```

### Admin capability [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#admin-capability "Direct link to Admin capability")

In admin-gated functions, the first parameter should be the capability. It helps the autocomplete with user types.

```codeBlockLines_p187
module conventions::social_network;

use std::string::String;

public struct Account has key {
    id: UID,
    name: String
}

public struct Admin has key {
    id: UID,
}

// right -> cap.update(&mut account, b"jose".to_string());
public fun update(_: &Admin, account: &mut Account, new_name: String) {
    // Implementation omitted.
    abort(0)
}

// wrong -> account.update(&cap, b"jose".to_string());
public fun set(account: &mut Account, _: &Admin, new_name: String) {
    // Implementation omitted.
    abort(0)
}

```

## Documentation [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#documentation "Direct link to Documentation")

There is nothing more pleasant than a well-written and well-documented codebase. While some argue that clean code is self-documenting, well-documented code is self-explanatory.

### Comments [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#comments "Direct link to Comments")

Document your code by explaining functions and structs in simple terms using the `///` syntax (doc comment). If you want to add technical insights for developers that might use your code, use the `//` syntax (regular comment).

Use field comments to describe the properties of your structs. In complex functions, you can also describe the parameters and return values.

```codeBlockLines_p187
module conventions::hero;

use std::string::String;
use sui::kiosk::{Kiosk, KioskOwnerCap};

public struct Hero has key, store {
    id: UID,
    // power of the nft
    power: u64
}

/// Creates and returns a new Hero object
public fun new(ctx: &mut TxContext): Hero {
    Hero {
        id: object::new(ctx),
        power: 0
    }
}

// should be initialized before being shared
public fun initialize_hero(hero: &mut Hero) {
    hero.power = 100;
}

public fun start_battle(
    self: &mut Kiosk, // user kiosk
    cap: &KioskOwnerCap, // user kiosk owner cap
    _policy: &TransferPolicy<Hero>, // transfer policy for the game
    hero_id: ID, // hero to use
    battle_id: String // id of the battle to start
) {
    // Implementation omitted.
    abort(0)
}

```

### README [​](https://docs.sui.io/concepts/sui-move-concepts/conventions\#readme "Direct link to README")

Create a `README.md` file in the root of the package. Include a description of the package, the purpose of the package, and how to use it.

- [Organization principles](https://docs.sui.io/concepts/sui-move-concepts/conventions#organization-principles)
  - [Package](https://docs.sui.io/concepts/sui-move-concepts/conventions#package)
  - [Modules](https://docs.sui.io/concepts/sui-move-concepts/conventions#modules)
  - [Body](https://docs.sui.io/concepts/sui-move-concepts/conventions#body)
- [Naming conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions#naming-conventions)
  - [Constants](https://docs.sui.io/concepts/sui-move-concepts/conventions#constants)
  - [Structs](https://docs.sui.io/concepts/sui-move-concepts/conventions#structs)
  - [CRUD function names](https://docs.sui.io/concepts/sui-move-concepts/conventions#crud-function-names)
  - [Generics](https://docs.sui.io/concepts/sui-move-concepts/conventions#generics)
- [Code Structure](https://docs.sui.io/concepts/sui-move-concepts/conventions#code-structure)
  - [Shared objects](https://docs.sui.io/concepts/sui-move-concepts/conventions#shared-objects)
  - [Pure functions](https://docs.sui.io/concepts/sui-move-concepts/conventions#pure-functions)
  - [Coin argument](https://docs.sui.io/concepts/sui-move-concepts/conventions#coin-argument)
  - [Access control](https://docs.sui.io/concepts/sui-move-concepts/conventions#access-control)
  - [Data storage in owned vs shared objects](https://docs.sui.io/concepts/sui-move-concepts/conventions#data-storage-in-owned-vs-shared-objects)
  - [Admin capability](https://docs.sui.io/concepts/sui-move-concepts/conventions#admin-capability)
- [Documentation](https://docs.sui.io/concepts/sui-move-concepts/conventions#documentation)
  - [Comments](https://docs.sui.io/concepts/sui-move-concepts/conventions#comments)
  - [README](https://docs.sui.io/concepts/sui-move-concepts/conventions#readme)