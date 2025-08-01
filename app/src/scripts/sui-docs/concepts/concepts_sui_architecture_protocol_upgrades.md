# https://docs.sui.io/concepts/sui-architecture/protocol-upgrades

[Skip to main content](https://docs.sui.io/concepts/sui-architecture/protocol-upgrades#__docusaurus_skipToContent_fallback)

The Sui protocol, framework, and execution engine are frequently extended to include new functionality and bug fixes. This functionality is added in the form of new code which is released to validator operators as part of our regular software releases. The Sui protocol, however, requires that all Sui validators agree about the results of executing each transaction.

This poses the following challenge: How do we release code that changes transaction execution, given that it is not possible to ensure that all operators upgrade their software at the same instant? Further, how do we ensure that all Sui transaction history can be replayed even after functionality has changed?

To solve this problem, Sui uses a process called protocol upgrades.

# Protocol upgrade process

An outline of the process used for protocol upgrades includes the following steps:

1. A Sui developer codes the new feature, but restricts access to the feature using a "feature flag" - a boolean config variable that is initially set to false.
2. The value of the feature flag is retrieved from a struct called `ProtocolConfig`.
3. The developer creates a new version of the `ProtocolConfig` struct where the new feature flag is set to true.
4. A new release of the Sui validator software is built and released to validator and Full node operators.
5. When the validator process starts up, it continues to use the previous version of `ProtocolConfig` (in which the flag is false). This way, all validators continue behaving identically regardless of whether they have the new software or not.
6. As validators are upgraded, they signal to the rest of the validator committee that they are prepared to switch to the new version of the configuration (in which the flag is enabled).
7. If enough validators vote to switch to the new protocol version, then the new version takes effect at the beginning of the next epoch.
8. The new feature now comes into effect.

Full nodes follow a similar process, however, they do not participate in voting. Instead, they follow the actions that validators recorded.

When validators switch to a new protocol version, they do so by recording the new version number in the special end-of-epoch transaction. Full nodes execute this transaction as they are replaying the chain history, and are thus able to switch to the new protocol version at the right time.

# Framework upgrades

Not all new Sui functionality comes in the form of changes to the validator code. There are also changes to the Sui framework. For instance, Sui developers periodically add new native functions to the framework to expose new functionality to smart contracts. The process for framework updates is similar to protocol upgrades.

Instead of using feature flags, however, Sui objects are used to coordinate framework changes. The Sui framework is a special object with id `0x2`.
The Move source code for the framework is built into the validator binary.

If the validator notices that its built-in framework is different from the framework in object `0x2`, it signals to the other validators that it would like to upgrade the framework to a new version. Just as with changes to `ProtocolConfig`, if enough validators agree to perform the upgrade, the new framework object is written at the end of the current epoch. Then, transactions that are executed in the new epoch use the new version of the framework.