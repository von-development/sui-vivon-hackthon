# https://docs.sui.io/guides/operator/archives

[Skip to main content](https://docs.sui.io/guides/operator/archives#__docusaurus_skipToContent_fallback)

On this page

A Sui archive is a history of all transaction data on Sui. In some cases, peer nodes may not catch up with all transactions and effects through synchronization if they lag behind the current epoch by more than the latest few epochs. In such cases, instead of relying on synchronization, peer nodes can fallback to downloading the relevant information from an archive.

info

Starting with the 1.51 release, the default archive bucket for mainnet switches to a requester pays model. See below for a configuration example

## Set up archival fallback [​](https://docs.sui.io/guides/operator/archives\#set-up-archival-fallback "Direct link to Set up archival fallback")

To enable your node to fallback to an archive in case of lag, add this to your fullnode.yaml file:

- Mainnet
- Testnet

```codeBlockLines_p187
state-archive-read-config:
  - ingestion-url: "https://s3.us-west-2.amazonaws.com/mysten-mainnet-checkpoints"
    # How many objects to read ahead when catching up
    concurrency: 5
    remote-store-options:
      - ["aws_access_key_id", <YOUR_AWS_ACCESS_KEY_ID|PATH_TO_AWS_ACCESS_KEY>]
      - ["aws_secret_access_key", <AWS_SECRET_ACCESS_KEY|PATH_TO_AWS_SECRET_ACCESS_KEY>]

```

- [Set up archival fallback](https://docs.sui.io/guides/operator/archives#set-up-archival-fallback)