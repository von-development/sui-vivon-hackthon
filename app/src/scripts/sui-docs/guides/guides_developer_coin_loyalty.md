# https://docs.sui.io/guides/developer/coin/loyalty

[Skip to main content](https://docs.sui.io/guides/developer/coin/loyalty#__docusaurus_skipToContent_fallback)

On this page

Using the Sui [Closed-Loop Token](https://docs.sui.io/standards/closed-loop-token) standard, you can create tokens that are valid only for a specific service, like an airline that wants to grant tokens to frequent flyers to purchase tickets or upgrades.

The following example demonstrates the creation of a loyalty token that bearers can use to make purchases in a digital gift shop.

## Example [​](https://docs.sui.io/guides/developer/coin/loyalty\#example "Direct link to Example")

The Loyalty Token example illustrates a loyalty token that is created with the Closed Loop Token standard. If you were to implement this example, the Admin would send `LOYALTY` tokens to the users of your service as a reward for their loyalty. The example creates a `GiftShop` where holders can spend `LOYALTY` tokens to buy `Gift` s.

### examples::loyalty [​](https://docs.sui.io/guides/developer/coin/loyalty\#examplesloyalty "Direct link to examples::loyalty")

The loyalty.move source file contains the `examples::loyalty` module code that creates the loyalty token. The module includes the one-time witness (OTW) that creates the coin (with the same name as the module, `LOYALTY`), possesses only the `drop` ability, and has no fields. These are the characteristics of a OTW, which ensures the `LOYALTY` type has a single instance.

[examples/move/token/sources/loyalty.move](https://github.com/MystenLabs/sui/tree/main/examples/move/token/sources/loyalty.move)

```codeBlockLines_p187
public struct LOYALTY has drop {}

```

The `init` function of the module uses the `LOYALTY` OTW to create the token. All `init` functions run one time only at the package publish event. The initializer function makes use of the OTW `LOYALTY` type defined previously in its call to `create_currency`. The function also defines a policy, sending both the policy capability and treasury capability to the address associated with the publish event. The holder of these transferrable capabilities can mint new `LOYALTY` tokens and modify their policies.

[examples/move/token/sources/loyalty.move](https://github.com/MystenLabs/sui/tree/main/examples/move/token/sources/loyalty.move)

```codeBlockLines_p187
fun init(otw: LOYALTY, ctx: &mut TxContext) {
    let (treasury_cap, coin_metadata) = coin::create_currency(
        otw,
        0, // no decimals
        b"LOY", // symbol
        b"Loyalty Token", // name
        b"Token for Loyalty", // description
        option::none(), // url
        ctx,
    );

    let (mut policy, policy_cap) = token::new_policy(&treasury_cap, ctx);

    token::add_rule_for_action<LOYALTY, GiftShop>(
        &mut policy,
        &policy_cap,
        token::spend_action(),
        ctx,
    );

    token::share_policy(policy);

    transfer::public_freeze_object(coin_metadata);
    transfer::public_transfer(policy_cap, tx_context::sender(ctx));
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

```

The `LOYALTY` minting function is called `reward_user`. As mentioned previously, the holder of the `TreasuryCap` can call this function to mint new loyalty tokens and send them to the desired address. The function uses the `token::mint` function to create the token and `token::transfer` to send it to the intended recipient.

[examples/move/token/sources/loyalty.move](https://github.com/MystenLabs/sui/tree/main/examples/move/token/sources/loyalty.move)

```codeBlockLines_p187
public fun reward_user(
    cap: &mut TreasuryCap<LOYALTY>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let token = token::mint(cap, amount, ctx);
    let req = token::transfer(token, recipient, ctx);

    token::confirm_with_treasury_cap(cap, req, ctx);
}

```

Finally, the example includes a `buy_a_gift` function to handle the redemption of `LOYALTY` tokens for `Gift` types. The function ensures the gift price matches the number of loyalty tokens spent, then uses the `token::spend` function to handle the treasury bookkeeping.

[examples/move/token/sources/loyalty.move](https://github.com/MystenLabs/sui/tree/main/examples/move/token/sources/loyalty.move)

```codeBlockLines_p187
public fun buy_a_gift(token: Token<LOYALTY>, ctx: &mut TxContext): (Gift, ActionRequest<LOYALTY>) {
    assert!(token::value(&token) == GIFT_PRICE, EIncorrectAmount);

    let gift = Gift { id: object::new(ctx) };
    let mut req = token::spend(token, ctx);

    token::add_approval(GiftShop {}, &mut req, ctx);

    (gift, req)
}

```

### Complete code [​](https://docs.sui.io/guides/developer/coin/loyalty\#complete-code "Direct link to Complete code")

Toggle display of the complete source for this example, including comments, or use the link in the [Related links](https://docs.sui.io/guides/developer/coin/loyalty#related-links) section to view the project source on GitHub.

Click to open

`loyalty.move`

[examples/move/token/sources/loyalty.move](https://github.com/MystenLabs/sui/tree/main/examples/move/token/sources/loyalty.move)

```codeBlockLines_p187
/// This module illustrates a Closed Loop Loyalty Token. The `Token` is sent to
/// users as a reward for their loyalty by the application Admin. The `Token`
/// can be used to buy a `Gift` in the shop.
///
/// Actions:
/// - spend - spend the token in the shop
module examples::loyalty;

use sui::coin::{Self, TreasuryCap};
use sui::token::{Self, ActionRequest, Token};

/// Token amount does not match the `GIFT_PRICE`.
const EIncorrectAmount: u64 = 0;

/// The price for the `Gift`.
const GIFT_PRICE: u64 = 10;

/// The OTW for the Token / Coin.
public struct LOYALTY has drop {}

/// This is the Rule requirement for the `GiftShop`. The Rules don't need
/// to be separate applications, some rules make sense to be part of the
/// application itself, like this one.
public struct GiftShop has drop {}

/// The Gift object - can be purchased for 10 tokens.
public struct Gift has key, store {
		id: UID,
}

// Create a new LOYALTY currency, create a `TokenPolicy` for it and allow
// everyone to spend `Token`s if they were `reward`ed.
fun init(otw: LOYALTY, ctx: &mut TxContext) {
		let (treasury_cap, coin_metadata) = coin::create_currency(
				otw,
				0, // no decimals
				b"LOY", // symbol
				b"Loyalty Token", // name
				b"Token for Loyalty", // description
				option::none(), // url
				ctx,
		);

		let (mut policy, policy_cap) = token::new_policy(&treasury_cap, ctx);

		// but we constrain spend by this shop:
		token::add_rule_for_action<LOYALTY, GiftShop>(
				&mut policy,
				&policy_cap,
				token::spend_action(),
				ctx,
		);

		token::share_policy(policy);

		transfer::public_freeze_object(coin_metadata);
		transfer::public_transfer(policy_cap, tx_context::sender(ctx));
		transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

/// Handy function to reward users. Can be called by the application admin
/// to reward users for their loyalty :)
///
/// `Mint` is available to the holder of the `TreasuryCap` by default and
/// hence does not need to be confirmed; however, the `transfer` action
/// does require a confirmation and can be confirmed with `TreasuryCap`.
public fun reward_user(
		cap: &mut TreasuryCap<LOYALTY>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext,
) {
		let token = token::mint(cap, amount, ctx);
		let req = token::transfer(token, recipient, ctx);

		token::confirm_with_treasury_cap(cap, req, ctx);
}

/// Buy a gift for 10 tokens. The `Gift` is received, and the `Token` is
/// spent (stored in the `ActionRequest`'s `burned_balance` field).
public fun buy_a_gift(token: Token<LOYALTY>, ctx: &mut TxContext): (Gift, ActionRequest<LOYALTY>) {
		assert!(token::value(&token) == GIFT_PRICE, EIncorrectAmount);

		let gift = Gift { id: object::new(ctx) };
		let mut req = token::spend(token, ctx);

		// only required because we've set this rule
		token::add_approval(GiftShop {}, &mut req, ctx);

		(gift, req)
}

```

## Related links [​](https://docs.sui.io/guides/developer/coin/loyalty\#related-links "Direct link to Related links")

- [Closed Loop Token standard](https://docs.sui.io/standards/closed-loop-token): Details for the standard used to create tokens on Sui.
- [Source code](https://github.com/MystenLabs/sui/blob/main/examples/move/token/sources/loyalty.move): The source code in GitHub for this example.
- [In-Game Tokens](https://docs.sui.io/guides/developer/coin/in-game-token): Example of how to create tokens for use as in-game currency.
- [Regulated Coin and Deny List](https://docs.sui.io/guides/developer/coin/regulated): Example of how to create regulated coins on the Sui network.

- [Example](https://docs.sui.io/guides/developer/coin/loyalty#example)
  - [examples::loyalty](https://docs.sui.io/guides/developer/coin/loyalty#examplesloyalty)
  - [Complete code](https://docs.sui.io/guides/developer/coin/loyalty#complete-code)
- [Related links](https://docs.sui.io/guides/developer/coin/loyalty#related-links)