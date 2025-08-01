# https://docs.sui.io/concepts/cryptography/nautilus

[Skip to main content](https://docs.sui.io/concepts/cryptography/nautilus#__docusaurus_skipToContent_fallback)

On this page

Nautilus is a framework for secure and verifiable off chain computation on Sui. It enables builders to delegate sensitive or resource-intensive tasks to a self-managed [trusted execution environment (TEE)](https://en.wikipedia.org/wiki/Trusted_execution_environment) while preserving trust on chain through smart contract-based verification.

Nautilus is designed for hybrid decentralized applications (dApps) that require private data handling, complex computation, or integration with external (Web2) systems. It ensures that off-chain computations are tamper resistant, isolated, and cryptographically verifiable.

It currently supports self-managed [AWS Nitro Enclave TEEs](https://aws.amazon.com/ec2/nitro/nitro-enclaves/). Developers can verify AWS-signed enclave attestations on chain using Sui smart contracts written in Move. Refer to the [Github repo](https://github.com/MystenLabs/nautilus) for the reproducible build template.

## Features [​](https://docs.sui.io/concepts/cryptography/nautilus\#features "Direct link to Features")

A Nautilus application consists of two components:

- Off-chain server: Runs inside a TEE, like AWS Nitro Enclaves, and performs the actual computation, such as processing user input or executing a scheduled task.
- On-chain smart contract: Written in Move, this contract receives the output and verifies the TEE's attestation before trusting or acting on the data.

info

Initial support for AWS Nitro Enclaves is due to its maturity and reproducibility. Additional TEE providers might become available in the future.

### How it works [​](https://docs.sui.io/concepts/cryptography/nautilus\#how-it-works "Direct link to How it works")

- Deploy the off-chain server to a self-managed TEE, such as AWS Nitro Enclaves. You have the option of using the [available reproducible build template](https://github.com/MystenLabs/nautilus).
- The TEE generates a cryptographic attestation that proves the integrity of the execution environment.
- Sui smart contracts verify the attestation on chain before accepting the TEE output.
- The integrity of the TEE is auditable and anchored by the provider’s root of trust.

Refer to [Nautilus Design](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design) and [Using Nautilus](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus) for details.

important

The [provided reproducible build template](https://github.com/MystenLabs/nautilus) is intended as a starting point for building your own enclave. It is not feature complete, has not undergone a security audit, and is offered as a modification-friendly reference licensed under the Apache 2.0 license. THE TEMPLATE AND ITS RELATED DOCUMENTATION ARE PROVIDED `AS IS` WITHOUT WARRANTY OF ANY KIND FOR EVALUATION PURPOSES ONLY.
You can adapt and extend it to fit your specific use case.

## Use cases [​](https://docs.sui.io/concepts/cryptography/nautilus\#use-cases "Direct link to Use cases")

Nautilus supports several Web3 use cases for trustworthy and verifiable off-chain computation. Some examples include:

- **Trusted oracles:** Nautilus could ensure that oracles fetch and process off-chain data in a tamper-resistant manner before providing results to a smart contract. The source of external data could be a Web2 service (like weather, sports, betting, asset prices, and so on) or a decentralized storage platform like [Walrus](https://walrus.xyz/).
- **AI agents:** Nautilus is ideal for securely running AI models for inference or to execute agentic workflows to produce actionable outcomes, while providing data and model provenance on chain.
- **DePIN solutions:** DePIN (Decentralized Physical Infrastructure) can leverage Nautilus for private data computation in IoT and supply chain networks.
- **Fraud prevention in multi-party systems:** Decentralized exchanges (DEXs) could use Nautilus for order matching and settlement, or layer-2 solutions could prevent collision and fraud by securely running computations between untrusted parties.
- **Identity management:** Nautilus can provide solutions in the identity management space that require on-chain verifiability for decentralized governance and proof of tamper resistance.

When used together, Nautilus and [Seal](https://github.com/MystenLabs/seal) enable powerful privacy-preserving use cases by combining secure and verifiable computation with secure key access. A common challenge with TEEs is persisting secret keys across restarts and different machines. Seal can address this by securely storing long-term keys and granting access only to properly attested TEEs. In this model, Nautilus handles computation over the encrypted data, while Seal controls key access. Applications that require a shared encrypted state can use both tools to privately process user requests and update encrypted data on public networks.

## Future plans and non-goals [​](https://docs.sui.io/concepts/cryptography/nautilus\#future-plans-and-non-goals "Direct link to Future plans and non-goals")

Nautilus will support additional TEE providers in the future, such as [Intel TDX](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html) and [AMD SEV](https://www.amd.com/en/developer/sev.html) possibly. Your suggestions on which platforms to prioritize or support is greatly appreciated.

Contact us

For questions about Nautilus, use case discussions, or integration support, contact the Nautilus team on [Sui Discord](https://discord.com/channels/916379725201563759/1361500579603546223).

Nautilus does not have a native, readily usable TEE network. Nautilus partners might provide such TEE networks, however. Apart from such networks, you are encouraged to deploy and manage your own TEEs for running off-chain Nautilus servers.

- [Features](https://docs.sui.io/concepts/cryptography/nautilus#features)
  - [How it works](https://docs.sui.io/concepts/cryptography/nautilus#how-it-works)
- [Use cases](https://docs.sui.io/concepts/cryptography/nautilus#use-cases)
- [Future plans and non-goals](https://docs.sui.io/concepts/cryptography/nautilus#future-plans-and-non-goals)