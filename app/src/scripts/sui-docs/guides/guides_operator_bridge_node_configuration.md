# https://docs.sui.io/guides/operator/bridge-node-configuration

[Skip to main content](https://docs.sui.io/guides/operator/bridge-node-configuration#__docusaurus_skipToContent_fallback)

On this page

Running a Bridge Validator Node (Bridge Node) requires registering your node with the bridge committee. Correct configuration of your node ensures optimal performance and valid metrics data. Follow this topic to make sure your Bridge Node is set up properly.

## Prerequisites [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#prerequisites "Direct link to Prerequisites")

To set up and run a Bridge Node, you need to install `sui` and `sui-bridge-cli`. You can install them using one of the following options:

Install from tip of `main`:

```codeBlockLines_p187
$ cargo install --locked --git "https://github.com/MystenLabs/sui.git" sui sui-bridge-cli

```

Install with a commit sha:

```codeBlockLines_p187
$ cargo install --locked --git "https://github.com/MystenLabs/sui.git" --rev {SHA} sui sui-bridge-cli

```

## Committee registration [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#committee-registration "Direct link to Committee registration")

To join the network you must first register with the bridge validator committee.

### Prepare for metadata [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#prepare-for-metadata "Direct link to Prepare for metadata")

The required metadata includes two things:

- `BridgeAuthorityKey`, an ECDSA key to sign messages. Because this is a hot key that is kept in memory, it’s fine to use the following tool to generate one and write it to file.
- A REST API URL where the Bridge Node listens to and serves requests. Example: `https://bridge.example-sui-validator.io:443`. Make sure the port is correct and the URL does not contain any invalid characters, like quotes for example.

To create a `BridgeAuthorityKey`, run

```codeBlockLines_p187
$ sui-bridge-cli create-bridge-validator-key <PATH-TO-WRITE>

```

where `<PATH-TO-WRITE>` is the location to write the key pair to.

info

It's highly recommended you create a new key pair in a secure environment (for example, in the same machine where your node runs) to avoid key compromise.

### Registration [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#registration "Direct link to Registration")

After you have both authority key file and REST API URL ready, you can register them by using Sui CLI:

```codeBlockLines_p187
$ sui validator register-bridge-committee --bridge-authority-key-path <BRIDGE-AUTHORITY-KEY-PATH> --bridge-authority-url <BRIDGE-AUTHORITY-URL>

```

#### Offline signing [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#offline-signing "Direct link to Offline signing")

If you keep your validator account key in cold storage or you want to perform offline signing, use flags `--print-only` and `--validator-address` (with the value for the validator address). This prints serialized unsigned transaction bytes, then you can use your preferred signing process to produce signed bytes.

Run the following command to execute it:

```codeBlockLines_p187
$ sui client execute-signed-tx

```

#### Update metadata (before committee is finalized) [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#update-metadata-before-committee-is-finalized "Direct link to Update metadata (before committee is finalized)")

Both key and URL are changeable **before the committee is finalized**. If you wish to update metadata, simply rerun `sui validator register-bridge-committee`.

#### View registered metadata [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#view-registered-metadata "Direct link to View registered metadata")

To double check you registered the correct metadata on chain, run

```codeBlockLines_p187
$ sui-bridge-cli view-bridge-registration --sui-rpc-url {SUI-FULLNODE-URL}

```

## Update metadata (after committee is finalized) [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#update-metadata-after-committee-is-finalized "Direct link to Update metadata (after committee is finalized)")

Use the following command to update bridge node URL:

```codeBlockLines_p187
$ sui validator update-bridge-committee-node-url

```

Refer to [offline signing section](https://docs.sui.io/guides/operator/bridge-node-configuration#offline-signing) in this page for how to sign the transaction offline.

Authoritiy key rotation is not supported yet.

## Bridge Node [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#bridge-node "Direct link to Bridge Node")

You have several options when configuring your Bridge Node for performance and metrics monitoring. Follow the instructions that follow to configure your node for best results in your environment.

### Bridge Node hardware requirements [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#bridge-node-hardware-requirements "Direct link to Bridge Node hardware requirements")

Suggested hardware requirements:

- CPU: 6 physical cores
- Memory: 16GB
- Storage: 200GB
- Network: 100Mbps

### WAF protection for Bridge Node [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#waf-protection-for-bridge-node "Direct link to WAF protection for Bridge Node")

To protect against distributed denial of service (DDoS) attacks and similar attacks intended to expend validator resources, you must provide rate limit protection for the bridge server.

In addition to protection, this gives node operators fine-grained control over the rate of requests they receive, and observability into those requests.

The currently recommended rate limit is `50 requests/second per unique IP`.

#### Web application firewall (WAF) options [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#web-application-firewall-waf-options "Direct link to Web application firewall (WAF) options")

You can use a managed cloud service, for example:

- [Cloudflare WAF](https://www.cloudflare.com/en-ca/application-services/products/waf/)
- [AWS WAF](https://aws.amazon.com/waf/)
- [GCP Cloud Armor](https://cloud.google.com/security/products/armor)

It's also possible to use an open source load balancer, such as [HAProxy](https://www.haproxy.org/) for a practical, IP-based rate limit.

A shortened example HAProxy configuration looks like the following:

```codeBlockLines_p187
frontend http-in
    bind *:80
    # Define an ACL to count requests per IP and block if over limit
    acl too_many_requests src_http_req_rate() gt 50
    # Track the request rate per IP
    stick-table type ip size 1m expire 1m store http_req_rate(1s)
    # Check request rate and deny if the limit is exceeded
    http-request track-sc0 src
    http-request deny if too_many_requests

    default_backend bridgevalidator

backend bridgevalidator
    # Note the port needs to match the value in Bridge Node config, default is 9191
    server bridgevalidator 0.0.0.0:9191

```

If choosing to use an open source load balancing option, make sure to set up metrics collection and alerting on the service.

### Bridge Node config [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#bridge-node-config "Direct link to Bridge Node config")

Use `sui-bridge-cli` command to create a template. If you want to run `BridgeClient` (see the following section), pass `--run-client` as a parameter.

```codeBlockLines_p187
$ sui-bridge-cli create-bridge-node-config-template {PATH}
$ sui-bridge-cli create-bridge-node-config-template --run-client {PATH}

```

The generated configuration includes the following parameters:

| Parameter | Description |
| --- | --- |
| `server-listen-port` | The port that Bridge Node listens to for handling requests. |
| `metrics-port` | Port to export Prometheus metrics. |
| `bridge-authority-key-path` | The path to the Bridge Validator key, generated from `sui-bridge-cli create-bridge-validator-key` command referenced previously. |
| `run-client` | Whether Bridge Client should be enabled in Bridge Node (more instructions follow). |
| `approved-governance-actions` | A list of governance actions that you want to support. |
| `sui:sui-rpc-url` | Sui RPC URL. |
| `sui:sui-bridge-chain-id` | `0` for Sui Mainnet, `1` for Sui Testnet. |
| `eth:eth-rpc-url` | Ethereum RPC URL. |
| `eth:eth-bridge-proxy-address` | The proxy address for Bridge Solidity contracts on Ethereum. |
| `eth:eth-bridge-chain-id` | `10` for Ethereum Mainnet, `11` for Sepolia Testnet. |
| `eth:eth-contracts-start-block-fallback` | The starting block BridgeNodes queries for from Ethereum FullNode. This number should be the block where Solidity contracts are deployed or slightly before. |
| `metrics:push-url` | The url of the remote Sui metrics pipeline (for example, `https://metrics-proxy.[testnet_OR_mainnet].sui.io:8443/publish/metrics`). See the [metrics push section](https://docs.sui.io/guides/operator/bridge-node-configuration#metrics-push) that follows for more details. |

With `run-client: true`, you can find these additional fields in the generated config:

| Parameter | Description |
| --- | --- |
| `db-path` | Path of BridgeClient database, for BridgeClient. |
| `sui:bridge-client-key-path` | The file path of Bridge Client key. This key can be generated with `sui-bridge-cli create-bridge-client-key` as previously shown. When `run-client` is true but you do not provide `sui:bridge-client-key-path`, it defaults to use the Bridge Validator key to submit transactions on Sui. This is not recommended for the sake of key separation. |

### Bridge Client [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#bridge-client "Direct link to Bridge Client")

`BridgeClient` orchestrates bridge transfer requests. It is **optional** to run for a `BridgeNode`. `BridgeClient` submits transaction on the Sui network. Thus when it's enabled, you need a Sui account key with enough SUI balance.

To enable `bridge_client` feature on a `BridgeNode`, set the following parameters in `BridgeNodeConfig`:

```codeBlockLines_p187
run-client: true
db-path: <PATH-TO-DB>
sui:
    bridge-client-key-path: <PATH-TO-BRIDGE-CLIENT-KEY>

```

To create a `BridgeClient` key pair, run

```codeBlockLines_p187
$ sui-bridge-cli create-bridge-client-key <PATH_TO_BRIDGE_CLIENT_KEY>

```

This prints the newly created Sui Address. Then we need to fund this address with some SUI for operations.

### Build Bridge Node [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#build-bridge-node "Direct link to Build Bridge Node")

Build or install Bridge Node in one of the following ways:

- Use `cargo install`.




```codeBlockLines_p187
$ cargo install --locked --git "https://github.com/MystenLabs/sui.git" --branch {BRANCH-NAME} sui-bridge

```








Or




```codeBlockLines_p187
$ cargo install --locked --git "https://github.com/MystenLabs/sui.git" --rev {SHA-NAME} sui-bridge

```

- Compile from source code




```codeBlockLines_p187
$ git clone https://github.com/MystenLabs/sui.git

```













```codeBlockLines_p187
$ cd sui

```













```codeBlockLines_p187
$ git fetch origin {BRANCH-NAME|SHA}

```













```codeBlockLines_p187
$ git checkout {BRANCH-NAME|SHA}

```













```codeBlockLines_p187
$ cargo build --release --bin sui-bridge

```

- Use `curl`/ `wget` pre-built binaries (for Linux/AMD64 only).




```codeBlockLines_p187
$ curl https://sui-releases.s3.us-east-1.amazonaws.com/{SHA}/sui-bridge -o sui-bridge

```

- Use pre-built Docker image. Pull from Docker Hub: `mysten/sui-tools:{SHA}`

### Run Bridge Node [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#run-bridge-node "Direct link to Run Bridge Node")

Running Bridge Node is similar to running a Sui node using systemd or Ansible. The command to start the Bridge Node is:

```codeBlockLines_p187
$ RUST_LOG=info,sui_bridge=debug sui-bridge --config-path {BRIDGE-NODE-CONFIG-PATH}

```

### Ingress [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#ingress "Direct link to Ingress")

Bridge Node listens for TCP connections over port `9191` (or the preferred port in the configuration file). You must allow incoming connections for that port on the host that is running Bridge Node.

Test ingress with `curl` on a remote machine and expect a `200` response:

```codeBlockLines_p187
$ curl -v {YOUR_BRIDGE_URL}

```

### Bridge Node monitoring [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#bridge-node-monitoring "Direct link to Bridge Node monitoring")

Use `uptime` to check if the node is running.

You can find a full list of Bridge Node metrics and their descriptions in the [`sui-bridge` crate](https://github.com/MystenLabs/sui/blob/main/crates/sui-bridge/src/metrics.rs).

#### When `run-client: false` [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#when-run-client-false "Direct link to when-run-client-false")

In this case Bridge Node runs as a passive observer and does not proactively poll on-chain activities. Important metrics to monitor in this case are the request handling metrics, such as:

- `bridge_requests_received`
- `bridge_requests_ok`
- `bridge_err_requests`
- `bridge_requests_inflight`
- `bridge_eth_rpc_queries`
- `bridge_eth_rpc_queries_latency`
- `bridge_signer_with_cache_hit`
- `bridge_signer_with_cache_miss`
- `bridge_sui_rpc_errors`

#### When `run-client: true` [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#when-run-client-true "Direct link to when-run-client-true")

In this case, Bridge Client is toggled on and syncs with blockchains proactively. The best metrics to track progress are:

- `bridge_last_synced_sui_checkpoints`
- `bridge_last_synced_eth_blocks`
- `bridge_last_finalized_eth_block`
- `bridge_sui_watcher_received_events`
- `bridge_eth_watcher_received_events`
- `bridge_sui_watcher_received_actions`
- `bridge_eth_watcher_received_actions`

`bridge_gas_coin_balance` is also a critical metric to track the balance of your client gas coin, and top up after it dips below a certain threshold.

### Metrics push [​](https://docs.sui.io/guides/operator/bridge-node-configuration\#metrics-push "Direct link to Metrics push")

The Bridge Nodes can push metrics to the remote proxy for network-level observability.

To enable metrics push, set the following parameters in `BridgeNodeConfig`:

```codeBlockLines_p187
metrics:
    push-url: https://metrics-proxy.[testnet|mainnet].sui.io:8443/publish/metrics

```

The proxy authenticates pushed metrics by using the metrics key pair. It is similar to `sui-node` pushing metrics with `NetworkKey`. Unlike `NetworkKey`, the Bridge Node metrics key is not recorded on chain and can be ephemeral. The metrics key is loaded from the `metrics-key-pair` field in `BridgeNodeConfig` if provided, otherwise a new key pair is generated on the fly. The proxy queries node public keys periodically by hitting the metrics public API key of each node.

When Bridge Node starts, it might log this line once:

```codeBlockLines_p187
unable to push metrics: error sending request for url (xyz); new client will be created

```

This is okay to ignore as long as it does not persist. Otherwise, try:

```codeBlockLines_p187
$ curl -i  {your-bridge-node-url-onchain}/metrics_pub_key

```

and make sure the public key is correctly returned.

- [Prerequisites](https://docs.sui.io/guides/operator/bridge-node-configuration#prerequisites)
- [Committee registration](https://docs.sui.io/guides/operator/bridge-node-configuration#committee-registration)
  - [Prepare for metadata](https://docs.sui.io/guides/operator/bridge-node-configuration#prepare-for-metadata)
  - [Registration](https://docs.sui.io/guides/operator/bridge-node-configuration#registration)
- [Update metadata (after committee is finalized)](https://docs.sui.io/guides/operator/bridge-node-configuration#update-metadata-after-committee-is-finalized)
- [Bridge Node](https://docs.sui.io/guides/operator/bridge-node-configuration#bridge-node)
  - [Bridge Node hardware requirements](https://docs.sui.io/guides/operator/bridge-node-configuration#bridge-node-hardware-requirements)
  - [WAF protection for Bridge Node](https://docs.sui.io/guides/operator/bridge-node-configuration#waf-protection-for-bridge-node)
  - [Bridge Node config](https://docs.sui.io/guides/operator/bridge-node-configuration#bridge-node-config)
  - [Bridge Client](https://docs.sui.io/guides/operator/bridge-node-configuration#bridge-client)
  - [Build Bridge Node](https://docs.sui.io/guides/operator/bridge-node-configuration#build-bridge-node)
  - [Run Bridge Node](https://docs.sui.io/guides/operator/bridge-node-configuration#run-bridge-node)
  - [Ingress](https://docs.sui.io/guides/operator/bridge-node-configuration#ingress)
  - [Bridge Node monitoring](https://docs.sui.io/guides/operator/bridge-node-configuration#bridge-node-monitoring)
  - [Metrics push](https://docs.sui.io/guides/operator/bridge-node-configuration#metrics-push)