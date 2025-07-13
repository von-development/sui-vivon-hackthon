#[test_only]
module vivon::vivon_nft_tests;

use std::string;
use sui::test_scenario::{Self as test, next_tx};
use vivon::vivon_nft::{Self, VivonNFT};

// Test constants
const CREATOR: address = @0xA11CE;
const RECIPIENT: address = @0xB0B;
const NFT_NAME: vector<u8> = b"Test VIVON NFT";
const NFT_DESCRIPTION: vector<u8> = b"A test NFT for the VIVON ecosystem";
const NFT_URL: vector<u8> = b"https://example.com/test-nft.png";

#[test]
fun test_mint_custom_collectible() {
    let mut scenario = test::begin(CREATOR);
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint NFT to creator
    {
        vivon_nft::mint_custom_collectible(
            NFT_NAME,
            NFT_DESCRIPTION,
            NFT_URL,
            CREATOR,
            &mut admin,
            test::ctx(&mut scenario)
        );
    };
    
    // Check that NFT was minted and transferred to creator
    next_tx(&mut scenario, CREATOR);
    {
        let nft = test::take_from_sender<VivonNFT>(&scenario);
        
        // Verify NFT properties
        assert!(vivon_nft::name(&nft) == string::utf8(NFT_NAME), 0);
        assert!(vivon_nft::description(&nft) == string::utf8(NFT_DESCRIPTION), 1);
        assert!(vivon_nft::edition(&nft) == 1, 2); // First NFT should be edition 1
        assert!(vivon_nft::creator(&nft) == CREATOR, 3);
        
        test::return_to_sender(&scenario, nft);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
}

#[test]
fun test_mint_default_collectible() {
    let mut scenario = test::begin(CREATOR);
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint default VIVON NFT
    {
        vivon_nft::mint_default_collectible(CREATOR, &mut admin, test::ctx(&mut scenario));
    };
    
    // Verify default NFT properties
    next_tx(&mut scenario, CREATOR);
    {
        let nft = test::take_from_sender<VivonNFT>(&scenario);
        
        assert!(vivon_nft::name(&nft) == string::utf8(b"VIVON Collectible"), 0);
        assert!(vivon_nft::edition(&nft) == 1, 1);
        assert!(vivon_nft::creator(&nft) == CREATOR, 2);
        
        test::return_to_sender(&scenario, nft);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
}

#[test]
fun test_mint_holder_badge() {
    let mut scenario = test::begin(CREATOR);
    let tokens_held = 5000000000; // 5 billion tokens (needs to be >= 1000000000)
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint holder badge
    {
        vivon_nft::mint_holder_badge(RECIPIENT, tokens_held, &mut admin, test::ctx(&mut scenario));
    };
    
    // Verify holder badge properties
    next_tx(&mut scenario, RECIPIENT);
    {
        let nft = test::take_from_address<VivonNFT>(&scenario, RECIPIENT);
        
        assert!(vivon_nft::name(&nft) == string::utf8(b"VIVON Holder Badge"), 0);
        assert!(vivon_nft::creator(&nft) == CREATOR, 1);
        assert!(vivon_nft::edition(&nft) == 1, 2); // First NFT should be edition 1
        
        test::return_to_address(RECIPIENT, nft);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
}

#[test]
fun test_update_metadata() {
    let mut scenario = test::begin(CREATOR);
    let new_description = b"Updated description for VIVON NFT";
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint NFT
    {
        vivon_nft::mint_custom_collectible(
            NFT_NAME,
            NFT_DESCRIPTION,
            NFT_URL,
            CREATOR,
            &mut admin,
            test::ctx(&mut scenario)
        );
    };
    
    // Update metadata
    next_tx(&mut scenario, CREATOR);
    {
        let mut nft = test::take_from_sender<VivonNFT>(&scenario);
        
        // Verify original description
        assert!(vivon_nft::description(&nft) == string::utf8(NFT_DESCRIPTION), 0);
        
        // Update metadata (both description and image_url)
        vivon_nft::update_nft_metadata(&mut nft, new_description, NFT_URL, test::ctx(&mut scenario));
        
        // Verify updated description
        assert!(vivon_nft::description(&nft) == string::utf8(new_description), 1);
        
        test::return_to_sender(&scenario, nft);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
}

#[test]
fun test_burn_nft() {
    let mut scenario = test::begin(CREATOR);
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint NFT
    {
        vivon_nft::mint_custom_collectible(
            NFT_NAME,
            NFT_DESCRIPTION,
            NFT_URL,
            CREATOR,
            &mut admin,
            test::ctx(&mut scenario)
        );
    };
    
    // Burn NFT
    next_tx(&mut scenario, CREATOR);
    {
        let nft = test::take_from_sender<VivonNFT>(&scenario);
        vivon_nft::burn_nft_entry(nft);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
}

#[test]
fun test_multiple_editions() {
    let mut scenario = test::begin(CREATOR);
    
    // Create admin for testing
    let mut admin = vivon_nft::test_create_admin_for_testing(test::ctx(&mut scenario));
    
    // Mint multiple NFTs with different editions
    {
        vivon_nft::mint_custom_collectible(
            b"VIVON #1",
            NFT_DESCRIPTION,
            NFT_URL,
            CREATOR,
            &mut admin,
            test::ctx(&mut scenario)
        );
    };
    
    next_tx(&mut scenario, CREATOR);
    {
        vivon_nft::mint_custom_collectible(
            b"VIVON #2",
            NFT_DESCRIPTION,
            NFT_URL,
            CREATOR,
            &mut admin,
            test::ctx(&mut scenario)
        );
    };
    
    // Verify both NFTs exist with correct editions
    next_tx(&mut scenario, CREATOR);
    {
        let nft1 = test::take_from_sender<VivonNFT>(&scenario);
        let nft2 = test::take_from_sender<VivonNFT>(&scenario);
        
        // Verify they have sequential editions
        let edition1 = vivon_nft::edition(&nft1);
        let edition2 = vivon_nft::edition(&nft2);
        assert!(edition1 != edition2, 0);
        assert!(edition1 == 1 || edition1 == 2, 1);
        assert!(edition2 == 1 || edition2 == 2, 2);
        
        test::return_to_sender(&scenario, nft1);
        test::return_to_sender(&scenario, nft2);
    };
    
    vivon_nft::test_destroy_admin_for_testing(admin);
    test::end(scenario);
} 