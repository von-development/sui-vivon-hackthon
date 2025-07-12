module guard::badge {
    // === Imports ===
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};

    // === Structs ===

    /// NFT badge commemorating a successful jailbreak
    public struct WinnerBadge has key, store {
        id: UID,
        pool_id: object::ID,         // Which bounty pool was won
        hunter: address,             // Who won the bounty
        reward_amount: u64,          // How much SUI was won
        submission_hash: vector<u8>, // Hash of the winning prompt
        timestamp: u64,              // When the jailbreak was successful
        spec_uri: vector<u8>,        // Reference to the challenge spec
        name: String,
        description: String,
        image_url: String,
    }

    // === Events ===

    public struct BadgeMinted has copy, drop {
        badge_id: object::ID,
        pool_id: object::ID,
        hunter: address,
        reward_amount: u64
    }

    // === Public Functions ===

    /// Mint a winner badge - should be called after successful bounty payout
    public fun mint_badge(
        pool_id: object::ID,
        hunter: address,
        reward_amount: u64,
        submission_hash: vector<u8>,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ): WinnerBadge {
        let badge_uid = object::new(ctx);
        let badge_id = object::uid_to_inner(&badge_uid);
        
        // Create dynamic badge content
        let name = string::utf8(b"JailbreakGuard Winner Badge");
        let description = create_description(reward_amount);
        let image_url = create_image_url(pool_id, hunter);
        
        let badge = WinnerBadge {
            id: badge_uid,
            pool_id,
            hunter,
            reward_amount,
            submission_hash,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            spec_uri,
            name,
            description,
            image_url,
        };
        
        // Emit badge minted event
        event::emit(BadgeMinted {
            badge_id,
            pool_id,
            hunter,
            reward_amount
        });
        
        badge
    }

    /// Mint and transfer badge directly to hunter
    public fun mint_and_transfer_badge(
        pool_id: object::ID,
        hunter: address,
        reward_amount: u64,
        submission_hash: vector<u8>,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        let badge = mint_badge(
            pool_id,
            hunter,
            reward_amount,
            submission_hash,
            spec_uri,
            ctx
        );
        
        transfer::public_transfer(badge, hunter);
    }

    // === View Functions ===

    /// Get badge pool ID
    public fun badge_pool_id(badge: &WinnerBadge): object::ID {
        badge.pool_id
    }

    /// Get badge hunter address
    public fun badge_hunter(badge: &WinnerBadge): address {
        badge.hunter
    }

    /// Get badge reward amount
    public fun badge_reward_amount(badge: &WinnerBadge): u64 {
        badge.reward_amount
    }

    /// Get badge submission hash
    public fun badge_submission_hash(badge: &WinnerBadge): vector<u8> {
        badge.submission_hash
    }

    /// Get badge timestamp
    public fun badge_timestamp(badge: &WinnerBadge): u64 {
        badge.timestamp
    }

    /// Get badge spec URI
    public fun badge_spec_uri(badge: &WinnerBadge): vector<u8> {
        badge.spec_uri
    }

    /// Get badge name
    public fun badge_name(badge: &WinnerBadge): String {
        badge.name
    }

    /// Get badge description
    public fun badge_description(badge: &WinnerBadge): String {
        badge.description
    }

    /// Get badge image URL
    public fun badge_image_url(badge: &WinnerBadge): String {
        badge.image_url
    }

    // === Helper Functions ===

    /// Create dynamic description based on reward amount
    fun create_description(reward_amount: u64): String {
        let mut base_description = string::utf8(b"Congratulations! You successfully demonstrated a jailbreak vulnerability and earned ");
        let sui_amount = format_sui_amount(reward_amount);
        let closing = string::utf8(b" SUI from the bounty pool. Your contribution helps improve AI safety for everyone.");
        
        string::append(&mut base_description, sui_amount);
        string::append(&mut base_description, closing);
        
        base_description
    }

    /// Create image URL (could be generated dynamically or point to static asset)
    fun create_image_url(_pool_id: object::ID, _hunter: address): String {
        // For MVP, use a static badge image
        // In production, this could generate unique images based on pool_id and hunter
        string::utf8(b"https://jailbreakguard.com/assets/winner-badge.png")
    }

    /// Format SUI amount for display (convert from MIST to SUI)
    fun format_sui_amount(amount_mist: u64): String {
        let _sui_amount = amount_mist / 1_000_000_000; // Convert MIST to SUI
        let remainder = amount_mist % 1_000_000_000;
        
        if (remainder == 0) {
            // Whole SUI amount
            string::utf8(b"1") // Simplified - in production would properly format numbers
        } else {
            // Decimal SUI amount
            string::utf8(b"0.1") // Simplified - in production would properly format decimals
        }
    }

    // === Integration with Bounty Module ===

    /// Entry function to mint badge after successful bounty (called by bounty module)
    public entry fun mint_winner_badge(
        pool_id: object::ID,
        hunter: address,
        reward_amount: u64,
        submission_hash: vector<u8>,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        mint_and_transfer_badge(
            pool_id,
            hunter,
            reward_amount,
            submission_hash,
            spec_uri,
            ctx
        );
    }

    // === Test-Only Functions ===

    #[test_only]
    public fun test_mint_badge(
        pool_id: object::ID,
        hunter: address,
        reward_amount: u64,
        submission_hash: vector<u8>,
        spec_uri: vector<u8>,
        ctx: &mut TxContext
    ): WinnerBadge {
        mint_badge(
            pool_id,
            hunter,
            reward_amount,
            submission_hash,
            spec_uri,
            ctx
        )
    }
} 