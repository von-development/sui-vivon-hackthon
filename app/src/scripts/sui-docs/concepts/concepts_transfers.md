# https://docs.sui.io/concepts/transfers

[Skip to main content](https://docs.sui.io/concepts/transfers#__docusaurus_skipToContent_fallback)

On this page

Everything on Sui is an object and your smart contracts are inevitably going to need to move those objects around the network, transferring them from one owner to another. The topics in this section explore the options you have on Sui around transferring objects on the network.

## Custom Transfer Rules [​](https://docs.sui.io/concepts/transfers\#custom-transfer-rules "Direct link to Custom Transfer Rules")

On Sui, you can create custom transfer rules for objects that define the conditions that must be met for a valid transfer operation. The object you want to create custom transfer rules for cannot have the `store` ability, as that ability enables unrestricted transfers for the type via `sui::transfer::public_transfer` or the `TransferObjects` transaction command.

Go to [Custom Transfer Rules](https://docs.sui.io/concepts/transfers/custom-rules).

## Transfer to Object [​](https://docs.sui.io/concepts/transfers\#transfer-to-object "Direct link to Transfer to Object")

On Sui, you are not limited to only transferring objects to an address. You can transfer an object to another object, where the receiving object provides access control to the received object.

Go to [Transfer to Object](https://docs.sui.io/concepts/transfers/transfer-to-object).

- [Custom Transfer Rules](https://docs.sui.io/concepts/transfers#custom-transfer-rules)
- [Transfer to Object](https://docs.sui.io/concepts/transfers#transfer-to-object)