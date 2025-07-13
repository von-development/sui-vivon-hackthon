# https://docs.sui.io/guides/developer/advanced/graphql-migration

[Skip to main content](https://docs.sui.io/guides/developer/advanced/graphql-migration#__docusaurus_skipToContent_fallback)

On this page

⚙️Early-Stage Feature

This content describes an alpha/beta feature or service. These early stage features and services are in active development, so details are likely to change.

This feature or service is currently available in

- Devnet
- Testnet
- Mainnet

This guide compares JSON-RPC queries to their equivalent GraphQL counterpart. While it is possible to systematically rewrite JSON-RPC queries (for example, `sui_getTotalTransactionBlocks`) to their GraphQL counterparts using this guide, it is recommended that you revisit your application's query patterns to take full advantage of the flexibility that GraphQL offers in serving queries that touch multiple potentially nested endpoints (for example transactions, balances, coins), and use the following examples to get a flavor of how the two APIs express similar concepts.

For a comprehensive list of all available GraphQL features, consult the [reference](https://docs.sui.io/references/sui-graphql).

info

Refer to [Access Sui Data](https://docs.sui.io/guides/developer/getting-started/data-serving) for an overview of options to access Sui network data.

Based on valuable feedback from the community, the GraphQL RPC release stage has been updated from beta to alpha. Refer to the high-level timeline for beta and GA releases in the previously linked document.

### Example 1: Get total transaction blocks [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#example-1-get-total-transaction-blocks "Direct link to Example 1: Get total transaction blocks")

The goal is to get the total number of transaction blocks in the network.

- JSON-RPC
- GraphQL

```codeBlockLines_p187
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sui_getTotalTransactionBlocks",
  "params": []
}

```

### Example 2: Get a specific transaction block [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#example-2-get-a-specific-transaction-block "Direct link to Example 2: Get a specific transaction block")

The goal is to get the transaction block by its digest.

- JSON-RPC
- GraphQL

```codeBlockLines_p187
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sui_getTransactionBlock",
  "params": [\
    "Hay2tj3GcDYcE3AMHrej5WDsHGPVAYsegcubixLUvXUF",\
    {\
      "showInput": true,\
      "showRawInput": false,\
      "showEffects": true,\
      "showEvents": true,\
      "showObjectChanges": false,\
      "showBalanceChanges": false\
    }\
  ]
}

```

### Example 3: Get coin objects owned by an address [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#example-3-get-coin-objects-owned-by-an-address "Direct link to Example 3: Get coin objects owned by an address")

The goal is to return all `Coin<0x2::sui::SUI>` objects an address owns.

- JSON-RPC
- GraphQL

```codeBlockLines_p187
query {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "suix_getCoins",
  "params": [\
    "0x5094652429957619e6efa79a404a6714d1126e63f551f4b6c7fb76440f8118c9", //owner\
    "0x2::sui::SUI",                                                      //coin type\
    "0xe5c651321915b06c81838c2e370109b554a448a78d3a56220f798398dde66eab", //cursor\
    3 //limit\
  ]
}

```

## New features [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#new-features "Direct link to New features")

There are also things that GraphQL can do, which JSON-RPC cannot:

### Example 4: Getting objects by type [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#example-4-getting-objects-by-type "Direct link to Example 4: Getting objects by type")

This query fetches the latest versions of objects of type `0x2::package::Publisher` that are currently live on-chain.

```codeBlockLines_p187
query {
  objects(filter: { type: "0x2::package::Publisher" }) {
    nodes {
      address
      digest
      asMoveObject {
        contents { json }
      }
    }
  }
}

```

### Example 5: Paging through package versions [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#example-5-paging-through-package-versions "Direct link to Example 5: Paging through package versions")

The goal is to find all versions of the Sui framework, and list their modules:

```codeBlockLines_p187
query {
  packageVersions(address: "0x2") {
    nodes {
      version
      modules {
        nodes {
          name
        }
      }
    }
  }
}

```

## Related links [​](https://docs.sui.io/guides/developer/advanced/graphql-migration\#related-links "Direct link to Related links")

- [GraphQL reference](https://docs.sui.io/references/sui-graphql): Auto-generated GraphQL reference for Sui RPC.
- [GraphQL quick-start](https://docs.sui.io/guides/developer/getting-started/graphql-rpc): Querying Sui RPC with GraphQL gets you started using GraphQL to query the Sui RPC for on-chain data.
- [GraphQL concepts](https://docs.sui.io/concepts/graphql-rpc): GraphQL for Sui RPC examines the elements of GraphQL that you should know to get the most from the service.

- [Example 1: Get total transaction blocks](https://docs.sui.io/guides/developer/advanced/graphql-migration#example-1-get-total-transaction-blocks)
- [Example 2: Get a specific transaction block](https://docs.sui.io/guides/developer/advanced/graphql-migration#example-2-get-a-specific-transaction-block)
- [Example 3: Get coin objects owned by an address](https://docs.sui.io/guides/developer/advanced/graphql-migration#example-3-get-coin-objects-owned-by-an-address)
- [New features](https://docs.sui.io/guides/developer/advanced/graphql-migration#new-features)
  - [Example 4: Getting objects by type](https://docs.sui.io/guides/developer/advanced/graphql-migration#example-4-getting-objects-by-type)
  - [Example 5: Paging through package versions](https://docs.sui.io/guides/developer/advanced/graphql-migration#example-5-paging-through-package-versions)
- [Related links](https://docs.sui.io/guides/developer/advanced/graphql-migration#related-links)