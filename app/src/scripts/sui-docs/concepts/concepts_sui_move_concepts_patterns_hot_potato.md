# https://docs.sui.io/concepts/sui-move-concepts/patterns/hot-potato

[Skip to main content](https://move-book.com/programmability/hot-potato-pattern/#__docusaurus_skipToContent_fallback)

On this page

A case in the abilities system - a struct without any abilities - is called _hot potato_. It cannot
be stored (not as [an object](https://move-book.com/storage/key-ability) nor as
[a field in another struct](https://move-book.com/storage/store-ability)), it cannot be
[copied](https://move-book.com/move-basics/copy-ability) or [discarded](https://move-book.com/move-basics/drop-ability). Hence, once
constructed, it must be gracefully [unpacked by its module](https://move-book.com/move-basics/struct), or the
transaction will abort due to unused value without drop.

> If you're familiar with languages that support _callbacks_, you can think of a hot potato as an
> obligation to call a callback function. If you don't call it, the transaction will abort.

The name comes from the children's game where a ball is passed quickly between players, and none of
the players want to be the last one holding it when the music stops, or they are out of the game.
This is the best illustration of the pattern - the instance of a hot-potato struct is passed between
calls, and none of the modules can keep it.

## Defining a Hot Potato [​](https://move-book.com/programmability/hot-potato-pattern/\#defining-a-hot-potato "Direct link to Defining a Hot Potato")

A hot potato can be any struct with no abilities. For example, the following struct is a hot potato:

```codeBlockLines_bu_M
public struct Request {}

```

Because the Request has no abilities and cannot be stored or ignored, the module must provide a
function to unpack it. For example:

```codeBlockLines_bu_M
/// Constructs a new `Request`
public fun new_request(): Request { Request {} }

/// Unpacks the `Request`. Due to the nature of the hot potato, this function
/// must be called to avoid aborting the transaction.
public fun confirm_request(request: Request) {
    let Request {} = request;
}

```

## Example Usage [​](https://move-book.com/programmability/hot-potato-pattern/\#example-usage "Direct link to Example Usage")

In the following example, the Promise hot potato is used to ensure that the borrowed value, when
taken from the container, is returned back to it. The Promise struct contains the ID of the
borrowed object, and the ID of the container, ensuring that the borrowed value was not swapped for
another and is returned to the correct container.

```codeBlockLines_bu_M
/// A generic container for any Object with `key + store`. The Option type
/// is used to allow taking and putting the value back.
public struct Container<T: key + store> has key {
    id: UID,
    value: Option<T>,
}

/// A Hot Potato struct that is used to ensure the borrowed value is returned.
public struct Promise {
    /// The ID of the borrowed object. Ensures that there wasn't a value swap.
    id: ID,
    /// The ID of the container. Ensures that the borrowed value is returned to
    /// the correct container.
    container_id: ID,
}

/// A function that allows borrowing the value from the container.
public fun borrow_val<T: key + store>(container: &mut Container<T>): (T, Promise) {
    assert!(container.value.is_some());
    let value = container.value.extract();
    let id = object::id(&value);
    (value, Promise { id, container_id: object::id(container) })
}

/// Put the taken item back into the container.
public fun return_val<T: key + store>(
    container: &mut Container<T>, value: T, promise: Promise
) {
    let Promise { id, container_id } = promise;
    assert!(object::id(container) == container_id);
    assert!(object::id(&value) == id);
    container.value.fill(value);
}

```

## Applications [​](https://move-book.com/programmability/hot-potato-pattern/\#applications "Direct link to Applications")

Below we list some of the common use cases for the hot potato pattern.

### Borrowing [​](https://move-book.com/programmability/hot-potato-pattern/\#borrowing "Direct link to Borrowing")

As shown in the [example above](https://move-book.com/programmability/hot-potato-pattern/#example-usage), the hot potato is very effective for borrowing with
a guarantee that the borrowed value is returned to the correct container. While the example focuses
on a value stored inside an Option, the same pattern can be applied to any other storage type, say
a [dynamic field](https://move-book.com/programmability/dynamic-fields).

### Flash Loans [​](https://move-book.com/programmability/hot-potato-pattern/\#flash-loans "Direct link to Flash Loans")

Canonical example of the hot potato pattern is flash loans. A flash loan is a loan that is borrowed
and repaid in the same transaction. The borrowed funds are used to perform some operations, and the
repaid funds are returned to the lender. The hot potato pattern ensures that the borrowed funds are
returned to the lender.

An example usage of this pattern may look like this:

```codeBlockLines_bu_M
// Borrow the funds from the lender.
let (asset_a, potato) = lender.borrow(amount);

// Perform some operations with the borrowed funds.
let asset_b = dex.trade(loan);
let proceeds = another_contract::do_something(asset_b);

// Keep the commission and return the rest to the lender.
let pay_back = proceeds.split(amount, ctx);
lender.repay(pay_back, potato);
transfer::public_transfer(proceeds, ctx.sender());

```

### Variable-path Execution [​](https://move-book.com/programmability/hot-potato-pattern/\#variable-path-execution "Direct link to Variable-path Execution")

The hot potato pattern can be used to introduce variation in the execution path. For example, if
there is a module which allows purchasing a Phone for some "Bonus Points" or for USD, the hot
potato can be used to decouple the purchase from the payment. The approach is very similar to how
some shops work - you take the item from the shelf, and then you go to the cashier to pay for it.

```codeBlockLines_bu_M
/// A `Phone`. Can be purchased in a store.
public struct Phone has key, store { id: UID }

/// A ticket that must be paid to purchase the `Phone`.
public struct Ticket { amount: u64 }

/// Return the `Phone` and the `Ticket` that must be paid to purchase it.
public fun purchase_phone(ctx: &mut TxContext): (Phone, Ticket) {
    (
        Phone { id: object::new(ctx) },
        Ticket { amount: 100 }
    )
}

/// The customer may pay for the `Phone` with `BonusPoints` or `SUI`.
public fun pay_in_bonus_points(ticket: Ticket, payment: Coin<BONUS>) {
    let Ticket { amount } = ticket;
    assert!(payment.value() == amount);
    abort // omitting the rest of the function
}

/// The customer may pay for the `Phone` with `USD`.
public fun pay_in_usd(ticket: Ticket, payment: Coin<USD>) {
    let Ticket { amount } = ticket;
    assert!(payment.value() == amount);
    abort // omitting the rest of the function
}

```

This decoupling technique allows separating the purchase logic from the payment logic, making the
code more modular and easier to maintain. The Ticket could be split into its own module, providing
a basic interface for the payment, and the shop implementation could be extended to support other
goods without changing the payment logic.

### Compositional Patterns [​](https://move-book.com/programmability/hot-potato-pattern/\#compositional-patterns "Direct link to Compositional Patterns")

Hot potato can be used to link together different modules in a compositional way. Its module may
define ways to interact with the hot potato, for example, stamp it with a type signature, or to
extract some information from it. This way, the hot potato can be passed between different modules,
and even different packages within the same transaction.

The most important compositional pattern is the Request Pattern, which we will cover in the next
section.

### Usage in the Sui Framework [​](https://move-book.com/programmability/hot-potato-pattern/\#usage-in-the-sui-framework "Direct link to Usage in the Sui Framework")

The pattern is used in various forms in the Sui Framework. Here are some examples:

- [sui::borrow](https://docs.sui.io/references/framework/sui-framework/borrow) \- uses hot potato to ensure that the borrowed value is returned to
the correct container.
- [sui::transfer\_policy](https://docs.sui.io/references/framework/sui-framework/transfer_policy) \- defines a TransferRequest \- a hot potato
which can only be consumed if all conditions are met.
- [sui::token](https://docs.sui.io/references/framework/sui-framework/token) \- in the Closed Loop Token system, an ActionRequest carries the
information about the performed action and collects approvals similarly to TransferRequest.

## Summary [​](https://move-book.com/programmability/hot-potato-pattern/\#summary "Direct link to Summary")

- A hot potato is a struct without abilities, it must come with a way to create and destroy it.
- Hot potatoes are used to ensure that some action is taken before the transaction ends, similar to
a callback.
- Most common use cases for hot potato are borrowing, flash loans, variable-path execution, and
compositional patterns.

- [Defining a Hot Potato](https://move-book.com/programmability/hot-potato-pattern/#defining-a-hot-potato)
- [Example Usage](https://move-book.com/programmability/hot-potato-pattern/#example-usage)
- [Applications](https://move-book.com/programmability/hot-potato-pattern/#applications)
  - [Borrowing](https://move-book.com/programmability/hot-potato-pattern/#borrowing)
  - [Flash Loans](https://move-book.com/programmability/hot-potato-pattern/#flash-loans)
  - [Variable-path Execution](https://move-book.com/programmability/hot-potato-pattern/#variable-path-execution)
  - [Compositional Patterns](https://move-book.com/programmability/hot-potato-pattern/#compositional-patterns)
  - [Usage in the Sui Framework](https://move-book.com/programmability/hot-potato-pattern/#usage-in-the-sui-framework)
- [Summary](https://move-book.com/programmability/hot-potato-pattern/#summary)