# https://docs.sui.io/concepts/dynamic-fields/tables-bags

[Skip to main content](https://docs.sui.io/concepts/dynamic-fields/tables-bags#__docusaurus_skipToContent_fallback)

On this page

You can extend existing objects using [dynamic fields](https://docs.sui.io/concepts/dynamic-fields). Note that it's possible to delete an object that still has (potentially non-drop) dynamic fields. This might not be a concern when adding a small number of statically known additional fields to an object, but is particularly undesirable for on-chain collection types that could be holding unboundedly many key-value pairs as dynamic fields.

This topic describes two such collections -- Table and Bag -- built using dynamic fields, but with additional support to count the number of entries they contain, and protect against accidental deletion when non-empty.

The types and function discussed in this section are built into the Sui framework in modules [`table`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/table.move) and [`bag`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/bag.move). As with dynamic fields, there is also an `object_` variant of both: `ObjectTable` in [`object_table`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/object_table.move) and `ObjectBag` in [`object_bag`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/object_bag.move). The relationship between `Table` and `ObjectTable`, and `Bag` and `ObjectBag` is the same as between a field and an object field: The former can hold any `store` type as a value, but objects stored as values are hidden when viewed from external storage. The latter can only store objects as values, but keeps those objects visible at their ID in external storage.

## Tables [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#tables "Direct link to Tables")

```codeBlockLines_p187
module sui::table;

public struct Table<K: copy + drop + store, V: store> has key, store { /* ... */ }

public fun new<K: copy + drop + store, V: store>(
    ctx: &mut TxContext,
): Table<K, V>;

```

`Table<K, V>` is a _homogeneous_ map, meaning that all its keys have the same type as each other ( `K`), and all its values have the same type as each other as well ( `V`). It is created with `sui::table::new`, which requires access to a `&mut TxContext` because `Table` s are objects themselves, which can be transferred, shared, wrapped, or unwrapped, just like any other object.

See `sui::object_table::ObjectTable` for the object-preserving version of `Table`.

## Bags [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#bags "Direct link to Bags")

```codeBlockLines_p187
module sui::bag;

public struct Bag has key, store { /* ... */ }

public fun new(ctx: &mut TxContext): Bag;

```

`Bag` is a _heterogeneous_ map, so it can hold key-value pairs of arbitrary types (they don't need to match each other). Note that the `Bag` type does not have any type parameters for this reason. Like `Table`, `Bag` is also an object, so creating one with `sui::bag::new` requires supplying a `&mut TxContext` to generate an ID.

See `sui::bag::ObjectBag` for the object-preserving version of `Bag`.

* * *

The following sections explain the collection APIs. They use `sui::table` as the basis for code examples, with explanations where other modules differ.

## Interacting with collections [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#interacting-with-collections "Direct link to Interacting with collections")

All collection types come with the following functions, defined in their respective modules:

```codeBlockLines_p187
module sui::table;

public fun add<K: copy + drop + store, V: store>(
    table: &mut Table<K, V>,
    k: K,
    v: V,
);

public fun borrow<K: copy + drop + store, V: store>(
    table: &Table<K, V>,
    k: K
): &V;

public fun borrow_mut<K: copy + drop + store, V: store>(
    table: &mut Table<K, V>,
    k: K
): &mut V;

public fun remove<K: copy + drop + store, V: store>(
    table: &mut Table<K, V>,
    k: K,
): V;

```

These functions add, read, write, and remove entries from the collection, respectively, and all accept keys by value. `Table` has type parameters for `K` and `V` so it is not possible to call these functions with different instantiations of `K` and `V` on the same instance of `Table`, however `Bag` does not have these type parameters, and so does permit calls with different instantiations on the same instance.

info

Like with dynamic fields, it is an error to attempt to overwrite an existing key, or access or remove a non-existent key.

The extra flexibility of `Bag`'s heterogeneity means the type system doesn't statically prevent attempts to add a value with one type, and then borrow or remove it at another type. This pattern fails at runtime, similar to the behavior for dynamic fields.

## Querying length [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#querying-length "Direct link to Querying length")

It is possible to query all collection types for their length and check whether they are empty using the following family of functions:

```codeBlockLines_p187
module sui::table;

public fun length<K: copy + drop + store, V: store>(
    table: &Table<K, V>,
): u64;

public fun is_empty<K: copy + drop + store, V: store>(
    table: &Table<K, V>
): bool;

```

`Bag` has these functions, but they are not generic on `K` and `V` because `Bag` does not have these type parameters.

## Querying for containment [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#querying-for-containment "Direct link to Querying for containment")

Tables can be queried for key containment with:

```codeBlockLines_p187
module sui::table;

public fun contains<K: copy + drop + store, V: store>(
    table: &Table<K, V>
    k: K
): bool;

```

The equivalent functions for `Bag` are:

```codeBlockLines_p187
module sui::bag;

public fun contains<K: copy + drop + store>(bag: &Bag, k: K): bool;

public fun contains_with_type<K: copy + drop + store, V: store>(
    bag: &Bag,
    k: K
): bool;

```

The first function tests whether `bag` contains a key-value pair with key `k: K`, and the second function additionally tests whether its value has type `V`.

## Clean-up [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#clean-up "Direct link to Clean-up")

Collection types protect against accidental deletion when they might not be empty. This protection comes from the fact that they do not have `drop`, so must be explicitly deleted, using this API:

```codeBlockLines_p187
module sui::table;

public fun destroy_empty<K: copy + drop + store, V: store>(
    table: Table<K, V>,
);

```

This function takes the collection by value. If it contains no entries, it is deleted, otherwise the call fails. `sui::table::Table` also has a convenience function:

```codeBlockLines_p187
module sui::table;

public fun drop<K: copy + drop + store, V: drop + store>(
    table: Table<K, V>,
);

```

You can call the convenience function only for tables where the value type also has `drop` ability, which allows it to delete tables whether they are empty or not.

Note that `drop` is not called implicitly on eligible tables before they go out of scope. It must be called explicitly, but it is guaranteed to succeed at runtime.

`Bag` and `ObjectBag` cannot support `drop` because they could be holding a variety of types, some of which may have `drop` and some which may not.

`ObjectTable` does not support `drop` because its values must be objects, which cannot be dropped (because they must contain an `id: UID` field and `UID` does not have `drop`).

## Equality [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#equality "Direct link to Equality")

Equality on collections is based on identity, for example, an instance of a collection type is only considered equal to itself and not to all collections that hold the same entries:

```codeBlockLines_p187
use sui::table;

let t1 = table::new<u64, u64>(ctx);
let t2 = table::new<u64, u64>(ctx);

assert!(&t1 == &t1, 0);
assert!(&t1 != &t2, 1);

```

This is unlikely to be the definition of equality that you want.

## Related links [​](https://docs.sui.io/concepts/dynamic-fields/tables-bags\#related-links "Direct link to Related links")

- [Dynamic Collections](https://move-book.com/programmability/dynamic-collections.html) in The Move Book: The Move Book is a comprehensive guide to the Move programming language and the Sui blockchain. This page explores using dynamic collections, including tables and bags, in your Move development.

- [Tables](https://docs.sui.io/concepts/dynamic-fields/tables-bags#tables)
- [Bags](https://docs.sui.io/concepts/dynamic-fields/tables-bags#bags)
- [Interacting with collections](https://docs.sui.io/concepts/dynamic-fields/tables-bags#interacting-with-collections)
- [Querying length](https://docs.sui.io/concepts/dynamic-fields/tables-bags#querying-length)
- [Querying for containment](https://docs.sui.io/concepts/dynamic-fields/tables-bags#querying-for-containment)
- [Clean-up](https://docs.sui.io/concepts/dynamic-fields/tables-bags#clean-up)
- [Equality](https://docs.sui.io/concepts/dynamic-fields/tables-bags#equality)
- [Related links](https://docs.sui.io/concepts/dynamic-fields/tables-bags#related-links)