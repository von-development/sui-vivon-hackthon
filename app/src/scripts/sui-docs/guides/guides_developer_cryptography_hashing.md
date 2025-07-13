# https://docs.sui.io/guides/developer/cryptography/hashing

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/hashing#__docusaurus_skipToContent_fallback)

On this page

A cryptographic hash function is a widely used cryptographic primitive that maps an arbitrary length input to a fixed length output, the hash value. The hash function is designed to be a one-way function, which means that it is infeasible to invert the function to find the input data from a given hash value, and to be collision resistant, which means that it is infeasible to find two different inputs that map to the same hash value.

The Sui Move API supports the following cryptographic hash functions:

- SHA2-256 as `std::hash::sha2_256`
- SHA3-256 as `std::hash::sha3_256`
- Keccak256 as `sui::hash::keccak256`
- Blake2b-256 as `sui::hash::blake2b256`

## Usage [​](https://docs.sui.io/guides/developer/cryptography/hashing\#usage "Direct link to Usage")

The SHA2-256 and SHA3-256 hash functions are available in the Move Standard Library in the `std::hash` module. The following example shows how to use the SHA2-256 hash function in a smart contract:

```codeBlockLines_p187
module test::hashing_std {
    use std::hash;
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::vector;

    /// Object that holds the output hash value.
    struct Output has key, store {
        id: UID,
        value: vector<u8>
    }

    public fun hash_data(data: vector<u8>, recipient: address, ctx: &mut TxContext) {
        let hashed = Output {
            id: object::new(ctx),
            value: hash::sha2_256(data),
        };
        // Transfer an output data object holding the hashed data to the recipient.
        transfer::public_transfer(hashed, recipient)
    }
}

```

The Keccak256 and Blake2b-256 hash functions are available through the `sui::hash` module in the Sui Move Library. An example of how to use the Keccak256 hash function in a smart contract is shown below. Notice that here, the input to the hash function is given as a reference. This is the case for both Keccak256 and Blake2b-256.

```codeBlockLines_p187
module test::hashing_sui {
    use sui::hash;
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::vector;

    /// Object that holds the output hash value.
    struct Output has key, store {
        id: UID,
        value: vector<u8>
    }

    public fun hash_data(data: vector<u8>, recipient: address, ctx: &mut TxContext) {
        let hashed = Output {
            id: object::new(ctx),
            value: hash::keccak256(&data),
        };
        // Transfer an output data object holding the hashed data to the recipient.
        transfer::public_transfer(hashed, recipient)
    }
}

```

- [Usage](https://docs.sui.io/guides/developer/cryptography/hashing#usage)