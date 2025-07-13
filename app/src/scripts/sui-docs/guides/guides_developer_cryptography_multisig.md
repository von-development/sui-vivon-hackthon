# https://docs.sui.io/guides/developer/cryptography/multisig

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/multisig#__docusaurus_skipToContent_fallback)

On this page

The following steps demonstrate how to create a multisig transaction and then submit it against a network using the [Sui CLI](https://docs.sui.io/references/cli). A transaction can be the transfer of an object, the publish or upgrade of a package, the payment of SUI, and so on.

To learn more about how to create multisig addresses and create multisig transactions using the TypeScript SDK, see the [SDK documentation](https://sdk.mystenlabs.com/typescript/cryptography/multisig) for details.

## Prerequisites [​](https://docs.sui.io/guides/developer/cryptography/multisig\#prerequisites "Direct link to Prerequisites")

This topic assumes you are somewhat familiar with the Sui CLI, specifically the `sui client` and `sui keytool` commands. Consequently, a command might be introduced without any context. If you are unsure about the details of a referenced command, see the Sui CLI documentation for more information.

You need an existing address on the network you are working on to receive an object. The topic assumes that this address is the current active address ( `sui client active-address`), but any address you have access to is fine.

The topic also assumes that your active environment is Testnet ( `sui client active-env`). You can perform these steps on Devnet or a local network as well, but you must adjust the instructions appropriately.

## Executing multisig transactions [​](https://docs.sui.io/guides/developer/cryptography/multisig\#executing-multisig-transactions "Direct link to Executing multisig transactions")

To demonstrate multisig, this topic guides you through setting up and executing a multisig transaction using the Sui CLI.

### Create addresses with different schemes [​](https://docs.sui.io/guides/developer/cryptography/multisig\#create-addresses-with-different-schemes "Direct link to Create addresses with different schemes")

To begin, create three addresses that will act as the signers for the transaction you perform later in the instruction. Use the `sui client new-address` command to generate a Sui address and public key for three supported key schemes.

```codeBlockLines_p187
$ sui client new-address ed25519

```

```codeBlockLines_p187
$ sui client new-address secp256k1

```

```codeBlockLines_p187
$ sui client new-address secp256r1

```

The console displays a response to each successful call that is similar to the following:

```codeBlockLines_p187
╭──────────────────────────────────────────────────╮
│ Created new keypair and saved it to keystore.    │
├────────────────┬─────────────────────────────────┤
│ alias          │ <ALIAS>                         │
│ address        │ <SUI-ADDRESS>                   │
│ keyScheme      │ <KEY-SCHEME>                    │
│ recoveryPhrase │ <RECOVERY-PHRASE>               │
╰────────────────┴─────────────────────────────────╯

```

When working with blockchain data, addresses and hashed values create large strings that can be cumbersome to work with in a CLI environment. To make referencing values easier in subsequent commands (and facilitate copy and paste), this topic uses shell variables. Use the values you receive from the console responses to set shell variables for these addresses, replacing the `<SUI-ADDRESS-*>` variables with the appropriate address.

```codeBlockLines_p187
$ ADDRESS1=<SUI-ADDRESS-ED25519>

```

```codeBlockLines_p187
$ ADDRESS2=<SUI-ADDRESS-SECP256K1>

```

```codeBlockLines_p187
$ ADDRESS3=<SUI-ADDRESS-SECP256R1>

```

Create one more shell variable assigned to your active address.

```codeBlockLines_p187
$ ACTIVE=<ACTIVE-ADDRESS>

```

tip

You can set the shell variables to the alias values instead of addresses if you want.

### Verify addresses [​](https://docs.sui.io/guides/developer/cryptography/multisig\#verify-addresses "Direct link to Verify addresses")

Use `sui keytool` to list the addresses you created in the previous section.

```codeBlockLines_p187
$ sui keytool list

```

The response resembles the following, but displays actual alias names, addresses, keys, and peer IDs:

```codeBlockLines_p187
╭────────────────────────────────────────────────────────────────────╮
│ ╭─────────────────┬──────────────────────────────────────────────╮ │
| | alias           |  <ALIAS-NAME>                                | |
│ │ suiAddress      │  <SUI-ADDRESS>                               │ │
│ │ publicBase64Key │  <PUBLIC-KEY>                                │ │
│ │ keyScheme       │  ed25519                                     │ │
│ │ flag            │  0                                           │ │
│ │ peerId          │  <PEER-ID>                                   │ │
│ ╰─────────────────┴──────────────────────────────────────────────╯ │
│ ╭─────────────────┬──────────────────────────────────────────────╮ │
| | alias           |  <ALIAS-NAME>                                | |
│ │ suiAddress      │  <SUI-ADDRESS>                               │ │
│ │ publicBase64Key │  <PUBLIC-KEY>                                │ │
│ │ keyScheme       │  secp256k1                                   │ │
│ │ flag            │  0                                           │ │
│ │ peerId          │  <PEER-ID>                                   │ │
│ ╰─────────────────┴──────────────────────────────────────────────╯ │
│ ╭─────────────────┬──────────────────────────────────────────────╮ │
| | alias           |  <ALIAS-NAME>                                | |
│ │ suiAddress      │  <SUI-ADDRESS>                               │ │
│ │ publicBase64Key │  <PUBLIC-KEY>                                │ │
│ │ keyScheme       │  secp256r1                                   │ │
│ │ flag            │  0                                           │ │
│ │ peerId          │  <PEER-ID>                                   │ │
│ ╰─────────────────┴──────────────────────────────────────────────╯ │
╰────────────────────────────────────────────────────────────────────╯

```

The output includes public key data that you use later, so create shell variables to store the information. Don't forget to replace `<PUBLIC-KEY-*>` with the actual values you receive from the previous console response.

```codeBlockLines_p187
$ PKEY_1=<PUBLIC-KEY-ED25519>

```

```codeBlockLines_p187
$ PKEY_2=<PUBLIC-KEY-SECP256K1>

```

```codeBlockLines_p187
$ PKEY_3=<PUBLIC-KEY-SECP256R1>

```

### Create a multisig address [​](https://docs.sui.io/guides/developer/cryptography/multisig\#create-a-multisig-address "Direct link to Create a multisig address")

To sign a transaction using multisig, you need to create a multisig address using `sui keytool multi-sig-address`. The multisig address is created using the public keys from each individual participating address. Each address is also assigned a `weight` value that determines how many are needed to create a valid signature. When summed, the `weight` of the included signatures must be greater than or equal to the `threshold` value you also set with the command. For this example, use the following command, which states that the first two addresses require at least one more signature to create a valid multisig. The last address has a weight of `3`, which is equal to the `threshold` value, so its owner can create a valid signature without the others.

```codeBlockLines_p187
$ sui keytool multi-sig-address --pks $PKEY_1 $PKEY_2 $PKEY_3 --weights 1 2 3 --threshold 3

```

The response resembles the following:

```codeBlockLines_p187
╭─────────────────┬─────────────────────────────────────────────────────────╮
│ multisigAddress │  <MULTISIG-ADDRESS>                                     │
│ multisig        │ ╭─────────────────────────────────────────────────────╮ │
│                 │ │ ╭─────────────────┬───────────────────────────────╮ │ │
│                 │ │ │ address         │  <SUI-ADDRESS>                │ │ │
│                 │ │ │ publicBase64Key │  <PUBLIC-KEY>                 │ │ │
│                 │ │ │ weight          │  1                            │ │ │
│                 │ │ ╰─────────────────┴───────────────────────────────╯ │ │
│                 │ │ ╭─────────────────┬───────────────────────────────╮ │ │
│                 │ │ │ address         │  <SUI-ADDRESS>                │ │ │
│                 │ │ │ publicBase64Key │  <PUBLIC-KEY>                 │ │ │
│                 │ │ │ weight          │  2                            │ │ │
│                 │ │ ╰─────────────────┴───────────────────────────────╯ │ │
│                 │ │ ╭─────────────────┬───────────────────────────────╮ │ │
│                 │ │ │ address         │  <SUI-ADDRESS>                │ │ │
│                 │ │ │ publicBase64Key │  <PUBLIC-KEY>                 │ │ │
│                 │ │ │ weight          │  3                            │ │ │
│                 │ │ ╰─────────────────┴───────────────────────────────╯ │ │
│                 │ ╰─────────────────────────────────────────────────────╯ │
╰─────────────────┴─────────────────────────────────────────────────────────╯

```

### Add SUI to the multisig address [​](https://docs.sui.io/guides/developer/cryptography/multisig\#add-sui-to-the-multisig-address "Direct link to Add SUI to the multisig address")

Before getting SUI, set a `MULTISIG` shell variable to the multisig address provided at the top of the previous response (substituting the actual address for `<MULTISIG-ADDRESS>`).

```codeBlockLines_p187
$ MULTISIG=<MULTISIG-ADDRESS>

```

If you use the `sui client objects $MULTISIG` command, you can see that the newly created multisig address has no objects. This means you need to get SUI before you can perform any transactions. To get SUI for your multisig account, use the `sui client faucet` command and provide the multisig address using the `--address` flag. Run this command twice so that the multisig address owns at least two SUI. This example uses two SUI so that one can be transferred and the other can pay for gas.

```codeBlockLines_p187
$ sui client faucet --address $MULTISIG

```

Use the `sui client gas` command to verify the address now has at least two SUI.

```codeBlockLines_p187
$ sui client gas $MULTISIG

```

### Transfer SUI to your active address [​](https://docs.sui.io/guides/developer/cryptography/multisig\#transfer-sui-to-your-active-address "Direct link to Transfer SUI to your active address")

It's now time to transfer an object from the multisig address. For simplicity, this example uses one of the coins your multisig address owns as the transfer object. Copy the object ID for one of the address' coins and use it to set a shell variable value.

```codeBlockLines_p187
$ COIN=<COIN-OBJECT-ID>

```

Use the `sui client transfer` command to set up the transfer. The `--serialize-unsigned-transaction` flag outputs the Base64-encoded transaction bytes.

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

```codeBlockLines_p187
$ sui client transfer --to $ACTIVE --object-id $COIN --gas-budget <GAS-AMOUNT> --serialize-unsigned-transaction

```

The console displays the result ( `<TX-BYTES-RESULT>`), which you can assign to another shell variable.

```codeBlockLines_p187
$ TXBYTES=<TX-BYTES-RESULT>

```

### Sign the transaction with two public keys [​](https://docs.sui.io/guides/developer/cryptography/multisig\#sign-the-transaction-with-two-public-keys "Direct link to Sign the transaction with two public keys")

Use the `sui keytool sign` command to sign the transaction using two of the addresses you created previously.

info

You can create the signature with other tools, as well, as long as you serialize it to `flag || sig || pk`.

```codeBlockLines_p187
$ sui keytool sign --address $ADDRESS1 --data $TXBYTES

```

```codeBlockLines_p187
$ sui keytool sign --address $ADDRESS2 --data $TXBYTES

```

Each successful call to the command receives a response similar to the following.

```codeBlockLines_p187
╭──────────────┬─────────────────────────────╮
│ suiAddress   │ <ADDRESS>                   │
│ rawTxData    │ <TRANSACTION-HASH>          │
│ intent       │ ╭─────────┬─────╮           │
│              │ │ scope   │  0  │           |
│              │ │ version │  0  │           |
│              │ │ app_id  │  0  │           |
|              | ╰─────────┴─────╯           │
│ rawIntentMsg │ <INTENT-MSG-HASH>           │
│ digest       │ <DIGEST-HASH>               │
│ suiSignature │ <SIGNATURE-HASH>            │
╰──────────────┴─────────────────────────────╯

```

Create two more shell variables to store the signatures, replacing `<SIGNATURE-HASH-*>` with the values from the previous command responses.

```codeBlockLines_p187
$ SIG_1=<SIGNATURE-HASH-ED25519>

```

```codeBlockLines_p187
$ SIG_2=<SIGNATURE-HASH-SECP256K1>

```

### Combine individual signatures into a multisig [​](https://docs.sui.io/guides/developer/cryptography/multisig\#combine-individual-signatures-into-a-multisig "Direct link to Combine individual signatures into a multisig")

As mentioned, the multisig must be composed of enough individual signatures such that the sum of the participating signer weights is greater than the `threshold` value. Use the `sui keytool multi-sig-combine-partial-sig` command to combine the ed25519 signature ( `weight: 1`) and the secp256k1 ( `weight: 2`). To complete the command, you must provide all public keys, their weights, and the threshold that defined the multisig address.

```codeBlockLines_p187
$ sui keytool multi-sig-combine-partial-sig --pks $PKEY_1 $PKEY_2 $PKEY_3 --weights 1 2 3 --threshold 3 --sigs $SIG_1 $SIG_2

```

If successful, the console responds with a message similar to the following.

```codeBlockLines_p187
╭────────────────────┬──────────────────────────────╮
│ multisigAddress    │  <MULTISIG-ADDRESS>          │
│ multisigParsed     │  <MULTISIG-PARSED-HASH>      │
│ multisigSerialized │  <MULTISIG-SERIALIZED-HASH>  │
╰────────────────────┴──────────────────────────────╯

```

### Execute the transaction [​](https://docs.sui.io/guides/developer/cryptography/multisig\#execute-the-transaction "Direct link to Execute the transaction")

Use `sui client execute-signed-tx` to execute the multisig transaction. Set a shell variable equal to the `multisigSerialized` value you receive from the previous response, then use it to build the `execute-signed-tx` command.

```codeBlockLines_p187
$ MULTISIG_SERIALIZED=<MULTISIG-SERIALIZED-HASH>

```

```codeBlockLines_p187
$ sui client execute-signed-tx --tx-bytes $TXBYTES --signatures $MULTISIG_SERIALIZED

```

If successful, the console responds with transaction details.

Click to open

Transaction response

This response contains the actual values from a test signing. Your response should be formatted the same but the values you receive are going to be different.

```codeBlockLines_p187
Transaction Digest: 7mBWUxT6HUVDa8bii3PZJc7nhWqefTLNTsGbHYnx7ZA4
╭─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Data                                                                                                                                                                                                                                                                                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sender: 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35                                                                                                                                                                                                                                                              │
│ Gas Owner: 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35                                                                                                                                                                                                                                                           │
│ Gas Budget: 2997880 MIST                                                                                                                                                                                                                                                                                                                │
│ Gas Price: 1000 MIST                                                                                                                                                                                                                                                                                                                    │
│ Gas Payment:                                                                                                                                                                                                                                                                                                                            │
│  ┌──                                                                                                                                                                                                                                                                                                                                    │
│  │ ID: 0xc62a5e163e599729509d6cebde097cac04e5d1b3bbc9a169144e8dfa602a0768                                                                                                                                                                                                                                                               │
│  │ Version: 289574879                                                                                                                                                                                                                                                                                                                   │
│  │ Digest: 2PMc8L67YbZmna4hoaryX9cZZFSgFNPEYPEeCqcDPCcX                                                                                                                                                                                                                                                                                 │
│  └──                                                                                                                                                                                                                                                                                                                                    │
│                                                                                                                                                                                                                                                                                                                                         │
│ Transaction Kind: Programmable                                                                                                                                                                                                                                                                                                          │
│ ╭──────────────────────────────────────────────────────────────────────────────────────────────────────────╮                                                                                                                                                                                                                            │
│ │ Input Objects                                                                                            │                                                                                                                                                                                                                            │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                                                                                                                                                            │
│ │ 0   Pure Arg: Type: address, Value: "0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241" │                                                                                                                                                                                                                            │
│ │ 1   Imm/Owned Object ID: 0xe7acb59c190d7fcfcb622916e929c92007f6da15128fd84c8a2afd94a39edf11              │                                                                                                                                                                                                                            │
│ ╰──────────────────────────────────────────────────────────────────────────────────────────────────────────╯                                                                                                                                                                                                                            │
│ ╭──────────────────────╮                                                                                                                                                                                                                                                                                                                │
│ │ Commands             │                                                                                                                                                                                                                                                                                                                │
│ ├──────────────────────┤                                                                                                                                                                                                                                                                                                                │
│ │ 0  TransferObjects:  │                                                                                                                                                                                                                                                                                                                │
│ │  ┌                   │                                                                                                                                                                                                                                                                                                                │
│ │  │ Arguments:        │                                                                                                                                                                                                                                                                                                                │
│ │  │   Input  1        │                                                                                                                                                                                                                                                                                                                │
│ │  │ Address: Input  0 │                                                                                                                                                                                                                                                                                                                │
│ │  └                   │                                                                                                                                                                                                                                                                                                                │
│ ╰──────────────────────╯                                                                                                                                                                                                                                                                                                                │
│                                                                                                                                                                                                                                                                                                                                         │
│ Signatures:                                                                                                                                                                                                                                                                                                                             │
│    AwICIrr3sYG1hx2DaVkS3levGuTv68GA1RL+6ZFbtnFV5PBPkEHuysjme9nG0hZ3hQ0eDds2CedbKkLqDyCUXMNQDwEUtr9SYWRGiJJih21cAXgpSxf5Y53HFcmzJPWfxac54l21YVx6hc7vhI1xunMzhVeQlCa53vVJiAtWKLKz+H7FBgADAPZrm85y/Gn83R6kUhXme9J8W2ilJyda6cAObtuyJ3CqAQICAwSWHr3Q2vGVFH4SQckaQs76X89S6hX3NUarydSY3jgCAQNqj1MFWmTysOPFDXdNfD2kJlQhWTiT3AbxdlJDDWozIgMDAA== │
│                                                                                                                                                                                                                                                                                                                                         │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Digest: 7mBWUxT6HUVDa8bii3PZJc7nhWqefTLNTsGbHYnx7ZA4                                              │
│ Status: Success                                                                                   │
│ Executed Epoch: 600                                                                               │
│ Mutated Objects:                                                                                  │
│  ┌──                                                                                              │
│  │ ID: 0xc62a5e163e599729509d6cebde097cac04e5d1b3bbc9a169144e8dfa602a0768                         │
│  │ Owner: Account Address ( 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35 )  │
│  │ Version: 289574880                                                                             │
│  │ Digest: DWmLziJZEHwhkAfdBWVhn8HnJU7DMepDmjVLps2peSx8                                           │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ ID: 0xe7acb59c190d7fcfcb622916e929c92007f6da15128fd84c8a2afd94a39edf11                         │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ Version: 289574880                                                                             │
│  │ Digest: JBA6PrhWuTUJ3P8NXBpgBetFBaSJacEvQKS4USK9EfAr                                           │
│  └──                                                                                              │
│ Gas Object:                                                                                       │
│  ┌──                                                                                              │
│  │ ID: 0xc62a5e163e599729509d6cebde097cac04e5d1b3bbc9a169144e8dfa602a0768                         │
│  │ Owner: Account Address ( 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35 )  │
│  │ Version: 289574880                                                                             │
│  │ Digest: DWmLziJZEHwhkAfdBWVhn8HnJU7DMepDmjVLps2peSx8                                           │
│  └──                                                                                              │
│ Gas Cost Summary:                                                                                 │
│    Storage Cost: 1976000 MIST                                                                     │
│    Computation Cost: 1000000 MIST                                                                 │
│    Storage Rebate: 1956240 MIST                                                                   │
│    Non-refundable Storage Fee: 19760 MIST                                                         │
│                                                                                                   │
│ Transaction Dependencies:                                                                         │
│    F6TBXbvdK9fi4BnxZMBkL7QeNyv1612778i12ZPhafJD                                                   │
│    HFi4TniDvgL1jDzgPHjzJhxR8nbavLmPH3LLDnNL5Tqd                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────╮
│ No transaction block events │
╰─────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mutated Objects:                                                                                 │
│  ┌──                                                                                             │
│  │ ObjectID: 0xc62a5e163e599729509d6cebde097cac04e5d1b3bbc9a169144e8dfa602a0768                  │
│  │ Sender: 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35                    │
│  │ Owner: Account Address ( 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35 ) │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                    │
│  │ Version: 289574880                                                                            │
│  │ Digest: DWmLziJZEHwhkAfdBWVhn8HnJU7DMepDmjVLps2peSx8                                          │
│  └──                                                                                             │
│  ┌──                                                                                             │
│  │ ObjectID: 0xe7acb59c190d7fcfcb622916e929c92007f6da15128fd84c8a2afd94a39edf11                  │
│  │ Sender: 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35                    │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 ) │
│  │ ObjectType: 0x2::coin::Coin<0x2::sui::SUI>                                                    │
│  │ Version: 289574880                                                                            │
│  │ Digest: JBA6PrhWuTUJ3P8NXBpgBetFBaSJacEvQKS4USK9EfAr                                          │
│  └──                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Balance Changes                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                              │
│  │ Owner: Account Address ( 0x65437300e280695a40df8cf524c7bca6ad62574cac3a52d3b085ad628c797241 )  │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: 1000000000                                                                             │
│  └──                                                                                              │
│  ┌──                                                                                              │
│  │ Owner: Account Address ( 0xfc9a64c928a09725cfe01478ad50c2418320b4c079d944ed430eff0f30666a35 )  │
│  │ CoinType: 0x2::sui::SUI                                                                        │
│  │ Amount: -1001019760                                                                            │
│  └──                                                                                              │
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯

```

## Related links [​](https://docs.sui.io/guides/developer/cryptography/multisig\#related-links "Direct link to Related links")

- [Multisig](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig): Definition of multisig transactions on the Sui network and how to use it with CLI.
- [Multisig Typescript SDK](https://sdk.mystenlabs.com/typescript/cryptography/multisig): How to create multisig addresses and sign transactions using the Sui SDK.
- [SDK documentation](https://sdk.mystenlabs.com/typescript/cryptography/multisig): See the Sui TypeScript SDK documentation to learn how to use the library with multisig transactions.
- [Sui CLI](https://docs.sui.io/references/cli): Interact with the Sui network, its features, and the Move programming language from a command line.

- [Prerequisites](https://docs.sui.io/guides/developer/cryptography/multisig#prerequisites)
- [Executing multisig transactions](https://docs.sui.io/guides/developer/cryptography/multisig#executing-multisig-transactions)
  - [Create addresses with different schemes](https://docs.sui.io/guides/developer/cryptography/multisig#create-addresses-with-different-schemes)
  - [Verify addresses](https://docs.sui.io/guides/developer/cryptography/multisig#verify-addresses)
  - [Create a multisig address](https://docs.sui.io/guides/developer/cryptography/multisig#create-a-multisig-address)
  - [Add SUI to the multisig address](https://docs.sui.io/guides/developer/cryptography/multisig#add-sui-to-the-multisig-address)
  - [Transfer SUI to your active address](https://docs.sui.io/guides/developer/cryptography/multisig#transfer-sui-to-your-active-address)
  - [Sign the transaction with two public keys](https://docs.sui.io/guides/developer/cryptography/multisig#sign-the-transaction-with-two-public-keys)
  - [Combine individual signatures into a multisig](https://docs.sui.io/guides/developer/cryptography/multisig#combine-individual-signatures-into-a-multisig)
  - [Execute the transaction](https://docs.sui.io/guides/developer/cryptography/multisig#execute-the-transaction)
- [Related links](https://docs.sui.io/guides/developer/cryptography/multisig#related-links)