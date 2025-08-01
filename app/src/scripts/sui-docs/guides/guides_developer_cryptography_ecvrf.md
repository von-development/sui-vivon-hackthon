# https://docs.sui.io/guides/developer/cryptography/ecvrf

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/ecvrf#__docusaurus_skipToContent_fallback)

On this page

A verifiable random function (VRF) is a cryptographic primitive that enables you to generate a random number and provide proof that the number used a secret key for generation. Anyone can verify the proof using the public key corresponding to the secret key, so you can use it as a random number generator (RNG) that generates outputs that anyone can verify. Applications that need verifiable randomness on chain can also benefit from its use.

## VRF construction [​](https://docs.sui.io/guides/developer/cryptography/ecvrf\#vrf-construction "Direct link to VRF construction")

The VRF used in the Move API in Sui is an elliptic curve VRF (ECVRF) following the [CFRG VRF draft specifications version 15](https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/15/). It uses [Ristretto255](https://ristretto.group/) elliptic curve group construction with the SHA-512 hash function. The nonce is generated according to [RFC6979](https://www.rfc-editor.org/info/rfc6979).

Any implementation following the same specifications with suite string `sui_vrf` (see section 5 in the [VRF specs](https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/15/)) can be used to compute VRF output and generate proofs.

The [fastcrypto](https://github.com/MystenLabs/fastcrypto) library provides a CLI tool for such an implementation and is used in the following example.

### Generate keys [​](https://docs.sui.io/guides/developer/cryptography/ecvrf\#generate-keys "Direct link to Generate keys")

From the root of the `fastcrypto` repository, run the following command to generate a key pair:

```codeBlockLines_p187
$ cargo run --bin ecvrf-cli keygen

```

This outputs a secret key and a public key in hex format. Both the secret and public keys are 32-byte strings:

```codeBlockLines_p187
Secret key: c0cbc5bf0b2f992fe14fee0327463c7b03d14cbbcb38ce2584d95ee0c112b40b
Public key: 928744da5ffa614d65dd1d5659a8e9dd558e68f8565946ef3d54215d90cba015

```

### Compute VRF output and proof [​](https://docs.sui.io/guides/developer/cryptography/ecvrf\#compute-vrf-output-and-proof "Direct link to Compute VRF output and proof")

To compute the VRF output and proof for the input string `Hello, world!`, which is `48656c6c6f2c20776f726c6421` in hexadecimal, with the key pair generated previously, run the following command:

```codeBlockLines_p187
$ cargo run --bin ecvrf-cli prove --input 48656c6c6f2c20776f726c6421 --secret-key c0cbc5bf0b2f992fe14fee0327463c7b03d14cbbcb38ce2584d95ee0c112b40b

```

This should the 80-byte proof and VRF 64-byte output, both in hex format:

```codeBlockLines_p187
Proof:  18ccf8bf316f00b387fc6e7b26f2d3ddadbf5e9c66d3a30986f12b208108551f9c6da87793a857d79261338a50430074b1dbc7f8f05e492149c51313381248b4229ebdda367146dbbbf95809c7fb330d
Output: 2b7e45821d80567761e8bb3fc519efe5ad80cdb4423227289f960319bbcf6eea1aef30c023617d73f589f98272b87563c6669f82b51dafbeb5b9cf3b17c73437

```

### Verify proof [​](https://docs.sui.io/guides/developer/cryptography/ecvrf\#verify-proof "Direct link to Verify proof")

You can verify the proof and output in a smart contract using `sui::ecvrf::ecvrf_verify` from the Sui Move framework:

```codeBlockLines_p187
module math::ecvrf_test {
    use sui::ecvrf;
    use sui::event;

    /// Event on whether the output is verified
    struct VerifiedEvent has copy, drop {
        is_verified: bool,
    }

    public fun verify_ecvrf_output(output: vector<u8>, alpha_string: vector<u8>, public_key: vector<u8>, proof: vector<u8>) {
        event::emit(VerifiedEvent {is_verified: ecvrf::ecvrf_verify(&output, &alpha_string, &public_key, &proof)});
    }
}

```

You can also use the CLI tool for verification:

```codeBlockLines_p187
$ cargo run --bin ecvrf-cli verify --output 2b7e45821d80567761e8bb3fc519efe5ad80cdb4423227289f960319bbcf6eea1aef30c023617d73f589f98272b87563c6669f82b51dafbeb5b9cf3b17c73437 --proof 18ccf8bf316f00b387fc6e7b26f2d3ddadbf5e9c66d3a30986f12b208108551f9c6da87793a857d79261338a50430074b1dbc7f8f05e492149c51313381248b4229ebdda367146dbbbf95809c7fb330d --input 48656c6c6f2c20776f726c6421 --public-key 928744da5ffa614d65dd1d5659a8e9dd558e68f8565946ef3d54215d90cba015

```

The preceding command returns the verification:

```codeBlockLines_p187
Proof verified correctly!

```

- [VRF construction](https://docs.sui.io/guides/developer/cryptography/ecvrf#vrf-construction)
  - [Generate keys](https://docs.sui.io/guides/developer/cryptography/ecvrf#generate-keys)
  - [Compute VRF output and proof](https://docs.sui.io/guides/developer/cryptography/ecvrf#compute-vrf-output-and-proof)
  - [Verify proof](https://docs.sui.io/guides/developer/cryptography/ecvrf#verify-proof)