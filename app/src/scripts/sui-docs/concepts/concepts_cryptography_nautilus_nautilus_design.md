# https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design

[Skip to main content](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design#__docusaurus_skipToContent_fallback)

On this page

![image](https://docs.sui.io/assets/images/flows-ddf415421ce616acbfd31021585bc66e.png)

## dApp developer actions [​](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design\#dapp-developer-actions "Direct link to dApp developer actions")

1. Create a Nautilus off-chain server with a reproducible build. You have the option of using the [provided template](https://github.com/MystenLabs/nautilus).
2. Publish the server code to a public repository (such as GitHub) to ensure transparency and verifiability.
3. Register the instance’s platform configuration registers (PCRs) using a Sui smart contract.
4. Deploy the server to an AWS Nitro Enclave.
5. Register the deployed enclave using a Sui smart contract and the attestation document. This step also includes registering the enclave’s public key, which is an ephemeral key securely generated within the enclave for signing the enclave responses.

To reduce the trusted computing base, you should route access to the enclave through backend services that handle load balancing, rate limiting, and other related aspects.

tip

Verifying an attestation document on chain is a relatively expensive operation that you should perform only during enclave registration. After registration, use the enclave key to more efficiently verify messages from the enclave.

## dApp user / client actions [​](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design\#dapp-user--client-actions "Direct link to dApp user / client actions")

1. (Optional) Verify the Nautilus off-chain server code by building it locally and confirming that the generated PCRs match the onchain records.
2. Send a request to the deployed enclave and receive a signed response.
3. Submit the signed response on chain for verification before executing the corresponding application logic.

## Trust model [​](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design\#trust-model "Direct link to Trust model")

The attestation document from an AWS Nitro Enclave includes a certificate chain that can be verified on chain using AWS as the root certificate authority. This verification confirms the following:

- The enclave instance is running unmodified software, as validated by its PCR values.
- Users can independently verify that the instance’s computation aligns with the published source code, ensuring transparency and trust.

Reproducible builds allow builders and users to optionally verify that the binary running inside an enclave instance matches a specific version of the source code. This approach provides the following benefits:

- Anyone can build and compare the binary to confirm consistency with the published source code.
- Any changes to the software result in different PCR values, making unauthorized modifications detectable.
- Reproducible builds shift the trust from runtime to build time, strengthening the overall security posture of the dApp.

important

Reproducible builds might not apply to all use cases, such as when the source code is not public.

- [dApp developer actions](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design#dapp-developer-actions)
- [dApp user / client actions](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design#dapp-user--client-actions)
- [Trust model](https://docs.sui.io/concepts/cryptography/nautilus/nautilus-design#trust-model)