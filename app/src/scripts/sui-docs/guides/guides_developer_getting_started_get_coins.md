# https://docs.sui.io/guides/developer/getting-started/get-coins

[Skip to main content](https://docs.sui.io/guides/developer/getting-started/get-coins#__docusaurus_skipToContent_fallback)

On this page

Sui faucet is a helpful tool where Sui developers can get free test SUI tokens to deploy and interact with their programs on Sui's Devnet and Testnet networks. There is no faucet for Sui Mainnet...

## Prerequisites [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#prerequisites "Direct link to Prerequisites")

To request tokens from the faucet, you must own a wallet address that can receive the SUI tokens. See the [Get Sui Address](https://docs.sui.io/guides/developer/getting-started/get-address) topic if you don't already have an address or need to create a new one.

## Request test tokens through the online faucet [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#online-faucet "Direct link to Request test tokens through the online faucet")

[https://faucet.sui.io/](https://faucet.sui.io/): Visit the online faucet to request SUI tokens.

How to use:

1. Connect your wallet or paste your wallet address in the address field.
2. Use the network dropdown to select the correct network.
3. Click the **Request SUI** button.

To request more SUI, refresh your browser and click the Request SUI button again. The requests are rate limited, however, so too many requests results in a waiting period before you are able to request more tokens.

### Return unused Testnet SUI [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#return-unused-testnet-sui "Direct link to Return unused Testnet SUI")

The Testnet faucet drains from a finite pool of SUI. If the pool empties, it disrupts faucet service for the rest of the community. To help ensure this doesn't happen, you can use the online faucet to return your unused SUI to the pool.

There are two ways to return unused Testnet SUI:

- Connect your wallet to the online faucet, and click the **Return tokens to faucet** button. Approve the transaction using your wallet and your Testnet SUI are returned to the pool.
- If you prefer not to connect your wallet, click the **Copy** button to the right of the return address and send the tokens via a separate transaction.

## Request test tokens through the CLI [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#request-test-tokens-through-the-cli "Direct link to Request test tokens through the CLI")

If you are using the Devnet or Testnet networks, or you spun up a local network, you can use the [Sui CLI](https://docs.sui.io/references/cli/client) to request tokens for your address. The `sui client faucet` uses the active network and active address that is currently set in the Sui CLI by default, but you can specify custom data through the following two arguments:

- `--address` argument to provide a specific address (or its alias),
- `--url` argument to provide a custom faucet endpoint.

## Request test tokens through Discord [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#request-test-tokens-through-discord "Direct link to Request test tokens through Discord")

1. Join [Discord](https://discord.gg/sui).
If you try to join the Sui Discord channel using a newly created Discord account, you may need to wait a few days for validation.
2. Request test SUI tokens in the Sui [#devnet-faucet](https://discord.com/channels/916379725201563759/971488439931392130) or [#testnet-faucet](https://discord.com/channels/916379725201563759/1037811694564560966) Discord channels. Send the following message to the channel with your client address:
`!faucet <Your client address>`

## Request test tokens through wallet [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#request-test-tokens-through-wallet "Direct link to Request test tokens through wallet")

You can request test tokens within [Sui Wallet](https://github.com/MystenLabs/mysten-app-docs/blob/main/mysten-sui-wallet.md#add-sui-tokens-to-your-sui-wallet).

## Request test tokens through cURL [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#request-test-tokens-through-curl "Direct link to Request test tokens through cURL")

Use the following cURL command to request tokens directly from the faucet server:

```codeBlockLines_p187
curl --location --request POST 'https://faucet.devnet.sui.io/v2/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "<YOUR SUI ADDRESS>"
    }
}'

```

If you're working with a local network, replace `'https://faucet.devnet.sui.io/v2/gas'` with the appropriate value based on which package runs your network:

- `sui-faucet`: `http://127.0.0.1:5003/gas`
- `sui`: `http://127.0.0.1:9123/gas`

## Request test tokens through TypeScript SDK [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#request-test-tokens-through-typescript-sdk "Direct link to Request test tokens through TypeScript SDK")

You can also access the faucet using the Sui TypeScript SDK.

```codeBlockLines_p187
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';

// get tokens from the Devnet faucet server
await requestSuiFromFaucetV2({
	// connect to Devnet
	host: getFaucetHost('devnet'),
	recipient: '<YOUR SUI ADDRESS>',
});

```

## Test tokens on a local network [​](https://docs.sui.io/guides/developer/getting-started/get-coins\#test-tokens-on-a-local-network "Direct link to Test tokens on a local network")

If you are running a local Sui network, you can get tokens from your local faucet. See the [Connect to a Local Network](https://docs.sui.io/guides/developer/getting-started/local-network#use-the-local-faucet) topic for details.

- [Prerequisites](https://docs.sui.io/guides/developer/getting-started/get-coins#prerequisites)
- [Request test tokens through the online faucet](https://docs.sui.io/guides/developer/getting-started/get-coins#online-faucet)
  - [Return unused Testnet SUI](https://docs.sui.io/guides/developer/getting-started/get-coins#return-unused-testnet-sui)
- [Request test tokens through the CLI](https://docs.sui.io/guides/developer/getting-started/get-coins#request-test-tokens-through-the-cli)
- [Request test tokens through Discord](https://docs.sui.io/guides/developer/getting-started/get-coins#request-test-tokens-through-discord)
- [Request test tokens through wallet](https://docs.sui.io/guides/developer/getting-started/get-coins#request-test-tokens-through-wallet)
- [Request test tokens through cURL](https://docs.sui.io/guides/developer/getting-started/get-coins#request-test-tokens-through-curl)
- [Request test tokens through TypeScript SDK](https://docs.sui.io/guides/developer/getting-started/get-coins#request-test-tokens-through-typescript-sdk)
- [Test tokens on a local network](https://docs.sui.io/guides/developer/getting-started/get-coins#test-tokens-on-a-local-network)