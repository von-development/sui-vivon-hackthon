# https://docs.sui.io/guides/developer/cryptography/zklogin-integration

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#__docusaurus_skipToContent_fallback)

On this page

Here is the high-level flow the wallet or frontend application must implement to support zkLogin-enabled transactions:

1. The wallet creates an ephemeral key pair.
2. The wallet prompts the user to complete an OAuth login flow with the nonce corresponding to the ephemeral public key.
3. After receiving the JSON Web Token (JWT), the wallet obtains a zero-knowledge proof.
4. The wallet obtains a unique user salt based on a JWT. Use the OAuth subject identifier and salt to compute the zkLogin Sui address.
5. The wallet signs transactions with the ephemeral private key.
6. The wallet submits the transaction with the ephemeral signature and the zero-knowledge proof.

Let's dive into the specific implementation details.

## Install the zkLogin TypeScript SDK [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#install-the-zklogin-typescript-sdk "Direct link to Install the zkLogin TypeScript SDK")

To use the zkLogin TypeScript SDK in your project, run the following command in your project root:

- npm
- Yarn
- pnpm

```codeBlockLines_p187
npm install @mysten/sui

```

If you want to use the latest experimental version:

- npm
- Yarn
- pnpm

```codeBlockLines_p187
npm install @mysten/sui@experimental

```

## Get JWT [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#get-jwt "Direct link to Get JWT")

