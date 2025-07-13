# https://docs.sui.io/concepts/sui-architecture/consensus

[Skip to main content](https://docs.sui.io/concepts/sui-architecture/consensus#__docusaurus_skipToContent_fallback)

On this page

The basic purpose of consensus in blockchains is to agree on a consistent order and ensure the availability of transactions.

On Sui, consensus has a simple API: validators submit different user transactions to consensus concurrently, and the consensus outputs a consistent stream of transactions across all well-behaving validators.

Sui uses the Mysticeti protocol to optimize for both low latency and high throughput. The benefits of Mysticeti include:

- Supports multiple validators proposing blocks in parallel, utilizing the full bandwidth of the network and providing censorship resistance. These are features of the DAG-based consensus protocols.
- requires only three rounds of messages to commit blocks from the DAGs, same as practical Byzantine Fault Tolerance and matches the theoretical minimum.
- The commit rule allows voting and certifying leaders on blocks in parallel, further reducing the median and tail latencies.
- The commit rule also tolerates unavailable leaders without significantly increasing the commit latencies.

## Transaction throughput [​](https://docs.sui.io/concepts/sui-architecture/consensus\#transaction-throughput "Direct link to Transaction throughput")

Compared to other state-of-the-art consensus protocols, Mysticeti is theoretically capable of handling over twice as many transactions with half the observed latency as other protocols. In a controlled environment using 10 nodes, Mysticeti is capable of handling 300,000 transactions per second (TPS) before latency crosses the one-second marker. Increased to 50 nodes, test results show 400,000 TPS before surpassing a one-second latency. In the same tests, the other top performing consensus mechanisms do not reach 150,000 TPS and observed latency _begins_ at around two seconds.

On average, testing shows Mysticeti can achieve consensus commitment in about **0.5 seconds** with a sustained throughput of **200,000 TPS**.

![Throughput and latency graph](https://docs.sui.io/assets/images/thruput_latency-f3b49e4b2e14437e7428031682fa45a8.png)

## Decision rule [​](https://docs.sui.io/concepts/sui-architecture/consensus\#decision-rule "Direct link to Decision rule")

The novel decision rule at the heart of Mysticeti optimizes its operational efficiency. Traditional consensus engine decision rules require explicit block validation and certification. This process necessitates greater communication overhead as validators sign and broadcast votes to reach consensus. By contrast, Mysticeti provides implicit commitment, which reduces this inter-node communication, significantly lowering bandwidth usage.

## Finality [​](https://docs.sui.io/concepts/sui-architecture/consensus\#finality "Direct link to Finality")

Finality is the guarantee that a transaction or block, after confirmation, is permanently added to the network and cannot be altered or reversed. In traditional blockchain consensus, confirming transactions can take time because they rely on other transactions to “reference” them repeatedly before they are considered final. This process can slow down if the network activity decreases or if there are many competing transactions. In contrast, Mysticeti simplifies this process by finalizing transactions immediately upon inclusion in the structure. Consequently, there's no waiting for additional confirmations or network activity, making Mysticeti faster and more reliable for confirming transactions, even in less active or challenging network conditions.

For more details, including correctness proofs, see the [MYSTICETI: Reaching the Latency Limits with\\
Uncertified DAGs](https://docs.sui.io/assets/files/mysticeti-b7bf6bc1e0df4e363fd971dc51e11ac0.pdf) whitepaper.

## Related links [​](https://docs.sui.io/concepts/sui-architecture/consensus\#related-links "Direct link to Related links")

- [Life of a Transaction](https://docs.sui.io/concepts/sui-architecture/transaction-lifecycle): The life of a transaction on the Sui network has some differences compared to those from other blockchains.
- [Sui Security](https://docs.sui.io/concepts/sui-architecture/sui-security): Sui is designed to provide very high security guarantees to asset owners.
- [MYSTICETI: Reaching the Latency Limits with Uncertified DAGs](https://docs.sui.io/assets/files/mysticeti-b7bf6bc1e0df4e363fd971dc51e11ac0.pdf): Whitepaper documenting the Mysticeti protocol.

- [Transaction throughput](https://docs.sui.io/concepts/sui-architecture/consensus#transaction-throughput)
- [Decision rule](https://docs.sui.io/concepts/sui-architecture/consensus#decision-rule)
- [Finality](https://docs.sui.io/concepts/sui-architecture/consensus#finality)
- [Related links](https://docs.sui.io/concepts/sui-architecture/consensus#related-links)