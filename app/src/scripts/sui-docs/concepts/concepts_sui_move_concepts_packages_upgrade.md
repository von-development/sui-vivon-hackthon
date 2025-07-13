# https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade

[Skip to main content](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#__docusaurus_skipToContent_fallback)

On this page

Sui smart contracts are immutable package objects consisting of a collection of Move modules. Because the packages are immutable, transactions can safely access smart contracts without full consensus (fastpath transactions). If someone could change these packages, they would become [shared objects](https://docs.sui.io/concepts/object-ownership/shared#shared), which would require full consensus before completing a transaction.

The inability to change package objects, however, becomes a problem when considering the iterative nature of code development. Builders require the ability to update their code and pull changes from other developers while still being able to reap the benefits of fastpath transactions. Fortunately, the Sui network provides a method of upgrading your packages while still retaining their immutable properties.

## Upgrade considerations [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#upgrade-considerations "Direct link to Upgrade considerations")

There are some details of the process that you should consider before upgrading your packages.

For example, module initializers do not re-run with package upgrades. When you publish your initial package, Move runs the `init` function you define for the package once (and only once) at the time of the publish event. Any `init` functions you might include in subsequent versions of your package are ignored. See [Module Initializer](https://move-book.com/programmability/module-initializer.html) in The Move Book for more information.

As alluded to previously, all packages on the Sui network are immutable. Because of this fact, you cannot delete old packages from the chain. As a result, there is nothing that prevents other packages from accessing the methods and types defined in the old versions of your upgraded packages. By default, users can choose to keep using the old version of a package, as well. As a package developer, you must be aware of and account for this possibility.

For example, you might define an `increment` function in your original package:

```codeBlockLines_p187
public fun increment(c: &mut Counter) {
    c.value = c.value + 1;
}

```

Then, your package upgrade might add an emit event to the `increment` function:

```codeBlockLines_p187
public struct Progress has copy, drop {
    reached: u64
}

public fun increment(c: &mut Counter) {
    c.value = c.value + 1;

    if (c.value % 100 == 0) {
        event::emit(Progress { reached: c.value });
    }
}

```

If there is a mix of callers for both the old and upgraded `increment` function, then the process fails because the old function is not aware of the `Progress` event.

Similar to mismatched function definitions, you might also run into issues maintaining dynamic fields that need to remain in sync with a struct's original fields. To address these issues, you can introduce a new type as part of the upgrade and port users over to it, breaking backwards compatibility. For example, if you're using owned objects to demonstrate proof, like proof of ownership, and you develop a new version of your package to address problematic code, you can introduce a new type in the upgraded package. You can then add a function to your package that trades old objects for new ones. Because your logic only recognizes objects with the new type, you effectively force users to update.

Another example of having users update to the latest package is when you have a bookkeeping shared object in your package that you discover has flawed logic so is not functioning as expected. As in the previous example, you want users to use only the object defined in the upgraded package with the correct logic, so you add a new type and migration function to your package upgrade. This process requires a couple of transactions, one for the upgrade and another that you call from the upgraded package to set up the new shared object that replaces the existing one. To protect the setup function, you would need to create an `AdminCap` object or similar as part of your package to make sure you, as the package owner, are the only authorized initiator of that function. Perhaps even more useful, you might include a flag in the shared object that allows you, as the package owner, to toggle the enabled state of that shared object. You can add a check for the enabled state to prevent access to that object from the on-chain public while you perform the migration. Of course, you would probably create this flag only if you expected to perform this migration at some point in the future, not because you're intentionally developing objects with flawed logic.

### Versioned shared objects [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#versioned-shared-objects "Direct link to Versioned shared objects")

When you create packages that involve shared objects, you need to think about upgrades and versioning from the start given that **all prior versions of a package still exist on-chain**. A useful pattern is to introduce versioning to the shared object and using a version check to guard access to functions in the package. This enables you to limit access to the shared object to only the latest version of a package.

Considering the earlier `counter` example, which might have started life as follows:

```codeBlockLines_p187
module example::counter;

public struct Counter has key {
    id: UID,
    value: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Counter {
        id: object::new(ctx),
        value: 0,
    })
}

public fun increment(c: &mut Counter) {
    c.value = c.value + 1;
}

```

To ensure that upgrades to this package can limit access of the shared object to the latest version of the package, you need to:

1. Track the current version of the module in a constant, `VERSION`.
2. Track the current version of the shared object, `Counter`, in a new `version` field.
3. Introduce an `AdminCap` to protect privileged calls, and associate the `Counter` with its `AdminCap` with a new field (you might already have a similar type for shared object administration, in which case you can re-use that). This cap is used to protect calls to migrate the shared object from version to version.
4. Guard the entry of all functions that access the shared object with a check that its `version` matches the package `VERSION`.

An upgrade-aware `counter` module that incorporates all these ideas looks as follows:

```codeBlockLines_p187
module example::counter;

/// Not the right admin for this counter
const ENotAdmin: u64 = 0;

/// Calling functions from the wrong package version
const EWrongVersion: u64 = 1;

// 1. Track the current version of the module
const VERSION: u64 = 1;

public struct Counter has key {
    id: UID,
    // 2. Track the current version of the shared object
    version: u64,
    // 3. Associate the `Counter` with its `AdminCap`
    admin: ID,
    value: u64,
}

public struct AdminCap has key {
    id: UID,
}

fun init(ctx: &mut TxContext) {
    let admin = AdminCap { id: object::new(ctx) };

    transfer::share_object(Counter {
        id: object::new(ctx),
        version: VERSION,
        admin: object::id(&admin),
        value: 0,
    });

    transfer::transfer(admin, ctx.sender());
}

public fun increment(c: &mut Counter) {
    // 4. Guard the entry of all functions that access the shared object
    //    with a version check.
    assert!(c.version == VERSION, EWrongVersion);
    c.value = c.value + 1;
}

```

To upgrade a module using this pattern requires making two extra changes, on top of any implementation changes your upgrade requires:

1. Bump the `VERSION` of the package.
2. Introduce a `migrate` function to upgrade the shared object.

The following module is an upgraded `counter` that emits `Progress` events as originally discussed, but also provides tools for an admin ( `AdminCap` holder) to prevent accesses to the counter from older package versions:

```codeBlockLines_p187
module example::counter;

use sui::event;

/// Not the right admin for this counter
const ENotAdmin: u64 = 0;

/// Migration is not an upgrade
const ENotUpgrade: u64 = 1;

/// Calling functions from the wrong package version
const EWrongVersion: u64 = 2;

// 1. Bump the `VERSION` of the package.
const VERSION: u64 = 2;

public struct Counter has key {
    id: UID,
    version: u64,
    admin: ID,
    value: u64,
}

public struct AdminCap has key {
    id: UID,
}

public struct Progress has copy, drop {
    reached: u64,
}

fun init(ctx: &mut TxContext) {
    let admin = AdminCap {
        id: object::new(ctx),
    };

    transfer::share_object(Counter {
        id: object::new(ctx),
        version: VERSION,
        admin: object::id(&admin),
        value: 0,
    });

    transfer::transfer(admin, ctx.sender());
}

public fun increment(c: &mut Counter) {
    assert!(c.version == VERSION, EWrongVersion);
    c.value = c.value + 1;

    if (c.value % 100 == 0) {
        event::emit(Progress { reached: c.value })
    }
}

// 2. Introduce a migrate function
entry fun migrate(c: &mut Counter, a: &AdminCap) {
    assert!(c.admin == object::id(a), ENotAdmin);
    assert!(c.version < VERSION, ENotUpgrade);
    c.version = VERSION;
}

```

Upgrading to this version of the package requires performing the package upgrade, and calling the `migrate` function in a follow-up transaction. Note that the `migrate` function:

- Is an `entry` function and **not `public`**. This allows it to be entirely changed (including changing its signature or removing it entirely) in later upgrades.
- Accepts an `AdminCap` and checks that its ID matches the ID of the counter being migrated, making it a privileged operation.
- Includes a sanity check that the version of the module is actually an upgrade for the object. This helps catch errors such as failing to bump the module version before upgrading.

After a successful upgrade, calls to `increment` on the previous version of the package aborts on the version check, while calls on the later version should succeed.

### Extensions [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#extensions "Direct link to Extensions")

This pattern forms the basis for upgradeable packages involving shared objects, but you can extend it in a number of ways, depending on your package's needs:

- The version constraints can be made more expressive:
  - Rather than using a single `u64`, versions could be specified as a `String`, or a pair of upper and lower bounds.
  - You can control access to specific functions or sets of functions by adding and removing marker types as dynamic fields on the shared object.
- The `migrate` function could be made more sophisticated (modifying other fields in the shared object, adding/removing dynamic fields, migrating multiple shared objects simultaneously).
- You can implement large migrations that need to run over multiple transactions in a three phase set-up:
  - Disable general access to the shared object by setting its version to a sentinel value (e.g. `U64_MAX`), using an `AdminCap`-guarded call.
  - Run the migration over the course of multiple transactions (e.g. if a large volume of objects need to be moved, it is best to do this in batches, to avoid hitting transaction limits).
  - Set the version of the shared object back to a usable value.

## Upgrade requirements [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#upgrade-requirements "Direct link to Upgrade requirements")

To upgrade a package, your package must satisfy the following requirements:

- You must have an `UpgradeTicket` for the package you want to upgrade. The Sui network issues `UpgradeCap` s when you publish a package, then you can issue `UpgradeTicket` s as the owner of that `UpgradeCap`. The Sui Client CLI handles this requirement automatically.
- Your changes must be layout-compatible with the previous version.
  - Existing `public` function signatures must remain the same.
  - Existing struct layouts (including struct abilities) must remain the same.
  - You can add new structs and functions.
  - You can remove generic type constraints from existing functions (public or otherwise).
  - You can change function implementations.
  - You can change non- `public` function signatures, including `friend` and `entry` function signatures.

info

If you have a package with a dependency, and that dependency is upgraded, your package does not automatically depend on the newer version. You must explicitly upgrade your own package to point to the new dependency.

## Upgrading [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#upgrading "Direct link to Upgrading")

Use the `sui client upgrade` command to upgrade packages that meet the previous requirements, providing values for the following flags:

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

- `--gas-budget`: The maximum number of gas units that can be expended before the network cancels the transaction.
- `--cap`: The ID of the `UpgradeCap`. You receive this ID as a return from the publish command.

Developers upgrading packages using Move code have access to types and functions to define custom upgrade policies. For example, a Move developer might want to disallow upgrading a package, regardless of the current package owner. The [`make_immutable` function](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui/package.md#0x2_package_make_immutable) is available to them to create this behavior. More advanced policies using available types like `UpgradeTicket` and `Upgrade Receipt` are also possible. For an example, see this [custom upgrade policy](https://github.com/MystenLabs/sui/issues/2045#:~:text=Implement%20a%20custom%20upgrade%20policy) on GitHub.

When you use the Sui Client CLI, the `upgrade` command handles generating the upgrade digest, authorizing the upgrade with the `UpgradeCap` to get an `UpgradeTicket`, and updating the `UpgradeCap` with the `UpgradeReceipt` after a successful upgrade. To learn more about these processes, see the Move documentation for the [package module](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui/package.md).

## Example [​](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade\#example "Direct link to Example")

You develop a package named `sui_package`. Its manifest looks like the following:

```codeBlockLines_p187
[package]
name = "sui_package"
version = "0.0.0"

[addresses]
sui_package = "0x0"

```

When your package is ready, you publish it:

```codeBlockLines_p187
$ sui client publish

```

And receive the response:

```codeBlockLines_p187
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING my_first_package
Successfully verified dependencies on-chain against source.
Transaction Digest: GPSpH264CjQPaXQPpMHpkzyGidZnQFvd1yUH5s9ncesi
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Data                                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sender: PUBLISHER-ID                                                                                         │
│ Gas Owner: PUBLISHER-ID                                                                                      │
│ Gas Budget: 12298000 MIST                                                                                    │
│ Gas Price: 1000 MIST                                                                                         │
│ Gas Payment:                                                                                                 │
│  ┌──                                                                                                         │
│  │ ID: GAS-COIN-ID                                                                                           │
│  │ Version: 2                                                                                                │
│  │ Digest: QDssxM4QKnhutWCYijiWWmYPtKWnHB9xVaLqPsDHiep                                                       │
│  └──                                                                                                         │
│                                                                                                              │
│ Transaction Kind: Programmable                                                                               │
│ ╭──────────────────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Input Objects                                                                                            │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 0   Pure Arg: Type: address, Value: "PUBLISHER-ID"                                                       │ │
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
│    4NqP6CL1/LN1Ekr9NeL82PFGgVdEjrwsP82l/0mFvCd9TYO94CKBQAm8C/D6DsAuBrwu4cogQ3Mbh1huGc0yCg==                  │
│                                                                                                              │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Digest: GPSpH264CjQPaXQPpMHpkzyGidZnQFvd1yUH5s9ncesi                                              │
│ Status: Success                                                                                   │
│ Executed Epoch: 285                                                                               │
│                                                                                                   │
│ Created Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: ORIGINAL-PACKAGE-ID                                                                        │
│  │ Owner: Immutable                                                                               │
│  │ Version: 1                                                                                     │
│  │ Digest: 4ZvhnDgehkRmzo3mtHjCc6aQkEz1SA87rDpDS6pGarFR                                           │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ ID: 0xaa06f409af7a36c20a552e729eb985a9979149ae9ada5ce3ed413836fd12ed16                         │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 3                                                                                     │
│  │ Digest: 71G4PuCUoqx1KDTnt8zGMYUf6Qpf4CWgZsDxYN1d7mXE                                           │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ ID: UPGRADE-CAP-ID                                                                             │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 3                                                                                     │
│  │ Digest: FNxdiGCk1fwXByda6Q2sx8RjuwUQBFYQk7C4Zr2H4qVw                                           │
│  └──                                                                                              │
│ Mutated Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: GAS-COIN-ID                                                                                │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 3                                                                                     │
│  │ Digest: 9Fet6LPSBsjYjVMEQxkB4LRHfAJDFCQQ2iUAiUQ5eygF                                           │
│  └──                                                                                              │
│ Gas Object:                                                                                       │
│  ┌──                                                                                              │
│  │ ID: GAS-COIN-ID                                                                                │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 3                                                                                     │
│  │ Digest: 9Fet6LPSBsjYjVMEQxkB4LRHfAJDFCQQ2iUAiUQ5eygF                                           │
│  └──                                                                                              │
│ Gas Cost Summary:                                                                                 │
│    Storage Cost: 10298000 MIST                                                                    │
│    Computation Cost: 1000000 MIST                                                                 │
│    Storage Rebate: 978120 MIST                                                                    │
│    Non-refundable Storage Fee: 9880 MIST                                                          │
│                                                                                                   │
│ Transaction Dependencies:                                                                         │
│    3eHwwq6p2xQwBtXDE9KKNQwZFdHUGEKiJsR5LDmv4o7b                                                   │
│    7KAuWTJHCZmh2rMSAqobkhU5cuRBoVicwae78i9woDUK                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────╮
│ No transaction block events │
╰─────────────────────────────╯

╭────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                                   │
│  ┌──                                                                                               │
│  │ ObjectID: 0xaa06f409af7a36c20a552e729eb985a9979149ae9ada5ce3ed413836fd12ed16                    │
│  │ Sender: PUBLISHER-ID                                                                            │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                         │
│  │ ObjectType: ORIGINAL-PACKAGE-ID::module::TYPE                                                   │
│  │ Version: 3                                                                                      │
│  │ Digest: 71G4PuCUoqx1KDTnt8zGMYUf6Qpf4CWgZsDxYN1d7mXE                                            │
│  └──                                                                                               │
│  ┌──                                                                                               │
│  │ ObjectID: UPGRADE-CAP-ID                                                                        │
│  │ Sender: PUBLISHER-ID                                                                            │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                         │
│  │ ObjectType: 0x2::package::UpgradeCap                                                            │
│  │ Version: 3                                                                                      │
│  │ Digest: FNxdiGCk1fwXByda6Q2sx8RjuwUQBFYQk7C4Zr2H4qVw                                            │
│  └──                                                                                               │
│ Mutated Objects:                                                                                   │
│  ┌──                                                                                               │
│  │ ObjectID: GAS-COIN-ID                                                                           │
│  │ Sender: PUBLISHER-ID                                                                            │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                         │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                      │
│  │ Version: 3                                                                                      │
│  │ Digest: 9Fet6LPSBsjYjVMEQxkB4LRHfAJDFCQQ2iUAiUQ5eygF                                            │
│  └──                                                                                               │
│ Published Objects:                                                                                 │
│  ┌──                                                                                               │
│  │ PackageID: ORIGINAL-PACKAGE-ID                                                                  │
│  │ Version: 1                                                                                      │
│  │ Digest: 4ZvhnDgehkRmzo3mtHjCc6aQkEz1SA87rDpDS6pGarFR                                            │
│  │ Modules: example                                                                                │
│  └──                                                                                               │
╰────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Balance Changes                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                              │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: -10319880                                                                              │
│  └──                                                                                              │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯

```

The result includes an **Object changes** section with two pieces of information you need for upgrading, an `UpgradeCap` ID and your package ID.

You can identify the different objects using the `Object.objectType` value in the response. The `UpgradeCap` entry has a value of `String("0x2::package::UpgradeCap")` and the `objectType` for the package reads `String("<PACKAGE-ID>::sui_package::<MODULE-NAME>")`

- Automated Addresses
- Manual Addresses

info

Beginning with the Sui `v1.29.0` release, published addresses are automatically managed in the `Move.lock` file and you do not need to take further action.

If the package was published or upgraded with a Sui version prior to `v1.29.0`, you can follow [the guide for adopting automated address management](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#adopting-automated-address-management-for-published-packages). Alternatively, refer to the `Manual Addresses` tab above for further steps.

After a while, you decide to upgrade your `sui_package` to include some requested features.

Run `sui client upgrade` command to upgrade your package. Pass the `UpgradeCap` ID (the `<UPGRADE-CAP-ID>` value from the example) to the `--upgrade-capability` flag.

```codeBlockLines_p187
$ sui client upgrade --upgrade-capability <UPGRADE-CAP-ID>

```

The console alerts you if the new package doesn't satisfy [requirements](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#requirements), otherwise the compiler publishes the upgraded package to the network and returns its result:

```codeBlockLines_p187
Transaction Digest: 3NnJGryz2k2BJzjpndDVqVcdZmmefNMB8SJ9bCEQct22
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Data                                                                                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sender: PUBLISHER-ID                                                                                                                                         │
│ Gas Owner: PUBLISHER-ID                                                                                                                                      │
│ Gas Budget: 9684740 MIST                                                                                                                                     │
│ Gas Price: 1000 MIST                                                                                                                                         │
│ Gas Payment:                                                                                                                                                 │
│  ┌──                                                                                                                                                         │
│  │ ID: GAS-COIN-ID                                                                                                                                           │
│  │ Version: 3                                                                                                                                                │
│  │ Digest: D2rpccs7eSw8gtb4T1K2bSVzF5eApC68xiHDtNGQEcEb                                                                                                      │
│  └──                                                                                                                                                         │
│                                                                                                                                                              │
│ Transaction Kind: Programmable                                                                                                                               │
│ ╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Input Objects                                                                                                                                            │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 0   Imm/Owned Object ID: UPGRAD-CAP-ID                                                                                                                   │ │
│ │ 1   Pure Arg: Type: u8, Value: 0                                                                                                                         │ │
│ │ 2   Pure Arg: Type: vector<u8>, Value: [49,208,61,255,107,134,136,221,231,35,60,2,248,17,234,236,64,76,71,188,57,104,46,113,67,94,232,236,64,59,144,112] │ │
│ ╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯ │
│ ╭───────────────────────────────────────────────────────────────────────────────────────────╮                                                                │
│ │ Commands                                                                                  │                                                                │
│ ├───────────────────────────────────────────────────────────────────────────────────────────┤                                                                │
│ │ 0  MoveCall:                                                                              │                                                                │
│ │  ┌                                                                                        │                                                                │
│ │  │ Function:  authorize_upgrade                                                           │                                                                │
│ │  │ Module:    package                                                                     │                                                                │
│ │  │ Package:   0x0000000000000000000000000000000000000000000000000000000000000002          │                                                                │
│ │  │ Arguments:                                                                             │                                                                │
│ │  │   Input  0                                                                             │                                                                │
│ │  │   Input  1                                                                             │                                                                │
│ │  │   Input  2                                                                             │                                                                │
│ │  └                                                                                        │                                                                │
│ │                                                                                           │                                                                │
│ │ 1  Upgrade:                                                                               │                                                                │
│ │  ┌                                                                                        │                                                                │
│ │  │ Dependencies:                                                                          │                                                                │
│ │  │   0x0000000000000000000000000000000000000000000000000000000000000001                   │                                                                │
│ │  │   0x0000000000000000000000000000000000000000000000000000000000000002                   │                                                                │
│ │  │ Current Package ID: ORIGINAL-PACKAGE-ID                                                │                                                                │
│ │  │ Ticket: Result 0                                                                       │                                                                │
│ │  └                                                                                        │                                                                │
│ │                                                                                           │                                                                │
│ │ 2  MoveCall:                                                                              │                                                                │
│ │  ┌                                                                                        │                                                                │
│ │  │ Function:  commit_upgrade                                                              │                                                                │
│ │  │ Module:    package                                                                     │                                                                │
│ │  │ Package:   0x0000000000000000000000000000000000000000000000000000000000000002          │                                                                │
│ │  │ Arguments:                                                                             │                                                                │
│ │  │   Input  0                                                                             │                                                                │
│ │  │   Result 1                                                                             │                                                                │
│ │  └                                                                                        │                                                                │
│ ╰───────────────────────────────────────────────────────────────────────────────────────────╯                                                                │
│                                                                                                                                                              │
│ Signatures:                                                                                                                                                  │
│    nNJ8AiSAeV+NB3ayRTwcfaJHx3AzFHlZysbwda5e2jFBz5W9Z5EnzXV09xZMQYctUtW33jWpUFdK8hOJ9hZzDg==                                                                  │
│                                                                                                                                                              │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Digest: 3NnJGryz2k2BJzjpndDVqVcdZmmefNMB8SJ9bCEQct22                                              │
│ Status: Success                                                                                   │
│ Executed Epoch: 1                                                                                 │
│                                                                                                   │
│ Created Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0x5d49966433ebb423f5b40bfcd0ecfdc67f1527e3b9e3a433c4ec87ae63d54ed4                         │
│  │ Owner: Immutable                                                                               │
│  │ Version: 2                                                                                     │
│  │ Digest: 6GmLYmCszFxbaLRLTyZdxTTfXG99iq8uVabfi2NaB5fQ                                           │
│  └──                                                                                              │
│ Mutated Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: GAS-COIN-ID                                                                                │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 4                                                                                     │
│  │ Digest: G5PBJjLKJWL2J3rb8ZR4uLNgFPpyJNNXfXNoh3FDo1zK                                           │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ ID: 0x562408a381f3f2fce9c5ea27da42953e001760aa35dbadb273dca24166657516                         │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 4                                                                                     │
│  │ Digest: 6B4pA1EcYek2pvrRoBv9jKhPmUGxhH1zZD3UcqPmxwDM                                           │
│  └──                                                                                              │
│ Gas Object:                                                                                       │
│  ┌──                                                                                              │
│  │ ID: GAS-COIN-ID                                                                                │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ Version: 4                                                                                     │
│  │ Digest: G5PBJjLKJWL2J3rb8ZR4uLNgFPpyJNNXfXNoh3FDo1zK                                           │
│  └──                                                                                              │
│ Gas Cost Summary:                                                                                 │
│    Storage Cost: 9302400 MIST                                                                     │
│    Computation Cost: 1000000 MIST                                                                 │
│    Storage Rebate: 2595780 MIST                                                                   │
│    Non-refundable Storage Fee: 26220 MIST                                                         │
│                                                                                                   │
│ Transaction Dependencies:                                                                         │
│    7MdLdLYBhP6LKGf6gvuona2EQJZ1W7k3kRisrapmzQ5m                                                   │
│    8etH8jq78aKDHwL9ZnmAMhra62Q9vcPfyAcKJyXNPWvi                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────╮
│ No transaction block events │
╰─────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mutated Objects:                                                                                 │
│  ┌──                                                                                             │
│  │ ObjectID: GAS-COIN-ID                                                                         │
│  │ Sender: PUBLISHER-ID                                                                          │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                       │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                    │
│  │ Version: 4                                                                                    │
│  │ Digest: G5PBJjLKJWL2J3rb8ZR4uLNgFPpyJNNXfXNoh3FDo1zK                                          │
│  └──                                                                                             │
│  ┌──                                                                                             │
│  │ ObjectID: 0x562408a381f3f2fce9c5ea27da42953e001760aa35dbadb273dca24166657516                  │
│  │ Sender: PUBLISHER-ID                                                                          │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                       │
│  │ ObjectType: 0x2::package::UpgradeCap                                                          │
│  │ Version: 4                                                                                    │
│  │ Digest: 6B4pA1EcYek2pvrRoBv9jKhPmUGxhH1zZD3UcqPmxwDM                                          │
│  └──                                                                                             │
│ Published Objects:                                                                               │
│  ┌──                                                                                             │
│  │ PackageID: 0x5d49966433ebb423f5b40bfcd0ecfdc67f1527e3b9e3a433c4ec87ae63d54ed4                 │
│  │ Version: 2                                                                                    │
│  │ Digest: 6GmLYmCszFxbaLRLTyZdxTTfXG99iq8uVabfi2NaB5fQ                                          │
│  │ Modules: example                                                                              │
│  └──                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Balance Changes                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                              │
│  │ Owner: Account Address ( PUBLISHER-ID )                                                        │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: -7706620                                                                               │
│  └──                                                                                              │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯

```

The result provides a new ID for the upgraded package.

- Automated Addresses
- Manual Addresses

info

Beginning with the Sui `v1.29.0` release, upgraded addresses are automatically managed in the `Move.lock` file and you do not need to take further action.

If the package was published or upgraded with a Sui version prior to `v1.29.0`, you may follow [the guide for adopting automated address management](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#adopting-automated-address-management-for-published-packages). Alternatively, refer to the `Manual Addresses` tab above for further steps.

- [Upgrade considerations](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#upgrade-considerations)
  - [Versioned shared objects](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#versioned-shared-objects)
  - [Extensions](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#extensions)
- [Upgrade requirements](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#upgrade-requirements)
- [Upgrading](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#upgrading)
- [Example](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#example)