1. Generate an ephemeral key pair. Follow the same process as you would generating a key pair in a traditional wallet. See [Sui SDK](https://sdk.mystenlabs.com/typescript/cryptography/keypairs) for details.

2. Set the expiration time for the ephemeral key pair. The wallet decides whether the maximum epoch is the current epoch or later. The wallet also determines whether this is adjustable by the user.

3. Assemble the OAuth URL with configured client ID, redirect URL, ephemeral public key and nonce: This is what the application sends the user to complete the login flow with a computed [nonce](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#notations).


```codeBlockLines_p187
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';

const FULLNODE_URL = 'https://fullnode.devnet.sui.io'; // replace with the RPC URL you want to use
const suiClient = new SuiClient({ url: FULLNODE_URL });
const { epoch, epochDurationMs, epochStartTimestampMs } = await suiClient.getLatestSuiSystemState();

const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
const ephemeralKeyPair = new Ed25519Keypair();
const randomness = generateRandomness();
const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

```

The auth flow URL can be constructed with `$CLIENT_ID`, `$REDIRECT_URL` and `$NONCE`.

For some providers ("Yes" for "Auth Flow Only"), the JWT can be found immediately in the redirect URL after the auth flow.

For other providers ("No" for "Auth Flow Only"), the auth flow only returns a code ( `$AUTH_CODE`) in redirect URL. To retrieve the JWT, an additional POST call is required with "Token Exchange URL".

| Provider | Auth Flow URL | Token Exchange URL | Auth Flow Only |
| --- | --- | --- | --- |
| Google | `https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&response_type=id_token&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE` | N/A | Yes |
| Facebook | `https://www.facebook.com/v17.0/dialog/oauth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE&response_type=id_token` | N/A | Yes |
| Twitch | `https://id.twitch.tv/oauth2/authorize?client_id=$CLIENT_ID&force_verify=true&lang=en&login_type=login&redirect_uri=$REDIRECT_URL&response_type=id_token&scope=openid&nonce=$NONCE` | N/A | Yes |
| Kakao | `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE` | `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&code=$AUTH_CODE` | No |
| Apple | `https://appleid.apple.com/auth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=email&response_mode=form_post&response_type=code%20id_token&nonce=$NONCE` | N/A | Yes |
| Slack | `https://slack.com/openid/connect/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE&scope=openid` | `https://slack.com/api/openid.connect.token?code=$AUTH_CODE&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET` | Yes |
| Microsoft | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=$CLIENT_ID&scope=openid&response_type=id_token&nonce=$NONCE&redirect_uri=$REDIRECT_URL` | Yes |  |

## Decoding JWT [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#decoding-jwt "Direct link to Decoding JWT")

Upon successful redirection, the OpenID provider attaches the JWT as a URL parameter. The following is an example using the Google flow.

```codeBlockLines_p187
http://host/auth?id_token=tokenPartA.tokenPartB.tokenPartC&authuser=0&prompt=none

```

The `id_token` param is the JWT in encoded format. You can validate the correctness of the encoded token and investigate its structure by pasting it in the [jwt.io](https://jwt.io/) website.

To decode the JWT you can use a library like: `jwt_decode:` and map the response to the provided type `JwtPayload`:

```codeBlockLines_p187
const decodedJwt = jwt_decode(encodedJWT) as JwtPayload;

export interface JwtPayload {
	iss?: string;
	sub?: string; //Subject ID
	aud?: string[] | string;
	exp?: number;
	nbf?: number;
	iat?: number;
	jti?: string;
}

```

## User salt management [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#user-salt-management "Direct link to User salt management")

zkLogin uses the user salt to compute the zkLogin Sui address (see [definition](https://docs.sui.io/concepts/cryptography/zklogin#address-definition)). The salt must be a 16-byte value or a integer smaller than `2n**128n`. There are several options for the application to maintain the user salt:

1. Client side:
   - Option 1: Request user input for the salt during wallet access, transferring the responsibility to the user, who must then remember it.
   - Option 2: Browser or Mobile Storage: Ensure proper workflows to prevent users from losing wallet access during device or browser changes. One approach is to email the salt during new wallet setup.
2. Backend service that exposes an endpoint that returns a unique salt for each user consistently.
   - Option 3: Store a mapping from user identifier (e.g. `sub`) to user salt in a conventional database (e.g. `user` or `password` table). The salt is unique per user.
   - Option 4: Implement a service that keeps a master seed value, and derive a user salt with key derivation by validating and parsing the JWT. For example, use `HKDF(ikm = seed, salt = iss || aud, info = sub)` defined [here](https://github.com/MystenLabs/fastcrypto/blob/e6161f9279510e89bd9e9089a09edc018b30fbfe/fastcrypto/src/hmac.rs#L121). Note that this option does not allow any rotation on master seed or change in client ID (i.e. aud), otherwise a different user address will be derived and will result in loss of funds.

Here's an example request and response for the Mysten Labs-maintained salt server (using option 4). If you want to use the Mysten Labs salt server, please refer to [Enoki docs](https://docs.enoki.mystenlabs.com/) and contact us. Only valid JWT authenticated with whitelisted client IDs are accepted.

```codeBlockLines_p187
$ curl -X POST https://salt.api.mystenlabs.com/get_salt -H 'Content-Type: application/json' -d '{"token": "$JWT_TOKEN"}'

```

```codeBlockLines_p187
Response: {"salt":"129390038577185583942388216820280642146"}

```

User salt is used to disconnect the OAuth identifier (sub) from the on-chain Sui address to avoid linking Web2 credentials with Web3 credentials. While losing or misusing the salt could enable this link, it wouldn't compromise fund control or zkLogin asset authority. See more discussion [here](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#security-and-privacy).

## Get the user's Sui address [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#get-the-users-sui-address "Direct link to Get the user's Sui address")

Once the OAuth flow completes, the JWT can be found in the redirect URL. Along with the user salt, the zkLogin address can be derived as follows:

```codeBlockLines_p187
import { jwtToAddress } from '@mysten/sui/zklogin';

const zkLoginUserAddress = jwtToAddress(jwt, userSalt);

```

## Get the zero-knowledge proof [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#get-the-zero-knowledge-proof "Direct link to Get the zero-knowledge proof")

The next step is to fetch the ZK proof. This is an attestation (proof) over the ephemeral key pair that proves the ephemeral key pair is valid.

First, generate the extended ephemeral public key to use as an input to the ZKP.

```codeBlockLines_p187
import { getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';

const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());

```

You need to fetch a new ZK proof if the previous ephemeral key pair is expired or is otherwise inaccessible.

Because generating a ZK proof can be resource-intensive and potentially slow on the client side, it's advised that wallets utilize a backend service endpoint dedicated to ZK proof generation.

There are two options:

1. Call the Mysten Labs-maintained proving service.
2. Run the proving service in your backend using the provided Docker images.

### Call the Mysten Labs-maintained proving service [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#call-the-mysten-labs-maintained-proving-service "Direct link to Call the Mysten Labs-maintained proving service")

If you want to use the Mysten hosted ZK Proving Service for Mainnet, please refer to [Enoki docs](https://docs.enoki.mystenlabs.com/) and contact us for accessing it.

Use the `prover-dev` endpoint ( [https://prover-dev.mystenlabs.com/v1](https://prover-dev.mystenlabs.com/v1)) freely for testing on Devnet. Note that you can submit proofs generated with this endpoint for Devnet zkLogin transactions only; submitting them to Testnet or Mainnet fails.

You can use BigInt or Base64 encoding for `extendedEphemeralPublicKey`, `jwtRandomness`, and `salt`. The following examples show two sample requests with the first using BigInt encoding and the second using Base64.

```codeBlockLines_p187
$ curl -X POST $PROVER_URL -H 'Content-Type: application/json' \
-d '{"jwt":"$JWT_TOKEN", \
"extendedEphemeralPublicKey":"84029355920633174015103288781128426107680789454168570548782290541079926444544", \
"maxEpoch":"10", \
"jwtRandomness":"100681567828351849884072155819400689117", \
"salt":"248191903847969014646285995941615069143", \
"keyClaimName":"sub" \
}'

```

```codeBlockLines_p187
$ curl -X POST $PROVER_URL -H 'Content-Type: application/json' \
-d '{"jwt":"$JWT_TOKEN", \
"extendedEphemeralPublicKey":"ucbuFjDvPnERRKZI2wa7sihPcnTPvuU//O5QPMGkkgA=", \
"maxEpoch":"10", \
"jwtRandomness":"S76Qi8c/SZlmmotnFMr13Q==", \
"salt":"urgFnwIxJ++Ooswtf0Nn1w==", \
"keyClaimName":"sub" \
}'

```

Response:

```codeBlockLines_p187
{
	"proofPoints": {
		"a": [\
			"17267520948013237176538401967633949796808964318007586959472021003187557716854",\
			"14650660244262428784196747165683760208919070184766586754097510948934669736103",\
			"1"\
		],
		"b": [\
			[\
				"21139310988334827550539224708307701217878230950292201561482099688321320348443",\
				"10547097602625638823059992458926868829066244356588080322181801706465994418281"\
			],\
			[\
				"12744153306027049365027606189549081708414309055722206371798414155740784907883",\
				"17883388059920040098415197241200663975335711492591606641576557652282627716838"\
			],\
			["1", "0"]\
		],

		"c": [\
			"14769767061575837119226231519343805418804298487906870764117230269550212315249",\
			"19108054814174425469923382354535700312637807408963428646825944966509611405530",\
			"1"\
		]
	},
	"issBase64Details": {
		"value": "wiaXNzIjoiaHR0cHM6Ly9pZC50d2l0Y2gudHYvb2F1dGgyIiw",
		"indexMod4": 2
	},
	"headerBase64": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ"
}

```

### How to handle CORS error [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#how-to-handle-cors-error "Direct link to How to handle CORS error")

To avoid possible CORS errors in Frontend apps, it is suggested to delegate this call to a backend service.

The response can be mapped to the inputs parameter type of `getZkLoginSignature` of zkLogin SDK.

```codeBlockLines_p187
const proofResponse = await post('/your-internal-api/zkp/get', zkpRequestPayload);

export type PartialZkLoginSignature = Omit<
	Parameters<typeof getZkLoginSignature>['0']['inputs'],
	'addressSeed'
>;
const partialZkLoginSignature = proofResponse as PartialZkLoginSignature;

```

### Run the proving service in your backend [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#run-the-proving-service-in-your-backend "Direct link to Run the proving service in your backend")

1. Install [Git Large File Storage](https://git-lfs.com/) (an open-source Git extension for large file versioning) before downloading the zkey.

2. Download the [Groth16 proving key zkey file](https://docs.circom.io/getting-started/proving-circuits/). There are zkeys available for all Sui networks. See [the Ceremony section](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#ceremony) for more details on how the main proving key is generated.
   - Main zkey (for Mainnet and Testnet)





     ```codeBlockLines_p187
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-main-zkey.sh | bash

     ```

   - Test zkey (for Devnet)





     ```codeBlockLines_p187
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-test-zkey.sh | bash

     ```

   - To verify the download contains the correct zkey file, you can run the following command to check the Blake2b hash: `b2sum ${file_name}.zkey`.



     | Network | zkey file name | Hash |
     | --- | --- | --- |
     | Mainnet, Testnet | `zkLogin-main.zkey` | `060beb961802568ac9ac7f14de0fbcd55e373e8f5ec7cc32189e26fb65700aa4e36f5604f868022c765e634d14ea1cd58bd4d79cef8f3cf9693510696bcbcbce` |
     | Devnet | `zkLogin-test.zkey` | `686e2f5fd969897b1c034d7654799ee2c3952489814e4eaaf3d7e1bb539841047ae8ee5fdcdaca5f4ddd76abb5a8e8eb77b44b693a2ba9d4be57e94292b26ce2` |
3. For the next step, you need two Docker images from the [mysten/zklogin repository](https://hub.docker.com/repository/docker/mysten/zklogin/general) (tagged as `prover` and `prover-fe`). To simplify, a docker compose file is available that automates this process. Run `docker compose` with the downloaded zkey from the same directory as the YAML file.


```codeBlockLines_p187
services:
  backend:
    image: mysten/zklogin:prover-stable
    volumes:
      # The ZKEY environment variable must be set to the path of the zkey file.
      - ${ZKEY}:/app/binaries/zkLogin.zkey
    environment:
      - ZKEY=/app/binaries/zkLogin.zkey
      - WITNESS_BINARIES=/app/binaries

  frontend:
    image: mysten/zklogin:prover-fe-stable
    command: '8080'
    ports:
      # The PROVER_PORT environment variable must be set to the desired port.
      - '${PROVER_PORT}:8080'
    environment:
      - PROVER_URI=http://backend:8080/input
      - NODE_ENV=production
      - DEBUG=zkLogin:info,jwks
      # The default timeout is 15 seconds. Uncomment the following line to change it.
      # - PROVER_TIMEOUT=30

```

```codeBlockLines_p187
ZKEY=<path_to_zkLogin.zkey> PROVER_PORT=<PROVER_PORT> docker compose up

```

1. To call the service, the following two endpoints are supported:
   - `/ping`: To test if the service is up. Running `curl http://localhost:PROVER_PORT/ping` should return `pong`.
   - `/v1`: The request and response are the same as the Mysten Labs maintained service.

A few important things to note:

- The backend service (mysten/zklogin:prover-stable) is compute-heavy. Use at least the minimum recommended 16 cores and 16GB RAM. Using weaker instances can lead to timeout errors with the message "Call to rapidsnark service took longer than 15s". You can adjust the environment variable `PROVER_TIMEOUT` to set a different timeout value, for example, `PROVER_TIMEOUT=30` for a timeout of 30 seconds.

- If you want to compile the prover from scratch (for performance reasons), please see our fork of [rapidsnark](https://github.com/MystenLabs/rapidsnark#compile-prover-in-server-mode). You'd need to compile and launch the prover in server mode.

- Setting `DEBUG=*` turns on all logs in the prover-fe service some of which may contain PII. Consider using DEBUG=zkLogin:info,jwks in production environments.


## Assemble the zkLogin signature and submit the transaction [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#assemble-the-zklogin-signature-and-submit-the-transaction "Direct link to Assemble the zkLogin signature and submit the transaction")

First, sign the transaction bytes with the ephemeral private key using the key pair generated previously. This is the same as [traditional KeyPair signing](https://sdk.mystenlabs.com/typescript/cryptography/keypairs). Make sure that the transaction `sender ` is also defined.

```codeBlockLines_p187
const ephemeralKeyPair = new Ed25519Keypair();

const client = new SuiClient({ url: '<YOUR_RPC_URL>' });

const txb = new Transaction();

txb.setSender(zkLoginUserAddress);

const { bytes, signature: userSignature } = await txb.sign({
	client,
	signer: ephemeralKeyPair, // This must be the same ephemeral key pair used in the ZKP request
});

```

Next, generate an address seed by combining `userSalt`, `sub` (subject ID), and `aud` (audience).

Set the address seed and the partial zkLogin signature to be the `inputs` parameter.

You can now serialize the zkLogin signature by combining the ZK proof ( `inputs`),
the `maxEpoch`, and the ephemeral signature ( `userSignature`).

```codeBlockLines_p187
import { genAddressSeed, getZkLoginSignature } from '@mysten/sui/zklogin';

const addressSeed = genAddressSeed(
	BigInt(userSalt!),
	'sub',
	decodedJwt.sub,
	decodedJwt.aud,
).toString();

const zkLoginSignature = getZkLoginSignature({
	inputs: {
		...partialZkLoginSignature,
		addressSeed,
	},
	maxEpoch,
	userSignature,
});

```

Finally, execute the transaction.

```codeBlockLines_p187
client.executeTransactionBlock({
	transactionBlock: bytes,
	signature: zkLoginSignature,
});

```

## Caching the ephemeral private key and ZK proof [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#caching-the-ephemeral-private-key-and-zk-proof "Direct link to Caching the ephemeral private key and ZK proof")

As previously documented, each ZK proof is tied to an ephemeral key pair. So you can reuse the proof to sign any number of transactions until the ephemeral key pair expires (until the current epoch crosses `maxEpoch`).

You might want to cache the ephemeral key pair along with the ZKP for future uses.

However, the ephemeral key pair needs to be treated as a secret akin to a key pair in a traditional wallet. This is because if both the ephemeral private key and ZK proof are revealed to an attacker, then they can typically sign any transaction on behalf of the user (using the same process described previously).

Consequently, you should not store them persistently in a storage location that is not secure, on any platform. For example, on browsers, use session storage instead of local storage to store the ephemeral key pair and the ZK proof. This is because session storage automatically clears its data when the browser session ends, while data in local storage persists indefinitely.

## Efficiency considerations [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#efficiency-considerations "Direct link to Efficiency considerations")

Compared to traditional signatures, zkLogin signatures take a longer time to generate. For example, the prover that Mysten Labs maintains typically takes about three seconds to return a proof, which runs on a machine with 16 vCPUs and 64 GB RAM. Using more powerful machines, such as those with physical CPUs or graphics processing units (GPUs), can reduce the proving time further.

Carefully consider how many requests your application needs to make to the prover. Broadly speaking, the right metric to consider is the number of active user sessions and not the number of signatures. This is because you can cache the same ZK proof and reuse it across the session, as previously explained. For example, if you expect a million active user sessions per day, then you need a prover that can handle one or two requests per second (RPS), assuming evenly distributed traffic.

The prover that Mysten Labs maintains is set to auto-scale to handle traffic surges. If you are not sure whether Mysten Labs can handle a specific number of requests or expect a sudden spike in the number of prover requests your application needs to make, please reach out to us on [Discord](https://discord.gg/sui). Our plan is to horizontally scale the prover to handle any RPS you require.

## Related links [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration\#related-links "Direct link to Related links")

- [zkLogin Concepts](https://docs.sui.io/concepts/cryptography/zklogin)
- [zkLogin Example](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example)
- [Configure OpenID Providers](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account)

- [Install the zkLogin TypeScript SDK](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#install-the-zklogin-typescript-sdk)
- [Get JWT](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#get-jwt)
- [Decoding JWT](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#decoding-jwt)
- [User salt management](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#user-salt-management)
- [Get the user's Sui address](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#get-the-users-sui-address)
- [Get the zero-knowledge proof](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#get-the-zero-knowledge-proof)
  - [Call the Mysten Labs-maintained proving service](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#call-the-mysten-labs-maintained-proving-service)
  - [How to handle CORS error](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#how-to-handle-cors-error)
  - [Run the proving service in your backend](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#run-the-proving-service-in-your-backend)
- [Assemble the zkLogin signature and submit the transaction](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#assemble-the-zklogin-signature-and-submit-the-transaction)
- [Caching the ephemeral private key and ZK proof](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#caching-the-ephemeral-private-key-and-zk-proof)
- [Efficiency considerations](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#efficiency-considerations)
- [Related links](https://docs.sui.io/guides/developer/cryptography/zklogin-integration#related-links)