# https://docs.sui.io/concepts/components

[Skip to main content](https://docs.sui.io/concepts/components#__docusaurus_skipToContent_fallback)

On this page

The name Sui, pronounced swē in English, is derived from a Japanese word for the element of water. You can see this influence in the name of the blockchain, its native token elements (SUI and MIST), and the imagery used in its branding.

When you read about Sui in this documentation, it's referencing all the pieces of the system that comprise the blockchain. This includes the blockchain itself, its various networks (Mainnet, for example), the activity on the blockchain (transaction blocks), the distributed entities that verify this activity (validators), and the Full nodes that execute transaction blocks. The documentation refers to the entirety of these elements as the Sui platform, or simply Sui.

## The Sui blockchain [​](https://docs.sui.io/concepts/components\#the-sui-blockchain "Direct link to The Sui blockchain")

Sui is defined as a Layer 1 protocol blockchain. In basic terms, this means that Sui performs its own consensus and validation for transaction blocks (activity) on its networks using its own native token (SUI, in this case). Ethereum (ETH) and Bitcoin (BTC) are other examples of Layer 1 blockchains.

Layer 2 blockchains, by contrast, leverage the infrastructure of Layer 1 networks, relying on the Layer 1 blockchain to finalize transaction blocks. Polygon (MATIC) is an example of a Layer 2 blockchain that extends Ethereum.

## SUI tokens [​](https://docs.sui.io/concepts/components\#sui-tokens "Direct link to SUI tokens")

The native token for Sui is SUI. Whenever the documentation mentions SUI (all uppercase letters), it's referring to this token. Transaction blocks on Sui often deal with small fractions of the value of one SUI. To make these transaction blocks easier to work with, Sui provides MIST. It takes one billion MIST to equal one SUI.

There is a cost associated with everything, and blockchain transactions are no exception. It costs money to provide computational power to process transaction blocks and store their results. The term for the cost of processing transaction blocks is "gas". You pay for gas and the cost of storing data with a blockchain's native tokens, in this case, SUI (or MIST).

To learn more about the tokenomics of Sui, see the following topics:

- [Sui Tokenomics](https://docs.sui.io/concepts/tokenomics)
- [Gas in Sui](https://docs.sui.io/concepts/tokenomics/gas-in-sui)
- [Gas Pricing](https://docs.sui.io/concepts/tokenomics/gas-pricing)
- [Staking and Unstaking](https://docs.sui.io/concepts/tokenomics/staking-unstaking)
- [Sui Bridging](https://docs.sui.io/concepts/tokenomics/sui-bridging)

## Delegated proof-of-stake consensus [​](https://docs.sui.io/concepts/components\#delegated-proof-of-stake-consensus "Direct link to Delegated proof-of-stake consensus")

Sui uses a delegated proof-of-stake (DPoS) consensus mechanism to validate on-chain transaction blocks. This means that validators on the Sui network must have a certain amount of SUI secured on Sui Mainnet, either with their own funds or in partnership with Sui Foundation, to prove their interest in the security of the blockchain. This approach aligns the interest of all validators with that of Sui users (an efficient, secure blockchain), without the high energy-resource demands of earlier blockchains.

To learn more about consensus on Sui, see the following guides and topics:

- [Validator Committee](https://docs.sui.io/guides/operator/validator-committee)
- [Sui Full Node Data Management](https://docs.sui.io/guides/operator/data-management)

## Sui networks [​](https://docs.sui.io/concepts/components\#sui-networks "Direct link to Sui networks")

Sui has several networks available, each serving a different purpose.

- **Mainnet:** The network that processes production transaction blocks. When you trade SUI or NFTs that are ultimately based on fiat currency, you are doing so on the Mainnet network of Sui.
- **Testnet:** Staging network to provide quality assurance that any planned changes to Sui do not adversely impact performance. Developers can use this network to test their code before placing it in production.
- **Devnet:** A more unstable network that is used to develop new features. Developers can leverage this network to code against the latest planned features of Sui.
- **Localnet:** You can run a Sui network on your local computer. Developing on a local network provides an optimized workflow in an environment you control.

To learn more about these networks and how to interact with them, see the following guides:

- [Create a Local Sui Network](https://docs.sui.io/guides/developer/getting-started/local-network)
- [Connect to Sui](https://docs.sui.io/guides/developer/getting-started/connect)

## Move [​](https://docs.sui.io/concepts/components\#move "Direct link to Move")

The Move language provides the logic for all activity on Sui, like trading NFTs, playing Sui-integrated games (dApps), and all other transaction-based events. The Sui platform uses a concept novel to earlier blockchains, where blocks on the chain are actually objects that define assets rather than simple key-value stores that define addresses. The increased programmability inherent with objects required a more robust logic engine to maximize the benefits of this new approach to blockchain technology.

To learn more about Move, see [Move Concepts](https://docs.sui.io/concepts/sui-move-concepts).

- [The Sui blockchain](https://docs.sui.io/concepts/components#the-sui-blockchain)
- [SUI tokens](https://docs.sui.io/concepts/components#sui-tokens)
- [Delegated proof-of-stake consensus](https://docs.sui.io/concepts/components#delegated-proof-of-stake-consensus)
- [Sui networks](https://docs.sui.io/concepts/components#sui-networks)
- [Move](https://docs.sui.io/concepts/components#move)