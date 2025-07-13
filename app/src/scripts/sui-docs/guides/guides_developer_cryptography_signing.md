# https://docs.sui.io/guides/developer/cryptography/signing

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/signing#__docusaurus_skipToContent_fallback)

On this page

Move contracts in Sui support verifications for several signature schemes on-chain. Not all signatures supported in on-chain verification are supported as user signature verification. See [Sui Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures#user-signature) for valid signature schemes for transaction authorization.

This topic covers:

1. How to use [fastcrypto](https://github.com/MystenLabs/fastcrypto)'s CLI tool to create a signature of a given scheme. For testing and debugging only, DO NOT use in production.
2. Call the Move method on-chain to verification by submitting the signature, the message and the public key.

Signature schemes covered:

- Ed25519 signature (64 bytes)
- Secp256k1 non-recoverable signature (64 bytes)
- Secp256k1 recoverable signature (65 bytes)
- Secp256r1 non-recoverable signature (64 bytes)
- Secp256r1 recoverable signature (65 bytes)
- BLS G1 signature (minSig setting)
- BLS G2 signature (minPk setting)

## Usage [​](https://docs.sui.io/guides/developer/cryptography/signing\#usage "Direct link to Usage")

### Set up fastcrypto CLI binary [​](https://docs.sui.io/guides/developer/cryptography/signing\#set-up-fastcrypto-cli-binary "Direct link to Set up fastcrypto CLI binary")

```codeBlockLines_p187
git@github.com:MystenLabs/fastcrypto.git
cd fastcrypto/
cargo build --bin sigs-cli

```

### Sign with CLI and submit to on-chain Move method [​](https://docs.sui.io/guides/developer/cryptography/signing\#sign-with-cli-and-submit-to-on-chain-move-method "Direct link to Sign with CLI and submit to on-chain Move method")

#### Ed25519 signature (64 bytes) [​](https://docs.sui.io/guides/developer/cryptography/signing\#ed25519-signature-64-bytes "Direct link to Ed25519 signature (64 bytes)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme ed25519 --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme ed25519 --msg $MSG --secret-key  $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the verify method in Move. All inputs are represented in bytes in hex format:

```codeBlockLines_p187
    use sui::ed25519;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    let verify = ed25519::ed25519_verify(&sig, &pk, &msg);
    assert!(verify == true, 0);

```

#### Secp256k1 non-recoverable signature (64 bytes) [​](https://docs.sui.io/guides/developer/cryptography/signing\#secp256k1-non-recoverable-signature-64-bytes "Direct link to Secp256k1 non-recoverable signature (64 bytes)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme secp256k1 --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme secp256k1 --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the verify method in Move.

```codeBlockLines_p187
    use sui::ecdsa_k1;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    // The last param 1 represents the hash function used is SHA256, the default hash function used when signing in CLI.
    let verify = ecdsa_k1::secp256k1_verify(&sig, &pk, &msg, 1);
    assert!(verify == true, 0);

```

#### Secp256k1 recoverable signature (65 bytes) [​](https://docs.sui.io/guides/developer/cryptography/signing\#secp256k1-recoverable-signature-65-bytes "Direct link to Secp256k1 recoverable signature (65 bytes)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme secp256k1-rec --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme secp256k1-rec --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the ecrecover method in Move and check equality.

```codeBlockLines_p187
    use sui::ecdsa_k1;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    // The last param 1 represents the hash function used is SHA256, the default hash function used when signing in CLI.
    let recovered = ecdsa_k1::secp256k1_ecrecover(&sig, &msg, 1);
    assert!(pk == recovered, 0);

```

#### Secp256r1 non-recoverable signature (64 bytes) [​](https://docs.sui.io/guides/developer/cryptography/signing\#secp256r1-non-recoverable-signature-64-bytes "Direct link to Secp256r1 non-recoverable signature (64 bytes)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme secp256r1 --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme secp256r1 --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the verify method in Move.

```codeBlockLines_p187
    use sui::ecdsa_r1;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    // The last param 1 represents the hash function used is SHA256, the default hash function used when signing in CLI.
    let verify = ecdsa_r1::secp256r1_verify(&sig, &pk, &msg, 1);
    assert!(verify == true, 0);

```

#### Secp256r1 recoverable signature (65 bytes) [​](https://docs.sui.io/guides/developer/cryptography/signing\#secp256r1-recoverable-signature-65-bytes "Direct link to Secp256r1 recoverable signature (65 bytes)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme secp256r1-rec --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme secp256r1-rec --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the ecrecover method in Move and check equality.

```codeBlockLines_p187
    use sui::ecdsa_r1;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    // The last param 1 represents the hash function used is SHA256, the default hash function used when signing in CLI.
    let recovered = ecdsa_r1::secp256r1_ecrecover(&sig, &msg, 1);
    assert!(pk == recovered, 0);

```

#### BLS G1 signature (48 bytes, minSig setting) [​](https://docs.sui.io/guides/developer/cryptography/signing\#bls-g1-signature-48-bytes-minsig-setting "Direct link to BLS G1 signature (48 bytes, minSig setting)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme bls12381-minsig --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme bls12381-minsig --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the verify method in Move.

```codeBlockLines_p187
    use sui::bls12381;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    let verified = bls12381::bls12381_min_sig_verify(&sig, &pk, &msg);
    assert!(verified == true, 0);

```

#### BLS G1 signature (96 bytes, minPk setting) [​](https://docs.sui.io/guides/developer/cryptography/signing\#bls-g1-signature-96-bytes-minpk-setting "Direct link to BLS G1 signature (96 bytes, minPk setting)")

1. Generate a key and sign a message.

```codeBlockLines_p187
target/debug/sigs-cli keygen --scheme bls12381-minpk --seed 0000000000000000000000000000000000000000000000000000000000000000
Private key in hex: $SK
Public key in hex: $PK

target/debug/sigs-cli sign --scheme bls12381-minpk --msg $MSG --secret-key $SK

Signature in hex: $SIG
Public key in hex: $PK

```

2. Call the verify method in Move.

```codeBlockLines_p187
    use sui::bls12381;

    let msg = x"$MSG";
    let pk = x"$PK";
    let sig = x"$SIG";
    let verified = bls12381::bls12381_min_pk_verify(&sig, &pk, &msg);
    assert!(verified == true, 0);

```

- [Usage](https://docs.sui.io/guides/developer/cryptography/signing#usage)
  - [Set up fastcrypto CLI binary](https://docs.sui.io/guides/developer/cryptography/signing#set-up-fastcrypto-cli-binary)
  - [Sign with CLI and submit to on-chain Move method](https://docs.sui.io/guides/developer/cryptography/signing#sign-with-cli-and-submit-to-on-chain-move-method)