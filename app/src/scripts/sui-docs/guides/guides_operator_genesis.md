# https://docs.sui.io/guides/operator/genesis

[Skip to main content](https://docs.sui.io/guides/operator/genesis#__docusaurus_skipToContent_fallback)

On this page

Genesis is the initial state of the Sui blockchain. To launch a network, the initial committee of validators collaborate by providing their validator information (public keys, network addresses, and so on) to a shared workspace. After all of the initial validators have contributed their information, Sui generates the initial, unsigned genesis checkpoint (checkpoint with sequence number 0) and each validator provides their signature. Sui aggregates these signatures to form a certificate on the genesis checkpoint. Sui bundles this checkpoint, as well as the initial objects, together into a single genesis.blob file that is used to initialize the state when running the `sui-node` binary for both validators and Full nodes.

## Genesis blob locations [​](https://docs.sui.io/guides/operator/genesis\#genesis-blob-locations "Direct link to Genesis blob locations")

The genesis.blob files for each network are in the [sui-genesis](https://github.com/mystenlabs/sui-genesis) repository.

See [Sui Full Node](https://docs.sui.io/guides/operator/sui-full-node#set-up-from-source) for how to get the genesis.blob file for each network.

- [Genesis blob locations](https://docs.sui.io/guides/operator/genesis#genesis-blob-locations)