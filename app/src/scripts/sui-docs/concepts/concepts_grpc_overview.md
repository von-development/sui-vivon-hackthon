# https://docs.sui.io/concepts/grpc-overview

[Skip to main content](https://docs.sui.io/concepts/grpc-overview#__docusaurus_skipToContent_fallback)

On this page

⚙️Early-Stage Feature

This content describes an alpha/beta feature or service. These early stage features and services are in active development, so details are likely to change.

This feature or service is currently available in

- Devnet
- Testnet
- Mainnet

The [Sui Full Node gRPC API](https://docs.sui.io/references/fullnode-protocol) provides a fast, type-safe, and efficient interface for interacting with the Sui blockchain. Designed for power users, indexers, explorers, and decentralized apps, this API enables access to Sui data with high performance and low latency.

info

Refer to [Access Sui Data](https://docs.sui.io/guides/developer/getting-started/data-serving) for an overview of options to access Sui network data.

## What is gRPC? [​](https://docs.sui.io/concepts/grpc-overview\#what-is-grpc "Direct link to What is gRPC?")

gRPC offers a high-performance, efficient communication protocol that uses [Protocol Buffers](https://protobuf.dev/overview/) for fast, compact data serialization. Its strongly typed interfaces reduce runtime errors and simplify client/server development across multiple languages. With built-in support for code generation, you can scaffold clients in Typescript, Go, Rust, and more. This makes it ideal for scalable backend systems like indexers, blockchain explorers, and data-intensive decentralized apps.

In addition to request-response calls, gRPC supports server-side streaming, enabling real-time data delivery without constant polling. This is especially useful in environments where you need to track events and transactions live. gRPC's binary format is significantly faster and lighter than JSON, saving bandwidth and improving latency.

Refer to [when to use gRPC vs GraphQL](https://docs.sui.io/guides/developer/getting-started/data-serving#when-to-use-grpc-vs-graphql-with-indexer-20) to access Sui data.

## gRPC on Sui [​](https://docs.sui.io/concepts/grpc-overview\#grpc-on-sui "Direct link to gRPC on Sui")

Protocol buffers define the gRPC interface. You can find the relevant beta `.proto` files at [sui-rpc-api on Github](https://github.com/MystenLabs/sui/tree/main/crates/sui-rpc-api/proto), which apart from the gRPC messages (request and response payloads) include the following services and types:

- `sui/rpc/v2beta/transaction_execution_service.proto`
- `sui/rpc/v2beta/ledger_service.proto`

These definitions can be used to generate client libraries in various programming languages.

info

There are some proto files in the folder `sui/rpc/v2alpha` as well. Those are in alpha because they are early experimental versions that are subject to change and not recommended for production use.

The `TransactionExecutionService` currently offers a single RPC method: `ExecuteTransaction(ExecuteTransactionRequest)`, which is used to execute a transaction request. Whereas the `LedgerService` includes the core lookup queries for Sui data. Some of the RPCs in that service include:

- `GetObject(GetObjectRequest)`: Retrieves details of a specific on-chain object.
- `GetTransaction(GetTransactionRequest)`: Fetches information about a particular transaction.
- `GetCheckpoint(GetCheckpointRequest)`: Fetches information about a particular checkpoint.

### Field masks [​](https://docs.sui.io/concepts/grpc-overview\#field-masks "Direct link to Field masks")

A [`FieldMask` in Protocol Buffers](https://protobuf.dev/reference/protobuf/google.protobuf/#field-mask) is a mechanism used to specify a subset of fields within a message that should be read, updated, or returned. Instead of retrieving the entire object, a client can request only the specific fields they need by providing a list of field paths. This improves performance and reduces unnecessary data transfer.

In the Sui gRPC API, `FieldMask` s are used in requests like `GetTransaction` to control which parts of the transaction (such as, `effects`, `events`) are included in the response. Field paths must match the structure of the response message. This selective querying is especially useful for building efficient applications and tools.

### Encoding [​](https://docs.sui.io/concepts/grpc-overview\#encoding "Direct link to Encoding")

In the Sui gRPC API, identifiers with standard human-readable formats are represented as `string` s in the proto schema:

- `Address` and `ObjectId`: Represented as 64 hexadecimal characters with a leading `0x`.
- `Digest` s: Represented as [Base58](https://learnmeabitcoin.com/technical/keys/base58/).
- `TypeTag` and `StructTag`: Represented in their canonical string format (for example, `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>`)

## Access using grpcurl [​](https://docs.sui.io/concepts/grpc-overview\#access-using-grpcurl "Direct link to Access using grpcurl")

Simplest way to experiment with gRPC is by using [grpcurl](https://github.com/fullstorydev/grpcurl).

note

Your results might differ from the examples that follow, depending on the breadth and maturity of the gRPC APIs available on Sui Full nodes.

### List available gRPC services [​](https://docs.sui.io/concepts/grpc-overview\#list-available-grpc-services "Direct link to List available gRPC services")

```codeBlockLines_p187
$ grpcurl <full node URL:port> list

```

where the port on Sui Foundation managed Full nodes is `443`. It should return something like:

```codeBlockLines_p187
grpc.health.v1.Health
grpc.reflection.v1.ServerReflection
sui.rpc.v2alpha.LiveDataService
sui.rpc.v2alpha.SubscriptionService
sui.rpc.v2beta.LedgerService
sui.rpc.v2beta.TransactionExecutionService

```

### List available APIs in the LedgerService [​](https://docs.sui.io/concepts/grpc-overview\#list-available-apis-in-the-ledgerservice "Direct link to List available APIs in the LedgerService")

```codeBlockLines_p187
$ grpcurl <full node URL:port> list sui.rpc.v2beta.LedgerService

```

which should return something like:

```codeBlockLines_p187
sui.rpc.v2beta.LedgerService.BatchGetObjects
sui.rpc.v2beta.LedgerService.BatchGetTransactions
sui.rpc.v2beta.LedgerService.GetCheckpoint
sui.rpc.v2beta.LedgerService.GetEpoch
sui.rpc.v2beta.LedgerService.GetObject
sui.rpc.v2beta.LedgerService.GetServiceInfo
sui.rpc.v2beta.LedgerService.GetTransaction

```

### Get the `events` and `effects` details of a particular transaction [​](https://docs.sui.io/concepts/grpc-overview\#get-the-events-and-effects-details-of-a-particular-transaction "Direct link to get-the-events-and-effects-details-of-a-particular-transaction")

```codeBlockLines_p187
$ grpcurl -d '{ "digest": "3ByWphQ5sAVojiTrTrGXGM5FmCVzpzYmhsjbhYESJtxp" }' <full node URL:port> sui.rpc.v2beta.LedgerService/GetTransaction

```

### Get the transactions in a particular checkpoint [​](https://docs.sui.io/concepts/grpc-overview\#get-the-transactions-in-a-particular-checkpoint "Direct link to Get the transactions in a particular checkpoint")

```codeBlockLines_p187
$ grpcurl -d '{ "sequence_number": "180529334", "read_mask": { "paths": ["transactions"]} }' <full node URL:port> sui.rpc.v2beta.LedgerService/GetCheckpoint

```

## Sample clients in different programming languages [​](https://docs.sui.io/concepts/grpc-overview\#sample-clients-in-different-programming-languages "Direct link to Sample clients in different programming languages")

- TypeScript
- Golang
- Python

This is an example to build a Typescript client for Sui gRPC API. If you want to use a different set of tools or modules that you’re comfortable with, you can adjust the instructions accordingly.

**Install dependencies**

```codeBlockLines_p187
npm init -y

```

```codeBlockLines_p187
npm install @grpc/grpc-js @grpc/proto-loader

```

```codeBlockLines_p187
npm i -D tsx

```

**Project structure**

```codeBlockLines_p187
.
├── protos/
│   └── sui/
│       └── node/
│           └── v2beta/
│               ├── ledger_service.proto
│               └── *.proto
├── client.ts
├── package.json

```

Download all the `sui/rpc/v2beta` proto files from [Github v2beta](https://github.com/MystenLabs/sui/tree/main/crates/sui-rpc-api/proto) in the same folder.

**Sample client.ts to get `events` and `effects` details of a particular transaction**

```codeBlockLines_p187
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

const PROTO_PATH = path.join(__dirname, 'protos/sui/rpc/v2beta/ledger_service.proto');

// Load proto definitions
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, 'protos')],
});

const suiProto = grpc.loadPackageDefinition(packageDefinition) as any;
const LedgerService = suiProto.sui.rpc.v2beta.LedgerService;

// Create gRPC client
const client = new LedgerService(
  '<full node URL>:443',
  grpc.credentials.createSsl()
);

// Sample transaction digest in Base58 format
const base58Digest = '3ByWphQ5sAVojiTrTrGXGM5FmCVzpzYmhsjbhYESJtxp';

// Construct the request
const request = {
  digest: base58Digest,
  read_mask: {
    paths: ['events', 'effects'],
  },
};

// Make gRPC call
client.GetTransaction(request, (err: any, response: any) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Response:', JSON.stringify(response, null, 2));
  }
});

```

**Run the sample client**

```codeBlockLines_p187
npx tsx c

```

info

- `proto-loader` handles any nested `.proto` files - just make sure paths and imports are correct.
- The example assumes that gRPC is available on port `443` which requires SSL.
- Digest in the request is directly provided in the `Base58` format, but check if you need to decode from your source format.

## Frequently asked questions [​](https://docs.sui.io/concepts/grpc-overview\#frequently-asked-questions "Direct link to Frequently asked questions")

- Q: In a batch object request ( `BatchGetObjects`), does the field mask specified in individual `GetObjectRequest` s override the top-level field mask in the `BatchGetObjectsRequest`?
  - A: **No**, only the top-level field mask defined in the `BatchGetObjectsRequest` is used. Any field masks specified within individual `GetObjectRequest` entries are ignored. This behavior also applies to other batch request APIs in the `LedgerService` interface.
- Q: In `ExecuteTransactionRequest`, why is the `transaction` field marked as `optional`?
  - A: While the `transaction` field is marked as `optional` in the `TransactionExecutionService` .proto file, it is not optional in the API contract. It is required when making the request. This is a quirk of Protocol Buffers: marking a field as `optional` enables [field presence](https://protobuf.dev/programming-guides/field_presence/), which allows the API to distinguish between fields that were explicitly set and those that were left unset. Some of the benefits of field presence include:

    - Differentiating between missing and default values
    - Enabling patch or partial update semantics
    - Avoiding ambiguity when default values (like `0`, `""`, or `false`) are valid inputs

- [What is gRPC?](https://docs.sui.io/concepts/grpc-overview#what-is-grpc)
- [gRPC on Sui](https://docs.sui.io/concepts/grpc-overview#grpc-on-sui)
  - [Field masks](https://docs.sui.io/concepts/grpc-overview#field-masks)
  - [Encoding](https://docs.sui.io/concepts/grpc-overview#encoding)
- [Access using grpcurl](https://docs.sui.io/concepts/grpc-overview#access-using-grpcurl)
  - [List available gRPC services](https://docs.sui.io/concepts/grpc-overview#list-available-grpc-services)
  - [List available APIs in the LedgerService](https://docs.sui.io/concepts/grpc-overview#list-available-apis-in-the-ledgerservice)
  - [Get the `events` and `effects` details of a particular transaction](https://docs.sui.io/concepts/grpc-overview#get-the-events-and-effects-details-of-a-particular-transaction)
  - [Get the transactions in a particular checkpoint](https://docs.sui.io/concepts/grpc-overview#get-the-transactions-in-a-particular-checkpoint)
- [Sample clients in different programming languages](https://docs.sui.io/concepts/grpc-overview#sample-clients-in-different-programming-languages)
- [Frequently asked questions](https://docs.sui.io/concepts/grpc-overview#frequently-asked-questions)