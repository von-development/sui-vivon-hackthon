# https://docs.sui.io/guides/operator/monitoring

[Skip to main content](https://docs.sui.io/guides/operator/monitoring#__docusaurus_skipToContent_fallback)

On this page

info

These instructions are for advanced users. If you just need a local development environment, you should instead follow the instructions in [Create a Local Sui Network](https://docs.sui.io/guides/developer/getting-started/local-network) to create a local Full node, validators, and faucet.

Nodes expose on `localhost:9184/metrics` by default.

You can view the metrics in the metrics UI, or you can use a tool like `curl` to get the metrics in a format that is easy to parse.

```codeBlockLines_p187
$ curl -s http://localhost:9184/metrics | grep -E 'sui_validator|sui_fullnode'

```

## Production monitoring [​](https://docs.sui.io/guides/operator/monitoring\#production-monitoring "Direct link to Production monitoring")

For production monitoring, we recommend using [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/).

You can use grafana agent, grafana alloy, or another tool to scrape the metrics from your node.

- [Production monitoring](https://docs.sui.io/guides/operator/monitoring#production-monitoring)