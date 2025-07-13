# https://docs.sui.io/concepts/cryptography/zklogin

[Skip to main content](https://docs.sui.io/concepts/cryptography/zklogin#__docusaurus_skipToContent_fallback)

On this page

zkLogin is a Sui primitive that provides the ability for you to send transactions from a Sui address using an OAuth credential, without publicly linking the two.

zkLogin is designed with the following goals in mind:

- **Streamlined onboarding:** zkLogin enables you to transact on Sui using the familiar OAuth login flow, eliminating the friction of handling cryptographic keys or remembering mnemonics.
- **Self-custody:** A zkLogin transaction requires user approval via the standard OAuth login process--the OAuth provider cannot transact on the user's behalf.
- **Security:** zkLogin is a two-factor authentication scheme; sending a transaction requires both a credential from a recent OAuth login and a salt not managed by the OAuth provider. An attacker who compromises an OAuth account cannot transact from the user's corresponding Sui address unless they separately compromise the salt.
- **Privacy:** Zero-knowledge proofs prevent third parties from linking a Sui address with its corresponding OAuth identifier.
- **Optional verified identity:** A user can opt in to verify the OAuth identifier that was used to derive a particular Sui address. This serves as the foundation for a verifiable on-chain identity layer.
- **Accessibility:** zkLogin is one of several native Sui signature schemes thanks to Sui's [cryptography agility](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures). It integrates with other Sui primitives, like sponsored transactions and multisig.
- **Rigorousness:** The code for zkLogin has been independently [audited](https://github.com/sui-foundation/security-audits/blob/main/docs/zksecurity_zklogin-circuits.pdf) by two firms specializing in zero knowledge. The public zkLogin ceremony for creating the common reference string attracted contributions from more than 100 participants.

Are you a builder who wants to integrate zkLogin into your application or wallet? Dive into the [zkLogin Integration Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration).

If you want to understand how zkLogin works, including how the zero-knowledge proof is generated, and how Sui verifies a zkLogin transaction, see [this section](https://docs.sui.io/concepts/cryptography/zklogin#how-zklogin-works).

If you are curious about the security model and the privacy considerations of zkLogin, visit this [page](https://docs.sui.io/concepts/cryptography/zklogin#security-and-privacy).

More questions? See [the FAQ section](https://docs.sui.io/concepts/cryptography/zklogin#faq).

## OpenID providers [​](https://docs.sui.io/concepts/cryptography/zklogin\#openid-providers "Direct link to OpenID providers")

The following table lists the OpenID providers that can support zkLogin or are currently being reviewed to determine whether they can support zkLogin.

| Provider | Can support? | Devnet | Testnet | Mainnet |
| --- | --- | --- | --- | --- |
| Facebook | Yes | Yes | Yes | Yes |
| Google | Yes | Yes | Yes | Yes |
| Twitch | Yes | Yes | Yes | Yes |
| Apple | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | No | No |
| Kakao | Yes | Yes | No | No |
| Microsoft | Yes | Yes | No | No |
| AWS (Tenant)\* | Yes | Yes | Yes | Yes |
| Karrier One | Yes | Yes | Yes | Yes |
| Credenza3 | Yes | Yes | Yes | Yes |
| RedBull | Under review | No | No | No |
| Amazon | Under review | No | No | No |
| WeChat | Under review | No | No | No |
| Auth0 | Under review | No | No | No |
| Okta | Under review | No | No | No |

- Sui supports AWS (Tenant) but the provider is enabled per tenant. Contact us for more information.

## How zkLogin works [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-zklogin-works "Direct link to How zkLogin works")

In rough sketches, the zkLogin protocol relies on the following:

1. A JWT is a signed payload from OAuth providers, including a user-defined field named nonce. zkLogin leverages [the OpenID Connect OAuth flow](https://openid.net/developers/how-connect-works/) by defining the nonce as a public key and an expiry epoch.
2. The wallet stores an ephemeral KeyPair, where the ephemeral public key is defined in the nonce. The ephemeral private key signs transactions for a brief session, eliminating the need for user memorization.
The Groth16 zero-knowledge proof is generated based on the JWT, concealing privacy-sensitive fields.
3. A transaction is submitted on-chain with the ephemeral signature and the ZK proof. Sui authorities execute the transaction after verifying the ephemeral signature and the proof.
4. Instead of deriving the Sui address based on a public key, the zkLogin address is derived from `sub` (that uniquely identifies the user per provider), `iss` (identifies the provider), `aud` (identifies the application) and `user_salt` (a value that unlinks the OAuth identifier with the on-chain address).

## The complete zkLogin flow [​](https://docs.sui.io/concepts/cryptography/zklogin\#the-complete-zklogin-flow "Direct link to The complete zkLogin flow")

![1](https://docs.sui.io/assets/images/zklogin-flow-cd594bdf380b6a3c7c7935c1258328e8.png)

(Step 0) We use Groth16 for our protocol's zkSNARK instantiation, requiring a singular generation of a structured common reference string (CRS) linked to the circuit. A ceremony is conducted to generate the CRS, which is used to produce the proving key in the ZK Proving Service, the verifying key in Sui Authority. See [the Ceremony section](https://docs.sui.io/concepts/cryptography/zklogin#ceremony) for more details.

(Step 1-3) The user begins by logging into an OpenID Provider (OP) to obtain a JWT containing a defined nonce. In particular, the user generates an _ephemeral_ KeyPair `(eph_sk, eph_pk)` and embed `eph_pk`, along with expiry times ( `max_epoch`) and randomness ( `jwt_randomness`), into the nonce (see [definition](https://docs.sui.io/concepts/cryptography/zklogin#notations)). After the user completes the OAuth login flow, an JWT can be found in the redirect URL in the application.

(Step 4-5) The application frontend then sends the JWT to a salt service. The salt service returns the unique `user_salt` based on `iss, aud, sub` upon validation of the JWT.

(Step 6-7) The user sends the ZK proving service the JWT, user salt, ephemeral public key, jwt randomness, key claim name (i.e. `sub`). The proving service generates a Zero-Knowledge Proof that takes these as private inputs and does the following: (a) Checks the nonce is derived correctly [as defined](https://docs.sui.io/concepts/cryptography/zklogin#notations) (b) Checks that key claim value matches the corresponding field in the JWT, (c) Verifies the RSA signature from OP on the JWT, and (d) the address is consistent with the key claim value and user salt.

(Step 8): The application computes the user address based on iss, aud, sub, aud. This step can be done independently as long as the application has a valid JWT.

(Step 9-10) A transaction is signed using the ephemeral private key to generate an ephemeral signature. Finally, the user submits the transaction along with the ephemeral signature, ZK proof and other inputs to Sui.

(After Step 10) After submitted on chain, Sui Authorities verify the ZK proof against the provider JWKs from storage (agreed upon in consensus) and also the ephemeral signature.

## Entities [​](https://docs.sui.io/concepts/cryptography/zklogin\#entities "Direct link to Entities")

1. Application frontend: This describes the wallet or frontend application that supports zkLogin. This frontend is responsible for storing the ephemeral private key, directing users to complete the OAuth login flow, creating and signing a zkLogin transaction.

2. Salt Backup Service: This is a backend service responsible for returning a salt per unique user. See [zkLogin Integration Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration) for other strategies to maintain salt.

3. ZK Proving Service: This is a backend service responsible for generating ZK proofs based on JWT, JWT randomness, user salt and max epoch. This proof is submitted on-chain along with the ephemeral signature for a zkLogin transaction.


## Address definition [​](https://docs.sui.io/concepts/cryptography/zklogin\#address-definition "Direct link to Address definition")

The address is computed on the following inputs:

1. The address flag: `zk_login_flag = 0x05` for zkLogin address. This serves as a domain separator as a signature scheme defined in [crypto agility](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures).

2. `kc_name_F = hashBytesToField(kc_name, maxKCNameLen)`: Name of the key claim, e.g., `sub`. The sequence of bytes is mapped to a field element in BN254 using `hashBytesToField` (defined below).

3. `kc_value_F = hashBytesToField(kc_value, maxKCValueLen)`: The value of the key claim mapped using `hashBytesToField`.

4. `aud_F = hashBytesToField(aud, maxAudValueLen)`: The relying party (RP) identifier. See [definition](https://docs.sui.io/concepts/cryptography/zklogin#terminology-and-notations).

5. `iss`: The OpenID Provider (OP) identifier. See [definition](https://docs.sui.io/concepts/cryptography/zklogin#terminology-and-notations).

6. `user_salt`: A value introduced to unlink the OAuth identifier with the on-chain address.


Finally, we derive `zk_login_address = Blake2b_256(zk_login_flag, iss_L, iss, addr_seed)` where `addr_seed = Poseidon_BN254(kc_name_F, kc_value_F, aud_F, Poseidon_BN254(user_salt)`.

## Terminology and notations [​](https://docs.sui.io/concepts/cryptography/zklogin\#terminology-and-notations "Direct link to Terminology and notations")

See below for all relevant OpenID terminology defined in [spec](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) and how they are used in zkLogin, along with definitions for protocol details.

### OpenID provider (OP) [​](https://docs.sui.io/concepts/cryptography/zklogin\#openid-provider-op "Direct link to OpenID provider (OP)")

OAuth 2.0 authorization server that is capable of authenticating the end-user and providing claims to an RP about the authentication event and the end-user. This is identified in the `iss` field in JWT payload. Check the [table of available OPs](https://docs.sui.io/concepts/cryptography/zklogin#openid-providers) for the entities zkLogin currently supports.

### Relying party (RP) or client [​](https://docs.sui.io/concepts/cryptography/zklogin\#relying-party-rp-or-client "Direct link to Relying party (RP) or client")

OAuth 2.0 client application requiring end-user authentication and claims from an OpenID provider. This is assigned by OP when the developer creates the application. This is identified in the `aud` field in JWT payload. This refers to any zkLogin enabled wallet or application.

### Subject identifier (sub) [​](https://docs.sui.io/concepts/cryptography/zklogin\#subject-identifier-sub "Direct link to Subject identifier (sub)")

Locally unique and never reassigned identifier within the issuer for the end user, which the RP is intended to consume. Sui uses this as the key claim to derive user address.

### JSON Web Key (JWK) [​](https://docs.sui.io/concepts/cryptography/zklogin\#json-web-key-jwk "Direct link to JSON Web Key (JWK)")

A JSON data structure that represents a set of public keys for an OP. A public endpoint (as in [https://www.googleapis.com/oauth2/v3/certs](https://www.googleapis.com/oauth2/v3/certs)) can be queried to retrieve the valid public keys corresponding to `kid` for the provider. Upon matching with the `kid` in the header of a JWT, the JWT can be verified against the payload and its corresponding JWK. In Sui, all authorities call the JWK endpoints independently, and update the latest view of JWKs for all supported providers during protocol upgrades. The correctness of JWKs is guaranteed by the quorum (2f+1) of validator stake.

### JSON Web Token (JWT) [​](https://docs.sui.io/concepts/cryptography/zklogin\#json-web-token-jwt "Direct link to JSON Web Token (JWT)")

JWT is in the redirect URI to RP after the user completes the OAuth login flow (as in `https://redirect.com?id_token=$JWT_TOKEN`). The JWT contains a `header`, `payload`, and a `signature`. The signature is an RSA signature verified against `jwt_message = header + . + payload` and its JWK identified by `kid`. The `payload` contains a JSON of many claims that is a name-value pair. See below for the specific claims that are relevant to the zkLogin protocol.

**Header**

| Name | Example Value | Usage |
| --- | --- | --- |
| alg | RS256 | zkLogin only supports `RS256` (RSA + SHA-256). |
| kid | c3afe7a9bda46bae6ef97e46c95cda48912e5979 | Identifies the JWK that should be used to verify the JWT. |
| typ | JWT | zkLogin only supports `JWT`. |

**Payload**

| Name | Example Value | Usage |
| --- | --- | --- |
| iss | [https://accounts.google.com](https://accounts.google.com/) | A unique identifier assigned to the OAuth provider. |
| aud | 575519200000-msop9ep45u2uo98hapqmngv8d8000000.apps.googleusercontent.com | A unique identifier assigned to the relying party by the OAuth provider. |
| nonce | hTPpgF7XAKbW37rEUS6pEVZqmoI | A value set by the relying party. The zkLogin enabled wallet is required to set this to the hash of ephemeral public key, an expiry time and a randomness. |
| sub | 110463452167303000000 | A unique identifier assigned to the user. |

For a zkLogin transaction, the `iat` and `exp` claims (timestamp) are not used. Instead, the `nonce` specifies expiry times.

### Key claim [​](https://docs.sui.io/concepts/cryptography/zklogin\#key-claim "Direct link to Key claim")

The claim used to derive a users' address is termed the "key claim", such as sub or email. Naturally, it's ideal to use claims that are fixed once and never changed again. zkLogin currently supports sub as the key claim because OpenID spec mandates that providers do not change this identifier. In the future, this can be extended to use email, username, and so on.

### Notations [​](https://docs.sui.io/concepts/cryptography/zklogin\#notations "Direct link to Notations")

1. `(eph_sk, eph_pk)`: Ephemeral key pair refers to the private and public key pair used to produce ephemeral signatures. The signing mechanism is the same as traditional transaction signing, but it is ephemeral because it is only stored for a short session and can be refreshed upon new OAuth sessions. The ephemeral public key is used to compute nonce.
2. `nonce`: An application-defined field embedded in the JWT payload, computed as the hash of the ephemeral public key, JWT randomness, and the maximum epoch (Sui's defined expiry epoch). Specifically, a zkLogin compatible nonce is required to passed in as `nonce = ToBase64URL(Poseidon_BN254([ext_eph_pk_bigint / 2^128, ext_eph_pk_bigint % 2^128, max_epoch, jwt_randomness]).to_bytes()[len - 20..])` where `ext_eph_pk_bigint` is the BigInt representation of `ext_eph_pk`.
3. `ext_eph_pk`: The byte representation of an ephemeral public key ( `flag || eph_pk`). Size varies depending on the choice of the signature scheme (denoted by the flag, defined in [Signatures](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures)).
4. `user_salt`: A value introduced to unlink the OAuth identifier with the on-chain address.
5. `max_epoch`: The epoch at which the JWT expires. This is u64 used in Sui.
6. `kc_name`: The key claim name, e.g. `sub`.
7. `kc_value`: The key claim value, e.g. `110463452167303000000`.
8. `hashBytesToField(str, maxLen)`: Hashes the ASCII string to a field element using the Poseidon hash.

## Ceremony [​](https://docs.sui.io/concepts/cryptography/zklogin\#ceremony "Direct link to Ceremony")

To preserve privacy of the OAuth artifacts, a zero-knowledge proof of possession of the artifacts is provided. zkLogin employs the Groth16 zkSNARK to instantiate the zero-knowledge proofs, as it is the most efficient general-purpose zkSNARK in terms of proof size and verification efficiency.

However, Groth16 needs a computation-specific common reference string (CRS) to be setup by a trusted party. With zkLogin expected to ensure the safe-keeping of high value transactions and the integrity of critical smart contracts, we cannot base the security of the system on the honesty of a single entity. Hence, to generate the CRS for the zkLogin circuit, it is vital to run a protocol which bases its security on the assumed honesty of a small fraction of a large number of parties.

### What is the ceremony? [​](https://docs.sui.io/concepts/cryptography/zklogin\#what-is-the-ceremony "Direct link to What is the ceremony?")

The Sui zkLogin ceremony is essentially a cryptographic multi-party computation (MPC) performed by a diverse group of participants to generate this CRS. We follow the MPC protocol [MMORPG](https://eprint.iacr.org/2017/1050.pdf) described by Bowe, Gabizon and Miers. The protocol roughly proceeds in 2 phases. The first phase results in a series of powers of a secret quantity tau in the exponent of an elliptic curve element. Since this phase is circuit-agnostic, we adopted the result of the existing community contributed [perpetual powers of tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau/tree/master). Our ceremony was the second phase, which is specific to the zkLogin circuit.

The MMORPG protocol is a sequential protocol, which allows an indefinite number of parties to participate in sequence, without the need of any prior synchronization or ordering. Each party needs to download the output of the previous party, generate entropy of its own and then layer it on top of the received result, producing its own contribution, which is then relayed to the next party. The protocol guarantees security, if at least one of the participants follows the protocol faithfully, generates strong entropy and discards it reliably.

### How was the ceremony performed? [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-was-the-ceremony-performed "Direct link to How was the ceremony performed?")

We sent invitations to 100+ people with diverse backgrounds and affiliations: Sui validators, cryptographers, web3 experts, world-renowned academicians, and business leaders. We planned the ceremony to take place on the dates September 12-18, 2023, but allowed participants to join when they wanted with no fixed slots.

Since the MPC is sequential, each contributor needed to wait till the previous contributor finished in order to receive the previous contribution, follow the MPC steps and produce their own contribution. Due to this structure, we provisioned a queue where participants waited, while those who joined before them finished. To authenticate participants, we sent a unique activation code to each of them. The activation code was the secret key of a signing key pair, which had a dual purpose: it allowed the coordination server to associate the participant's email with the contribution, and to verify the contribution with the corresponding public key.

Participants had two options to contribute: through a browser or a docker. The browser option was more user-friendly for contributors to participate as everything happens in the browser. The Docker option required Docker setup but is more transparent—the Dockerfile and contributor source code are open-sourced and the whole process is verifiable. Moreover, the browser option utilizes [snarkjs](https://github.com/iden3/snarkjs) while the Docker option utilizes [Kobi's implementation](https://github.com/iseriohn/phase2-bn254). This provided software variety and contributors could choose to contribute by whichever method they trust. In addition, participants could generate entropy via entering random text or making random cursor movements.

The zkLogin circuit and the ceremony client [code](https://github.com/sui-foundation/zk-ceremony-client) were made open source and the links were made available to the participants to review before the ceremony. In addition, we also posted these developer docs and an [audit report](https://github.com/sui-foundation/security-audits/blob/main/docs/zksecurity_zklogin-circuits.pdf) on the circuit from zkSecurity. We adopted [challenge #0081](https://pse-trusted-setup-ppot.s3.eu-central-1.amazonaws.com/challenge_0081) (resulting from 80 community contributions) from [perpetual powers of tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau/tree/master/0080_carter_response) in phase 1, which is circuit agnostic. We applied the output of the [Drand](http://drand.love/) random beacon at epoch #3298000 to remove bias. For phase 2, our ceremony had 111 contributions, 82 from browser and 29 from docker. Finally, we applied the output of the Drand random beacon at epoch #3320606 to remove bias from contributions. All intermediate files can be reproduced following instructions [here](https://github.com/sui-foundation/zklogin-ceremony-contributions/blob/main/phase1/README.md) for phase 1 and [here](https://github.com/sui-foundation/zklogin-ceremony-contributions/blob/main/phase2/README.md) for phase 2.

## Finalization [​](https://docs.sui.io/concepts/cryptography/zklogin\#finalization "Direct link to Finalization")

The final CRS along with the transcript of contribution of every participant is available in a public repository. Contributors received both the hash of the previous contribution they were working on and the resulting hash after their contribution, displayed on-screen and sent via email. They can compare these hashes with the transcripts publicly available on the ceremony site. In addition, anyone is able to check that the hashes are computed correctly and each contribution is properly incorporated in the finalized parameters.

Eventually, the final CRS was used to generate the proving key and verifying key. The proving key is used to generate zero knowledge proof for zkLogin, stored with the ZK proving service. The verifying key was [deployed](https://github.com/MystenLabs/sui/pull/13822) as part of the validator software (protocol version 25 in [release 1.10.1](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.10.1)) that is used to verify the zkLogin transaction on Sui.

## Security and privacy [​](https://docs.sui.io/concepts/cryptography/zklogin\#security-and-privacy "Direct link to Security and privacy")

The following sections walk through all zkLogin artifacts, their security assumptions, and the consequences of loss or exposure.

### JWT [​](https://docs.sui.io/concepts/cryptography/zklogin\#jwt "Direct link to JWT")

The JWT's validity is scoped on the client ID ( `aud`) to prevent phishing attacks. The same origin policy for the proof prevents the JWT obtained for a malicious application from being used for zkLogin. The JWT for the client ID is sent directly to the application frontend through the redirect URL. A leaked JWT for the specific client ID can compromise user privacy, as these tokens frequently hold sensitive information like usernames and emails. Furthermore, if a backend salt server is responsible for user salt management, the JWT could potentially be exploited to retrieve the user's salt, which introduces additional risks.

However, a JWT leak does not mean loss of funds as long as the corresponding ephemeral private key is safe.

### User salt [​](https://docs.sui.io/concepts/cryptography/zklogin\#user-salt "Direct link to User salt")

The user salt is required to get access to the zkLogin wallet. This value is essential for both ZK proof generation and zkLogin address derivation.

The leak of user salt does not mean loss of funds, but it enables the attacker to associate the user's subject identifier (i.e. `sub`) with the Sui address. This can be problematic depending on whether pairwise or public subject identifiers are in use. In particular, there is no problem if pairwise IDs are used (e.g., Facebook) as the subject identifier is unique per RP. However, with public reusable IDs (e.g., Google and Twitch), the globally unique sub value can be used to identify users.

### Ephemeral private key [​](https://docs.sui.io/concepts/cryptography/zklogin\#ephemeral-private-key "Direct link to Ephemeral private key")

The ephemeral private key's lifespan is tied to the maximum epoch specified in nonce for creating a valid ZK proof. Should it be misplaced, a new ephemeral private key can be generated for transaction signing, accompanied by a freshly generated ZK proof using a new nonce. However, if the ephemeral private key is compromised, acquiring the user salt and the valid ZK proof would be necessary to move funds.

### Proof [​](https://docs.sui.io/concepts/cryptography/zklogin\#proof "Direct link to Proof")

Obtaining the proof itself cannot create a valid zkLogin transaction because an ephemeral signature over the transaction is also needed.

### Privacy [​](https://docs.sui.io/concepts/cryptography/zklogin\#privacy "Direct link to Privacy")

By default, there is no linking between the OAuth subject identifier (i.e. `sub`) and a Sui address. This is the purpose of the user salt.
The JWT is not published on-chain by default. The revealed values include `iss`, `aud` and `kid` so that the public input hash can be computed, any sensitive fields such as `sub` are used as private inputs when generating the proof.

The ZK proving service and the salt service (if maintained) can link the user identity since the user salt and JWT are known, but the two services are stateless by design.

In the future, the user can opt in to verify their OAuth identity associated with an Sui address on-chain.

## FAQ [​](https://docs.sui.io/concepts/cryptography/zklogin\#faq "Direct link to FAQ")

### What providers is zkLogin compatible with? [​](https://docs.sui.io/concepts/cryptography/zklogin\#what-providers-is-zklogin-compatible-with "Direct link to What providers is zkLogin compatible with?")

zkLogin can support providers that work with OpenID Connect built on top of the OAuth 2.0 framework. This is a subset of OAuth 2.0 compatible providers. See [latest table](https://docs.sui.io/concepts/cryptography/zklogin#openid-providers) for all enabled providers. Other compatible providers will be enabled via protocol upgrades in the future.

### How is a zkLogin Wallet different from a traditional private key wallet? [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-is-a-zklogin-wallet-different-from-a-traditional-private-key-wallet "Direct link to How is a zkLogin Wallet different from a traditional private key wallet?")

Traditional private key wallets demand users to consistently recall mnemonics and passphrases, necessitating secure storage to prevent fund loss from private key compromise.

On the other hand, a zkLogin wallet only requires an ephemeral private key storage with session expiry and the OAuth login flow with expiry. Forgetting an ephemeral key does not result in loss of funds, because a user can always sign in again to generate a new ephemeral key and a new ZK proof.

### How is zkLogin different from MPC or Multisig wallets? [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-is-zklogin-different-from-mpc-or-multisig-wallets "Direct link to How is zkLogin different from MPC or Multisig wallets?")

Multi-Party Computation (MPC) and Multisig wallets rely on multiple keys or distributing multiple key shares and then defining a threshold value for accepting a signature.

zkLogin does not split any individual private keys, but ephemeral private keys are registered using a fresh nonce when the user authenticates with the OAuth provider. The primary advantage of zkLogin is that the user does not need to manage any persistent private key anywhere, not even with any private keys management techniques like MPC or Multisig.

You can think of zkLogin as a 2FA scheme for an address, where the first part is user's OAuth account and the second is the user's salt.

Furthermore, because Sui native supports Multisig wallets, one can always include one or more zkLogin signers inside a Multisig wallet for additional security, such as using the zkLogin part as 2FA in k-of-N settings.

### If my OAuth account is compromised, what happens to my zkLogin address? [​](https://docs.sui.io/concepts/cryptography/zklogin\#if-my-oauth-account-is-compromised-what-happens-to-my-zklogin-address "Direct link to If my OAuth account is compromised, what happens to my zkLogin address?")

Because zkLogin is a 2FA system, an attacker that has compromised your OAuth account cannot access your zkLogin address unless they have separately compromised your salt.

### If I lose access to my OAuth account, do I lose access to my zkLogin address? [​](https://docs.sui.io/concepts/cryptography/zklogin\#if-i-lose-access-to-my-oauth-account-do-i-lose-access-to-my-zklogin-address "Direct link to If I lose access to my OAuth account, do I lose access to my zkLogin address?")

Yes. You must be able to log into your OAuth account and produce a current JWT in order to use zkLogin.

### Does losing my OAuth credential mean the loss of funds in the zkLogin wallet? [​](https://docs.sui.io/concepts/cryptography/zklogin\#does-losing-my-oauth-credential-mean-the-loss-of-funds-in-the-zklogin-wallet "Direct link to Does losing my OAuth credential mean the loss of funds in the zkLogin wallet?")

A forgotten OAuth credential can typically be recovered by resetting the password in that provider.
In the unfortunate event where user's OAuth credentials get compromised, an adversary will still require to obtain `user_salt`, but also learn which wallet is used in order to take over that account. Note that modern `user_salt` providers may have additional 2FA security measures in place to prevent provision of user's salt even to entities that present a valid, non-expired JWT.

It's also important to highlight that due to the fact that zkLogin addresses do not expose any information about the user's identity or wallet used, targeted attacks by just monitoring the blockchain are more difficult.
Finally, on the unfortunate event where one loses access to their OAuth account permanently, access to that wallet is lost. But if recovery from a lost OAuth account is desired, a good suggestion for wallet providers is to support the native Sui Multisig functionality and add a backup method. Note that it's even possible to have a Multisig wallet that all signers are using zkLogin, i.e. an 1-of-2 Multisig zkLogin wallet where the first part is Google and the second Facebook OAuth, respectively.

### Can I convert or merge a traditional private key wallet into a zkLogin one, or vice versa? [​](https://docs.sui.io/concepts/cryptography/zklogin\#can-i-convert-or-merge-a-traditional-private-key-wallet-into-a-zklogin-one-or-vice-versa "Direct link to Can I convert or merge a traditional private key wallet into a zkLogin one, or vice versa?")

No. The zkLogin wallet address is derived differently compared to a private key address.

### Will my zkLogin address ever change? [​](https://docs.sui.io/concepts/cryptography/zklogin\#will-my-zklogin-address-ever-change "Direct link to Will my zkLogin address ever change?")

zkLogin address is derived from `sub`, `iss`, `aud` and `user_salt`.

The address will not change if the user logs in to the same wallet with the same OAuth provider, since `sub`, `iss`, `aud` and `user_salt` (see definitions) will remain unchanged in the JWT, even though the JWT itself may look different every time the user logs in.

However, if the user logs in with different OAuth providers, your address will change because the `iss` and `aud` are defined distinctly per provider.

In addition, each wallet or application maintains its own `user_salt`, so logging with the same provider for different wallets may also result in different addresses.

See more on address [definition](https://docs.sui.io/concepts/cryptography/zklogin#address-definition).

### Can I have multiple addresses with the same OAuth provider? [​](https://docs.sui.io/concepts/cryptography/zklogin\#can-i-have-multiple-addresses-with-the-same-oauth-provider "Direct link to Can I have multiple addresses with the same OAuth provider?")

Yes, this is possible by using a different wallet provider or different `user_salt` for each account. This is useful for separating funds between different accounts.

### Is a zkLogin Wallet custodial? [​](https://docs.sui.io/concepts/cryptography/zklogin\#is-a-zklogin-wallet-custodial "Direct link to Is a zkLogin Wallet custodial?")

A zkLogin wallet is a non-custodial or unhosted wallet.

A custodial or hosted wallet is where a third party (the custodian) controls the private keys on behalf of a wallet user. No such third-party exists for zkLogin wallets.

Instead, a zkLogin wallet can be viewed as a 2-out-of-2 Multisig where the two credentials are the user's OAuth credentials (maintained by the user) and the salt. In other words, neither the OAuth provider, the wallet vendor, the ZK proving service or the salt service provider is a custodian.

### Generating a ZK proof is expensive, is a new proof required to be generated for every transaction? [​](https://docs.sui.io/concepts/cryptography/zklogin\#generating-a-zk-proof-is-expensive-is-a-new-proof-required-to-be-generated-for-every-transaction "Direct link to Generating a ZK proof is expensive, is a new proof required to be generated for every transaction?")

No. Proof generation is only required when ephemeral KeyPair expires. Since the nonce is defined by the ephemeral public key ( `eph_pk`) and expiry ( `max_epoch`), the ZK proof is valid until what the expiry is committed to nonce in the JWT. The ZK proof can be cached and the same ephemeral key can be used to sign transactions till it expires.

### Does zkLogin work on mobile? [​](https://docs.sui.io/concepts/cryptography/zklogin\#does-zklogin-work-on-mobile "Direct link to Does zkLogin work on mobile?")

zkLogin is a Sui native primitive and not a feature of a particular application or wallet. It can be used by any Sui developer, including on mobile.

### Is account recovery possible if the user loses the OAuth credentials? [​](https://docs.sui.io/concepts/cryptography/zklogin\#is-account-recovery-possible-if-the-user-loses-the-oauth-credentials "Direct link to Is account recovery possible if the user loses the OAuth credentials?")

Yes, the user can follow the OAuth providers' recovery flow. The ephemeral private key can be refreshed and after completing a new OAuth login flow, the user can obtain new ZK proof and sign transactions with the refreshed key.

### What are some assumptions for the zkLogin circuit? [​](https://docs.sui.io/concepts/cryptography/zklogin\#what-are-some-assumptions-for-the-zklogin-circuit "Direct link to What are some assumptions for the zkLogin circuit?")

Due to the way Groth16 works, we impose length restrictions on several fields in the JWT. Some of the fields that are length-restricted include aud, iss, the JWT's header and payload. For example, zkLogin can currently only work with aud values of up to length 120 (this value is not yet final). In general, we tried to make sure that the restrictions are as generous as possible. We have decided on these values after looking at as many JWTs that we could get our hands on.

### How is zkLogin different from other solutions that support social login? [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-is-zklogin-different-from-other-solutions-that-support-social-login "Direct link to How is zkLogin different from other solutions that support social login?")

While providing social login with Web2 credentials for Web3 wallet is not a new concept, the existing solutions have one or more of the trust assumptions:

1. Trust a different network or parties to verify Web2 credentials other than the Blockchain itself, usually involving a JWK oracle posted on-chain by a trusted party.
2. Trust some parties to manage a persistent private key, whether it uses MPC, threshold cryptography or secure enclaves.
3. Relying on smart contracts (account abstraction) to verify the JWT on chain with revealing privacy fields, or to verify ZK proofs on-chain which can be expensive.

Some of the existing deployed solutions rely on some of these assumptions. Web3Auth and DAuth social login requires deployment of custom OAuth verifiers to Web3auth Auth Network nodes to verify the JWT. Magic Wallet and Privy also require custom OAuth identity issuer and verifiers to adopt the DID standard. All of the solutions still require persistent private keys management, either with trusted parties like AWS via delegation, Shamir Secret Sharing or MPC.

The key differentiators that zkLogin brings to Sui are:

1. Native Support in Sui: Unlike other solutions that are blockchain agnostic, zkLogin is deployed just for Sui. This means a zkLogin transaction can be combined with Multisig and sponsored transactions seamlessly.

2. Self-Custodial without additional trust: We leverage the nonce field in JWT to commit to ephemeral public key, so no persistent private key management is required with any trusted parties. In addition, the JWK itself is an oracle agreed upon by the quorum of stakes by the validators with trusting any source of authority.

3. Full privacy: Nothing is required to submit on-chain except the ZK proof and the ephemeral signature.

4. Compatible with Existing Identity Providers: zkLogin is compatible with providers that adopt OpenID Connect. No need to trust any intermediate identity issuers or verifiers other than the OAuth providers themselves.


### How to verify a zkLogin signature off chain? [​](https://docs.sui.io/concepts/cryptography/zklogin\#how-to-verify-a-zklogin-signature-off-chain "Direct link to How to verify a zkLogin signature off chain?")

The following options support a zkLogin signature over either transaction data or personal message using the JWK state on Sui and current epoch.

1. Use Sui Typescript SDK. This initializes a GraphQL client and calls the endpoint under the hood.

2. Use the GraphQL endpoint directly: `https://sui-[network].mystenlabs.com/graphql`, changing `[network]` to the appropriate value. See the [GraphQL documentation](https://docs.sui.io/references/sui-api/sui-graphql/reference/api/queries/verify-zklogin-signature) for more details. This is recommended if you do not plan to run any servers or handle any JWK rotations.

3. Use the [Sui Keytool CLI](https://docs.sui.io/references/cli/keytool). This is recommended for debug usage.





```codeBlockLines_p187
$ sui keytool zk-login-sig-verify --sig $ZKLOGIN_SIG --bytes $BYTES --intent-scope 3 --network devnet --curr-epoch 3

```

4. Use a self-hosted server endpoint and call this endpoint, as described in [zklogin-verifier](https://github.com/MystenLabs/zklogin-verifier). This provides logic flexibility.


### Can I use zkLogin inside a multisig wallet? [​](https://docs.sui.io/concepts/cryptography/zklogin\#can-i-use-zklogin-inside-a-multisig-wallet "Direct link to Can I use zkLogin inside a multisig wallet?")

Yes. See the [Multisig Guide](https://sdk.mystenlabs.com/typescript/cryptography/multisig#multisig-with-zklogin) for more details.

## Related links [​](https://docs.sui.io/concepts/cryptography/zklogin\#related-links "Direct link to Related links")

- [zkLogin Implementation Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [zkLogin Example](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example)

- [OpenID providers](https://docs.sui.io/concepts/cryptography/zklogin#openid-providers)
- [How zkLogin works](https://docs.sui.io/concepts/cryptography/zklogin#how-zklogin-works)
- [The complete zkLogin flow](https://docs.sui.io/concepts/cryptography/zklogin#the-complete-zklogin-flow)
- [Entities](https://docs.sui.io/concepts/cryptography/zklogin#entities)
- [Address definition](https://docs.sui.io/concepts/cryptography/zklogin#address-definition)
- [Terminology and notations](https://docs.sui.io/concepts/cryptography/zklogin#terminology-and-notations)
  - [OpenID provider (OP)](https://docs.sui.io/concepts/cryptography/zklogin#openid-provider-op)
  - [Relying party (RP) or client](https://docs.sui.io/concepts/cryptography/zklogin#relying-party-rp-or-client)
  - [Subject identifier (sub)](https://docs.sui.io/concepts/cryptography/zklogin#subject-identifier-sub)
  - [JSON Web Key (JWK)](https://docs.sui.io/concepts/cryptography/zklogin#json-web-key-jwk)
  - [JSON Web Token (JWT)](https://docs.sui.io/concepts/cryptography/zklogin#json-web-token-jwt)
  - [Key claim](https://docs.sui.io/concepts/cryptography/zklogin#key-claim)
  - [Notations](https://docs.sui.io/concepts/cryptography/zklogin#notations)
- [Ceremony](https://docs.sui.io/concepts/cryptography/zklogin#ceremony)
  - [What is the ceremony?](https://docs.sui.io/concepts/cryptography/zklogin#what-is-the-ceremony)
  - [How was the ceremony performed?](https://docs.sui.io/concepts/cryptography/zklogin#how-was-the-ceremony-performed)
- [Finalization](https://docs.sui.io/concepts/cryptography/zklogin#finalization)
- [Security and privacy](https://docs.sui.io/concepts/cryptography/zklogin#security-and-privacy)
  - [JWT](https://docs.sui.io/concepts/cryptography/zklogin#jwt)
  - [User salt](https://docs.sui.io/concepts/cryptography/zklogin#user-salt)
  - [Ephemeral private key](https://docs.sui.io/concepts/cryptography/zklogin#ephemeral-private-key)
  - [Proof](https://docs.sui.io/concepts/cryptography/zklogin#proof)
  - [Privacy](https://docs.sui.io/concepts/cryptography/zklogin#privacy)
- [FAQ](https://docs.sui.io/concepts/cryptography/zklogin#faq)
  - [What providers is zkLogin compatible with?](https://docs.sui.io/concepts/cryptography/zklogin#what-providers-is-zklogin-compatible-with)
  - [How is a zkLogin Wallet different from a traditional private key wallet?](https://docs.sui.io/concepts/cryptography/zklogin#how-is-a-zklogin-wallet-different-from-a-traditional-private-key-wallet)
  - [How is zkLogin different from MPC or Multisig wallets?](https://docs.sui.io/concepts/cryptography/zklogin#how-is-zklogin-different-from-mpc-or-multisig-wallets)
  - [If my OAuth account is compromised, what happens to my zkLogin address?](https://docs.sui.io/concepts/cryptography/zklogin#if-my-oauth-account-is-compromised-what-happens-to-my-zklogin-address)
  - [If I lose access to my OAuth account, do I lose access to my zkLogin address?](https://docs.sui.io/concepts/cryptography/zklogin#if-i-lose-access-to-my-oauth-account-do-i-lose-access-to-my-zklogin-address)
  - [Does losing my OAuth credential mean the loss of funds in the zkLogin wallet?](https://docs.sui.io/concepts/cryptography/zklogin#does-losing-my-oauth-credential-mean-the-loss-of-funds-in-the-zklogin-wallet)
  - [Can I convert or merge a traditional private key wallet into a zkLogin one, or vice versa?](https://docs.sui.io/concepts/cryptography/zklogin#can-i-convert-or-merge-a-traditional-private-key-wallet-into-a-zklogin-one-or-vice-versa)
  - [Will my zkLogin address ever change?](https://docs.sui.io/concepts/cryptography/zklogin#will-my-zklogin-address-ever-change)
  - [Can I have multiple addresses with the same OAuth provider?](https://docs.sui.io/concepts/cryptography/zklogin#can-i-have-multiple-addresses-with-the-same-oauth-provider)
  - [Is a zkLogin Wallet custodial?](https://docs.sui.io/concepts/cryptography/zklogin#is-a-zklogin-wallet-custodial)
  - [Generating a ZK proof is expensive, is a new proof required to be generated for every transaction?](https://docs.sui.io/concepts/cryptography/zklogin#generating-a-zk-proof-is-expensive-is-a-new-proof-required-to-be-generated-for-every-transaction)
  - [Does zkLogin work on mobile?](https://docs.sui.io/concepts/cryptography/zklogin#does-zklogin-work-on-mobile)
  - [Is account recovery possible if the user loses the OAuth credentials?](https://docs.sui.io/concepts/cryptography/zklogin#is-account-recovery-possible-if-the-user-loses-the-oauth-credentials)
  - [What are some assumptions for the zkLogin circuit?](https://docs.sui.io/concepts/cryptography/zklogin#what-are-some-assumptions-for-the-zklogin-circuit)
  - [How is zkLogin different from other solutions that support social login?](https://docs.sui.io/concepts/cryptography/zklogin#how-is-zklogin-different-from-other-solutions-that-support-social-login)
  - [How to verify a zkLogin signature off chain?](https://docs.sui.io/concepts/cryptography/zklogin#how-to-verify-a-zklogin-signature-off-chain)
  - [Can I use zkLogin inside a multisig wallet?](https://docs.sui.io/concepts/cryptography/zklogin#can-i-use-zklogin-inside-a-multisig-wallet)
- [Related links](https://docs.sui.io/concepts/cryptography/zklogin#related-links)