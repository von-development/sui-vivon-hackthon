# https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example#__docusaurus_skipToContent_fallback)

On this page

The Sui community created an example to facilitate a comprehensive understanding of each step involved in Sui zkLogin for developers.

- [Sui zkLogin Example](https://sui-zklogin.vercel.app/)

![ZKLogin Overview](https://docs.sui.io/assets/images/overview-92aed0a2680b21bb9d8d4b168aac8972.png)
This example breaks down the complete process of Sui zkLogin into seven steps, as follows:

1. Generate ephemeral key pair
2. Fetch JWT
3. Decode JWT
4. Generate salt
5. Generate user Sui address
6. Fetch ZK proof
7. Assemble zkLogin signature

Each step includes corresponding code snippets, providing instructions on how to obtain the required data for each step.

## Operating environment [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example\#operating-environment "Direct link to Operating environment")

The example runs in Sui Devnet. All data the user generates is stored locally on the client-side (browser). The acquisition of the zero-knowledge proof (ZK proof) is done through a call to the [Mysten Labs-maintained proving service](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#call-the-mysten-labs-maintained-proving-service). Therefore, running the example does not require an additional deployed backend server (or a Docker container).

## Storage locations for key data [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example\#storage-locations-for-key-data "Direct link to Storage locations for key data")

The following table lists the storage location for key data the example uses:

| Data | Storage location |
| --- | --- |
| Ephemeral key pair | `window.sessionStorage` |
| Randomness | `window.sessionStorage` |
| User salt | `window.localStorage` |
| Max epoch | `window.localStorage` |

The user salt is stored long-term in the browser's `localStorage`. Consequently, provided the `localStorage` is not cleared manually, you can use the same JWT (in this example, logging in with the same Google account) to access the corresponding zkLogin address generated from the current salt value at any time.

caution

Changing browsers or devices results in the inability to access previously generated Sui zkLogin addresses, even when using the same JWT.

## Troubleshooting [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example\#troubleshooting "Direct link to Troubleshooting")

- **ZK Proof request failure:**
  - This might occur because of inconsistencies in the creation of multiple randomness or user salts, causing request failures. Click the **Reset Button** in the top right corner of the UI to restart the entire process.
- **Request test tokens failure:**
  - This is because you have surpassed the faucet server request frequency limitations.
  - You can go to Sui [#devnet-faucet](https://discord.com/channels/916379725201563759/971488439931392130) or [#testnet-faucet](https://discord.com/channels/916379725201563759/1037811694564560966) Discord channels to claim test coins.
- Any suggestions are welcome on the project's GitHub repo through raised issues, and of course, pull requests are highly appreciated.


## Related links [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example\#related-links "Direct link to Related links")

- [zkLogin Integration Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [zkLogin FAQ](https://docs.sui.io/concepts/cryptography/zklogin#faq)
- [Configure OpenID Providers](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account)

- [Operating environment](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example#operating-environment)
- [Storage locations for key data](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example#storage-locations-for-key-data)
- [Troubleshooting](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example#troubleshooting)
- [Related links](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example#related-links)