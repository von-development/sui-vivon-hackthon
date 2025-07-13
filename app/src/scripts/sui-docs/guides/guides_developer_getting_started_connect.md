# https://docs.sui.io/guides/developer/getting-started/connect

[Skip to main content](https://docs.sui.io/guides/developer/getting-started/connect#__docusaurus_skipToContent_fallback)

On this page

Sui has Mainnet, Devnet, and Testnet networks available. You can use one of the test networks, Devnet or Testnet, to experiment with the version of Sui running on that network. You can also spin up a [local Sui network](https://docs.sui.io/guides/developer/getting-started/local-network) for local development.

The Sui Testnet and Devnet networks consist of several validator nodes to validate each network's transactions. Clients send transactions and read requests via this endpoint: `https://fullnode.<SUI-NETWORK-VERSION>.sui.io:443` using [JSON-RPC](https://docs.sui.io/references/sui-api).

You can [request test SUI tokens](https://docs.sui.io/guides/developer/getting-started/connect#request-test-tokens) through the Sui [devnet-faucet](https://discordapp.com/channels/916379725201563759/971488439931392130) and [testnet-faucet](https://discord.com/channels/916379725201563759/1037811694564560966) Discord channels, depending on which version of the network you use. If connected to Localnet, use cURL to request tokens from your [local faucet](https://docs.sui.io/guides/developer/getting-started/local-network#use-the-local-faucet). The coins on these networks have no financial value. There is no faucet service for Mainnet.

See announcements about Sui in the [#announcements](https://discord.com/channels/916379725201563759/925109817834631189) Discord channel.

See the [terms of service](https://sui.io/terms/) for using Sui networks.

info

Testnet and Devnet data persistence is not guaranteed. Devnet data is wiped regularly as part of scheduled software updates. The data on Testnet persists through the regular update process, but might be wiped when necessary. Testnet data wipes are announced ahead of time.

For more information about the release schedule of Sui networks, see [Sui Network Release](https://sui.io/networkinfo/).

## Sui CLI [​](https://docs.sui.io/guides/developer/getting-started/connect\#sui-cli "Direct link to Sui CLI")

Sui provides [Sui command line interface (CLI)](https://docs.sui.io/references/cli/client) to interact with Sui networks:

- Create and manage your private keys
- Create example NFTs
- Call and publish Move modules

## Environment set up [​](https://docs.sui.io/guides/developer/getting-started/connect\#environment-set-up "Direct link to Environment set up")

First, [Install Sui](https://docs.sui.io/guides/developer/getting-started/sui-install#install-binaries). After you install Sui, [request SUI test tokens](https://docs.sui.io/guides/developer/getting-started/connect#request-gas-tokens) through Discord for the network you are using: [Devnet](https://discordapp.com/channels/916379725201563759/971488439931392130) or [Testnet](https://discord.com/channels/916379725201563759/1037811694564560966). If connected to Localnet, use cURL to request tokens from your [local faucet](https://docs.sui.io/guides/developer/getting-started/local-network#use-the-local-faucet).

To check whether Sui is already installed, run the following command:

```codeBlockLines_p187
$ which sui

```

If Sui is installed, the command returns the path to the Sui binary. If Sui is not installed, it returns `sui not found`.

See the [Sui Releases](https://github.com/MystenLabs/sui/releases) page to view the changes in each Sui release.

## Configure Sui client [​](https://docs.sui.io/guides/developer/getting-started/connect\#configure-sui-client "Direct link to Configure Sui client")

If you previously ran `sui genesis` to create a local network, it created a Sui client configuration file (client.yaml) that connects to `localhost` at `http://0.0.0.0:9000`. See [Connect to a custom RPC endpoint](https://docs.sui.io/guides/developer/getting-started/connect#connect-to-a-custom-rpc-endpoint) to update the client.yaml file.

To connect the Sui client to a network, run the following command:

```codeBlockLines_p187
$ sui client

```

If you receive the `sui-client` help output in the console, you already have a client.yaml file. See [Connect to a custom RPC endpoint](https://docs.sui.io/guides/developer/getting-started/connect#connect-to-a-custom-rpc-endpoint) to add a new environment alias or to switch the currently active network.

The first time you start Sui client without having a client.yaml file, the console displays the following message:

```codeBlockLines_p187
Config file ["<PATH-TO-FILE>/client.yaml"] doesn't exist, do you want to connect to a Sui Full node server [y/N]?

```

Press **y** and then press **Enter**. The process then requests the RPC server URL:

```codeBlockLines_p187
Sui Full node server URL (Defaults to Sui Testnet if not specified) :

```

Press **Enter** to connect to Sui Testnet. To use a custom RPC server, Sui Devnet, or Sui Mainnet, enter the URL to the correct RPC endpoint and then press **Enter**.

If you enter a URL, the process prompts for an alias for the environment:

```codeBlockLines_p187
Environment alias for [<URL-ENTERED>] :

```

Type an alias name and press **Enter**.

```codeBlockLines_p187
Select key scheme to generate keypair (0 for ed25519, 1 for secp256k1, 2 for secp256r1):

```

Press **0**, **1**, or **2** to select a key scheme and the press **Enter**.

Sui returns a message similar to the following (depending on the key scheme you selected) that includes the address and 12-word recovery phrase for the address:

```codeBlockLines_p187
Generated new keypair for address with scheme "ed25519" [0xb9c83a8b40d3263c9ba40d551514fbac1f8c12e98a4005a0dac072d3549c2442]
Secret Recovery Phrase : [cap wheat many line human lazy few solid bored proud speed grocery]

```

### Connect to a custom RPC endpoint [​](https://docs.sui.io/guides/developer/getting-started/connect\#connect-to-a-custom-rpc-endpoint "Direct link to Connect to a custom RPC endpoint")

If you previously used `sui genesis` with the force option ( `-f` or `--force`), your client.yaml file already includes two RPC endpoints: `localnet` at `http://0.0.0.0:9000` and `devnet` at `https://fullnode.devnet.sui.io:443`. You can view the defined environments with the `sui client envs` command, and switch between them with the `sui client switch` command.

If you previously installed a Sui client that connected to a Sui network, or created a local network, you can modify your existing client.yaml file to change the configured RPC endpoint. The `sui client` commands that relate to environments read from and write to the client.yaml file.

To check currently available environment aliases, run the following command:

```codeBlockLines_p187
$ sui client envs

```

The command outputs the available environment aliases, with `(active)` denoting the currently active network.

```codeBlockLines_p187
localnet => http://0.0.0.0:9000 (active)
devnet => https://fullnode.devnet.sui.io:443

```

To add a new alias for a custom RPC endpoint, run the following command. Replace values in `<` `>` with values for your installation:

```codeBlockLines_p187
$ sui client new-env --alias <ALIAS> --rpc <RPC-SERVER-URL>

```

To switch the active network, run the following command:

```codeBlockLines_p187
$ sui client switch --env <ALIAS>

```

If you encounter an issue, delete the Sui configuration directory ( `~/.sui/sui_config`) and reinstall the latest [Sui binaries](https://docs.sui.io/guides/developer/getting-started/sui-install#install-sui-binaries).

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/connect#sui-cli)
- [Environment set up](https://docs.sui.io/guides/developer/getting-started/connect#environment-set-up)
- [Configure Sui client](https://docs.sui.io/guides/developer/getting-started/connect#configure-sui-client)
  - [Connect to a custom RPC endpoint](https://docs.sui.io/guides/developer/getting-started/connect#connect-to-a-custom-rpc-endpoint)