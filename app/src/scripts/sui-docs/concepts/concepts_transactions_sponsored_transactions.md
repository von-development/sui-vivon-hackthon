# https://docs.sui.io/concepts/transactions/sponsored-transactions

[Skip to main content](https://docs.sui.io/concepts/transactions/sponsored-transactions#__docusaurus_skipToContent_fallback)

On this page

A Sui sponsored transaction is one where a Sui address (the sponsor's) pays the gas fees for a transaction that another address (the user's) initializes. You can use sponsored transactions to cover the fees for users on your site or app so that they don't get charged for them. This removes a significant obstacle that web 2.0 users encounter when entering web3, as they often have to purchase tokens to perform a transaction on chain. For example, you could sponsor gamers' early transactions to increase conversion rates.

Sponsored transactions also facilitate asset management as you don't need to maintain multiple accounts with SUI tokens to transfer funds.

You can use Sui sponsored transactions to:

- Sponsor (pay gas fees for) a transaction a user initiates.
- Sponsor transactions you initiate as the sponsor.
- Provide a wildcard `GasData` object to users. The object covers the gas fees for a user transaction. The `GasData` object covers any fee amount determined for the transaction as long as the budget is sufficient.

## Potential risks using sponsored transactions [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#potential-risks-using-sponsored-transactions "Direct link to Potential risks using sponsored transactions")

The most significant potential risk when using sponsored transactions is [equivocation](https://docs.sui.io/sui-glossary#equivocation). In some cases under certain conditions, a sponsored transaction can result in all associated owned objects, including gas in a locked state when examined by Sui validators. To avoid double spending, validators lock objects as they validate transactions. An equivocation occurs when an owned object's pair ( `ObjectID`, `SequenceNumber`) is concurrently used in multiple non-finalized transactions.

To equivocate, either the user or the sponsor signs and submits another transaction that attempts to manipulate an owned object in the original transaction. Because only the object owner can use an owned object, only the user and sponsor can cause this condition.

## Create a user-initiated sponsored transaction [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#create-a-user-initiated-sponsored-transaction "Direct link to Create a user-initiated sponsored transaction")

A user-initiated sponsored transaction involves the following steps:

1. A user initializes a `GasLessTransactionData` transaction.
2. The user sends `GasLessTransactionData` to the sponsor.
3. The sponsor validates the transaction, constructs `TransactionData` with gas fees, and then signs `TransactionData`.
4. The sponsor sends the signed `TransactionData` and the sponsor `Signature` back to the user.
5. The user verifies and then signs `TransactionData` and sends the dual-signed transaction to Sui network through a Full node or the sponsor.

### GasLessTransactionData [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#gaslesstransactiondata "Direct link to GasLessTransactionData")

`GasLessTransactionData` is basically `TransactionData` without `GasData`. It is not a `sui-core` data structure, but it is only an interface between user and sponsor.

The following example constructs a `GasLessTransactionData` object.

```codeBlockLines_p187
pub struct GasLessTransactionData {
    pub kind: TransactionKind,
    sender: SuiAddress,
    …
}

```

## Create a sponsor-initiated sponsored transaction [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#create-a-sponsor-initiated-sponsored-transaction "Direct link to Create a sponsor-initiated sponsored transaction")

A sponsor-initiated sponsored transaction involves the following steps:

1. A sponsor constructs a `TransactionData` object that contains the transaction details and associated gas fee data. The sponsor signs it to generate a `Signature` before sending it to a user. You can send the unsigned `TransactionData` via email, SMS, or an application interface.
2. The user checks the transaction and signs it to generate the second `Signature` for the transaction.
3. The user submits the dual-signed transaction to a Sui Full node or sponsor to execute it.

You can use a sponsor-initiated sponsored transaction as an advertiser, or to incentivize specific user actions without requiring the user to pay for gas fees.

## Create sponsored transactions using a GasData object [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#create-sponsored-transactions-using-a-gasdata-object "Direct link to Create sponsored transactions using a GasData object")

To use a `GasData` object to sponsor the gas fees for a transaction, create a `GasData` object that covers the fees determined for the transaction. This is similar to providing a blank check to a user that can be used only to cover gas fees. The user doesn't need to know how much the fee is or approve it.

A sponsor transaction using a `GasData` object involves the following steps:

1. The sponsor provides a `GasData` object to a user.
2. The user constructs `TransactionData` and signs it to generate a `Signature`.
3. The user sends the `TransactionData` and the `Signature` to the sponsor.
4. The sponsor confirms the `TransactionData` and then signs it.
5. The sponsor submits the dual-signed `TransactionData` to a Full node to execute the transaction.

## Create a Sui gas station [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#create-a-sui-gas-station "Direct link to Create a Sui gas station")

On Sui, a gas station is a concept to describe where you set up processes to sponsor user transactions. You can customize a Sui gas station to support the specific user-facing functionality you need. Some example use cases for a Sui gas station include:

- Monitor real-time gas prices on the network to determine the gas price that the station provides.
- Track usage of gas provided to users on the network.
- Gas pool management, such as using specific gas objects to minimize costs or reduce the risk of a large amount of locked objects that remain illiquid while locked.

### Authorization and rate limiting [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#authorization-and-rate-limiting "Direct link to Authorization and rate limiting")

Depending on the nature of your gas station, you can apply different authorization rules to avoid being spammed by bad actors. Possible policies include:

- Rate limit gas requests per account or per IP address
- Only accept requests with a valid authorization header, which has separate rate limits

### Abuse detection [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#abuse-detection "Direct link to Abuse detection")

For all gas objects that you provide as a sponsor, you should track if users ever try to equivocate and lock objects. If you detect such behavior, block the user or requester accordingly.

## Code examples to create a Sui gas station [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#code-examples-to-create-a-sui-gas-station "Direct link to Code examples to create a Sui gas station")

The following Rust SDK code examples demonstrate how to implement a Sui gas station that supports each of the sponsored transaction types described previously.

### User-initiated sponsored transactions [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#user-initiated-sponsored-transactions "Direct link to User-initiated sponsored transactions")

Use the API endpoint to receive `GaslessTransaction` transactions and return a sole-signed `SenderSignedData` object.

```codeBlockLines_p187
pub fn request_gas_and_signature(gasless_tx: GaslessTransaction) -> Result<SenderSignedData, Error>;

```

### Sponsored transactions with GasData objects [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#sponsored-transactions-with-gasdata-objects "Direct link to Sponsored transactions with GasData objects")

Use the API endpoint to receive sole-signed `SenderSignedData` and return the result of the transaction.

```codeBlockLines_p187
pub fn submit_sole_signed_transaction(sole_signed_data: SenderSignedData) -> Result<(Transaction, CertifiedTransactionEffects), Error>;

```

Alternatively, use the API endpoint to return a GasData object.

```codeBlockLines_p187
pub fn request_gas(/*requirement data*/) -> Result<GasData, Error>;

```

### User and sponsor-initiated transaction [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#user-and-sponsor-initiated-transaction "Direct link to User and sponsor-initiated transaction")

Use the API endpoint to receive dual-signed `SenderSignedData` and return the result of the transaction.

```codeBlockLines_p187
pub fn submit_dual_signed_transaction(dual_signed_data: SenderSignedData) -> Result<(Transaction, CertifiedTransactionEffects), Error>;

```

For user and sponsor-initiated transactions, users can submit the dual-signed transaction via either a sponsor or a Full node.

## Sponsored transaction data structure [​](https://docs.sui.io/concepts/transactions/sponsored-transactions\#sponsored-transaction-data-structure "Direct link to Sponsored transaction data structure")

The following code block describes the `TransactionData` structure for sponsored transactions and `GasObject`. You can view the [source code](https://github.com/MystenLabs/sui/blob/224a28ed9dece21a952547896bd5d794bdf8b562/crates/sui-types/src/transaction.rs) in the Sui GitHub repository.

**`TransactionData` Structure**

```codeBlockLines_p187
#[derive(Debug, PartialEq, Eq, Hash, Clone, Serialize, Deserialize)]
pub struct TransactionDataV1 {
    pub kind: TransactionKind,
    pub sender: SuiAddress,
    pub gas_data: GasData,
    pub expiration: TransactionExpiration,
}

```

**`GasData` Structure**

```codeBlockLines_p187
#[derive(Debug, PartialEq, Eq, Hash, Clone, Serialize, Deserialize)]
pub struct GasData {
    pub payment: Vec<ObjectRef>,
    pub owner: SuiAddress,
    pub price: u64,
    pub budget: u64,
}

```

To learn more about transactions in Sui, see [Transactions](https://docs.sui.io/concepts/transactions).

- [Potential risks using sponsored transactions](https://docs.sui.io/concepts/transactions/sponsored-transactions#potential-risks-using-sponsored-transactions)
- [Create a user-initiated sponsored transaction](https://docs.sui.io/concepts/transactions/sponsored-transactions#create-a-user-initiated-sponsored-transaction)
  - [GasLessTransactionData](https://docs.sui.io/concepts/transactions/sponsored-transactions#gaslesstransactiondata)
- [Create a sponsor-initiated sponsored transaction](https://docs.sui.io/concepts/transactions/sponsored-transactions#create-a-sponsor-initiated-sponsored-transaction)
- [Create sponsored transactions using a GasData object](https://docs.sui.io/concepts/transactions/sponsored-transactions#create-sponsored-transactions-using-a-gasdata-object)
- [Create a Sui gas station](https://docs.sui.io/concepts/transactions/sponsored-transactions#create-a-sui-gas-station)
  - [Authorization and rate limiting](https://docs.sui.io/concepts/transactions/sponsored-transactions#authorization-and-rate-limiting)
  - [Abuse detection](https://docs.sui.io/concepts/transactions/sponsored-transactions#abuse-detection)
- [Code examples to create a Sui gas station](https://docs.sui.io/concepts/transactions/sponsored-transactions#code-examples-to-create-a-sui-gas-station)
  - [User-initiated sponsored transactions](https://docs.sui.io/concepts/transactions/sponsored-transactions#user-initiated-sponsored-transactions)
  - [Sponsored transactions with GasData objects](https://docs.sui.io/concepts/transactions/sponsored-transactions#sponsored-transactions-with-gasdata-objects)
  - [User and sponsor-initiated transaction](https://docs.sui.io/concepts/transactions/sponsored-transactions#user-and-sponsor-initiated-transaction)
- [Sponsored transaction data structure](https://docs.sui.io/concepts/transactions/sponsored-transactions#sponsored-transaction-data-structure)