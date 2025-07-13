

module vivon::vivon_nft;

// === Imports ===
use sui::event;
use std::string::String;
use sui::package;
use sui::display;

// === Error Constants ===
const E_INVALID_EDITION: u64 = 1;
const E_INSUFFICIENT_TOKENS: u64 = 3;

// === Structs ===

/// Main NFT struct for VIVON collectibles
public struct VivonNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    edition: u64,
    creator: address,
    created_at: u64,
}

/// One-time witness for creating the display object
public struct VIVON_NFT has drop {}

/// Admin capability for managing NFTs
public struct VivonNFTAdmin has key {
    id: UID,
    total_minted: u64,
    max_supply: u64,
}

// === Events ===

public struct NFTMinted has copy, drop {
    nft_id: ID,
    recipient: address,
    edition: u64,
    name: String,
}

public struct NFTBurned has copy, drop {
    nft_id: ID,
    owner: address,
    edition: u64,
}

public struct MetadataUpdated has copy, drop {
    nft_id: ID,
    old_description: String,
    new_description: String,
}

// === Init Function ===

fun init(otw: VIVON_NFT, ctx: &mut TxContext) {
    // Create package object
    let publisher = package::claim(otw, ctx);
    
    // Create display object
    let mut display = display::new<VivonNFT>(&publisher, ctx);
    
    // Set display fields
    display::add(&mut display, std::string::utf8(b"name"), std::string::utf8(b"{name}"));
    display::add(&mut display, std::string::utf8(b"description"), std::string::utf8(b"{description}"));
    display::add(&mut display, std::string::utf8(b"image_url"), std::string::utf8(b"{image_url}"));
    display::add(&mut display, std::string::utf8(b"edition"), std::string::utf8(b"Edition #{edition}"));
    display::add(&mut display, std::string::utf8(b"creator"), std::string::utf8(b"{creator}"));
    display::add(&mut display, std::string::utf8(b"project_name"), std::string::utf8(b"VIVON Collectibles"));
    display::add(&mut display, std::string::utf8(b"project_url"), std::string::utf8(b"https://vivon.com"));
    
    // Update display
    display::update_version(&mut display);
    
    // Create admin capability
    let admin = VivonNFTAdmin {
        id: sui::object::new(ctx),
        total_minted: 0,
        max_supply: 10000, // 10k max supply
    };
    
    // Transfer objects
    sui::transfer::public_transfer(publisher, tx_context::sender(ctx));
    sui::transfer::public_transfer(display, tx_context::sender(ctx));
    sui::transfer::transfer(admin, tx_context::sender(ctx));
}

// === Public Functions ===

/// Create a new VIVON NFT collectible
public fun mint_collectible(
    name: String,
    description: String,
    image_url: String,
    recipient: address,
    admin: &mut VivonNFTAdmin,
    ctx: &mut TxContext
): VivonNFT {
    // Check supply limit
    assert!(admin.total_minted < admin.max_supply, E_INVALID_EDITION);
    
    // Increment edition counter
    admin.total_minted = admin.total_minted + 1;
    let edition = admin.total_minted;
    
    // Create NFT
    let nft_id = sui::object::new(ctx);
    let nft_id_copy = sui::object::uid_to_inner(&nft_id);
    
    let nft = VivonNFT {
        id: nft_id,
        name,
        description,
        image_url,
        edition,
        creator: tx_context::sender(ctx),
        created_at: tx_context::epoch_timestamp_ms(ctx),
    };
    
    // Emit event
    event::emit(NFTMinted {
        nft_id: nft_id_copy,
        recipient,
        edition,
        name: nft.name,
    });
    
    nft
}

/// Burn an NFT (removes it from circulation)
public fun burn_nft(nft: VivonNFT) {
    let VivonNFT { 
        id, 
        name: _, 
        description: _, 
        image_url: _, 
        edition, 
        creator: _, 
        created_at: _ 
    } = nft;
    
    let nft_id = sui::object::uid_to_inner(&id);
    
    // Emit burn event
    event::emit(NFTBurned {
        nft_id,
        owner: @0x0, // We don't have access to current owner here
        edition,
    });
    
    sui::object::delete(id);
}

