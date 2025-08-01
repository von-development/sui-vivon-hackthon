# https://docs.sui.io/concepts/transfers/transfer-to-object

[Skip to main content](https://docs.sui.io/concepts/transfers/transfer-to-object#__docusaurus_skipToContent_fallback)

On this page

You can transfer objects to an object ID in the same way you transfer objects to an address, using the same functions. This is because Sui does not distinguish between the 32-byte ID of an address and the 32-byte ID of an object (which are guaranteed not to overlap). The transfer to object operation takes advantage of this feature, allowing you to provide an object ID as the address input of a transfer operation.

Because of the identical ID structure, you can use an object ID for the address field when transferring an object. In fact, all functionality around address-owned objects works the same for objects owned by other objects, you just replace the address with the object ID.

When you transfer an object to another object, you're basically establishing a form of parent-child authentication relationship. Objects that you have transferred to another object can be received by the (possibly transitive) owner of the parent object. The module that defines the type of the parent (receiving) object also defines the access control for receiving a child object.

These restrictions for accessing sent child objects are enforced dynamically by providing mutable access to the parent object's `UID` during the execution of the transaction. Because of this, you can transfer objects to and receive them from owned objects, dynamic field objects, wrapped objects, and shared objects.

One of the benefits of the transfer to object operation is the ability to have a stable ID for an on-chain wallet or account, for example. The transfer of the object doesn't affect its ID, regardless of the state of the object that you send it to. When you transfer an object, all of that object's child objects move with it, and the object's address remains the same whether you transfer it, wrap it, or hold it as a dynamic field.

## Transferring to object [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#transferring-to-object "Direct link to Transferring to object")

Just like with normal object transfers, you must make sure that the object ID exists that you are transferring the object to. Additionally, make sure that the object that you are transferring to is not immutable. You can't access an object transferred to an immutable object.

Be aware of both the type of the object you are transferring to and the object that is being transferred. The object that is transferred to (parent) can _always_:

- Define predicates that can be dynamically checked to access the sent object.
- Lack support for accessing objects that have been sent to it. Future versions of that package might support this functionality, but it's up to the package author to include it.

If the object being transferred has the `key` ability only, then:

- The module that defines the object that is being transferred must implement a custom receive function for it, similar to custom transfer functions. Just as with custom transfer functions, a custom receivership function might have arbitrary restrictions they can enforce and that you should be aware of, or they may not exist.
- After sending, you can't access or use the object unless the parent object's (object being sent to) module has defined a function to receive objects _and_ the child object's (object you're sending) module has defined a function to receive the object, and the restrictions that _both_ functions define are met.

```codeBlockLines_p187
// 0xADD is an address
// 0x0B is an object ID
// b and c are objects

// Transfers the object `b` to the address 0xADD
transfer::public_transfer(b, @0xADD);

// Transfers the object `c` to the object with object ID 0x0B
transfer::public_transfer(c, @0x0B);

```

Transferring an object to an object ID results in the same result as if you transferred the object to an address - the object's owner is the 32-byte address or object ID provided. Additionally, because there is no difference in the result of the object transfer, you can use existing RPC methods such as `getOwnedObjects` on the 32-byte ID. If the ID represents an address, then the method returns the objects owned by that address. If the ID is an object ID, then the method returns the objects the object ID owns (transferred objects).

```codeBlockLines_p187
// Get the objects owned by the address 0xADD. Returns `b`.
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "suix_getOwnedObjects",
  "params": [\
    "0xADD"\
  ]
}

// Get the objects owned by the object with object ID 0x0B. Returns `c`
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "suix_getOwnedObjects",
  "params": [\
    "0x0B"\
  ]
}

```

## Receiving objects [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#receiving-objects "Direct link to Receiving objects")

After an object `c` has been sent to another object `p`, `p` must then receive `c` to do anything with it. To receive the object `c`, a `Receiving(o: ObjectRef)` argument type for programmable transaction blocks (PTBs) is used that takes an object reference containing the to-be-received object's `ObjectID`, `Version`, and `Digest` (just as owned object arguments for PTBs do). However, `Receiving` PTB arguments are not passed as an owned value or mutable reference within the transaction.

To explain further, look at the core of the receiving interface in Move, which is defined in the `transfer` module in the Sui framework:

