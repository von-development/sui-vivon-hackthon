# https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn

[Skip to main content](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn#__docusaurus_skipToContent_fallback)

On this page

Transactions in Sui represent calls to specific functionality (like calling a smart contract function) that execute on inputs to define the result of the transaction.

Inputs can either be an object reference (either to an owned object, an immutable object, or a shared object), or an encoded value (for example, a vector of bytes used as an argument to a Move call). After a transaction is constructed, usually through using [programmable transaction blocks](https://docs.sui.io/guides/developer/sui-101/building-ptb) (PTBs), the user signs the transaction and submits it to be executed on chain.

The signature is provided with the private key owned by the wallet, and its public key must be consistent with the transaction sender's Sui address.

Sui uses a `SuiKeyPair` to produce the signature, which commits to the Blake2b hash digest of the intent message ( `intent || bcs bytes of tx_data`). The signature schemes currently supported are `Ed25519 Pure`, `ECDSA Secp256k1`, `ECDSA Secp256r1`, `Multisig`, and `zkLogin`.

You can instantiate `Ed25519 Pure`, `ECDSA Secp256k1`, and `ECDSA Secp256r1` using `SuiKeyPair` and use it to sign transactions. Note that this guide does not apply to `Multisig` and `zkLogin`, please refer to their own pages ( [Multisig](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig) and [zkLogin](https://docs.sui.io/concepts/cryptography/zklogin) respectively) for instructions.

With a signature and the transaction bytes, a transaction can be submitted to be executed.

## Workflow [​](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn\#workflow "Direct link to Workflow")

The following high-level process describes the overall workflow for constructing, signing and executing an on-chain transaction:

- Construct the transaction data by creating a `Transaction` where multiple transactions are chained. See [Building Programmable Transaction Blocks](https://docs.sui.io/guides/developer/sui-101/building-ptb) for more information.
- The SDK's built-in gas estimation and coin selection picks the gas coin.
- Sign the transaction to generate a [signature](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures#user-signature).
- Submit the `Transaction` and its signature for on-chain execution.

info

If you want to use a specific gas coin, first find the gas coin object ID to be used to pay for gas, and explicitly use that in the PTB. If there is no gas coin object, use the [splitCoin](https://docs.sui.io/guides/developer/sui-101/building-ptb#available-transactions) transaction to create a gas coin object. The split coin transaction should be the first transaction call in the PTB.

## Examples [​](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn\#examples "Direct link to Examples")

The following examples demonstrate how to sign and execute transactions using Rust, TypeScript, or the Sui CLI.

- TypeScript
- Rust
- Sui CLI

There are various ways to instantiate a key pair and to derive its public key and Sui address using the Sui TypeScript SDK.

```codeBlockLines_p187
import { fromHex } from '@mysten/bcs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { type Keypair } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { Transaction } from '@mysten/sui/transactions';

const kp_rand_0 = new Ed25519Keypair();
const kp_rand_1 = new Secp256k1Keypair();
const kp_rand_2 = new Secp256r1Keypair();

const kp_import_0 = Ed25519Keypair.fromSecretKey(
	fromHex('0xd463e11c7915945e86ac2b72d88b8190cfad8ff7b48e7eb892c275a5cf0a3e82'),
);
const kp_import_1 = Secp256k1Keypair.fromSecretKey(
	fromHex('0xd463e11c7915945e86ac2b72d88b8190cfad8ff7b48e7eb892c275a5cf0a3e82'),
);
const kp_import_2 = Secp256r1Keypair.fromSecretKey(
	fromHex('0xd463e11c7915945e86ac2b72d88b8190cfad8ff7b48e7eb892c275a5cf0a3e82'),
);

// $MNEMONICS refers to 12/15/18/21/24 words from the wordlist, e.g. "retire skin goose will hurry this field stadium drastic label husband venture cruel toe wire". Refer to [Keys and Addresses](/concepts/cryptography/transaction-auth/keys-addresses.mdx) for more.
const kp_derive_0 = Ed25519Keypair.deriveKeypair('$MNEMONICS');
const kp_derive_1 = Secp256k1Keypair.deriveKeypair('$MNEMONICS');
const kp_derive_2 = Secp256r1Keypair.deriveKeypair('$MNEMONICS');

const kp_derive_with_path_0 = Ed25519Keypair.deriveKeypair('$MNEMONICS', "m/44'/784'/1'/0'/0'");
const kp_derive_with_path_1 = Secp256k1Keypair.deriveKeypair('$MNEMONICS', "m/54'/784'/1'/0/0");
const kp_derive_with_path_2 = Secp256r1Keypair.deriveKeypair('$MNEMONICS', "m/74'/784'/1'/0/0");

// replace `kp_rand_0` with the variable names above.
const pk = kp_rand_0.getPublicKey();
const sender = pk.toSuiAddress();

// create an example transaction block.
const txb = new Transaction();
txb.setSender(sender);
txb.setGasPrice(5);
txb.setGasBudget(100);
const bytes = await txb.build();
const serializedSignature = (await keypair.signTransaction(bytes)).signature;

// verify the signature locally
expect(await keypair.getPublicKey().verifyTransaction(bytes, serializedSignature)).toEqual(true);

// define sui client for the desired network.
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// execute transaction.
let res = client.executeTransactionBlock({
	transactionBlock: bytes,
	signature: serializedSignature,
});
console.log(res);

```

### Notes [​](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn\#notes "Direct link to Notes")

1. This guide demonstrates how to sign with a single private key. Refer to [Multisig](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig) when it is preferred to set up more complex signing policies.
2. Similarly, native zkLogin does not follow the above steps, see [the docs](https://docs.sui.io/concepts/cryptography/zklogin) to understand how to derive a zkLogin address, and produce a zkLogin signature with an ephemeral key pair.
3. If you decide to implement your own signing mechanisms instead of using the previous tools, see the [Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures) doc on the accepted signature specifications for each scheme.
4. Flag is one byte that differentiates signature schemes. See supported schemes and its flag in [Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures).
5. The `execute_transaction_block` endpoint takes a list of signatures, so it should contain exactly one user signature, unless you are using sponsored transaction that a second signature for the gas object can be provided. See [Sponsored Transactions](https://docs.sui.io/concepts/transactions/sponsored-transactions) for more information.

- [Workflow](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn#workflow)
- [Examples](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn#examples)
  - [Notes](https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn#notes)