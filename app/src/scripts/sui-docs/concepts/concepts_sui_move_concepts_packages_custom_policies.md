# https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies

[Skip to main content](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#__docusaurus_skipToContent_fallback)

On this page

Protecting the ability to upgrade a package on chain using a single key can pose a security risk for several reasons:

- The entity owning that key might make changes that are in their own interests but not the interests of the broader community.
- Upgrades might happen without enough time for package users to consult on the change or stop using the package if they disagree.
- The key might get lost.

To address the security risk of single-key upgrade ownership poses while still providing the opportunity to [upgrade live packages](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade), Sui offers _custom upgrade policies_. These policies protect `UpgradeCap` access and issue `UpgradeTicket` objects that authorize upgrades on a case-by-case basis.

## Compatibility [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#compatibility "Direct link to Compatibility")

Sui comes with a set of built-in package compatibility policies, listed here from most to least strict:

| Policy | Description |
| --- | --- |
| Immutable | No one can upgrade the package. |
| Dependency-only | You can modify the dependencies of the package only. |
| Additive | You can add new functionality to the package (e.g., new public functions or structs) but you can't change any of the existing functionality (e.g., the code in existing public functions cannot change). |
| Compatible | The most relaxed policy. In addition to what the more restrictive policies allow, in an upgraded version of the package: <br>- You can change all function implementations.<br>- You can remove the ability constraints on generic type parameters in function signatures.<br>- You can change, remove, or make `public` any `private`, `public(friend)`, and `entry` function signatures.<br>- You cannot change `public` function signatures (except in the case of ability constraints mentioned previously).<br>- You cannot change existing types. |

Each of these policies, in the order listed, is a superset of the previous one in the type of changes allowed in the upgraded package.

When you publish a package, by default it adopts the most relaxed, compatible policy. You can publish a package as part of a transaction that can change the policy before the transaction successfully completes, making the package available on chain for the first time at the desired policy level, rather than at the default one.

You can change the current policy by calling one of the functions in `sui::package` ( `only_additive_upgrades`, `only_dep_upgrades`, `make_immutable`) on the package's `UpgradeCap` and a policy can become only more restrictive. For example, after you call `sui::package::only_dep_upgrades` to restrict the policy to become additive, calling `sui::package::only_additive_upgrades` on the `UpgradeCap` of the same package results in an error.

## Upgrade overview [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#upgrade-overview "Direct link to Upgrade overview")

Package upgrades must occur end-to-end in a single transaction and are composed of three commands:

1. **Authorization:** Get permission from the `UpgradeCap` to perform
the upgrade, creating an `UpgradeTicket`.
2. **Execution:** Consume the `UpgradeTicket` and verify the package
bytecode and compatibility against the previous version, and create
the on-chain object representing the upgraded package. Return an
`UpgradeReceipt` as a result on success.
3. **Commit:** Update the `UpgradeCap` with information about the
newly created package.

While step 2 is a built-in command, steps 1 and 3 are implemented as Move functions. The Sui framework provides their most basic implementation:

[crates/sui-framework/packages/sui-framework/sources/package.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/package.move)

```codeBlockLines_p187
public fun authorize_upgrade(cap: &mut UpgradeCap, policy: u8, digest: vector<u8>): UpgradeTicket {
    let id_zero = @0x0.to_id();
    assert!(cap.package != id_zero, EAlreadyAuthorized);
    assert!(policy >= cap.policy, ETooPermissive);

    let package = cap.package;
    cap.package = id_zero;

    UpgradeTicket {
        cap: object::id(cap),
        package,
        policy,
        digest,
    }
}

public fun commit_upgrade(cap: &mut UpgradeCap, receipt: UpgradeReceipt) {
    let UpgradeReceipt { cap: cap_id, package } = receipt;

    assert!(object::id(cap) == cap_id, EWrongUpgradeCap);
    assert!(cap.package.to_address() == @0x0, ENotAuthorized);

    cap.package = package;
    cap.version = cap.version + 1;
}

```

These are the functions that `sui client upgrade` calls for authorization and commit. Custom upgrade policies work by guarding
access to a package `UpgradeCap` (and therefore to calls of these functions) behind extra conditions that are specific to that policy
(such as voting, governance, permission lists, timelocks, and so on).

Any pair of functions that produces an `UpgradeTicket` from an `UpgradeCap` and consumes an `UpgradeReceipt` to update an
`UpgradeCap` constitutes a custom upgrade policy.

## UpgradeCap [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#upgradecap "Direct link to UpgradeCap")

The `UpgradeCap` is the central type responsible for coordinating package upgrades.

[crates/sui-framework/packages/sui-framework/sources/package.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/package.move)

```codeBlockLines_p187
public struct UpgradeCap has key, store {
    id: UID,
    package: ID,
    version: u64,
    policy: u8,
}

```

Publishing a package creates the `UpgradeCap` object and upgrading the package updates that object. The owner of this object has permission to:

- Change the compatibility requirements for future upgrades.
- Authorize future upgrades.
- Make the package immutable (not upgradeable).

And its API guarantees the following properties:

- Only the latest version of a package can be upgraded (a linear history is guaranteed).
- Only one upgrade can be in-flight at any time (cannot authorize multiple concurrent upgrades).
- An upgrade can only be authorized for the extent of a single transaction; no one can `store` the `UpgradeTicket` that proves authorization.
- Compatibility requirements for a package can be made only more restrictive over time.

## UpgradeTicket [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#upgradeticket "Direct link to UpgradeTicket")

[crates/sui-framework/packages/sui-framework/sources/package.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/package.move)

```codeBlockLines_p187
public struct UpgradeTicket {
    cap: ID,
    package: ID,
    policy: u8,
    digest: vector<u8>,
}

```

An `UpgradeTicket` is proof that an upgrade has been authorized. This authorization is specific to:

- A particular `package: ID` to upgrade from, which must be the latest package in the family identified by the `UpgradeCap` at `cap: ID`.
- A particular `policy: u8` that attests to the kind of compatibility guarantees that the upgrade expects to adhere to.
- A particular `digest: vector<u8>` that identifies the contents of the package after the upgrade.

When you attempt to run the upgrade, the validator checks that the upgrade it is about to perform matches the upgrade that was authorized along all those lines, and does not perform the upgrade if any of these criteria are not met.

After creating an `UpgradeTicket`, you must use it within that transaction (you cannot store it for later, drop it, or burn it), or the transaction fails.

### Package digest [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#package-digest "Direct link to Package digest")

The `UpgradeTicket` `digest` field comes from the `digest` parameter to `authorize_upgrade`, which the caller must supply. While
`authorize_upgrade` does not process the `digest`, custom policies can use it to authorize only upgrades that it has seen the
bytecode or source code for ahead of time. Sui calculates the digest as follows:

- Take the bytecode for each module, represented as an array of bytes.
- Append the list of the package's transitive dependencies, each represented as an array of bytes.
- Sort this list of byte-arrays lexicographically.
- Feed each element in the sorted list, in order, into a `Blake2B` hasher.
- Compute the digest from this hash state.

Refer to the [implementation for digest calculation](https://github.com/MystenLabs/sui/blob/d8cb153d886d54752763fbdab631b062da7d894b/crates/sui-types/src/move_package.rs#L232-L251) for more information, but in most cases, you can rely on the Move toolchain to output the digest as part of the build, when passing the `--dump-bytecode-as-base64` flag:

```codeBlockLines_p187
$ sui move build --dump-bytecode-as-base64

```

```codeBlockLines_p187
FETCHING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING test
{"modules":[<MODULE-BYTES-BASE64>],"dependencies":[<DEPENDENCY-IDS>],"digest":[59,43,173,195,216,88,176,182,18,8,24,200,200,192,196,197,248,35,118,184,207,205,33,59,228,109,184,230,50,31,235,201]}

```

## UpgradeReceipt [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#upgradereceipt "Direct link to UpgradeReceipt")

[crates/sui-framework/packages/sui-framework/sources/package.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/package.move)

```codeBlockLines_p187
public struct UpgradeReceipt {
    cap: ID,
    package: ID,
}

```

The `UpgradeReceipt` is proof that the `Upgrade` command ran successfully, and Sui added the new package to the set of created
objects for the transaction. It is used to update its `UpgradeCap` (identified by `cap: ID`) with the ID of the latest package in its
family ( `package: ID`).

After Sui creates an `UpgradeReceipt`, you must use it to update its `UpgradeCap` within the same transaction (you cannot store it for later, drop it, or burn it), or the transaction fails.

## Isolating policies [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#isolating-policies "Direct link to Isolating policies")

When writing custom upgrade policies, prefer:

- separating them into their own package (not co-located with the code they govern the upgradeability of),
- making that package immutable (not upgradeable), and
- locking in the policy of the `UpgradeCap`, so that the policy cannot be made less restrictive later.

These best practices help uphold **informed user consent** and **bounded risk** by making it clear what a package's upgrade policy is
at the moment a user locks value into it, and ensuring that the policy does not evolve to be more permissive with time, without the package user realizing and choosing to accept the new terms.

## Example: "Day of the Week" upgrade policy [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#example-upgrade "Direct link to Example: \"Day of the Week\" upgrade policy")

Time to put everything into practice by writing a toy upgrade policy that only authorizes upgrades on a particular day of the week (of the package creator's choosing).

### Creating an upgrade policy [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#creating-upgrade-policy "Direct link to Creating an upgrade policy")

Start by creating a new Move package for the upgrade policy:

```codeBlockLines_p187
$ sui move new policy

```

The command creates a `policy` directory with a `sources` folder and `Move.toml` manifest.

In the `sources` folder, create a source file named `day_of_week.move`. Copy and paste the following code into the file:

```codeBlockLines_p187
module policy::day_of_week;

use sui::package;

/// Day is not a week day (number in range 0 <= day < 7).
const ENotWeekDay: u64 = 1;

public struct UpgradeCap has key, store {
    id: UID,
    cap: package::UpgradeCap,
    day: u8,
}

public fun new_policy(
    cap: package::UpgradeCap,
    day: u8,
    ctx: &mut TxContext,
): UpgradeCap {
    assert!(day < 7, ENotWeekDay);
    UpgradeCap { id: object::new(ctx), cap, day }
}

```

This code includes a constructor and defines the object type for the custom upgrade policy.

You then need to add a function to authorize an upgrade, if on the correct day of the week. First, define a couple of constants, one for the error code that identifies an attempted upgrade on a day the policy doesn't allow, and another to define the number of milliseconds in a day (to be used shortly). Add these definitions directly under the current `ENotWeekDay` one.

```codeBlockLines_p187
// Request to authorize upgrade on the wrong day of the week.
const ENotAllowedDay: u64 = 2;

const MS_IN_DAY: u64 = 24 * 60 * 60 * 1000;

```

After the `new_policy` function, add a `week_day` function to get the current weekday. As promised, the function uses the `MS_IN_DAY` constant you defined earlier.

```codeBlockLines_p187
fun week_day(ctx: &TxContext): u8 {
    let days_since_unix_epoch = ctx.epoch_timestamp_ms() / MS_IN_DAY;
    // The unix epoch (1st Jan 1970) was a Thursday so shift days
    // since the epoch by 3 so that 0 = Monday.
    ((days_since_unix_epoch + 3) % 7 as u8)
}

```

This function uses the epoch timestamp from `TxContext` rather than `Clock` because it needs only daily granularity, which means the upgrade transactions don't require consensus.

Next, add an `authorize_upgrade` function that calls the previous function to get the current day of the week, then checks whether that value violates the policy, returning the `ENotAllowedDay` error value if it does.

```codeBlockLines_p187
public fun authorize_upgrade(
    cap: &mut UpgradeCap,
    policy: u8,
    digest: vector<u8>,
    ctx: &TxContext,
): package::UpgradeTicket {
    assert!(week_day(ctx) == cap.day, ENotAllowedDay);
    cap.cap.authorize_upgrade(policy, digest)
}

```

The signature of a custom `authorize_upgrade` can be different from the signature of `sui::package::authorize_upgrade` as long as it returns an `UpgradeTicket`.

Finally, provide implementations of `commit_upgrade` and `make_immutable` that delegate to their respective functions in `sui::package`:

```codeBlockLines_p187
public fun commit_upgrade(
    cap: &mut UpgradeCap,
    receipt: package::UpgradeReceipt,
) {
    cap.cap.commit_upgrade(receipt)
}

public fun make_immutable(cap: UpgradeCap) {
    let UpgradeCap { id, cap, day: _ } = cap;
    id.delete();
    cap.make_immutable()
}

```

The final code in your `day_of_week.move` file should resemble the following:

```codeBlockLines_p187
module policy::day_of_week;

use sui::package;

// Day is not a week day (number in range 0 <= day < 7).
const ENotWeekDay: u64 = 1;
const ENotAllowedDay: u64 = 2;
const MS_IN_DAY: u64 = 24 * 60 * 60 * 1000;

public struct UpgradeCap has key, store {
    id: UID,
    cap: package::UpgradeCap,
    day: u8,
}

public fun new_policy(
    cap: package::UpgradeCap,
    day: u8,
    ctx: &mut TxContext,
): UpgradeCap {
    assert!(day < 7, ENotWeekDay);
    UpgradeCap { id: object::new(ctx), cap, day }
}

fun week_day(ctx: &TxContext): u8 {
    let days_since_unix_epoch = ctx.epoch_timestamp_ms() / MS_IN_DAY;
    // The unix epoch (1st Jan 1970) was a Thursday so shift days
    // since the epoch by 3 so that 0 = Monday.
    ((days_since_unix_epoch + 3) % 7 as u8)
}

public fun authorize_upgrade(
    cap: &mut UpgradeCap,
    policy: u8,
    digest: vector<u8>,
    ctx: &TxContext,
): package::UpgradeTicket {
    assert!(week_day(ctx) == cap.day, ENotAllowedDay);
    cap.cap.authorize_upgrade(policy, digest)
}

public fun commit_upgrade(
    cap: &mut UpgradeCap,
    receipt: package::UpgradeReceipt,
) {
    cap.cap.commit_upgrade(receipt)
}

public fun make_immutable(cap: UpgradeCap) {
    let UpgradeCap { id, cap, day: _ } = cap;
    id.delete();
    cap.make_immutable()
}

```

### Publishing an upgrade policy [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#publishing-an-upgrade-policy "Direct link to Publishing an upgrade policy")

Use the `sui client publish` command to publish the policy.

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

```codeBlockLines_p187
$ sui client publish

```

Click to open

Console output

A successful publish returns the following:

```codeBlockLines_p187
UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING policy
Successfully verified dependencies on-chain against source.
Transaction Digest: 5BzYX5iV6GP2RaSkZ7JPBRmListD5cEVC7REoKsNoCYc
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Data                                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sender: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                                   │
│ Gas Owner: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                                │
│ Gas Budget: 11773600 MIST                                                                                    │
│ Gas Price: 1000 MIST                                                                                         │
│ Gas Payment:                                                                                                 │
│  ┌──                                                                                                         │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                                    │
│  │ Version: 149516398                                                                                        │
│  │ Digest: HRU5orvkMeouFUVf7MXUpJpXP6W7u8DBzhyMichbW8KP                                                      │
│  └──                                                                                                         │
│                                                                                                              │
│ Transaction Kind: Programmable                                                                               │
│ ╭──────────────────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Input Objects                                                                                            │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 0   Pure Arg: Type: address, Value: "0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241" │ │
│ ╰──────────────────────────────────────────────────────────────────────────────────────────────────────────╯ │
│ ╭─────────────────────────────────────────────────────────────────────────╮                                  │
│ │ Commands                                                                │                                  │
│ ├─────────────────────────────────────────────────────────────────────────┤                                  │
│ │ 0  Publish:                                                             │                                  │
│ │  ┌                                                                      │                                  │
│ │  │ Dependencies:                                                        │                                  │
│ │  │   0x0000000000000000000000000000000000000000000000000000000000000001 │                                  │
│ │  │   0x0000000000000000000000000000000000000000000000000000000000000002 │                                  │
│ │  └                                                                      │                                  │
│ │                                                                         │                                  │
│ │ 1  TransferObjects:                                                     │                                  │
│ │  ┌                                                                      │                                  │
│ │  │ Arguments:                                                           │                                  │
│ │  │   Result 0                                                           │                                  │
│ │  │ Address: Input  0                                                    │                                  │
│ │  └                                                                      │                                  │
│ ╰─────────────────────────────────────────────────────────────────────────╯                                  │
│                                                                                                              │
│ Signatures:                                                                                                  │
│    ijPCo4IFqacqAN64UAaJR+J5YhE3+IiEhXA5eEJiI0LZo1y3+byq1WHb3lgU8HLLJTgp+Cuv5GYHsBN5tofYAA==                  │
│                                                                                                              │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Digest: 5BzYX5iV6GP2RaSkZ7JPBRmListD5cEVC7REoKsNoCYc                                              │
│ Status: Success                                                                                   │
│ Executed Epoch: 589                                                                               │
│                                                                                                   │
│ Created Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0x4de927a10f97520311239cadb7159d4b893275bc74ab4e0af1b16c41ba8275a0                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 149516399                                                                             │
│  │ Digest: HLSLcEb3S8t3Zb4cjjSw8dsYhExLyLJ3ParJt2fnoZUu                                           │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ ID: 0xa864e0122efbd1755c387c31bf4ce45c649548d2238c8fcffab4f77cfdab7c1a                         │
│  │ Owner: Immutable                                                                               │
│  │ Version: 1                                                                                     │
│  │ Digest: C9YEPnbCs8dtMUTPrXaSNziXkLWSEnz2zaZsxp1rYYCk                                           │
│  └──                                                                                              │
│ Mutated Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 149516399                                                                             │
│  │ Digest: F4zEiy3eS1h9V2EfrV3WXWe8bktA28sbKxzNCqtTRK2T                                           │
│  └──                                                                                              │
│ Gas Object:                                                                                       │
│  ┌──                                                                                              │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 149516399                                                                             │
│  │ Digest: F4zEiy3eS1h9V2EfrV3WXWe8bktA28sbKxzNCqtTRK2T                                           │
│  └──                                                                                              │
│ Gas Cost Summary:                                                                                 │
│    Storage Cost: 9773600 MIST                                                                     │
│    Computation Cost: 1000000 MIST                                                                 │
│    Storage Rebate: 978120 MIST                                                                    │
│    Non-refundable Storage Fee: 9880 MIST                                                          │
│                                                                                                   │
│ Transaction Dependencies:                                                                         │
│    F2edqX6W9HXU7KzVmfwv9fhGMB6fbjrFo3gVd73S4tK5                                                   │
│    Gtwgse64nSVXhQvmqCpwCe5xJz9N4VypvEGJUy5DyG4e                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────╮
│ No transaction block events │
╰─────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                                 │
│  ┌──                                                                                             │
│  │ ObjectID: 0x4de927a10f97520311239cadb7159d4b893275bc74ab4e0af1b16c41ba8275a0                  │
│  │ Sender: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                    │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 ) │
│  │ ObjectType: 0x2::package::UpgradeCap                                                          │
│  │ Version: 149516399                                                                            │
│  │ Digest: HLSLcEb3S8t3Zb4cjjSw8dsYhExLyLJ3ParJt2fnoZUu                                          │
│  └──                                                                                             │
│ Mutated Objects:                                                                                 │
│  ┌──                                                                                             │
│  │ ObjectID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                  │
│  │ Sender: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                    │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 ) │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                    │
│  │ Version: 149516399                                                                            │
│  │ Digest: F4zEiy3eS1h9V2EfrV3WXWe8bktA28sbKxzNCqtTRK2T                                          │
│  └──                                                                                             │
│ Published Objects:                                                                               │
│  ┌──                                                                                             │
│  │ PackageID: 0xa864e0122efbd1755c387c31bf4ce45c649548d2238c8fcffab4f77cfdab7c1a                 │
│  │ Version: 1                                                                                    │
│  │ Digest: C9YEPnbCs8dtMUTPrXaSNziXkLWSEnz2zaZsxp1rYYCk                                          │
│  │ Modules: day_of_week                                                                          │
│  └──                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Balance Changes                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                              │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: -9795480                                                                               │
│  └──                                                                                              │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯

```

Following best practices, use the Sui Client CLI to call `sui::package::make_immutable` on the `UpgradeCap` to make the policy immutable. In your shell, create a variable `upgradecap` and set its value to the `UpgradeCap` object ID listed in the _Object Changes_ section of your publish response. Of course, the object ID for your upgrade capability is different than the following example.

```codeBlockLines_p187
$ upgradecap=0x4de927a10f97520311239cadb7159d4b893275bc74ab4e0af1b16c41ba8275a0

$ sui client call \
    --package 0x2 \
    --module 'package' \
    --function 'make_immutable' \
    --args $upgradecap

```

Click to open

Console output

A successful call returns a response similar to the following:

```codeBlockLines_p187
Transaction Digest: EuQYMunxnMUFedvXXPck9HrehQnNY4GJ27eFBD7ptk2H
╭─────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Data                                                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sender: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                      │
│ Gas Owner: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                   │
│ Gas Budget: 2000000 MIST                                                                        │
│ Gas Price: 1000 MIST                                                                            │
│ Gas Payment:                                                                                    │
│  ┌──                                                                                            │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                       │
│  │ Version: 149516399                                                                           │
│  │ Digest: F4zEiy3eS1h9V2EfrV3WXWe8bktA28sbKxzNCqtTRK2T                                         │
│  └──                                                                                            │
│                                                                                                 │
│ Transaction Kind: Programmable                                                                  │
│ ╭─────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Input Objects                                                                               │ │
│ ├─────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 0   Imm/Owned Object ID: 0x4de927a10f97520311239cadb7159d4b893275bc74ab4e0af1b16c41ba8275a0 │ │
│ ╰─────────────────────────────────────────────────────────────────────────────────────────────╯ │
│ ╭──────────────────────────────────────────────────────────────────────────────────╮            │
│ │ Commands                                                                         │            │
│ ├──────────────────────────────────────────────────────────────────────────────────┤            │
│ │ 0  MoveCall:                                                                     │            │
│ │  ┌                                                                               │            │
│ │  │ Function:  make_immutable                                                     │            │
│ │  │ Module:    package                                                            │            │
│ │  │ Package:   0x0000000000000000000000000000000000000000000000000000000000000002 │            │
│ │  │ Arguments:                                                                    │            │
│ │  │   Input  0                                                                    │            │
│ │  └                                                                               │            │
│ ╰──────────────────────────────────────────────────────────────────────────────────╯            │
│                                                                                                 │
│ Signatures:                                                                                     │
│    TiJ5uDmG/d8Ca9xLWY0UEx8VnNO2Va6zBwHoFonWVdQNIgj4ghv+ZrbHW85zHw0WanM8hGebANTxrf12pmHmDQ==     │
│                                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Digest: EuQYMunxnMUFedvXXPck9HrehQnNY4GJ27eFBD7ptk2H                                              │
│ Status: Success                                                                                   │
│ Executed Epoch: 589                                                                               │
│ Mutated Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 149516400                                                                             │
│  │ Digest: GVZLEsYEDuaZoFoTnvzoHsjGLuVYfZrZEomLRnSCFkzR                                           │
│  └──                                                                                              │
│ Deleted Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0x4de927a10f97520311239cadb7159d4b893275bc74ab4e0af1b16c41ba8275a0                         │
│  │ Version: 149516400                                                                             │
│  │ Digest: 7gyGAp71YXQRoxmFBaHxofQXAipvgHyBKPyxmdSJxyvz                                           │
│  └──                                                                                              │
│ Gas Object:                                                                                       │
│  ┌──                                                                                              │
│  │ ID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 149516400                                                                             │
│  │ Digest: GVZLEsYEDuaZoFoTnvzoHsjGLuVYfZrZEomLRnSCFkzR                                           │
│  └──                                                                                              │
│ Gas Cost Summary:                                                                                 │
│    Storage Cost: 988000 MIST                                                                      │
│    Computation Cost: 1000000 MIST                                                                 │
│    Storage Rebate: 2595780 MIST                                                                   │
│    Non-refundable Storage Fee: 26220 MIST                                                         │
│                                                                                                   │
│ Transaction Dependencies:                                                                         │
│    5BzYX5iV6GP2RaSkZ7JPBRmListD5cEVC7REoKsNoCYc                                                   │
│    Gtwgse64nSVXhQvmqCpwCe5xJz9N4VypvEGJUy5DyG4e                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────╮
│ No transaction block events │
╰─────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mutated Objects:                                                                                 │
│  ┌──                                                                                             │
│  │ ObjectID: 0x057d71e1f7e8341c5f2b203ae5fcb33c024afcc7f1c8c264fe0fe74dddcd828c                  │
│  │ Sender: 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241                    │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 ) │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                    │
│  │ Version: 149516400                                                                            │
│  │ Digest: GVZLEsYEDuaZoFoTnvzoHsjGLuVYfZrZEomLRnSCFkzR                                          │
│  └──                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Balance Changes                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                              │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: 607780                                                                                 │
│  └──                                                                                              │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯

```

### Creating a package for testing [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#creating-testing-package "Direct link to Creating a package for testing")

With a policy now available on chain, you need a package to upgrade. This topic creates a basic package and references it in the following scenarios, but you can use any package you might have available instead of creating a new one.

If you don't have a package available, use the `sui move new` command to create the template for a new package called `example`.

```codeBlockLines_p187
$ sui move new example

```

In the `example/sources` directory, create an `example.move` file with the following code:

```codeBlockLines_p187
module example::example {
    struct Event has copy, drop { x: u64 }
    entry fun nudge() {
        sui::event::emit(Event { x: 41 })
    }
}

```

The instruction that follows publishes this example package and then upgrades it to change the value in the `Event` it emits. Because you are using a custom upgrade policy, you need to use the TypeScript SDK to build the package's publish and upgrade commands.

### Using TypeScript SDK [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#using-typeccript-sdk "Direct link to Using TypeScript SDK")

Create a new directory to store a Node.js project. You can use the `npm init` function to create the `package.json`, or manually create the file. Depending on your approach to creating `package.json`, populate or add the following JSON to it:

```codeBlockLines_p187
{ "type": "module" }

```

Open a terminal or console to the root of your Node.js project. Run the following command to add the Sui TypeScript SDK as a dependency:

```codeBlockLines_p187
$ npm install @mysten/sui

```

### Publishing a package with custom policy [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#publishing-custom-policy "Direct link to Publishing a package with custom policy")

In the root of your Node.js project, create a script file named `publish.js`. Open the file for editing and define some constants:

- `SUI`: the location of the `sui` CLI binary.
- `POLICY_PACKAGE_ID`: the ID of our published `day_of_week` package.

```codeBlockLines_p187
const SUI = 'sui';
const POLICY_PACKAGE_ID = '<POLICY-PACKAGE>';

```

Next, add boilerplate code to get the signer key pair for the currently active address in the Sui Client CLI:

```codeBlockLines_p187
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

const sender = execSync(`${SUI} client active-address`, { encoding: 'utf8' }).trim();
const signer = (() => {
	const keystore = JSON.parse(
		readFileSync(path.join(homedir(), '.sui', 'sui_config', 'sui.keystore'), 'utf8'),
	);

	for (const priv of keystore) {
		const raw = fromBase64(priv);
		if (raw[0] !== 0) {
			continue;
		}

		const pair = Ed25519Keypair.fromSecretKey(raw.slice(1));
		if (pair.getPublicKey().toSuiAddress() === sender) {
			return pair;
		}
	}

	throw new Error(`keypair not found for sender: ${sender}`);
})();

```

Next, define the path of the package you are publishing. The following snippet assumes that the package is in a sibling directory to
`publish.js`, called `example`:

```codeBlockLines_p187
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Location of package relative to current directory
const packagePath = path.join(__dirname, 'example');

```

Next, build the package:

```codeBlockLines_p187
const { modules, dependencies } = JSON.parse(
	execSync(`${SUI} move build --dump-bytecode-as-base64 --path ${packagePath}`, {
		encoding: 'utf-8',
	}),
);

```

Next, construct the transaction to publish the package. Wrap its `UpgradeCap` in a "day of the week" policy, which permits upgrades on Tuesdays, and send the new policy back:

```codeBlockLines_p187
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
const packageUpgradeCap = tx.publish({ modules, dependencies });
const tuesdayUpgradeCap = tx.moveCall({
	target: `${POLICY_PACKAGE_ID}::day_of_week::new_policy`,
	arguments: [\
		packageUpgradeCap,\
		tx.pure(1), // Tuesday\
	],
});

tx.transferObjects([tuesdayUpgradeCap], tx.pure(sender));

```

And finally, execute that transaction and display its effects to the console. The following snippet assumes that you're running your examples against a local network. Pass `devnet`, `testnet`, or `mainnet` to the `getFullnodeUrl()` function to run on Devnet, Testnet, or Mainnet respectively:

```codeBlockLines_p187
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('localnet') });
const result = await client.signAndExecuteTransaction({
	signer,
	transaction: tx,
	options: {
		showEffects: true,
		showObjectChanges: true,
	},
});

console.log(result);

```

Click to open

`publish.js`

```codeBlockLines_p187
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const SUI = 'sui';
const POLICY_PACKAGE_ID = '<POLICY-PACKAGE>';
const sender = execSync(`${SUI} client active-address`, { encoding: 'utf8' }).trim();
const signer = (() => {
	const keystore = JSON.parse(
		readFileSync(path.join(homedir(), '.sui', 'sui_config', 'sui.keystore'), 'utf8'),
	);

	for (const priv of keystore) {
		const raw = fromBase64(priv);
		if (raw[0] !== 0) {
			continue;
		}

		const pair = Ed25519Keypair.fromSecretKey(raw.slice(1));
		if (pair.getPublicKey().toSuiAddress() === sender) {
			return pair;
		}
	}

	throw new Error(`keypair not found for sender: ${sender}`);
})();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, 'example');

const { modules, dependencies } = JSON.parse(
	execSync(`${SUI} move build --dump-bytecode-as-base64 --path ${packagePath}`, {
		encoding: 'utf-8',
	}),
);

const tx = new Transaction();
const packageUpgradeCap = tx.publish({ modules, dependencies });
const tuesdayUpgradeCap = tx.moveCall({
	target: `${POLICY_PACKAGE_ID}::day_of_week::new_policy`,
	arguments: [\
		packageUpgradeCap,\
		tx.pure(1), // Tuesday\
	],
});

tx.transferObjects([tuesdayUpgradeCap], tx.pure(sender));

const client = new SuiClient({ url: getFullnodeUrl('localnet') });
const result = await client.signAndExecuteTransaction({
	signer,
	transaction: tx,
	options: {
		showEffects: true,
		showObjectChanges: true,
	},
});

console.log(result);

```

Save your `publish.js` file, and then use Node.js to run the script:

```codeBlockLines_p187
$ node publish.js

```

Click to open

Console output

If the script is successful, the console prints the following response:

```codeBlockLines_p187
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING example
{
  digest: '9NBLe61sRqe7wS6y8mMVt6vhwA9W5Sz5YVEmuCwNMT64',
  effects: {
    messageVersion: 'v1',
    status: { status: 'success' },
    executedEpoch: '0',
    gasUsed: {
      computationCost: '1000000',
      storageCost: '6482800',
      storageRebate: '978120',
      nonRefundableStorageFee: '9880'
    },
    modifiedAtVersions: [ [Object] ],
    transactionDigest: '9NBLe61sRqe7wS6y8mMVt6vhwA9W5Sz5YVEmuCwNMT64',
    created: [ [Object], [Object] ],
    mutated: [ [Object] ],
    gasObject: { owner: [Object], reference: [Object] },
    dependencies: [\
      'BMVXjS7GG3d5W4Prg7gMVyvKTzEk1Hazx7Tq4WCcbcz9',\
      'CAFFD2HHnULQMCycL9xgad5JJpjFu2nuftf2xyugQu4t',\
      'GGDUeVkDoNFcyGibGNeiaGSiKsxf9QLzbjqPzdqi3dNJ'\
    ]
  },
  objectChanges: [\
    {\
      type: 'mutated',\
      sender: '<SENDER>',\
      owner: [Object],\
      objectType: '0x2::coin::Coin<0x2::sui::SUI>',\
      objectId: '<GAS>',\
      version: '10',\
      previousVersion: '9',\
      digest: 'Dz38faAzFsRzKQyT7JTkVydCcvNNxbUdZiutGmA2Eyy6'\
    },\
    {\
      type: 'published',\
      packageId: '<EXAMPLE-PACKAGE>',\
      version: '1',\
      digest: '5JdU8hkFTjyqg4fHyC8JtdHBV11yCCKdFuyf9j4kKY3o',\
      modules: [Array]\
    },\
    {\
      type: 'created',\
      sender: '<SENDER>',\
      owner: [Object],\
      objectType: '<POLICY-PACKAGE>::day_of_week::UpgradeCap',\
      objectId: '<EXAMPLE-UPGRADE-CAP>',\
      version: '10',\
      digest: '3uAMFHFKunX9XrufMe27MHDbeLpgHBSsCPN3gSa93H3v'\
    }\
  ],
  confirmedLocalExecution: true
}

```

tip

If you receive a `ReferenceError: fetch is not defined` error, use Node.js version 18 or greater.

Use the CLI to test that your newly published package works:

```codeBlockLines_p187
$ sui client call --gas-budget 10000000 \
    --package '<EXAMPLE-PACKAGE-ID>' \
    --module 'example' \
    --function 'nudge' \

```

Click to open

Console output

A successful call responds with the following:

```codeBlockLines_p187
----- Transaction Digest ----
Bx1GA8EsBjoLKvXV2GG92DC5Jt58dbytf6jFcLg18dDR
----- Transaction Data ----
Transaction Signature: [Signature(Ed25519SuiSignature(Ed25519SuiSignature([0, 92, 22, 253, 150, 35, 134, 140, 185, 239, 72, 194, 25, 250, 153, 98, 134, 26, 219, 232, 199, 122, 56, 189, 186, 56, 126, 184, 147, 148, 184, 4, 17, 177, 156, 231, 198, 74, 118, 28, 187, 132, 94, 141, 44, 55, 70, 207, 157, 143, 182, 83, 59, 156, 116, 226, 22, 65, 211, 179, 187, 18, 76, 245, 4, 92, 225, 85, 204, 230, 61, 45, 147, 106, 193, 13, 195, 116, 230, 99, 61, 161, 251, 251, 68, 154, 46, 172, 143, 122, 101, 212, 120, 80, 164, 214, 54])))]
Transaction Kind : Programmable
Inputs: []
Commands: [\
  MoveCall(<EXAMPLE-PACKAGE>::example::nudge()),\
]

Sender: <SENDER>
Gas Payment: Object ID: <GAS>, version: 0xb, digest: 93nZ3uLmLfJdHWoSHMuHsjFstEf45EM2pfovu3ibo4iH
Gas Owner: <SENDER>
Gas Price: 1000
Gas Budget: 10000000

----- Transaction Effects ----
Status : Success
Mutated Objects:
  - ID: <GAS> , Owner: Account Address ( <SENDER> )

----- Events ----
Array [\
    Object {\
        "id": Object {\
            "txDigest": String("Bx1GA8EsBjoLKvXV2GG92DC5Jt58dbytf6jFcLg18dDR"),\
            "eventSeq": String("0"),\
        },\
        "packageId": String("<EXAMPLE-PACKAGE>"),\
        "transactionModule": String("example"),\
        "sender": String("<SENDER>"),\
        "type": String("<EXAMPLE-PACKAGE>::example::Event"),\
        "parsedJson": Object {\
            "x": String("41"),\
        },\
        "bcs": String("7rkaa6aDvyD"),\
    },\
]
----- Object changes ----
Array [\
    Object {\
        "type": String("mutated"),\
        "sender": String("<SENDER>"),\
        "owner": Object {\
            "AddressOwner": String("<SENDER>"),\
        },\
        "objectType": String("0x2::coin::Coin<0x2::sui::SUI>"),\
        "objectId": String("<GAS>"),\
        "version": String("12"),\
        "previousVersion": String("11"),\
        "digest": String("9aNuZF63uBVaWF9L6cVmk7geimmpP9h9StigdNDPSiy3"),\
    },\
]
----- Balance changes ----
Array [\
    Object {\
        "owner": Object {\
            "AddressOwner": String("<SENDER>"),\
        },\
        "coinType": String("0x2::sui::SUI"),\
        "amount": String("-1009880"),\
    },\
]

```

If you used the example package provided, notice you have an `Events` section that contains a field `x` with value `41`.

### Upgrading a package with custom policy [​](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies\#upgrading-custom-policy "Direct link to Upgrading a package with custom policy")

With your package published, you can prepare an `upgrade.js` script to perform an upgrade using the new policy. It behaves identically to `publish.js` up until building the package. When building the package, the script also captures its `digest`, and the transaction now performs the three upgrade commands (authorize, execute, commit). The full script for `upgrade.js` follows:

```codeBlockLines_p187
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction, UpgradePolicy } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const SUI = 'sui';
const POLICY_PACKAGE_ID = '<POLICY-PACKAGE>';
const EXAMPLE_PACKAGE_ID = '<EXAMPLE-PACKAGE>';
const CAP_ID = '<EXAMPLE-UPGRADE-CAP>';
const sender = execSync(`${SUI} client active-address`, { encoding: 'utf8' }).trim();
const signer = (() => {
	const keystore = JSON.parse(
		readFileSync(path.join(homedir(), '.sui', 'sui_config', 'sui.keystore'), 'utf8'),
	);

	for (const priv of keystore) {
		const raw = fromBase64(priv);
		if (raw[0] !== 0) {
			continue;
		}

		const pair = Ed25519Keypair.fromSecretKey(raw.slice(1));
		if (pair.getPublicKey().toSuiAddress() === sender) {
			return pair;
		}
	}

	throw new Error(`keypair not found for sender: ${sender}`);
})();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, 'example');

const { modules, dependencies, digest } = JSON.parse(
	execSync(`${SUI} move build --dump-bytecode-as-base64 --path ${packagePath}`, {
		encoding: 'utf-8',
	}),
);

const tx = new Transaction();
const cap = tx.object(CAP_ID);
const ticket = tx.moveCall({
	target: `${POLICY_PACKAGE_ID}::day_of_week::authorize_upgrade`,
	arguments: [cap, tx.pure(UpgradePolicy.COMPATIBLE), tx.pure(digest)],
});

const receipt = tx.upgrade({
	modules,
	dependencies,
	packageId: EXAMPLE_PACKAGE_ID,
	ticket,
});

tx.moveCall({
	target: `${POLICY_PACKAGE_ID}::day_of_week::commit_upgrade`,
	arguments: [cap, receipt],
});

const client = new SuiClient({ url: getFullnodeUrl('localnet') });
const result = await client.signAndExecuteTransaction({
	signer,
	transaction: tx,
	options: {
		showEffects: true,
		showObjectChanges: true,
	},
});

console.log(result);

```

If today is not Tuesday, wait until next Tuesday to run the script, when your policy allows you to perform upgrades. At that point, update your `example.move` so the event is emitted with a different constant and use Node.js to run the upgrade script:

```codeBlockLines_p187
$ node upgrade.js

```

Click to open

Console output

If the script is successful (and today is Tuesday), your console displays the following response:

```codeBlockLines_p187
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING example
{
  digest: 'EzJyH6BX231sw4jY6UZ6r9Dr28SKsiB2hg3zw4Jh4D5P',
  effects: {
    messageVersion: 'v1',
    status: { status: 'success' },
    executedEpoch: '0',
    gasUsed: {
      computationCost: '1000000',
      storageCost: '6482800',
      storageRebate: '2874168',
      nonRefundableStorageFee: '29032'
    },
    modifiedAtVersions: [ [Object], [Object] ],
    transactionDigest: 'EzJyH6BX231sw4jY6UZ6r9Dr28SKsiB2hg3zw4Jh4D5P',
    created: [ [Object] ],
    mutated: [ [Object], [Object] ],
    gasObject: { owner: [Object], reference: [Object] },
    dependencies: [\
      '62BxVq24tgaRrFTXR3i944RRZ6x8sgTGbjFzpFDe2RAB',\
      'BMVXjS7GG3d5W4Prg7gMVyvKTzEk1Hazx7Tq4WCcbcz9',\
      'Bx1GA8EsBjoLKvXV2GG92DC5Jt58dbytf6jFcLg18dDR',\
      'CAFFD2HHnULQMCycL9xgad5JJpjFu2nuftf2xyugQu4t'\
    ]
  },
  objectChanges: [\
    {\
      type: 'mutated',\
      sender: '<SENDER>',\
      owner: [Object],\
      objectType: '0x2::coin::Coin<0x2::sui::SUI>',\
      objectId: '<GAS>',\
      version: '13',\
      previousVersion: '12',\
      digest: 'DF4aebHRYrVdxtfAaFfET3hLHn5hqsoty4joMYxLDBuc'\
    },\
    {\
      type: 'mutated',\
      sender: '<SENDER>',\
      owner: [Object],\
      objectType: '<POLICY-PACKAGE>::day_of_week::UpgradeCap',\
      objectId: '<EXAMPLE-UPGRADE-CAP>',\
      version: '13',\
      previousVersion: '11',\
      digest: '5Wtuw9mAGBuP5qFdTzDCRxBF9LqJ7uZbpxk2UXhAkrXL'\
    },\
    {\
      type: 'published',\
      packageId: '<UPGRADED-EXAMPLE-PACKAGE>',\
      version: '2',\
      digest: '7mvnMEXezAGcWqYSt6R4QUpPjY8nqTSmb5Dv2SqkVq7a',\
      modules: [Array]\
    }\
  ],
  confirmedLocalExecution: true
}

```

Use the Sui Client CLI to test the upgraded package (the package ID is **different** from the original version of your example package):

```codeBlockLines_p187
$ sui client call --gas-budget 10000000 \
    --package '<UPGRADED-EXAMPLE-PACKAGE>' \
    --module 'example' \
    --function 'nudge'

```

Click to open

Console output

If successful, the console prints the following response:

```codeBlockLines_p187
----- Transaction Digest ----
EF2rQzWHmtjPvkqzFGyFvANA8e4ETULSBqDMkzqVoshi
----- Transaction Data ----
Transaction Signature: [Signature(Ed25519SuiSignature(Ed25519SuiSignature([0, 88, 98, 118, 173, 218, 55, 4, 48, 166, 42, 106, 193, 210, 159, 75, 233, 95, 77, 201, 38, 0, 234, 183, 77, 252, 178, 22, 221, 106, 202, 42, 166, 29, 130, 164, 97, 110, 201, 153, 91, 149, 50, 72, 6, 213, 183, 70, 83, 55, 5, 190, 182, 5, 98, 212, 134, 103, 181, 204, 247, 90, 28, 125, 14, 92, 225, 85, 204, 230, 61, 45, 147, 106, 193, 13, 195, 116, 230, 99, 61, 161, 251, 251, 68, 154, 46, 172, 143, 122, 101, 212, 120, 80, 164, 214, 54])))]
Transaction Kind : Programmable
Inputs: []
Commands: [\
  MoveCall(<UPGRADE-EXAMPLE-PACKAGE>::example::nudge()),\
]

Sender: <SENDER>
Gas Payment: Object ID: <GAS>, version: 0xd, digest: DF4aebHRYrVdxtfAaFfET3hLHn5hqsoty4joMYxLDBuc
Gas Owner: <SENDER>
Gas Price: 1000
Gas Budget: 10000000

----- Transaction Effects ----
Status : Success
Mutated Objects:
  - ID: <GAS> , Owner: Account Address ( <SENDER> )

----- Events ----
Array [\
    Object {\
        "id": Object {\
            "txDigest": String("EF2rQzWHmtjPvkqzFGyFvANA8e4ETULSBqDMkzqVoshi"),\
            "eventSeq": String("0"),\
        },\
        "packageId": String("<UPGRADE-EXAMPLE-PACKAGE>"),\
        "transactionModule": String("example"),\
        "sender": String("<SENDER>"),\
        "type": String("<EXAMPLE-PACKAGE>::example::Event"),\
        "parsedJson": Object {\
            "x": String("42"),\
        },\
        "bcs": String("82TFauPiYEj"),\
    },\
]
----- Object changes ----
Array [\
    Object {\
        "type": String("mutated"),\
        "sender": String("<SENDER>"),\
        "owner": Object {\
            "AddressOwner": String("<SENDER>"),\
        },\
        "objectType": String("0x2::coin::Coin<0x2::sui::SUI>"),\
        "objectId": String("<GAS>"),\
        "version": String("14"),\
        "previousVersion": String("13"),\
        "digest": String("AmGocCxy6cHvCuGG3izQ8a7afp6qWWt14yhowAzBYa44"),\
    },\
]
----- Balance changes ----
Array [\
    Object {\
        "owner": Object {\
            "AddressOwner": String("<SENDER>"),\
        },\
        "coinType": String("0x2::sui::SUI"),\
        "amount": String("-1009880"),\
    },\
]

```

Now, the `Events` section emitted for the `x` field has a value of `42` (changed from the original `41`).

If you attempt the first upgrade before Tuesday or you change the constant again and try the upgrade the following day, the script receives a response that includes an error similar to the following, which indicates that the upgrade aborted with code `2` ( `ENotAllowedDay`):

```codeBlockLines_p187
...
status: {
  status: 'failure',
  error: 'MoveAbort(MoveLocation { module: ModuleId { address: <POLICY-PACKAGE>, name: Identifier("day_of_week") }, function: 1, instruction: 11, function_name: Some("authorize_upgrade") }, 2) in command 0'
},
...

```

- [Compatibility](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#compatibility)
- [Upgrade overview](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#upgrade-overview)
- [UpgradeCap](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#upgradecap)
- [UpgradeTicket](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#upgradeticket)
  - [Package digest](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#package-digest)
- [UpgradeReceipt](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#upgradereceipt)
- [Isolating policies](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#isolating-policies)
- [Example: "Day of the Week" upgrade policy](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#example-upgrade)
  - [Creating an upgrade policy](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#creating-upgrade-policy)
  - [Publishing an upgrade policy](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#publishing-an-upgrade-policy)
  - [Creating a package for testing](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#creating-testing-package)
  - [Using TypeScript SDK](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#using-typeccript-sdk)
  - [Publishing a package with custom policy](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#publishing-custom-policy)
  - [Upgrading a package with custom policy](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies#upgrading-custom-policy)