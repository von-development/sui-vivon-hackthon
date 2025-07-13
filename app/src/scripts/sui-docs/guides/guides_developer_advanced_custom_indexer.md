# https://docs.sui.io/guides/developer/advanced/custom-indexer

[Skip to main content](https://docs.sui.io/guides/developer/advanced/custom-indexer#__docusaurus_skipToContent_fallback)

On this page

info

Refer to [Access Sui Data](https://docs.sui.io/guides/developer/getting-started/data-serving) for an overview of options to access Sui network data.

You can build custom indexers using the Sui micro-data ingestion framework. To create an indexer, you subscribe to a checkpoint stream with full checkpoint content. This stream can be one of the publicly available streams from Mysten Labs, one that you set up in your local environment, or a combination of the two.

Establishing a custom indexer helps improve latency, allows pruning the data of your Sui Full node, and provides efficient assemblage of checkpoint data.

## Interface and data format [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#interface-and-data-format "Direct link to Interface and data format")

To use the framework, implement a basic interface:

```codeBlockLines_p187
#[async_trait]
trait Worker: Send + Sync {
    async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> Result<()>;
}

```

In this example, the `CheckpointData` struct represents full checkpoint content. The struct contains checkpoint summary and contents, as well as detailed information about each individual transaction. The individual transaction data includes events and input/output objects. The full definition for this content is in the [full\_checkpoint\_content.rs](https://github.com/MystenLabs/sui/blob/releases/sui-graphql-rpc-v2024.1.0-release/crates/sui-types/src/full_checkpoint_content.rs) file of the `sui-types` crate.

tip

See the [Source code for an implementation](https://docs.sui.io/guides/developer/advanced/custom-indexer#source-code) section for a complete code example.

## Checkpoint stream sources [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#checkpoint-stream-sources "Direct link to Checkpoint stream sources")

Data ingestion for your indexer supports several checkpoint stream sources.

### Remote reader [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#remote-reader "Direct link to Remote reader")

The most straightforward stream source is to subscribe to a remote store of checkpoint contents. Mysten Labs provides the following buckets:

- Testnet: `https://checkpoints.testnet.sui.io`
- Mainnet: `https://checkpoints.mainnet.sui.io`

The checkpoint files are stored in the following format: `https://checkpoints.testnet.sui.io/<checkpoint_id>.chk`. You can download the checkpoint file by sending an HTTP GET request to the relevant URL. Try it yourself for checkpoint 1 at [https://checkpoints.testnet.sui.io/1.chk](https://checkpoints.testnet.sui.io/1.chk).

External

Postgres

BigQuery

S3

Cloud storage(S3, GCP)

Indexer

daemon

Progress store

The Sui data ingestion framework provides a helper function to quickly bootstrap an indexer workflow.

[examples/custom-indexer/rust/remote\_reader.rs](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/remote_reader.rs)

```codeBlockLines_p187
use anyhow::Result;
use async_trait::async_trait;
use sui_data_ingestion_core::{setup_single_workflow, Worker};
use sui_types::full_checkpoint_content::CheckpointData;

struct CustomWorker;

#[async_trait]
impl Worker for CustomWorker {
		type Result = ();
		async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> Result<()> {
				// custom processing logic
				// print out the checkpoint number
				println!(
						"Processing checkpoint: {}",
						checkpoint.checkpoint_summary.to_string()
				);
				Ok(())
		}
}

#[tokio::main]
async fn main() -> Result<()> {
		let (executor, term_sender) = setup_single_workflow(
				CustomWorker,
				"https://checkpoints.testnet.sui.io".to_string(),
				0,		/* initial checkpoint number */
				5,		/* concurrency */
				None, /* extra reader options */
		)
		.await?;
		executor.await?;
		Ok(())
}

```

This is suitable for setups with a single ingestion pipeline where progress tracking is managed outside of the framework.

### Local reader [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#local-reader "Direct link to Local reader")

Colocate the data ingestion daemon with a Full node and enable checkpoint dumping on the latter to set up a local stream source. After enabling, the Full node starts dumping executed checkpoints as files to a local directory, and the data ingestion daemon subscribes to changes in the directory through an inotify-like mechanism. This approach allows minimizing ingestion latency (checkpoint are processed immediately after a checkpoint executor on a Full node) and getting rid of dependency on an externally managed bucket.

To enable, add the following to your [Full node configuration](https://docs.sui.io/guides/operator/sui-full-node) file:

```codeBlockLines_p187
checkpoint-executor-config:
  checkpoint-execution-max-concurrency: 200
  local-execution-timeout-sec: 30
  data-ingestion-dir: <path to a local directory>

```

Sui

Cloud storage

Postgres

BigQuery

S3

Full node

Local directory

Indexer

daemon

Progress store

[examples/custom-indexer/rust/local\_reader.rs](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/local_reader.rs)

```codeBlockLines_p187
use tokio::sync::oneshot;
use anyhow::Result;
use async_trait::async_trait;
use sui_types::full_checkpoint_content::CheckpointData;
use sui_data_ingestion_core as sdic;
use sdic::{Worker, WorkerPool, ReaderOptions};
use sdic::{DataIngestionMetrics, FileProgressStore, IndexerExecutor};
use prometheus::Registry;
use std::path::PathBuf;
use std::env;

struct CustomWorker;

#[async_trait]
impl Worker for CustomWorker {
		type Result = ();
		async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> Result<()> {
				// custom processing logic
				println!("Processing Local checkpoint: {}", checkpoint.checkpoint_summary.to_string());
				Ok(())
		}
}

#[tokio::main]
async fn main() -> Result<()> {
		let concurrency = 5;
		let (exit_sender, exit_receiver) = oneshot::channel();
		let metrics = DataIngestionMetrics::new(&Registry::new());
		let backfill_progress_file_path =
				env::var("BACKFILL_PROGRESS_FILE_PATH").unwrap_or("/tmp/local_reader_progress".to_string());
		let progress_store = FileProgressStore::new(PathBuf::from(backfill_progress_file_path));
		let mut executor = IndexerExecutor::new(progress_store, 1 /* number of workflow types */, metrics);
		let worker_pool = WorkerPool::new(CustomWorker, "local_reader".to_string(), concurrency);

		executor.register(worker_pool).await?;
		executor.run(
				PathBuf::from("./chk".to_string()), // path to a local directory
				None,
				vec![], // optional remote store access options
				ReaderOptions::default(),			 /* remote_read_batch_size */
				exit_receiver,
				).await?;
		Ok(())
}

```

Let's highlight a couple lines of code:

```codeBlockLines_p187
let worker_pool = WorkerPool::new(CustomWorker, "local_reader".to_string(), concurrency);
executor.register(worker_pool).await?;

```

The data ingestion executor can run multiple workflows simultaneously. For each workflow, you need to create a separate worker pool and register it in the executor. The `WorkerPool` requires an instance of the `Worker` trait, the name of the workflow (which is used for tracking the progress of the flow in the progress store and metrics), and concurrency.

The concurrency parameter specifies how many threads the workflow uses. Having a concurrency value greater than 1 is helpful when tasks are idempotent and can be processed in parallel and out of order. The executor only updates the progress/watermark to a certain checkpoint when all preceding checkpoints are processed.

### Hybrid mode [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#hybrid-mode "Direct link to Hybrid mode")

Specify both a local and remote store as a fallback to ensure constant data flow. The framework always prioritizes locally available checkpoint data over remote data. It's useful when you want to start utilizing your own Full node for data ingestion but need to partially backfill historical data or just have a failover.

```codeBlockLines_p187
executor.run(
    PathBuf::from("./chk".to_string()), // path to a local directory
    Some("https://checkpoints.testnet.sui.io".to_string()), // Remote Checkpoint Store
    vec![], // optional remote store access options
    ReaderOptions::default(),
    exit_receiver,
    ).await?;

```

### Manifest [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#manifest "Direct link to Manifest")

Code for the cargo.toml manifest file for the custom indexer.

[examples/custom-indexer/rust/Cargo.toml](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/Cargo.toml)

```codeBlockLines_p187
[package]
name = "custom-indexer"
version = "0.1.0"
edition = "2021"

[dependencies]
async-trait = "0.1.83"
tokio = { version = "1.38.0", features = ["full"]}
sui_types = { git = "https://github.com/mystenlabs/sui", package = "sui-types"}
sui_data_ingestion_core = { git = "https://github.com/mystenlabs/sui", package = "sui-data-ingestion-core"}
prometheus = "0.13.3"
anyhow = "1.0.86"

[[bin]]
name = "local_reader"
path = "local_reader.rs"

[[bin]]
name = "remote_reader"
path = "remote_reader.rs"

[workspace]

```

## Source code for an implementation [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#source-code "Direct link to Source code for an implementation")

Find the following source code in the [Sui repo](https://github.com/mystenlabs/sui/tree/main/examples/custom-indexer/rust).

[examples/custom-indexer/rust/Cargo.toml](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/Cargo.toml)

```codeBlockLines_p187
[package]
name = "custom-indexer"
version = "0.1.0"
edition = "2021"

[dependencies]
async-trait = "0.1.83"
tokio = { version = "1.38.0", features = ["full"]}
sui_types = { git = "https://github.com/mystenlabs/sui", package = "sui-types"}
sui_data_ingestion_core = { git = "https://github.com/mystenlabs/sui", package = "sui-data-ingestion-core"}
prometheus = "0.13.3"
anyhow = "1.0.86"

[[bin]]
name = "local_reader"
path = "local_reader.rs"

[[bin]]
name = "remote_reader"
path = "remote_reader.rs"

[workspace]

```

[examples/custom-indexer/rust/local\_reader.rs](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/local_reader.rs)

```codeBlockLines_p187
use tokio::sync::oneshot;
use anyhow::Result;
use async_trait::async_trait;
use sui_types::full_checkpoint_content::CheckpointData;
use sui_data_ingestion_core as sdic;
use sdic::{Worker, WorkerPool, ReaderOptions};
use sdic::{DataIngestionMetrics, FileProgressStore, IndexerExecutor};
use prometheus::Registry;
use std::path::PathBuf;
use std::env;

struct CustomWorker;

#[async_trait]
impl Worker for CustomWorker {
		type Result = ();
		async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> Result<()> {
				// custom processing logic
				println!("Processing Local checkpoint: {}", checkpoint.checkpoint_summary.to_string());
				Ok(())
		}
}

#[tokio::main]
async fn main() -> Result<()> {
		let concurrency = 5;
		let (exit_sender, exit_receiver) = oneshot::channel();
		let metrics = DataIngestionMetrics::new(&Registry::new());
		let backfill_progress_file_path =
				env::var("BACKFILL_PROGRESS_FILE_PATH").unwrap_or("/tmp/local_reader_progress".to_string());
		let progress_store = FileProgressStore::new(PathBuf::from(backfill_progress_file_path));
		let mut executor = IndexerExecutor::new(progress_store, 1 /* number of workflow types */, metrics);
		let worker_pool = WorkerPool::new(CustomWorker, "local_reader".to_string(), concurrency);

		executor.register(worker_pool).await?;
		executor.run(
				PathBuf::from("./chk".to_string()), // path to a local directory
				None,
				vec![], // optional remote store access options
				ReaderOptions::default(),			 /* remote_read_batch_size */
				exit_receiver,
				).await?;
		Ok(())
}

```

[examples/custom-indexer/rust/remote\_reader.rs](https://github.com/MystenLabs/sui/tree/main/examples/custom-indexer/rust/remote_reader.rs)

```codeBlockLines_p187
use anyhow::Result;
use async_trait::async_trait;
use sui_data_ingestion_core::{setup_single_workflow, Worker};
use sui_types::full_checkpoint_content::CheckpointData;

struct CustomWorker;

#[async_trait]
impl Worker for CustomWorker {
		type Result = ();
		async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> Result<()> {
				// custom processing logic
				// print out the checkpoint number
				println!(
						"Processing checkpoint: {}",
						checkpoint.checkpoint_summary.to_string()
				);
				Ok(())
		}
}

#[tokio::main]
async fn main() -> Result<()> {
		let (executor, term_sender) = setup_single_workflow(
				CustomWorker,
				"https://checkpoints.testnet.sui.io".to_string(),
				0,		/* initial checkpoint number */
				5,		/* concurrency */
				None, /* extra reader options */
		)
		.await?;
		executor.await?;
		Ok(())
}

```

## Related links [​](https://docs.sui.io/guides/developer/advanced/custom-indexer\#related-links "Direct link to Related links")

- [Sui internal example](https://github.com/MystenLabs/sui/tree/main/crates/sui-data-ingestion/src/): Sui data ingestion daemon that runs internal pipelines.
- [Production example](https://github.com/MystenLabs/sui/tree/main/crates/suins-indexer/src): Sui Name Service custom indexer.
- [Using Events](https://docs.sui.io/guides/developer/sui-101/using-events): Events in Sui enable you to monitor on-chain activity in near-real time when coupled with a custom indexer.

- [Interface and data format](https://docs.sui.io/guides/developer/advanced/custom-indexer#interface-and-data-format)
- [Checkpoint stream sources](https://docs.sui.io/guides/developer/advanced/custom-indexer#checkpoint-stream-sources)
  - [Remote reader](https://docs.sui.io/guides/developer/advanced/custom-indexer#remote-reader)
  - [Local reader](https://docs.sui.io/guides/developer/advanced/custom-indexer#local-reader)
  - [Hybrid mode](https://docs.sui.io/guides/developer/advanced/custom-indexer#hybrid-mode)
  - [Manifest](https://docs.sui.io/guides/developer/advanced/custom-indexer#manifest)
- [Source code for an implementation](https://docs.sui.io/guides/developer/advanced/custom-indexer#source-code)
- [Related links](https://docs.sui.io/guides/developer/advanced/custom-indexer#related-links)