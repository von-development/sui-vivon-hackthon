# https://docs.sui.io/guides/developer/nft/nft-soulbound

[Skip to main content](https://docs.sui.io/guides/developer/nft/nft-soulbound#__docusaurus_skipToContent_fallback)

On this page

A soulbound NFT is an NFT that is non-transferable. After an NFT is minted to a Sui account, the NFT is "bounded" to that account and cannot be transferred. This implementation leverages the custom logic of the Sui framework's transfer functions. The [`sui::transfer` module](https://docs.sui.io/references/framework/sui-framework/transfer) contains two functions that transfers objects: [`transfer::transfer`](https://docs.sui.io/references/framework/sui-framework/transfer#function-transfer) and [`transfer::public_transfer`](https://docs.sui.io/references/framework/sui-framework/transfer#function-public_transfer).

Typically, when defining new NFTs or object types on Sui, you don't need to create a transfer function because the Sui Framework offers `transfer::public_transfer` which anyone can use to transfer objects. However, `transfer::public_transfer` requires transferred objects have the `key` and `store` ability. Therefore, if you define a new NFT type that has the `key` ability, meaning it is a Sui object, but not the `store` ability, the holders won't be able to use `transfer::public_transfer`. This results in a soulbound NFT.

It is also possible to create custom transfer logic for NFTs on Sui. The `transfer::transfer` function has custom rules performed by the Sui Move bytecode verifier that ensures that the transferred objects are defined in the module where transfer is invoked. While removing the `store` ability from a struct definition makes `transfer::public_transfer` unusable, `transfer::transfer` can still be used as long as it's used in the module that defined that object's type. This allows for the module owner to provide custom transfer logic for their soulbound NFTs.

## Example [​](https://docs.sui.io/guides/developer/nft/nft-soulbound\#example "Direct link to Example")

The following example creates a basic soulbound NFT on Sui. The `TestnetSoulboundNFT` struct defines the NFT with an `id`, `name`, `description`, and `url` fields.

[examples/move/nft-soulbound/sources/testnet\_soulbound\_nft.move](https://github.com/MystenLabs/sui/tree/main/examples/move/nft-soulbound/sources/testnet_soulbound_nft.move)

```codeBlockLines_p187
public struct TestnetSoulboundNFT has key {
    id: UID,
    name: string::String,
    description: string::String,
    url: Url,
}

```

This `TestnetSoulboundNFT` struct is defined with the `key` ability but without the `store` ability. This means you cannot transfer it with `transfer::public_transfer`. Instead, use `transfer::transfer` with custom transfer logic implemented in the same module.

This example also shows how to provide custom transfer logic using the `transfer::transfer` function. This is where you can add additional logic, such as resetting the NFT's stats or requiring a payment. Don't provide this functionality if the NFT is fully soulbound.

[examples/move/nft-soulbound/sources/testnet\_soulbound\_nft.move](https://github.com/MystenLabs/sui/tree/main/examples/move/nft-soulbound/sources/testnet_soulbound_nft.move)

```codeBlockLines_p187
/// Transfer `nft` to `recipient`
/// Do not include this if you want the NFT fully soulbound
public fun transfer(nft: TestnetSoulboundNFT, recipient: address, _: &mut TxContext) {
    // Add custom logic for transferring the NFT
    transfer::transfer(nft, recipient)
}

```

Click to open

`testnet_soulbound_nft.move`

[examples/move/nft-soulbound/sources/testnet\_soulbound\_nft.move](https://github.com/MystenLabs/sui/tree/main/examples/move/nft-soulbound/sources/testnet_soulbound_nft.move)

```codeBlockLines_p187
module examples::testnet_soulbound_nft;

use std::string;
use sui::event;
use sui::url::{Self, Url};

/// An example soulbound NFT that can be minted by anybody
///
/// Removing the `store` ablity prevents this NFT
/// from being transferred unless this module provides
/// a transfer function.
public struct TestnetSoulboundNFT has key {
		id: UID,
		/// Name for the token
		name: string::String,
		/// Description of the token
		description: string::String,
		/// URL for the token
		url: Url,
		// TODO: allow custom attributes
}

// ===== Events =====

public struct NFTMinted has copy, drop {
		// The Object ID of the NFT
		object_id: ID,
		// The creator of the NFT
		creator: address,
		// The name of the NFT
		name: string::String,
}

// ===== Public view functions =====

/// Get the NFT's `name`
public fun name(nft: &TestnetSoulboundNFT): &string::String {
		&nft.name
}

/// Get the NFT's `description`
public fun description(nft: &TestnetSoulboundNFT): &string::String {
		&nft.description
}

/// Get the NFT's `url`
public fun url(nft: &TestnetSoulboundNFT): &Url {
		&nft.url
}

// ===== Entrypoints =====

#[allow(lint(self_transfer))]
/// Create a new devnet_nft
public fun mint_to_sender(
		name: vector<u8>,
		description: vector<u8>,
		url: vector<u8>,
		ctx: &mut TxContext,
) {
		let sender = ctx.sender();
		let nft = TestnetSoulboundNFT {
				id: object::new(ctx),
				name: string::utf8(name),
				description: string::utf8(description),
				url: url::new_unsafe_from_bytes(url),
		};

		event::emit(NFTMinted {
				object_id: object::id(&nft),
				creator: sender,
				name: nft.name,
		});

		transfer::transfer(nft, sender);
}

/// Transfer `nft` to `recipient`
/// Do not include this if you want the NFT fully soulbound
public fun transfer(nft: TestnetSoulboundNFT, recipient: address, _: &mut TxContext) {
		// Add custom logic for transferring the NFT
		transfer::transfer(nft, recipient)
}

/// Update the `description` of `nft` to `new_description`
public fun update_description(
		nft: &mut TestnetSoulboundNFT,
		new_description: vector<u8>,
		_: &mut TxContext,
) {
		nft.description = string::utf8(new_description)
}

/// Permanently delete `nft`
public fun burn(nft: TestnetSoulboundNFT, _: &mut TxContext) {
		let TestnetSoulboundNFT { id, name: _, description: _, url: _ } = nft;
		id.delete()
}

```

## Related links [​](https://docs.sui.io/guides/developer/nft/nft-soulbound\#related-links "Direct link to Related links")

- [Soulbound NFT example source code](https://github.com/MystenLabs/sui/tree/main/examples/move/nft-soulbound): The source code that this document references.
- [NFT Rental](https://docs.sui.io/guides/developer/nft/nft-rental): Example that rents NFTs using Kiosk Apps.
- [Asset Tokenization](https://docs.sui.io/guides/developer/nft/asset-tokenization): Example that uses NFTs to tokenize real-world assets.

- [Example](https://docs.sui.io/guides/developer/nft/nft-soulbound#example)
- [Related links](https://docs.sui.io/guides/developer/nft/nft-soulbound#related-links)