/// Update NFT metadata (only description and image_url can be updated)
public fun update_metadata(
    nft: &mut VivonNFT,
    new_description: String,
    new_image_url: String,
    _ctx: &mut TxContext
) {
    let old_description = nft.description;
    nft.description = new_description;
    nft.image_url = new_image_url;
    
    // Emit update event
    event::emit(MetadataUpdated {
        nft_id: sui::object::uid_to_inner(&nft.id),
        old_description,
        new_description,
    });
}

// === Entry Functions ===

/// Public entry function to mint a default VIVON collectible
public entry fun mint_default_collectible(
    recipient: address,
    admin: &mut VivonNFTAdmin,
    ctx: &mut TxContext
) {
    let nft = mint_collectible(
        std::string::utf8(b"VIVON Collectible"),
        std::string::utf8(b"A rare collectible from the VIVON ecosystem"),
        std::string::utf8(b""), // Empty image URL - can be set later
        recipient,
        admin,
        ctx
    );
    
    sui::transfer::public_transfer(nft, recipient);
}

/// Mint a custom VIVON collectible
public entry fun mint_custom_collectible(
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    recipient: address,
    admin: &mut VivonNFTAdmin,
    ctx: &mut TxContext
) {
    let nft = mint_collectible(
        std::string::utf8(name),
        std::string::utf8(description),
        std::string::utf8(image_url),
        recipient,
        admin,
        ctx
    );
    
    sui::transfer::public_transfer(nft, recipient);
}

/// Mint a special badge for VIVON token holders
public entry fun mint_holder_badge(
    holder: address,
    token_amount: u64,
    admin: &mut VivonNFTAdmin,
    ctx: &mut TxContext
) {
    // Require significant holdings for badge
    assert!(token_amount >= 1000000000, E_INSUFFICIENT_TOKENS); // 1000 VIVON minimum
    
    let mut description = std::string::utf8(b"VIVON Holder Badge - Commemorating ");
    let tokens_str = std::string::utf8(b"significant VIVON holdings in the ecosystem");        
    std::string::append(&mut description, tokens_str);
    
    let nft = mint_collectible(
        std::string::utf8(b"VIVON Holder Badge"),
        description,
        std::string::utf8(b""), // Empty image URL - can be set later
        holder,
        admin,
        ctx
    );
    
    sui::transfer::public_transfer(nft, holder);
}

/// Burn an NFT entry function
public entry fun burn_nft_entry(nft: VivonNFT) {
    burn_nft(nft);
}

/// Update NFT metadata entry function
public entry fun update_nft_metadata(
    nft: &mut VivonNFT,
    new_description: vector<u8>,
    new_image_url: vector<u8>,
    ctx: &mut TxContext
) {
    update_metadata(
        nft,
        std::string::utf8(new_description),
        std::string::utf8(new_image_url),
        ctx
    );
}

// === View Functions ===

/// Get NFT name
public fun name(nft: &VivonNFT): String {
    nft.name
}

/// Get NFT description
public fun description(nft: &VivonNFT): String {
    nft.description
}

/// Get NFT image URL
public fun image_url(nft: &VivonNFT): String {
    nft.image_url
}

/// Get NFT edition number
public fun edition(nft: &VivonNFT): u64 {
    nft.edition
}

/// Get NFT creator
public fun creator(nft: &VivonNFT): address {
    nft.creator
}

/// Get NFT creation timestamp
public fun created_at(nft: &VivonNFT): u64 {
    nft.created_at
}

/// Get admin stats
public fun admin_stats(admin: &VivonNFTAdmin): (u64, u64) {
    (admin.total_minted, admin.max_supply)
}

// === Test-Only Functions ===

#[test_only]
public fun test_mint_for_testing(
    name: String,
    description: String,
    image_url: String,
    _recipient: address,
    ctx: &mut TxContext
): VivonNFT {
    let nft_id = sui::object::new(ctx);
    
    VivonNFT {
        id: nft_id,
        name,
        description,
        image_url,
        edition: 1,
        creator: tx_context::sender(ctx),
        created_at: tx_context::epoch_timestamp_ms(ctx),
    }
}

#[test_only]
public fun test_create_admin_for_testing(ctx: &mut TxContext): VivonNFTAdmin {
    VivonNFTAdmin {
        id: sui::object::new(ctx),
        total_minted: 0,
        max_supply: 10000,
    }
}

#[test_only]
public fun test_destroy_admin_for_testing(admin: VivonNFTAdmin) {
    let VivonNFTAdmin { id, total_minted: _, max_supply: _ } = admin;
    sui::object::delete(id);
} 