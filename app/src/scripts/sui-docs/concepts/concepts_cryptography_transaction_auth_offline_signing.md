# https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing

[Skip to main content](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing#__docusaurus_skipToContent_fallback)

On this page

Sui supports offline signing, which is signing transactions using a device not connected to a Sui network, or in a wallet implemented in a different programming language without relying on the Sui key store. The steps to implement offline signing include:

1. Serialize the data for signing.
2. Sign the serialized data. Put the serialized data in a location to sign (such as the wallet of your choice, or tools in other programming languages) and to produce a signature with the corresponding public key.
3. Execute the signed transaction.

## Serialize data for a transfer [​](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing\#serialize "Direct link to Serialize data for a transfer")

You must serialize transaction data following [Binary Canonical Serialization](https://crates.io/crates/bcs) (BCS). It is supported in other languages.

The following example demonstrates how to serialize data for a transfer using the [Sui CLI](https://docs.sui.io/references/cli). This returns serialized transaction data in Base64. Submit the raw transaction to execute as `tx_bytes`.

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

```codeBlockLines_p187
$ sui client transfer-sui --to <SUI-ADDRESS> --sui-coin-object-id <COIN-OBJECT-ID> --gas-budget <GAS-AMOUNT> --serialize-unsigned-transaction

```

The console responds with the resulting `<TX_BYTES>` value.

tip

All other CLI commands that craft a transaction (such as `sui client publish` and `sui client call`) also accept the `--serialize-unsigned-transaction` flag used in the same way.

## Sign the serialized data [​](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing\#sign "Direct link to Sign the serialized data")

You can sign the data using the device and programming language you choose. Sui accepts signatures for pure Ed25519, ECDSA secp256k1, ECDSA secp256r1 and native multisig. To learn more about the requirements of the signatures, see [Sui Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures).

This example uses the `sui keytool` command to sign, using the Ed25519 key corresponding to the provided address stored in `sui.keystore`. This command outputs the signature, the public key, and the flag encoded in Base64. This command is backed by fastcrypto.
`sui keytool sign --address <SUI-ADDRESS> --data <TX_BYTES>`

You receive the following response:

```codeBlockLines_p187
Signer address: <SUI-ADDRESS>
Raw tx_bytes to execute: <TX_BYTES>
Intent: Intent { scope: TransactionData, version: V0, app_id: Sui }
Raw intent message: <INTENT-MESSAGE>
Digest to sign: <DIGEST>
Serialized signature (`flag || sig || pk` in Base64): <SERIALIZED-SIGNATURE>

```

To ensure the signature produced offline matches with Sui validity rules for testing purposes, you can import the mnemonics to `sui.keystore` using `sui keytool import`. You can then sign with it using `sui keytool sign` and then compare the signature results. Additionally, you can find test vectors in `~/sui/sdk/typescript/test/e2e/raw-signer.test.ts`.

To verify a signature against the cryptography library backing Sui when debugging, see [sigs-cli](https://github.com/MystenLabs/fastcrypto/blob/4cf71bd8b3a373495beeb77ce81c27827516c218/fastcrypto-cli/src/sigs_cli.rs).

## Execute the signed transaction [​](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing\#execute "Direct link to Execute the signed transaction")

After you obtain the serialized signature, you can submit it using the execution transaction command. This command takes `--tx-bytes` as the raw transaction bytes to execute (see output of the previous `sui client transfer` command) and the serialized signature (Base64 encoded `flag || sig || pk`, see output of `sui keytool sign`). This executes the signed transaction and returns the certificate and transaction effects if successful.

```codeBlockLines_p187
$ sui client execute-signed-tx --tx-bytes <TX_BYTES> --signatures <SERIALIZED-SIGNATURE>

```

You get the following response:

```codeBlockLines_p187
----- Certificate ----
Transaction Hash: <TRANSACTION-ID>
Transaction Signature: <SIGNATURE>
Signed Authorities Bitmap: RoaringBitmap<[0, 1, 3]>
Transaction Kind : Transfer SUI
Recipient : <SUI-ADDRESS>
Amount: Full Balance

----- Transaction Effects ----
Status : Success
Mutated Objects:
 - ID: <OBJECT_ID> , Owner: Account Address ( <SUI-ADDRESS> )

```

## Alternative: Sign with Sui Keystore and Execute Transaction [​](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing\#alternative-sign-with-sui-keystore-and-execute-transaction "Direct link to Alternative: Sign with Sui Keystore and Execute Transaction")

Alternatively, you can use the active key in Sui Keystore to sign and output a Base64-encoded sender signed data with flag `--serialize-signed-transaction`.

```codeBlockLines_p187
$ sui client transfer-sui --to <SUI-ADDRESS> --sui-coin-object-id <COIN-OBJECT-ID> --gas-budget <GAS-AMOUNT> --serialize-signed-transaction

```

The console responds with the resulting `<SIGNED-TX-BYTES>` value.

After you obtain the signed transaction bytes, you can submit it using the `execute-combined-signed-tx` command. This command takes `--signed-tx-bytes` as the signed transaction bytes to execute (see output of the previous `sui client transfer-sui` command). This executes the signed transaction and returns the certificate and transaction effects if successful.

```codeBlockLines_p187
$ sui client execute-combined-signed-tx --signed-tx-bytes <SIGNED-TX-BYTES>

```

- [Serialize data for a transfer](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing#serialize)
- [Sign the serialized data](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing#sign)
- [Execute the signed transaction](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing#execute)
- [Alternative: Sign with Sui Keystore and Execute Transaction](https://docs.sui.io/concepts/cryptography/transaction-auth/offline-signing#alternative-sign-with-sui-keystore-and-execute-transaction)