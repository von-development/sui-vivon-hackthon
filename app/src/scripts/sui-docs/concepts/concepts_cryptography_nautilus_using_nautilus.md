# https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus

[Skip to main content](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#__docusaurus_skipToContent_fallback)

On this page

The [Nautilus framework](https://github.com/MystenLabs/nautilus) helps you deploy an AWS Nitro Enclave with all the necessary scaffolding, such as reproducible builds, signature formatting, and HTTPS traffic forwarding, so you can focus on implementing the off-chain computation logic inside the enclave.

In addition, the framework provides an on-chain template that includes the minimal smart contract code required to register a Nautilus instance and its public key. These are the steps you take to use Nautilus in your dApp:

1. Implement the enclave in Rust with the desired computation logic.
2. Deploy a Move smart contract that stores the expected platform configuration registers (PCRs) and allows updates by the contract deployer.
3. Deploy the enclave instance on AWS and register it on chain using its attestation document.
4. Upload signed responses from the registered enclave, verify them on chain, and consume the results in your smart contract.

## Purpose of this guide [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#purpose-of-this-guide "Direct link to Purpose of this guide")

This guide walks you through the following steps:

1. Writing and deploying a basic Nautilus off-chain instance using AWS Nitro Enclaves. The example instance runs a server that fetches weather data for a specific location.
2. Writing a Move smart contract that registers the enclave by verifying its attestation and public key, then verifies the Nautilus response (signature and payload) on chain and mints an NFT containing the location and temperature data.

The setup script performs the following actions:

- Launches a preconfigured EC2 instance and allocates a Nitro Enclave.
- Builds the Rust-based template application into an enclave image format (EIF) binary and runs it inside the enclave.
- Configures required HTTP domains so the enclave can access external APIs via the parent EC2 instance (as the enclave itself has no internet access).
- Exposes three endpoints to allow client-side communication with the enclave.

When the enclave starts, it generates a fresh enclave key pair and exposes the following three endpoints:

- `health_check`: Probes all allowed domains inside the enclave. This logic is built into the template and does not require modification.
- `get_attestation`: Returns a signed attestation document over the enclave public key. Use this during on-chain registration. This logic is built into the template and doesn't require modification.
- `process_data`: Fetches weather data from an external API, signs it with the enclave key, and returns the result. This logic is customizable and you must implement it.

## Code structure [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#code-structure "Direct link to Code structure")

Refer to the [Github repo](https://github.com/MystenLabs/nautilus) for the code structure and related usage instructions that follow.

```codeBlockLines_p187
/move
  /enclave          Utility functions to create an enclave config and register public key by providing a valid attestation document.
  /app              Application logic, uses functions in enclave directory. Replace this with your Nautilus application on-chain logic.
/src
  /aws              AWS boilerplate
  /init             AWS boilerplate
  /system           AWS boilerplate
  /nautilus-server  Nautilus server that runs inside the enclave.
    run.sh          Configures all necessary domains and traffic forwarder, then runs the Rust server inside the enclave.
    app.rs          Replace this with your off-chain computation logic.
    common.rs       Common code for getting attestation.
    allowed_endpoints.yaml  This file lists all endpoints the enclave is allowed to access. By default, the enclave has no internet access unless the parent EC2 instance explicitly forwards traffic. During the configuration step, this file is used to generate the necessary code to enable limited traffic forwarding from the enclave.

```

Focus on implementing the Move code in `move/app` and the Rust code in `src/nautilus-server/app.rs`, along with the frontend logic that interacts with the deployed smart contract. You’ll also need to edit `allowed_endpoints.yaml` to include all domains the enclave must access.

The rest of the template can remain largely unmodified.

info

Frontend code is not included in this guide. The Move call is demonstrated using the CLI.

## Run the example enclave [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#run-the-example-enclave "Direct link to Run the example enclave")

1. Set up an AWS developer account and install the AWS CLI. For detailed instructions, see the [AWS Nitro Enclaves getting started guide](https://docs.aws.amazon.com/enclaves/latest/user/getting-started.html#launch-instance).

2. Run the following script and follow the prompts. The script prompts you to enter some values - see the next step if you want to run this example as-is. If the script completes successfully, it generates code locally that you need to commit. If you encounter issues, refer to the info box that follows, as instructions might vary depending on your AWS account settings.





```codeBlockLines_p187
$ export KEY_PAIR=<your-key-pair-name>

```













```codeBlockLines_p187
$ export AWS_ACCESS_KEY_ID=<your-access-key>

```













```codeBlockLines_p187
$ export AWS_SECRET_ACCESS_KEY=<your-secret-key>

```













```codeBlockLines_p187
$ export AWS_SESSION_TOKEN=<your-session-token>

```













```codeBlockLines_p187
$ sh configure_enclave.sh

```











info





- Run `sh configure_enclave.sh -h` to view additional instructions.

- If your AWS account is not in `us-east-1`, you might need to configure `REGION` and `AMI_ID` values specific to your region. Refer to this [guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html) to find a suitable Amazon Linux image ID.





```codeBlockLines_p187
$ export REGION=<your-region>

```













```codeBlockLines_p187
$ export AMI_ID=<find-an-amazon-linux-ami-for-your-region>

```

- To find the values for `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`, refer to this [AWS guide](https://docs.aws.amazon.com/streams/latest/dev/setting-up.html).

- Set `KEY_PAIR` to the name of your existing AWS key pair or one you create. To create a key pair, refer to this [AWS guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-key-pairs.html).

- You might need to create a vpc with a public subnet. Refer to this [AWS guide](https://000058.awsstudygroup.com/2-prerequiste/2.1-createec2/2.1.2-createpublicsubnet/) for instructions.


3. To run this example as-is, you don't need to modify `allowed_endpoints.yaml` because it already includes `api.weatherapi.com`. Follow the prompts to enter the required values. This step demonstrates how to store a secret (an API key) using AWS Secrets Manager, so you can avoid including the secret in the public application code.





```codeBlockLines_p187
Enter EC2 instance base name: weather # anything you like
Do you want to use a secret? (y/n): y
Do you want to create a new secret or use an existing secret ARN? (new/existing): new
Enter secret name: weather-api-key # anything you like
Enter secret value: 045a27812dbe456392913223221306 # this is an example api key, you can get your own at weatherapi.com

```

4. If completed successfully, changes are generated in `/src/nautilus-server/run.sh` and `expose_enclave.sh`. Commit these changes, as they are required when building the enclave image.



info





- You can modify `src/nautilus-server/allowed_endpoints.yaml` to add any external domains the enclave needs access to. If you update this file, you need to create a new instance using `configure_enclave.sh`, as the generated code also changes.
- You can optionally create a secret to store any sensitive value you don’t want included in the codebase. The secret is passed to the enclave as an environment variable. You can verify newly created secrets or find existing ARNs in the [AWS Secrets Manager console](https://us-east-1.console.aws.amazon.com/secretsmanager/listsecrets?region=%3CREGION%3E).

5. Connect to your instance and clone the repository. For detailed instructions, see [Connect to your Linux instance using SSH](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html#connect-linux-inst-sshClient) in the AWS documentation.

6. You should now be inside the directory containing the server code, including the committed file changes from the previous step. Next, build the enclave image, run it, and expose the HTTP endpoint on port 3000.





```codeBlockLines_p187
$ cd nautilus/

```













```codeBlockLines_p187
$ make && make run # this builds the enclave and run it

```













```codeBlockLines_p187
$ sh expose_enclave.sh # this exposes port 3000 to the Internet for traffic

```











info





Use `make run-debug` instead of `make run` to run the enclave in debug mode. This prints all logs, where the production build does not. In debug mode, the PCR values are all zeros and are not valid for production use.

7. Congratulations! You can now interact with the enclave from the outside world. You can find the `PUBLIC_IP` in the AWS console.





```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -X GET http://<PUBLIC_IP>:3000/health_check

```













```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -X GET http://<PUBLIC_IP>:3000/get_attestation

```













```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -d '{"payload": { "location": "San Francisco"}}' -X POST http://<PUBLIC_IP>:3000/process_data

```

8. Optionally, you can set up an application load balancer (ALB) for the EC2 instance with an SSL/TLS certificate from AWS Certificate Manager (ACM), and configure Amazon Route 53 for DNS routing. For more information, see the [ACM User Guide](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html) and the [ALB Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html).


## Develop your own Nautilus server [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#develop-your-own-nautilus-server "Direct link to Develop your own Nautilus server")

The Nautilus server logic is located in `src/nautilus-server`. To customize the application:

- Update `allowed_endpoints.yaml` for any domains your application requires.
- Modify `app.rs` to update the `process_data` endpoint and add new endpoints as needed.

The following files typically do not require modification:

- `common.rs` handles the `get_attestation` endpoint.
- `main.rs` initializes the ephemeral key pair and sets up the HTTP server.

You can test most functionality by running the server locally. However, the `get_attestation` endpoint doesn't work locally because it requires access to the Nitro Secure Module (NSM) driver, which is only available when running the code inside the configured EC2 instance. This endpoint functions correctly when the server runs within the enclave as described in the setup steps.

To test the `process_data` endpoint locally, run the following:

```codeBlockLines_p187
$ cd src/nautilus-server/

```

```codeBlockLines_p187
$ RUST_LOG=debug API_KEY=045a27812dbe456392913223221306 cargo run

```

```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -d '{"payload": { "location": "San Francisco"}}' -X POST http://localhost:3000/process_data

```

```codeBlockLines_p187
{
  "response":
    {
      "intent":0,
      "timestamp_ms":1744041600000,
      "data":
        {
          "location":"San Francisco",
          "temperature":13
        }
    },
  "signature":"b75d2d44c4a6b3c676fe087465c0e85206b101e21be6cda4c9ab2fd4ba5c0d8c623bf0166e274c5491a66001d254ce4c8c345b78411fdee7225111960cff250a"
}

```

### Troubleshooting [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#troubleshooting "Direct link to Troubleshooting")

- **Traffic forwarder error:** Ensure all targeted domains are listed in the `allowed_endpoints.yaml`. Use the following command to test enclave connectivities to all domains.

```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -X GET http://<PUBLIC_IP>:3000/health_check

```

```codeBlockLines_p187
{
  "pk":"f343dae1df7f2c4676612368e40bf42878e522349e4135c2caa52bc79f0fc6e2",
  "endpoints_status":
    {
      "api.weatherapi.com":true
    }
}

```

- **Docker is not running:** The EC2 instance might still be starting up. Wait a few moments, then try again.

- **Cannot connect to enclave:** This might be due to a VSOCK communication issue. Verify that the enclave is running and properly exposed with `sh expose_enclave.sh`.


### Reset [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#reset "Direct link to Reset")

```codeBlockLines_p187
$ cd nautilus/

```

```codeBlockLines_p187
$ sh reset_enclave.sh

```

Then repeat the image build step.

## Build locally to check reproducibility [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#build-locally-to-check-reproducibility "Direct link to Build locally to check reproducibility")

Every enclave built from the same source code (everything in `/src`) can produce identical PCRs through reproducible builds. This includes any traffic forwarding changes made in `run.sh` (see branch `example-configuration`).

```codeBlockLines_p187
$ cd nautilus/

```

```codeBlockLines_p187
$ make

```

```codeBlockLines_p187
$ cat out/nitro.pcrs

```

```codeBlockLines_p187
3a929ea8b96d4076da25e53e740300947e350a72a775735f63f8b0f8112d3ff04d8ccae53f5ec13dd3c05b865ba7b610 PCR0
3a929ea8b96d4076da25e53e740300947e350a72a775735f63f8b0f8112d3ff04d8ccae53f5ec13dd3c05b865ba7b610 PCR1
21b9efbc184807662e966d34f390821309eeac6802309798826296bf3e8bec7c10edb30948c90ba67310f7b964fc500a PCR2

```

```codeBlockLines_p187
# Add env var that will be used later when registering the enclave.
$ PCR0=3a929ea8b96d4076da25e53e740300947e350a72a775735f63f8b0f8112d3ff04d8ccae53f5ec13dd3c05b865ba7b610
$ PCR1=3a929ea8b96d4076da25e53e740300947e350a72a775735f63f8b0f8112d3ff04d8ccae53f5ec13dd3c05b865ba7b610
$ PCR2=21b9efbc184807662e966d34f390821309eeac6802309798826296bf3e8bec7c10edb30948c90ba67310f7b964fc500a

```

## Register the enclave on chain [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#register-the-enclave-on-chain "Direct link to Register the enclave on chain")

After finalizing the Rust code, the dApp administrator can register the enclave with the corresponding PCRs and public key.

```codeBlockLines_p187
# optionally
$ sui client switch --env testnet # or appropriate network
$ sui client faucet
$ sui client gas
# deploy the enclave package
$ cd move/enclave
$ sui move build
$ sui client publish

# record ENCLAVE_PACKAGE_ID as env var from publish output
$ ENCLAVE_PACKAGE_ID=0x14e8b4d8b28ee9aa5ea604f3f33969b3d0f03247b51837f27e17bcf875d3582c

# deploy your dapp logic
$ cd ../app
$ sui move build
$ sui client publish

# record CAP_OBJECT_ID (owned object of type Cap), ENCLAVE_CONFIG_OBJECT_ID (shared object), EXAMPLES_PACKAGE_ID (package containing weather module) as env var from publish output

$ CAP_OBJECT_ID=0xb157d241cc00b7a9b8b0f11d0b4c3e11d8334be95f7e50240962611bd802abff
$ ENCLAVE_CONFIG_OBJECT_ID=0x58a6a284aaea8c8e71151e4ae0de2350ae877f0bd94adc2b2d0266cf23b6b41d
$ EXAMPLES_PACKAGE_ID=0x7e712fd9e5e57d87137440cfea77dc7970575a5c3229d78bb7176ab984d94adf

# record the deployed enclave url, e.g. http://<PUBLIC_IP>:3000
$ ENCLAVE_URL=<DEPLOYED_URL>

# the module name and otw name used to create the dapp, defined in your Move code `fun init`
$ MODULE_NAME=weather
$ OTW_NAME=WEATHER

# make sure all env vars are populated
$ echo $EXAMPLES_PACKAGE_ID
$ echo $ENCLAVE_PACKAGE_ID
$ echo $CAP_OBJECT_ID
$ echo $ENCLAVE_CONFIG_OBJECT_ID
$ echo 0x$PCR0
$ echo 0x$PCR1
$ echo 0x$PCR2
$ echo $MODULE_NAME
$ echo $OTW_NAME
$ echo $ENCLAVE_URL

# =======
# the two steps that follow (update pcrs, register enclave) can be reused if enclave server is updated
# =======

# this calls the update_pcrs onchain with the enclave cap and built PCRs, this can be reused to update PCRs if Rust server code is updated
$ sui client call --function update_pcrs --module enclave --package $ENCLAVE_PACKAGE_ID --type-args "$EXAMPLES_PACKAGE_ID::$MODULE_NAME::$OTW_NAME" --args $ENCLAVE_CONFIG_OBJECT_ID $CAP_OBJECT_ID 0x$PCR0 0x$PCR1 0x$PCR2

# optional, give it a name you like
$ sui client call --function update_name --module enclave --package $ENCLAVE_PACKAGE_ID --type-args "$EXAMPLES_PACKAGE_ID::$MODULE_NAME::$OTW_NAME" --args $ENCLAVE_CONFIG_OBJECT_ID $CAP_OBJECT_ID "weather enclave, updated 2025-05-13"

# this script calls the get_attestation endpoint from your enclave url and use it to calls register_enclave onchain to register the public key, results in the created enclave object
$ sh ../../register_enclave.sh $ENCLAVE_PACKAGE_ID $EXAMPLES_PACKAGE_ID $ENCLAVE_CONFIG_OBJECT_ID $ENCLAVE_URL $MODULE_NAME $OTW_NAME

# record the created shared object ENCLAVE_OBJECT_ID as env var from register output
$ ENCLAVE_OBJECT_ID=0xe0e70df5347560a1b43e5954267cadd1386a562095cb4285f2581bf2974c838d

```

You can view an example of an enclave config object containing PCRs [on SuiScan](https://testnet.suivision.xyz/object/0x58a6a284aaea8c8e71151e4ae0de2350ae877f0bd94adc2b2d0266cf23b6b41d). You can also view an [example of an enclave object](https://testnet.suivision.xyz/object/0xe0e70df5347560a1b43e5954267cadd1386a562095cb4285f2581bf2974c838d) containing the enclave public key.

### Enclave management [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#enclave-management "Direct link to Enclave management")

The template allows the admin to register multiple `Enclave` objects associated with one `EnclaveConfig` that defines PCRs. Each `Enclave` object represents a specific enclave instance with a unique public key, while the `EnclaveConfig` tracks the PCR values and their associated version. You can register all new `Enclave` instances with the latest `config_version` to ensure consistency.

This design allows the admin to run multiple instances of the same enclave with different public keys, where `config_version` is set to the latest version when creating an `Enclave` object. The admin can register or destroy their `Enclave` objects.

### Update PCRs [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#update-pcrs "Direct link to Update PCRs")

The deployer of the smart contract holds the `EnclaveCap`, which allows for updating the PCRs and enclave public key if the Nautilus server code has been modified. You can retrieve the new PCRs using `make && cat out/nitro.pcrs`. To update the PCRs or register the enclave again, reuse the steps outlined in the previous section.

## Using the verified computation in Move [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#using-the-verified-computation-in-move "Direct link to Using the verified computation in Move")

You can now write your frontend code to interact with the enclave for computation, and then send the resulting data to the Move contract for use. For the weather example, you can request the enclave to retrieve weather data for a specific location:

```codeBlockLines_p187
$ curl -H 'Content-Type: application/json' -d '{"payload": { "location": "San Francisco"}}' -X POST http://<PUBLIC_IP>:3000/process_data

```

```codeBlockLines_p187
{
  "response":
    {
      "intent":0,
      "timestamp_ms":1744683300000,
      "data":
        {
          "location":"San Francisco",
          "temperature":13
        }
    },
  "signature":"77b6d8be225440d00f3d6eb52e91076a8927cebfb520e58c19daf31ecf06b3798ec3d3ce9630a9eceee46d24f057794a60dd781657cb06d952269cfc5ae19500"
}

```

Then use the values from the enclave response - `signature`, `timestamp`, `location`, and `temperature` \- to call `update_weather` in the Move contract. In this example, the call is demonstrated using a script, but it should be integrated into your dApp frontend.

```codeBlockLines_p187
$ sh ../../update_weather.sh \
    $EXAMPLES_PACKAGE_ID \
    $MODULE_NAME \
    $OTW_NAME \
    $ENCLAVE_OBJECT_ID \
    "77b6d8be225440d00f3d6eb52e91076a8927cebfb520e58c19daf31ecf06b3798ec3d3ce9630a9eceee46d24f057794a60dd781657cb06d952269cfc5ae19500" \
    1744683300000 \
    "San Francisco" \
    13

```

An example of a [created weather NFT](https://testnet.suivision.xyz/object/0xa78e166630c0ed004b3115b474fed15d71f27fc80b68e37d451494c6e815931e) is available on network scanners.

### Signing payload [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#signing-payload "Direct link to Signing payload")

Signing payloads in Move are constructed using Binary Canonical Serialization (BCS). These must match the structure specified in the enclave’s Rust code when generating the signature; otherwise, signature verification in `enclave.move` might fail.

Write unit tests in both Move and Rust to ensure consistency. See `test_serde()` in `src/nautilus-server/src/app.rs` and the examples in `move/enclave/enclave.move`.

## FAQs [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#faqs "Direct link to FAQs")

Some questions the community often asks about are answered in the following sections.

### Why did Sui choose AWS Nitro Enclaves initially? [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#why-did-sui-choose-aws-nitro-enclaves-initially "Direct link to Why did Sui choose AWS Nitro Enclaves initially?")

There are many TEE providers available, but initial support for AWS Nitro Enclaves is due to their maturity and support for reproducible builds. Support for additional TEE providers might be considered in the future.

Contact us

For questions about Nautilus, use case discussions, or integration support, contact the Nautilus team on [Sui Discord](https://discord.com/channels/916379725201563759/1361500579603546223).

### Where is the root of trust of AWS? [​](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus\#where-is-the-root-of-trust-of-aws "Direct link to Where is the root of trust of AWS?")

It is stored as part of the Sui framework and used to verify AWS attestation documents. You can verify its hash by following the steps outlined on [AWS](https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html#validation-process).

```codeBlockLines_p187
$ curl https://raw.githubusercontent.com/MystenLabs/sui/refs/heads/main/crates/sui-types/src/nitro_root_certificate.pem -o cert_sui.pem
$ sha256sum cert_sui.pem

6eb9688305e4bbca67f44b59c29a0661ae930f09b5945b5d1d9ae01125c8d6c0

$ curl https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip -o cert_aws.zip
$ unzip cert_aws.zip
$ sha256sum root.pem

6eb9688305e4bbca67f44b59c29a0661ae930f09b5945b5d1d9ae01125c8d6c0 # check it matches from the one downloaded from the Sui repo

```

- [Purpose of this guide](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#purpose-of-this-guide)
- [Code structure](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#code-structure)
- [Run the example enclave](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#run-the-example-enclave)
- [Develop your own Nautilus server](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#develop-your-own-nautilus-server)
  - [Troubleshooting](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#troubleshooting)
  - [Reset](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#reset)
- [Build locally to check reproducibility](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#build-locally-to-check-reproducibility)
- [Register the enclave on chain](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#register-the-enclave-on-chain)
  - [Enclave management](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#enclave-management)
  - [Update PCRs](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#update-pcrs)
- [Using the verified computation in Move](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#using-the-verified-computation-in-move)
  - [Signing payload](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#signing-payload)
- [FAQs](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#faqs)
  - [Why did Sui choose AWS Nitro Enclaves initially?](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#why-did-sui-choose-aws-nitro-enclaves-initially)
  - [Where is the root of trust of AWS?](https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus#where-is-the-root-of-trust-of-aws)