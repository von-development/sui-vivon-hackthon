[Skip to main content](https://docs.sui.io/guides/developer/getting-started/get-address#__docusaurus_skipToContent_fallback)

On this page

An address is a way to uniquely and anonymously identify an account that exists on the Sui blockchain network. In other words, an address is a way for a user to store and use tokens on the Sui network, without providing any personally identifying information (such as email address, phone number, and so on). For example, if you want to purchase a number of SUI tokens to play a game, you must specify an address where these tokens are to be deposited.

The Sui address is unique, similarly to the way a social security number or a personal identification number is unique to one person. However, in Sui you can create and own multiple addresses, all of which are unique.

In Sui, an address is 32 bytes and is often encoded in hexadecimal with a `0x` prefix. For example, this is a valid Sui address: `0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331`. You can use a Sui network explorer to find more information about this address and the objects it owns.

If you'd like to understand how a Sui address is derived from private keys and other cryptography related topics, see the [Keys and Addresses](https://docs.sui.io/concepts/cryptography/transaction-auth/keys-addresses) topic.

## How to obtain a Sui address [​](https://docs.sui.io/guides/developer/getting-started/get-address\#how-to-obtain-a-sui-address "Direct link to How to obtain a Sui address")

Sui provides multiple ways to obtain a Sui address. The following are the two most common.

### Command line interface [​](https://docs.sui.io/guides/developer/getting-started/get-address\#command-line-interface "Direct link to Command line interface")

If you are using the Sui command line interface (CLI) to interact with the Sui network, you can use the `sui client` command to generate a new address. By default, when the Sui CLI runs for the first time it will prompt you to set up your local wallet, and then it generates one Sui address and the associated secret recovery phrase. Make sure you write down the secret recovery phrase and store it in a safe place.

To generate a new Sui address use `sui client new-address ed25519`, which specifies the keypair scheme flag to be of type `ed25519`.

For more information, see the [Sui Client CLI](https://docs.sui.io/references/cli/client) documentation.

To see all the generated addresses in the local wallet on your machine, run `sui keytool list`. For more information about the keytool options, see the [Sui Keytool CLI](https://docs.sui.io/references/cli/keytool) documentation.

danger

The private keys associated with the Sui addresses are stored locally on the machine where the CLI is installed, in the `~/.sui/sui_config/sui.keystore` file. Make sure you do not expose this to anyone, as they can use it to get access to your account.

### Sui wallets [​](https://docs.sui.io/guides/developer/getting-started/get-address\#sui-wallets "Direct link to Sui wallets")

One of the most straightforward ways to obtain a Sui address for first-time users is through wallets that access the Sui network. Unlike the cli option, wallets connected to the Sui network provide visual workflows that might be preferable to some users. The Sui Foundation does not offer this type of wallet, but there are several options available from builders on the Sui network.

The following Chrome extension wallets integrate with your browser and have a UI workflow that walks you through the process of creating an address. Consult documentation for your chosen extension for the exact process of obtaining an address.

info

Links to these extensions are provided for your convenience. Their inclusion is not an endorsement, recommendation, or approval of any kind. Perform your own due diligence before making a decision on what extension to use.

- [Slush — A Sui wallet](https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil): Formerly known as Sui Wallet, Slush is a wallet from the same team that built Sui - Mysten Labs.
- [Suiet \| Sui Wallet](https://chromewebstore.google.com/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd): The Suiet wallet for everyone, built on the Sui blockchain.
- [Glass wallet](https://chromewebstore.google.com/detail/glass-wallet-sui-wallet/loinekcabhlmhjjbocijdoimmejangoa): Glass Wallet is a non-custodial wallet that allows you to control your coins, keys, and NFT securely.
- [Martian Aptos & Sui Wallet Extension](https://chromewebstore.google.com/detail/martian-aptos-sui-wallet/efbglgofoippbgcjepnhiblaibcnclgk): Martian is a self-custodial crypto wallet for Aptos and Sui.
- [Surf Wallet](https://chromewebstore.google.com/detail/surf-wallet/emeeapjkbcbpbpgaagfchmcgglmebnen): Surf Wallet is a platform that allows for convenient and secure transfer of tokens and collection of NFTs on the blockchain.
- Visit the [chrome web store](https://chromewebstore.google.com/search/sui%20wallet) for a complete list of available Sui wallet extensions.

- [How to obtain a Sui address](https://docs.sui.io/guides/developer/getting-started/get-address#how-to-obtain-a-sui-address)
  - [Command line interface](https://docs.sui.io/guides/developer/getting-started/get-address#command-line-interface)
  - [Sui wallets](https://docs.sui.io/guides/developer/getting-started/get-address#sui-wallets)