# https://docs.sui.io/guides/operator/updates

[Skip to main content](https://docs.sui.io/guides/operator/updates#__docusaurus_skipToContent_fallback)

On this page

## Sui release process [​](https://docs.sui.io/guides/operator/updates\#sui-release-process "Direct link to Sui release process")

Each Sui network is deployed on a consistent schedule. There are extenuating circumstances that might delay releases occasionally, but these delays are rare and communicated through [official channels](https://docs.sui.io/guides/operator/updates#communication).

- `devnet`: Deployed every week on Mondays.
- `testnet`: Deployed every week on Tuesdays.
- `mainnet`: Deployed every two weeks on Wednesdays.

info

For additional details, see each network's [release schedule and configuration](https://sui.io/networkinfo).

Whenever Sui releases a new version, you must update your Full node with the release to ensure compatibility with the network it connects to. For example, if you use Sui Testnet you should install the version of Sui running on Sui Testnet.

Any release that contains a protocol change will need to be followed before the protocol upgrade takes place (when enough stake within the validator set upgrades, the new protocol version is enacted in the next epoch).
If you do not update your Full node, you will not be able to connect to the network after the protocol upgrade takes place.

## Communication [​](https://docs.sui.io/guides/operator/updates\#communication "Direct link to Communication")

Releases are announced on [Sui Discord server](https://discord.com/invite/sui) and [node-operators](https://groups.google.com/a/groups.sui.io/g/node-operators) Google group.

### Discord channels [​](https://docs.sui.io/guides/operator/updates\#discord-channels "Direct link to Discord channels")

- `devnet`: [`#devnet-updates`](https://discord.com/channels/916379725201563759/1004638487078772736)
- `testnet`: [`#tn-validator-announcements`](https://discord.com/channels/916379725201563759/1003660994381353101), [`#testnet-updates`](https://discord.com/channels/916379725201563759/1095151359642304612), ⁠and [`#node-announcements`](https://discord.com/channels/916379725201563759/1002231298888306718) channels.
- `mainnet`: [`⁠#mn-validator-announcements`](https://discord.com/channels/916379725201563759/1093852827627040768), [`#mainnet-updates`](https://discord.com/channels/916379725201563759/1103082453792464906), and [`#node-announcements`](https://discord.com/channels/916379725201563759/1002231298888306718) channels.

## Update your Full node [​](https://docs.sui.io/guides/operator/updates\#update-your-full-node "Direct link to Update your Full node")

You can track the latest version of Sui on the [Sui Releases](https://github.com/MystenLabs/sui/releases) page on GitHub.
The schedule for each network is available in the [Network Release Schedule](https://sui.io/networkinfo) page.

It is reasonable to have to shut down your Full node to perform an update, whether that be a rolling restart in Kubernetes, or a systemctl stop on a Linux machine to replace the sui-node binary.

- [Sui release process](https://docs.sui.io/guides/operator/updates#sui-release-process)
- [Communication](https://docs.sui.io/guides/operator/updates#communication)
  - [Discord channels](https://docs.sui.io/guides/operator/updates#discord-channels)
- [Update your Full node](https://docs.sui.io/guides/operator/updates#update-your-full-node)