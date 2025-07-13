# https://docs.sui.io/guides/developer/sui-101/using-events

[Skip to main content](https://docs.sui.io/guides/developer/sui-101/using-events#__docusaurus_skipToContent_fallback)

On this page

The Sui network stores countless objects on chain where Move code can perform actions using those objects. Tracking this activity is often desired, for example, to discover how many times a module mints an NFT or to tally the amount of SUI in transactions that a smart contract generates.

To support activity monitoring, Move provides a structure to emit events on the Sui network. You can then leverage a custom indexer to process checkpoint data that includes events that have been emitted. See the [custom indexer](https://docs.sui.io/guides/developer/advanced/custom-indexer) topic in the Advanced section to learn how to stream checkpoints and filter events continuously.

If you don't want to run a custom indexer, you can poll the Sui network to query for emitted events instead. This approach typically includes a database to store the data retrieved from these calls. The [Poll events](https://docs.sui.io/guides/developer/sui-101/using-events#poll-events) section provides an example of using this method.

## Move event structure [​](https://docs.sui.io/guides/developer/sui-101/using-events\#move-event-structure "Direct link to Move event structure")

An event object in Sui consists of the following attributes:

- `id`: JSON object containing the transaction digest ID and event sequence.
- `packageId`: The object ID of the package that emits the event.
- `transactionModule`: The module that performs the transaction.
- `sender`: The Sui network address that triggered the event.
- `type`: The type of event being emitted.
- `parsedJson`: JSON object describing the event.
- `bcs`: Binary canonical serialization value.
- `timestampMs`: Unix epoch timestamp in milliseconds.

## Emit events in Move [​](https://docs.sui.io/guides/developer/sui-101/using-events\#emit-events-in-move "Direct link to Emit events in Move")

To create an event in your Move modules, add the `sui::event` dependency.

```codeBlockLines_p187
use sui::event;

```

With the dependency added, you can use the `emit` function to trigger an event whenever the action you want to monitor fires. For example, the following code is part of an example application that enables the locking of objects. The `lock` function handles the locking of objects and emits an event whenever the function is called.

[examples/trading/contracts/escrow/sources/lock.move](https://github.com/MystenLabs/sui/tree/main/examples/trading/contracts/escrow/sources/lock.move)

```codeBlockLines_p187
public fun lock<T: key + store>(obj: T, ctx: &mut TxContext): (Locked<T>, Key) {
    let key = Key { id: object::new(ctx) };
    let mut lock = Locked {
        id: object::new(ctx),
        key: object::id(&key),
    };

    event::emit(LockCreated {
        lock_id: object::id(&lock),
        key_id: object::id(&key),
        creator: ctx.sender(),
        item_id: object::id(&obj),
    });

    dof::add(&mut lock.id, LockedObjectKey {}, obj);

    (lock, key)
}

```

### Query events with RPC [​](https://docs.sui.io/guides/developer/sui-101/using-events\#query-events-with-rpc "Direct link to Query events with RPC")

The Sui RPC provides a [queryEvents](https://docs.sui.io/sui-api-ref#suix_queryEvents) method to query on-chain packages and return available events. As an example, the following `curl` command queries the Deepbook package on Mainnet for a specific type of event:

```codeBlockLines_p187
$ curl -X POST https://fullnode.mainnet.sui.io:443 \
-H "Content-Type: application/json" \
-d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "suix_queryEvents",
  "params": [\
    {\
      "MoveModule": {\
        "package": "0x158f2027f60c89bb91526d9bf08831d27f5a0fcb0f74e6698b9f0e1fb2be5d05",\
        "module": "deepbook_utils",\
        "type": "0xdee9::clob_v2::DepositAsset<0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>"\
      }\
    },\
    null,\
    3,\
    false\
  ]
}'

```

Click to open

A successful `curl` return

```codeBlockLines_p187
{
	"jsonrpc": "2.0",
	"result": {
		"data": [\
			{\
				"id": {\
					"txDigest": "8NB8sXb4m9PJhCyLB7eVH4onqQWoFFzVUrqPoYUhcQe2",\
					"eventSeq": "0"\
				},\
				"packageId": "0x158f2027f60c89bb91526d9bf08831d27f5a0fcb0f74e6698b9f0e1fb2be5d05",\
				"transactionModule": "deepbook_utils",\
				"sender": "0x8b35e67a519fffa11a9c74f169228ff1aa085f3a3d57710af08baab8c02211b9",\
				"type": "0xdee9::clob_v2::WithdrawAsset<0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>",\
				"parsedJson": {\
					"owner": "0x704c8c0d8052be7b5ca7174222a8980fb2ad3cd640f4482f931deb6436902627",\
					"pool_id": "0x7f526b1263c4b91b43c9e646419b5696f424de28dda3c1e6658cc0a54558baa7",\
					"quantity": "6956"\
				},\
				"bcs": "2szz6igTRuGmD7YATo8BEg81VLaei4od62wehadwMXYJv63UzJE16USL9pHFYBAGbwNkDYLCk53d45eFj3tEZK1vDGqtXcqH5US",\
				"timestampMs": "1691757698019"\
			},\
			{\
				"id": {\
					"txDigest": "8NB8sXb4m9PJhCyLB7eVH4onqQWoFFzVUrqPoYUhcQe2",\
					"eventSeq": "1"\
				},\
				"packageId": "0x158f2027f60c89bb91526d9bf08831d27f5a0fcb0f74e6698b9f0e1fb2be5d05",\
				"transactionModule": "deepbook_utils",\
				"sender": "0x8b35e67a519fffa11a9c74f169228ff1aa085f3a3d57710af08baab8c02211b9",\
				"type": "0xdee9::clob_v2::OrderFilled<0x2::sui::SUI, 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>",\
				"parsedJson": {\
					"base_asset_quantity_filled": "0",\
					"base_asset_quantity_remaining": "1532800000000",\
					"is_bid": false,\
					"maker_address": "0x78a1ff467e9c15b56caa0dedfcfbdfe47c0c385f28b05fdc120b2de188cc8736",\
					"maker_client_order_id": "1691757243084",\
					"maker_rebates": "0",\
					"order_id": "9223372036854839628",\
					"original_quantity": "1614700000000",\
					"pool_id": "0x7f526b1263c4b91b43c9e646419b5696f424de28dda3c1e6658cc0a54558baa7",\
					"price": "605100",\
					"taker_address": "0x704c8c0d8052be7b5ca7174222a8980fb2ad3cd640f4482f931deb6436902627",\
					"taker_client_order_id": "20082022",\
					"taker_commission": "0"\
				},\
				"bcs": "DcVGz85dWTLU4S33N7VYrhgbkm79ENhHVnp5kBfENEWEeMxHQuvsczg94teh6WHdYtwPqdEsPWdvSJ7ne5qiMxxn3kBm36KLyuuzHV1QdzF45GN8ZU1MDGU4XppiaqcMeRpPPiW8JpUDyeQoobKEV8fMqcyYpDq6KWtZ1WMoGvEDxFKDgFvW9Q7bt1JAzQehRkEKEDZ6dTwfiHw92QuFqczmZ5MKJLYzeysUsSw",\
				"timestampMs": "1691757698019"\
			},\
			{\
				"id": {\
					"txDigest": "8b3byDuRojHXqmSz16PsyzfdXJEY5nZBGTM23gMsMAY8",\
					"eventSeq": "0"\
				},\
				"packageId": "0x158f2027f60c89bb91526d9bf08831d27f5a0fcb0f74e6698b9f0e1fb2be5d05",\
				"transactionModule": "deepbook_utils",\
				"sender": "0x8b35e67a519fffa11a9c74f169228ff1aa085f3a3d57710af08baab8c02211b9",\
				"type": "0xdee9::clob_v2::OrderFilled<0x2::sui::SUI, 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>",\
				"parsedJson": {\
					"base_asset_quantity_filled": "700000000",\
					"base_asset_quantity_remaining": "0",\
					"is_bid": false,\
					"maker_address": "0x03b86e93d80b27763ee1fc2c37e285465dff835769de9462d9ad4ebcf46ac6df",\
					"maker_client_order_id": "20082022",\
					"maker_rebates": "634",\
					"order_id": "9223372036854839643",\
					"original_quantity": "1000000000",\
					"pool_id": "0x7f526b1263c4b91b43c9e646419b5696f424de28dda3c1e6658cc0a54558baa7",\
					"price": "604100",\
					"taker_address": "0x704c8c0d8052be7b5ca7174222a8980fb2ad3cd640f4482f931deb6436902627",\
					"taker_client_order_id": "20082022",\
					"taker_commission": "1058"\
				},\
				"bcs": "DcVGz85dWTLU4S33N7VYrhgbkm79ENhHVnp5kBfENEWEjN45pa9U3AkNhxfTRZbaHTQLugLBXttE32hpJKRsbrZGdryXMPmNA8EpHJnVcnYMXZmWXkNXvY1XjEYnAKU4BnhyJ9BQuxRJDXLA4DEu5uWEpWjLPD2ZHuxqHCn7GpUxvxJjHkKjr9jVVfeR6sN2uRhUXkThEDjCekrqaqwidkyXNmTzmZG4fre3eoZ",\
				"timestampMs": "1691758372427"\
			}\
		],
		"nextCursor": {
			"txDigest": "8b3byDuRojHXqmSz16PsyzfdXJEY5nZBGTM23gMsMAY8",
			"eventSeq": "0"
		},
		"hasNextPage": true
	},
	"id": 1
}

```

The TypeScript SDK provides a wrapper for the `suix_queryEvents` method: [`client.queryEvents`](https://sdk.mystenlabs.com/typedoc/classes/_mysten_sui.client.SuiClient.html#queryEvents).

Click to open

TypeScript SDK queryEvents example

```codeBlockLines_p187
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading } from "@radix-ui/themes";

export function Creategame({ onCreated }: { onCreated: (id: string) => void }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();

  const executeMoveCall = async (method: "small" | "large") => {
    if (!currentAccount?.address) {
      console.error("No connected account found.");
      return;
    }

    try {
      const tx = new Transaction();

      tx.moveCall({
        arguments: [tx.pure.u64(method === "small" ? 0 : 1)],
        target: `<PACKAGE-ID>::<MODULE>::create_game`,
      });

      const txResult = await signAndExecute({
        transaction: tx,
      });

      await client.waitForTransaction({
        digest: txResult.digest
      });

      const eventsResult = await client.queryEvents({
        query: { Transaction: txResult.digest },
      });

      if (eventsResult.data.length > 0) {
        const firstEvent = eventsResult.data[0]?.parsedJson as { msg?: string };
        const result = firstEvent?.msg || "No events found for the given criteria.";
        onCreated(result);
      } else {
        onCreated("No events found for the given criteria.");
      }
    } catch (error) {
      console.error("Error creating game or querying events:", error);
    }
  };

  return (
    <>
      <Heading size="3">Game Start</Heading>
      <Flex direction="column" gap="2">
        <Flex direction="row" gap="2">
          <Button onClick={() => executeMoveCall("small")}>small</Button>
          <Button onClick={() => executeMoveCall("large")}>large</Button>
        </Flex>
      </Flex>
    </>
  );
}

```

The example displays the following JSON representation of the event.

```codeBlockLines_p187
{
  "id": {
    "txDigest": "46vSzYS9PaTWZDju2N8ECebAGLrXBdrP9NmvvydtDW2c",
    "eventSeq": "0"
  },
  "packageId": "<PACKAGE-ID>",
  "transactionModule": "<MODULE>",
  "sender": "<SENDER-ADDRESS>",
  "type": "<PACKAGE-ID>::<MODULE>::Result",
  "parsedJson": {
    "msg": "You Lose :("
  },
  "bcs": "DRUZAsJK2DLrBj27"
}

```

#### Filtering event queries [​](https://docs.sui.io/guides/developer/sui-101/using-events\#filtering-event-queries "Direct link to Filtering event queries")

To filter the events returned from your queries, use the following data structures.

| Query | Description | JSON-RPC Parameter Example |
| --- | --- | --- |
| `All` | All events | `{"All": []}` |
| `Any` | Events emitted from any of the given filter | `{"Any": SuiEventFilter[]}` |
| `Transaction` | Events emitted from the specified transaction | `{"Transaction":"DGUe2TXiJdN3FI6MH1FwghYbiHw+NKu8Nh579zdFtUk="}` |
| `MoveModule` | Events emitted from the specified Move module | `{"MoveModule":{"package":"<PACKAGE-ID>", "module":"nft"}}` |
| `MoveEventModule` | Events emitted, defined on the specified Move module. | `{"MoveEventModule": {"package": "<DEFINING-PACKAGE-ID>", "module": "nft"}}` |
| `MoveEventType` | Move struct name of the event | `{"MoveEventType":"::nft::MintNFTEvent"}` |
| `Sender` | Query by sender address | `{"Sender":"0x008e9c621f4fdb210b873aab59a1e5bf32ddb1d33ee85eb069b348c234465106"}` |
| `TimeRange` | Return events emitted in \[start\_time, end\_time\] interval | `{"TimeRange":{"startTime":1669039504014, "endTime":1669039604014}}` |

### Query events in Rust [​](https://docs.sui.io/guides/developer/sui-101/using-events\#query-events-in-rust "Direct link to Query events in Rust")

The [Sui by Example](https://github.com/gdanezis/sui-by-example/blob/main/src/05_reading_events/bin/main.rs) repo on GitHub contains a code sample that demonstrates how to query events using the `query_events` function. The package that `PACKAGE_ID_CONST` points to exists on Mainnet, so you can test this code using Cargo. To do so, clone the `sui-by-example` repo locally and follow the [Example 05 directions](https://github.com/gdanezis/sui-by-example/tree/main/src/05_reading_events).

```codeBlockLines_p187
use sui_sdk::{rpc_types::EventFilter, types::Identifier, SuiClientBuilder};

const PACKAGE_ID_CONST: &str = "0x279525274aa623ef31a25ad90e3b99f27c8dbbad636a6454918855c81d625abc";

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let sui_mainnet = SuiClientBuilder::default()
        .build("https://fullnode.mainnet.sui.io:443")
        .await?;

    let events = sui_mainnet
        .event_api()
        .query_events(
            EventFilter::MoveModule {
                package: PACKAGE_ID_CONST.parse()?,
                module: Identifier::new("dev_trophy")?,
            },
            None,
            None,
            false,
        )
        .await?;

    for event in events.data {
        println!("Event: {:?}", event.parsed_json);
    }

    Ok(())
}

```

### Query events with GraphQL [​](https://docs.sui.io/guides/developer/sui-101/using-events\#query-events-with-graphql "Direct link to Query events with GraphQL")

⚙️Early-Stage Feature

This content describes an alpha/beta feature or service. These early stage features and services are in active development, so details are likely to change.

You can use GraphQL to query events instead of JSON RPC. The following example queries are in the [`sui-graphql-rpc` crate](https://github.com/MystenLabs/sui/tree/main/crates/sui-graphql-rpc/examples/event_connection) in the Sui repo.

Click to open

Event connection

[crates/sui-graphql-rpc/examples/event\_connection/event\_connection.graphql](https://github.com/MystenLabs/sui/tree/main/crates/sui-graphql-rpc/examples/event_connection/event_connection.graphql)

```codeBlockLines_p187
{
	events(
		filter: {
			eventType: "0x3164fcf73eb6b41ff3d2129346141bd68469964c2d95a5b1533e8d16e6ea6e13::Market::ChangePriceEvent<0x2::sui::SUI>"
		}
	) {
		nodes {
			sendingModule {
				name
				package { digest }
			}
			sender {
				address
			}
			timestamp
			contents {
				type {
					repr
				}
				json
			}
			bcs
		}
	}
}

```

Click to open

Filter events by sender

[crates/sui-graphql-rpc/examples/event\_connection/filter\_by\_sender.graphql](https://github.com/MystenLabs/sui/tree/main/crates/sui-graphql-rpc/examples/event_connection/filter_by_sender.graphql)

```codeBlockLines_p187
query ByTxSender {
	events(
		first: 1
		filter: {
			sender: "0xdff57c401e125a7e0e06606380560b459a179aacd08ed396d0162d57dbbdadfb"
		}
	) {
		pageInfo {
			hasNextPage
			endCursor
		}
		nodes {
			sendingModule {
				name
			}
			contents {
				type {
					repr
				}
				json
			}
			sender {
				address
			}
			timestamp
			bcs
		}
	}
}

```

The [TypeScript SDK](https://sdk.mystenlabs.com/typedoc/modules/_mysten_sui.graphql.html) provides functionality to interact with the Sui GraphQL service.

## Monitoring events [​](https://docs.sui.io/guides/developer/sui-101/using-events\#monitoring-events "Direct link to Monitoring events")

Firing events is not very useful in a vacuum. You also need the ability to respond to those events. There are two methods from which to choose when you need to monitor on-chain events:

- Incorporate a [custom indexer](https://docs.sui.io/guides/developer/advanced/custom-indexer) to take advantage of Sui's micro-data ingestion framework.
- Poll the Sui network on a schedule to query events.

Using a custom indexer provides a near-real time monitoring of events, so is most useful when your project requires immediate reaction to the firing of events. Polling the network is most useful when the events you're monitoring don't fire often or the need to act on those events are not immediate. The following section provides a polling example.

### Poll events [​](https://docs.sui.io/guides/developer/sui-101/using-events\#poll-events "Direct link to Poll events")

To monitor events, you need a database to store checkpoint data. The [Trustless Swap](https://docs.sui.io/guides/developer/app-examples/trustless-swap) example uses a Prisma database to store checkpoint data from the Sui network. The database is populated from polling the network to retrieve emitted events.

Click to open

`event-indexer.ts` from Trustless Swap

[examples/trading/api/indexer/event-indexer.ts](https://github.com/MystenLabs/sui/tree/main/examples/trading/api/indexer/event-indexer.ts)

```codeBlockLines_p187
import { EventId, SuiClient, SuiEvent, SuiEventFilter } from '@mysten/sui/client';

import { CONFIG } from '../config';
import { prisma } from '../db';
import { getClient } from '../sui-utils';
import { handleEscrowObjects } from './escrow-handler';
import { handleLockObjects } from './locked-handler';

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
	cursor: SuiEventsCursor;
	hasNextPage: boolean;
};

type EventTracker = {
	type: string;
	filter: SuiEventFilter;
	callback: (events: SuiEvent[], type: string) => any;
};

const EVENTS_TO_TRACK: EventTracker[] = [\
	{\
		type: `${CONFIG.SWAP_CONTRACT.packageId}::lock`,\
		filter: {\
			MoveEventModule: {\
				module: 'lock',\
				package: CONFIG.SWAP_CONTRACT.packageId,\
			},\
		},\
		callback: handleLockObjects,\
	},\
	{\
		type: `${CONFIG.SWAP_CONTRACT.packageId}::shared`,\
		filter: {\
			MoveEventModule: {\
				module: 'shared',\
				package: CONFIG.SWAP_CONTRACT.packageId,\
			},\
		},\
		callback: handleEscrowObjects,\
	},\
];

const executeEventJob = async (
	client: SuiClient,
	tracker: EventTracker,
	cursor: SuiEventsCursor,
): Promise<EventExecutionResult> => {
	try {
		const { data, hasNextPage, nextCursor } = await client.queryEvents({
			query: tracker.filter,
			cursor,
			order: 'ascending',
		});

		await tracker.callback(data, tracker.type);

		if (nextCursor && data.length > 0) {
			await saveLatestCursor(tracker, nextCursor);

			return {
				cursor: nextCursor,
				hasNextPage,
			};
		}
	} catch (e) {
		console.error(e);
	}
	return {
		cursor,
		hasNextPage: false,
	};
};

const runEventJob = async (client: SuiClient, tracker: EventTracker, cursor: SuiEventsCursor) => {
	const result = await executeEventJob(client, tracker, cursor);

	setTimeout(
		() => {
			runEventJob(client, tracker, result.cursor);
		},
		result.hasNextPage ? 0 : CONFIG.POLLING_INTERVAL_MS,
	);
};

/**
 * Gets the latest cursor for an event tracker, either from the DB (if it's undefined)
 *	or from the running cursors.
 */
const getLatestCursor = async (tracker: EventTracker) => {
	const cursor = await prisma.cursor.findUnique({
		where: {
			id: tracker.type,
		},
	});

	return cursor || undefined;
};

/**
 * Saves the latest cursor for an event tracker to the db, so we can resume
 * from there.
 * */
const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
	const data = {
		eventSeq: cursor.eventSeq,
		txDigest: cursor.txDigest,
	};

	return prisma.cursor.upsert({
		where: {
			id: tracker.type,
		},
		update: data,
		create: { id: tracker.type, ...data },
	});
};

export const setupListeners = async () => {
	for (const event of EVENTS_TO_TRACK) {
		runEventJob(getClient(CONFIG.NETWORK), event, await getLatestCursor(event));
	}
};

```

Trustless Swap incorporates handlers to process each event type that triggers. For the `locked` event, the handler in `locked-handler.ts` fires and updates the Prisma database accordingly.

Click to open

`locked-handler.ts` from Trustless Swap

[examples/trading/api/indexer/locked-handler.ts](https://github.com/MystenLabs/sui/tree/main/examples/trading/api/indexer/locked-handler.ts)

```codeBlockLines_p187
import { SuiEvent } from '@mysten/sui/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../db';

type LockEvent = LockCreated | LockDestroyed;

type LockCreated = {
	creator: string;
	lock_id: string;
	key_id: string;
	item_id: string;
};

type LockDestroyed = {
	lock_id: string;
};

/**
 * Handles all events emitted by the `lock` module.
 * Data is modelled in a way that allows writing to the db in any order (DESC or ASC) without
 * resulting in data incosistencies.
 * We're constructing the updates to support multiple events involving a single record
 * as part of the same batch of events (but using a single write/record to the DB).
 * */
export const handleLockObjects = async (events: SuiEvent[], type: string) => {
	const updates: Record<string, Prisma.LockedCreateInput> = {};

	for (const event of events) {
		if (!event.type.startsWith(type)) throw new Error('Invalid event module origin');
		const data = event.parsedJson as LockEvent;
		const isDeletionEvent = !('key_id' in data);

		if (!Object.hasOwn(updates, data.lock_id)) {
			updates[data.lock_id] = {
				objectId: data.lock_id,
			};
		}

		// Handle deletion
		if (isDeletionEvent) {
			updates[data.lock_id].deleted = true;
			continue;
		}

		// Handle creation event
		updates[data.lock_id].keyId = data.key_id;
		updates[data.lock_id].creator = data.creator;
		updates[data.lock_id].itemId = data.item_id;
	}

	//	As part of the demo and to avoid having external dependencies, we use SQLite as our database.
	//	 Prisma + SQLite does not support bulk insertion & conflict handling, so we have to insert these 1 by 1
	//	 (resulting in multiple round-trips to the database).
	//	Always use a single `bulkInsert` query with proper `onConflict` handling in production databases (e.g Postgres)
	const promises = Object.values(updates).map((update) =>
		prisma.locked.upsert({
			where: {
				objectId: update.objectId,
			},
			create: {
				...update,
			},
			update,
		}),
	);
	await Promise.all(promises);
};

```

## Related links [​](https://docs.sui.io/guides/developer/sui-101/using-events\#related-links "Direct link to Related links")

- [Custom Indexer](https://docs.sui.io/guides/developer/advanced/custom-indexer): For near-real time monitoring of events, you can use a custom indexer.
- [Events](https://move-book.com/programmability/events.html): The Move Book shows how to emit events in Move.
- [Trustless Swap](https://docs.sui.io/guides/developer/app-examples/trustless-swap): The Trustless Swap guide uses events to update the state of its frontend.

- [Move event structure](https://docs.sui.io/guides/developer/sui-101/using-events#move-event-structure)
- [Emit events in Move](https://docs.sui.io/guides/developer/sui-101/using-events#emit-events-in-move)
  - [Query events with RPC](https://docs.sui.io/guides/developer/sui-101/using-events#query-events-with-rpc)
  - [Query events in Rust](https://docs.sui.io/guides/developer/sui-101/using-events#query-events-in-rust)
  - [Query events with GraphQL](https://docs.sui.io/guides/developer/sui-101/using-events#query-events-with-graphql)
- [Monitoring events](https://docs.sui.io/guides/developer/sui-101/using-events#monitoring-events)
  - [Poll events](https://docs.sui.io/guides/developer/sui-101/using-events#poll-events)
- [Related links](https://docs.sui.io/guides/developer/sui-101/using-events#related-links)