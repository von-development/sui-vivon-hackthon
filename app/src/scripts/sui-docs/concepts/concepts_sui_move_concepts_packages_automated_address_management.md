# https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management

[Skip to main content](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#__docusaurus_skipToContent_fallback)

On this page

When you publish or upgrade a package, its address (also known as the package ID) is tracked in the `Move.lock` file. This bookkeeping is done automatically so that you can avoid recording or updating hex addresses (for example, in the `Move.toml` file).

When you publish or upgrade your package on multiple chains (Mainnet, Testnet, Devnet) separate addresses for each chain are tracked for you. This tracking is based on your active environment (run `sui client active-env` if unsure). For example, if you set your active environment to an RPC connected to `testnet` and publish a package, the `Move.lock` records the address for that package and associates it with your active environment ( `testnet`).

Note that automated address management works for one package published to one or more chains. When you publish or upgrade, address management uses the contents of the package's working directory. If a package is republished to a chain, addresses tracked for the previously published package are overwritten for that chain.

## Adopting automated address management for published packages [​](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management\#adopting-automated-address-management-for-published-packages "Direct link to Adopting automated address management for published packages")

Previously a `published-at` entry was **mandatory** in the `Move.toml` file, which sets the address of the latest published package. It is no longer required if this data is tracked in the `Move.lock` file. For an existing package, add the necessary data to the `Move.lock` file so that it can be automatically tracked:

1. Switch to your active environment for the chain that your package is published on




```codeBlockLines_p187
sui client --switch --env <YOUR-CHAIN-ENVIRONMENT>

```

2. Run the `manage-package` command with the data for your published package




```codeBlockLines_p187
sui move manage-package --environment "$(sui client active-env)" \
                     --network-id "$(sui client chain-identifier)" \
                     --original-id 'ORIGINAL-ADDRESS' \
                     --latest-id 'LATEST-ADDRESS' \
                     --version-number 'VERSION-NUMBER'

```









   - `ORIGINAL-ADDRESS` should be the address your package was first published at. If you never upgraded your package, this is the same address as your `published-at` address in the `Move.toml`
   - `LATEST-ADDRESS` should be the latest package address. If you never upgraded your package, it is the same as `ORIGINAL-ADDRESS`. If you upgraded your package, this is the same address as your current `published-at` address in the `Move.toml`.
   - `VERSION-NUMBER` is `1` if you never upgraded your package. Otherwise, it is a number greater than `1` depending on how many times you upgraded your package. In this case, look up the package at `LATEST-ADDRESS` to determine the version number.
3. Delete the `published-at` line in your `Move.toml`.
4. Set your package's address to `0x0` in the `[addresses]` section. For example:

```codeBlockLines_p187
[package]
name = "Kiosk"

[dependencies]
# ... your dependencies ...

[addresses]
kiosk = "0x0"

```

Your package is now tracked. You can repeat the above steps to track addresses for additional environments.

## Package upgrade guidance [​](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management\#package-upgrade-guidance "Direct link to Package upgrade guidance")

- When [upgrading](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#upgrade-requirements), you need to retrieve the `UpgradeCap` ID of your published package. Automated address management does not track your `UpgradeCap`.

- When [upgrading](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#example), you first need to set the `[addresses]` value for your package to `0x0` in the `Move.toml`, and restore its ID with the `ORIGINAL-ADDRESS` after upgrading.


## Troubleshooting [​](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management\#troubleshooting "Direct link to Troubleshooting")

Conflicting published package addresses might happen when the state of package data is inconsistent.

For example, you might have an existing package with a `published-at` value in the `Move.toml`. The package is re-published for testing purposes, and is now tracked in `Move.lock` with automated address management. The address in the `Move.toml` and `Move.lock` now differ, and there will be an error the next time you try to publish or upgrade the package.

Here are steps to remediate conflicting addresses:

- If the conflict is in a package you maintain:
  - Delete the `published-at` value in your `Move.toml` if this published address is no longer needed. Then set the package's address to `0x0` in the `[addresses]` section.
  - Alternatively, follow the steps to [adopt automated address management](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#adopting-automated-address-management-for-published-packages)
- If the conflict is in a package that you do not maintain (such as a dependency), consider fixing the issue locally with the steps above, or contacting the maintainer to upstream changes.


## Internal reference [​](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management\#internal-reference "Direct link to Internal reference")

This section is an overview of the schema and internal operation of tracked address in the `Move.lock` file. Most developers do not need to understand these internals. It is a reference for those who want a complete interface or control to internal state tracking.

A concrete example of the schema and state you might find in a `Move.lock` file:

```codeBlockLines_p187
[env]

[env.testnet]
chain-id = "4c78adac"
original-published-id = "0xa6041ac57f9151d49d00dcdc4f79f8c5ba1e399e1005dcb0fdd1c8632020d5a6"
latest-published-id = "0xa6041ac57f9151d49d00dcdc4f79f8c5ba1e399e1005dcb0fdd1c8632020d5a6"
published-version = "1"

[env.mainnet]
chain-id = "35834a8a"
original-published-id = "0xaee5759aedf6c533634cdd2de412f6e6dfc754a89b0ec554a73597348f334477"
latest-published-id = "0xaee5759aedf6c533634cdd2de412f6e6dfc754a89b0ec554a73597348f334477"
published-version = "1"

```

info

- An `[env]` table contains entries for each environment. When a package is published for an active environment, an entry is added or updated.

- An entry is added or updated based on its the `chain-id` of the environment. As in, addresses are keyed by `chain-id`, not the `[env.NAME]` part. This is so that packages and their dependencies are resolved canonically by chain identifier: keying by `[env.NAME]` is not robust when users can choose arbitrary environment `NAME` aliases.

- Key-value entries correspond to data explained in [adopting automated address management](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#adopting-automated-address-management-for-published-packages). Use the `sui move manage-package` command as a frontend to manipulate these values.


- [Adopting automated address management for published packages](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#adopting-automated-address-management-for-published-packages)
- [Package upgrade guidance](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#package-upgrade-guidance)
- [Troubleshooting](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#troubleshooting)
- [Internal reference](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management#internal-reference)