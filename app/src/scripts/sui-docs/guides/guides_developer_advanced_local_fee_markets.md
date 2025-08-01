# https://docs.sui.io/guides/developer/advanced/local-fee-markets

[Skip to main content](https://docs.sui.io/guides/developer/advanced/local-fee-markets#__docusaurus_skipToContent_fallback)

On this page

Object-based local fee markets limit the rate of transactions writing to a single shared object, preventing the network from becoming overloaded with checkpoints that take too long to execute.

The Sui network's object-based architecture allows processing many different user transactions massively in parallel, in a way that's not possible on most other networks. However, if multiple transactions are all writing to the same shared object, they must execute in sequential order. There is a limit to how many transactions the network can process that touch one specific object.

If you see transactions fail with the error `ExecutionCancelledDueToSharedObjectCongestion`, you are observing object-based local fee markets at work. Continue reading to learn:

- How transaction space is allocated on a congested shared object.
- How to bid for priority access to limited space.
- How to structure your applications and transactions for maximum throughput.

## How object-based local fee markets work [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#how-object-based-local-fee-markets-work "Direct link to How object-based local fee markets work")

Sui's local fee market algorithm runs every time a new batch of sequenced transactions is received from consensus.

1. Sorts all transactions in order of gas price, from highest to lowest.

2. Estimates each transaction's execution cost using the [`ExecutionTimeEstimate`](https://github.com/MystenLabs/sui/blob/main/crates/sui-core/src/authority/execution_time_estimator.rs) heuristic.

3. The [`SharedObjectCongestionTracker`](https://github.com/MystenLabs/sui/blob/main/crates/sui-core/src/authority/shared_object_congestion_tracker.rs) keeps a running tally of how much per-object congestion budget is used. If all shared objects used by the transaction have enough budget left, the transaction is scheduled. In that case, it consumes budget for the mutable shared objects that it uses. Keep in mind that immutable shared objects don't consume any budget, because multiple immutable uses of a shared object can execute in parallel. If the transaction cannot be scheduled, it is deferred until the next commit.


### Priority ordering of transactions [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#priority-ordering-of-transactions "Direct link to Priority ordering of transactions")

Transaction priority is determined solely by gas price. If you want your transaction to be assigned access to shared objects ahead of others in the same consensus commit, you must pay a higher gas price than the others. This is the only way to get priority access.

Using a gas price that is at least five times the reference gas price also increases the likelihood that the transaction is included in the earliest consensus commit possible. See [SIP-45](https://github.com/sui-foundation/sips/blob/main/sips/sip-45.md) for details.

### Cost estimation of transactions [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#cost-estimation-of-transactions "Direct link to Cost estimation of transactions")

Sui limits the per-commit execution capacity of each shared object. If transactions touching a shared object have a low estimated execution time, more of them can fit. If they have a high estimated execution time, not as many can fit.

Transaction execution time is estimated separately for each top-level Move function called from a PTB. Measurements of actual execution time are shared between the validators, and the cost estimate used for scheduling is the stake-weighted median of these measurements of past invocations. (For most functions, which are never called with congested inputs, a low default estimate is used.)

### Transaction deferral [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#transaction-deferral "Direct link to Transaction deferral")

If the network is unable to schedule a transaction because it's trying to use a congested shared object with no space left, the transaction is deferred. This means that validators hold onto the transaction and attempt to schedule it with the next commit, each time prioritizing all waiting transactions by gas price.

If a transaction is deferred for several commits without successfully being scheduled, it's cancelled and returns an `ExecutionCancelledDueToSharedObjectCongestion` error. You'll need to try it again with a higher gas price, or at a time when the shared objects it depends on are not as congested.

### Determining total per-object capacity [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#determining-total-per-object-capacity "Direct link to Determining total per-object capacity")

At the protocol level, Sui is configured with a per-commit target utilization and burst capacity for each shared object. On average, a shared object's activity cannot exceed the per-commit limit. However, short bursts of traffic might exceed the limit temporarily.

There is no way to increase the total execution capacity of a particular shared object. The network sets that limit to ensure that validators, Full nodes, and indexers can all execute checkpoints in a reasonable amount of time.

## Practical takeaways [​](https://docs.sui.io/guides/developer/advanced/local-fee-markets\#practical-takeaways "Direct link to Practical takeaways")

- For priority access to a congested shared object, set a higher gas price.

- When designing Move packages, avoid using a single shared object if possible. For example, a DEX application with a single, main shared object and dynamic fields for each currency pair would suffer much more congestion than one with a separate object per currency pair.

- If your object `O` is congested, optimize the execution time of the functions that are commonly used to access the object. For example, if all the accesses to your object happen via Move function `f`, halving the execution time of `f` will effectively double the number of transactions that can touch `O` in a single commit.


- [How object-based local fee markets work](https://docs.sui.io/guides/developer/advanced/local-fee-markets#how-object-based-local-fee-markets-work)
  - [Priority ordering of transactions](https://docs.sui.io/guides/developer/advanced/local-fee-markets#priority-ordering-of-transactions)
  - [Cost estimation of transactions](https://docs.sui.io/guides/developer/advanced/local-fee-markets#cost-estimation-of-transactions)
  - [Transaction deferral](https://docs.sui.io/guides/developer/advanced/local-fee-markets#transaction-deferral)
  - [Determining total per-object capacity](https://docs.sui.io/guides/developer/advanced/local-fee-markets#determining-total-per-object-capacity)
- [Practical takeaways](https://docs.sui.io/guides/developer/advanced/local-fee-markets#practical-takeaways)