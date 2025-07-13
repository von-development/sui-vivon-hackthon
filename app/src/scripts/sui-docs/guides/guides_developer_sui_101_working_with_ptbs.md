# https://docs.sui.io/guides/developer/sui-101/working-with-ptbs

[Skip to main content](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs#__docusaurus_skipToContent_fallback)

On this page

Programmable transaction blocks (PTBs) are key elements of the Sui ecosystem. Understanding PTBs and using them correctly are key fundamentals to creating efficient and cost-effective smart contracts. See [Programmable Transaction Blocks](https://docs.sui.io/concepts/transactions/prog-txn-blocks) to learn about the structure of PTBs on Sui.

The topics in this section focus on effectively utilizing PTBs in your smart contracts.

## Building Programmable Transaction Blocks [​](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs\#building-programmable-transaction-blocks "Direct link to Building Programmable Transaction Blocks")

To fully appreciate the possibilities PTBs offer, you must build them. Using tools like the [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript), you can begin to understand the power and flexibility they provide.

Go to [Building Programmable Transaction Blocks](https://docs.sui.io/guides/developer/sui-101/building-ptb).

## Coin Management [​](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs\#coin-management "Direct link to Coin Management")

`Coin` objects on Sui are different than other blockchains in that they are [owned objects](https://docs.sui.io/concepts/object-ownership/address-owned). Whether you need your smart contract to utilize SUI for gas payments or deal with generic coins, understanding coin management is crucial. Smart contracts use common patterns to accept coins and the PTBs you create must provide the correct interface to those smart contracts to facilitate successful transactions.

Go to [Coin Management](https://docs.sui.io/guides/developer/sui-101/coin-mgt).

## Simulating References [​](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs\#simulating-references "Direct link to Simulating References")

The [`borrow` module](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui-framework/sui/borrow.md) of the Sui framework offers some features you can use when your PTBs use objects by reference.

Go to [Simulating References](https://docs.sui.io/guides/developer/sui-101/simulating-refs).

## Related links [​](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs\#related-links "Direct link to Related links")

Review this content for a complete picture of PTBs on Sui.

- [Programmable Transaction Blocks](https://docs.sui.io/concepts/transactions/prog-txn-blocks): Conceptual overview of the PTB architecture.
- [Life of a Transaction](https://docs.sui.io/concepts/sui-architecture/transaction-lifecycle): Discover the life of a transaction from inception to finality.

- [Building Programmable Transaction Blocks](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs#building-programmable-transaction-blocks)
- [Coin Management](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs#coin-management)
- [Simulating References](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs#simulating-references)
- [Related links](https://docs.sui.io/guides/developer/sui-101/working-with-ptbs#related-links)