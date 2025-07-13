# https://docs.sui.io/guides/developer/getting-started/graphql-rpc

[Skip to main content](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#__docusaurus_skipToContent_fallback)

On this page

info

Refer to [Access Sui Data](https://docs.sui.io/guides/developer/getting-started/data-serving) for an overview of options to access Sui network data.

Based on valuable feedback from the community, the GraphQL RPC release stage has been updated from beta to alpha. Refer to the high-level timeline for beta and GA releases in the previously linked document.

The quickest way to access the GraphQL service for Sui RPC is through the online IDE that provides a complete toolbox for fetching data and executing transactions on the network. The online IDE provides features such as auto-completion (use Ctrl+Space or just start typing), built-in documentation (Book icon, top-left), multi-tabs, and more.

The online IDE is available for [Mainnet](https://sui-mainnet.mystenlabs.com/graphql) and [Testnet](https://sui-testnet.mystenlabs.com/graphql). This guide contains various queries that you can try directly in the IDE.

info

- Any existing addresses/object IDs in these examples refer to `mainnet` data only.
- Both [mainnet](https://sui-mainnet.mystenlabs.com/graphql) and [testnet](https://sui-testnet.mystenlabs.com/graphql) services are rate-limited to keep network throughput optimized.

For more details about some concepts used in the examples below, please see the [GraphQL concepts](https://docs.sui.io/concepts/graphql-rpc) page, and consult the [reference](https://docs.sui.io/references/sui-graphql) for full documentation on the supported schema.

## Discovering the schema [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#discovering-the-schema "Direct link to Discovering the schema")

GraphQL introspection exposes the schema supported by the RPC service. The IDE's "Docs" pane (Book icon, top-left) and Search dialog ( `Cmd` + `K` on macOS or `Ctrl` + `K` on Windows and Linux) offer a way to browse introspection output interactively.

The [official documentation](https://graphql.org/learn/introspection/) provides an overview on introspection, and how to interact with it programmatically.

## Finding the reference gas price for latest epoch [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-the-reference-gas-price-for-latest-epoch "Direct link to Finding the reference gas price for latest epoch")

```codeBlockLines_p187
query {
  epoch {
    referenceGasPrice
  }
}

```

## Finding information about a specific historical epoch [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-information-about-a-specific-historical-epoch "Direct link to Finding information about a specific historical epoch")

This example finds the total stake rewards, the reference gas price, the number of checkpoints and the total gas fees for epoch 100. Note that in the query, the `id` argument is optional, and defaults to the latest epoch.

```codeBlockLines_p187
query {
  epoch(id: 100) # note that id is optional, and without it, latest epoch is returned
  {
    epochId
    totalStakeRewards
    referenceGasPrice
    totalCheckpoints
    totalGasFees
    totalStakeSubsidies
    storageFund {
      totalObjectStorageRebates
      nonRefundableBalance
    }
  }
}

```

## Finding a transaction block by its digest [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-a-transaction-block-by-its-digest "Direct link to Finding a transaction block by its digest")

This example gets a transaction block by its digest and shows information such as the gas sponsor's address, the gas price, the gas budget, and effects from executing that transaction block.

```codeBlockLines_p187
query {
  transactionBlock(digest: "FdKFgsQ9iRrxW6b1dh9WPGuNuaJWMXHJn1wqBQSqVqK2") {
    gasInput {
      gasSponsor {
        address
      }
      gasPrice
      gasBudget
    }
    effects {
      status
      timestamp
      checkpoint {
        sequenceNumber
      }
      epoch {
        epochId
        referenceGasPrice
      }
    }
  }
}

```

## Finding the last ten transactions that are not a system transaction [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-the-last-ten-transactions-that-are-not-a-system-transaction "Direct link to Finding the last ten transactions that are not a system transaction")

```codeBlockLines_p187
query {
  transactionBlocks(last: 10, filter: {kind: PROGRAMMABLE_TX}) {
    nodes {
      digest
      kind {
        __typename
      }
    }
  }
}

```

## Finding all transactions that touched a given object [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-all-transactions-that-touched-a-given-object "Direct link to Finding all transactions that touched a given object")

This example finds all the transactions that touched (modified/transferred/deleted) a given object. This is useful for when we want to trace the flow of a Coin/StakeSui/NFT.

info

This example uses GraphQL [variables](https://docs.sui.io/concepts/graphql-rpc#variables) and [pagination](https://docs.sui.io/concepts/graphql-rpc#pagination). When using the online IDE, copy the variables JSON to the "Variables" window, below the main editor.

```codeBlockLines_p187
query ($objectID: SuiAddress!) {
  transactionBlocks(filter: {changedObject: $objectID}) {
    nodes {
      sender {
        address
      }
      digest
      effects {
        objectChanges {
          nodes {
            address
          }
        }
      }
    }
  }
}

```

**Variables**:

```codeBlockLines_p187
{
  "objectID": "0x11c6ae8432156527fc2e12e05ac7db79f2e972510a823a4ef2e670f27ad7b52f"
}

```

## Filtering transaction blocks by a function [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#filtering-transaction-blocks-by-a-function "Direct link to Filtering transaction blocks by a function")

This example finds the last ten transaction blocks that called the `public_transfer` function, (as a move call transaction command).

info

This example makes usage of the filter `last`, which indicates that the user only wants the last ten transaction blocks known to the service.

```codeBlockLines_p187
{
  transactionBlocks(
    last: 10,
      filter: {
        function: "0x2::transfer::public_transfer"
      }
  ) {
    nodes { digest }
  }
}

```

## Finding transaction balance changes [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#finding-transaction-balance-changes "Direct link to Finding transaction balance changes")

This example finds the balance changes of all the transactions where a given address called a staking-related function. This is useful when you want to get your staking or unstaking history.

```codeBlockLines_p187
query ($address: SuiAddress!) {
  transactionBlocks(filter: {
    function: "0x3::sui_system::request_add_stake"
    sentAddress: $address
  }) {
    nodes {
      digest
      effects {
        balanceChanges {
          nodes {
            owner {
              address
            }
            amount
          }
        }
      }
    }
  }
}

```

**Variables**:

```codeBlockLines_p187
{
  "address": "0xa9ad44383140a07cc9ea62d185c12c4d9ef9c6a8fd2f47e16316229815862d23"
}

```

## Fetching a dynamic field on an object [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#fetching-a-dynamic-field-on-an-object "Direct link to Fetching a dynamic field on an object")

info

This example uses aliases and [fragments](https://docs.sui.io/concepts/graphql-rpc#fragments).

```codeBlockLines_p187
query DynamicField {
  object(
    address: "0xb57fba584a700a5bcb40991e1b2e6bf68b0f3896d767a0da92e69de73de226ac"
  ) {
    dynamicField(
      name: {
        type: "0x2::kiosk::Lock",
        bcs: "NLArx1UJguOUYmXgNG8Pv8KbKXLjWtCi6i0Yeq1Vhfw=",
      }
    ) {
      ...DynamicFieldSelect
    }
  }
}

fragment DynamicFieldSelect on DynamicField {
  name {
    ...MoveValueFields
  }
  value {
    ...DynamicFieldValueSelection
  }
}

fragment DynamicFieldValueSelection on DynamicFieldValue {
  __typename
  ... on MoveValue {
    ...MoveValueFields
  }
  ... on MoveObject {
    hasPublicTransfer
    contents {
      ...MoveValueFields
    }
  }
}

fragment MoveValueFields on MoveValue {
  type {
    repr
  }
  data
  bcs
}

```

## Fetching all dynamic fields on an object [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#fetching-all-dynamic-fields-on-an-object "Direct link to Fetching all dynamic fields on an object")

This query can be used to paginate over the dynamic fields of an object. This works even when the object in question is [wrapped](https://docs.sui.io/concepts/object-ownership/wrapped), by using the [owner](https://docs.sui.io/references/sui-api/sui-graphql/reference/queries/owner) query, so can be used for iterating over the elements of on-chain data structures, like tables and bags. See [The Move Book](https://move-book.com/programmability/dynamic-collections.html) to learn more about dynamic collections available in Move.

info

This example uses [fragments](https://docs.sui.io/concepts/graphql-rpc#fragments) and [variables](https://docs.sui.io/concepts/graphql-rpc#variables).

```codeBlockLines_p187
query ($id: SuiAddress!) {
  owner(address: $id) {
    dynamicFields {
      nodes {
        name { ...Value }
        value {
          __typename
          ... on MoveValue {
            ...Value
          }
          ... on MoveObject {
            contents {
              ...Value
            }
          }
        }
      }
    }
  }
}

fragment Value on MoveValue {
  type {
    repr
  }
  json
}

```

## Paginating checkpoints forward, five at a time [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#page-forward "Direct link to Paginating checkpoints forward, five at a time")

```codeBlockLines_p187
query ($after: String) {
  checkpoints(first: 5, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      digest
      timestamp
    }
  }
}

```

Sets up a paginated query, starting at the genesis checkpoint, reading five checkpoints at a time, in increasing order of sequence number. The value of `pageInfo.hasNextPage` determines whether there is another page to be read, and the value of `pageInfo.endCursor` is fed back in as the cursor to read `$after`.

info

This example uses GraphQL [variables](https://docs.sui.io/concepts/graphql-rpc#variables) and [pagination](https://docs.sui.io/concepts/graphql-rpc#pagination).

## Paginating checkpoints backwards, five at a time [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#page-back "Direct link to Paginating checkpoints backwards, five at a time")

```codeBlockLines_p187
query ($before: String) {
  checkpoints(last: 5, before: $before) {
    pageInfo {
      hasPreviousPage
      startCursor
    }
    nodes {
      digest
      timestamp
    }
  }
}

```

Sets up a paginated query, starting at the latest indexed checkpoint, reading five checkpoints at a time, in decreasing order of sequence number. The value of `pageInfo.hasPreviousPage` determines whether there is another page to be read, and the value of `pageInfo.startCursor` is fed back in as the cursor to read `$before`.

info

This example uses GraphQL [variables](https://docs.sui.io/concepts/graphql-rpc#variables) and [pagination](https://docs.sui.io/concepts/graphql-rpc#pagination).

## Executing a transaction [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#executing-a-transaction "Direct link to Executing a transaction")

Transaction execution takes in two arguments, `txBytes` and `signatures`. `txBytes` is the serialized unsigned transaction data, which can be generated when using the Sui CLI's `client call` [command](https://docs.sui.io/references/cli/client), to call a Move function by passing the `--serialize-unsigned-transaction` flag. The `signatures` can be generated using Sui CLI's [keytool](https://docs.sui.io/references/cli/keytool) command `sui keytool sign`. More information on Sui CLI can be found [here](https://docs.sui.io/references/cli).

```codeBlockLines_p187
mutation ($tx: String!, $sigs: [String!]!) {
  executeTransactionBlock(txBytes: $tx, signatures: $sigs) {
    errors
    effects {
      status
      epoch {
        startTimestamp
      }
      gasEffects {
        gasSummary {
          computationCost
        }
      }
    }
  }
}

```

**Variables**:

```codeBlockLines_p187
{
  "tx": "AAACACAZXApmrHgzTs3FGDyXWka+wmMCy2IwOdKLmTWHb5PnFQEASlCnLAw4qfzLF3unH9or5/L7YpOlReaSEWfoEwhTqpavSxAAAAAAACCUFUCOn8ljIxcG9O+CA1bzqjunqr4DLDSzSoNCkUvu2AEBAQEBAAEAALNQHmLi4jgC5MuwwmiMvZEeV5kuyh+waCS60voE7fpzAa3v/tOFuqDvQ+bjBpKTfjyL+6yIg+5eC3dKReVwghH/rksQAAAAAAAgxtZtKhXTr1zeFAo1JzEqVKn9J1H74ddbCJNVZGo2I1izUB5i4uI4AuTLsMJojL2RHleZLsofsGgkutL6BO36c+gDAAAAAAAAQEIPAAAAAAAA",
  "sigs": [\
    "AB4ZihXxUMSs9Ju5Cstuuf/hvbTvvycuRk2TMuagLYNJgQuAeXmKyJF9DAXUtL8spIsHrDQgemn4NmojcNl8HQ3JFqhnaTC8gMX4fy/rGgqgL6CDcbikawUUjC4zlkflwg=="\
  ]
}

```

## Other examples [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#other-examples "Direct link to Other examples")

You can find other examples in the [repository](https://github.com/MystenLabs/sui/tree/releases/sui-graphql-rpc-v2024.1.0-release/crates/sui-graphql-rpc/examples), grouped into sub-directories. For example, there are directories for [transaction block effects](https://github.com/MystenLabs/sui/tree/releases/sui-graphql-rpc-v2024.1.0-release/crates/sui-graphql-rpc/examples/transaction_block_effects), [protocol configs](https://github.com/MystenLabs/sui/tree/releases/sui-graphql-rpc-v2024.1.0-release/crates/sui-graphql-rpc/examples/protocol_configs), [stake connection](https://github.com/MystenLabs/sui/tree/releases/sui-graphql-rpc-v2024.1.0-release/crates/sui-graphql-rpc/examples/stake_connection), and more.

info

Examples in the repository are designed to work with the version of GraphQL built at the same revision. The links above point to examples intended for [GraphQL v2024.1](https://github.com/MystenLabs/sui/tree/releases/sui-graphql-rpc-v2024.1.0-release), the latest production version at the time of writing.

## Related links [​](https://docs.sui.io/guides/developer/getting-started/graphql-rpc\#related-links "Direct link to Related links")

- [GraphQL migration](https://docs.sui.io/guides/developer/advanced/graphql-migration): Migrating to GraphQL guides you through migrating Sui RPC projects from JSON-RPC to GraphQL.
- [GraphQL concepts](https://docs.sui.io/concepts/graphql-rpc): GraphQL for Sui RPC examines the elements of GraphQL that you should know to get the most from the service.
- [GraphQL reference](https://docs.sui.io/references/sui-graphql): Auto-generated GraphQL reference for Sui RPC.
- [Sui Testnet GraphiQL](https://sui-testnet.mystenlabs.com/graphql): Sui GraphiQL IDE for the Testnet network.
- [Sui Mainnet GraphiQL](https://sui-mainnet.mystenlabs.com/graphql): Sui GraphiQL IDE for the Mainnet network.

- [Discovering the schema](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#discovering-the-schema)
- [Finding the reference gas price for latest epoch](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-the-reference-gas-price-for-latest-epoch)
- [Finding information about a specific historical epoch](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-information-about-a-specific-historical-epoch)
- [Finding a transaction block by its digest](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-a-transaction-block-by-its-digest)
- [Finding the last ten transactions that are not a system transaction](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-the-last-ten-transactions-that-are-not-a-system-transaction)
- [Finding all transactions that touched a given object](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-all-transactions-that-touched-a-given-object)
- [Filtering transaction blocks by a function](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#filtering-transaction-blocks-by-a-function)
- [Finding transaction balance changes](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#finding-transaction-balance-changes)
- [Fetching a dynamic field on an object](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#fetching-a-dynamic-field-on-an-object)
- [Fetching all dynamic fields on an object](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#fetching-all-dynamic-fields-on-an-object)
- [Paginating checkpoints forward, five at a time](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#page-forward)
- [Paginating checkpoints backwards, five at a time](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#page-back)
- [Executing a transaction](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#executing-a-transaction)
- [Other examples](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#other-examples)
- [Related links](https://docs.sui.io/guides/developer/getting-started/graphql-rpc#related-links)