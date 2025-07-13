# https://docs.sui.io/guides/developer/stablecoins

[Skip to main content](https://docs.sui.io/guides/developer/stablecoins#__docusaurus_skipToContent_fallback)

On this page

Stablecoins are a type of cryptocurrency that are designed to maintain a stable value relative to a fiat currency or a basket of assets. They are widely used for trading, lending, and as a store of value.

## Available stablecoins [​](https://docs.sui.io/guides/developer/stablecoins\#available-stablecoins "Direct link to Available stablecoins")

On Sui, you can interact with various stablecoins such as USDC, USDT, Agora, and Ondo USDY.

### USDC (USD Coin) [​](https://docs.sui.io/guides/developer/stablecoins\#usdc-usd-coin "Direct link to USDC (USD Coin)")

USDC is a fully collateralized US dollar stablecoin issued by regulated financial institutions. Each USDC token is backed by one US dollar held in reserve. USDC is widely used for trading, payments, and as a stable store of value.

For more detailed information on how to interact with USDC on Sui, refer to the [USDC guide](https://docs.sui.io/guides/developer/stablecoins#usdc-guide).

**Site:** [Circle](https://www.circle.com/en/usdc)

### USDT (Tether) [​](https://docs.sui.io/guides/developer/stablecoins\#usdt-tether "Direct link to USDT (Tether)")

USDT, also known as Tether, is one of the oldest and most widely used stablecoins. It is pegged to the US dollar and is backed by a mix of reserves, including cash, cash equivalents, and other assets.

USDT is currently not issued natively on Sui. For more information on bridging USDT to Sui, refer to [SUI Bridging](https://docs.sui.io/concepts/tokenomics/sui-bridging).

**Site:** [Tether](https://tether.to/)

### Agora [​](https://docs.sui.io/guides/developer/stablecoins\#agora "Direct link to Agora")

AUSD is a fully collateralized US dollar stablecoin issued by Agora Finance.

**Site:** [Agora Finance](https://www.agora.finance/)

### Ondo USDY [​](https://docs.sui.io/guides/developer/stablecoins\#ondo-usdy "Direct link to Ondo USDY")

USDY is a fully collateralized US dollar stablecoin issued by Ondo Finance, allowing users to earn yield from US Treasury Bills.

**Site:** [Ondo Finance](https://ondo.finance/)

## How to use USDC on Sui [​](https://docs.sui.io/guides/developer/stablecoins\#usdc-guide "Direct link to How to use USDC on Sui")

info

While this example uses USDC, the same principles can be applied to any asset on Sui that uses the [Sui Coin standard](https://docs.sui.io/standards/coin).

### Prerequisites [​](https://docs.sui.io/guides/developer/stablecoins\#prerequisites "Direct link to Prerequisites")

- Make sure you have some USDC tokens. Get Testnet tokens from Circle's [faucet](https://faucet.circle.com/).

### USDC stablecoin source code [​](https://docs.sui.io/guides/developer/stablecoins\#usdc-stablecoin-source-code "Direct link to USDC stablecoin source code")

The USDC stablecoin source code is available in the [circlefin/stablecoin-sui](https://github.com/circlefin/stablecoin-sui/blob/master/packages/usdc/sources/usdc.move) repository.

### Import the USDC module in your Move package [​](https://docs.sui.io/guides/developer/stablecoins\#import-the-usdc-module-in-your-move-package "Direct link to Import the USDC module in your Move package")

To import the USDC module, add the following line to the `[dependencies]` section of your Move package's `Move.toml` file:

```codeBlockLines_p187
usdc = { git = "https://github.com/circlefin/stablecoin-sui.git", subdir = "packages/usdc", rev = "master" }

```

After importing the module, your Move package should look like the following:

[examples/move/usdc\_usage/Move.toml](https://github.com/MystenLabs/sui/tree/main/examples/move/usdc_usage/Move.toml)

```codeBlockLines_p187
[package]
name = "usdc_usage"
edition = "2024.beta"

[dependencies]
Sui = { override = true, local = "../../../crates/sui-framework/packages/sui-framework" }
usdc = { git = "https://github.com/circlefin/stablecoin-sui.git", subdir = "packages/usdc", rev = "master" }

[addresses]
usdc_usage = "0x0"

```

warning

The `usdc` package uses a specific version of the `sui` package, which causes a version conflict with the `Sui` package in the Sui framework. You can override the version of the `Sui` package in your `Move.toml` file to use a different version. Add the `override = true` flag to the `Sui` package in your `Move.toml` file.

### Using USDC in Move [​](https://docs.sui.io/guides/developer/stablecoins\#using-usdc-in-move "Direct link to Using USDC in Move")

USDC uses the [Sui Coin standard](https://docs.sui.io/standards/coin) and can be used just like any other coin type in the Sui framework.

After importing the `usdc` package, you can use the `USDC` type.

```codeBlockLines_p187
use usdc::usdc::USDC;

```

Then use the `USDC` type just as you would use the `SUI` type when accepting a `Coin<SUI>` parameter.

[examples/move/usdc\_usage/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/usdc_usage/sources/example.move)

```codeBlockLines_p187
public fun buy_sword_with_usdc(coin: Coin<USDC>, ctx: &mut TxContext): Sword {
    let sword = create_sword(coin.value(), ctx);
    // In production: transfer to actual recipient! Don't transfer to 0x0!
    transfer::public_transfer(coin, @0x0);
    sword
}

```

The following example demonstrates how to use the USDC stablecoin in a Move package and how it relates to using the `SUI` type as well as any generic coin types.

[examples/move/usdc\_usage/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/usdc_usage/sources/example.move)

```codeBlockLines_p187
module usdc_usage::example;

use sui::coin::Coin;
use sui::sui::SUI;
use usdc::usdc::USDC;

public struct Sword has key, store {
		id: UID,
		strength: u64,
}

public fun buy_sword_with_usdc(coin: Coin<USDC>, ctx: &mut TxContext): Sword {
		let sword = create_sword(coin.value(), ctx);
		// In production: transfer to actual recipient! Don't transfer to 0x0!
		transfer::public_transfer(coin, @0x0);
		sword
}

public fun buy_sword_with_sui(coin: Coin<SUI>, ctx: &mut TxContext): Sword {
		let sword = create_sword(coin.value(), ctx);
		// In production: transfer to actual recipient! Don't transfer to 0x0!
		transfer::public_transfer(coin, @0x0);
		sword
}

public fun buy_sword_with_arbitrary_coin<CoinType>(
		coin: Coin<CoinType>,
		ctx: &mut TxContext,
): Sword {
		let sword = create_sword(coin.value(), ctx);
		// In production: transfer to actual recipient! Don't transfer to 0x0!
		transfer::public_transfer(coin, @0x0);
		sword
}

/// A helper function to create a sword.
fun create_sword(strength: u64, ctx: &mut TxContext): Sword {
		let id = object::new(ctx);
		Sword { id, strength }
}

```

### Using USDC in PTBs [​](https://docs.sui.io/guides/developer/stablecoins\#using-usdc-in-ptbs "Direct link to Using USDC in PTBs")

Use USDC in your [PTBs](https://docs.sui.io/guides/developer/sui-101/building-ptb) just like any other coin type.

Create a `Coin<USDC>` object with the `coinWithBalance` function.

```codeBlockLines_p187
const usdcCoin = coinWithBalance({
  type: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  balance: 1_000_000
})

```

info

`0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29` is the [Testnet address](https://suiscan.xyz/testnet/coin/0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC) for USDC, while `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7` is the [Mainnet address](https://suiscan.xyz/coin/0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC).

This coin object can be used as a parameter for any function that accepts a `Coin<USDC>` parameter or a generic `Coin` parameter.

```codeBlockLines_p187
const [sword] = tx.moveCall({
  target: '0xcbbf37a851ed7b625731ca497e2d4aea18cf18145fac3b78bd64f274f6a09d30::usdc_usage::buy_sword_with_usdc',
  arguments: [\
    usdcCoin\
  ]
});

```

```codeBlockLines_p187
const [sword] = tx.moveCall({
  target: '0xcbbf37a851ed7b625731ca497e2d4aea18cf18145fac3b78bd64f274f6a09d30::usdc_usage::buy_sword_with_arbitrary_coin',
  typeArguments: ['0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'],
  arguments: [\
    usdcCoin\
  ]
});

```

This coin object can also be used as input for the `transferObjects` function.

```codeBlockLines_p187
tx.transferObjects([usdcCoin], recipientAddress);

```

## Related links [​](https://docs.sui.io/guides/developer/stablecoins\#related-links "Direct link to Related links")

- [Regulated Coin and Deny List](https://docs.sui.io/guides/developer/coin/regulated): Create a regulated coin and add or remove names from the deny list.
- [Loyalty Token](https://docs.sui.io/guides/developer/coin/loyalty): Create a token to reward user loyalty.
- [In-Game Token](https://docs.sui.io/guides/developer/coin/in-game-token): Create tokens that can be used only within a mobile game.

- [Available stablecoins](https://docs.sui.io/guides/developer/stablecoins#available-stablecoins)
  - [USDC (USD Coin)](https://docs.sui.io/guides/developer/stablecoins#usdc-usd-coin)
  - [USDT (Tether)](https://docs.sui.io/guides/developer/stablecoins#usdt-tether)
  - [Agora](https://docs.sui.io/guides/developer/stablecoins#agora)
  - [Ondo USDY](https://docs.sui.io/guides/developer/stablecoins#ondo-usdy)
- [How to use USDC on Sui](https://docs.sui.io/guides/developer/stablecoins#usdc-guide)
  - [Prerequisites](https://docs.sui.io/guides/developer/stablecoins#prerequisites)
  - [USDC stablecoin source code](https://docs.sui.io/guides/developer/stablecoins#usdc-stablecoin-source-code)
  - [Import the USDC module in your Move package](https://docs.sui.io/guides/developer/stablecoins#import-the-usdc-module-in-your-move-package)
  - [Using USDC in Move](https://docs.sui.io/guides/developer/stablecoins#using-usdc-in-move)
  - [Using USDC in PTBs](https://docs.sui.io/guides/developer/stablecoins#using-usdc-in-ptbs)
- [Related links](https://docs.sui.io/guides/developer/stablecoins#related-links)