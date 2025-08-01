# https://docs.sui.io/guides/developer/cryptography/groth16

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/groth16#__docusaurus_skipToContent_fallback)

On this page

A zero-knowledge proof allows a prover to validate that a statement is true without revealing any information about the inputs. For example, a prover can validate that they know the solution to a sudoku puzzle without revealing the solution.

Zero-knowledge succinct non-interactive argument of knowledge (zk-SNARKs) are a family of zero-knowledge proofs that are non-interactive, have succinct proof size and efficient verification time. An important and widely used variant of them is pairing-based zk-SNARKs like the [Groth16](https://eprint.iacr.org/2016/260.pdf) proof system, which is one of the most efficient and widely used.

The Move API in Sui enables you to verify any statement that can be expressed in a NP-complete language efficiently using Groth16 zk-SNARKs over either the BN254 or BLS12-381 elliptic curve constructions.

There are high-level languages for expressing these statements, such as [Circom](https://docs.circom.io/), used in the following example.

Groth16 requires a trusted setup for each circuit to generate the verification key. The API is not pinning any particular verification key and each user can generate their own parameters or use an existing verification to their apps.

## Usage [​](https://docs.sui.io/guides/developer/cryptography/groth16\#usage "Direct link to Usage")

The following example demonstrates how to create a Groth16 proof from a statement written in Circom and then verify it using the Sui Move API. The API currently supports up to eight public inputs.

### Create circuit [​](https://docs.sui.io/guides/developer/cryptography/groth16\#create-circuit "Direct link to Create circuit")

In this example, we create a proof which demonstrates that we know a factorisation `a * b = c` of a publicly known number `c` without revealing `a` and `b`.

```codeBlockLines_p187
pragma circom 2.1.5;

template Main() {
    signal input a;
    signal input b;
    signal output c;

    c <== a * b;
}
component main = Main();

```

Assuming that the [circom compiler has been installed](https://docs.circom.io/getting-started/installation/), the above circuit is compiled using the following command:

```codeBlockLines_p187
$ circom main.circom --r1cs --wasm

```

This outputs the constraints in R1CS format and the circuit in Wasm format.

### Generate proof [​](https://docs.sui.io/guides/developer/cryptography/groth16\#generate-proof "Direct link to Generate proof")

To generate a proof verifiable in Sui, you need to generate a witness. This example uses Arkworks' [ark-circom](https://github.com/gakonst/ark-circom) Rust library. The code constructs a witness for the circuit and generates a proof for it for a given input. Finally, it verifies that the proof is correct.

```codeBlockLines_p187
use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_groth16::{Groth16, prepare_verifying_key};
use ark_serialize::CanonicalSerialize;
use ark_snark::SNARK;
use rand::rngs::StdRng;
use rand::SeedableRng;

fn main() {
    // Load the WASM and R1CS for witness and proof generation
    let cfg = CircomConfig::<Bn254>::new("../circuit/main_js/main.wasm", "../circuit/main.r1cs").unwrap();
    let mut builder = CircomBuilder::new(cfg);

    // Private inputs: A factorisation of a number
    builder.push_input("a", 641);
    builder.push_input("b", 6_700_417);

    let circuit = builder.setup();

    // Generate a random proving key. WARNING: This is not secure. A proving key generated from a ceremony should be used in production.
    let mut rng: StdRng = SeedableRng::from_seed([0; 32]);
    let pk =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circuit, &mut rng).unwrap();

    let circuit = builder.build().unwrap();
    let public_inputs = circuit.get_public_inputs().unwrap();

    // Create proof
    let proof = Groth16::<Bn254>::prove(&pk, circuit, &mut rng).unwrap();

    // Verify proof
    let pvk = prepare_verifying_key(&pk.vk);
    let verified = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &public_inputs, &proof).unwrap();
    assert!(verified);

    // Print verifying key
    let mut pk_bytes = Vec::new();
    pk.vk.serialize_compressed(&mut pk_bytes).unwrap();
    println!("Verifying key: {}", hex::encode(pk_bytes));

    // Print proof
    let mut proof_serialized = Vec::new();
    proof.serialize_compressed(&mut proof_serialized).unwrap();
    println!("Proof: {}", hex::encode(proof_serialized));

    // Print public inputs. Note that they are concatenated.
    let mut public_inputs_serialized = Vec::new();
    public_inputs.iter().for_each(|input| {
        input.serialize_compressed(&mut public_inputs_serialized).unwrap();
    });
    println!("Public inputs: {}", hex::encode(public_inputs_serialized));
}

```

Recall that this creates a proof that the prover knows a factorisation, in this case of the [5th Fermat number](https://en.wikipedia.org/wiki/Fermat_number#Factorization) ( _232 \+ 1 = 4294967297 = 641 \* 6700417_).

The output of the above function will be

```codeBlockLines_p187
Verifying key: 94d781ec65145ed90beca1859d5f38ec4d1e30d4123424bb7b0c6fc618257b1551af0374b50e5da874ed3abbc80822e4378fdef9e72c423a66095361dacad8243d1a043fc217ea306d7c3dcab877be5f03502c824833fc4301ef8b712711c49ebd491d7424efffd121baf85244404bded1fe26bdf6ef5962a3361cef3ed1661d897d6654c60dca3d648ce82fa91dc737f35aa798fb52118bb20fd9ee1f84a7aabef505258940dc3bc9de41472e20634f311e5b6f7a17d82f2f2fcec06553f71e5cd295f9155e0f93cb7ed6f212d0ccddb01ebe7dd924c97a3f1fc9d03a9eb915020000000000000072548cb052d61ed254de62618c797853ad3b8a96c60141c2bfc12236638f1b0faf9ecf024817d8964c4b2fed6537bcd70600a85cdec0ca4b0435788dbffd81ab
Proof: 212d4457550f258654a24a6871522797ab262dee4d7d1f89af7da90dc0904eac57ce183e6f7caca9a98755904c1398ff6288cec9877f98f2d3c776c448b9ad166839e09d77967b66129c4942eee6d3eaf4a0ce2a841acc873a46ae35e40f0088288d038857c70a1415300544d7cf376949a372049679afa35ee5206b58266184
Public inputs: 0100000001000000000000000000000000000000000000000000000000000000

```

All these outputs are needed to verify the proof.

### Verification in Sui [​](https://docs.sui.io/guides/developer/cryptography/groth16\#verification-in-sui "Direct link to Verification in Sui")

The API in Sui for verifying a proof expects a special processed verification key, where only a subset of the values are used. Ideally, computation for this prepared verification key happens only once per circuit. You can perform this processing using the `sui::groth16::prepare_verifying_key` method of the Sui Move API with a serialization of the `params.vk` value used previously.

The output of the `prepare_verifying_key` function is a vector with four byte arrays, which corresponds to the `vk_gamma_abc_g1_bytes`, `alpha_g1_beta_g2_bytes`, `gamma_g2_neg_pc_bytes`, `delta_g2_neg_pc_bytes`.

To verify a proof, you also need two more inputs, `public_inputs_bytes` and `proof_points_bytes`, which are printed by the program above.

The following example smart contract uses the output from the program above. It first prepares a verification key and verifies the corresponding proof. This example uses the BN254 elliptic curve construction, which is given as the first parameter to the `prepare_verifying_key` and `verify_groth16_proof` functions. You can use the `bls12381` function instead for BLS12-381 construction.

```codeBlockLines_p187
use sui::groth16;

public fun groth16_bn254_test() {
    let pvk = groth16::prepare_verifying_key(&groth16::bn254(), &x"94d781ec65145ed90beca1859d5f38ec4d1e30d4123424bb7b0c6fc618257b1551af0374b50e5da874ed3abbc80822e4378fdef9e72c423a66095361dacad8243d1a043fc217ea306d7c3dcab877be5f03502c824833fc4301ef8b712711c49ebd491d7424efffd121baf85244404bded1fe26bdf6ef5962a3361cef3ed1661d897d6654c60dca3d648ce82fa91dc737f35aa798fb52118bb20fd9ee1f84a7aabef505258940dc3bc9de41472e20634f311e5b6f7a17d82f2f2fcec06553f71e5cd295f9155e0f93cb7ed6f212d0ccddb01ebe7dd924c97a3f1fc9d03a9eb915020000000000000072548cb052d61ed254de62618c797853ad3b8a96c60141c2bfc12236638f1b0faf9ecf024817d8964c4b2fed6537bcd70600a85cdec0ca4b0435788dbffd81ab");
    let proof_points = groth16::proof_points_from_bytes(x"212d4457550f258654a24a6871522797ab262dee4d7d1f89af7da90dc0904eac57ce183e6f7caca9a98755904c1398ff6288cec9877f98f2d3c776c448b9ad166839e09d77967b66129c4942eee6d3eaf4a0ce2a841acc873a46ae35e40f0088288d038857c70a1415300544d7cf376949a372049679afa35ee5206b58266184");
    let public_inputs = groth16::public_proof_inputs_from_bytes(x"0100000001000000000000000000000000000000000000000000000000000000");
    assert!(groth16::verify_groth16_proof(&groth16::bn254(), &pvk, &public_inputs, &proof_points));
}

```

- [Usage](https://docs.sui.io/guides/developer/cryptography/groth16#usage)
  - [Create circuit](https://docs.sui.io/guides/developer/cryptography/groth16#create-circuit)
  - [Generate proof](https://docs.sui.io/guides/developer/cryptography/groth16#generate-proof)
  - [Verification in Sui](https://docs.sui.io/guides/developer/cryptography/groth16#verification-in-sui)