# https://docs.sui.io/guides/developer/sui-101/sponsor-txn

[Skip to main content](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#__docusaurus_skipToContent_fallback)

On this page

A transaction on Sui takes a payment to execute. The payment, also known as gas, is a list of `0x2::coin::Coin<0x2::sui::Sui>` objects. Although gas is a critical piece in Sui tokenomics, it sometimes adds challenges when new Web3 users start to navigate on Sui.

Sponsored transactions are a primitive on the Sui blockchain that enable the execution of a transaction without a user paying the gas. Sponsored transactions can reduce the onboarding friction for users because the feature streamlines the process for end users. Using sponsored transactions, you can execute a transaction without requiring the user to pay it themselves. Instead, you can act as a sponsor of the transaction, offering your own payment gas objects for the transaction.

## Roles in sponsored transactions [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#roles-in-sponsored-transactions "Direct link to Roles in sponsored transactions")

In a sponsored transaction there are three roles: the user, the gas station, and the sponsor.

- The user is the entity who wants to execute a transaction.
- The gas station is the entity that fulfills the sponsorship request for the user's transaction by providing the gas payment they own.
- The sponsor is entity that funds the gas station for its operations.

It's not uncommon for the gas station and the sponsor to be the same entity. For example, a web3 gaming studio could run its own gas station to sponsor users with real free-to-play gaming experiences at its user acquisition stage. Because it's not always trivial to maintain a gas station for teams of any size, that gaming studio could also leverage third-party gas stations to sponsor transactions they want to promote.

The remainder of this guide assumes the sponsor uses their own gas station.

## Use cases [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#use-cases "Direct link to Use cases")

The following sections describe some common scenarios where sponsored transactions offer an improved user experience.

### App-specific sponsorship [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#app-specific-sponsorship "Direct link to App-specific sponsorship")

In this scenario, the sponsor has a specific set of applications they want to sponsor.

- If the transaction is initialized by the user, the sponsor examines the transaction to make sure it's within the set of approved applications before agreeing to provide the gas payment.
- If the transaction is proposed by the sponsor, the user must examine the transaction and decide if they want to execute it. Examples of this type of transaction might include a rewards claim transaction of a campaign or a "try it out" advertisement transaction.

### Wildcard sponsorship [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#wildcard-sponsorship "Direct link to Wildcard sponsorship")

In this scenario, the sponsor has few restrictions on the type of transactions the gas payment can be used for.

- If the sponsor is a gasless wallet, it may agree to sponsor any valid transactions proposed by its users.
- In the form of a reward or discount, the sponsor could offer the user a wildcard gas payment, expressly promising to execute any transactions with that gas payment.

A sponsored transaction is not restricted to these use cases. Essentially, a sponsored transaction is any transaction jointly made by the user and the sponsor. As long as the stakeholders can agree on the transaction details, then the number of possible ways to provide sponsored transactions is limited only by the imagination. Because at least two stakeholders are involved in a sponsored transaction, however, there are some [additional risks](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#risk) that you should take steps to mitigate.

## Sponsored transaction flow [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#sponsored-transaction-flow "Direct link to Sponsored transaction flow")

This section is mostly for developers who are interested in building a gas station or integrating with one.

The data structure of a transaction resembles the following:

```codeBlockLines_p187

pub struct SenderSignedTransaction {
    pub intent_message: IntentMessage<TransactionData>,
    /// A list of signatures signed by all transaction participants.
    /// 1. non participant signature must not be present.
    /// 2. signature order does not matter.
    pub tx_signatures: Vec<GenericSignature>,
}

pub struct TransactionDataV1 {  // <-- A variant of `TransactionData`
    pub kind: TransactionKind,  // <-- This is the actual transaction details
    pub sender: SuiAddress,
    pub gas_data: GasData,
    pub expiration: TransactionExpiration,
}

pub struct GasData {
    pub payment: Vec<ObjectRef>,
    pub owner: SuiAddress,
    pub price: u64,
    pub budget: u64,
}

```

A few details of note for the preceding code:

- `sender` in `TransactionDataV1` (a variant of `TransactionData`) is the user address.
- `gas_data` in `TransactionDataV1` is the gas payment.
- `GasData` allows a list of gas objects, but the same address must own them, namely the `owner` in `GasData` (the sponsor). When `owner` is equal to `sender`, then it is a regular/non-sponsored transaction.
- `tx_signatures` in `SenderSignedTransaction` is a list of signatures. For a sponsored transaction, the list needs to contain both signatures of the user and the sponsor in some order. The signatures are signed over the entire `TransactionData`, including `GasData`.

So, to construct a correct sponsored transaction, you must first build a `TransactionData` object. If you are neither the user or the sponsor, you would then pass the transaction to both parties to sign. If you're the sponsor, you would sign the transaction and then pass it and the signature to the other party (in the form of `SenderSignedTransaction`) for them to sign. In practice, the latter is the more common scenario.

There are three flows of sponsored transaction.

**User proposed transaction**

( [swimlane link](https://swimlanes.io/d/wAcnOpA_h))

![](https://static.swimlanes.io/b090340af36c8a4af6c36d4479a4d04f.png)

**Sponsor proposed transaction**

( [swimlane link](https://swimlanes.io/#ZZE9T8QwDIb3/ApvLIWBsQMSEh8DEkI6mInb+O6itk4VOxInxH8nqe76AVki+X392G+iXnuq4fYGdmNgCRHeYhiDkIP3iCzYqg9syuGg2WmstWZMDYjG1Ora9YCK8G0gn2LoPLt6rb/kQjXLQuwo1rBL/t65SCKLdkD5dJlWwzNKwS4SfY0+YsFt2I9zuTI/047mEuj67pKthjmlHj13ki+CD6EIA56gIfCslFfRHN8zIOgyoQJkB2G/pyhZsefNLKDAiKeBWDczC7YG++d97EQ5264ExB8YNUUyZtpjbmyP1Hbb+cX7H7g0PqW+fw0uf5KkZvAKLmE/deU4K9Iv))

![](https://static.swimlanes.io/d917884a263c494bb6127102d0f64840.png)

**Wildcard gas payment**

( [swimlane link](https://static.swimlanes.io/ee3962b3ac3cc5d34f317cecdde125b0.png))

![](https://static.swimlanes.io/ee3962b3ac3cc5d34f317cecdde125b0.png)

## Risk considerations [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#risk "Direct link to Risk considerations")

Because at least two stakeholders are involved in a sponsored transaction, you should take steps to mitigate risk.

### Client equivocation risk [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#client-equivocation-risk "Direct link to Client equivocation risk")

Client equivocation happens when more than one legit transaction that shares at least one owned object (such as a gas coin object) at a certain version are submitted to the network simultaneously. On Sui, before a transaction is executed, owned objects in this transaction are locked on validators at specific versions. An honest validator only accepts one transaction and rejects others. Depending on the order validators receive these transactions, validators might accept different transactions. In the event of no single transaction getting accepted by at least 2/3rds of validators, the owned object is locked until end of the epoch.

Practically speaking, client equivocation is rare, mostly caused by buggy client software. After all, no one has incentives to lock their own objects. However, sponsored transactions come with counterparty risks. For example, a malicious user could equivocate the gas station's gas coin object by submitting another transaction that uses one owned object in the gas station signed transaction at the same version. Similarly, a Byzantine gas station could do the same to the user owned objects.

Although this risk might seem trivial, it is helpful to be aware of it. Your gas station should actively monitor user behavior and alert on anything abnormal. Whether you're a user taking advantage of sponsored transactions or a developer integrating with a gas station, consider your reputation to minimize the risk of client equivocation.

Both the user and the sponsor need to sign over the entire `TransactionData`, including `GasData` because otherwise a third party (such as a malicious Full node) could snip the partially signed data and cause client equivocation and locking of owned objects.

### Censorship risk [​](https://docs.sui.io/guides/developer/sui-101/sponsor-txn\#censorship-risk "Direct link to Censorship risk")

If you chooses to submit the dual-signed transaction to the sponsor or gas station rather than a Full node, the transaction might be subject to sponsor or gas station censorship. Namely, the sponsor might choose not to submit the transaction to the network, or delay the submission.

You can mitigate this risk by submitting the transaction directly to a Full node.

- [Roles in sponsored transactions](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#roles-in-sponsored-transactions)
- [Use cases](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#use-cases)
  - [App-specific sponsorship](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#app-specific-sponsorship)
  - [Wildcard sponsorship](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#wildcard-sponsorship)
- [Sponsored transaction flow](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#sponsored-transaction-flow)
- [Risk considerations](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#risk)
  - [Client equivocation risk](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#client-equivocation-risk)
  - [Censorship risk](https://docs.sui.io/guides/developer/sui-101/sponsor-txn#censorship-risk)