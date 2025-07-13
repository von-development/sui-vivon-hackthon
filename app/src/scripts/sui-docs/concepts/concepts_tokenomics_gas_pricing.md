# https://docs.sui.io/concepts/tokenomics/gas-pricing

[Skip to main content](https://docs.sui.io/concepts/tokenomics/gas-pricing#__docusaurus_skipToContent_fallback)

On this page

The Sui gas-pricing mechanism achieves three outcomes: delivering low, predictable transaction fees, incentivizing validators to optimize their transaction processing operations, and preventing denial of service attacks.

This enables you to focus on using the Sui network to provide the best user experience without needing to forecast the current market price of gas fees. Since validators agree on a network-wide reference price at the start of each epoch, you can use the reference price as a credible anchor when submitting transactions. Moreover, the price setting mechanism rewards good validator behavior, thus aligning incentives between SUI token holders, the network's operators (validators), and its users.

A unique feature of the Sui gas price mechanism is that users pay separate fees for transaction execution and for storing the data associated with each transaction. The gas fees associated with an arbitrary transaction τ\\tauτ equal:

GasFees\[τ\]=ComputationUnits\[τ\]×ComputationPrice\[τ\]+StorageUnits\[τ\]×StoragePriceGasFees\[\\tau\] \ = \ ComputationUnits\[\\tau\] \\times ComputationPrice\[\\tau\] \ + \ StorageUnits\[\\tau\] \\times StoragePriceGasFees\[τ\]=ComputationUnits\[τ\]×ComputationPrice\[τ\]+StorageUnits\[τ\]×StoragePrice

The gas functions ComputationUnits\[τ\]ComputationUnits\[\\tau\]ComputationUnits\[τ\] and StorageUnits\[τ\]StorageUnits\[\\tau\]StorageUnits\[τ\] measure the amount of computation and storage resources, respectively, required to process and store the data associated with τ\\tauτ. The gas prices ComputationPrice\[τ\]ComputationPrice\[\\tau\]ComputationPrice\[τ\] and StoragePriceStoragePriceStoragePrice translate the cost of computation and storage, respectively, into SUI units. The decoupling between gas units and gas prices is useful since SUI market price will fluctuate over time in accordance with supply and demand.

## Computation gas prices [​](https://docs.sui.io/concepts/tokenomics/gas-pricing\#computation "Direct link to Computation gas prices")

The computation gas price ComputationPrice\[τ\]ComputationPrice\[\\tau\]ComputationPrice\[τ\] captures the cost of one unit of computation in SUI units. This price is set at the transaction level and submitted by the user as the transaction's gas price. Conceptually, it is useful to think about this gas price in two parts:

ComputationPrice\[τ\]=ReferencePrice+Tip\[τ\]ComputationPrice\[\\tau\] \ = \ ReferencePrice \ + \ Tip\[\\tau\]ComputationPrice\[τ\]=ReferencePrice+Tip\[τ\]

On the Sui network, a single ReferencePriceReferencePriceReferencePrice exists throughout each epoch, with Sui validators updating the ReferencePriceReferencePriceReferencePrice at each epoch boundary. Hence, in practice, when a user submits a gas price above the ReferencePriceReferencePriceReferencePrice, it is useful to think of the difference as a tip paid to the network in order to get higher priority. During moments of regular network operations, users are not expected to pay tips and the vast majority of transactions have gas prices equal to ReferencePriceReferencePriceReferencePrice.

More generally, the Sui gas price mechanism makes the ReferencePriceReferencePriceReferencePrice a credible anchor for you to reference when submitting transactions to the network. Providing reasonable confidence that transactions submitted with gas prices at or close to the reference price are executed in a timely manner. This is achieved through three core steps:

- **Gas price survey:** All validators are surveyed at the start of each epoch, and every validator submits their reservation price. That is, each validator states the minimum gas price at which they are willing to process transactions. The protocol orders these quotes and chooses the 2/3 percentile by stake as the reference price. The gas price survey goal is to set a reference price under which a [quorum](https://docs.sui.io/guides/operator/validator-committee#quorums) of validators are willing to promptly process transactions.
- **Tallying rule:** Throughout the epoch, validators obtain signals over the operations of other validators. Each validator uses these signals to build a (subjective) evaluation over the performance of every other validator. Specifically, each validator constructs a multiplier for the stake rewards of every other validator such that validators who behave well receive boosted rewards, and validators who do not receive reduced rewards. The tallying rule goal is to create a community-enforced mechanism for encouraging validators to honor the reference gas price.
- **Incentivized stake reward distribution rule:** At the end of the epoch, the distribution of stake rewards across validators is adjusted using information from the tallying rule. Specifically, a global multiplier is built for every validator using the median value (weighted by stake) out of the set of individual multipliers constructed during the tallying rule. All else equal, validators that operated performantly receive their regular stake rewards, whereas validators who did not operate performantly at the reference gas price receive slashed rewards. Since stake rewards are influenced by the amount of stake each validator owns, validators are encouraged to obtain more stake by lowering gas fees and pricing out inefficient validators. This benefits Sui end users since the stake reward distribution rule incentivizes validators to deliver a more cost-efficient network.

In sum, the gas price mechanism has two main forces: the tallying rule incentivizes validators to honor the quotes submitted during the gas survey, while the distribution rule incentivizes validators to submit low reservations prices. The interaction of these two forces delivers a mechanism encouraging validators to set a low network-level reference gas price - but not too low, because they face penalties if they cannot honor their quotes. In other words, the gas price mechanism encourages a healthy competition for fair prices.

## Storage gas prices [​](https://docs.sui.io/concepts/tokenomics/gas-pricing\#storage "Direct link to Storage gas prices")

The storage gas price StoragePriceStoragePriceStoragePrice captures the costs of covering one unit of storage in perpetuity, in SUI units. This price is set through governance proposals and is updated infrequently. The goal is to ensure Sui users pay for their use of on-chain data storage by depositing these fees into the storage fund and then redistributing these fees to future validators. In contrast to the computation gas price, storage prices are fixed and common for all transactions both within an epoch and across epochs until the storage price is updated.

The StoragePriceStoragePriceStoragePrice is set exogenously through the governance proposal with the goal of targeting the off-chain dollar cost of data storage. In the long run, as the costs of storage fall due to technological improvements and the dollar price of the SUI token evolves, governance proposals will update the price in order to reflect the new dollar target price.

## Gas prices as a coordination mechanism [​](https://docs.sui.io/concepts/tokenomics/gas-pricing\#coordination-mechanism "Direct link to Gas prices as a coordination mechanism")

Overall, when you submit transactions with computation gas prices at or close to the current epoch ReferencePriceReferencePriceReferencePrice and storage gas prices at the targeted StoragePriceStoragePriceStoragePrice, you have the best user experience. The Sui gas price mechanism provides you with credible reference prices for submitting your transactions. By incentivizing validators to elicit their true reservation prices and honor these quotes, you can credibly assume your transactions are processed in a timely manner.

After Sui enables horizontal scaling, validators can add more workers as demand for on-chain activity scales. This increases their costs linearly at the same pace of network activity and lets them process more transactions at the same low gas prices. In cases of extreme network congestion where validators cannot scale fast enough, the tip presence provides a market-based congestion pricing mechanism that discourages further demand spikes by increasing the cost of transacting on the Sui platform.

In the long run, the Sui gas price mechanism creates incentives for validators to optimize their hardware and operations. Validators that invest in becoming more efficient are able to honor lower gas prices and obtain a stake reward boost. Sui validators are thus encouraged to innovate and improve the experience of end users.

- [Computation gas prices](https://docs.sui.io/concepts/tokenomics/gas-pricing#computation)
- [Storage gas prices](https://docs.sui.io/concepts/tokenomics/gas-pricing#storage)
- [Gas prices as a coordination mechanism](https://docs.sui.io/concepts/tokenomics/gas-pricing#coordination-mechanism)