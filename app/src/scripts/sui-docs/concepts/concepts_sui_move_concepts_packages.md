# https://docs.sui.io/concepts/sui-move-concepts/packages

[Skip to main content](https://docs.sui.io/concepts/sui-move-concepts/packages#__docusaurus_skipToContent_fallback)

On this page

A Move package on Sui includes one or more modules that define that package's interaction with on-chain objects. You develop the logic for those modules using Move, which you then compile into an object. Finally, you publish your package object onto a Sui network. On chain, anyone can view your package contents and the logic it employs to manipulate other on-chain objects using a Sui network explorer.

## Packages are immutable [​](https://docs.sui.io/concepts/sui-move-concepts/packages\#packages-are-immutable "Direct link to Packages are immutable")

After you publish a package object on chain to a network, it lives there forever. You cannot directly change the code of an on-chain package object. After a package object appears on chain, other packages can use the modules that the original package provides. Bad actors aside, imagine if someone changed the logic in their on-chain package to correct unintentional behavior that was overlooked during development. This would cause a ripple effect, changing the logic of every package that uses that module to perform in ways the developers might have never intended.

## Upgrading packages [​](https://docs.sui.io/concepts/sui-move-concepts/packages\#upgrading-packages "Direct link to Upgrading packages")

While you can't manipulate on-chain packages directly, you do have the ability to upgrade them. Upgrading on-chain packages provides a way to improve your code or add features without affecting packages that use the original package. When you upgrade a package, you're creating a new object on chain instead of modifying the original package. See [Upgrading Packages](https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade) to learn more about the process.

## Using Sui Client CLI to upgrade packages [​](https://docs.sui.io/concepts/sui-move-concepts/packages\#using-sui-client-cli-to-upgrade-packages "Direct link to Using Sui Client CLI to upgrade packages")

The [Sui Client CLI](https://docs.sui.io/references/cli/client) `upgrade` command offers an approachable way to upgrade packages when the CLI active address owns the `UpgradeCap` object associated with those packages.

Using the Sui CLI is useful to get started with upgrades, or in the early stages of package development, but protecting the ability to upgrade a package on chain using a single key can pose a security risk for several reasons:

- The entity owning that key might make changes that are in their own interests but not the interests of the broader community.
- Upgrades might happen without enough time for package users to consult on the change or stop using the package if they disagree.
- The key might get lost.

### Making packages immutable [​](https://docs.sui.io/concepts/sui-move-concepts/packages\#making-packages-immutable "Direct link to Making packages immutable")

You can make a package _immutable_ when it goes live to mitigate the single-key risk using the Move `sui::package::make_immutable` function to destroy its `UpgradeCap`. Making the package immutable, however, prevents future bug fixes and new features, which might not be practical or desired.

To protect your package from single-key risk on chain, see [Custom Upgrade Policies](https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies).

- [Packages are immutable](https://docs.sui.io/concepts/sui-move-concepts/packages#packages-are-immutable)
- [Upgrading packages](https://docs.sui.io/concepts/sui-move-concepts/packages#upgrading-packages)
- [Using Sui Client CLI to upgrade packages](https://docs.sui.io/concepts/sui-move-concepts/packages#using-sui-client-cli-to-upgrade-packages)
  - [Making packages immutable](https://docs.sui.io/concepts/sui-move-concepts/packages#making-packages-immutable)