```codeBlockLines_p187
module sui::transfer;

/// Represents the ability to receive an object of type `T`. Cannot be stored.
public struct Receiving<phantom T: key> has drop { ... }

/// Given mutable (i.e., locked) access to the `parent` and a `Receiving`
/// object referencing an object owned by `parent` use the `Receiving` ticket
/// and return the corresponding object.
///
/// This function has custom rules that the Sui Move bytecode verifier enforces to ensure
/// that `T` is an object defined in the module where `receive` is invoked. Use
/// `public_receive` to receive an object with `store` outside of its defining module.
///
/// NB: &mut UID here allows the defining module of the parent type to
/// define custom access/permission policies around receiving objects sent
/// to objects of a type that it defines. You can see this more in the examples.
public native fun receive<T: key>(parent: &mut UID, object: Receiving<T>): T;

/// Given mutable (locked) access to the `parent` and a `Receiving` argument
/// referencing an object of type `T` owned by `parent` use the `object`
/// argument to receive and return the referenced owned object of type `T`.
/// The object `T` must have `store` to be received by this function, and
/// this can be called outside of the module that defines `T`.
public native fun public_receive<T: key + store>(parent: &mut UID, object: Receiving<T>): T;

...

```

Each Receiving argument referring to a sent object of type `T` in a PTB results in exactly one argument with a Move type of `sui::transfer::Receiving<T>`. You can then use this argument to receive the sent object of type `T` with the `transfer::receive` function.

