# https://docs.sui.io/guides/developer/advanced

[Skip to main content](https://docs.sui.io/guides/developer/advanced#__docusaurus_skipToContent_fallback)

On this page

Information in the Advanced Topics section covers coding practices, useful features, and other developer-focused considerations that might arise as you continue your development journey on Sui. The topics in this section aren't necessarily more difficult than other topics, but they include subjects you might not encounter or need to consider until you're developing more advanced solutions on the Sui network.

## Custom Indexer [​](https://docs.sui.io/guides/developer/advanced\#custom-indexer "Direct link to Custom Indexer")

You can build custom indexers using the Sui micro-data ingestion framework. To create an indexer, you subscribe to a checkpoint stream with full checkpoint content. Establishing a custom indexer helps improve latency, allows pruning the data of your Sui Full node, and provides efficient assemblage of checkpoint data.

Go to [Custom Indexer](https://docs.sui.io/guides/developer/advanced/custom-indexer).

## Migrating to GraphQL [​](https://docs.sui.io/guides/developer/advanced\#migrating-to-graphql "Direct link to Migrating to GraphQL")

See the Migrating to GraphQL guide to upgrade your smart contracts to use the GraphQL API.

This guide compares JSON-RPC queries to their equivalent GraphQL counterpart. While it is possible to systematically rewrite JSON-RPC queries (for example, `sui_getTotalTransactionBlocks`) to their GraphQL counterparts using this guide, it is recommended that you revisit your application's query patterns to take full advantage of the flexibility that GraphQL offers in serving queries that touch multiple potentially nested endpoints (for example transactions, balances, coins), and use the following examples to get a flavor of how the two APIs express similar concepts.

Go to [Migrating to GraphQL](https://docs.sui.io/guides/developer/advanced/graphql-migration).

- [Custom Indexer](https://docs.sui.io/guides/developer/advanced#custom-indexer)
- [Migrating to GraphQL](https://docs.sui.io/guides/developer/advanced#migrating-to-graphql)