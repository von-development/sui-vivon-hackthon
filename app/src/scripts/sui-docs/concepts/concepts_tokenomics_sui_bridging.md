# https://docs.sui.io/concepts/tokenomics/sui-bridging

[Skip to main content](https://docs.sui.io/concepts/tokenomics/sui-bridging#__docusaurus_skipToContent_fallback)

On this page

Bridging is the process of moving tokens from one blockchain to another. When you use a bridge to move tokens between blockchains that are incompatible, the tokens are "wrapped" by the bridge, which means that they get converted to a derivative token for the target blockchain. You can transfer tokens in from other blockchains to SUI, or transfer SUI tokens out to other blockchains.

Sui supports bridging through [Sui Bridge](https://docs.sui.io/concepts/tokenomics/sui-bridging#sui-bridge), [Wormhole Connect](https://docs.sui.io/concepts/tokenomics/sui-bridging#wormhole-connect), and [Wormhole Portal Bridge](https://docs.sui.io/concepts/tokenomics/sui-bridging#wormhole-portal-bridge).

## Sui Bridge [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#sui-bridge "Direct link to Sui Bridge")

Sui Bridge is the native bridge for the Sui network. Sui Bridge is built into the core architecture of the Sui blockchain, which provides optimal integration and operation. Sui Bridge enables the movement of digital assets between the Sui block chain and others, preserving security and maintaining interoperability between diverse ecosystems. Sui Bridge provides secure and efficient transfer of native and wrapped ETH to and from Sui. Sui Bridge leverages the unique capabilities of the Sui network to offer fast transaction speeds, lower transaction costs, and a decentralized architecture.

You can bridge tokens in the official Sui Bridge website: [https://bridge.sui.io/](https://bridge.sui.io/).

### Operation and governance [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#operation-and-governance "Direct link to Operation and governance")

Sui Bridge is operated and governed by Sui network validators, the same set of validators that secure the Sui network. Bridge transfers and other actions require validator signatures with a minimal threshold of voting power.

Similar to the Sui network, all governance related to the Sui Bridge is done through validator voting.

To learn more about how to set up a Sui Bridge Full Node, see [Sui Bridge Validator Node Configuration](https://docs.sui.io/guides/operator/bridge-node-configuration).

### Supported chains and tokens [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#supported-chains-and-tokens "Direct link to Supported chains and tokens")

You can transfer supported assets both to and from the Sui network. Sui Bridge supports token bridging between Sui and other networks with the following supported assets:

| Asset | Description |
| --- | --- |
| Wrapped Bitcoin | Tokenized representation of the native cryptocurrency of the Bitcoin network. |
| Lightning Bitcoin (LBTC) | Fully decentralized Internet-of-value protocol for global payments. |
| Ethereum (ETH) | The native cryptocurrency of the Ethereum network, widely used for transactions and smart contract interactions. |
| Wrapped Ethereum (WETH) | Tokenized representation of native ETH. |
| Tether (USDT) | A stablecoin pegged to the US dollar. |

### Package IDs and contract addresses [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#package-ids-and-contract-addresses "Direct link to Package IDs and contract addresses")

The following package IDs and addresses are reserved for the Sui Bridge.

| Asset | Address/ID |
| --- | --- |
| Sui Bridge package on Sui | [`0xb`](https://suiscan.xyz/mainnet/object/0x000000000000000000000000000000000000000000000000000000000000000b/txs) |
| Sui Bridge object on Sui | [`0x9`](https://suiscan.xyz/mainnet/object/0x0000000000000000000000000000000000000000000000000000000000000009) |
| Sui Bridge contract on Ethereum Mainnet | [`0xda3bD1fE1973470312db04551B65f401Bc8a92fD`](https://etherscan.io/address/0xda3bd1fe1973470312db04551b65f401bc8a92fd) |
| ETH on Sui | [`0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH`](https://suiscan.xyz/mainnet/coin/0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH/txs) |
| ETH on Ethereum | Native Ether |
| WETH on Ethereum | [`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) |

### Source code [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#source-code "Direct link to Source code")

The source code for Sui Bridge is open-source and found in the following locations:

- Move: [https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/bridge](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/bridge)
- Solidity: [https://github.com/MystenLabs/sui/tree/main/bridge/evm](https://github.com/MystenLabs/sui/tree/main/bridge/evm)
- Bridged ETH (Move): [https://github.com/MystenLabs/sui/tree/main/bridge/move/tokens/eth](https://github.com/MystenLabs/sui/tree/main/bridge/move/tokens/eth)
- Bridge Node: [https://github.com/MystenLabs/sui/tree/main/crates/sui-bridge](https://github.com/MystenLabs/sui/tree/main/crates/sui-bridge)
- Bridge Indexer: [https://github.com/MystenLabs/sui/tree/main/crates/sui-bridge-indexer](https://github.com/MystenLabs/sui/tree/main/crates/sui-bridge-indexer)

### Audits [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#audits "Direct link to Audits")

There are two audit reports available for Sui Bridge:

- [OtterSec](https://github.com/sui-foundation/security-audits/blob/main/docs/Sui_bridge_v1_OtterSec.pdf)
- [Zellic](https://github.com/sui-foundation/security-audits/blob/main/docs/Sui_Bridge_v1_Zellic.pdf)

### Global limiter [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#global-limiter "Direct link to Global limiter")

A limiter protects the user's funds by constraining the total value of assets leaving Sui Bridge in any 24-hour window. It tracks total value hourly and aggregates values from the previous 24 hours. Therefore, when the limiter cools down, it refreshes every hour.

The limit applies globally and varies per direction. For example, the amount might be different between Ethereum to Sui and Sui to Ethereum.

The limit also impacts the maximal amount of single transfer. In one bridge transfer, you cannot move assets worth more than the limit. The bridge frontend might apply stricter restrictions to protect user assets.

The limit per route is governed by the validator committee through voting. The limit value is captured in the `approved-governance-actions` attribute of Bridge node configurations, which is announced in the [mn-validator-announcements channel](https://discord.com/channels/916379725201563759/1093852827627040768) on Discord when it updates.

The global limit is currently $16 million from Ethereum to Sui and $7 million from Sui to Etheruem every 24 hours.

### Asset price [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#asset-price "Direct link to Asset price")

Sui Bridge v1 uses static pricing to calculate limits. The price for ETH is configured at $2,600.00. Namely, bridging one ETH consumes $2,600 USD in limit calculation.

The validator committee governs the pricing through voting. It works together with the global limiter to protect user funds.

### Transfer limit [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#transfer-limit "Direct link to Transfer limit")

There is no minimal limit for transfer, but a tiny fraction might be rounded down. Particularly for native Ethereum (ETH) and wrapped Ethereum (WETH) because of reduced precision of eight decimal places, the value of 10.0000000000000001 (W)ETH is rounded down to 10 (W)ETH.

| Token | Minimal value |
| --- | --- |
| ETH | 0.00000001 ETH (eight decimal places of precision) |
| WETH | 0.00000001 ETH (eight decimal places of precision) |

The maximum limit per transfer is the global limit in USD value. Namely a user cannot claim assets on the destination chain if the USD value is higher than the global limit. See the [Global limiter section](https://docs.sui.io/concepts/tokenomics/sui-bridging#global-limiter) for details.

## Wormhole Connect [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#wormhole-connect "Direct link to Wormhole Connect")

Use Wormhole Connect to bridge tokens from any Wormhole supported chain into Sui and get dropped off with extra Sui to pay gas fees. Developers can also embed the Connect Token Bridge directly into their own websites and dApps.

tip

Wormhole provides a tutorial for cross-chain transfers of Sui using a Wormhole Connect integration. Visit [Cross-Chain Token Transfers with Wormhole Connect](https://wormhole.com/docs/tutorials/messaging/sui-connect/) on the Wormhole website to get started.

### Wormhole Connect asset support [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#asset-support "Direct link to Wormhole Connect asset support")

Initially, Wormhole Connect supports only lock-and-mint bridging for ETH, WETH, USDC, MATIC, WMATIC, BNB, WBNB, AVAX, WAVAX, FTM, WFTM, CELO, GLMR, WGLRM, AND SOL across Ethereum, Polygon, BSC, Avalanche, Celo, Moonbeam, Solana and Sui. This means that any native token bridged through Wormhole Connect and the underlying Wormhole Token Bridge are received as a Wormhole-minted token on the destination chain. In some cases, Wormhole-minted tokens are the canonical representation on the chain. See the [Wormhole token list](https://github.com/wormhole-foundation/wormhole-token-list) on GitHub. Some Wormhole-minted tokens support swapping on the destination chain's DEX(s) for whichever assets you need.

### Wormhole Connect automatic relay [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#automatic-relay "Direct link to Wormhole Connect automatic relay")

On EVM-based chains and Sui, Wormhole Connect lets you bridge assets while having to pay gas only on the source chain. The automatic relaying feature pays gas on behalf of users on the destination chain.

### Wormhole Connect gas drop-off [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#gas-drop-off "Direct link to Wormhole Connect gas drop-off")

The gas drop-off feature enables users to pay an additional fee on the source chain to request a small amount of native gas on the destination chain. For example, a user bridging USDC from Ethereum to Sui can pay a fee denominated in USDC from their sending wallet to receive some native SUI in their receiving wallet. This is in addition to the USDC they are bridging over. Gas drop-off is currently supported on EVM-based chains and Sui.

To learn more about Wormhole Connect, see their [FAQ](https://docs.wormhole.com/wormhole/faqs) page.

## Wormhole Portal Bridge [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#wormhole-portal-bridge "Direct link to Wormhole Portal Bridge")

The Wormhole powered [Portal Bridge](https://www.portalbridge.com/sui) supports bridging any asset from any of the [22 supported Wormhole chains](https://www.wormhole.com/network).

## Token address list [​](https://docs.sui.io/concepts/tokenomics/sui-bridging\#token-address-list "Direct link to Token address list")

The following table lists the address associated with each token type. You can confirm the legitimacy of tokens when you bridge them by confirming that the address used matches the address for the token type.

| Token | Address |
| --- | --- |
| CELO | 0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f |
| WMATIC | 0xdbe380b13a6d0f5cdedd58de8f04625263f113b3f9db32b3e1983f49e2841676 |
| WBNB | 0xb848cce11ef3a8f62eccea6eb5b35a12c4c2b1ee1af7755d02d7bd6218e8226f |
| WETH | 0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5 |
| USDC | 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf |
| USDT | 0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c |
| WBTC | 0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881 |
| WAVAX | 0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766 |
| WFTM | 0x6081300950a4f1e2081580e919c210436a1bed49080502834950d31ee55a2396 |
| WGLMR | 0x66f87084e49c38f76502d17f87d17f943f183bb94117561eb573e075fdc5ff75 |
| WSOL | 0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8 |
| USDCsol | 0xb231fcda8bbddb31f2ef02e6161444aec64a514e2c89279584ac9806ce9cf037 |

- [Sui Bridge](https://docs.sui.io/concepts/tokenomics/sui-bridging#sui-bridge)
  - [Operation and governance](https://docs.sui.io/concepts/tokenomics/sui-bridging#operation-and-governance)
  - [Supported chains and tokens](https://docs.sui.io/concepts/tokenomics/sui-bridging#supported-chains-and-tokens)
  - [Package IDs and contract addresses](https://docs.sui.io/concepts/tokenomics/sui-bridging#package-ids-and-contract-addresses)
  - [Source code](https://docs.sui.io/concepts/tokenomics/sui-bridging#source-code)
  - [Audits](https://docs.sui.io/concepts/tokenomics/sui-bridging#audits)
  - [Global limiter](https://docs.sui.io/concepts/tokenomics/sui-bridging#global-limiter)
  - [Asset price](https://docs.sui.io/concepts/tokenomics/sui-bridging#asset-price)
  - [Transfer limit](https://docs.sui.io/concepts/tokenomics/sui-bridging#transfer-limit)
- [Wormhole Connect](https://docs.sui.io/concepts/tokenomics/sui-bridging#wormhole-connect)
  - [Wormhole Connect asset support](https://docs.sui.io/concepts/tokenomics/sui-bridging#asset-support)
  - [Wormhole Connect automatic relay](https://docs.sui.io/concepts/tokenomics/sui-bridging#automatic-relay)
  - [Wormhole Connect gas drop-off](https://docs.sui.io/concepts/tokenomics/sui-bridging#gas-drop-off)
- [Wormhole Portal Bridge](https://docs.sui.io/concepts/tokenomics/sui-bridging#wormhole-portal-bridge)
- [Token address list](https://docs.sui.io/concepts/tokenomics/sui-bridging#token-address-list)