When you call the `transfer::receive` function, you must pass a mutable reference to the parent object's `UID`. You can't get a mutable reference to the `UID` of an object, though, unless the defining module of the object exposes it. Consequently, the module that defines the type of the parent object that is receiving the child object defines access control policies and other restrictions on receiving objects that are sent to it. See the [authorization example](https://docs.sui.io/concepts/transfers/transfer-to-object#receive-shared-example) for a demonstration of this pattern. The fact that the passed-in `UID` actually owns the object referenced by the `Receiving` parameter is dynamically checked and enforced. This allows access to objects that have been sent to, for example, dynamic fields where the ownership chain can only be established dynamically.

Because `sui::transfer::Receiving` has only the `drop` ability, the existence of a `Receiving<T>` argument represents the ability, but not the obligation to receive the object of type `T` specified by the object reference in the PTB `Receiving` argument during that transaction. You can use some, none, or all `Receiving` arguments in a PTB without issue. Any object that corresponds to a `Receiving` argument remains untouched (in particular, its object reference remain the same) unless it is received.

## Custom receiving rules [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#custom-receiving-rules "Direct link to Custom receiving rules")

Just like with [custom transfer policies](https://docs.sui.io/concepts/transfers/custom-rules), Sui allows for the definition of custom receivership rules for `key`-only objects. In particular, you can use the `transfer::receive` function only on objects defined in the same module as the call to `transfer::receive`--just like you can use the `transfer::transfer` function only on objects defined in the module where it's being used.

Similarly for objects that also have the `store` ability, anyone can use the `transfer::public_receive` function to receive them--just like `transfer::public_transfer` can transfer any objects that have the `store` ability on them.

This coupled with the fact that the parent object can always define custom rules around receivership means that you must consider the following matrix of permissions around receiving objects and the abilities of the object being sent based on the child object's abilities:

| Child abilities | Parent can restrict access | Child can restrict access |
| --- | --- | --- |
| `key` | Yes | Yes |
| `key` \+ `store` | Yes | No |

Just like with custom transfer policies, you can use and couple these restrictions to create powerful expressions. For example, you can implement [soul-bound objects](https://docs.sui.io/concepts/transfers/transfer-to-object#soul-bound-example) using both custom transfer and receivership rules.

## Using SDKs [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#using-sdks "Direct link to Using SDKs")

When creating transactions, you interact with `Receiving` transaction inputs almost exactly as you would with other object arguments in the Sui TypeScript SDK. For example, if in the [Simple Account](https://docs.sui.io/concepts/transfers/transfer-to-object#simple-account) example that follows you want to send a transaction that receives a coin object with ID `0xc0ffee` that was sent to your account at `0xcafe`, you can do the following using either the Sui TypeScript SDK or Sui Rust SDK:

- TypeScript
- Rust

```codeBlockLines_p187
... // Setup Typescript SDK as normal.
const tx = new Transaction();
tx.moveCall({
  target: `${examplePackageId}::account::accept_payment`,
  arguments: [tx.object("0xcafe"), tx.object("0xc0ffee")]
});
const result = await client.signAndExecuteTransaction({
      transaction: tx,
  });
...

```

Additionally, just as with object arguments that also have an `ObjectRef` constructor where you can provide an explicit object ID, version, and digest, there is also a `ReceivingRef` constructor that takes the same arguments corresponding to a receiving argument.

## Examples [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#examples "Direct link to Examples")

The following examples demonstrate receiving previously sent objects.

### Receiving objects from shared objects [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#receive-shared-example "Direct link to Receiving objects from shared objects")

Generally, if you want to allow receiving sent objects from shared objects that are defined in the module, add dynamic authorization checks; otherwise, anyone could receive sent objects. In this example, a shared object ( `SharedObject`) holds a counter that anyone can increment, but only the address `0xB0B` can receive objects from the shared object.

Because the `receive_object` function is generic over the object being received, it can only receive objects that are both `key` and `store`. `receive_object` must also use the `transfer::public_receive` function to receive the object and not `transfer::receive` because you can only use `receive` on objects defined in the current module.

```codeBlockLines_p187
module examples::shared_object_auth;

use transfer::Receiving;

const EAccessDenied: u64 = 0;
const AuthorizedReceiverAddr: address = @0xB0B;

public struct SharedObject has key {
    id: UID,
    counter: u64,
}

public fun create(ctx: &mut TxContext) {
    let s = SharedObject {
        id: object::new(ctx),
        counter: 0,
    };
    transfer::share_object(s);
}

/// Anyone can increment the counter in the shared object.
public fun increment(obj: &mut SharedObject) {
    obj.counter = obj.counter + 1;
}

/// Objects can only be received from the `SharedObject` by the
/// `AuthorizedReceiverAddr` otherwise the transaction aborts.
public fun receive_object<T: key + store>(
    obj: &mut SharedObject,
    sent: Receiving<T>,
    ctx: &TxContext
): T {
    assert!(ctx.sender() == AuthorizedReceiverAddr, EAccessDenied);
    transfer::public_receive(&mut obj.id, sent)
}

```

### Receiving objects and adding them as dynamic fields [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#simple-account "Direct link to Receiving objects and adding them as dynamic fields")

This example defines a basic account-type model where an `Account` object holds its coin balances in different dynamic fields. This `Account` is also transferable to a different address or object.

Importantly, the address that coins are to be sent with this `Account` object remains the same regardless of whether the `Account` object is transferred, wrapped (for example, in an escrow account), or moved into a dynamic field. In particular, there is a stable ID for a given `Account` object across the object's lifecycle, regardless of any ownership changes.

```codeBlockLines_p187
module examples::account;

use sui::dynamic_field as df;
use sui::coin::{Self, Coin};
use transfer::Receiving;

const EBalanceDONE: u64 = 1;

/// Account object that `Coin`s can be sent to. Balances of different types
/// are held as dynamic fields indexed by the `Coin` type's `type_name`.
public struct Account has key {
    id: UID,
}

/// Dynamic field key representing a balance of a particular coin type.
public struct AccountBalance<phantom T> has copy, drop, store { }

/// This function will receive a coin sent to the `Account` object and then
/// join it to the balance for each coin type.
/// Dynamic fields are used to index the balances by their coin type.
public fun accept_payment<T>(account: &mut Account, sent: Receiving<Coin<T>>) {
    // Receive the coin that was sent to the `account` object
    // Since `Coin` is not defined in this module, and since it has the `store`
    // ability we receive the coin object using the `transfer::public_receive` function.
    let coin = transfer::public_receive(&mut account.id, sent);
    let account_balance_type = AccountBalance<T>{};
    let account_uid = &mut account.id;

    // Check if a balance of that coin type already exists.
    // If it does then merge the coin we just received into it,
    // otherwise create new balance.
    if (df::exists_(account_uid, account_balance_type)) {
        let balance: &mut Coin<T> = df::borrow_mut(account_uid, account_balance_type);
        balance.join(coin);
    } else {
        df::add(account_uid, account_balance_type, coin);
    }
}

/// Withdraw `amount` of coins of type `T` from `account`.
public fun withdraw<T>(account: &mut Account, amount: u64, ctx: &mut TxContext): Coin<T> {
    let account_balance_type = AccountBalance<T>{};
    let account_uid = &mut account.id;
    // Make sure what we are withdrawing exists
    assert!(df::exists_(account_uid, account_balance_type), EBalanceDONE);
    let balance: &mut Coin<T> = df::borrow_mut(account_uid, account_balance_type);
    balance.split(amount, ctx)
}

/// Can transfer this account to a different address
/// (e.g., to an object or address).
public fun transfer_account(account: Account, to: address, _ctx: &mut TxContext) {
    // Perform some authorization checks here and if they pass then transfer the account
    // ...
    transfer::transfer(account, to);
}

```

### Soul-bound objects [​](https://docs.sui.io/concepts/transfers/transfer-to-object\#soul-bound-example "Direct link to Soul-bound objects")

The ability to control the rules about how and when an object can be received, and how and when it can be transferred allows us to define a type of "soul-bound" object that can be used by value in a transaction, but it must always stay in the same place, or be returned to the same object.

You can implement a simple version of this with the following module where the `get_object` function receives the soul-bound object and creates a receipt that must be destroyed in the transaction in order for it to execute successfully. However, in order to destroy the receipt, the object that was received must be transferred back to the object it was received from in the transaction using the `return_object` function.

```codeBlockLines_p187
module examples::soul_bound;

use transfer::{Self, Receiving};

/// Tried to return the wrong object.
const EWrongObject: u64 = 0;

/// This object has `key` only  -- if this had `store` we would not be
/// able to ensure it is bound to whatever address we sent it to
public struct SoulBound has key {
    id: UID,
}

/// A non-store, non-drop, non-copy struct. When you receive a `SoulBound`
/// object, we'll also give you one of these. In order to successfully
/// execute the transaction you need to destroy this `ReturnReceipt` and
/// the only way to do that is to transfer it back to the same object you
/// received it from in the transaction using the `return_object` function.
public struct ReturnReceipt {
    /// The object ID of the object that needs to be returned.
    /// This field is required to prevent swapping of soul bound objects if
    /// multiple are present in the same transaction.
    object_id: ID,
    /// The address (object ID) it needs to be returned to.
    return_to: address,
}

/// Takes the object UID that owns the `SoulBound` object and a `SoulBound`
/// receiving ticket. It then receives the `SoulBound` object and returns a
/// `ReturnReceipt` that must be destroyed in the transaction by calling `return_object`.
public fun get_object(parent: &mut UID, soul_bound_ticket: Receiving<SoulBound>): (SoulBound, ReturnReceipt) {
    let soul_bound = transfer::receive(parent, soul_bound_ticket);
    let return_receipt = ReturnReceipt {
        return_to: parent.to_address(),
        object_id: object::id(&soul_bound),
    };
    (soul_bound, return_receipt)
}

/// Given a `SoulBound` object and a return receipt returns it to the
/// object it was received from. Verifies that the `receipt`
/// is for the given `soul_bound` object before returning it.
public fun return_object(soul_bound: SoulBound, receipt: ReturnReceipt) {
    let ReturnReceipt { return_to, object_id }  = receipt;
    assert!(object::id(&soul_bound) == object_id, EWrongObject);
    transfer::transfer(soul_bound, return_to);
}

```

- [Transferring to object](https://docs.sui.io/concepts/transfers/transfer-to-object#transferring-to-object)
- [Receiving objects](https://docs.sui.io/concepts/transfers/transfer-to-object#receiving-objects)
- [Custom receiving rules](https://docs.sui.io/concepts/transfers/transfer-to-object#custom-receiving-rules)
- [Using SDKs](https://docs.sui.io/concepts/transfers/transfer-to-object#using-sdks)
- [Examples](https://docs.sui.io/concepts/transfers/transfer-to-object#examples)
  - [Receiving objects from shared objects](https://docs.sui.io/concepts/transfers/transfer-to-object#receive-shared-example)
  - [Receiving objects and adding them as dynamic fields](https://docs.sui.io/concepts/transfers/transfer-to-object#simple-account)
  - [Soul-bound objects](https://docs.sui.io/concepts/transfers/transfer-to-object#soul-bound-example)