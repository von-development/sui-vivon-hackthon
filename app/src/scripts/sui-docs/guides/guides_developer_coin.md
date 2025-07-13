# https://docs.sui.io/guides/developer/coin

[Skip to main content](https://docs.sui.io/guides/developer/coin#__docusaurus_skipToContent_fallback)

On this page

Coins and tokens on Sui are similar. In practice, the terms are used interchangeably, but there are some differences in their implementation. You can learn about these differences in the respective standard documentation, [Closed-Loop Token](https://docs.sui.io/standards/closed-loop-token) and [Coin](https://docs.sui.io/standards/coin).

Publishing a coin on Sui is similar to publishing a new type. The main difference is the requirement of a one time witness when creating a coin.

[examples/move/coin/sources/my\_coin.move](https://github.com/MystenLabs/sui/tree/main/examples/move/coin/sources/my_coin.move)

```codeBlockLines_p187
module examples::my_coin;

use sui::coin::{Self, TreasuryCap};

public struct MY_COIN has drop {}

fun init(witness: MY_COIN, ctx: &mut TxContext) {
		let (treasury, metadata) = coin::create_currency(
				witness,
				6,
				b"MY_COIN",
				b"",
				b"",
				option::none(),
				ctx,
		);
		transfer::public_freeze_object(metadata);
		transfer::public_transfer(treasury, ctx.sender())
}

public fun mint(
		treasury_cap: &mut TreasuryCap<MY_COIN>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext,
) {
		let coin = coin::mint(treasury_cap, amount, ctx);
		transfer::public_transfer(coin, recipient)
}

```

The `Coin<T>` is a generic implementation of a coin on Sui. Access to the `TreasuryCap` provides control over the minting and burning of coins. Further transactions can be sent directly to the `sui::coin::Coin` with `TreasuryCap` object as authorization.

The example module includes a `mint` function. You pass the `TreasuryCap` created from the `init` function to the module's `mint` function. The function then uses the `mint` function from the `Coin` module to create (mint) a coin and then transfer it to an address.

[examples/move/coin/sources/my\_coin.move](https://github.com/MystenLabs/sui/tree/main/examples/move/coin/sources/my_coin.move)

```codeBlockLines_p187
public fun mint(
    treasury_cap: &mut TreasuryCap<MY_COIN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(treasury_cap, amount, ctx);
    transfer::public_transfer(coin, recipient)
}

```

### Sui CLI [​](https://docs.sui.io/guides/developer/coin\#sui-cli "Direct link to Sui CLI")

If you published the previous example to a Sui network, you can use the `sui client call` command to mint coins and deliver them to the address you provide. See [Sui CLI](https://docs.sui.io/references/cli) for more information on the command line interface.

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

```codeBlockLines_p187
$ sui client call --function mint --module mycoin --package <PACKAGE-ID> --args <TREASURY-CAP-ID> <COIN-AMOUNT> <RECIPIENT-ADDRESS> --gas-budget <GAS-AMOUNT>

```

If the call is successful your console displays the result, which includes a **Balance Changes** section with the following information included:

```codeBlockLines_p187
...

Owner: Account Address ( <RECIPIENT-ADDRESS> )
CoinType: <PACKAGE-ID>::mycoin::MYCOIN
Amount: <COIN-AMOUNT>

...

```

## DenyList [​](https://docs.sui.io/guides/developer/coin\#denylist "Direct link to DenyList")

The Sui framework provides a `DenyList` singleton, shared object that the bearer of a `DenyCapV2` can access to specify a list of addresses that are unable to use a Sui core type. The initial use case for `DenyList`, however, focuses on limiting access to coins of a specified type. This is useful, for example, when creating a regulated coin on Sui that requires the ability to block certain addresses from using it as inputs to transactions. Regulated coins on Sui satisfy any regulations that require the ability to prevent known bad actors from having access to those coins.

info

The `DenyList` object is a system object that has the address `0x403`. You cannot create it yourself.

## Create regulated coin [​](https://docs.sui.io/guides/developer/coin\#create-regulated-coin "Direct link to Create regulated coin")

If you need the ability to deny specific addresses from having access to your coin, you can use the `create_regulated_currency_v2` function (instead of `create_currency`) to create it.

Behind the scenes, `create_regulated_currency_v2` uses the `create_currency` function to create the coin, but also produces a `DenyCapV2` object that allows its bearer to control access to the coin's deny list in a `DenyList` object. Consequently, the way to create a coin using `create_regulated_currency_v2` is similar to the previous example, with the addition of a transfer of the `DenyCap` object to the module publisher.

## Create tokens [​](https://docs.sui.io/guides/developer/coin\#create-tokens "Direct link to Create tokens")

Tokens reuse the `TreasuryCap` defined in the `sui::coin` module and therefore have the same initialization process. The `coin::create_currency` function guarantees the uniqueness of the `TreasuryCap` and forces the creation of a `CoinMetadata` object.

Coin-like functions perform the minting and burning of tokens. Both require the `TreasuryCap`:

- `token::mint` \- mint a token
- `token::burn` \- burn a token

See [Closed-Loop Token](https://docs.sui.io/standards/closed-loop-token) standard for complete details of working with tokens.

## Related links [​](https://docs.sui.io/guides/developer/coin\#related-links "Direct link to Related links")

- [Regulated Coin and Deny List](https://docs.sui.io/guides/developer/coin/regulated): Create a regulated coin and add or remove names from the deny list.
- [Loyalty Token](https://docs.sui.io/guides/developer/coin/loyalty): Create a token to reward user loyalty.
- [In-Game Token](https://docs.sui.io/guides/developer/coin/in-game-token): Create tokens that can be used only within a mobile game.
- [Stablecoins](https://docs.sui.io/guides/developer/stablecoins): The Sui network has native stablecoins, including USDC.
- [One Time Witness](https://move-book.com/programmability/one-time-witness.html): The Move Book documentation of the one time witness pattern.

- [Sui CLI](https://docs.sui.io/guides/developer/coin#sui-cli)
- [DenyList](https://docs.sui.io/guides/developer/coin#denylist)
- [Create regulated coin](https://docs.sui.io/guides/developer/coin#create-regulated-coin)
- [Create tokens](https://docs.sui.io/guides/developer/coin#create-tokens)
- [Related links](https://docs.sui.io/guides/developer/coin#related-links)