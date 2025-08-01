# https://docs.sui.io/concepts/dynamic-fields

[Skip to main content](https://docs.sui.io/concepts/dynamic-fields#__docusaurus_skipToContent_fallback)

On this page

There are various ways to use object fields to store primitive data and other objects (wrapping), but there are a few limitations to these:

1. Object's have a finite set of fields keyed by identifiers that are fixed when you publish its module (limited to the fields in the `struct` declaration).
2. An object can become very large if it wraps several other objects. Larger objects can lead to higher gas fees in transactions. In addition, there is an upper bound on object size.
3. There are use cases where you need to store a collection of objects of heterogeneous types. Because the Move `vector` type must be instantiated with one single type `<T>`, it is not suitable for this.

Fortunately, Sui provides _dynamic fields_ with arbitrary names (not just identifiers), added and removed on-the-fly (not fixed at publish), which only affect gas when they are accessed, and can store heterogeneous values. Use the libraries in this topic to interact with this kind of field.

## Fields versus object fields [​](https://docs.sui.io/concepts/dynamic-fields\#fields-versus-object-fields "Direct link to Fields versus object fields")

There are two flavors of dynamic field -- "fields" and "object fields" -- which differ based on how you store their values:

| Type | Description | Module |
| --- | --- | --- |
| Fields | Can store any value that has `store`, however an object stored in this kind of field is considered wrapped and is not accessible via its ID by external tools (explorers, wallets, and so on) accessing storage. | [`dynamic_field`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_field.move) |
| Object field | Values must be objects (have the `key` ability, and `id: UID` as the first field), but are still accessible at their ID to external tools. | [`dynamic_object_field`](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_object_field.move) |

## Field names [​](https://docs.sui.io/concepts/dynamic-fields\#field-names "Direct link to Field names")

Unlike an object's regular fields where names must be Move identifiers, dynamic field names can be any value that has `copy`, `drop`, and `store`. This includes all Move primitives (integers, Booleans, byte strings), and structs whose contents all have `copy`, `drop`, and `store`.

## Adding dynamic fields [​](https://docs.sui.io/concepts/dynamic-fields\#adding-dynamic-fields "Direct link to Adding dynamic fields")

Use the `add` function from the relevant Sui framework module to add dynamic fields:

**Dynamic field**

[crates/sui-framework/packages/sui-framework/sources/dynamic\_field.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_field.move)

```codeBlockLines_p187
public fun add<Name: copy + drop + store, Value: store>(
    object: &mut UID,
    name: Name,
    value: Value,
) {
    let object_addr = object.to_address();
    let hash = hash_type_and_key(object_addr, name);
    assert!(!has_child_object(object_addr, hash), EFieldAlreadyExists);
    let field = Field {
        id: object::new_uid_from_hash(hash),
        name,
        value,
    };
    add_child_object(object_addr, field)
}

```

**Dynamic object field**

[crates/sui-framework/packages/sui-framework/sources/dynamic\_object\_field.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_object_field.move)

```codeBlockLines_p187
public fun add<Name: copy + drop + store, Value: key + store>(
    object: &mut UID,
    name: Name,
    value: Value,
) {
    add_impl!(object, name, value)
}

```

These functions add a field with name `name` and value `value` to `object`. To see it in action, consider these code snippets:

First, define two object types for the parent and the child:

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public struct Parent has key {
    id: UID,
}

public struct Child has key, store {
    id: UID,
    count: u64,
}

```

Next, define an API to add a `Child` object as a dynamic field of a `Parent` object:

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public fun add_child(parent: &mut Parent, child: Child) {
    ofield::add(&mut parent.id, b"child", child);
}

```

This function takes the `Child` object by value and makes it a dynamic field of `parent` with name `b"child"` (a byte string of type `vector<u8>`). This call results in the following ownership relationship:

1. Sender address (still) owns the `Parent` object.
2. The `Parent` object owns the `Child` object, and can refer to it by the name `b"child"`.

It is an error to overwrite a field (attempt to add a field with the same `<Name>` type and value as one that is already defined), and a transaction that does this fails. You can modify fields in-place by borrowing them mutably and you can overwrite them safely (such as to change its value type) by removing the old value first.

## Accessing dynamic fields [​](https://docs.sui.io/concepts/dynamic-fields\#accessing-dynamic-fields "Direct link to Accessing dynamic fields")

You can reference dynamic fields by reference using the following APIs:

[crates/sui-framework/packages/sui-framework/sources/dynamic\_field.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_field.move)

```codeBlockLines_p187
public fun borrow<Name: copy + drop + store, Value: store>(object: &UID, name: Name): &Value {
    let object_addr = object.to_address();
    let hash = hash_type_and_key(object_addr, name);
    let field = borrow_child_object<Field<Name, Value>>(object, hash);
    &field.value
}

public fun borrow_mut<Name: copy + drop + store, Value: store>(
    object: &mut UID,
    name: Name,
): &mut Value {
    let object_addr = object.to_address();
    let hash = hash_type_and_key(object_addr, name);
    let field = borrow_child_object_mut<Field<Name, Value>>(object, hash);
    &mut field.value
}

```

Where `object` is the UID of the object the field is defined on and `name` is the field's name.

info

`sui::dynamic_object_field` has equivalent functions for object fields, but with the added constraint `Value: key + store`.

To use these APIs with the `Parent` and `Child` types defined earlier:

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public fun mutate_child(child: &mut Child) {
    child.count = child.count + 1;
}

public fun mutate_child_via_parent(parent: &mut Parent) {
    mutate_child(ofield::borrow_mut(&mut parent.id, b"child"))
}

```

The first function accepts a mutable reference to the `Child` object directly, and you can call it with `Child` objects that haven't been added as fields to `Parent` objects.

The second function accepts a mutable reference to the `Parent` object and accesses its dynamic field using `borrow_mut`, to pass to `mutate_child`. This can only be called on `Parent` objects that have a `b"child"` field defined. A `Child` object that has been added to a `Parent` must be accessed via its dynamic field, so it can only be mutated using `mutate_child_via_parent`, not `mutate_child`, even if its ID is known.

tip

A transaction fails if it attempts to borrow a field that does not exist.

The `<Value>` type passed to `borrow` and `borrow_mut` must match the type of the stored field, or the transaction aborts.

You must access dynamic object field values through these APIs. A transaction that attempts to use those objects as inputs (by value or by reference), is rejected for having invalid inputs.

## Removing a dynamic field [​](https://docs.sui.io/concepts/dynamic-fields\#removing-a-dynamic-field "Direct link to Removing a dynamic field")

Similar to unwrapping an object held in a regular field, you can remove a dynamic field, exposing its value:

[crates/sui-framework/packages/sui-framework/sources/dynamic\_field.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/dynamic_field.move)

```codeBlockLines_p187
public fun remove<Name: copy + drop + store, Value: store>(object: &mut UID, name: Name): Value {
    let object_addr = object.to_address();
    let hash = hash_type_and_key(object_addr, name);
    let Field { id, name: _, value } = remove_child_object<Field<Name, Value>>(object_addr, hash);
    id.delete();
    value
}

```

This function takes a mutable reference to the ID of the `object` the field is defined on, and the field's `name`. If a field with a `value: Value` is defined on `object` at `name`, it is removed and `value` returned, otherwise it aborts. Future attempts to access this field on `object` will fail.

tip

`sui::dynamic_object_field` has an equivalent function for object fields.

The value that is returned can be interacted with just like any other value (because it is any other value). For example, removed dynamic object field values can then be `delete`-d or `transfer`-ed to an address (back to the sender):

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public fun delete_child(parent: &mut Parent) {
    let Child { id, count: _ } = reclaim_child(parent);
    object::delete(id);
}

public fun reclaim_child(parent: &mut Parent): Child {
    ofield::remove(&mut parent.id, b"child")
}

```

Similar to borrowing a field, a transaction that attempts to remove a non-existent field, or a field with a different `Value` type, fails.

## Deleting an object with dynamic fields [​](https://docs.sui.io/concepts/dynamic-fields\#deleting-an-object-with-dynamic-fields "Direct link to Deleting an object with dynamic fields")

It is possible to delete an object that has (potentially non- `drop`) dynamic fields still defined on it. Because field values can be accessed only via the dynamic field's associated object and field name, deleting an object that has dynamic fields still defined on it renders them all inaccessible to future transactions. This is true regardless of whether the field's value has the `drop` ability. This might not be a concern when adding a small number of statically known additional fields to an object, but is particularly undesirable for on-chain collection types that could be holding unboundedly many key-value pairs as dynamic fields.

Sui provides `Table` and `Bag` collections built using dynamic fields, but with additional support to count the number of entries they contain to protect against accidental deletion when non-empty. To learn more, see [Tables and Bags](https://docs.sui.io/concepts/dynamic-fields/tables-bags).

## Related links [​](https://docs.sui.io/concepts/dynamic-fields\#related-links "Direct link to Related links")

- [Dynamic fields](https://move-book.com/programmability/dynamic-fields.html) in The Move Book: The Move Book is a comprehensive guide to the Move programming language and the Sui blockchain. This page explores using dynamic fields in your Move development.
- [Dynamic Object Fields](https://move-book.com/programmability/dynamic-object-fields.html) in The Move Book: This page of The Move Book discusses using dynamic object fields in your smart contracts.

- [Fields versus object fields](https://docs.sui.io/concepts/dynamic-fields#fields-versus-object-fields)
- [Field names](https://docs.sui.io/concepts/dynamic-fields#field-names)
- [Adding dynamic fields](https://docs.sui.io/concepts/dynamic-fields#adding-dynamic-fields)
- [Accessing dynamic fields](https://docs.sui.io/concepts/dynamic-fields#accessing-dynamic-fields)
- [Removing a dynamic field](https://docs.sui.io/concepts/dynamic-fields#removing-a-dynamic-field)
- [Deleting an object with dynamic fields](https://docs.sui.io/concepts/dynamic-fields#deleting-an-object-with-dynamic-fields)
- [Related links](https://docs.sui.io/concepts/dynamic-fields#related-links)