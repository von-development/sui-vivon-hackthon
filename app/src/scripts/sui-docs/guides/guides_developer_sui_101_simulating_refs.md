# https://docs.sui.io/guides/developer/sui-101/simulating-refs

[Skip to main content](https://docs.sui.io/guides/developer/sui-101/simulating-refs#__docusaurus_skipToContent_fallback)

On this page

Everything on the Sui blockchain is an object. When you develop Move packages for the Sui network, you're typically manipulating or using on-chain objects in some way through functionality available in the Sui API. For most API functions, you provide an object by reference.

References are a key construct when programming in Move and on Sui. Most of the functionality available in the Sui API takes objects by reference.

There are two ways to use an object:

- **by value:** When you use an object by value, you have full control over that object. You can destroy it (if the functionality is available), wrap it (if it has the `store` ability), or transfer it to an address.
- **by reference:** When you use an object by reference, operations over that object are determined by the logic the module that defines the object provides because you are using a reference to its data rather than having ownership of the object itself. The restrictions of references allow you to develop smart contracts with a high level of security and safety around assets. There are two types of references:
  - Mutable reference ( `&mut`): You can alter the object (according to the API) but you can't destroy or transfer it.
  - Immutable reference ( `&`): Further restricts the set of operations and the guarantees/invariants over the referenced object. You have read-only access to the object's data.

Programmable transaction blocks (PTBs) do not currently allow the use of object references returned from one of its transaction commands. You can use input objects to the PTB, objects created by the PTB (like `MakeMoveVec`), or returned from a transaction command by value as references in subsequent transaction commands. If a transaction command returns a reference, however, you can't use that reference in any call, significantly limiting certain common patterns in Move.

## The borrow module [​](https://docs.sui.io/guides/developer/sui-101/simulating-refs\#the-borrow-module "Direct link to The borrow module")

The Sui framework includes a [borrow](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui/borrow.md) module that offers a solution to the reference problem. The module provides access to an object by value but builds a model that makes it impossible to destroy, transfer, or wrap the object retrieved. The borrow module exposes a `Referent` object that wraps another object (the object you want to reference). The module uses the hot potato pattern (via a `Borrow` instance) to allow retrieval of the wrapped object by value. Within the same PTB, the module then forces the object to be returned to the `Referent`. The `Borrow` instance guarantees that the object returned is the same that was retrieved.

As an example, consider the following module stub that exposes an object ( `Asset`) and a function ( `use_asset`) to use that object.

```codeBlockLines_p187
module a_module {
    struct Asset has key, store {
        … // some data
    }

    public fun use_asset(asset: &Asset) {
        …. // some code
    }
}

```

The function `use_asset` takes an immutable reference to the asset ( `&Asset`), which is a common pattern in an API definition.

Now consider another module that uses this asset.

```codeBlockLines_p187
module another_module {
    struct AssetManager has key {
        asset: Asset,
    }

    public fun get_asset(manager: &AssetManager): &Asset {
        &manager.asset
    }
}

```

This module creates an object ( `AssetManager`) that references the object ( `Asset`) created in the previous module ( `a_module`).

You could then write a Move function that retrieves an object by reference and passes it to the `use_asset` function.

```codeBlockLines_p187
fun do_something(manager: &AssetManager) {
    let asset = another_module::get_asset(manager);
    a_module::use_asset(asset);
}

```

The two functions in `do_something` are not valid within a PTB, however, because PTBs do not support a reference returned by a function and passed to another function.

To make this operation valid within a PTB, you would need to include functionality from the borrow module. Consequently, you could change the `another_module` code to the following:

```codeBlockLines_p187
module another_module {
    struct AssetManager has key {
        asset: Referent<Asset>,
    }

    public fun get_asset(manager: &mut AssetManager): (Asset, Borrow) {
        borrow::borrow(&mut manager.asset)
    }

    public fun return_asset(
        manager: &mut AssetManager,
        asset: Asset,
        b: Borrow) {
            borrow::put_back(&mut manager.asset, asset, b)
    }
}

```

Now the PTB can retrieve the asset, use it in a call to `use_asset`, and return the asset.

## Considerations [​](https://docs.sui.io/guides/developer/sui-101/simulating-refs\#considerations "Direct link to Considerations")

The `Borrow` object is the key to the guarantees the borrow module offers. The definition of `Borrow` is
`struct Borrow { ref: address, obj: ID }`
which makes it such that you cannot drop or save its instance anywhere, so it must be consumed in the same transaction that retrieves it (hot potato). Moreover, fields in the `Borrow` struct make sure that the object returned is for the same `Referent` and the object that was originally held by the `Referent` instance. In other words, there is no way to either keep the object retrieved or to swap it with another object in a different `Referent`.

caution

Using a `Referent` is a very explicit and intrusive change. That has to be taken into consideration when designing a solution.

Support for references in a PTB is planned, which is a much more natural and proper pattern for APIs.

You must consider the implications of using the borrow module and whether you have a mechanism to later move to a more natural, reference pattern.

Finally, the `Referent` model forces the usage of a mutable reference and returns an object by value. Both have significant implications when designing an API. You must be careful in what logic your modules provide and how objects are exposed.

## Example [​](https://docs.sui.io/guides/developer/sui-101/simulating-refs\#example "Direct link to Example")

Extending the previous example, a PTB that calls `use_asset` is written as follows:

```codeBlockLines_p187
// initialize the PTB
const txb = new TransactionBlock();
// load the assetManager
const assetManager = txb.object(assetManagerId);
// retrieve the asset
const [asset, borrow] = txb.moveCall({
    target: "0xaddr1::another_module::get_asset",
    arguments: [ assetManager ],
});
// use the asset
txb.moveCall({
    target: "0xaddr2::a_module::use_asset",
    arguments: [ asset ],
});
// return the asset
txb.moveCall({
    target: "0xaddr1::another_module::return_asset",
    arguments: [ assetManager, asset, borrow ],
});
...

```

- [The borrow module](https://docs.sui.io/guides/developer/sui-101/simulating-refs#the-borrow-module)
- [Considerations](https://docs.sui.io/guides/developer/sui-101/simulating-refs#considerations)
- [Example](https://docs.sui.io/guides/developer/sui-101/simulating-refs#example)