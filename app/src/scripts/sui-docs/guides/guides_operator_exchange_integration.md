# https://docs.sui.io/guides/operator/exchange-integration

[Skip to main content](https://docs.sui.io/guides/operator/exchange-integration#__docusaurus_skipToContent_fallback)

On this page

This topic describes how to integrate SUI, the token native to the Sui network, into a cryptocurrency exchange. The specific requirements and processes to implement an integration vary between exchanges. Rather than provide a step-by-step guide, this topic provides information about the primary tasks necessary to complete an integration. After the guidance about how to configure an integration, you can also find information and code samples related to staking on the Sui network.

## Requirements to configure a SUI integration [​](https://docs.sui.io/guides/operator/exchange-integration\#requirements-to-configure-a-sui-integration "Direct link to Requirements to configure a SUI integration")

The requirements to configure a SUI integration include:

- A Sui Full node. You can operate your own Sui Full node or use a Full node from a node operator.
- Suggested hardware requirements to run a Sui Full node:
  - CPU: 8 physical cores / 16 vCPUs
  - RAM: 128 GB
  - Storage (SSD): 4 TB NVMe drive

For best results, run Sui Full nodes on Linux. Sui supports the Ubuntu and Debian distributions. You can also fun a Full node on macOS.

## Configure a Sui Full node [​](https://docs.sui.io/guides/operator/exchange-integration\#configure-a-sui-full-node "Direct link to Configure a Sui Full node")

You can set up and configure a [Sui Full node](https://docs.sui.io/guides/operator/sui-full-node) using Docker or directly from source code in the Sui GitHub repository.

## Set up Sui addresses [​](https://docs.sui.io/guides/operator/exchange-integration\#set-up-sui-addresses "Direct link to Set up Sui addresses")

Sui addresses do not require on-chain initialization, you can spend from an address if it corresponds to your private key. You can derive a 32-byte Sui address by hashing the signature scheme flag byte concatenated with public key bytes `flag || pubkey` using the [BLAKE2b](https://www.blake2.net/) (256 bits output) hashing function.

Currently, Sui address supports these signature schemes: pure Ed25519, Secp256k1, Secp256r1 and multisig. The corresponding flag bytes are 0x00, 0x01, 0x02, 0x03 respectively.

The following code sample demonstrates how to derive a Sui address in Rust:

```codeBlockLines_p187
let flag = 0x00; // 0x00 = ED25519, 0x01 = Secp256k1, 0x02 = Secp256r1, 0x03 = multiSig
// Hash the [flag, public key] bytearray using Blake2b
let mut hasher = DefaultHash::default();
hasher.update([flag]);
hasher.update(pk);
let arr = hasher.finalize();
let sui_address_string = hex::encode(arr);

```

## Displaying addresses [​](https://docs.sui.io/guides/operator/exchange-integration\#displaying-addresses "Direct link to Displaying addresses")

Sui supports both addresses with and without a `0x` prefix. Sui recommends that you always include the `0x` prefix in API calls and when you display user addresses.

## Track balance changes for an address [​](https://docs.sui.io/guides/operator/exchange-integration\#track-balance-changes-for-an-address "Direct link to Track balance changes for an address")

You can track balance changes by calling `sui_getBalance` at predefined intervals. This call returns the total balance for an address. The total includes any coin or token type, but this document focuses on SUI. You can track changes in the total balance for an address between subsequent `sui_getBalance` requests.

The following bash example demonstrates how to use `sui_getBalance` for address `0x849d63687330447431a2e76fecca4f3c10f6884ebaa9909674123c6c662612a3`. If you use a network other than Devnet, replace the value for `rpc` with the URL to the appropriate Full node.

```codeBlockLines_p187
rpc="https://fullnode.devnet.sui.io:443"
address="0x849d63687330447431a2e76fecca4f3c10f6884ebaa9909674123c6c662612a3"
data="{\"jsonrpc\": \"2.0\", \"method\": \"sui_getBalance\", \"id\": 1, \"params\": [\"$address\"]}"
curl -X POST -H 'Content-type: application/json' --data-raw "$data" $rpc

```

The response is a JSON object that includes the `totalBalance` for the address:

```codeBlockLines_p187
{
  "jsonrpc":"2.0",
  "result":{
     "coinType":"0x2::sui::SUI",
     "coinObjectCount":40,
     "totalBalance":10000000000,
     "lockedBalance":{

     }
  },
  "id":1
}

```

The following example demonstrates using `sui_getBalance` in Rust:

```codeBlockLines_p187
use std::str::FromStr;
use sui_sdk::types::base_types::SuiAddress;
use sui_sdk::{SuiClient, SuiClientBuilder};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
   let sui = SuiClientBuilder::default().build(
      "https://fullnode.devnet.sui.io:443",
   ).await.unwrap();
   let address = SuiAddress::from_str("0x849d63687330447431a2e76fecca4f3c10f6884ebaa9909674123c6c662612a3")?;
   let objects = sui.read_api().get_balance(address).await?;
   println!("{:?}", objects);
   Ok(())
}

```

## Use events to track balance changes for an address [​](https://docs.sui.io/guides/operator/exchange-integration\#use-events-to-track-balance-changes-for-an-address "Direct link to Use events to track balance changes for an address")

You can also track the balance for an address by subscribing to all of the events emitted from it. Use a filter to include only the events related to SUI coins, such as when the address acquires a coin or pays for a gas fee.
The following example demonstrates how to filter events for an address using bash and cURL:

```codeBlockLines_p187
rpc="https://fullnode.devnet.sui.io:443"
address="0x849d63687330447431a2e76fecca4f3c10f6884ebaa9909674123c6c662612a3"
data="{\"jsonrpc\": \"2.0\", \"id\":1, \"method\": \"sui_getEvents\", \"params\": [{\"Recipient\": {\"AddressOwner\": \"0x849d63687330447431a2e76fecca4f3c10f6884ebaa9909674123c6c662612a3\"}}, null, null, true ]}"
curl -X POST -H 'Content-type: application/json' --data-raw "$data" $rpc

```

The response can include a large number of events. Add pagination to the response using the `nextCursor` key in the request. You can determine the corresponding `txDigest` and `eventSeq` from the `id` field of a transaction.

You can add the `txDigest` value instead of the first `null` within the `params`. The second `null` is an integer that defines how many results (up to 1000) to return and the `true` means ascending order. You can use the `nextCursor` so the response starts from a desired point.

The `id` field of any transaction looks like:

```codeBlockLines_p187
"id": {
    "txDigest": "GZQN9pE3Zr9ZfLzBK1BfVCXtbjx5xKMxPSEKaHDvL3E2",
    "eventSeq": 6019
}

```

With this data, create a `nextCursor` as follows:

```codeBlockLines_p187
nextCursor : {"txDigest": "GZQN9pE3Zr9ZfLzBK1BfVCXtbjx5xKMxPSEKaHDvL3E2","eventSeq": 6019}

```

## Blocks vs checkpoints [​](https://docs.sui.io/guides/operator/exchange-integration\#blocks-vs-checkpoints "Direct link to Blocks vs checkpoints")

Sui is a DAG-based blockchain and uses checkpoints for node synchronization and global transaction ordering. Checkpoints differ from blocks in the following ways:

- Sui creates checkpoints and adds finalized transactions. Note that transactions are finalized even before they are included in a checkpoint
- Checkpoints do not fork, roll back, or reorganize.
- Sui creates about four checkpoints every second. Find the most up-to-date statistic on the [Sui public dashboard](https://metrics.sui.io/public-dashboards/4ceb11cc210d4025b122294586961169).

### Checkpoint API operations [​](https://docs.sui.io/guides/operator/exchange-integration\#checkpoint-api-operations "Direct link to Checkpoint API operations")

Sui Checkpoint API operations include:

- [sui\_getCheckpoint](https://docs.sui.io/sui-api-ref#sui_getCheckpoint) \- Retrieves the specified checkpoint.
- [sui\_getLatestCheckpointSequenceNumber](https://docs.sui.io/sui-api-ref#sui_getLatestCheckpointSequenceNumber) \- Retrieves the sequence number of the most recently executed checkpoint.
- [sui\_getCheckpoints](https://docs.sui.io/sui-api-ref#sui_getCheckpoints) \- Retrieves a paginated list of checkpoints that occurred during the specified interval. Pending a future release.

## SUI balance transfer [​](https://docs.sui.io/guides/operator/exchange-integration\#sui-balance-transfer "Direct link to SUI balance transfer")

To transfer a specific amount of SUI between addresses, you need a SUI token object with that specific value. In Sui, everything is an object, including SUI tokens. The amount of SUI in each SUI token object varies. For example, an address could own 3 SUI tokens with different values: one of 0.1 SUI, a second of 1.0 SUI, and a third with 0.005 SUI. The total balance for the address equals the sum of the values of the individual SUI token objects, in this case, 1.105 SUI.

You can merge and split SUI token objects to create token objects with specific values. To create a SUI token worth .6 SUI, split the token worth 1 SUI into two token objects worth .6 SUI and .4 SUI.

To transfer a specific amount of SUI, you need a SUI token worth that specific amount. To get a SUI token with that specific value, you might need to split or merge existing SUI tokens. Sui supports several methods to accomplish this, including some that do not require you to manually split or merge coins.

## Sui API operations for transfers [​](https://docs.sui.io/guides/operator/exchange-integration\#sui-api-operations-for-transfers "Direct link to Sui API operations for transfers")

Sui supports the following API operations related to transferring SUI between addresses:

- [sui\_transferObject](https://docs.sui.io/sui-api-ref#sui_transferObject)
Because SUI tokens are objects, you can transfer SUI tokens just like any other object. This method requires a gas token, and is useful in niche cases only.

- [sui\_payAllSui](https://docs.sui.io/sui-api-ref#sui_payAllSui)
This method accepts an array of SUI token IDs. It merges all existing tokens into one, deducts the gas fee, then sends the merged token to the recipient address.

The method is especially useful if you want to transfer all SUI from an address. To merge together all coins for an address, set the recipient as the same address. This is a native Sui method so is not considered a transaction in Sui.

- [sui\_paySui](https://docs.sui.io/sui-api-ref#sui_paySui)
This operation accepts an array of SUI token IDs, an array of amounts, and an array of recipient addresses.

The amounts and recipients array map one to one. Even if you use only one recipient address, you must include it for each amount in the amount array.

The operation merges all of the tokens provided into one token object and settles the gas fees. It then splits the token according to the amounts in the amounts array and sends the first token to the first recipient, the second token to the second recipient, and so on. Any remaining SUI on the token stays in the source address.

The benefits of this method include: no gas fees for merging or splitting tokens, and the abstracted token merge and split. The `sui_paySui` operation is a native function, so the merge and split operations are not considered Sui transactions. The gas fees for them match typical transactions on Sui.You can use this operation to split coins in your own address by setting the recipient as your own address. Note that the total value of the input coins must be greater than the total value of the amounts to send.

- [sui\_pay](https://docs.sui.io/sui-api-ref#sui_pay)
This method is similar to sui\_paySui, but it accepts any kind of coin or token instead of only SUI. You must include a gas token, and all of the coins or tokens must be the same type.

- [sui\_transferSui](https://docs.sui.io/sui-api-ref#sui_transferSui)
This method accepts only one SUI token object and an amount to send to the recipient. It uses the same token for gas fees, so the amount to transfer must be strictly less than the value of the SUI token used.


## Signing transactions [​](https://docs.sui.io/guides/operator/exchange-integration\#signing-transactions "Direct link to Signing transactions")

Refer to [Sui Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures) for more details on signature validity requirements.

## SUI Staking [​](https://docs.sui.io/guides/operator/exchange-integration\#sui-staking "Direct link to SUI Staking")

The Sui blockchain uses a Delegated Proof-of-Stake mechanism (DPoS). This allows SUI token holders to stake their SUI tokens to any validator of their choice. When someone stakes their SUI tokens, it means those tokens are locked for the entire epoch. Users can withdraw their stake at any time, but new staking requests become active only at the start of the next epoch.

SUI holders who stake their tokens to validators earn rewards for helping secure the Sui network. Sui determines rewards for staking based on stake rewards on the network, and distributes them at the end of each epoch.

The total voting power in the Sui Network is always 10,000. The voting power of each individual validator is similar to basis points. For example, a voting power of 101 = 1.01%. Sui's quorum threshold (number of votes needed to confirm a transaction) is 6,667 (which is greater than 2/3). The voting power for a single validator is capped at 1,000 (10%) regardless of how much stake the validator has.

## Staking functions [​](https://docs.sui.io/guides/operator/exchange-integration\#staking-functions "Direct link to Staking functions")

Sui supports the following API operations related to staking. You can find the source code in the [sui\_system](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/packages/sui-system/sources/sui_system.move) module.

- `request_add_stake`
Add user stake to a validator's staking pool.

```codeBlockLines_p187
public fun request_add_stake(
   self: &mut SuiSystemState,
   stake: Coin<SUI>,
   validator_address: address,
   ctx: &mut TxContext,
) {
   validator_set::request_add_stake(
       &mut self.validators,
       validator_address,
       coin::into_balance(stake),
       option::none(),
       ctx,
   );
}

```

- `request_add_stake_mul_coin`
Add user stake to a validator's staking pool using multiple coins.

```codeBlockLines_p187
public fun request_add_stake_mul_coin(
   self: &mut SuiSystemState,
   delegate_stakes: vector<Coin<SUI>>,
   stake_amount: option::Option<u64>,
   validator_address: address,
   ctx: &mut TxContext,
) {
   let balance = extract_coin_balance(delegate_stakes, stake_amount, ctx);
   validator_set::request_add_stake(&mut self.validators, validator_address, balance, option::none(), ctx);
}

```

- `request_add_stake_with_locked_coin`
Add user stake to a validator's staking pool using a locked SUI coin.

```codeBlockLines_p187
public fun request_add_stake_with_locked_coin(
   self: &mut SuiSystemState,
   stake: LockedCoin<SUI>,
   validator_address: address,
   ctx: &mut TxContext,
) {
   let (balance, lock) = locked_coin::into_balance(stake);
   validator_set::request_add_stake(&mut self.validators, validator_address, balance, option::some(lock), ctx);
}

```

- `request_withdraw_stake`
Withdraw some portion of a user stake from a validator's staking pool.

```codeBlockLines_p187
public fun request_withdraw_stake(
   self: &mut SuiSystemState,
   delegation: &mut Delegation,
   staked_sui: &mut StakedSui,
   principal_withdraw_amount: u64,
   ctx: &mut TxContext,
) {
   validator_set::request_withdraw_stake(
       &mut self.validators,
       delegation,
       staked_sui,
       principal_withdraw_amount,
       ctx,
   );
}

```

- [Requirements to configure a SUI integration](https://docs.sui.io/guides/operator/exchange-integration#requirements-to-configure-a-sui-integration)
- [Configure a Sui Full node](https://docs.sui.io/guides/operator/exchange-integration#configure-a-sui-full-node)
- [Set up Sui addresses](https://docs.sui.io/guides/operator/exchange-integration#set-up-sui-addresses)
- [Displaying addresses](https://docs.sui.io/guides/operator/exchange-integration#displaying-addresses)
- [Track balance changes for an address](https://docs.sui.io/guides/operator/exchange-integration#track-balance-changes-for-an-address)
- [Use events to track balance changes for an address](https://docs.sui.io/guides/operator/exchange-integration#use-events-to-track-balance-changes-for-an-address)
- [Blocks vs checkpoints](https://docs.sui.io/guides/operator/exchange-integration#blocks-vs-checkpoints)
  - [Checkpoint API operations](https://docs.sui.io/guides/operator/exchange-integration#checkpoint-api-operations)
- [SUI balance transfer](https://docs.sui.io/guides/operator/exchange-integration#sui-balance-transfer)
- [Sui API operations for transfers](https://docs.sui.io/guides/operator/exchange-integration#sui-api-operations-for-transfers)
- [Signing transactions](https://docs.sui.io/guides/operator/exchange-integration#signing-transactions)
- [SUI Staking](https://docs.sui.io/guides/operator/exchange-integration#sui-staking)
- [Staking functions](https://docs.sui.io/guides/operator/exchange-integration#staking-functions)