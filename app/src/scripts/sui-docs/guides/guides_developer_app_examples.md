# https://docs.sui.io/guides/developer/app-examples

[Skip to main content](https://docs.sui.io/guides/developer/app-examples#__docusaurus_skipToContent_fallback)

On this page

The ever-growing number of examples in this section showcase packages for the Sui blockchain. Extract techniques used in these examples to apply to your own Sui projects as they are written by Sui and Move experts.

caution

Use dedicated nodes/shared services rather than public endpoints for production apps. The public endpoints maintained by Mysten Labs ( `fullnode.<NETWORK>.sui.io:443`) are rate-limited, and support only 100 requests per 30 seconds. Do not use public endpoints in production applications with high traffic volume.

You can either run your own Full nodes, or outsource this to a professional infrastructure provider (preferred for apps that have high traffic). You can find a list of reliable RPC endpoint providers for Sui on the [Sui Dev Portal](https://sui.io/developers#dev-tools) using the **Node Service** tag.

## Examples [​](https://docs.sui.io/guides/developer/app-examples\#examples "Direct link to Examples")

Sui is dedicated to providing a wide range of examples to guide you in proper programming techniques for the Sui blockchain. This list will continue to grow, so check back often.

tip

The projects are grouped by stack type and are sorted by complexity.

### Full-stack apps [​](https://docs.sui.io/guides/developer/app-examples\#full-stack-apps "Direct link to Full-stack apps")

- [Distributed Counter](https://docs.sui.io/guides/developer/app-examples/e2e-counter): An end-to-end example that creates a basic decentralized counter that anyone can increment, but only the object owner can reset it. The example includes Move code to create the package and leverages the Sui TypeScript SDK to provide a basic frontend.
- [Trustless Swap](https://docs.sui.io/guides/developer/app-examples/trustless-swap): This example demonstrates trustless swaps on the Sui blockchain using a shared object as an escrow account.
- [Coin Flip](https://docs.sui.io/guides/developer/app-examples/coin-flip): The Coin Flip app demonstrates on-chain randomness.
- [Reviews Rating](https://docs.sui.io/guides/developer/app-examples/reviews-rating): This example demonstrates implementing a reviews-rating platform for the food service industry on Sui.
- [Blackjack](https://docs.sui.io/guides/developer/app-examples/blackjack): This example demonstrates the logic behind an on-chain version of the popular casino card game, Blackjack.
- [Plinko](https://docs.sui.io/guides/developer/app-examples/plinko): This example puts the classic Plinko game on chain, demonstrating use of cryptography-based strategies to create a fair and transparent game of chance.

### Smart contracts [​](https://docs.sui.io/guides/developer/app-examples\#smart-contracts "Direct link to Smart contracts")

- [Tic-tac-toe](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe): Three implementations of the classic tic-tac-toe game on the Sui network to demonstrate different approaches to user interaction.

### Smart contracts & Backend [​](https://docs.sui.io/guides/developer/app-examples\#smart-contracts--backend "Direct link to Smart contracts & Backend")

- [Weather Oracle](https://docs.sui.io/guides/developer/app-examples/weather-oracle): The Sui Weather Oracle demonstrates how to create a basic weather oracle that provides real-time weather data.

- [Examples](https://docs.sui.io/guides/developer/app-examples#examples)
  - [Full-stack apps](https://docs.sui.io/guides/developer/app-examples#full-stack-apps)
  - [Smart contracts](https://docs.sui.io/guides/developer/app-examples#smart-contracts)
  - [Smart contracts & Backend](https://docs.sui.io/guides/developer/app-examples#smart-contracts--backend)