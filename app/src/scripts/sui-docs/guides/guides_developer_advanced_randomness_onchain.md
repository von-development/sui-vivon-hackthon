# https://docs.sui.io/guides/developer/advanced/randomness-onchain

[Skip to main content](https://docs.sui.io/guides/developer/advanced/randomness-onchain#__docusaurus_skipToContent_fallback)

On this page

Generating pseudo-random values in Move is similar to solutions in other languages. A Move function can create a new instance of `RandomGenerator` and use it for generating random values of different types, for example, `generate_u128(&mut generator), generate_u8_in_range(&mut generator, 1, 6)`, or,

```codeBlockLines_p187
entry fun roll_dice(r: &Random, ctx: &mut TxContext): Dice {
  let mut generator = new_generator(r, ctx); // generator is a PRG
  Dice { value: random::generate_u8_in_range(&mut generator, 1, 6) }
}

```

`Random` has a reserved address `0x8`. See [random.move](https://docs.sui.io/references/framework/sui-framework/random) for the Move APIs for accessing randomness on Sui.

note

Although `Random` is a shared object, it is inaccessible for mutable operations, and any transaction attempting to modify it fails.

Having access to random numbers is only one part of designing secure applications, you should also pay careful attention to how you use that randomness.
To securely access randomness:

- Define your function as (private) `entry`.
- Prefer generating randomness using function-local `RandomGenerator`.
- Make sure that the "unhappy path" of your function does not consume more resources than the "happy path".

## Limited resources and `Random` dependent flows [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#limited-resources-and-random-dependent-flows "Direct link to limited-resources-and-random-dependent-flows")

Be aware that some resources that are available to transactions are limited.
If you are not careful, an attacker can break or exploit your application by deliberately controlling the point where your function runs out of resources.

Concretely, gas is such a resource.
Consider the following vulnerable code:

```codeBlockLines_p187
// Insecure implementation, do not use!
entry fun insecure_play(r: &Random, payment: Coin<SUI>, ...) {
  ...
  let mut generator = new_generator(r, ctx);
  let win = generator.generate_bool();
  if (win) { // happy flow
    ... cheap computation ...
  } else {
    ... very expensive computation ...
  }
}

```

Observe that the gas costs of a transaction that calls `insecure_play` depends on the value of `win`.
An attacker could call this function with a gas budget that is sufficient for the "happy flow" but not the "unhappy one", resulting in it either winning or reverting the transaction (but never losing the payment).

warning

The `Random` API does not automatically prevent this kind of attack, and you must be aware of this subtlety when designing your contracts.

Other limited resources per transaction that you should consider are:

- The number of new objects.
- The number of objects that can be used (including dynamic fields).
- Number of events emitted.
- Number of UIDs generated, or deleted, or transferred.
- For a complete list of the current limits defined in the Protocol Config, see [this](https://github.com/MystenLabs/sui/blob/main/crates/sui-protocol-config/src/lib.rs#L731).

For many use cases this attack is not an issue, like when selecting a raffle winner, or lottery numbers, as the code running is independent of the randomness.
However, in the cases where it can be problematic, you can consider one of the following:

- Use two steps:
Split the logic to two functions that must be called by different transactions.
The first function, called by transaction `tx1`, fetches a random value and stores it in an object that is unreadable by other commands in `tx1` (for example, by transferring the object to the caller, or, by storing the tx digest and checking it is different on read).
A second function, called by transaction `tx2`, reads the stored value and completes the operation.
`tx2` might indeed fail, but now the random value is fixed and cannot be modified using repeated calls.
It is important that the inputs to the second function are fixed and cannot be modified after `tx1` (otherwise an attacker can modify them after seeing the randomness committed by `tx1`).
Also, it is important to gracefully handle the case in which the second step is never completed (for example, charge a fee in the first step).
See [this](https://github.com/MystenLabs/sui/blob/main/examples/move/random/random_nft/sources/example.move#L117-L142) for example implementation.
- Write the function in a way that the happy flow consumes more resources than the unhappy one. Keep the following in mind:
  - External functions or native ones can change in the future, potentially resulting in different costs compared to the time you conducted your tests.
  - [profile-transaction](https://docs.sui.io/references/cli/client#profile-a-transaction) can be used to profile the costs of a transaction.
  - UIDs generated and deleted on the same transaction do not count towards the limit.

## Use (non-public) `entry` functions [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#use-non-public-entry-functions "Direct link to use-non-public-entry-functions")

While composition is very powerful for smart contracts, it opens the door to attacks on functions that use randomness.
Consider for example a betting game that uses randomness for rolling dice:

```codeBlockLines_p187
module games::dice {
  ...
  public enum Ticket has drop {
    Lost,
    Won,
  }

  public fun is_winner(t: &Ticket): bool {
    match (t) {
      Ticket::Won => true,
      Ticket::Lost => false,
    }
  }

  /// If you guess correctly the output, then you get a GuessedCorrectly object.
  /// Otherwise you get nothing.
  public fun play_dice(guess: u8, fee: Coin<SUI>, r: &Random, ctx: &mut TxContext): Ticket {
    // Pay for the turn
    assert!(coin::value(&fee) == 1000000, EInvalidAmount);
    transfer::public_transfer(fee, CREATOR_ADDRESS);

    // Roll the dice
    let mut generator = new_generator(r, ctx);
    if (guess == generator.generate_u8_in_range(1, 6)) {
      Ticket::Won
    } else {
      Ticket::Lost
    }
  }
  ...
}

```

An attacker can deploy the next function:

```codeBlockLines_p187
public fun attack(guess: u8, r: &Random, ctx: &mut TxContext): Ticket {
  let t = dice::play_dice(guess, r, ctx);
  // revert the transaction if play_dice lost
  assert!(!dice::is_winner(&t), 0);
  t
}

```

The attacker can now call `attack` with a guess, and **always** revert the fee transfer if the guess is incorrect.

To protect against composition attacks, define your function as a private `entry` function so functions from other modules cannot call it.

tip

The Move compiler enforces this behavior by rejecting `public` functions with `Random` as an argument.

## Programmable transaction block (PTB) restrictions [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#programmable-transaction-block-ptb-restrictions "Direct link to Programmable transaction block (PTB) restrictions")

A similar attack to the one previously described involves PTBs _even_ when `play_dice` is defined as a private `entry` function.
For example, consider the `entry play_dice(guess: u8, fee: Coin<SUI>, r: &Random, ctx: &mut TxContext): Ticket { … }` function defined earlier, the attacker can publish the function

```codeBlockLines_p187
public fun attack(t: Ticket): Ticket {
  assert!(!dice::is_winner(&t), 0);
  t
}

```

and send a PTB with commands `play_dice(...), attack(Result(0))` where `Result(0)` is the output of the first command.
As before, the attack takes advantage of the atomic nature of PTBs and always reverts the _entire transaction_ if the
guess was incorrect, without paying the fee. Sending multiple transactions can repeat the attack, each one executed with
different randomness and reverted if the guess is incorrect.

tip

To protect against PTB-based composition attacks, Sui rejects PTBs that have commands that are not `TransferObjects` or `MergeCoins` following a `MoveCall` command that uses `Random` as an input.

## Instantiating `RandomGenerator` [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#instantiating-randomgenerator "Direct link to instantiating-randomgenerator")

`RandomGenerator` is secure as long as it's created by the consuming module. If passed as an argument, the caller might be able to predict the outputs of that `RandomGenerator` instance (for example, by calling `bcs::to_bytes(&generator)` and parsing its internal state).

tip

The Move compiler enforces this behavior by rejecting `public` functions with `RandomGenerator` as an argument.

## Accessing `Random` from TypeScript [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#accessing-random-from-typescript "Direct link to accessing-random-from-typescript")

If you want to call `roll_dice(r: &Random, ctx: &mut TxContext)` in module `example`, use the following code snippet:

```codeBlockLines_p187
const tx = new Transaction();
tx.moveCall({
  target: "${PACKAGE_ID}::example::roll_dice",
  arguments: [tx.object.random()]
});
...

```

## Related Links [​](https://docs.sui.io/guides/developer/advanced/randomness-onchain\#related-links "Direct link to Related Links")

- [Sui Framework Reference](https://docs.sui.io/references/framework)
  - [random.move](https://docs.sui.io/references/framework/sui-framework/random)
- [Raffle example](https://github.com/MystenLabs/sui/blob/main/examples/move/random/raffles)
- [Sui Client CLI](https://docs.sui.io/references/cli/client)

- [Limited resources and `Random` dependent flows](https://docs.sui.io/guides/developer/advanced/randomness-onchain#limited-resources-and-random-dependent-flows)
- [Use (non-public) `entry` functions](https://docs.sui.io/guides/developer/advanced/randomness-onchain#use-non-public-entry-functions)
- [Programmable transaction block (PTB) restrictions](https://docs.sui.io/guides/developer/advanced/randomness-onchain#programmable-transaction-block-ptb-restrictions)
- [Instantiating `RandomGenerator`](https://docs.sui.io/guides/developer/advanced/randomness-onchain#instantiating-randomgenerator)
- [Accessing `Random` from TypeScript](https://docs.sui.io/guides/developer/advanced/randomness-onchain#accessing-random-from-typescript)
- [Related Links](https://docs.sui.io/guides/developer/advanced/randomness-onchain#related-links)