# https://docs.sui.io/concepts/cryptography

[Skip to main content](https://docs.sui.io/concepts/cryptography#__docusaurus_skipToContent_fallback)

On this page

Cryptographic agility is core to Sui. The system supports multiple cryptography algorithms and primitives and can switch between them rapidly. With Sui, you can choose the right cryptography solution for your system and implement the latest algorithms as they become available.

Sui defines its cryptography primitives, such as public key, signature, aggregated signature, and hash functions, under one unified type alias or enum wrapper that is shared across the entire repository. Making changes to these primitives affects all of an application's components. You can quickly update application cryptography and be assured of uniform security.

## Transaction Authentication [​](https://docs.sui.io/concepts/cryptography\#transaction-authentication "Direct link to Transaction Authentication")

Transaction authentication features on Sui provide security against unauthorized access to on-chain data. Transaction Authentication provides an overview of related topics.

Go to [Transaction Authentication](https://docs.sui.io/concepts/cryptography/transaction-auth).

## zkLogin [​](https://docs.sui.io/concepts/cryptography\#zklogin "Direct link to zkLogin")

zkLogin is a Sui primitive that enables you to send transactions from a Sui address using an OAuth credential, without publicly linking the two.

Go to [zkLogin](https://docs.sui.io/concepts/cryptography/zklogin).

## Passkey [​](https://docs.sui.io/concepts/cryptography\#passkey "Direct link to Passkey")

Sui supports the passkey signature scheme that enables you to sign-in to apps and sign transactions for Sui using a private key securely stored on a passkey authenticator. It uses the WebAuthn standard.

Go to [Passkey](https://docs.sui.io/concepts/cryptography/passkeys).

## Related links [​](https://docs.sui.io/concepts/cryptography\#related-links "Direct link to Related links")

- [Cryptography guides](https://docs.sui.io/guides/developer/cryptography): See the cryptography guides for instruction on applying these concepts.

- [Transaction Authentication](https://docs.sui.io/concepts/cryptography#transaction-authentication)
- [zkLogin](https://docs.sui.io/concepts/cryptography#zklogin)
- [Passkey](https://docs.sui.io/concepts/cryptography#passkey)
- [Related links](https://docs.sui.io/concepts/cryptography#related-links)