# https://docs.sui.io/guides/operator/node-tools

[Skip to main content](https://docs.sui.io/guides/operator/node-tools#__docusaurus_skipToContent_fallback)

On this page

This guide focuses on using the Sui CLI `validator` commands.

info

This tool only supports pending validators and active validators at the moment.

## Preparation [​](https://docs.sui.io/guides/operator/node-tools\#preparation "Direct link to Preparation")

1. Make sure you have completed all the [prerequisites](https://docs.sui.io/guides/developer/getting-started/sui-install#prerequisites).

2. Build the `sui` binary, which you need for the genesis ceremony. This step can be done on any machine you like. It does not have to be done on the machine on which you will run the validator.
1. Clone the git repo:

      `git clone git@github.com:MystenLabs/sui.git && cd sui`

2. Check out the commit to use for the testnet:

      `git checkout testnet`

3. Build sui binary

      `cargo build --bin sui`

4. Remember the path to your binary:

      `export SUI_BINARY="$(pwd)/target/debug/sui"`
3. Run the following command to set up your Sui account and CLI environment.
1. If this is the first time running this program, it will ask you to provide a Sui Fullnode Server URL and a meaningful environment alias. It will also generate a random key pair in `sui.keystore` and a config `client.yaml`. Swap in your validator account key if you already have one.

2. If you already set it up, simply make sure
      a. `rpc` is correct in `client.yaml`.
      b. `active_address` is correct in `client.yaml`.
      b. `sui.keystore` contains your account key pair.

      If at this point you can't find where `client.yaml` or `sui.keystore` is or have other questions, read [Sui Client CLI tutorial](https://docs.sui.io/references/cli/client).





      ```codeBlockLines_p187
      $ sui client

      ```
4. To test you are connected to the network and configured your config correctly, run the following command to display your validator info.


```codeBlockLines_p187
$ sui validator display-metadata

```

## Using Sui CLI [​](https://docs.sui.io/guides/operator/node-tools\#using-sui-cli "Direct link to Using Sui CLI")

#### Print help info [​](https://docs.sui.io/guides/operator/node-tools\#print-help-info "Direct link to Print help info")

```codeBlockLines_p187
$ sui validator --help

```

#### Display validator metadata [​](https://docs.sui.io/guides/operator/node-tools\#display-validator-metadata "Direct link to Display validator metadata")

```codeBlockLines_p187
$ sui validator display-metadata

```

or

```codeBlockLines_p187
$ sui validator display-metadata <validator-address>

```

to print another validator's information.

#### Update validator metadata [​](https://docs.sui.io/guides/operator/node-tools\#update-validator-metadata "Direct link to Update validator metadata")

Run the following to see how to update validator metadata. Read description carefully about when the change will take effect.

```codeBlockLines_p187
$ sui validator update-metadata --help

```

You can update the following on-chain metadata:

01. name
02. description
03. image URL
04. project URL
05. network address
06. p2p address
07. primary address
08. worker address
09. protocol public key
10. network public key
11. worker public key

Notably, only the first 4 metadata listed above take effect immediately.

If you change any metadata from points 5 to 11, they will be changed only after the next epoch - for these, you'll want to restart the validator program immediately after the next epoch, with the new key files and/or updated `validator.yaml` config. Particularly, make sure the new address is not behind a firewall.

Run the following to see how to update each metadata.

```codeBlockLines_p187
$ sui validator update-metadata --help

```

#### Operation cap [​](https://docs.sui.io/guides/operator/node-tools\#operation-cap "Direct link to Operation cap")

Operation Cap allows a validator to authorizer another account to perform certain actions on behalf of this validator. Read about [Operation Cap here](https://docs.sui.io/guides/operator/validator-tasks#operation-cap).

The Operation Cap holder (either the valdiator itself or the delegatee) updates its Gas Price and reports validator peers with the Operation Cap.

#### Update gas price [​](https://docs.sui.io/guides/operator/node-tools\#update-gas-price "Direct link to Update gas price")

To update Gas Price, run

```codeBlockLines_p187
$ sui validator update-gas-price <gas-price>

```

if the account itself is a validator and holds the Operation Cap. Or

```codeBlockLines_p187
$ sui validator update-gas-price --operation-cap-id <operation-cap-id> <gas-price>

```

if the account is a delegatee.

#### Report validators [​](https://docs.sui.io/guides/operator/node-tools\#report-validators "Direct link to Report validators")

To report validators peers, run

```codeBlockLines_p187
$ sui validator report-validator <reportee-address>

```

Add `--undo-report false` if it intents to undo an existing report.

Similarly, if the account is a delegatee, add `--operation-cap-id <operation-cap-id>` option to the command.

if the account itself is a validator and holds the Operation Cap. Or

```codeBlockLines_p187
$ sui validator update-gas-price --operation-cap-id <operation-cap-id> <gas-price>

```

if the account is a delegatee.

#### Become a validator / join committee [​](https://docs.sui.io/guides/operator/node-tools\#become-a-validator--join-committee "Direct link to Become a validator / join committee")

To become a validator candidate, first run

```codeBlockLines_p187
$ sui validator make-validator-info <name> <description> <image-url> <project-url> <host-name> <gas_price>

```

This will generate a `validator.info` file and key pair files. The output of this command includes:

1. Four key pair files (Read [more here](https://docs.sui.io/guides/operator/validator-tasks#key-management)). ==Set their permissions with the minimal visibility (chmod 600, for example) and store them securely==. They are needed when running the validator node as covered below.
a. If you follow this guide thoroughly, this key pair is actually copied from your `sui.keystore` file.
2. `validator.info` file that contains your validator info. **Double check all information is correct**.

Then run

```codeBlockLines_p187
$ sui validator become-candidate {path-to}validator.info

```

to submit an on-chain transaction to become a validator candidate. The parameter is the file path to the validator.info generated in the previous step. **Make sure the transaction succeeded (printed in the output).**

At this point you are validator candidate and can start to accept self staking and delegated staking.

**If you haven't, start a fullnode now to catch up with the network. When you officially join the committee but is not fully up-to-date, you cannot make meaningful contribution to the network and may be subject to peer reporting hence face the risk of reduced staking rewards for you and your delegators.**

Once you collect enough staking amount, run

```codeBlockLines_p187
$ sui validator join-committee

```

to become a pending validator. A pending validator will become active and join the committee starting from next epoch.

#### Leave committee [​](https://docs.sui.io/guides/operator/node-tools\#leave-committee "Direct link to Leave committee")

To leave committee, run

```codeBlockLines_p187
$ sui validator leave-committee

```

You are removed from the committee starting from the next epoch.

### Generate the payload to create PoP [​](https://docs.sui.io/guides/operator/node-tools\#generate-the-payload-to-create-pop "Direct link to Generate the payload to create PoP")

Serialize the payload that is used to generate proof of possession. This allows the signer to take the payload offline for an authority protocol BLS keypair to sign.

```codeBlockLines_p187
$ sui validator serialize-payload-pop --account-address $ACCOUNT_ADDRESS --protocol-public-key $BLS_PUBKEY

```

```codeBlockLines_p187
Serialized payload: $PAYLOAD_TO_SIGN

```

- [Preparation](https://docs.sui.io/guides/operator/node-tools#preparation)
- [Using Sui CLI](https://docs.sui.io/guides/operator/node-tools#using-sui-cli)
  - [Generate the payload to create PoP](https://docs.sui.io/guides/operator/node-tools#generate-the-payload-to-create-pop)