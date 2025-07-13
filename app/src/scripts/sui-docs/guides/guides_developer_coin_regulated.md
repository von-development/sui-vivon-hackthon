# https://docs.sui.io/guides/developer/coin/regulated

[Skip to main content](https://docs.sui.io/guides/developer/coin/regulated#__docusaurus_skipToContent_fallback)

On this page

You can create regulated coins on Sui, such as [stablecoins](https://docs.sui.io/guides/developer/stablecoins). These coins are similar to other coins, like SUI, but include the ability to control access to the coin using a deny list.

When creating standard coins, you call the `create_currency` function in the `coin` package of the Sui framework, whether directly or via an SDK. When you create regulated coins, you call the `create_regulated_currency_v2` function in that same package instead. The `create_regulated_currency_v2` function actually leverages the `create_currency` function to create the coin, but adds an additional step that produces a `DenyCapV2` and transfers it to the publisher of the regulated coin package. The bearer of the transferrable `DenyCapV2` object can control access to the coin through a deny list.

## DenyList [​](https://docs.sui.io/guides/developer/coin/regulated\#denylist "Direct link to DenyList")

The `DenyList` is a singleton, shared object that the bearer of a `DenyCapV2` can access to specify a list of addresses that are unable to use a Sui core type. The initial use case for `DenyList`, however, focuses on limiting access to coins of a specified type. This is useful when creating a regulated coin on Sui that requires the ability to block certain addresses from using it as inputs to transactions. Regulated coins on Sui satisfy any regulations that require the ability to prevent known bad actors from having access to those coins.

info

The `DenyList` object is a system object that has the address `0x403`. You cannot create it yourself.

To learn about the features available, see the [Coin standard](https://docs.sui.io/standards/coin) documentation and the `coin` module in the [Sui framework](https://docs.sui.io/references/framework/sui/coin).

## Regulated coin example [​](https://docs.sui.io/guides/developer/coin/regulated\#regulated-coin-example "Direct link to Regulated coin example")

The regulated coin example is in the `examples/regulated-coin` directory of the Sui repo. The example provides both TypeScript- and Rust-based command line access to an on-chain package that demonstrates some of the features of regulated coins on Sui.

## Prerequisites [​](https://docs.sui.io/guides/developer/coin/regulated\#prerequisites "Direct link to Prerequisites")

This topic assumes you are accessing the code from your own fork of the Sui repo. To run the example project, you must have [Sui installed](https://docs.sui.io/guides/developer/getting-started/sui-install).

You need at least one Sui address to publish the contract to the network. At least one additional address is helpful if you want to transfer or test the deny list capability for the regulated coins.

You do not need a Sui wallet to use this project, but having one available might help you visualize results.

This example assumes you're familiar with publishing packages on Sui and the Move language. For more detailed guides on example dApps, see [App Examples](https://docs.sui.io/guides/developer/app-examples). For more more information on the Move language, see [The Move Book](https://move-book.com/).

## Publishing to a network [​](https://docs.sui.io/guides/developer/coin/regulated\#publishing-to-a-network "Direct link to Publishing to a network")

You publish the smart contract to a network the same way as any other package. See [Publish a Package](https://docs.sui.io/guides/developer/first-app/publish) if you would like more details on the publishing process.

The example includes a `publish.sh` file that you can run to automate the publishing. The script assumes you are publishing to the Testnet network, so be sure to update it before running if you plan to run on a local network or Devnet.

The publish script also creates the necessary `.env` files in each of the frontend folders. If you don't use the script, you must create the `.env` file manually and provide the values for the variables the frontend expects to find. Even if you use the script, you must provide the `ADMIN_SECRET_KEY` and it's value.

warning

Take care not to expose the secret key for your address to the public.

| Constant name | Description |
| --- | --- |
| `PACKAGE_ID` | Object ID of the package you publish. This data is part of the response that Sui provides on publish. |
| `ADMIN_SECRET_KEY` | The secret key for the address that publishes the package. You can use `sui keytool export --key-identity <SUI-ADDRESS>` or a wallet UI to get the value. Take care not to expose the value to the public. |
| `ADMIN_ADDRESS` | The address that publishes the contract. |
| `DENY_CAP_ID` | Deny capability object ID. This data is part of the response that Sui provides on publish. |
| `TREASURY_CAP_ID` | The treasury cap object ID that allows the bearer to mint new coins. This data is part of the response that Sui provides on publish. |
| `MODULE_NAME` | The name of the module you publish. |
| `COIN_NAME` | The name of your regulated coin. |
| `SUI_FULLNODE_URL` | The URL to the Full node network that will process transactions. For Testnet this value is `https://fullnode.testnet.sui.io:443`. |

## Smart contract [​](https://docs.sui.io/guides/developer/coin/regulated\#smart-contract "Direct link to Smart contract")

The example uses a single file to create the smart contract for the project ( `regulated_coin.move`). The contract defines the regulated coin when you publish it to the network. The treasury capability ( `TreasuryCap`) and deny capability ( `DenyCapV2`) are transferred to the address that publishes the contract. The `TreasuryCap` permits the bearer to mint or burn coins ( `REGULATED_COIN` in this example), and the `DenyCapV2` bearer can add and remove addresses from the list of unauthorized users.

Click to open

`regulated_coin.move`

[examples/regulated-coin/move/sources/regulated\_coin.move](https://github.com/MystenLabs/sui/tree/main/examples/regulated-coin/move/sources/regulated_coin.move)

```codeBlockLines_p187
module regulated_coin_example::regulated_coin;

use sui::coin;

public struct REGULATED_COIN has drop {}

fun init(otw: REGULATED_COIN, ctx: &mut TxContext) {
		// Creates a new currency using `create_currency`, but with an extra capability that
		// allows for specific addresses to have their coins frozen. Those addresses cannot interact
		// with the coin as input objects.
		let (treasury_cap, deny_cap, meta_data) = coin::create_regulated_currency_v2(
				otw,
				5,
				b"$TABLE",
				b"RegulaCoin",
				b"Example Regulated Coin",
				option::none(),
				true,
				ctx,
		);

		let sender = tx_context::sender(ctx);
		transfer::public_transfer(treasury_cap, sender);
		transfer::public_transfer(deny_cap, sender);
		transfer::public_transfer(meta_data, sender);
}

```

### Creating regulated coins [​](https://docs.sui.io/guides/developer/coin/regulated\#creating-regulated-coins "Direct link to Creating regulated coins")

The Sui Coin standard provides a `create_regulated_currency_v2` function to create regulated coins. This function actually uses `create_currency` to mint a coin, but extends the function by also creating and transferring a `DenyCapV2` capability. The `DenyCapV2` bearer can add and remove addresses from a list that controls, or regulates, access to the coin. This ability is a requirement for assets like stablecoins.

The TypeScript and Rust clients handle the call to the `coin` package's `mint` function. The `coin` package also includes a `mint_and_transfer` function you could use to perform the same task, but the composability of minting the coin in one command and transferring with another is preferable. Using two explicit commands allows you to implement future logic between the minting of the coin and the transfer. The structure of programmable transaction blocks means you're still making and paying for a single transaction on the network.

- TypeScript
- Rust

[examples/regulated-coin/ts-client/src/main.ts](https://github.com/MystenLabs/sui/tree/main/examples/regulated-coin/ts-client/src/main.ts)

```codeBlockLines_p187
program.command('mint-and-transfer')
    .description('Mints coins and transfers to an address.')
    .requiredOption('--amount <amount>', 'The amount of coins to mint.')
    .requiredOption('--address <address>', 'Address to send coins.')

    .action((options) => {
        console.log("Executing mint new coins and transfer to address...");

        console.log("Amount to mint: ", options.amount);
        console.log("Address to send coins: ", options.address);
        console.log("TREASURY_CAP_ID: ", TREASURY_CAP_ID);
        console.log("COIN_TYPE: ", COIN_TYPE);

        if(!TREASURY_CAP_ID) throw new Error("TREASURY_CAP_ID environment variable is not set.");

        const txb = new Transaction();

        const coin = txb.moveCall({
            target: `0x2::coin::mint`,
            arguments: [\
                txb.object(TREASURY_CAP_ID),\
                txb.pure.u64(options.amount),\
            ],
            typeArguments: [COIN_TYPE],
        });

        txb.transferObjects([coin], txb.pure.address(options.address));

        executeTx(txb);
    });

```

For all `Coin` functions available, see the Sui framework [`coin` module documentation](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui/coin.md). The following functions are the most common.

Click to open

`coin::mint<T>`

[crates/sui-framework/packages/sui-framework/sources/coin.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/coin.move)

```codeBlockLines_p187
/// Create a coin worth `value` and increase the total supply
/// in `cap` accordingly.
public fun mint<T>(cap: &mut TreasuryCap<T>, value: u64, ctx: &mut TxContext): Coin<T> {
    Coin {
        id: object::new(ctx),
        balance: cap.total_supply.increase_supply(value),
    }
}

```

Click to open

`coin::mint_balance<T>`

[crates/sui-framework/packages/sui-framework/sources/coin.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/coin.move)

```codeBlockLines_p187
/// Mint some amount of T as a `Balance` and increase the total
/// supply in `cap` accordingly.
/// Aborts if `value` + `cap.total_supply` >= U64_MAX
public fun mint_balance<T>(cap: &mut TreasuryCap<T>, value: u64): Balance<T> {
    cap.total_supply.increase_supply(value)
}

```

Click to open

`coin::mint_and_transfer<T>`

[crates/sui-framework/packages/sui-framework/sources/coin.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/coin.move)

```codeBlockLines_p187
// === Entrypoints ===

/// Mint `amount` of `Coin` and send it to `recipient`. Invokes `mint()`.
public entry fun mint_and_transfer<T>(
    c: &mut TreasuryCap<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    transfer::public_transfer(mint(c, amount, ctx), recipient)
}

```

Click to open

`coin::burn<T>`

[crates/sui-framework/packages/sui-framework/sources/coin.move](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources/coin.move)

```codeBlockLines_p187
/// Destroy the coin `c` and decrease the total supply in `cap`
/// accordingly.
public entry fun burn<T>(cap: &mut TreasuryCap<T>, c: Coin<T>): u64 {
    let Coin { id, balance } = c;
    id.delete();
    cap.total_supply.decrease_supply(balance)
}

```

### Manage deny list [​](https://docs.sui.io/guides/developer/coin/regulated\#manage-deny-list "Direct link to Manage deny list")

For the ability to manage the addresses assigned to the deny list for your coin, the frontend code provides a few additional functions. These additions call the `deny_list_v2_add` and `deny_list_v2_remove` functions in the `coin` module.

If you add an address to the deny list, you might notice that you can still send tokens to that address. If so, that's because the address is still able to receive coins until the end of the epoch in which you called the function. If you try to send the regulated coin from the now blocked address, your attempt results in an error. After the next epoch starts, the address can no longer receive the coins, either. If you remove the address, it can receive coins immediately but must wait until the epoch after removal before the address can include the coins as transaction inputs.

To use these functions, you pass the address you want to either add or remove. The frontend function then calls the relevant move module in the framework, adding the `DenyList` object ( `0x403`) and your `DenyCap` object ID. You receive the `DenyCap` ID at the time of publishing the smart contract. In this example, you add that value to the `.env` file that the frontend function reads from.

- TypeScript
- Rust

[examples/regulated-coin/ts-client/src/main.ts](https://github.com/MystenLabs/sui/tree/main/examples/regulated-coin/ts-client/src/main.ts)

```codeBlockLines_p187
program.command('deny-list-add')
    .description('Adds an address to the deny list.')
    .requiredOption('--address <address>', 'Address to add.')

    .action((options) => {
        console.log("Executing addition to deny list...");
        console.log("Address to add to deny list: ", options.address);
        const txb = new Transaction();

        txb.moveCall({
            target: `0x2::coin::deny_list_v2_add`,
            arguments: [\
                txb.object(SUI_DENY_LIST_OBJECT_ID),\
                txb.object(DENY_CAP_ID),\
                txb.pure.address(options.address),\
            ],
            typeArguments: [COIN_TYPE],
        });

        executeTx(txb);
    });

program.command('deny-list-remove')
    .description('Removes an address from the deny list.')
    .requiredOption('--address <address>', 'Address to add.')
    .requiredOption('--deny_list <address>', 'Deny list object ID.')

    .action((options) => {
        console.log("Executing removal from deny list...");
        console.log("Address to remove in deny list: ", options.address);

        if(!DENY_CAP_ID) throw new Error("DENY_CAP_ID environment variable is not set. Are you sure the active address owns the deny list object?");

        const txb = new Transaction();

        txb.moveCall({
            target: `0x2::coin::deny_list_v2_remove`,
            arguments: [\
                txb.object(SUI_DENY_LIST_OBJECT_ID),\
                txb.object(DENY_CAP_ID),\
                txb.pure.address(options.address),\
            ],
            typeArguments: [COIN_TYPE],
        });

        executeTx(txb);
    });

```

## Related links [​](https://docs.sui.io/guides/developer/coin/regulated\#related-links "Direct link to Related links")

- [Closed Loop Token standard](https://docs.sui.io/standards/closed-loop-token): Details for the standard used to create tokens on Sui.
- [Source code](https://github.com/MystenLabs/sui/tree/main/examples/regulated-coin): The source code in GitHub for this example.
- [In-Game Tokens](https://docs.sui.io/guides/developer/coin/in-game-token): Example of how to create tokens for use as in-game currency.
- [Loyalty Tokens](https://docs.sui.io/guides/developer/coin/loyalty): Example of how to create tokens that reward brand or service loyalty on the Sui network.

- [DenyList](https://docs.sui.io/guides/developer/coin/regulated#denylist)
- [Regulated coin example](https://docs.sui.io/guides/developer/coin/regulated#regulated-coin-example)
- [Prerequisites](https://docs.sui.io/guides/developer/coin/regulated#prerequisites)
- [Publishing to a network](https://docs.sui.io/guides/developer/coin/regulated#publishing-to-a-network)
- [Smart contract](https://docs.sui.io/guides/developer/coin/regulated#smart-contract)
  - [Creating regulated coins](https://docs.sui.io/guides/developer/coin/regulated#creating-regulated-coins)
  - [Manage deny list](https://docs.sui.io/guides/developer/coin/regulated#manage-deny-list)
- [Related links](https://docs.sui.io/guides/developer/coin/regulated#related-links)